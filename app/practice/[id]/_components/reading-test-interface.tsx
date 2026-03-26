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

import { SubmitConfirmDialog } from "./shared/submit-confirm-dialog";
import { NavigationSidebar } from "./shared/test-navigation-sidebar";
import { QuestionGroupBlock } from "./shared/test-question-item";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  testId: string;
  test: any;
  initialAnswers?: Record<string, string>;
  onAnswerUpdate?: (answers: Record<string, string>) => void;
  onFinish: (answers: Record<string, string>) => void;
}

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
    (a: number, s: Section) => a + (s.questionGroups?.reduce((b: number, g: QuestionGroup) => b + (g.questions?.length ?? 0), 0) ?? 0),
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
      sections.map((sec: Section, idx: number) => ({
        id: sec.id || `section-${idx}`,
        label: `Passage ${idx + 1}`,
        content: sec.passage || "",
      })),
    [sections],
  );

  const currentSection = sections[activeSection];

  const sectionOffset = useMemo(() => {
    let offset = 0;
    for (let i = 0; i < activeSection; i++) {
      offset +=
        sections[i]?.questionGroups?.reduce(
          (s: number, g: QuestionGroup) => s + (g.questions?.length ?? 0),
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
            currentSection?.questionGroups?.map((group: QuestionGroup, gi: number) => {
              const groupOffset = (currentSection.questionGroups ?? [])
                .slice(0, gi)
                .reduce((s: number, g: QuestionGroup) => s + (g.questions?.length ?? 0), 0);
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
