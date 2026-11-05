"use client";
import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { classroomApi } from "@/lib/api/classroom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { AssignmentStatusBadge, EmptyState, PageHeader, SkillBadge, SubmissionStatusBadge, relativeDue, errorMessage } from "@/app/(teacher)/_components/shared";

export default function LearnerClassesPage() {
  const qc = useQueryClient();
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const { data, isLoading } = useQuery({ queryKey: ["my-classes"], queryFn: () => classroomApi.listClasses({ limit: 100 }) });
  const { data: upcoming } = useQuery({ queryKey: ["my-assignments"], queryFn: () => classroomApi.myUpcomingAssignments(14) });
  const join = useMutation({
    mutationFn: () => classroomApi.joinClass(code.trim()),
    onSuccess: (r) => { setMsg({ ok: true, text: r.alreadyMember ? `You are already in ${r.className}.` : r.status === "pending" ? `Request sent to ${r.className}. Your teacher will approve it.` : `Welcome to ${r.className}!` }); setCode(""); qc.invalidateQueries({ queryKey: ["my-classes"] }); },
    onError: (e: unknown) => setMsg({ ok: false, text: errorMessage(e, "That code did not work.") }),
  });
  const classes = data?.data ?? [];
  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <PageHeader title="Lớp của tôi" subtitle="Classes you joined and the work your teachers assigned." />
      <form className="rounded-xl border bg-card p-4 flex flex-col sm:flex-row gap-2 sm:items-center mb-6" onSubmit={(e) => { e.preventDefault(); if (code.trim()) join.mutate(); }}>
        <div className="flex-1"><p className="text-sm font-medium">Tham gia lớp</p><p className="text-xs text-muted-foreground">Enter the 6-character code from your teacher.</p></div>
        <Input className="sm:w-44 font-mono tracking-widest uppercase" maxLength={8} placeholder="ABC123" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} aria-label="Mã lớp" />
        <Button type="submit" disabled={join.isPending || code.trim().length < 6}>Tham gia</Button>
      </form>
      {msg && <p className={`text-sm mb-4 ${msg.ok ? "text-emerald-600" : "text-destructive"}`}>{msg.text}</p>}
      {upcoming && upcoming.length > 0 && (
        <section className="mb-8">
          <h2 className="font-semibold mb-3">Due soon</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {upcoming.map((a) => (
              <li key={a.id}><Link href={`/classes/${a.classId}`} className="flex items-center gap-3 rounded-lg border bg-card p-3 hover:border-primary/50"><SkillBadge skill={a.testSnapshot?.skill} /><div className="min-w-0 flex-1"><p className="text-sm font-medium truncate">{a.title}</p><p className="text-xs text-muted-foreground">{a.className} · {relativeDue(a.dueAt)}</p></div>{a.mySubmission && <SubmissionStatusBadge status={a.mySubmission.status} />}</Link></li>
            ))}
          </ul>
        </section>
      )}
      <h2 className="font-semibold mb-3">Classes</h2>
      {isLoading ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-28" />)}</div> : classes.length === 0 ? (
        <EmptyState icon="groups" title="You have not joined a class yet" description="Ask your teacher for a class code and enter it above." />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((c) => (
            <li key={c.id}>
              <Link href={c.myMembership === "pending" ? "#" : `/classes/${c.id}`} aria-disabled={c.myMembership === "pending"} className={`block rounded-xl border bg-card p-4 ${c.myMembership === "pending" ? "opacity-70 cursor-default" : "hover:border-primary/50"}`}>
                <div className="flex items-start justify-between gap-2"><h3 className="font-semibold truncate">{c.name}</h3>{c.myMembership === "pending" ? <span className="text-xs rounded-full bg-amber-100 text-amber-800 px-2 py-0.5">Pending approval</span> : <AssignmentStatusBadge status={c.status === "archived" ? "archived" : "open"} />}</div>
                <p className="text-xs text-muted-foreground mt-1">{c.teacher?.fullName ? `Teacher: ${c.teacher.fullName}` : ""}{c.teacher?.organization ? ` · ${c.teacher.organization}` : ""}</p>
                <p className="text-xs text-muted-foreground mt-2">{c.memberCount ?? 0} students · {c.assignmentCount ?? 0} assignments{c.targetBand ? ` · target ${Number(c.targetBand).toFixed(1)}` : ""}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
