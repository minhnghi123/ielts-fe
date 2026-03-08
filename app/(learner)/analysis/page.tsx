"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { testsApi } from "@/lib/api/tests";
import type { TestAttempt } from "@/lib/types";

// ─── helpers ──────────────────────────────────────────────────────────────────

function toUtcMs(d: string | undefined | null): number | null {
  if (!d) return null;
  const utc = /Z$|[+-]\d{2}:?\d{2}$/.test(d) ? d : d + "Z";
  const ms = new Date(utc).getTime();
  return isNaN(ms) ? null : ms;
}

function formatDuration(startedAt: string, submittedAt?: string): string {
  const start = toUtcMs(startedAt);
  const end = toUtcMs(submittedAt);
  if (!start || !end || end <= start) return "—";
  const sec = Math.floor((end - start) / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}

function formatDate(d: string): string {
  const ms = toUtcMs(d);
  if (!ms) return "—";
  return new Date(ms).toLocaleDateString("en-US", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function avgBand(attempts: TestAttempt[], skill?: string): number | null {
  const filtered = attempts.filter(
    a => !!a.submittedAt && Number(a.bandScore ?? 0) > 0 && (!skill || (a.test as any)?.skill === skill),
  );
  if (!filtered.length) return null;
  return filtered.reduce((s, a) => s + Number(a.bandScore ?? 0), 0) / filtered.length;
}

function bandLabel(b: number | null): string {
  if (!b) return "—";
  if (b >= 8.5) return "Expert";
  if (b >= 7.5) return "Very Good";
  if (b >= 6.5) return "Competent";
  if (b >= 5.5) return "Modest";
  if (b >= 4.5) return "Limited";
  return "Beginner";
}

function bandBarColor(b: number | null): string {
  if (!b) return "bg-slate-300";
  if (b >= 7.5) return "bg-emerald-500";
  if (b >= 6)   return "bg-blue-500";
  if (b >= 4.5) return "bg-amber-500";
  return "bg-rose-500";
}

function bandTextColor(b: number | null): string {
  if (!b) return "text-muted-foreground";
  if (b >= 7.5) return "text-emerald-600";
  if (b >= 6)   return "text-blue-600";
  if (b >= 4.5) return "text-amber-600";
  return "text-rose-600";
}

const SKILLS = [
  { id: "listening", label: "Listening", icon: "headphones" },
  { id: "reading",   label: "Reading",   icon: "menu_book" },
  { id: "writing",   label: "Writing",   icon: "edit_note" },
  { id: "speaking",  label: "Speaking",  icon: "mic" },
];

const SKILL_COLORS: Record<string, string> = {
  listening: "bg-blue-100 text-blue-700",
  reading:   "bg-purple-100 text-purple-700",
  writing:   "bg-orange-100 text-orange-700",
  speaking:  "bg-pink-100 text-pink-700",
};

// ─── main component ───────────────────────────────────────────────────────────

export default function AnalysisPage() {
  const { user } = useAuth();
  const [attempts, setAttempts] = useState<TestAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSkill, setActiveSkill] = useState<string>("all");

  useEffect(() => {
    const learnerId = (user as any)?.profileId ?? user?.id;
    if (!learnerId) return;
    testsApi
      .getAttemptsByLearnerId(learnerId)
      .then(data => setAttempts(data as TestAttempt[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const completed = attempts.filter(a => !!a.submittedAt);
  const filtered = activeSkill === "all"
    ? completed
    : completed.filter(a => (a.test as any)?.skill === activeSkill);

  const overallAvg = avgBand(completed);

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto w-full flex flex-col gap-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold mb-1">Results Analysis</h1>
        <p className="text-sm text-muted-foreground">
          Your full performance breakdown across all IELTS skills.
        </p>
      </div>

      {/* ── Skill Score Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {SKILLS.map(({ id, label, icon }) => {
          const band = avgBand(completed, id);
          const pct = band ? Math.round((band / 9) * 100) : 0;
          const count = completed.filter(a => (a.test as any)?.skill === id).length;
          return (
            <div key={id} className="bg-white dark:bg-card border rounded-2xl shadow-sm p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-muted-foreground">{icon}</span>
                  <span className="text-sm font-semibold">{label}</span>
                </div>
              </div>
              {loading ? (
                <div className="h-8 bg-slate-100 rounded animate-pulse" />
              ) : (
                <div className={`text-3xl font-black tabular-nums ${bandTextColor(band)}`}>
                  {band ? band.toFixed(1) : "—"}
                </div>
              )}
              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${bandBarColor(band)}`}
                  style={{ width: loading ? "0%" : `${pct}%` }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{bandLabel(band)}</span>
                <span className="text-xs text-muted-foreground">{count} test{count !== 1 ? "s" : ""}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Overall Banner ── */}
      <div className="bg-gradient-to-r from-violet-500 to-purple-700 rounded-2xl p-6 text-white flex items-center justify-between shadow-lg">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider opacity-80 mb-1">Overall Average Band</p>
          <div className="text-5xl font-black tabular-nums">
            {loading ? "…" : overallAvg ? overallAvg.toFixed(1) : "N/A"}
          </div>
          <p className="text-sm opacity-70 mt-1">
            Based on {completed.length} completed test{completed.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/ai-advisor"
          className="flex items-center gap-2 bg-white text-purple-700 font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-purple-50 transition-colors shadow"
        >
          <span className="material-symbols-outlined text-[18px]">smart_toy</span>
          AI Improvement Plan
        </Link>
      </div>

      {/* ── Attempt History ── */}
      <div className="bg-white dark:bg-card border rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-bold text-lg">Attempt History</h2>
          {/* Skill filter */}
          <div className="flex gap-1.5">
            <button
              onClick={() => setActiveSkill("all")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                activeSkill === "all" ? "bg-primary text-primary-foreground" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All
            </button>
            {SKILLS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setActiveSkill(id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors capitalize ${
                  activeSkill === id ? "bg-primary text-primary-foreground" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <span className="material-symbols-outlined text-[48px] text-muted-foreground/40 block mb-3">assignment</span>
            <p className="text-muted-foreground text-sm">No completed tests yet for this skill.</p>
            <Link href="/practice" className="inline-block mt-4 text-sm text-primary font-semibold hover:underline">
              Start a practice test →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-muted/40">
                  <th className="text-left px-6 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Test</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Skill</th>
                  <th className="text-center px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Band</th>
                  <th className="text-center px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Score</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Date</th>
                  <th className="text-center px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Duration</th>
                  <th className="text-center px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.slice().reverse().map(a => {
                  const skill = (a.test as any)?.skill ?? "reading";
                  const band = Number(a.bandScore ?? 0);
                  const testId = a.testId ?? (a.test as any)?.id;
                  return (
                    <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-3.5">
                        <span className="font-medium line-clamp-1 max-w-[220px] block">
                          {a.test?.title ?? "Practice Test"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold capitalize ${SKILL_COLORS[skill] ?? "bg-slate-100 text-slate-700"}`}>
                          {skill}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`font-black text-base tabular-nums ${bandTextColor(band || null)}`}>
                          {band > 0 ? band.toFixed(1) : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center text-muted-foreground tabular-nums">
                        {a.rawScore != null ? a.rawScore : "—"}
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground">
                        {formatDate(a.startedAt)}
                      </td>
                      <td className="px-4 py-3.5 text-center text-muted-foreground tabular-nums">
                        {formatDuration(a.startedAt, a.submittedAt)}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {testId && (
                          <Link
                            href={`/practice/${testId}/result?attemptId=${a.id}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                          >
                            Review
                            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
