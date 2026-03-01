"use client";

import { PlusCircle, Trash2, BookOpen, Layers } from "lucide-react";
import RichTextEditor from "@/app/(admin)/_components/RichTextEditor";
import QuestionItem from "./QuestionItem";

// ── Pool label constants ──────────────────────────────────────────────────────

const ROMAN = [
  "I","II","III","IV","V","VI","VII","VIII","IX","X",
  "XI","XII","XIII","XIV","XV","XVI","XVII","XVIII","XIX","XX",
];
const MAX_LETTER_OPTIONS = 26;

// ── Pool section configs ──────────────────────────────────────────────────────

type PoolTheme = "orange" | "purple" | "teal" | "violet";

interface PoolConfig {
  type: string;
  title: string;
  description: string;
  addLabel: string;
  placeholder: string;
  theme: PoolTheme;
  labelMode: "roman" | "letter";
}

const POOL_CONFIGS: PoolConfig[] = [
  {
    type: "matching_heading",
    title: "Heading Pool",
    description: "Shared list of headings for all Matching Heading questions in this group.",
    addLabel: "+ Add Heading",
    placeholder: "e.g. The impact of globalisation on food supply",
    theme: "orange",
    labelMode: "roman",
  },
  {
    type: "matching",
    title: "Matching Options Pool",
    description: "Shared options (A, B, C…) for all Matching questions in this group.",
    addLabel: "+ Add Option",
    placeholder: "e.g. Paragraph A — describes economic growth",
    theme: "purple",
    labelMode: "letter",
  },
  {
    type: "sentence_ending",
    title: "Sentence Endings Pool",
    description: "Shared endings (A, B, C…) for all Sentence Ending questions in this group.",
    addLabel: "+ Add Ending",
    placeholder: "e.g. …reduced industrial output significantly",
    theme: "teal",
    labelMode: "letter",
  },
  {
    type: "matching_features",
    title: "Features / People Pool",
    description: "Shared features or people (A, B, C…) for all Matching Features questions in this group.",
    addLabel: "+ Add Feature",
    placeholder: "e.g. Dr. Smith / Organisation X",
    theme: "violet",
    labelMode: "letter",
  },
];

// ── Theme CSS maps ────────────────────────────────────────────────────────────

const THEME = {
  orange: {
    border: "border-orange-200",
    bg: "bg-orange-50/60",
    headerBg: "bg-orange-100/70 border-b border-orange-200",
    icon: "text-orange-600",
    title: "text-orange-800",
    desc: "text-orange-700",
    inputBorder: "border-orange-200 focus:ring-orange-400",
    badge: "bg-orange-600",
    btn: "text-orange-700 bg-orange-100 hover:bg-orange-200",
    empty: "text-orange-400",
  },
  purple: {
    border: "border-purple-200",
    bg: "bg-purple-50/60",
    headerBg: "bg-purple-100/70 border-b border-purple-200",
    icon: "text-purple-600",
    title: "text-purple-800",
    desc: "text-purple-700",
    inputBorder: "border-purple-200 focus:ring-purple-400",
    badge: "bg-purple-600",
    btn: "text-purple-700 bg-purple-100 hover:bg-purple-200",
    empty: "text-purple-400",
  },
  teal: {
    border: "border-teal-200",
    bg: "bg-teal-50/60",
    headerBg: "bg-teal-100/70 border-b border-teal-200",
    icon: "text-teal-600",
    title: "text-teal-800",
    desc: "text-teal-700",
    inputBorder: "border-teal-200 focus:ring-teal-400",
    badge: "bg-teal-600",
    btn: "text-teal-700 bg-teal-100 hover:bg-teal-200",
    empty: "text-teal-400",
  },
  violet: {
    border: "border-violet-200",
    bg: "bg-violet-50/60",
    headerBg: "bg-violet-100/70 border-b border-violet-200",
    icon: "text-violet-600",
    title: "text-violet-800",
    desc: "text-violet-700",
    inputBorder: "border-violet-200 focus:ring-violet-400",
    badge: "bg-violet-600",
    btn: "text-violet-700 bg-violet-100 hover:bg-violet-200",
    empty: "text-violet-400",
  },
};

// ── PoolSection sub-component ─────────────────────────────────────────────────

function PoolSection({
  config,
  pool,
  onPoolChange,
}: {
  config: PoolConfig;
  pool: string[];
  onPoolChange: (newPool: string[]) => void;
}) {
  const t = THEME[config.theme];
  const maxItems = config.labelMode === "roman" ? ROMAN.length : MAX_LETTER_OPTIONS;

  const getLabel = (i: number) =>
    config.labelMode === "roman"
      ? (ROMAN[i] ?? String(i + 1))
      : String.fromCharCode(65 + i);

  return (
    <div className={`rounded-xl border-2 ${t.border} ${t.bg} overflow-hidden`}>
      {/* Header */}
      <div className={`flex items-center gap-2 px-4 py-2.5 ${t.headerBg}`}>
        {config.labelMode === "roman" ? (
          <BookOpen className={`w-4 h-4 ${t.icon} shrink-0`} />
        ) : (
          <Layers className={`w-4 h-4 ${t.icon} shrink-0`} />
        )}
        <span className={`text-sm font-bold ${t.title}`}>{config.title}</span>
        <span className={`text-xs font-medium ${t.desc} ml-1 opacity-80`}>
          — {config.description}
        </span>
      </div>

      {/* Items */}
      <div className="p-4 space-y-2">
        {pool.length === 0 && (
          <p className={`text-xs italic mb-2 ${t.empty}`}>
            No items yet — click &ldquo;{config.addLabel}&rdquo; to start.
          </p>
        )}

        {pool.map((item, i) => {
          const label = getLabel(i);
          return (
            <div key={i} className="flex items-center gap-2">
              <span
                className={`w-9 h-9 flex items-center justify-center rounded-lg ${t.badge} text-white text-xs font-bold shrink-0 shadow-sm`}
              >
                {label}
              </span>
              <input
                value={item}
                onChange={(e) => {
                  const next = [...pool];
                  next[i] = e.target.value;
                  onPoolChange(next);
                }}
                className={`flex-1 border ${t.inputBorder} rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2`}
                placeholder={config.placeholder}
              />
              <button
                onClick={() => onPoolChange(pool.filter((_, j) => j !== i))}
                className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        })}

        <button
          onClick={() => onPoolChange([...pool, ""])}
          disabled={pool.length >= maxItems}
          className={`mt-1 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 ${t.btn}`}
        >
          <PlusCircle className="w-3.5 h-3.5" />
          {config.addLabel}
        </button>
      </div>
    </div>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface QuestionData {
  questionOrder: number;
  questionType: string;
  questionText: string;
  config: any;
  explanation?: string;
  answer: { correctAnswers: string[]; caseSensitive: boolean };
}

interface GroupData {
  groupOrder: number;
  instructions?: string;
  questions: QuestionData[];
}

interface GroupCardProps {
  group: GroupData;
  gIndex: number;
  questionOffset: number;
  onUpdateGroup: (field: string, value: any) => void;
  onRemoveGroup: () => void;
  onAddQuestion: () => void;
  onUpdateQuestion: (qIndex: number, field: string, value: any) => void;
  onUpdateAnswer: (qIndex: number, field: string, value: any) => void;
  onRemoveQuestion: (qIndex: number) => void;
}

// ── GroupCard ─────────────────────────────────────────────────────────────────

export default function GroupCard({
  group,
  gIndex,
  questionOffset,
  onUpdateGroup,
  onRemoveGroup,
  onAddQuestion,
  onUpdateQuestion,
  onUpdateAnswer,
  onRemoveQuestion,
}: GroupCardProps) {

  // Build a map: poolType → { indices, pool, syncFn }
  const poolMap = POOL_CONFIGS.reduce<Record<string, {
    indices: number[];
    pool: string[];
    sync: (newPool: string[]) => void;
  }>>((acc, cfg) => {
    const indices = group.questions
      .map((_, i) => i)
      .filter((i) => group.questions[i].questionType === cfg.type);

    if (indices.length > 0) {
      const pool: string[] = group.questions[indices[0]]?.config?.options ?? [];
      acc[cfg.type] = {
        indices,
        pool,
        sync: (newPool: string[]) => {
          indices.forEach((qi) => onUpdateQuestion(qi, "config", { options: newPool }));
        },
      };
    }
    return acc;
  }, {});

  // When a question type changes, sync the new type's pool immediately if available
  const handleTypeChange = (qIndex: number, newType: string) => {
    onUpdateQuestion(qIndex, "questionType", newType);
    const existingPool = poolMap[newType];
    if (existingPool && existingPool.pool.length > 0) {
      onUpdateQuestion(qIndex, "config", { options: existingPool.pool });
    }
  };

  // Active pool types in this group (preserving display order)
  const activePoolConfigs = POOL_CONFIGS.filter((cfg) => poolMap[cfg.type]);

  return (
    <div className="border border-slate-200 rounded-xl bg-slate-50 relative group/g overflow-hidden">
      {/* Group header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-slate-200">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Group {gIndex + 1}
        </span>
        <button
          onClick={onRemoveGroup}
          title="Remove Group"
          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover/g:opacity-100 transition-opacity"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-5">
        {/* Instructions */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Instructions
            <span className="ml-1 text-slate-400 font-normal text-xs">(optional)</span>
          </label>
          <RichTextEditor
            value={group.instructions || ""}
            onChange={(val: string) => onUpdateGroup("instructions", val)}
          />
        </div>

        {/* Pool sections — one per active pool type */}
        {activePoolConfigs.map((cfg) => (
          <PoolSection
            key={cfg.type}
            config={cfg}
            pool={poolMap[cfg.type].pool}
            onPoolChange={poolMap[cfg.type].sync}
          />
        ))}

        {/* Questions */}
        <div>
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 border-b border-slate-200 pb-2">
            Questions
          </h4>
          <div className="space-y-5 pl-3 border-l-2 border-slate-200">
            {group.questions.map((q, qIndex) => (
              <QuestionItem
                key={qIndex}
                question={{ ...q, questionOrder: questionOffset + qIndex + 1 }}
                qIndex={qIndex}
                onUpdateField={(field, value) => onUpdateQuestion(qIndex, field, value)}
                onUpdateAnswer={(field, value) => onUpdateAnswer(qIndex, field, value)}
                onRemove={() => onRemoveQuestion(qIndex)}
                onTypeChange={(newType) => handleTypeChange(qIndex, newType)}
              />
            ))}
          </div>

          <button
            onClick={onAddQuestion}
            className="mt-5 flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50/50 hover:bg-blue-100 px-4 py-2.5 rounded-lg transition-colors w-full justify-center border border-blue-200 border-dashed"
          >
            <PlusCircle className="w-4 h-4" />
            Add Question to Group
          </button>
        </div>
      </div>
    </div>
  );
}
