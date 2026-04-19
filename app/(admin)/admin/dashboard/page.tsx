"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { authApi } from "@/lib/api/auth";
import { AvatarUpload } from "@/components/ui/avatar-upload";
import { useAdminGlobalStats, useSyncAll } from "@/lib/hooks/use-analytics";
import { useTests } from "@/lib/hooks/use-tests";
import type { AdminGlobalStats } from "@/lib/types";
import {
  Users, BookOpen, TrendingUp, BarChart3,
  RefreshCw, Award, Activity, Target,
} from "lucide-react";

const AUTH_API = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api`;

// ─── Mini Bar Chart ────────────────────────────────────────────────────────────

function MiniBarChart({ data }: { data: Array<{ date: string; count: number }> }) {
  if (!data?.length) return (
    <p className="text-xs text-muted-foreground text-center py-6">No data yet</p>
  );
  const max = Math.max(...data.map((d) => d.count), 1);
  const last14 = data.slice(-14);
  return (
    <div className="flex items-end gap-0.5 h-16 w-full">
      {last14.map((d, i) => {
        const pct = Math.max(4, Math.round((d.count / max) * 100));
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group relative">
            <div
              className="w-full rounded-sm bg-primary/70 hover:bg-primary transition-colors"
              style={{ height: `${pct}%` }}
              title={`${d.date}: ${d.count} attempts`}
            />
            {i % 7 === 0 && (
              <span className="text-[8px] text-muted-foreground absolute -bottom-4 whitespace-nowrap">
                {d.date.slice(5)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Band Distribution Bar ─────────────────────────────────────────────────────

function BandDistributionBars({ data }: { data: Array<{ range: string; count: number; color: string }> }) {
  if (!data?.length) return (
    <p className="text-xs text-muted-foreground text-center py-4">No graded attempts yet</p>
  );
  const total = data.reduce((s, d) => s + d.count, 0);
  return (
    <div className="space-y-2">
      {data.map((d) => {
        const pct = total > 0 ? Math.round((d.count / total) * 100) : 0;
        return (
          <div key={d.range} className="flex items-center gap-3 text-sm">
            <span className="w-14 text-xs font-medium text-muted-foreground">{d.range}</span>
            <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, backgroundColor: d.color }}
              />
            </div>
            <span className="w-10 text-xs text-right tabular-nums text-muted-foreground">
              {d.count}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Skill Breakdown ─────────────────────────────────────────────────────────

function SkillBreakdownRow({ data }: { data: AdminGlobalStats["skillBreakdown"] }) {
  const COLORS: Record<string, string> = {
    listening: "bg-blue-100 text-blue-700",
    reading: "bg-emerald-100 text-emerald-700",
    writing: "bg-orange-100 text-orange-700",
    speaking: "bg-purple-100 text-purple-700",
  };
  if (!data?.length) return <p className="text-xs text-muted-foreground">No data yet</p>;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {data.map((s) => (
        <div key={s.skill} className={`rounded-xl p-3 ${COLORS[s.skill] ?? "bg-slate-100 text-slate-700"}`}>
          <p className="text-xs font-bold capitalize">{s.skill}</p>
          <p className="text-xl font-black tabular-nums mt-0.5">{s.avgBand.toFixed(1)}</p>
          <p className="text-[10px] opacity-70">{s.totalAttempts} attempts</p>
        </div>
      ))}
    </div>
  );
}

// ─── Admin Dashboard Page ─────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  // ── TanStack Query ─────────────────────────────────────────────────────────
  const { data: stats, isLoading: statsLoading } = useAdminGlobalStats();
  const { data: testsData, isLoading: testsLoading } = useTests({ limit: 1 });
  const syncAllMutation = useSyncAll();

  const loading = statsLoading || testsLoading;
  const totalTests = testsData?.total ?? 0;

  // ── Profile Edit (local UI state only) ────────────────────────────────────
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({ fullName: "", avatarUrl: "" });
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (user) setEditForm({ fullName: user.fullName || "", avatarUrl: user.avatarUrl || "" });
  }, [user]);

  const handleSyncAll = async () => {
    try {
      const result = await syncAllMutation.mutateAsync();
      toast.success(`Synced analytics for ${result.synced ?? "all"} learners`);
    } catch {
      toast.error("Sync failed — please try again");
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("accessToken="))
        ?.split("=")[1];

      const res = await fetch(`${AUTH_API}/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token ?? ""}`,
        },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      const updatedUser = await res.json();
      const newUser = { ...user, ...updatedUser };
      setUser(newUser);
      authApi.updateStoredUser(newUser);
      toast.success("Profile updated successfully");
      setIsEditingProfile(false);
    } catch {
      toast.error("An error occurred while updating profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full flex flex-col gap-8">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">Real-time platform analytics powered by analytics-service</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Sync All Analytics */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncAll}
            disabled={syncAllMutation.isPending}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${syncAllMutation.isPending ? "animate-spin" : ""}`} />
            {syncAllMutation.isPending ? "Syncing…" : "Sync Analytics"}
          </Button>

          {/* Admin Profile */}
          {user && (
            <div className="flex items-center gap-3 bg-muted/50 p-3 rounded-2xl border border-muted">
              <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                <AvatarImage src={user.avatarUrl} alt={user.fullName || user.email} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {(user.fullName || user.email || "A")[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col pr-2">
                <span className="font-semibold text-sm">{user.fullName || "Admin User"}</span>
                <span className="text-xs text-muted-foreground">{user.email}</span>
              </div>
              <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="rounded-full shadow-sm">Edit</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                    <DialogDescription>Update your profile details.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleUpdateProfile} className="space-y-4 pt-4">
                    <div className="space-y-4 pb-4 flex flex-col items-center">
                      <Label className="self-start">Profile Image</Label>
                      <AvatarUpload
                        size="lg"
                        currentAvatarUrl={editForm.avatarUrl}
                        fullName={editForm.fullName}
                        onUpload={(url) => setEditForm((prev) => ({ ...prev, avatarUrl: url }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={editForm.fullName}
                        onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="flex justify-end pt-4">
                      <Button type="submit" disabled={savingProfile}>
                        {savingProfile ? "Saving..." : "Save changes"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Learners"
          value={loading ? "…" : (stats?.totalLearners ?? 0)}
          subtext={`${stats?.completedAttempts ?? 0} completed attempts`}
          icon={<Users className="h-5 w-5" />}
          color="blue"
        />
        <StatCard
          title="Active Tests"
          value={loading ? "…" : totalTests}
          subtext="Available in test library"
          icon={<BookOpen className="h-5 w-5" />}
          color="green"
        />
        <StatCard
          title="Avg. Band Score"
          value={loading ? "…" : (stats?.averageBand?.toFixed(2) ?? "—")}
          subtext={`${stats?.totalAttempts ?? 0} total attempts`}
          icon={<TrendingUp className="h-5 w-5" />}
          color="purple"
        />
        <StatCard
          title="Completion Rate"
          value={loading ? "…" : stats?.totalAttempts
            ? `${Math.round((stats.completedAttempts / stats.totalAttempts) * 100)}%`
            : "—"}
          subtext={`${stats?.completedAttempts ?? 0} / ${stats?.totalAttempts ?? 0} submitted`}
          icon={<Target className="h-5 w-5" />}
          color="orange"
        />
      </div>

      {/* ── Charts Row ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Daily Activity (last 14 days)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2 pb-4">
            {loading ? (
              <div className="h-16 bg-slate-100 rounded animate-pulse" />
            ) : (
              <div className="pb-5">
                <MiniBarChart data={stats?.attemptsPerDay ?? []} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Band Score Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-4 bg-slate-100 rounded animate-pulse" />
                ))}
              </div>
            ) : (
              <BandDistributionBars data={stats?.bandDistribution ?? []} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Skill Breakdown ──────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Skill Breakdown — Platform Average
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <SkillBreakdownRow data={stats?.skillBreakdown ?? []} />
          )}
        </CardContent>
      </Card>

      {/* ── Top Learners + Recent Activity ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-500" />
              Top Learners
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />)}
              </div>
            ) : !stats?.topLearners?.length ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No graded learners yet</p>
            ) : (
              <div className="space-y-3">
                {stats.topLearners.map((l, i) => (
                  <div key={l.learnerId} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`text-xs font-black w-5 text-center ${i === 0 ? "text-amber-500" : i === 1 ? "text-slate-400" : i === 2 ? "text-amber-700" : "text-muted-foreground"}`}>
                        #{i + 1}
                      </span>
                      <Avatar className="h-7 w-7 flex-shrink-0">
                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">
                          {l.email[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium truncate">{l.email}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs tabular-nums">
                        {l.avgBand.toFixed(1)}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">{l.totalAttempts} tests</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Recent Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />)}
              </div>
            ) : !stats?.recentActivity?.length ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No recent activity</p>
            ) : (
              <div className="space-y-3">
                {stats.recentActivity.slice(0, 6).map((act, i) => (
                  <div key={i} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-7 w-7 flex-shrink-0">
                        <AvatarFallback className="text-[10px] bg-muted text-muted-foreground font-medium">
                          {act.email[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{act.email}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{act.testTitle}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 text-right">
                      {act.bandScore != null && (
                        <span className="font-black text-sm tabular-nums text-primary">
                          {act.bandScore.toFixed(1)}
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {new Date(act.submittedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  title, value, subtext, icon, color,
}: {
  title: string;
  value: string | number;
  subtext?: string;
  icon: React.ReactNode;
  color: "blue" | "green" | "purple" | "orange";
}) {
  const colors = {
    blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-600",
    green: "bg-green-50 dark:bg-green-900/20 text-green-600",
    purple: "bg-purple-50 dark:bg-purple-900/20 text-purple-600",
    orange: "bg-orange-50 dark:bg-orange-900/20 text-orange-600",
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-2 rounded-xl ${colors[color]}`}>{icon}</div>
        </div>
        <p className="text-muted-foreground text-sm">{title}</p>
        <p className="text-3xl font-bold mt-1 tabular-nums">{value}</p>
        {subtext && <p className="text-[11px] text-muted-foreground mt-1">{subtext}</p>}
      </CardContent>
    </Card>
  );
}
