import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, RotateCcw, Table2, Sparkles, Info } from "lucide-react";
import type { PartGrading } from "@/lib/types";

const PART_LABELS = [
    "Introduction & Interview",
    "Individual Long Turn",
    "Two-Way Discussion",
];

const CRITERIA: Array<{ key: "fluency" | "lexical" | "grammar" | "pronunciation"; label: string }> = [
    { key: "fluency", label: "Fluency & Coherence" },
    { key: "lexical", label: "Lexical Resource" },
    { key: "grammar", label: "Grammatical Range" },
    { key: "pronunciation", label: "Pronunciation" },
];

function bandColor(band: number): string {
    if (band >= 7) return "text-emerald-600 dark:text-emerald-400";
    if (band >= 5) return "text-amber-500";
    return "text-red-500";
}

function bandBg(band: number): string {
    if (band >= 7) return "bg-emerald-100 dark:bg-emerald-900/30";
    if (band >= 5) return "bg-amber-50 dark:bg-amber-900/20";
    return "bg-red-50 dark:bg-red-900/20";
}

function bandBarWidth(band: number): string {
    return `${Math.round((band / 9) * 100)}%`;
}

function bandBarColor(band: number): string {
    if (band >= 7) return "bg-emerald-500";
    if (band >= 5) return "bg-amber-400";
    return "bg-red-400";
}

function bandLabel(band: number): string {
    if (band >= 8.5) return "Expert";
    if (band >= 7.5) return "Very Good";
    if (band >= 6.5) return "Competent";
    if (band >= 5.5) return "Modest";
    if (band >= 4.5) return "Limited";
    return "Intermittent";
}

interface SpeakingResultProps {
    gradings: Array<PartGrading & { partNumber: number }> | null;
    bandScore: number;
    testTitle: string;
    testId: string;
}

export function SpeakingResult({ gradings, bandScore, testTitle, testId }: SpeakingResultProps) {
    const overallBand = gradings && gradings.length > 0
        ? Math.round((gradings.reduce((s, g) => s + g.overall, 0) / gradings.length) * 2) / 2
        : bandScore;

    return (
        <div className="h-full overflow-y-auto bg-slate-50 dark:bg-slate-950">

            {/* ── Sticky Header ──────────────────────────────────────────── */}
            <div className="bg-white dark:bg-slate-900 border-b border-border sticky top-0 z-20 shadow-sm">
                <div className="max-w-4xl mx-auto px-4 md:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                        <Mic className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        <span className="text-sm font-bold text-foreground hidden sm:block">Speaking Result:</span>
                        <span className="text-sm font-semibold text-primary truncate max-w-xs">{testTitle}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <Link href={`/practice/${testId}`}>
                            <Button size="sm" className="h-8 text-xs font-semibold gap-1.5">
                                <RotateCcw className="h-3.5 w-3.5" />
                                Retake
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 space-y-5">

                {/* ── Overall Band ──────────────────────────────────────── */}
                <Card className="bg-white dark:bg-slate-900 shadow-sm border overflow-hidden">
                    <CardContent className="p-5 flex items-center gap-6">
                        <div className="h-24 w-24 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex flex-col items-center justify-center flex-shrink-0 border border-blue-100 dark:border-blue-800/30">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-500 mb-1">Band</p>
                            <p className={`text-4xl font-black leading-none tabular-nums ${bandColor(overallBand)}`}>
                                {overallBand > 0 ? overallBand.toFixed(1) : "—"}
                            </p>
                        </div>
                        <div className="flex-1 min-w-0 space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                                <Mic className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                <span className="text-sm font-bold text-foreground">IELTS Speaking</span>
                                {overallBand > 0 && (
                                    <Badge variant="secondary" className="text-xs">
                                        {bandLabel(overallBand)}
                                    </Badge>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Overall band is the average of all three parts.
                            </p>
                            {gradings && gradings.length > 0 && (
                                <div className="flex gap-3 flex-wrap pt-1">
                                    {gradings.map(g => (
                                        <div key={g.partNumber} className={`px-2.5 py-1 rounded-lg text-xs font-bold ${bandBg(g.overall)} ${bandColor(g.overall)}`}>
                                            Part {g.partNumber}: {g.overall.toFixed(1)}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* ── No Gradings Fallback ──────────────────────────────── */}
                {!gradings && (
                    <Card className="bg-white dark:bg-slate-900 shadow-sm border">
                        <CardContent className="p-5 flex items-start gap-3">
                            <Info className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-semibold text-foreground">Detailed scores not available</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Per-part criteria scores are stored in the browser session where you completed the test. They are not available when reviewing from a different device or session.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* ── Per-Part Grading Cards ────────────────────────────── */}
                {gradings && gradings.map(g => (
                    <Card key={g.partNumber} className="bg-white dark:bg-slate-900 shadow-sm border overflow-hidden">
                        <CardContent className="p-0">
                            {/* Part header */}
                            <div className="px-5 pt-4 pb-3 border-b border-border flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-2">
                                    <div className="h-7 w-7 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-xs font-extrabold text-blue-600 dark:text-blue-400">
                                        {g.partNumber}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-foreground">Part {g.partNumber}</p>
                                        <p className="text-[11px] text-muted-foreground">{PART_LABELS[g.partNumber - 1]}</p>
                                    </div>
                                </div>
                                <div className={`px-3 py-1 rounded-lg text-sm font-black tabular-nums ${bandBg(g.overall)} ${bandColor(g.overall)}`}>
                                    {g.overall.toFixed(1)}
                                </div>
                            </div>

                            {/* Criteria bars */}
                            <div className="px-5 py-4 space-y-3">
                                {CRITERIA.map(({ key, label }) => {
                                    const val = g[key] as number;
                                    return (
                                        <div key={key}>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-semibold text-muted-foreground">{label}</span>
                                                <span className={`text-xs font-bold tabular-nums ${bandColor(val)}`}>{val.toFixed(1)}</span>
                                            </div>
                                            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all ${bandBarColor(val)}`}
                                                    style={{ width: bandBarWidth(val) }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Suggestions */}
                            {g.suggestions && g.suggestions.length > 0 && (
                                <div className="px-5 pb-4 space-y-2 border-t border-border pt-3">
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Examiner Feedback</p>
                                    {g.suggestions.map((s, i) => (
                                        <div key={i} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/40 text-xs space-y-1">
                                            <p className="font-bold text-primary capitalize">{s.criterion}</p>
                                            <p className="text-foreground/80">{s.feedback}</p>
                                            {s.improvement && (
                                                <p className="text-emerald-700 dark:text-emerald-400 font-medium">
                                                    💡 {s.improvement}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}

                {/* ── Footer Actions ───────────────────────────────────── */}
                <div className="flex flex-wrap justify-center gap-3 pt-2 pb-10">
                    <Link href="/tests">
                        <Button variant="outline" className="gap-2 font-semibold">
                            <Mic className="h-4 w-4" />
                            Other Tests
                        </Button>
                    </Link>
                    <Link href={`/practice/${testId}`}>
                        <Button className="gap-2 font-semibold">
                            <RotateCcw className="h-4 w-4" />
                            Retake This Test
                        </Button>
                    </Link>
                    <Link href="/profile">
                        <Button variant="outline" className="gap-2 font-semibold">
                            <Table2 className="h-4 w-4" />
                            View History
                        </Button>
                    </Link>
                    <Link href="/ai-advisor">
                        <Button variant="outline" className="gap-2 font-semibold border-violet-200 text-violet-700 hover:bg-violet-50">
                            <Sparkles className="h-4 w-4" />
                            AI Coach
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
