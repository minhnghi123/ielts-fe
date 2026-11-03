"use client";

import MultipleChoiceQuestion from "@/app/(admin)/_components/questions/MultipleChoiceQuestion";
import FillInBlankQuestion from "@/app/(admin)/_components/questions/FillInBlankQuestion";
import MatchingQuestion from "@/app/(admin)/_components/questions/MatchingQuestion";
import HeadingMatchingQuestion from "@/app/(admin)/_components/questions/HeadingMatchingQuestion";
import SentenceEndingQuestion from "@/app/(admin)/_components/questions/SentenceEndingQuestion";
import MatchingFeaturesQuestion from "@/app/(admin)/_components/questions/MatchingFeaturesQuestion";
import QuestionMetaFields from "@/app/(admin)/_components/questions/QuestionMetaFields";
import { QUESTION_TYPE_OPTIONS } from "@/lib/question-types";
import type { EvidenceAnchor } from "@/lib/types";

/** Canonical list of question types shown in the dropdown (see lib/question-types.ts). */
export const QUESTION_TYPES = QUESTION_TYPE_OPTIONS;

interface QuestionData {
  questionOrder: number;
  questionType: string;
  questionText: string;
  config: any;
  explanation?: string;
  difficulty?: number | null;
  evidenceAnchor?: EvidenceAnchor | null;
  answer: { correctAnswers: string[]; caseSensitive: boolean };
}

interface QuestionItemProps {
  question: QuestionData;
  qIndex: number;
  onUpdateField: (field: string, value: any) => void;
  onUpdateAnswer: (field: string, value: any) => void;
  onRemove: () => void;
  onTypeChange: (newType: string) => void;
  /** reading | listening — decides the evidence form */
  skill?: string;
}

export default function QuestionItem({
  question: q,
  qIndex,
  onUpdateField,
  onUpdateAnswer,
  onRemove,
  onTypeChange,
  skill,
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

      {(q.questionType === "fill_in_blank" || q.questionType === "short_answer") && (
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

      <QuestionMetaFields
        questionType={q.questionType}
        explanation={q.explanation ?? ""}
        difficulty={q.difficulty}
        evidenceAnchor={q.evidenceAnchor}
        skill={skill}
        onChange={(field, value) => onUpdateField(field, value)}
      />
    </div>
  );
}
