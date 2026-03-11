"use client";

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";

interface PracticeContextType {
    timeLeft: number | null; // null means untimed
    durationMs: number | null;
    isTimerRunning: boolean;
    startTimer: (durationMinutes: number | "full" | "untimed", defaultDurationFull: number) => void;
    stopTimer: () => void;
    setOnTimeUp: (callback: () => void) => void;
    attemptId: string | null;
    setAttemptId: (id: string) => void;
    testTitle: string | null;
    setTestTitle: (title: string) => void;
    // Exit-and-save: registered by useTestSession, triggered by the layout's exit button
    setOnExitAndSave: (callback: () => Promise<void>) => void;
    triggerExitAndSave: () => Promise<boolean>; // returns true if a test was in progress
}

const PracticeContext = createContext<PracticeContextType | undefined>(undefined);

export function PracticeProvider({ children }: { children: ReactNode }) {
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [durationMs, setDurationMs] = useState<number | null>(null);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [attemptId, setAttemptId] = useState<string | null>(null);
    const [testTitle, setTestTitle] = useState<string | null>(null);

    // Use refs for callbacks to avoid stale-closure issues and the React-useState-updater bug.
    const onTimeUpRef = useRef<(() => void) | null>(null);
    const onExitAndSaveRef = useRef<(() => Promise<void>) | null>(null);

    const setOnTimeUp = (callback: () => void) => {
        onTimeUpRef.current = callback;
    };

    const setOnExitAndSave = (callback: () => Promise<void>) => {
        onExitAndSaveRef.current = callback;
    };

    const triggerExitAndSave = async (): Promise<boolean> => {
        if (!onExitAndSaveRef.current) return false;
        await onExitAndSaveRef.current();
        return true;
    };

    const startTimer = (durationMinutes: number | "full" | "untimed", defaultDurationFull: number) => {
        if (durationMinutes === "untimed") {
            setTimeLeft(null);
            setDurationMs(null);
            setIsTimerRunning(false);
            return;
        }

        const mins = durationMinutes === "full" ? defaultDurationFull : Number(durationMinutes);
        const ms = mins * 60 * 1000;
        setTimeLeft(ms);
        setDurationMs(ms);
        setIsTimerRunning(true);
    };

    const stopTimer = () => {
        setIsTimerRunning(false);
    };

    useEffect(() => {
        if (!isTimerRunning) return;

        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev === null) return null;
                const newTime = prev - 1000;
                if (newTime <= 0) {
                    setIsTimerRunning(false);
                    // Read the latest callback from the ref — no stale closure issue
                    onTimeUpRef.current?.();
                    return 0;
                }
                return newTime;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isTimerRunning]); // Only re-run when isTimerRunning changes, not every second

    return (
        <PracticeContext.Provider
            value={{
                timeLeft,
                durationMs,
                isTimerRunning,
                startTimer,
                stopTimer,
                setOnTimeUp,
                attemptId,
                setAttemptId,
                testTitle,
                setTestTitle,
                setOnExitAndSave,
                triggerExitAndSave,
            }}
        >
            {children}
        </PracticeContext.Provider>
    );
}

export function usePractice() {
    const context = useContext(PracticeContext);
    if (context === undefined) {
        throw new Error("usePractice must be used within a PracticeProvider");
    }
    return context;
}
