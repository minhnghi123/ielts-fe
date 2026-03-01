import { Trash2 } from "lucide-react";

interface MatchingFeaturesQuestionProps {
  order: number;
  questionText: string;
  correctAnswers: string[];
  caseSensitive: boolean;
  /** Shared features pool — managed at group level */
  options: string[];
  onUpdateField: (field: string, value: any) => void;
  onUpdateAnswer: (field: string, value: any) => void;
  onRemove: () => void;
}

export default function MatchingFeaturesQuestion({
  order,
  questionText,
  correctAnswers,
  options,
  onUpdateField,
  onUpdateAnswer,
  onRemove,
}: MatchingFeaturesQuestionProps) {
  const selected = correctAnswers[0] ?? "";

  return (
    <div className="border border-violet-200 rounded-lg p-4 bg-white shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2.5">
          <span className="bg-violet-100 text-violet-800 font-bold px-2.5 py-1 rounded text-sm">
            Q{order}
          </span>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Matching Features
          </span>
        </div>
        <button onClick={onRemove} className="text-slate-400 hover:text-red-500 p-1 transition-colors" title="Remove">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">
            Statement
          </label>
          <textarea
            value={questionText}
            onChange={(e) => onUpdateField("questionText", e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-400 min-h-[56px] resize-none"
            placeholder="e.g. suggested a link between diet and cognitive ability"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">
            Correct Feature
          </label>
          {options.length === 0 ? (
            <div className="px-3 py-2.5 rounded-lg bg-violet-50 border border-violet-200">
              <span className="text-xs text-violet-600 font-medium">
                ⚠ Define features in the group&apos;s Features Pool above first.
              </span>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {options.map((featureText, i) => {
                const letter = String.fromCharCode(65 + i);
                const isSelected = selected === letter;
                return (
                  <button
                    key={letter}
                    type="button"
                    onClick={() => onUpdateAnswer("correctAnswers", [letter])}
                    title={featureText}
                    className={`min-w-[40px] h-10 px-3 rounded-lg font-bold text-sm border-2 transition-all ${
                      isSelected
                        ? "bg-emerald-500 text-white border-emerald-500 shadow ring-2 ring-emerald-200 scale-105"
                        : "bg-white text-slate-600 border-slate-300 hover:border-violet-400 hover:text-violet-700"
                    }`}
                  >
                    {letter}
                  </button>
                );
              })}
            </div>
          )}
          {selected && options.length > 0 && (
            <p className="mt-2 text-xs text-emerald-700 font-semibold">
              ✓ {selected} — {options[selected.charCodeAt(0) - 65] ?? ""}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
