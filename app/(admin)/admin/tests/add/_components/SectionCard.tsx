"use client";

import { PlusCircle, Trash2, GripVertical } from "lucide-react";
import RichTextEditor from "@/app/(admin)/_components/RichTextEditor";
import GroupCard from "./GroupCard";
import AudioUploader from "./AudioUploader";

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
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Section Audio
            </label>
            <AudioUploader
              value={section.audioUrl || ""}
              onChange={(url) => onUpdateSection("audioUrl", url)}
            />
          </div>
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
