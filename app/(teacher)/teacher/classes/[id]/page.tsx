"use client";
import { use, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { classroomApi } from "@/lib/api/classroom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ClassAssignment, ClassMember, Gradebook } from "@/lib/types";
import { AssignmentStatusBadge, BandPill, EmptyState, PageHeader, SkillBadge, SubmissionStatusBadge, formatDateTime, relativeDue } from "../../../_components/shared";

export default function TeacherClassPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const qc = useQueryClient();
  const [copied, setCopied] = useState(false);
  const { data: cls, isLoading } = useQuery({ queryKey: ["class", id], queryFn: () => classroomApi.getClass(id) });

  const copy = async () => {
    if (!cls?.joinCode) return;
    await navigator.clipboard.writeText(`${window.location.origin}/classes/join?code=${cls.joinCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (isLoading) return <div className="p-8 space-y-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-64" /></div>;
  if (!cls) return <div className="p-8"><EmptyState icon="error" title="Class not found" /></div>;

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <PageHeader
        back={{ href: "/teacher/classes", label: "All classes" }}
        title={cls.name}
        subtitle={cls.description ?? undefined}
        actions={
          <>
            {cls.joinCode && (
              <button onClick={copy} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-accent" title="Copy join link">
                <span className="text-xs text-muted-foreground">Code</span>
                <span className="font-mono font-bold tracking-widest">{cls.joinCode}</span>
                <span className="material-symbols-outlined text-[18px]">{copied ? "check" : "content_copy"}</span>
              </button>
            )}
            <Button asChild><Link href={`/teacher/classes/${id}/assignments/new`}><span className="material-symbols-outlined text-[18px] mr-1">assignment_add</span>Assign a test</Link></Button>
          </>
        }
      />
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
        <span className="inline-flex items-center gap-1"><span className="material-symbols-outlined text-[18px]">school</span>{cls.memberCount ?? 0} students</span>
        <span className="inline-flex items-center gap-1"><span className="material-symbols-outlined text-[18px]">assignment</span>{cls.assignmentCount ?? 0} assignments</span>
        {cls.targetBand && <span className="inline-flex items-center gap-1"><span className="material-symbols-outlined text-[18px]">flag</span>Target band {Number(cls.targetBand).toFixed(1)}</span>}
        {cls.status === "archived" && <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs">Archived</span>}
      </div>

      <Tabs defaultValue="assignments">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="students">Students{(cls.pendingCount ?? 0) > 0 && <span className="ml-1 rounded-full bg-amber-500 text-white text-[10px] px-1.5">{cls.pendingCount}</span>}</TabsTrigger>
          <TabsTrigger value="gradebook">Gradebook</TabsTrigger>
          <TabsTrigger value="posts">Announcements</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="assignments"><AssignmentsTab classId={id} /></TabsContent>
        <TabsContent value="students"><StudentsTab classId={id} onChanged={() => qc.invalidateQueries({ queryKey: ["class", id] })} /></TabsContent>
        <TabsContent value="gradebook"><GradebookTab classId={id} /></TabsContent>
        <TabsContent value="posts"><PostsTab classId={id} /></TabsContent>
        <TabsContent value="settings"><SettingsTab classId={id} cls={cls} /></TabsContent>
      </Tabs>
    </div>
  );
}

function AssignmentsTab({ classId }: { classId: string }) {
  const { data, isLoading } = useQuery({ queryKey: ["class", classId, "assignments"], queryFn: () => classroomApi.listAssignments(classId) });
  if (isLoading) return <Skeleton className="h-40 mt-4" />;
  const list = (data ?? []) as ClassAssignment[];
  if (list.length === 0) return <div className="mt-4"><EmptyState icon="assignment_add" title="No assignments yet" description="Pick a test from your bank or the public library and set a due date." action={<Button asChild><Link href={`/teacher/classes/${classId}/assignments/new`}>Assign a test</Link></Button>} /></div>;
  return (
    <ul className="mt-4 space-y-2">
      {list.map((a) => (
        <li key={a.id}>
          <Link href={`/teacher/classes/${classId}/assignments/${a.id}`} className="flex flex-col gap-2 rounded-xl border bg-card p-4 hover:border-primary/50 sm:flex-row sm:items-center">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <SkillBadge skill={a.testSnapshot?.skill} />
                <h3 className="font-semibold truncate">{a.title}</h3>
                <AssignmentStatusBadge status={a.status} dueAt={a.dueAt} />
                <span className="text-xs text-muted-foreground capitalize">{a.mode}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Due {formatDateTime(a.dueAt)} · {relativeDue(a.dueAt)}</p>
            </div>
            {a.stats && (
              <div className="flex gap-4 text-xs text-muted-foreground shrink-0">
                <span><strong className="text-foreground">{a.stats.submitted}</strong> submitted</span>
                <span><strong className="text-foreground">{a.stats.missing}</strong> missing</span>
                {a.stats.late > 0 && <span><strong className="text-foreground">{a.stats.late}</strong> late</span>}
                <span>avg <strong className="text-foreground">{a.stats.avgBand ?? "—"}</strong></span>
                {a.stats.pendingReview > 0 && <span className="text-primary font-semibold">{a.stats.pendingReview} to review</span>}
              </div>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function StudentsTab({ classId, onChanged }: { classId: string; onChanged: () => void }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["class", classId, "members"], queryFn: () => classroomApi.listMembers(classId) });
  const update = useMutation({
    mutationFn: ({ learnerId, status }: { learnerId: string; status: "active" | "removed" }) => classroomApi.updateMember(classId, learnerId, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["class", classId, "members"] }); onChanged(); },
  });
  if (isLoading) return <Skeleton className="h-40 mt-4" />;
  const members = (data ?? []) as ClassMember[];
  const pending = members.filter((m) => m.status === "pending");
  const active = members.filter((m) => m.status === "active");
  const Row = ({ m }: { m: ClassMember }) => (
    <li className="flex items-center gap-3 rounded-lg border bg-card p-3">
      <Avatar className="h-9 w-9"><AvatarImage src={m.avatarUrl ?? undefined} /><AvatarFallback>{(m.fullName || m.email || "?").charAt(0).toUpperCase()}</AvatarFallback></Avatar>
      <div className="min-w-0 flex-1">
        <Link href={`/teacher/classes/${classId}/students/${m.learnerId}`} className="font-medium hover:underline truncate block">{m.fullName || m.email || "Student"}</Link>
        <p className="text-xs text-muted-foreground truncate">{m.email}{m.stats ? ` · ${m.stats.submitted} submitted · avg ${m.stats.avgBand ?? "—"}` : ""}</p>
      </div>
      {m.status === "pending" ? (
        <div className="flex gap-2">
          <Button size="sm" onClick={() => update.mutate({ learnerId: m.learnerId, status: "active" })} disabled={update.isPending}>Approve</Button>
          <Button size="sm" variant="outline" onClick={() => update.mutate({ learnerId: m.learnerId, status: "removed" })} disabled={update.isPending}>Decline</Button>
        </div>
      ) : (
        <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => { if (confirm(`Remove ${m.fullName || m.email} from this class?`)) update.mutate({ learnerId: m.learnerId, status: "removed" }); }}>Remove</Button>
      )}
    </li>
  );
  return (
    <div className="mt-4 space-y-6">
      {pending.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-2"><h3 className="font-semibold">Join requests ({pending.length})</h3><Button size="sm" variant="outline" onClick={() => pending.forEach((m) => update.mutate({ learnerId: m.learnerId, status: "active" }))}>Approve all</Button></div>
          <ul className="space-y-2">{pending.map((m) => <Row key={m.id} m={m} />)}</ul>
        </section>
      )}
      <section>
        <h3 className="font-semibold mb-2">Students ({active.length})</h3>
        {active.length === 0 ? <EmptyState icon="person_add" title="No students yet" description="Share the class code or link from the header. Students join from Classes → Join a class." /> : <ul className="space-y-2">{active.map((m) => <Row key={m.id} m={m} />)}</ul>}
      </section>
    </div>
  );
}

function GradebookTab({ classId }: { classId: string }) {
  const [skill, setSkill] = useState<string>("");
  const { data, isLoading } = useQuery({ queryKey: ["class", classId, "gradebook", skill], queryFn: () => classroomApi.gradebook(classId, skill || undefined) });
  const download = async () => {
    const blob = await classroomApi.downloadGradebookCsv(classId, skill || undefined);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "gradebook.csv"; a.click(); URL.revokeObjectURL(url);
  };
  if (isLoading) return <Skeleton className="h-64 mt-4" />;
  const gb = data as Gradebook | undefined;
  if (!gb || gb.assignments.length === 0 || gb.students.length === 0) return <div className="mt-4"><EmptyState icon="table_chart" title="Gradebook is empty" description="Scores appear here once students are in the class and an assignment exists." /></div>;
  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {["", "listening", "reading", "writing", "speaking"].map((s) => (
          <button key={s} onClick={() => setSkill(s)} className={`rounded-full px-3 py-1 text-xs capitalize ${skill === s ? "bg-primary text-primary-foreground" : "border hover:bg-accent"}`}>{s || "All skills"}</button>
        ))}
        <Button size="sm" variant="outline" className="ml-auto" onClick={download}><span className="material-symbols-outlined text-[16px] mr-1">download</span>CSV</Button>
      </div>
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th scope="col" className="sticky left-0 bg-muted/50 text-left p-3 min-w-[180px]">Student</th>
              {gb.assignments.map((a) => (
                <th scope="col" key={a.id} className="p-3 text-left min-w-[130px]">
                  <Link href={`/teacher/classes/${classId}/assignments/${a.id}`} className="hover:underline block truncate max-w-[160px]" title={a.title}>{a.title}</Link>
                  <span className="text-[11px] font-normal text-muted-foreground capitalize">{a.skill} · avg {a.avgBand ?? "—"}</span>
                </th>
              ))}
              <th scope="col" className="p-3 text-left">Average</th>
            </tr>
          </thead>
          <tbody>
            {gb.students.map((st) => (
              <tr key={st.learnerId} className="border-t">
                <th scope="row" className="sticky left-0 bg-card text-left p-3 font-medium"><Link href={`/teacher/classes/${classId}/students/${st.learnerId}`} className="hover:underline">{st.fullName || st.email}</Link></th>
                {gb.assignments.map((a) => {
                  const c = gb.cells[st.learnerId]?.[a.id];
                  return (
                    <td key={a.id} className="p-3">
                      {c ? (
                        <Link href={`/teacher/classes/${classId}/submissions/${c.submissionId}`} className="inline-flex flex-col gap-0.5 hover:underline">
                          <BandPill band={c.finalBand} reviewed={c.reviewed} />
                          <SubmissionStatusBadge status={c.status} />
                        </Link>
                      ) : <SubmissionStatusBadge status="missing" />}
                    </td>
                  );
                })}
                <td className="p-3"><BandPill band={st.avgBand} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PostsTab({ classId }: { classId: string }) {
  const qc = useQueryClient();
  const [body, setBody] = useState("");
  const [title, setTitle] = useState("");
  const { data } = useQuery({ queryKey: ["class", classId, "posts"], queryFn: () => classroomApi.listPosts(classId) });
  const create = useMutation({ mutationFn: () => classroomApi.createPost(classId, { title: title || undefined, body }), onSuccess: () => { setBody(""); setTitle(""); qc.invalidateQueries({ queryKey: ["class", classId, "posts"] }); } });
  const del = useMutation({ mutationFn: (pid: string) => classroomApi.deletePost(classId, pid), onSuccess: () => qc.invalidateQueries({ queryKey: ["class", classId, "posts"] }) });
  return (
    <div className="mt-4 space-y-4">
      <form className="rounded-xl border bg-card p-4 space-y-2" onSubmit={(e) => { e.preventDefault(); if (body.trim()) create.mutate(); }}>
        <Input placeholder="Title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea className="w-full rounded-lg border bg-background p-2 text-sm min-h-[80px]" placeholder="Share an announcement or a link to materials…" value={body} onChange={(e) => setBody(e.target.value)} />
        <div className="flex justify-end"><Button size="sm" type="submit" disabled={!body.trim() || create.isPending}>Post</Button></div>
      </form>
      {(data ?? []).length === 0 ? <p className="text-sm text-muted-foreground">No announcements yet.</p> : (data ?? []).map((p) => (
        <article key={p.id} className="rounded-xl border bg-card p-4">
          <div className="flex items-start justify-between gap-2">
            <div>{p.title && <h4 className="font-semibold">{p.title}</h4>}<p className="text-xs text-muted-foreground">{formatDateTime(p.createdAt)}{p.pinned ? " · Pinned" : ""}</p></div>
            <button className="text-muted-foreground hover:text-destructive" aria-label="Delete post" onClick={() => del.mutate(p.id)}><span className="material-symbols-outlined text-[18px]">delete</span></button>
          </div>
          <p className="text-sm whitespace-pre-wrap mt-2">{p.body}</p>
        </article>
      ))}
    </div>
  );
}

function SettingsTab({ classId, cls }: { classId: string; cls: { name: string; description: string | null; targetBand: number | null; joinPolicy: string; maxMembers: number | null; status: string } }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: cls.name, description: cls.description ?? "", targetBand: cls.targetBand ?? undefined, joinPolicy: cls.joinPolicy as "open" | "approval" | "closed", maxMembers: cls.maxMembers ?? undefined });
  const [msg, setMsg] = useState("");
  const save = useMutation({ mutationFn: (extra?: { status?: "active" | "archived" }) => classroomApi.updateClass(classId, { ...form, description: form.description, targetBand: form.targetBand, maxMembers: form.maxMembers, ...extra }), onSuccess: () => { setMsg("Saved"); qc.invalidateQueries({ queryKey: ["class", classId] }); qc.invalidateQueries({ queryKey: ["teacher"] }); setTimeout(() => setMsg(""), 1500); } });
  const rotate = useMutation({ mutationFn: () => classroomApi.rotateJoinCode(classId), onSuccess: () => qc.invalidateQueries({ queryKey: ["class", classId] }) });
  return (
    <div className="mt-4 grid gap-6 lg:grid-cols-2">
      <form className="rounded-xl border bg-card p-4 space-y-3" onSubmit={(e) => { e.preventDefault(); save.mutate(undefined); }}>
        <div className="space-y-1.5"><Label>Class name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
        <div className="space-y-1.5"><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label>Target band</Label><Input type="number" step={0.5} min={0} max={9} value={form.targetBand ?? ""} onChange={(e) => setForm({ ...form, targetBand: e.target.value ? Number(e.target.value) : undefined })} /></div>
          <div className="space-y-1.5"><Label>Max students</Label><Input type="number" min={1} value={form.maxMembers ?? ""} onChange={(e) => setForm({ ...form, maxMembers: e.target.value ? Number(e.target.value) : undefined })} /></div>
        </div>
        <div className="space-y-1.5"><Label>How students join</Label>
          <select className="w-full rounded-lg border bg-background p-2 text-sm" value={form.joinPolicy} onChange={(e) => setForm({ ...form, joinPolicy: e.target.value as "open" | "approval" | "closed" })}>
            <option value="approval">I approve each request</option><option value="open">Anyone with the code joins instantly</option><option value="closed">Closed — nobody can join</option>
          </select>
        </div>
        <div className="flex items-center gap-3"><Button type="submit" disabled={save.isPending}>Save changes</Button>{msg && <span className="text-sm text-emerald-600">{msg}</span>}</div>
      </form>
      <div className="space-y-4">
        <div className="rounded-xl border bg-card p-4">
          <h4 className="font-semibold">Join code</h4>
          <p className="text-sm text-muted-foreground">Generate a new code if the old one leaked. Existing students are not affected.</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => rotate.mutate()} disabled={rotate.isPending}>Generate new code</Button>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <h4 className="font-semibold">{cls.status === "archived" ? "Restore class" : "Archive class"}</h4>
          <p className="text-sm text-muted-foreground">{cls.status === "archived" ? "Students regain access and you can assign work again." : "Students keep read access to their results; no new work can be assigned or started."}</p>
          <Button variant={cls.status === "archived" ? "default" : "destructive"} size="sm" className="mt-2" onClick={() => save.mutate({ status: cls.status === "archived" ? "active" : "archived" })}>{cls.status === "archived" ? "Restore" : "Archive"}</Button>
        </div>
      </div>
    </div>
  );
}
