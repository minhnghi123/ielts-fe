"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";
import { updateSpeakingTest, CreateSpeakingTestRequest } from "@/lib/api.tests";
import api from "@/lib/api";
import {
    SpeakingPart1Card,
    SpeakingPart2Card,
    SpeakingPart3Card,
    Part1Data,
    Part2Data,
    Part3Data,
} from "@/app/(admin)/admin/tests/add/_components/SpeakingPartCard";


const initialPart1: Part1Data = {
    topics: [{ topicName: "", questions: [{ questionText: "", audioUrl: "" }] }],
};
const initialPart2: Part2Data = {
    mainTopic: "",
    cues: ["", ""],
    prepTime: 1,
    speakTime: 2,
};
const initialPart3: Part3Data = {
    questions: [{ questionText: "", audioUrl: "" }],
};

export default function EditSpeakingFormInner({ params }: { params: { id: string } }) {
    const router = useRouter();
    const user = useAuthStore((s) => s.user);
    const testId = params.id;

    const [isLoading, setIsLoading] = useState(true);
    const [title, setTitle] = useState("");
    const [isMock, setIsMock] = useState(false);
    const [part1, setPart1] = useState<Part1Data>(initialPart1);
    const [part2, setPart2] = useState<Part2Data>(initialPart2);
    const [part3, setPart3] = useState<Part3Data>(initialPart3);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        async function loadTest() {
            try {
                const { data } = await api.get(`/api/tests/${testId}`);
                const test = data.data;
                setTitle(test.title || "");
                setIsMock(!!test.isMock);

                if (test.speakingParts && test.speakingParts.length > 0) {
                    const p1 = test.speakingParts.find((p: any) => p.partNumber === 1);
                    const p2 = test.speakingParts.find((p: any) => p.partNumber === 2);
                    const p3 = test.speakingParts.find((p: any) => p.partNumber === 3);

                    if (p1 && p1.config?.topics) setPart1({ topics: p1.config.topics });
                    if (p2 && p2.config) {
                        setPart2({
                            mainTopic: p2.prompt || "",
                            cues: p2.config.cues || ["", ""],
                            prepTime: p2.config.prepTime || 1,
                            speakTime: p2.config.speakTime || 2,
                        });
                    }
                    if (p3 && p3.config?.questions) setPart3({ questions: p3.config.questions });
                }
            } catch (err) {
                toast.error("Failed to load test");
            } finally {
                setIsLoading(false);
            }
        }
        loadTest();
    }, [testId]);

    const handleSave = async () => {
        if (!title.trim()) return toast.error("Test title is required");
        if (!part2.mainTopic.trim()) return toast.error("Part 2 main topic is required");

        const missingPart1Q = part1.topics.some((t) =>
            t.questions.some((q) => !q.questionText.trim())
        );
        if (missingPart1Q) return toast.error("All Part 1 questions must have text");

        const missingPart3Q = part3.questions.some((q) => !q.questionText.trim());
        if (missingPart3Q) return toast.error("All Part 3 questions must have text");

        setIsSaving(true);
        try {
            const payload: Omit<CreateSpeakingTestRequest, 'createdBy'> = {
                title,
                isMock,
                part1: {
                    topics: part1.topics.map((t) => ({
                        topicName: t.topicName,
                        questions: t.questions.map((q) => ({
                            questionText: q.questionText,
                            audioUrl: q.audioUrl || undefined,
                        })),
                    })),
                },
                part2: {
                    mainTopic: part2.mainTopic,
                    cues: part2.cues.filter(Boolean),
                    prepTime: part2.prepTime,
                    speakTime: part2.speakTime,
                },
                part3: {
                    questions: part3.questions.map((q) => ({
                        questionText: q.questionText,
                        audioUrl: q.audioUrl || undefined,
                    })),
                },
            };
            await updateSpeakingTest(testId, payload);
            toast.success("Speaking test updated successfully!");
            router.push("/admin/tests?skill=speaking");
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
                        <h1 className="text-3xl font-bold text-slate-800">Edit Speaking Test</h1>
                        <p className="text-sm text-slate-500 mt-0.5">IELTS Speaking — 3 Parts (Edit)</p>
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
                    <SpeakingPart1Card data={part1} onChange={setPart1} />
                    <SpeakingPart2Card data={part2} onChange={setPart2} />
                    <SpeakingPart3Card data={part3} onChange={setPart3} />
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
                                    placeholder="e.g. Speaking Practice Test 2"
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

                            <div className="space-y-2">
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                                    <p className="font-medium">Part 1</p>
                                    <p>{part1.topics.length} topic(s), {part1.topics.reduce((s, t) => s + t.questions.length, 0)} question(s)</p>
                                </div>
                                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                                    <p className="font-medium">Part 2</p>
                                    <p>{part2.cues.filter(Boolean).length} cue(s) · {part2.prepTime}m prep · {part2.speakTime}m speak</p>
                                </div>
                                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-sm text-purple-700">
                                    <p className="font-medium">Part 3</p>
                                    <p>{part3.questions.length} question(s)</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
