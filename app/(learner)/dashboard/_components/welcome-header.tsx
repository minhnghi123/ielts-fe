"use client";

import { useToday } from "@/lib/hooks/use-plan";

/**
 * Editorial greeting: the page opens with one serif sentence that already answers
 * "where am I?" — weeks to the exam and the band gap — instead of a KPI row.
 */
export function WelcomeHeader({ userName, learnerId }: { userName: string; learnerId?: string }) {
  const { data } = useToday(learnerId);
  const first = userName.split(" ").filter(Boolean).pop() || userName || "bạn";
  const tail =
    data?.weeksLeft != null
      ? data.weeksLeft <= 0 ? ", đã tới tuần thi." : `, còn ${data.weeksLeft} tuần tới ngày thi.`
      : data && !data.hasGoals ? ", hãy đặt mục tiêu để bắt đầu." : ".";
  const overall = data?.bands.find((b) => b.skill === "overall") ?? null;
  const measured = data?.bands.filter((b) => b.current != null) ?? [];
  const current = overall?.current ?? (measured.length ? measured.reduce((s, b) => s + (b.current ?? 0), 0) / measured.length : null);
  const target = overall?.target ?? (data?.bands.find((b) => b.target != null)?.target ?? null);

  return (
    <header className="pt-2">
      <h1 className="font-serif text-[2.5rem] leading-tight tracking-tight sm:text-5xl">
        Chào {first}{tail}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {current != null ? `Band hiện tại ${(Math.round(current * 2) / 2).toFixed(1)}` : "Chưa có band đo"}
        {target != null ? ` → mục tiêu ${target.toFixed(1)}` : ""}
        {data?.streakDays && data.streakDays > 1 ? ` · chuỗi ${data.streakDays} ngày` : ""}
      </p>
    </header>
  );
}
