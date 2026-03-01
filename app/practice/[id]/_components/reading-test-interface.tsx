"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import type { Section, Question, QuestionGroup } from "@/lib/types";
import { ChevronRight } from "lucide-react";
import { SplitTestLayout } from "./split-test-layout";
import { TabbedPassagePanel } from "./passage-panel";
import { QuestionsPanel } from "./questions-panel";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  testId: string;
  test: { sections?: Section[] } & Record<string, any>;
  onAnswerUpdate?: (answers: Record<string, string>) => void;
  onFinish: (answers: Record<string, string>) => void;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ReadingTestInterface({
  test,
  onAnswerUpdate,
  onFinish,
}: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [activeSection, setActiveSection] = useState(0);

  // Memoize sections to prevent unnecessary re-renders
  const sections = useMemo(() => test?.sections ?? [], [test?.sections]);

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
  const answeredCount = Object.keys(answers).filter((key) =>
    answers[key]?.trim(),
  ).length;

  // Prepare passages for tabbed panel - memoized to prevent re-renders
  const passageTabs = useMemo(
    () =>
      sections.map((sec, idx) => ({
        id: sec.id || `section-${idx}`,
        label: `Passage ${idx + 1}`,
        content: sec.passage || "",
      })),
    [sections],
  );

  // Get all questions for current section
  const currentSection = sections[activeSection];
  const currentQuestions = useMemo(() => {
    return (
      currentSection?.questionGroups?.flatMap((g) => g.questions ?? []) ?? []
    );
  }, [currentSection]);

  if (sections.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground h-full">
        No reading sections found for this test.
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      <SplitTestLayout
        leftPanel={
          <TabbedPassagePanel
            passages={passageTabs}
            activeIndex={activeSection}
            onTabChange={setActiveSection}
            answeredCount={answeredCount}
            totalQuestions={totalQuestions}
          />
        }
        rightPanel={
          <QuestionsPanel
            questions={currentQuestions}
            answeredQuestions={answers}
            actionButtons={
              <>
                {activeSection < sections.length - 1 && (
                  <Button
                    variant="outline"
                    className="flex-1 h-12 font-bold shadow-sm"
                    onClick={() => setActiveSection(activeSection + 1)}
                  >
                    Next Passage <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
                {activeSection === sections.length - 1 && (
                  <Button
                    className="flex-1 h-12 text-base font-bold shadow-md"
                    onClick={() => onFinish(answers)}
                  >
                    Submit Test
                  </Button>
                )}
              </>
            }
          >
            {/* Render Question Groups */}
            {currentSection?.questionGroups?.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground text-sm font-medium">
                No questions in this section.
              </div>
            ) : (
              currentSection?.questionGroups?.map((group, gi) => (
                <QuestionGroupBlock
                  key={group.id || gi}
                  group={group}
                  groupIndex={gi}
                  answers={answers}
                  onAnswerChange={handleAnswerChange}
                />
              ))
            )}
          </QuestionsPanel>
        }
      />
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

  // Question number range for the header
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
      {/* Group header with instructions */}
      <div className="bg-blue-50/70 dark:bg-blue-900/10 border border-blue-200/60 dark:border-blue-800/30 rounded-xl p-5 shadow-sm">
        <p className="text-[11px] font-extrabold text-blue-700 dark:text-blue-400 uppercase tracking-widest mb-2.5 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          {rangeLabel}
        </p>
        {group.instructions ? (
          <div
            className="prose prose-sm dark:prose-invert max-w-none text-foreground font-medium leading-relaxed prose-p:my-1 prose-strong:font-bold"
            dangerouslySetInnerHTML={{ __html: group.instructions }}
          />
        ) : (
          <p className="text-sm font-medium text-muted-foreground">
            Answer the following questions based on the passage.
          </p>
        )}
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((q) => (
          <QuestionItem
            key={q.id}
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
  const selectOptions = isTrueFalse
    ? questionType === "yes_no_not_given"
      ? ["YES", "NO", "NOT GIVEN"]
      : ["TRUE", "FALSE", "NOT GIVEN"]
    : options;

  return (
    <div
      id={`q-container-${id}`}
      className="group bg-background border border-border rounded-xl p-5 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300"
    >
      {/* Question Header */}
      <div className="flex items-start gap-4 mb-4">
        <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-muted border border-border text-sm font-bold text-foreground select-none shadow-sm">
          {questionOrder}
        </div>

        <div className="flex-1 mt-1 text-foreground">
          {questionText ? (
            <div
              className="prose prose-sm dark:prose-invert max-w-none font-medium leading-[1.7] [&>p]:m-0"
              dangerouslySetInnerHTML={{ __html: questionText }}
            />
          ) : null}
        </div>
      </div>

      {/* Input Controls */}
      {isMcq ? (
        <div className="space-y-2.5 mt-4 ml-12">
          {options.map((opt, i) => {
            const optVal =
              typeof opt === "object" ? String((opt as any).value ?? opt) : opt;
            const isSelected = answer === optVal;
            return (
              <label
                key={i}
                className={`flex items-start gap-3 p-3.5 rounded-lg cursor-pointer border transition-all ${
                  isSelected
                    ? "bg-blue-50/80 border-blue-300 text-blue-900 font-bold dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-100 shadow-sm"
                    : "bg-background border-border hover:bg-muted hover:border-border text-foreground"
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
                <span
                  className={`text-sm ${isSelected ? "font-semibold" : "font-medium"}`}
                >
                  {optVal}
                </span>
              </label>
            );
          })}
        </div>
      ) : isSelect ? (
        <div className="mt-4 ml-12">
          <select
            value={answer}
            onChange={(e) => onAnswerChange(id, e.target.value)}
            className="w-full max-w-sm h-12 rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary shadow-sm cursor-pointer transition-shadow"
          >
            <option value="" disabled>
              Select an answer…
            </option>
            {selectOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="mt-4 ml-12">
          <input
            type="text"
            value={answer}
            placeholder="Type your answer…"
            onChange={(e) => onAnswerChange(id, e.target.value)}
            className="w-full h-12 rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary shadow-sm transition-shadow placeholder:font-medium placeholder:text-muted-foreground"
          />
        </div>
      )}
    </div>
  );
}
