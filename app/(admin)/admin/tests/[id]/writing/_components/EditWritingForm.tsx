"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { ArrowLeft, Save, PlusCircle } from "lucide-react";
import { updateWritingTest, WritingTaskItem } from "@/lib/api.tests";
import api from "@/lib/api";
import WritingTaskCard, { WritingTaskData } from "@/app/(admin)/admin/tests/add/_components/WritingTaskCard";


function makTask(n: number): WritingTaskData {
    return {
        taskNumber: n,
        promptText: "",
        timeLimit: n === 1 ? 20 : 40,
        mediaUrl: "",
        rubric: [],
    };
}

export default function EditWritingFormInner({ testId }: { testId: string }) {
    const router = useRouter();
    const { user } = useAuth();

    const [isLoading, setIsLoading] = useState(true);
    const [title, setTitle] = useState("");
    const [isMock, setIsMock] = useState(false);
    const [tasks, setTasks] = useState<WritingTaskData[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        async function loadTest() {
            try {
                const { data } = await api.get(`/api/tests/${testId}`);
                const test = data.data;
                setTitle(test.title || "");
                setIsMock(!!test.isMock);

                if (test.writingTasks && test.writingTasks.length > 0) {
                    setTasks(
                        test.writingTasks.map((t: any) => ({
                            taskNumber: t.taskNumber,
                            promptText: t.prompt,
                            timeLimit: t.config?.timeLimit || 20,
                            mediaUrl: t.config?.mediaUrl || "",
                            rubric: (t.config?.rubric || []).map((r: any) => r.criterion || r),
                        }))
                    );
                } else {
                    setTasks([makTask(1), makTask(2)]);
                }
            } catch (err) {
                toast.error("Failed to load test");
            } finally {
                setIsLoading(false);
            }
        }
        loadTest();
    }, [testId]);

    const updateTask = (i: number, field: keyof WritingTaskData, value: unknown) =>
        setTasks((prev) => prev.map((t, j) => (j === i ? { ...t, [field]: value } : t)));

    const addTask = () =>
        setTasks((prev) => [...prev, makTask(prev.length + 1)]);

    const removeTask = (i: number) =>
        setTasks((prev) =>
            prev.filter((_, j) => j !== i).map((t, j) => ({ ...t, taskNumber: j + 1 }))
        );

    const handleSave = async () => {
        if (!title.trim()) return toast.error("Test title is required");
        const emptyTask = tasks.findIndex((t) => !t.promptText.trim());
        if (emptyTask !== -1)
            return toast.error(`Task ${emptyTask + 1} prompt is required`);

        setIsSaving(true);
        try {
            const payload = {
                title,
                isMock,
                tasks: tasks.map((t): WritingTaskItem => ({
                    taskNumber: t.taskNumber,
                    promptText: t.promptText,
                    timeLimit: t.timeLimit,
                    mediaUrl: t.mediaUrl || undefined,
                    rubric: t.rubric.length
                        ? t.rubric.map((criterion) => ({ criterion }))
                        : undefined,
                })),
            };
            await updateWritingTest(testId, payload);
            toast.success("Writing test updated successfully!");
            router.push("/admin/tests?skill=writing");
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Failed to save test");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="p-8 text-slate-500">Loading test data...</div>;
    }

    return (
        <div className="p-8 max-w-6xl mx-auto pb-24">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6 text-slate-600" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">Edit Writing Test</h1>
                        <p className="text-sm text-slate-500 mt-0.5">IELTS Academic / General Training (Edit)</p>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                    <Save className="w-5 h-5" />
                    {isSaving ? "Saving…" : "Update Test"}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    {tasks.map((task, i) => (
                        <WritingTaskCard
                            key={i}
                            task={task}
                            onChange={(field, value) => updateTask(i, field, value)}
                            onRemove={() => removeTask(i)}
                            removable={tasks.length > 1}
                        />
                    ))}
                    <button
                        onClick={addTask}
                        className="w-full py-4 border-2 border-dashed border-blue-300 rounded-xl text-blue-600 font-medium hover:border-blue-400 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                    >
                        <PlusCircle className="w-5 h-5" />
                        Add Another Task
                    </button>
                </div>

                <div className="lg:col-span-1">
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 sticky top-8">
                        <h2 className="text-lg font-semibold text-slate-800 mb-5 pb-2 border-b border-slate-100">
                            Test Info
                        </h2>
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                    Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Academic Writing Practice Test 3"
                                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            <div className="flex justify-between items-center p-3 bg-slate-50 border border-slate-200 rounded-lg">
                                <div>
                                    <p className="text-sm font-medium text-slate-800">Mock Test</p>
                                    <p className="text-xs text-slate-500">Is this a full mock test?</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isMock}
                                        onChange={(e) => setIsMock(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                                </label>
                            </div>

                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 space-y-1">
                                <p className="font-medium">Test Summary</p>
                                <p>{tasks.length} task{tasks.length > 1 ? "s" : ""} configured</p>
                                <p>Skill: Writing</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
