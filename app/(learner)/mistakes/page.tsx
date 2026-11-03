"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { useAuth } from "@/contexts/auth-context";
import { MasteryList } from "./_mastery-list";
import { useMistakeSummary, useMistakes, useUpdateMistakeStatus } from "@/lib/hooks/use-analytics";
import { errorCauseAdvice, errorCauseLabel } from "@/lib/error-causes";
import { QUESTION_TYPE_LABELS_VI, normalizeQuestionType } from "@/lib/question-types";
import type { MistakeStatus } from "@/lib/types";
import { drillHref } from "@/lib/api/drills";

const STATUS_TABS: { key: MistakeStatus | "all"; label: string }[] = [
    { key: "all", label: "Tất cả" },
    { key: "new", label: "Chưa ôn" },
    { key: "reviewing", label: "Đang ôn" },
    { key: "fixed", label: "Đã nắm" },
];

const SKILLS = [
    { key: "", label: "Mọi kỹ năng" },
    { key: "listening", label: "Listening" },
    { key: "reading", label: "Reading" },
];

const fmtDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString("vi-VN") : "");

export default function MistakesPage() {
    const { user } = useAuth();
    const learnerId = (user as { profileId?: string; id?: string } | null)?.profileId ?? (user as { id?: string } | null)?.id;
    const [status, setStatus] = useState<MistakeStatus | "all">("all");
    const [skill, setSkill] = useState("");
    const [cause, setCause] = useState("");

    const { data: mistakes, isLoading, isError } = useMistakes(learnerId, {
        status: status === "all" ? undefined : status,
        skill: skill || undefined,
    });
    const { data: summary } = useMistakeSummary(learnerId);
    const update = useUpdateMistakeStatus(learnerId);

    const rows = useMemo(
        () => (mistakes ?? []).filter((m) => !cause || (m.errorCause ?? "unknown") === cause),
        [mistakes, cause],
    );
    const causes = Object.entries(summary?.byCause ?? {}).sort((a, b) => b[1] - a[1]);
    const typeLabel = (t?: string | null) => {
        const c = normalizeQuestionType(t);
        return c ? QUESTION_TYPE_LABELS_VI[c] : t ?? "";
    };

    return (
        <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
            <Breadcrumb items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Sổ lỗi" }]} />
            <div>
                <h1 className="text-2xl font-bold">Sổ lỗi</h1>
                <MasteryList learnerId={learnerId} />
                <p className="text-sm text-muted-foreground">
                    Mọi câu bạn làm sai được gom ở đây cùng nguyên nhân. Ôn lại rồi đánh dấu &quot;Đã nắm&quot; khi bạn tự tin.
                </p>
            </div>

            {summary && summary.total > 0 && (
                <Card className="bg-card shadow-sm">
                    <CardContent className="p-4 space-y-2">
                        <p className="text-sm font-semibold">
                            {summary.total} câu sai · {summary.byStatus.fixed ?? 0} đã nắm
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            <button type="button" onClick={() => setCause("")} className={`rounded-full border px-2.5 py-0.5 text-xs ${cause === "" ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"}`}>Mọi nguyên nhân</button>
                            {causes.map(([k, n]) => (
                                <button key={k} type="button" onClick={() => setCause(k === cause ? "" : k)} className={`rounded-full border px-2.5 py-0.5 text-xs ${cause === k ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"}`}>
                                    {errorCauseLabel(k)} · {n}
                                </button>
                            ))}
                        </div>
                        {causes[0] && (
                            <p className="text-xs text-muted-foreground">
                                <span className="font-medium text-foreground">Ưu tiên sửa: </span>
                                {errorCauseLabel(causes[0][0])} — {errorCauseAdvice(causes[0][0])}
                            </p>
                        )}
                    </CardContent>
                </Card>
            )}

            <div className="flex flex-wrap items-center gap-2">
                <div className="flex rounded-lg border border-border p-0.5">
                    {STATUS_TABS.map((t) => (
                        <button key={t.key} type="button" onClick={() => setStatus(t.key)} className={`rounded-md px-3 py-1 text-xs font-medium ${status === t.key ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                            {t.label}
                        </button>
                    ))}
                </div>
                <select value={skill} onChange={(e) => setSkill(e.target.value)} className="h-8 rounded-md border border-input bg-background px-2 text-xs">
                    {SKILLS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
                {(summary?.total ?? 0) > 0 && (
                    <Link href={drillHref({ skill: skill === "listening" ? "listening" : "reading", errorCause: cause || undefined })} className="ml-auto">
                        <Button size="sm" className="h-8 text-xs">Luyện lại {cause ? errorCauseLabel(cause).toLowerCase() : "các câu sai"}</Button>
                    </Link>
                )}
            </div>

            {isLoading ? (
                <p className="text-sm text-muted-foreground">Đang tải sổ lỗi…</p>
            ) : isError ? (
                <p className="text-sm text-rose-600">Không tải được sổ lỗi. Thử tải lại trang.</p>
            ) : rows.length === 0 ? (
                <Card className="bg-card shadow-sm">
                    <CardContent className="p-8 text-center space-y-3">
                        <p className="text-sm text-muted-foreground">
                            {summary?.total ? "Không có câu nào khớp bộ lọc." : "Chưa có câu sai nào. Làm một đề Reading hoặc Listening để bắt đầu."}
                        </p>
                        {!summary?.total && <Link href="/tests"><Button size="sm">Chọn đề luyện</Button></Link>}
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-2">
                    {rows.map((m) => (
                        <Card key={m.id} className="bg-card shadow-sm">
                            <CardContent className="p-4 flex flex-wrap items-start gap-3">
                                <div className="flex-1 min-w-[220px] space-y-1 text-sm">
                                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                        <span className="capitalize">{m.skill ?? "—"}</span>
                                        <span>·</span>
                                        <span>{typeLabel(m.questionType ?? m.mistakeType)}</span>
                                        <span>·</span>
                                        <span>{fmtDate(m.createdAt)}</span>
                                    </div>
                                    <p>
                                        <span className="font-mono line-through text-rose-500">{m.userAnswer?.trim() || "bỏ trống"}</span>
                                        <span className="mx-2 text-muted-foreground">→</span>
                                        <span className="font-mono font-semibold text-emerald-700">{m.correctAnswer ?? "—"}</span>
                                    </p>
                                    <p className="text-xs">
                                        <span className="rounded-full bg-muted px-2 py-0.5 font-medium">{errorCauseLabel(m.errorCause)}</span>
                                        <span className="ml-2 text-muted-foreground">{errorCauseAdvice(m.errorCause)}</span>
                                    </p>
                                </div>
                                <div className="flex flex-col items-end gap-1.5">
                                    {m.status !== "fixed" ? (
                                        <Button size="sm" variant="outline" className="h-7 text-xs" disabled={update.isPending} onClick={() => update.mutate({ id: m.id, status: "fixed" })}>
                                            Đã nắm
                                        </Button>
                                    ) : (
                                        <Button size="sm" variant="ghost" className="h-7 text-xs" disabled={update.isPending} onClick={() => update.mutate({ id: m.id, status: "reviewing" })}>
                                            Ôn lại
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
