"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// --- Mock Data ---
const mockResult = {
    testTitle: "IELTS Academic Reading",
    testDate: "22 Feb 2026",
    timeTaken: "52:38",
    bandScore: 7.5,
    correctAnswers: 33,
    totalQuestions: 40,
    sections: [
        { name: "Matching Headings", correct: 10, total: 12, icon: "swap_horiz" },
        { name: "True / False / Not Given", correct: 13, total: 16, icon: "rule" },
        { name: "Multiple Choice", correct: 10, total: 12, icon: "list" },
    ],
    questions: [
        { id: 1, section: "MH", user: "iii", correct: "iii", isCorrect: true },
        { id: 2, section: "MH", user: "i", correct: "i", isCorrect: true },
        { id: 3, section: "MH", user: "vi", correct: "iv", isCorrect: false },
        { id: 4, section: "TF", user: "TRUE", correct: "FALSE", isCorrect: false },
        { id: 5, section: "TF", user: "FALSE", correct: "FALSE", isCorrect: true },
        { id: 6, section: "TF", user: "NOT GIVEN", correct: "NOT GIVEN", isCorrect: true },
        { id: 7, section: "MC", user: "B", correct: "B", isCorrect: true },
        { id: 8, section: "MC", user: "A", correct: "C", isCorrect: false },
    ],
};

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

export default function TestResultPage({ params }: { params: { id: string } }) {
    const result = mockResult;
    const accuracy = Math.round((result.correctAnswers / result.totalQuestions) * 100);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 overflow-y-auto">
            {/* Hero Banner */}
            <div className="bg-gradient-to-r from-primary to-blue-700 text-white px-6 py-12 text-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute -top-20 -right-20 h-96 w-96 rounded-full bg-white" />
                    <div className="absolute -bottom-10 -left-10 h-64 w-64 rounded-full bg-white" />
                </div>
                <div className="relative z-10 space-y-2">
                    <div className="flex items-center justify-center gap-2 text-blue-200 mb-4">
                        <span className="material-symbols-outlined">emoji_events</span>
                        <span className="font-medium">Test Completed!</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black">{result.testTitle}</h1>
                    <p className="text-blue-200 text-sm">{result.testDate} — {result.timeTaken} taken</p>
                </div>
            </div>

            <div className="max-w-5xl mx-auto p-6 md:p-10 space-y-10 -mt-8">

                {/* Score Cards Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Band Score Card */}
                    <Card className="relative overflow-hidden border-none shadow-xl bg-white dark:bg-slate-900 md:col-span-1 flex flex-col items-center justify-center py-10">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-blue-400" />
                        <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider mb-2">Overall Band Score</p>
                        <p className={`text-8xl font-black ${getBandColor(result.bandScore)}`}>
                            {result.bandScore}
                        </p>
                        <Badge className="mt-4 px-4 py-1 text-sm bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-100">
                            {getBandLabel(result.bandScore)}
                        </Badge>
                    </Card>

                    {/* Stats Grid */}
                    <div className="md:col-span-2 grid grid-cols-2 gap-4">
                        {[
                            { label: "Correct Answers", value: `${result.correctAnswers}/${result.totalQuestions}`, icon: "check_circle", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20" },
                            { label: "Accuracy", value: `${accuracy}%`, icon: "my_location", color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20" },
                            { label: "Time Taken", value: result.timeTaken, icon: "timer", color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20" },
                            { label: "Wrong Answers", value: `${result.totalQuestions - result.correctAnswers}`, icon: "cancel", color: "text-red-500 bg-red-50 dark:bg-red-900/20" },
                        ].map((stat) => (
                            <Card key={stat.label} className="bg-white dark:bg-slate-900 border shadow-sm">
                                <CardContent className="p-5 flex items-center gap-4">
                                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                                        <span className="material-symbols-outlined">{stat.icon}</span>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                                        <p className="text-2xl font-bold">{stat.value}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Section Breakdown */}
                <Card className="bg-white dark:bg-slate-900 shadow-sm">
                    <CardContent className="p-6 space-y-6">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">bar_chart</span>
                            Section Breakdown
                        </h2>
                        <div className="space-y-6">
                            {result.sections.map((sec) => {
                                const pct = Math.round((sec.correct / sec.total) * 100);
                                const isGood = pct >= 70;
                                return (
                                    <div key={sec.name} className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-muted-foreground text-[20px]">{sec.icon}</span>
                                                <span className="font-medium">{sec.name}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm text-muted-foreground">{sec.correct}/{sec.total}</span>
                                                <span className={`text-sm font-bold ${isGood ? "text-emerald-600" : "text-orange-500"}`}>{pct}%</span>
                                            </div>
                                        </div>
                                        <Progress value={pct} className="h-2" />
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Recommendations */}
                <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border-amber-200 dark:border-amber-800/30 shadow-sm">
                    <CardContent className="p-6 space-y-4">
                        <h2 className="text-xl font-bold flex items-center gap-2 text-amber-800 dark:text-amber-200">
                            <span className="material-symbols-outlined">lightbulb</span>
                            AI Recommendations
                        </h2>
                        <ul className="space-y-3">
                            {[
                                { tip: "Review Matching Headings strategies — you struggled with identifying paragraph themes.", icon: "priority_high" },
                                { tip: "Practice T/F/NG question type with focus on 'Not Given' — it's about what the text does NOT say.", icon: "menu_book" },
                                { tip: "Your timing was excellent! Keep maintaining pace for test day.", icon: "timer" },
                            ].map((rec, i) => (
                                <li key={i} className="flex items-start gap-3 text-amber-900 dark:text-amber-100">
                                    <span className="material-symbols-outlined text-amber-600 mt-0.5 text-[20px]">{rec.icon}</span>
                                    <span className="text-sm">{rec.tip}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>

                {/* Answer Review Table */}
                <Card className="bg-white dark:bg-slate-900 shadow-sm">
                    <CardContent className="p-6 space-y-4">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">fact_check</span>
                            Answer Review
                        </h2>
                        <div className="rounded-xl border overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-800 text-muted-foreground">
                                    <tr>
                                        <th className="text-left p-3 font-medium w-12">#</th>
                                        <th className="text-left p-3 font-medium">Section</th>
                                        <th className="text-left p-3 font-medium">Your Answer</th>
                                        <th className="text-left p-3 font-medium">Correct Answer</th>
                                        <th className="text-center p-3 font-medium w-16">Result</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {result.questions.map((q) => (
                                        <tr key={q.id} className={`${q.isCorrect ? "" : "bg-red-50/50 dark:bg-red-900/10"}`}>
                                            <td className="p-3 font-mono font-bold text-muted-foreground">{q.id}</td>
                                            <td className="p-3">
                                                <Badge variant="outline" className="text-xs">{q.section}</Badge>
                                            </td>
                                            <td className={`p-3 font-medium ${q.isCorrect ? "text-emerald-600" : "text-red-500 line-through"}`}>
                                                {q.user}
                                            </td>
                                            <td className="p-3 font-medium text-foreground">{q.correct}</td>
                                            <td className="p-3 text-center">
                                                {q.isCorrect ? (
                                                    <span className="material-symbols-outlined text-emerald-500 text-[20px]">check_circle</span>
                                                ) : (
                                                    <span className="material-symbols-outlined text-red-500 text-[20px]">cancel</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row justify-center gap-4 pb-10">
                    <Link href="/dashboard">
                        <Button variant="outline" size="lg" className="h-12 px-8 w-full sm:w-auto">
                            <span className="material-symbols-outlined mr-2 text-[20px]">home</span>
                            Back to Dashboard
                        </Button>
                    </Link>
                    <Link href={`/practice/${params.id}`}>
                        <Button size="lg" className="h-12 px-8 w-full sm:w-auto">
                            <span className="material-symbols-outlined mr-2 text-[20px]">replay</span>
                            Retake Test
                        </Button>
                    </Link>
                    <Link href="/analysis">
                        <Button size="lg" variant="outline" className="h-12 px-8 w-full sm:w-auto border-primary text-primary hover:bg-primary hover:text-white">
                            <span className="material-symbols-outlined mr-2 text-[20px]">analytics</span>
                            Detailed Analysis
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
