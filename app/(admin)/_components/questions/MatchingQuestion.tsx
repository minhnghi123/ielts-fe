import { Trash2 } from "lucide-react";

interface MatchingQuestionProps {
    order: number;
    questionText: string;
    correctAnswers: string[];
    options: string[]; // Options to pick from (A, B, C...)
    onUpdateField: (field: string, value: any) => void;
    onUpdateAnswer: (field: string, value: any) => void;
    onRemove: () => void;
}

export default function MatchingQuestion({
    order,
    questionText,
    correctAnswers,
    options,
    onUpdateField,
    onUpdateAnswer,
    onRemove
}: MatchingQuestionProps) {

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

    return (
        <div className="border border-slate-200 rounded-lg p-5 bg-white relative group shadow-sm">
            {/* Header & Delete Action */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <span className="bg-purple-100 text-purple-800 font-bold px-2.5 py-1 rounded text-sm">
                        Q{order}
                    </span>
                    <span className="text-sm font-semibold text-slate-500 uppercase tracking-widest">
                        Matching
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
                {/* Statement/Prompt Text */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Statement to be Matched
                    </label>
                    <textarea
                        value={questionText}
                        onChange={(e) => onUpdateField('questionText', e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-purple-500 min-h-[60px]"
                        placeholder="e.g. This paragraph mentions the discovery of water on Mars."
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Options Configuration */}
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-3">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                            Pool of Options
                        </label>

                        {(options || []).map((opt, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <span className="text-sm font-bold text-slate-600 bg-white border border-slate-200 w-8 h-8 rounded flex items-center justify-center shrink-0">
                                    {String.fromCharCode(65 + i)}
                                </span>
                                <input
                                    value={opt}
                                    onChange={(e) => handleOptionChange(i, e.target.value)}
                                    className="flex-1 border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                    placeholder={`Option statement...`}
                                />
                                <button onClick={() => removeOption(i)} className="text-slate-400 hover:text-red-500 p-1">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        <button
                            onClick={addOption}
                            className="text-xs font-semibold text-purple-600 hover:text-purple-700 bg-purple-100 hover:bg-purple-200 px-3 py-1.5 rounded transition-colors"
                        >
                            + Add Option
                        </button>
                    </div>

                    {/* Correct Match Mapping */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                            Correct Match
                        </label>
                        <div className="bg-emerald-50/50 p-4 rounded-lg border border-emerald-100/50 flex flex-col items-center justify-center h-[calc(100%-24px)] min-h-[120px]">
                            <p className="text-sm text-slate-600 mb-4 text-center">
                                Select the correct option letter for this statement:
                            </p>

                            <div className="flex flex-wrap gap-2 justify-center">
                                {(options || []).map((_, i) => {
                                    const letter = String.fromCharCode(65 + i);
                                    const isSelected = correctAnswers[0] === letter;
                                    return (
                                        <button
                                            key={letter}
                                            onClick={() => onUpdateAnswer('correctAnswers', [letter])}
                                            className={`w-12 h-12 rounded-lg font-bold text-lg transition-all ${isSelected
                                                    ? 'bg-emerald-500 text-white shadow-md scale-110 ring-2 ring-emerald-200'
                                                    : 'bg-white border-2 border-slate-200 text-slate-500 hover:border-emerald-300 hover:text-emerald-500'
                                                }`}
                                        >
                                            {letter}
                                        </button>
                                    );
                                })}
                                {(!options || options.length === 0) && (
                                    <div className="text-xs text-slate-400 italic">Add options first</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
