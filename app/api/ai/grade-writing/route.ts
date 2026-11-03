import { NextRequest, NextResponse } from 'next/server';
import { API_BASE, backendJson, getUserToken, storeAiResult, systemHeaders, userHeaders } from '@/lib/server/backend';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = process.env.GROQ_WRITING_MODEL || 'llama-3.3-70b-versatile';
const PROMPT_VERSION = 'v2-prompt-aware';

/**
 * IELTS Academic Writing examiner prompt.
 *
 * v2 changes vs v1:
 *  - the task prompts (and chart description) are given to the model so Task
 *    Achievement / Task Response is judged against what was actually asked;
 *  - Task 1 uses "Task Achievement", Task 2 "Task Response" (official descriptors);
 *  - under-length answers are capped as in the real exam; off-topic / memorised
 *    answers are penalised; empty answers score 0.
 */
const SYSTEM_PROMPT = `You are a certified IELTS Academic Writing examiner. Grade strictly with the official public band descriptors.

You will receive the TASK PROMPTS and the candidate's responses. Return ONLY a valid JSON object:

{
  "task1": {
    "annotated_html": "The full Task 1 text with HTML spans. Wrap strong language in <span class=\\"ielts-good\\">TEXT</span>. Wrap errors in <span class=\\"ielts-error\\" data-id=\\"0\\">TEXT</span> (increment data-id per error).",
    "task_response": 6.0,
    "coherence": 6.0,
    "lexical": 6.0,
    "grammar": 6.0,
    "overall_band": 6.0,
    "word_count": 171,
    "examiner_comment": "Two or three sentences a candidate can act on.",
    "suggestions": [
      { "id": 0, "original_text": "exact phrase", "error_type": "Grammar", "correction": "fixed phrase", "explanation": "why + which criterion it affects" }
    ]
  },
  "task2": { ...same shape... }
}

RULES
- "task_response" means Task Achievement for Task 1 and Task Response for Task 2.
- Judge Task Achievement/Response ONLY against the given prompt: missing key features / not covering all parts of the question / no clear position (Task 2) caps that criterion at 5.0. Memorised or off-topic text caps it at 4.0.
- Length: Task 1 under 150 words or Task 2 under 250 words → cap task_response at 5.0 and mention it. An empty or <20-word answer → all criteria 0.0 and overall 0.0.
- Scores are 0–9 in 0.5 steps. overall_band = mean of the four criteria rounded to the nearest 0.5 (round .25 down, .75 up).
- error_type ∈ {Grammar, Cohesion, Lexical, Task Response, Punctuation, Spelling}. data-id values must match suggestion ids. 3–8 suggestions per task, most impactful first.
- annotated_html must contain the ENTIRE response; wrap phrases, not whole paragraphs. Escape nothing else.
- No markdown, no text outside the JSON.`;

interface TaskGrading {
    annotated_html: string;
    task_response: number;
    coherence: number;
    lexical: number;
    grammar: number;
    overall_band: number;
    word_count?: number;
    examiner_comment?: string;
    suggestions: Array<{ id: number; original_text: string; error_type: string; correction: string; explanation: string }>;
}

const wordCount = (t: string) => (t || '').trim().split(/\s+/).filter(Boolean).length;
const half = (n: number) => Math.min(9, Math.max(0, Math.round(n * 2) / 2));

/** Clamp model output to the IELTS scale and re-derive the overall band from the criteria. */
function normalise(t: TaskGrading | undefined, content: string): TaskGrading | null {
    if (!t) return null;
    const words = wordCount(content);
    const crit = ['task_response', 'coherence', 'lexical', 'grammar'] as const;
    const out: TaskGrading = { ...t, word_count: words, suggestions: Array.isArray(t.suggestions) ? t.suggestions : [] };
    for (const c of crit) out[c] = half(Number(t[c]) || 0);
    if (words < 20) for (const c of crit) out[c] = 0;
    out.overall_band = half((out.task_response + out.coherence + out.lexical + out.grammar) / 4);
    if (!out.annotated_html) out.annotated_html = content;
    return out;
}

export async function POST(req: NextRequest) {
    try {
        const token = getUserToken(req);
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json() as {
            testId: string;
            attemptId?: string;
            task1Content: string;
            task2Content: string;
            task1Id: string;
            task2Id?: string | null;
            task1Prompt?: string;
            task2Prompt?: string;
        };
        const { attemptId, task1Content = '', task2Content = '', task1Id, task2Id, task1Prompt, task2Prompt } = body;

        if (!task1Id) return NextResponse.json({ error: 'Missing writing task id' }, { status: 400 });
        if (wordCount(task1Content) === 0 && wordCount(task2Content) === 0) {
            return NextResponse.json({ error: 'Both tasks are empty — write at least one response before submitting.' }, { status: 400 });
        }

        const groqKey = process.env.GROQ_API_KEY;
        if (!groqKey) return NextResponse.json({ error: 'GROQ_API_KEY not configured' }, { status: 500 });

        // ── Step 1: Groq ──────────────────────────────────────────────────────────
        const userMessage = `TASK 1 PROMPT:
${task1Prompt || '(prompt unavailable — grade on language only)'}

TASK 1 RESPONSE (${wordCount(task1Content)} words):
${task1Content || '(No response submitted)'}

TASK 2 PROMPT:
${task2Prompt || '(prompt unavailable — grade on language only)'}

TASK 2 RESPONSE (${wordCount(task2Content)} words):
${task2Content || '(No response submitted)'}

Return the JSON evaluation.`;

        const groqRes = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${groqKey}` },
            body: JSON.stringify({
                model: MODEL,
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: userMessage },
                ],
                temperature: 0.2,
                max_tokens: 6000,
                response_format: { type: 'json_object' },
            }),
        });
        if (!groqRes.ok) {
            console.error('[grade-writing] Groq error:', await groqRes.text());
            return NextResponse.json({ error: 'AI grading failed, please try again.' }, { status: 502 });
        }
        const groqData = await groqRes.json() as { choices: Array<{ message: { content: string } }> };
        let parsed: { task1?: TaskGrading; task2?: TaskGrading };
        try {
            parsed = JSON.parse(groqData.choices[0]?.message?.content ?? '{}');
        } catch {
            return NextResponse.json({ error: 'Invalid AI response format' }, { status: 502 });
        }
        const t1 = normalise(parsed.task1, task1Content);
        const t2 = task2Id ? normalise(parsed.task2, task2Content) : null;
        if (!t1) return NextResponse.json({ error: 'AI did not return a Task 1 evaluation' }, { status: 502 });

        // ── Step 2: persist submissions as the learner ───────────────────────────
        const saveSub = async (writingTaskId: string, content: string) => {
            const res = await fetch(`${API_BASE}/api/writing-submissions`, {
                method: 'POST',
                headers: userHeaders(token),
                body: JSON.stringify({ writingTaskId, content }),
            });
            return backendJson<{ id: string; learnerId: string }>(res);
        };
        const task1Sub = await saveSub(task1Id, task1Content);
        const task2Sub = task2Id ? await saveSub(task2Id, task2Content) : null;

        // ── Step 3: combined band — Task 2 carries twice the weight of Task 1 ──────
        const combinedBand = t2 ? half((t1.overall_band + t2.overall_band * 2) / 3) : t1.overall_band;
        const avg = (k: keyof Pick<TaskGrading, 'task_response' | 'coherence' | 'lexical' | 'grammar'>) =>
            t2 ? half((t1[k] + t2[k] * 2) / 3) : t1[k];

        // ── Step 4: persist grading with the trusted key ───────────────────────────
        const gradingRes = await fetch(`${API_BASE}/api/writing-gradings`, {
            method: 'POST',
            headers: systemHeaders(),
            body: JSON.stringify({
                submissionId: task1Sub.id,
                modelName: MODEL,
                modelVersion: '1.0',
                promptVersion: PROMPT_VERSION,
                taskResponse: avg('task_response'),
                coherence: avg('coherence'),
                lexical: avg('lexical'),
                grammar: avg('grammar'),
                overallBand: combinedBand,
                confidenceScore: 0.8,
                feedback: {
                    task1: { ...t1, submission_id: task1Sub.id },
                    task2: t2 && task2Sub ? { ...t2, submission_id: task2Sub.id } : null,
                    overall_band: combinedBand,
                    task2_sub_id: task2Sub?.id ?? null,
                    prompt_version: PROMPT_VERSION,
                },
            }),
        });
        const grading = await backendJson<{ id: string }>(gradingRes);

        // ── Step 5: write the band onto the attempt (server-side, cannot be forged) ─
        if (attemptId) {
            const summary = [
                `Overall ${combinedBand.toFixed(1)} (Task 2 weighted ×2).`,
                `Task 1 ${t1.overall_band.toFixed(1)}: ${t1.examiner_comment ?? ''}`,
                t2 ? `Task 2 ${t2.overall_band.toFixed(1)}: ${t2.examiner_comment ?? ''}` : '',
            ].filter(Boolean).join('\n');
            await storeAiResult(token, attemptId, { bandScore: combinedBand, aiFeedback: summary });
        }

        return NextResponse.json({
            gradingId: grading.id,
            submissionId: task1Sub.id,
            overallBand: combinedBand,
            task1: t1,
            task2: t2,
        });
    } catch (err) {
        console.error('[grade-writing] Unexpected error:', err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Internal server error' },
            { status: 500 },
        );
    }
}
