"use client";

import MultipleChoiceQuestion from "@/app/(admin)/_components/questions/MultipleChoiceQuestion";
import FillInBlankQuestion from "@/app/(admin)/_components/questions/FillInBlankQuestion";
import MatchingQuestion from "@/app/(admin)/_components/questions/MatchingQuestion";
import HeadingMatchingQuestion from "@/app/(admin)/_components/questions/HeadingMatchingQuestion";
import SentenceEndingQuestion from "@/app/(admin)/_components/questions/SentenceEndingQuestion";
import MatchingFeaturesQuestion from "@/app/(admin)/_components/questions/MatchingFeaturesQuestion";
import ImageUploader from "./ImageUploader";

// Canonical list of question types shown in the dropdown
export const QUESTION_TYPES = [
  { value: "multiple_choice", label: "Multiple Choice" },
  { value: "fill_in_blank", label: "Fill in the Blank" },
  { value: "matching", label: "Matching" },
  { value: "true_false_not_given", label: "True / False / Not Given" },
  { value: "yes_no_not_given", label: "Yes / No / Not Given" },
  { value: "matching_heading", label: "Matching Headings" },
  { value: "sentence_ending", label: "Sentence Endings" },
  { value: "matching_features", label: "Matching Features" },
  { value: "diagram_labelling", label: "Diagram Labelling" },
  { value: "map_labelling", label: "Map Labelling" },
] as const;

/** Question types that require an image to be attached */
const IMAGE_QUESTION_TYPES = ["diagram_labelling", "map_labelling"];

interface QuestionData {
  questionOrder: number;
  questionType: string;
  questionText: string;
  config: any;
  explanation?: string;
  answer: { correctAnswers: string[]; caseSensitive: boolean };
}

interface QuestionItemProps {
  question: QuestionData;
  qIndex: number;
  onUpdateField: (field: string, value: any) => void;
  onUpdateAnswer: (field: string, value: any) => void;
  onRemove: () => void;
  onTypeChange: (newType: string) => void;
}

export default function QuestionItem({
  question: q,
  qIndex,
  onUpdateField,
  onUpdateAnswer,
  onRemove,
  onTypeChange,
}: QuestionItemProps) {
  const commonProps = {
    order: q.questionOrder || qIndex + 1,
    questionText: q.questionText,
    correctAnswers: q.answer?.correctAnswers || [""],
    caseSensitive: q.answer?.caseSensitive || false,
    onUpdateField,
    onUpdateAnswer,
    onRemove,
  };

  return (
    <div className="relative">
      {/* Type Selector */}
      <div className="flex items-center gap-2 mb-3 bg-white p-2 rounded-lg w-fit border border-slate-200 shadow-sm">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-2">
          Type:
        </span>
        <select
          value={q.questionType}
          onChange={(e) => onTypeChange(e.target.value)}
          className="border-0 rounded px-3 py-1 text-sm font-medium text-slate-700 outline-none cursor-pointer hover:bg-slate-50 transition-colors"
        >
          {QUESTION_TYPES.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Question Component */}
      {["multiple_choice", "true_false_not_given", "yes_no_not_given"].includes(
        q.questionType,
      ) && (
        <MultipleChoiceQuestion
          {...commonProps}
          questionType={q.questionType}
          options={
            q.config?.options ||
            (q.questionType === "true_false_not_given"
              ? ["TRUE", "FALSE", "NOT GIVEN"]
              : q.questionType === "yes_no_not_given"
                ? ["YES", "NO", "NOT GIVEN"]
                : ["", "", "", ""])
          }
        />
      )}

      {q.questionType === "fill_in_blank" && (
        <FillInBlankQuestion {...commonProps} />
      )}

      {q.questionType === "matching" && (
        <MatchingQuestion
          {...commonProps}
          options={q.config?.options || ["", "", ""]}
        />
      )}

      {q.questionType === "matching_heading" && (
        <HeadingMatchingQuestion
          {...commonProps}
          options={q.config?.options || ["", "", "", ""]}
        />
      )}

      {q.questionType === "sentence_ending" && (
        <SentenceEndingQuestion
          {...commonProps}
          options={q.config?.options || ["", "", ""]}
        />
      )}

      {q.questionType === "matching_features" && (
        <MatchingFeaturesQuestion
          {...commonProps}
          options={q.config?.options || ["", "", ""]}
        />
      )}

      {/* Image-based question types: show FillInBlank for answers + image uploader */}
      {IMAGE_QUESTION_TYPES.includes(q.questionType) && (
        <div className="space-y-4">
          <FillInBlankQuestion {...commonProps} />
          <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              {q.questionType === "diagram_labelling" ? "Diagram Image" : "Map Image"}
            </p>
            <ImageUploader
              value={q.config?.imageUrl || ""}
              onChange={(url) =>
                onUpdateField("config", { ...q.config, imageUrl: url })
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}
