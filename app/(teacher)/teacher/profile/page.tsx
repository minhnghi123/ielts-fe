"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "@/lib/api/auth";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader, PendingApprovalBanner } from "../../_components/shared";

export default function TeacherProfilePage() {
  const { user } = useAuth();
  const [organization, setOrganization] = useState("");
  const [bio, setBio] = useState("");
  const [msg, setMsg] = useState("");
  useEffect(() => {
    authApi.getProfile().then((res) => { const p = res as unknown as { data?: { organization?: string; bio?: string; teacherProfile?: { organization?: string; bio?: string } } }; setOrganization(p?.data?.teacherProfile?.organization ?? p?.data?.organization ?? ""); setBio(p?.data?.teacherProfile?.bio ?? p?.data?.bio ?? ""); }).catch(() => undefined);
  }, []);
  const save = useMutation({ mutationFn: () => authApi.updateTeacherProfile({ organization, bio }), onSuccess: () => { setMsg("Profile saved"); setTimeout(() => setMsg(""), 1500); } });
  const pending = user?.role === "teacher" && user.teacherStatus !== "approved";
  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <PageHeader title="Teacher profile" subtitle={user?.email} />
      {pending && <PendingApprovalBanner />}
      <form className="rounded-xl border bg-card p-4 space-y-4" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
        <div className="space-y-1.5"><Label htmlFor="org">School / centre</Label><Input id="org" value={organization} onChange={(e) => setOrganization(e.target.value)} maxLength={200} /></div>
        <div className="space-y-1.5"><Label htmlFor="bio">Short bio</Label><textarea id="bio" className="w-full rounded-lg border bg-background p-2 text-sm min-h-[100px]" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={1000} placeholder="Experience, certifications, what you teach…" /></div>
        <div className="flex items-center gap-3"><Button type="submit" disabled={save.isPending}>Save</Button>{msg && <span className="text-sm text-emerald-600">{msg}</span>}{save.isError && <span className="text-sm text-destructive">Could not save.</span>}</div>
      </form>
      <div className="rounded-xl border bg-card p-4 mt-4 flex items-center justify-between">
        <div><h3 className="font-semibold">Password</h3><p className="text-sm text-muted-foreground">Change your login password.</p></div>
        <Button variant="outline" asChild><Link href="/settings">Change password</Link></Button>
      </div>
    </div>
  );
}
