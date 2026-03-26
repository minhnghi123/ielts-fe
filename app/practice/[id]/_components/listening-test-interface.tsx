"use client";

import { useState, useMemo, useCallback } from "react";
import type { Section } from "@/lib/types";
import { CheckSquare } from "lucide-react";

import { ListeningAudioBar } from "./listening-audio-bar";
import { PassagePanel } from "./passage-panel";

import { SubmitConfirmDialog } from "./shared/submit-confirm-dialog";
import { NavigationSidebar } from "./shared/test-navigation-sidebar";
import { QuestionGroupBlock } from "./shared/test-question-item";

interface Props {
  testId: string;
  test: any;
  initialAnswers?: Record<string, string>;
  onAnswerUpdate?: (answers: Record<string, string>) => void;
  onFinish: (answers: Record<string, string>) => void;
}

export function ListeningTestInterface({
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
    (a: number, s: Section) => a + (s.questionGroups?.reduce((b, g) => b + (g.questions?.length ?? 0), 0) ?? 0),
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

  const currentSection = sections[activeSection];
  const currentAudioUrl = currentSection?.audioUrl;

  // Compute global question number offset for the active section
  const sectionOffset = useMemo(() => {
    let offset = 0;
    for (let i = 0; i < activeSection; i++) {
      offset +=
        sections[i]?.questionGroups?.reduce(
          (s: number, g: any) => s + (g.questions?.length ?? 0),
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
        No listening sections found for this test.
      </div>
    );
  }

  return (
    <div className="h-full flex flex-row w-full bg-background overflow-hidden">

      {/* ── Main Area (Left + Middle) ── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
         
         {/* ── Top section: Tabs + Audio ── */}
         <div className="flex flex-col flex-shrink-0 z-10 bg-white border-b border-border shadow-sm">
            
            {/* Recording Tabs */}
            {sections.length > 1 && (
              <div className="flex items-center gap-2 px-6 py-3 border-b border-border/40 overflow-x-auto custom-scrollbar">
                {sections.map((sec: Section, idx: number) => (
                  <button
                    key={sec.id || `tab-${idx}`}
                    onClick={() => setActiveSection(idx)}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                      activeSection === idx
                        ? "bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-600/20"
                        : "text-muted-foreground hover:text-slate-800 hover:bg-slate-100"
                    }`}
                  >
                    Recording {idx + 1}
                  </button>
                ))}
              </div>
            )}

            {/* Audio Player Line */}
            <div className="px-4 py-1 bg-slate-50/50">
              <ListeningAudioBar audioUrl={currentAudioUrl} />
            </div>
         </div>

         {/* ── Lower Area: Content Split ── */}
         <div className="flex-1 flex flex-row overflow-hidden min-h-0 w-full bg-slate-50/30">
            
            {/* ── Left Column: Transcript / Instructions ── */}
            <div className="w-full md:w-[50%] lg:w-[55%] h-full border-r border-border flex-shrink-0 bg-white">
              <PassagePanel
                passageNumber={activeSection + 1}
                content={currentSection?.passage || ""}
                labelPrefix="Recording"
                panelTitle="Instructions & Transcript"
              />
            </div>

            {/* ── Right Column: Questions ── */}
            <div className="flex-1 h-full flex flex-col overflow-hidden min-w-0">
              {/* Questions header */}
              <div className="flex-shrink-0 flex items-center justify-between px-6 py-3 border-b border-border bg-white shadow-sm">
                <span className="text-xs font-bold tracking-widest uppercase text-muted-foreground">
                  Câu hỏi
                </span>
                {activeSection < sections.length - 1 ? (
                  <button
                    onClick={() => setActiveSection(activeSection + 1)}
                    className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    Recording {activeSection + 2} →
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
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 custom-scrollbar bg-slate-50/50">
                {currentSection?.questionGroups?.length === 0 ? (
                  <div className="text-center py-20 text-muted-foreground text-sm">
                    No questions in this section.
                  </div>
                ) : (
                  currentSection?.questionGroups?.map((group: any, gi: number) => {
                    const groupOffset = (currentSection.questionGroups ?? [])
                      .slice(0, gi)
                      .reduce((s: number, g: any) => s + (g.questions?.length ?? 0), 0);
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
         </div>
      </div>

      {/* ── Far Right: Navigation Sidebar ── */}
      <div className="hidden md:block w-72 lg:w-80 h-full flex-shrink-0 border-l border-border bg-white shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.02)] z-20 relative">
        <NavigationSidebar
          sections={sections}
          answers={answers}
          activeSection={activeSection}
          onQuestionClick={handleNavQuestionClick}
          onFinish={() => onFinish(answers)}
          sectionLabel="Recording"
        />
      </div>

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
