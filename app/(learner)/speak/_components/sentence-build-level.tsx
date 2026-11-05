"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { speakingApi, type ScoreResult, type SpeakingExercise } from "@/lib/api/speaking";
import { RecorderPanel } from "./recorder-panel";
import { ScoreView } from "./score-view";

const norm = (s: string) => s.toLowerCase().replace(/[.?!,]/g, "");

/** Bậc 2 — Ghép câu: xếp thẻ từ đúng thứ tự → Kiểm tra → đọc câu vừa ghép → chấm. */
export function SentenceBuildLevel({ soundTips, onSaved }: { soundTips: Record<string, string>; onSaved: () => void }) {
    const q = useQuery({ queryKey: ["speak", "exercises", "sentence_build"], queryFn: () => speakingApi.exercises({ level: "sentence_build", limit: 30 }) });
    const [idx, setIdx] = useState(0);
    const [picked, setPicked] = useState<number[]>([]);
    const [checked, setChecked] = useState<null | { ok: boolean; wrongAt: number[] }>(null);
    const [result, setResult] = useState<ScoreResult | null>(null);
    const [scoring, setScoring] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const items = q.data?.items ?? [];
    const ex: SpeakingExercise | undefined = items[idx];

    if (q.isLoading) return <p className="text-sm text-muted-foreground">Đang tải câu…</p>;
    if (q.isError) return <p className="text-sm text-rose-600">Không tải được bài luyện.</p>;
    if (!ex) return <p className="text-sm text-muted-foreground">Chưa có bài ghép câu.</p>;

    const tokens = ex.shuffledTokens ?? norm(ex.text).split(/\s+/);
    const target = norm(ex.text).split(/\s+/);
    const sentence = picked.map((i) => tokens[i]).join(" ");

    const check = () => {
        const got = picked.map((i) => norm(tokens[i]));
        const wrongAt = got.map((w, i) => (w === target[i] ? -1 : i)).filter((i) => i >= 0);
        setChecked({ ok: wrongAt.length === 0 && got.length === target.length, wrongAt });
    };
    const reset = () => { setPicked([]); setChecked(null); setResult(null); setError(null); };
    const next = () => { reset(); setIdx((i) => (i + 1) % items.length); };
    const score = async (blob: Blob, peakLevel: number | null) => {
        setScoring(true); setError(null);
        try { setResult(await speakingApi.score({ blob, referenceText: ex.text, level: "sentence_build", exerciseId: ex.id, targetSounds: ex.targetSounds, peakLevel })); onSaved(); }
        catch (e) { setError(e instanceof Error ? e.message : "Không chấm được"); }
        finally { setScoring(false); }
    };

    return (
        <Card>
            <CardContent className="space-y-5 p-5">
                <p className="text-xs text-muted-foreground">Câu {idx + 1}/{items.length}{ex.topic ? ` · ${ex.topic}` : ""}</p>
                <div className="min-h-12 rounded-md border border-dashed p-3" aria-label="Câu đang ghép">
                    {picked.length === 0 && <p className="text-sm text-muted-foreground">Chạm vào các từ bên dưới theo đúng thứ tự.</p>}
                    <div className="flex flex-wrap gap-1.5">
                        {picked.map((ti, pos) => (
                            <button key={`${ti}-${pos}`} type="button" disabled={!!checked?.ok} onClick={() => { setPicked((p) => p.filter((_, k) => k !== pos)); setChecked(null); }}
                                className={`rounded-md border px-2.5 py-1 text-sm ${checked && checked.wrongAt.includes(pos) ? "border-rose-300 bg-rose-50 text-rose-700" : checked?.ok ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "bg-background"}`}>
                                {tokens[ti]}
                            </button>
                        ))}
                    </div>
                </div>
                {!checked?.ok && (
                    <div className="flex flex-wrap gap-1.5">
                        {tokens.map((t, i) => picked.includes(i) ? null : (
                            <button key={i} type="button" onClick={() => { setPicked((p) => [...p, i]); setChecked(null); }} className="rounded-md border bg-muted px-2.5 py-1 text-sm hover:bg-accent">{t}</button>
                        ))}
                    </div>
                )}
                {!checked?.ok && (
                    <div className="flex gap-2">
                        <Button type="button" size="sm" onClick={check} disabled={picked.length !== tokens.length}>Kiểm tra</Button>
                        <Button type="button" size="sm" variant="ghost" onClick={reset} disabled={picked.length === 0}>Xếp lại</Button>
                    </div>
                )}
                {checked && !checked.ok && (
                    <p className="text-sm text-amber-800">
                        {checked.wrongAt.length} từ chưa đúng vị trí (viền đỏ). Gợi ý: tiếng Anh theo trật tự <span className="font-medium">Chủ ngữ → Động từ → Tân ngữ</span>; trạng từ tần suất (usually, often) đứng trước động từ chính; trạng ngữ thời gian/nơi chốn đứng cuối câu.
                    </p>
                )}
                {checked?.ok && (
                    <div className="space-y-4">
                        <p className="text-sm text-emerald-700">Đúng thứ tự. Giờ đọc to câu này:</p>
                        <p className="font-serif text-2xl">{ex.text}</p>
                        {!result && <RecorderPanel key={ex.id} modelText={ex.text} maxSeconds={12} onScore={score} scoring={scoring} />}
                        {error && <p className="text-sm text-rose-600">{error}</p>}
                        {result && <ScoreView result={result} soundTips={soundTips} showFluency />}
                        <div className="flex gap-2">
                            {result && <Button type="button" size="sm" onClick={next}>Câu tiếp theo</Button>}
                            {result && <Button type="button" size="sm" variant="ghost" onClick={() => setResult(null)}>Đọc lại</Button>}
                        </div>
                    </div>
                )}
                <p className="sr-only">{sentence}</p>
            </CardContent>
        </Card>
    );
}
