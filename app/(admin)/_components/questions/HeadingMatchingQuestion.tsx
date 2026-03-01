import { Trash2 } from "lucide-react";

const ROMAN = [
  "I","II","III","IV","V","VI","VII","VIII","IX","X",
  "XI","XII","XIII","XIV","XV","XVI","XVII","XVIII","XIX","XX",
];

interface HeadingMatchingQuestionProps {
  order: number;
  questionText: string;
  correctAnswers: string[];
  /** Shared heading pool — managed at group level, passed down here */
  options: string[];
  onUpdateField: (field: string, value: any) => void;
  onUpdateAnswer: (field: string, value: any) => void;
  onRemove: () => void;
}

export default function HeadingMatchingQuestion({
  order,
  questionText,
  correctAnswers,
  options,
  onUpdateField,
  onUpdateAnswer,
  onRemove,
}: HeadingMatchingQuestionProps) {
  const selectedNumeral = correctAnswers[0] ?? "";

  return (
    <div className="border border-orange-200 rounded-lg p-4 bg-white shadow-sm">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2.5">
          <span className="bg-orange-100 text-orange-800 font-bold px-2.5 py-1 rounded text-sm">
            Q{order}
          </span>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Matching Heading
          </span>
        </div>
        <button
          onClick={onRemove}
          className="text-slate-400 hover:text-red-500 transition-colors p-1"
          title="Remove"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Paragraph label */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">
            Paragraph / Section
          </label>
          <input
            value={questionText}
            onChange={(e) => onUpdateField("questionText", e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400 bg-white"
            placeholder="e.g. Paragraph A"
          />
        </div>

        {/* Correct heading picker */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">
            Correct Heading
          </label>

          {options.length === 0 ? (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-orange-50 border border-orange-200">
              <span className="text-xs text-orange-600 font-medium">
                ⚠ Define headings in the group&apos;s Heading Pool above first.
              </span>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {options.map((headingText, i) => {
                const numeral = ROMAN[i] ?? String(i + 1);
                const isSelected = selectedNumeral === numeral;
                return (
                  <button
                    key={numeral}
                    type="button"
                    onClick={() => onUpdateAnswer("correctAnswers", [numeral])}
                    title={headingText}
                    className={`min-w-[44px] h-10 px-3 rounded-lg font-bold text-sm border-2 transition-all ${
                      isSelected
                        ? "bg-emerald-500 text-white border-emerald-500 shadow ring-2 ring-emerald-200 scale-105"
                        : "bg-white text-slate-600 border-slate-300 hover:border-orange-400 hover:text-orange-700"
                    }`}
                  >
                    {numeral}
                  </button>
                );
              })}
            </div>
          )}

          {selectedNumeral && options.length > 0 && (
            <p className="mt-2 text-xs text-emerald-700 font-semibold">
              ✓ {selectedNumeral} — {options[ROMAN.indexOf(selectedNumeral)] ?? ""}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
