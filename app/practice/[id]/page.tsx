"use client";

import { use, useEffect } from "react";
import { useTestSession, getRemainingMs, type PracticeSession } from "./hooks/use-test-session";
import { TestInstructions } from "./_components/test-instructions";
import { ReadingTestInterface } from "./_components/reading-test-interface";
import { ListeningTestInterface } from "./_components/listening-test-interface";
import { WritingTestInterface } from "./_components/writing-test-interface";
import { SpeakingTestInterface } from "./_components/speaking-test-interface";
import { RotateCcw, PlayCircle, Clock, BookOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Per-skill metadata ────────────────────────────────────────────────────────

const SKILL_DEFAULTS: Record<string, { title: string; duration: number }> = {
    reading: { title: "IELTS Academic Reading Test", duration: 60 },
    listening: { title: "IELTS Academic Listening Test", duration: 30 },
    writing: { title: "IELTS Academic Writing Test", duration: 60 },
    speaking: { title: "IELTS Academic Speaking Test", duration: 15 },
};

// ─── Loading / error screens ───────────────────────────────────────────────────

function FullPageSpinner() {
    return (
        <div className="flex h-full items-center justify-center flex-col gap-3">
            <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            <p className="text-muted-foreground text-sm">Loading test…</p>
        </div>
    );
}

function FullPageError({ message }: { message: string }) {
    return (
        <div className="flex h-full items-center justify-center flex-col gap-3">
            <span className="material-symbols-outlined text-5xl text-destructive">error</span>
            <p className="font-semibold text-destructive">{message}</p>
        </div>
    );
}

// ─── Resume Prompt ─────────────────────────────────────────────────────────────

function formatMs(ms: number): string {
    const totalSec = Math.ceil(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s > 0 ? `${s}s` : ""}`.trim();
    return `${s}s`;
}

interface ResumePromptProps {
    testTitle: string;
    session: PracticeSession;
    onResume: () => void;
    onStartFresh: () => void;
}

function ResumePrompt({ testTitle, session, onResume, onStartFresh }: ResumePromptProps) {
    const remainingMs = getRemainingMs(session);
    const answeredCount = Object.values(session.answers).filter((v) => v?.trim()).length;
    const isExpired = remainingMs <= 0;

    // If already expired, auto-resume (which will auto-submit)
    useEffect(() => {
        if (isExpired) onResume();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    if (isExpired) {
        return (
            <div className="flex h-full items-center justify-center flex-col gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Submitting your previous session…</p>
            </div>
        );
    }

    return (
        <div className="min-h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-6">
            <div className="w-full max-w-lg space-y-6">

                {/* Card */}
                <div className="rounded-2xl border border-amber-200 dark:border-amber-800/50 bg-white dark:bg-slate-900 shadow-lg overflow-hidden">

                    {/* Header stripe */}
                    <div className="bg-gradient-to-r from-amber-400 to-orange-400 px-6 py-5">
                        <p className="text-xs font-bold uppercase tracking-widest text-amber-900 mb-1">
                            Unfinished session found
                        </p>
                        <h2 className="text-xl font-black text-white leading-tight">{testTitle}</h2>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 divide-x divide-border border-b border-border">
                        <div className="px-6 py-4 flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="h-4 w-4 text-amber-500" />
                                <span className="text-xs font-semibold uppercase tracking-wider">Time left</span>
                            </div>
                            <p className="text-2xl font-black text-foreground tabular-nums">
                                {formatMs(remainingMs)}
                            </p>
                        </div>
                        <div className="px-6 py-4 flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <BookOpen className="h-4 w-4 text-emerald-500" />
                                <span className="text-xs font-semibold uppercase tracking-wider">Answered</span>
                            </div>
                            <p className="text-2xl font-black text-foreground tabular-nums">
                                {answeredCount} <span className="text-base font-medium text-muted-foreground">question{answeredCount !== 1 ? "s" : ""}</span>
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="px-6 py-5 space-y-3">
                        <Button
                            onClick={onResume}
                            className="w-full h-12 text-base font-bold gap-2 rounded-xl"
                        >
                            <PlayCircle className="h-5 w-5" />
                            Resume — {formatMs(remainingMs)} remaining
                        </Button>
                        <Button
                            variant="outline"
                            onClick={onStartFresh}
                            className="w-full h-10 text-sm font-semibold gap-2 rounded-xl text-muted-foreground hover:text-destructive hover:border-destructive/50"
                        >
                            <RotateCcw className="h-4 w-4" />
                            Discard & start fresh
                        </Button>
                        <p className="text-[11px] text-center text-muted-foreground">
                            Starting fresh will discard your saved answers and create a new attempt.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function PracticePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);

    const {
        test,
        testState,
        isStarting,
        resumeSession,
        answersRef,
        handleAnswerUpdate,
        handleStartTest,
        handleFinishTest,
        handleResume,
        handleDiscardAndRestart,
    } = useTestSession(id);

    // ── Loading / error guards ───────────────────────────────────────────────
    if (testState === "loading") return <FullPageSpinner />;
    if (testState === "error" || !test) return <FullPageError message="Test not found. Please go back and try again." />;

    const skill = test.skill;
    const defaults = SKILL_DEFAULTS[skill] ?? SKILL_DEFAULTS.reading;

    // ── Resume prompt ────────────────────────────────────────────────────────
    if (testState === "resume-prompt" && resumeSession) {
        return (
            <div className="h-full overflow-y-auto bg-background">
                <ResumePrompt
                    testTitle={test.title || defaults.title}
                    session={resumeSession}
                    onResume={handleResume}
                    onStartFresh={handleDiscardAndRestart}
                />
            </div>
        );
    }

    // ── Question / section counts (used by instructions screen) ─────────────
    let questionCount = 0;
    let sectionCount = 0;

    if (skill === "reading" || skill === "listening") {
        sectionCount = test.sections?.length ?? 0;
        questionCount = test.sections?.reduce((acc, sec) =>
            acc + (sec.questionGroups?.reduce((gacc, g) => gacc + (g.questions?.length ?? 0), 0) ?? 0),
            0,
        ) ?? 0;
    } else if (skill === "writing") {
        sectionCount = test.writingTasks?.length ?? 0;
        questionCount = sectionCount;
    } else if (skill === "speaking") {
        sectionCount = test.speakingParts?.length ?? 0;
        questionCount = sectionCount;
    }

    // ── Instructions screen ──────────────────────────────────────────────────
    if (testState === "instructions") {
        return (
            <div className="h-full overflow-y-auto bg-background">
                <TestInstructions
                    title={test.title || defaults.title}
                    defaultDuration={defaults.duration}
                    sectionCount={sectionCount}
                    questionCount={questionCount}
                    isStarting={isStarting}
                    onStart={(duration) => handleStartTest(duration)}
                />
            </div>
        );
    }

    // ── Active test screens ──────────────────────────────────────────────────
    if (skill === "reading") {
        return (
            <ReadingTestInterface
                testId={id}
                test={test}
                initialAnswers={answersRef.current}
                onAnswerUpdate={handleAnswerUpdate}
                onFinish={(answers) => handleFinishTest(answers)}
            />
        );
    }

    if (skill === "listening") {
        return (
            <ListeningTestInterface
                testId={id}
                test={test}
                onAnswerUpdate={handleAnswerUpdate}
                onFinish={(answers) => { void handleFinishTest(answers); }}
            />
        );
    }

    if (skill === "writing") {
        return (
            <WritingTestInterface
                testId={id}
                test={test}
                onFinish={(answers?) => { void handleFinishTest(answers ?? answersRef.current); }}
            />
        );
    }

    if (skill === "speaking") {
        return (
            <SpeakingTestInterface
                testId={id}
                test={test}
                onFinish={() => { void handleFinishTest(answersRef.current); }}
            />
        );
    }

    return (
        <div className="flex h-full items-center justify-center flex-col gap-2">
            <h2 className="text-2xl font-bold capitalize">{skill} Test</h2>
            <p className="text-muted-foreground">This test module is coming soon.</p>
        </div>
    );
}
