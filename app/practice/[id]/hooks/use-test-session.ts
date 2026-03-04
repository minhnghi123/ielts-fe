'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { testsApi } from '@/lib/api/tests';
import { authApi } from '@/lib/api/auth';
import { usePractice } from '../practice-context';
import type { Test } from '@/lib/types';

export type TestState = 'loading' | 'error' | 'instructions' | 'test';

export interface UseTestSessionReturn {
    test: Test | null;
    testState: TestState;
    isStarting: boolean;
    answersRef: React.MutableRefObject<Record<string, string>>;
    handleAnswerUpdate: (newAnswers: Record<string, string>) => void;
    handleStartTest: (chosenDuration: number | 'full') => Promise<void>;
    handleFinishTest: (finalAnswers?: Record<string, string>, currentAttemptId?: string) => Promise<void>;
}

export function useTestSession(testId: string): UseTestSessionReturn {
    const router = useRouter();
    const { startTimer, stopTimer, setOnTimeUp, attemptId, setAttemptId, setTestTitle } = usePractice();

    const [test, setTest] = useState<Test | null>(null);
    const [testState, setTestState] = useState<TestState>('loading');
    const [isStarting, setIsStarting] = useState(false);

    // Stores the latest answers without triggering re-renders — safe to read in async callbacks
    const answersRef = useRef<Record<string, string>>({});

    // Wall-clock timestamp when the user clicks "Start" — used to compute accurate elapsed
    // time that is completely independent of server/DB timezone handling
    const testStartTimeRef = useRef<number | null>(null);

    // ── Fetch test data ─────────────────────────────────────────────────────────
    useEffect(() => {
        let cancelled = false;
        setTestState('loading');

        testsApi.getTestById(testId)
            .then((data) => {
                if (cancelled) return;
                setTest(data);
                setTestTitle(data.title || '');
                setTestState('instructions');
            })
            .catch((err) => {
                if (cancelled) return;
                console.error('[useTestSession] Failed to fetch test:', err);
                setTestState('error');
            });

        return () => { cancelled = true; };
    }, [testId]);

    // ── Update answers ref (called from test interfaces on every answer change) ─
    const handleAnswerUpdate = (newAnswers: Record<string, string>) => {
        answersRef.current = newAnswers;
    };

    // ── Start the test: create attempt, start timer, register auto-submit ───────
    const handleStartTest = async (chosenDuration: number | 'full' = 'full') => {
        const user = authApi.getStoredUser();
        if (!user) {
            alert('Please log in to take a test.');
            router.push('/auth/login');
            return;
        }

        setIsStarting(true);
        try {
            // Create backend attempt — use profileId (learner_profile.id) which matches the FK constraint
            const learnerId = (user as any).profileId || user.id;
            const attempt = await testsApi.startAttempt(testId, learnerId);
            setAttemptId(attempt.id);

            // Determine default full duration from skill
            const skillDurations: Record<string, number> = {
                reading: 60,
                listening: 30,
                writing: 60,
                speaking: 15,
            };
            const defaultFull = skillDurations[test?.skill ?? 'reading'] ?? 60;

            // Capture browser wall-clock start time (UTC epoch, no timezone ambiguity)
            testStartTimeRef.current = Date.now();

            // Start timer
            startTimer(chosenDuration as any, defaultFull);

            // Register auto-submit — called when timer hits zero
            // Note: setOnTimeUp uses a ref internally, so this is safe to call here
            setOnTimeUp(() => {
                handleFinishTest(answersRef.current, attempt.id);
            });

            setTestState('test');
        } catch (err) {
            console.error('[useTestSession] Failed to start attempt:', err);
            alert('Could not start test. Please try again.');
        } finally {
            setIsStarting(false);
        }
    };

    // ── Finish test: submit answers and navigate to result ──────────────────────
    const handleFinishTest = async (
        finalAnswers?: Record<string, string>,
        currentAttemptId?: string,
    ) => {
        const idToSubmit = currentAttemptId || attemptId;
        if (!idToSubmit) {
            console.warn('[useTestSession] handleFinishTest called with no attemptId');
            return;
        }

        stopTimer();

        const answers = finalAnswers ?? answersRef.current;

        // Collect every question ID from the test structure so unanswered questions
        // are also sent with an empty string — the backend uses this to mark them
        // as skipped and compute accurate correct / wrong / skipped counts.
        const allQuestionIds: string[] = [];
        if (test?.sections) {
            for (const sec of test.sections) {
                for (const group of sec.questionGroups ?? []) {
                    for (const q of group.questions ?? []) {
                        allQuestionIds.push(q.id);
                    }
                }
            }
        }

        const answersArray = allQuestionIds.length > 0
            ? allQuestionIds.map(questionId => ({
                questionId,
                answer: answers[questionId] ?? '',
            }))
            : Object.entries(answers).map(([questionId, answer]) => ({
                questionId,
                answer,
            }));

        // Compute elapsed seconds from the browser wall-clock — completely
        // timezone-agnostic, avoids any DB timestamp parsing issues.
        const elapsedSeconds = testStartTimeRef.current !== null
            ? Math.floor((Date.now() - testStartTimeRef.current) / 1000)
            : null;

        try {
            await testsApi.submitAttempt(idToSubmit, { answers: answersArray });
            const elapsedParam = elapsedSeconds !== null ? `&elapsed=${elapsedSeconds}` : '';
            router.push(`/practice/${testId}/result?attemptId=${idToSubmit}${elapsedParam}`);
        } catch (err) {
            console.error('[useTestSession] Failed to submit attempt:', err);
            alert('Error submitting answers. Please try again.');
        }
    };

    return {
        test,
        testState,
        isStarting,
        answersRef,
        handleAnswerUpdate,
        handleStartTest,
        handleFinishTest,
    };
}
