import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export function WritingTestInterface({
    testId,
    onFinish,
}: {
    testId: string;
    onFinish: () => void;
}) {
    const [task1Response, setTask1Response] = useState("");
    const [task2Response, setTask2Response] = useState("");
    const [activeTab, setActiveTab] = useState("task1");

    const wordCount = (text: string) => {
        return text.trim().split(/\s+/).filter((w) => w.length > 0).length;
    };

    return (
        <div className="h-full flex flex-col overflow-hidden bg-background">
            {/* Top Bar with Timer and Task Switcher */}
            <div className="border-b bg-white dark:bg-slate-900 p-4 flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <Badge variant="outline" className="text-base py-1 px-3">
                        <span className="material-symbols-outlined text-base mr-2">timer</span>
                        59:30
                    </Badge>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[400px]">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="task1">Task 1 (20 min)</TabsTrigger>
                            <TabsTrigger value="task2">Task 2 (40 min)</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
                <Button onClick={onFinish} className="px-8 font-bold shadow-md">
                    Submit Writing
                </Button>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* TAB CONTENT WRAPPER */}
                <div className="w-full h-full">
                    <Tabs value={activeTab} className="w-full h-full flex flex-col md:flex-row">

                        {/* TASK 1 CONTENT */}
                        <TabsContent value="task1" className="w-full h-full flex flex-col md:flex-row m-0 border-0 p-0 focus-visible:ring-0">
                            <div className="w-full md:w-1/2 p-6 md:p-10 border-r border-border overflow-y-auto bg-slate-50 dark:bg-slate-900/50">
                                <div className="max-w-2xl mx-auto space-y-6">
                                    <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-none">Writing Task 1</Badge>
                                    <h2 className="text-2xl font-bold">The chart below shows the number of men and women in further education in Britain in three periods and whether they were studying full-time or part-time.</h2>
                                    <p className="text-muted-foreground">Summarise the information by selecting and reporting the main features, and make comparisons where relevant.</p>

                                    <Card className="p-8 flex items-center justify-center bg-white dark:bg-slate-800 min-h-[300px]">
                                        {/* CSS Placeholder Chart */}
                                        <div className="flex items-end gap-8 h-48 w-full max-w-sm">
                                            <div className="flex flex-col items-center gap-2 flex-1 group">
                                                <div className="w-full bg-blue-500 h-32 rounded-t-md relative group-hover:opacity-90 transition-opacity">
                                                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold">85%</span>
                                                </div>
                                                <span className="text-xs font-bold text-muted-foreground">1970</span>
                                            </div>
                                            <div className="flex flex-col items-center gap-2 flex-1 group">
                                                <div className="w-full bg-purple-500 h-24 rounded-t-md relative group-hover:opacity-90 transition-opacity">
                                                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold">70%</span>
                                                </div>
                                                <span className="text-xs font-bold text-muted-foreground">1990</span>
                                            </div>
                                            <div className="flex flex-col items-center gap-2 flex-1 group">
                                                <div className="w-full bg-pink-500 h-40 rounded-t-md relative group-hover:opacity-90 transition-opacity">
                                                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold">92%</span>
                                                </div>
                                                <span className="text-xs font-bold text-muted-foreground">2010</span>
                                            </div>
                                        </div>
                                    </Card>
                                    <p className="text-sm text-muted-foreground italic">Write at least 150 words.</p>
                                </div>
                            </div>
                            <div className="w-full md:w-1/2 p-6 md:p-10 bg-background overflow-y-auto flex flex-col">
                                <textarea
                                    className="flex-1 w-full bg-transparent resize-none outline-none font-serif text-lg leading-relaxed dark:text-slate-200 placeholder:text-muted-foreground/50"
                                    placeholder="Type your response here..."
                                    value={task1Response}
                                    onChange={(e) => setTask1Response(e.target.value)}
                                    spellCheck={false}
                                />
                                <div className="pt-4 border-t flex justify-end">
                                    <div className={`text-sm font-medium ${wordCount(task1Response) < 150 ? 'text-orange-500' : 'text-green-600'}`}>
                                        {wordCount(task1Response)} words {wordCount(task1Response) < 150 && '(Minimum 150)'}
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* TASK 2 CONTENT */}
                        <TabsContent value="task2" className="w-full h-full flex flex-col md:flex-row m-0 border-0 p-0 focus-visible:ring-0">
                            <div className="w-full md:w-1/2 p-6 md:p-10 border-r border-border overflow-y-auto bg-slate-50 dark:bg-slate-900/50">
                                <div className="max-w-2xl mx-auto space-y-6">
                                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none">Writing Task 2</Badge>
                                    <h2 className="text-2xl font-bold">Present a written argument or case to an educated reader with no specialist knowledge of the following topic.</h2>

                                    <Card className="p-6 bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/30">
                                        <p className="font-serif text-lg leading-relaxed text-amber-900 dark:text-amber-100">
                                            "Some people believe that unpaid community service should be a compulsory part of high school programmes (for example working for a charity, improving the neighbourhood or teaching sports to younger children). To what extent do you agree or disagree?"
                                        </p>
                                    </Card>


                                    <div className="space-y-4">
                                        <p className="font-bold">You should use your own ideas, knowledge and experience and support your arguments with examples and relevant evidence.</p>
                                        <p className="text-sm text-muted-foreground italic">Write at least 250 words.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="w-full md:w-1/2 p-6 md:p-10 bg-background overflow-y-auto flex flex-col">
                                <textarea
                                    className="flex-1 w-full bg-transparent resize-none outline-none font-serif text-lg leading-relaxed dark:text-slate-200 placeholder:text-muted-foreground/50"
                                    placeholder="Type your essay here..."
                                    value={task2Response}
                                    onChange={(e) => setTask2Response(e.target.value)}
                                    spellCheck={false}
                                />
                                <div className="pt-4 border-t flex justify-end">
                                    <div className={`text-sm font-medium ${wordCount(task2Response) < 250 ? 'text-orange-500' : 'text-green-600'}`}>
                                        {wordCount(task2Response)} words {wordCount(task2Response) < 250 && '(Minimum 250)'}
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                    </Tabs>
                </div>
            </div>
        </div>
    );
}
