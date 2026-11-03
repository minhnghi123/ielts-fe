"use client";
import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { testsApi } from "@/lib/api/tests";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Test } from "@/lib/types";
import { EmptyState, PageHeader, PendingApprovalBanner, SkillBadge, errorMessage } from "../../_components/shared";

export default function TeacherTestsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const pending = user?.role === "teacher" && user.teacherStatus !== "approved";
  const [skill, setSkill] = useState("");
  const { data, isLoading } = useQuery({ queryKey: ["tests", "mine", skill], queryFn: () => testsApi.getTests({ mine: true, limit: 100, ...(skill ? { skill } : {}) }), enabled: !pending });
  const remove = useMutation({ mutationFn: (id: string) => testsApi.deleteTest(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["tests", "mine"] }) });
  const tests: Test[] = data?.data ?? [];
  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <PageHeader title="My Test Bank" subtitle="Tests you create are private: only students in a class you assign them to can see them." actions={!pending && <Button asChild><Link href="/teacher/tests/add"><span className="material-symbols-outlined text-[18px] mr-1">add</span>Create test</Link></Button>} />
      {pending && <PendingApprovalBanner />}
      {!pending && (
        <>
          <div className="flex gap-2 mb-4 flex-wrap">{["", "listening", "reading", "writing", "speaking"].map((s) => <button key={s} onClick={() => setSkill(s)} className={`rounded-full px-3 py-1 text-xs capitalize ${skill === s ? "bg-primary text-primary-foreground" : "border hover:bg-accent"}`}>{s || "All"}</button>)}</div>
          {isLoading ? <Skeleton className="h-48" /> : tests.length === 0 ? (
            <EmptyState icon="library_add" title="No tests yet" description="Build Listening, Reading, Writing or Speaking tests with the same editor admins use, then assign them to a class." action={<Button asChild><Link href="/teacher/tests/add">Create your first test</Link></Button>} />
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {tests.map((t) => (
                <li key={t.id} className="rounded-xl border bg-card p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2"><SkillBadge skill={t.skill} /><span className={`text-xs rounded-full px-2 py-0.5 ${t.status === "published" ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-600"}`}>{t.status ?? "draft"}</span></div>
                  <h3 className="font-semibold leading-snug">{t.title}</h3>
                  <p className="text-xs text-muted-foreground capitalize">{t.difficulty ?? "medium"} · {t.durationMinutes ?? "—"} min · {t.isMock ? "mock" : "practice"}</p>
                  <div className="flex gap-2 mt-auto pt-2">
                    <Button size="sm" variant="outline" asChild><Link href={`/teacher/tests/${t.id}`}>Edit</Link></Button>
                    <Button size="sm" variant="ghost" asChild><Link href={`/practice/${t.id}?preview=1`} target="_blank">Preview</Link></Button>
                    <Button size="sm" variant="ghost" className="ml-auto text-muted-foreground hover:text-destructive" onClick={() => { if (confirm(`Delete “${t.title}”? Tests used in an assignment cannot be deleted.`)) remove.mutate(t.id); }}>Delete</Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {remove.isError && <p className="text-sm text-destructive mt-3">{errorMessage(remove.error, "Could not delete this test.")}</p>}
        </>
      )}
    </div>
  );
}
