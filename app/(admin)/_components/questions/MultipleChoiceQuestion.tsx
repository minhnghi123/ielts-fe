import { Trash2 } from "lucide-react";

interface MultipleChoiceQuestionProps {
    order: number;
    questionText: string;
    correctAnswers: string[];
    caseSensitive: boolean;
    options: string[]; // specific config for MCQ
    questionType?: string;
    onUpdateField: (field: string, value: any) => void;
    onUpdateAnswer: (field: string, value: any) => void;
    onRemove: () => void;
}

export default function MultipleChoiceQuestion({
    order,
    questionText,
    correctAnswers,
    options,
    questionType,
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

    const handleCorrectAnswerToggle = (letter: string) => {
        if (correctAnswers.includes(letter)) {
            onUpdateAnswer('correctAnswers', correctAnswers.filter(a => a !== letter));
        } else {
            onUpdateAnswer('correctAnswers', [...correctAnswers, letter]);
        }
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
                        {questionType === 'true_false_not_given' ? 'True / False / Not Given'
                            : questionType === 'yes_no_not_given' ? 'Yes / No / Not Given'
                                : 'Multiple Choice'}
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
                    <label className="block text-sm font-medium text-slate-700 mb-1">Question Text (Optional)</label>
                    <textarea
                        value={questionText}
                        onChange={(e) => onUpdateField('questionText', e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                        placeholder="Type the question here..."
                    />
                </div>

                {/* Multiple Choice Options Configuration */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-3">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Answer Options</label>
                    <p className="text-xs text-slate-500 mb-3">You can select one or more correct answers.</p>

                    {(options || []).map((opt, i) => {
                        const letter = String.fromCharCode(65 + i);
                        const isCorrect = correctAnswers.includes(letter);
                        return (
                            <div key={i} className={`flex items-center gap-3 p-2 rounded border ${isCorrect ? 'border-green-200 bg-green-50/50' : 'border-transparent'}`}>
                                <span className="text-sm font-medium text-slate-500 w-6">
                                    {letter}.
                                </span>
                                <input
                                    value={opt}
                                    onChange={(e) => handleOptionChange(i, e.target.value)}
                                    className="flex-1 border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                    placeholder={`Option ${letter}`}
                                />
                                {/* Set Correct Answer Checkbox */}
                                <label className="flex items-center gap-2 cursor-pointer ml-2">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 text-green-600 focus:ring-green-500 rounded border-slate-300"
                                        checked={isCorrect}
                                        onChange={() => handleCorrectAnswerToggle(letter)}
                                    />
                                    <span className={`text-xs ${isCorrect ? 'text-green-700 font-semibold' : 'text-slate-500'}`}>Correct</span>
                                </label>

                                <button onClick={() => removeOption(i)} className="text-slate-400 hover:text-red-500 p-1 ml-2">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        );
                    })}
                    <button
                        onClick={addOption}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded transition-colors mt-2"
                    >
                        + Add Option
                    </button>
                </div>
            </div>
        </div>
    );
}
