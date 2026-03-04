/**
 * Question Minimap - Compact grid navigator used in listening interface
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
      className={`h-full w-[68px] flex-shrink-0 bg-white dark:bg-slate-900 border-l border-border flex flex-col overflow-hidden ${className}`}
    >
      {/* Progress header */}
      <div className="flex-shrink-0 px-2 py-2.5 border-b border-border bg-muted/20 flex flex-col items-center gap-1">
        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
          Nav
        </span>
        <div className="relative w-9 h-9 flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeWidth="3" className="text-border" />
            <circle
              cx="18" cy="18" r="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray={`${2 * Math.PI * 14}`}
              strokeDashoffset={`${2 * Math.PI * 14 * (1 - pct / 100)}`}
              strokeLinecap="round"
              className="text-primary transition-all duration-500"
            />
          </svg>
          <span className="relative text-[9px] font-bold text-foreground leading-none">{pct}%</span>
        </div>
        <span className="text-[9px] text-muted-foreground font-medium">{answeredCount}/{total}</span>
      </div>

      {/* Question buttons */}
      <div className="flex-1 overflow-y-auto py-2 px-1 flex flex-col gap-0.5 custom-scrollbar">
        {questions.map((q) => {
          const isAnswered = answeredSet.has(q.id);
          const isCurrent = currentQuestionId === q.id;
          const previewText = q.questionText
            ? extractPlainText(q.questionText, 60)
            : `Q${q.questionOrder}`;

          return (
            <button
              key={q.id}
              onClick={() => onQuestionClick(q.id)}
              title={`Q${q.questionOrder}: ${isAnswered ? "✓" : "—"} ${previewText}`}
              className={`
                w-full h-8 flex items-center justify-center rounded-md
                text-[11px] font-bold border transition-all duration-100
                hover:scale-105 active:scale-95 select-none
                ${
                  isCurrent
                    ? "bg-primary text-primary-foreground border-primary shadow ring-2 ring-primary/20"
                    : isAnswered
                      ? "bg-emerald-500 text-white border-emerald-600 shadow-sm hover:bg-emerald-600"
                      : "bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-primary hover:bg-primary/5"
                }
              `}
            >
              {q.questionOrder}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex-shrink-0 px-1.5 py-1.5 border-t border-border bg-muted/10 flex flex-col gap-0.5">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-emerald-500 flex-shrink-0" />
          <span className="text-[8px] text-muted-foreground">Done</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-background border border-border flex-shrink-0" />
          <span className="text-[8px] text-muted-foreground">Todo</span>
        </div>
      </div>
    </aside>
  );
}
