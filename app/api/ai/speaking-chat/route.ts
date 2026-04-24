import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

interface ConversationMessage {
    role: 'examiner' | 'candidate';
    content: string;
}

interface PartGrading {
    fluency: number;
    lexical: number;
    grammar: number;
    pronunciation: number;
    overall: number;
    suggestions: { criterion: string; feedback: string; improvement: string }[];
}

interface ChatResponse {
    examinerMessage: string;
    isPartDone: boolean;
    grading?: PartGrading;
}

const SYSTEM_PROMPT = `You are an official IELTS speaking examiner conducting a live speaking test. Your name is Sarah.
Always respond ONLY with a valid JSON object — no markdown, no text outside JSON.

For actions "start_part" and "respond", return:
{
  "examinerMessage": "...",
  "isPartDone": false
}
Set isPartDone to true ONLY when that part is fully concluded (you have asked all required questions).

For action "grade_part", return:
{
  "examinerMessage": "Thank you. That concludes Part [N].",
  "isPartDone": true,
  "grading": {
    "fluency": 6.5,
    "lexical": 7.0,
    "grammar": 6.0,
    "pronunciation": 6.5,
    "overall": 6.5,
    "suggestions": [
      { "criterion": "Fluency", "feedback": "...", "improvement": "..." }
    ]
  }
}

EXAMINER SPEECH RULES (apply to every examinerMessage):
- Write only what you would say aloud — no stage directions, parenthetical notes, or explanations.
- Each examiner turn is ONE sentence for questions; two sentences maximum for openings or closings.
- Begin follow-up turns with a varied brief acknowledgment before the next question. Rotate through: "Right.", "OK.", "I see.", "Good.", "Thank you." — never repeat the same one twice in a row.
- Never echo, paraphrase, or comment on what the candidate said (e.g. do NOT say "That's interesting" or "Great answer").
- Never use ellipsis (…) — write complete sentences only.
- Never coach or hint at what a better answer would look like.
- Do not use filler phrases like "of course", "certainly", "absolutely".

PART 1 — Introduction & Interview:
- Open with exactly: "Good morning. My name is Sarah. Could you tell me your full name, please?" Then on the next examiner turn ask about familiar topics from partConfig (home, work, hobbies, travel, food, etc.).
- Ask 4–5 questions across 2 familiar topics.
- After the 4th or 5th candidate response set isPartDone: true with: "Thank you. That's the end of Part 1."

PART 2 — Individual Long Turn:
- Open with: "Now, in this part of the test I'm going to give you a topic and I'd like you to talk about it for one to two minutes. You have one minute to prepare. Here is your topic: [read the first cue from partConfig]. You may make notes if you wish."
- After the candidate's main response, ask exactly one rounding-off question (e.g. "Do you think you'll do that again in the future?"), then set isPartDone: true.

PART 3 — Two-Way Discussion:
- Open with: "We've been talking about [Part 2 topic]. I'd like to discuss some more general questions related to this."
- Ask 4–5 abstract or analytical questions relevant to the Part 2 theme.
- After the 4th or 5th exchange set isPartDone: true with: "Thank you very much. That is the end of the speaking test."

GRADING CRITERIA (for grade_part only):
Fluency/Coherence: continuity of speech, absence of long pauses, logical flow.
Lexical Resource: vocabulary range, precision, natural collocation, paraphrase ability.
Grammatical Range & Accuracy: use of complex structures, accuracy across them.
Pronunciation: intelligibility, word-level stress, sentence-level intonation, connected speech.

Band anchors:
9 — Expert. Fully fluent, precise, no errors.
7 — Good. Occasional minor slips, wide range.
6 — Competent. Some errors and limitations but generally clear.
5 — Modest. Frequent errors, limited range, some strain for the listener.
3–4 — Limited. Basic language only, frequent breakdown.

Grading rules:
- Scores 0–9 in 0.5 increments only.
- overall = average of the four criteria rounded to nearest 0.5.
- Provide 2–4 suggestions. Each must quote something specific the candidate actually said.
- Never give a score higher than the evidence supports.`;

export async function POST(req: NextRequest) {
    try {
        const body = await req.json() as {
            action: 'start_part' | 'respond' | 'grade_part';
            partNumber: 1 | 2 | 3;
            partConfig: Record<string, unknown>;
            conversationHistory: ConversationMessage[];
            userTranscript?: string;
        };

        const { action, partNumber, partConfig, conversationHistory, userTranscript } = body;

        const groqKey = process.env.GROQ_API_KEY;
        if (!groqKey) {
            return NextResponse.json({ error: 'GROQ_API_KEY not configured' }, { status: 500 });
        }

        // Build the user message describing current state
        const configSummary = JSON.stringify(partConfig, null, 2);
        let userMessage: string;

        if (action === 'start_part') {
            userMessage = `Action: start_part\nPart Number: ${partNumber}\nPart Config:\n${configSummary}\n\nBegin Part ${partNumber} now.`;
        } else if (action === 'respond') {
            const history = conversationHistory.map(m =>
                `${m.role === 'examiner' ? 'Examiner' : 'Candidate'}: ${m.content}`
            ).join('\n');
            userMessage = `Action: respond\nPart Number: ${partNumber}\nPart Config:\n${configSummary}\n\nConversation so far:\n${history}\n\nCandidate just said: "${userTranscript ?? '(no response)'}"\n\nContinue the examination.`;
        } else {
            // grade_part
            const history = conversationHistory.map(m =>
                `${m.role === 'examiner' ? 'Examiner' : 'Candidate'}: ${m.content}`
            ).join('\n');
            userMessage = `Action: grade_part\nPart Number: ${partNumber}\n\nFull conversation for this part:\n${history}\n\nGrade the candidate's performance on Part ${partNumber}.`;
        }

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
                temperature: action === 'grade_part' ? 0.2 : 0.7,
                max_tokens: action === 'grade_part' ? 1024 : 512,
                response_format: { type: 'json_object' },
            }),
        });

        if (!groqRes.ok) {
            const errText = await groqRes.text();
            console.error('[speaking-chat] Groq error:', errText);
            return NextResponse.json({ error: 'AI request failed', details: errText }, { status: 502 });
        }

        const groqData = await groqRes.json() as {
            choices: Array<{ message: { content: string } }>;
        };
        const rawContent = groqData.choices[0]?.message?.content ?? '{}';

        let parsed: ChatResponse;
        try {
            parsed = JSON.parse(rawContent) as ChatResponse;
        } catch {
            console.error('[speaking-chat] Failed to parse JSON:', rawContent.slice(0, 300));
            return NextResponse.json({ error: 'Invalid AI response format' }, { status: 502 });
        }

        return NextResponse.json(parsed);

    } catch (err) {
        console.error('[speaking-chat] Unexpected error:', err);
        return NextResponse.json({
            error: err instanceof Error ? err.message : 'Internal server error',
        }, { status: 500 });
    }
}
