"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useLearnerGoals, useUpsertLearnerGoals } from "@/lib/hooks/use-analytics";
import type { GoalPurpose, GoalSkill, LearnerGoals, LearnerGoalsInput } from "@/lib/types";

const SKILLS: { key: GoalSkill; label: string }[] = [
    { key: "listening", label: "Listening" },
    { key: "reading", label: "Reading" },
    { key: "writing", label: "Writing" },
    { key: "speaking", label: "Speaking" },
];

const PURPOSES: { value: GoalPurpose; label: string }[] = [
    { value: "study_abroad", label: "Du học" },
    { value: "immigration", label: "Định cư" },
    { value: "work", label: "Công việc" },
    { value: "graduation", label: "Chuẩn đầu ra tốt nghiệp" },
    { value: "other", label: "Khác" },
];

/** 4.0 … 9.0 in half-band steps. */
const BAND_OPTIONS = Array.from({ length: 11 }, (_, i) => (4 + i * 0.5).toFixed(1));

type FormState = {
    targetOverall: string;
    perSkill: boolean;
    skills: Record<GoalSkill, string>;
    examDate: string;
    minutesPerDay: string;
    daysPerWeek: string;
    purpose: GoalPurpose | "";
};

const EMPTY: FormState = {
    targetOverall: "6.5",
    perSkill: false,
    skills: { listening: "", reading: "", writing: "", speaking: "" },
    examDate: "",
    minutesPerDay: "30",
    daysPerWeek: "5",
    purpose: "",
};

function todayIso(): string {
    const d = new Date();
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60_000);
    return local.toISOString().slice(0, 10);
}

export function validateGoals(f: FormState): Record<string, string> {
    const errors: Record<string, string> = {};
    const overall = Number(f.targetOverall);
    if (!BAND_OPTIONS.includes(overall.toFixed(1))) errors.targetOverall = "Chọn band mục tiêu từ 4.0 đến 9.0.";
    if (f.perSkill) {
        for (const s of SKILLS) {
            const v = f.skills[s.key];
            if (v === "") continue;
            const n = Number(v);
            if (!BAND_OPTIONS.includes(n.toFixed(1))) errors[s.key] = "Band không hợp lệ.";
            else if (Math.abs(n - overall) > 2) errors[s.key] = "Chênh lệch với mục tiêu tổng không quá 2 band.";
        }
    }
    if (f.examDate) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(f.examDate)) errors.examDate = "Ngày không hợp lệ.";
        else if (f.examDate < todayIso()) errors.examDate = "Ngày thi phải từ hôm nay trở đi.";
    }
    const mins = Number(f.minutesPerDay);
    if (!Number.isInteger(mins) || mins < 10 || mins > 300) errors.minutesPerDay = "Từ 10 đến 300 phút mỗi ngày.";
    const days = Number(f.daysPerWeek);
    if (!Number.isInteger(days) || days < 1 || days > 7) errors.daysPerWeek = "Từ 1 đến 7 ngày mỗi tuần.";
    return errors;
}

export function toInput(f: FormState): LearnerGoalsInput {
    const skill = (k: GoalSkill) => (f.perSkill && f.skills[k] !== "" ? Number(f.skills[k]) : null);
    return {
        targetOverall: Number(f.targetOverall),
        targetListening: skill("listening"),
        targetReading: skill("reading"),
        targetWriting: skill("writing"),
        targetSpeaking: skill("speaking"),
        examDate: f.examDate || null,
        minutesPerDay: Number(f.minutesPerDay),
        daysPerWeek: Number(f.daysPerWeek),
        purpose: f.purpose || null,
    };
}

function fromGoals(goals: LearnerGoals | null | undefined): FormState {
    if (!goals) return EMPTY;
    const explicit = SKILLS.some((s) => goals.targets[s.key].explicit);
    return {
        targetOverall: goals.targetOverall.toFixed(1),
        perSkill: explicit,
        skills: {
            listening: goals.targets.listening.explicit ? goals.targets.listening.target.toFixed(1) : "",
            reading: goals.targets.reading.explicit ? goals.targets.reading.target.toFixed(1) : "",
            writing: goals.targets.writing.explicit ? goals.targets.writing.target.toFixed(1) : "",
            speaking: goals.targets.speaking.explicit ? goals.targets.speaking.target.toFixed(1) : "",
        },
        examDate: goals.examDate ?? "",
        minutesPerDay: String(goals.minutesPerDay),
        daysPerWeek: String(goals.daysPerWeek),
        purpose: goals.purpose ?? "",
    };
}

export default function GoalsCard({ learnerId }: { learnerId: string }) {
    const { data: goals, isLoading } = useLearnerGoals(learnerId);
    if (isLoading) {
        return (
            <Card className="bg-card shadow-sm">
                <CardHeader>
                    <CardTitle className="text-base">Mục tiêu học tập</CardTitle>
                </CardHeader>
                <CardContent><p className="text-sm text-muted-foreground">Đang tải mục tiêu…</p></CardContent>
            </Card>
        );
    }
    // Remount the form whenever the saved goals change so local state starts from the server copy.
    return <GoalsForm key={goals?.updatedAt ?? "new"} learnerId={learnerId} goals={goals ?? null} />;
}

function GoalsForm({ learnerId, goals }: { learnerId: string; goals: LearnerGoals | null }) {
    const save = useUpsertLearnerGoals(learnerId);
    const [form, setForm] = useState<FormState>(() => fromGoals(goals));
    const [touched, setTouched] = useState(false);

    const errors = useMemo(() => validateGoals(form), [form]);
    const weeklyMinutes = Number(form.minutesPerDay) * Number(form.daysPerWeek);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setTouched(true);
        if (Object.keys(errors).length > 0) {
            toast.error("Vui lòng kiểm tra lại các trường được đánh dấu.");
            return;
        }
        try {
            const saved = await save.mutateAsync(toInput(form));
            toast.success(
                saved.weeksLeft != null
                    ? `Đã lưu mục tiêu. Còn ${saved.weeksLeft} tuần tới ngày thi.`
                    : "Đã lưu mục tiêu học tập.",
            );
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
            toast.error(Array.isArray(msg) ? msg.join(" ") : msg || "Không lưu được. Vui lòng thử lại.");
        }
    };

    const fieldError = (k: string) => (touched && errors[k] ? <p className="text-xs text-red-600 mt-1">{errors[k]}</p> : null);

    return (
        <Card className="bg-card shadow-sm">
            <CardHeader>
                <CardTitle className="text-base">Mục tiêu học tập</CardTitle>
                <CardDescription className="text-xs">
                    Kế hoạch học, nhiệm vụ mỗi ngày và lời khuyên của AI đều dựa trên mục tiêu này.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {(
                    <form onSubmit={onSubmit} className="space-y-6 max-w-xl" noValidate>
                        {goals && (
                            <div className="rounded-lg bg-muted/40 p-4 text-sm space-y-1">
                                <p>
                                    Mục tiêu hiện tại: <strong>band {goals.targetOverall.toFixed(1)}</strong>
                                    {goals.weeksLeft != null ? ` · còn ${goals.weeksLeft} tuần (${goals.daysLeft} ngày)` : " · chưa đặt ngày thi"}
                                    {` · ${goals.weeklyMinutes} phút/tuần`}
                                </p>
                                <p className="text-muted-foreground">
                                    {SKILLS.map((s) => {
                                        const t = goals.targets[s.key];
                                        const cur = t.current != null ? t.current.toFixed(1) : "—";
                                        const gap = t.gap != null && t.gap > 0 ? ` (cần +${t.gap.toFixed(1)})` : t.gap != null && t.gap <= 0 ? " (đã đạt)" : "";
                                        return `${s.label}: ${cur} → ${t.target.toFixed(1)}${gap}`;
                                    }).join(" · ")}
                                </p>
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <Label htmlFor="targetOverall" className="text-xs font-semibold">Band mục tiêu (Overall)</Label>
                            <select
                                id="targetOverall"
                                value={form.targetOverall}
                                onChange={(e) => setForm({ ...form, targetOverall: e.target.value })}
                                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                            >
                                {BAND_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
                            </select>
                            {fieldError("targetOverall")}
                        </div>

                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={form.perSkill}
                                    onChange={(e) => setForm({ ...form, perSkill: e.target.checked })}
                                />
                                Đặt mục tiêu riêng cho từng kỹ năng (ví dụ trường yêu cầu Writing ≥ 6.5)
                            </label>
                            {form.perSkill && (
                                <div className="grid grid-cols-2 gap-3 pl-6">
                                    {SKILLS.map((s) => (
                                        <div key={s.key} className="space-y-1">
                                            <Label className="text-xs">{s.label}</Label>
                                            <select
                                                value={form.skills[s.key]}
                                                onChange={(e) => setForm({ ...form, skills: { ...form.skills, [s.key]: e.target.value } })}
                                                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                                            >
                                                <option value="">Như mục tiêu chung ({form.targetOverall})</option>
                                                {BAND_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
                                            </select>
                                            {fieldError(s.key)}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="examDate" className="text-xs font-semibold">Ngày thi (nếu đã đăng ký)</Label>
                                <Input
                                    id="examDate"
                                    type="date"
                                    min={todayIso()}
                                    value={form.examDate}
                                    onChange={(e) => setForm({ ...form, examDate: e.target.value })}
                                    className="h-9 text-sm"
                                />
                                {fieldError("examDate")}
                                <p className="text-[11px] text-muted-foreground">Để trống nếu chưa đặt lịch thi.</p>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="purpose" className="text-xs font-semibold">Mục đích thi</Label>
                                <select
                                    id="purpose"
                                    value={form.purpose}
                                    onChange={(e) => setForm({ ...form, purpose: e.target.value as GoalPurpose | "" })}
                                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                                >
                                    <option value="">Không nêu</option>
                                    {PURPOSES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="minutesPerDay" className="text-xs font-semibold">Thời gian học mỗi ngày (phút)</Label>
                                <Input
                                    id="minutesPerDay"
                                    type="number"
                                    min={10}
                                    max={300}
                                    step={5}
                                    value={form.minutesPerDay}
                                    onChange={(e) => setForm({ ...form, minutesPerDay: e.target.value })}
                                    className="h-9 text-sm"
                                />
                                {fieldError("minutesPerDay")}
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="daysPerWeek" className="text-xs font-semibold">Số ngày học mỗi tuần</Label>
                                <select
                                    id="daysPerWeek"
                                    value={form.daysPerWeek}
                                    onChange={(e) => setForm({ ...form, daysPerWeek: e.target.value })}
                                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                                >
                                    {[1, 2, 3, 4, 5, 6, 7].map((d) => <option key={d} value={d}>{d} ngày</option>)}
                                </select>
                                {fieldError("daysPerWeek")}
                            </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-border pt-4">
                            <p className="text-xs text-muted-foreground">
                                {Number.isFinite(weeklyMinutes) && weeklyMinutes > 0 ? `≈ ${weeklyMinutes} phút học mỗi tuần` : ""}
                            </p>
                            <Button type="submit" size="sm" disabled={save.isPending}>
                                {save.isPending ? "Đang lưu…" : goals ? "Cập nhật mục tiêu" : "Lưu mục tiêu"}
                            </Button>
                        </div>
                    </form>
                )}
            </CardContent>
        </Card>
    );
}
