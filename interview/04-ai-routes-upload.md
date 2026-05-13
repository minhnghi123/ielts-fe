# Interview: AI Routes, Groq SDK & Upload Pipeline

---

## Q1. Giải thích tổng quan các AI routes trong dự án. Groq là gì và tại sao chọn nó?

**Trả lời:**

Dự án có 5 Next.js server-side routes cho AI:

| Route | Mục đích | Output type |
|---|---|---|
| `/api/ai/advisor` | Study coach chat | Streaming text |
| `/api/ai/grade-writing` | Chấm bài writing | JSON (non-streaming) |
| `/api/ai/generate-test` | Tạo đề thi | JSON (non-streaming) |
| `/api/ai/analyze-result` | Phân tích kết quả | JSON (non-streaming) |
| `/api/ai/speaking-chat` | Mô phỏng speaking exam | JSON (non-streaming) |

**Groq là gì:**

Groq là công ty hardware + API chuyên về **LLM inference cực nhanh**. Họ xây dựng chip chuyên dụng (LPU - Language Processing Unit) tối ưu cho inference. Tốc độ Groq thường **5-10x nhanh hơn** OpenAI với cùng model size.

**Tại sao chọn Groq thay vì OpenAI:**

```
OpenAI GPT-4:    ~30-50 tokens/second
Groq llama-70b: ~250-300 tokens/second
```

Với IELTS grading (cần 700-2000 tokens response), Groq cho kết quả trong 2-5s thay vì 15-30s của OpenAI. Với streaming advisor, latency thấp hơn tạo trải nghiệm chat tốt hơn.

**Model: `llama-3.3-70b-versatile`**

Meta's LLaMA 3.3, 70 billion parameter model — đủ thông minh cho IELTS grading, đủ nhanh cho real-time use. Free tier của Groq đủ dùng cho dự án học thuật.

---

## Q2. Giải thích JSON mode của Groq. Tại sao cần nó cho grading và test generation?

**Trả lời:**

Khi LLM tạo text tự do, nó có thể return:
```
Đây là kết quả chấm bài: band 6.5, coherence 7, grammar 6...
(hoặc JSON, hoặc mixed text + JSON, hoặc malformed JSON)
```

→ Không thể parse reliable.

**JSON mode** (`response_format: { type: "json_object" }`) bắt buộc LLM chỉ output valid JSON:

```typescript
const response = await groq.chat.completions.create({
  model: 'llama-3.3-70b-versatile',
  response_format: { type: 'json_object' },  // ← JSON mode
  messages: [
    {
      role: 'system',
      content: `You are an IELTS examiner. Return JSON in EXACTLY this format:
      {
        "task1": {
          "annotated_html": "<p>essay text with <span class='ielts-error'>...</span></p>",
          "task_response": 6.5,
          "coherence": 7.0,
          "lexical": 6.0,
          "grammar": 6.5,
          "overall_band": 6.5,
          "suggestions": [...]
        },
        "task2": { ... }
      }`
    },
    { role: 'user', content: `Task 1: ${task1Content}\nTask 2: ${task2Content}` }
  ]
});

const result = JSON.parse(response.choices[0].message.content);
// result.task1.task_response → 6.5 (number, reliable)
```

**System prompt phải define schema rõ ràng.** LLM follow schema trong prompt để output đúng format.

**Cạm bẫy:** JSON mode đảm bảo valid JSON nhưng không đảm bảo schema đúng. Cần validate sau:

```typescript
if (typeof result.task1.task_response !== 'number') {
  throw new Error('Invalid grading format from AI');
}
```

---

## Q3. Giải thích band score calculation cho Writing. Tại sao Task 2 weighted 2x?

**Trả lời:**

Đây là quy tắc IELTS chính thức:

```typescript
// Trong /api/ai/grade-writing/route.ts
const task1Band = grading.task1.overall_band;
const task2Band = grading.task2.overall_band;

// Task 2 counts double vì:
// - Task 2 = 250+ words (Task 1 chỉ 150 words)
// - Task 2 = essay (phức tạp hơn graph/table description)
// - Official IELTS Academic/General Training scoring policy
const combinedBand = (task1Band + 2 * task2Band) / 3;

// Ví dụ:
// Task 1: 6.0, Task 2: 7.0
// Combined = (6.0 + 2 * 7.0) / 3 = (6.0 + 14.0) / 3 = 20/3 = 6.67 ≈ 6.5
```

**Rounding rules của IELTS:**

IELTS bands được round đến 0.5 gần nhất:
```
6.0–6.24 → 6.0
6.25–6.74 → 6.5
6.75–7.24 → 7.0
```

**4 criteria cho writing:**

| Criterion | Viết tắt | Ý nghĩa |
|---|---|---|
| Task Achievement/Response | `task_response` | Có đáp ứng yêu cầu đề bài không? |
| Coherence and Cohesion | `coherence` | Câu/đoạn có liên kết logic không? |
| Lexical Resource | `lexical` | Từ vựng đa dạng, chính xác không? |
| Grammatical Range and Accuracy | `grammar` | Ngữ pháp đúng và đa dạng không? |

```typescript
// Overall band của từng task = average 4 criteria
const task1Overall = (task_response + coherence + lexical + grammar) / 4;
// Round to nearest 0.5
```

---

## Q4. Annotated HTML trong writing grading hoạt động như thế nào?

**Trả lời:**

AI không chỉ cho điểm mà còn **annotate** bài viết — đánh dấu lỗi ngay trong text:

```typescript
// System prompt yêu cầu AI output:
interface GradingResult {
  annotated_html: string;  // Essay với span annotations
  suggestions: Array<{
    id: number;          // Matches data-id trên span
    original_text: string;
    error_type: string;  // "grammar" | "vocabulary" | "coherence"
    correction: string;
    explanation: string;
  }>;
}
```

**Ví dụ annotated_html:**

```html
<p>
  The graph shows the <span class="ielts-good">significant increase</span> in 
  renewable energy production. However, 
  <span class="ielts-error" data-id="1">the peoples are consuming</span> 
  more energy than before.
</p>
```

**Ví dụ suggestions:**

```json
{
  "id": 1,
  "original_text": "the peoples are consuming",
  "error_type": "grammar",
  "correction": "people are consuming",
  "explanation": "'People' is already plural, không thêm 's'"
}
```

**Frontend render:**

```css
.ielts-good {
  background-color: #dcfce7;  /* Green highlight */
  border-bottom: 2px solid green;
}
.ielts-error {
  background-color: #fee2e2;  /* Red highlight */
  border-bottom: 2px solid red;
  cursor: pointer;             /* Click to see suggestion */
}
```

User hover/click vào span error → tooltip hiện suggestion với `data-id` matching.

---

## Q5. Speaking chat route hoạt động như thế nào? Giải thích 3 actions.

**Trả lời:**

Speaking test được simulate như một multi-turn conversation với AI examiner "Sarah":

```typescript
// 3 actions:
type Action = 'start_part' | 'respond' | 'grade_part';

// Request shape:
{
  action: Action;
  partNumber: 1 | 2 | 3;
  partConfig: SpeakingPartConfig;  // Questions, cues từ database
  conversationHistory: [           // Toàn bộ lịch sử conversation
    { role: 'examiner', content: 'Good morning...' },
    { role: 'candidate', content: 'My name is...' },
    // ...
  ];
  userTranscript?: string;  // Chỉ có khi action = 'respond'
}
```

**Flow thực tế:**

```
Part 1:
  start_part → AI: "Good morning! I'm Sarah. Could you tell me your name?"
  respond (transcript: "Hi, my name is John") → AI: "Nice to meet you. Do you work or study?"
  respond (transcript: "I'm a student") → AI: "What do you study?"
  ... (4-5 exchanges)
  grade_part → AI: grading + "Thank you. That's the end of Part 1."

Part 2:
  start_part → AI: "Now I'd like you to talk about... You have 1 minute to prepare."
  (User chuẩn bị 60s)
  respond (long transcript 120s) → AI: "Thank you. Can I ask, did you enjoy it?"
  grade_part → grading

Part 3:
  start_part → AI: "Now I'd like to discuss..."
  respond → respond → ... → grade_part
```

**Tại sao pass `conversationHistory` mỗi request?**

LLM là **stateless** — không có memory giữa các request. Mỗi request phải gửi toàn bộ context để AI "nhớ" cuộc trò chuyện.

```typescript
// Message format cho Groq:
messages: [
  { role: 'system', content: examinerPersonaPrompt },
  // Map conversation history:
  ...conversationHistory.map(msg => ({
    role: msg.role === 'examiner' ? 'assistant' : 'user',
    content: msg.content,
  })),
  // Thêm user's transcript nếu có:
  ...(userTranscript ? [{ role: 'user', content: userTranscript }] : []),
]
```

**`grade_part` response:**

```typescript
{
  examinerMessage: "Thank you. That concludes Part 1.",
  isPartDone: true,
  grading: {
    fluency: 6.5,
    lexical: 7.0,
    grammar: 6.0,
    pronunciation: 6.5,
    overall: 6.5,
    suggestions: [
      {
        criterion: "fluency",
        feedback: "Candidate used many filler words ('um', 'uh')",
        improvement: "Practice speaking in complete sentences without pausing"
      }
    ]
  }
}
```

---

## Q6. Upload routes hoạt động thế nào? Giải thích pipeline xử lý image.

**Trả lời:**

**Image upload pipeline:**

```
Browser FormData (image file)
    │
    ▼ POST /api/upload/image
Next.js Route Handler (server-side)
    │
    ├── 1. Validate MIME type
    │      Allowed: jpeg, png, webp, gif, bmp
    │      Max size: 10MB
    │      → 400 nếu invalid
    │
    ├── 2. Read file as Buffer
    │      const buffer = Buffer.from(await file.arrayBuffer())
    │
    ├── 3. Sharp processing (dynamic import — server only)
    │      const sharp = (await import('sharp')).default
    │      const processed = await sharp(buffer)
    │        .resize(1200, undefined, {   // Max 1200px width
    │           withoutEnlargement: true  // Không upscale
    │        })
    │        .webp({ quality: 85 })       // Convert to WebP
    │        .toBuffer()
    │
    ├── 4. Cloudinary upload
    │      cloudinary.uploader.upload_stream(
    │        { folder: 'ielts-images', format: 'webp' },
    │        callback
    │      ).end(processed)
    │
    └── Response: { url, publicId, width, height }
```

**Tại sao `dynamic import` của Sharp?**

```typescript
// ❌ Static import: lỗi ở Edge runtime hoặc build
import sharp from 'sharp';

// ✅ Dynamic import: chỉ load khi route được gọi (server-only)
const sharp = (await import('sharp')).default;
```

Sharp sử dụng **native C++ bindings** (libvips) — không tương thích với Edge runtime hoặc browser bundle. Dynamic import đảm bảo nó chỉ được load trong Node.js runtime (server-side), tránh bundle issues.

**WebP benefits:**

```
JPEG 100KB → WebP 60-70KB (same quality)
PNG 200KB → WebP 120KB
→ Giảm ~30-40% bandwidth cho users
```

**Audio upload pipeline:**

```
Browser FormData (audio file)
    │
    ▼ POST /api/upload/audio
    │
    ├── Validate: audio/mpeg, wav, ogg, m4a, aac, video/mp4
    │   (video/mp4 vì MP4 container chứa audio track)
    │   Max: 50MB
    │
    ├── Cloudinary upload với options:
    │   {
    │     folder: 'ielts-audio',
    │     resource_type: 'video',  ← Cloudinary dùng 'video' cho cả audio!
    │     format: 'mp3',
    │     audio_codec: 'mp3',
    │     bit_rate: '128k'         ← Transcode to MP3 128kbps
    │   }
    │
    └── Response: { url, publicId, duration }
```

**Tại sao `resource_type: 'video'` cho audio?**

Cloudinary API quirk: media files có audio (MP3, WAV, OGG) phải upload với `resource_type: 'video'`. Loại `resource_type: 'raw'` sẽ không transcode được.

---

## Q7. Giải thích error handling trong AI routes. Nếu Groq fail thì sao?

**Trả lời:**

Các AI routes xử lý lỗi khác nhau tùy context:

**Grade Writing — fail gracefully:**

```typescript
try {
  const response = await groq.chat.completions.create({ ... });
  const grading = JSON.parse(response.choices[0].message.content);
  // ... persist to DB
  return Response.json(grading);
} catch (error) {
  console.error('Grading failed:', error);
  // Return empty feedback — frontend xử lý gracefully
  return Response.json({ aiFeedback: '' }, { status: 200 });
  // Không return 500 vì frontend cần nhận được response để redirect
}
```

**Generate Test — hard fail:**

```typescript
try {
  const testJson = JSON.parse(response.choices[0].message.content);
  // Validate structure
  if (!testJson.test?.sections?.length) throw new Error('Invalid structure');
  return Response.json(testJson);
} catch (error) {
  return Response.json({ error: 'Failed to generate test' }, { status: 500 });
  // Admin nhận 500 → show error toast → try again
}
```

**Tại sao behavior khác nhau:**

- **Analyze Result:** Thêm into grit bài làm, không chặn user flow. Empty feedback vẫn cho user xem kết quả.
- **Generate Test:** Admin action, cần data chính xác. 500 → user try again.

**Timeout consideration:**

Groq có thể mất 30-60s cho large prompts. Axios timeout của dự án là 30s → request từ browser có thể timeout trước khi Groq respond. Cần:

```typescript
// Route Handler timeout (App Router default: 30s cho static, cần configure)
export const maxDuration = 60; // Next.js route timeout config
```

Đây là một potential issue chưa được config đầy đủ trong dự án.
