"use client";

import { useState } from "react";
import { Timer } from "lucide-react";
import type { Section } from "@/lib/types";
import { usePractice } from "../../practice-context";
import { SubmitConfirmDialog } from "./submit-confirm-dialog";

function formatTime(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export interface NavSidebarProps {
  sections: Section[];
  answers: Record<string, string>;
  activeSection: number;
  onQuestionClick: (questionId: string, sectionIndex: number) => void;
  onFinish: () => void;
  sectionLabel?: string;
}

export function NavigationSidebar({
  sections,
  answers,
  activeSection,
  onQuestionClick,
  onFinish,
  sectionLabel = "Passage",
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

      {/* Question Grid by Passage/Part */}
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
                {sectionLabel} {sIdx + 1}
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
