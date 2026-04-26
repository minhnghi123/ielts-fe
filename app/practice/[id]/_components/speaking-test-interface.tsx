"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { Test, ConversationMessage, PartGrading } from "@/lib/types";
import { useUser } from "@/stores/auth-store";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Loader2, Volume2, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { SpeakingGradingCard } from "./speaking-grading-card";
import { attemptsApi } from "@/lib/api/attempts";

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase =
    | 'loading'      // fetching first examiner message
    | 'speaking'     // TTS playing examiner message
    | 'prep'         // Part 2 preparation countdown
    | 'examiner'     // waiting for candidate to press mic
    | 'recording'    // candidate is speaking (silence detection active)
    | 'processing'   // waiting for AI response
    | 'grading';     // showing score card overlay

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function uploadAudioBlob(blob: Blob): Promise<string> {
    const form = new FormData();
    form.append('file', new File([blob], 'speaking.webm', { type: blob.type }));
    const res = await fetch('/api/upload/audio', { method: 'POST', body: form });
    if (!res.ok) throw new Error('Audio upload failed');
    const json = await res.json() as { url: string };
    return json.url;
}

// ─── Waveform Visualizer ──────────────────────────────────────────────────────

function WaveformVisualizer({ analyser }: { analyser: AnalyserNode | null }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !analyser) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const bufLen = analyser.frequencyBinCount;
        const data = new Uint8Array(bufLen);
        let rafId = 0;

        function draw() {
            rafId = requestAnimationFrame(draw);
            analyser!.getByteFrequencyData(data);
            const W = canvas!.width;
            const H = canvas!.height;
            ctx!.clearRect(0, 0, W, H);
            const bw = Math.max(2, Math.floor(W / bufLen) - 1);
            for (let i = 0; i < bufLen; i++) {
                const norm = data[i] / 255;
                const bh = Math.max(3, norm * H);
                ctx!.fillStyle = '#ef4444';
                ctx!.fillRect(i * (bw + 1), H - bh, bw, bh);
            }
        }
        draw();
        return () => cancelAnimationFrame(rafId);
    }, [analyser]);

    return <canvas ref={canvasRef} width={256} height={48} className="w-64 h-12 rounded opacity-80" />;
}

// ─── Examiner Avatar ──────────────────────────────────────────────────────────

function ExaminerAvatar({ phase }: { phase: Phase }) {
    const isSpeaking = phase === 'speaking';
    const isRecording = phase === 'recording';

    return (
        <div className="relative flex items-center justify-center h-32 w-32">
            {isSpeaking && (
                <>
                    <div className="absolute inset-0 rounded-full border border-blue-400/30 animate-ping" />
                    <div className="absolute inset-[-6px] rounded-full border-2 border-blue-400/50 animate-pulse" />
                </>
            )}
            {isRecording && (
                <div className="absolute inset-[-6px] rounded-full border-2 border-red-400/60 animate-pulse" />
            )}
            <div className={`relative h-24 w-24 rounded-full bg-gradient-to-br from-blue-700 to-blue-900 flex items-center justify-center text-white text-4xl font-bold shadow-2xl transition-all duration-300 ${
                isSpeaking ? 'ring-2 ring-blue-400 scale-105' : isRecording ? 'ring-2 ring-red-400' : ''
            }`}>
                S
                {isSpeaking && (
                    <div className="absolute bottom-1 right-1 h-6 w-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <Volume2 className="h-3 w-3 text-white" />
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function SpeakingTestInterface({
    test,
    onFinish,
}: {
    testId: string;
    test?: Test | null;
    onFinish: (gradings: Array<PartGrading & { partNumber: number }>, bandScore: number) => void;
}) {
    const user = useUser();

    const [currentPart, setCurrentPart] = useState<1 | 2 | 3>(1);
    const [phase, setPhase] = useState<Phase>('loading');
    const [history, setHistory] = useState<ConversationMessage[]>([]);
    const [currentQuestion, setCurrentQuestion] = useState('');
    const [liveTranscript, setLiveTranscript] = useState('');
    const [partGrading, setPartGrading] = useState<PartGrading | null>(null);
    const [allGradings, setAllGradings] = useState<(PartGrading & { partNumber: number })[]>([]);
    const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
    const [prepTimeLeft, setPrepTimeLeft] = useState(60);
    const [showHistory, setShowHistory] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Audio recording refs
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const partAudioChunksRef = useRef<Blob[]>([]);

    // Speech recognition
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognitionRef = useRef<any>(null);
    const finalTranscriptRef = useRef('');

    // Web Audio for silence detection + waveform
    const audioCtxRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const silenceRafRef = useRef<number>(0);
    const silenceStartRef = useRef<number | null>(null);

    // TTS generation counter — prevents stale onend/onerror from old utterances
    const ttsGenRef = useRef(0);

    // Stable ref for currentPart (used inside RAF callbacks to avoid stale closure)
    const currentPartRef = useRef(currentPart);
    useEffect(() => { currentPartRef.current = currentPart; }, [currentPart]);

    const speakingParts = test?.speakingParts ?? [];
    const getPartData = useCallback((partNum: number) => {
        return speakingParts.find(p => p.partNumber === partNum) ?? null;
    }, [speakingParts]);

    const partLabels = ['Introduction & Interview', 'Individual Long Turn', 'Two-Way Discussion'];
    const partLabel = partLabels[currentPart - 1];
    const currentPartData = getPartData(currentPart);

    // ── Cleanup on unmount ───────────────────────────────────────────────────
    useEffect(() => {
        return () => {
            window.speechSynthesis?.cancel();
            cancelAnimationFrame(silenceRafRef.current);
            audioCtxRef.current?.close().catch(() => {});
            recognitionRef.current?.stop();
            if (mediaRecorderRef.current?.state !== 'inactive') {
                mediaRecorderRef.current?.stop();
            }
        };
    }, []);

    // ── Part 2 prep countdown ────────────────────────────────────────────────
    useEffect(() => {
        if (phase !== 'prep') return;
        setPrepTimeLeft(60);
        const id = setInterval(() => {
            setPrepTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(id);
                    setPhase('examiner');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(id);
    }, [phase]);

    // ── TTS: speak examiner message, then transition to afterPhase ───────────
    const speakExaminer = useCallback((text: string, afterPhase: Phase) => {
        if (typeof window === 'undefined' || !window.speechSynthesis) {
            setCurrentQuestion(text);
            setPhase(afterPhase);
            return;
        }

        window.speechSynthesis.cancel();
        const gen = ++ttsGenRef.current;
        setCurrentQuestion(text);
        setPhase('speaking');

        const utt = new SpeechSynthesisUtterance(text);
        utt.lang = 'en-GB';
        utt.rate = 0.90;
        utt.pitch = 1.02;

        const voices = window.speechSynthesis.getVoices();
        const voice = voices.find(v => v.lang.startsWith('en-GB'))
            ?? voices.find(v => v.lang.startsWith('en'));
        if (voice) utt.voice = voice;

        utt.onend = () => { if (ttsGenRef.current === gen) setPhase(afterPhase); };
        utt.onerror = (e) => {
            if (e.error !== 'interrupted' && ttsGenRef.current === gen) setPhase(afterPhase);
        };

        window.speechSynthesis.speak(utt);
    }, []);

    // ── Call examiner AI ─────────────────────────────────────────────────────
    const callExaminer = useCallback(async (
        action: 'start_part' | 'respond' | 'grade_part',
        partNum: number,
        partHistory: ConversationMessage[],
        transcript?: string,
    ) => {
        setPhase('processing');
        setErrorMsg(null);

        const partData = getPartData(partNum);
        const partConfig = partData ? {
            prompt: partData.prompt,
            topics: partData.config?.topics,
            cues: partData.config?.cues,
            prepTime: partData.config?.prepTime,
            speakTime: partData.config?.speakTime,
            questions: partData.config?.questions,
        } : {};

        const historyToSend = action === 'respond' && transcript
            ? [...partHistory, { role: 'candidate' as const, content: transcript }]
            : partHistory;

        try {
            const res = await fetch('/api/ai/speaking-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action,
                    partNumber: partNum,
                    partConfig,
                    conversationHistory: historyToSend,
                    userTranscript: transcript,
                }),
            });

            if (!res.ok) throw new Error(`AI request failed (${res.status})`);

            const data = await res.json() as {
                examinerMessage: string;
                isPartDone: boolean;
                grading?: PartGrading;
            };

            setHistory(prev => {
                const next = [...prev];
                if (action === 'respond' && transcript) {
                    next.push({ role: 'candidate', content: transcript });
                }
                next.push({ role: 'examiner', content: data.examinerMessage });
                return next;
            });

            if (action === 'grade_part') {
                if (data.grading) {
                    setPartGrading(data.grading);
                    setAllGradings(prev => [...prev, { ...data.grading!, partNumber: partNum }]);
                }
                speakExaminer(data.examinerMessage, 'grading');
            } else if (data.isPartDone) {
                await callExaminer('grade_part', partNum, historyToSend);
            } else {
                // After Part 2 opening, go to prep timer; otherwise go straight to examiner
                const afterPhase: Phase = (action === 'start_part' && partNum === 2) ? 'prep' : 'examiner';
                speakExaminer(data.examinerMessage, afterPhase);
            }
        } catch (err) {
            setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
            setPhase('examiner');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [getPartData, speakExaminer]);

    // ── Start Part 1 on mount ────────────────────────────────────────────────
    useEffect(() => {
        callExaminer('start_part', 1, []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Stop recording: inline logic so RAF callback can call it safely ──────
    const doStopRecording = useCallback(async () => {
        cancelAnimationFrame(silenceRafRef.current);
        silenceStartRef.current = null;

        recognitionRef.current?.stop();
        recognitionRef.current = null;

        const recorder = mediaRecorderRef.current;
        if (recorder && recorder.state !== 'inactive') {
            await new Promise<void>(resolve => {
                recorder.onstop = () => resolve();
                recorder.stop();
                recorder.stream.getTracks().forEach(t => t.stop());
            });
        }
        mediaRecorderRef.current = null;

        audioCtxRef.current?.close().catch(() => {});
        audioCtxRef.current = null;
        analyserRef.current = null;
        setAnalyserNode(null);

        const blob = audioChunksRef.current.length > 0
            ? new Blob(audioChunksRef.current, { type: 'audio/webm' })
            : null;
        if (blob) partAudioChunksRef.current.push(blob);

        const transcript = finalTranscriptRef.current.trim() || '(no response recorded)';

        setHistory(prev => {
            void callExaminer('respond', currentPartRef.current, prev, transcript);
            return prev;
        });
        setLiveTranscript('');
    }, [callExaminer]);

    // Keep a ref to doStopRecording so the silence-detection RAF loop always calls the latest version
    const doStopRecordingRef = useRef(doStopRecording);
    useEffect(() => { doStopRecordingRef.current = doStopRecording; }, [doStopRecording]);

    // ── Start recording ───────────────────────────────────────────────────────
    const startRecording = useCallback(async () => {
        setLiveTranscript('');
        finalTranscriptRef.current = '';
        audioChunksRef.current = [];
        silenceStartRef.current = null;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // MediaRecorder for audio blob
            const recorder = new MediaRecorder(stream);
            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };
            recorder.start(250);
            mediaRecorderRef.current = recorder;

            // Web Audio: analyser for waveform + silence detection
            const audioCtx = new AudioContext();
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 64;
            analyser.smoothingTimeConstant = 0.7;
            audioCtx.createMediaStreamSource(stream).connect(analyser);
            audioCtxRef.current = audioCtx;
            analyserRef.current = analyser;
            setAnalyserNode(analyser);

            // Silence detection: auto-stop after 2.5s of quiet
            const SILENCE_THRESHOLD = 10;
            const SILENCE_MS = 2500;
            const freqData = new Uint8Array(analyser.frequencyBinCount);

            function detectSilence() {
                silenceRafRef.current = requestAnimationFrame(detectSilence);
                analyser.getByteFrequencyData(freqData);
                const avg = freqData.reduce((s, v) => s + v, 0) / freqData.length;
                if (avg < SILENCE_THRESHOLD) {
                    if (silenceStartRef.current === null) silenceStartRef.current = Date.now();
                    else if (Date.now() - silenceStartRef.current >= SILENCE_MS) {
                        cancelAnimationFrame(silenceRafRef.current);
                        void doStopRecordingRef.current();
                        return;
                    }
                } else {
                    silenceStartRef.current = null;
                }
            }
            detectSilence();
        } catch {
            // Mic unavailable — continue in transcript-only mode
        }

        // Speech recognition for live transcript display
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognitionAPI) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const recognition = new SpeechRecognitionAPI() as any;
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            recognition.onresult = (event: any) => {
                let interim = '';
                let final = finalTranscriptRef.current;
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const text = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        final += (final ? ' ' : '') + text.trim();
                        finalTranscriptRef.current = final;
                    } else {
                        interim = text;
                    }
                }
                setLiveTranscript(final + (interim ? ' ' + interim : ''));
            };
            recognition.onerror = () => {};
            recognition.start();
            recognitionRef.current = recognition;
        }

        setPhase('recording');
    }, []);

    // ── Move to next part or finish ───────────────────────────────────────────
    const handleNextPart = useCallback(async () => {
        if (currentPart === 3) {
            try {
                const learnerId = user?.profileId ?? user?.id;
                const part1 = getPartData(1);
                if (learnerId && part1) {
                    const allTranscript = allGradings
                        .map(g => `Part ${g.partNumber} overall band: ${g.overall}`)
                        .join(' | ');
                    let audioUrl = 'https://res.cloudinary.com/placeholder/audio/upload/speaking.webm';
                    if (partAudioChunksRef.current.length > 0) {
                        const combined = new Blob(partAudioChunksRef.current, { type: 'audio/webm' });
                        audioUrl = await uploadAudioBlob(combined).catch(() => audioUrl);
                    }
                    await attemptsApi.submitSpeaking(learnerId, part1.id, audioUrl, allTranscript);
                }
            } catch { /* non-critical */ }
            const sum = allGradings.reduce((s, g) => s + g.overall, 0);
            const avgBand = allGradings.length ? Math.round((sum / allGradings.length) * 2) / 2 : 0;
            onFinish(allGradings, avgBand);
            return;
        }

        const nextPart = (currentPart + 1) as 2 | 3;
        setCurrentPart(nextPart);
        setHistory([]);
        setPartGrading(null);
        setCurrentQuestion('');
        partAudioChunksRef.current = [];
        setPhase('loading');
        callExaminer('start_part', nextPart, []);
    }, [currentPart, user, getPartData, allGradings, onFinish, callExaminer]);

    // ── Render ───────────────────────────────────────────────────────────────

    const cues = currentPartData?.config?.cues as string[] | undefined;

    return (
        <div className="relative h-full flex flex-col overflow-hidden">

            {/* Header */}
            <header className="shrink-0 flex items-center gap-3 px-5 py-3 bg-slate-900 text-white border-b border-white/10">
                <div>
                    <p className="text-sm font-semibold leading-none">IELTS Examiner · Sarah</p>
                    <p className="text-xs text-white/50 mt-0.5">Part {currentPart} — {partLabel}</p>
                </div>
                <Badge variant="outline" className="ml-auto border-white/20 text-white/60 text-xs">
                    Part {currentPart} / 3
                </Badge>
            </header>

            {/* Examination room — dark, focused */}
            <div className="flex-1 min-h-0 bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col items-center justify-center gap-6 p-8 overflow-y-auto">

                {phase === 'loading' ? (
                    <div className="text-center space-y-3">
                        <Loader2 className="h-10 w-10 animate-spin text-blue-400 mx-auto" />
                        <p className="text-sm text-white/40">Examiner is preparing…</p>
                    </div>
                ) : (
                    <>
                        <ExaminerAvatar phase={phase} />

                        {/* Current examiner message — shown as subtitle */}
                        {currentQuestion && (
                            <p className="max-w-lg text-center text-base text-white/90 leading-relaxed font-light">
                                {currentQuestion}
                            </p>
                        )}

                        {/* Part 2 prep: topic card with countdown */}
                        {phase === 'prep' && cues && cues.length > 0 && (
                            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 max-w-sm w-full shadow-xl text-slate-800">
                                <div className="flex items-center gap-2 mb-3">
                                    <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                                    <span className="text-sm font-semibold text-amber-700">Preparation Time</span>
                                    <span className="ml-auto text-2xl font-bold text-amber-600 tabular-nums">
                                        {prepTimeLeft}s
                                    </span>
                                </div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                                    Topic Card
                                </p>
                                <p className="font-medium text-sm mb-2">{cues[0]}</p>
                                {cues.length > 1 && (
                                    <ul className="space-y-1">
                                        {cues.slice(1).map((cue, i) => (
                                            <li key={i} className="flex items-start gap-1.5 text-sm text-slate-600">
                                                <span className="text-amber-500 mt-0.5 shrink-0">•</span>
                                                {cue}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Candidate controls */}
            <div className="shrink-0 bg-slate-800 border-t border-white/10 flex flex-col items-center gap-3 px-6 py-5">

                {/* Waveform */}
                {phase === 'recording' && <WaveformVisualizer analyser={analyserNode} />}

                {/* Live transcript */}
                {phase === 'recording' && liveTranscript && (
                    <p className="text-xs text-white/50 italic max-w-sm text-center leading-relaxed">
                        {liveTranscript}
                    </p>
                )}

                {/* Mic / status button */}
                <div className="flex flex-col items-center gap-2">
                    {phase === 'examiner' && (
                        <>
                            <button
                                onClick={startRecording}
                                className="h-20 w-20 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95"
                                aria-label="Start speaking"
                            >
                                <Mic className="h-9 w-9" />
                            </button>
                            <p className="text-xs text-white/40">Press to speak</p>
                        </>
                    )}

                    {phase === 'recording' && (
                        <>
                            <button
                                onClick={() => void doStopRecording()}
                                className="h-20 w-20 rounded-full bg-slate-600 hover:bg-slate-500 text-white flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95"
                                aria-label="Stop speaking"
                            >
                                <MicOff className="h-9 w-9" />
                            </button>
                            <p className="text-xs text-white/40">Tap to stop · auto-stops on silence</p>
                        </>
                    )}

                    {(phase === 'processing' || phase === 'speaking') && (
                        <>
                            <div className="h-20 w-20 rounded-full bg-slate-700 flex items-center justify-center">
                                <Loader2 className="h-9 w-9 animate-spin text-white/30" />
                            </div>
                            <p className="text-xs text-white/40">
                                {phase === 'speaking' ? 'Examiner is speaking…' : 'Examiner is thinking…'}
                            </p>
                        </>
                    )}

                    {phase === 'prep' && (
                        <>
                            <div className="h-20 w-20 rounded-full bg-amber-900/30 border-2 border-amber-500/40 flex items-center justify-center">
                                <Clock className="h-9 w-9 text-amber-400" />
                            </div>
                            <p className="text-xs text-white/40">
                                Mic opens in {prepTimeLeft}s — prepare your answer
                            </p>
                        </>
                    )}
                </div>

                {/* Error */}
                {errorMsg && (
                    <p className="text-xs text-red-400 bg-red-950/30 rounded-lg px-3 py-2 max-w-sm text-center">
                        {errorMsg}
                    </p>
                )}

                {/* Collapsible conversation history */}
                {history.length > 0 && (
                    <div className="w-full max-w-xl mt-1">
                        <button
                            onClick={() => setShowHistory(h => !h)}
                            className="w-full flex items-center gap-1.5 text-xs text-white/30 hover:text-white/50 transition-colors"
                        >
                            {showHistory
                                ? <ChevronDown className="h-3 w-3" />
                                : <ChevronUp className="h-3 w-3" />}
                            {showHistory ? 'Hide' : 'Show'} conversation ({history.length} messages)
                        </button>
                        {showHistory && (
                            <div className="mt-2 max-h-36 overflow-y-auto space-y-1.5 bg-slate-900/60 rounded-lg p-3">
                                {history.map((msg, i) => (
                                    <p key={i} className={`text-xs leading-relaxed ${
                                        msg.role === 'examiner'
                                            ? 'text-blue-300'
                                            : 'text-white/50 text-right'
                                    }`}>
                                        <span className="font-medium">
                                            {msg.role === 'examiner' ? 'Examiner: ' : 'You: '}
                                        </span>
                                        {msg.content}
                                    </p>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Grading overlay */}
            {phase === 'grading' && partGrading && (
                <div className="absolute inset-0 z-20 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                    <div className="w-full max-w-sm">
                        <SpeakingGradingCard
                            partNumber={currentPart}
                            grading={partGrading}
                            onNext={handleNextPart}
                            isLast={currentPart === 3}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
