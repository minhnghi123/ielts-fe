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
      iconColor: "text-purple-600 dark:text-purple-400",
      iconBg: "bg-purple-50 dark:bg-purple-900/20",
    },
    {
      title: "Average Band Score",
      value: loading ? "…" : avgBand > 0 ? avgBand.toFixed(1) : "—",
      trend: avgBand > 0 ? (avgBand >= 7 ? "Great progress!" : "Keep practising") : "Submit a test",
      icon: "grade",
      iconColor: "text-orange-600 dark:text-orange-400",
      iconBg: "bg-orange-50 dark:bg-orange-900/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map((stat, index) => (
        <Card key={index} className="shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div className={`p-2 rounded-lg ${stat.iconBg} ${stat.iconColor}`}>
                <span className="material-symbols-outlined">{stat.icon}</span>
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-muted-foreground">
                {stat.trend}
              </span>
            </div>
            <p className="text-muted-foreground text-sm font-medium mt-3">{stat.title}</p>
            <p className="text-2xl font-bold mt-1">{stat.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
