"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/contexts/auth-context";
import { testsApi } from "@/lib/api/tests";
import type { TestAttempt } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Headphones, BookOpen, PenLine, Mic,
  Sparkles, ArrowRight, TrendingUp, Target,
  CheckCircle2, XCircle, Clock, ChevronRight,
  BarChart3, PlayCircle, AlertTriangle,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toUtcMs(d: string | undefined | null): number | null {
  if (!d) return null;
  const utc = /Z$|[+-]\d{2}:?\d{2}$/.test(String(d)) ? String(d) : String(d) + "Z";
  const ms = new Date(utc).getTime();
  return isNaN(ms) ? null : ms;
}

function formatDate(d: string | Date): string {
  const ms = toUtcMs(String(d));
  if (!ms) return "—";
  return new Date(ms).toLocaleDateString("en-US", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function avgBand(attempts: TestAttempt[], skill?: string): number | null {
  const filtered = attempts.filter(
    a => !!a.submittedAt && Number(a.bandScore ?? 0) > 0
      && (!skill || (a.test as any)?.skill === skill),
  );
  if (!filtered.length) return null;
  return filtered.reduce((s, a) => s + Number(a.bandScore ?? 0), 0) / filtered.length;
}

function bandColor(b: number | null): string {
  if (!b) return "text-slate-400";
  if (b >= 7.5) return "text-emerald-600";
  if (b >= 6)   return "text-blue-600";
  if (b >= 4.5) return "text-amber-500";
  return "text-rose-500";
}

function bandBg(b: number | null): string {
  if (!b) return "bg-slate-300";
  if (b >= 7.5) return "bg-emerald-500";
  if (b >= 6)   return "bg-blue-500";
  if (b >= 4.5) return "bg-amber-500";
  return "bg-rose-500";
}

function bandLabel(b: number | null): string {
  if (!b) return "Not attempted";
  if (b >= 8.5) return "Expert";
  if (b >= 7.5) return "Very Good";
  if (b >= 6.5) return "Competent";
  if (b >= 5.5) return "Modest";
  return "Limited";
}

const SKILLS = [
  { id: "listening", label: "Listening", Icon: Headphones, accent: "blue" },
  { id: "reading",   label: "Reading",   Icon: BookOpen,   accent: "emerald" },
  { id: "writing",   label: "Writing",   Icon: PenLine,    accent: "orange" },
  { id: "speaking",  label: "Speaking",  Icon: Mic,        accent: "purple" },
];

// ─── Mini Skill Card ──────────────────────────────────────────────────────────

function SkillBandCard({
  label, Icon, accent, band, count, loading,
}: {
  label: string;
  Icon: any;
  accent: string;
  band: number | null;
  count: number;
  loading: boolean;
}) {
  const pct = band ? Math.round((band / 9) * 100) : 0;
  const accentMap: Record<string, string> = {
    blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
    emerald: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400",
    orange: "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400",
    purple: "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400",
  };
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${accentMap[accent]}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold">{label}</p>
            <p className="text-[11px] text-muted-foreground">
              {loading ? "…" : count === 0 ? "Not attempted" : `${count} test${count !== 1 ? "s" : ""}`}
            </p>
          </div>
          <div className="ml-auto text-right">
            {loading ? (
              <div className="h-6 w-12 bg-slate-200 rounded animate-pulse" />
            ) : band ? (
              <>
                <p className={`text-xl font-black leading-none tabular-nums ${bandColor(band)}`}>
                  {band.toFixed(1)}
                </p>
                <p className="text-[10px] text-muted-foreground">{bandLabel(band)}</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">—</p>
            )}
          </div>
        </div>
        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          {!loading && (
            <div
              className={`h-full rounded-full transition-all duration-700 ${bandBg(band)}`}
              style={{ width: `${pct}%` }}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Attempt Row ──────────────────────────────────────────────────────────────

// ─── In-progress session check (client-side localStorage) ────────────────────

function getLocalSession(testId: string): { hasSession: boolean; remainingMs: number } {
  try {
    const raw = localStorage.getItem(`ielts_session_${testId}`);
    if (!raw) return { hasSession: false, remainingMs: 0 };
    const session = JSON.parse(raw) as { startedAt: number; durationMs: number };
    const remainingMs = Math.max(0, session.durationMs - (Date.now() - session.startedAt));
    return { hasSession: true, remainingMs };
  } catch {
    return { hasSession: false, remainingMs: 0 };
  }
}

function AttemptRow({ attempt }: { attempt: TestAttempt }) {
  const skill = (attempt.test as any)?.skill ?? "reading";
  const band  = Number(attempt.bandScore ?? 0);
  const testId = attempt.testId ?? (attempt.test as any)?.id;
  const hasAiFeedback = !!(attempt as any).aiFeedback;
  const isSubmitted = !!attempt.submittedAt;

  // Check localStorage for in-progress attempts
  const session = !isSubmitted && testId ? getLocalSession(testId) : null;
  const hasTimeLeft = session ? session.remainingMs > 0 : false;

  const skillColors: Record<string, string> = {
    listening: "bg-blue-100 text-blue-600",
    reading:   "bg-emerald-100 text-emerald-600",
    writing:   "bg-orange-100 text-orange-600",
    speaking:  "bg-purple-100 text-purple-600",
  };

  return (
    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors border-b border-border last:border-0">
      <td className="px-4 py-3 text-sm font-medium max-w-[200px] truncate">
        {attempt.test?.title ?? "Practice Test"}
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold capitalize ${skillColors[skill] ?? "bg-slate-100 text-slate-600"}`}>
          {skill}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        {band > 0 ? (
          <span className={`font-black text-base tabular-nums ${bandColor(band)}`}>
            {band.toFixed(1)}
          </span>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-center">
        {isSubmitted ? (
          <span className="inline-flex items-center gap-1 text-emerald-600 text-[11px] font-bold">
            <CheckCircle2 className="h-3 w-3" /> Done
          </span>
        ) : hasTimeLeft ? (
          <span className="inline-flex items-center gap-1 text-amber-500 text-[11px] font-bold">
            <Clock className="h-3 w-3" /> In Progress
          </span>
        ) : session?.hasSession ? (
          <span className="inline-flex items-center gap-1 text-rose-500 text-[11px] font-bold">
            <AlertTriangle className="h-3 w-3" /> Time's Up
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-slate-400 text-[11px] font-medium">
            <XCircle className="h-3 w-3" /> Incomplete
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground">
        {formatDate(attempt.startedAt)}
      </td>
      <td className="px-4 py-3 text-center">
        {hasAiFeedback ? (
          <span className="inline-flex items-center gap-0.5 text-violet-600 text-[11px] font-bold">
            <Sparkles className="h-3 w-3" /> Yes
          </span>
        ) : (
          <span className="text-[11px] text-muted-foreground">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        {isSubmitted && testId ? (
          <Link href={`/practice/${testId}/result?attemptId=${attempt.id}`}>
            <Button variant="ghost" size="sm" className="h-7 text-xs px-2.5 gap-1">
              Review <ChevronRight className="h-3 w-3" />
            </Button>
          </Link>
        ) : testId && (hasTimeLeft || session?.hasSession) ? (
          // Resume link — the practice page handles both resume and auto-submit-if-expired
          <Link href={`/practice/${testId}`}>
            <Button
              variant="outline"
              size="sm"
              className={`h-7 text-xs px-2.5 gap-1 ${
                session?.hasSession && !hasTimeLeft
                  ? "border-rose-300 text-rose-600 hover:bg-rose-50"
                  : "border-amber-300 text-amber-700 hover:bg-amber-50"
              }`}
            >
              <PlayCircle className="h-3 w-3" />
              {session?.hasSession && !hasTimeLeft ? "Submit Results" : "Resume"}
            </Button>
          </Link>
        ) : null}
      </td>
    </tr>
  );
}

// ─── Latest AI Feedback Card ──────────────────────────────────────────────────

function LatestAiFeedbackCard({ attempts }: { attempts: TestAttempt[] }) {
  // Find the most recent attempt that has ai_feedback
  const withFeedback = attempts
    .filter(a => !!(a as any).aiFeedback && !!a.submittedAt)
    .sort((a, b) => {
      const ta = toUtcMs(a.submittedAt) ?? 0;
      const tb = toUtcMs(b.submittedAt) ?? 0;
      return tb - ta;
    });

  if (withFeedback.length === 0) return null;

  const latest = withFeedback[0];
  const feedback = (latest as any).aiFeedback as string;
  const testId = latest.testId ?? (latest.test as any)?.id;

  return (
    <Card className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border-violet-200 dark:border-violet-800/40 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-7 w-7 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
            <Sparkles className="h-3.5 w-3.5 text-violet-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-violet-700 dark:text-violet-300 uppercase tracking-wider">
              Latest AI Coaching Feedback
            </p>
            <p className="text-[11px] text-muted-foreground truncate">
              {latest.test?.title ?? "Practice Test"} · {formatDate(latest.startedAt)}
            </p>
          </div>
          {testId && (
            <Link href={`/practice/${testId}/result?attemptId=${latest.id}`}>
              <Button variant="ghost" size="sm" className="h-7 text-xs text-violet-600 hover:text-violet-700 hover:bg-violet-100 gap-1 flex-shrink-0">
                Full Result <ChevronRight className="h-3 w-3" />
              </Button>
            </Link>
          )}
        </div>
        {/* Truncated preview of the feedback */}
        <div className="text-sm text-foreground/80 leading-relaxed line-clamp-6 prose prose-sm max-w-none">
          <ReactMarkdown>{feedback.slice(0, 600) + (feedback.length > 600 ? "…" : "")}</ReactMarkdown>
        </div>
        <Link href="/ai-advisor">
          <Button
            size="sm"
            className="mt-3 gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs"
          >
            <Sparkles className="h-3.5 w-3.5" /> Chat with AI Coach
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

type SkillFilter = "all" | "listening" | "reading" | "writing" | "speaking";

export default function AnalysisPage() {
  const { user } = useAuth();
  const [attempts, setAttempts] = useState<TestAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [skillFilter, setSkillFilter] = useState<SkillFilter>("all");

  useEffect(() => {
    const learnerId = (user as any)?.profileId || user?.id;
    if (!learnerId) return;
    testsApi.getAttemptsByLearnerId(learnerId)
      .then(data => { setAttempts(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user]);

  const completed = useMemo(() => attempts.filter(a => !!a.submittedAt), [attempts]);
  const overall = avgBand(completed);

  // Table shows ALL attempts (submitted + in-progress), sorted newest first
  const filtered = useMemo(() => {
    const pool = skillFilter === "all"
      ? attempts
      : attempts.filter(a => (a.test as any)?.skill === skillFilter);
    return [...pool].sort((a, b) => (toUtcMs(b.startedAt) ?? 0) - (toUtcMs(a.startedAt) ?? 0));
  }, [attempts, skillFilter]);

  // Trend: compare latest 3 attempts vs previous 3
  function trend(skill?: string): "up" | "down" | "flat" | null {
    const graded = (skill
      ? completed.filter(a => (a.test as any)?.skill === skill)
      : completed
    ).filter(a => Number(a.bandScore ?? 0) > 0)
      .sort((a, b) => (toUtcMs(b.startedAt) ?? 0) - (toUtcMs(a.startedAt) ?? 0));
    if (graded.length < 4) return null;
    const recent = graded.slice(0, 3).reduce((s, a) => s + Number(a.bandScore), 0) / 3;
    const older  = graded.slice(3, 6).reduce((s, a) => s + Number(a.bandScore), 0) / Math.min(3, graded.slice(3, 6).length);
    if (recent > older + 0.2) return "up";
    if (recent < older - 0.2) return "down";
    return "flat";
  }

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto w-full flex flex-col gap-8">

      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Performance Analysis</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Your IELTS progress across all tests — powered by real data.
          </p>
        </div>
        <Link href="/ai-advisor">
          <Button className="gap-2 bg-violet-600 hover:bg-violet-700 text-white">
            <Sparkles className="h-4 w-4" />
            AI Study Coach
          </Button>
        </Link>
      </div>

      {/* ── Overall Banner ───────────────────────────────────────────────────── */}
      {!loading && overall !== null && (
        <div className="bg-gradient-to-r from-blue-600 to-violet-600 rounded-2xl p-6 text-white flex items-center justify-between gap-4 shadow-lg">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">
              Overall Average Band Score
            </p>
            <p className="text-5xl font-black leading-none tabular-nums">{overall.toFixed(1)}</p>
            <p className="text-sm opacity-80 mt-1">{bandLabel(overall)} · {completed.length} tests completed</p>
          </div>
          <div className="hidden sm:flex flex-col items-center gap-2">
            <BarChart3 className="h-14 w-14 opacity-30" />
            {trend() === "up" && <Badge className="bg-white/20 text-white border-none text-xs">↑ Improving</Badge>}
            {trend() === "down" && <Badge className="bg-white/20 text-white border-none text-xs">↓ Declining</Badge>}
            {trend() === "flat" && <Badge className="bg-white/20 text-white border-none text-xs">→ Stable</Badge>}
          </div>
        </div>
      )}

      {/* ── Skill Breakdown ──────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Skill Breakdown
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {SKILLS.map(({ id, label, Icon, accent }) => {
            const count = completed.filter(a => (a.test as any)?.skill === id).length;
            return (
              <SkillBandCard
                key={id}
                label={label}
                Icon={Icon}
                accent={accent}
                band={avgBand(completed, id)}
                count={count}
                loading={loading}
              />
            );
          })}
        </div>
      </div>

      {/* ── Latest AI Feedback ───────────────────────────────────────────────── */}
      {!loading && <LatestAiFeedbackCard attempts={attempts} />}

      {/* ── Attempt History Table ────────────────────────────────────────────── */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Test History
          </h2>
          {/* Skill filter tabs */}
          <div className="flex flex-wrap gap-1">
            {(["all", "listening", "reading", "writing", "speaking"] as SkillFilter[]).map(f => (
              <button
                key={f}
                onClick={() => setSkillFilter(f)}
                className={`px-3 py-1 text-xs font-semibold rounded-full border transition-colors ${
                  skillFilter === f
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {f === "all" ? "All Skills" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <Card className="shadow-sm overflow-hidden">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16">
                <XCircle className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground font-medium">
                  {skillFilter === "all" ? "No tests yet." : `No ${skillFilter} tests yet.`}
                </p>
                <Link href="/tests">
                  <Button size="sm" className="mt-4">Browse Tests</Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-[11px] text-muted-foreground uppercase tracking-wide border-b border-border">
                    <tr>
                      <th className="text-left px-4 py-2.5 font-semibold">Test</th>
                      <th className="text-left px-4 py-2.5 font-semibold">Skill</th>
                      <th className="text-center px-4 py-2.5 font-semibold">Band</th>
                      <th className="text-center px-4 py-2.5 font-semibold">Status</th>
                      <th className="text-left px-4 py-2.5 font-semibold">Date</th>
                      <th className="text-center px-4 py-2.5 font-semibold">AI Feedback</th>
                      <th className="text-right px-4 py-2.5 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(a => (
                      <AttemptRow key={a.id} attempt={a} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {!loading && filtered.length > 0 && (
          <p className="text-xs text-muted-foreground mt-2 text-right">
            {filtered.filter(a => !!a.submittedAt).length} completed
            {filtered.filter(a => !a.submittedAt).length > 0
              ? ` · ${filtered.filter(a => !a.submittedAt).length} in progress`
              : ""}
            {skillFilter !== "all" ? ` — ${skillFilter}` : ""}
          </p>
        )}
      </div>

      {/* ── AI Coach CTA ────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-violet-500 to-purple-700 rounded-2xl p-6 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-5 w-5 opacity-80" />
            <span className="font-bold uppercase tracking-wider text-xs opacity-80">AI Study Coach</span>
          </div>
          <h3 className="text-lg font-bold mb-1">Get a personalised improvement roadmap</h3>
          <p className="text-sm opacity-80 leading-relaxed">
            Our AI analyses every test attempt, identifies your weakest question types, and builds a week-by-week practice plan tailored to your target band score.
          </p>
        </div>
        <Link
          href="/ai-advisor"
          className="flex-shrink-0 inline-flex items-center gap-2 bg-white text-purple-700 text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-purple-50 transition-colors"
        >
          Chat Now <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

    </div>
  );
}
