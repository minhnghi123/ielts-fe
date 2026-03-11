"use client";

import { useState, useMemo, useCallback } from "react";
import type { Section, Question, QuestionGroup } from "@/lib/types";
import { TabbedPassagePanel } from "./passage-panel";
import { usePractice } from "../practice-context";
import { Timer, CheckSquare, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  testId: string;
  test: { sections?: Section[] } & Record<string, any>;
  initialAnswers?: Record<string, string>;
  onAnswerUpdate?: (answers: Record<string, string>) => void;
  onFinish: (answers: Record<string, string>) => void;
}

const ROMAN_NUMERALS = ["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII","XIII","XIV","XV","XVI","XVII","XVIII","XIX","XX"];

// ─── Submit Confirmation Dialog ───────────────────────────────────────────────

function SubmitConfirmDialog({
  open,
  answeredCount,
  totalCount,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  answeredCount: number;
  totalCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const unanswered = totalCount - answeredCount;
  return (
    <AlertDialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Submit test?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm text-foreground">
              <div className="flex justify-between rounded-lg bg-muted px-4 py-3">
                <span className="text-muted-foreground">Answered</span>
                <span className="font-bold text-emerald-600">{answeredCount} / {totalCount}</span>
              </div>
              {unanswered > 0 && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-amber-700 dark:text-amber-300">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>{unanswered}</strong> question{unanswered !== 1 ? "s" : ""} unanswered.
                    Blank answers will be marked incorrect.
                  </span>
                </div>
              )}
              <p className="text-muted-foreground">Once submitted, you cannot change your answers.</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Keep Testing</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-rose-500 hover:bg-rose-600 text-white"
          >
            Submit Now
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── Timer display helper ─────────────────────────────────────────────────────

function formatTime(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

// ─── Navigation Sidebar ────────────────────────────────────────────────────────

interface NavSidebarProps {
  sections: Section[];
  answers: Record<string, string>;
  activeSection: number;
  onQuestionClick: (questionId: string, sectionIndex: number) => void;
  onFinish: () => void;
}

function NavigationSidebar({
  sections,
  answers,
  activeSection,
  onQuestionClick,
  onFinish,
}: NavSidebarProps) {
  const { timeLeft } = usePractice();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const isUrgent = timeLeft !== null && timeLeft < 300_000;
  const isWarning = timeLeft !== null && timeLeft < 600_000 && timeLeft >= 300_000;

  const totalQ = sections.reduce(
    (a, s) => a + (s.questionGroups?.reduce((b, g) => b + (g.questions?.length ?? 0), 0) ?? 0),
    0,
  );
  const answeredQ = Object.values(answers).filter((v) => v?.trim()).length;

  let globalOffset = 0;
  const sectionOffsets = sections.map((s) => {
    const off = globalOffset;
    globalOffset += s.questionGroups?.reduce((a, g) => a + (g.questions?.length ?? 0), 0) ?? 0;
    return off;
  });

  return (
    <aside className="h-full w-[180px] flex-shrink-0 border-l border-border bg-white dark:bg-slate-900 flex flex-col overflow-hidden">
      {/* Timer */}
      <div className={`flex-shrink-0 px-3 pt-3 pb-2.5 border-b border-border/60 ${isUrgent ? "bg-red-50 dark:bg-red-950/30" : ""}`}>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
          Thời gian làm bài
        </p>
        <div className={`flex items-center gap-1.5 ${isUrgent ? "text-red-600 dark:text-red-400" : isWarning ? "text-amber-600 dark:text-amber-400" : "text-foreground"}`}>
          <Timer className={`w-3.5 h-3.5 ${isUrgent ? "animate-bounce" : ""}`} />
          <span className={`text-lg font-mono font-extrabold tabular-nums ${isUrgent ? "animate-pulse" : ""}`}>
            {timeLeft !== null ? formatTime(timeLeft) : "∞"}
          </span>
        </div>
        {isUrgent && (
          <p className="text-[10px] text-red-500 font-semibold mt-0.5">Sắp hết giờ!</p>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex-shrink-0 px-3 py-2.5 border-b border-border/60">
        <button
          onClick={() => setConfirmOpen(true)}
          className="w-full py-2 rounded-lg bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white text-sm font-extrabold tracking-wide transition-colors shadow-sm"
        >
          NỘP BÀI
        </button>
        <p className="text-[10px] text-center text-muted-foreground mt-1.5 font-medium">
          {answeredQ}/{totalQ} đã trả lời
        </p>
      </div>

      <SubmitConfirmDialog
        open={confirmOpen}
        answeredCount={answeredQ}
        totalCount={totalQ}
        onConfirm={() => { setConfirmOpen(false); onFinish(); }}
        onCancel={() => setConfirmOpen(false)}
      />

      {/* Question Grid by Passage */}
      <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
        {sections.map((section, sIdx) => {
          const questions = section.questionGroups?.flatMap((g) => g.questions ?? []) ?? [];
          if (questions.length === 0) return null;
          const offset = sectionOffsets[sIdx];

          return (
            <div key={section.id || sIdx} className="px-2.5 mb-3">
              <button
                className={`w-full text-left text-[10px] font-bold uppercase tracking-wider mb-1.5 px-1 py-0.5 rounded transition-colors ${
                  activeSection === sIdx
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => {
                  const firstQ = questions[0];
                  if (firstQ) onQuestionClick(firstQ.id, sIdx);
                }}
              >
                Passage {sIdx + 1}
              </button>
              <div className="grid grid-cols-5 gap-1">
                {questions.map((q, qi) => {
                  const displayNum = offset + qi + 1;
                  const isAnswered = !!answers[q.id]?.trim();
                  return (
                    <button
                      key={q.id}
                      title={`Question ${displayNum}`}
                      onClick={() => onQuestionClick(q.id, sIdx)}
                      className={`h-7 w-full rounded text-[11px] font-bold border transition-all duration-100 hover:scale-105 active:scale-95 ${
                        isAnswered
                          ? "bg-emerald-500 text-white border-emerald-600"
                          : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-primary"
                      }`}
                    >
                      {displayNum}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex-shrink-0 px-3 py-2 border-t border-border/60 bg-muted/20 flex gap-3">
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
          <span className="text-[9px] text-muted-foreground font-medium">Đã làm</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-background border border-border inline-block" />
          <span className="text-[9px] text-muted-foreground font-medium">Chưa làm</span>
        </div>
      </div>
    </aside>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ReadingTestInterface({
  test,
  initialAnswers,
  onAnswerUpdate,
  onFinish,
}: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers ?? {});
  const [activeSection, setActiveSection] = useState(0);
  const [headerConfirmOpen, setHeaderConfirmOpen] = useState(false);

  const sections = useMemo(() => test?.sections ?? [], [test?.sections]);

  const totalQ = useMemo(() => sections.reduce(
    (a, s) => a + (s.questionGroups?.reduce((b, g) => b + (g.questions?.length ?? 0), 0) ?? 0),
    0,
  ), [sections]);
  const answeredQ = Object.values(answers).filter((v) => v?.trim()).length;

  const handleAnswerChange = (qId: string, value: string) => {
    setAnswers((prev) => {
      const next = { ...prev, [qId]: value };
      onAnswerUpdate?.(next);
      return next;
    });
  };

  const passageTabs = useMemo(
    () =>
      sections.map((sec, idx) => ({
        id: sec.id || `section-${idx}`,
        label: `Passage ${idx + 1}`,
        content: sec.passage || "",
      })),
    [sections],
  );

  const currentSection = sections[activeSection];

  // Compute global question number offset for the active section
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

  const scrollToQuestion = useCallback((questionId: string) => {
    const element = document.getElementById(`q-container-${questionId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.classList.add("ring-2", "ring-primary", "ring-offset-1");
      setTimeout(() => element.classList.remove("ring-2", "ring-primary", "ring-offset-1"), 1500);
    }
  }, []);

  const handleNavQuestionClick = useCallback(
    (questionId: string, sectionIndex: number) => {
      if (sectionIndex !== activeSection) {
        setActiveSection(sectionIndex);
        setTimeout(() => scrollToQuestion(questionId), 100);
      } else {
        scrollToQuestion(questionId);
      }
    },
    [activeSection, scrollToQuestion],
  );

  if (sections.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground h-full">
        No reading sections found for this test.
      </div>
    );
  }

  return (
    <div className="h-full flex overflow-hidden bg-background">
      {/* ── Left: Passage Panel ── */}
      <div className="w-[50%] h-full border-r border-border flex-shrink-0">
        <TabbedPassagePanel
          passages={passageTabs}
          activeIndex={activeSection}
          onTabChange={setActiveSection}
        />
      </div>

      {/* ── Middle: Questions ── */}
      <div className="flex-1 h-full flex flex-col overflow-hidden min-w-0">
        {/* Questions header */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-border bg-white dark:bg-slate-900 shadow-sm">
          <span className="text-xs font-bold tracking-widest uppercase text-muted-foreground">
            Câu hỏi
          </span>
          {activeSection < sections.length - 1 ? (
            <button
              onClick={() => setActiveSection(activeSection + 1)}
              className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              Passage {activeSection + 2} →
            </button>
          ) : (
            <button
              onClick={() => setHeaderConfirmOpen(true)}
              className="flex items-center gap-1 text-xs font-semibold text-rose-500 hover:underline"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              Nộp bài
            </button>
          )}
        </div>

        {/* Scrollable question list */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 custom-scrollbar">
          {currentSection?.questionGroups?.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground text-sm">
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
        </div>
      </div>

      {/* ── Right: Navigation Sidebar ── */}
      <NavigationSidebar
        sections={sections}
        answers={answers}
        activeSection={activeSection}
        onQuestionClick={handleNavQuestionClick}
        onFinish={() => onFinish(answers)}
      />

      {/* Header "Nộp bài" confirm dialog */}
      <SubmitConfirmDialog
        open={headerConfirmOpen}
        answeredCount={answeredQ}
        totalCount={totalQ}
        onConfirm={() => { setHeaderConfirmOpen(false); onFinish(answers); }}
        onCancel={() => setHeaderConfirmOpen(false)}
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
    <div className="space-y-2.5">
      {/* Group header */}
      <div className="rounded-lg border border-border bg-slate-50 dark:bg-slate-800/50 overflow-hidden">
        <div className="flex items-center justify-between px-3.5 py-2 border-b border-border/60">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-primary/80">
            {rangeLabel}
          </span>
          <span className="text-[10px] text-muted-foreground font-medium">
            {answeredInGroup}/{questions.length}
          </span>
        </div>

        {/* Instructions */}
        <div className="px-3.5 py-2.5">
          {group.instructions ? (
            <div
              className="prose prose-sm dark:prose-invert max-w-none text-foreground leading-relaxed prose-p:my-1 prose-strong:font-bold text-[0.8125rem] [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1.5 [&_th]:border [&_th]:border-border [&_th]:px-2 [&_th]:py-1.5 [&_th]:bg-muted/50 [&_th]:font-semibold"
              dangerouslySetInnerHTML={{ __html: group.instructions }}
            />
          ) : (
            <p className="text-xs text-muted-foreground">Answer based on the passage.</p>
          )}
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-2">
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

  const hasText = !!questionText;
  const isInline = !hasText && !isMcq && !isDropdown && !isMatchingHeading;

  return (
    <div
      id={`q-container-${id}`}
      className="bg-white dark:bg-slate-900 border border-border rounded-lg px-4 py-3 shadow-sm hover:border-primary/30 transition-all duration-200"
    >
      {isInline ? (
        /* Inline fill-in-blank */
        <div className="flex items-center gap-3">
          <span className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-extrabold select-none">
            {shownOrder}
          </span>
          <input
            type="text"
            value={answer}
            placeholder="Your answer…"
            onChange={(e) => onAnswerChange(id, e.target.value)}
            className="flex-1 h-9 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary shadow-sm transition-shadow placeholder:text-muted-foreground/60"
          />
        </div>
      ) : (
        <>
          {/* Header row */}
          <div className="flex items-start gap-3 mb-2.5">
            <span className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-extrabold select-none mt-0.5">
              {shownOrder}
            </span>
            {hasText && (
              <div
                className="flex-1 text-[0.8125rem] font-medium leading-relaxed text-foreground [&>p]:m-0"
                dangerouslySetInnerHTML={{ __html: questionText! }}
              />
            )}
          </div>

          {/* Controls */}
          <div className="ml-10">
            {isMcq ? (
              <div className="space-y-1.5">
                {options.map((opt, i) => {
                  const optVal =
                    typeof opt === "object"
                      ? String((opt as any).value ?? opt)
                      : opt;
                  const isSelected = answer === optVal;
                  const optLabel = String.fromCharCode(65 + i);
                  return (
                    <label
                      key={i}
                      className={`flex items-start gap-2.5 px-3 py-2 rounded-md cursor-pointer border transition-all text-[0.8125rem] ${
                        isSelected
                          ? "bg-primary/10 border-primary/40"
                          : "bg-background border-border hover:bg-muted/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q-${id}`}
                        value={optVal}
                        checked={isSelected}
                        onChange={(e) => onAnswerChange(id, e.target.value)}
                        className="mt-0.5 w-3.5 h-3.5 accent-primary flex-shrink-0"
                      />
                      <span>
                        <span className={`font-bold mr-1 ${isSelected ? "text-primary" : "text-muted-foreground"}`}>
                          {optLabel}.
                        </span>
                        <span className={isSelected ? "font-semibold text-foreground" : "text-foreground"}>
                          {optVal}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            ) : isDropdown ? (
              <div className="space-y-1.5">
                <select
                  value={answer}
                  onChange={(e) => onAnswerChange(id, e.target.value)}
                  className="w-full max-w-[260px] h-9 rounded-md border border-border bg-background px-2.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer shadow-sm"
                >
                  <option value="" disabled>— Select —</option>
                  {dropdownOptions.map((opt, i) => {
                    const letter = String.fromCharCode(65 + i);
                    return (
                      <option key={i} value={isTrueFalse ? opt : letter}>
                        {isTrueFalse ? opt : `${letter}. ${opt}`}
                      </option>
                    );
                  })}
                </select>
                {answer && !isTrueFalse && dropdownOptions.length > 0 && (
                  <p className="text-[11px] text-primary/80 font-semibold flex items-center gap-1">
                    <span className="inline-flex items-center justify-center w-4.5 h-4.5 rounded bg-primary/10 text-primary font-bold text-[10px] px-1">
                      {answer}
                    </span>
                    {dropdownOptions[answer.charCodeAt(0) - 65] ?? ""}
                  </p>
                )}
              </div>
            ) : isMatchingHeading ? (
              <div className="space-y-1.5">
                <select
                  value={answer}
                  onChange={(e) => onAnswerChange(id, e.target.value)}
                  className="w-full max-w-[280px] h-9 rounded-md border border-border bg-background px-2.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer shadow-sm"
                >
                  <option value="" disabled>— Select a heading —</option>
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
                  <p className="text-[11px] text-primary/80 font-semibold flex items-center gap-1">
                    <span className="inline-flex items-center justify-center bg-primary/10 text-primary font-bold text-[10px] px-1.5 py-0.5 rounded">
                      {answer}
                    </span>
                    {headingOptions[ROMAN_NUMERALS.indexOf(answer)] ?? ""}
                  </p>
                )}
              </div>
            ) : (
              <input
                type="text"
                value={answer}
                placeholder="Your answer…"
                onChange={(e) => onAnswerChange(id, e.target.value)}
                className="w-full h-9 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary shadow-sm transition-shadow placeholder:text-muted-foreground/60"
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
