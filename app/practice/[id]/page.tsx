"use client";

import { useState, useEffect, useRef, use } from "react";
import { TestInstructions } from "./_components/test-instructions";
import { ReadingTestInterface } from "./_components/reading-test-interface";
import { ListeningTestInterface } from "./_components/listening-test-interface";
import { WritingTestInterface } from "./_components/writing-test-interface";
import { SpeakingTestInterface } from "./_components/speaking-test-interface";
import { useRouter, useSearchParams } from "next/navigation";
import { testsApi } from "@/lib/api/tests";
import { usePractice } from "./practice-context";
import { authApi } from "@/lib/api/auth";

// Placeholder for other test types
function OtherTestPlaceholder({ type }: { type: string }) {
    return (
        <div className="flex items-center justify-center h-full">
            <div className="text-center">
                <h2 className="text-2xl font-bold mb-2 capitalize">{type} Test</h2>
                <p className="text-muted-foreground">This test module is coming soon.</p>
            </div>
        </div>
    )
}

export default function PracticePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const searchParams = useSearchParams();
    const durationParam = searchParams.get("duration") || "full";
    const [testState, setTestState] = useState<'instructions' | 'test'>('instructions');

    const [test, setTest] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Timer and Attempt context
    const { startTimer, stopTimer, setOnTimeUp, attemptId, setAttemptId } = usePractice();
    const [isStarting, setIsStarting] = useState(false);

    // We need a ref to access the latest answers for auto-submission
    // The child interface will update this via a callback
    const answersRef = useRef<Record<string, string>>({});

    const handleAnswerUpdate = (newAnswers: Record<string, string>) => {
        answersRef.current = newAnswers;
    };

    const handleStartTest = async (chosenDuration: number | 'full' = 'full') => {
        setIsStarting(true);
        try {
            const user = authApi.getStoredUser();
            if (!user) {
                alert("Please log in to take a test.");
                router.push("/auth/login");
                return;
            }

            // Create Attempt in Backend
            const attempt = await testsApi.startAttempt(id, user.id);
            setAttemptId(attempt.id);

            // Determine correct full duration based on test module
            let defaultDurationFull = 60;
            if (test?.skill === 'listening') defaultDurationFull = 30;
            if (test?.skill === 'speaking') defaultDurationFull = 15;

            // Start global timer
            startTimer(chosenDuration as any, defaultDurationFull);

            // Set auto-submit handler
            setOnTimeUp(() => {
                handleFinishTest(answersRef.current, attempt.id);
            });

            // Switch view
            setTestState('test');
        } catch (error) {
            console.error("Failed to start attempt", error);
            alert("Could not start test. Please try again.");
        } finally {
            setIsStarting(false);
        }
    };

    const handleFinishTest = async (finalAnswers: Record<string, string>, currentAttemptId?: string) => {
        const idToSubmit = currentAttemptId || attemptId;
        if (!idToSubmit) return;

        stopTimer();

        try {
            // Convert Record<string, string> to array format
            const answersArray = Object.entries(finalAnswers).map(([questionId, answer]) => ({
                questionId,
                answer,
            }));

            await testsApi.submitAttempt(idToSubmit, { answers: answersArray });
            router.push(`/practice/${id}/result?attemptId=${idToSubmit}`);
        } catch (error) {
            console.error("Failed to submit attempt", error);
            alert("Error submitting answers.");
        }
    };

    useEffect(() => {
        import("@/lib/api/tests").then(({ testsApi }) => {
            testsApi.getTestById(id)
                .then(data => {
                    setTest(data);
                    setIsLoading(false);
                })
                .catch(err => {
                    console.error("Failed to fetch test:", err);
                    setIsLoading(false);
                });
        });
    }, [id]);

    const testType = test?.skill || "reading";

    // Reset instruction state when switching modules
    useEffect(() => {
        setTestState('instructions');
    }, [testType]);

    if (isLoading) {
        return <div className="flex h-full items-center justify-center">Loading test...</div>;
    }

    if (!test) {
        return <div className="flex h-full items-center justify-center">Test not found</div>;
    }

    if (testState === 'instructions') {
        const isListening = testType === 'listening';
        const isWriting = testType === 'writing';
        const isSpeaking = testType === 'speaking';

        let title = "IELTS Academic Reading Test";
        let defaultDuration = 60;
        let questionCount = 0;
        let sectionCount = test.sections?.length || 0;

        if (isListening) {
            title = "IELTS Academic Listening Test";
            defaultDuration = 30;
        } else if (isWriting) {
            title = "IELTS Academic Writing Test";
            defaultDuration = 60;
            questionCount = test.writingTasks?.length || 2;
            sectionCount = test.writingTasks?.length || 2;
        } else if (isSpeaking) {
            title = "IELTS Academic Speaking Test";
            defaultDuration = 15;
            questionCount = test.speakingParts?.length || 3;
            sectionCount = test.speakingParts?.length || 3;
        }

        // Calculate dynamic questions for Reading/Listening
        if (!isWriting && !isSpeaking) {
            questionCount = test.sections?.reduce((acc: number, sec: any) =>
                acc + ((sec.questionGroups || sec.groups)?.reduce((qacc: number, group: any) => qacc + (group.questions?.length || 0), 0) || 0)
                , 0) || 0;
        }

        return (
            <div className="h-full overflow-y-auto bg-background">
                <TestInstructions
                    title={test.title || title}
                    defaultDuration={defaultDuration}
                    sectionCount={sectionCount}
                    questionCount={questionCount}
                    isStarting={isStarting}
                    onStart={handleStartTest}
                />
            </div>
        );
    }

    if (testType === 'reading') {
        return (
            <ReadingTestInterface
                testId={id}
                test={test}
                onAnswerUpdate={handleAnswerUpdate}
                onFinish={(answers) => handleFinishTest(answers)}
            />
        );
    }

    if (testType === 'listening') {
        return (
            <ListeningTestInterface
                testId={id}
                test={test}
                onFinish={() => router.push(`/practice/${id}/result`)}
            />
        );
    }

    if (testType === 'writing') {
        return (
            <WritingTestInterface
                testId={id}
                test={test}
                onFinish={() => router.push(`/practice/${id}/result`)}
            />
        );
    }

    if (testType === 'speaking') {
        return (
            <SpeakingTestInterface
                testId={id}
                test={test}
                onFinish={() => router.push(`/practice/${id}/result`)}
            />
        );
    }

    return <OtherTestPlaceholder type={testType} />;
}
