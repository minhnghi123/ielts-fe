"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { TestAttempt } from "@/lib/types";

interface Props {
  attempts: TestAttempt[];
  loading: boolean;
}

export function StatOverview({ attempts, loading }: Props) {
  const completed = attempts.filter(a => !!a.submittedAt);
  const gradedAttempts = completed.filter(a => Number(a.bandScore ?? 0) > 0);

  const avgBand =
    gradedAttempts.length > 0
      ? gradedAttempts.reduce((s, a) => s + Number(a.bandScore ?? 0), 0) / gradedAttempts.length
      : 0;

  const highestBand =
    gradedAttempts.length > 0
      ? Math.max(...gradedAttempts.map(a => Number(a.bandScore ?? 0)))
      : 0;

  // "Overall Readiness" — derived from graded tests:
  //   0 tests → "—"  |  avgBand 0–5 → "Developing"  |  5–7 → "Good"  |  7+ → "High"
  const readiness =
    gradedAttempts.length === 0 ? "—" :
    avgBand >= 7 ? "High" :
    avgBand >= 5 ? "Good" :
                  "Developing";

  const stats = [
    {
      title: "Overall Readiness",
      value: loading ? "…" : readiness,
      trend: gradedAttempts.length > 0 ? `${gradedAttempts.length} graded` : "Start a test",
      icon: "monitoring",
      iconColor: "text-blue-600 dark:text-blue-400",
      iconBg: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      title: "Tests Completed",
      value: loading ? "…" : String(completed.length),
      trend: attempts.length > completed.length ? `+${attempts.length - completed.length} in progress` : "All done",
      icon: "assignment_turned_in",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      iconBg: "bg-emerald-50 dark:bg-emerald-900/20",
    },
    {
      title: "Average Band Score",
      value: loading ? "…" : avgBand > 0 ? avgBand.toFixed(1) : "—",
      trend: avgBand > 0 ? (avgBand >= 7 ? "Great progress!" : "Keep practising") : "Submit a test",
      icon: "grade",
      iconColor: "text-amber-600 dark:text-amber-400",
      iconBg: "bg-amber-50 dark:bg-amber-900/20",
    },
    {
      title: "Highest Band Score",
      value: loading ? "…" : highestBand > 0 ? highestBand.toFixed(1) : "—",
      trend: highestBand > 0 ? `Personal best` : "No graded tests",
      icon: "emoji_events",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      iconBg: "bg-emerald-50 dark:bg-emerald-900/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <Card key={index} className="rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className={`p-2.5 rounded-xl ${stat.iconBg} ${stat.iconColor}`}>
                <span className="material-symbols-outlined">{stat.icon}</span>
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-muted text-muted-foreground">
                {stat.trend}
              </span>
            </div>
            <p className="text-muted-foreground text-sm font-medium mt-3">{stat.title}</p>
            <p className="font-display text-2xl font-bold tabular-nums text-foreground mt-1">{stat.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
