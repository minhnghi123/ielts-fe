import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TestInstructionsProps {
    title: string;
    duration: string;
    questionCount: number;
    onStart: () => void;
}

export function TestInstructions({
    title,
    duration,
    questionCount,
    onStart,
}: TestInstructionsProps) {
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
                    <p className="font-bold">Sarah Jenkins</p>
                    <p className="text-xs text-muted-foreground">ID: 849201-UK</p>
                </div>
            </div>

            {/* Main Instructions Content */}
            <div className="flex flex-col gap-6">
                <div className="bg-yellow-50 dark:bg-yellow-900/10 text-yellow-800 dark:text-yellow-200 p-4 rounded-lg flex gap-3 items-start">
                    <span className="material-symbols-outlined mt-0.5">info</span>
                    <div>
                        <p className="font-bold">Please read the instructions carefully before starting.</p>
                        <p className="text-sm opacity-90">Once you begin, the timer will start automatically.</p>
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
                    <InstructionCard
                        icon="dashboard"
                        title="Various Question Types"
                        desc="Prepare for Multiple Choice, Matching Headings, True/False/Not Given, and Sentence Completion tasks."
                    />
                    <div className="flex flex-col justify-center gap-2 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed text-center">
                        <p className="text-sm font-medium text-muted-foreground">Test Details</p>
                        <div className="flex justify-center gap-4 text-sm font-bold">
                            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">timer</span> {duration}</span>
                            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">list_alt</span> {questionCount} Questions</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Start Button */}
            <div className="flex justify-center pt-8 border-t">
                <Button onClick={onStart} size="lg" className="px-12 py-6 text-lg font-bold rounded-full shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
                    Start Test Now
                </Button>
            </div>

            <div className="text-center text-xs text-muted-foreground mt-8">
                © 2024 IELTS Online Testing. All rights reserved.
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
