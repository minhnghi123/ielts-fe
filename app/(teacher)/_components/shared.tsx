"use client";
import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AssignmentStatus, Skill, SubmissionStatus } from "@/lib/types";

export const SKILL_ICON: Record<Skill, string> = {
  listening: "headphones",
  reading: "menu_book",
  writing: "edit_note",
  speaking: "mic",
};

export const SKILL_COLOR: Record<Skill, string> = {
  listening: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  reading: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  writing: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  speaking: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
};

export function SkillBadge({ skill }: { skill?: Skill | string | null }) {
  const s = (skill ?? "reading") as Skill;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold capitalize", SKILL_COLOR[s])}>
      <span className="material-symbols-outlined text-[14px]">{SKILL_ICON[s] ?? "quiz"}</span>
      {s}
    </span>
  );
}

const ASSIGNMENT_STATUS: Record<AssignmentStatus, { label: string; cls: string }> = {
  scheduled: { label: "Scheduled", cls: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200" },
  open: { label: "Open", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
  closed: { label: "Closed", cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
  archived: { label: "Archived", cls: "bg-zinc-100 text-zinc-500" },
};

export function AssignmentStatusBadge({ status, dueAt }: { status: AssignmentStatus; dueAt?: string }) {
  const [now] = useState(() => Date.now());
  const soon = status === "open" && dueAt && new Date(dueAt).getTime() - now < 24 * 3600_000 && new Date(dueAt).getTime() > now;
  const meta = soon ? { label: "Due soon", cls: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" } : ASSIGNMENT_STATUS[status];
  return <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", meta.cls)}>{meta.label}</span>;
}

const SUB_STATUS: Record<SubmissionStatus | "missing", { label: string; cls: string }> = {
  missing: { label: "Not started", cls: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300" },
  in_progress: { label: "In progress", cls: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300" },
  submitted: { label: "Submitted", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
  late: { label: "Late", cls: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300" },
  expired: { label: "Timed out", cls: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" },
};

export function SubmissionStatusBadge({ status }: { status: SubmissionStatus | "missing" }) {
  const meta = SUB_STATUS[status] ?? SUB_STATUS.missing;
  return <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", meta.cls)}>{meta.label}</span>;
}

export function BandPill({ band, reviewed }: { band: number | null | undefined; reviewed?: boolean }) {
  if (band === null || band === undefined) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="inline-flex items-center gap-1 font-semibold tabular-nums">
      {Number(band).toFixed(1)}
      {reviewed && (
        <span className="material-symbols-outlined text-[14px] text-primary" title="Reviewed by teacher">
          verified
        </span>
      )}
    </span>
  );
}

export function formatDateTime(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function relativeDue(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  const abs = Math.abs(diff);
  const h = Math.floor(abs / 3600_000);
  const d = Math.floor(h / 24);
  const txt = d >= 1 ? `${d}d ${h % 24}h` : h >= 1 ? `${h}h ${Math.floor((abs % 3600_000) / 60_000)}m` : `${Math.floor(abs / 60_000)}m`;
  return diff >= 0 ? `due in ${txt}` : `${txt} overdue`;
}

export function PageHeader({ title, subtitle, actions, back }: { title: string; subtitle?: string; actions?: React.ReactNode; back?: { href: string; label: string } }) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between mb-6">
      <div>
        {back && (
          <Link href={back.href} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-1">
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            {back.label}
          </Link>
        )}
        <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function errorMessage(e: unknown, fallback: string): string {
  const r = (e as { response?: { data?: { message?: string; error?: { message?: string } } } })?.response?.data;
  return r?.message || r?.error?.message || fallback;
}

export function EmptyState({ icon, title, description, action }: { icon: string; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center rounded-xl border border-dashed p-10 gap-2">
      <span className="material-symbols-outlined text-4xl text-muted-foreground">{icon}</span>
      <h3 className="font-semibold">{title}</h3>
      {description && <p className="text-sm text-muted-foreground max-w-sm">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function StatCard({ label, value, hint }: { icon?: string; label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="rounded-md bg-muted px-4 py-3">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-[2rem] leading-none tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground truncate">{hint}</p>}
    </div>
  );
}

export function PendingApprovalBanner() {
  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700 p-4 flex gap-3 mb-6">
      <span className="material-symbols-outlined text-amber-600">hourglass_top</span>
      <div>
        <p className="font-semibold text-amber-800 dark:text-amber-200">Your teacher account is waiting for approval</p>
        <p className="text-sm text-amber-700 dark:text-amber-300">
          An administrator will review your request shortly. Until then you can browse the public test bank and complete your profile.
        </p>
        <Badge variant="outline" className="mt-2">Pending</Badge>
      </div>
    </div>
  );
}
