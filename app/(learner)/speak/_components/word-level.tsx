"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { speakingApi, uploadAudio, type ScoreResult, type SpeakingExercise } from "@/lib/api/speaking";
import { RecorderPanel } from "./recorder-panel";
import { ScoreView } from "./score-view";
import { SOUND_LABEL } from "@/lib/speaking/align";

/** Bậc 1 — Phát âm từ: một từ, IPA, nghe mẫu, ghi ≤5 s, chấm, tiếp. */
export function WordLevel({ sound, soundTips, onSaved }: { sound: string | null; soundTips: Record<string, string>; onSaved: () => void }) {
    const q = useQuery({ queryKey: ["speak", "exercises", "word", sound], queryFn: () => speakingApi.exercises({ level: "word", sound: sound ?? undefined, limit: 40 }) });
    const [idx, setIdx] = useState(0);
    const [result, setResult] = useState<ScoreResult | null>(null);
    const [scoring, setScoring] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const items = q.data?.items ?? [];
    const ex: SpeakingExercise | undefined = items[idx];

    if (q.isLoading) return <p className="text-sm text-muted-foreground">Đang tải từ…</p>;
    if (q.isError) return <p className="text-sm text-rose-600">Không tải được bài luyện.</p>;
    if (!ex) return <p className="text-sm text-muted-foreground">Chưa có từ nào cho âm này.</p>;

    const score = async (blob: Blob, peakLevel: number | null) => {
        setScoring(true); setError(null);
        try { setResult(await speakingApi.score({ blob, referenceText: ex.text, level: "word", exerciseId: ex.id, targetSounds: ex.targetSounds, peakLevel, audioUrl: await uploadAudio(blob) })); onSaved(); }
        catch (e) { setError(e instanceof Error ? e.message : "Không chấm được"); }
        finally { setScoring(false); }
    };
    const next = () => { setResult(null); setError(null); setIdx((i) => (i + 1) % items.length); };

    return (
        <Card>
            <CardContent className="space-y-5 p-5">
                <p className="text-xs text-muted-foreground">Từ {idx + 1}/{items.length}{ex.targetSounds.length ? ` · âm ${ex.targetSounds.map((t) => SOUND_LABEL[t] ?? t).join(", ")}` : ""}</p>
                <div>
                    <p className="font-serif text-4xl">{ex.text}</p>
                    {ex.ipa && <p className="mt-1 text-lg text-muted-foreground">{ex.ipa}</p>}
                    {ex.targetSounds[0] && soundTips[ex.targetSounds[0]] && <p className="mt-2 text-sm text-muted-foreground">{soundTips[ex.targetSounds[0]]}</p>}
                </div>
                {!result && <RecorderPanel key={ex.id} modelText={ex.text} maxSeconds={5} onScore={score} scoring={scoring} />}
                {error && <p className="text-sm text-rose-600">{error}</p>}
                {result && (
                    <div className="space-y-4">
                        <ScoreView result={result} soundTips={soundTips} showFluency={false} />
                        <div className="flex gap-2">
                            <Button type="button" size="sm" onClick={next}>Từ tiếp theo</Button>
                            <Button type="button" size="sm" variant="ghost" onClick={() => setResult(null)}>Thử lại từ này</Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
