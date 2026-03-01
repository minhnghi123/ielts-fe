"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface PracticeContextType {
    timeLeft: number | null; // null means untimed
    durationMs: number | null;
    isTimerRunning: boolean;
    startTimer: (durationMinutes: number | "full" | "untimed", defaultDurationFull: number) => void;
    stopTimer: () => void;
    onTimeUp: (() => void) | null;
    setOnTimeUp: (callback: () => void) => void;
    attemptId: string | null;
    setAttemptId: (id: string) => void;
}

const PracticeContext = createContext<PracticeContextType | undefined>(undefined);

export function PracticeProvider({ children }: { children: ReactNode }) {
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [durationMs, setDurationMs] = useState<number | null>(null);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [onTimeUp, setOnTimeUp] = useState<(() => void) | null>(null);
    const [attemptId, setAttemptId] = useState<string | null>(null);

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
        let interval: NodeJS.Timeout;

        if (isTimerRunning && timeLeft !== null) {
            interval = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev === null) return null;
                    const newTime = prev - 1000;
                    if (newTime <= 0) {
                        setIsTimerRunning(false);
                        if (onTimeUp) {
                            onTimeUp(); // Trigger auto-submit
                        }
                        return 0;
                    }
                    return newTime;
                });
            }, 1000);
        }

        return () => clearInterval(interval);
    }, [isTimerRunning, timeLeft, onTimeUp]);

    return (
        <PracticeContext.Provider
            value={{
                timeLeft,
                durationMs,
                isTimerRunning,
                startTimer,
                stopTimer,
                onTimeUp,
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
