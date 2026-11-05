"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { speakingApi, topicVi, uploadAudio, type FreeResult, type SpeakingExercise } from "@/lib/api/speaking";
import { RecorderPanel } from "./recorder-panel";

const ERROR_TYPE_VI: Record<string, string> = { grammar: "Ngữ pháp", vocabulary: "Từ vựng", coherence: "Liên kết ý", content: "Trả lời đề", fluency: "Trôi chảy" };
const PREP_SECONDS = 15;

/** Bậc 4 — Nói tự do (Part 1): câu hỏi → 15 s chuẩn bị (tuỳ chọn) → ghi 30–60 s → fluency đo thật + thẻ lỗi + câu mẫu. */
export function FreeLevel({ onSaved }: { onSaved: () => void }) {
    const q = useQuery({ queryKey: ["speak", "exercises", "free"], queryFn: () => speakingApi.exercises({ level: "free", limit: 20 }) });
    const [idx, setIdx] = useState(0);
    const [phase, setPhase] = useState<"question" | "prep" | "record" | "result">("question");
    const [prepLeft, setPrepLeft] = useState(PREP_SECONDS);
    const [result, setResult] = useState<FreeResult | null>(null);
    const [scoring, setScoring] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showSample, setShowSample] = useState(false);
    const items = q.data?.items ?? [];
    const ex: SpeakingExercise | undefined = items[idx];

    useEffect(() => {
        if (phase !== "prep") return;
        if (prepLeft <= 0) { setPhase("record"); return; }
        const t = setTimeout(() => setPrepLeft((s) => s - 1), 1000);
        return () => clearTimeout(t);
    }, [phase, prepLeft]);

    if (q.isLoading) return <p className="text-sm text-muted-foreground">Đang tải câu hỏi…</p>;
    if (q.isError) return <p className="text-sm text-rose-600">Không tải được bài luyện.</p>;
    if (!ex) return <p className="text-sm text-muted-foreground">Chưa có câu hỏi nói tự do.</p>;

    const score = async (blob: Blob, peakLevel: number | null) => {
        setScoring(true); setError(null);
        try {
            const r = await speakingApi.scoreFree({ blob, question: ex.text, exerciseId: ex.id, sampleAnswer: ex.sampleAnswer, peakLevel, audioUrl: await uploadAudio(blob) });
            setResult(r); setPhase("result"); if (r.attemptId) onSaved();
        } catch (e) { setError(e instanceof Error ? e.message : "Không chấm được"); }
        finally { setScoring(false); }
    };
    const reset = () => { setResult(null); setError(null); setShowSample(false); setPrepLeft(PREP_SECONDS); setPhase("question"); };
    const next = () => { reset(); setIdx((i) => (i + 1) % items.length); };
    const counted = !!result?.attemptId;

    return (
        <Card>
            <CardContent className="space-y-5 p-5">
                <p className="text-xs text-muted-foreground">Câu hỏi {idx + 1}/{items.length}{ex.topic ? ` · chủ đề: ${topicVi(ex.topic)}` : ""} · Part 1</p>
                <p className="font-serif text-2xl leading-snug">{ex.text}</p>
                {ex.tipVi && phase !== "result" && <p className="text-sm text-muted-foreground">{ex.tipVi}</p>}

                {phase === "question" && (
                    <div className="flex flex-wrap gap-2">
                        <Button type="button" size="sm" onClick={() => setPhase("record")}>Trả lời ngay</Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => setPhase("prep")}>Chuẩn bị {PREP_SECONDS} giây</Button>
                    </div>
                )}
                {phase === "prep" && (
                    <div className="flex items-center gap-3">
                        <p className="text-3xl font-semibold tabular-nums">{prepLeft}s</p>
                        <p className="text-sm text-muted-foreground">Nghĩ ý chính + một lý do + một ví dụ.</p>
                        <Button type="button" size="sm" variant="ghost" onClick={() => setPhase("record")}>Bỏ qua</Button>
                    </div>
                )}
                {phase === "record" && (
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Nói 30–60 giây. Bản ghi tự dừng sau 60 giây.</p>
                        <RecorderPanel key={ex.id} modelText={ex.text} maxSeconds={60} onScore={score} scoring={scoring} />
                        {error && <p className="text-sm text-rose-600">{error}</p>}
                    </div>
                )}

                {phase === "result" && result && (
                    <div className="space-y-5">
                        {!counted && result.commentVi.length > 0 && <p className="text-sm text-amber-800">{result.commentVi[0]}</p>}
                        {counted && (
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                {([["Trôi chảy", result.scores.fluencyBand], ["Từ vựng", result.scores.lexical], ["Ngữ pháp", result.scores.grammar], ["Trả lời đề", result.scores.content]] as Array<[string, number | null]>).map(([k, v]) => (
                                    <div key={k}><p className="text-xs text-muted-foreground">{k}</p><p className="text-2xl font-semibold tabular-nums">{v != null ? v.toFixed(1) : "–"}</p></div>
                                ))}
                            </div>
                        )}
                        {counted && <p className="text-xs text-muted-foreground">Trôi chảy đo từ bản ghi ({result.wpm ?? "–"} từ/phút, {result.pauses} ngắt dài, {result.fillers} từ đệm). Từ vựng / Ngữ pháp / Trả lời đề do AI ước lượng theo thang IELTS — mang tính tham khảo.</p>}
                        {result.transcript && <p className="text-sm"><span className="text-muted-foreground">Bạn đã nói: </span>“{result.transcript}”</p>}
                        {result.errors.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-sm font-medium">Thẻ lỗi</p>
                                <ul className="space-y-2">
                                    {result.errors.map((e, i) => (
                                        <li key={i} className="rounded-md border p-3 text-sm">
                                            <p className="text-xs font-medium text-muted-foreground">{ERROR_TYPE_VI[e.type] ?? e.type}</p>
                                            <p className="mt-1"><span className="line-through decoration-rose-400">{e.quote}</span>{e.fix ? <> → <span className="font-medium text-emerald-700">{e.fix}</span></> : null}</p>
                                            {e.explainVi && <p className="mt-1 text-muted-foreground">{e.explainVi}</p>}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {result.strengthsVi.length > 0 && <p className="text-sm"><span className="font-medium">Làm tốt:</span> {result.strengthsVi.join(" · ")}</p>}
                        {result.nextStepVi && <p className="text-sm"><span className="font-medium">Việc tiếp theo:</span> {result.nextStepVi}</p>}
                        {counted && result.commentVi.length > 0 && <ul className="space-y-1 text-sm text-muted-foreground">{result.commentVi.map((c, i) => <li key={i}>{c}</li>)}</ul>}
                        {result.sampleAnswer && (
                            <div>
                                <Button type="button" size="sm" variant="outline" onClick={() => setShowSample((v) => !v)}>{showSample ? "Ẩn câu trả lời mẫu" : "Xem câu trả lời mẫu"}</Button>
                                {showSample && <p className="mt-2 rounded-md bg-muted p-3 text-sm italic leading-relaxed">{result.sampleAnswer}</p>}
                            </div>
                        )}
                        <div className="flex gap-2">
                            <Button type="button" size="sm" onClick={next}>Câu hỏi tiếp theo</Button>
                            <Button type="button" size="sm" variant="ghost" onClick={reset}>Trả lời lại</Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
