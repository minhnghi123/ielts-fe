"use client";

import type { TestAttempt } from "@/lib/types";

interface Props {
  attempts: TestAttempt[];
  loading: boolean;
}

/** KPI là chữ, không phải ô: số 32px regular, nhãn 14px, không icon. */
export function StatOverview({ attempts, loading }: Props) {
  const completed = attempts.filter((a) => !!a.submittedAt);
  const graded = completed.filter((a) => Number(a.bandScore ?? 0) > 0);
  const avg = graded.length ? graded.reduce((s, a) => s + Number(a.bandScore ?? 0), 0) / graded.length : null;
  const best = graded.length ? Math.max(...graded.map((a) => Number(a.bandScore ?? 0))) : null;
  const inProgress = attempts.length - completed.length;
  const fmt = (b: number | null) => (b == null ? "—" : (Math.round(b * 2) / 2).toFixed(1));

  const stats: Array<{ label: string; value: string; hint: string }> = [
    { label: "Bài đã nộp", value: loading ? "…" : String(completed.length), hint: inProgress > 0 ? `${inProgress} bài đang làm` : "" },
    { label: "Band trung bình", value: loading ? "…" : fmt(avg), hint: graded.length ? `trên ${graded.length} bài có điểm` : "chưa có bài nào được chấm" },
    { label: "Band cao nhất", value: loading ? "…" : fmt(best), hint: "" },
  ];

  return (
    <section className="grid grid-cols-3 gap-6 rounded-md bg-muted px-6 py-5" aria-label="Số liệu tổng quan">
      {stats.map((s) => (
        <div key={s.label}>
          <p className="text-sm text-muted-foreground">{s.label}</p>
          <p className="mt-1 text-[2rem] leading-none tabular-nums">{s.value}</p>
          {s.hint && <p className="mt-1 text-xs text-muted-foreground">{s.hint}</p>}
        </div>
      ))}
    </section>
  );
}
