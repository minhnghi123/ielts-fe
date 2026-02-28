import { Trash2 } from "lucide-react";

interface HeadingMatchingQuestionProps {
    order: number;
    questionText: string;
    correctAnswers: string[];
    options: string[]; // List of headings (i, ii, iii...)
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
    onRemove
}: HeadingMatchingQuestionProps) {

    const handleOptionChange = (index: number, val: string) => {
        const newOptions = [...(options || [])];
        newOptions[index] = val;
        onUpdateField("config", { options: newOptions });
    };

    const addOption = () => {
        onUpdateField("config", { options: [...(options || []), ""] });
    };

    const removeOption = (index: number) => {
        const newOptions = (options || []).filter((_, i) => i !== index);
        onUpdateField("config", { options: newOptions });
    };

    // Helper to generate roman numerals for headings (i, ii, iii, iv, v, vi...)
    const toRoman = (num: number): string => {
        const roman: Record<string, number> = {
            m: 1000, cm: 900, d: 500, cd: 400,
            c: 100, xc: 90, l: 50, xl: 40,
            x: 10, ix: 9, v: 5, iv: 4, i: 1
        };
        let str = '';
        for (let i of Object.keys(roman)) {
            let q = Math.floor(num / roman[i]);
            num -= q * roman[i];
            str += i.repeat(q);
        }
        return str;
    };

    return (
        <div className="border border-slate-200 rounded-lg p-5 bg-white relative group shadow-sm">
            {/* Header & Delete Action */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <span className="bg-orange-100 text-orange-800 font-bold px-2.5 py-1 rounded text-sm">
                        Q{order}
                    </span>
                    <span className="text-sm font-semibold text-slate-500 uppercase tracking-widest">
                        Heading Matching
                    </span>
                </div>
                <button
                    onClick={onRemove}
                    className="text-slate-400 hover:text-red-500 transition-colors p-1"
                    title="Remove Question"
                >
                    <Trash2 className="w-5 h-5" />
                </button>
            </div>

            <div className="space-y-6">
                {/* Paragraph/Section Identifier */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Paragraph/Section (e.g. Paragraph A) (Optional)
                    </label>
                    <input
                        value={questionText}
                        onChange={(e) => onUpdateField('questionText', e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="e.g. Paragraph A"
                    />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {/* Headings List Configuration */}
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-3">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                            List of Headings
                        </label>

                        {(options || []).map((opt, i) => {
                            const numeral = toRoman(i + 1);
                            return (
                                <div key={i} className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-slate-600 bg-white border border-slate-200 w-8 h-8 rounded flex items-center justify-center shrink-0">
                                        {numeral}
                                    </span>
                                    <input
                                        value={opt}
                                        onChange={(e) => handleOptionChange(i, e.target.value)}
                                        className="flex-1 border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                                        placeholder={`Heading statement...`}
                                    />
                                    <button onClick={() => removeOption(i)} className="text-slate-400 hover:text-red-500 p-1">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            );
                        })}
                        <button
                            onClick={addOption}
                            className="text-xs font-semibold text-orange-600 hover:text-orange-700 bg-orange-100 hover:bg-orange-200 px-3 py-1.5 rounded transition-colors mt-2"
                        >
                            + Add Heading
                        </button>
                    </div>

                    {/* Correct Match Mapping */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                            Correct Heading
                        </label>
                        <div className="bg-emerald-50/50 p-4 rounded-lg border border-emerald-100/50 flex flex-col items-center justify-center h-[calc(100%-24px)] min-h-[120px]">
                            <p className="text-sm text-slate-600 mb-4 text-center">
                                Select the correct heading numeral for {questionText || "this paragraph"}:
                            </p>

                            <div className="flex flex-wrap gap-2 justify-center">
                                {(options || []).map((_, i) => {
                                    const numeral = toRoman(i + 1);
                                    const isSelected = correctAnswers[0] === numeral;
                                    return (
                                        <button
                                            key={numeral}
                                            onClick={() => onUpdateAnswer('correctAnswers', [numeral])}
                                            className={`min-w-[48px] h-12 px-3 rounded-lg font-bold text-lg transition-all ${isSelected
                                                ? 'bg-emerald-500 text-white shadow-md scale-110 ring-2 ring-emerald-200'
                                                : 'bg-white border-2 border-slate-200 text-slate-500 hover:border-emerald-300 hover:text-emerald-500'
                                                }`}
                                        >
                                            {numeral}
                                        </button>
                                    );
                                })}
                                {(!options || options.length === 0) && (
                                    <div className="text-xs text-slate-400 italic">Add headings first</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
