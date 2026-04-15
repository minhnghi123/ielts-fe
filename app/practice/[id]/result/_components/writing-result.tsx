import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle2, ChevronRight, PenTool } from "lucide-react";

interface WritingSuggestion {
    id: number;
    original_text: string;
    error_type: string;
    correction: string;
    explanation: string;
}

interface TaskFeedback {
    annotated_html: string;
    task_response: number;
    coherence: number;
    lexical: number;
    grammar: number;
    overall_band: number;
    suggestions: WritingSuggestion[];
}

interface WritingResultProps {
    gradingData: {
        id: string;
        overallBand: number;
        feedback: {
            task1: TaskFeedback;
            task2?: TaskFeedback | null;
            overall_band: number;
        };
    };
}

export function WritingResult({ gradingData }: WritingResultProps) {
    const [activeTask, setActiveTask] = useState<"task1" | "task2">("task1");
    const [activeSuggestionId, setActiveSuggestionId] = useState<number | null>(null);
    // console.log(gradingData);
    const t1 = gradingData.feedback.task1;
    const t2 = gradingData.feedback.task2;

    const currentTask = activeTask === "task1" ? t1 : (t2 || t1);

    // References for scrolling
    const leftPaneRef = useRef<HTMLDivElement>(null);
    const rightPaneRef = useRef<HTMLDivElement>(null);

    // Add click listeners to annotated spans
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.classList.contains("ielts-error")) {
                const idAttr = target.getAttribute("data-id");
                if (idAttr) {
                    const id = parseInt(idAttr, 10);
                    setActiveSuggestionId(id);
                    // Scroll right pane to the suggestion
                    const element = document.getElementById(`suggestion-${id}`);
                    if (element) {
                        element.scrollIntoView({ behavior: "smooth", block: "center" });
                    }
                }
            }
        };

        const leftPane = leftPaneRef.current;
        if (leftPane) {
            leftPane.addEventListener("click", handleClick);
        }

        return () => {
            if (leftPane) {
                leftPane.removeEventListener("click", handleClick);
            }
        };
    }, [activeTask]);

    const renderBandScore = (label: string, score: number) => (
        <div className="flex flex-col items-center justify-center p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 text-center">{label}</span>
            <span className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100">{score.toFixed(1)}</span>
        </div>
    );

    const getErrorBadgeColor = (type: string) => {
        const t = type.toLowerCase();
        if (t.includes('grammar')) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
        if (t.includes('lexical') || t.includes('vocabulary')) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
        if (t.includes('cohe')) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
        if (t.includes('task')) return 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 border-violet-200 dark:border-violet-800';
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    };

    return (
        <div className="flex flex-col h-full bg-slate-50/50 dark:bg-slate-950">
            {/* Header / Score Overview */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 sm:p-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                                <span className="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 p-2 rounded-xl">
                                    <PenTool className="w-6 h-6" />
                                </span>
                                Writing Assessment
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-1">Review your essays, scores, and detailed AI feedback.</p>
                        </div>

                        <div className="flex items-center gap-4 bg-violet-50 dark:bg-violet-900/20 px-6 py-4 rounded-2xl border border-violet-100 dark:border-violet-800/30">
                            <div className="text-center">
                                <p className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-widest mb-1">Overall Band</p>
                                <p className="text-4xl font-black text-violet-700 dark:text-violet-300 leading-none">
                                    {Number(gradingData.overallBand).toFixed(1)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Task Tabs */}
                    {t2 && (
                        <div className="mt-8">
                            <Tabs value={activeTask} onValueChange={(v) => setActiveTask(v as "task1" | "task2")}>
                                <TabsList className="grid w-full max-w-md grid-cols-2 bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-xl">
                                    <TabsTrigger value="task1" className="rounded-lg text-sm font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-violet-700 dark:data-[state=active]:text-violet-300 data-[state=active]:shadow-sm transition-all">
                                        Task 1 (Band {t1.overall_band.toFixed(1)})
                                    </TabsTrigger>
                                    <TabsTrigger value="task2" className="rounded-lg text-sm font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-violet-700 dark:data-[state=active]:text-violet-300 data-[state=active]:shadow-sm transition-all">
                                        Task 2 (Band {t2.overall_band.toFixed(1)})
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content Area: Split View */}
            <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">

                {/* LEFT PANE: Annotated Essay */}
                <div className="lg:col-span-7 flex flex-col min-h-0 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">

                    {/* Score Breakdown Bar */}
                    <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Criterion Scores</h3>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-slate-500">Task Band:</span>
                                <span className="text-lg font-black text-violet-600 dark:text-violet-400">{currentTask.overall_band.toFixed(1)}</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {renderBandScore("Task Response", currentTask.task_response)}
                            {renderBandScore("Coherence", currentTask.coherence)}
                            {renderBandScore("Lexical", currentTask.lexical)}
                            {renderBandScore("Grammar", currentTask.grammar)}
                        </div>
                    </div>

                    {/* Essay Content */}
                    <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar relative" ref={leftPaneRef}>
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Your Essay</h3>

                        <div className="prose prose-slate dark:prose-invert max-w-none prose-p:leading-relaxed prose-p:text-lg">
                            {/* Injecting the HTML. The custom CSS classes are handled via Tailwind below or global CSS */}
                            <style dangerouslySetInnerHTML={{
                                __html: `
                                .ielts-good { 
                                    background-color: rgba(34, 197, 94, 0.15); 
                                    border-bottom: 2px solid rgba(34, 197, 94, 0.4); 
                                    border-radius: 4px;
                                    padding: 0 4px;
                                }
                                .dark .ielts-good {
                                    background-color: rgba(34, 197, 94, 0.2); 
                                }
                                .ielts-error { 
                                    text-decoration-line: underline;
                                    text-decoration-style: wavy;
                                    text-decoration-color: rgba(239, 68, 68, 0.8);
                                    text-decoration-thickness: 2px;
                                    background-color: rgba(239, 68, 68, 0.1);
                                    cursor: pointer;
                                    border-radius: 2px;
                                    padding: 0 2px;
                                    transition: all 0.2s;
                                }
                                .ielts-error:hover, .ielts-error.active {
                                    background-color: rgba(239, 68, 68, 0.2);
                                    text-decoration-color: rgb(239, 68, 68);
                                }
                            `}} />

                            <div
                                dangerouslySetInnerHTML={{ __html: currentTask.annotated_html || '<p>No content provided</p>' }}
                                className="font-serif text-slate-700 dark:text-slate-300"
                            />
                        </div>
                    </div>
                </div>

                {/* RIGHT PANE: Interactive Feedback Board */}
                <div
                    className="lg:col-span-5 flex flex-col min-h-0 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden"
                >
                    <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-3 shadow-sm z-10">
                        <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-500" />
                        </div>
                        <h3 className="font-bold text-slate-800 dark:text-slate-200">Improvements</h3>
                        <Badge variant="secondary" className="ml-auto bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            {currentTask.suggestions?.length || 0} Total
                        </Badge>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 sm:p-5 custom-scrollbar space-y-4" ref={rightPaneRef}>
                        {(!currentTask.suggestions || currentTask.suggestions.length === 0) ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center">
                                <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-4 opacity-50" />
                                <p className="text-lg font-medium text-slate-600 dark:text-slate-300">Great job!</p>
                                <p className="text-sm mt-1">No major improvements suggested for this task.</p>
                            </div>
                        ) : (
                            currentTask.suggestions.map((suggestion) => {
                                const isActive = activeSuggestionId === suggestion.id;

                                return (
                                    <div
                                        key={suggestion.id}
                                        id={`suggestion-${suggestion.id}`}
                                        className={`transition-all duration-300 rounded-2xl border p-4 sm:p-5 bg-white dark:bg-slate-900 cursor-pointer hover:-translate-y-0.5 hover:shadow-md ${isActive
                                            ? 'ring-2 ring-violet-500 dark:ring-violet-400 border-transparent shadow-lg shadow-violet-500/10'
                                            : 'border-slate-200 dark:border-slate-800 shadow-sm'
                                            }`}
                                        onClick={() => setActiveSuggestionId(suggestion.id)}
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <Badge className={`px-2.5 py-0.5 text-xs font-semibold border ${getErrorBadgeColor(suggestion.error_type)}`}>
                                                {suggestion.error_type}
                                            </Badge>
                                            <span className="text-xs font-bold text-slate-400">#{suggestion.id}</span>
                                        </div>

                                        <div className="space-y-3">
                                            {/* Original */}
                                            <div className="bg-red-50/50 dark:bg-red-950/20 rounded-xl p-3 border border-red-100/50 dark:border-red-900/30">
                                                <span className="text-xs font-bold text-red-600 dark:text-red-500 uppercase tracking-wider mb-1 block">Original</span>
                                                <p className="text-slate-800 dark:text-slate-200 line-through decoration-red-500/50">{suggestion.original_text}</p>
                                            </div>

                                            <div className="flex justify-center -my-4 relative z-10 pointer-events-none">
                                                <div className="bg-white dark:bg-slate-900 rounded-full p-1 border border-slate-100 dark:border-slate-800 shadow-sm">
                                                    <ChevronRight className="w-4 h-4 text-slate-400 rotate-90" />
                                                </div>
                                            </div>

                                            {/* Better */}
                                            <div className="bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl p-3 border border-emerald-100/50 dark:border-emerald-900/30 mt-2">
                                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-wider mb-1 block">Correction</span>
                                                <p className="text-slate-800 dark:text-slate-200 font-medium">{suggestion.correction}</p>
                                            </div>

                                            {/* Explanation */}
                                            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                                    {suggestion.explanation}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
