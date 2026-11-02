"use client";
import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { classroomApi, type CreateClassInput } from "@/lib/api/classroom";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState, PageHeader, PendingApprovalBanner, errorMessage } from "../../_components/shared";

const COLORS = ["emerald", "sky", "amber", "rose", "violet", "zinc"];
const COLOR_CLS: Record<string, string> = {
  emerald: "bg-emerald-500", sky: "bg-sky-500", amber: "bg-amber-500", rose: "bg-rose-500", violet: "bg-violet-500", zinc: "bg-zinc-500",
};

function TeacherClassesPageInner() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const qc = useQueryClient();
  const pending = user?.role === "teacher" && user.teacherStatus !== "approved";
  const [status, setStatus] = useState<"active" | "archived">("active");
  const [open, setOpen] = useState(params.get("new") === "1");
  const [form, setForm] = useState<CreateClassInput>({ name: "", joinPolicy: "approval", coverColor: "emerald" });
  const [error, setError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["teacher", "classes", status],
    queryFn: () => classroomApi.listClasses({ status, limit: 100 }),
    enabled: !pending,
  });

  const create = useMutation({
    mutationFn: (input: CreateClassInput) => classroomApi.createClass(input),
    onSuccess: (cls) => {
      qc.invalidateQueries({ queryKey: ["teacher"] });
      setOpen(false);
      router.push(`/teacher/classes/${cls.id}?welcome=1`);
    },
    onError: (e: unknown) => setError(errorMessage(e, "Could not create class")),
  });

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <PageHeader
        title="Classes"
        subtitle="Each class has a join code. Students join, you assign tests, results land in the gradebook."
        actions={!pending && <Button onClick={() => setOpen(true)}><span className="material-symbols-outlined text-[18px] mr-1">add</span>New class</Button>}
      />
      {pending && <PendingApprovalBanner />}
      {!pending && (
        <>
          <div className="flex gap-2 mb-4" role="tablist">
            {(["active", "archived"] as const).map((s) => (
              <button key={s} role="tab" aria-selected={status === s} onClick={() => setStatus(s)} className={`rounded-full px-3 py-1 text-sm capitalize ${status === s ? "bg-primary text-primary-foreground" : "border hover:bg-accent"}`}>{s}</button>
            ))}
          </div>
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-32" />)}</div>
          ) : !data || data.data.length === 0 ? (
            <EmptyState icon="groups" title={status === "active" ? "No classes yet" : "No archived classes"} description={status === "active" ? "Create a class, share the join code with your students, then assign a test." : undefined} action={status === "active" ? <Button onClick={() => setOpen(true)}>Create a class</Button> : undefined} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.data.map((c) => (
                <Link key={c.id} href={`/teacher/classes/${c.id}`} className="group rounded-xl border bg-card overflow-hidden hover:border-primary/50 transition-colors">
                  <div className={`h-2 ${COLOR_CLS[c.coverColor ?? "emerald"] ?? "bg-emerald-500"}`} />
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold truncate group-hover:text-primary">{c.name}</h3>
                      {(c.pendingCount ?? 0) > 0 && <span className="shrink-0 rounded-full bg-amber-100 text-amber-800 text-xs px-2 py-0.5">{c.pendingCount} pending</span>}
                    </div>
                    {c.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{c.description}</p>}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-3">
                      <span className="inline-flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">school</span>{c.memberCount ?? 0}</span>
                      <span className="inline-flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">assignment</span>{c.assignmentCount ?? 0}</span>
                      {c.joinCode && <span className="ml-auto font-mono tracking-widest">{c.joinCode}</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a class</DialogTitle>
            <DialogDescription>You will get a join code to share with students.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setError(""); create.mutate({ ...form, targetBand: form.targetBand || undefined, maxMembers: form.maxMembers || undefined }); }}>
            <div className="space-y-1.5">
              <Label htmlFor="name">Class name</Label>
              <Input id="name" required maxLength={120} placeholder="IELTS 6.5 — Tue/Thu evening" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="desc">Description (optional)</Label>
              <Input id="desc" placeholder="Goals, schedule, notes for students" value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="target">Target band</Label>
                <Input id="target" type="number" step={0.5} min={0} max={9} placeholder="6.5" value={form.targetBand ?? ""} onChange={(e) => setForm({ ...form, targetBand: e.target.value ? Number(e.target.value) : undefined })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="max">Max students</Label>
                <Input id="max" type="number" min={1} max={500} placeholder="No limit" value={form.maxMembers ?? ""} onChange={(e) => setForm({ ...form, maxMembers: e.target.value ? Number(e.target.value) : undefined })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>How students join</Label>
              <div className="grid grid-cols-3 gap-2">
                {([["approval", "I approve each request"], ["open", "Anyone with the code"], ["closed", "Invite only (closed)"]] as const).map(([v, l]) => (
                  <button type="button" key={v} onClick={() => setForm({ ...form, joinPolicy: v })} className={`rounded-lg border p-2 text-xs text-left ${form.joinPolicy === v ? "border-primary bg-primary/10" : "hover:bg-accent"}`}>{l}</button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Colour</Label>
              <div className="flex gap-2">
                {COLORS.map((c) => (
                  <button type="button" key={c} aria-label={c} onClick={() => setForm({ ...form, coverColor: c })} className={`h-7 w-7 rounded-full ${COLOR_CLS[c]} ${form.coverColor === c ? "ring-2 ring-offset-2 ring-primary" : ""}`} />
                ))}
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={create.isPending || !form.name.trim()}>{create.isPending ? "Creating…" : "Create class"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function TeacherClassesPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading…</div>}>
      <TeacherClassesPageInner />
    </Suspense>
  );
}
