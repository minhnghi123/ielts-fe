export const WRITING_ERROR_LABELS_VI: Record<string, string> = {
    Grammar: "Ngữ pháp",
    Cohesion: "Liên kết ý",
    Lexical: "Từ vựng",
    "Task Response": "Trả lời đề bài",
    Punctuation: "Dấu câu",
    Spelling: "Chính tả",
    Other: "Khác",
};

export const WRITING_ERROR_TIPS_VI: Record<string, string> = {
    Grammar: "Soát lại chia thì, hoà hợp chủ ngữ – động từ và mạo từ trước khi nộp. Viết câu ngắn đúng còn hơn câu dài sai.",
    Cohesion: "Mỗi đoạn một ý chính, mở đầu bằng câu chủ đề; dùng từ nối đúng chức năng (However ≠ Moreover) và đừng lạm dụng.",
    Lexical: "Ưu tiên từ chính xác thay vì từ 'nghe sang'; kiểm tra collocation (make a decision, not do a decision).",
    "Task Response": "Gạch đầu dòng mọi phần của đề trước khi viết; mỗi luận điểm cần một ví dụ/giải thích; nêu rõ quan điểm ở mở bài và kết bài.",
    Punctuation: "Mỗi câu chỉ một mệnh đề chính trừ khi có liên từ; tránh dấu phẩy nối hai câu độc lập.",
    Spelling: "Lập danh sách từ hay sai của riêng bạn và viết lại 3 lần; cẩn thận với từ ghép và hậu tố -ly/-ment.",
    Other: "Đọc lại bài một lượt chỉ để tìm lỗi, không sửa nội dung.",
};

export const writingErrorLabel = (t?: string | null) => WRITING_ERROR_LABELS_VI[t ?? "Other"] ?? t ?? "Khác";
export const writingErrorTip = (t?: string | null) => WRITING_ERROR_TIPS_VI[t ?? "Other"] ?? WRITING_ERROR_TIPS_VI.Other;
