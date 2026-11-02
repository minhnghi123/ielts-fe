'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { testsApi } from '@/lib/api/tests';
import { authApi } from '@/lib/api/auth';
import { usePractice } from '../practice-context';
import type { Test, TestAttempt } from '@/lib/types';
import { SKILL_DURATION_MINUTES } from '@/lib/types';

// ─── Test State ───────────────────────────────────────────────────────────────

export type TestState = 'loading' | 'error' | 'instructions' | 'resume-prompt' | 'test';
export type SaveState = 'idle' | 'saving' | 'saved' | 'offline';

// ─── Session ──────────────────────────────────────────────────────────────────
//
// The attempt lives on the server: `expiresAt` is the authoritative deadline and
// `/attempts/:id/draft` holds the autosaved answers. localStorage is only a
// cache so a page reload is instant and answers survive a dropped connection.

export interface PracticeSession {
    attemptId: string;
    startedAt: number;       // epoch ms
    expiresAt: number;       // epoch ms (server deadline mirrored locally)
    answers: Record<string, string>;
    isPractice: boolean;
}

function sessionKey(testId: string) {
    return `ielts_session_${testId}`;
}

function loadSession(testId: string): PracticeSession | null {
    try {
        const raw = localStorage.getItem(sessionKey(testId));
        if (!raw) return null;
        const parsed = JSON.parse(raw) as Partial<PracticeSession> & { durationMs?: number };
        if (!parsed.attemptId) return null;
        // Older sessions stored a duration instead of a deadline
        const expiresAt = parsed.expiresAt ?? ((parsed.startedAt ?? 0) + (parsed.durationMs ?? 0));
        return {
            attemptId: parsed.attemptId,
            startedAt: parsed.startedAt ?? Date.now(),
            expiresAt,
            answers: parsed.answers ?? {},
            isPractice: parsed.isPractice ?? false,
        };
    } catch {
        return null;
    }
}

function saveSession(testId: string, session: PracticeSession) {
    try {
        localStorage.setItem(sessionKey(testId), JSON.stringify(session));
    } catch { /* storage unavailable */ }
}

function clearSession(testId: string) {
    try {
        localStorage.removeItem(sessionKey(testId));
    } catch { /* storage unavailable */ }
}

/** ms remaining until the server deadline */
export function getRemainingMs(session: PracticeSession): number {
    return Math.max(0, session.expiresAt - Date.now());
}

function sessionFromAttempt(attempt: TestAttempt, answers: Record<string, string> = {}): PracticeSession {
    const remainingMs = (attempt.remainingSeconds ?? 0) * 1000;
    const expiresAt = attempt.expiresAt
        ? new Date(attempt.expiresAt).getTime()
        : Date.now() + remainingMs;
    return {
        attemptId: attempt.id,
        startedAt: new Date(attempt.startedAt).getTime() || Date.now(),
        // Prefer remainingSeconds (immune to client clock skew) when the server sent it
        expiresAt: attempt.remainingSeconds != null ? Date.now() + remainingMs : expiresAt,
        answers: { ...(attempt.draftAnswers ?? {}), ...answers },
        isPractice: attempt.isPractice ?? false,
    };
}

export const AUTOSAVE_DEBOUNCE_MS = 2000;

// ─── Hook Interface ───────────────────────────────────────────────────────────

export interface UseTestSessionReturn {
    test: Test | null;
    testState: TestState;
    isStarting: boolean;
    saveState: SaveState;
    lastSavedAt: Date | null;
    resumeSession: PracticeSession | null;
    answersRef: React.MutableRefObject<Record<string, string>>;
    handleAnswerUpdate: (newAnswers: Record<string, string>) => void;
    handleStartTest: (chosenDuration: number | 'full') => Promise<void>;
    handleFinishTest: (finalAnswers?: Record<string, string>, currentAttemptId?: string, gradingId?: string) => Promise<void>;
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
    const [saveState, setSaveState] = useState<SaveState>('idle');
    const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
    const [resumeSession, setResumeSession] = useState<PracticeSession | null>(null);

    const answersRef = useRef<Record<string, string>>({});
    const activeSessionRef = useRef<PracticeSession | null>(null);
    const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const dirtyRef = useRef(false);
    const submittingRef = useRef(false);

    // ── Autosave to the server (debounced) ────────────────────────────────────

    const flushDraft = useCallback(async () => {
        const session = activeSessionRef.current;
        if (!session || !dirtyRef.current) return;
        dirtyRef.current = false;
        setSaveState('saving');
        try {
            const res = await testsApi.saveDraft(session.attemptId, answersRef.current);
            setLastSavedAt(new Date(res.savedAt));
            setSaveState('saved');
            if (res.remainingSeconds != null && activeSessionRef.current) {
                // Re-sync the local deadline with the server on every save
                activeSessionRef.current.expiresAt = Date.now() + res.remainingSeconds * 1000;
            }
        } catch (err: any) {
            if (err?.response?.status === 409) {
                // Deadline passed server-side — the attempt was auto-submitted
                toast.info('Time is up — your answers were submitted automatically.');
                clearSession(testId);
                stopTimer();
                router.push(`/practice/${testId}/result?attemptId=${session.attemptId}`);
                return;
            }
            dirtyRef.current = true;
            setSaveState('offline');
        }
    }, [router, stopTimer, testId]);

    const scheduleAutosave = useCallback(() => {
        if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = setTimeout(() => { void flushDraft(); }, AUTOSAVE_DEBOUNCE_MS);
    }, [flushDraft]);

    // ── Finish test: submit answers → clear session → navigate to result ──────

    const handleFinishTest = useCallback(async (
        finalAnswers?: Record<string, string>,
        currentAttemptId?: string,
        gradingId?: string,
    ) => {
        const idToSubmit = currentAttemptId || attemptId || activeSessionRef.current?.attemptId;
        if (!idToSubmit) {
            console.warn('[useTestSession] handleFinishTest called with no attemptId');
            return;
        }
        if (submittingRef.current) return;
        submittingRef.current = true;

        if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
        stopTimer();

        const answers = finalAnswers ?? answersRef.current;

        // Grade every question of the test so unanswered ones count as skipped.
        const allQuestionIds: string[] = [];
        for (const sec of test?.sections ?? []) {
            for (const group of sec.questionGroups ?? []) {
                for (const q of group.questions ?? []) allQuestionIds.push(q.id);
            }
        }
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const answersArray = (allQuestionIds.length > 0
            ? allQuestionIds.map(qId => ({ questionId: qId, answer: answers[qId] ?? '' }))
            : Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer }))
        ).filter(a => uuidRegex.test(a.questionId));

        try {
            if (gradingId) {
                // Writing: the AI band was stored server-side by /api/ai/grade-writing
                try { localStorage.setItem(`writing_grading_${idToSubmit}`, gradingId); } catch { /* ignore */ }
            }
            await testsApi.submitAttempt(idToSubmit, { answers: answersArray });
            activeSessionRef.current = null;
            clearSession(testId);

            const skill = test?.skill;
            if (skill === 'writing') {
                router.push(`/practice/${testId}/result?skill=writing&attemptId=${idToSubmit}${gradingId ? `&gradingId=${gradingId}` : ''}`);
            } else if (skill === 'speaking') {
                router.push(`/practice/${testId}/result?skill=speaking&attemptId=${idToSubmit}`);
            } else {
                router.push(`/practice/${testId}/result?attemptId=${idToSubmit}`);
            }
        } catch (err: any) {
            if (err?.response?.status === 409) {
                // Already submitted (e.g. auto-submitted on expiry) — just show the result
                activeSessionRef.current = null;
                clearSession(testId);
                router.push(`/practice/${testId}/result?attemptId=${idToSubmit}`);
                return;
            }
            console.error('[useTestSession] Failed to submit attempt:', err);
            toast.error('Could not submit your answers. Check your connection and try again.');
            submittingRef.current = false;
        }
    }, [attemptId, test, testId, router, stopTimer]);

    const handleFinishTestRef = useRef(handleFinishTest);
    handleFinishTestRef.current = handleFinishTest;

    // ── Activate test (shared by start + resume) ──────────────────────────────

    const activateTest = useCallback((session: PracticeSession) => {
        answersRef.current = session.answers;
        activeSessionRef.current = session;
        dirtyRef.current = false;
        submittingRef.current = false;
        setSaveState('idle');
        setAttemptId(session.attemptId);
        saveSession(testId, session);

        const remainingMins = getRemainingMs(session) / 60_000;
        startTimer(remainingMins, remainingMins);

        setOnTimeUp(() => {
            toast.info('Time is up — submitting your answers.');
            void handleFinishTestRef.current(answersRef.current, session.attemptId);
        });
        setOnExitAndSave(async () => {
            await handleFinishTestRef.current(answersRef.current, session.attemptId);
        });

        setTestState('test');
    }, [setAttemptId, startTimer, setOnTimeUp, setOnExitAndSave, testId]);

    const activateTestRef = useRef(activateTest);
    activateTestRef.current = activateTest;

    const searchParamsRef = useRef(searchParams);
    searchParamsRef.current = searchParams;
    const autoStartedRef = useRef(false);

    // ── Start a new attempt on the server ─────────────────────────────────────

    const startOnServer = useCallback(async (testData: Test, chosenDuration: number | 'full') => {
        const official = testData.durationMinutes ?? SKILL_DURATION_MINUTES[testData.skill] ?? 60;
        const wantsCustom = chosenDuration !== 'full' && Number(chosenDuration) !== official;
        // Mock tests always run on the official clock; the server enforces this too.
        const durationMinutes = wantsCustom && !testData.isMock ? Number(chosenDuration) : undefined;
        const assignmentId = searchParams.get('assignment') || undefined;
        const attempt = await testsApi.startAttempt(testData.id, {
            ...(durationMinutes ? { durationMinutes } : {}),
            ...(assignmentId ? { assignmentId } : {}),
        });
        return sessionFromAttempt(attempt);
    }, [searchParams]);

    // ── Fetch test + look for an in-progress attempt ──────────────────────────

    useEffect(() => {
        let cancelled = false;
        setTestState('loading');
        autoStartedRef.current = false;

        (async () => {
            try {
                const data = await testsApi.getTestById(testId);
                if (cancelled) return;
                setTest(data);
                setTestTitle(data.title || '');

                // 1. Server-side open attempt (works across devices)
                let session: PracticeSession | null = null;
                if (authApi.isAuthenticated()) {
                    try {
                        const active = await testsApi.getActiveAttempt(testId, searchParams.get('assignment') || undefined);
                        if (active) {
                            const local = loadSession(testId);
                            const localAnswers = local?.attemptId === active.id ? local.answers : {};
                            session = sessionFromAttempt(active, localAnswers);
                        }
                    } catch { /* fall back to local cache */ }
                }
                // 2. Local cache (same device) — only if the server didn't know better
                if (!session) {
                    const local = loadSession(testId);
                    if (local && getRemainingMs(local) > 0) session = local;
                    else if (local) clearSession(testId);
                }
                if (cancelled) return;

                if (session) {
                    setResumeSession(session);
                    setTestState('resume-prompt');
                    return;
                }

                // Came from the test-detail page with ?duration=X → start immediately
                const durationParam = searchParamsRef.current.get('duration');
                if (durationParam && !autoStartedRef.current) {
                    autoStartedRef.current = true;
                    if (!authApi.isAuthenticated()) {
                        setTestState('instructions');
                        return;
                    }
                    setIsStarting(true);
                    setTestState('instructions');
                    try {
                        const chosen = durationParam === 'full' ? 'full' : parseInt(durationParam, 10);
                        const newSession = await startOnServer(data, Number.isNaN(chosen) ? 'full' : chosen);
                        if (cancelled) return;
                        activateTestRef.current(newSession);
                    } catch (err) {
                        console.error('[useTestSession] Auto-start failed:', err);
                        if (!cancelled) setTestState('instructions');
                    } finally {
                        if (!cancelled) setIsStarting(false);
                    }
                } else {
                    setTestState('instructions');
                }
            } catch (err) {
                if (cancelled) return;
                console.error('[useTestSession] Failed to fetch test:', err);
                setTestState('error');
            }
        })();

        return () => { cancelled = true; };
    }, [testId]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Answers changed → cache locally + schedule server autosave ────────────

    const handleAnswerUpdate = useCallback((newAnswers: Record<string, string>) => {
        answersRef.current = newAnswers;
        if (activeSessionRef.current) {
            const updated: PracticeSession = { ...activeSessionRef.current, answers: newAnswers };
            activeSessionRef.current = updated;
            saveSession(testId, updated);
            dirtyRef.current = true;
            scheduleAutosave();
        }
    }, [testId, scheduleAutosave]);

    // ── Flush before the tab closes / goes to background ──────────────────────

    useEffect(() => {
        const persist = () => {
            if (activeSessionRef.current) {
                saveSession(testId, { ...activeSessionRef.current, answers: answersRef.current });
                void flushDraft();
            }
        };
        const onVisibility = () => { if (document.visibilityState === 'hidden') persist(); };
        window.addEventListener('beforeunload', persist);
        document.addEventListener('visibilitychange', onVisibility);
        return () => {
            window.removeEventListener('beforeunload', persist);
            document.removeEventListener('visibilitychange', onVisibility);
            if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
        };
    }, [testId, flushDraft]);

    // ── Start fresh test (manual, from instructions screen) ──────────────────

    const handleStartTest = useCallback(async (chosenDuration: number | 'full' = 'full') => {
        if (!authApi.isAuthenticated()) {
            toast.error('Please log in to take a test.');
            router.push(`/login?next=/practice/${testId}`);
            return;
        }
        if (!test) return;

        setIsStarting(true);
        try {
            const session = await startOnServer(test, chosenDuration);
            activateTestRef.current(session);
        } catch (err: any) {
            console.error('[useTestSession] Failed to start attempt:', err);
            const msg = err?.response?.data?.message;
            toast.error(typeof msg === 'string' ? msg : 'Could not start the test. Please try again.');
        } finally {
            setIsStarting(false);
        }
    }, [test, testId, router, startOnServer]);

    // ── Resume existing session ───────────────────────────────────────────────

    const handleResume = useCallback(() => {
        if (!resumeSession) return;
        if (getRemainingMs(resumeSession) <= 0) {
            void handleFinishTestRef.current(resumeSession.answers, resumeSession.attemptId);
            return;
        }
        activateTestRef.current(resumeSession);
    }, [resumeSession]);

    // ── Discard: submit the open attempt as-is, then let the learner restart ──

    const handleDiscardAndRestart = useCallback(() => {
        const old = resumeSession;
        clearSession(testId);
        setResumeSession(null);
        answersRef.current = {};
        activeSessionRef.current = null;
        if (old) {
            // The server only allows one open attempt per test; close the old one.
            testsApi.submitAttempt(old.attemptId, { answers: [] }).catch(() => { /* already closed */ });
        }
        setTestState('instructions');
    }, [testId, resumeSession]);

    return {
        test,
        testState,
        isStarting,
        saveState,
        lastSavedAt,
        resumeSession,
        answersRef,
        handleAnswerUpdate,
        handleStartTest,
        handleFinishTest,
        handleResume,
        handleDiscardAndRestart,
    };
}
