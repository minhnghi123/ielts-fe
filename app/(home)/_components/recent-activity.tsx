"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { attemptsApi } from "@/lib/api/attempts";
import type { TestAttempt } from "@/lib/types";

const SKILL_COLORS: Record<string, string> = {
  reading: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  listening: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  writing: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  speaking: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
};

// Optional: removed PLACEHOLDER_ROWS to prevent fake data being shown

export function RecentActivity() {
  const { user, isLoggedIn, loading: authLoading } = useAuth();
  const [attempts, setAttempts] = useState<TestAttempt[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isLoggedIn && user?.profileId) {
      setLoading(true);
      attemptsApi
        .getAttemptsByLearner(user.profileId)
        .then((data) => setAttempts(data.slice(0, 5)))
        .catch(() => setAttempts([]))
        .finally(() => setLoading(false));
    }
    // console.log(attempts.length  );
  }, [isLoggedIn, user?.profileId]);

  if (authLoading) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold">Recent Activity</h2>
        {isLoggedIn && (
          <Link href="/analysis" className="text-primary text-sm font-bold hover:underline">
            View All History
          </Link>
        )}
      </div>

      <Card className="overflow-hidden border-border bg-white dark:bg-[#151c2a]">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 bg-muted rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase">Test</th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase hidden sm:table-cell">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase">Skill</th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoggedIn ? (
                attempts.length > 0 ? (
                  attempts.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 font-semibold text-sm">
                        <Link href={`/practice/${a.testId}/result?attemptId=${a.id}`} className="hover:text-primary">
                          {a.test?.title}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground hidden sm:table-cell">
                        {a.submittedAt ? new Date(a.submittedAt).toLocaleDateString() : new Date(a.startedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <Badge className="bg-primary/10 text-primary border-0 text-xs">
                          {a.test?.skill}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 font-bold text-primary">
                        {/* {a.bandScore ? a.bandScore.toFixed(1) : a.rawScore ?? "—"} */}
                        {a.bandScore}
                      </td>
                    </tr>
                  ))
                  
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                      No attempts yet.{" "}
                      <Link href="/tests" className="text-primary font-medium hover:underline">
                        Start your first practice test!
                      </Link>
                    </td>
                  </tr>
                )
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                    <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">lock</span>
                    <p className="mb-2">Activity history is available for registered users.</p>
                    <Link href="/login" className="text-primary font-medium hover:underline">
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
          <Link href="/login" className="text-primary font-medium hover:underline">Sign in</Link> to see your real activity
        </p>
      )}
    </div>
  );
}
