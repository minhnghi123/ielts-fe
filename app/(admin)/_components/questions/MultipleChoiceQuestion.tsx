import { Trash2 } from "lucide-react";

interface MultipleChoiceQuestionProps {
    order: number;
    questionText: string;
    correctAnswers: string[];
    caseSensitive: boolean;
    options: string[]; // specific config for MCQ
    onUpdateField: (field: string, value: any) => void;
    onUpdateAnswer: (field: string, value: any) => void;
    onRemove: () => void;
}

export default function MultipleChoiceQuestion({
    order,
    questionText,
    correctAnswers,
    options,
    onUpdateField,
    onUpdateAnswer,
    onRemove
}: MultipleChoiceQuestionProps) {

    // MCQ specific handler for changing options array
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
                    <span className="bg-blue-100 text-blue-800 font-bold px-2.5 py-1 rounded text-sm">
                        Q{order}
                    </span>
                    <span className="text-sm font-semibold text-slate-500 uppercase tracking-widest">
                        Multiple Choice
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
                    <label className="block text-sm font-medium text-slate-700 mb-1">Question Text</label>
                    <textarea
                        value={questionText}
                        onChange={(e) => onUpdateField('questionText', e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                        placeholder="Type the question here..."
                    />
                </div>

                {/* Multiple Choice Options Configuration */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-3">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Answer Options</label>

                    {(options || []).map((opt, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <span className="text-sm font-medium text-slate-500 w-6">
                                {String.fromCharCode(65 + i)}.
                            </span>
                            <input
                                value={opt}
                                onChange={(e) => handleOptionChange(i, e.target.value)}
                                className="flex-1 border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder={`Option ${String.fromCharCode(65 + i)}`}
                            />
                            {/* Set Correct Answer Radio (binds to correctAnswers element 0 for single select) */}
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name={`correct-answer-q${order}`}
                                    className="w-4 h-4 text-green-600 focus:ring-green-500"
                                    checked={correctAnswers[0] === String.fromCharCode(65 + i)}
                                    onChange={() => onUpdateAnswer('correctAnswers', [String.fromCharCode(65 + i)])}
                                />
                                <span className="text-xs text-slate-600">Correct</span>
                            </label>

                            <button onClick={() => removeOption(i)} className="text-slate-400 hover:text-red-500 p-1">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    <button
                        onClick={addOption}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded transition-colors"
                    >
                        + Add Option
                    </button>
                </div>
            </div>
        </div>
    );
}
