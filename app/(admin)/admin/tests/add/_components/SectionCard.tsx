"use client";

import { PlusCircle, Trash2, GripVertical, Upload, Music, X, Loader2 } from "lucide-react";
import RichTextEditor from "@/app/(admin)/_components/RichTextEditor";
import GroupCard from "./GroupCard";
import { useRef, useState } from "react";

interface QuestionData {
  questionOrder: number;
  questionType: string;
  questionText: string;
  config: any;
  explanation?: string;
  answer: { correctAnswers: string[]; caseSensitive: boolean };
}

interface GroupData {
  groupOrder: number;
  instructions?: string;
  questions: QuestionData[];
}

interface SectionData {
  sectionOrder: number;
  passage?: string;
  audioUrl?: string;
  groups: GroupData[];
}

interface SectionCardProps {
  section: SectionData;
  sIndex: number;
  skill: string;
  onUpdateSection: (field: string, value: any) => void;
  onRemoveSection: () => void;
  onAddGroup: () => void;
  onUpdateGroup: (gIndex: number, field: string, value: any) => void;
  onRemoveGroup: (gIndex: number) => void;
  onAddQuestion: (gIndex: number) => void;
  onUpdateQuestion: (
    gIndex: number,
    qIndex: number,
    field: string,
    value: any,
  ) => void;
  onUpdateAnswer: (
    gIndex: number,
    qIndex: number,
    field: string,
    value: any,
  ) => void;
  onRemoveQuestion: (gIndex: number, qIndex: number) => void;
}

function AudioUploader({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setUploading(true);
    setFileName(file.name);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload/audio", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      onChange(data.url);
    } catch (err: any) {
      setError(err.message || "Upload failed");
      setFileName(null);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">
        Audio File
      </label>

      {/* Drop zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl p-6 cursor-pointer transition-all
          ${uploading ? "border-blue-300 bg-blue-50/40 cursor-not-allowed" : "border-slate-300 hover:border-blue-400 hover:bg-blue-50/30"}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />

        {uploading ? (
          <>
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
            <p className="text-sm font-medium text-blue-600">Uploading {fileName}…</p>
            <p className="text-xs text-slate-400">Please wait, this may take a moment</p>
          </>
        ) : value ? (
          <>
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Music className="h-6 w-6 text-blue-600" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-800 truncate max-w-xs">
                {fileName || "Audio uploaded"}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Click to replace</p>
            </div>
          </>
        ) : (
          <>
            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
              <Upload className="h-6 w-6 text-slate-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-600">
                Drag & drop audio file here, or <span className="text-blue-600 font-semibold">browse</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">MP3, WAV, OGG, M4A — up to 50 MB</p>
            </div>
          </>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1.5">
          <X className="h-3.5 w-3.5" /> {error}
        </p>
      )}

      {/* Manual URL fallback */}
      {value && (
        <div className="flex items-center gap-2 mt-1">
          <input
            type="text"
            value={value}
            readOnly
            className="flex-1 border rounded-lg p-2 text-xs text-slate-500 bg-slate-50 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => { onChange(""); setFileName(null); }}
            className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
            title="Remove audio"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Audio preview */}
      {value && (
        <audio controls src={value} className="w-full mt-2 rounded-lg" />
      )}
    </div>
  );
}

export default function SectionCard({
  section,
  sIndex,
  skill,
  onUpdateSection,
  onRemoveSection,
  onAddGroup,
  onUpdateGroup,
  onRemoveGroup,
  onAddQuestion,
  onUpdateQuestion,
  onUpdateAnswer,
  onRemoveQuestion,
}: SectionCardProps) {
  return (
    <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
      {/* Section Header */}
      <div className="bg-slate-50 border-b px-6 py-4 flex justify-between items-center group">
        <div className="flex items-center gap-3">
          <GripVertical className="text-slate-400 cursor-move" />
          <h2 className="text-xl font-semibold text-slate-800">
            Section {sIndex + 1}
          </h2>
        </div>
        <button
          onClick={onRemoveSection}
          className="p-2 text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Audio Upload (Listening only) */}
        {skill === "listening" && (
          <AudioUploader
            value={section.audioUrl || ""}
            onChange={(url) => onUpdateSection("audioUrl", url)}
          />
        )}

        {/* Reading Passage (Reading only) */}
        {skill === "reading" && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Reading Passage
            </label>
            <RichTextEditor
              value={section.passage || ""}
              onChange={(val: string) => onUpdateSection("passage", val)}
            />
          </div>
        )}

        {/* Question Groups */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h3 className="text-lg font-semibold text-slate-800">
              Question Groups
            </h3>
          </div>

          <div className="space-y-6">
            {section.groups.map((group, gIndex) => {
              // Compute the question number offset for sequential numbering
              const questionOffset = section.groups
                .slice(0, gIndex)
                .reduce((sum, g) => sum + (g.questions?.length ?? 0), 0);

              return (
                <GroupCard
                  key={gIndex}
                  group={group}
                  gIndex={gIndex}
                  questionOffset={questionOffset}
                  onUpdateGroup={(field, value) =>
                    onUpdateGroup(gIndex, field, value)
                  }
                  onRemoveGroup={() => onRemoveGroup(gIndex)}
                  onAddQuestion={() => onAddQuestion(gIndex)}
                  onUpdateQuestion={(qi, field, value) =>
                    onUpdateQuestion(gIndex, qi, field, value)
                  }
                  onUpdateAnswer={(qi, field, value) =>
                    onUpdateAnswer(gIndex, qi, field, value)
                  }
                  onRemoveQuestion={(qi) => onRemoveQuestion(gIndex, qi)}
                />
              );
            })}
          </div>

          <button
            onClick={onAddGroup}
            className="mt-6 flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-50 px-4 py-3 rounded-xl transition-colors border-2 border-slate-300 border-dashed w-full justify-center"
          >
            <PlusCircle className="w-4 h-4" />
            Add New Question Group
          </button>
        </div>
      </div>
    </div>
  );
}
