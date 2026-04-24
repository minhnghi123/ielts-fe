import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronRight, CheckCircle2 } from "lucide-react";
import type { PartGrading } from "@/lib/types";

interface Props {
    partNumber: number;
    grading: PartGrading;
    onNext: () => void;
    isLast: boolean;
}

function bandColor(score: number): string {
    if (score >= 7) return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300";
    if (score >= 5) return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300";
    return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300";
}

const CRITERION_LABELS: Record<string, string> = {
    fluency: "Fluency & Coherence",
    lexical: "Lexical Resource",
    grammar: "Grammatical Range",
    pronunciation: "Pronunciation",
};

export function SpeakingGradingCard({ partNumber, grading, onNext, isLast }: Props) {
    const criteria = [
        { key: "fluency", score: grading.fluency },
        { key: "lexical", score: grading.lexical },
        { key: "grammar", score: grading.grammar },
        { key: "pronunciation", score: grading.pronunciation },
    ] as const;

    return (
        <div className="flex flex-col gap-4 p-4 overflow-y-auto max-h-full">
            {/* Overall band */}
            <div className="text-center py-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl border border-blue-100 dark:border-blue-800/30">
                <p className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-1">
                    Part {partNumber} Result
                </p>
                <p className="text-5xl font-black text-blue-700 dark:text-blue-300">{grading.overall.toFixed(1)}</p>
                <p className="text-sm text-blue-600/70 dark:text-blue-400/70 mt-1">Overall Band Score</p>
            </div>

            {/* Per-criterion scores */}
            <Card className="p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Criteria Breakdown</p>
                <div className="space-y-2">
                    {criteria.map(({ key, score }) => (
                        <div key={key} className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">{CRITERION_LABELS[key]}</span>
                            <Badge className={`text-sm font-bold px-2.5 py-0.5 rounded-full ${bandColor(score)}`}>
                                {score.toFixed(1)}
                            </Badge>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Suggestions */}
            {grading.suggestions.length > 0 && (
                <Card className="p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Examiner Feedback</p>
                    <div className="space-y-3">
                        {grading.suggestions.map((s, i) => (
                            <div key={i} className="border-l-2 border-primary/30 pl-3 space-y-0.5">
                                <p className="text-xs font-semibold text-primary">{s.criterion}</p>
                                <p className="text-sm text-foreground">{s.feedback}</p>
                                <p className="text-xs text-muted-foreground flex items-start gap-1">
                                    <CheckCircle2 className="h-3 w-3 mt-0.5 text-emerald-500 shrink-0" />
                                    {s.improvement}
                                </p>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Next / Finish */}
            <Button onClick={onNext} className="w-full h-12 font-bold gap-2">
                {isLast ? (
                    <>Finish Test</>
                ) : (
                    <>Continue to Part {partNumber + 1}<ChevronRight className="h-4 w-4" /></>
                )}
            </Button>
        </div>
    );
}
