"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth-store";
import { learnerModelApi, type KcState, type SkillModel } from "@/lib/api/learner-model";
import { memoryApi } from "@/lib/api/memory";
import { MASTERY_LABELS_VI } from "@/lib/api/words";
import { QUESTION_TYPE_LABELS_VI, normalizeQuestionType } from "@/lib/question-types";
import { errorCauseLabel } from "@/lib/error-causes";
import { SOUND_LABEL } from "@/lib/speaking/align";
import { drillHref } from "@/lib/api/drills";

const SKILL_VI: Record<string, string> = { listening: "Listening", reading: "Reading", writing: "Writing", speaking: "Speaking" };
const LEVEL_CLASS: Record<string, string> = {
    chua_du_du_lieu: "bg-muted text-muted-foreground", yeu: "bg-rose-50 text-rose-700", dang_hoc: "bg-amber-50 text-amber-700", vung: "bg-emerald-50 text-emerald-700", thanh_thao: "bg-primary/10 text-primary",
};
const kcLabel = (kc: string) => { const t = normalizeQuestionType(kc); return t ? QUESTION_TYPE_LABELS_VI[t] ?? kc : kc; };

/**
 * Năng lực của tôi — mô hình học viên mở: hệ thống nghĩ gì về bạn, dựa trên dữ liệu nào, và bạn có thể phản hồi.
 * Band chỉ hiện dạng khoảng kèm số câu; dưới 15 câu không ước lượng.
 */
export default function MySkillsPage() {
    const user = useAuthStore((s) => s.user);
    const learnerId = (user as { profileId?: string } | null)?.profileId || user?.id || null;
    const qc = useQueryClient();
    const q = useQuery({ queryKey: ["learner-model", learnerId], queryFn: () => learnerModelApi.get(learnerId!), enabled: !!learnerId });
    const mem = useQuery({ queryKey: ["memory-forecast", learnerId], queryFn: () => memoryApi.forecast(learnerId!), enabled: !!learnerId, staleTime: 60_000 });
    const [msg, setMsg] = useState<string | null>(null);
    const [msgKind, setMsgKind] = useState<"ok" | "error">("ok");
    const fb = useMutation({
        mutationFn: (input: { skill: string; kc: string; verdict: "vung" | "chua_vung" }) => learnerModelApi.feedback(learnerId!, input),
        onSuccess: (r) => { setMsgKind("ok"); setMsg(`Đã ghi nhận. ${kcLabel(r.kc)}: ${MASTERY_LABELS_VI[r.level]} (điểm năng lực ${Math.round(r.ratingBefore)} → ${Math.round(r.ratingAfter)}).`); qc.invalidateQueries({ queryKey: ["learner-model"] }); qc.invalidateQueries({ queryKey: ["mastery"] }); },
        onError: (e: unknown) => {
            const d = (e as { response?: { data?: { message?: string | string[]; error?: { message?: string | string[] } } } })?.response?.data;
            const m = d?.error?.message ?? d?.message;
            setMsgKind("error");
            setMsg(Array.isArray(m) ? m.join(" ") : m || "Không gửi được phản hồi.");
        },
    });

    return (
        <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
            <div>
                <h1 className="text-2xl font-semibold">Năng lực của tôi</h1>
                <p className="text-sm text-muted-foreground">Đây là những gì hệ thống đang tin về bạn, tính từ các câu bạn đã làm. Nếu bạn thấy sai, hãy phản hồi — mô hình sẽ điều chỉnh và tiếp tục học từ bài làm tiếp theo.</p>
            </div>
            {q.isLoading && <p className="text-sm text-muted-foreground">Đang tải…</p>}
            {q.isError && <p className="text-sm text-rose-600">Không tải được mô hình năng lực.</p>}
            {q.data && (
                <>
                    <div className="grid gap-2 sm:grid-cols-2">
                        {q.data.skills.map((s) => <SkillCard key={s.skill} s={s} />)}
                    </div>
                    <p className="text-xs text-muted-foreground">Cách tính: {q.data.method.bandScale}; chỉ ước lượng khi đã trả lời ≥ {q.data.method.minAnswers} câu; khoảng hẹp dần khi bạn làm nhiều hơn. Đây không phải band thi thật.</p>

                    {q.data.skills.some((s) => s.kcs.length > 0) && (
                        <Card><CardContent className="space-y-4 p-5">
                            <p className="font-medium">Dạng câu — bạn vững đến đâu?</p>
                            {msg && <p className={`text-sm ${msgKind === "error" ? "text-rose-600" : "text-emerald-700"}`}>{msg}</p>}
                            {q.data.skills.filter((s) => s.kcs.length > 0).map((s) => (
                                <div key={s.skill} className="space-y-1.5">
                                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{SKILL_VI[s.skill]}</p>
                                    <ul className="divide-y">
                                        {s.kcs.map((k) => <KcRow key={k.kc} skill={s.skill} k={k} onFeedback={(verdict) => { setMsg(null); fb.mutate({ skill: s.skill, kc: k.kc, verdict }); }} busy={fb.isPending} />)}
                                    </ul>
                                </div>
                            ))}
                        </CardContent></Card>
                    )}

                    <div className="grid gap-2 sm:grid-cols-3">
                        <Card><CardContent className="p-4">
                            <p className="text-xs text-muted-foreground">Âm cần luyện</p>
                            {q.data.sounds.length === 0 ? <p className="mt-1 text-sm text-muted-foreground">Chưa có dữ liệu — <Link href="/speak" className="underline underline-offset-4">luyện nói</Link>.</p> : (
                                <ul className="mt-1 space-y-1">{q.data.sounds.filter((x) => x.level !== "thanh_thao").slice(0, 4).map((x) => (
                                    <li key={x.sound} className="text-sm"><Link href={`/speak?level=word&sound=${x.sound}`} className="underline-offset-4 hover:underline">{SOUND_LABEL[x.sound] ?? x.sound}</Link> <span className="text-muted-foreground">· {MASTERY_LABELS_VI[x.level]} · {x.correct}/{x.attempts}</span></li>
                                ))}</ul>
                            )}
                        </CardContent></Card>
                        <Card><CardContent className="p-4">
                            <p className="text-xs text-muted-foreground">Từ vựng</p>
                            <p className="mt-1 text-2xl font-semibold tabular-nums">{q.data.words.due}<span className="text-sm font-normal text-muted-foreground"> đến hạn</span></p>
                            <p className="text-sm text-muted-foreground">{q.data.words.soon} từ sắp đến hạn trong 2 ngày · {q.data.words.total} từ đã lưu</p>
                            {mem.data && <p className="text-xs text-muted-foreground">Mô hình quên: {mem.data.counts.atRiskWords} từ và {mem.data.counts.atRiskMistakes} câu sổ lỗi dự đoán nhớ dưới 70%{mem.data.model.nObs >= mem.data.model.minObs ? ` · đã hiệu chỉnh riêng cho bạn (hệ số ${mem.data.model.scale})` : ` · dùng tham số mặc định (cần ${mem.data.model.minObs - mem.data.model.nObs} lượt ôn nữa để hiệu chỉnh riêng)`}</p>}
                            {q.data.words.due > 0 && <Link href="/words" className="text-sm text-primary underline-offset-4 hover:underline">Ôn ngay</Link>}
                        </CardContent></Card>
                        <Card><CardContent className="p-4">
                            <p className="text-xs text-muted-foreground">Nguyên nhân sai hay gặp</p>
                            {q.data.topErrorCauses.length === 0 ? <p className="mt-1 text-sm text-muted-foreground">Chưa có lỗi nào trong sổ.</p> : (
                                <ul className="mt-1 space-y-1">{q.data.topErrorCauses.slice(0, 4).map((c) => <li key={c.cause} className="text-sm">{errorCauseLabel(c.cause)} <span className="text-muted-foreground">· {c.n}</span></li>)}</ul>
                            )}
                            <Link href="/mistakes" className="text-sm text-primary underline-offset-4 hover:underline">Mở sổ lỗi</Link>
                        </CardContent></Card>
                    </div>
                </>
            )}
        </div>
    );
}

function SkillCard({ s }: { s: SkillModel }) {
    return (
        <div className="rounded-md border p-4">
            <p className="text-xs text-muted-foreground">{SKILL_VI[s.skill]}</p>
            {s.estimate ? (
                <p className="text-2xl font-semibold tabular-nums">{s.estimate.low.toFixed(1)}–{s.estimate.high.toFixed(1)}</p>
            ) : (
                <p className="text-2xl font-semibold text-muted-foreground">—</p>
            )}
            <p className="text-xs text-muted-foreground">{s.estimate ? `ước lượng từ ${s.answered} câu đã làm` : s.answered > 0 ? `mới ${s.answered} câu — cần ≥ 15 câu để ước lượng` : "chưa có dữ liệu"}</p>
        </div>
    );
}

function KcRow({ skill, k, onFeedback, busy }: { skill: string; k: KcState; onFeedback: (v: "vung" | "chua_vung") => void; busy: boolean }) {
    const canDrill = skill === "reading" || skill === "listening";
    const t = normalizeQuestionType(k.kc);
    return (
        <li className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 text-sm">
            <span className="min-w-[10rem] font-medium">{kcLabel(k.kc)}</span>
            <span className={`rounded-full px-2 py-0.5 text-xs ${LEVEL_CLASS[k.level]}`}>{MASTERY_LABELS_VI[k.level]}</span>
            <span className="text-xs text-muted-foreground">{k.correct}/{k.attempts} đúng · điểm năng lực {Math.round(k.rating)}</span>
            <span className="ml-auto flex gap-1">
                {canDrill && t && <Button asChild size="sm" variant="outline"><Link href={drillHref({ skill, questionType: t })}>Luyện</Link></Button>}
                {k.attempts >= 3 && k.level !== "thanh_thao" && <Button size="sm" variant="ghost" disabled={busy} onClick={() => onFeedback("vung")} title="Tôi thấy mình vững hơn mức này">Tôi đã vững</Button>}
                {k.attempts >= 3 && k.level !== "yeu" && <Button size="sm" variant="ghost" disabled={busy} onClick={() => onFeedback("chua_vung")} title="Tôi thấy mình chưa vững như mức này">Chưa vững</Button>}
            </span>
        </li>
    );
}
