"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, CheckCircle2, XCircle, Clock, Target, RotateCcw, Home, BarChart2, Lightbulb } from "lucide-react";

import { useEffect, useState, use } from "react";
import { useSearchParams } from "next/navigation";
import { testsApi } from "@/lib/api/tests";
import type { TestAttempt } from "@/lib/types";

function getBandColor(score: number) {
    if (score >= 8) return "text-emerald-600";
    if (score >= 7) return "text-blue-600";
    if (score >= 6) return "text-amber-600";
    return "text-red-500";
}

function getBandLabel(score: number) {
    if (score >= 8.5) return "Expert";
    if (score >= 7.5) return "Very Good";
    if (score >= 6.5) return "Competent";
    if (score >= 5.5) return "Modest";
    return "Limited";
}

function getBandBg(score: number) {
    if (score >= 8) return "from-emerald-400 to-teal-500";
    if (score >= 7) return "from-blue-400 to-indigo-500";
    if (score >= 6) return "from-amber-400 to-orange-500";
    return "from-red-400 to-rose-500";
}

export default function TestResultPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const searchParams = useSearchParams();
    const attemptId = searchParams.get("attemptId");

    const [attempt, setAttempt] = useState<TestAttempt | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!attemptId) {
            setIsLoading(false);
            return;
        }
        testsApi.getAttemptById(attemptId)
            .then(data => { setAttempt(data); setIsLoading(false); })
            .catch(err => { console.error("Failed to load attempt", err); setIsLoading(false); });
    }, [attemptId]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <div className="h-16 w-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                <p className="text-muted-foreground font-medium">Calculating your score...</p>
            </div>
        );
    }

    if (!attempt) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <span className="material-symbols-outlined text-5xl text-muted-foreground">search_off</span>
                <p className="text-muted-foreground">Attempt not found.</p>
                <Link href="/tests"><Button variant="outline">Back to Tests</Button></Link>
            </div>
        );
    }

    const correctAnswersCount = attempt.questionAttempts?.filter((q) => q.isCorrect).length || 0;
    const totalQuestionsCount = attempt.questionAttempts?.length || 0;
    const accuracy = totalQuestionsCount > 0 ? Math.round((correctAnswersCount / totalQuestionsCount) * 100) : 0;
    const bandScore = attempt.bandScore || 0;

    let timeTaken = "N/A";
    if (attempt.startedAt && attempt.submittedAt) {
        const diffMs = new Date(attempt.submittedAt).getTime() - new Date(attempt.startedAt).getTime();
        const totalSecs = Math.floor(diffMs / 1000);
        const m = Math.floor(totalSecs / 60);
        const s = totalSecs % 60;
        timeTaken = `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }

    const testTitle = attempt.test?.title || "IELTS Practice Test";
    const testDate = new Date(attempt.startedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

    const TIPS: Record<number, { tip: string; icon: string }> = {
        0: { tip: "Keep practicing! Focus on understanding question types.", icon: "📘" },
        1: { tip: "Good start! Practice reading passages for better scanning speed.", icon: "📖" },
        2: { tip: "Well done! Try timed practice to improve efficiency.", icon: "⏱️" },
    };
    const tipKey = accuracy >= 70 ? 2 : accuracy >= 40 ? 1 : 0;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            {/* Hero */}
            <div className={`bg-gradient-to-br ${getBandBg(bandScore)} text-white px-6 py-14 text-center relative overflow-hidden`}>
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute -top-20 -right-20 h-80 w-80 rounded-full bg-white" />
                    <div className="absolute -bottom-10 -left-10 h-60 w-60 rounded-full bg-white" />
                </div>
                <div className="relative z-10 space-y-2">
                    <div className="flex items-center justify-center gap-2 mb-4 text-white/80">
                        <Trophy className="h-5 w-5 text-yellow-200" />
                        <span className="font-semibold">Test Completed!</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black line-clamp-2">{testTitle}</h1>
                    <p className="text-white/70 text-sm">{testDate} — {timeTaken} elapsed</p>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 md:px-10 pb-16 -mt-10 space-y-8">
                {/* Score Cards Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Band Score */}
                    <Card className="relative overflow-hidden border-none shadow-xl bg-white dark:bg-slate-900 md:col-span-1 flex flex-col items-center justify-center py-10">
                        <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${getBandBg(bandScore)}`} />
                        <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-2">Band Score</p>
                        <p className={`text-8xl font-black leading-none ${getBandColor(bandScore)}`}>
                            {bandScore > 0 ? bandScore.toFixed(1) : "–"}
                        </p>
                        {bandScore > 0 && (
                            <Badge className={`mt-4 px-4 py-1 text-sm border-none bg-gradient-to-r ${getBandBg(bandScore)} text-white`}>
                                {getBandLabel(bandScore)}
                            </Badge>
                        )}
                    </Card>

                    {/* Stats Grid */}
                    <div className="md:col-span-2 grid grid-cols-2 gap-4">
                        {[
                            {
                                label: "Correct Answers",
                                value: totalQuestionsCount > 0 ? `${correctAnswersCount}/${totalQuestionsCount}` : "–",
                                icon: CheckCircle2,
                                color: "text-emerald-600",
                                bg: "bg-emerald-50 dark:bg-emerald-900/20",
                            },
                            {
                                label: "Accuracy",
                                value: totalQuestionsCount > 0 ? `${accuracy}%` : "–",
                                icon: Target,
                                color: "text-blue-600",
                                bg: "bg-blue-50 dark:bg-blue-900/20",
                            },
                            {
                                label: "Time Taken",
                                value: timeTaken,
                                icon: Clock,
                                color: "text-amber-600",
                                bg: "bg-amber-50 dark:bg-amber-900/20",
                            },
                            {
                                label: "Wrong Answers",
                                value: totalQuestionsCount > 0 ? `${totalQuestionsCount - correctAnswersCount}` : "–",
                                icon: XCircle,
                                color: "text-red-500",
                                bg: "bg-red-50 dark:bg-red-900/20",
                            },
                        ].map((stat) => (
                            <Card key={stat.label} className="bg-white dark:bg-slate-900 border shadow-sm">
                                <CardContent className="p-5 flex items-center gap-3">
                                    <div className={`h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0 ${stat.bg}`}>
                                        <stat.icon className={`h-5 w-5 ${stat.color}`} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-0.5">{stat.label}</p>
                                        <p className="text-xl font-black">{stat.value}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Accuracy Progress */}
                {totalQuestionsCount > 0 && (
                    <Card className="bg-white dark:bg-slate-900 shadow-sm">
                        <CardContent className="p-6 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <BarChart2 className="h-5 w-5 text-primary" />
                                    <h2 className="font-bold">Accuracy Progress</h2>
                                </div>
                                <span className="text-sm font-semibold text-muted-foreground">{accuracy}%</span>
                            </div>
                            <Progress value={accuracy} className="h-3 rounded-full" />
                            <p className="text-sm text-muted-foreground">
                                You answered {correctAnswersCount} out of {totalQuestionsCount} questions correctly.
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Quick Tip */}
                <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border-amber-200 dark:border-amber-800/30 shadow-sm">
                    <CardContent className="p-6 flex items-start gap-4">
                        <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                            <Lightbulb className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                            <h2 className="font-bold text-amber-800 dark:text-amber-200">Tip for You</h2>
                            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                                {TIPS[tipKey].icon} {TIPS[tipKey].tip}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Answer Review Table */}
                {attempt.questionAttempts && attempt.questionAttempts.length > 0 && (
                    <Card className="bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                        <CardContent className="p-0">
                            <div className="p-6 pb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">fact_check</span>
                                <h2 className="font-bold text-lg">Answer Review</h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-800 text-muted-foreground text-xs uppercase tracking-wide">
                                        <tr>
                                            <th className="text-left p-3 font-semibold w-12">#</th>
                                            <th className="text-left p-3 font-semibold">Your Answer</th>
                                            <th className="text-center p-3 font-semibold w-20">Result</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {attempt.questionAttempts.map((q, idx) => (
                                            <tr
                                                key={q.id}
                                                className={`transition-colors ${q.isCorrect ? "hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10" : "bg-red-50/40 dark:bg-red-900/5 hover:bg-red-50 dark:hover:bg-red-900/10"}`}
                                            >
                                                <td className="p-3 font-mono text-muted-foreground font-bold">{idx + 1}</td>
                                                <td className={`p-3 font-medium ${q.isCorrect ? "text-emerald-700 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
                                                    {q.answer || <span className="italic text-muted-foreground">(blank)</span>}
                                                </td>
                                                <td className="p-3 text-center">
                                                    {q.isCorrect ? (
                                                        <CheckCircle2 className="h-5 w-5 text-emerald-500 mx-auto" />
                                                    ) : (
                                                        <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4">
                    <Link href="/dashboard">
                        <Button variant="outline" size="lg" className="h-12 px-8 w-full sm:w-auto gap-2">
                            <Home className="h-4 w-4" />
                            Dashboard
                        </Button>
                    </Link>
                    <Link href={`/practice/${id}`}>
                        <Button size="lg" className="h-12 px-8 w-full sm:w-auto gap-2">
                            <RotateCcw className="h-4 w-4" />
                            Retake Test
                        </Button>
                    </Link>
                    <Link href="/tests">
                        <Button size="lg" variant="outline" className="h-12 px-8 w-full sm:w-auto gap-2 border-primary/50 text-primary hover:bg-primary hover:text-white">
                            <BarChart2 className="h-4 w-4" />
                            More Tests
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
