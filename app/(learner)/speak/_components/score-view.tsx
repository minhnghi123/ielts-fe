"use client";

import type { ScoreResult, WordResult } from "@/lib/api/speaking";
import { SOUND_LABEL } from "@/lib/speaking/align";

const STATUS_CLASS: Record<WordResult["status"], string> = {
    correct: "text-emerald-700 border-emerald-200 bg-emerald-50",
    substituted: "text-amber-800 border-amber-200 bg-amber-50 line-through decoration-amber-500",
    omitted: "text-rose-700 border-rose-200 bg-rose-50 border-dashed",
    inserted: "text-muted-foreground border-border bg-muted italic",
};

/** Per-word result chips + measured fluency + Vietnamese comments. Shared by every scripted level. */
export function ScoreView({ result, soundTips, showFluency }: { result: ScoreResult; soundTips: Record<string, string>; showFluency: boolean }) {
    const missed = new Map<string, number>();
    for (const w of result.wordResults) for (const s of w.sounds ?? []) if (s.actual !== s.expected) missed.set(s.expected, (missed.get(s.expected) ?? 0) + 1);
    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
                <p className="text-3xl font-semibold tabular-nums">{result.scores.overall}<span className="text-base font-normal text-muted-foreground">/100</span></p>
                <p className="text-sm text-muted-foreground">Chính xác {result.scores.accuracy}% · Đầy đủ {result.scores.completeness}%{showFluency && result.wpm != null ? ` · ${result.wpm} từ/phút` : ""}</p>
            </div>
            <div className="flex flex-wrap gap-1.5" aria-label="Kết quả từng từ">
                {result.wordResults.map((w, i) => (
                    <span key={i} className={`rounded-md border px-2 py-0.5 text-sm ${STATUS_CLASS[w.status]}`} title={w.status === "substituted" ? `Nghe thành "${w.heard}"` : w.status === "omitted" ? "Bỏ sót" : w.status === "inserted" ? "Từ thừa" : "Đúng"}>
                        {w.word}{w.status === "substituted" && w.heard ? <span className="ml-1 no-underline text-xs">→ {w.heard}</span> : null}
                    </span>
                ))}
            </div>
            <p className="text-xs text-muted-foreground">Xanh: đúng · Vàng gạch: nghe thành từ khác · Đỏ nét đứt: bỏ sót · Xám: từ thừa</p>
            {missed.size > 0 && (
                <div className="space-y-1.5">
                    <p className="text-sm font-medium">Âm có thể chưa đúng</p>
                    <ul className="space-y-1">
                        {[...missed.entries()].slice(0, 3).map(([s]) => (
                            <li key={s} className="text-sm"><span className="font-medium">{SOUND_LABEL[s] ?? s}</span>{soundTips[s] ? <span className="text-muted-foreground"> — {soundTips[s]}</span> : null}</li>
                        ))}
                    </ul>
                </div>
            )}
            <ul className="space-y-1 text-sm">
                {result.commentVi.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
            {result.transcript && <p className="text-xs text-muted-foreground">Máy nghe được: “{result.transcript}”</p>}
            <p className="text-xs text-muted-foreground">Chấm dựa trên nhận diện giọng nói; lỗi phát âm nhẹ có thể không bị phát hiện. Hãy nghe lại bản ghi của bạn và so với giọng mẫu.</p>
        </div>
    );
}
