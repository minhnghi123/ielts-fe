/**
 * Canonical IELTS question-type codes. Mirrors
 * ielts-be/libs/common/src/constants/question-types.ts — keep both in sync.
 */
export const QUESTION_TYPES = [
  "multiple_choice",
  "fill_in_blank",
  "short_answer",
  "true_false_not_given",
  "yes_no_not_given",
  "matching_heading",
  "matching",
  "matching_features",
  "sentence_ending",
] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number];

export const QUESTION_TYPE_LABELS_EN: Record<QuestionType, string> = {
  multiple_choice: "Multiple Choice",
  fill_in_blank: "Completion (fill in the blank)",
  short_answer: "Short Answer",
  true_false_not_given: "True / False / Not Given",
  yes_no_not_given: "Yes / No / Not Given",
  matching_heading: "Matching Headings",
  matching: "Matching Information",
  matching_features: "Matching Features",
  sentence_ending: "Matching Sentence Endings",
};

/** Vietnamese labels used for guidance and feedback. */
export const QUESTION_TYPE_LABELS_VI: Record<QuestionType, string> = {
  multiple_choice: "Trắc nghiệm",
  fill_in_blank: "Điền từ (completion)",
  short_answer: "Trả lời ngắn",
  true_false_not_given: "True / False / Not Given",
  yes_no_not_given: "Yes / No / Not Given",
  matching_heading: "Nối tiêu đề đoạn",
  matching: "Nối thông tin",
  matching_features: "Nối đặc điểm",
  sentence_ending: "Nối vế câu",
};

/** Short, learner-facing strategy hint per type (Vietnamese). */
export const QUESTION_TYPE_HINTS_VI: Record<QuestionType, string> = {
  multiple_choice: "Loại trừ phương án có từ khoá trùng nguyên văn nhưng sai ý; chú ý từ hạn định (some/most/all).",
  fill_in_blank: "Đọc kỹ giới hạn số từ; đáp án phải đúng chính tả và dạng từ như trong bài.",
  short_answer: "Trả lời bằng từ lấy trực tiếp từ bài, không vượt giới hạn số từ.",
  true_false_not_given: "False = bài nói ngược lại; Not Given = bài không đề cập. Đừng dùng kiến thức ngoài.",
  yes_no_not_given: "Yes/No dựa trên quan điểm của tác giả; Not Given khi tác giả không nêu ý kiến.",
  matching_heading: "Tìm ý chính của đoạn (thường ở câu chủ đề), không chọn theo từ khoá lẻ.",
  matching: "Thông tin có thể xuất hiện ở bất kỳ đoạn nào và không theo thứ tự câu hỏi.",
  matching_features: "Gạch chân tên riêng/đặc điểm trong bài rồi đối chiếu từng phương án.",
  sentence_ending: "Vế đúng phải khớp cả ngữ pháp lẫn nghĩa với vế đầu và với bài.",
};

const ALIASES: Record<string, QuestionType> = {
  mcq: "multiple_choice",
  gap_fill: "fill_in_blank",
  sentence_completion: "fill_in_blank",
  summary_completion: "fill_in_blank",
  note_completion: "fill_in_blank",
  table_completion: "fill_in_blank",
  tfng: "true_false_not_given",
  true_false: "true_false_not_given",
  true_false_ng: "true_false_not_given",
  ynng: "yes_no_not_given",
  yes_no: "yes_no_not_given",
  yes_no_ng: "yes_no_not_given",
  matching_headings: "matching_heading",
  heading_matching: "matching_heading",
  matching_information: "matching",
  matching_feature: "matching_features",
  sentence_endings: "sentence_ending",
  matching_sentence_endings: "sentence_ending",
};

export function isQuestionType(value: unknown): value is QuestionType {
  return typeof value === "string" && (QUESTION_TYPES as readonly string[]).includes(value);
}

export function normalizeQuestionType(raw: unknown): QuestionType | null {
  if (typeof raw !== "string") return null;
  const slug = raw.trim().toLowerCase().replace(/[\s/-]+/g, "_").replace(/[^a-z_]/g, "").replace(/_+/g, "_").replace(/^_|_$/g, "");
  if (isQuestionType(slug)) return slug;
  return ALIASES[slug] ?? null;
}

/** Label for any stored value, falling back to a readable version of the raw code. */
export function questionTypeLabel(raw: string | null | undefined, lang: "vi" | "en" = "vi"): string {
  const t = normalizeQuestionType(raw);
  if (t) return lang === "vi" ? QUESTION_TYPE_LABELS_VI[t] : QUESTION_TYPE_LABELS_EN[t];
  return (raw ?? "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "—";
}

export const QUESTION_TYPE_OPTIONS = QUESTION_TYPES.map((value) => ({
  value,
  label: `${QUESTION_TYPE_LABELS_EN[value]} · ${QUESTION_TYPE_LABELS_VI[value]}`,
}));

export const DIFFICULTY_LABELS_VI: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: "1 · Rất dễ (band 4–5)",
  2: "2 · Dễ (band 5–5.5)",
  3: "3 · Trung bình (band 6–6.5)",
  4: "4 · Khó (band 7–7.5)",
  5: "5 · Rất khó (band 8+)",
};
