"use client";

import { PlusCircle, Trash2 } from "lucide-react";
import RichTextEditor from "@/app/(admin)/_components/RichTextEditor";
import QuestionItem from "./QuestionItem";

interface GroupData {
  groupOrder: number;
  instructions?: string;
  questions: {
    questionOrder: number;
    questionType: string;
    questionText: string;
    config: any;
    explanation?: string;
    answer: { correctAnswers: string[]; caseSensitive: boolean };
  }[];
}

interface GroupCardProps {
  group: GroupData;
  gIndex: number;
  /** Zero-based global question offset — so question numbers are sequential across groups */
  questionOffset: number;
  onUpdateGroup: (field: string, value: any) => void;
  onRemoveGroup: () => void;
  onAddQuestion: () => void;
  onUpdateQuestion: (qIndex: number, field: string, value: any) => void;
  onUpdateAnswer: (qIndex: number, field: string, value: any) => void;
  onRemoveQuestion: (qIndex: number) => void;
}

export default function GroupCard({
  group,
  gIndex,
  questionOffset,
  onUpdateGroup,
  onRemoveGroup,
  onAddQuestion,
  onUpdateQuestion,
  onUpdateAnswer,
  onRemoveQuestion,
}: GroupCardProps) {
  return (
    <div className="p-4 border border-slate-200 rounded-lg bg-slate-50 relative group/g">
      {/* Remove Group Button */}
      <button
        onClick={onRemoveGroup}
        title="Remove Group"
        className="absolute top-2 right-2 p-2 text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover/g:opacity-100 transition-opacity"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      {/* Group Label */}
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
        Group {gIndex + 1}
      </p>

      {/* Instructions */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Instructions (Optional)
        </label>
        <RichTextEditor
          value={group.instructions || ""}
          onChange={(val: string) => onUpdateGroup("instructions", val)}
        />
      </div>

      {/* Questions list */}
      <h4 className="font-medium text-sm text-slate-700 mb-3 border-b pb-1">
        Questions
      </h4>
      <div className="space-y-6 pl-4 border-l-2 border-slate-200">
        {group.questions.map((q, qIndex) => (
          <QuestionItem
            key={qIndex}
            question={{ ...q, questionOrder: questionOffset + qIndex + 1 }}
            qIndex={qIndex}
            onUpdateField={(field, value) =>
              onUpdateQuestion(qIndex, field, value)
            }
            onUpdateAnswer={(field, value) =>
              onUpdateAnswer(qIndex, field, value)
            }
            onRemove={() => onRemoveQuestion(qIndex)}
            onTypeChange={(newType) =>
              onUpdateQuestion(qIndex, "questionType", newType)
            }
          />
        ))}
      </div>

      {/* Add Question Button */}
      <button
        onClick={onAddQuestion}
        className="mt-6 flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50/50 hover:bg-blue-100 px-4 py-2.5 rounded-lg transition-colors w-full justify-center border border-blue-200 border-dashed"
      >
        <PlusCircle className="w-4 h-4" />
        Add Question to Group
      </button>
    </div>
  );
}
