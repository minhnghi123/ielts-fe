import { useState, useMemo } from "react";
import type { Test } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { usePractice } from "../practice-context";
import { Timer, Loader2, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import { authApi } from "@/lib/api/auth";

function formatTime(ms: number | null): string {
    if (ms === null) return "∞";
    const total = Math.floor(ms / 1000);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

// ─── AI Grading Overlay ────────────────────────────────────────────────────────

type GradingStep = "submitting" | "grading" | "saving" | "done" | "error";

function GradingOverlay({ step, error }: { step: GradingStep; error?: string }) {
    const steps = [
        { key: "submitting", label: "Submitting your essays…" },
        { key: "grading", label: "AI examiner is grading your writing…" },
        { key: "saving", label: "Saving results to your profile…" },
        { key: "done", label: "Grading complete! Redirecting…" },
    ];
    const current = steps.findIndex(s => s.key === step);

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700">
                {/* Header */}
                <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-5">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                            <Sparkles className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-violet-200 mb-0.5">AI Assessment</p>
                            <h2 className="text-lg font-black text-white">Grading Your Writing</h2>
                        </div>
                    </div>
                </div>

                {/* Steps */}
                <div className="px-6 py-5 space-y-3">
                    {step === "error" ? (
                        <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-100 dark:border-red-800/30">
                            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold text-red-700 dark:text-red-400 text-sm">Grading Failed</p>
                                <p className="text-xs text-red-600/80 dark:text-red-400/70 mt-1">{error}</p>
                            </div>
                        </div>
                    ) : (
                        steps.map((s, idx) => {
                            const isDone = idx < current || (step === "done" && idx === current);
                            const isActive = idx === current && step !== "done";
                            return (
                                <div
                                    key={s.key}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                        ? "bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800/40"
                                        : isDone
                                            ? "opacity-60"
                                            : "opacity-30"
                                        }`}
                                >
                                    <div className={`flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center ${isDone ? "bg-emerald-100 dark:bg-emerald-900/40" :
                                        isActive ? "bg-violet-100 dark:bg-violet-900/40" : "bg-slate-100 dark:bg-slate-800"
                                        }`}>
                                        {isDone ? (
                                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                        ) : isActive ? (
                                            <Loader2 className="h-3.5 w-3.5 text-violet-600 animate-spin" />
                                        ) : (
                                            <div className="h-2 w-2 rounded-full bg-slate-400" />
                                        )}
                                    </div>
                                    <span className={`text-sm font-medium ${isActive ? "text-violet-700 dark:text-violet-300" :
                                        isDone ? "text-emerald-700 dark:text-emerald-400" : "text-slate-500"
                                        }`}>
                                        {s.label}
                                    </span>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 pb-5">
                    <p className="text-[11px] text-center text-muted-foreground">
                        {step === "grading"
                            ? "This may take up to 30 seconds. Please do not close this page."
                            : step === "error"
                                ? "Please try again or contact support."
                                : "Processing your submission…"}
                    </p>
                </div>
            </div>
        </div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function WritingTestInterface({
    testId,
    test,
    onFinish,
}: {
    testId: string;
    test?: Test | null;
    onFinish: (answers?: Record<string, string>, gradingId?: string) => void;
}) {
    const [responses, setResponses] = useState<Record<number, string>>({});
    const [gradingStep, setGradingStep] = useState<GradingStep | null>(null);
    const [gradingError, setGradingError] = useState<string | undefined>();
    const { timeLeft } = usePractice();

    const tasks = useMemo(() => {
        const testTasks = (test as any)?.writingTasks || [];
        return testTasks.sort((a: any, b: any) => a.taskNumber - b.taskNumber);
    }, [test]);

    const [activeTab, setActiveTab] = useState(tasks.length > 0 ? `task${tasks[0].taskNumber}` : "task1");

    const wordCount = (text: string) => {
        return (text || "").trim().split(/\s+/).filter((w) => w.length > 0).length;
    };

    const handleResponseChange = (taskNumber: number, text: string) => {
        setResponses(prev => ({ ...prev, [taskNumber]: text }));
    };

    const handleSubmit = async () => {
        const user = authApi.getStoredUser();
        if (!user) {
            alert("Please log in to submit.");
            return;
        }

        const isValidProfileId = typeof (user as any).profileId === 'string' && (user as any).profileId !== 'undefined' && (user as any).profileId.length > 20;
        const learnerId = isValidProfileId ? (user as any).profileId : user.id;
        console.log("learnerId", learnerId);
        const task1 = tasks.find((t: any) => t.taskNumber === 1);
        const task2 = tasks.find((t: any) => t.taskNumber === 2);

        setGradingError(undefined);
        setGradingStep("submitting");

        try {
            await new Promise(resolve => setTimeout(resolve, 400));
            setGradingStep("grading");

            const res = await fetch("/api/ai/grade-writing", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    testId,
                    learnerId,
                    task1Content: responses[1] || "",
                    task2Content: responses[2] || "",
                    task1Id: task1?.id || "",
                    task2Id: task2?.id || null,
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "AI grading failed");
            }

            setGradingStep("saving");
            await new Promise(resolve => setTimeout(resolve, 500));

            const data = await res.json() as { gradingId: string; overallBand: number };

            setGradingStep("done");
            await new Promise(resolve => setTimeout(resolve, 800));

            const finalAnswers: Record<string, string> = {};
            tasks.forEach((t: any) => {
                finalAnswers[`writing_task_${t.taskNumber}`] = responses[t.taskNumber] || "";
            });

            onFinish(finalAnswers, data.gradingId);
        } catch (err) {
            console.error("[WritingTestInterface] Grading error:", err);
            setGradingStep("error");
            setGradingError(err instanceof Error ? err.message : "Unknown error");
        }
    };

    if (tasks.length === 0) {
        return (
            <div className="h-full flex items-center justify-center p-8 text-center text-muted-foreground">
                No writing tasks found for this test.
            </div>
        );
    }

    return (
        <>
            {gradingStep && (
                <GradingOverlay
                    step={gradingStep}
                    error={gradingError}
                />
            )}
            {gradingStep === "error" && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60]">
                    <Button
                        onClick={() => setGradingStep(null)}
                        variant="outline"
                        className="shadow-lg"
                    >
                        Dismiss & Try Again
                    </Button>
                </div>
            )}

            <div className="h-full flex flex-col overflow-hidden bg-background">
                {/* Top Bar */}
                <div className="border-b bg-white dark:bg-slate-900 p-4 flex items-center justify-between shadow-sm z-10">
                    <div className="flex items-center gap-4">
                        <Badge variant="outline" className={`text-base py-1.5 px-3.5 flex items-center gap-2 ${timeLeft !== null && timeLeft < 300_000 ? "bg-red-50 text-red-600 border-red-200" : ""}`}>
                            <Timer className={`w-4 h-4 ${timeLeft !== null && timeLeft < 300_000 ? "animate-pulse" : ""}`} />
                            <span className="font-mono font-bold tracking-wider">{formatTime(timeLeft)}</span>
                        </Badge>
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto flex-1 max-w-lg">
                            <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${tasks.length}, 1fr)` }}>
                                {tasks.map((t: any) => (
                                    <TabsTrigger key={t.taskNumber} value={`task${t.taskNumber}`}>
                                        Task {t.taskNumber} ({t.config?.timeLimit || 20} min)
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </Tabs>
                    </div>
                    <Button
                        onClick={handleSubmit}
                        disabled={!!gradingStep}
                        className="px-8 font-bold shadow-md gap-2"
                    >
                        {gradingStep && gradingStep !== "error" ? (
                            <><Loader2 className="h-4 w-4 animate-spin" /> Grading…</>
                        ) : (
                            <><Sparkles className="h-4 w-4" /> Submit Writing</>
                        )}
                    </Button>
                </div>

                <div className="flex-1 relative overflow-hidden">
                    {tasks.map((task: any) => {
                        if (`task${task.taskNumber}` !== activeTab) return null;

                        const minWords = task.taskNumber === 1 ? 150 : 250;
                        const currentResponse = responses[task.taskNumber] || "";
                        const currentWordCount = wordCount(currentResponse);

                        return (
                            <div
                                key={task.taskNumber}
                                className="absolute inset-0 flex flex-col md:flex-row bg-background animate-in fade-in duration-300"
                            >
                                {/* Left Side: Prompt Area */}
                                <div className="w-full md:w-[45%] p-6 md:p-8 border-r border-border overflow-y-auto bg-slate-50/80 dark:bg-slate-900/40">
                                    <div className="max-w-2xl mx-auto space-y-6">
                                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-none px-3 py-1 shadow-sm">
                                            Writing Task {task.taskNumber}
                                        </Badge>

                                        <div className="prose prose-slate dark:prose-invert max-w-none">
                                            <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                                                <h3 className="text-lg font-medium leading-relaxed whitespace-pre-line text-slate-800 dark:text-slate-100 mt-0">
                                                    {task.prompt}
                                                </h3>
                                            </div>
                                        </div>

                                        {task.config?.mediaUrl && (
                                            <Card className="p-2 overflow-hidden bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:shadow-md">
                                                <img
                                                    src={task.config.mediaUrl}
                                                    alt={`Task ${task.taskNumber} Reference`}
                                                    className="w-full h-auto object-contain rounded-lg"
                                                />
                                            </Card>
                                        )}

                                        <div className="flex items-center gap-2 p-4 mt-6 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-200 rounded-lg border border-amber-100 dark:border-amber-900/50">
                                            <span className="material-symbols-outlined shrink-0">info</span>
                                            <p className="text-sm font-medium m-0">
                                                You should write at least {minWords} words.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Typing Area */}
                                <div className="w-full md:w-[55%] bg-white dark:bg-slate-950 flex flex-col shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] z-10 relative">
                                    {/* Typing Area Header */}
                                    <div className="px-6 py-3 border-b border-border flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm sticky top-0 z-20">
                                        <h4 className="font-semibold text-slate-700 dark:text-slate-300 text-sm uppercase tracking-wide">
                                            Your Response
                                        </h4>
                                        <div className={`text-sm font-bold px-3 py-1.5 rounded-full transition-colors flex items-center gap-2 shadow-sm ${currentWordCount < minWords ? 'bg-orange-100 text-orange-700 border border-orange-200/50 dark:bg-orange-950/50 dark:text-orange-400 dark:border-orange-800/50' : 'bg-green-100 text-green-700 border border-green-200/50 dark:bg-green-950/50 dark:text-green-400 dark:border-green-800/50'}`}>
                                            <span>{currentWordCount} words</span>
                                            {currentWordCount < minWords && (
                                                <span className="text-xs font-medium opacity-75">
                                                    (Min {minWords})
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Textarea Container */}
                                    <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar relative">
                                        <textarea
                                            className="w-full min-h-full h-full bg-transparent resize-none outline-none font-serif text-[1.1rem] leading-[1.8] text-slate-800 dark:text-slate-200 placeholder:text-slate-400/70"
                                            placeholder="Start typing your response here. Take your time to structure your essay clearly..."
                                            value={currentResponse}
                                            onChange={(e) => handleResponseChange(task.taskNumber, e.target.value)}
                                            spellCheck={false}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
}