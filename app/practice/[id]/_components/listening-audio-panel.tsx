"use client";

import { useState, useRef, useEffect, memo } from "react";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

interface AudioSection {
  id: string;
  label: string;
  audioUrl?: string | null;
  content?: string | null;
}

interface TabbedAudioPanelProps {
  sections: AudioSection[];
  activeIndex: number;
  onTabChange: (index: number) => void;
  answeredCount?: number;
  totalQuestions?: number;
}

export const TabbedAudioPanel = memo(function TabbedAudioPanel({
  sections,
  activeIndex,
  onTabChange,
  answeredCount,
  totalQuestions,
}: TabbedAudioPanelProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(600);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const activeSection = sections[activeIndex];
  const audioUrl = activeSection?.audioUrl || "";

  // Reset audio state when section changes
  useEffect(() => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.load();
    }
  }, [activeIndex, audioUrl]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch((err) => console.error("Audio play error:", err));
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const audioDuration = audioRef.current.duration || 600;
      setDuration(audioDuration);
      setCurrentTime(audioRef.current.currentTime);
      setProgress((audioRef.current.currentTime / audioDuration) * 100);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top Tab Navigation */}
      {sections.length > 1 && (
        <div className="flex items-center gap-1 px-4 py-2 border-b bg-background overflow-x-auto flex-shrink-0 shadow-sm">
          {sections.map((section, i) => (
            <button
              key={section.id}
              onClick={() => onTabChange(i)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                activeIndex === i
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {section.label}
            </button>
          ))}
          {answeredCount !== undefined && totalQuestions !== undefined && (
            <div className="ml-auto pl-4 flex-shrink-0">
              <span className="text-xs bg-muted text-muted-foreground px-3 py-1.5 rounded-full font-medium">
                {answeredCount}/{totalQuestions} đã làm
              </span>
            </div>
          )}
        </div>
      )}

      {/* Header Info */}
      <div className="px-6 py-3 bg-muted/50 border-b border-border flex-shrink-0 flex items-center gap-3">
        <Badge variant="secondary" className="text-xs font-bold">
          {activeSection?.label}
        </Badge>
        <span className="text-sm font-bold text-foreground uppercase tracking-wider">
          Listening Audio
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-6 md:px-10 py-8 custom-scrollbar bg-slate-50/50 dark:bg-slate-900/30">
        <div className="max-w-2xl mx-auto space-y-8">
          <Card className="p-8 border-none shadow-xl bg-white dark:bg-slate-800 rounded-2xl relative">
            <div className="flex flex-col items-center gap-6">
              {/* Visualizer */}
              <div className="h-32 w-32 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 flex items-center justify-center relative shadow-inner">
                <div className="flex items-center gap-1 h-12">
                  {[20, 35, 45, 30, 25].map((h, i) => (
                    <div
                      key={i}
                      className={`w-2 bg-blue-500 rounded-full transition-all duration-300 ${
                        isPlaying ? "animate-pulse" : ""
                      }`}
                      style={{
                        height: isPlaying ? `${h + Math.random() * 10}px` : "20px",
                        animationDelay: i * 0.1 + "s",
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Progress Bar & Controls */}
              <div className="w-full space-y-4">
                <div className="flex items-center justify-between text-xs font-mono text-muted-foreground px-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
                <Slider value={[progress]} max={100} className="w-full" disabled />

                <div className="flex justify-center pt-2">
                  <Button
                    onClick={togglePlay}
                    size="icon"
                    className="h-16 w-16 rounded-full shadow-lg hover:scale-105 transition-transform"
                    disabled={!audioUrl}
                  >
                    <span className="material-symbols-outlined text-[32px]">
                       {isPlaying ? "pause" : "play_arrow"}
                    </span>
                  </Button>
                </div>
              </div>

              {/* Warning */}
              <div className="bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded-lg flex items-center gap-2 text-xs text-yellow-800 dark:text-yellow-200 border border-yellow-100 dark:border-yellow-800/30 w-full">
                <span className="material-symbols-outlined text-sm">warning</span>
                <span className="font-medium">
                   Lưu ý: Bạn chỉ được nghe đoạn ghi âm MỘT lần duy nhất.
                </span>
              </div>
            </div>
          </Card>

          {/* Transcript or Instructions (if any) */}
          {activeSection?.content && (
            <div className="mt-8 prose prose-sm dark:prose-invert max-w-none">
              <div dangerouslySetInnerHTML={{ __html: activeSection.content }} />
            </div>
          )}

          {/* Hidden Audio Element */}
          {audioUrl && (
            <audio
              ref={audioRef}
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => setIsPlaying(false)}
              src={audioUrl}
            />
          )}
        </div>
      </div>
    </div>
  );
});
