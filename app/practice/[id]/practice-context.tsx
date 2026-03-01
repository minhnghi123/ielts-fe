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
}

const PracticeContext = createContext<PracticeContextType | undefined>(undefined);

export function PracticeProvider({ children }: { children: ReactNode }) {
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [durationMs, setDurationMs] = useState<number | null>(null);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [attemptId, setAttemptId] = useState<string | null>(null);

    // Use a ref to store the onTimeUp callback.
    // This avoids two problems:
    // 1. The React useState updater bug: if we stored a fn in useState and set it with
    //    setOnTimeUp(fn), React would call fn() immediately treating it as an updater.
    // 2. Stale closure in setInterval: reading from a ref always gives the latest value.
    const onTimeUpRef = useRef<(() => void) | null>(null);

    const setOnTimeUp = (callback: () => void) => {
        onTimeUpRef.current = callback;
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
