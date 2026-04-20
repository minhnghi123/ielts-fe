"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AvatarUpload } from "@/components/ui/avatar-upload";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { authApi } from "@/lib/api/auth";
import { testsApi } from "@/lib/api/tests";
import type { TestAttempt } from "@/lib/types";
import Link from "next/link";
import {
    CheckCircle2, XCircle, Clock,
    RotateCcw, Eye, Headphones, BookOpen, FileText,
    TrendingUp, Calendar, Trophy,
} from "lucide-react";

const AUTH_API = `${process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function skillIcon(skill: string) {
    if (skill === "listening") return <Headphones className="h-3.5 w-3.5" />;
    if (skill === "reading") return <BookOpen className="h-3.5 w-3.5" />;
    return <FileText className="h-3.5 w-3.5" />;
}

function skillBadgeClass(skill: string) {
    if (skill === "listening") return "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200";
    if (skill === "reading") return "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200";
    return "bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border-slate-200";
}

function bandColor(band: number) {
    if (band >= 8) return "text-emerald-600 dark:text-emerald-400";
    if (band >= 7) return "text-blue-600 dark:text-blue-400";
    if (band >= 6) return "text-amber-500";
    if (band >= 5) return "text-orange-500";
    if (band > 0) return "text-red-500";
    return "text-muted-foreground";
}

/** Normalise timestamps that may lack a Z suffix (prevents UTC+7 offset) */
function toUtcMs(d: string | undefined | null): number | null {
    if (!d) return null;
    const utc = /Z$|[+-]\d{2}:?\d{2}$/.test(d) ? d : d + "Z";
    const ms = new Date(utc).getTime();
    return isNaN(ms) ? null : ms;
}

function formatDuration(startedAt: string, submittedAt?: string): string {
    const start = toUtcMs(startedAt);
    const end = toUtcMs(submittedAt);
    if (!start || !end || end <= start) return "—";
    const sec = Math.floor((end - start) / 1000);
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
}

// ─── Test History Section ─────────────────────────────────────────────────────

function TestHistorySection({ learnerId }: { learnerId: string }) {
    const [attempts, setAttempts] = useState<TestAttempt[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!learnerId) return;
        testsApi.getAttemptsByLearnerId(learnerId)
            .then(data => { setAttempts(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, [learnerId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        );
    }

    if (attempts.length === 0) {
        return (
            <div className="text-center py-16 space-y-3">
                <Trophy className="h-12 w-12 text-muted-foreground/40 mx-auto" />
                <p className="text-muted-foreground font-medium">You haven&apos;t completed any tests yet.</p>
                <Link href="/tests">
                    <Button size="sm" className="mt-2">Start Practising</Button>
                </Link>
            </div>
        );
    }

    const completed = attempts.filter(a => a.submittedAt);
    const avgBand = completed.length > 0
        ? (completed.reduce((s, a) => s + Number(a.bandScore ?? 0), 0) / completed.length)
        : 0;

    return (
        <div className="space-y-4">
            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { label: "Total Attempts", value: attempts.length, icon: FileText, color: "text-primary", bg: "bg-primary/10" },
                    { label: "Completed", value: completed.length, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
                    { label: "Average Band", value: avgBand > 0 ? avgBand.toFixed(1) : "—", icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
                ].map(s => (
                    <Card key={s.label} className="bg-white dark:bg-slate-900 shadow-sm">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${s.bg}`}>
                                <s.icon className={`h-4 w-4 ${s.color}`} />
                            </div>
                            <div>
                                <p className="text-[11px] text-muted-foreground">{s.label}</p>
                                <p className="text-lg font-black leading-none mt-0.5">{s.value}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Attempts table */}
            <Card className="bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-800 text-xs text-muted-foreground uppercase tracking-wide">
                                <tr>
                                    <th className="text-left px-4 py-3 font-semibold">Test</th>
                                    <th className="text-center px-3 py-3 font-semibold">Skill</th>
                                    <th className="text-center px-3 py-3 font-semibold">Date</th>
                                    <th className="text-center px-3 py-3 font-semibold">Time Taken</th>
                                    <th className="text-center px-3 py-3 font-semibold">Band</th>
                                    <th className="text-center px-3 py-3 font-semibold">Status</th>
                                    <th className="text-center px-3 py-3 font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {attempts.map(a => {
                                    const skill = (a.test as any)?.skill ?? "—";
                                    const title = a.test?.title ?? "Practice Test";
                                    const band = Number(a.bandScore ?? 0);
                                    const startMs = toUtcMs(a.startedAt);
                                    const date = startMs
                                        ? new Date(startMs).toLocaleDateString("en-US", {
                                            day: "numeric", month: "short", year: "numeric",
                                        })
                                        : "—";
                                    const dur = formatDuration(a.startedAt, a.submittedAt);
                                    const testId = a.testId;

                                    return (
                                        <tr key={a.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                                            <td className="px-4 py-3">
                                                <p className="font-semibold text-sm text-foreground line-clamp-1">{title}</p>
                                            </td>
                                            <td className="px-3 py-3 text-center">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${skillBadgeClass(skill)}`}>
                                                    {skillIcon(skill)}
                                                    <span className="capitalize">{skill}</span>
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 text-center">
                                                <span className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {date}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 text-center">
                                                <span className="text-xs font-mono text-muted-foreground flex items-center justify-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {dur}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 text-center">
                                                {band > 0 ? (
                                                    <span className={`text-lg font-black tabular-nums ${bandColor(band)}`}>
                                                        {band.toFixed(1)}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">—</span>
                                                )}
                                            </td>
                                            <td className="px-3 py-3 text-center">
                                                {a.submittedAt ? (
                                                    <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-bold">
                                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                                        Completed
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-amber-500 text-xs font-bold">
                                                        <XCircle className="h-3.5 w-3.5" />
                                                        Not submitted
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-3 py-3">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    {a.submittedAt && (
                                                        <Link href={`/practice/${testId}/result?attemptId=${a.id}`}>
                                                            <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs font-semibold gap-1">
                                                                <Eye className="h-3 w-3" />
                                                                Review
                                                            </Button>
                                                        </Link>
                                                    )}
                                                    <Link href={`/practice/${testId}`}>
                                                        <Button size="sm" className="h-7 px-2.5 text-xs font-semibold gap-1">
                                                            <RotateCcw className="h-3 w-3" />
                                                            Retake
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function UserProfilePage() {
    const router = useRouter();
    const { user, setUser, isLoggedIn, loading } = useAuth();
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({ fullName: "", avatarUrl: "" });
    const [activeSection, setActiveSection] = useState<"profile" | "history">("history");

    useEffect(() => {
        if (!loading && !isLoggedIn) router.push("/login");
    }, [loading, isLoggedIn, router]);

    useEffect(() => {
        if (user) setFormData({ fullName: user.fullName || "", avatarUrl: user.avatarUrl || "" });
    }, [user]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setSaving(true);
        try {
            const token = typeof document !== "undefined"
                ? document.cookie.split("; ").find(r => r.startsWith("accessToken="))?.split("=")[1]
                : "";
            const res = await fetch(`${AUTH_API}/auth/profile`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(formData),
            });
            if (!res.ok) throw new Error("Failed");
            const updatedUser = (await res.json()).data;
            setUser(updatedUser);
            authApi.updateStoredUser(updatedUser);
            toast.success("Profile updated successfully");
        } catch {
            toast.error("Failed to save. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const isChanged = user && (user.fullName !== formData.fullName || user.avatarUrl !== formData.avatarUrl);

    if (loading || !user) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            </div>
        );
    }

    const learnerId = (user as any).profileId || user.id;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            {/* Sticky header */}
            <div className="bg-white dark:bg-slate-900 border-b border-border sticky top-0 z-20 shadow-sm">
                <div className="max-w-5xl mx-auto px-4 md:px-8 py-3 flex items-center gap-3">
                    <h1 className="text-base font-bold">My Account</h1>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 space-y-5">

                {/* User info strip */}
                <Card className="bg-white dark:bg-slate-900 shadow-sm">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="flex-shrink-0">
                            <AvatarUpload
                                size="lg"
                                currentAvatarUrl={formData.avatarUrl}
                                fullName={formData.fullName || user.email}
                                onUpload={(url) => setFormData(p => ({ ...p, avatarUrl: url }))}
                            />
                        </div>
                        <div className="min-w-0">
                            <p className="font-bold text-lg leading-none truncate">{user.fullName || user.email}</p>
                            <p className="text-xs text-muted-foreground mt-1 truncate">{user.email}</p>
                            <span className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary capitalize">
                                {user.role}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* Tab navigation */}
                <div className="flex gap-1 border-b border-border">
                    {([
                        { key: "history", label: "Test History" },
                        { key: "profile", label: "Personal Info" },
                    ] as const).map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveSection(tab.key)}
                            className={`px-5 py-2 text-sm font-semibold border-b-2 transition-colors -mb-px ${activeSection === tab.key
                                    ? "border-primary text-primary"
                                    : "border-transparent text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Test History tab */}
                {activeSection === "history" && (
                    <TestHistorySection learnerId={learnerId} />
                )}

                {/* Personal Info tab */}
                {activeSection === "profile" && (
                    <Card className="bg-white dark:bg-slate-900 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base">Personal Information</CardTitle>
                            <CardDescription className="text-xs">Update your display name and profile picture.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSave} className="space-y-5 max-w-md">
                                <div className="space-y-1.5">
                                    <Label htmlFor="email" className="text-xs text-muted-foreground">Email</Label>
                                    <Input id="email" value={user.email} disabled className="bg-muted/50 cursor-not-allowed text-sm h-9" />
                                    <p className="text-[11px] text-muted-foreground">Email address cannot be changed.</p>
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="fullName" className="text-xs font-semibold">Full Name</Label>
                                    <Input
                                        id="fullName"
                                        value={formData.fullName}
                                        onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                        placeholder="Enter your full name"
                                        className="text-sm h-9"
                                    />
                                </div>
                                <div className="pt-3 border-t border-border flex justify-end">
                                    <Button type="submit" size="sm" disabled={saving || !isChanged}>
                                        {saving ? "Saving…" : "Save Changes"}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
