"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { useAuthStore } from "@/stores/auth-store";
import { useAttemptsByLearner } from "@/lib/hooks/use-attempts";

export function RecentActivity() {
  const user = useAuthStore((s) => s.user);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const loading = useAuthStore((s) => s.loading);

  const { data: attempts = [], isLoading: attemptsLoading } = useAttemptsByLearner(
    isLoggedIn ? (user?.profileId ?? user?.id) : undefined,
  );

  const recentAttempts = attempts.slice(0, 5);

  if (loading) return null;

  return (
    <motion.div
      className="flex flex-col gap-4"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1, ease: "easeOut" }}
    >
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold">Recent Activity</h2>
        {isLoggedIn && (
          <Link
            href="/analysis"
            className="text-zinc-900 text-sm font-semibold underline underline-offset-2 hover:text-zinc-600 transition-colors duration-150"
          >
            View All History
          </Link>
        )}
      </div>

      <Card className="overflow-hidden border-zinc-200">
        {attemptsLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 bg-zinc-100 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase">Test</th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase hidden sm:table-cell">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase">Skill</th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoggedIn ? (
                recentAttempts.length > 0 ? (
                  recentAttempts.map((a) => (
                    <tr key={a.id} className="hover:bg-zinc-50 transition-colors duration-100">
                      <td className="px-6 py-4 font-semibold text-sm">
                        <Link
                          href={`/practice/${a.testId}/result?attemptId=${a.id}`}
                          className="hover:text-zinc-600 hover:underline transition-colors duration-150"
                        >
                          {a.test?.title}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground hidden sm:table-cell">
                        {a.submittedAt
                          ? new Date(a.submittedAt).toLocaleDateString()
                          : new Date(a.startedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                          a.test?.skill === "listening" ? "bg-blue-100 text-blue-700" :
                          a.test?.skill === "reading"   ? "bg-emerald-100 text-emerald-700" :
                          a.test?.skill === "writing"   ? "bg-amber-100 text-amber-700" :
                          a.test?.skill === "speaking"  ? "bg-violet-100 text-violet-700" :
                          "bg-muted text-muted-foreground"
                        }`}>
                          {a.test?.skill}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-primary tabular-nums">{a.bandScore}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                      No attempts yet.{" "}
                      <Link href="/tests" className="text-zinc-900 font-medium hover:underline">
                        Start your first practice test!
                      </Link>
                    </td>
                  </tr>
                )
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                    <span className="material-symbols-outlined text-4xl text-zinc-300 block mb-2">lock</span>
                    <p className="mb-2">Activity history is available for registered users.</p>
                    <Link href="/login" className="text-zinc-900 font-medium hover:underline">
                      Sign in to track your progress
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </Card>

      {!isLoggedIn && (
        <p className="text-center text-sm text-muted-foreground mt-2">
          <Link href="/login" className="text-zinc-900 font-medium hover:underline">Sign in</Link>{" "}
          to see your real activity
        </p>
      )}
    </motion.div>
  );
}
