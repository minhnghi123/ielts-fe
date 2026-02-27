import { Trash2, Info } from "lucide-react";

interface FillInBlankQuestionProps {
    order: number;
    questionText: string;
    correctAnswers: string[];
    caseSensitive: boolean;
    onUpdateField: (field: string, value: any) => void;
    onUpdateAnswer: (field: string, value: any) => void;
    onRemove: () => void;
}

export default function FillInBlankQuestion({
    order,
    questionText,
    correctAnswers,
    caseSensitive,
    onUpdateField,
    onUpdateAnswer,
    onRemove
}: FillInBlankQuestionProps) {

    return (
        <div className="border border-slate-200 rounded-lg p-5 bg-white relative group shadow-sm">
            {/* Header & Delete Action */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <span className="bg-blue-100 text-blue-800 font-bold px-2.5 py-1 rounded text-sm">
                        Q{order}
                    </span>
                    <span className="text-sm font-semibold text-slate-500 uppercase tracking-widest">
                        Fill in the Blank
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
                {/* Question Text */}
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-medium text-slate-700">Question Text</label>
                    </div>
                    <textarea
                        value={questionText}
                        onChange={(e) => onUpdateField('questionText', e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                        placeholder="e.g. The capital of France is ______."
                    />
                </div>

                {/* Answers Configuration */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Accepted Answers</label>
                            <div className="group relative cursor-help">
                                <Info className="w-4 h-4 text-blue-400" />
                                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 bg-slate-800 text-white text-xs p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                    Divide multiple accepted valid answers with a pipe character "|". Example: "Paris | paris | The City of Light"
                                </div>
                            </div>
                        </div>

                        <input
                            value={correctAnswers.join(' | ')}
                            onChange={(e) => {
                                const values = e.target.value.split('|').map(v => v.trim()).filter(v => v);
                                onUpdateAnswer('correctAnswers', values);
                            }}
                            className="w-full border border-slate-300 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-green-500 bg-white placeholder:text-slate-300"
                            placeholder="e.g. True | T | YES"
                        />
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={caseSensitive}
                                onChange={(e) => onUpdateAnswer('caseSensitive', e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                        <span className="text-sm font-medium text-slate-600">
                            Strict Case Sensitivity Formatting Required
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
