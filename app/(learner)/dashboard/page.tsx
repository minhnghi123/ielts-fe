"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { testsApi } from "@/lib/api/tests";
import type { TestAttempt } from "@/lib/types";
import { WelcomeHeader } from "./_components/welcome-header";
import { StatOverview } from "./_components/stat-overview";
import { ModuleGrid } from "./_components/module-grid";
import { Button } from "@/components/ui/button";
import {
  Headphones, BookOpen, FileText, PenLine,
  CheckCircle2, XCircle, Clock, ArrowRight,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function skillIcon(skill: string) {
  if (skill === "listening") return <Headphones className="h-4 w-4" />;
  if (skill === "reading") return <BookOpen className="h-4 w-4" />;
  if (skill === "writing") return <PenLine className="h-4 w-4" />;
  return <FileText className="h-4 w-4" />;
}

function skillColors(skill: string) {
  if (skill === "listening") return { bg: "bg-blue-100 dark:bg-blue-900/20", text: "text-blue-600 dark:text-blue-400" };
  if (skill === "reading")   return { bg: "bg-emerald-100 dark:bg-emerald-900/20", text: "text-emerald-600 dark:text-emerald-400" };
  if (skill === "writing")   return { bg: "bg-orange-100 dark:bg-orange-900/20", text: "text-orange-600 dark:text-orange-400" };
  return { bg: "bg-purple-100 dark:bg-purple-900/20", text: "text-purple-600 dark:text-purple-400" };
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─── Dashboard Page ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth();
  const [attempts, setAttempts] = useState<TestAttempt[]>([]);
  const [testCounts, setTestCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const learnerId = (user as any)?.profileId || user?.id;
    if (!learnerId) return;

    const skills = ["listening", "reading", "writing", "speaking"];

    Promise.all([
      testsApi.getAttemptsByLearnerId(learnerId),
      // Fetch available test counts for each skill in parallel
      ...skills.map(skill =>
        testsApi.getTests({ skill, limit: 1 })
          .then(res => ({ skill, count: res.total ?? res.tests?.length ?? 0 }))
          .catch(() => ({ skill, count: 0 }))
      ),
    ])
      .then(([attemptsData, ...skillResults]) => {
        setAttempts(attemptsData as TestAttempt[]);
        const counts: Record<string, number> = {};
        (skillResults as { skill: string; count: number }[]).forEach(r => {
          counts[r.skill] = r.count;
        });
        setTestCounts(counts);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user]);

  const recentAttempts = attempts.slice(0, 4);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full flex flex-col gap-10">

      <WelcomeHeader userName={user?.fullName || user?.email || ""} />

      <StatOverview attempts={attempts} loading={loading} />

      <div className="flex flex-col gap-6">
        <h2 className="text-xl font-bold">Select Test Module</h2>
        <ModuleGrid testCounts={testCounts} attempts={attempts} loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── Recent Activity ─────────────────────────────────────────────── */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Recent Activity</h2>
            <Link href="/profile">
              <Button variant="ghost" size="sm" className="text-sm text-primary font-medium gap-1">
                View All <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : recentAttempts.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-card border rounded-xl shadow-sm">
              <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground font-medium">No activity yet — take your first test!</p>
              <Link href="/practice">
                <Button size="sm" className="mt-4">Start Practising</Button>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {recentAttempts.map(a => {
                const skill = (a.test as any)?.skill ?? "reading";
                const { bg, text } = skillColors(skill);
                const band = Number(a.bandScore ?? 0);
                const testId = a.testId ?? (a.test as any)?.id;

                return (
                  <div key={a.id} className="flex items-center justify-between p-4 bg-white dark:bg-card border rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`h-10 w-10 rounded-lg ${bg} ${text} flex items-center justify-center flex-shrink-0`}>
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
                          <p className="font-black text-lg leading-none tabular-nums">{band.toFixed(1)}</p>
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

        {/* ── Daily Tip ───────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold">Daily Tip</h2>
          <div className="bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 p-6 rounded-2xl">
            <div className="flex items-center gap-2 mb-3 text-amber-700 dark:text-amber-500">
              <span className="material-symbols-outlined">lightbulb</span>
              <span className="font-bold uppercase tracking-wider text-xs">Reading Tip</span>
            </div>
            <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100 mb-2">Synonyms are key!</h3>
            <p className="text-amber-800 dark:text-amber-200/80 text-sm leading-relaxed">
              In the Reading test, the text will rarely use the exact words from the question.
              Look for synonyms and paraphrasing to find the correct answer.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
