"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { classroomApi } from "@/lib/api/classroom";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, PageHeader, PendingApprovalBanner, SkillBadge, StatCard, relativeDue } from "../_components/shared";

export default function TeacherOverviewPage() {
  const { user } = useAuth();
  const pending = user?.role === "teacher" && user.teacherStatus !== "approved";
  const { data, isLoading, isError } = useQuery({
    queryKey: ["teacher", "dashboard"],
    queryFn: classroomApi.teacherDashboard,
    enabled: !pending,
  });

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <PageHeader
        title={`Welcome${user?.fullName ? `, ${user.fullName.split(" ").slice(-1)[0]}` : ""}`}
        subtitle="Your classes, assignments and work waiting for review."
        actions={!pending && <Button asChild><Link href="/teacher/classes?new=1"><span className="material-symbols-outlined text-[18px] mr-1">add</span>New class</Link></Button>}
      />
      {pending && <PendingApprovalBanner />}
      {!pending && isLoading && <div className="grid gap-4 md:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)}</div>}
      {isError && <p className="text-sm text-destructive">Could not load your dashboard. Please refresh.</p>}
      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon="groups" label="Active classes" value={data.totals.classes} />
            <StatCard icon="school" label="Students" value={data.totals.students} />
            <StatCard icon="assignment" label="Open assignments" value={data.totals.openAssignments} />
            <StatCard icon="rate_review" label="Awaiting your review" value={data.totals.pendingReview} hint="Writing & Speaking" />
          </div>
          {data.totals.pendingJoinRequests > 0 && (
            <div className="mt-4 rounded-xl border bg-card p-4 flex items-center justify-between">
              <p className="text-sm"><span className="font-semibold">{data.totals.pendingJoinRequests}</span> student{data.totals.pendingJoinRequests > 1 ? "s are" : " is"} waiting to join your classes.</p>
              <Button variant="outline" size="sm" asChild><Link href="/teacher/classes">Review requests</Link></Button>
            </div>
          )}
          <div className="grid gap-6 lg:grid-cols-3 mt-8">
            <section className="lg:col-span-2">
              <h2 className="font-semibold mb-3">Your classes</h2>
              {data.classes.length === 0 ? (
                <EmptyState icon="groups" title="No classes yet" description="Create a class, share the join code with your students, then assign a test." action={<Button asChild><Link href="/teacher/classes?new=1">Create your first class</Link></Button>} />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {data.classes.map((c) => (
                    <Link key={c.id} href={`/teacher/classes/${c.id}`} className="rounded-xl border bg-card p-4 hover:border-primary/50 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold truncate">{c.name}</h3>
                        {c.targetBand && <span className="text-xs rounded-full bg-primary/10 text-primary px-2 py-0.5">Target {Number(c.targetBand).toFixed(1)}</span>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{c.memberCount ?? 0} students · {c.assignmentCount ?? 0} assignments{(c.pendingCount ?? 0) > 0 ? ` · ${c.pendingCount} pending` : ""}</p>
                    </Link>
                  ))}
                </div>
              )}
            </section>
            <section>
              <h2 className="font-semibold mb-3">Due within 3 days</h2>
              {data.needsAttention.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing is due soon.</p>
              ) : (
                <ul className="space-y-2">
                  {data.needsAttention.map((a) => (
                    <li key={a.id}>
                      <Link href={`/teacher/classes/${a.classId}/assignments/${a.id}`} className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{a.title}</p>
                          <p className="text-xs text-muted-foreground">{relativeDue(a.dueAt)}</p>
                        </div>
                        <SkillBadge skill={a.skill} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
