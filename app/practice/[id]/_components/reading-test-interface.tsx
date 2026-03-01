"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
// @ts-ignore
import ReactMarkdown from 'react-markdown';
// @ts-ignore
import remarkGfm from 'remark-gfm';

export function ReadingTestInterface({
    testId,
    test,
    onAnswerUpdate,
    onFinish,
}: {
    testId: string;
    test: any;
    onAnswerUpdate?: (answers: Record<string, string>) => void;
    onFinish: (answers: Record<string, string>) => void;
}) {
    const [answers, setAnswers] = useState<Record<string, string>>({});

    const handleAnswerChange = (qId: string, value: string) => {
        setAnswers((prev) => {
            const next = { ...prev, [qId]: value };
            if (onAnswerUpdate) onAnswerUpdate(next);
            return next;
        });
    };

    // If test is not loaded yet or has no sections, show a basic fallback or the first section
    const section = test?.sections?.[0]; // For simplicity, taking the first section, or we can paginate sections. Usually IELTS Reading has 3 sections.
    const passages = test?.sections || [];

    // Simple vertical scroll for all passages (some platforms do tabs)
    return (
        <div className="h-full flex flex-col lg:flex-row overflow-hidden bg-background">
            {/* LEFT PANEL: READING PASSAGES */}
            <div className="w-full lg:w-1/2 p-6 md:p-10 border-r border-border overflow-y-auto h-full bg-slate-50 dark:bg-slate-900/50">
                <div className="max-w-2xl mx-auto space-y-12">
                    {passages.map((sec: any, index: number) => (
                        <div key={sec.id || index} className="space-y-6">
                            <Badge variant="outline" className="mb-2">
                                Reading Passage {index + 1}
                            </Badge>
                            <h1 className="text-3xl font-serif font-bold text-foreground">
                                {sec.title || "Passage"}
                            </h1>
                            <div className="prose dark:prose-invert prose-lg max-w-none font-serif leading-relaxed text-slate-700 dark:text-slate-300">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {sec.content || ""}
                                </ReactMarkdown>
                            </div>
                            {index < passages.length - 1 && <hr className="my-8" />}
                        </div>
                    ))}
                    {passages.length === 0 && (
                        <div className="text-muted-foreground text-center py-20">No reading passages available.</div>
                    )}
                </div>
            </div>

            {/* RIGHT PANEL: QUESTIONS */}
            <div className="w-full lg:w-1/2 p-6 md:p-10 overflow-y-auto h-full bg-background scroll-smooth">
                <div className="max-w-2xl mx-auto space-y-10">
                    {passages.map((sec: any, secIndex: number) => (
                        <div key={sec.id || secIndex} className="space-y-10">
                            {/* Section Header */}
                            <div className="flex items-center gap-4 py-2 border-b">
                                <span className="font-bold text-lg">Passage {secIndex + 1} Questions</span>
                            </div>

                            {sec.questionGroups?.map((group: any, groupIndex: number) => (
                                <section key={group.id || groupIndex} className="space-y-4">
                                    <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                                        <h3 className="font-bold text-primary mb-2">
                                            {group.title || `Question Group ${groupIndex + 1}`}
                                        </h3>
                                        {group.instruction && (
                                            <div className="prose dark:prose-invert prose-sm">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{group.instruction}</ReactMarkdown>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-6">
                                        {group.questions?.map((q: any, qIndex: number) => (
                                            <div key={q.id || qIndex}>
                                                {/* For multiple choice, we show radio buttons. For others, input or select. */}
                                                {renderQuestion(q, answers, handleAnswerChange)}
                                            </div>
                                        ))}
                                    </div>
                                    <hr className="border-border my-8" />
                                </section>
                            ))}
                        </div>
                    ))}

                    {/* Submit */}
                    <div className="pt-10 pb-20">
                        <Button
                            className="w-full h-14 text-lg font-bold shadow-lg"
                            onClick={() => onFinish(answers)}
                        >
                            Submit Test Answers
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// A helper to render different question types based on the Question entity
function renderQuestion(q: any, answers: Record<string, string>, onChange: (id: string, val: string) => void) {
    // We infer the type based on the options array
    const hasOptions = q.options && Array.isArray(q.options) && q.options.length > 0;

    // If it has options and it's multiple choice (e.g. A, B, C, D)
    if (hasOptions) {
        return (
            <div className="space-y-3">
                <p className="font-medium">
                    <span className="font-bold mr-2">{q.order}.</span>
                    {q.text}
                </p>
                <div className="space-y-2 pl-6">
                    {q.options.map((opt: string, i: number) => {
                        // Sometimes options are stored like "A. Text", sometimes just "Text".
                        const optValue = opt.charAt(0).match(/[A-Z]/) && opt.charAt(1) === '.' ? opt.charAt(0) : opt;

                        return (
                            <label
                                key={i}
                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer border border-transparent hover:border-border transition-all"
                            >
                                <input
                                    type="radio"
                                    name={`q-${q.id}`}
                                    value={optValue}
                                    checked={answers[q.id] === optValue}
                                    onChange={(e) => onChange(q.id, e.target.value)}
                                    className="w-4 h-4 text-primary accent-primary flex-shrink-0"
                                />
                                <span>{opt}</span>
                            </label>
                        );
                    })}
                </div>
            </div>
        );
    }

    // Default to text input or select if it looks like T/F/NG
    // This is a naive heuristic; usually you'd have an explicit `type` field on the question
    if (q.text && (q.text.includes("TRUE") || q.text.includes("FALSE") || q.text.includes("NOT GIVEN"))) {
        return (
            <QuestionRow
                id={q.id}
                label={`${q.order}. ${q.text}`}
                type="select"
                options={["TRUE", "FALSE", "NOT GIVEN"]}
                value={answers[q.id]}
                onChange={onChange}
            />
        );
    }

    // Default text input
    return (
        <QuestionRow
            id={q.id}
            label={`${q.order}. ${q.text}`}
            type="text"
            value={answers[q.id]}
            onChange={onChange}
        />
    );
}

function QuestionRow({
    id,
    label,
    type,
    options,
    value,
    onChange,
}: {
    id: string;
    label: string;
    type: "select" | "text";
    options?: string[];
    value?: string;
    onChange: (id: string, val: string) => void;
}) {
    return (
        <div className="flex flex-col gap-2">
            <label htmlFor={id} className="font-medium text-sm md:text-base">
                {label}
            </label>
            {type === "select" && options ? (
                <select
                    id={id}
                    value={value || ""}
                    onChange={(e) => onChange(id, e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <option value="" disabled>
                        Select an answer...
                    </option>
                    {options.map((opt) => (
                        <option key={opt} value={opt}>
                            {opt}
                        </option>
                    ))}
                </select>
            ) : (
                <input type="text" className="border rounded px-3 py-2" />
            )}
        </div>
    );
}
