import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { useState } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface TestInstructionsProps {
    title: string;
    defaultDuration: number; // expected minutes (e.g. 60)
    questionCount: number;
    sectionCount: number;
    isStarting?: boolean;
    onStart: (duration: number | "full") => void;
}

export function TestInstructions({
    title,
    defaultDuration,
    questionCount,
    sectionCount,
    isStarting,
    onStart,
}: TestInstructionsProps) {
    const [selectedDuration, setSelectedDuration] = useState<string>("full");

    return (
        <div className="max-w-4xl mx-auto p-6 md:p-10 space-y-8">
            {/* Header with Candidate Info */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50 dark:bg-slate-900 p-6 rounded-xl border border-border">
                <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <span className="material-symbols-outlined text-[18px]">verified_user</span>
                        <span>Official Candidate Portal</span>
                    </div>
                    <h1 className="text-2xl font-bold">{title}</h1>
                </div>
                <div className="text-right hidden md:block">
                    <p className="font-bold">Candidate</p>
                    <p className="text-xs text-muted-foreground">Ready to practice</p>
                </div>
            </div>

            {/* Main Instructions Content */}
            <div className="flex flex-col gap-6">
                <div className="bg-yellow-50 dark:bg-yellow-900/10 text-yellow-800 dark:text-yellow-200 p-4 rounded-lg flex gap-3 items-start">
                    <span className="material-symbols-outlined mt-0.5">info</span>
                    <div>
                        <p className="font-bold">Please read the instructions carefully before starting.</p>
                        <p className="text-sm opacity-90">Once you begin, the timer will start automatically based on your choice.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Instruction Items */}
                    <InstructionCard
                        icon="checklist"
                        title="Answer all questions"
                        desc="There is no penalty for incorrect answers, so attempt every question. Marks are not deducted for wrong answers."
                    />
                    <InstructionCard
                        icon="history_edu"
                        title="Review and change answers"
                        desc="You can navigate back and forth between questions. You can change your answers at any time before the test ends."
                    />

                    {/* Test Details Card */}
                    <Card className="p-6 flex flex-col gap-4 bg-slate-50 dark:bg-slate-900/50 border-dashed">
                        <h3 className="font-bold flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">analytics</span>
                            Test Overview
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Sections</p>
                                <p className="text-lg font-black">{sectionCount}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Questions</p>
                                <p className="text-lg font-black">{questionCount}</p>
                            </div>
                        </div>
                    </Card>

                    {/* Timer Settings Card */}
                    <Card className="p-6 flex flex-col gap-4 border-primary/20 bg-primary/5">
                        <h3 className="font-bold flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">timer</span>
                            Practice Timer
                        </h3>
                        <div className="space-y-3">
                            <p className="text-sm text-muted-foreground">Choose your practice duration:</p>
                            <Select value={selectedDuration} onValueChange={setSelectedDuration}>
                                <SelectTrigger className="w-full bg-white dark:bg-slate-950">
                                    <SelectValue placeholder="Select duration" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="full">Full Test ({defaultDuration} min)</SelectItem>
                                    <SelectItem value="40">40 Minutes</SelectItem>
                                    <SelectItem value="20">20 Minutes</SelectItem>
                                    <SelectItem value="10">10 Minutes</SelectItem>
                                    <SelectItem value="5">5 Minutes (Quick)</SelectItem>
                                    <SelectItem value="1">1 Minute (Debug)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Start Button */}
            <div className="flex flex-col items-center gap-4 pt-8 border-t">
                <Button
                    onClick={() => onStart(selectedDuration === "full" ? "full" : parseInt(selectedDuration))}
                    disabled={isStarting}
                    size="lg"
                    className="px-16 py-8 text-xl font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                >
                    {isStarting ? (
                        <span className="flex items-center gap-2">
                            <span className="material-symbols-outlined animate-spin">refresh</span>
                            Starting...
                        </span>
                    ) : (
                        "START TEST NOW"
                    )}
                </Button>
                <p className="text-xs text-muted-foreground">By clicking start, you agree to the test conditions.</p>
            </div>

            <div className="text-center text-xs text-muted-foreground mt-8">
                © 2024 IELTS Online Testing. Professional Practice Portal.
            </div>
        </div>
    );
}

function InstructionCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
    return (
        <Card className="p-6 flex flex-col gap-3 hover:border-primary/50 transition-colors">
            <div className="h-10 w-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined">{icon}</span>
            </div>
            <h3 className="font-bold">{title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
        </Card>
    )
}
