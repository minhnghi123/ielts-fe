"use client";
import { use, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { classroomApi, type CreateAssignmentInput } from "@/lib/api/classroom";
import { testsApi } from "@/lib/api/tests";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import type { Test } from "@/lib/types";
import { PageHeader, SkillBadge, errorMessage } from "../../../../../_components/shared";

function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function NewAssignmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [source, setSource] = useState<"mine" | "public">("mine");
  const [skill, setSkill] = useState("");
  const [search, setSearch] = useState("");
  const [test, setTest] = useState<Test | null>(null);
  const defaultDue = useMemo(() => { const d = new Date(); d.setDate(d.getDate() + 7); d.setHours(23, 59, 0, 0); return toLocalInput(d); }, []);
  const [form, setForm] = useState({ title: "", instructions: "", mode: "mock" as "mock" | "practice", openAt: "", dueAt: defaultDue, closeAt: "", allowLate: true, maxAttempts: 1, resultPolicy: "immediately" as "immediately" | "after_due" | "manual" });
  const [error, setError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["tests", "picker", source, skill, search],
    queryFn: () => testsApi.getTests({ ...(source === "mine" ? { mine: true } : {}), ...(skill ? { skill } : {}), ...(search ? { search } : {}), limit: 50 }),
  });
  const tests: Test[] = data?.data ?? [];

  const create = useMutation({
    mutationFn: (input: CreateAssignmentInput) => classroomApi.createAssignment(id, input),
    onSuccess: (a) => router.push(`/teacher/classes/${id}/assignments/${a.id}`),
    onError: (e: unknown) => setError(errorMessage(e, "Could not create the assignment")),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!test) { setError("Pick a test first"); return; }
    setError("");
    create.mutate({
      testId: test.id,
      title: form.title || undefined,
      instructions: form.instructions || undefined,
      mode: form.mode,
      openAt: form.openAt ? new Date(form.openAt).toISOString() : undefined,
      dueAt: new Date(form.dueAt).toISOString(),
      closeAt: form.closeAt ? new Date(form.closeAt).toISOString() : undefined,
      allowLate: form.allowLate,
      maxAttempts: form.maxAttempts,
      resultPolicy: form.resultPolicy,
    });
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <PageHeader back={{ href: `/teacher/classes/${id}`, label: "Back to class" }} title="Assign a test" subtitle="1. Choose a test · 2. Set the window and rules · 3. Assign" />
      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-5">
        <section className="lg:col-span-3 rounded-xl border bg-card p-4">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <div className="flex rounded-lg border p-0.5">
              {(["mine", "public"] as const).map((s) => <button type="button" key={s} onClick={() => setSource(s)} className={`rounded-md px-3 py-1 text-sm ${source === s ? "bg-primary text-primary-foreground" : ""}`}>{s === "mine" ? "My tests" : "Public library"}</button>)}
            </div>
            <select className="rounded-lg border bg-background p-1.5 text-sm" value={skill} onChange={(e) => setSkill(e.target.value)}>
              <option value="">All skills</option><option value="listening">Listening</option><option value="reading">Reading</option><option value="writing">Writing</option><option value="speaking">Speaking</option>
            </select>
            <Input className="max-w-[200px]" placeholder="Search title…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          {isLoading ? <Skeleton className="h-48" /> : tests.length === 0 ? (
            <p className="text-sm text-muted-foreground p-6 text-center">{source === "mine" ? "You have not created any published tests yet. Switch to the public library or build one in My Test Bank." : "No tests match."}</p>
          ) : (
            <ul className="max-h-[420px] overflow-y-auto divide-y rounded-lg border">
              {tests.map((t) => (
                <li key={t.id}>
                  <button type="button" onClick={() => { setTest(t); if (!form.title) setForm({ ...form, title: "" }); }} aria-pressed={test?.id === t.id} className={`w-full text-left p-3 flex items-center gap-3 hover:bg-accent ${test?.id === t.id ? "bg-primary/10" : ""}`}>
                    <SkillBadge skill={t.skill} />
                    <div className="min-w-0 flex-1"><p className="font-medium truncate">{t.title}</p><p className="text-xs text-muted-foreground capitalize">{t.difficulty ?? "medium"} · {t.durationMinutes ?? "—"} min · {t.isMock ? "mock" : "practice"}{t.visibility === "private" ? " · private" : ""}</p></div>
                    {test?.id === t.id && <span className="material-symbols-outlined text-primary">check_circle</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="lg:col-span-2 space-y-3 rounded-xl border bg-card p-4">
          <div className="space-y-1.5"><Label>Title</Label><Input placeholder={test?.title ?? "Defaults to the test title"} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={160} /></div>
          <div className="space-y-1.5"><Label>Instructions for students (optional)</Label><textarea className="w-full rounded-lg border bg-background p-2 text-sm min-h-[60px]" value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Mode</Label>
            <div className="grid grid-cols-2 gap-2">
              {([["mock", "Mock exam", "Official timing, Listening plays once"], ["practice", "Practice", "Students may shorten the timer"]] as const).map(([v, l, h]) => <button type="button" key={v} onClick={() => setForm({ ...form, mode: v })} className={`rounded-lg border p-2 text-left ${form.mode === v ? "border-primary bg-primary/10" : "hover:bg-accent"}`}><p className="text-sm font-medium">{l}</p><p className="text-xs text-muted-foreground">{h}</p></button>)}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <div className="space-y-1.5"><Label htmlFor="openAt">Opens (optional)</Label><Input id="openAt" type="datetime-local" value={form.openAt} onChange={(e) => setForm({ ...form, openAt: e.target.value })} /></div>
            <div className="space-y-1.5"><Label htmlFor="dueAt">Due</Label><Input id="dueAt" type="datetime-local" required value={form.dueAt} onChange={(e) => setForm({ ...form, dueAt: e.target.value })} /></div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.allowLate} onChange={(e) => setForm({ ...form, allowLate: e.target.checked })} />Accept late submissions (marked as late)</label>
            {form.allowLate && <div className="space-y-1.5"><Label htmlFor="closeAt">Hard close (optional)</Label><Input id="closeAt" type="datetime-local" value={form.closeAt} onChange={(e) => setForm({ ...form, closeAt: e.target.value })} /></div>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Attempts</Label><select className="w-full rounded-lg border bg-background p-2 text-sm" value={form.maxAttempts} onChange={(e) => setForm({ ...form, maxAttempts: Number(e.target.value) })}><option value={1}>1 attempt</option><option value={2}>2 attempts</option><option value={3}>3 attempts</option><option value={0}>Unlimited</option></select></div>
            <div className="space-y-1.5"><Label>Show results</Label><select className="w-full rounded-lg border bg-background p-2 text-sm" value={form.resultPolicy} onChange={(e) => setForm({ ...form, resultPolicy: e.target.value as "immediately" | "after_due" | "manual" })}><option value="immediately">Immediately</option><option value="after_due">After due date</option><option value="manual">When I release them</option></select></div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={!test || create.isPending}>{create.isPending ? "Assigning…" : test ? `Assign “${test.title}”` : "Pick a test to continue"}</Button>
        </section>
      </form>
    </div>
  );
}
