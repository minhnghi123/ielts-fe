"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api`;

const SKILL_COLORS: Record<string, string> = {
    reading: "bg-blue-100 text-blue-700",
    listening: "bg-purple-100 text-purple-700",
    writing: "bg-green-100 text-green-700",
    speaking: "bg-orange-100 text-orange-700",
};

const QTYPE_COLORS: Record<string, string> = {
    multiple_choice: "bg-blue-50 text-blue-700",
    fill_in_blank: "bg-yellow-50 text-yellow-700",
    true_false_ng: "bg-green-50 text-green-700",
    yes_no_ng: "bg-teal-50 text-teal-700",
    matching_headings: "bg-purple-50 text-purple-700",
    short_answer: "bg-pink-50 text-pink-700",
    matching_features: "bg-orange-50 text-orange-700",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TestDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();

    const [test, setTest] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [editingTitle, setEditingTitle] = useState(false);
    const [titleVal, setTitleVal] = useState("");
    const [savingTitle, setSavingTitle] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<string | null>(null);
    const [editQData, setEditQData] = useState<any>({});

    const load = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/tests/${id}`);
            const data = await res.json();
            setTest(data);
            setTitleVal(data.title);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [id]);

    // Title save
    const saveTitle = async () => {
        setSavingTitle(true);
        await fetch(`${API_BASE}/tests/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: titleVal }),
        });
        setEditingTitle(false);
        setSavingTitle(false);
        load();
    };

    // Mock toggle
    const toggleMock = async () => {
        await fetch(`${API_BASE}/tests/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isMock: !test.isMock }),
        });
        load();
    };

    // Question inline edit
    const startEditQ = (q: any) => {
        setEditingQuestion(q.id);
        setEditQData({
            questionText: q.questionText,
            questionType: q.questionType,
            correctAnswers: q.answer?.correctAnswers?.join(", ") ?? "",
        });
    };

    const saveQuestion = async (qId: string, sectionId: string) => {
        await fetch(`${API_BASE}/questions/${qId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                questionText: editQData.questionText,
                questionType: editQData.questionType,
                config: {},
                answer: {
                    correctAnswers: editQData.correctAnswers.split(",").map((s: string) => s.trim()).filter(Boolean),
                    caseSensitive: false,
                },
            }),
        });
        setEditingQuestion(null);
        load();
    };

    const deleteQuestion = async (qId: string) => {
        if (!confirm("Delete this question?")) return;
        await fetch(`${API_BASE}/questions/${qId}`, { method: "DELETE" });
        load();
    };

    // Add Section
    const addSection = async () => {
        const order = (test.sections?.length || 0) + 1;
        await fetch(`${API_BASE}/tests/${id}/sections`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sectionOrder: order }),
        });
        load();
    };

    // Add Question
    const addQuestion = async (sectionId: string, currentQs: any[]) => {
        const order = currentQs.length + 1;
        await fetch(`${API_BASE}/sections/${sectionId}/questions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                questionOrder: order,
                questionType: "multiple_choice",
                questionText: "New Question Text",
                config: {},
                answer: {
                    correctAnswers: ["A"],
                    caseSensitive: false,
                },
            }),
        });
        load();
    };

    // Add Writing Task
    const addWritingTask = async () => {
        const order = (test.writingTasks?.length || 0) + 1;
        await fetch(`${API_BASE}/tests/${id}/writing-tasks`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                taskNumber: order,
                prompt: "New Writing Prompt...",
                wordLimit: order === 1 ? 150 : 250,
            }),
        });
        load();
    };

    const deleteWritingTask = async (taskId: string) => {
        if (!confirm("Delete this writing task?")) return;
        await fetch(`${API_BASE}/writing-tasks/${taskId}`, { method: "DELETE" });
        load();
    };

    // Add Speaking Part
    const addSpeakingPart = async () => {
        const order = (test.speakingParts?.length || 0) + 1;
        await fetch(`${API_BASE}/tests/${id}/speaking-parts`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                partNumber: order,
                prompt: "New Speaking Part Prompt...",
            }),
        });
        load();
    };

    const deleteSpeakingPart = async (partId: string) => {
        if (!confirm("Delete this speaking part?")) return;
        await fetch(`${API_BASE}/speaking-parts/${partId}`, { method: "DELETE" });
        load();
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <span className="inline-block w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
        </div>
    );
    if (!test) return <div className="p-10 text-center text-muted-foreground">Test not found.</div>;


    return (
        <div className="p-6 md:p-10 max-w-5xl mx-auto flex flex-col gap-8">
            {/* Back */}
            <Link href="/admin/tests" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground w-fit">
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                All Tests
            </Link>

            {/* Header */}
            <div className="rounded-xl border bg-card p-6 flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                    {editingTitle ? (
                        <div className="flex items-center gap-2 flex-1">
                            <input
                                value={titleVal}
                                onChange={(e) => setTitleVal(e.target.value)}
                                className="flex-1 border rounded-lg px-3 py-1.5 text-lg font-bold bg-background focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                            <button onClick={saveTitle} disabled={savingTitle} className="px-3 py-1.5 bg-orange-500 text-white text-sm rounded-lg">Save</button>
                            <button onClick={() => setEditingTitle(false)} className="px-3 py-1.5 border rounded-lg text-sm">Cancel</button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 flex-1">
                            <h1 className="text-xl font-bold">{test.title}</h1>
                            <button onClick={() => setEditingTitle(true)} className="p-1 text-muted-foreground hover:text-foreground">
                                <span className="material-symbols-outlined text-sm">edit</span>
                            </button>
                        </div>
                    )}
                    <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${SKILL_COLORS[test.skill] ?? "bg-gray-100 text-gray-600"}`}>
                            {test.skill}
                        </span>
                        <button
                            onClick={toggleMock}
                            className={`text-xs px-2 py-0.5 rounded-full border font-medium transition-colors ${test.isMock ? "bg-yellow-100 text-yellow-700 border-yellow-200" : "bg-gray-100 text-gray-600 border-gray-200"}`}
                        >
                            {test.isMock ? "Mock Test" : "Practice"} ↕
                        </button>
                    </div>
                </div>
                <p className="text-xs text-muted-foreground">ID: <span className="font-mono">{test.id}</span></p>
            </div>

            {/* Sections & Questions */}
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Sections</h2>
                <button
                    onClick={addSection}
                    className="text-xs bg-orange-100 text-orange-700 hover:bg-orange-200 px-3 py-1.5 rounded-lg flex items-center gap-1 font-semibold transition-colors"
                >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    Add Section
                </button>
            </div>

            {(test.sections ?? []).length > 0 && (
                <div className="flex flex-col gap-6 -mt-2">
                    {(test.sections ?? []).map((sec: any) => (
                        <div key={sec.id} className="rounded-xl border bg-card overflow-hidden">
                            <div className="bg-muted/50 px-5 py-3 flex items-center gap-3">
                                <span className="font-semibold text-sm">Section {sec.sectionOrder}</span>
                                {sec.audioUrl && (
                                    <span className="flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                                        <span className="material-symbols-outlined text-xs">music_note</span>
                                        Audio
                                    </span>
                                )}
                                {sec.passage && (
                                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">Has passage</span>
                                )}
                                <span className="ml-auto text-xs text-muted-foreground">{sec.questions?.length ?? 0} questions</span>
                            </div>

                            {sec.passage && (
                                <div className="px-5 py-3 text-sm text-muted-foreground bg-muted/20 border-b max-h-32 overflow-y-auto font-mono text-xs leading-relaxed whitespace-pre-line">
                                    {sec.passage.slice(0, 400)}{sec.passage.length > 400 ? "…" : ""}
                                </div>
                            )}

                            <div className="divide-y">
                                {(sec.questions ?? []).map((q: any) => (
                                    <div key={q.id} className="px-5 py-3">
                                        {editingQuestion === q.id ? (
                                            /* Inline edit form */
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-mono text-muted-foreground w-6">{q.questionOrder}.</span>
                                                    <select
                                                        value={editQData.questionType}
                                                        onChange={(e) => setEditQData({ ...editQData, questionType: e.target.value })}
                                                        className="text-xs border rounded px-2 py-1 bg-background"
                                                    >
                                                        {Object.keys(QTYPE_COLORS).map((t) => <option key={t} value={t}>{t}</option>)}
                                                    </select>
                                                </div>
                                                <textarea
                                                    value={editQData.questionText}
                                                    onChange={(e) => setEditQData({ ...editQData, questionText: e.target.value })}
                                                    rows={2}
                                                    className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-orange-500"
                                                />
                                                <div className="flex items-center gap-2">
                                                    <label className="text-xs text-muted-foreground">Answer(s):</label>
                                                    <input
                                                        value={editQData.correctAnswers}
                                                        onChange={(e) => setEditQData({ ...editQData, correctAnswers: e.target.value })}
                                                        placeholder="Separate multiple with comma"
                                                        className="flex-1 border rounded px-2 py-1 text-sm bg-background"
                                                    />
                                                </div>
                                                <div className="flex gap-2 justify-end">
                                                    <button onClick={() => setEditingQuestion(null)} className="text-xs px-3 py-1 border rounded-lg">Cancel</button>
                                                    <button onClick={() => saveQuestion(q.id, sec.id)} className="text-xs px-3 py-1 bg-orange-500 text-white rounded-lg">Save</button>
                                                </div>
                                            </div>
                                        ) : (
                                            /* Read view */
                                            <div className="flex items-start gap-3">
                                                <span className="text-xs font-mono text-muted-foreground pt-0.5 w-6">{q.questionOrder}.</span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${QTYPE_COLORS[q.questionType] ?? "bg-gray-100 text-gray-600"}`}>
                                                            {q.questionType?.replace(/_/g, " ")}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm">{q.questionText}</p>
                                                    {q.answer?.correctAnswers?.length > 0 && (
                                                        <p className="text-xs text-green-600 mt-0.5">
                                                            ✓ {q.answer.correctAnswers.join(" / ")}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex gap-1 shrink-0">
                                                    <button onClick={() => startEditQ(q)} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground">
                                                        <span className="material-symbols-outlined text-sm">edit</span>
                                                    </button>
                                                    <button onClick={() => deleteQuestion(q.id)} className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600">
                                                        <span className="material-symbols-outlined text-sm">delete</span>
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Add Question Button in Section */}
                            <div className="bg-muted/10 px-5 py-3 border-t">
                                <button
                                    onClick={() => addQuestion(sec.id, sec.questions ?? [])}
                                    className="text-xs text-orange-600 hover:text-orange-700 flex items-center gap-1 font-medium"
                                >
                                    <span className="material-symbols-outlined text-[16px]">add_circle</span>
                                    Add Question to Section {sec.sectionOrder}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Writing Tasks */}
            <div className="flex items-center justify-between mt-8">
                <h2 className="text-lg font-bold">Writing Tasks</h2>
                <button
                    onClick={addWritingTask}
                    className="text-xs bg-orange-100 text-orange-700 hover:bg-orange-200 px-3 py-1.5 rounded-lg flex items-center gap-1 font-semibold transition-colors"
                >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    Add Writing Task
                </button>
            </div>
            {(test.writingTasks ?? []).length > 0 && (
                <div className="rounded-xl border bg-card overflow-hidden -mt-2">
                    <div className="divide-y">
                        {test.writingTasks.map((wt: any) => (
                            <div key={wt.id} className="p-5">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="font-medium text-sm">Task {wt.taskNumber}</span>
                                            <span className="text-xs text-muted-foreground">min {wt.wordLimit} words</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground leading-relaxed">{wt.prompt}</p>
                                    </div>
                                    <button onClick={() => deleteWritingTask(wt.id)} className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors">
                                        <span className="material-symbols-outlined text-sm">delete</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Speaking Parts */}
            <div className="flex items-center justify-between mt-8">
                <h2 className="text-lg font-bold">Speaking Parts</h2>
                <button
                    onClick={addSpeakingPart}
                    className="text-xs bg-orange-100 text-orange-700 hover:bg-orange-200 px-3 py-1.5 rounded-lg flex items-center gap-1 font-semibold transition-colors"
                >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    Add Speaking Part
                </button>
            </div>
            {(test.speakingParts ?? []).length > 0 && (
                <div className="rounded-xl border bg-card overflow-hidden -mt-2">
                    <div className="divide-y">
                        {test.speakingParts.map((sp: any) => (
                            <div key={sp.id} className="p-5">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-medium text-sm mb-1">Part {sp.partNumber}</p>
                                        <p className="text-sm text-muted-foreground leading-relaxed">{sp.prompt}</p>
                                    </div>
                                    <button onClick={() => deleteSpeakingPart(sp.id)} className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors">
                                        <span className="material-symbols-outlined text-sm">delete</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
