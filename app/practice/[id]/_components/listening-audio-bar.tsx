"use client";

import { useState, useRef, useEffect, memo } from "react";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";

function formatTime(seconds: number) {
  if (isNaN(seconds)) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export const ListeningAudioBar = memo(function ListeningAudioBar({
  audioUrl,
}: {
  audioUrl?: string | null;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Reset audio state when URL changes
  useEffect(() => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.load();
    }
  }, [audioUrl]);

  const togglePlay = () => {
    if (audioRef.current && audioUrl) {
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
      const audioDuration = audioRef.current.duration || 0;
      setDuration(audioDuration);
      setCurrentTime(audioRef.current.currentTime);
      setProgress(audioDuration > 0 ? (audioRef.current.currentTime / audioDuration) * 100 : 0);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="w-full h-12 flex items-center bg-transparent gap-4 px-2">
      {/* Play/Pause Button */}
      <button
        onClick={togglePlay}
        disabled={!audioUrl}
        className="w-8 h-8 flex-shrink-0 text-slate-700 hover:text-slate-900 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
      </button>

      {/* Time and Slider */}
      <div className="flex-1 flex items-center gap-3">
        <div className="flex-1 cursor-default">
          <Slider
            value={[progress]}
            max={100}
            className="w-full [&_[role=slider]]:h-3 [&_[role=slider]]:w-3"
            disabled
          />
        </div>
        <span className="text-xs font-mono w-10 text-right text-slate-500 flex-shrink-0">
          {formatTime(currentTime)}
        </span>
      </div>

      {/* Volume */}
      <button
        onClick={toggleMute}
        disabled={!audioUrl}
        className="w-8 h-8 flex-shrink-0 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-colors disabled:opacity-50"
      >
        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      </button>

      {audioUrl && (
        <audio
          ref={audioRef}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setIsPlaying(false)}
          onLoadedMetadata={handleTimeUpdate}
          src={audioUrl}
        />
      )}
    </div>
  );
});
