"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { authApi } from "@/lib/api/auth";

const AUTH_API = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api`;
const TEST_API = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api`;
const STATS_API = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/stats`;

export default function AdminDashboardPage() {
  const { user, setUser } = useAuth();
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [totalTests, setTotalTests] = useState<number | null>(null);
  const [avgScore, setAvgScore] = useState<number | string | null>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({ fullName: "", avatarUrl: "" });
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const [usersRes, testsRes, avgRes, activityRes] = await Promise.all([
          fetch(`${AUTH_API}/auth/users?limit=1`).then(r => r.json().catch(() => ({}))),
          fetch(`${TEST_API}/tests?limit=1`).then(r => r.json().catch(() => ({}))),
          fetch(`${STATS_API}/global`).then(r => r.json().catch(() => ({ averageScore: "0.0" }))),
          fetch(`${STATS_API}/recent-activity`).then(r => r.json().catch(() => []))
        ]);

        setTotalUsers(usersRes.total ?? 0);
        setTotalTests(testsRes.total ?? 0);
        setAvgScore(avgRes.averageScore ?? "0.0");
        setRecentActivity(Array.isArray(activityRes) ? activityRes : []);
      } catch (err) {
        console.error("Failed to load dashboard stats", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Update form fields when user changes
  useEffect(() => {
    if (user) {
      setEditForm({
        fullName: user.fullName || "",
        avatarUrl: user.avatarUrl || "",
      });
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch(`${AUTH_API}/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authApi.getStoredUser() ? (document.cookie.split('; ').find(row => row.startsWith('accessToken='))?.split('=')[1]) : ''}`,
        },
        body: JSON.stringify(editForm),
      });

      if (!res.ok) throw new Error("Failed to update profile");

      const updatedUser = await res.json();
      setUser({ ...user, ...updatedUser }); // update context

      toast.success("Profile updated successfully");
      setIsEditingProfile(false);
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while updating profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    if (!dateStr) return "Just now";
    const date = new Date(dateStr);
    const diffInSeconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 60) return `${diffInSeconds} secs ago`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} mins ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    return `${Math.floor(diffInHours / 24)} days ago`;
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage users, tests, and monitor system performance
          </p>
        </div>

        {/* Profile Summary & Edit */}
        {user && (
          <div className="flex items-center gap-4 bg-muted/50 p-3 rounded-2xl border border-muted">
            <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
              <AvatarImage src={user.avatarUrl} alt={user.fullName || user.email} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                {(user.fullName || user.email || "A")[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col pr-4">
              <span className="font-semibold">{user.fullName || "Admin User"}</span>
              <span className="text-xs text-muted-foreground">{user.email}</span>
            </div>

            <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-full shadow-sm ml-2">
                  Edit Profile
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Edit Profile</DialogTitle>
                  <DialogDescription>
                    Update your application profile details here. Click save when you&apos;re done.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleUpdateProfile} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={editForm.fullName}
                      onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="avatarUrl">Avatar URL</Label>
                    <Input
                      id="avatarUrl"
                      type="url"
                      value={editForm.avatarUrl}
                      onChange={(e) => setEditForm({ ...editForm, avatarUrl: e.target.value })}
                      placeholder="https://example.com/avatar.png"
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={loading || totalUsers === null ? "..." : totalUsers}
          trend="+12%"
          icon="group"
          color="blue"
        />
        <StatCard
          title="Active Tests"
          value={loading || totalTests === null ? "..." : totalTests}
          trend="+8"
          icon="assignment"
          color="green"
        />
        <StatCard
          title="Avg. Score"
          value={loading || avgScore === null ? "..." : avgScore}
          trend="+0.3"
          icon="grade"
          color="purple"
        />
        <StatCard
          title="Revenue"
          value="$0"
          trend="0%"
          icon="payments"
          color="orange"
          subtext="Coming soon"
        />
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent User Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <p className="text-sm text-muted-foreground p-4">Loading activity...</p>
            ) : recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4">No recent activity found.</p>
            ) : (
              recentActivity.map((act) => (
                <ActivityItem
                  key={act.attemptId}
                  user={act.email || "Unknown User"}
                  action={`Completed ${act.testTitle || "Mock Test"}`}
                  time={formatTimeAgo(act.submittedAt || act.startedAt)}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value, trend, icon, color }: any) {
  const colors: any = {
    blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-600",
    green: "bg-green-50 dark:bg-green-900/20 text-green-600",
    purple: "bg-purple-50 dark:bg-purple-900/20 text-purple-600",
    orange: "bg-orange-50 dark:bg-orange-900/20 text-orange-600",
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className={`p-2 rounded-lg ${colors[color]}`}>
            <span className="material-symbols-outlined">{icon}</span>
          </div>
          <span className="text-green-600 bg-green-100 dark:bg-green-900/30 text-xs font-bold px-2 py-1 rounded-full">
            {trend}
          </span>
        </div>
        <p className="text-muted-foreground text-sm mt-4">{title}</p>
        <p className="text-3xl font-bold mt-1">{value}</p>
      </CardContent>
    </Card>
  );
}

function ActivityItem({ user, action, time }: any) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-muted text-muted-foreground font-medium text-xs">
            {user.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium">{user}</p>
          <p className="text-xs text-muted-foreground">{action}</p>
        </div>
      </div>
      <span className="text-xs text-muted-foreground">{time}</span>
    </div>
  );
}
