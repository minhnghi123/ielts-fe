"use client";

import Link from "next/link";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { useRegeneratePlan, useSetTaskDone, useToday, useWeekPlan } from "@/lib/hooks/use-plan";
import { drillHref } from "@/lib/api/drills";
import type { StudyTask } from "@/lib/types";

const SKILL_VI: Record<string, string> = { listening: "Listening", reading: "Reading", writing: "Writing", speaking: "Speaking" };
const DAY_VI = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

/** Where the task's button goes. Placement without skill → goals tab. */
export function taskHref(t: StudyTask): string {
    if (t.taskType === "placement" && !t.skill) return "/profile?tab=goals";
    if (t.taskType === "review") return "/mistakes";
    if (t.taskType === "drill" && (t.skill === "reading" || t.skill === "listening")) return drillHref({ skill: t.skill, questionType: t.kc ?? undefined });
    if (t.taskType === "speaking" && t.refType !== "test") {
        if (t.kc?.startsWith("ph:")) return `/speak?level=word&sound=${encodeURIComponent(t.kc.slice(3))}`;
        return `/speak?level=${t.kc === "free" ? "free" : "word"}`;
    }
    if (t.refType === "test" && t.refId) return `/practice/${t.refId}`;
    return t.skill ? `/tests?skill=${t.skill}` : "/tests";
}

function taskVerb(t: StudyTask): string {
    switch (t.taskType) {
        case "review": return "Ôn ngay";
        case "drill": return "Luyện";
        case "mock": return "Làm đề";
        case "writing": return "Viết bài";
        case "speaking": return "Luyện nói";
        default: return t.skill ? "Làm đề" : "Đặt mục tiêu";
    }
}

function TaskRow({ t, learnerId, compact }: { t: StudyTask; learnerId?: string; compact?: boolean }) {
    const setDone = useSetTaskDone(learnerId);
    const done = !!t.doneAt;
    return (
        <li className={`flex items-start gap-3 py-2.5 ${done ? "opacity-60" : ""}`}>
            <button
                type="button"
                aria-label={done ? "Bỏ đánh dấu hoàn thành" : "Đánh dấu hoàn thành"}
                disabled={setDone.isPending}
                onClick={() => setDone.mutate({ id: t.id, done: !done })}
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${done ? "bg-primary border-primary text-primary-foreground" : "border-border hover:border-primary"}`}
            >
                {done && <Check className="h-3.5 w-3.5" />}
            </button>
            <div className="min-w-0 flex-1">
                <p className={`text-sm font-medium ${done ? "line-through" : ""}`}>{t.titleVi}</p>
                {!compact && t.reasonVi && <p className="text-xs text-muted-foreground">{t.reasonVi}</p>}
                <p className="text-[11px] text-muted-foreground">
                    {t.estMinutes} phút{t.skill ? ` · ${SKILL_VI[t.skill] ?? t.skill}` : ""}{t.refId ? " · giáo viên giao" : t.priority === 1 ? " · ưu tiên" : ""}
                </p>
            </div>
            {!done && (
                <Link href={taskHref(t)}>
                    <Button size="sm" variant={t.priority === 1 ? "default" : "outline"} className="h-7 text-xs">{taskVerb(t)}</Button>
                </Link>
            )}
        </li>
    );
}

export function BandStrip({ learnerId }: { learnerId?: string }) {
    const { data } = useToday(learnerId);
    if (!data) return null;
    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {data.bands.map((b) => (
                <div key={b.skill} className="rounded-lg border border-border bg-card px-3 py-2">
                    <p className="text-[11px] text-muted-foreground">{SKILL_VI[b.skill]}</p>
                    <p className="text-sm">
                        <span className="text-lg font-semibold">{b.current != null ? b.current.toFixed(1) : "—"}</span>
                        {b.target != null && <span className="text-muted-foreground"> → {b.target.toFixed(1)}</span>}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                        {b.current == null ? "chưa có bài đo" : b.gap == null ? "" : b.gap <= 0 ? "đạt mục tiêu" : `còn +${b.gap.toFixed(1)}`}
                    </p>
                </div>
            ))}
            {!data.hasGoals && (
                <Link href="/profile?tab=goals" className="col-span-2 sm:col-span-4 text-xs text-primary hover:underline">
                    Đặt mục tiêu band và ngày thi để kế hoạch bám sát bạn hơn →
                </Link>
            )}
        </div>
    );
}

export function TodayCard({ learnerId }: { learnerId?: string }) {
    const { data, isLoading, isError } = useToday(learnerId);
    const [showWeek, setShowWeek] = useState(false);
    const regen = useRegeneratePlan(learnerId);
    const { data: week } = useWeekPlan(learnerId);

    const todayTasks = data?.tasks ?? [];
    const pending = todayTasks.filter((t) => !t.doneAt);
    const minutes = pending.reduce((s, t) => s + t.estMinutes, 0);

    return (
        <Card className="bg-card shadow-sm">
            <CardContent className="p-5 space-y-3">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h2 className="text-lg font-semibold">Hôm nay</h2>
                    {data && (
                        <p className="text-sm text-muted-foreground">
                            {pending.length === 0
                                ? todayTasks.length > 0 ? "Xong việc hôm nay." : "Không có việc nào hôm nay."
                                : `${pending.length} việc · khoảng ${minutes} phút`}
                            {data.streakDays > 1 ? ` · chuỗi ${data.streakDays} ngày` : ""}
                            {data.weeksLeft != null ? ` · còn ${data.weeksLeft} tuần tới ngày thi` : ""}
                        </p>
                    )}
                    <button type="button" onClick={() => setShowWeek((v) => !v)} className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                        {showWeek ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        {showWeek ? "Ẩn cả tuần" : "Xem cả tuần"}
                    </button>
                </div>

                {isLoading && <p className="text-sm text-muted-foreground">Đang lập kế hoạch cho bạn…</p>}
                {isError && <p className="text-sm text-rose-600">Không tải được kế hoạch. Thử tải lại trang.</p>}

                {data && todayTasks.length > 0 && (
                    <ul className="divide-y divide-border">
                        {todayTasks.map((t) => <TaskRow key={t.id} t={t} learnerId={learnerId} />)}
                    </ul>
                )}
                {data && todayTasks.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                        Hôm nay là ngày nghỉ theo lịch của bạn. Muốn làm thêm? <Link href="/mistakes" className="text-primary hover:underline">Ôn sổ lỗi</Link>.
                    </p>
                )}

                {showWeek && week && (
                    <div className="pt-2 space-y-2">
                        <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                                Tuần từ {new Date(week.weekStart).toLocaleDateString("vi-VN")} · {week.doneMinutes}/{week.totalMinutes} phút
                            </p>
                            <Button size="sm" variant="ghost" className="h-7 text-xs" disabled={regen.isPending} onClick={() => regen.mutate()}>
                                <RefreshCw className={`mr-1 h-3 w-3 ${regen.isPending ? "animate-spin" : ""}`} /> Lập lại kế hoạch
                            </Button>
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                            {DAY_VI.map((d, i) => {
                                const date = new Date(week.weekStart);
                                date.setDate(date.getDate() + i);
                                const iso = date.toISOString().slice(0, 10);
                                const items = week.tasks.filter((t) => t.scheduledFor === iso);
                                const isToday = iso === data?.date;
                                return (
                                    <div key={d} className={`rounded-md border p-1.5 min-h-[72px] ${isToday ? "border-primary" : "border-border"}`}>
                                        <p className={`text-[11px] font-medium ${isToday ? "text-primary" : "text-muted-foreground"}`}>{d}</p>
                                        {items.map((t) => (
                                            <p key={t.id} title={t.titleVi} className={`mt-1 truncate text-[11px] ${t.doneAt ? "line-through text-muted-foreground" : ""}`}>{t.titleVi}</p>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                            Kế hoạch dựa trên mục tiêu, số phút/ngày, khoảng cách band từng kỹ năng, câu đến hạn ôn và dạng câu bạn hay sai. Lập lại khi bạn vừa làm xong đề mới.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
