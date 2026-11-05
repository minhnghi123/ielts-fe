"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type RecorderState = "idle" | "requesting" | "recording" | "ready" | "denied";

/** MediaRecorder wrapper with a hard max duration; keeps the last blob + object URL for playback. */
export function useRecorder(maxSeconds: number) {
    const [state, setState] = useState<RecorderState>("idle");
    const [blob, setBlob] = useState<Blob | null>(null);
    const [url, setUrl] = useState<string | null>(null);
    const [elapsed, setElapsed] = useState(0);
    const rec = useRef<MediaRecorder | null>(null);
    const chunks = useRef<Blob[]>([]);
    const timer = useRef<ReturnType<typeof setInterval> | null>(null);
    const startedAt = useRef(0);

    const stop = useCallback(() => {
        if (rec.current && rec.current.state !== "inactive") rec.current.stop();
    }, []);

    const start = useCallback(async () => {
        setState("requesting");
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : undefined;
            const r = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
            chunks.current = [];
            r.ondataavailable = (e) => { if (e.data.size > 0) chunks.current.push(e.data); };
            r.onstop = () => {
                stream.getTracks().forEach((t) => t.stop());
                if (timer.current) clearInterval(timer.current);
                const b = new Blob(chunks.current, { type: r.mimeType || "audio/webm" });
                setBlob(b);
                setUrl((old) => { if (old) URL.revokeObjectURL(old); return URL.createObjectURL(b); });
                setState("ready");
            };
            rec.current = r;
            r.start();
            startedAt.current = Date.now();
            setElapsed(0);
            setState("recording");
            timer.current = setInterval(() => {
                const s = (Date.now() - startedAt.current) / 1000;
                setElapsed(s);
                if (s >= maxSeconds) stop();
            }, 100);
        } catch {
            setState("denied");
        }
    }, [maxSeconds, stop]);

    const reset = useCallback(() => {
        setBlob(null);
        setUrl((old) => { if (old) URL.revokeObjectURL(old); return null; });
        setElapsed(0);
        setState("idle");
    }, []);

    useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

    return { state, blob, url, elapsed, start, stop, reset };
}

/**
 * Model audio without a TTS key: the browser's English voice.
 * Resolves true when playback starts, false when speech synthesis is missing or fails (some Chrome builds have no voices).
 */
export function speak(text: string, rate = 0.9): Promise<boolean> {
    return new Promise((resolve) => {
        if (typeof window === "undefined" || !("speechSynthesis" in window)) return resolve(false);
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = "en-GB";
        u.rate = rate;
        const voices = window.speechSynthesis.getVoices();
        const voice = voices.find((v) => v.lang.startsWith("en-GB")) ?? voices.find((v) => v.lang.startsWith("en"));
        if (voice) u.voice = voice;
        let settled = false;
        const done = (ok: boolean) => { if (!settled) { settled = true; resolve(ok); } };
        u.onstart = () => done(true);
        u.onerror = () => done(false);
        window.speechSynthesis.speak(u);
        setTimeout(() => done(false), 2500);
    });
}
