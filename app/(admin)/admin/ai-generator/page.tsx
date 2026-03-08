"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { createManualTest, CreateManualTestRequest } from "@/lib/api.tests";

// ── types ─────────────────────────────────────────────────────────────────────

type Skill = "reading" | "listening";
type Step = "configure" | "generating" | "preview";

interface GeneratedTest {
  title: string;
  skill: Skill;
  isMock: boolean;
  sections: Array<{
    sectionOrder: number;
    passage?: string;
    audioUrl?: string;
    groups: Array<{
      groupOrder: number;
      instructions?: string;
      questions: Array<{
        questionOrder: number;
        questionType: string;
        questionText?: string;
        config: Record<string, unknown>;
        explanation?: string;
        answer: { correctAnswers: string[]; caseSensitive: boolean };
      }>;
    }>;
  }>;
}

const QUESTION_TYPES = [
  { value: "true_false_not_given", label: "True / False / Not Given" },
  { value: "yes_no_not_given", label: "Yes / No / Not Given" },
  { value: "fill_in_blank", label: "Fill in the Blank" },
  { value: "multiple_choice", label: "Multiple Choice" },
  { value: "matching", label: "Matching" },
  { value: "matching_heading", label: "Matching Headings" },
  { value: "sentence_ending", label: "Sentence Ending" },
  { value: "matching_features", label: "Matching Features" },
];

const DIFFICULTIES = [
  "Band 5-6 (Foundation)",
  "Band 6-7 (Intermediate)",
  "Band 7-8 (Upper-Intermediate)",
  "Band 8-9 (Advanced)",
];

const QUESTION_TYPE_COLORS: Record<string, string> = {
  true_false_not_given: "bg-blue-100 text-blue-700",
  yes_no_not_given: "bg-sky-100 text-sky-700",
  fill_in_blank: "bg-amber-100 text-amber-700",
  multiple_choice: "bg-purple-100 text-purple-700",
  matching: "bg-green-100 text-green-700",
  matching_heading: "bg-orange-100 text-orange-700",
  sentence_ending: "bg-teal-100 text-teal-700",
  matching_features: "bg-rose-100 text-rose-700",
};

// ── helpers ───────────────────────────────────────────────────────────────────

function shortTypeName(t: string) {
  const map: Record<string, string> = {
    true_false_not_given: "T/F/NG",
    yes_no_not_given: "Y/N/NG",
    fill_in_blank: "Fill",
    multiple_choice: "MCQ",
    matching: "Match",
    matching_heading: "Hdg",
    sentence_ending: "Sent",
    matching_features: "Feat",
  };
  return map[t] ?? t;
}

function totalQuestions(test: GeneratedTest) {
  return test.sections.reduce(
    (a, s) => a + s.groups.reduce((b, g) => b + g.questions.length, 0),
    0,
  );
}

// ── sub-components ────────────────────────────────────────────────────────────

function StepBadge({
  n,
  label,
  active,
  done,
}: {
  n: number;
  label: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
          done
            ? "bg-green-500 text-white"
            : active
              ? "bg-orange-500 text-white"
              : "bg-slate-200 text-slate-500"
        }`}
      >
        {done ? "✓" : n}
      </div>
      <span
        className={`text-sm font-medium ${active ? "text-foreground" : "text-muted-foreground"}`}
      >
        {label}
      </span>
    </div>
  );
}

function Divider() {
  return <div className="flex-1 h-px bg-border mx-2 mt-3.5" />;
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function AIGeneratorPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [step, setStep] = useState<Step>("configure");
  const [isSaving, setIsSaving] = useState(false);

  // form state
  const [skill, setSkill] = useState<Skill>("reading");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState(DIFFICULTIES[1]);
  const [numSections, setNumSections] = useState<number | "">(3);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [isMock, setIsMock] = useState(false);
  const [extraInstructions, setExtraInstructions] = useState("");

  // generated result
  const [generated, setGenerated] = useState<GeneratedTest | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0]));
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["0-0"]));

  // ── handlers ──────────────────────────────────────────────────────────────

  const toggleType = (v: string) =>
    setSelectedTypes((prev) =>
      prev.includes(v) ? prev.filter((t) => t !== v) : [...prev, v],
    );

  const toggleSection = (i: number) =>
    setExpandedSections((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });

  const toggleGroup = (key: string) =>
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error("Please enter a topic for the test.");
      return;
    }
    setStep("generating");
    try {
      const res = await fetch("/api/ai/generate-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skill,
          topic: topic.trim(),
          numSections: numSections || (skill === "listening" ? 4 : 3),
          difficulty,
          questionTypes: selectedTypes,
          additionalInstructions: extraInstructions.trim(),
          isMock,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error ?? "Generation failed.");
      }
      setGenerated(data.test as GeneratedTest);
      setExpandedSections(new Set([0]));
      setExpandedGroups(new Set(["0-0"]));
      setStep("preview");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "AI generation failed.");
      setStep("configure");
    }
  };

  const handleSave = async () => {
    if (!generated) return;
    const defaultAdminId = "a1b2c3d4-0000-0000-0000-000000000001";
    const payload: CreateManualTestRequest = {
      ...generated,
      createdBy: user?.id ?? defaultAdminId,
    } as CreateManualTestRequest;
    setIsSaving(true);
    try {
      await createManualTest(payload);
      toast.success("Test saved successfully!");
      router.push("/admin/tests");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save test.");
    } finally {
      setIsSaving(false);
    }
  };

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-[22px]">
                auto_awesome
              </span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              AI Test Generator
            </h1>
          </div>
          <p className="text-muted-foreground text-sm ml-13 pl-0.5">
            Describe what you need — GPT-4o will generate a complete IELTS test
            matching your database schema.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center mb-8">
          <StepBadge
            n={1}
            label="Configure"
            active={step === "configure"}
            done={step !== "configure"}
          />
          <Divider />
          <StepBadge
            n={2}
            label="Generate"
            active={step === "generating"}
            done={step === "preview"}
          />
          <Divider />
          <StepBadge
            n={3}
            label="Preview & Save"
            active={step === "preview"}
            done={false}
          />
        </div>

        {/* ── STEP 1: Configure ── */}
        {step === "configure" && (
          <div className="bg-white rounded-2xl border border-border shadow-sm p-6 space-y-6">
            {/* Skill */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Skill
              </label>
              <div className="flex gap-3">
                {(["reading", "listening"] as Skill[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setSkill(s);
                      setNumSections(s === "listening" ? 4 : 3);
                    }}
                    className={`flex-1 py-3 rounded-xl border-2 text-sm font-semibold capitalize transition-all ${
                      skill === s
                        ? "border-orange-500 bg-orange-50 text-orange-700"
                        : "border-border text-muted-foreground hover:border-slate-400"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px] align-middle mr-1.5">
                      {s === "reading" ? "menu_book" : "headphones"}
                    </span>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Topic */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Topic / Theme{" "}
                <span className="text-orange-500">*</span>
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder='e.g. "Urban Architecture", "Marine Biology", "Artificial Intelligence"'
                className="w-full border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400 bg-background"
              />
            </div>

            {/* Difficulty & Sections */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Difficulty
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400 bg-background"
                >
                  {DIFFICULTIES.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Sections
                </label>
                <input
                  type="number"
                  min={1}
                  max={skill === "listening" ? 4 : 3}
                  value={numSections}
                  onChange={(e) =>
                    setNumSections(
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400 bg-background"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Max {skill === "listening" ? 4 : 3} for {skill}
                </p>
              </div>
            </div>

            {/* Question types */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1">
                Preferred Question Types{" "}
                <span className="text-muted-foreground font-normal">
                  (leave empty for AI to decide)
                </span>
              </label>
              <div className="flex flex-wrap gap-2 mt-2">
                {QUESTION_TYPES.map(({ value, label }) => {
                  const sel = selectedTypes.includes(value);
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => toggleType(value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        sel
                          ? "border-orange-400 bg-orange-50 text-orange-700"
                          : "border-border text-muted-foreground hover:border-slate-400"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Test type */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsMock((v) => !v)}
                className={`relative w-11 h-6 rounded-full transition-colors ${isMock ? "bg-orange-500" : "bg-slate-300"}`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${isMock ? "translate-x-5" : "translate-x-0"}`}
                />
              </button>
              <span className="text-sm font-medium text-foreground">
                Mock Test{" "}
                <span className="text-muted-foreground font-normal">
                  (off = Practice test)
                </span>
              </span>
            </div>

            {/* Extra instructions */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Additional Instructions{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </label>
              <textarea
                value={extraInstructions}
                onChange={(e) => setExtraInstructions(e.target.value)}
                rows={3}
                placeholder='e.g. "Include a graph description task", "Focus on matching headings for section 2", "Make section 1 about a conversation between two people"'
                className="w-full border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400 bg-background resize-none"
              />
            </div>

            {/* Generate button */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleGenerate}
                className="flex items-center gap-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-semibold px-6 py-2.5 rounded-xl shadow-md transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">
                  auto_awesome
                </span>
                Generate with AI
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Generating ── */}
        {step === "generating" && (
          <div className="bg-white rounded-2xl border border-border shadow-sm p-16 flex flex-col items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-4 border-violet-200 border-t-violet-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="material-symbols-outlined text-violet-500 text-[28px]">
                  auto_awesome
                </span>
              </div>
            </div>
            <div className="text-center">
              <h2 className="text-lg font-bold text-foreground mb-1">
                Generating your IELTS test…
              </h2>
              <p className="text-sm text-muted-foreground">
                GPT-4o is creating passages, questions, and answer keys.
                <br />
                This usually takes 20–40 seconds.
              </p>
            </div>
            <div className="flex gap-2 mt-2">
              {["Writing passage", "Crafting questions", "Setting answers"].map(
                (label, i) => (
                  <div
                    key={i}
                    className="px-3 py-1.5 bg-violet-50 border border-violet-200 rounded-full text-xs font-medium text-violet-700 animate-pulse"
                    style={{ animationDelay: `${i * 0.3}s` }}
                  >
                    {label}
                  </div>
                ),
              )}
            </div>
          </div>
        )}

        {/* ── STEP 3: Preview ── */}
        {step === "preview" && generated && (
          <div className="space-y-6">
            {/* Test summary card */}
            <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                        generated.skill === "reading"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {generated.skill}
                    </span>
                    {generated.isMock && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-orange-100 text-orange-700">
                        Mock
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-foreground">
                    {generated.title}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {generated.sections.length} section
                    {generated.sections.length !== 1 ? "s" : ""} ·{" "}
                    {totalQuestions(generated)} questions total
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setStep("configure")}
                    className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-slate-50 transition-colors"
                  >
                    Reconfigure
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={isSaving}
                    className="px-4 py-2 rounded-lg border border-violet-300 bg-violet-50 text-violet-700 text-sm font-medium hover:bg-violet-100 transition-colors flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      refresh
                    </span>
                    Regenerate
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-colors flex items-center gap-1.5 shadow"
                  >
                    {isSaving ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Saving…
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[16px]">
                          save
                        </span>
                        Save to Database
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Sections */}
            {generated.sections.map((section, si) => {
              const isSectionOpen = expandedSections.has(si);
              const sectionQCount = section.groups.reduce(
                (a, g) => a + g.questions.length,
                0,
              );
              return (
                <div
                  key={si}
                  className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden"
                >
                  {/* Section header */}
                  <button
                    type="button"
                    onClick={() => toggleSection(si)}
                    className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm">
                        {section.sectionOrder}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">
                          Section {section.sectionOrder}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {section.groups.length} group
                          {section.groups.length !== 1 ? "s" : ""} ·{" "}
                          {sectionQCount} question
                          {sectionQCount !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-muted-foreground text-[20px]">
                      {isSectionOpen ? "expand_less" : "expand_more"}
                    </span>
                  </button>

                  {isSectionOpen && (
                    <div className="border-t border-border divide-y divide-border">
                      {/* Passage preview */}
                      {section.passage && (
                        <div className="p-5 bg-slate-50">
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                            {generated.skill === "reading"
                              ? "Passage"
                              : "Audio Transcript"}
                          </p>
                          <p className="text-sm text-foreground leading-relaxed line-clamp-5 whitespace-pre-wrap">
                            {section.passage}
                          </p>
                          {section.passage.length > 300 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              … ({section.passage.length.toLocaleString()}{" "}
                              characters)
                            </p>
                          )}
                        </div>
                      )}

                      {/* Groups */}
                      {section.groups.map((group, gi) => {
                        const groupKey = `${si}-${gi}`;
                        const isGroupOpen = expandedGroups.has(groupKey);
                        return (
                          <div key={gi}>
                            <button
                              type="button"
                              onClick={() => toggleGroup(groupKey)}
                              className="w-full flex items-center justify-between px-5 py-3 hover:bg-slate-50 text-left transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                  Group {group.groupOrder}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  ·{" "}
                                  {group.questions.length} question
                                  {group.questions.length !== 1 ? "s" : ""}
                                </span>
                                {/* type chips */}
                                <div className="flex gap-1 ml-1">
                                  {[
                                    ...new Set(
                                      group.questions.map((q) => q.questionType),
                                    ),
                                  ].map((t) => (
                                    <span
                                      key={t}
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${QUESTION_TYPE_COLORS[t] ?? "bg-slate-100 text-slate-600"}`}
                                    >
                                      {shortTypeName(t)}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <span className="material-symbols-outlined text-muted-foreground text-[18px]">
                                {isGroupOpen ? "expand_less" : "expand_more"}
                              </span>
                            </button>

                            {isGroupOpen && (
                              <div className="px-5 pb-5 space-y-3">
                                {group.instructions && (
                                  <p className="text-xs font-medium text-slate-600 italic bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
                                    {group.instructions}
                                  </p>
                                )}
                                {group.questions.map((q, qi) => (
                                  <div
                                    key={qi}
                                    className="rounded-lg border border-border bg-background p-3"
                                  >
                                    <div className="flex items-start gap-2 mb-1.5">
                                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                                        {q.questionOrder}
                                      </span>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span
                                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${QUESTION_TYPE_COLORS[q.questionType] ?? "bg-slate-100 text-slate-600"}`}
                                          >
                                            {shortTypeName(q.questionType)}
                                          </span>
                                        </div>
                                        {q.questionText && (
                                          <p className="text-sm text-foreground leading-snug">
                                            {q.questionText}
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    {/* Options */}
                                    {Array.isArray(q.config?.options) &&
                                      (q.config.options as string[]).length >
                                        0 && (
                                        <div className="ml-7 mt-1.5 flex flex-wrap gap-1">
                                          {(q.config.options as string[]).map(
                                            (opt, oi) => (
                                              <span
                                                key={oi}
                                                className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded"
                                              >
                                                {opt}
                                              </span>
                                            ),
                                          )}
                                        </div>
                                      )}

                                    {/* Correct answer */}
                                    <div className="ml-7 mt-2 flex items-center gap-1.5">
                                      <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">
                                        Answer:
                                      </span>
                                      <span className="text-[11px] font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200">
                                        {q.answer.correctAnswers.join(" / ")}
                                      </span>
                                      {q.explanation && (
                                        <span
                                          className="text-[11px] text-muted-foreground truncate max-w-[300px]"
                                          title={q.explanation}
                                        >
                                          — {q.explanation}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Bottom save bar */}
            <div className="bg-white rounded-2xl border border-border shadow-sm p-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Review the test above, then save it to your database.
              </p>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-colors flex items-center gap-2 shadow"
              >
                {isSaving ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">
                      save
                    </span>
                    Save Test to Database
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
