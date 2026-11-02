"use client";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/lib/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { TeacherAccount, TeacherStatus } from "@/lib/types";

const TABS: { value: TeacherStatus; label: string }[] = [{ value: "pending", label: "Pending" }, { value: "approved", label: "Approved" }, { value: "rejected", label: "Rejected" }];

export default function AdminTeachersPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<TeacherStatus>("pending");
  const [search, setSearch] = useState("");
  const { data, isLoading } = useQuery({ queryKey: ["admin", "teachers", tab, search], queryFn: () => authApi.getTeachers({ approval: tab, search: search || undefined, limit: 50 }) });
  const approve = useMutation({ mutationFn: ({ id, status, reason }: { id: string; status: "approved" | "rejected"; reason?: string }) => authApi.updateTeacherApproval(id, status, reason), onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "teachers"] }) });
  const demote = useMutation({ mutationFn: (accountId: string) => authApi.updateUserRole(accountId, "learner"), onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "teachers"] }) });
  const list: TeacherAccount[] = data?.data ?? [];
  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <div className="mb-6"><h1 className="font-display text-2xl md:text-3xl font-bold">Teachers</h1><p className="text-sm text-muted-foreground">Approve teacher accounts before they can create classes and tests.</p></div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {TABS.map((t) => <button key={t.value} role="tab" aria-selected={tab === t.value} onClick={() => setTab(t.value)} className={`rounded-full px-3 py-1 text-sm ${tab === t.value ? "bg-primary text-primary-foreground" : "border hover:bg-accent"}`}>{t.label}</button>)}
        <Input className="ml-auto max-w-xs" placeholder="Search name or email…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      {isLoading ? <Skeleton className="h-48" /> : list.length === 0 ? <p className="text-sm text-muted-foreground rounded-xl border border-dashed p-8 text-center">No {tab} teachers.</p> : (
        <ul className="space-y-2">
          {list.map((t) => (
            <li key={t.id} className="rounded-xl border bg-card p-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Avatar className="h-10 w-10"><AvatarImage src={t.avatarUrl ?? undefined} /><AvatarFallback>{(t.fullName || t.email || "?").charAt(0).toUpperCase()}</AvatarFallback></Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{t.fullName || t.email}</p>
                <p className="text-xs text-muted-foreground truncate">{t.email}{t.organization ? ` · ${t.organization}` : ""} · requested {new Date(t.createdAt).toLocaleDateString()}</p>
                {t.bio && <p className="text-sm mt-1 line-clamp-2">{t.bio}</p>}
                {t.rejectionReason && <p className="text-xs text-destructive mt-1">Reason: {t.rejectionReason}</p>}
              </div>
              <div className="flex gap-2 shrink-0">
                {t.approvalStatus !== "approved" && <Button size="sm" onClick={() => approve.mutate({ id: t.id, status: "approved" })} disabled={approve.isPending}>Approve</Button>}
                {t.approvalStatus !== "rejected" && <Button size="sm" variant="outline" onClick={() => { const reason = prompt("Reason for rejection (shown to the teacher, optional):") ?? undefined; approve.mutate({ id: t.id, status: "rejected", reason: reason || undefined }); }} disabled={approve.isPending}>Reject</Button>}
                {t.approvalStatus === "approved" && <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => { if (confirm("Change this account back to a learner? Their classes stay but become inaccessible to them.")) demote.mutate(t.accountId); }}>Make learner</Button>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
