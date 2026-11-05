"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, RotateCcw, Volume2 } from "lucide-react";
import { speak, useRecorder } from "./use-recorder";

/**
 * Nghe mẫu → Ghi âm (tối đa maxSeconds) → nghe lại → Chấm. One primary action at a time.
 */
export function RecorderPanel({ modelText, maxSeconds, onScore, scoring, disabled }: { modelText: string; maxSeconds: number; onScore: (blob: Blob, peakLevel: number) => void; scoring: boolean; disabled?: boolean }) {
    const r = useRecorder(maxSeconds);
    const [modelError, setModelError] = useState<string | null>(null);
    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={async () => { setModelError(null); if (!(await speak(modelText))) setModelError("Trình duyệt này không đọc được giọng mẫu. Bạn vẫn có thể ghi âm và chấm; hãy tra cách đọc qua IPA ở trên."); }} disabled={disabled}>
                    <Volume2 className="mr-1.5 h-4 w-4" /> Nghe mẫu
                </Button>
                {r.state !== "recording" && r.state !== "ready" && (
                    <Button type="button" size="sm" onClick={r.start} disabled={disabled || r.state === "requesting"}>
                        <Mic className="mr-1.5 h-4 w-4" /> {r.state === "requesting" ? "Đang xin quyền micro…" : "Ghi âm"}
                    </Button>
                )}
                {r.state === "recording" && (
                    <Button type="button" size="sm" variant="destructive" onClick={r.stop}>
                        <Square className="mr-1.5 h-4 w-4" /> Dừng ({Math.max(0, maxSeconds - Math.floor(r.elapsed))}s)
                    </Button>
                )}
                {r.state === "ready" && (
                    <>
                        <Button type="button" size="sm" onClick={() => r.blob && onScore(r.blob, r.peakLevel)} disabled={scoring}>{scoring ? "Đang chấm…" : "Chấm"}</Button>
                        <Button type="button" size="sm" variant="ghost" onClick={r.reset} disabled={scoring}><RotateCcw className="mr-1.5 h-4 w-4" /> Ghi lại</Button>
                    </>
                )}
            </div>
            {modelError && <p className="text-sm text-muted-foreground">{modelError}</p>}
            {r.state === "denied" && <p className="text-sm text-rose-600">Không truy cập được micro. Hãy cho phép micro trong trình duyệt rồi thử lại.</p>}
            {r.url && <audio controls src={r.url} className="h-9 w-full max-w-sm" aria-label="Nghe lại bản ghi của bạn" />}
        </div>
    );
}
