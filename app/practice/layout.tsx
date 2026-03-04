"use client";


import { Button } from "@/components/ui/button";
import { X, GraduationCap } from "lucide-react";
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
    const { testTitle } = usePractice();

    return (
        <header className="h-12 border-b border-border/60 bg-white dark:bg-slate-900 px-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
            {/* Left: Test title */}
            <div className="flex items-center gap-2 min-w-0">
                <GraduationCap className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="font-semibold text-sm text-foreground truncate max-w-sm">
                    {testTitle || "IELTS Practice"}
                </span>
            </div>

            {/* Right: Exit */}
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex-shrink-0 h-8 px-3 text-xs font-semibold">
                        <X className="h-3.5 w-3.5" />
                        Thoát
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
