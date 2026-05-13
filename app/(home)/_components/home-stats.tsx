"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/auth-context";
import { analyticsApi } from "@/lib/api/analytics";
import type { DashboardSummary } from "@/lib/types";

const GUEST_STATS = [
  { title: "Students Enrolled", value: "10,000+", badge: "Growing fast" },
  { title: "Practice Tests", value: "500+", badge: "Updated weekly" },
  { title: "Avg Band Improvement", value: "+1.5", badge: "In 3 months" },
];

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
} as const;

export function HomeStats() {
  const { user, isLoggedIn, loading: authLoading } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    const learnerId = (user as any)?.profileId || user?.id;
    if (isLoggedIn && learnerId) {
      setStatsLoading(true);
      analyticsApi
        .getDashboardSummary(learnerId)
        .then((data) => setSummary(data))
        .catch(() => setSummary(null))
        .finally(() => setStatsLoading(false));
    }
  }, [isLoggedIn, user?.profileId]);

  if (authLoading) return null;

  return (
    <section className="mb-10">
      <h2 className="font-display text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
        <span className="material-symbols-outlined text-zinc-400">analytics</span>
        {isLoggedIn ? "Your Stats" : "Platform Stats"}
      </h2>

      {isLoggedIn ? (
        statsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-6 space-y-3">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-8 w-1/3" />
              </Card>
            ))}
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            variants={container}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={item}>
              <StatCard title="Tests Completed" value={String(summary?.totalAttempts ?? 0)} badge="Total attempts" />
            </motion.div>
            <motion.div variants={item}>
              <StatCard title="Avg. Band Score" value={summary?.averageBand ? summary.averageBand.toFixed(1) : "—"} badge="Overall band" />
            </motion.div>
            <motion.div variants={item}>
              <StatCard title="Practice Hours" value={summary?.practiceHours ? `${summary.practiceHours}h` : "—"} badge="Time invested" />
            </motion.div>
            <motion.div variants={item}>
              <Card className="p-6 border-zinc-200 hover:border-zinc-300 transition-colors duration-150 bg-card">
                <p className="text-muted-foreground text-sm font-medium mb-1">Exam Readiness</p>
                <div className="flex flex-col gap-2 mt-2">
                  <div className="flex justify-between items-end">
                    <p className="text-3xl font-bold tabular-nums">{summary?.examReadiness ?? 0}%</p>
                  </div>
                  <Progress value={summary?.examReadiness ?? 0} className="h-1.5" />
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )
      ) : (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          variants={container}
          initial="hidden"
          animate="visible"
        >
          {GUEST_STATS.map((s) => (
            <motion.div key={s.title} variants={item}>
              <StatCard title={s.title} value={s.value} badge={s.badge} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </section>
  );
}

function StatCard({ title, value, badge }: { title: string; value: string; badge: string }) {
  return (
    <Card className="p-6 border-zinc-200 hover:border-zinc-300 transition-colors duration-150 bg-card">
      <p className="text-muted-foreground text-sm font-medium mb-1">{title}</p>
      <div className="flex items-end justify-between mt-1">
        <p className="font-display text-3xl font-bold tabular-nums text-zinc-950">{value}</p>
        <p className="text-xs text-zinc-400">{badge}</p>
      </div>
    </Card>
  );
}
