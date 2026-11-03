"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useMistakes, useMistakeSummary } from "@/lib/hooks/use-analytics";
import { errorCauseAdvice, errorCauseLabel } from "@/lib/error-causes";
import { QUESTION_TYPE_LABELS_VI, normalizeQuestionType } from "@/lib/question-types";
import type { Section, QuestionAttempt } from "@/lib/types";
import { WrongAnswerCard } from "./wrong-answer-card";
import { drillHref } from "@/lib/api/drills";

interface QA extends QuestionAttempt {
    globalOrder: number;
    sectionIdx: number;
    correctAnswers: string[];
    questionType: string;
}

/** "Mẫu hình lỗi" — what went wrong across this attempt, with the single most useful next step. */
export function MistakePatterns({ learnerId, attemptId, wrongCount, skill }: { learnerId?: string; attemptId: string; wrongCount: number; skill: string }) {
    const { data, isLoading } = useMistakeSummary(learnerId, attemptId);
    if (wrongCount === 0) {
        return (
            <div className="mx-4 mt-3 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
                Không có câu sai. Thử một đề khó hơn hoặc rút ngắn thời gian làm bài để tăng thử thách.
            </div>
        );
    }
    if (isLoading || !data || data.total === 0) {
        return (
            <div className="mx-4 mt-3 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                {isLoading ? "Đang phân tích các câu sai…" : "Bấm \"Xem từng câu sai\" để xem bằng chứng và giải thích cho mỗi câu."}
            </div>
        );
    }
    const causes = Object.entries(data.byCause).sort((a, b) => b[1] - a[1]);
    const types = Object.entries(data.byQuestionType).sort((a, b) => b[1] - a[1]);
    const [topCause] = causes;
    const typeLabel = (t: string) => {
        const c = normalizeQuestionType(t);
        return c ? QUESTION_TYPE_LABELS_VI[c] : t;
    };
    return (
        <div className="mx-4 mt-3 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm space-y-2">
            <p className="font-semibold">Vì sao bạn mất {data.total} câu</p>
            <div className="flex flex-wrap gap-1.5">
                {causes.map(([k, n]) => (
                    <span key={k} className="rounded-full bg-background border border-border px-2.5 py-0.5 text-xs">
                        {errorCauseLabel(k)} · {n}
                    </span>
                ))}
            </div>
            {types.length > 0 && (
                <p className="text-xs text-muted-foreground">
                    Dạng câu sai nhiều nhất: {types.slice(0, 3).map(([k, n]) => `${typeLabel(k)} (${n})`).join(", ")}
                </p>
            )}
            {topCause && (
                <p className="text-xs">
                    <span className="font-medium">Việc cần làm tiếp: </span>
                    {errorCauseAdvice(topCause[0])}
                </p>
            )}
            {(skill === "reading" || skill === "listening") && (
                <Link href={drillHref({ skill, questionType: types[0]?.[0], errorCause: topCause?.[0] })}>
                    <Button size="sm" className="h-8 text-xs">Luyện {types[0] ? typeLabel(types[0][0]) : "dạng này"} ngay</Button>
                </Link>
            )}
        </div>
    );
}

export function WrongAnswersReview({
    learnerId,
    attemptId,
    skill,
    sections,
    qas,
}: {
    learnerId?: string;
    attemptId: string;
    skill: string;
    sections: Section[];
    qas: QA[];
}) {
    const wrong = qas.filter((q) => q.isCorrect !== true);
    const { data: mistakes } = useMistakes(learnerId, { attemptId });
    const causeByQuestion = new Map((mistakes ?? []).map((m) => [m.questionId, m.errorCause ?? null]));
    if (wrong.length === 0) return null;
    return (
        <div className="px-4 pb-4 space-y-3">
            <div className="flex items-center justify-between pt-2">
                <h3 className="text-sm font-semibold">Từng câu sai ({wrong.length})</h3>
                <Link href="/mistakes">
                    <Button variant="ghost" size="sm" className="h-7 text-xs">Mở sổ lỗi</Button>
                </Link>
            </div>
            {wrong.map((qa) => {
                const sec = sections[qa.sectionIdx] ?? null;
                return (
                    <WrongAnswerCard
                        key={qa.id}
                        attemptId={attemptId}
                        questionId={qa.questionId}
                        number={qa.globalOrder}
                        questionType={qa.questionType}
                        questionText={qa.question?.questionText}
                        userAnswer={qa.answer ?? ""}
                        correctAnswers={qa.correctAnswers}
                        skill={skill}
                        passage={sec?.passage ?? null}
                        audioUrl={sec?.audioUrl ?? null}
                        evidenceAnchor={qa.question?.evidenceAnchor ?? null}
                        authorExplanation={qa.question?.explanation ?? null}
                        errorCause={causeByQuestion.get(qa.questionId) ?? null}
                    />
                );
            })}
        </div>
    );
}
