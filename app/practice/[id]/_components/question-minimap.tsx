/**
 * Question Minimap - Compact sidebar navigation for questions
 */

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

  const answeredCount = answeredSet.size;
  const total = questions.length;
  const pct = total > 0 ? Math.round((answeredCount / total) * 100) : 0;

  if (questions.length === 0) return null;

  return (
    <aside
      className={`h-full w-[72px] flex-shrink-0 bg-background border-l border-border flex flex-col overflow-hidden ${className}`}
    >
      {/* Progress header */}
      <div className="flex-shrink-0 px-2 py-3 border-b border-border bg-muted/30 flex flex-col items-center gap-1.5">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          Nav
        </span>
        {/* Circular progress */}
        <div className="relative w-10 h-10 flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 40 40">
            <circle
              cx="20" cy="20" r="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              className="text-border"
            />
            <circle
              cx="20" cy="20" r="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray={`${2 * Math.PI * 16}`}
              strokeDashoffset={`${2 * Math.PI * 16 * (1 - pct / 100)}`}
              strokeLinecap="round"
              className="text-primary transition-all duration-500"
            />
          </svg>
          <span className="relative text-[10px] font-bold text-foreground leading-none">
            {pct}%
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground font-medium">
          {answeredCount}/{total}
        </span>
      </div>

      {/* Question buttons */}
      <div className="flex-1 overflow-y-auto py-2 px-1.5 flex flex-col gap-1 custom-scrollbar">
        {questions.map((q) => {
          const isAnswered = answeredSet.has(q.id);
          const isCurrent = currentQuestionId === q.id;
          const previewText = q.questionText
            ? extractPlainText(q.questionText, 80)
            : `Question ${q.questionOrder}`;

          return (
            <button
              key={q.id}
              onClick={() => onQuestionClick(q.id)}
              title={`Q${q.questionOrder}: ${isAnswered ? "✓ Answered" : "Not answered"}\n${previewText}`}
              className={`
                w-full h-9 flex items-center justify-center rounded-lg
                text-xs font-bold border-2 transition-all duration-150
                hover:scale-105 active:scale-95 select-none
                ${
                  isCurrent
                    ? "bg-primary text-primary-foreground border-primary shadow-md ring-2 ring-primary/30"
                    : isAnswered
                      ? "bg-emerald-500 text-white border-emerald-600 shadow-sm hover:bg-emerald-600"
                      : "bg-background text-muted-foreground border-border hover:border-primary/60 hover:text-primary hover:bg-primary/5"
                }
              `}
            >
              {q.questionOrder}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex-shrink-0 px-2 py-2 border-t border-border bg-muted/20 flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-emerald-500 flex-shrink-0" />
          <span className="text-[9px] text-muted-foreground font-medium truncate">Done</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-background border-2 border-border flex-shrink-0" />
          <span className="text-[9px] text-muted-foreground font-medium truncate">Pending</span>
        </div>
      </div>
    </aside>
  );
}
