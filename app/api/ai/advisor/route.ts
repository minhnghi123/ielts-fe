import { NextRequest } from 'next/server';
import OpenAI from 'openai';

const SYSTEM_PROMPT = `You are an expert IELTS coach integrated into a learning platform. Your role is to:
1. Analyse the learner's actual test performance data that will be provided to you.
2. Identify strengths and specific weaknesses based on their scores.
3. Provide a clear, actionable study roadmap with weekly priorities.
4. Suggest specific strategies for each skill they need to improve.
5. Motivate and encourage learners with a supportive, professional tone.

Always base your advice on the actual data provided. Be specific — reference their exact scores.
Keep responses concise but thorough. Use bullet points and clear headings where helpful.
If the learner has no test data yet, encourage them to take their first test and explain what to expect.`;

function buildUserContext(profile: {
  userName?: string;
  attempts: Array<{
    testTitle?: string;
    skill?: string;
    bandScore?: number | null;
    rawScore?: number | null;
    startedAt?: string;
    submittedAt?: string;
  }>;
}): string {
  const { userName, attempts } = profile;
  const completed = attempts.filter(a => !!a.submittedAt);

  if (completed.length === 0) {
    return `Learner: ${userName ?? "Student"}\nTest history: No completed tests yet.`;
  }

  // Per-skill summary
  const skills = ["listening", "reading", "writing", "speaking"];
  const skillSummaries = skills.map(skill => {
    const skillAttempts = completed.filter(a => a.skill === skill && (a.bandScore ?? 0) > 0);
    if (!skillAttempts.length) return `  ${skill}: not yet attempted`;
    const avg = skillAttempts.reduce((s, a) => s + (a.bandScore ?? 0), 0) / skillAttempts.length;
    const best = Math.max(...skillAttempts.map(a => a.bandScore ?? 0));
    const latest = skillAttempts[skillAttempts.length - 1];
    return `  ${skill}: avg=${avg.toFixed(1)}, best=${best.toFixed(1)}, tests=${skillAttempts.length}, latest=${latest.bandScore?.toFixed(1) ?? "—"}`;
  }).join("\n");

  // Recent attempts (last 6)
  const recent = completed.slice(-6).reverse().map(a =>
    `  - ${a.testTitle ?? "Practice Test"} (${a.skill}): Band ${a.bandScore?.toFixed(1) ?? "—"}, Raw score ${a.rawScore ?? "—"}`
  ).join("\n");

  const overallGraded = completed.filter(a => (a.bandScore ?? 0) > 0);
  const overallAvg = overallGraded.length
    ? (overallGraded.reduce((s, a) => s + (a.bandScore ?? 0), 0) / overallGraded.length).toFixed(1)
    : "N/A";

  return [
    `Learner: ${userName ?? "Student"}`,
    `Total completed tests: ${completed.length}`,
    `Overall average band: ${overallAvg}`,
    ``,
    `Per-skill performance:`,
    skillSummaries,
    ``,
    `Recent test history:`,
    recent,
  ].join("\n");
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === 'your_openai_api_key_here') {
    return new Response(
      JSON.stringify({ error: 'OPENAI_API_KEY is not configured.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const body = await req.json();
  const { messages = [], profile } = body as {
    messages: Array<{ role: 'user' | 'assistant'; content: string }>;
    profile: Parameters<typeof buildUserContext>[0];
  };

  const userContext = buildUserContext(profile);
  const systemWithContext = `${SYSTEM_PROMPT}\n\n--- LEARNER DATA ---\n${userContext}\n--- END LEARNER DATA ---`;

  const openai = new OpenAI({ apiKey });

  const stream = await openai.chat.completions.create({
    model: 'gpt-4o',
    stream: true,
    temperature: 0.7,
    max_tokens: 1200,
    messages: [
      { role: 'system', content: systemWithContext },
      ...messages,
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
    },
  });
}
