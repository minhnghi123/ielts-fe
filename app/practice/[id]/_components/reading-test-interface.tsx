"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Section, Question, QuestionGroup } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
    testId: string;
    test: { sections?: Section[] } & Record<string, any>;
    onAnswerUpdate?: (answers: Record<string, string>) => void;
    onFinish: (answers: Record<string, string>) => void;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ReadingTestInterface({ test, onAnswerUpdate, onFinish }: Props) {
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [activeSection, setActiveSection] = useState(0);

    const sections: Section[] = test?.sections ?? [];

    const handleAnswerChange = (qId: string, value: string) => {
        setAnswers((prev) => {
            const next = { ...prev, [qId]: value };
            onAnswerUpdate?.(next);
            return next;
        });
    };

    // Count total answered questions
    const totalQuestions = sections.reduce(
        (acc, sec) =>
            acc +
            (sec.questionGroups?.reduce(
                (ga, g) => ga + (g.questions?.length ?? 0),
                0,
            ) ?? 0),
        0,
    );
    const answeredCount = Object.keys(answers).length;

    return (
        <div className="h-full flex flex-col overflow-hidden bg-background">
            {/* Section Tab Bar */}
            {sections.length > 1 && (
                <div className="flex items-center gap-1 px-4 py-2 border-b bg-card overflow-x-auto flex-shrink-0">
                    {sections.map((sec, i) => (
                        <button
                            key={sec.id || i}
                            onClick={() => setActiveSection(i)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${activeSection === i
                                    ? "bg-primary text-primary-foreground shadow"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                }`}
                        >
                            Passage {i + 1}
                        </button>
                    ))}
                    {/* Progress pill */}
                    <div className="ml-auto pl-4 flex-shrink-0">
                        <span className="text-xs bg-muted text-muted-foreground px-3 py-1.5 rounded-full font-medium">
                            {answeredCount}/{totalQuestions} answered
                        </span>
                    </div>
                </div>
            )}

            {sections.length === 0 ? (
                <div className="flex flex-1 items-center justify-center text-muted-foreground">
                    No reading sections found for this test.
                </div>
            ) : (
                <>
                    {sections.map((sec, secIdx) => (
                        <div
                            key={sec.id || secIdx}
                            className={`h-full flex flex-col lg:flex-row overflow-hidden ${activeSection !== secIdx ? "hidden" : ""}`}
                        >
                            {/* ── LEFT: PASSAGE ── */}
                            <PassagePanel sec={sec} secIdx={secIdx} />

                            {/* ── RIGHT: QUESTIONS ── */}
                            <QuestionsPanel
                                sec={sec}
                                secIdx={secIdx}
                                answers={answers}
                                onAnswerChange={handleAnswerChange}
                                onFinish={() => onFinish(answers)}
                                isLastSection={secIdx === sections.length - 1}
                                onNextSection={
                                    secIdx < sections.length - 1
                                        ? () => setActiveSection(secIdx + 1)
                                        : undefined
                                }
                            />
                        </div>
                    ))}
                </>
            )}
        </div>
    );
}

// ─── Passage Panel ────────────────────────────────────────────────────────────

function PassagePanel({ sec, secIdx }: { sec: Section; secIdx: number }) {
    return (
        <div className="w-full lg:w-1/2 flex flex-col border-r border-border overflow-hidden h-full">
            {/* Passage header */}
            <div className="px-6 py-3 bg-slate-100 dark:bg-slate-800 border-b border-border flex-shrink-0 flex items-center gap-3">
                <Badge variant="secondary" className="text-xs font-semibold">
                    Passage {secIdx + 1}
                </Badge>
                <span className="text-sm font-semibold text-foreground">Reading Text</span>
            </div>

            {/* Scrollable passage */}
            <div className="flex-1 overflow-y-auto px-6 md:px-10 py-8 bg-slate-50 dark:bg-slate-900/50">
                {sec.passage ? (
                    <article
                        className="prose prose-slate dark:prose-invert prose-sm md:prose-base max-w-none 
                            prose-headings:font-serif prose-headings:leading-tight
                            prose-p:leading-relaxed prose-p:text-slate-700 dark:prose-p:text-slate-300
                            prose-table:text-sm prose-th:bg-slate-100 dark:prose-th:bg-slate-800
                            prose-li:text-slate-700 dark:prose-li:text-slate-300"
                        // Passage is stored as HTML from the admin rich-text editor
                        dangerouslySetInnerHTML={{ __html: sec.passage }}
                    />
                ) : (
                    <div className="text-center py-20 text-muted-foreground">
                        No passage content available for this section.
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Questions Panel ──────────────────────────────────────────────────────────

interface QuestionsPanelProps {
    sec: Section;
    secIdx: number;
    answers: Record<string, string>;
    onAnswerChange: (id: string, val: string) => void;
    onFinish: () => void;
    isLastSection: boolean;
    onNextSection?: () => void;
}

function QuestionsPanel({
    sec,
    answers,
    onAnswerChange,
    onFinish,
    isLastSection,
    onNextSection,
}: QuestionsPanelProps) {
    const groups = sec.questionGroups ?? [];

    return (
        <div className="w-full lg:w-1/2 flex flex-col overflow-hidden h-full">
            {/* Questions header */}
            <div className="px-6 py-3 bg-card border-b border-border flex-shrink-0 flex items-center gap-2">
                <span className="text-sm font-semibold">Questions</span>
                <span className="text-xs text-muted-foreground">
                    ({groups.reduce((a, g) => a + (g.questions?.length ?? 0), 0)} questions)
                </span>
            </div>

            {/* Scrollable questions */}
            <div className="flex-1 overflow-y-auto px-6 md:px-8 py-6 space-y-8">
                {groups.length === 0 ? (
                    <div className="text-center py-20 text-muted-foreground text-sm">
                        No questions configured for this section.
                    </div>
                ) : (
                    groups.map((group, gi) => (
                        <QuestionGroupBlock
                            key={group.id || gi}
                            group={group}
                            groupIndex={gi}
                            answers={answers}
                            onAnswerChange={onAnswerChange}
                        />
                    ))
                )}

                {/* Navigation / Submit */}
                <div className="pt-4 pb-10 flex gap-3">
                    {!isLastSection && onNextSection && (
                        <Button
                            variant="outline"
                            className="flex-1 h-12 font-semibold"
                            onClick={onNextSection}
                        >
                            Next Passage →
                        </Button>
                    )}
                    {isLastSection && (
                        <Button
                            className="flex-1 h-12 text-base font-bold shadow-lg"
                            onClick={onFinish}
                        >
                            Submit All Answers
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Question Group Block ─────────────────────────────────────────────────────

function QuestionGroupBlock({
    group,
    groupIndex,
    answers,
    onAnswerChange,
}: {
    group: QuestionGroup;
    groupIndex: number;
    answers: Record<string, string>;
    onAnswerChange: (id: string, val: string) => void;
}) {
    const questions = group.questions ?? [];

    // Question number range for the header (e.g. "Questions 1–5")
    const firstOrder = questions[0]?.questionOrder;
    const lastOrder = questions[questions.length - 1]?.questionOrder;
    const rangeLabel =
        firstOrder !== undefined && lastOrder !== undefined
            ? firstOrder === lastOrder
                ? `Question ${firstOrder}`
                : `Questions ${firstOrder}–${lastOrder}`
            : `Group ${groupIndex + 1}`;

    return (
        <div className="space-y-4">
            {/* Group header */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/40 rounded-xl p-4">
                <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
                    {rangeLabel}
                </p>
                {group.instructions ? (
                    /* Instructions are stored as HTML from the admin editor */
                    <div
                        className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300"
                        dangerouslySetInnerHTML={{ __html: group.instructions }}
                    />
                ) : (
                    <p className="text-sm text-muted-foreground">Answer the following questions.</p>
                )}
            </div>

            {/* Questions */}
            <div className="space-y-5">
                {questions.map((q, qi) => (
                    <QuestionItem
                        key={q.id || qi}
                        question={q}
                        answer={answers[q.id] ?? ""}
                        onAnswerChange={onAnswerChange}
                    />
                ))}
            </div>
        </div>
    );
}

// ─── Single Question Item ─────────────────────────────────────────────────────

function QuestionItem({
    question,
    answer,
    onAnswerChange,
}: {
    question: Question;
    answer: string;
    onAnswerChange: (id: string, val: string) => void;
}) {
    const { id, questionOrder, questionText, questionType, config } = question;

    // Config can contain: options (string[]), choices (string[]), etc.
    const options: string[] = config?.options ?? config?.choices ?? [];
    const isMcq = questionType === "multiple_choice" || options.length > 0;
    const isTrueFalse =
        questionType === "true_false" ||
        questionType === "true_false_not_given" ||
        questionType === "yes_no_not_given";
    const isSelect = isTrueFalse || questionType === "matching";
    const selectOptions =
        isTrueFalse
            ? questionType === "yes_no_not_given"
                ? ["YES", "NO", "NOT GIVEN"]
                : ["TRUE", "FALSE", "NOT GIVEN"]
            : options;

    const questionLabel = questionText
        ? `${questionOrder}. ${questionText}`
        : `${questionOrder}.`;

    return (
        <div className="group bg-card border border-border rounded-xl p-4 hover:border-primary/30 hover:shadow-sm transition-all duration-200">
            {isMcq ? (
                /* Multiple choice */
                <div className="space-y-3">
                    <p className="text-sm font-semibold leading-relaxed text-foreground">
                        {questionLabel}
                    </p>
                    <div className="space-y-2">
                        {options.map((opt, i) => {
                            const optVal = typeof opt === "object" ? String((opt as any).value ?? opt) : opt;
                            const isSelected = answer === optVal;
                            return (
                                <label
                                    key={i}
                                    className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer border transition-all ${isSelected
                                            ? "bg-primary/10 border-primary text-primary font-medium"
                                            : "border-transparent hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-border"
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name={`q-${id}`}
                                        value={optVal}
                                        checked={isSelected}
                                        onChange={(e) => onAnswerChange(id, e.target.value)}
                                        className="mt-0.5 w-4 h-4 accent-primary flex-shrink-0"
                                    />
                                    <span className="text-sm">{optVal}</span>
                                </label>
                            );
                        })}
                    </div>
                </div>
            ) : isSelect ? (
                /* True/False/NG or Matching — dropdown */
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground block leading-relaxed">
                        {questionLabel}
                    </label>
                    <select
                        value={answer}
                        onChange={(e) => onAnswerChange(id, e.target.value)}
                        className="w-full h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                        <option value="" disabled>Select an answer…</option>
                        {selectOptions.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                </div>
            ) : (
                /* Short answer / fill in the blank */
                <div className="space-y-2">
                    <label htmlFor={`q-${id}`} className="text-sm font-semibold text-foreground block leading-relaxed">
                        {questionLabel}
                    </label>
                    <input
                        id={`q-${id}`}
                        type="text"
                        value={answer}
                        placeholder="Type your answer…"
                        onChange={(e) => onAnswerChange(id, e.target.value)}
                        className="w-full h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                </div>
            )}
        </div>
    );
}
