"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { createManualTest, CreateManualTestRequest } from "@/lib/api.tests";
import { useSearchParams } from "next/navigation";
import { PlusCircle, ArrowLeft, Save, Lock } from "lucide-react";
import { Suspense } from "react";
import SectionCard from "./_components/SectionCard";

export function AddTestPageSuspense() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const defaultAdminId = "a1b2c3d4-0000-0000-0000-000000000001";
  const createdBy = user?.id || defaultAdminId;

  const initialSkill =
    (searchParams.get("skill") as
      | "reading"
      | "listening"
      | "writing"
      | "speaking") || "reading";

  // Redirect writing/speaking to dedicated forms
  useEffect(() => {
    if (initialSkill === "writing") {
      router.replace("/admin/tests/add/writing");
    } else if (initialSkill === "speaking") {
      router.replace("/admin/tests/add/speaking");
    }
  }, [initialSkill, router]);

  const [isSkillLocked] = useState(!!searchParams.get("skill"));
  const [isSaving, setIsSaving] = useState(false);

  const makeInitialSection = (order: number) => ({
    sectionOrder: order,
    passage: "",
    audioUrl: "",
    groups: [{ groupOrder: 1, instructions: "", questions: [] }],
  });

  const [testData, setTestData] = useState<CreateManualTestRequest>({
    skill: initialSkill,
    title: "",
    isMock: false,
    createdBy,
    sections: Array.from({
      length: initialSkill === "reading" || initialSkill === "listening" ? 3 : 1,
    }).map((_, i) => makeInitialSection(i + 1)),
  });

  // While redirecting, don't render the full form
  if (initialSkill === "writing" || initialSkill === "speaking") {
    return <div className="p-8 text-slate-500">Redirecting…</div>;
  }

  // ─── Test-level Handlers ──────────────────────────────────────────────────

  const handleTestChange = (field: keyof CreateManualTestRequest, value: unknown) => {
    setTestData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "skill" && (value === "listening" || value === "reading")) {
        const required = 3;
        let secs = [...next.sections];
        if (secs.length < required) {
          for (let i = secs.length; i < required; i++)
            secs.push(makeInitialSection(i + 1));
        } else if (secs.length > required) {
          secs = secs.slice(0, required);
        }
        next.sections = secs;
      }
      return next;
    });
  };

  const addSection = () => {
    setTestData((prev) => ({
      ...prev,
      sections: [...prev.sections, makeInitialSection(prev.sections.length + 1)],
    }));
  };

  // ─── Section Handlers ─────────────────────────────────────────────────────

  const updateSection = (sIndex: number, field: string, value: unknown) => {
    setTestData((prev) => ({
      ...prev,
      sections: prev.sections.map((s, i) =>
        i === sIndex ? { ...s, [field]: value } : s,
      ),
    }));
  };

  const removeSection = (sIndex: number) => {
    toast("Remove Section?", {
      description: "Are you sure you want to remove this entire section?",
      action: {
        label: "Remove",
        onClick: () =>
          setTestData((prev) => {
            const secs = prev.sections
              .filter((_, i) => i !== sIndex)
              .map((s, i) => ({ ...s, sectionOrder: i + 1 }));
            return { ...prev, sections: secs };
          }),
      },
      cancel: { label: "Cancel", onClick: () => { } },
    });
  };

  // ─── Group Handlers ───────────────────────────────────────────────────────

  const addGroup = (sIndex: number) => {
    setTestData((prev) => ({
      ...prev,
      sections: prev.sections.map((s, si) =>
        si !== sIndex
          ? s
          : {
            ...s,
            groups: [
              ...s.groups,
              { groupOrder: s.groups.length + 1, instructions: "", questions: [] },
            ],
          },
      ),
    }));
  };

  const updateGroup = (sIndex: number, gIndex: number, field: string, value: unknown) => {
    setTestData((prev) => ({
      ...prev,
      sections: prev.sections.map((s, si) =>
        si !== sIndex
          ? s
          : {
            ...s,
            groups: s.groups.map((g, gi) =>
              gi === gIndex ? { ...g, [field]: value } : g,
            ),
          },
      ),
    }));
  };

  const removeGroup = (sIndex: number, gIndex: number) => {
    toast("Remove Group?", {
      description: "Are you sure you want to remove this question group?",
      action: {
        label: "Remove",
        onClick: () =>
          setTestData((prev) => {
            const sections = prev.sections.map((s, si) => {
              if (si !== sIndex) return s;
              const groups = s.groups
                .filter((_, i) => i !== gIndex)
                .map((g, i) => ({ ...g, groupOrder: i + 1 }));
              return { ...s, groups };
            });
            return { ...prev, sections };
          }),
      },
      cancel: { label: "Cancel", onClick: () => { } },
    });
  };

  // ─── Question Handlers ────────────────────────────────────────────────────

  const addQuestion = (sIndex: number, gIndex: number) => {
    setTestData((prev) => ({
      ...prev,
      sections: prev.sections.map((s, si) =>
        si !== sIndex
          ? s
          : {
            ...s,
            groups: s.groups.map((g, gi) =>
              gi !== gIndex
                ? g
                : {
                  ...g,
                  questions: [
                    ...g.questions,
                    {
                      questionOrder: g.questions.length + 1,
                      questionType: "multiple_choice",
                      questionText: "",
                      config: {},
                      explanation: "",
                      answer: { correctAnswers: [""], caseSensitive: false },
                    },
                  ],
                },
            ),
          },
      ),
    }));
  };

  const updateQuestion = (
    sIndex: number,
    gIndex: number,
    qIndex: number,
    field: string,
    value: unknown,
  ) => {
    setTestData((prev) => ({
      ...prev,
      sections: prev.sections.map((s, si) =>
        si !== sIndex
          ? s
          : {
            ...s,
            groups: s.groups.map((g, gi) =>
              gi !== gIndex
                ? g
                : {
                  ...g,
                  questions: g.questions.map((q, qi) =>
                    qi === qIndex ? { ...q, [field]: value } : q,
                  ),
                },
            ),
          },
      ),
    }));
  };

  const updateAnswer = (
    sIndex: number,
    gIndex: number,
    qIndex: number,
    field: string,
    value: unknown,
  ) => {
    setTestData((prev) => ({
      ...prev,
      sections: prev.sections.map((s, si) =>
        si !== sIndex
          ? s
          : {
            ...s,
            groups: s.groups.map((g, gi) =>
              gi !== gIndex
                ? g
                : {
                  ...g,
                  questions: g.questions.map((q, qi) =>
                    qi === qIndex
                      ? { ...q, answer: { ...q.answer, [field]: value } }
                      : q,
                  ),
                },
            ),
          },
      ),
    }));
  };

  const removeQuestion = (sIndex: number, gIndex: number, qIndex: number) => {
    toast("Remove Question?", {
      description: "Are you sure you want to remove this question?",
      action: {
        label: "Remove",
        onClick: () =>
          setTestData((prev) => ({
            ...prev,
            sections: prev.sections.map((s, si) =>
              si !== sIndex
                ? s
                : {
                  ...s,
                  groups: s.groups.map((g, gi) =>
                    gi !== gIndex
                      ? g
                      : {
                        ...g,
                        questions: g.questions
                          .filter((_, i) => i !== qIndex)
                          .map((q, i) => ({ ...q, questionOrder: i + 1 })),
                      },
                  ),
                },
            ),
          })),
      },
      cancel: { label: "Cancel", onClick: () => { } },
    });
  };

  // ─── Save ─────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!testData.title.trim()) return toast.error("Test Title is required");
    setIsSaving(true);
    try {
      await createManualTest(testData);
      toast.success("Test created successfully!");
      router.push("/admin/tests");
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save test",
      );
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="p-8 max-w-6xl mx-auto pb-24">
      {/* Page Header */}
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
          {isSaving ? "Saving…" : "Save Test"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Left: Sections & Questions ── */}
        <div className="lg:col-span-2 space-y-8">
          {testData.sections.map((section, sIndex) => (
            <SectionCard
              key={sIndex}
              section={section}
              sIndex={sIndex}
              skill={testData.skill}
              onUpdateSection={(f, v) => updateSection(sIndex, f, v)}
              onRemoveSection={() => removeSection(sIndex)}
              onAddGroup={() => addGroup(sIndex)}
              onUpdateGroup={(gi, f, v) => updateGroup(sIndex, gi, f, v)}
              onRemoveGroup={(gi) => removeGroup(sIndex, gi)}
              onAddQuestion={(gi) => addQuestion(sIndex, gi)}
              onUpdateQuestion={(gi, qi, f, v) =>
                updateQuestion(sIndex, gi, qi, f, v)
              }
              onUpdateAnswer={(gi, qi, f, v) =>
                updateAnswer(sIndex, gi, qi, f, v)
              }
              onRemoveQuestion={(gi, qi) => removeQuestion(sIndex, gi, qi)}
            />
          ))}

          <button
            onClick={addSection}
            className="w-full py-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 font-medium hover:border-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
          >
            <PlusCircle className="w-5 h-5" />
            Add New Section
          </button>
        </div>

        {/* ── Right: Meta Sidebar ── */}
        <div className="lg:col-span-1">
          <div className="bg-white border rounded-xl shadow-sm p-6 sticky top-8">
            <h2 className="text-lg font-semibold text-slate-800 mb-6 pb-2 border-b">
              Test Meta Data
            </h2>

            <div className="space-y-5">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={testData.title}
                  onChange={(e) => handleTestChange("title", e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                  placeholder="e.g. Cambridge IELTS 15 Test 1"
                  required
                />
              </div>

              {/* Skill */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Skill Category
                </label>
                <div className="relative">
                  <select
                    value={testData.skill}
                    onChange={(e) => {
                      const newSkill = e.target.value;
                      if (newSkill === "writing") {
                        router.push("/admin/tests/add/writing");
                      } else if (newSkill === "speaking") {
                        router.push("/admin/tests/add/speaking");
                      } else {
                        handleTestChange("skill", newSkill);
                      }
                    }}
                    disabled={isSkillLocked}
                    className={`w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none ${isSkillLocked
                      ? "bg-slate-100 text-slate-500 cursor-not-allowed"
                      : "bg-white"
                      }`}
                  >
                    <option value="reading">Reading</option>
                    <option value="listening">Listening</option>
                    <option value="writing">Writing</option>
                    <option value="speaking">Speaking</option>
                  </select>
                  {isSkillLocked && (
                    <div
                      className="absolute right-10 top-1/2 -translate-y-1/2 text-slate-400"
                      title="Skill is locked based on your navigation"
                    >
                      <Lock className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>

              {/* Mock Toggle */}
              <div className="flex justify-between items-center p-3 bg-slate-50 border rounded-lg">
                <div>
                  <label className="text-sm font-medium text-slate-800 block">
                    Mock Test
                  </label>
                  <span className="text-xs text-slate-500">
                    Is this a full mock test?
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={testData.isMock}
                    onChange={(e) =>
                      handleTestChange("isMock", e.target.checked)
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
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
    <Suspense fallback={<div>Loading…</div>}>
      <AddTestPageSuspense />
    </Suspense>
  );
}

