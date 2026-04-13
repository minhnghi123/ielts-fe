import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const SYSTEM_PROMPT = `You are an expert IELTS examiner with 20 years of experience grading Writing tasks. 
You must evaluate the given essays strictly against official IELTS band descriptors.

You will receive two essays (Task 1 and Task 2). Return ONLY a valid JSON object with the following exact structure:

{
  "task1": {
    "annotated_html": "The full essay text with HTML span annotations. Wrap powerful/excellent passages in: <span class=\\"ielts-good\\">TEXT</span>. Wrap errors/weaknesses in: <span class=\\"ielts-error\\" data-id=\\"0\\">TEXT</span> (increment data-id for each error).",
    "task_response": 7.0,
    "coherence": 6.5,
    "lexical": 7.0,
    "grammar": 6.5,
    "overall_band": 6.5,
    "suggestions": [
      {
        "id": 0,
        "original_text": "The exact problematic phrase",
        "error_type": "Grammar",
        "correction": "The corrected version",
        "explanation": "Detailed explanation of why this is wrong and how the fix improves the band score."
      }
    ]
  },
  "task2": {
    "annotated_html": "...",
    "task_response": 7.0,
    "coherence": 7.0,
    "lexical": 6.5,
    "grammar": 7.0,
    "overall_band": 7.0,
    "suggestions": [...]
  }
}

CRITICAL RULES:
- data-id in <span class="ielts-error" data-id="N"> must exactly match the id field in the suggestions array.
- error_type must be one of: Grammar, Cohesion, Lexical, Task Response, Punctuation, Spelling.
- overall_band is calculated as the average of task_response, coherence, lexical, grammar, rounded to nearest 0.5.
- Band scores must be between 0 and 9 in 0.5 increments.
- Provide 3-8 suggestions per task. Focus on the most impactful issues.
- The annotated_html must contain the ENTIRE essay, only wrapping specific phrases, not entire paragraphs.
- Do NOT include markdown, code fences, or any text outside the JSON object.`;

export async function POST(req: NextRequest) {
    try {
        const body = await req.json() as {
            testId: string;
            learnerId: string;
            task1Content: string;
            task2Content: string;
            task1Id: string;  // writing_task UUID
            task2Id?: string; // writing_task UUID
        };

        const { testId, learnerId, task1Content, task2Content, task1Id, task2Id } = body;

        console.log('[grade-writing] Received request:', { learnerId, task1Id, task2Id });

        if (!learnerId || !task1Content) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(learnerId)) {
            console.error(`[grade-writing] CRITICAL ERROR: learnerId is not a UUID. Received: '${learnerId}'`);
            return NextResponse.json({ error: `learnerId must be a UUID, but received: '${learnerId}'. Please log out and log in again.` }, { status: 400 });
        }

        const groqKey = process.env.GROQ_API_KEY;
        if (!groqKey) {
            return NextResponse.json({ error: 'GROQ_API_KEY not configured' }, { status: 500 });
        }

        // ── Step 1: Call Groq AI ─────────────────────────────────────────────────

        const userMessage = `Please grade the following two IELTS Writing essays:

## Task 1 Essay:
${task1Content || '(No response submitted)'}

## Task 2 Essay:
${task2Content || '(No response submitted)'}

Return your evaluation strictly as a JSON object matching the required structure.`;

        const groqRes = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${groqKey}`,
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: userMessage },
                ],
                temperature: 0.3,
                max_tokens: 4096,
                response_format: { type: 'json_object' },
            }),
        });

        if (!groqRes.ok) {
            const errText = await groqRes.text();
            console.error('[grade-writing] Groq error:', errText);
            return NextResponse.json({ error: 'AI grading failed', details: errText }, { status: 502 });
        }

        const groqData = await groqRes.json() as {
            choices: Array<{ message: { content: string } }>;
        };
        const rawContent = groqData.choices[0]?.message?.content ?? '{}';

        let gradingResult: {
            task1: {
                annotated_html: string;
                task_response: number;
                coherence: number;
                lexical: number;
                grammar: number;
                overall_band: number;
                suggestions: Array<{
                    id: number;
                    original_text: string;
                    error_type: string;
                    correction: string;
                    explanation: string;
                }>;
            };
            task2: {
                annotated_html: string;
                task_response: number;
                coherence: number;
                lexical: number;
                grammar: number;
                overall_band: number;
                suggestions: Array<{
                    id: number;
                    original_text: string;
                    error_type: string;
                    correction: string;
                    explanation: string;
                }>;
            };
        };

        try {
            gradingResult = JSON.parse(rawContent);
        } catch {
            console.error('[grade-writing] Failed to parse Groq JSON:', rawContent.slice(0, 500));
            return NextResponse.json({ error: 'Invalid AI response format' }, { status: 502 });
        }

        // ── Step 2: Save writing submissions to DB ───────────────────────────────

        const saveSub = async (writingTaskId: string, content: string) => {
            const res = await fetch(`${API_BASE}/api/writing-submissions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ learnerId, writingTaskId, content }),
            });
            if (!res.ok) throw new Error(`Failed to save writing submission: ${await res.text()}`);
            const json = await res.json() as { data: { id: string } };
            return json.data;
        };

        const task1Sub = await saveSub(task1Id, task1Content);
        let task2SubId: string | null = null;
        if (task2Id && task2Content) {
            const task2Sub = await saveSub(task2Id, task2Content);
            task2SubId = task2Sub.id;
        }

        // ── Step 3: Calculate combined band scores ───────────────────────────────

        const t1 = gradingResult.task1;
        const t2 = gradingResult.task2;

        // IELTS Writing: Task 2 counts double
        const combinedBand = t2
            ? Math.round(((t1.overall_band + t2.overall_band * 2) / 3) * 2) / 2
            : t1.overall_band;

        const avgTaskResponse = t2 ? (t1.task_response + t2.task_response) / 2 : t1.task_response;
        const avgCoherence = t2 ? (t1.coherence + t2.coherence) / 2 : t1.coherence;
        const avgLexical = t2 ? (t1.lexical + t2.lexical) / 2 : t1.lexical;
        const avgGrammar = t2 ? (t1.grammar + t2.grammar) / 2 : t1.grammar;

        // ── Step 4: Save AI grading to DB ────────────────────────────────────────

        const gradingPayload = {
            submissionId: task1Sub.id,  // link to task1 as primary submission
            modelName: 'llama-3.3-70b-versatile',
            modelVersion: '1.0',
            promptVersion: 'v1',
            taskResponse: parseFloat(avgTaskResponse.toFixed(1)),
            coherence: parseFloat(avgCoherence.toFixed(1)),
            lexical: parseFloat(avgLexical.toFixed(1)),
            grammar: parseFloat(avgGrammar.toFixed(1)),
            overallBand: combinedBand,
            confidenceScore: 0.85,
            feedback: {
                task1: {
                    ...t1,
                    submission_id: task1Sub.id,
                },
                task2: task2SubId ? {
                    ...t2,
                    submission_id: task2SubId,
                } : null,
                overall_band: combinedBand,
                task2_sub_id: task2SubId,
            },
        };

        const gradingRes = await fetch(`${API_BASE}/api/writing-gradings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(gradingPayload),
        });

        if (!gradingRes.ok) {
            const errText = await gradingRes.text();
            console.error('[grade-writing] Failed to save grading:', errText);
            return NextResponse.json({ error: 'Failed to persist grading' }, { status: 500 });
        }

        const json = await gradingRes.json() as { data: { id: string } };
        const gradingRecord = json.data;

        // ── Step 5: Return the grading ID so frontend can navigate to result ─────

        return NextResponse.json({
            gradingId: gradingRecord.id,
            submissionId: task1Sub.id,
            overallBand: combinedBand,
            task1: t1,
            task2: t2,
        });

    } catch (err) {
        console.error('[grade-writing] Unexpected error:', err);
        return NextResponse.json({
            error: err instanceof Error ? err.message : 'Internal server error',
        }, { status: 500 });
    }
}
