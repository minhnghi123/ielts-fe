# 05 — Luyện nói có chấm tự động: phát âm → ghép câu → câu dài → nói tự do

> Trạng thái: **kế hoạch chờ duyệt** (chưa implement). Ngày: 2026-11-04.
> Bối cảnh: hệ thống đã có Speaking mock test 3 part (AI examiner "Sarah" qua Groq chat, ghi âm → Groq Whisper → chấm 4 tiêu chí bằng LLM). Chưa có luyện tập **theo bậc** và **chấm phát âm mức từ/âm**.

## 1. Mục tiêu

Thêm cho học viên một mạch luyện nói riêng (ngoài mock test), đi từ dễ đến khó, mỗi bước đều **nghe được mình nói gì và sai ở đâu**:

| Bậc | Tên trong UI | Học viên làm gì | Hệ thống chấm gì |
|---|---|---|---|
| A | **Phát âm từ** | Nghe mẫu → đọc 1 từ/cụm ngắn (≤ 5 s) | Từ có được nhận ra đúng không; âm nào lệch (so IPA mẫu ↔ IPA nhận diện); trọng âm |
| B | **Ghép câu** | Sắp xếp từ xáo trộn thành câu đúng → đọc câu vừa ghép | Ngữ pháp (thứ tự từ) + phát âm từng từ, độ trôi chảy |
| C | **Câu dài / đoạn** (shadowing) | Nghe mẫu → đọc theo câu 12–25 từ hoặc đoạn 40–60 từ | Từng từ đúng/sai/bỏ sót, tốc độ (wpm), ngắt nghỉ, so với mẫu |
| D | **Nói tự do** | Trả lời câu hỏi kiểu Part 1/Part 2 rút gọn (30–60 s) | 4 tiêu chí IELTS (Fluency, Lexical, Grammar, Pronunciation) + thẻ lỗi ngữ pháp + câu trả lời mẫu |

Nguyên tắc (giữ từ các PR trước): giải thích/mẹo **tiếng Việt**; nội dung tiếng Anh giữ nguyên; **không bịa số liệu** — chỉ hiện điểm mà hệ thống thật sự đo được; mọi lỗi phát âm đổ vào vòng lặp cá nhân hoá (sổ lỗi → drill → kế hoạch tuần).

## 2. Người ta làm như thế nào (research)

### 2.1 Sản phẩm thương mại

**ELSA Speak / ELSA API** (elsaspeak.com/en/elsa-api)
- Hai chế độ: **Scripted** (có văn bản cho trước, chấm đọc) và **Unscripted** (nói tự do: nhận diện rồi chấm).
- Ba cấp bài: *Word pronunciation* (feedback từng âm, hiện IPA, vd. `interesting /ˈɪn.trɪ.stɪŋ/`), *Sentence pronunciation* (phát âm + ngữ điệu + trôi chảy), *Unscripted speech* (phát âm, từ vựng, ngữ pháp…).
- Đầu ra: điểm câu/từ/âm vị; âm sai + gợi ý; trọng âm từ, tốc độ đọc, tỉ lệ sai, ngắt nghỉ; ngữ điệu (biến thiên cao độ, âm lượng); *Fluency: pace 100–140 wpm là mức khuyến nghị*; ngữ pháp: top lỗi theo loại (Word order, Verb form, Article…); từ vựng: phân bố CEFR (B2/C1/C2) + gợi ý từ đồng nghĩa nâng cao; ước lượng điểm IELTS nói.
- Giá: Scripted $0.008 / 15 s, Unscripted $0.02 / 15 s; giới hạn audio mỗi request 20 s (Standard) – 45 s/150 s (Premium).

**Microsoft Azure Pronunciation Assessment** (learn.microsoft.com … /how-to-pronunciation-assessment)
- Scripted (`ReferenceText`): **Accuracy** (độ khớp âm vị với người bản ngữ, tổng hợp từ mức âm vị → âm tiết → từ → toàn văn), **Fluency** (ngắt nghỉ giữa từ), **Completeness** (tỉ lệ từ đọc được / văn bản), **Prosody** (ngữ điệu, nhịp, trọng âm; lỗi *Unexpected break / Missing break / Monotone*). `Granularity=Phoneme` trả điểm tới từng âm; `EnableMiscue` gắn nhãn **Omission / Insertion**. Audio > 30 s phải dùng continuous mode (mất miscue).
- Unscripted (không reference): thêm **Content score** = Vocabulary + Grammar + Topic. Khuyến nghị 15 s (> 50 từ) – 10 phút.
- Gói Free F0: 5 giờ audio/tháng (đủ cho demo luận văn); có SDK JS chạy ngay trong trình duyệt.

**Duolingo Max** (blog.duolingo.com/duolingo-max)
- *Roleplay*: kịch bản do người viết, AI dẫn hội thoại, sau đó **feedback về độ chính xác & độ phức tạp câu trả lời + mẹo**; *Video Call*: trò chuyện thời gian thực, xem lại **transcript** sau cuộc gọi. Bài học: nội dung khởi đầu do con người soạn, AI chỉ phản hồi — giống cách ta đã làm với examiner "Sarah".

**Cambridge Speak & Improve**: trang không truy cập được từ máy này nên không trích dẫn chi tiết; chỉ ghi nhận là mô hình "nói tự do theo câu hỏi kiểu thi → ước lượng CEFR" tương tự bậc D.

### 2.2 Mã nguồn mở / nghiên cứu

- **speechocean762** (arXiv 2104.01378, INTERSPEECH 2021): 5 000 câu của 250 người không bản ngữ, chấm mức câu/từ/âm vị bởi 5 chuyên gia; **miễn phí cả thương mại**; baseline Kaldi dùng **GOP (Goodness of Pronunciation)** = log-likelihood âm vị kỳ vọng so với âm vị nhận diện. → Dùng được để **đánh giá** bộ chấm của mình trong luận văn.
- **wav2vec2 phoneme recognition** (`facebook/wav2vec2-lv-60-espeak-cv-ft`, Hugging Face): nhận diện trực tiếp ra chuỗi IPA, không qua từ → phát hiện phát âm lệch mà ASR thường "tự sửa". Cần Python + mô hình ~300 MB, CPU chạy được cho audio ngắn.
- **WhisperX** (github.com/m-bain/whisperX): Whisper + forced alignment (wav2vec2) → mốc thời gian mức từ/âm vị chính xác. Giải thích vì sao timestamp mức từ quan trọng cho fluency.
- **ai-pronunciation-trainer** (github.com/Thiagohgl/ai-pronunciation-trainer, AGPL): Whisper → so IPA mẫu (Epitran) với IPA của từ nhận diện → tô màu từ đúng/sai. Đây chính là kiến trúc "rẻ" mà ta có thể tái tạo bằng Groq Whisper + từ điển CMU trong Node (không dùng mã AGPL).
- **Groq API** (console.groq.com/docs/speech-to-text, /text-to-speech): Whisper `whisper-large-v3-turbo` đã dùng trong repo; `response_format=json` + `timestamp_granularities=["word"]` cho **mốc thời gian từng từ**; TTS `canopylabs/orpheus-v1-english` cho **audio mẫu**. Nằm trong key Groq hiện có.

### 2.3 Rút ra

1. Mọi sản phẩm tách **scripted** (có văn bản, chấm chính xác tới âm) và **unscripted** (nói tự do, chấm nội dung bằng LLM). Bậc A–C là scripted, bậc D là unscripted.
2. Feedback mức âm vị thật sự cần **mô hình âm vị** (Azure/ELSA/wav2vec2). ASR kiểu Whisper tự "sửa" phát âm sai nhẹ nên chỉ tin được ở **mức từ** (đọc được / không, bỏ sót, thay từ) và **mức thời gian** (wpm, ngắt nghỉ).
3. Fluency đo bằng số thật: wpm (mốc 100–140), số lần dừng > 0,5 s, từ đệm (um/uh), tỉ lệ hoàn thành. Không để LLM "đoán" fluency.
4. Feedback phải **hành động được**: âm nào sai, nghe lại mẫu ↔ nghe lại mình, luyện lại đúng âm đó.

## 3. Lựa chọn kiến trúc

| | Phương án 1 — Groq Whisper + bộ chấm tự viết | Phương án 2 — Azure Pronunciation Assessment | Phương án 3 — wav2vec2 phoneme self-host |
|---|---|---|---|
| Chi phí | Trong key Groq hiện có (Whisper ~$0.04–0.11/giờ) | Free F0 5 giờ/tháng, sau đó trả phí; cần tài khoản Azure | Server Python (CPU được), 0 phí API |
| Độ sâu feedback | Mức từ + thời gian; âm vị chỉ **suy ra** từ khác biệt từ (CMUdict) | Mức âm vị thật, prosody, miscue | Mức âm vị thật, không prosody |
| Độ khó | Thấp (toàn bộ trong Next.js route) | Trung bình (SDK JS/REST, key, region) | Cao (service mới, mô hình, deploy) |
| Rủi ro | Whisper bỏ qua lỗi nhẹ → phải nói rõ giới hạn | Phụ thuộc nhà cung cấp, hết free | Thời gian xử lý, vận hành |

**Đề xuất:** làm **Phương án 1 làm lõi** (ship được ngay, không thêm chi phí, giữ 1 nhà cung cấp AI) với **interface `PronunciationProvider`** để cắm **Phương án 2** khi có Azure key (môi trường `SPEECH_PROVIDER=groq|azure`). Phương án 3 chỉ ghi nhận như hướng mở rộng trong luận văn. Khi đánh giá (PR 8), có thể so bộ chấm Phương án 1 với nhãn speechocean762 ở mức từ.

### 3.1 Bộ chấm scripted (Phương án 1) — thuật toán

```
input: referenceText, audio (≤ 20 s cho A/B, ≤ 60 s cho C)
1. Groq Whisper: transcript + words[{word, start, end}] (language=en, temperature=0)
2. Chuẩn hoá cả hai: lowercase, bỏ dấu câu, số → chữ
3. Căn chỉnh chuỗi từ (diff/Levenshtein) → mỗi từ mẫu: correct | substituted(heard=X) | omitted; từ thừa: inserted
4. Với từ substituted: G2P (CMUdict; fallback LLM) cho cả từ mẫu và từ nghe được → so ARPAbet → âm lệch (vd. TH→T, final S bị mất) → map sang mẹo tiếng Việt
5. Fluency: wpm = words/duration*60; pauses = khoảng trống giữa từ > 0.5 s; fillers (um, uh, er) đếm từ transcript
6. Completeness = correct / tổng từ mẫu
7. Điểm tổng (0–100) = 0.6*accuracyWord + 0.25*fluency + 0.15*completeness; hiện kèm nhãn "ước lượng ở mức từ"
```
Giới hạn được in ngay dưới kết quả: *"Chấm dựa trên nhận diện giọng nói; lỗi phát âm nhẹ có thể không bị phát hiện. Hãy nghe lại bản ghi của bạn."*

### 3.2 Bậc D — nói tự do

- Transcript Whisper (đã có `/api/ai/transcribe`) + số liệu fluency thật (wpm, pauses, fillers, thời lượng).
- LLM (Groq, prompt JSON như `speaking-chat`) chấm **Lexical** và **Grammar** + gắn **thẻ lỗi** tái dùng taxonomy Writing (Ngữ pháp / Liên kết ý / Từ vựng / Trả lời đề) với trích câu sai → câu sửa; đưa **câu trả lời mẫu band mục tiêu** (≤ 80 từ).
- **Fluency** band = quy đổi từ số liệu thật (bảng wpm/pauses → band, công khai trong doc) — LLM không tự cho điểm fluency.
- **Pronunciation**: Phương án 1 chỉ hiện "tỉ lệ từ nhận diện được / từ nghe không rõ" chứ **không** cho band phát âm; khi bật Azure provider mới có band phát âm thật.

## 4. Flow màn hình (tasteskill, 1 hành động chính/màn)

Trang mới `/speak` (sidebar: **Luyện nói**) — 4 mức là 4 dòng trong một danh sách, mỗi dòng có tiến độ thật (số bài đã làm, điểm trung bình) và nút hành động:

1. **Phát âm từ** — nguồn từ: (a) Sổ từ vựng của học viên, (b) từ có âm hay sai của học viên, (c) bộ từ IELTS theo chủ đề. Màn: từ + IPA + nút **Nghe mẫu** (TTS cache) → nút lớn **Ghi âm** (tự dừng sau 5 s hoặc bấm) → kết quả: từ tô màu, âm lệch + mẹo tiếng Việt (vd. *"/θ/ trong "think": đặt lưỡi giữa hai hàm răng rồi thổi hơi; đừng đọc thành /t/"*), nút **Thử lại** / **Từ tiếp theo**.
2. **Ghép câu** — chip từ xáo trộn, chạm để xếp; **Kiểm tra** → nếu đúng: **Đọc câu này** → chấm như bậc A nhưng theo từng từ; nếu sai: chỉ ra vị trí sai + quy tắc ngắn (tiếng Việt).
3. **Câu dài / đoạn** — mẫu TTS có thể phát chậm 0.8×; ghi âm; kết quả: câu với từ tô màu (đúng / sai / bỏ sót gạch), wpm so mốc 100–140, số lần dừng; **nghe lại mình ↔ nghe mẫu** theo từng câu.
4. **Nói tự do** — câu hỏi + 15 s chuẩn bị (tuỳ chọn) → ghi âm 30–60 s → transcript hiện dần → kết quả 4 tiêu chí (chỉ tiêu chí đo được), thẻ lỗi ngữ pháp, câu mẫu, nút **Luyện lại câu hỏi khác cùng chủ đề**.

Vòng lặp cá nhân hoá:
- Mỗi âm sai → `learner_kc_ratings(skill='speaking', kc='ph:TH')` (Elo đã có) → mục **Âm cần luyện** ở `/speak` và chip mức thành thạo.
- Kế hoạch tuần: task `speaking` (đã có taskType) nay trỏ tới `/speak?level=…&kc=…` với lý do tiếng Việt (*"Bạn sai /θ/ 6 lần tuần này"*).
- Sổ lỗi: thêm bộ lọc kỹ năng Speaking với nguyên nhân `sound_substitution`, `final_consonant`, `word_stress`, `omission`, `pace`.

## 5. Dữ liệu (migration 004)

```sql
CREATE TABLE speaking_exercises (
  id uuid PK, level varchar(16) CHECK (level IN ('word','sentence_build','sentence','free')),
  text text NOT NULL,            -- từ / câu mẫu / câu hỏi
  ipa text, target_sounds text[], topic varchar(60), difficulty varchar(10),
  shuffled_tokens text[],        -- chỉ sentence_build
  sample_answer text, created_by uuid, is_active bool DEFAULT true, created_at timestamptz
);
CREATE TABLE speaking_attempts (
  id uuid PK, learner_id uuid FK, exercise_id uuid FK, audio_url text, transcript text,
  duration_s numeric(6,2), wpm int, pauses int, fillers int,
  word_results jsonb,            -- [{word, status, heard, phonemeDiffs:[{expected,actual}]}]
  scores jsonb,                  -- {accuracy, fluency, completeness, overall, fluencyBand?, lexical?, grammar?}
  errors_json jsonb,             -- thẻ lỗi bậc D
  provider varchar(10),          -- groq | azure
  created_at timestamptz
);
-- âm sai: tái dùng learner_kc_ratings (skill='speaking', kc='ph:<ARPAbet>') và learner_mistakes (skill='speaking')
```
Audio: lưu Cloudinary như hiện tại nhưng **có nút xoá** và tự xoá sau 30 ngày (quyền riêng tư giọng nói).

## 6. API

Next.js (giữ AI ở FE route như hiện nay):
- `POST /api/ai/speech/score-scripted` { exerciseId | referenceText, audio } → word_results, scores, phoneme tips (VI).
- `POST /api/ai/speech/score-free` { question, audio } → transcript, fluency metrics, lexical/grammar + errors_json + sample answer.
- `GET /api/ai/speech/tts?text=` → audio mẫu (Groq Orpheus) cache theo hash vào Cloudinary.

Backend:
- test-service: CRUD `speaking_exercises` (admin/teacher), import JSON seed (≥ 120 bài: 40 từ theo âm khó với người Việt, 30 ghép câu, 30 câu dài, 20 câu hỏi tự do).
- analytics-service: `POST /analytics/speaking/attempts` (lưu + cập nhật Elo âm + sổ lỗi), `GET /analytics/speaking/summary/:learnerId` (tiến độ 4 mức, âm yếu), kế hoạch tuần đọc thêm tín hiệu này.

## 7. Lộ trình (sau khi duyệt)

| PR | Nội dung | Ước lượng |
|---|---|---|
| 9a BE | migration 004, entities, CRUD exercises + seed, attempts + Elo âm + sổ lỗi, summary API | 1 phiên |
| 9b FE | bộ chấm scripted (Groq + CMUdict), TTS cache, `/speak` với bậc A + B | 1 phiên |
| 9c FE/BE | bậc C + D, thẻ lỗi, câu mẫu, nối kế hoạch tuần & sổ lỗi | 1 phiên |
| 9d | `PronunciationProvider` Azure (nếu có key), đánh giá bộ chấm trên speechocean762 cho chương đánh giá | 0.5–1 phiên |

## 8. Rủi ro & giới hạn cần ghi rõ trong luận văn

- Whisper chuẩn hoá lời nói → bỏ sót lỗi phát âm nhẹ (giải pháp: nhãn "mức từ", provider Azure tuỳ chọn).
- Mic/môi trường ồn, iOS Safari ghi `audio/mp4` chứ không `webm` (route đã nhận Blob bất kỳ, cần kiểm thử).
- Chi phí: mỗi lượt 5–60 s audio; bậc A rất ngắn nên rẻ; cần rate limit theo học viên (vd. 60 lượt/ngày).
- Quyền riêng tư giọng nói: cho phép xoá, mặc định hết hạn 30 ngày.
- Nội dung bài phải do người soạn/duyệt (bài học từ Duolingo), AI chỉ gợi ý bản nháp trong admin.

## 9. Cần bạn chốt trước khi implement

1. Lõi chấm: **Phương án 1** (Groq, không thêm chi phí) hay **Phương án 2** (Azure, cần tạo tài khoản & key)? Đề xuất: 1 + interface để cắm 2.
2. Có lưu audio của học viên không (để nghe lại và cho giáo viên xem)? Đề xuất: có, tự xoá sau 30 ngày.
3. Nội dung bài: seed tay 120 bài theo âm khó với người Việt (đề xuất) hay để admin sinh bằng AI rồi duyệt?
4. Bậc D giới hạn Part 1 (30–45 s) hay gồm cả Part 2 (60–120 s)? Đề xuất: Part 1 trước.
5. Vị trí: trang riêng `/speak` trên sidebar (đề xuất) hay gộp vào `/drill`?
