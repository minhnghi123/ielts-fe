"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useAuthStore } from "@/stores/auth-store";
import { useAnalyticsDashboard } from "@/lib/hooks/use-analytics";
import { useAttemptsByLearner } from "@/lib/hooks/use-attempts";
import { useTests } from "@/lib/hooks/use-tests";
import type { TestAttempt, DashboardSummary } from "@/lib/types";
import { WelcomeHeader } from "./_components/welcome-header";
import { StatOverview } from "./_components/stat-overview";
import { ModuleGrid } from "./_components/module-grid";
import { Button } from "@/components/ui/button";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Headphones, BookOpen, FileText, PenLine,
  CheckCircle2, Clock, ArrowRight,
  Target, Sparkles,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function bandColor(b: number | null): string {
  if (!b || b === 0) return "text-muted-foreground";
  if (b >= 7.5) return "text-emerald-600";
  if (b >= 6)   return "text-blue-600";
  if (b >= 4.5) return "text-amber-600";
  return "text-rose-600";
}

function skillColors(skill: string): string {
  const map: Record<string, string> = {
    listening: "bg-blue-100 text-blue-600",
    reading:   "bg-emerald-100 text-emerald-600",
    writing:   "bg-amber-100 text-amber-700",
    speaking:  "bg-violet-100 text-violet-700",
  };
  return map[skill] ?? "bg-muted text-muted-foreground";
}

function skillProgressColor(skill: string): string {
  const map: Record<string, string> = {
    listening: "bg-blue-500",
    reading:   "bg-emerald-500",
    writing:   "bg-amber-500",
    speaking:  "bg-violet-500",
  };
  return map[skill] ?? "bg-primary";
}

function skillIcon(skill: string) {
  if (skill === "listening") return <Headphones className="h-4 w-4" />;
  if (skill === "reading") return <BookOpen className="h-4 w-4" />;
  if (skill === "writing") return <PenLine className="h-4 w-4" />;
  return <FileText className="h-4 w-4" />;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─── Skill Progress Panel ──────────────────────────────────────────────────────

const SKILLS_META = [
  { id: "listening", label: "Listening", icon: "headphones" },
  { id: "reading",   label: "Reading",   icon: "menu_book" },
  { id: "writing",   label: "Writing",   icon: "edit_note" },
  { id: "speaking",  label: "Speaking",  icon: "mic" },
];

function SkillProgressPanel({
  summary,
  attempts,
  loading,
}: {
  summary: DashboardSummary | null | undefined;
  attempts: TestAttempt[];
  loading: boolean;
}) {
  return (
    <div className="bg-card border rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-xl font-semibold text-foreground">Skill Progress</h2>
        <Link href="/analysis" className="text-sm text-primary font-medium flex items-center gap-1 hover:text-primary/80 transition-colors duration-150">
          Full Analysis <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {SKILLS_META.map(({ id, label, icon }) => {
          const profileBand = summary?.bandProfiles?.find((p) => p.skill === id)?.currentBand;
          const band = profileBand != null ? Number(profileBand) : null;
          const pct = band ? Math.round((band / 9) * 100) : 0;
          const count = attempts.filter((a) => (a.test as any)?.skill === id && !!a.submittedAt).length;
          return (
            <div key={id} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`material-symbols-outlined text-[18px] ${skillColors(id).split(" ")[1]}`}>{icon}</span>
                  <span className="text-sm font-semibold">{label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {loading ? (
                    <Skeleton className="h-4 w-8 rounded" />
                  ) : band ? (
                    <span className={`text-sm font-black tabular-nums ${bandColor(band)}`}>{band.toFixed(1)}</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                {!loading && (
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${skillProgressColor(id)}`}
                    style={{ width: `${pct}%` }}
                  />
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {loading ? "…" : count === 0 ? "Not attempted yet" : `${count} test${count !== 1 ? "s" : ""} completed`}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Exam Readiness Widget ─────────────────────────────────────────────────────

function ExamReadinessWidget({ examReadiness, loading }: { examReadiness: number | undefined; loading: boolean }) {
  const pct = examReadiness ?? 0;
  const r = 36;
  const circumference = 2 * Math.PI * r;
  const dash = circumference * (pct / 100);
  const color = pct >= 75 ? "#10b981" : pct >= 50 ? "#3b82f6" : pct >= 25 ? "#f59e0b" : "#ef4444";

  return (
    <div className="bg-card border rounded-xl p-6 shadow-sm flex flex-col items-center gap-3 text-center">
      <div className="flex items-center gap-2 w-full justify-between mb-1">
        <h2 className="font-display text-base font-semibold text-foreground">Exam Readiness</h2>
        <Link href="/analysis" className="text-xs text-primary font-medium flex items-center gap-1 hover:text-primary/80 transition-colors duration-150">
          Details <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      {loading ? (
        <Skeleton className="h-24 w-24 rounded-full mx-auto" />
      ) : (
        <div className="relative">
          <svg width="96" height="96" viewBox="0 0 96 96">
            <circle cx="48" cy="48" r={r} fill="none" stroke="#e5e7eb" strokeWidth="8" />
            <circle
              cx="48" cy="48" r={r}
              fill="none"
              stroke={color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={circumference / 4}
              style={{ transition: "stroke-dasharray 1s ease" }}
            />
            <text x="48" y="52" textAnchor="middle" fontSize="18" fontWeight="800" fill="currentColor" className="text-foreground">
              {pct}%
            </text>
          </svg>
        </div>
      )}
      <p className="text-xs text-muted-foreground leading-relaxed">
        {pct >= 75 ? "You're well prepared! Keep it up." :
          pct >= 50 ? "Good progress — a few more tests will get you there." :
            pct >= 25 ? "Keep practicing — you're building momentum." :
              "Start taking tests to track your readiness."}
      </p>
    </div>
  );
}

// ─── Study Priority Card ───────────────────────────────────────────────────────

function StudyPriorityCard({ summary, loading }: { summary: DashboardSummary | null | undefined; loading: boolean }) {
  const topTask = summary?.adaptiveStudyPlan?.[0];
  if (!loading && !topTask) return null;

  const priorityBadge: Record<string, string> = {
    high:   "bg-rose-100 text-rose-700",
    medium: "bg-amber-100 text-amber-700",
    low:    "bg-emerald-100 text-emerald-700",
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-100 dark:border-blue-900/40 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-2">
        <Target className="h-4 w-4 text-blue-600" />
        <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
          Top Study Priority
        </span>
      </div>
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-4 w-3/4 rounded" />
          <Skeleton className="h-3 w-full rounded" />
        </div>
      ) : topTask ? (
        <>
          <h3 className="font-bold text-foreground capitalize text-sm mb-1">
            {topTask.title}
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed mb-3">
            {topTask.recommendation}
          </p>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${priorityBadge[topTask.priority] ?? "bg-muted text-muted-foreground"}`}>
              {topTask.priority} priority
            </span>
            <span className="text-[10px] text-muted-foreground font-medium">Due in {topTask.dueInDays}d</span>
          </div>
        </>
      ) : null}
    </div>
  );
}

// ─── Dashboard Page ─────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const learnerId = (user as any)?.profileId || user?.id;

  const { data: summary, isLoading: summaryLoading } = useAnalyticsDashboard(learnerId);
  const { data: attempts = [], isLoading: attemptsLoading } = useAttemptsByLearner(learnerId);

  const { data: listeningData } = useTests({ skill: "listening", limit: 1 });
  const { data: readingData } = useTests({ skill: "reading", limit: 1 });
  const { data: writingData } = useTests({ skill: "writing", limit: 1 });
  const { data: speakingData } = useTests({ skill: "speaking", limit: 1 });

  const isLoading = summaryLoading || attemptsLoading;

  const testCounts: Record<string, number> = {
    listening: listeningData?.total ?? 0,
    reading: readingData?.total ?? 0,
    writing: writingData?.total ?? 0,
    speaking: speakingData?.total ?? 0,
  };

  const recentAttempts = attempts.slice(0, 4);

  const weakestSkill = (() => {
    if (summary?.bandProfiles?.length) {
      const sorted = summary.bandProfiles
        .filter((p) => p.skill !== "overall" && p.currentBand != null)
        .sort((a, b) => Number(a.currentBand ?? 9) - Number(b.currentBand ?? 9));
      return sorted[0]?.skill ?? "reading";
    }
    return "reading";
  })();

  const tips: Record<string, { title: string; body: string }> = {
    listening: { title: "Focus on keywords", body: "Before the recording plays, read each question carefully and underline key words. Predict the type of answer you need." },
    reading: { title: "Synonyms are key!", body: "The passage will rarely use the exact words from the question. Train yourself to spot synonyms and paraphrasing." },
    writing: { title: "Structure every essay", body: "Always plan for 5 minutes before writing. A clear Introduction → Body 1 → Body 2 → Conclusion structure can lift your score." },
    speaking: { title: "Extend your answers", body: "Avoid one-word replies. Use the PEEL method: Point → Example → Explanation → Link back to boost fluency scores." },
  };
  const tip = tips[weakestSkill as keyof typeof tips] ?? tips.reading;

  const tipAccent: Record<string, { border: string; icon: string; label: string }> = {
    listening: { border: "border-blue-200", icon: "text-blue-400", label: "text-blue-500" },
    reading:   { border: "border-emerald-200", icon: "text-emerald-400", label: "text-emerald-500" },
    writing:   { border: "border-amber-200", icon: "text-amber-400", label: "text-amber-500" },
    speaking:  { border: "border-violet-200", icon: "text-violet-400", label: "text-violet-500" },
  };
  const accent = tipAccent[weakestSkill] ?? tipAccent.reading;

  return (
    <motion.div
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col gap-4">
        <Breadcrumb items={[
          { label: "Home", href: "/", icon: "home" },
          { label: "Dashboard", icon: "dashboard" },
        ]} />
        <WelcomeHeader userName={user?.fullName || user?.email || ""} />
      </div>

      <StatOverview attempts={attempts} loading={isLoading} />

      {/* ── Skill + Readiness Row ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SkillProgressPanel summary={summary} attempts={attempts} loading={isLoading} />
        </div>
        <ExamReadinessWidget examReadiness={summary?.examReadiness} loading={isLoading} />
      </div>

      {/* ── Module Grid ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-6">
        <h2 className="font-display text-xl font-semibold text-foreground">Select Test Module</h2>
        <ModuleGrid testCounts={testCounts} attempts={attempts} loading={isLoading} />
      </div>

      {/* ── Bottom Grid ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Recent Activity ──────────────────────────────────────────────── */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-foreground">Recent Activity</h2>
            <Link href="/profile">
              <Button variant="ghost" size="sm" className="text-sm font-medium gap-1">
                View All <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : recentAttempts.length === 0 ? (
            <div className="text-center py-12 bg-card border rounded-xl shadow-sm">
              <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground font-medium">No activity yet — take your first test!</p>
              <Link href="/practice">
                <Button size="sm" className="mt-4">Start Practising</Button>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {recentAttempts.map((a) => {
                const skill = (a.test as any)?.skill ?? "reading";
                const band = Number(a.bandScore ?? 0);
                const testId = a.testId ?? (a.test as any)?.id;

                return (
                  <div key={a.id} className="flex items-center justify-between p-4 bg-card border rounded-xl hover:shadow-md transition-all duration-150">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${skillColors(skill)}`}>
                        {skillIcon(skill)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm line-clamp-1">
                          {a.test?.title ?? "Practice Test"}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-muted-foreground">{timeAgo(a.startedAt)}</p>
                          {a.submittedAt ? (
                            <span className="inline-flex items-center gap-0.5 text-emerald-600 text-[10px] font-bold">
                              <CheckCircle2 className="h-3 w-3" /> Completed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 text-amber-500 text-[10px] font-bold">
                              <Clock className="h-3 w-3" /> In Progress
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      {band > 0 && (
                        <div className="text-right">
                          <p className={`font-black text-lg leading-none tabular-nums ${bandColor(band)}`}>{band.toFixed(1)}</p>
                          <p className="text-[10px] text-muted-foreground">Band</p>
                        </div>
                      )}
                      {a.submittedAt && testId && (
                        <Link href={`/practice/${testId}/result?attemptId=${a.id}`}>
                          <Button variant="outline" size="sm" className="h-7 text-xs px-2.5">
                            Review
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Right Sidebar ─────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4">

          <StudyPriorityCard summary={summary} loading={isLoading} />

          {/* AI Advisor gradient CTA */}
          <Link href="/ai-advisor" className="block bg-gradient-to-br from-violet-500 to-purple-700 rounded-xl p-4 hover:opacity-95 transition-opacity duration-150">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 bg-white/20 rounded-lg flex items-center justify-center text-white flex-shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white">AI Study Coach</p>
                <p className="text-xs text-white/70">Get your personalised plan</p>
              </div>
              <span className="material-symbols-outlined text-white/70 text-[18px]">chevron_right</span>
            </div>
          </Link>

          {/* Daily Tip with skill accent */}
          <div className={`border ${accent.border} rounded-xl p-4 bg-card shadow-sm`}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`material-symbols-outlined text-[16px] ${accent.icon}`}>lightbulb</span>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${accent.label} capitalize`}>
                {weakestSkill} Tip
              </span>
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1">{tip.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{tip.body}</p>
          </div>

        </div>
      </div>
    </motion.div>
  );
}
