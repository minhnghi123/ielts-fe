"use client";
import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { classroomApi } from "@/lib/api/classroom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BandPill, EmptyState, PageHeader, SkillBadge, SubmissionStatusBadge, formatDateTime } from "@/app/(teacher)/_components/shared";

export default function LearnerSubmissionPage({ params }: { params: Promise<{ id: string; sid: string }> }) {
  const { id, sid } = use(params);
  const { data: sub, isLoading } = useQuery({ queryKey: ["my-class", id, "submission", sid], queryFn: () => classroomApi.getSubmission(id, sid) });
  if (isLoading) return <div className="p-8 space-y-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-64" /></div>;
  if (!sub) return <div className="p-8"><EmptyState icon="error" title="Result not found" /></div>;
  const rubric = sub.teacherRubric ?? {};
  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <PageHeader back={{ href: `/classes/${id}`, label: sub.className || "Back to class" }} title={sub.assignment.title} subtitle={`Attempt #${sub.attemptNo} · submitted ${formatDateTime(sub.submittedAt)}`} />
      <div className="flex items-center gap-2 mb-6"><SkillBadge skill={sub.skill ?? sub.assignment.testSnapshot?.skill} /><SubmissionStatusBadge status={sub.status} /></div>
      {!sub.resultsVisible ? (
        <div className="rounded-xl border bg-card p-6 text-center"><span className="material-symbols-outlined text-4xl text-muted-foreground">lock_clock</span><p className="font-semibold mt-2">Results are not available yet</p><p className="text-sm text-muted-foreground">{sub.pendingMessage ?? "Your teacher will release them soon."}</p></div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-6 flex flex-wrap items-center justify-around gap-6 text-center">
            <div><p className="text-xs text-muted-foreground">Your band</p><p className="text-4xl font-bold"><BandPill band={sub.finalBand} reviewed={!!sub.reviewedAt} /></p></div>
            {sub.teacherBand != null && sub.aiBand != null && <div><p className="text-xs text-muted-foreground">AI estimate</p><p className="text-2xl font-semibold text-muted-foreground"><BandPill band={sub.aiBand} /></p></div>}
            {sub.rawScore != null && <div><p className="text-xs text-muted-foreground">Correct answers</p><p className="text-2xl font-semibold">{sub.rawScore}/40</p></div>}
          </div>
          {Object.keys(rubric).length > 0 && <div className="rounded-xl border bg-card p-4"><h3 className="font-semibold mb-2">Teacher&apos;s criteria scores</h3><ul className="grid grid-cols-2 gap-2 text-sm">{Object.entries(rubric).map(([k, v]) => <li key={k} className="flex justify-between rounded-lg bg-muted/40 px-3 py-2"><span className="capitalize">{k.replace(/([A-Z])/g, " $1")}</span><strong>{Number(v).toFixed(1)}</strong></li>)}</ul></div>}
          {sub.teacherFeedback && <div className="rounded-xl border bg-card p-4"><h3 className="font-semibold mb-2 inline-flex items-center gap-1"><span className="material-symbols-outlined text-[18px] text-primary">verified</span>Feedback from your teacher</h3><p className="text-sm whitespace-pre-wrap leading-relaxed">{sub.teacherFeedback}</p><p className="text-xs text-muted-foreground mt-2">Reviewed {formatDateTime(sub.reviewedAt)}</p></div>}
          {sub.attempt?.aiFeedback && <div className="rounded-xl border bg-card p-4"><h3 className="font-semibold mb-2">AI examiner feedback</h3><p className="text-sm whitespace-pre-wrap leading-relaxed">{sub.attempt.aiFeedback}</p></div>}
          <Button variant="outline" asChild><Link href={`/results/${sub.attemptId}`}>Open full answer review</Link></Button>
        </div>
      )}
    </div>
  );
}
