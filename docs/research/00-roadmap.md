# Nghiên cứu & kế hoạch hoàn thiện hệ thống ôn thi IELTS Academic cá nhân hoá

Bộ tài liệu này là kết quả walkthrough toàn bộ `ielts-fe` + `ielts-be` (mọi route, nút bấm, API, bảng dữ liệu) và nghiên cứu tài liệu về phản hồi hình thành, mô hình tri thức, lặp lại ngắt quãng, dashboard học tập và các sản phẩm luyện IELTS hiện có. **Chưa thay đổi mã nguồn** — chờ duyệt rồi implement theo thứ tự ở mục 3.

| File | Nội dung |
| --- | --- |
| [01-current-features.md](./01-current-features.md) | Chức năng hiện có theo actor, mức hoàn thiện, nút vô nghĩa cần bỏ (Sync…), 8 khoảng trống chính |
| [02-personalization.md](./02-personalization.md) | Cơ sở lý thuyết có nguồn; learner model (mục tiêu, KC, Elo, sổ lỗi); vòng lặp cá nhân hoá; **thiết kế phản hồi khi làm sai** cho R/L/W/S; migration 003; cách đo hiệu quả |
| [03-ui-redesign.md](./03-ui-redesign.md) | Chẩn đoán giao diện theo tasteskill, direction `editorial-greeting` (seed 1806408546), tokens, quy tắc nhà, thay đổi từng màn hình, kiểm kê nút |
| [04-feature-proposals-by-actor.md](./04-feature-proposals-by-actor.md) | Đề xuất chức năng Learner / Teacher / Admin / Nền với ưu tiên P0–P2 và lịch 8 tuần |

## 1. Ba kết luận chính

1. **Hệ thống đã có nền tảng tốt để cá nhân hoá** (attempt lifecycle server-side, `question_attempts` theo loại câu hỏi, rubric Writing/Speaking, AI Coach có context thật) nhưng **vòng lặp cá nhân hoá chưa khép**: làm sai chỉ thấy đáp án đúng; kế hoạch học là chuỗi text; không có drill theo loại câu hỏi; không có mục tiêu/ngày thi.
2. **Thứ cần xây trước là "phản hồi khi sai → sổ lỗi → drill → ôn lại"**, vì đó là định nghĩa thực tế của "cá nhân hoá" trong đề tài và có cơ sở nghiên cứu rõ (Shute 2008; Narciss 2008; BKT/Elo; spaced repetition).
3. **Giao diện hiện tại là template**: gradient, icon ô màu, eyebrow, card grid, 3 font, nút kỹ thuật. Redesign theo tasteskill với một câu hỏi mỗi màn ("hôm nay tôi học gì?") và màu chỉ nằm trên dữ liệu.

## 2. Những gì cần bạn quyết định khi duyệt

- [ ] Màu nhấn: **teal `#1b6e66`** theo sheet, hay giữ xanh `#135bec` hiện tại?
- [ ] Ngôn ngữ giao diện: tiếng Việt cho phần hướng dẫn/giải thích + tiếng Anh cho đề thi (đề xuất), hay toàn tiếng Anh như hiện nay?
- [ ] Mô hình năng lực: Elo (đề xuất, đơn giản, tự hiệu chỉnh độ khó) hay BKT?
- [ ] Phạm vi 8 tuần ở `04 §5` có phù hợp lịch bảo vệ không? Nếu ngắn hơn: cắt L2, L11–L13, T4–T7, A3–A5.
- [ ] Giữ Leaderboard công khai hay chỉ trong lớp (nghiên cứu dashboard cảnh báo so sánh xã hội quá mức)?

## 3. Thứ tự implement đề xuất (mỗi bước = 1 PR, stack trên nhánh trước)

1. Migration 003 + chuẩn hoá `question_type` + `learner_goals` + builder thêm `explanation/evidence/difficulty`.
2. Màn kết quả mới (bằng chứng, nguyên nhân, nút luyện cùng loại) + sổ lỗi + cache giải thích AI.
3. Drill theo KC & chế độ luyện (phản hồi tức thì).
4. "Hôm nay" + kế hoạch tuần + cron + dải band.
5. Writing lỗi có thẻ + heatmap lớp + giao drill cho nhóm yếu.
6. SRS + từ vựng + Elo mastery.
7. Redesign UI toàn FE theo `03` (tokens → shell → từng màn), kèm before/after inspector.
8. Đo lường & khảo sát cho chương đánh giá.
