/**
 * Questions Panel - Clean scrollable question container for listening/writing
 */

import { ReactNode } from "react";

interface QuestionsPanelProps {
  title?: string;
  questions?: { id: string }[];
  answeredQuestions?: Record<string, string>;
  children: ReactNode;
  actionButtons?: ReactNode;
  className?: string;
}

export function QuestionsPanel({
  title = "QUESTIONS",
  questions = [],
  answeredQuestions = {},
  children,
  actionButtons,
  className = "",
}: QuestionsPanelProps) {
  const answeredCount = Object.values(answeredQuestions).filter((v) => v?.trim()).length;
  const total = questions.length;

  return (
    <div className={`flex flex-col h-full overflow-hidden ${className}`}>
      {/* Panel header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-2.5 bg-white dark:bg-slate-900 border-b border-border shadow-sm">
        <span className="text-xs font-extrabold tracking-widest text-muted-foreground uppercase">
          {title}
        </span>
        {total > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${Math.round((answeredCount / total) * 100)}%` }}
              />
            </div>
            <span className="text-[11px] font-semibold text-muted-foreground tabular-nums">
              {answeredCount}/{total}
            </span>
          </div>
        )}
      </div>

      {/* Scrollable question content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 custom-scrollbar">
        {children}
        {actionButtons && (
          <div className="pt-4 flex gap-3 pb-2">{actionButtons}</div>
        )}
      </div>
    </div>
  );
}
