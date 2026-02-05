"use client";

import { useState, useEffect } from "react";
import { TestInstructions } from "./_components/test-instructions";
import { ReadingTestInterface } from "./_components/reading-test-interface";
import { ListeningTestInterface } from "./_components/listening-test-interface";
import { WritingTestInterface } from "./_components/writing-test-interface";
import { SpeakingTestInterface } from "./_components/speaking-test-interface";
import { useRouter, useSearchParams } from "next/navigation";

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

export default function PracticePage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [testState, setTestState] = useState<'instructions' | 'test'>('instructions');

    // Determine test type from URL query param 'module' or default to 'reading' for ID-based routes
    // (In a real app, this might come from an API based on the ID)
    const moduleParam = searchParams.get('module');
    const testType = moduleParam || "reading";

    // Reset instruction state when switching modules
    useEffect(() => {
        setTestState('instructions');
    }, [testType]);
    // console.log(testType)
    if (testState === 'instructions') {
        const isListening = testType === 'listening';
        const isWriting = testType === 'writing';
        const isSpeaking = testType === 'speaking';

        let title = "IELTS Academic Reading Test";
        let duration = "60 minutes";
        let questionCount = 40;

        if (isListening) {
            title = "IELTS Academic Listening Test";
            duration = "30 minutes";
        } else if (isWriting) {
            title = "IELTS Academic Writing Test";
            duration = "60 minutes";
            questionCount = 2; // Tasks
        } else if (isSpeaking) {
            title = "IELTS Academic Speaking Test";
            duration = "11-14 minutes";
            questionCount = 3; // Parts
        }

        return (
            <div className="h-full overflow-y-auto bg-background">
                <TestInstructions
                    title={title}
                    duration={duration}
                    questionCount={questionCount}
                    onStart={() => setTestState('test')}
                />
            </div>
        );
    }

    if (testType === 'reading') {
        return (
            <ReadingTestInterface
                testId={params.id}
                onFinish={() => router.push(`/practice/${params.id}/result`)}
            />
        );
    }

    if (testType === 'listening') {
        return (
            <ListeningTestInterface
                testId={params.id}
                onFinish={() => router.push(`/practice/${params.id}/result`)}
            />
        );
    }

    if (testType === 'writing') {
        return (
            <WritingTestInterface
                testId={params.id}
                onFinish={() => router.push(`/practice/${params.id}/result`)}
            />
        );
    }

    if (testType === 'speaking') {
        return (
            <SpeakingTestInterface
                testId={params.id}
                onFinish={() => router.push(`/practice/${params.id}/result`)}
            />
        );
    }

    return <OtherTestPlaceholder type={testType} />;
}
