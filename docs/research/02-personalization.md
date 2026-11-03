# 02 · Cá nhân hoá — nghiên cứu & thiết kế chức năng

> Mục tiêu đề tài: *xây dựng hệ thống ôn thi IELTS Academic trực tuyến và cá nhân hoá cho người học*.
> Tài liệu này trả lời: cá nhân hoá **dựa trên dữ liệu nào**, **mô hình nào**, **hiển thị cho người học ra sao**, và **khi làm sai thì hệ thống dạy gì**.

## 1. Cơ sở lý thuyết (tóm tắt có nguồn)

| Chủ đề | Kết luận dùng cho hệ thống | Nguồn |
| --- | --- | --- |
| Phản hồi hình thành (formative feedback) | Phản hồi hiệu quả phải **cụ thể, hướng vào bài làm (không phải người học), có giải thích (elaborated), chia nhỏ, kịp thời**. Chỉ báo đúng/sai (KR) hoặc chỉ hiện đáp án (KCR) kém hiệu quả hơn phản hồi có giải thích *vì sao sai* (EF). | Shute 2008, *Focus on Formative Feedback*, Rev. Educ. Res. 78(1); Narciss 2008 (KR/KCR/EF/AUC/MTF); van der Kleij 2015 meta-analysis; Wisniewski 2020 |
| Học từ lỗi (erroneous examples) | Lỗi trở thành "negative knowledge" khi người học được nhắc **nhận diện – sửa – giải thích – so sánh** lỗi của mình; prompt phải vừa sức để không quá tải. | Systematic review, *Educ. Psychol. Rev.* 2025 (10.1007/s10648-025-10071-x); Metcalfe 2017 |
| Lặp lại ngắt quãng | Lịch ôn tăng dần khoảng cách (spacing + lag effect); Duolingo mô hình hoá bằng Half-Life Regression trên từng đơn vị kiến thức. Với quy mô đồ án: dùng SM-2/FSRS đơn giản là đủ. | Settles & Meeder 2016 (ACL), github.com/duolingo/halflife-regression; Ilidio 2026 (PMLR v339) |
| Mô hình tri thức | Bayesian Knowledge Tracing: P(known) cập nhật sau mỗi câu, ngưỡng thành thạo 0.95; Khan Academy dùng để **chuyển người học khỏi kỹ năng đã giỏi** và dồn thời gian vào kỹ năng yếu. Với dữ liệu thưa như đồ án: **Elo rating** (Maths Garden, Klinkenberg 2011) ước lượng đồng thời năng lực người học và độ khó câu hỏi, không cần pre-test. | Corbett & Anderson 1995; Pelánek, *Conceptual issues in mastery criteria*; Klinkenberg, Straatemeier & van der Maas 2011, *Computers & Education* 57 |
| Learning analytics dashboard | Dashboard chỉ "mô tả" không đổi hành vi; cần **phản hồi hành động được**, gợi ý nhịp học (pacing), tránh so sánh xã hội quá mức; đa số dashboard hiện có thiếu phần *lập kế hoạch – phản tư – kê đơn*. | Jivet 2021 (OU NL, 11 khuyến nghị); MDPI Appl. Sci. 2025 RCT n=8745; systematic review *Interactive Learning Environments* 2026 (71 bài, 302 tính năng) |
| Lỗi đặc thù người Việt (Writing) | Lỗi tập trung ở **Lexical Resource** (sai chính tả, dạng từ, collocation, chọn từ) và **Coherence & Cohesion** (lạm dụng từ nối mẫu, thiếu topic sentence); Task 2 nhiều lỗi câu: hoà hợp S-V, bị động, modal. TR lỗi lớn nhất là *thiếu dẫn chứng/ví dụ*. | Nguyen et al. 2022 (IELTS Partners research); Int. J. Studies Eng. Lang. Lit. 14(3) 2026; Eur. J. Foreign Lang. Teach. 10(2) 2026 |
| AES + adaptive feedback cho IELTS Writing | Feedback tách theo 4 tiêu chí; sửa **bề mặt, bảo thủ** đáng tin hơn can thiệp cấu trúc; tách giao diện viết khỏi giao diện chat để giảm tải nhận thức. | Ramancauskas 2025, arXiv 2512.24460 |
| Sản phẩm thương mại tham chiếu | IELTS Ready Premium (British Council): 40 mock có điểm, AI feedback W/S, *Personalised Study Guide*, progress tracking. IELTS Memo: **33 loại lỗi có tên** dùng xuyên suốt feedback – sổ lỗi – bài tập – dashboard. Sagzzano/IELTSly: placement 5 phút → kế hoạch theo target & thời gian còn lại → nhiệm vụ mỗi ngày. | takeielts.britishcouncil.org/prepare/ielts-ready; ieltsmemo.com/features; sagzzano.com/ielts-ai; ieltsly.ai |

## 2. Mô hình người học (Learner Model) — dữ liệu cần có

### 2.1 Hồ sơ mục tiêu (nhập 1 lần, sửa được) — **chưa có, ưu tiên 1**
```
learner_goals: target_overall, target_by_skill{L,R,W,S}, exam_date, minutes_per_day, days_per_week,
               current_estimate (từ placement hoặc attempt đầu), purpose (du học/định cư/…)
```
Dùng để: tính *khoảng cách tới mục tiêu*, *số tuần còn lại*, *tải học mỗi tuần*, chọn độ dài bài (drill 10 phút hay full test 60 phút).

### 2.2 Đơn vị kiến thức (Knowledge Component – KC)
Không mô hình "Reading" như một kỹ năng duy nhất; chia thành KC vừa đủ nhỏ để chẩn đoán được:

| Kỹ năng | KC = loại câu hỏi (đã có `question_type`) | KC bổ sung (chưa có) |
| --- | --- | --- |
| Reading | TFNG, YNNG, Matching Headings, Matching Information, Matching Features, Sentence Endings, Sentence/Summary/Note/Table/Flow-chart Completion, Diagram Label, MCQ, Short Answer | chiến lược: *skimming*, *scanning*, *paraphrase recognition*, *inference*; từ vựng học thuật (AWL) |
| Listening | Form/Note/Table Completion, MCQ, Matching, Map/Plan Labelling, Sentence Completion, Short Answer | *số/ngày/đánh vần*, *distractor (đổi ý)*, *giọng*, *section 3-4 (học thuật)* |
| Writing | TA, CC, LR, GRA (đã có rubric) | **thẻ lỗi** (taxonomy §4.2), loại đề (opinion/discussion/problem-solution/two-part; T1: line/bar/pie/table/process/map) |
| Speaking | Fluency, Lexical, Grammar, Pronunciation | Part 1/2/3, chủ đề, lỗi phát âm lặp lại |

### 2.3 Ước lượng năng lực & độ khó — đề xuất **Elo 2 chiều** (đơn giản, không cần pre-test)
- Mỗi KC của người học có rating θ (khởi tạo theo band hiện tại). Mỗi câu hỏi có rating β (khởi tạo theo độ khó admin nhập hoặc 0).
- Sau mỗi câu: `θ ← θ + K·(S − E)`, `β ← β − K·(S − E)`, với `E = 1/(1+10^((β−θ)/400))`, S ∈ {0,1}; K giảm dần theo số lần gặp.
- Suy ra: **mastery(KC) = E(θ_KC vs β trung vị của KC)**; "yếu" khi < 0.6, "thành thạo" khi > 0.85. Dùng ngưỡng thay cho tỉ lệ đúng thô (hiện tại `accuracy < 50%` ⇒ high priority).
- Lợi ích cho đồ án: có độ khó câu hỏi tự hiệu chỉnh ⇒ có thể **chọn câu vừa sức** (xác suất đúng ~0.7) cho drill; có thể báo cáo "band dự đoán" ổn định hơn.
- Có thể nâng lên BKT/IRT 2PL sau khi có đủ dữ liệu; nêu trong phần hạn chế của luận văn.

### 2.4 Sổ lỗi (Error Log) — nâng cấp bảng `learner_mistakes`
```
learner_mistakes: + attempt_id, skill, question_type, error_cause (enum §4.1),
                  + user_answer, correct_answer, evidence_ref (đoạn/thời điểm audio),
                  + ai_explanation (cache), status (new|reviewing|fixed),
                  + srs_interval_days, srs_ease, next_review_at, review_count
```
Đây là bảng trung tâm của cá nhân hoá: feed cho *Review hôm nay*, *drill theo lỗi*, *AI Coach*, *báo cáo giáo viên*.

## 3. Vòng lặp cá nhân hoá (chu trình 1 phiên học)

```
[Onboarding: mục tiêu + placement 15'] → [Kế hoạch tuần] → [Nhiệm vụ hôm nay]
      ↑                                                             ↓
[Điều chỉnh kế hoạch] ← [Cập nhật θ, sổ lỗi, SRS] ← [Làm bài → Phản hồi ngay khi sai]
```

### 3.1 Onboarding & Placement (mới)
- 3 câu hỏi: band mục tiêu, ngày thi (hoặc "chưa có"), thời gian/ngày.
- Placement 15–20 phút: 1 passage Reading (13 câu, trộn 4–5 loại), 1 section Listening (10 câu), 1 đoạn Writing 120 từ (chấm nhanh), tuỳ chọn Speaking Part 1 (2 câu).
- Kết quả: band ước lượng theo kỹ năng, 3 KC yếu nhất, kế hoạch tuần đầu. (Cách làm của Sagzzano/IELTSly, Elo khởi tạo).

### 3.2 Kế hoạch học thích ứng (thay cho `studyPlan` template)
- Thuật toán xếp lịch mỗi tuần: `phút khả dụng = minutes_per_day × days_per_week`. Phân bổ theo **khoảng cách tới mục tiêu** của từng kỹ năng (kỹ năng cách target xa hơn nhận tỉ trọng lớn hơn), tối thiểu 10% cho mỗi kỹ năng để không bỏ bê.
- Trong mỗi kỹ năng: 60% drill KC yếu (mastery < 0.6), 25% ôn SRS (sổ lỗi, từ vựng), 15% full test/mock theo nhịp (1 mock/2 tuần; tuần cuối trước ngày thi: 2 mock).
- Mỗi task là **thực thể có link**: `{type: drill|review|mock|writing|speaking, kc, test_id|question_ids, est_minutes, done_at}` – không phải chuỗi text.
- Điều chỉnh: nếu 2 drill liên tiếp của một KC đạt > 85% → giảm tần suất; nếu bỏ lỡ 3 ngày → nén kế hoạch, ưu tiên KC "sắp quên" (next_review_at quá hạn).

### 3.3 "Hôm nay" (Today) — khối đầu tiên trên dashboard
- 2–4 nhiệm vụ, tổng thời gian ≈ minutes_per_day, nút "Bắt đầu" duy nhất.
- Một câu lý do bằng dữ liệu cho mỗi task: *"Vì bạn sai 5/8 câu Matching Headings trong 2 bài gần nhất"*, *"7 lỗi đến hạn ôn"*.
- Khi hoàn thành: streak, phút đã học/tuần, 1 số duy nhất "còn X tuần, cần +0.5 band Reading".

### 3.4 Drill theo loại câu hỏi (mới — cốt lõi)
- Nguồn câu: tái sử dụng question_groups của các test hiện có (group đã gắn `question_type`), + bộ sinh AI theo KC.
- Một drill = 8–12 câu cùng KC, độ khó quanh θ (chọn β sao cho E≈0.7), không giới hạn giờ cứng nhưng hiện thời gian/câu.
- Phản hồi **ngay sau mỗi câu** (chế độ luyện) thay vì cuối bài (chế độ thi): KR → cho thử lại 1 lần (multiple-try) → KCR + giải thích + định vị bằng chứng (Narciss/Shute). Chế độ thi giữ nguyên như hiện nay.

### 3.5 Ôn lại ngắt quãng (SRS)
- Áp dụng cho: lỗi trong sổ (câu hỏi được *biến thể* lại hoặc câu cùng KC cùng bẫy), từ vựng đã tra/lưu trong lúc làm bài, lỗi Writing lặp lại (bài tập sửa câu).
- SM-2 rút gọn: ease 2.5, interval 1 → 3 → 7 → 16 → 35 ngày; sai thì về 1. Đủ cho đồ án, nêu FSRS là hướng mở.

## 4. Khi người học làm sai — thiết kế phản hồi chi tiết

### 4.1 Reading / Listening — phân loại nguyên nhân sai (error_cause)

| Mã | Nguyên nhân | Cách phát hiện (rule trước, AI sau) | Phản hồi/gợi ý tức thì | Bài sửa |
| --- | --- | --- | --- | --- |
| `spelling` | Đúng ý, sai chính tả / số ít-nhiều | Levenshtein ≤ 2 so với đáp án, hoặc khác hậu tố s/es | "Bạn nghe/đọc đúng từ nhưng viết *enviroment* → **environment**. Lỗi này mất điểm thật trong IELTS." | Dictation 10 từ hay sai của chính bạn |
| `word_limit` | Vượt giới hạn "NO MORE THAN TWO WORDS" | Đếm từ so với instruction | "Đáp án đúng nằm trong câu trả lời của bạn nhưng bạn viết 3 từ." | Drill completion có đếm từ hiển thị |
| `paraphrase_miss` | Không nhận ra diễn đạt lại | Người học chọn phương án chứa từ khoá trùng nguyên văn (word-matching trap) | Hiện song song câu đề ↔ câu trong bài, tô **từ đồng nghĩa** | Bài ghép paraphrase 10 cặp từ chính bài này |
| `tfng_confusion` | False ↔ Not Given | question_type ∈ {TFNG,YNNG} & user ≠ correct | Giải thích quy tắc: *False = bài nói ngược lại; Not Given = bài không nói* + trích đúng câu trong đoạn | 8 câu TFNG chỉ gồm cặp F/NG |
| `distractor` (Listening) | Chọn thông tin bị người nói sửa lại | Transcript có pattern "actually / no, sorry / I mean" quanh timestamp | Phát lại 8 giây quanh mốc, highlight transcript | Drill "nghe câu bị sửa" |
| `number_format` | Sai số/ngày/giờ/đánh vần tên | Loại câu completion với đáp án số | "15 vs 50 — luyện cặp -teen/-ty" | Minimal-pair dictation |
| `location_miss` | Tìm sai đoạn (Matching Information/Headings) | Đáp án của người học là heading của đoạn khác | Hiện topic sentence của đoạn đúng và đoạn đã chọn | Drill xác định main idea 6 đoạn |
| `inference` | Suy luận quá xa / hiểu đen | MCQ, phương án "quá tuyệt đối" | Chỉ ra từ hạn định (some/most/all) | — |
| `skipped` | Bỏ trống | answer rỗng | Nếu bỏ nhiều ở cuối bài → lỗi **quản lý thời gian**: gợi ý chiến lược chia 20'/passage | Drill tính giờ 1 passage |
| `unknown` | Không xếp được | mặc định | Giải thích AI (xem 4.3) | — |

**Hiển thị trên màn kết quả (mỗi câu sai):**
1. Câu hỏi + đáp án của bạn + đáp án đúng (đã có).
2. **Bằng chứng**: trích đoạn/nhấn vào mở passage tại vị trí (Reading) hoặc nút phát 8 giây + dòng transcript (Listening). *(cần thêm `evidence` vào question: `passage_anchor` hoặc `audio_start_ms`; admin nhập hoặc AI sinh một lần rồi cache)*
3. **Vì sao sai** (1–2 câu, theo error_cause).
4. **Làm gì tiếp**: nút "Luyện 8 câu cùng loại" / "Thêm vào ôn lại" (mặc định đã thêm).
5. Cuối trang: **"Mẫu hình lỗi của bài này"** – 2–3 dòng tổng hợp (ví dụ *"4/5 câu sai là completion vượt giới hạn từ"*), thay cho tip tĩnh hiện nay.

### 4.2 Writing — thẻ lỗi (taxonomy) để theo dõi qua nhiều bài
Kế thừa cách của IELTS Memo (33 loại) và kết quả nghiên cứu người Việt, chọn **~24 thẻ** đủ dùng:

- **GRA**: subject-verb agreement, article, tense, preposition, word order, singular/plural, relative clause, run-on, fragment, punctuation, passive misuse, modal + verb form.
- **LR**: wrong word choice, collocation, word form, repetition, informal register, spelling, vague language.
- **CC**: overused linkers, missing topic sentence, unclear reference, illogical sequence.
- **TA/TR**: no clear position, insufficient development/examples (lỗi số 1 ở người Việt), partially addressed prompt, missing overview (T1), data misrepresentation (T1).

Yêu cầu với `grade-writing`: trả về **JSON có cấu trúc** `{bands, errors:[{tag, quote, fix, explanation}], strengths, next_steps}`; `quote` phải *khớp nguyên văn* trong bài để tô màu inline (tránh ảo giác – cách của ielts-essay-score-ai). Lưu `errors` vào `writing_gradings.errors_json` và tổng hợp vào sổ lỗi theo tag.

Cá nhân hoá từ đó:
- Biểu đồ "lỗi lặp lại qua 5 bài gần nhất" theo tag → 3 tag hàng đầu sinh **bài sửa câu** (10 câu lấy từ chính bài của người học + biến thể).
- Nhắc trước khi viết bài mới: *"Lần trước bạn mắc 6 lỗi mạo từ — chú ý a/an/the"*.
- Gợi ý từ vựng thay thế cho từ lặp (LR) theo chủ đề đề bài.

### 4.3 Speaking
- Lưu transcript + band 4 tiêu chí (đã có). Thêm: **danh sách lỗi phát âm/ngữ pháp trích từ transcript**, tốc độ nói (từ/phút), tỉ lệ filler ("um", "like"), độ dài câu trả lời Part 2.
- Phản hồi: câu của bạn → câu mẫu band cao hơn 1 bậc (không viết lại toàn bộ), 3 từ/cụm nâng cấp theo chủ đề.
- Ôn lại: "shadowing" 3 câu mẫu; Part 1 câu hỏi cùng chủ đề đã yếu.

### 4.4 Giải thích bằng AI (khi không có explanation do admin nhập)
- Prompt có: câu hỏi, đáp án đúng, đáp án người học, đoạn văn/transcript liên quan (cắt ±2 câu), loại câu hỏi → trả JSON `{cause, evidence_quote, explanation_vi, tip}`.
- **Cache theo (question_id, user_answer)** để không gọi lại; cho admin/teacher duyệt và lưu vào `question.explanation`. Hiển thị tiếng Việt kèm trích dẫn tiếng Anh.
- Nếu `evidence_quote` không khớp nguyên văn trong passage → không hiện trích dẫn (chống ảo giác).

## 5. Thay đổi dữ liệu & API (phác thảo cho migration 003)

| Thay đổi | Service |
| --- | --- |
| `learner_goals` (mới) | auth hoặc analytics |
| `questions`: + `difficulty` (int, Elo β), `explanation` (đã có, bắt buộc nhập ở builder), `evidence_anchor` (jsonb: `{paragraph, sentence}` hoặc `{audio_start_ms, audio_end_ms}`), `trap_type` (tuỳ chọn) | test-service |
| `learner_kc_ratings` (learner_id, skill, kc, rating, n, updated_at) | analytics |
| `learner_mistakes`: + các cột §2.4 | analytics |
| `writing_gradings`: + `errors_json` | submission |
| `study_tasks` (learner_id, week, type, kc, ref_id, est_minutes, reason, done_at) | analytics |
| `saved_words` (learner_id, word, context, test_id, srs…) | analytics |
| API mới: `GET /analytics/today/:learnerId`, `POST /analytics/plan/regenerate`, `GET /analytics/mistakes/:learnerId/due`, `POST /tests/drills` (tạo attempt drill từ KC), `PUT /attempts/:id/questions/:qid/feedback-seen` | analytics, test |
| Event: `analytics.question.answered` (drill mode) để cập nhật Elo theo thời gian thực | RMQ |

## 6. Đo lường hiệu quả (để viết chương đánh giá luận văn)

- **Learning gain**: band placement vs band mock sau 4 tuần, theo kỹ năng.
- **Mastery delta** của 3 KC yếu nhất sau N drill.
- **Tỉ lệ lỗi lặp lại**: cùng error_cause/tag xuất hiện lại trong 3 bài kế tiếp (kỳ vọng giảm).
- **Tuân thủ kế hoạch**: % task "Hôm nay" hoàn thành; streak.
- **Chất lượng giải thích AI**: tỉ lệ `evidence_quote` khớp; đánh giá 👍/👎 của người học; tỉ lệ giáo viên sửa.
- **Khảo sát** 10–20 người học (SUS + 5 câu về tính hữu ích của phản hồi).

## 7. Thứ tự ưu tiên đề xuất

1. Hồ sơ mục tiêu + khối "Hôm nay" + nhiệm vụ có link (hạ tầng: `learner_goals`, `study_tasks`).
2. Màn kết quả: bằng chứng + vì sao sai + nút luyện cùng loại; sổ lỗi có trạng thái.
3. Drill theo KC với phản hồi tức thì (chế độ luyện).
4. Elo rating cho KC & câu hỏi; thay `accuracy` thô bằng mastery.
5. SRS cho sổ lỗi + từ vựng.
6. Writing: lỗi có thẻ, inline highlight, bài sửa câu; Speaking: lỗi từ transcript.
7. Placement test & onboarding.
8. Dashboard giáo viên: heatmap KC của lớp → giao drill cho nhóm yếu.
