"use client";

import { use } from "react";
import { useSearchParams } from "next/navigation";
import { useTestSession } from "./hooks/use-test-session";
import { TestInstructions } from "./_components/test-instructions";
import { ReadingTestInterface } from "./_components/reading-test-interface";
import { ListeningTestInterface } from "./_components/listening-test-interface";
import { WritingTestInterface } from "./_components/writing-test-interface";
import { SpeakingTestInterface } from "./_components/speaking-test-interface";

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

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function PracticePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const searchParams = useSearchParams();
    // Duration may be pre-selected from the detail page
    const durationParam = searchParams.get("duration") || "full";

    const {
        test,
        testState,
        isStarting,
        answersRef,
        handleAnswerUpdate,
        handleStartTest,
        handleFinishTest,
    } = useTestSession(id);

    // ── Loading / error guards ───────────────────────────────────────────────
    if (testState === "loading") return <FullPageSpinner />;
    if (testState === "error" || !test) return <FullPageError message="Test not found. Please go back and try again." />;

    const skill = test.skill;
    const defaults = SKILL_DEFAULTS[skill] ?? SKILL_DEFAULTS.reading;

    // ── Question / section counts (used by the instructions screen) ──────────
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

    // Fallback for unrecognised skills
    return (
        <div className="flex h-full items-center justify-center flex-col gap-2">
            <h2 className="text-2xl font-bold capitalize">{skill} Test</h2>
            <p className="text-muted-foreground">This test module is coming soon.</p>
        </div>
    );
}
