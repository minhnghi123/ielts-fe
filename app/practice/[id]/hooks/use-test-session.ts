'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
    handleFinishTest: (finalAnswers?: Record<string, string>, currentAttemptId?: string, gradingId?: string, bandScore?: number) => Promise<void>;
    handleResume: () => void;
    handleDiscardAndRestart: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTestSession(testId: string): UseTestSessionReturn {
    const router = useRouter();
    const searchParams = useSearchParams();
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

    // ── Finish test: submit answers → clear session → navigate to result ──────
    // Defined early so activateTest (below) can reference it via a stable ref.

    const handleFinishTest = useCallback(async (
        finalAnswers?: Record<string, string>,
        currentAttemptId?: string,
        gradingId?: string,
        bandScore?: number,
    ) => {
        // ── Writing skill: AI grading bypass (gradingId provided by WritingTestInterface) ─
        if (gradingId) {
            const idToSubmit = currentAttemptId || attemptId;
            if (idToSubmit) {
                // Persist the gradingId→attemptId mapping so the profile history page
                // can reconstruct the writing review link on the same device.
                try { localStorage.setItem(`writing_grading_${idToSubmit}`, gradingId); } catch { /* ignore */ }
                try {
                    await testsApi.submitAttempt(idToSubmit, {
                        answers: [],
                        ...(bandScore !== undefined && { bandScore })
                    });
                } catch (err) {
                    console.error('[useTestSession] Failed to submit AI-graded attempt:', err);
                }
            }
            stopTimer();
            activeSessionRef.current = null;
            clearSession(testId);
            router.push(`/practice/${testId}/result?skill=writing&gradingId=${gradingId}`);
            return;
        }
        const idToSubmit = currentAttemptId || attemptId;
        if (!idToSubmit) {
            console.warn('[useTestSession] handleFinishTest called with no attemptId');
            return;
        }

        stopTimer();
        activeSessionRef.current = null;

        const answers = finalAnswers ?? answersRef.current;

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

        const rawAnswersArray = allQuestionIds.length > 0
            ? allQuestionIds.map(qId => ({ questionId: qId, answer: answers[qId] ?? '' }))
            : Object.entries(answers).map(([qId, ans]) => ({ questionId: qId, answer: ans }));

        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const answersArray = rawAnswersArray.filter(a => uuidRegex.test(a.questionId));

        const elapsedSeconds = testStartTimeRef.current !== null
            ? Math.floor((Date.now() - testStartTimeRef.current) / 1000)
            : null;

        try {
            await testsApi.submitAttempt(idToSubmit, {
                answers: answersArray,
                ...(bandScore !== undefined && { bandScore }),
            });
            clearSession(testId);
            const elapsed = elapsedSeconds !== null ? `&elapsed=${elapsedSeconds}` : '';
            if (test?.skill === 'speaking') {
                router.push(`/practice/${testId}/result?skill=speaking&attemptId=${idToSubmit}`);
            } else {
                router.push(`/practice/${testId}/result?attemptId=${idToSubmit}${elapsed}`);
            }
        } catch (err) {
            console.error('[useTestSession] Failed to submit attempt:', err);
            alert('Error submitting answers. Please try again.');
        }
    }, [attemptId, test, testId, router, stopTimer]);

    // Keep a stable ref to handleFinishTest so activateTest doesn't need it as a dep
    const handleFinishTestRef = useRef(handleFinishTest);
    handleFinishTestRef.current = handleFinishTest;

    // ── Activate test (shared by start + resume) ──────────────────────────────
    // Uses a stable ref so it can be called from the async IIFE in the fetch
    // effect without being a useCallback dependency that triggers re-renders.

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
            handleFinishTestRef.current(answersRef.current, attemptIdValue);
        });

        setOnExitAndSave(async () => {
            await handleFinishTestRef.current(answersRef.current, attemptIdValue);
        });

        setTestState('test');
    }, [setAttemptId, startTimer, setOnTimeUp, setOnExitAndSave]);
    // Note: handleFinishTest is intentionally NOT a dep; accessed via ref above.

    const activateTestRef = useRef(activateTest);
    activateTestRef.current = activateTest;

    // ── Save searchParams in a ref (avoid re-fetching when URL changes) ───────
    const searchParamsRef = useRef(searchParams);
    searchParamsRef.current = searchParams;

    // Prevent auto-start from firing twice (React StrictMode double-invoke)
    const autoStartedRef = useRef(false);

    // ── Fetch test + check for in-progress session ────────────────────────────

    useEffect(() => {
        let cancelled = false;
        setTestState('loading');
        autoStartedRef.current = false;

        testsApi.getTestById(testId)
            .then((data) => {
                if (cancelled) return;
                setTest(data);
                setTestTitle(data.title || '');

                const session = loadSession(testId);
                if (session) {
                    setResumeSession(session);
                    setTestState('resume-prompt');
                    return;
                }

                // If the user came from the test-detail page with ?duration=X,
                // skip the instructions screen and auto-start immediately.
                const durationParam = searchParamsRef.current.get('duration');
                if (durationParam && !autoStartedRef.current) {
                    autoStartedRef.current = true;
                    setIsStarting(true);
                    setTestState('instructions'); // Transition gracefully so user sees the styled instructions page
                    
                    (async () => {
                        try {
                            const user = authApi.getStoredUser();
                            if (!user) {
                                if (!cancelled) setTestState('instructions');
                                return;
                            }
                            const learnerId = (user as any).profileId || user.id;
                            const attempt = await testsApi.startAttempt(testId, learnerId);
                            if (cancelled) return;

                            const skillDurations: Record<string, number> = {
                                reading: 60, listening: 30, writing: 60, speaking: 15,
                            };
                            const defaultFull = skillDurations[data.skill ?? 'reading'] ?? 60;
                            const mins = durationParam === 'full' ? defaultFull : parseInt(durationParam, 10);
                            const durationMs = mins * 60 * 1000;

                            const newSession: PracticeSession = {
                                attemptId: attempt.id,
                                startedAt: Date.now(),
                                durationMs,
                                answers: {},
                            };
                            saveSession(testId, newSession);
                            activateTestRef.current(attempt.id, newSession, durationMs);
                        } catch (err) {
                            console.error('[useTestSession] Auto-start failed:', err);
                            if (!cancelled) setTestState('instructions');
                        } finally {
                            if (!cancelled) setIsStarting(false);
                        }
                    })();
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

    // ── Start fresh test (manual, from instructions screen) ──────────────────

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
            activateTestRef.current(attempt.id, session, durationMs);
        } catch (err) {
            console.error('[useTestSession] Failed to start attempt:', err);
            alert('Could not start test. Please try again.');
        } finally {
            setIsStarting(false);
        }
    }, [test, testId, router]);

    // ── Resume existing session ───────────────────────────────────────────────

    const handleResume = useCallback(() => {
        if (!resumeSession) return;

        const remainingMs = getRemainingMs(resumeSession);

        if (remainingMs <= 0) {
            void handleFinishTestRef.current(resumeSession.answers, resumeSession.attemptId);
            return;
        }

        activateTestRef.current(resumeSession.attemptId, resumeSession, remainingMs);
    }, [resumeSession]);

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
