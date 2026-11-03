"use client";
import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { classroomApi } from "@/lib/api/classroom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AssignmentStatusBadge, BandPill, EmptyState, PageHeader, SkillBadge, StatCard, SubmissionStatusBadge, formatDateTime, relativeDue } from "../../../../../_components/shared";

export default function AssignmentDetailPage({ params }: { params: Promise<{ id: string; aid: string }> }) {
  const { id, aid } = use(params);
  const qc = useQueryClient();
  const router = useRouter();
  const { data, isLoading } = useQuery({ queryKey: ["class", id, "assignment", aid, "submissions"], queryFn: () => classroomApi.listSubmissions(id, aid) });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["class", id] });
  const release = useMutation({ mutationFn: () => classroomApi.releaseResults(id, aid), onSuccess: invalidate });
  const sync = useMutation({ mutationFn: () => classroomApi.syncAssignment(id, aid), onSuccess: invalidate });
  const archive = useMutation({ mutationFn: () => classroomApi.updateAssignment(id, aid, { status: "archived" }), onSuccess: () => { invalidate(); router.push(`/teacher/classes/${id}`); } });
  const remove = useMutation({ mutationFn: () => classroomApi.deleteAssignment(id, aid), onSuccess: () => { invalidate(); router.push(`/teacher/classes/${id}`); } });

  if (isLoading) return <div className="p-8 space-y-4"><Skeleton className="h-10 w-72" /><Skeleton className="h-64" /></div>;
  if (!data) return <div className="p-8"><EmptyState icon="error" title="Assignment not found" /></div>;
  const { assignment: a, submissions } = data;
  const submitted = submissions.filter((s) => s.status !== "missing" && s.status !== "in_progress").length;

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <PageHeader
        back={{ href: `/teacher/classes/${id}`, label: "Back to class" }}
        title={a.title}
        subtitle={`${a.testSnapshot?.title ?? ""} · ${a.mode} · due ${formatDateTime(a.dueAt)} (${relativeDue(a.dueAt)})`}
        actions={
          <>
            {a.resultPolicy === "manual" && !a.resultsReleasedAt && <Button onClick={() => release.mutate()} disabled={release.isPending}><span className="material-symbols-outlined text-[18px] mr-1">campaign</span>Release results</Button>}
            <Button variant="outline" onClick={() => sync.mutate()} disabled={sync.isPending} title="Re-pull results from the exam engine"><span className="material-symbols-outlined text-[18px] mr-1">sync</span>Sync</Button>
            {submitted === 0 && submissions.every((s) => s.status === "missing") ? (
              <Button variant="outline" className="text-destructive" onClick={() => { if (confirm("Delete this assignment?")) remove.mutate(); }}>Delete</Button>
            ) : (
              <Button variant="outline" onClick={() => { if (confirm("Archive this assignment? Students keep their results.")) archive.mutate(); }}>Archive</Button>
            )}
          </>
        }
      />
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <SkillBadge skill={a.testSnapshot?.skill} />
        <AssignmentStatusBadge status={a.status} dueAt={a.dueAt} />
        <span className="text-xs text-muted-foreground">Results: {a.resultPolicy === "immediately" ? "shown immediately" : a.resultPolicy === "after_due" ? "after due date" : a.resultsReleasedAt ? "released" : "not released yet"}</span>
        <span className="text-xs text-muted-foreground">· {a.maxAttempts === 0 ? "unlimited attempts" : `${a.maxAttempts} attempt${a.maxAttempts > 1 ? "s" : ""}`}</span>
        {a.instructions && <p className="basis-full text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{a.instructions}</p>}
      </div>
      {a.stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <StatCard icon="task_alt" label="Submitted" value={`${a.stats.submitted}/${a.stats.submitted + a.stats.missing}`} hint={a.stats.late ? `${a.stats.late} late` : undefined} />
          <StatCard icon="pending" label="In progress" value={a.stats.inProgress} />
          <StatCard icon="grade" label="Average band" value={a.stats.avgBand ?? "—"} />
          <StatCard icon="rate_review" label="To review" value={a.stats.pendingReview} hint="Writing / Speaking" />
        </div>
      )}
      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50"><tr><th className="text-left p-3">Student</th><th className="text-left p-3">Status</th><th className="text-left p-3">Submitted</th><th className="text-left p-3">AI band</th><th className="text-left p-3">Final band</th><th className="p-3"></th></tr></thead>
          <tbody>
            {submissions.map((s) => (
              <tr key={s.learnerId} className="border-t">
                <td className="p-3"><div className="flex items-center gap-2"><Avatar className="h-7 w-7"><AvatarImage src={s.avatarUrl ?? undefined} /><AvatarFallback>{(s.fullName || s.email || "?").charAt(0)}</AvatarFallback></Avatar><div><p className="font-medium">{s.fullName || s.email}</p>{s.attempts > 1 && <p className="text-xs text-muted-foreground">{s.attempts} attempts</p>}</div></div></td>
                <td className="p-3"><SubmissionStatusBadge status={s.status} /></td>
                <td className="p-3 text-muted-foreground">{formatDateTime(s.latest?.submittedAt)}</td>
                <td className="p-3"><BandPill band={s.latest?.aiBand} /></td>
                <td className="p-3"><BandPill band={s.latest?.finalBand} reviewed={s.latest?.reviewed} /></td>
                <td className="p-3 text-right">{s.latest && s.status !== "in_progress" && <Button size="sm" variant="outline" asChild><Link href={`/teacher/classes/${id}/submissions/${s.latest.submissionId}`}>{["writing", "speaking"].includes(a.testSnapshot?.skill) && !s.latest.reviewed ? "Review" : "View"}</Link></Button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
