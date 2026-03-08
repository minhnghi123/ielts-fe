"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { testsApi } from "@/lib/api/tests";
import type { TestAttempt } from "@/lib/types";
import Link from "next/link";

// ─── types ────────────────────────────────────────────────────────────────────

interface Message { role: "user" | "assistant"; content: string; }

interface QuestionTypeStats { correct: number; total: number; }

interface SkillDetail {
  attempts: number;
  avgBand: number | null;
  bestBand: number | null;
  latestBand: number | null;
  trend: "improving" | "declining" | "stable" | "insufficient_data";
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

// ─── quick-start prompts ──────────────────────────────────────────────────────

const QUICK_PROMPTS = [
  "What are my biggest weaknesses and how do I fix them?",
  "Build me a 4-week study plan to raise my band score.",
  "Which question types should I practise first?",
  "How can I improve my True/False/Not Given accuracy?",
  "What's a realistic target band score for me in 2 months?",
];

// ─── markdown-lite renderer ───────────────────────────────────────────────────

function renderMarkdown(text: string): string {
  return text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^### (.+)$/gm, '<h3 class="font-bold text-sm mt-3 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="font-bold text-base mt-4 mb-1.5 text-foreground">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="font-bold text-lg mt-4 mb-2 text-foreground">$1</h1>')
    .replace(/^[-•] (.+)$/gm, '<li class="ml-5 list-disc leading-relaxed">$1</li>')
    .replace(/(<li[\s\S]*?<\/li>\n?)+/g, m => `<ul class="my-2 space-y-0.5">${m}</ul>`)
    .replace(/\n{2,}/g, '</p><p class="mt-2">')
    .replace(/\n/g, "<br />");
}

// ─── chat bubble components ───────────────────────────────────────────────────

function AIMessage({ content, streaming }: { content: string; streaming?: boolean }) {
  return (
    <div className="flex gap-3 items-start">
      <div className="shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm mt-0.5">
        <span className="material-symbols-outlined text-white text-[18px]">smart_toy</span>
      </div>
      <div className="flex-1 min-w-0 bg-white dark:bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
        {content ? (
          <div
            className="text-sm text-foreground leading-relaxed"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
          />
        ) : (
          <div className="flex gap-1 items-center h-5">
            {[0, 0.2, 0.4].map(d => (
              <span
                key={d}
                className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"
                style={{ animationDelay: `${d}s` }}
              />
            ))}
          </div>
        )}
        {streaming && content && (
          <span className="inline-block w-1.5 h-4 bg-indigo-500 animate-pulse rounded-sm ml-0.5 align-middle" />
        )}
      </div>
    </div>
  );
}

function UserMessage({ content }: { content: string }) {
  return (
    <div className="flex gap-3 items-start justify-end">
      <div className="max-w-[80%] bg-primary text-primary-foreground text-sm rounded-2xl rounded-tr-sm px-4 py-2.5 leading-relaxed shadow-sm">
        {content}
      </div>
      <div className="shrink-0 w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center mt-0.5">
        <span className="material-symbols-outlined text-slate-600 dark:text-slate-300 text-[18px]">person</span>
      </div>
    </div>
  );
}

// ─── data helpers ─────────────────────────────────────────────────────────────

function toUtcMs(d: string | undefined | null): number {
  if (!d) return 0;
  const s = /Z$|[+-]\d{2}:?\d{2}$/.test(d) ? d : d + "Z";
  return new Date(s).getTime() || 0;
}

function calcTrend(bands: number[]): SkillDetail["trend"] {
  if (bands.length < 3) return "insufficient_data";
  const half = Math.floor(bands.length / 2);
  const first = bands.slice(0, half).reduce((a, b) => a + b, 0) / half;
  const second = bands.slice(-half).reduce((a, b) => a + b, 0) / half;
  if (second - first > 0.3) return "improving";
  if (first - second > 0.3) return "declining";
  return "stable";
}

function buildSkillDetail(attempts: TestAttempt[], skill: string): SkillDetail | null {
  const graded = attempts
    .filter(a => !!a.submittedAt && (a.test as any)?.skill === skill && Number(a.bandScore ?? 0) > 0)
    .sort((a, b) => toUtcMs(a.startedAt) - toUtcMs(b.startedAt));
  if (!graded.length) return null;
  const bands = graded.map(a => Number(a.bandScore));
  return {
    attempts: graded.length,
    avgBand: bands.reduce((s, b) => s + b, 0) / bands.length,
    bestBand: Math.max(...bands),
    latestBand: bands[bands.length - 1],
    trend: calcTrend(bands),
    rawScores: graded.map(a => Number(a.rawScore ?? 0)).filter(Boolean),
  };
}

// ─── main component ───────────────────────────────────────────────────────────

export default function AIAdvisorPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<LearnerProfile | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── fetch + enrich data from real DB ────────────────────────────────────

  useEffect(() => {
    const learnerId = (user as any)?.profileId ?? user?.id;
    if (!learnerId) return;

    async function load() {
      try {
        const allAttempts = (await testsApi.getAttemptsByLearnerId(learnerId)) as TestAttempt[];
        const completed = allAttempts.filter(a => !!a.submittedAt);

        // Fetch full details for up to 8 recent attempts to get questionAttempts
        const recentCompleted = [...completed]
          .sort((a, b) => toUtcMs(b.startedAt) - toUtcMs(a.startedAt))
          .slice(0, 8);

        const detailed = await Promise.allSettled(
          recentCompleted.map(a => testsApi.getAttemptById(a.id)),
        );

        // Build question-type accuracy from detailed attempts
        const qtAccuracy: Record<string, QuestionTypeStats> = {};
        for (const res of detailed) {
          if (res.status !== "fulfilled") continue;
          const attempt = res.value as TestAttempt;
          for (const qa of attempt.questionAttempts ?? []) {
            const qType = (qa as any).question?.questionType ?? "unknown";
            if (!qtAccuracy[qType]) qtAccuracy[qType] = { correct: 0, total: 0 };
            qtAccuracy[qType].total++;
            if (qa.isCorrect === true) qtAccuracy[qType].correct++;
          }
        }

        // Per-skill details
        const skills: Record<string, SkillDetail> = {};
        for (const sk of ["listening", "reading", "writing", "speaking"]) {
          const d = buildSkillDetail(completed, sk);
          if (d) skills[sk] = d;
        }

        // Overall avg
        const gradedAll = completed.filter(a => Number(a.bandScore ?? 0) > 0);
        const overallAvg = gradedAll.length
          ? gradedAll.reduce((s, a) => s + Number(a.bandScore), 0) / gradedAll.length
          : null;

        // Recent attempts summary (most recent 6)
        const recentAttempts = completed
          .slice()
          .sort((a, b) => toUtcMs(b.startedAt) - toUtcMs(a.startedAt))
          .slice(0, 6)
          .map(a => ({
            testTitle: a.test?.title ?? "Practice Test",
            skill: (a.test as any)?.skill ?? "unknown",
            bandScore: a.bandScore != null ? Number(a.bandScore) : null,
            rawScore: a.rawScore != null ? Number(a.rawScore) : null,
            date: new Date(toUtcMs(a.startedAt)).toLocaleDateString("en-US", {
              month: "short", day: "numeric", year: "numeric",
            }),
          }));

        setProfile({
          userName: user?.fullName ?? user?.email ?? "Student",
          totalCompleted: completed.length,
          overallAvgBand: overallAvg,
          skills,
          questionTypeAccuracy: qtAccuracy,
          recentAttempts,
        });
      } catch {
        // Still create a minimal profile so the AI can respond
        setProfile({
          userName: user?.fullName ?? user?.email ?? "Student",
          totalCompleted: 0,
          overallAvgBand: null,
          skills: {},
          questionTypeAccuracy: {},
          recentAttempts: [],
        });
      } finally {
        setLoading(false);
      }
    }

    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ── auto-init greeting ───────────────────────────────────────────────────

  useEffect(() => {
    if (loading || initialized || !profile) return;
    setInitialized(true);
    const opening =
      profile.totalCompleted === 0
        ? "Hello! I don't have any test results for you yet. Please introduce yourself and tell me your target IELTS band score — I'll explain how to get started."
        : "Hello! I have your full test history and performance data. Please give me a comprehensive analysis: identify my weakest skills and question types, and outline a personalised study roadmap to improve my band score.";
    doSend(opening, true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, initialized, profile]);

  // ── scroll to bottom ─────────────────────────────────────────────────────

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── send a message ───────────────────────────────────────────────────────

  const doSend = useCallback(async (text: string, hidden = false) => {
    if (!text.trim() || streaming || !profile) return;

    const userMsg: Message = { role: "user", content: text.trim() };
    setMessages(prev => (hidden ? [...prev, { role: "assistant", content: "" }]
                                : [...prev, userMsg, { role: "assistant", content: "" }]));
    if (!hidden) setInput("");
    setStreaming(true);

    const history = hidden
      ? [userMsg]
      : [...messages, userMsg];

    try {
      const res = await fetch("/api/ai/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, profile }),
      });

      if (!res.ok || !res.body) throw new Error("Request failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: full };
          return updated;
        });
      }
    } catch {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "I couldn't connect to the AI service. Please check that `GEMINI_API_KEY` is set in `.env.local` and restart the server.",
        };
        return updated;
      });
    } finally {
      setStreaming(false);
    }
  }, [messages, profile, streaming]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); doSend(input); }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const ta = textareaRef.current;
    if (ta) { ta.style.height = "auto"; ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`; }
  };

  // ── stats snapshot bar ───────────────────────────────────────────────────

  const SnapshotBar = () => {
    if (!profile || profile.totalCompleted === 0) return null;
    const skillColors: Record<string, string> = {
      listening: "text-blue-600", reading: "text-purple-600",
      writing: "text-orange-600", speaking: "text-pink-600",
    };
    return (
      <div className="shrink-0 bg-slate-50 dark:bg-muted/30 border-b px-6 py-2.5 flex items-center gap-6 overflow-x-auto text-xs">
        <span className="font-semibold text-muted-foreground whitespace-nowrap">Your scores:</span>
        {["listening", "reading", "writing", "speaking"].map(sk => {
          const d = profile.skills[sk];
          return (
            <div key={sk} className="flex items-center gap-1.5 whitespace-nowrap">
              <span className={`font-semibold capitalize ${skillColors[sk]}`}>{sk}</span>
              <span className="font-black tabular-nums">{d?.avgBand?.toFixed(1) ?? "—"}</span>
              {d?.trend === "improving" && <span className="text-emerald-500">↑</span>}
              {d?.trend === "declining" && <span className="text-rose-500">↓</span>}
            </div>
          );
        })}
        <div className="flex items-center gap-1.5 ml-auto whitespace-nowrap">
          <span className="text-muted-foreground">Overall avg:</span>
          <span className="font-black tabular-nums">{profile.overallAvgBand?.toFixed(1) ?? "—"}</span>
        </div>
      </div>
    );
  };

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-slate-50/50 dark:bg-background">

      {/* Top bar */}
      <div className="shrink-0 flex items-center gap-3 px-6 py-3.5 border-b bg-white dark:bg-card shadow-sm">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow">
          <span className="material-symbols-outlined text-white text-[20px]">smart_toy</span>
        </div>
        <div>
          <h1 className="font-bold text-base leading-tight">AI Study Coach</h1>
          <p className="text-xs text-muted-foreground">Powered by Gemini · fed by your real test data</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <Link href="/analysis" className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">bar_chart</span>Analysis
          </Link>
          <Link href="/resources" className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">library_books</span>Resources
          </Link>
        </div>
      </div>

      {/* Score snapshot bar */}
      <SnapshotBar />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 max-w-3xl mx-auto w-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 py-24">
            <div className="relative w-14 h-14">
              <div className="w-14 h-14 rounded-full border-4 border-indigo-100 border-t-indigo-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="material-symbols-outlined text-indigo-500 text-[22px]">smart_toy</span>
              </div>
            </div>
            <div className="text-center">
              <p className="font-semibold text-sm">Loading your learning data…</p>
              <p className="text-xs text-muted-foreground mt-1">Fetching test results and question accuracy from the database</p>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {messages.map((msg, i) =>
              msg.role === "user" ? (
                <UserMessage key={i} content={msg.content} />
              ) : (
                <AIMessage
                  key={i}
                  content={msg.content}
                  streaming={streaming && i === messages.length - 1}
                />
              ),
            )}
            <div ref={bottomRef} className="h-4" />
          </div>
        )}
      </div>

      {/* Quick prompts */}
      {!loading && !streaming && messages.length > 0 && (
        <div className="shrink-0 px-4 md:px-8 pb-2 max-w-3xl mx-auto w-full">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {QUICK_PROMPTS.map(p => (
              <button
                key={p}
                onClick={() => doSend(p)}
                className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors whitespace-nowrap"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="shrink-0 px-4 md:px-8 py-4 border-t bg-white dark:bg-card">
        <div className="max-w-3xl mx-auto flex items-end gap-3">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={streaming || loading}
            placeholder="Ask me anything about your IELTS preparation…"
            className="flex-1 resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-400 placeholder:text-muted-foreground/60 transition-shadow max-h-40 overflow-y-auto disabled:opacity-50"
          />
          <button
            onClick={() => doSend(input)}
            disabled={!input.trim() || streaming || loading}
            className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {streaming ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-[20px]">send</span>
            )}
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground text-center mt-2">
          Enter to send · Shift+Enter for new line
        </p>
      </div>

    </div>
  );
}
