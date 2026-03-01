"use client";


import { Button } from "@/components/ui/button";
import { Timer, X, GraduationCap } from "lucide-react";
import Link from "next/link";
import { PracticeProvider, usePractice } from "./[id]/practice-context";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

function PracticeHeader() {
    const { timeLeft } = usePractice();

    const formatTime = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    };

    const isUrgent = timeLeft !== null && timeLeft < 300000; // < 5 min
    const isWarning = timeLeft !== null && timeLeft < 600000 && timeLeft >= 300000; // 5-10 min

    return (
        <header className="h-16 border-b border-border/60 bg-card/95 backdrop-blur-sm px-5 flex items-center justify-between sticky top-0 z-50 shadow-sm">
            {/* Brand */}
            <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <GraduationCap className="h-4 w-4 text-primary" />
                </div>
                <span className="font-bold text-base hidden sm:block">IELTS Master</span>
                <span className="font-bold text-base sm:hidden">IELTS</span>
                <span className="hidden sm:block text-muted-foreground text-sm">— Practice Mode</span>
            </div>

            {/* Center: Timer */}
            <div className="flex items-center">
                {timeLeft !== null ? (
                    <div className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-sm font-mono font-bold transition-all duration-500 ${isUrgent
                        ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 animate-pulse shadow-inner shadow-red-100"
                        : isWarning
                            ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                            : "bg-primary/10 text-primary"
                        }`}>
                        <Timer className={`w-4 h-4 ${isUrgent ? "animate-bounce" : ""}`} />
                        <span className="text-base tabular-nums">{formatTime(timeLeft)}</span>
                        {isUrgent && <span className="text-xs font-semibold">(Hurry!)</span>}
                    </div>
                ) : (
                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 text-muted-foreground px-4 py-1.5 rounded-xl text-sm font-medium">
                        <Timer className="w-4 h-4" />
                        <span>Untimed</span>
                    </div>
                )}
            </div>

            {/* Right: Exit */}
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                        <X className="h-4 w-4" />
                        <span className="hidden sm:inline">Exit</span>
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Exit test?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Your progress will be lost and the attempt will not be submitted. Are you sure you want to leave?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Continue Test</AlertDialogCancel>
                        <AlertDialogAction asChild>
                            <Link href="/tests">
                                <Button variant="destructive" className="w-full">Exit Test</Button>
                            </Link>
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
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
