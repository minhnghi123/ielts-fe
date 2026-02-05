"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Timer } from "lucide-react";
import Link from "next/link";
// Will implement these later
// import { ListeningTest } from "./_components/listening-test";
// import { ReadingTest } from "./_components/reading-test";

export default function PracticeLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            {/* Minimal Header */}
            <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between sticky top-0 z-50">
                <div className="font-bold text-lg flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">school</span>
                    IELTS Practice
                </div>
                <div className="flex items-center gap-4">
                    {/* Timer Placeholder */}
                    <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-md font-mono font-bold">
                        <Timer className="w-4 h-4" />
                        <span>29:59</span>
                    </div>
                    <Link href="/tests">
                        <Button variant="ghost" size="sm">Exit</Button>
                    </Link>
                </div>
            </header>
            <main className="flex-1 overflow-hidden relative">
                {children}
            </main>
        </div>
    );
}
