"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { createManualTest, CreateManualTestRequest } from "@/lib/api.tests";
import RichTextEditor from "@/app/(admin)/_components/RichTextEditor";
import { PlusCircle, Trash2, ArrowLeft, Save, GripVertical } from 'lucide-react';

export default function AddTestPage() {
    const router = useRouter();
    const { user } = useAuth();

    // In our simplified auth setup, we should have an adminId, 
    // but default to the default admin profile id from the db if we don't know it
    const defaultAdminId = 'a1b2c3d4-0000-0000-0000-000000000001';
    const createdBy = user?.id || defaultAdminId;

    // Form State
    const [isSaving, setIsSaving] = useState(false);
    const [testData, setTestData] = useState<CreateManualTestRequest>({
        skill: "reading",
        title: "",
        isMock: false,
        createdBy,
        sections: [
            {
                sectionOrder: 1,
                passage: "",
                audioUrl: "",
                timeLimit: 20,
                questions: []
            }
        ]
    });

    // --- Handlers ---
    const handleTestChange = (field: keyof CreateManualTestRequest, value: any) => {
        setTestData(prev => ({ ...prev, [field]: value }));
    };

    const addSection = () => {
        setTestData(prev => ({
            ...prev,
            sections: [
                ...prev.sections,
                {
                    sectionOrder: prev.sections.length + 1,
                    passage: "",
                    audioUrl: "",
                    timeLimit: 20,
                    questions: []
                }
            ]
        }));
    };

    const updateSection = (sIndex: number, field: string, value: any) => {
        const newSections = [...testData.sections];
        (newSections[sIndex] as any)[field] = value;
        setTestData({ ...testData, sections: newSections });
    };

    const removeSection = (sIndex: number) => {
        const newSections = testData.sections.filter((_, i) => i !== sIndex);
        // Reorder
        newSections.forEach((s, idx) => { s.sectionOrder = idx + 1; });
        setTestData({ ...testData, sections: newSections });
    };

    const addQuestion = (sIndex: number) => {
        const newSections = [...testData.sections];
        newSections[sIndex].questions.push({
            questionOrder: newSections[sIndex].questions.length + 1,
            questionType: "multiple_choice",
            questionText: "",
            config: {},
            explanation: "",
            answer: {
                correctAnswers: [""],
                caseSensitive: false
            }
        });
        setTestData({ ...testData, sections: newSections });
    };

    const updateQuestion = (sIndex: number, qIndex: number, field: string, value: any) => {
        const newSections = [...testData.sections];
        (newSections[sIndex].questions[qIndex] as any)[field] = value;
        setTestData({ ...testData, sections: newSections });
    };

    const updateAnswer = (sIndex: number, qIndex: number, field: string, value: any) => {
        const newSections = [...testData.sections];
        (newSections[sIndex].questions[qIndex].answer as any)[field] = value;
        setTestData({ ...testData, sections: newSections });
    };

    const removeQuestion = (sIndex: number, qIndex: number) => {
        const newSections = [...testData.sections];
        newSections[sIndex].questions = newSections[sIndex].questions.filter((_, i) => i !== qIndex);
        // Reorder
        newSections[sIndex].questions.forEach((q, idx) => { q.questionOrder = idx + 1; });
        setTestData({ ...testData, sections: newSections });
    };

    const handleSave = async () => {
        if (!testData.title.trim()) {
            return toast.error("Test Title is required");
        }

        setIsSaving(true);
        try {
            await createManualTest(testData);
            toast.success("Test created successfully!");
            router.push('/admin/tests');
        } catch (error: any) {
            toast.error(error.message || "Failed to save test");
        } finally {
            setIsSaving(false);
        }
    };

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
                    <h1 className="text-3xl font-bold text-slate-800">Create New Test</h1>
                </div>

                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                    <Save className="w-5 h-5" />
                    {isSaving ? "Saving..." : "Save Test"}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Col: Main Content (Sections & Questions) */}
                <div className="lg:col-span-2 space-y-8">
                    {testData.sections.map((section, sIndex) => (
                        <div key={sIndex} className="bg-white border rounded-xl shadow-sm outline outline-1 outline-slate-200 overflow-hidden">
                            <div className="bg-slate-50 border-b px-6 py-4 flex justify-between items-center group">
                                <div className="flex items-center gap-3">
                                    <GripVertical className="text-slate-400 cursor-move" />
                                    <h2 className="text-xl font-semibold text-slate-800">
                                        Section {sIndex + 1}
                                    </h2>
                                </div>
                                <button
                                    onClick={() => removeSection(sIndex)}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Section Details */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Time Limit (mins)</label>
                                        <input
                                            type="number"
                                            value={section.timeLimit}
                                            onChange={(e) => updateSection(sIndex, 'timeLimit', parseInt(e.target.value))}
                                            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    {testData.skill === 'listening' && (
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Audio URL</label>
                                            <input
                                                type="text"
                                                value={section.audioUrl || ''}
                                                onChange={(e) => updateSection(sIndex, 'audioUrl', e.target.value)}
                                                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                                placeholder="https://..."
                                            />
                                        </div>
                                    )}
                                </div>

                                {testData.skill === 'reading' && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Reading Passage</label>
                                        <RichTextEditor
                                            value={section.passage || ''}
                                            onChange={(val: any) => updateSection(sIndex, 'passage', val)}
                                        />
                                    </div>
                                )}

                                {/* Questions List */}
                                <div className="mt-8">
                                    <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">Questions</h3>
                                    <div className="space-y-4">
                                        {section.questions.map((q, qIndex) => (
                                            <div key={qIndex} className="border border-slate-200 rounded-lg p-4 bg-slate-50 relative group">
                                                <div className="absolute top-4 right-4 flex gap-2">
                                                    <button
                                                        onClick={() => removeQuestion(sIndex, qIndex)}
                                                        className="text-slate-400 hover:text-red-500"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                <div className="flex items-center gap-2 mb-4">
                                                    <span className="bg-blue-100 text-blue-800 font-bold px-2 py-1 rounded text-sm">
                                                        Q{q.questionOrder}
                                                    </span>
                                                    <select
                                                        value={q.questionType}
                                                        onChange={(e) => updateQuestion(sIndex, qIndex, 'questionType', e.target.value)}
                                                        className="border rounded px-2 py-1 text-sm outline-none w-48 bg-white"
                                                    >
                                                        <option value="multiple_choice">Multiple Choice</option>
                                                        <option value="fill_in_blank">Fill in Blank</option>
                                                        <option value="matching">Matching</option>
                                                        <option value="heading">Heading Matching</option>
                                                    </select>
                                                </div>

                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Question Text</label>
                                                        <input
                                                            value={q.questionText}
                                                            onChange={(e) => updateQuestion(sIndex, qIndex, 'questionText', e.target.value)}
                                                            className="w-full border rounded p-2 text-sm outline-none focus:border-blue-500 bg-white"
                                                            placeholder="e.g. What is the main idea of paragraph 2?"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Correct Answer(s)</label>
                                                        <input
                                                            value={q.answer.correctAnswers.join(' | ')}
                                                            onChange={(e) => {
                                                                const values = e.target.value.split('|').map(v => v.trim()).filter(v => v);
                                                                updateAnswer(sIndex, qIndex, 'correctAnswers', values);
                                                            }}
                                                            className="w-full border rounded p-2 text-sm outline-none focus:border-green-500 bg-white placeholder:text-slate-300"
                                                            placeholder="Separate multiple valid answers with | (e.g. True | T)"
                                                        />
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            id={`case-sensitive-${sIndex}-${qIndex}`}
                                                            checked={q.answer.caseSensitive}
                                                            onChange={(e) => updateAnswer(sIndex, qIndex, 'caseSensitive', e.target.checked)}
                                                            className="rounded text-blue-600"
                                                        />
                                                        <label htmlFor={`case-sensitive-${sIndex}-${qIndex}`} className="text-sm text-slate-600 cursor-pointer">
                                                            Case Sensitive Answer
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => addQuestion(sIndex)}
                                        className="mt-4 flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors w-full justify-center border border-blue-200 border-dashed"
                                    >
                                        <PlusCircle className="w-4 h-4" />
                                        Add Question
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    <button
                        onClick={addSection}
                        className="w-full py-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 font-medium hover:border-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                    >
                        <PlusCircle className="w-5 h-5" />
                        Add New Section
                    </button>
                </div>

                {/* Right Col: Meta Data Sticky Sidebar */}
                <div className="lg:col-span-1">
                    <div className="bg-white border rounded-xl shadow-sm p-6 sticky top-8">
                        <h2 className="text-lg font-semibold text-slate-800 mb-6 pb-2 border-b">Test Meta Data</h2>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={testData.title}
                                    onChange={(e) => handleTestChange('title', e.target.value)}
                                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                                    placeholder="e.g. Cambridge IELTS 15 Test 1"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Skill Category</label>
                                <select
                                    value={testData.skill}
                                    onChange={(e) => handleTestChange('skill', e.target.value)}
                                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                >
                                    <option value="reading">Reading</option>
                                    <option value="listening">Listening</option>
                                    <option value="writing">Writing</option>
                                    <option value="speaking">Speaking</option>
                                </select>
                            </div>

                            <div className="flex justify-between items-center p-3 bg-slate-50 border rounded-lg">
                                <div>
                                    <label className="text-sm font-medium text-slate-800 block">Mock Test</label>
                                    <span className="text-xs text-slate-500">Is this a full mock test?</span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={testData.isMock}
                                        onChange={(e) => handleTestChange('isMock', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
