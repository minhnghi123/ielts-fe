import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { createClient } from '@supabase/supabase-js';

// ─── Supabase client (server-side, uses anon key) ─────────────────────────────

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface WrongAnswer {
  questionNumber: number;
  questionType: string;
  yourAnswer: string;
  correctAnswer: string;
}

interface AnalyzeRequest {
  attemptId: string;
  learnerId: string;
  skill: string;
  testTitle: string;
  totalQ: number;
  correctQ: number;
  wrongQ: number;
  skippedQ: number;
  bandScore: number;
  wrongAnswers: WrongAnswer[];          // wrong questions with details
  wrongQuestionIds: string[];           // DB question IDs of wrong answers (for learner_mistakes)
  questionTypeStats: Record<string, { correct: number; total: number }>;
}

// ─── Build the Groq prompt ────────────────────────────────────────────────────

function buildPrompt(body: AnalyzeRequest): string {
  const accuracy = body.totalQ > 0
    ? ((body.correctQ / body.totalQ) * 100).toFixed(1)
    : '0';

  const lines: string[] = [
    `=== TEST RESULT SUMMARY ===`,
    `Test: ${body.testTitle}`,
    `Skill: ${body.skill.toUpperCase()}`,
    `Score: ${body.correctQ}/${body.totalQ} correct (${accuracy}% accuracy)`,
    `Wrong: ${body.wrongQ} | Skipped: ${body.skippedQ}`,
    `Band Score: ${body.bandScore > 0 ? body.bandScore.toFixed(1) : 'N/A'}`,
    ``,
    `=== PERFORMANCE BY QUESTION TYPE ===`,
  ];

  for (const [type, stats] of Object.entries(body.questionTypeStats)) {
    const pct = stats.total > 0
      ? ((stats.correct / stats.total) * 100).toFixed(0)
      : '0';
    const flag = Number(pct) < 50 ? ' ← WEAK' : Number(pct) < 70 ? ' ← needs work' : '';
    lines.push(`  ${type}: ${stats.correct}/${stats.total} (${pct}%)${flag}`);
  }

  if (body.wrongAnswers.length > 0) {
    lines.push(``, `=== WRONG ANSWERS (top 10) ===`);
    body.wrongAnswers.slice(0, 10).forEach(w => {
      lines.push(
        `  Q${w.questionNumber} [${w.questionType}]: answered "${w.yourAnswer || '(blank)'}" → correct: "${w.correctAnswer}"`,
      );
    });
  }

  return lines.join('\n');
}

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert IELTS coach. A learner just finished a practice test and their results are shown below. 

Provide a concise, encouraging, and highly specific analysis covering:

1. **Overall Performance** — brief evaluation of the score and band
2. **Question Type Weaknesses** — specifically which question types need work and WHY (e.g. fill_in_blank: spelling mistakes, wrong tense; matching_heading: not reading full paragraph)
3. **Pattern of Mistakes** — identify 2-3 common patterns from the wrong answers
4. **Targeted Action Plan** — 3-5 specific, actionable tips to improve in the next test (e.g. "For True/False/Not Given: underline the key claim in the question before scanning")
5. **Encouragement** — brief motivating closing line

Format using markdown with ## headings and - bullet points. Keep the total response under 500 words. Be direct and specific, not generic.`;

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'GROQ_API_KEY not configured' },
      { status: 500 },
    );
  }

  let body: AnalyzeRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const resultContext = buildPrompt(body);

  // ── Call Groq (non-streaming — we want the complete text to save to DB) ────

  const groq = new Groq({ apiKey });
  let aiFeedback = '';

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      stream: false,
      temperature: 0.65,
      max_tokens: 700,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: resultContext },
      ],
    });
    aiFeedback = completion.choices[0]?.message?.content ?? '';
  } catch (err: any) {
    console.error('[analyze-result] Groq error:', err?.message);
    return NextResponse.json(
      { error: 'AI analysis failed: ' + err?.message },
      { status: 502 },
    );
  }

  // ── Save individual mistakes to learner_mistakes table (Supabase) ──────────
  //
  // Schema: id (uuid), learner_id, question_id, mistake_type, created_at
  // We insert one row per wrong question. Skip on error so the main
  // flow is not blocked.

  if (body.wrongQuestionIds.length > 0) {
    try {
      const supabase = getSupabase();
      const rows = body.wrongQuestionIds.map(qid => ({
        learner_id: body.learnerId,
        question_id: qid,
        mistake_type: 'wrong_answer',
        created_at: new Date().toISOString(),
      }));
      const { error } = await supabase.from('learner_mistakes').insert(rows);
      if (error) console.warn('[analyze-result] Supabase insert warning:', error.message);
    } catch (e: any) {
      console.warn('[analyze-result] Could not save mistakes:', e?.message);
    }
  }

  // ── Save AI feedback to test_attempts via the NestJS backend ─────────────

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  try {
    await fetch(`${apiBase}/api/attempts/${body.attemptId}/ai-feedback`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aiFeedback }),
    });
  } catch (e: any) {
    console.warn('[analyze-result] Could not persist ai_feedback:', e?.message);
    // Don't fail the request — return the text even if DB save failed
  }

  return NextResponse.json({ aiFeedback });
}
