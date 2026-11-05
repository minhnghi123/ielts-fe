"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { speakingApi, topicVi, uploadAudio, type ScoreResult, type SpeakingExercise } from "@/lib/api/speaking";
import { RecorderPanel } from "./recorder-panel";
import { ScoreView } from "./score-view";

/** Bậc 3 — Câu dài (shadowing): nghe mẫu, đọc theo câu 12–25 từ, xem tốc độ và ngắt nghỉ. */
export function SentenceLevel({ soundTips, onSaved }: { soundTips: Record<string, string>; onSaved: () => void }) {
    const q = useQuery({ queryKey: ["speak", "exercises", "sentence"], queryFn: () => speakingApi.exercises({ level: "sentence", limit: 30 }) });
    const [idx, setIdx] = useState(0);
    const [result, setResult] = useState<ScoreResult | null>(null);
    const [scoring, setScoring] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const items = q.data?.items ?? [];
    const ex: SpeakingExercise | undefined = items[idx];

    if (q.isLoading) return <p className="text-sm text-muted-foreground">Đang tải câu…</p>;
    if (q.isError) return <p className="text-sm text-rose-600">Không tải được bài luyện.</p>;
    if (!ex) return <p className="text-sm text-muted-foreground">Chưa có câu dài nào.</p>;

    const score = async (blob: Blob, peakLevel: number | null) => {
        setScoring(true); setError(null);
        try { setResult(await speakingApi.score({ blob, referenceText: ex.text, level: "sentence", exerciseId: ex.id, targetSounds: ex.targetSounds, peakLevel, audioUrl: await uploadAudio(blob) })); onSaved(); }
        catch (e) { setError(e instanceof Error ? e.message : "Không chấm được"); }
        finally { setScoring(false); }
    };
    const next = () => { setResult(null); setError(null); setIdx((i) => (i + 1) % items.length); };
    const wordCount = ex.text.split(/\s+/).length;

    return (
        <Card>
            <CardContent className="space-y-5 p-5">
                <p className="text-xs text-muted-foreground">Câu {idx + 1}/{items.length} · {wordCount} từ{ex.topic ? ` · chủ đề: ${topicVi(ex.topic)}` : ""}</p>
                <p className="font-serif text-2xl leading-snug">{ex.text}</p>
                <p className="text-sm text-muted-foreground">Nghe mẫu một lần, rồi đọc theo cùng nhịp — ngắt ở dấu phẩy, không dừng giữa cụm từ. Mục tiêu 100–140 từ/phút.</p>
                {!result && <RecorderPanel key={ex.id} modelText={ex.text} maxSeconds={25} onScore={score} scoring={scoring} />}
                {error && <p className="text-sm text-rose-600">{error}</p>}
                {result && (
                    <div className="space-y-4">
                        <ScoreView result={result} soundTips={soundTips} showFluency />
                        {result.wpm != null && (
                            <p className="text-sm text-muted-foreground">{result.pauses} lần ngắt dài · {result.fillers} từ đệm · {Math.round(result.durationS)} giây</p>
                        )}
                        <div className="flex gap-2">
                            <Button type="button" size="sm" onClick={next}>Câu tiếp theo</Button>
                            <Button type="button" size="sm" variant="ghost" onClick={() => setResult(null)}>Đọc lại</Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
