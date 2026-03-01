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
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 md:px-10 py-8 scroll-smooth custom-scrollbar">
        {content ? (
          <article
            className="
              max-w-none w-full
              [font-family:var(--font-roboto),Arial,sans-serif]
              text-[1rem] leading-[1.9] font-normal
              text-foreground
              [word-break:normal] [overflow-wrap:anywhere] [hyphens:none]
              [&_p]:mb-4 [&_p]:text-foreground [&_p]:leading-[1.9]
              [&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-foreground [&_h1]:mt-6 [&_h1]:mb-3 [&_h1]:[font-family:var(--font-roboto),Arial,sans-serif]
              [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-foreground [&_h2]:mt-5 [&_h2]:mb-2.5 [&_h2]:[font-family:var(--font-roboto),Arial,sans-serif]
              [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:[font-family:var(--font-roboto),Arial,sans-serif]
              [&_strong]:font-semibold [&_strong]:text-foreground
              [&_em]:italic
              [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul]:space-y-1
              [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_ol]:space-y-1
              [&_li]:text-foreground [&_li]:leading-[1.8]
              [&_blockquote]:border-l-4 [&_blockquote]:border-primary/40 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_blockquote]:my-4
              [&_table]:w-full [&_table]:border-collapse [&_table]:my-5 [&_table]:text-[0.9375rem]
              [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2.5 [&_td]:text-foreground [&_td]:align-top [&_td]:leading-[1.7]
              [&_th]:border [&_th]:border-border [&_th]:px-3 [&_th]:py-2.5 [&_th]:text-foreground [&_th]:font-semibold [&_th]:bg-muted/50 [&_th]:text-left
              [&_tr:nth-child(even)_td]:bg-muted/20
            "
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
