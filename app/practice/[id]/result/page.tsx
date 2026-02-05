"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function TestResultPage({ params }: { params: { id: string } }) {
    // Mock Result Data
    const result = {
        score: 8.5,
        correct: 38,
        total: 40,
        timeTaken: "28:15",
        questions: [
            { id: 1, user: "John", correct: "John", isCorrect: true },
            { id: 2, user: "0778123456", correct: "0778123456", isCorrect: true },
            { id: 3, user: "A", correct: "A", isCorrect: true },
            // ... more
        ]
    };

    return (
        <div className="max-w-[1000px] mx-auto p-6 space-y-8">
            <div className="text-center space-y-4">
                <h1 className="text-3xl font-bold">Test Completed!</h1>
                <p className="text-muted-foreground">Great job! Here is your performance analysis.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Overall Score */}
                <Card className="md:col-span-1 bg-primary text-primary-foreground border-none">
                    <CardContent className="flex flex-col items-center justify-center py-10 space-y-4">
                        <span className="text-lg font-medium opacity-90">Overall Band</span>
                        <span className="text-6xl font-black">{result.score}</span>
                        <div className="flex gap-4 text-sm opacity-90">
                            <span>{result.correct}/{result.total} Correct</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Detailed Stats</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <div className="text-sm text-muted-foreground">Time Taken</div>
                            <div className="text-2xl font-bold">{result.timeTaken}</div>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <div className="text-sm text-muted-foreground">Accuracy</div>
                            <div className="text-2xl font-bold">{Math.round((result.correct / result.total) * 100)}%</div>
                        </div>
                        {/* More stats could go here */}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Answer Review</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {result.questions.map((q) => (
                            <div key={q.id} className="flex items-center justify-between p-3 border-b last:border-0">
                                <span className="font-mono font-bold w-10">{q.id}.</span>
                                <div className="flex-1 grid grid-cols-2 gap-4">
                                    <div className={q.isCorrect ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                                        Your: {q.user}
                                    </div>
                                    <div className="text-slate-500">
                                        Correct: {q.correct}
                                    </div>
                                </div>
                                <div>
                                    {q.isCorrect ? (
                                        <span className="material-symbols-outlined text-green-500">check_circle</span>
                                    ) : (
                                        <span className="material-symbols-outlined text-red-500">cancel</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-center gap-4">
                <Link href="/tests">
                    <Button variant="outline" size="lg">Back to Library</Button>
                </Link>
                <Link href={`/practice/${params.id}`}>
                    <Button size="lg">Retake Test</Button>
                </Link>
            </div>
        </div>
    );
}
