/* eslint-disable @typescript-eslint/no-explicit-any -- aggregated progress payload from classroom/analytics services */
"use client";
import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { classroomApi } from "@/lib/api/classroom";
import { Skeleton } from "@/components/ui/skeleton";
import { BandPill, EmptyState, PageHeader, SkillBadge, StatCard, SubmissionStatusBadge, formatDateTime } from "../../../../../_components/shared";

const SKILLS = ["listening", "reading", "writing", "speaking"] as const;

export default function StudentProgressPage({ params }: { params: Promise<{ id: string; learnerId: string }> }) {
  const { id, learnerId } = use(params);
  const { data, isLoading } = useQuery({ queryKey: ["class", id, "student", learnerId], queryFn: () => classroomApi.studentProgress(id, learnerId) });
  if (isLoading) return <div className="p-8 space-y-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-64" /></div>;
  if (!data) return <div className="p-8"><EmptyState icon="error" title="Student not found" /></div>;
  const learner = data.learner ?? {};
  const bands: Record<string, number | null> = data.bandBySkill ?? data.analytics?.bandBySkill ?? {};
  const subs: any[] = data.submissions ?? [];
  const weaknesses: string[] = data.analytics?.weaknesses ?? data.weaknesses ?? [];
  const recent: any[] = data.analytics?.recentAttempts ?? [];
  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <PageHeader back={{ href: `/teacher/classes/${id}`, label: "Back to class" }} title={learner.fullName || learner.email || "Student"} subtitle={`${learner.email ?? ""}${learner.currentLevel ? ` · level ${learner.currentLevel}` : ""}${data.member?.joinedAt ? ` · joined ${formatDateTime(data.member.joinedAt)}` : ""}`} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {SKILLS.map((s) => <StatCard key={s} icon={{ listening: "headphones", reading: "menu_book", writing: "edit_note", speaking: "mic" }[s]} label={s[0].toUpperCase() + s.slice(1)} value={bands[s] != null ? Number(bands[s]).toFixed(1) : "—"} hint="latest band in this class" />)}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <h2 className="font-semibold mb-3">Class assignments</h2>
          {subs.length === 0 ? <EmptyState icon="assignment" title="No submissions yet" /> : (
            <div className="rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50"><tr><th className="text-left p-3">Assignment</th><th className="text-left p-3">Status</th><th className="text-left p-3">Submitted</th><th className="text-left p-3">Band</th></tr></thead>
                <tbody>
                  {subs.map((s: any) => (
                    <tr key={s.assignmentId ?? s.id} className="border-t">
                      <td className="p-3"><div className="flex items-center gap-2"><SkillBadge skill={s.skill} /><span className="font-medium">{s.title}</span></div></td>
                      <td className="p-3"><SubmissionStatusBadge status={s.status ?? "missing"} /></td>
                      <td className="p-3 text-muted-foreground">{formatDateTime(s.submittedAt)}</td>
                      <td className="p-3">{s.submissionId ? <Link href={`/teacher/classes/${id}/submissions/${s.submissionId}`} className="hover:underline"><BandPill band={s.finalBand} reviewed={s.reviewed} /></Link> : <BandPill band={s.finalBand} />}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        <aside className="space-y-4">
          <div className="rounded-xl border bg-card p-4">
            <h3 className="font-semibold mb-2">Weak areas</h3>
            {weaknesses.length === 0 ? <p className="text-sm text-muted-foreground">Not enough data yet.</p> : <ul className="text-sm space-y-1 list-disc pl-4">{weaknesses.map((w, i) => <li key={i}>{typeof w === "string" ? w : (w as any).label ?? JSON.stringify(w)}</li>)}</ul>}
          </div>
          <div className="rounded-xl border bg-card p-4">
            <h3 className="font-semibold mb-2">Recent practice (all tests)</h3>
            {recent.length === 0 ? <p className="text-sm text-muted-foreground">No recent activity.</p> : <ul className="text-sm space-y-2">{recent.slice(0, 6).map((r: any, i: number) => <li key={r.id ?? i} className="flex items-center justify-between gap-2"><span className="truncate">{r.testTitle ?? r.title ?? r.skill}</span><BandPill band={r.bandScore ?? r.band} /></li>)}</ul>}
          </div>
        </aside>
      </div>
    </div>
  );
}
