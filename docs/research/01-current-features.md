# 01 · Hiện trạng hệ thống — chức năng đang có & mức độ hoàn thiện

> Phạm vi: `minhnghi123/ielts-fe` (Next.js 16 App Router) và `minhnghi123/ielts-be` (NestJS microservices).
> Nguồn: đọc toàn bộ `app/**/page.tsx`, `lib/api/*`, `apps/*/src/*.controller.ts`, `db/migrations/*`, chạy FE local để xem giao diện.
> Ký hiệu: ✅ có và dùng được · 🟡 có nhưng chưa trọn vẹn · ❌ chưa có · ⚠️ nên bỏ/đổi.

## 1. Kiến trúc tổng quan

| Lớp | Thành phần | Ghi chú |
| --- | --- | --- |
| Frontend | Next.js App Router, Tailwind v4 tokens (`globals.css`), Radix UI, Zustand, React Query, Framer Motion | 4 route group: `(home)`, `(auth)`, `(learner)`, `(teacher)`, `(admin)` + `practice/` |
| AI (server routes FE) | `app/api/ai/{advisor,analyze-result,generate-test,grade-writing,speaking-chat,transcribe}` dùng Groq (`GROQ_MODEL`, mặc định `openai/gpt-oss-120b`, Whisper `whisper-large-v3-turbo`) | Band Writing/Speaking được ghi về BE qua `PUT /api/attempts/:id/ai-feedback` (internal key) |
| Backend | `api-gateway` (JWT → `x-user-*` headers), `auth-service`, `test-service` (test + attempt lifecycle), `submission-service` (writing/speaking submissions, stats), `analytics-service` (band profile, snapshot, mistakes, leaderboard), `classroom-service` (lớp, bài giao, gradebook) | RabbitMQ 1 queue/service; Postgres Supabase, `synchronize:false`, migration SQL tay (`db/migrations/001`, `002`) |

## 2. Actor & chức năng hiện có

### 2.1 Khách / Learner chưa đăng nhập (`(home)`)

| Màn hình | Có gì | Đánh giá |
| --- | --- | --- |
| `/` Home | Hero, "Platform Stats" (Students Enrolled, Practice Tests, Tests Completed, Avg Band Improvement, Practice Hours…), Recent Activity, "Recommended for You" (4 thẻ tĩnh: Try an Academic Reading test, Take a Listening diagnostic, Get AI feedback on an essay, Find Test Centers) | 🟡 "Recommended for You" là nội dung cứng, không cá nhân hoá. Navbar có 3 link `href="#"` chết. Số liệu "Avg Band Improvement", "Practice Hours" là vanity numbers không tính từ DB thật. |
| `/tests` Test Library | Lọc theo skill, mock/practice, search, phân trang; thẻ test có badge Mock, nút Start | ✅ Hoạt động. 🟡 Không có độ khó, thời lượng ước tính, "đã làm/chưa làm", band dự kiến. |
| `/tests/:id` | Cấu trúc test, section, loại câu hỏi, "Ready to begin?" | ✅ |
| `/rankings` | Leaderboard theo band trung bình (`GET /analytics/leaderboard`), yêu cầu đăng nhập | ✅ 🟡 Chỉ 1 bảng; không có hạng của chính mình nếu ngoài top, không theo tuần. |
| `/resources` | Danh sách link tĩnh theo kỹ năng + banner "Not sure where to start?" | 🟡 Nội dung tĩnh, không nối với điểm yếu của người học. |
| `/login`, `/register`, Google OAuth | Email/password + Supabase Google | ✅ |

### 2.2 Learner đã đăng nhập (`(learner)`, `practice/`)

| Màn hình | Có gì | Đánh giá |
| --- | --- | --- |
| `/dashboard` | Skill Progress (4 kỹ năng, band mới nhất), Exam Readiness %, Select Test Module (4 thẻ), Recent Activity, banner "AI Study Coach", 4 "tip" tĩnh theo kỹ năng | 🟡 Thiếu "hôm nay nên làm gì"; tips là text cứng; không có mục tiêu band / ngày thi. |
| `/analysis` | Overall Band History, bảng mastery theo loại câu hỏi, rubric Writing/Speaking, study plan tự sinh (3 task mẫu từ `analytics-service.getDashboardSummary`), bảng lịch sử, nút **Sync Data** ⚠️, Download Report, banner AI Coach | 🟡 Study plan là template chuỗi (`Improve ${questionType}` / "Complete 2 drills/day"), không có link sang bài tập cụ thể. **Sync Data** là thao tác kỹ thuật (gọi `POST /analytics/sync/:learnerId`) — người học không hiểu và không nên phải bấm; BE đã có `backfillIfEmpty` + event `analytics.test.submitted`. |
| `/ai-advisor` | Chat streaming với Groq, context = profile (band, trend, accuracy theo loại câu hỏi, 10 attempt gần nhất), 3 câu gợi ý | ✅ Khá tốt. 🟡 Không nhớ hội thoại giữa các phiên, không tạo được task/bài tập từ lời khuyên, không trích dẫn câu sai cụ thể. |
| `/practice/:id` | Attempt do server quản lý (`POST /tests/:id/attempts`, autosave draft 2s, `expiresAt`, resume-prompt, auto-submit phiên cũ), Reading split layout + highlight + minimap, Listening exam-mode (audio 1 lần, bar), Writing 2 task + đếm từ, Speaking record → Whisper → chat → chấm | ✅ Tốt nhất hệ thống. 🟡 Thiếu: ghi chú, flag "xem lại", từ điển tra nhanh, chế độ luyện (không giới hạn giờ) tách biệt với chế độ thi. |
| `/practice/:id/result` | Band, Raw score, bảng accuracy theo loại câu hỏi (Correct/Incorrect/Skipped), Answer Review (đáp án của bạn / đáp án đúng, theo section), "Retry Incorrect (n)" → **thực chất mở lại cả bài** ⚠️, AI Coaching Feedback (Groq, lưu DB), Download Report | 🟡 **Lỗ hổng cá nhân hoá lớn nhất**: khi làm sai chỉ thấy đáp án đúng — không có giải thích (`question.explanation` tồn tại trong entity nhưng gần như không được nhập/hiển thị), không chỉ ra đoạn văn chứa đáp án, không phân loại nguyên nhân sai, không lưu vào "sổ lỗi", không đề xuất bài luyện tiếp theo cho đúng loại câu đó. |
| `/classes`, `/classes/join`, `/classes/:id`, `/classes/:id/submissions/:sid` | Tham gia lớp bằng mã, To do / Past, Resume, Result, Announcements, Leave class | ✅ (Phase 1 teacher/classroom) |
| `/profile` | Personal Info, đổi mật khẩu, Total Attempts, Average Band, Test History | ✅ 🟡 Không có **target band, ngày thi, thời gian học/ngày** — ba input tối thiểu để cá nhân hoá. |

### 2.3 Teacher (`(teacher)`)

| Màn hình | Có gì | Đánh giá |
| --- | --- | --- |
| `/teacher` Overview | Active classes, Open assignments, Awaiting your review, Your classes, New class | ✅ |
| `/teacher/classes`, `/:id` | Tạo lớp, mã tham gia (rotate), thành viên, bài giao (scheduled/open/closed/archived), gradebook + CSV, announcements | ✅ 🟡 Nút **Sync** trong assignment detail ("Re-pull results from the exam engine") là thao tác kỹ thuật, bù cho sự kiện RMQ bị lỡ ⚠️. |
| `/teacher/classes/:id/assignments/new`, `/:aid` | Giao test, hạn nộp, release điểm, danh sách bài nộp | ✅ |
| `/teacher/classes/:id/submissions/:sid` | Xem bài, override band Writing/Speaking, nhận xét | ✅ |
| `/teacher/classes/:id/students/:learnerId` | Tiến độ 1 học viên trong lớp | 🟡 Chỉ có điểm; không có điểm yếu theo loại câu hỏi / lỗi lặp lại của học viên. |
| `/teacher/tests/**` | Test bank riêng (visibility public/private), tái dùng trình tạo đề của admin | ✅ |

### 2.4 Admin (`(admin)`)

| Màn hình | Có gì | Đánh giá |
| --- | --- | --- |
| `/admin/dashboard` | Total Learners, Active Tests, Completion Rate, recent activity, top learners, Edit Profile, **Sync Analytics** ⚠️ | 🟡 Sync Analytics nên là cron/event, không phải nút. |
| `/admin/tests/**` | CRUD test Reading/Listening/Writing/Speaking, import JSON, upload audio/ảnh (Cloudinary) | ✅ 🟡 Không có trường `explanation` cho từng câu trong form builder → không thể cá nhân hoá phản hồi. |
| `/admin/ai-generator` | Sinh đề bằng Groq theo chủ đề + loại câu hỏi | ✅ 🟡 Không sinh kèm giải thích đáp án / độ khó. |
| `/admin/users`, `/admin/teachers` | Đổi role, khoá tài khoản, duyệt giáo viên | ✅ |
| `/admin/settings` | "System Settings / Configure / Schedule" | ❌ Placeholder, chưa có chức năng. |

## 3. Dữ liệu cá nhân hoá hiện có trong BE

| Bảng / API | Dùng để | Hiện trạng |
| --- | --- | --- |
| `test_attempts`, `question_attempts` | Điểm, đúng/sai từng câu, `questionType` | ✅ nền tảng tốt |
| `learner_band_profiles` (`PUT /analytics/band-profiles`) | Band hiện tại / mục tiêu theo kỹ năng | 🟡 target được sinh = current + 0.5, không do người học đặt |
| `learner_progress_snapshots` | Lịch sử band theo thời gian | ✅ |
| `learner_mistakes` (`learner_id, question_id, mistake_type`) | Sổ lỗi | 🟡 chỉ lưu `question_type` làm `mistake_type`; không có nguyên nhân sai, không có lịch ôn lại, không có trạng thái "đã sửa" |
| `getDashboardSummary` → `studyPlan[]` | 3 task gợi ý | 🟡 template cứng, không gắn với bài cụ thể |
| `writing_gradings` (TA/CC/LR/GRA + feedback) | Rubric Writing | ✅ 🟡 không có danh sách lỗi có gắn thẻ loại lỗi để theo dõi qua nhiều bài |
| AI advisor context | Kỹ năng, loại câu hỏi, 10 attempt | ✅ |

## 4. Nút / thao tác không có ý nghĩa với người dùng (đề nghị loại bỏ hoặc chuyển thành tự động)

| Vị trí | Nút | Vì sao bỏ | Thay bằng |
| --- | --- | --- | --- |
| `/analysis` | **Sync Data** | Người học không biết "sync" là gì; là vá lỗi dữ liệu lệch | BE tự đồng bộ qua event `analytics.test.submitted` + cron 15 phút; FE chỉ hiện "Cập nhật lúc hh:mm". |
| `/admin/dashboard` | **Sync Analytics** | Tương tự | Cron `sync-all` hằng đêm; log ở Settings. |
| `/teacher/.../assignments/:aid` | **Sync** | Tương tự | Retry RMQ consumer + cron đối soát; nếu cần giữ, đưa vào menu "…" với nhãn "Tải lại kết quả". |
| `/` navbar | 3 link `href="#"` | Link chết | Features → `/tests`, Pricing → bỏ, About → bỏ hoặc trang thật. |
| `/practice/:id/result` | **Retry Incorrect (n)** | Nhãn nói "làm lại câu sai" nhưng mở lại toàn bộ test | Làm đúng chức năng (chỉ câu sai, xem §02) hoặc đổi nhãn "Làm lại bài". |
| `/practice/:id/result` | Tip tĩnh "💡 Review your incorrect answers…" | Không có thông tin | Thay bằng 1 câu nhận xét thật từ dữ liệu ("Bạn sai 4/6 câu True/False/Not Given, chủ yếu chọn False thay vì Not Given"). |
| `/admin/settings` | Configure / Schedule | Placeholder | Ẩn cho tới khi có chức năng. |
| `/` Home | "Avg Band Improvement", "Practice Hours", "Updated weekly" | Số không tính từ DB | Chỉ giữ số đếm thật (số đề, số lượt làm, số người học). |
| `/dashboard` | 4 "tip" tĩnh theo kỹ năng | Giống nhau với mọi người | Thay bằng khối "Hôm nay" (§02). |

## 5. Khoảng trống chính so với đề tài "ôn thi IELTS Academic trực tuyến và cá nhân hoá"

1. **Không có hồ sơ mục tiêu**: target band, ngày thi, thời gian học/tuần → mọi gợi ý đều chung chung.
2. **Làm sai không được dạy gì**: chỉ hiện đáp án đúng; không giải thích, không định vị trong bài đọc/transcript, không phân loại nguyên nhân, không ôn lại.
3. **Study plan không "đụng" được**: là chuỗi text, không link tới bài luyện, không đánh dấu hoàn thành, không điều chỉnh theo kết quả.
4. **Không có luyện theo loại câu hỏi** (drill): chỉ có full test; muốn luyện riêng TFNG hay Matching Headings là không thể.
5. **Không có ôn lại theo ngắt quãng** (spaced review) cho từ vựng/lỗi đã gặp.
6. **Writing/Speaking**: có band + feedback chữ, nhưng chưa có lỗi được gắn thẻ, chưa so sánh giữa các bài để thấy lỗi lặp lại.
7. **Giáo viên** chưa thấy được "lớp đang yếu loại câu hỏi nào" để giao bài đúng chỗ.
8. **Mô hình năng lực** còn là tỉ lệ đúng đơn giản; không có khái niệm độ khó câu hỏi/đề.

Chi tiết đề xuất ở `02-personalization.md`; đề xuất theo từng actor ở `04-feature-proposals-by-actor.md`; giao diện ở `03-ui-redesign.md`.
