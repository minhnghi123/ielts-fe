/**
 * Questions Panel - Displays questions with integrated minimap
 */

import { ReactNode, useRef, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
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
  const [currentQuestionId, setCurrentQuestionId] = useState<
    string | undefined
  >();

  const scrollToQuestion = useCallback((questionId: string) => {
    const element = document.getElementById(`q-container-${questionId}`);
    if (element && scrollContainerRef.current) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      setCurrentQuestionId(questionId);

      // Highlight effect
      element.classList.add(
        "ring-2",
        "ring-primary",
        "ring-offset-2",
        "transition-all",
      );
      setTimeout(() => {
        element.classList.remove("ring-2", "ring-primary", "ring-offset-2");
        setCurrentQuestionId(undefined);
      }, 1500);
    }
  }, []);

  const answeredCount = Object.values(answeredQuestions).filter((answer) =>
    answer?.trim(),
  ).length;

  return (
    <div className={`flex h-full bg-muted/50 ${className}`}>
      {/* Main Questions Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3 bg-background border-b border-border flex-shrink-0 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-sm font-extrabold tracking-wide text-foreground">
              {title}
            </span>
            <Badge variant="outline" className="text-xs bg-muted font-semibold">
              {answeredCount}/{questions.length}
            </Badge>
          </div>
        </div>

        {/* Scrollable Questions */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto px-5 md:px-8 py-6 space-y-8 scroll-smooth custom-scrollbar"
        >
          {children}

          {/* Action Buttons */}
          {actionButtons && (
            <div className="pt-8 flex gap-3 pb-6">{actionButtons}</div>
          )}
        </div>
      </div>

      {/* Right Sidebar Minimap */}
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
