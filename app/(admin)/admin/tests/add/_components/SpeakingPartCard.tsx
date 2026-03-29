"use client";

import { useState } from "react";
import { PlusCircle, Trash2, Mic, Clock, AlertCircle } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SpeakingQuestionData { questionText: string; audioUrl: string; }
export interface SpeakingTopicData { topicName: string; questions: SpeakingQuestionData[]; }
export interface Part1Data { topics: SpeakingTopicData[]; }
export interface Part2Data { mainTopic: string; cues: string[]; prepTime: number; speakTime: number; }
export interface Part3Data { questions: SpeakingQuestionData[]; }

// ─── Part 1 ───────────────────────────────────────────────────────────────────

interface Part1Props { data: Part1Data; onChange: (data: Part1Data) => void; }

export function SpeakingPart1Card({ data, onChange }: Part1Props) {
  const addTopic = () =>
    onChange({ topics: [...data.topics, { topicName: "", questions: [{ questionText: "", audioUrl: "" }] }] });

  const removeTopic = (ti: number) =>
    onChange({ topics: data.topics.filter((_, i) => i !== ti) });

  const updateTopic = (ti: number, field: keyof SpeakingTopicData, value: unknown) =>
    onChange({ topics: data.topics.map((t, i) => i === ti ? { ...t, [field]: value } : t) });

  const addQuestion = (ti: number) =>
    onChange({ topics: data.topics.map((t, i) => i === ti ? { ...t, questions: [...t.questions, { questionText: "", audioUrl: "" }] } : t) });

  const removeQuestion = (ti: number, qi: number) =>
    onChange({ topics: data.topics.map((t, i) => i === ti ? { ...t, questions: t.questions.filter((_, j) => j !== qi) } : t) });

  const updateQuestion = (ti: number, qi: number, field: keyof SpeakingQuestionData, value: string) =>
    onChange({
      topics: data.topics.map((t, i) => i !== ti ? t : {
        ...t, questions: t.questions.map((q, j) => j === qi ? { ...q, [field]: value } : q)
      })
    });

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 bg-blue-50 border-b border-blue-100">
        <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">1</span>
        <div>
          <h3 className="text-base font-semibold text-slate-800">Part 1 — Interview</h3>
          <p className="text-xs text-slate-500">Familiar topics with personal questions</p>
        </div>
      </div>
      <div className="p-6 space-y-4">
        {data.topics.map((topic, ti) => (
          <div key={ti} className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border-b border-slate-200">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Topic {ti + 1}</span>
              <input
                value={topic.topicName}
                onChange={(e) => updateTopic(ti, "topicName", e.target.value)}
                placeholder="e.g. Family, Hobbies, Technology"
                className="flex-1 border border-slate-300 rounded-md px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
              />
              {data.topics.length > 1 && (
                <button onClick={() => removeTopic(ti)} className="p-1.5 text-red-400 hover:text-red-600 rounded transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="p-4 space-y-3">
              {topic.questions.map((q, qi) => (
                <div key={qi} className="flex gap-2 items-start">
                  <span className="mt-2.5 text-xs text-slate-400 font-medium w-4 shrink-0">Q{qi + 1}</span>
                  <input
                    value={q.questionText}
                    onChange={(e) => updateQuestion(ti, qi, "questionText", e.target.value)}
                    placeholder="Enter question text..."
                    className="flex-1 border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                  <input
                    value={q.audioUrl}
                    onChange={(e) => updateQuestion(ti, qi, "audioUrl", e.target.value)}
                    placeholder="Audio URL (optional)"
                    className="w-48 border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                  {topic.questions.length > 1 && (
                    <button onClick={() => removeQuestion(ti, qi)} className="mt-2 p-1 text-red-400 hover:text-red-600 rounded transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button onClick={() => addQuestion(ti)} className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium mt-1">
                <PlusCircle className="w-3.5 h-3.5" /> Add Question
              </button>
            </div>
          </div>
        ))}
        <button
          onClick={addTopic}
          className="w-full py-3 border-2 border-dashed border-slate-300 rounded-lg text-sm text-slate-500 hover:border-slate-400 hover:text-slate-700 flex items-center justify-center gap-2 transition-colors"
        >
          <PlusCircle className="w-4 h-4" /> Add Topic
        </button>
      </div>
    </div>
  );
}

// ─── Part 2 ───────────────────────────────────────────────────────────────────

interface Part2Props { data: Part2Data; onChange: (data: Part2Data) => void; }

export function SpeakingPart2Card({ data, onChange }: Part2Props) {
  const addCue = () => onChange({ ...data, cues: [...data.cues, ""] });
  const removeCue = (i: number) => onChange({ ...data, cues: data.cues.filter((_, j) => j !== i) });
  const updateCue = (i: number, v: string) =>
    onChange({ ...data, cues: data.cues.map((c, j) => j === i ? v : c) });

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 bg-amber-50 border-b border-amber-100">
        <span className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-sm">2</span>
        <div>
          <h3 className="text-base font-semibold text-slate-800">Part 2 — Cue Card</h3>
          <p className="text-xs text-slate-500">Long turn with preparation time</p>
        </div>
      </div>
      <div className="p-6 space-y-5">
        {/* Main Topic */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Main Topic <span className="text-red-500">*</span></label>
          <input
            value={data.mainTopic}
            onChange={(e) => onChange({ ...data, mainTopic: e.target.value })}
            placeholder="e.g. Describe a place you have visited recently."
            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
          />
        </div>

        {/* Cues */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Bullet Points (Cues)</label>
          <div className="space-y-2">
            {data.cues.map((cue, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold shrink-0">•</span>
                <input
                  value={cue}
                  onChange={(e) => updateCue(i, e.target.value)}
                  placeholder={`Cue point ${i + 1}...`}
                  className="flex-1 border border-slate-300 rounded-md px-3 py-1.5 text-sm focus:ring-1 focus:ring-amber-500 outline-none"
                />
                {data.cues.length > 1 && (
                  <button onClick={() => removeCue(i)} className="p-1 text-red-400 hover:text-red-600 rounded transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button onClick={addCue} className="flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-700 font-medium mt-1">
              <PlusCircle className="w-3.5 h-3.5" /> Add Cue
            </button>
          </div>
        </div>

        {/* Timing */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Prep Time (min)</span>
            </label>
            <input
              type="number" min={0} max={5}
              value={data.prepTime}
              onChange={(e) => onChange({ ...data, prepTime: Number(e.target.value) })}
              className="w-full border border-slate-300 rounded-lg p-2.5 text-sm text-center font-semibold focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              <span className="flex items-center gap-1"><Mic className="w-3.5 h-3.5" /> Speak Time (min)</span>
            </label>
            <input
              type="number" min={1} max={10}
              value={data.speakTime}
              onChange={(e) => onChange({ ...data, speakTime: Number(e.target.value) })}
              className="w-full border border-slate-300 rounded-lg p-2.5 text-sm text-center font-semibold focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Part 3 ───────────────────────────────────────────────────────────────────

interface Part3Props { data: Part3Data; onChange: (data: Part3Data) => void; }

export function SpeakingPart3Card({ data, onChange }: Part3Props) {
  const addQuestion = () =>
    onChange({ questions: [...data.questions, { questionText: "", audioUrl: "" }] });

  const removeQuestion = (i: number) =>
    onChange({ questions: data.questions.filter((_, j) => j !== i) });

  const updateQuestion = (i: number, field: keyof SpeakingQuestionData, value: string) =>
    onChange({ questions: data.questions.map((q, j) => j === i ? { ...q, [field]: value } : q) });

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 bg-purple-50 border-b border-purple-100">
        <span className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-sm">3</span>
        <div>
          <h3 className="text-base font-semibold text-slate-800">Part 3 — Discussion</h3>
          <p className="text-xs text-slate-500">Abstract questions related to Part 2 topic</p>
        </div>
      </div>
      <div className="p-6 space-y-3">
        {data.questions.map((q, i) => (
          <div key={i} className="flex gap-2 items-start">
            <span className="mt-2.5 text-xs text-slate-400 font-medium w-4 shrink-0">Q{i + 1}</span>
            <input
              value={q.questionText}
              onChange={(e) => updateQuestion(i, "questionText", e.target.value)}
              placeholder="e.g. How important is it for people to visit historical places?"
              className="flex-1 border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-purple-500 outline-none"
            />
            <input
              value={q.audioUrl}
              onChange={(e) => updateQuestion(i, "audioUrl", e.target.value)}
              placeholder="Audio URL (optional)"
              className="w-48 border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-500 focus:ring-1 focus:ring-purple-500 outline-none"
            />
            {data.questions.length > 1 && (
              <button onClick={() => removeQuestion(i)} className="mt-2 p-1 text-red-400 hover:text-red-600 rounded transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
        <button
          onClick={addQuestion}
          className="w-full py-3 border-2 border-dashed border-purple-200 rounded-lg text-sm text-purple-500 hover:border-purple-300 hover:text-purple-700 flex items-center justify-center gap-2 transition-colors mt-2"
        >
          <PlusCircle className="w-4 h-4" /> Add Discussion Question
        </button>
      </div>
    </div>
  );
}
