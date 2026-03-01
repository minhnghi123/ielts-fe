/**
 * Questions Panel - Displays questions with integrated minimap sidebar
 */

import { ReactNode, useRef, useState, useCallback } from "react";
import { QuestionMinimap } from "./question-minimap";

interface Question {
  id: string;
  questionOrder: number;
  questionText?: string;
}

interface QuestionsPanelProps {
  title?: string;
  questions: Question[];
  answeredQuestions: Record<string, string>;
  children: ReactNode;
  actionButtons?: ReactNode;
  showMinimap?: boolean;
  className?: string;
}

export function QuestionsPanel({
  title = "QUESTIONS",
  questions,
  answeredQuestions,
  children,
  actionButtons,
  showMinimap = true,
  className = "",
}: QuestionsPanelProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentQuestionId, setCurrentQuestionId] = useState<string | undefined>();

  const scrollToQuestion = useCallback((questionId: string) => {
    const element = document.getElementById(`q-container-${questionId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      setCurrentQuestionId(questionId);
      element.classList.add("ring-2", "ring-primary", "ring-offset-2", "transition-all");
      setTimeout(() => {
        element.classList.remove("ring-2", "ring-primary", "ring-offset-2");
        setCurrentQuestionId(undefined);
      }, 1500);
    }
  }, []);

  const answeredCount = Object.values(answeredQuestions).filter((v) => v?.trim()).length;

  return (
    <div className={`flex h-full overflow-hidden ${className}`}>
      {/* ── Main Questions Area ── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Panel header */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 bg-background border-b border-border shadow-sm">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-extrabold tracking-widest text-muted-foreground uppercase">
              {title}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-muted border border-border text-foreground">
              {answeredCount}
              <span className="text-muted-foreground font-medium">/{questions.length}</span>
            </span>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-2">
            <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{
                  width: questions.length > 0
                    ? `${Math.round((answeredCount / questions.length) * 100)}%`
                    : "0%",
                }}
              />
            </div>
            <span className="text-[11px] font-semibold text-muted-foreground min-w-[32px] text-right">
              {questions.length > 0
                ? `${Math.round((answeredCount / questions.length) * 100)}%`
                : "0%"}
            </span>
          </div>
        </div>

        {/* Scrollable question content */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto px-4 md:px-6 py-5 space-y-6 scroll-smooth custom-scrollbar"
        >
          {children}

          {actionButtons && (
            <div className="pt-6 flex gap-3 pb-4">{actionButtons}</div>
          )}
        </div>
      </div>

      {/* ── Right Minimap ── */}
      {showMinimap && questions.length > 0 && (
        <QuestionMinimap
          questions={questions}
          answeredQuestions={answeredQuestions}
          onQuestionClick={scrollToQuestion}
          currentQuestionId={currentQuestionId}
        />
      )}
    </div>
  );
}
