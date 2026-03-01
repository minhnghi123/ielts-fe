/**
 * Passage Panel - Displays passage content with proper typography
 */

import { Badge } from "@/components/ui/badge";
import { sanitizePassage } from "@/lib/utils/sanitize-passage";
import { memo } from "react";

interface PassagePanelProps {
  passageNumber: number;
  content: string;
  className?: string;
}

export const PassagePanel = memo(function PassagePanel({
  passageNumber,
  content,
  className = "",
}: PassagePanelProps) {
  const sanitizedContent = sanitizePassage(content);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="px-6 py-3 bg-muted/50 border-b border-border flex-shrink-0 flex items-center gap-3">
        <Badge variant="secondary" className="text-xs font-bold">
          Passage {passageNumber}
        </Badge>
        <span className="text-sm font-bold text-foreground uppercase tracking-wider">
          Reading Text
        </span>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 md:px-12 py-10 scroll-smooth custom-scrollbar">
        {content ? (
          <article
            className="prose prose-slate dark:prose-invert max-w-none 
              w-full break-words
              font-serif text-[1.125rem] leading-[1.85]
              text-foreground
              prose-headings:font-sans prose-headings:font-bold prose-headings:text-foreground
              prose-p:mb-5 prose-p:text-foreground
              prose-strong:font-semibold prose-strong:text-foreground
              prose-li:text-foreground
              /* BẮT BUỘC NGẮT DÒNG VÀ GIỚI HẠN CHIỀU RỘNG CHO HTML NHÚNG */
              [&_*]:!whitespace-normal [&_*]:!break-words [&_*]:max-w-full [&_table]:w-full [&_table]:overflow-x-auto"
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            No passage content available.
          </div>
        )}
      </div>
    </div>
  );
});

/** Tabbed Passage Panel for multiple passages */
interface TabbedPassagePanelProps {
  passages: Array<{ id: string; label: string; content: string }>;
  activeIndex: number;
  onTabChange: (index: number) => void;
  answeredCount?: number;
  totalQuestions?: number;
}

export const TabbedPassagePanel = memo(function TabbedPassagePanel({
  passages,
  activeIndex,
  onTabChange,
  answeredCount,
  totalQuestions,
}: TabbedPassagePanelProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Top Tab Navigation */}
      {passages.length > 1 && (
        <div className="flex items-center gap-1 px-4 py-2 border-b bg-background overflow-x-auto flex-shrink-0 shadow-sm">
          {passages.map((passage, i) => (
            <button
              key={passage.id}
              onClick={() => onTabChange(i)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                activeIndex === i
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {passage.label}
            </button>
          ))}
          {answeredCount !== undefined && totalQuestions !== undefined && (
            <div className="ml-auto pl-4 flex-shrink-0">
              <span className="text-xs bg-muted text-muted-foreground px-3 py-1.5 rounded-full font-medium">
                {answeredCount}/{totalQuestions} answered
              </span>
            </div>
          )}
        </div>
      )}

      {/* Passage Content */}
      <div className="flex-1 relative overflow-hidden flex flex-col">
        {passages.map((passage, idx) => (
          <div
            key={passage.id}
            className={`flex-1 w-full h-full flex-col ${
              activeIndex !== idx ? "hidden" : "flex"
            }`}
          >
            <PassagePanel passageNumber={idx + 1} content={passage.content} />
          </div>
        ))}
      </div>
    </div>
  );
});
