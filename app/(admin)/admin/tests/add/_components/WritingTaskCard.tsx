"use client";

import { useState } from "react";
import { PlusCircle, Trash2, Clock, Image as ImageIcon } from "lucide-react";
import ImageUploader from "./ImageUploader";

export interface WritingTaskData {
  taskNumber: number;
  promptText: string;
  timeLimit: number;
  mediaUrl: string;
  rubric: string[];
}

const RUBRIC_OPTIONS = [
  "Task Achievement",
  "Coherence & Cohesion",
  "Lexical Resource",
  "Grammatical Range & Accuracy",
];

interface Props {
  task: WritingTaskData;
  onChange: (field: keyof WritingTaskData, value: unknown) => void;
  onRemove?: () => void;
  removable?: boolean;
}

export default function WritingTaskCard({ task, onChange, onRemove, removable }: Props) {
  const [showRubric, setShowRubric] = useState(false);
  console.log(task.mediaUrl)
  const toggleRubric = (item: string) => {
    const next = task.rubric.includes(item)
      ? task.rubric.filter((r) => r !== item)
      : [...task.rubric, item];
    onChange("rubric", next);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {/* Card Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-sm">
            {task.taskNumber}
          </span>
          <h3 className="text-lg font-semibold text-slate-800">
            Writing Task {task.taskNumber}
          </h3>
          <span className="text-xs text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
            {task.taskNumber === 1 ? "Report / Graph Description" : "Essay"}
          </span>
        </div>
        {removable && onRemove && (
          <button
            onClick={onRemove}
            className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="p-6 space-y-5">
        {/* Prompt */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Prompt / Task Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={task.promptText}
            onChange={(e) => onChange("promptText", e.target.value)}
            rows={5}
            placeholder={
              task.taskNumber === 1
                ? "The chart below shows... Summarize the information by selecting and reporting the main features."
                : "Some people believe that... To what extent do you agree or disagree?"
            }
            className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-y transition-shadow"
          />
        </div>

        {/* Time Limit */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-400" />
              Time Limit (minutes)
            </span>
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={1}
              max={120}
              value={task.timeLimit}
              onChange={(e) => onChange("timeLimit", Number(e.target.value))}
              className="w-28 border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none text-center font-semibold"
            />
            <span className="text-sm text-slate-500">
              {task.taskNumber === 1 ? "Recommended: 20 min" : "Recommended: 40 min"}
            </span>
          </div>
        </div>

        {/* Media Upload (Task 1 only) */}
        {task.taskNumber === 1 && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-slate-400" />
                Chart / Graph Image (optional)
              </span>
            </label>
            <ImageUploader
              value={task.mediaUrl}
              onChange={(url) => onChange("mediaUrl", url)}
            />
          </div>
        )}

        {/* Rubric */}
        <div>
          <button
            type="button"
            onClick={() => setShowRubric(!showRubric)}
            className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            {showRubric ? "Hide" : "Configure"} Grading Rubric (optional)
          </button>
          {showRubric && (
            <div className="mt-3 p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <p className="text-xs text-slate-500 mb-3">
                Select the criteria that will be used for grading this task:
              </p>
              {RUBRIC_OPTIONS.map((item) => (
                <label key={item} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={task.rubric.includes(item)}
                    onChange={() => toggleRubric(item)}
                    className="w-4 h-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-slate-700 group-hover:text-slate-900">
                    {item}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
