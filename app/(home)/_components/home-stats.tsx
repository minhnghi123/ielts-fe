"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/auth-context";
import { analyticsApi } from "@/lib/api/analytics";
import type { DashboardSummary } from "@/lib/types";

// Static numbers shown to guests
const GUEST_STATS = [
  { title: "Students Enrolled", value: "10,000+", badge: "Growing fast" },
  { title: "Practice Tests", value: "500+", badge: "Updated weekly" },
  { title: "Avg Band Improvement", value: "+1.5", badge: "In 3 months" },
];

export function HomeStats() {
  const { user, isLoggedIn, loading: authLoading } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    if (isLoggedIn && user?.profileId) {
      setStatsLoading(true);
      analyticsApi
        .getDashboardSummary(user.profileId)
        .then((data) => setSummary(data))
        .catch(() => setSummary(null))
        .finally(() => setStatsLoading(false));
    }
  }, [isLoggedIn, user?.profileId]);

  if (authLoading) return null;

  return (
    <section className="mb-10">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">analytics</span>
        {isLoggedIn ? "Your Stats" : "Platform Stats"}
      </h2>

      {isLoggedIn ? (
        /* ── Real learner stats ─────────────────────────────── */
        statsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="h-4 bg-muted rounded w-1/2 mb-4" />
                <div className="h-8 bg-muted rounded w-1/3" />
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Tests Completed"
              value={String(summary?.totalAttempts ?? 0)}
              badge="Total attempts"
            />
            <StatCard
              title="Avg. Band Score"
              value={
                summary?.averageBand ? summary.averageBand.toFixed(1) : "—"
              }
              badge="Overall band"
              isPrimary
            />
            <StatCard
              title="Practice Hours"
              value={summary?.practiceHours ? `${summary.practiceHours}h` : "—"}
              badge="Time invested"
            />
            <Card className="p-6 border-border shadow-sm bg-white dark:bg-[#151c2a]">
              <p className="text-muted-foreground text-sm font-medium mb-1">
                Exam Readiness
              </p>
              <div className="flex flex-col gap-2 mt-2">
                <div className="flex justify-between items-end">
                  <p className="text-3xl font-bold">
                    {summary?.examReadiness ?? 0}%
                  </p>
                </div>
                <Progress value={summary?.examReadiness ?? 0} className="h-2" />
              </div>
            </Card>
          </div>
        )
      ) : (
        /* ── Guest marketing stats ──────────────────────────── */
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {GUEST_STATS.map((s) => (
            <StatCard key={s.title} title={s.title} value={s.value} badge={s.badge} />
          ))}
        </div>
      )}
    </section>
  );
}

function StatCard({
  title,
  value,
  badge,
  isPrimary,
}: {
  title: string;
  value: string;
  badge: string;
  isPrimary?: boolean;
}) {
  return (
    <Card className="p-6 border-border shadow-sm bg-white dark:bg-[#151c2a]">
      <p className="text-muted-foreground text-sm font-medium mb-1">{title}</p>
      <div className="flex items-end justify-between mt-1">
        <p className={`text-3xl font-bold ${isPrimary ? "text-primary" : ""}`}>
          {value}
        </p>
        <span className="text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap">
          {badge}
        </span>
      </div>
    </Card>
  );
}
