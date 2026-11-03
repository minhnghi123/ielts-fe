# 04 · Đề xuất chức năng theo từng actor

> Mức ưu tiên: **P0** cần cho đề tài (cá nhân hoá) · **P1** làm hệ thống "đầy đủ" · **P2** nếu còn thời gian.
> "Đã có" tham chiếu `01-current-features.md`; chi tiết thuật toán ở `02-personalization.md`.

## 1. Learner (người học) — actor trung tâm

### 1.1 Chức năng chính đã có
Đăng ký/đăng nhập (email, Google) · Thư viện đề & xem cấu trúc · Làm bài 4 kỹ năng với phiên do server quản lý (autosave, hết giờ, resume) · Kết quả + bảng chính xác theo loại câu hỏi · AI chấm Writing/Speaking · AI Coach chat · Analysis (band history, mastery, rubric, study plan text) · Leaderboard · Tham gia lớp, làm bài giao, xem kết quả & nhận xét giáo viên · Hồ sơ cá nhân.

### 1.2 Đề xuất bổ sung

| # | Chức năng | Mô tả ngắn | Ưu tiên |
| --- | --- | --- | --- |
| L1 | **Hồ sơ mục tiêu & onboarding** | Target band (tổng + từng kỹ năng), ngày thi, phút/ngày; hiển thị "còn X tuần, cần +Y band" ở mọi nơi | P0 |
| L2 | **Placement test 15–20'** | Ước lượng band ban đầu + 3 KC yếu nhất; khởi tạo Elo | P1 |
| L3 | **Khối "Hôm nay"** | 2–4 nhiệm vụ có link, tổng ≈ phút/ngày, lý do bằng dữ liệu, 1 nút Bắt đầu | P0 |
| L4 | **Kế hoạch tuần thích ứng** | Phân bổ theo khoảng cách tới mục tiêu; tự điều chỉnh khi đạt/miss; lịch 7 ngày | P0 |
| L5 | **Drill theo loại câu hỏi** (chế độ luyện) | 8–12 câu cùng KC, độ khó vừa sức, phản hồi ngay sau mỗi câu, thử lại 1 lần | P0 |
| L6 | **Phản hồi khi sai**: bằng chứng + vì sao sai + làm gì tiếp | Trích đoạn/phát lại audio, nguyên nhân (`error_cause`), nút "Luyện 8 câu cùng loại" | P0 |
| L7 | **Sổ lỗi (Mistake notebook)** | Danh sách lỗi theo KC/nguyên nhân, trạng thái mới/đang ôn/đã sửa, lọc, tìm | P0 |
| L8 | **Ôn lại ngắt quãng** | Hàng đợi "đến hạn hôm nay" cho lỗi & từ vựng (SM-2) | P1 |
| L9 | **Sổ từ vựng trong lúc làm bài** | Bôi đen → "Lưu từ" (kèm ngữ cảnh câu), tra nghĩa nhanh sau khi nộp (không tra trong lúc thi) | P1 |
| L10 | **Writing**: lỗi có thẻ + highlight inline + bài sửa câu + nhắc lỗi cũ trước khi viết | Dựa `errors_json`; biểu đồ lỗi lặp qua 5 bài | P0 |
| L11 | **Writing**: so sánh với bài mẫu band +1 theo đoạn, gợi ý từ nâng cấp theo chủ đề | Không viết lại toàn bài | P1 |
| L12 | **Speaking**: lỗi từ transcript, tốc độ nói, filler, câu mẫu band cao hơn, shadowing | | P1 |
| L13 | **Mock test đầy đủ theo lịch** (4 kỹ năng, 2h45) + "band dự đoán" & khoảng tin cậy | Nhịp 2 tuần/lần, tuần cuối 2 lần | P1 |
| L14 | **Màn kết quả có "mẫu hình lỗi"** thay tip tĩnh; "Retry Incorrect" làm đúng nghĩa (chỉ câu sai) | | P0 |
| L15 | **Tiến độ hướng mục tiêu** thay Exam Readiness % mơ hồ: đường band theo tuần với vạch target & ngày thi | | P0 |
| L16 | **Thông báo/nhắc** (email/web push): nhiệm vụ hôm nay, lỗi đến hạn, bài giao sắp hết hạn | | P2 |
| L17 | **Leaderboard theo tuần + hạng của tôi + chỉ bạn cùng lớp** (giảm so sánh xã hội tiêu cực) | | P2 |
| L18 | **Giao diện tiếng Việt / song ngữ** cho phần giải thích & hướng dẫn (đề thi giữ tiếng Anh) | | P1 |
| L19 | **Chế độ thi vs chế độ luyện** rõ ràng khi bắt đầu bài: thi = đúng giờ, không gợi ý; luyện = không giới hạn, phản hồi ngay | | P0 |
| L20 | Xuất báo cáo PDF tiến độ cho người học/phụ huynh | Đã có "Download Report" dạng thô → chuẩn hoá | P2 |

### 1.3 Loại bỏ / thay đổi
- Bỏ **Sync Data**; bỏ 4 tip tĩnh; bỏ "Recommended for You" cứng ở Home (thay bằng khối "Hôm nay" nếu đã đăng nhập, hoặc CTA "Làm bài xếp lớp" nếu chưa).

## 2. Teacher (giáo viên)

### 2.1 Đã có
Overview · Lớp (mã tham gia, thành viên) · Bài giao (lịch, hạn, release) · Gradebook + CSV · Xem/ghi đè band Writing/Speaking, nhận xét · Thông báo lớp · Test bank riêng (public/private) · Hồ sơ giáo viên (admin duyệt).

### 2.2 Đề xuất

| # | Chức năng | Mô tả | Ưu tiên |
| --- | --- | --- | --- |
| T1 | **Heatmap lớp theo KC** | Hàng = học viên, cột = loại câu hỏi/tiêu chí; màu = mastery; click ô → danh sách câu sai | P0 |
| T2 | **Giao drill cho nhóm yếu** | Từ heatmap chọn KC → tạo assignment drill cho các học viên < ngưỡng (một cú click) | P0 |
| T3 | **Hồ sơ học viên trong lớp** đầy đủ: band theo thời gian, sổ lỗi, lỗi Writing lặp, nhiệm vụ đã/không làm | P0 |
| T4 | **Hàng đợi chấm/duyệt**: bài Writing/Speaking chờ xem, giải thích AI chờ duyệt (sửa rồi lưu thành `question.explanation`) | P1 |
| T5 | **Nhận xét theo tiêu chí có mẫu** (comment bank theo tag lỗi) + gửi "bài sửa" đi kèm nhận xét | P1 |
| T6 | **Cảnh báo học viên có nguy cơ**: không hoạt động 7 ngày, band giảm 2 lần liên tiếp, miss 2 bài giao | P1 |
| T7 | **Thống kê đề** trong test bank: độ khó thực tế (Elo β), câu "đánh đố" (tỉ lệ sai > 80%), câu bị báo lỗi | P1 |
| T8 | **Nhân bản/ chỉnh đề** từ đề public; nhập `explanation` + `evidence_anchor` khi tạo câu | P0 (vì cần cho L6) |
| T9 | Lịch lớp (buổi học, hạn nộp) hiển thị dạng tuần | P2 |
| T10 | Trao đổi 1-1 trong bài nộp (thread), học viên trả lời nhận xét | P2 |

### 2.3 Loại bỏ
- Nút **Sync** trong assignment detail → tự động (cron đối soát 5–15 phút + retry RMQ); nếu giữ thì vào menu "⋯ Tải lại kết quả".

## 3. Admin (quản trị)

### 3.1 Đã có
Dashboard (số liệu toàn hệ thống) · CRUD đề 4 kỹ năng, import JSON, upload audio/ảnh · AI Generator · Người dùng (role, khoá) · Duyệt giáo viên · Settings (placeholder).

### 3.2 Đề xuất

| # | Chức năng | Mô tả | Ưu tiên |
| --- | --- | --- | --- |
| A1 | **Builder có trường bắt buộc cho cá nhân hoá**: `explanation`, `evidence_anchor`, `difficulty` sơ bộ, `question_type` chuẩn hoá (enum thống nhất L/R) | P0 |
| A2 | **AI Generator sinh kèm giải thích + bẫy + độ khó**, và có bước duyệt trước khi public | P0 |
| A3 | **Quản lý taxonomy**: danh sách KC, thẻ lỗi Writing, ánh xạ question_type → KC | P1 |
| A4 | **Chất lượng câu hỏi**: báo cáo câu có tỉ lệ sai bất thường, câu bị người học "báo lỗi", explanation bị 👎 | P1 |
| A5 | **Giám sát AI**: số lần gọi Groq/ngày, lỗi, model đang dùng, chi phí ước tính; bật/tắt tính năng AI | P1 |
| A6 | **Settings thật**: model AI, ngưỡng mastery, tham số SRS/Elo (K), tần suất cron sync | P1 |
| A7 | **Nhật ký đồng bộ analytics** (thay nút Sync Analytics) | P1 |
| A8 | Thống kê theo cohort: band trung bình theo tuần, retention 7/30 ngày, kỹ năng yếu toàn hệ thống | P2 |
| A9 | Quản lý nội dung tĩnh (Resources) & gắn resource với KC để gợi ý đúng chỗ | P2 |

### 3.3 Loại bỏ
- **Sync Analytics** → cron; **Settings placeholder** → ẩn tới khi có A6; vanity stats trang chủ.

## 4. Hệ thống / nền (không thuộc actor nhưng cần cho các mục trên)

| # | Hạng mục | Ghi chú |
| --- | --- | --- |
| S1 | Migration 003 (bảng ở `02-personalization.md §5`) + áp dụng lên Supabase (hiện 001/002 chưa áp dụng) | P0 |
| S2 | Cron trong analytics-service: sync-all, tính next_review, sinh kế hoạch tuần (chủ nhật) | P0 |
| S3 | Cache giải thích AI (question_id, user_answer) + hàng đợi RMQ để không chặn màn kết quả | P0 |
| S4 | Chuẩn hoá `question_type` enum giữa FE/BE/AI generator | P0 |
| S5 | i18n cho chuỗi giao diện (vi/en) | P1 |
| S6 | Kiểm thử: unit cho Elo/SRS/planner; e2e cho vòng lặp "làm sai → sổ lỗi → drill" | P1 |

## 5. Ma trận ưu tiên (tóm tắt cho kế hoạch 6–8 tuần)

| Tuần | Nội dung |
| --- | --- |
| 1 | S1, S4, L1, A1 (builder + migration + hồ sơ mục tiêu) |
| 2 | L6, L14, L7, S3 (màn kết quả mới + sổ lỗi + giải thích AI cache) |
| 3 | L5, L19 (drill & chế độ luyện), T8 |
| 4 | L3, L4, S2, L15 (Hôm nay, kế hoạch, cron, tiến độ hướng mục tiêu) |
| 5 | L10, T1, T2 (Writing lỗi có thẻ; heatmap lớp & giao drill) |
| 6 | L8, L9, Elo (mastery) thay accuracy |
| 7 | L2, L12, L13, A2 |
| 8 | Redesign UI toàn FE theo `03-ui-redesign.md`, đo lường (`02 §6`), viết luận văn |
