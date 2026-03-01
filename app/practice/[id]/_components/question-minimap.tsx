/**
 * Question Minimap - Vertical sidebar showing question numbers with navigation
 */

import { Grid } from "lucide-react";
import { extractPlainText } from "@/lib/utils/sanitize-passage";

interface Question {
  id: string;
  questionOrder: number;
  questionText?: string;
}

interface QuestionMinimapProps {
  questions: Question[];
  answeredQuestions: Record<string, string>;
  onQuestionClick: (questionId: string) => void;
  currentQuestionId?: string;
  className?: string;
}

export function QuestionMinimap({
  questions,
  answeredQuestions,
  onQuestionClick,
  currentQuestionId,
  className = "",
}: QuestionMinimapProps) {
  const answeredSet = new Set(
    Object.entries(answeredQuestions)
      .filter(([, value]) => value?.trim())
      .map(([key]) => key),
  );

  if (questions.length === 0) return null;

  return (
    <div
      className={`h-full w-14 bg-muted/30 border-l border-border flex flex-col items-center py-4 gap-2 overflow-y-auto custom-scrollbar ${className}`}
    >
      {/* Header Icon */}
      <div className="flex flex-col items-center gap-1 mb-2 pb-2 border-b border-border/50 w-full">
        <Grid className="w-4 h-4 text-muted-foreground" />
      </div>

      {/* Question Buttons */}
      <div className="flex flex-col gap-1.5 w-full items-center">
        {questions.map((q) => {
          const isAnswered = answeredSet.has(q.id);
          const isCurrent = currentQuestionId === q.id;
          const previewText = q.questionText
            ? extractPlainText(q.questionText, 100)
            : `Question ${q.questionOrder}`;

          return (
            <button
              key={q.id}
              onClick={() => onQuestionClick(q.id)}
              title={`Q${q.questionOrder}: ${isAnswered ? "Answered" : "Unanswered"}\n${previewText}`}
              className={`w-9 h-9 flex items-center justify-center rounded-lg text-xs font-bold border transition-all hover:scale-110 active:scale-95 ${
                isCurrent
                  ? "bg-blue-500 text-white border-blue-600 shadow-md ring-2 ring-blue-300"
                  : isAnswered
                    ? "bg-green-500 text-white border-green-600 shadow-sm"
                    : "bg-background text-muted-foreground border-border hover:border-primary hover:text-primary"
              }`}
            >
              {q.questionOrder}
            </button>
          );
        })}
      </div>
    </div>
  );
}
