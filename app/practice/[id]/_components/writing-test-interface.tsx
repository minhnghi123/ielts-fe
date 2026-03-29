import { useState, useMemo } from "react";
import type { Test } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export function WritingTestInterface({
    testId,
    test,
    onFinish,
}: {
    testId: string;
    test?: Test | null;
    onFinish: (answers?: Record<string, string>) => void;
}) {
    // Collect responses dynamically based on tasks
    const [responses, setResponses] = useState<Record<number, string>>({});

    const tasks = useMemo(() => {
        const testTasks = (test as any)?.writingTasks || [];
        return testTasks.sort((a: any, b: any) => a.taskNumber - b.taskNumber);
    }, [test]);

    const [activeTab, setActiveTab] = useState(tasks.length > 0 ? `task${tasks[0].taskNumber}` : "task1");

    const wordCount = (text: string) => {
        return (text || "").trim().split(/\s+/).filter((w) => w.length > 0).length;
    };

    const handleResponseChange = (taskNumber: number, text: string) => {
        setResponses(prev => ({ ...prev, [taskNumber]: text }));
    };

    const handleSubmit = () => {
        // Build final answers object if needed
        const finalAnswers: Record<string, string> = {};
        tasks.forEach((t: any) => {
            finalAnswers[`writing_task_${t.taskNumber}`] = responses[t.taskNumber] || "";
        });
        onFinish(finalAnswers);
    };

    if (tasks.length === 0) {
        return (
            <div className="h-full flex items-center justify-center p-8 text-center text-muted-foreground">
                No writing tasks found for this test.
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col overflow-hidden bg-background">
            {/* Top Bar with Timer and Task Switcher */}
            <div className="border-b bg-white dark:bg-slate-900 p-4 flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <Badge variant="outline" className="text-base py-1 px-3">
                        <span className="material-symbols-outlined text-base mr-2">timer</span>
                        59:30
                    </Badge>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto flex-1 max-w-lg">
                        <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${tasks.length}, 1fr)` }}>
                            {tasks.map((t: any) => (
                                <TabsTrigger key={t.taskNumber} value={`task${t.taskNumber}`}>
                                    Task {t.taskNumber} ({t.config?.timeLimit || 20} min)
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>
                </div>
                <Button onClick={handleSubmit} className="px-8 font-bold shadow-md">
                    Submit Writing
                </Button>
            </div>

            <div className="flex-1 flex overflow-hidden">
                <div className="w-full h-full">
                    <Tabs value={activeTab} className="w-full h-full flex flex-col md:flex-row">
                        {tasks.map((task: any) => {
                            const minWords = task.taskNumber === 1 ? 150 : 250;
                            const currentResponse = responses[task.taskNumber] || "";
                            const currentWordCount = wordCount(currentResponse);

                            return (
                                <TabsContent
                                    key={task.taskNumber}
                                    value={`task${task.taskNumber}`}
                                    className="w-full h-full flex flex-col md:flex-row m-0 border-0 p-0 focus-visible:ring-0"
                                >
                                    <div className="w-full md:w-1/2 p-6 md:p-10 border-r border-border overflow-y-auto bg-slate-50 dark:bg-slate-900/50">
                                        <div className="max-w-2xl mx-auto space-y-6">
                                            <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-none">
                                                Writing Task {task.taskNumber}
                                            </Badge>
                                            
                                            <div className="prose prose-slate dark:prose-invert max-w-none">
                                                <h3 className="text-xl font-semibold leading-relaxed whitespace-pre-line text-slate-800 dark:text-slate-100">
                                                    {task.prompt}
                                                </h3>
                                            </div>

                                            {task.config?.mediaUrl && (
                                                <Card className="p-4 flex items-center justify-center bg-white dark:bg-slate-800">
                                                    <img 
                                                        src={task.config.mediaUrl} 
                                                        alt={`Task ${task.taskNumber} Reference`} 
                                                        className="max-w-full rounded"
                                                    />
                                                </Card>
                                            )}

                                            <div className="pt-4 mt-6 border-t border-slate-200 dark:border-slate-800">
                                                <p className="text-sm text-muted-foreground italic">
                                                    Write at least {minWords} words.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-full md:w-1/2 p-6 md:p-10 bg-background overflow-y-auto flex flex-col">
                                        <textarea
                                            className="flex-1 w-full bg-transparent resize-none outline-none font-serif text-lg leading-relaxed dark:text-slate-200 placeholder:text-muted-foreground/50"
                                            placeholder="Type your response here..."
                                            value={currentResponse}
                                            onChange={(e) => handleResponseChange(task.taskNumber, e.target.value)}
                                            spellCheck={false}
                                        />
                                        <div className="pt-4 border-t flex justify-end">
                                            <div className={`text-sm font-medium ${currentWordCount < minWords ? 'text-orange-500' : 'text-green-600'}`}>
                                                {currentWordCount} words {currentWordCount < minWords && `(Minimum ${minWords})`}
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>
                            );
                        })}
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
