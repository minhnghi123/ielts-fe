/** Mirrors ielts-be `libs/common/src/learning/error-cause.ts`. Learner-facing copy is Vietnamese. */
export const ERROR_CAUSES = [
    "spelling",
    "word_limit",
    "paraphrase_miss",
    "tfng_confusion",
    "distractor",
    "number_format",
    "location_miss",
    "inference",
    "skipped",
    "time_management",
    "unknown",
] as const;
export type ErrorCause = (typeof ERROR_CAUSES)[number];

export const ERROR_CAUSE_LABELS_VI: Record<ErrorCause, string> = {
    spelling: "Sai chính tả / dạng từ",
    word_limit: "Vượt giới hạn số từ",
    paraphrase_miss: "Chưa nhận ra cách diễn đạt lại",
    tfng_confusion: "Nhầm False với Not Given",
    distractor: "Bị bẫy bởi thông tin gây nhiễu",
    number_format: "Sai số liệu / định dạng số",
    location_miss: "Định vị sai đoạn chứa thông tin",
    inference: "Suy luận chưa đúng ý tác giả",
    skipped: "Bỏ trống",
    time_management: "Hết giờ, chưa kịp làm",
    unknown: "Chưa xác định",
};

/** One concrete thing to do next time — shown under the explanation. */
export const ERROR_CAUSE_ADVICE_VI: Record<ErrorCause, string> = {
    spelling: "Đáp án phải đúng từng chữ như trong bài. Viết xong hãy đọc lại và kiểm tra số nhiều/-ed/-ing.",
    word_limit: "Đọc yêu cầu số từ trước khi làm. Bỏ mạo từ (a/the) và tính từ thừa nếu vẫn giữ nguyên nghĩa.",
    paraphrase_miss: "Gạch chân từ khoá trong câu hỏi rồi tìm từ đồng nghĩa trong bài, đừng chờ thấy đúng từ đó.",
    tfng_confusion: "False = bài nói ngược lại; Not Given = bài không nhắc tới. Nếu phải dùng kiến thức ngoài để kết luận thì là Not Given.",
    distractor: "Bài thường nhắc 2–3 lựa chọn rồi loại bỏ bằng 'but/however/actually'. Nghe/đọc đến hết câu rồi mới chốt.",
    number_format: "Kiểm tra đơn vị, dấu thập phân và cách viết (15 vs 50, 1,500 vs 1.5). Viết số bằng chữ số.",
    location_miss: "Tìm ý chính ở câu đầu và câu cuối mỗi đoạn; bỏ qua ví dụ chi tiết khi chọn heading.",
    inference: "Loại trừ phương án quá tuyệt đối (all/never) và phương án chỉ đúng một phần so với bài.",
    skipped: "Luôn điền một đáp án — không bị trừ điểm khi sai. Đánh dấu câu khó và quay lại sau.",
    time_management: "Đặt mốc thời gian cho từng phần (Reading: 20 phút/passage) và chuyển phần dù chưa xong.",
    unknown: "Đọc lại đoạn chứa đáp án và so sánh với câu trả lời của bạn để tự tìm điểm khác biệt.",
};

export function errorCauseLabel(cause: string | null | undefined): string {
    return ERROR_CAUSE_LABELS_VI[(cause ?? "unknown") as ErrorCause] ?? ERROR_CAUSE_LABELS_VI.unknown;
}
export function errorCauseAdvice(cause: string | null | undefined): string {
    return ERROR_CAUSE_ADVICE_VI[(cause ?? "unknown") as ErrorCause] ?? ERROR_CAUSE_ADVICE_VI.unknown;
}
