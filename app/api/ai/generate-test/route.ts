import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const SYSTEM_PROMPT = `You are an expert IELTS test creator. Generate a complete, realistic IELTS test in valid JSON.

CRITICAL: Return ONLY the raw JSON object — no markdown, no code fences, no extra text.

──────────────── JSON STRUCTURE ────────────────
{
  "title": "IELTS [Skill] Test: [Topic]",
  "skill": "reading" | "listening",
  "isMock": false,
  "sections": [
    {
      "sectionOrder": 1,
      "passage": "Full academic passage text (500-900 words for reading; transcript for listening)",
      "audioUrl": "",
      "groups": [
        {
          "groupOrder": 1,
          "instructions": "IELTS-style group instruction e.g. Questions 1–5. Do the following statements agree with the information given in Reading Passage 1?",
          "questions": [
            {
              "questionOrder": 1,
              "questionType": "...",
              "questionText": "...",
              "config": {},
              "explanation": "Brief explanation of why this is the correct answer",
              "answer": {
                "correctAnswers": ["ANSWER"],
                "caseSensitive": false
              }
            }
          ]
        }
      ]
    }
  ]
}

──────────────── QUESTION TYPE RULES ────────────────

true_false_not_given
  config: {}
  questionText: A statement to verify against the passage
  correctAnswers: ["TRUE"] | ["FALSE"] | ["NOT GIVEN"]

yes_no_not_given
  config: {}
  questionText: A statement about the writer's opinion/view
  correctAnswers: ["YES"] | ["NO"] | ["NOT GIVEN"]

fill_in_blank
  config: {}
  questionText: "Complete the summary: The _____ was discovered in..."
  correctAnswers: ["WORD OR PHRASE"] — uppercase, max 3 words
  Use (WORD) for optional words: "(ELECTRIC) CARS". Each question = ONE blank only.

multiple_choice
  config: { "options": ["A. full text of option A", "B. full text", "C. full text", "D. full text"] }
  questionText: "Question stem"
  correctAnswers: ["A"] | ["B"] | ["C"] | ["D"]

matching_heading
  config: { "options": ["Full heading text 1", "Full heading text 2", ...] }
  Always include 2 extra headings as distractors.
  questionText: "Paragraph A" | "Section 2" etc.
  correctAnswers: ["I"] | ["II"] | ["III"] | ["IV"] | ["V"] | ["VI"] | ["VII"] | ["VIII"]
  Roman numeral = 1-based index into config.options.

matching
  config: { "options": ["A. option text", "B. option text", "C. option text", ...] }
  questionText: "Item or description to match"
  correctAnswers: ["A"] | ["B"] | ["C"] etc.

sentence_ending
  config: { "options": ["A. ending text", "B. ending text", "C. ending text", ...] }
  questionText: "The beginning of the sentence..."
  correctAnswers: ["A"] | ["B"] | ["C"] etc.

matching_features
  config: { "options": ["A. Person/Organisation name", "B. Person/Organisation name", ...] }
  questionText: "A fact or finding to attribute"
  correctAnswers: ["A"] | ["B"] | ["C"] etc.

──────────────── IELTS CONVENTIONS ────────────────
- Reading: 3 sections, ~13 questions each (40 total). Academic register. Factual/argumentative passages.
- Listening: 4 sections, ~10 questions each (40 total). passage field = audio transcript.
- questionOrder is GLOBAL and strictly sequential (1, 2, 3 … N across ALL sections).
- Each section may have MULTIPLE groups with DIFFERENT question types.
- Instructions must reference the correct question numbers (e.g. "Questions 14–19").
- Explanations should briefly reference where in the passage the answer is found.
- Vary question types across groups. Do NOT use the same type for all groups in one section.
- All correct answers must be directly verifiable from the passage text you write.`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'GROQ_API_KEY is not configured in .env.local.' },
      { status: 500 },
    );
  }

  const body = await req.json();
  const {
    skill = 'reading',
    topic = 'technology',
    numSections,
    difficulty = 'Band 6-7',
    questionTypes = [],
    additionalInstructions = '',
    isMock = false,
  } = body;

  const defaultSections = skill === 'listening' ? 4 : 3;
  const sections = Math.min(Math.max(Number(numSections) || defaultSections, 1), 4);
  const totalQuestions = sections * (skill === 'listening' ? 10 : 13);

  const qtypeHints =
    questionTypes.length > 0
      ? `Preferred question types (use these where appropriate): ${questionTypes.join(', ')}.`
      : 'Use a varied mix of all available question types.';

  const userPrompt = [
    `Create a complete IELTS ${skill.toUpperCase()} test on the topic: "${topic}".`,
    `Difficulty level: ${difficulty}.`,
    `Number of sections: ${sections}.`,
    `Total questions: approximately ${totalQuestions} (sequential questionOrder across all sections).`,
    qtypeHints,
    additionalInstructions ? `Additional instructions: ${additionalInstructions}` : '',
    `Set "isMock": ${isMock}.`,
    'Do NOT include a "createdBy" field — it will be added by the server.',
    'Return ONLY the JSON object. No markdown, no code fences.',
  ]
    .filter(Boolean)
    .join('\n');

  const groq = new Groq({ apiKey });

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
    max_tokens: 16000,
  });

  const raw = completion.choices[0]?.message?.content ?? '{}';

  let testData: Record<string, unknown>;
  try {
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    testData = JSON.parse(cleaned);
  } catch {
    return NextResponse.json(
      { error: 'AI returned invalid JSON. Please try again.', raw },
      { status: 500 },
    );
  }

  return NextResponse.json({ test: testData });
}
