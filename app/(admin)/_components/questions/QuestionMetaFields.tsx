"use client";

import { DIFFICULTY_LABELS_VI, QUESTION_TYPE_HINTS_VI, normalizeQuestionType } from "@/lib/question-types";
import type { EvidenceAnchor } from "@/lib/types";

interface QuestionMetaFieldsProps {
  questionType: string;
  explanation: string;
  difficulty: number | null | undefined;
  evidenceAnchor: EvidenceAnchor | null | undefined;
  /** Decides the evidence form: reading → passage paragraph, listening → audio time range. */
  skill?: string;
  onChange: (field: "explanation" | "difficulty" | "evidenceAnchor", value: unknown) => void;
}

const MAX_EXPLANATION = 4000;
const MAX_QUOTE = 500;

function msToClock(ms: number | undefined): string {
  if (ms == null || Number.isNaN(ms)) return "";
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Accepts "m:ss", "mm:ss" or plain seconds; returns ms or null when empty/invalid. */
function clockToMs(text: string): number | null {
  const t = text.trim();
  if (!t) return null;
  if (/^\d+(\.\d+)?$/.test(t)) return Math.round(parseFloat(t) * 1000);
  const m = /^(\d{1,3}):([0-5]?\d)$/.exec(t);
  if (!m) return null;
  return (parseInt(m[1], 10) * 60 + parseInt(m[2], 10)) * 1000;
}

/**
 * Fields that make a question teachable, not just gradable: the Vietnamese
 * explanation shown after submission, the author's difficulty estimate, and
 * where in the passage / audio the answer is found.
 */
export default function QuestionMetaFields({
  questionType,
  explanation,
  difficulty,
  evidenceAnchor,
  skill,
  onChange,
}: QuestionMetaFieldsProps) {
  const kind: EvidenceAnchor["kind"] = evidenceAnchor?.kind ?? (skill === "listening" ? "audio" : "passage");
  const anchor: EvidenceAnchor = evidenceAnchor ?? { kind };
  const hint = (() => {
    const t = normalizeQuestionType(questionType);
    return t ? QUESTION_TYPE_HINTS_VI[t] : null;
  })();

  const setAnchor = (patch: Partial<EvidenceAnchor>) => {
    const next: EvidenceAnchor = { ...anchor, ...patch, kind: patch.kind ?? anchor.kind };
    if (next.kind === "passage") {
      delete next.startMs;
      delete next.endMs;
    } else {
      delete next.paragraph;
    }
    const empty =
      !next.quote?.trim() &&
      (next.kind === "passage" ? next.paragraph == null : next.startMs == null);
    onChange("evidenceAnchor", empty ? null : next);
  };

  const quoteLen = anchor.quote?.length ?? 0;
  const endBeforeStart =
    anchor.kind === "audio" && anchor.startMs != null && anchor.endMs != null && anchor.endMs < anchor.startMs;

  return (
    <div className="mt-4 rounded-lg bg-slate-50 p-4 space-y-4" data-ui>
      <div>
        <label className="block text-sm font-medium text-slate-800">
          Giải thích đáp án (tiếng Việt)
        </label>
        <p className="text-xs text-slate-500 mb-1.5">
          Học viên thấy phần này sau khi nộp bài. Nêu vì sao đáp án đúng và bẫy thường gặp.
          {hint ? ` Gợi ý cho dạng này: ${hint}` : ""}
        </p>
        <textarea
          value={explanation ?? ""}
          maxLength={MAX_EXPLANATION}
          onChange={(e) => onChange("explanation", e.target.value)}
          rows={3}
          placeholder="Ví dụ: Đoạn 2 nói “sales fell sharply”, tức là ngược với câu hỏi nên đáp án là FALSE, không phải NOT GIVEN."
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <p className="text-right text-[11px] text-slate-400">{(explanation ?? "").length}/{MAX_EXPLANATION}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-800 mb-1.5">Độ khó ước tính</label>
          <select
            value={difficulty ?? ""}
            onChange={(e) => onChange("difficulty", e.target.value === "" ? null : Number(e.target.value))}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">Chưa đánh giá</option>
            {([1, 2, 3, 4, 5] as const).map((d) => (
              <option key={d} value={d}>{DIFFICULTY_LABELS_VI[d]}</option>
            ))}
          </select>
          <p className="text-xs text-slate-500 mt-1">Hệ thống sẽ tự hiệu chỉnh độ khó theo kết quả thật của học viên.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800 mb-1.5">Bằng chứng trong bài</label>
          <div className="flex gap-2 mb-2">
            {(["passage", "audio"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setAnchor({ kind: k })}
                className={`rounded-md px-3 py-1 text-xs font-medium border ${anchor.kind === k ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-700 border-slate-300"}`}
              >
                {k === "passage" ? "Đoạn văn" : "Audio"}
              </button>
            ))}
          </div>
          {anchor.kind === "passage" ? (
            <input
              type="number"
              min={1}
              value={anchor.paragraph ?? ""}
              onChange={(e) => setAnchor({ paragraph: e.target.value === "" ? undefined : Math.max(1, parseInt(e.target.value, 10) || 1) })}
              placeholder="Đoạn số (ví dụ 2)"
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            />
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="text"
                defaultValue={msToClock(anchor.startMs)}
                onBlur={(e) => setAnchor({ startMs: clockToMs(e.target.value) ?? undefined })}
                placeholder="Bắt đầu m:ss"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              />
              <span className="text-slate-400">→</span>
              <input
                type="text"
                defaultValue={msToClock(anchor.endMs)}
                onBlur={(e) => setAnchor({ endMs: clockToMs(e.target.value) ?? undefined })}
                placeholder="Kết thúc m:ss"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              />
            </div>
          )}
          {endBeforeStart && (
            <p className="text-xs text-red-600 mt-1">Thời điểm kết thúc phải sau thời điểm bắt đầu.</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-800 mb-1.5">
          Câu trích dẫn chứa đáp án
        </label>
        <input
          type="text"
          value={anchor.quote ?? ""}
          maxLength={MAX_QUOTE}
          onChange={(e) => setAnchor({ quote: e.target.value })}
          placeholder="Chép đúng nguyên văn câu trong bài đọc / transcript để hệ thống tô sáng cho học viên"
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
        />
        <p className="text-right text-[11px] text-slate-400">{quoteLen}/{MAX_QUOTE}</p>
      </div>
    </div>
  );
}
