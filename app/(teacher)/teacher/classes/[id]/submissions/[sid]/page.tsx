"use client";
import { use, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { classroomApi } from "@/lib/api/classroom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import type { SubmissionDetail } from "@/lib/types";
import { BandPill, EmptyState, PageHeader, SkillBadge, SubmissionStatusBadge, formatDateTime } from "../../../../../_components/shared";
import { Icon } from "@/components/ui/icon";

const RUBRICS: Record<string, { key: string; label: string }[]> = {
  writing: [
    { key: "taskResponse", label: "Task Achievement / Response" },
    { key: "coherence", label: "Coherence & Cohesion" },
    { key: "lexical", label: "Lexical Resource" },
    { key: "grammar", label: "Grammatical Range & Accuracy" },
  ],
  speaking: [
    { key: "fluency", label: "Fluency & Coherence" },
    { key: "lexical", label: "Lexical Resource" },
    { key: "grammar", label: "Grammatical Range & Accuracy" },
    { key: "pronunciation", label: "Pronunciation" },
  ],
};
const BANDS = Array.from({ length: 19 }, (_, i) => i / 2);
const roundHalf = (n: number) => Math.min(9, Math.max(0, Math.round(n * 2) / 2));

export default function SubmissionReviewPage({ params }: { params: Promise<{ id: string; sid: string }> }) {
  const { id, sid } = use(params);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["class", id, "submission", sid], queryFn: () => classroomApi.getSubmission(id, sid) });
  if (isLoading) return <div className="p-8 space-y-4"><Skeleton className="h-10 w-72" /><Skeleton className="h-96" /></div>;
  if (!data) return <div className="p-8"><EmptyState icon="error" title="Submission not found" /></div>;
  return <SubmissionView key={data.id} classId={id} sub={data} onSaved={() => qc.invalidateQueries({ queryKey: ["class", id] })} />;
}

function SubmissionView({ classId, sub, onSaved }: { classId: string; sub: SubmissionDetail; onSaved: () => void }) {
  const skill = sub.skill ?? sub.assignment.testSnapshot?.skill;
  const rubric = RUBRICS[skill ?? ""] ?? [];
  // Numeric columns arrive as strings from the API; coerce so <select> values match.
  const [scores, setScores] = useState<Record<string, number>>(
    Object.fromEntries(Object.entries(sub.teacherRubric ?? {}).map(([k, v]) => [k, Number(v)])),
  );
  const [band, setBand] = useState<number | "">(sub.teacherBand != null ? Number(sub.teacherBand) : "");
  const [feedback, setFeedback] = useState(sub.teacherFeedback ?? "");
  const [msg, setMsg] = useState("");
  const rubricAvg = rubric.length && rubric.every((r) => scores[r.key] !== undefined) ? roundHalf(rubric.reduce((acc, r) => acc + scores[r.key], 0) / rubric.length) : null;
  const review = useMutation({
    mutationFn: () => classroomApi.reviewSubmission(classId, sub.id, { teacherBand: band === "" ? rubricAvg ?? undefined : Number(band), teacherRubric: Object.keys(scores).length ? scores : undefined, teacherFeedback: feedback, releaseNow: sub.assignment.resultPolicy === "manual" }),
    onSuccess: () => { setMsg("Saved and returned to the student"); onSaved(); setTimeout(() => setMsg(""), 2000); },
  });
  const answers = sub.attempt?.draftAnswers ?? {};
  const qa = (sub.attempt?.questionAttempts ?? []) as Array<{ id?: string; answer?: string; isCorrect?: boolean; correctAnswer?: string; question?: { answer?: { correctAnswers?: string[] } } }>;

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <PageHeader
        back={{ href: `/teacher/classes/${classId}/assignments/${sub.assignment.id}`, label: sub.assignment.title }}
        title={sub.learner?.fullName || sub.learner?.email || "Submission"}
        subtitle={`${sub.assignment.testSnapshot?.title ?? ""} · attempt #${sub.attemptNo} · submitted ${formatDateTime(sub.submittedAt)}`}
      />
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <SkillBadge skill={skill} />
        <SubmissionStatusBadge status={sub.status} />
        <span className="text-sm">AI band <BandPill band={sub.aiBand} /></span>
        <span className="text-sm">Final <BandPill band={sub.finalBand} reviewed={!!sub.reviewedAt} /></span>
        {sub.rawScore !== null && sub.rawScore !== undefined && <span className="text-sm text-muted-foreground">Raw score {sub.rawScore}/{sub.attempt?.questionAttempts?.length || 40}</span>}
      </div>
      <div className="grid gap-6 lg:grid-cols-5">
        <section className="lg:col-span-3 space-y-4">
          {(skill === "writing" || skill === "speaking") ? (
            <>
              {Object.entries(answers).length === 0 && <p className="text-sm text-muted-foreground">No text answers were stored for this attempt.</p>}
              {Object.entries(answers).map(([k, v], i) => (
                <article key={k} className="rounded-xl border bg-card p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">{skill === "writing" ? `Task ${i + 1}` : `Part ${i + 1}`}</h3>
                  {String(v).startsWith("http") ? <audio controls src={String(v)} className="w-full" /> : <p className="whitespace-pre-wrap text-sm leading-relaxed">{String(v)}</p>}
                  {!String(v).startsWith("http") && <p className="text-xs text-muted-foreground mt-2">{String(v).trim().split(/\s+/).filter(Boolean).length} words</p>}
                </article>
              ))}
              {sub.attempt?.aiFeedback && (
                <article className="rounded-xl border bg-card p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">AI examiner feedback</h3>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{sub.attempt.aiFeedback}</p>
                </article>
              )}
            </>
          ) : (
            <article className="rounded-xl border bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50"><tr><th className="text-left p-2">#</th><th className="text-left p-2">Answer</th><th className="text-left p-2">Correct</th><th className="p-2"></th></tr></thead>
                <tbody>
                  {qa.length === 0 && <tr><td colSpan={4} className="p-4 text-muted-foreground">Answer details are not available.</td></tr>}
                  {qa.map((q, i) => (
                    <tr key={q.id ?? i} className="border-t">
                      <td className="p-2 text-muted-foreground">{i + 1}</td>
                      <td className="p-2">{q.answer || <span className="text-muted-foreground">—</span>}</td>
                      <td className="p-2 text-muted-foreground">{q.question?.answer?.correctAnswers?.join(" / ") ?? q.correctAnswer ?? ""}</td>
                      <td className="p-2 text-right"><Icon name={q.isCorrect ? "check_circle" : "cancel"} className={`h-[18px] w-[18px] ${q.isCorrect ? "text-emerald-600" : "text-red-500"}`} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </article>
          )}
        </section>
        <aside className="lg:col-span-2">
          {sub.canReview ? (
            <form className="rounded-xl border bg-card p-4 space-y-4 sticky top-6" onSubmit={(e) => { e.preventDefault(); review.mutate(); }}>
              <div><h3 className="font-semibold">Teacher review</h3><p className="text-xs text-muted-foreground">Your band replaces the AI band for this student. Both are kept for comparison.</p></div>
              {rubric.map((r) => (
                <div key={r.key} className="space-y-1">
                  <div className="flex justify-between text-sm"><Label>{r.label}</Label><span className="font-semibold tabular-nums">{scores[r.key]?.toFixed(1) ?? "—"}</span></div>
                  <input type="range" min={0} max={9} step={0.5} value={scores[r.key] ?? 5} onChange={(e) => setScores({ ...scores, [r.key]: Number(e.target.value) })} className="w-full accent-primary" aria-label={r.label} />
                </div>
              ))}
              <div className="space-y-1">
                <Label>Overall band {rubricAvg !== null && <span className="text-xs text-muted-foreground">(rubric average {rubricAvg.toFixed(1)})</span>}</Label>
                <select className="w-full rounded-lg border bg-background p-2 text-sm" value={band} onChange={(e) => setBand(e.target.value === "" ? "" : Number(e.target.value))}>
                  <option value="">Use rubric average</option>
                  {BANDS.map((b) => <option key={b} value={b}>{b.toFixed(1)}</option>)}
                </select>
              </div>
              <div className="space-y-1"><Label>Feedback for the student</Label><textarea className="w-full rounded-lg border bg-background p-2 text-sm min-h-[120px]" value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Strengths, 2–3 priorities to improve, concrete examples…" /></div>
              <Button type="submit" className="w-full" disabled={review.isPending || (band === "" && rubricAvg === null && !feedback.trim())}>{review.isPending ? "Saving…" : sub.reviewedAt ? "Update review" : "Save & return to student"}</Button>
              {msg && <p className="text-sm text-emerald-600">{msg}</p>}
              {review.isError && <p className="text-sm text-destructive">Could not save the review.</p>}
            </form>
          ) : (
            <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
              {skill === "listening" || skill === "reading" ? "Listening and Reading are graded automatically from the answer key." : "This submission cannot be reviewed yet."}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
