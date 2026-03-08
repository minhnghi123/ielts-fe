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

function avgBandForSkill(attempts: TestAttempt[], skill: string): number | null {
  const graded = attempts.filter(
    a => !!a.submittedAt && (a.test as any)?.skill === skill && Number(a.bandScore ?? 0) > 0,
  );
  if (!graded.length) return null;
  return graded.reduce((s, a) => s + Number(a.bandScore ?? 0), 0) / graded.length;
}

function bandColor(band: number | null): string {
  if (!band) return "bg-slate-300";
  if (band >= 7.5) return "bg-emerald-500";
  if (band >= 6) return "bg-blue-500";
  if (band >= 4.5) return "bg-amber-500";
  return "bg-rose-500";
}

// ─── Skill Progress Panel ──────────────────────────────────────────────────────

const SKILLS_META = [
  { id: "listening", label: "Listening", icon: "headphones", accent: "#3b82f6" },
  { id: "reading",   label: "Reading",   icon: "menu_book",  accent: "#8b5cf6" },
  { id: "writing",   label: "Writing",   icon: "edit_note",  accent: "#f97316" },
  { id: "speaking",  label: "Speaking",  icon: "mic",        accent: "#ec4899" },
];

function SkillProgressPanel({ attempts, loading }: { attempts: TestAttempt[]; loading: boolean }) {
  return (
    <div className="bg-white dark:bg-card border rounded-2xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold">Skill Progress</h2>
        <Link href="/analysis" className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">
          Full Analysis <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {SKILLS_META.map(({ id, label, icon }) => {
          const band = avgBandForSkill(attempts, id);
          const pct = band ? Math.round((band / 9) * 100) : 0;
          const count = attempts.filter(a => (a.test as any)?.skill === id && !!a.submittedAt).length;
          return (
            <div key={id} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-muted-foreground">{icon}</span>
                  <span className="text-sm font-semibold">{label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {loading ? (
                    <div className="h-4 w-8 bg-slate-200 rounded animate-pulse" />
                  ) : band ? (
                    <span className="text-sm font-black tabular-nums">{band.toFixed(1)}</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </div>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                {!loading && (
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${bandColor(band)}`}
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

function skillColors(skill: string) {
  if (skill === "listening") return { bg: "bg-blue-100 dark:bg-blue-900/20", text: "text-blue-600 dark:text-blue-400" };
  if (skill === "reading") return { bg: "bg-emerald-100 dark:bg-emerald-900/20", text: "text-emerald-600 dark:text-emerald-400" };
  if (skill === "writing") return { bg: "bg-orange-100 dark:bg-orange-900/20", text: "text-orange-600 dark:text-orange-400" };
  return { bg: "bg-purple-100 dark:bg-purple-900/20", text: "text-purple-600 dark:text-purple-400" };
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
          .then(res => ({ skill, count: res.total ?? res.data?.length ?? 0 }))
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

      <SkillProgressPanel attempts={attempts} loading={loading} />

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

        {/* ── AI Advisor + Daily Tip ──────────────────────────────────────── */}
        <div className="flex flex-col gap-4">
          {/* AI Advisor CTA */}
          <div className="bg-gradient-to-br from-violet-500 to-purple-700 rounded-2xl p-5 text-white shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-[20px]">smart_toy</span>
              <span className="font-bold uppercase tracking-wider text-xs opacity-80">AI Study Coach</span>
            </div>
            <h3 className="text-base font-bold mb-1">Get your personalised plan</h3>
            <p className="text-sm opacity-80 leading-relaxed mb-4">
              Our AI analyses your test results and builds a custom roadmap to reach your target band score.
            </p>
            <Link
              href="/ai-advisor"
              className="inline-flex items-center gap-2 bg-white text-purple-700 text-sm font-bold px-4 py-2 rounded-lg hover:bg-purple-50 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
              Chat with AI Coach
            </Link>
          </div>

          {/* Daily Tip — driven by weakest skill */}
          {(() => {
            const weakest = SKILLS_META.map(s => ({
              ...s,
              band: avgBandForSkill(attempts, s.id),
            })).filter(s => s.band !== null).sort((a, b) => (a.band ?? 9) - (b.band ?? 9))[0];
            const tips: Record<string, { title: string; body: string }> = {
              listening: { title: "Focus on keywords", body: "Before the recording plays, read each question carefully and underline key words. Predict the type of answer (number, name, adjective) you need." },
              reading:   { title: "Synonyms are key!", body: "The passage will rarely use the exact words from the question. Train yourself to spot synonyms and paraphrasing — that's where the answer hides." },
              writing:   { title: "Structure every essay", body: "Always plan for 5 minutes before writing. A clear Introduction → Body 1 → Body 2 → Conclusion structure can lift your Task Achievement score by a full band." },
              speaking:  { title: "Extend your answers", body: "Avoid one-word replies. Use the PEEL method: Point → Example → Explanation → Link back. This naturally increases your fluency and coherence scores." },
            };
            const skill = weakest?.id ?? "reading";
            const tip = tips[skill];
            return (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 p-5 rounded-2xl">
                <div className="flex items-center gap-2 mb-3 text-amber-700 dark:text-amber-500">
                  <span className="material-symbols-outlined text-[18px]">lightbulb</span>
                  <span className="font-bold uppercase tracking-wider text-xs capitalize">
                    {skill} Tip
                  </span>
                </div>
                <h3 className="text-base font-bold text-amber-900 dark:text-amber-100 mb-1.5">{tip.title}</h3>
                <p className="text-amber-800 dark:text-amber-200/80 text-sm leading-relaxed">{tip.body}</p>
              </div>
            );
          })()}
        </div>

      </div>
    </div>
  );
}
