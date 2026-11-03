"use client";

import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/lib/api/analytics";
import { useAuth } from "@/contexts/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Trophy, Medal } from "lucide-react";

function bandColor(band: number) {
  if (band >= 7.5) return "text-emerald-600";
  if (band >= 6) return "text-blue-600";
  if (band >= 4.5) return "text-amber-600";
  return "text-rose-600";
}

export default function RankingsPage() {
  const { isLoggedIn, loading } = useAuth();
  const { data, isLoading, error } = useQuery({
    queryKey: ["analytics", "leaderboard"],
    queryFn: () => analyticsApi.getLeaderboard(50),
    enabled: isLoggedIn,
    staleTime: 60_000,
  });

  if (!loading && !isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center gap-4">
        <Trophy className="h-12 w-12 text-primary" />
        <h1 className="text-3xl font-bold">Leaderboard</h1>
        <p className="text-muted-foreground max-w-md">Sign in to see how your average band compares with other learners.</p>
        <Link href="/login?next=/rankings"><Button>Sign in</Button></Link>
      </div>
    );
  }

  const me = data?.find((e) => e.isMe);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-primary p-8 text-white">
        <h1 className="font-display text-3xl font-bold tracking-tight mb-1">Leaderboard</h1>
        <p className="text-blue-100 text-sm">
          Ranked by average band across submitted tests. Only your display name is shown to others.
        </p>
        {me && (
          <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-semibold">
            <Medal className="h-4 w-4" /> You are #{me.rank} · avg {me.avgBand.toFixed(1)}
          </p>
        )}
      </div>

      {isLoading || loading ? (
        <div className="space-y-2" aria-busy="true">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : error ? (
        <p className="text-center text-destructive py-10">Could not load the leaderboard. Please try again later.</p>
      ) : !data || data.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <p className="font-medium">No ranked learners yet</p>
          <p className="text-sm text-muted-foreground">Finish a test to claim the first spot.</p>
          <Link href="/tests"><Button variant="outline">Browse tests</Button></Link>
        </div>
      ) : (
        <ol className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
          {data.map((e) => (
            <li
              key={e.learnerId}
              className={`flex items-center gap-4 px-4 py-3 ${e.isMe ? "bg-primary/5" : ""}`}
              aria-current={e.isMe ? "true" : undefined}
            >
              <span className={`w-8 text-center font-black tabular-nums ${e.rank <= 3 ? "text-amber-500 text-lg" : "text-muted-foreground"}`}>
                {e.rank}
              </span>
              <Avatar className="h-9 w-9">
                {e.avatarUrl && <AvatarImage src={e.avatarUrl} alt="" />}
                <AvatarFallback>{e.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">
                  {e.displayName} {e.isMe && <span className="text-xs text-primary font-medium">(you)</span>}
                </p>
                <p className="text-xs text-muted-foreground">{e.totalAttempts} test{e.totalAttempts === 1 ? "" : "s"} · best {e.bestBand.toFixed(1)}</p>
              </div>
              <span className={`text-xl font-black tabular-nums ${bandColor(e.avgBand)}`}>{e.avgBand.toFixed(1)}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
