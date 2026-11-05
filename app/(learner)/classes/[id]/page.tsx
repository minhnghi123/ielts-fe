"use client";
import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { classroomApi } from "@/lib/api/classroom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { ClassAssignment } from "@/lib/types";
import { AssignmentStatusBadge, BandPill, EmptyState, PageHeader, SkillBadge, SubmissionStatusBadge, formatDateTime, relativeDue } from "@/app/(teacher)/_components/shared";

export default function LearnerClassPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const qc = useQueryClient();
  const { data: cls, isLoading } = useQuery({ queryKey: ["my-class", id], queryFn: () => classroomApi.getClass(id) });
  const { data: assignments } = useQuery({ queryKey: ["my-class", id, "assignments"], queryFn: () => classroomApi.listAssignments(id) });
  const { data: posts } = useQuery({ queryKey: ["my-class", id, "posts"], queryFn: () => classroomApi.listPosts(id) });
  const leave = useMutation({ mutationFn: () => classroomApi.leaveClass(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-classes"] }); router.push("/classes"); } });
  if (isLoading) return <div className="p-8 space-y-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-64" /></div>;
  if (!cls) return <div className="p-8"><EmptyState icon="error" title="Không tìm thấy lớp" /></div>;
  const list = (assignments ?? []) as ClassAssignment[];
  const open = list.filter((a) => a.status === "open" || a.status === "scheduled");
  const past = list.filter((a) => a.status === "closed" || a.status === "archived");
  const Card = ({ a }: { a: ClassAssignment }) => {
    const me = a.mySubmission;
    const href = `/practice/${a.testId}?assignment=${a.id}`;
    return (
      <li className="rounded-xl border bg-card p-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap"><SkillBadge skill={a.testSnapshot?.skill} /><h3 className="font-semibold">{a.title}</h3><AssignmentStatusBadge status={a.status} dueAt={a.dueAt} />{me && me.status !== "missing" && <SubmissionStatusBadge status={me.status} />}</div>
          <p className="text-xs text-muted-foreground mt-1">{a.mode === "mock" ? "Mock exam · official timing" : "Practice"} · {a.testSnapshot?.durationMinutes ?? "—"} min · due {formatDateTime(a.dueAt)} ({relativeDue(a.dueAt)}){a.maxAttempts > 0 ? ` · ${me?.attemptsUsed ?? 0}/${a.maxAttempts} attempts` : ""}</p>
          {a.instructions && <p className="text-sm mt-2 whitespace-pre-wrap">{a.instructions}</p>}
          {me?.cannotStartReason && !me.canResume && me.status === "missing" && <p className="text-xs text-amber-700 mt-1">{me.cannotStartReason}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {me?.canViewResult && me.finalBand != null && <span className="text-sm">Band <BandPill band={me.finalBand} reviewed={me.teacherReviewed} /></span>}
          {me?.canResume ? <Button asChild><Link href={href}>Làm tiếp</Link></Button>
            : me?.canStart ? <Button asChild><Link href={href}>{(me.attemptsUsed ?? 0) > 0 ? "Thử lại" : "Start"}</Link></Button>
            : null}
          {me?.canViewResult && me.attemptId && <Button variant="outline" asChild><Link href={`/classes/${id}/submissions/${me.attemptId}?attempt=1`}>Kết quả</Link></Button>}
          {me && !me.canViewResult && me.status !== "missing" && me.status !== "in_progress" && <span className="text-xs text-muted-foreground">Results {a.resultPolicy === "after_due" ? `after ${formatDateTime(a.dueAt)}` : "when your teacher releases them"}</span>}
        </div>
      </li>
    );
  };
  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <PageHeader back={{ href: "/classes", label: "Lớp của tôi" }} title={cls.name} subtitle={`${cls.teacher?.fullName ? `Teacher: ${cls.teacher.fullName}` : ""}${cls.description ? ` · ${cls.description}` : ""}`} actions={<Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => { if (confirm("Leave this class? Your results stay with your teacher.")) leave.mutate(); }}>Rời lớp</Button>} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <section><h2 className="font-semibold mb-3">Cần làm</h2>{open.length === 0 ? <p className="text-sm text-muted-foreground">Nothing assigned right now.</p> : <ul className="space-y-2">{open.map((a) => <Card key={a.id} a={a} />)}</ul>}</section>
          {past.length > 0 && <section><h2 className="font-semibold mb-3">Đã qua</h2><ul className="space-y-2">{past.map((a) => <Card key={a.id} a={a} />)}</ul></section>}
        </div>
        <aside>
          <h2 className="font-semibold mb-3">Thông báo</h2>
          {(posts ?? []).length === 0 ? <p className="text-sm text-muted-foreground">No announcements yet.</p> : <ul className="space-y-2">{(posts ?? []).map((p) => <li key={p.id} className="rounded-lg border bg-card p-3">{p.title && <p className="font-medium text-sm">{p.title}</p>}<p className="text-sm whitespace-pre-wrap">{p.body}</p><p className="text-xs text-muted-foreground mt-1">{formatDateTime(p.createdAt)}</p></li>)}</ul>}
        </aside>
      </div>
    </div>
  );
}
