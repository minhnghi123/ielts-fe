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

  // Compute global question number offset for the active section (sum of all questions in prior sections)
  const sectionOffset = useMemo(() => {
    let offset = 0;
    for (let i = 0; i < activeSection; i++) {
      offset +=
        sections[i]?.questionGroups?.reduce(
          (s, g) => s + (g.questions?.length ?? 0),
          0,
        ) ?? 0;
    }
    return offset;
  }, [sections, activeSection]);

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
                    className="flex-1 h-11 font-bold shadow-sm"
                    onClick={() => setActiveSection(activeSection + 1)}
                  >
                    Next Passage <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
                {activeSection === sections.length - 1 && (
                  <Button
                    className="flex-1 h-11 text-base font-bold shadow-md"
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
              currentSection?.questionGroups?.map((group, gi) => {
                const groupOffset = (currentSection.questionGroups ?? [])
                  .slice(0, gi)
                  .reduce((s, g) => s + (g.questions?.length ?? 0), 0);
                return (
                  <QuestionGroupBlock
                    key={group.id || gi}
                    group={group}
                    groupIndex={gi}
                    answers={answers}
                    onAnswerChange={handleAnswerChange}
                    displayNumberStart={sectionOffset + groupOffset}
                  />
                );
              })
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
  displayNumberStart = 0,
}: {
  group: QuestionGroup;
  groupIndex: number;
  answers: Record<string, string>;
  onAnswerChange: (id: string, val: string) => void;
  displayNumberStart?: number;
}) {
  const questions = group.questions ?? [];

  const firstDisplayNum = displayNumberStart + 1;
  const lastDisplayNum = displayNumberStart + questions.length;
  const rangeLabel =
    questions.length === 0
      ? `Group ${groupIndex + 1}`
      : firstDisplayNum === lastDisplayNum
        ? `Question ${firstDisplayNum}`
        : `Questions ${firstDisplayNum} – ${lastDisplayNum}`;

  const answeredInGroup = questions.filter((q) => answers[q.id]?.trim()).length;

  return (
    <div className="space-y-3">
      {/* Group header */}
      <div className="rounded-xl border border-border bg-muted/40 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60 bg-background/60">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider">
              {rangeLabel}
            </span>
          </div>
          <span className="text-[11px] font-semibold text-muted-foreground">
            {answeredInGroup}/{questions.length} answered
          </span>
        </div>

        {/* Instructions */}
        <div className="px-4 py-3">
          {group.instructions ? (
            <div
              className="prose prose-sm dark:prose-invert max-w-none text-foreground leading-relaxed prose-p:my-1 prose-strong:font-bold [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-border [&_td]:px-2.5 [&_td]:py-2 [&_th]:border [&_th]:border-border [&_th]:px-2.5 [&_th]:py-2 [&_th]:bg-muted/50 [&_th]:font-semibold"
              dangerouslySetInnerHTML={{ __html: group.instructions }}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Answer the following questions based on the passage.
            </p>
          )}
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-3 pl-1">
        {questions.map((q, localIdx) => (
          <QuestionItem
            key={q.id}
            question={q}
            answer={answers[q.id] ?? ""}
            onAnswerChange={onAnswerChange}
            displayOrder={displayNumberStart + localIdx + 1}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Single Question Item ─────────────────────────────────────────────────────

const ROMAN_NUMERALS = ["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII","XIII","XIV","XV","XVI","XVII","XVIII","XIX","XX"];

function QuestionItem({
  question,
  answer,
  onAnswerChange,
  displayOrder,
}: {
  question: Question;
  answer: string;
  onAnswerChange: (id: string, val: string) => void;
  displayOrder?: number;
}) {
  const { id, questionOrder, questionText, questionType, config } = question;
  const shownOrder = displayOrder ?? questionOrder;

  const options: string[] = config?.options ?? config?.choices ?? [];
  const isMcq = questionType === "multiple_choice";
  const isTrueFalse =
    questionType === "true_false" ||
    questionType === "true_false_not_given" ||
    questionType === "yes_no_not_given";
  const isDropdown =
    isTrueFalse ||
    questionType === "matching" ||
    questionType === "sentence_ending" ||
    questionType === "matching_features";
  const isMatchingHeading = questionType === "matching_heading";

  const dropdownOptions = isTrueFalse
    ? questionType === "yes_no_not_given"
      ? ["YES", "NO", "NOT GIVEN"]
      : ["TRUE", "FALSE", "NOT GIVEN"]
    : options;

  const headingOptions = isMatchingHeading ? options : [];

  return (
    <div
      id={`q-container-${id}`}
      className="group bg-background border border-border rounded-xl p-5 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300"
    >
      {/* Inline fill-in-blank: no text, no select */}
      {!questionText && !isMcq && !isDropdown && !isMatchingHeading ? (
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-muted border border-border text-sm font-bold text-foreground select-none shadow-sm">
            {shownOrder}
          </div>
          <input
            type="text"
            value={answer}
            placeholder="Type your answer…"
            onChange={(e) => onAnswerChange(id, e.target.value)}
            className="flex-1 h-10 rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary shadow-sm transition-shadow placeholder:font-medium placeholder:text-muted-foreground"
          />
        </div>
      ) : (
        <>
          {/* Header: number badge + question text */}
          <div className="flex items-start gap-4 mb-4">
            <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-muted border border-border text-sm font-bold text-foreground select-none shadow-sm">
              {shownOrder}
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
            <div className="space-y-2 mt-3 ml-12">
              {options.map((opt, i) => {
                const optVal = typeof opt === "object" ? String((opt as any).value ?? opt) : opt;
                const isSelected = answer === optVal;
                const optLabel = String.fromCharCode(65 + i);
                return (
                  <label
                    key={i}
                    className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer border transition-all ${
                      isSelected
                        ? "bg-primary/10 border-primary/40 shadow-sm"
                        : "bg-background border-border hover:bg-muted/60"
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
                    <span className="text-sm leading-relaxed">
                      <span className={`font-bold mr-1.5 ${isSelected ? "text-primary" : "text-muted-foreground"}`}>{optLabel}.</span>
                      <span className={isSelected ? "font-semibold text-foreground" : "text-foreground"}>{optVal}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          ) : isDropdown ? (
            <div className="mt-3 ml-12 space-y-2">
              <select
                value={answer}
                onChange={(e) => onAnswerChange(id, e.target.value)}
                className="w-full max-w-sm h-11 rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary shadow-sm cursor-pointer transition-shadow"
              >
                <option value="" disabled>
                  — Select —
                </option>
                {dropdownOptions.map((opt, i) => {
                  const letter = String.fromCharCode(65 + i);
                  const isTF = isTrueFalse;
                  return (
                    <option key={i} value={isTF ? opt : letter}>
                      {isTF ? opt : `${letter}. ${opt}`}
                    </option>
                  );
                })}
              </select>
              {answer && !isTrueFalse && dropdownOptions.length > 0 && (
                <p className="text-xs font-semibold text-primary/80 flex items-center gap-1.5">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-primary/10 text-primary font-bold text-[10px]">{answer}</span>
                  {dropdownOptions[answer.charCodeAt(0) - 65] ?? ""}
                </p>
              )}
            </div>
          ) : isMatchingHeading ? (
            <div className="mt-3 ml-12 space-y-2">
              <select
                value={answer}
                onChange={(e) => onAnswerChange(id, e.target.value)}
                className="w-full max-w-sm h-11 rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary shadow-sm cursor-pointer transition-shadow"
              >
                <option value="" disabled>
                  — Select a heading —
                </option>
                {headingOptions.map((opt, i) => {
                  const numeral = ROMAN_NUMERALS[i] ?? String(i + 1);
                  return (
                    <option key={numeral} value={numeral}>
                      {numeral}. {opt}
                    </option>
                  );
                })}
              </select>
              {answer && headingOptions.length > 0 && (
                <p className="text-xs font-semibold text-primary/80 flex items-center gap-1.5">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-primary/10 text-primary font-bold text-[10px]">{answer}</span>
                  {headingOptions[ROMAN_NUMERALS.indexOf(answer)] ?? ""}
                </p>
              )}
            </div>
          ) : (
            <div className="mt-3 ml-12">
              <input
                type="text"
                value={answer}
                placeholder="Type your answer…"
                onChange={(e) => onAnswerChange(id, e.target.value)}
                className="w-full h-11 rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary shadow-sm transition-shadow placeholder:font-medium placeholder:text-muted-foreground"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
