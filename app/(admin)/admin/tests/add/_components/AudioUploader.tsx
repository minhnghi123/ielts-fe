"use client";

import { useRef, useState, DragEvent, ChangeEvent } from "react";
import { Upload, Music, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface AudioUploaderProps {
  value?: string;
  onChange: (url: string) => void;
}

type UploadState = "idle" | "uploading" | "success" | "error";

export default function AudioUploader({ value, onChange }: AudioUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadState, setUploadState] = useState<UploadState>(value ? "success" : "idle");
  const [uploadedUrl, setUploadedUrl] = useState(value || "");
  const [errorMessage, setErrorMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState("");

  const ALLOWED_TYPES = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/m4a", "audio/aac", "video/mp4"];
  const ALLOWED_EXT = /\.(mp3|wav|ogg|m4a|aac|mp4)$/i;
  const MAX_SIZE = 50 * 1024 * 1024; // 50 MB

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXT.test(file.name)) {
      return "Invalid file type. Please upload an audio file (MP3, WAV, OGG, M4A, AAC).";
    }
    if (file.size > MAX_SIZE) {
      return "File too large. Maximum size is 50 MB.";
    }
    return null;
  };

  const uploadFile = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setUploadState("error");
      setErrorMessage(validationError);
      return;
    }

    setFileName(file.name);
    setUploadState("uploading");
    setProgress(0);
    setErrorMessage("");

    // Simulate progress with interval while uploading
    const progressInterval = setInterval(() => {
      setProgress((p) => Math.min(p + 5, 90));
    }, 200);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload/audio", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Upload failed");
      }

      const data = await res.json();
      setProgress(100);
      setUploadedUrl(data.url);
      setUploadState("success");
      onChange(data.url);
    } catch (err: unknown) {
      clearInterval(progressInterval);
      setUploadState("error");
      setErrorMessage(err instanceof Error ? err.message : "Upload failed. Please try again.");
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  const handleRemove = () => {
    setUploadState("idle");
    setUploadedUrl("");
    setFileName("");
    setProgress(0);
    onChange("");
    if (inputRef.current) inputRef.current.value = "";
  };

  // ── Render: Success state ────────────────────────────────────────────────
  if (uploadState === "success" && uploadedUrl) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
            <span className="text-sm font-medium text-green-800 truncate max-w-xs">
              {fileName || "Audio uploaded"}
            </span>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="p-1 rounded-md hover:bg-green-100 text-green-600 hover:text-red-500 transition-colors"
            title="Remove audio"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <audio
          controls
          src={uploadedUrl}
          className="w-full h-10 accent-blue-600"
        />
      </div>
    );
  }

  // ── Render: Error state ──────────────────────────────────────────────────
  if (uploadState === "error") {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{errorMessage}</p>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="p-1 rounded-md hover:bg-red-100 text-red-500 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-sm font-medium text-red-600 hover:underline"
        >
          Try again
        </button>
        <input ref={inputRef} type="file" accept="audio/*" className="hidden" onChange={handleFileChange} />
      </div>
    );
  }

  // ── Render: Uploading state ──────────────────────────────────────────────
  if (uploadState === "uploading") {
    return (
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
          <span className="text-sm font-medium text-blue-800">
            Uploading <span className="text-blue-600 font-semibold">{fileName}</span>…
          </span>
        </div>
        <div className="w-full bg-blue-100 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-blue-600">{progress}%</p>
      </div>
    );
  }

  // ── Render: Idle / drop zone ─────────────────────────────────────────────
  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          relative cursor-pointer rounded-xl border-2 border-dashed transition-all
          flex flex-col items-center justify-center gap-3 px-6 py-8
          ${isDragging
            ? "border-blue-500 bg-blue-50 scale-[1.01]"
            : "border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50"
          }
        `}
      >
        <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isDragging ? "bg-blue-100" : "bg-slate-100"}`}>
          {isDragging
            ? <Upload className="w-6 h-6 text-blue-600" />
            : <Music className="w-6 h-6 text-slate-400" />
          }
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-700">
            {isDragging ? "Drop your audio file here" : "Upload Audio File"}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Drag & drop or <span className="text-blue-600 font-medium">browse</span> — MP3, WAV, OGG, M4A (max 50 MB)
          </p>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="audio/*,video/mp4"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
