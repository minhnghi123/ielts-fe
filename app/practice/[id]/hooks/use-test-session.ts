'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { testsApi } from '@/lib/api/tests';
import { authApi } from '@/lib/api/auth';
import { usePractice } from '../practice-context';
import type { Test } from '@/lib/types';

// ─── Test State ───────────────────────────────────────────────────────────────

export type TestState = 'loading' | 'error' | 'instructions' | 'resume-prompt' | 'test';

// ─── Session Storage ──────────────────────────────────────────────────────────
//
// A PracticeSession is persisted to localStorage the moment "Start" is clicked.
// It is updated on every answer change and cleared only after a successful submit.
// This lets us restore the user's exact position if they close the tab or navigate
// away mid-test.

export interface PracticeSession {
    attemptId: string;
    startedAt: number;       // browser epoch ms when the test began
    durationMs: number;      // original chosen duration in ms (e.g. 60 * 60 * 1000)
    answers: Record<string, string>;
}

function sessionKey(testId: string) {
    return `ielts_session_${testId}`;
}

function loadSession(testId: string): PracticeSession | null {
    try {
        const raw = localStorage.getItem(sessionKey(testId));
        return raw ? (JSON.parse(raw) as PracticeSession) : null;
    } catch {
        return null;
    }
}

function saveSession(testId: string, session: PracticeSession) {
    try {
        localStorage.setItem(sessionKey(testId), JSON.stringify(session));
    } catch {}
}

function clearSession(testId: string) {
    try {
        localStorage.removeItem(sessionKey(testId));
    } catch {}
}

/** ms remaining based on wall-clock time since the session started */
export function getRemainingMs(session: PracticeSession): number {
    return Math.max(0, session.durationMs - (Date.now() - session.startedAt));
}

// ─── Hook Interface ───────────────────────────────────────────────────────────

export interface UseTestSessionReturn {
    test: Test | null;
    testState: TestState;
    isStarting: boolean;
    resumeSession: PracticeSession | null;
    answersRef: React.MutableRefObject<Record<string, string>>;
    handleAnswerUpdate: (newAnswers: Record<string, string>) => void;
    handleStartTest: (chosenDuration: number | 'full') => Promise<void>;
    handleFinishTest: (finalAnswers?: Record<string, string>, currentAttemptId?: string) => Promise<void>;
    handleResume: () => void;
    handleDiscardAndRestart: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTestSession(testId: string): UseTestSessionReturn {
    const router = useRouter();
    const {
        startTimer, stopTimer,
        setOnTimeUp, setOnExitAndSave,
        attemptId, setAttemptId,
        setTestTitle,
    } = usePractice();

    const [test, setTest] = useState<Test | null>(null);
    const [testState, setTestState] = useState<TestState>('loading');
    const [isStarting, setIsStarting] = useState(false);
    const [resumeSession, setResumeSession] = useState<PracticeSession | null>(null);

    // Latest answers — read in async callbacks without stale-closure risk
    const answersRef = useRef<Record<string, string>>({});
    // Wall-clock start time — used to compute elapsed seconds for the result page
    const testStartTimeRef = useRef<number | null>(null);
    // The currently-live session object (kept in sync so beforeunload can write it)
    const activeSessionRef = useRef<PracticeSession | null>(null);

    // ── Fetch test + check for in-progress session ────────────────────────────

    useEffect(() => {
        let cancelled = false;
        setTestState('loading');

        testsApi.getTestById(testId)
            .then((data) => {
                if (cancelled) return;
                setTest(data);
                setTestTitle(data.title || '');

                const session = loadSession(testId);
                if (session) {
                    setResumeSession(session);
                    setTestState('resume-prompt');
                } else {
                    setTestState('instructions');
                }
            })
            .catch((err) => {
                if (cancelled) return;
                console.error('[useTestSession] Failed to fetch test:', err);
                setTestState('error');
            });

        return () => { cancelled = true; };
    }, [testId]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Save answers to localStorage on every change ──────────────────────────

    const handleAnswerUpdate = useCallback((newAnswers: Record<string, string>) => {
        answersRef.current = newAnswers;
        if (activeSessionRef.current) {
            const updated: PracticeSession = { ...activeSessionRef.current, answers: newAnswers };
            activeSessionRef.current = updated;
            saveSession(testId, updated);
        }
    }, [testId]);

    // ── Sync to localStorage before the tab/browser closes ────────────────────

    useEffect(() => {
        const onBeforeUnload = () => {
            if (activeSessionRef.current) {
                saveSession(testId, {
                    ...activeSessionRef.current,
                    answers: answersRef.current,
                });
            }
        };
        window.addEventListener('beforeunload', onBeforeUnload);
        return () => window.removeEventListener('beforeunload', onBeforeUnload);
    }, [testId]);

    // ── Finish test: submit answers → clear session → navigate to result ──────

    const handleFinishTest = useCallback(async (
        finalAnswers?: Record<string, string>,
        currentAttemptId?: string,
    ) => {
        const idToSubmit = currentAttemptId || attemptId;
        if (!idToSubmit) {
            console.warn('[useTestSession] handleFinishTest called with no attemptId');
            return;
        }

        stopTimer();
        activeSessionRef.current = null; // prevent further localStorage writes

        const answers = finalAnswers ?? answersRef.current;

        // Build an answer array that includes every question (unanswered = "")
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
            ? allQuestionIds.map(qId => ({ questionId: qId, answer: answers[qId] ?? '' }))
            : Object.entries(answers).map(([qId, ans]) => ({ questionId: qId, answer: ans }));

        const elapsedSeconds = testStartTimeRef.current !== null
            ? Math.floor((Date.now() - testStartTimeRef.current) / 1000)
            : null;

        try {
            await testsApi.submitAttempt(idToSubmit, { answers: answersArray });
            clearSession(testId);
            const elapsed = elapsedSeconds !== null ? `&elapsed=${elapsedSeconds}` : '';
            router.push(`/practice/${testId}/result?attemptId=${idToSubmit}${elapsed}`);
        } catch (err) {
            console.error('[useTestSession] Failed to submit attempt:', err);
            alert('Error submitting answers. Please try again.');
        }
    }, [attemptId, test, testId, router, stopTimer]);

    // ── Helpers shared by handleStartTest and handleResume ────────────────────

    const activateTest = useCallback((
        attemptIdValue: string,
        session: PracticeSession,
        remainingMs: number,
    ) => {
        answersRef.current = session.answers;
        activeSessionRef.current = session;
        testStartTimeRef.current = session.startedAt;
        setAttemptId(attemptIdValue);

        const remainingMins = remainingMs / (60 * 1000);
        startTimer(remainingMins, remainingMins);

        setOnTimeUp(() => {
            handleFinishTest(answersRef.current, attemptIdValue);
        });

        setOnExitAndSave(async () => {
            await handleFinishTest(answersRef.current, attemptIdValue);
        });

        setTestState('test');
    }, [setAttemptId, startTimer, setOnTimeUp, setOnExitAndSave, handleFinishTest]);

    // ── Start fresh test ──────────────────────────────────────────────────────

    const handleStartTest = useCallback(async (chosenDuration: number | 'full' = 'full') => {
        const user = authApi.getStoredUser();
        if (!user) {
            alert('Please log in to take a test.');
            router.push('/auth/login');
            return;
        }

        setIsStarting(true);
        try {
            const learnerId = (user as any).profileId || user.id;
            const attempt = await testsApi.startAttempt(testId, learnerId);

            const skillDurations: Record<string, number> = {
                reading: 60, listening: 30, writing: 60, speaking: 15,
            };
            const defaultFull = skillDurations[test?.skill ?? 'reading'] ?? 60;
            const mins = chosenDuration === 'full' ? defaultFull : Number(chosenDuration);
            const durationMs = mins * 60 * 1000;

            const session: PracticeSession = {
                attemptId: attempt.id,
                startedAt: Date.now(),
                durationMs,
                answers: {},
            };
            saveSession(testId, session);

            activateTest(attempt.id, session, durationMs);
        } catch (err) {
            console.error('[useTestSession] Failed to start attempt:', err);
            alert('Could not start test. Please try again.');
        } finally {
            setIsStarting(false);
        }
    }, [test, testId, router, activateTest]);

    // ── Resume existing session ───────────────────────────────────────────────

    const handleResume = useCallback(() => {
        if (!resumeSession) return;

        const remainingMs = getRemainingMs(resumeSession);

        if (remainingMs <= 0) {
            // Time has already run out — submit the saved answers automatically
            void handleFinishTest(resumeSession.answers, resumeSession.attemptId);
            return;
        }

        activateTest(resumeSession.attemptId, resumeSession, remainingMs);
    }, [resumeSession, activateTest, handleFinishTest]);

    // ── Discard old session and go back to instructions ───────────────────────

    const handleDiscardAndRestart = useCallback(() => {
        clearSession(testId);
        setResumeSession(null);
        answersRef.current = {};
        activeSessionRef.current = null;
        setTestState('instructions');
    }, [testId]);

    return {
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
    };
}
