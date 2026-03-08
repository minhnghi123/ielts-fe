import { NextRequest } from 'next/server';
import Groq from 'groq-sdk';

// ─── types ────────────────────────────────────────────────────────────────────

interface QuestionTypeStats { correct: number; total: number; }

interface SkillDetail {
  attempts: number;
  avgBand: number | null;
  bestBand: number | null;
  latestBand: number | null;
  trend: 'improving' | 'declining' | 'stable' | 'insufficient_data';
  rawScores: number[];
}

interface LearnerProfile {
  userName: string;
  totalCompleted: number;
  overallAvgBand: number | null;
  skills: Record<string, SkillDetail>;
  questionTypeAccuracy: Record<string, QuestionTypeStats>;
  recentAttempts: Array<{
    testTitle: string;
    skill: string;
    bandScore: number | null;
    rawScore: number | null;
    date: string;
  }>;
}

// ─── context builder ──────────────────────────────────────────────────────────

function buildContext(profile: LearnerProfile): string {
  const lines: string[] = [
    '=== LEARNER PROFILE ===',
    `Name: ${profile.userName}`,
    `Completed tests: ${profile.totalCompleted}`,
    `Overall average band: ${profile.overallAvgBand?.toFixed(1) ?? 'N/A'}`,
    '',
    '=== SKILL BREAKDOWN ===',
  ];

  for (const skill of ['listening', 'reading', 'writing', 'speaking']) {
    const s = profile.skills[skill];
    if (!s) { lines.push(`${skill.toUpperCase()}: Not yet attempted`); continue; }
    lines.push(
      `${skill.toUpperCase()}: ` +
      `${s.attempts} test(s) | avg=${s.avgBand?.toFixed(1) ?? '—'} | ` +
      `best=${s.bestBand?.toFixed(1) ?? '—'} | latest=${s.latestBand?.toFixed(1) ?? '—'} | trend=${s.trend}`,
    );
  }

  if (Object.keys(profile.questionTypeAccuracy).length > 0) {
    lines.push('', '=== QUESTION TYPE ACCURACY (from recent attempts) ===');
    const sorted = Object.entries(profile.questionTypeAccuracy)
      .map(([type, stats]) => ({
        type,
        accuracy: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
        correct: stats.correct,
        total: stats.total,
      }))
      .sort((a, b) => a.accuracy - b.accuracy); // weakest first

    for (const { type, accuracy, correct, total } of sorted) {
      const flag = accuracy < 50 ? ' ← WEAK AREA' : accuracy < 70 ? ' ← needs work' : '';
      lines.push(`  ${type}: ${correct}/${total} correct (${accuracy.toFixed(0)}%)${flag}`);
    }
  }

  if (profile.recentAttempts.length > 0) {
    lines.push('', '=== RECENT TEST HISTORY ===');
    for (const a of profile.recentAttempts) {
      lines.push(
        `  [${a.date}] ${a.testTitle} (${a.skill}) — Band ${a.bandScore?.toFixed(1) ?? '—'}, Raw ${a.rawScore ?? '—'}`,
      );
    }
  }

  lines.push('', '=== END LEARNER PROFILE ===');
  return lines.join('\n');
}

// ─── system prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert IELTS coach embedded in a learning platform. You have access to the learner's complete test history and performance analytics from the database. Use this data to give deeply personalised, specific advice.

Your core responsibilities:
1. Analyse actual scores to identify SPECIFIC weaknesses by skill and question type.
2. Provide a prioritised study roadmap with realistic weekly targets and timelines.
3. Recommend concrete strategies for each weak question type (e.g. how to improve fill_in_blank accuracy from 45% to 70%).
4. Set motivating but realistic band score improvement goals.
5. Give actionable daily/weekly practice suggestions based on their current level.
6. If the learner has no test data yet, warmly guide them on how to get started.

Rules:
- NEVER give generic advice — always reference the learner's actual numbers and scores.
- Be concise but thorough. Use ## headings, - bullet points, and **bold** for key points.
- Prioritise the weakest areas first.
- Tone: professional, encouraging, data-driven.`;

// ─── route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'GROQ_API_KEY is not configured in .env.local.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const body = await req.json();
  const { messages = [], profile } = body as {
    messages: Array<{ role: 'user' | 'assistant'; content: string }>;
    profile: LearnerProfile;
  };

  const learnerContext = buildContext(profile);

  const groq = new Groq({ apiKey });

  const stream = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    stream: true,
    temperature: 0.75,
    max_tokens: 1500,
    messages: [
      {
        role: 'system',
        content: `${SYSTEM_PROMPT}\n\n${learnerContext}`,
      },
      // Map assistant → assistant (Groq uses same role names as OpenAI)
      ...messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ],
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content ?? '';
        if (delta) controller.enqueue(encoder.encode(delta));
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
