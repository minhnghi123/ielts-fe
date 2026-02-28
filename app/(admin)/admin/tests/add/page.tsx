"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { createManualTest, CreateManualTestRequest } from "@/lib/api.tests";
import RichTextEditor from "@/app/(admin)/_components/RichTextEditor";
import { useSearchParams } from "next/navigation";
import { PlusCircle, Trash2, ArrowLeft, Save, GripVertical, Lock } from 'lucide-react';

import MultipleChoiceQuestion from "@/app/(admin)/_components/questions/MultipleChoiceQuestion";
import FillInBlankQuestion from "@/app/(admin)/_components/questions/FillInBlankQuestion";
import MatchingQuestion from "@/app/(admin)/_components/questions/MatchingQuestion";
import HeadingMatchingQuestion from "@/app/(admin)/_components/questions/HeadingMatchingQuestion";
import { Suspense } from "react";

export function AddTestPageSuspense() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();

    // In our simplified auth setup, we should have an adminId, 
    // but default to the default admin profile id from the db if we don't know it
    const defaultAdminId = 'a1b2c3d4-0000-0000-0000-000000000001';
    const createdBy = user?.id || defaultAdminId;

    const initialSkill = searchParams.get('skill') as "reading" | "listening" | "writing" | "speaking" || "reading";
    const [isSkillLocked, setIsSkillLocked] = useState(!!searchParams.get('skill'));

    // Form State
    const [isSaving, setIsSaving] = useState(false);
    const [testData, setTestData] = useState<CreateManualTestRequest>({
        skill: initialSkill,
        title: "",
        isMock: false,
        createdBy,
        sections: Array.from({ length: initialSkill === 'reading' || initialSkill === 'listening' ? 3 : 1 }).map((_, i) => ({
            sectionOrder: i + 1,
            passage: "",
            audioUrl: "",
            groups: [{
                groupOrder: 1,
                instructions: "",
                questions: []
            }]
        }))
    });

    // --- Handlers ---
    const handleTestChange = (field: keyof CreateManualTestRequest, value: any) => {
        setTestData(prev => {
            const next = { ...prev, [field]: value };
            // Adjust sections if skill changes
            if (field === 'skill' && (value === 'listening' || value === 'reading')) {
                const requiredLength = 3;
                let newSecs = [...next.sections];
                if (newSecs.length < requiredLength) {
                    const diff = requiredLength - newSecs.length;
                    for (let i = 0; i < diff; i++) {
                        newSecs.push({
                            sectionOrder: newSecs.length + 1,
                            passage: "",
                            audioUrl: "",
                            groups: [{ groupOrder: 1, instructions: "", questions: [] }]
                        });
                    }
                } else if (newSecs.length > requiredLength) {
                    newSecs = newSecs.slice(0, requiredLength);
                }
                next.sections = newSecs;
            }
            return next;
        });
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
                    groups: [{ groupOrder: 1, instructions: "", questions: [] }]
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

    // Group Handlers
    const addGroup = (sIndex: number) => {
        const newSections = [...testData.sections];
        newSections[sIndex].groups.push({
            groupOrder: newSections[sIndex].groups.length + 1,
            instructions: "",
            questions: []
        });
        setTestData({ ...testData, sections: newSections });
    };

    const updateGroup = (sIndex: number, gIndex: number, field: string, value: any) => {
        const newSections = [...testData.sections];
        (newSections[sIndex].groups[gIndex] as any)[field] = value;
        setTestData({ ...testData, sections: newSections });
    };

    const removeGroup = (sIndex: number, gIndex: number) => {
        const newSections = [...testData.sections];
        newSections[sIndex].groups = newSections[sIndex].groups.filter((_, i) => i !== gIndex);
        // Reorder
        newSections[sIndex].groups.forEach((g, idx) => { g.groupOrder = idx + 1; });
        setTestData({ ...testData, sections: newSections });
    };

    // Question Handlers
    const addQuestion = (sIndex: number, gIndex: number) => {
        const newSections = [...testData.sections];
        newSections[sIndex].groups[gIndex].questions.push({
            questionOrder: newSections[sIndex].groups[gIndex].questions.length + 1,
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

    const updateQuestion = (sIndex: number, gIndex: number, qIndex: number, field: string, value: any) => {
        const newSections = [...testData.sections];
        (newSections[sIndex].groups[gIndex].questions[qIndex] as any)[field] = value;
        setTestData({ ...testData, sections: newSections });
    };

    const updateAnswer = (sIndex: number, gIndex: number, qIndex: number, field: string, value: any) => {
        const newSections = [...testData.sections];
        (newSections[sIndex].groups[gIndex].questions[qIndex].answer as any)[field] = value;
        setTestData({ ...testData, sections: newSections });
    };

    const removeQuestion = (sIndex: number, gIndex: number, qIndex: number) => {
        const newSections = [...testData.sections];
        newSections[sIndex].groups[gIndex].questions = newSections[sIndex].groups[gIndex].questions.filter((_, i) => i !== qIndex);
        // Reorder
        newSections[sIndex].groups[gIndex].questions.forEach((q, idx) => { q.questionOrder = idx + 1; });
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

                                {/* Groups List */}
                                <div className="mt-8">
                                    <div className="flex justify-between items-center mb-4 border-b pb-2">
                                        <h3 className="text-lg font-semibold text-slate-800">Question Groups</h3>
                                    </div>

                                    <div className="space-y-6">
                                        {section.groups.map((group, gIndex) => (
                                            <div key={gIndex} className="p-4 border border-slate-200 rounded-lg bg-slate-50 relative group/g">
                                                <button
                                                    onClick={() => removeGroup(sIndex, gIndex)}
                                                    title="Remove Group"
                                                    className="absolute top-2 right-2 p-2 text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover/g:opacity-100 transition-opacity"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>

                                                <div className="mb-6">
                                                    <label className="block text-sm font-medium text-slate-700 mb-2">Instructions (Optional)</label>
                                                    <RichTextEditor
                                                        value={group.instructions || ''}
                                                        onChange={(val: any) => updateGroup(sIndex, gIndex, 'instructions', val)}
                                                    />
                                                </div>

                                                <h4 className="font-medium text-sm text-slate-700 mb-3 border-b pb-1">Questions</h4>
                                                <div className="space-y-6 pl-4 border-l-2 border-slate-200">
                                                    {group.questions.map((q, qIndex) => {
                                                        const commonProps = {
                                                            order: q.questionOrder || (qIndex + 1),
                                                            questionText: q.questionText,
                                                            correctAnswers: q.answer?.correctAnswers || [""],
                                                            caseSensitive: q.answer?.caseSensitive || false,
                                                            onUpdateField: (field: string, value: any) => updateQuestion(sIndex, gIndex, qIndex, field, value),
                                                            onUpdateAnswer: (field: string, value: any) => updateAnswer(sIndex, gIndex, qIndex, field, value),
                                                            onRemove: () => removeQuestion(sIndex, gIndex, qIndex)
                                                        };

                                                        return (
                                                            <div key={qIndex} className="relative">
                                                                <div className="flex items-center gap-2 mb-3 bg-white p-2 rounded-lg w-fit border border-slate-200 shadow-sm">
                                                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-2">Type:</span>
                                                                    <select
                                                                        value={q.questionType}
                                                                        onChange={(e) => updateQuestion(sIndex, gIndex, qIndex, 'questionType', e.target.value)}
                                                                        className="border-0 rounded px-3 py-1 text-sm font-medium text-slate-700 outline-none cursor-pointer hover:bg-slate-50 transition-colors"
                                                                    >
                                                                        <option value="multiple_choice">Multiple Choice</option>
                                                                        <option value="fill_in_blank">Fill in Blank</option>
                                                                        <option value="matching">Matching</option>
                                                                        <option value="true_false_not_given">True / False / Not Given</option>
                                                                        <option value="yes_no_not_given">Yes / No / Not Given</option>
                                                                    </select>
                                                                </div>

                                                                {['multiple_choice', 'true_false_not_given', 'yes_no_not_given'].includes(q.questionType) && (
                                                                    <MultipleChoiceQuestion
                                                                        {...commonProps}
                                                                        questionType={q.questionType}
                                                                        options={q.config?.options || (q.questionType === 'true_false_not_given' ? ["TRUE", "FALSE", "NOT GIVEN"] : q.questionType === 'yes_no_not_given' ? ["YES", "NO", "NOT GIVEN"] : ["", "", "", ""])}
                                                                    />
                                                                )}
                                                                {q.questionType === 'fill_in_blank' && <FillInBlankQuestion {...commonProps} />}
                                                                {q.questionType === 'matching' && <MatchingQuestion {...commonProps} options={q.config?.options || ["", "", ""]} />}
                                                                {q.questionType === 'heading' && <HeadingMatchingQuestion {...commonProps} options={q.config?.options || ["", "", "", ""]} />}
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                <button
                                                    onClick={() => addQuestion(sIndex, gIndex)}
                                                    className="mt-6 flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50/50 hover:bg-blue-100 px-4 py-2.5 rounded-lg transition-colors w-full justify-center border border-blue-200 border-dashed"
                                                >
                                                    <PlusCircle className="w-4 h-4" />
                                                    Add Question to Group
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => addGroup(sIndex)}
                                        className="mt-6 flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-50 px-4 py-3 rounded-xl transition-colors border-2 border-slate-300 border-dashed w-full justify-center"
                                    >
                                        <PlusCircle className="w-4 h-4" />
                                        Add New Question Group
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
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Skill Category
                                </label>
                                <div className="relative">
                                    <select
                                        value={testData.skill}
                                        onChange={(e) => handleTestChange('skill', e.target.value)}
                                        disabled={isSkillLocked}
                                        className={`w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none ${isSkillLocked ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white'}`}
                                    >
                                        <option value="reading">Reading</option>
                                        <option value="listening">Listening</option>
                                        <option value="writing">Writing</option>
                                        <option value="speaking">Speaking</option>
                                    </select>
                                    {isSkillLocked && (
                                        <div className="absolute right-10 top-1/2 -translate-y-1/2 text-slate-400" title="Skill is locked based on your navigation">
                                            <Lock className="w-4 h-4" />
                                        </div>
                                    )}
                                </div>
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
export default function AddTestPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AddTestPageSuspense />
        </Suspense>
    );
}
