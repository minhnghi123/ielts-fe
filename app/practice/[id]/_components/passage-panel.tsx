"use client";

/**
 * Passage Panel - Displays passage content with proper typography and highlighting
 */

import { Badge } from "@/components/ui/badge";
import { sanitizePassage } from "@/lib/utils/sanitize-passage";
import { memo, useRef, useState, useCallback, useMemo } from "react";
import { Highlighter } from "lucide-react";

// ─── Highlight Logic ──────────────────────────────────────────────────────────

function applyYellowHighlight(range: Range) {
  const mark = document.createElement("mark");
  mark.className = "passage-highlight passage-highlight-yellow";

  // Click a highlight to remove it
  mark.addEventListener("click", function (e) {
    e.stopPropagation();
    const parent = mark.parentNode;
    if (!parent) return;
    while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
    parent.removeChild(mark);
    parent.normalize();
  });

  try {
    range.surroundContents(mark);
  } catch {
    const fragment = range.extractContents();
    mark.appendChild(fragment);
    range.insertNode(mark);
  }

  window.getSelection()?.removeAllRanges();
}

// ─── Article Content (isolated from highlight-mode state) ─────────────────────
//
// A dedicated memo component so that toggling highlight mode in the parent
// never causes a re-render here. If this re-rendered, the browser would clear
// the active text selection before applyYellowHighlight() could use it.

const ARTICLE_CLASS = `
  passage-article
  max-w-none w-full
  [font-family:var(--font-roboto),'Georgia','Times_New_Roman',serif]
  text-[1.0625rem] leading-[1.85] font-normal tracking-[0.01em]
  text-foreground
  [word-break:normal] [overflow-wrap:break-word] [hyphens:auto]
  [text-rendering:optimizeLegibility] [-webkit-font-smoothing:antialiased]

  [&_p]:mb-[1.1em] [&_p]:text-foreground [&_p]:leading-[1.85]
  [&_p:first-child]:mt-0
  [&_p:last-child]:mb-0

  [&_h1]:text-[1.375rem] [&_h1]:font-bold [&_h1]:text-foreground
  [&_h1]:mt-8 [&_h1]:mb-4
  [&_h1]:[font-family:var(--font-roboto),Arial,sans-serif]

  [&_h2]:text-[1.1875rem] [&_h2]:font-bold [&_h2]:text-foreground
  [&_h2]:mt-7 [&_h2]:mb-3
  [&_h2]:[font-family:var(--font-roboto),Arial,sans-serif]

  [&_h3]:text-[1.0625rem] [&_h3]:font-semibold [&_h3]:text-foreground
  [&_h3]:mt-5 [&_h3]:mb-2.5
  [&_h3]:[font-family:var(--font-roboto),Arial,sans-serif]

  [&_strong]:font-semibold [&_strong]:text-foreground
  [&_em]:italic

  [&_ul]:list-disc [&_ul]:pl-7 [&_ul]:mb-[1.1em] [&_ul]:space-y-1.5
  [&_ol]:list-decimal [&_ol]:pl-7 [&_ol]:mb-[1.1em] [&_ol]:space-y-1.5
  [&_li]:text-foreground [&_li]:leading-[1.8] [&_li]:pl-1

  [&_blockquote]:border-l-[3px] [&_blockquote]:border-primary/30
  [&_blockquote]:pl-5 [&_blockquote]:italic
  [&_blockquote]:text-muted-foreground [&_blockquote]:my-5

  [&_table]:w-full [&_table]:border-collapse [&_table]:my-6 [&_table]:text-[0.9375rem]
  [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2.5
  [&_td]:text-foreground [&_td]:align-top [&_td]:leading-[1.7]
  [&_th]:border [&_th]:border-border [&_th]:px-3 [&_th]:py-2.5
  [&_th]:text-foreground [&_th]:font-semibold [&_th]:bg-muted/50 [&_th]:text-left
  [&_tr:nth-child(even)_td]:bg-muted/20

  [&_.passage-highlight]:rounded-sm [&_.passage-highlight]:cursor-pointer
  [&_.passage-highlight:hover]:opacity-70
`;

interface PassageArticleProps {
  sanitizedContent: string;
  articleRef: React.RefObject<HTMLDivElement | null>;
  highlightMode: boolean;
  onMouseUp: () => void;
}

const PassageArticle = memo(function PassageArticle({
  sanitizedContent,
  articleRef,
  highlightMode,
  onMouseUp,
}: PassageArticleProps) {
  return (
    <div
      className="flex-1 overflow-y-auto overflow-x-hidden px-6 md:px-10 py-8 scroll-smooth custom-scrollbar"
      style={{ cursor: highlightMode ? "text" : undefined }}
      onMouseUp={onMouseUp}
    >
      {sanitizedContent ? (
        <article
          ref={articleRef}
          className={ARTICLE_CLASS}
          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        />
      ) : (
        <div className="text-center py-20 text-muted-foreground">
          No passage content available.
        </div>
      )}
    </div>
  );
});

// ─── Passage Panel ────────────────────────────────────────────────────────────

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
  const sanitizedContent = useMemo(() => sanitizePassage(content), [content]);
  const articleRef = useRef<HTMLDivElement | null>(null);
  const [highlightMode, setHighlightMode] = useState(false);

  const handleMouseUp = useCallback(() => {
    if (!highlightMode) return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) return;

    const range = selection.getRangeAt(0);
    const articleEl = articleRef.current;
    if (!articleEl || !articleEl.contains(range.commonAncestorContainer)) return;

    applyYellowHighlight(range);
  }, [highlightMode]);

  const toggleHighlightMode = useCallback(() => {
    setHighlightMode((prev) => !prev);
    // Clear any lingering selection when toggling off
    window.getSelection()?.removeAllRanges();
  }, []);

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

        {/* Highlight mode toggle */}
        <button
          onClick={toggleHighlightMode}
          title={highlightMode ? "Turn off highlight mode" : "Turn on highlight mode"}
          className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 select-none ${
            highlightMode
              ? "bg-yellow-300 border-yellow-400 text-yellow-900 shadow-sm hover:bg-yellow-400"
              : "bg-background border-border text-muted-foreground hover:border-yellow-400 hover:text-yellow-600"
          }`}
        >
          <Highlighter className="w-3.5 h-3.5" />
          {highlightMode ? "Highlighting ON" : "Highlight"}
        </button>
      </div>

      {/* Hint bar shown only when highlight mode is active */}
      {highlightMode && (
        <div className="flex-shrink-0 px-6 py-1.5 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 text-[11px] text-yellow-700 dark:text-yellow-400 font-medium flex items-center gap-1.5">
          <Highlighter className="w-3 h-3 flex-shrink-0" />
          Select any text to highlight it yellow. Click a highlight to remove it.
        </div>
      )}

      {/* Article — isolated in its own memo so toggling mode never re-renders it */}
      <PassageArticle
        sanitizedContent={sanitizedContent}
        articleRef={articleRef}
        highlightMode={highlightMode}
        onMouseUp={handleMouseUp}
      />
    </div>
  );
});

// ─── Tabbed Passage Panel ─────────────────────────────────────────────────────

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
