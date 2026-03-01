"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Timer } from "lucide-react";
import Link from "next/link";
import { PracticeProvider, usePractice } from "./[id]/practice-context";

function PracticeHeader() {
    const { timeLeft } = usePractice();

    const formatTime = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between sticky top-0 z-50">
            <div className="font-bold text-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">school</span>
                IELTS Practice
            </div>
            <div className="flex items-center gap-4">
                {/* Timer Display */}
                {timeLeft !== null && (
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-md font-mono font-bold ${timeLeft < 300000 ? 'bg-destructive/10 text-destructive animate-pulse' : 'bg-primary/10 text-primary'}`}>
                        <Timer className="w-4 h-4" />
                        <span>{formatTime(timeLeft)}</span>
                    </div>
                )}
                {timeLeft === null && (
                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 text-muted-foreground px-3 py-1 rounded-md text-sm font-medium">
                        <span>Untimed Mode</span>
                    </div>
                )}
                <Link href="/tests">
                    <Button variant="ghost" size="sm">Exit</Button>
                </Link>
            </div>
        </header>
    );
}

export default function PracticeLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <PracticeProvider>
            <div className="min-h-screen bg-background text-foreground flex flex-col">
                <PracticeHeader />
                <main className="flex-1 overflow-hidden relative">
                    {children}
                </main>
            </div>
        </PracticeProvider>
    );
}
