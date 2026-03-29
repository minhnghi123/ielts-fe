import { useState, useEffect } from "react";
import type { Test } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function SpeakingTestInterface({
    testId,
    test,
    onFinish,
}: {
    testId: string;
    test?: Test | null;
    onFinish: () => void;
}) {
    const [part, setPart] = useState<1 | 2 | 3>(1);
    const [isRecording, setIsRecording] = useState(false);
    const [timer, setTimer] = useState(0);

    // Extract real data, fallback to empty states if not available
    const testParts = (test as any)?.speakingParts || [];
    const p1 = testParts.find((p: any) => p.partNumber === 1);
    const p2 = testParts.find((p: any) => p.partNumber === 2);
    const p3 = testParts.find((p: any) => p.partNumber === 3);

    const part1Topics = p1?.config?.topics || [];
    const part2MainTopic = p2?.prompt || "";
    const part2Cues = p2?.config?.cues || [];
    const part2PrepTime = p2?.config?.prepTime || 1;
    const part2SpeakTime = p2?.config?.speakTime || 2;
    const part3Questions = p3?.config?.questions || [];

    // Reset timer when switching parts or recording status
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRecording) {
            interval = setInterval(() => setTimer((t) => t + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [isRecording]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const handleNextPart = () => {
        setIsRecording(false);
        setTimer(0);
        if (part < 3) {
            setPart(p => (p + 1) as 1 | 2 | 3);
        } else {
            onFinish();
        }
    };

    const EmptyPlaceholder = () => (
        <div className="text-center py-8 text-muted-foreground italic">
            No data configured for this part.
        </div>
    );

    return (
        <div className="h-full flex flex-col md:flex-row overflow-hidden bg-slate-50 dark:bg-slate-900/50">
            {/* LEFT PANEL: EXAMINER / INSTRUCTIONS */}
            <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col justify-center items-center text-center border-r border-border overflow-y-auto">
                <div className="max-w-md w-full space-y-8">
                    <div className="relative">
                        <div className="h-32 w-32 bg-blue-100 dark:bg-blue-900/30 rounded-full mx-auto flex items-center justify-center mb-6">
                            <span className="material-symbols-outlined text-6xl text-primary">person</span>
                        </div>
                        <Badge className="absolute bottom-0 left-1/2 -translate-x-1/2 px-4 py-1">Examiner</Badge>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-3xl font-bold">Speaking Part {part}</h2>
                        <h3 className="text-xl text-muted-foreground font-medium">
                            {part === 1 && "Introduction & Interview"}
                            {part === 2 && "Individual Long Turn"}
                            {part === 3 && "Two-way Discussion"}
                        </h3>
                    </div>

                    <Card className="p-6 bg-white dark:bg-slate-800 shadow-sm text-left relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                        
                        {/* PART 1 */}
                        {part === 1 && (
                            <div className="space-y-6">
                                {part1Topics.length > 0 ? (
                                    part1Topics.map((topic: any, idx: number) => (
                                        <div key={idx} className="space-y-3">
                                            <p className="font-bold text-lg border-b pb-2">Topic: {topic.topicName || `Topic ${idx+1}`}</p>
                                            <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300">
                                                {topic.questions.map((q: any, qIdx: number) => (
                                                    <li key={qIdx}>{q.questionText}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))
                                ) : <EmptyPlaceholder />}
                            </div>
                        )}

                        {/* PART 2 */}
                        {part === 2 && (
                            <div className="space-y-4">
                                {part2MainTopic ? (
                                    <>
                                        <p className="font-bold text-lg mb-2">{part2MainTopic}</p>
                                        {part2Cues.length > 0 && (
                                            <>
                                                <p className="text-sm text-muted-foreground mb-4">You should say:</p>
                                                <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300">
                                                    {part2Cues.map((cue: string, idx: number) => (
                                                        <li key={idx}>{cue}</li>
                                                    ))}
                                                </ul>
                                            </>
                                        )}
                                        <div className="mt-4 pt-4 border-t text-sm font-bold text-orange-600">
                                            You have {part2PrepTime} minute(s) to prepare and {part2SpeakTime} minute(s) to speak.
                                        </div>
                                    </>
                                ) : <EmptyPlaceholder />}
                            </div>
                        )}

                        {/* PART 3 */}
                        {part === 3 && (
                            <div className="space-y-4">
                                {part3Questions.length > 0 ? (
                                    <>
                                        <p className="font-bold text-lg border-b pb-2">Discussion Topics</p>
                                        <ul className="list-disc list-inside space-y-3 text-slate-700 dark:text-slate-300">
                                            {part3Questions.map((q: any, idx: number) => (
                                                <li key={idx}>{q.questionText}</li>
                                            ))}
                                        </ul>
                                    </>
                                ) : <EmptyPlaceholder />}
                            </div>
                        )}
                    </Card>
                </div>
            </div>

            {/* RIGHT PANEL: RECORDING INTERFACE */}
            <div className="w-full md:w-1/2 p-6 md:p-10 bg-background flex flex-col items-center justify-center">
                <div className="max-w-md w-full space-y-12 text-center">

                    <div className={`transition-all duration-500 ${isRecording ? 'opacity-100 transform scale-100' : 'opacity-50 transform scale-95'}`}>
                        <div className="relative h-64 flex items-center justify-center">
                            {/* Visualizer bars */}
                            <div className="flex items-center gap-1.5 h-32">
                                {[...Array(20)].map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-2 rounded-full bg-primary transition-all duration-100 ease-in-out ${isRecording ? 'animate-pulse' : ''}`}
                                        style={{
                                            height: isRecording ? `${Math.random() * 100}%` : '5px',
                                            animationDelay: `${i * 0.05}s`
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="text-4xl font-mono font-bold tabular-nums mt-4">
                            {formatTime(timer)}
                        </div>
                        <p className="text-muted-foreground mt-2 animate-pulse">{isRecording ? "Recording in progress..." : "Ready to record"}</p>
                    </div>

                    <div className="flex flex-col gap-4">
                        {!isRecording ? (
                            <Button onClick={() => setIsRecording(true)} size="lg" className="h-16 rounded-full text-lg w-full max-w-xs mx-auto shadow-lg bg-red-600 hover:bg-red-700 text-white">
                                <span className="material-symbols-outlined mr-2">mic</span>
                                Start Recording
                            </Button>
                        ) : (
                            <Button onClick={handleNextPart} size="lg" variant="outline" className="h-16 rounded-full text-lg w-full max-w-xs mx-auto border-2">
                                <span className="material-symbols-outlined mr-2">
                                    {part < 3 ? 'skip_next' : 'done'}
                                </span>
                                {part < 3 ? 'Stop & Next Part' : 'Stop & Finish Test'}
                            </Button>
                        )}
                    </div>

                    <div className="text-sm text-muted-foreground bg-slate-100 dark:bg-slate-800 p-3 rounded-lg mt-8">
                        Check your microphone settings before starting. Your responses are not actually saved in this demo until you integrate WebRTC or Audio Blob uploading.
                    </div>
                </div>
            </div>
        </div>
    );
}
