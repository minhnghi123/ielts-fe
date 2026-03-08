"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    CheckCircle2, XCircle, Clock, SkipForward,
    RotateCcw, ChevronRight, AlertCircle, ListChecks,
    FileText, Table2, Headphones, BookOpen, Sparkles, RefreshCw,
} from "lucide-react";

import { useEffect, useState, use, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { testsApi } from "@/lib/api/tests";
import type { TestAttempt, Test, Section, QuestionAttempt } from "@/lib/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Normalise any date value to a UTC millisecond timestamp.
 * TypeORM may serialise `timestamp` (no-tz) columns *without* a trailing Z,
 * so browsers interpret them as local time and produce an offset equal to
 * the local UTC offset (e.g. +7 hours in Vietnam).  Appending Z forces UTC.
 */
function toUtcMs(d: string | Date | null | undefined): number | null {
    if (!d) return null;
    const str = String(d);
    const utc = /Z$|[+-]\d{2}:?\d{2}$/.test(str) ? str : str + "Z";
    const ms = new Date(utc).getTime();
    return isNaN(ms) ? null : ms;
}

/** Readable label for question type */
function qtypeLabel(qt: string, skill: string): string {
    const prefix = skill === "listening" ? "[Listening]" : "[Reading]";
    const map: Record<string, string> = {
        fill_in_blank: "Note/Form Completion",
        multiple_choice: "Multiple Choice",
        true_false: "True / False / Not Given",
        true_false_not_given: "True / False / Not Given",
        yes_no_not_given: "Yes / No / Not Given",
        matching: "Matching",
        matching_heading: "Matching Headings",
        matching_features: "Matching Features",
        sentence_ending: "Sentence Endings",
        short_answer: "Short Answer",
    };
    return `${prefix} ${map[qt] ?? qt}`;
}

/** Parse correctAnswers from the question — handles both plain strings and JSON strings */
function parseCorrectAnswers(raw: any): string[] {
    if (!raw) return [];
    if (Array.isArray(raw)) {
        return raw.map(item => {
            if (typeof item === "object" && item !== null) return String(item.value ?? item);
            return String(item);
        });
    }
    if (typeof raw === "string") {
        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) return parsed.map(String);
        } catch { /* ignore */ }
        return [raw];
    }
    return [];
}

// ─── Enriched QA type ─────────────────────────────────────────────────────────

interface QAEnriched extends QuestionAttempt {
    globalOrder: number;   // 1-based absolute question number
    sectionIdx: number;    // which section (0-based), -1 if unknown
    correctAnswers: string[];
    questionType: string;
}

/** Build the enriched QA list by merging attempt data with full test structure */
function buildEnrichedQAs(
    attempt: TestAttempt,
    fullTest: Test | null,
): QAEnriched[] {
    const allQAs = attempt.questionAttempts ?? [];
    const sections: Section[] = fullTest?.sections ?? [];

    // Map: questionId → { sectionIdx, globalOrder }
    const positionMap = new Map<string, { sectionIdx: number; globalOrder: number }>();
    let globalCounter = 0;
    sections.forEach((sec, si) => {
        (sec.questionGroups ?? []).forEach(g => {
            (g.questions ?? []).forEach(q => {
                globalCounter++;
                positionMap.set(q.id, { sectionIdx: si, globalOrder: globalCounter });
            });
        });
    });

    return allQAs
        .map(qa => {
            const pos = positionMap.get(qa.questionId);
            const correctAnswers = parseCorrectAnswers(qa.question?.answer?.correctAnswers);
            return {
                ...qa,
                globalOrder: pos?.globalOrder ?? 0,
                sectionIdx: pos?.sectionIdx ?? -1,
                correctAnswers,
                questionType: qa.question?.questionType ?? "fill_in_blank",
            };
        })
        .sort((a, b) => a.globalOrder - b.globalOrder);
}

// ─── Analysis Table ───────────────────────────────────────────────────────────

interface TypeStat {
    correct: number;
    wrong: number;
    skipped: number;
    ids: number[];
}

function buildTypeStats(qas: QAEnriched[], skill: string): Record<string, TypeStat> {
    const byType: Record<string, TypeStat> = {};
    qas.forEach(qa => {
        const label = qtypeLabel(qa.questionType, skill);
        if (!byType[label]) byType[label] = { correct: 0, wrong: 0, skipped: 0, ids: [] };
        byType[label].ids.push(qa.globalOrder || (byType[label].ids.length + 1));
        if (!qa.answer?.trim()) byType[label].skipped++;
        else if (qa.isCorrect) byType[label].correct++;
        else byType[label].wrong++;
    });
    return byType;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function AnalysisTable({
    qas,
    skill,
}: {
    qas: QAEnriched[];
    skill: string;
}) {
    const byType = buildTypeStats(qas, skill);
    const totalC = qas.filter(q => q.isCorrect === true).length;
    const totalW = qas.filter(q => q.isCorrect !== true && !!q.answer?.trim()).length;
    const totalS = qas.filter(q => !q.answer?.trim()).length;
    const totalAcc = qas.length > 0
        ? ((totalC / qas.length) * 100).toFixed(1) + "%"
        : "—";

    if (Object.keys(byType).length === 0) {
        return <p className="px-5 py-8 text-center text-sm text-muted-foreground">No analysis data available.</p>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800 text-[11px] text-muted-foreground uppercase tracking-wide">
                    <tr>
                        <th className="text-left px-4 py-2.5 font-semibold">Question Type</th>
                        <th className="text-center px-3 py-2.5 font-semibold text-emerald-600">Correct</th>
                        <th className="text-center px-3 py-2.5 font-semibold text-red-500">Incorrect</th>
                        <th className="text-center px-3 py-2.5 font-semibold text-slate-400">Skipped</th>
                        <th className="text-center px-3 py-2.5 font-semibold">Accuracy</th>
                        <th className="text-left px-3 py-2.5 font-semibold min-w-[140px]">Questions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {Object.entries(byType).map(([label, stats]) => {
                        const total = stats.correct + stats.wrong + stats.skipped;
                        const acc = total > 0 ? ((stats.correct / total) * 100).toFixed(1) + "%" : "—";
                        return (
                            <tr key={label} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                                <td className="px-4 py-3 text-xs font-medium">{label}</td>
                                <td className="px-3 py-3 text-center font-bold text-emerald-600">{stats.correct}</td>
                                <td className="px-3 py-3 text-center font-bold text-red-500">{stats.wrong}</td>
                                <td className="px-3 py-3 text-center font-bold text-slate-400">{stats.skipped}</td>
                                <td className="px-3 py-3 text-center text-xs font-semibold">{acc}</td>
                                <td className="px-3 py-3">
                                    <div className="flex flex-wrap gap-1">
                                        {stats.ids.map(n => {
                                            const qa = qas.find(q => (q.globalOrder || 0) === n);
                                            const isCorrect = qa?.isCorrect;
                                            const hasAnswer = !!qa?.answer?.trim();
                                            return (
                                                <span
                                                    key={n}
                                                    className={`inline-flex items-center justify-center w-6 h-6 rounded text-[10px] font-bold ${
                                                        isCorrect
                                                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                                                            : hasAnswer
                                                                ? "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400"
                                                                : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                                                    }`}
                                                >
                                                    {n}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                    {/* Total row */}
                    <tr className="bg-slate-50 dark:bg-slate-800/60 text-xs font-bold border-t-2 border-border">
                        <td className="px-4 py-3">Total</td>
                        <td className="px-3 py-3 text-center text-emerald-600">{totalC}</td>
                        <td className="px-3 py-3 text-center text-red-500">{totalW}</td>
                        <td className="px-3 py-3 text-center text-slate-400">{totalS}</td>
                        <td className="px-3 py-3 text-center">{totalAcc}</td>
                        <td />
                    </tr>
                </tbody>
            </table>
        </div>
    );
}

function AnswerList({ qas }: { qas: QAEnriched[] }) {
    if (qas.length === 0) {
        return <p className="px-5 py-8 text-center text-sm text-muted-foreground">No answers recorded.</p>;
    }

    return (
        <div className="px-4 pt-2 pb-4 space-y-1.5">
            {qas.map((qa, idx) => {
                const isCorrect = qa.isCorrect === true;
                const isSkipped = !qa.answer?.trim();
                const displayNum = qa.globalOrder || idx + 1;
                const correctDisplay = qa.correctAnswers[0] ?? "—";

                return (
                    <div
                        key={qa.id}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm border transition-colors ${
                            isCorrect
                                ? "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/20"
                                : isSkipped
                                    ? "bg-slate-50 dark:bg-slate-800/20 border-slate-100 dark:border-slate-700/30"
                                    : "bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-800/20"
                        }`}
                    >
                        {/* Number badge */}
                        <span className={`flex-shrink-0 w-6 h-6 rounded flex items-center justify-center text-[10px] font-extrabold ${
                            isCorrect
                                ? "bg-emerald-200 text-emerald-700 dark:bg-emerald-800 dark:text-emerald-200"
                                : isSkipped
                                    ? "bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                                    : "bg-red-200 text-red-600 dark:bg-red-800 dark:text-red-200"
                        }`}>
                            {displayNum}
                        </span>

                        {/* Answers */}
                        <div className="flex-1 min-w-0 flex flex-wrap items-center gap-2">
                            {isSkipped ? (
                                <span className="italic text-[11px] text-muted-foreground">not answered</span>
                            ) : (
                                <span className={`font-mono text-xs ${
                                    isCorrect
                                        ? "font-bold text-emerald-700 dark:text-emerald-300"
                                        : "line-through text-red-400"
                                }`}>
                                    {qa.answer}
                                </span>
                            )}
                            {!isCorrect && qa.correctAnswers.length > 0 && (
                                <>
                                    <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                    <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-300">
                                        {correctDisplay}
                                    </span>
                                    {qa.correctAnswers.length > 1 && (
                                        <span className="text-[10px] text-muted-foreground">
                                            (+{qa.correctAnswers.length - 1} more)
                                        </span>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Status icon */}
                        <div className="flex-shrink-0">
                            {isCorrect
                                ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                : isSkipped
                                    ? <SkipForward className="h-4 w-4 text-slate-400" />
                                    : <XCircle className="h-4 w-4 text-red-500" />
                            }
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

// ─── AI Feedback Panel ────────────────────────────────────────────────────────

function AiFeedbackPanel({
    feedback,
    loading,
    onRetry,
}: {
    feedback: string | null;
    loading: boolean;
    onRetry: () => void;
}) {
    // Render simple markdown: ## headings, **bold**, - bullets
    function renderMd(text: string) {
        return text.split('\n').map((line, i) => {
            if (/^## /.test(line)) {
                return <h3 key={i} className="font-bold text-sm mt-4 mb-1 text-foreground">{line.slice(3)}</h3>;
            }
            if (/^\*\*.*\*\*$/.test(line.trim())) {
                return <p key={i} className="font-semibold text-sm text-foreground mt-2">{line.replace(/\*\*/g, '')}</p>;
            }
            if (/^- /.test(line)) {
                const content = line.slice(2).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
                return (
                    <li
                        key={i}
                        className="text-sm text-foreground/90 ml-3 list-disc"
                        dangerouslySetInnerHTML={{ __html: content }}
                    />
                );
            }
            if (line.trim() === '') return <br key={i} />;
            const content = line.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
            return <p key={i} className="text-sm text-foreground/90" dangerouslySetInnerHTML={{ __html: content }} />;
        });
    }

    return (
        <Card className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border-violet-200 dark:border-violet-800/40 shadow-sm overflow-hidden">
            <CardContent className="p-0">
                <div className="px-5 pt-4 pb-3 border-b border-violet-200/60 dark:border-violet-800/30 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                            <Sparkles className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                        </div>
                        <h2 className="font-bold text-sm text-violet-900 dark:text-violet-200">AI Coaching Feedback</h2>
                        <Badge variant="secondary" className="text-[10px] bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 border-none">
                            Powered by Groq
                        </Badge>
                    </div>
                    {!loading && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs gap-1 text-violet-600 hover:text-violet-700 hover:bg-violet-100"
                            onClick={onRetry}
                        >
                            <RefreshCw className="h-3 w-3" /> Regenerate
                        </Button>
                    )}
                </div>

                <div className="px-5 py-4">
                    {loading ? (
                        <div className="space-y-2.5">
                            <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 text-sm font-medium mb-3">
                                <div className="h-4 w-4 rounded-full border-2 border-violet-400 border-t-transparent animate-spin" />
                                AI is analysing your performance…
                            </div>
                            {[80, 60, 70, 40].map((w, i) => (
                                <div key={i} className={`h-3 bg-violet-100 dark:bg-violet-900/20 rounded animate-pulse`} style={{ width: `${w}%` }} />
                            ))}
                        </div>
                    ) : feedback ? (
                        <div className="prose prose-sm max-w-none text-foreground space-y-0.5">
                            {renderMd(feedback)}
                        </div>
                    ) : (
                        <div className="text-center py-4">
                            <p className="text-sm text-muted-foreground mb-3">AI feedback could not be generated.</p>
                            <Button size="sm" variant="outline" onClick={onRetry} className="gap-1.5">
                                <RefreshCw className="h-3.5 w-3.5" /> Try Again
                            </Button>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TestResultPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: testId } = use(params);
    const searchParams = useSearchParams();
    const attemptId = searchParams.get("attemptId");
    const elapsedParam = searchParams.get("elapsed"); // seconds, set by frontend timer
    const { user } = useAuth();

    const [attempt, setAttempt] = useState<TestAttempt | null>(null);
    const [fullTest, setFullTest] = useState<Test | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState(0);   // 0 = overall, 1+ = section
    const [showAnswers, setShowAnswers] = useState(false);

    // AI feedback state
    const [aiFeedback, setAiFeedback] = useState<string | null>(null);
    const [aiFeedbackLoading, setAiFeedbackLoading] = useState(false);
    const aiTriggeredRef = useRef(false); // prevent double-trigger in StrictMode

    useEffect(() => {
        if (!attemptId) { setIsLoading(false); return; }

        // Fetch attempt (with question attempts + question + correct answers)
        // AND the full test (with sections/groups/questions for section structure)
        Promise.all([
            testsApi.getAttemptById(attemptId),
            testsApi.getTestById(testId),
        ])
            .then(([attemptData, testData]) => {
                setAttempt(attemptData);
                setFullTest(testData);
                setIsLoading(false);
            })
            .catch(err => {
                console.error("Failed to load result data:", err);
                setError("Failed to load results. Please try again.");
            setIsLoading(false);
            });
    }, [attemptId, testId]);

    // ── AI analysis trigger ───────────────────────────────────────────────────

    const triggerAiAnalysis = useCallback(async (
        attemptData: TestAttempt,
        testData: Test | null,
        enriched: QAEnriched[],
    ) => {
        if (!attemptId) return;
        setAiFeedbackLoading(true);
        setAiFeedback(null);

        const skill: string = (attemptData.test as any)?.skill ?? testData?.skill ?? "reading";
        const testTitle = attemptData.test?.title ?? testData?.title ?? "IELTS Test";
        const correctQ = enriched.filter(q => q.isCorrect === true).length;
        const wrongQ   = enriched.filter(q => q.isCorrect !== true && !!q.answer?.trim()).length;
        const skippedQ = enriched.filter(q => !q.answer?.trim()).length;

        // Build question-type accuracy map
        const qTypeStats: Record<string, { correct: number; total: number }> = {};
        enriched.forEach(qa => {
            const t = qa.questionType || "fill_in_blank";
            if (!qTypeStats[t]) qTypeStats[t] = { correct: 0, total: 0 };
            qTypeStats[t].total++;
            if (qa.isCorrect) qTypeStats[t].correct++;
        });

        // Wrong answers with details (for prompt)
        const wrongAnswers = enriched
            .filter(qa => qa.isCorrect !== true && !!qa.answer?.trim())
            .slice(0, 10)
            .map(qa => ({
                questionNumber: qa.globalOrder || 0,
                questionType: qa.questionType,
                yourAnswer: qa.answer ?? "",
                correctAnswer: qa.correctAnswers[0] ?? "—",
            }));

        const wrongQuestionIds = enriched
            .filter(qa => qa.isCorrect !== true && !!qa.answer?.trim())
            .map(qa => qa.questionId);

        const learnerId = (user as any)?.profileId || user?.id || "";

        try {
            const res = await fetch("/api/ai/analyze-result", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    attemptId,
                    learnerId,
                    skill,
                    testTitle,
                    totalQ: enriched.length,
                    correctQ,
                    wrongQ,
                    skippedQ,
                    bandScore: Number(attemptData.bandScore ?? 0),
                    wrongAnswers,
                    wrongQuestionIds,
                    questionTypeStats: qTypeStats,
                }),
            });
            const data = await res.json();
            setAiFeedback(data.aiFeedback ?? null);
        } catch (err) {
            console.error("AI analysis failed:", err);
            setAiFeedback(null);
        } finally {
            setAiFeedbackLoading(false);
        }
    }, [attemptId, user]);

    // Auto-trigger analysis when data is ready; re-use stored feedback if present
    useEffect(() => {
        if (!attempt || isLoading || aiTriggeredRef.current) return;
        aiTriggeredRef.current = true;

        const storedFeedback = (attempt as any).aiFeedback as string | null;
        if (storedFeedback) {
            // Already analysed previously — just show stored result instantly
            setAiFeedback(storedFeedback);
            return;
        }

        // New attempt — run analysis
        const enriched = buildEnrichedQAs(attempt, fullTest);
        triggerAiAnalysis(attempt, fullTest, enriched);
    }, [attempt, fullTest, isLoading, triggerAiAnalysis]);

    // ── Loading / Error ──────────────────────────────────────────────────────

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-slate-950">
                <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                <p className="text-muted-foreground font-medium">Loading results…</p>
            </div>
        );
    }

    if (error || !attempt) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-slate-950">
                <AlertCircle className="h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">{error ?? "Result not found."}</p>
                <Link href="/tests"><Button variant="outline">Back to Tests</Button></Link>
            </div>
        );
    }

    // ── Derived Data ─────────────────────────────────────────────────────────

    const skill: string = (attempt.test as any)?.skill ?? fullTest?.skill ?? "";
    const isListening = skill === "listening";
    const isAutoGraded = isListening || skill === "reading";
    const testTitle = attempt.test?.title ?? fullTest?.title ?? "IELTS Practice Test";
    const bandScore = Number(attempt.bandScore ?? 0);

    const qaEnriched = buildEnrichedQAs(attempt, fullTest);
    const totalQ = qaEnriched.length;
    const correctQ = qaEnriched.filter(q => q.isCorrect === true).length;
    // "wrong" = gave an answer but it wasn't correct (includes null isCorrect = ungraded)
    const wrongQ = qaEnriched.filter(q => q.isCorrect !== true && !!q.answer?.trim()).length;
    // "skipped" = no answer at all
    const skippedQ = qaEnriched.filter(q => !q.answer?.trim()).length;
    const accuracy = totalQ > 0 ? (correctQ / totalQ) * 100 : 0;

    // ── Elapsed time ─────────────────────────────────────────────────────────
    // Priority 1: ?elapsed=N (seconds) — set by the frontend timer at submit time.
    //   This is a plain Date.now() delta, completely timezone-agnostic.
    // Priority 2: DB timestamp diff — used when viewing historical results where
    //   the URL param is absent. toUtcMs normalises any missing Z suffix.
    function fmtSeconds(totalSec: number): string {
        const h = Math.floor(totalSec / 3600);
        const m = Math.floor((totalSec % 3600) / 60);
        const s = totalSec % 60;
        return h > 0
            ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
            : `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }

    let timeTaken = "N/A";
    const elapsedSec = elapsedParam !== null ? parseInt(elapsedParam, 10) : NaN;
    if (!isNaN(elapsedSec) && elapsedSec >= 0) {
        timeTaken = fmtSeconds(elapsedSec);
    } else {
        const startMs = toUtcMs(attempt.startedAt);
        const endMs   = toUtcMs(attempt.submittedAt);
        if (startMs !== null && endMs !== null && endMs > startMs) {
            timeTaken = fmtSeconds(Math.floor((endMs - startMs) / 1000));
        }
    }

    const startMs = toUtcMs(attempt.startedAt);
    const testDate = startMs
        ? new Date(startMs).toLocaleDateString("en-US", {
            day: "numeric", month: "long", year: "numeric",
          })
        : "—";

    // Section tabs
    const sections: Section[] = fullTest?.sections ?? [];
    const tabLabels = [
        "Overall",
        ...sections.map((_, i) => isListening ? `Recording ${i + 1}` : `Passage ${i + 1}`),
    ];

    // QAs for the active tab
    const activeQAs = activeTab === 0
        ? qaEnriched
        : qaEnriched.filter(qa => qa.sectionIdx === activeTab - 1);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">

            {/* ── Sticky Header ──────────────────────────────────────────── */}
            <div className="bg-white dark:bg-slate-900 border-b border-border sticky top-0 z-20 shadow-sm">
                <div className="max-w-5xl mx-auto px-4 md:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
                    {/* Title + section badges */}
                    <div className="flex flex-wrap items-center gap-2 min-w-0">
                        <span className="text-sm font-bold text-foreground whitespace-nowrap hidden sm:block">
                            Practice Result:
                        </span>
                        <span className="text-sm font-semibold text-primary truncate max-w-xs">{testTitle}</span>
                        {sections.map((_, i) => (
                            <Badge key={i} variant="secondary" className="text-[10px] font-semibold hidden md:inline-flex">
                                {isListening ? `Recording ${i + 1}` : `Passage ${i + 1}`}
                            </Badge>
                        ))}
                </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                            variant={showAnswers ? "default" : "outline"}
                            size="sm"
                            className="h-8 text-xs font-semibold gap-1.5"
                            onClick={() => setShowAnswers(v => !v)}
                        >
                            <ListChecks className="h-3.5 w-3.5" />
                            {showAnswers ? "Hide Answers" : "Show Answers"}
                        </Button>
                        <Link href={`/practice/${testId}`}>
                            <Button variant="outline" size="sm" className="h-8 text-xs font-semibold gap-1.5">
                                <FileText className="h-3.5 w-3.5" />
                                View Test
                            </Button>
                        </Link>
                        <Link href={`/practice/${testId}`}>
                            <Button size="sm" className="h-8 text-xs font-semibold gap-1.5">
                                <RotateCcw className="h-3.5 w-3.5" />
                                Retake
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 space-y-5">

                {/* ── Summary Row ────────────────────────────────────────── */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                        {
                            label: "Score",
                            value: totalQ > 0 ? `${correctQ}/${totalQ}` : "—",
                            sub: "correct",
                            icon: FileText,
                            color: "text-slate-600",
                            bg: "bg-slate-100 dark:bg-slate-800",
                            },
                            {
                                label: "Accuracy",
                            value: totalQ > 0 ? `${accuracy.toFixed(1)}%` : "—",
                            sub: "correct/total",
                            icon: Table2,
                                color: "text-blue-600",
                                bg: "bg-blue-50 dark:bg-blue-900/20",
                            },
                            {
                                label: "Time Taken",
                                value: timeTaken,
                            sub: "",
                                icon: Clock,
                                color: "text-amber-600",
                                bg: "bg-amber-50 dark:bg-amber-900/20",
                            },
                    ].map(s => (
                        <Card key={s.label} className="bg-white dark:bg-slate-900 shadow-sm border">
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${s.bg}`}>
                                    <s.icon className={`h-5 w-5 ${s.color}`} />
                                    </div>
                                    <div>
                                    <p className="text-[11px] text-muted-foreground">{s.label}</p>
                                    <p className="text-xl font-black tabular-nums leading-tight">
                                        {s.value}
                                        {s.sub && <span className="text-sm font-semibold text-muted-foreground ml-1">{s.sub}</span>}
                                    </p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                {/* ── 3 Stat Cards ───────────────────────────────────────── */}
                <div className="grid grid-cols-3 gap-3">
                    {[
                        {
                            label: "Correct",
                            value: correctQ,
                            icon: CheckCircle2,
                            color: "text-emerald-600",
                            bg: "bg-emerald-50 dark:bg-emerald-900/20",
                            border: "border-emerald-100 dark:border-emerald-800/30",
                        },
                        {
                            label: "Incorrect",
                            value: wrongQ,
                            icon: XCircle,
                            color: "text-red-500",
                            bg: "bg-red-50 dark:bg-red-900/20",
                            border: "border-red-100 dark:border-red-800/30",
                        },
                        {
                            label: "Skipped",
                            value: skippedQ,
                            icon: SkipForward,
                            color: "text-slate-500",
                            bg: "bg-slate-50 dark:bg-slate-800/50",
                            border: "border-slate-200 dark:border-slate-700",
                        },
                    ].map(s => (
                        <Card key={s.label} className={`bg-white dark:bg-slate-900 shadow-sm border ${s.border}`}>
                            <CardContent className="p-4 text-center space-y-1.5">
                                <div className={`h-10 w-10 rounded-full mx-auto flex items-center justify-center ${s.bg}`}>
                                    <s.icon className={`h-5 w-5 ${s.color}`} />
                                </div>
                                <p className={`text-3xl font-black tabular-nums leading-none ${s.color}`}>{s.value}</p>
                                <p className="text-xs text-muted-foreground font-medium">questions</p>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{s.label}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* ── Band Score (simple, no reference table) ────────────── */}
                {isAutoGraded && (
                    <Card className="bg-white dark:bg-slate-900 shadow-sm border">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="flex-shrink-0 text-center min-w-[80px]">
                                <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Band Score</p>
                                <p className={`text-5xl font-black leading-none tabular-nums ${
                                    bandScore >= 7 ? "text-emerald-600 dark:text-emerald-400"
                                    : bandScore >= 5 ? "text-amber-500"
                                    : bandScore > 0 ? "text-red-500"
                                    : "text-muted-foreground"
                                }`}>
                                    {bandScore > 0 ? bandScore.toFixed(1) : "—"}
                                </p>
                            </div>
                            <div className="flex-1 border-l border-border pl-4 space-y-1.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                    {isListening
                                        ? <Headphones className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                        : <BookOpen className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                                    }
                                    <span className="text-sm font-semibold text-foreground">
                                        {isListening ? "IELTS Listening" : "IELTS Reading Academic"}
                                    </span>
                                    {bandScore > 0 && (
                                        <Badge variant="secondary" className="text-xs">
                                            {bandScore >= 8.5 ? "Expert" : bandScore >= 7.5 ? "Very Good" : bandScore >= 6.5 ? "Competent" : bandScore >= 5.5 ? "Modest" : "Limited"}
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Raw Score: <strong className="text-foreground">{attempt.rawScore ?? correctQ}</strong> / {totalQ} correct
                                </p>
                                {bandScore === 0 && (
                                    <p className="text-xs text-amber-600">Band score will be calculated after submission.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* ── Detailed Analysis ───────────────────────────────────── */}
                <Card className="bg-white dark:bg-slate-900 shadow-sm border overflow-hidden">
                    <CardContent className="p-0">
                        {/* Header */}
                        <div className="px-5 pt-4 pb-3 border-b border-border flex items-center gap-2">
                            <Table2 className="h-4 w-4 text-primary" />
                            <h2 className="font-bold text-sm">Detailed Analysis</h2>
                        </div>

                        {/* Tabs */}
                        {tabLabels.length > 1 && (
                            <div className="flex gap-0.5 px-4 pt-3 flex-wrap border-b border-border">
                                {tabLabels.map((label, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setActiveTab(i)}
                                        className={`px-4 py-1.5 text-xs font-bold rounded-t border border-b-0 transition-colors -mb-px ${
                                            activeTab === i
                                                ? "bg-white dark:bg-slate-900 border-border text-primary"
                                                : "bg-slate-50 dark:bg-slate-800 border-transparent text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                        </div>
                        )}

                        <AnalysisTable qas={activeQAs} skill={skill} />
                    </CardContent>
                </Card>

                {/* ── Answer Review ───────────────────────────────────────── */}
                <Card className="bg-white dark:bg-slate-900 shadow-sm border overflow-hidden">
                        <CardContent className="p-0">
                        {/* Header */}
                        <div className="px-5 pt-4 pb-3 border-b border-border flex items-center justify-between flex-wrap gap-3">
                            <div className="flex items-center gap-2">
                                <ListChecks className="h-4 w-4 text-primary" />
                                <h2 className="font-bold text-sm">Answer Review</h2>
                                <Badge variant="secondary" className="text-xs">{correctQ}/{totalQ}</Badge>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                <Button
                                    variant={showAnswers ? "default" : "outline"}
                                    size="sm"
                                    className="h-8 text-xs font-semibold"
                                    onClick={() => setShowAnswers(v => !v)}
                                >
                                    {showAnswers ? "Hide Details" : "Show Details"}
                                </Button>
                                {wrongQ > 0 && (
                                    <Link href={`/practice/${testId}`}>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 text-xs font-semibold gap-1 border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10"
                                        >
                                            <RotateCcw className="h-3 w-3" />
                                            Retry Incorrect ({wrongQ})
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </div>

                        {/* Tip */}
                        <div className="mx-4 mt-3 px-4 py-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 text-xs text-emerald-800 dark:text-emerald-200 font-medium">
                            💡 Tip: Review your incorrect answers to improve your score on the next attempt.
                        </div>

                        {showAnswers && (
                            <div className="mt-3 pb-2">
                                {/* Section sub-tabs (only when multiple sections) */}
                                {tabLabels.length > 1 && (
                                    <div className="flex gap-1 px-4 pb-2 flex-wrap border-b border-border mb-1">
                                        {tabLabels.map((label, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setActiveTab(i)}
                                                className={`px-3 py-1 text-xs font-bold rounded border transition-colors ${
                                                    activeTab === i
                                                        ? "bg-primary text-primary-foreground border-primary"
                                                        : "bg-background border-border text-muted-foreground hover:text-foreground"
                                                }`}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                <AnswerList qas={activeQAs} />
                            </div>
                        )}
                        </CardContent>
                    </Card>

                {/* ── AI Coaching Feedback ───────────────────────────────── */}
                <AiFeedbackPanel
                    feedback={aiFeedback}
                    loading={aiFeedbackLoading}
                    onRetry={() => {
                        if (!attempt) return;
                        aiTriggeredRef.current = false;
                        const enriched = buildEnrichedQAs(attempt, fullTest);
                        triggerAiAnalysis(attempt, fullTest, enriched);
                    }}
                />

                {/* ── Footer Actions ──────────────────────────────────────── */}
                <div className="flex flex-wrap justify-center gap-3 pt-2 pb-10">
                    <Link href="/tests">
                        <Button variant="outline" className="gap-2 font-semibold">
                            {isListening
                                ? <Headphones className="h-4 w-4" />
                                : <BookOpen className="h-4 w-4" />
                            }
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

                <p className="text-center text-xs text-muted-foreground pb-4">
                    Completed on {testDate}
                </p>
            </div>
        </div>
    );
}
