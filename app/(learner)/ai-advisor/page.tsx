"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { testsApi } from "@/lib/api/tests";
import type { TestAttempt } from "@/lib/types";
import Link from "next/link";

// ─── types ────────────────────────────────────────────────────────────────────

interface Message {
  role: "user" | "assistant";
  content: string;
}

// ─── quick-start prompts ──────────────────────────────────────────────────────

const QUICK_PROMPTS = [
  "Analyse my test results and identify my biggest weaknesses.",
  "Create a 4-week study plan to improve my band score.",
  "What question types am I struggling with most?",
  "What score do I need on each skill to achieve Band 7.0 overall?",
  "Give me tips to improve my reading speed and comprehension.",
];

// ─── markdown-lite renderer ───────────────────────────────────────────────────
// Converts **bold**, ## headings, - bullets and \n to HTML without a library.

function renderMarkdown(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^### (.+)$/gm, '<h3 class="font-bold text-base mt-3 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="font-bold text-lg mt-4 mb-1.5">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="font-bold text-xl mt-4 mb-2">$1</h1>')
    .replace(/^[-•] (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/(<li[\s\S]*?<\/li>)/g, '<ul class="my-1.5 space-y-0.5">$1</ul>')
    .replace(/\n{2,}/g, '</p><p class="mt-2">')
    .replace(/\n/g, "<br />");
}

function AIMessage({ content, streaming }: { content: string; streaming?: boolean }) {
  return (
    <div className="flex gap-3 items-start">
      <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow">
        <span className="material-symbols-outlined text-white text-[16px]">smart_toy</span>
      </div>
      <div className="flex-1 min-w-0">
        <div
          className="text-sm text-foreground leading-relaxed prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
        />
        {streaming && (
          <span className="inline-block w-2 h-4 bg-violet-500 animate-pulse rounded-sm ml-0.5 align-middle" />
        )}
      </div>
    </div>
  );
}

function UserMessage({ content }: { content: string }) {
  return (
    <div className="flex gap-3 items-start justify-end">
      <div className="max-w-[80%] bg-primary text-primary-foreground text-sm rounded-2xl rounded-tr-sm px-4 py-2.5 leading-relaxed">
        {content}
      </div>
      <div className="shrink-0 w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
        <span className="material-symbols-outlined text-slate-600 dark:text-slate-300 text-[16px]">person</span>
      </div>
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export default function AIAdvisorPage() {
  const { user } = useAuth();
  const [attempts, setAttempts] = useState<TestAttempt[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── fetch user data ──────────────────────────────────────────────────────

  useEffect(() => {
    const learnerId = (user as any)?.profileId ?? user?.id;
    if (!learnerId) return;
    testsApi
      .getAttemptsByLearnerId(learnerId)
      .then(data => setAttempts(data as TestAttempt[]))
      .catch(() => {})
      .finally(() => setDataLoading(false));
  }, [user]);

  // ── build profile for API ────────────────────────────────────────────────

  const buildProfile = useCallback(() => ({
    userName: user?.fullName ?? user?.email ?? "Student",
    attempts: attempts.map(a => ({
      testTitle: a.test?.title,
      skill: (a.test as any)?.skill,
      bandScore: a.bandScore != null ? Number(a.bandScore) : null,
      rawScore: a.rawScore != null ? Number(a.rawScore) : null,
      startedAt: a.startedAt,
      submittedAt: a.submittedAt,
    })),
  }), [user, attempts]);

  // ── auto-initialize with a greeting from AI ──────────────────────────────

  useEffect(() => {
    if (dataLoading || initialized) return;
    setInitialized(true);
    sendMessage("Hello! Please give me a brief analysis of my current IELTS performance and what I should focus on first.", true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataLoading, initialized]);

  // ── scroll to bottom ─────────────────────────────────────────────────────

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  // ── send message ─────────────────────────────────────────────────────────

  async function sendMessage(text: string, hidden = false) {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;

    const userMsg: Message = { role: "user", content: trimmed };
    const newHistory = hidden ? messages : [...messages, userMsg];

    if (!hidden) {
      setMessages(newHistory);
      setInput("");
    }

    setStreaming(true);
    const placeholder: Message = { role: "assistant", content: "" };
    setMessages(prev => (hidden ? [placeholder] : [...newHistory, placeholder]));

    try {
      const res = await fetch("/api/ai/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: hidden ? [userMsg] : newHistory,
          profile: buildProfile(),
        }),
      });

      if (!res.ok || !res.body) throw new Error("AI request failed.");

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
          content: "Sorry, I couldn't reach the AI service. Please check that your OpenAI API key is configured in `.env.local`.",
        };
        return updated;
      });
    } finally {
      setStreaming(false);
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // auto-resize textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const ta = textareaRef.current;
    if (ta) { ta.style.height = "auto"; ta.style.height = `${ta.scrollHeight}px`; }
  };

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-background">

      {/* ── Top Bar ── */}
      <div className="shrink-0 flex items-center gap-3 px-6 py-4 border-b bg-white dark:bg-card">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow">
          <span className="material-symbols-outlined text-white text-[20px]">smart_toy</span>
        </div>
        <div>
          <h1 className="font-bold text-base leading-tight">AI Study Coach</h1>
          <p className="text-xs text-muted-foreground">Powered by GPT-4o · personalised to your results</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/analysis"
            className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[14px]">bar_chart</span>
            View Analysis
          </Link>
          <Link
            href="/resources"
            className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[14px]">library_books</span>
            Resources
          </Link>
        </div>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6 max-w-3xl mx-auto w-full">
        {dataLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-violet-200 border-t-violet-500 animate-spin" />
            <p className="text-sm text-muted-foreground">Loading your test data…</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg mb-2">
              <span className="material-symbols-outlined text-white text-[32px]">smart_toy</span>
            </div>
            <h2 className="text-lg font-bold">Your AI Study Coach</h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              Analysing your results and building a personalised plan…
            </p>
          </div>
        ) : (
          messages.map((msg, i) =>
            msg.role === "user" ? (
              <UserMessage key={i} content={msg.content} />
            ) : (
              <AIMessage
                key={i}
                content={msg.content}
                streaming={streaming && i === messages.length - 1}
              />
            ),
          )
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Quick Prompts ── */}
      {!streaming && messages.length > 0 && (
        <div className="shrink-0 px-4 md:px-8 pb-2 max-w-3xl mx-auto w-full">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => sendMessage(p)}
                className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 transition-colors whitespace-nowrap"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Input Area ── */}
      <div className="shrink-0 px-4 md:px-8 py-4 border-t bg-white dark:bg-card">
        <div className="max-w-3xl mx-auto flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={streaming || dataLoading}
              placeholder="Ask me anything about your IELTS preparation…"
              className="w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 pr-12 text-sm outline-none focus:ring-2 focus:ring-violet-400 placeholder:text-muted-foreground/60 transition-shadow max-h-40 overflow-y-auto disabled:opacity-50"
            />
          </div>
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || streaming || dataLoading}
            className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shadow hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {streaming ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-[20px]">send</span>
            )}
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground text-center mt-2">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>

    </div>
  );
}
