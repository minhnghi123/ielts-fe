/**
 * Split Test Layout - 55/45 split with passages left, questions right
 */

import { ReactNode } from "react";

interface SplitTestLayoutProps {
  leftPanel: ReactNode;
  rightPanel: ReactNode;
  className?: string;
}

export function SplitTestLayout({
  leftPanel,
  rightPanel,
  className = "",
}: SplitTestLayoutProps) {
  return (
    <div className={`flex h-full w-full overflow-hidden ${className}`}>
      {/* Left Panel - Passage/Content (55%) */}
      <div className="w-[55%] h-full border-r border-border bg-background">
        {leftPanel}
      </div>

      {/* Right Panel - Questions (45%) */}
      <div className="w-[45%] h-full bg-background">{rightPanel}</div>
    </div>
  );
}
