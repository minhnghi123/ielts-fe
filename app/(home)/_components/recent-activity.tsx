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

// Guest placeholder rows
const PLACEHOLDER_ROWS = [
  { name: "Mock Test #14", date: "Oct 24, 2023", skill: "listening", score: "8.5" },
  { name: "Daily Exercise #112", date: "Oct 22, 2023", skill: "reading", score: "7.0" },
  { name: "Speaking Drill", date: "Oct 21, 2023", skill: "speaking", score: "7.5" },
  { name: "Full Mock Exam A", date: "Oct 18, 2023", skill: "writing", score: "7.5" },
];

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
                          Test #{a.testId.slice(0, 8)}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground hidden sm:table-cell">
                        {a.submittedAt ? new Date(a.submittedAt).toLocaleDateString() : new Date(a.startedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <Badge className="bg-primary/10 text-primary border-0 text-xs">
                          Practice
                        </Badge>
                      </td>
                      <td className="px-6 py-4 font-bold text-primary">
                        {a.bandScore ? a.bandScore.toFixed(1) : a.rawScore ?? "—"}
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
                /* Guest placeholder rows */
                PLACEHOLDER_ROWS.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors opacity-60">
                    <td className="px-6 py-4 font-semibold text-sm">{row.name}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground hidden sm:table-cell">{row.date}</td>
                    <td className="px-6 py-4">
                      <span className={`${SKILL_COLORS[row.skill]} px-3 py-1 rounded-full text-xs font-medium capitalize`}>
                        {row.skill}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-primary">{row.score}</td>
                  </tr>
                ))
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
