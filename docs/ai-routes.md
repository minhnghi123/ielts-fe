# Frontend — Server-Side AI & Upload Routes

All routes under `app/api/` are Next.js Route Handlers running server-side. They never expose secrets to the browser and never proxy through NestJS — they call external services directly.

---

## AI Routes

### POST `/api/ai/advisor`

**File:** `app/api/ai/advisor/route.ts`  
**Purpose:** AI-powered IELTS coaching chat with learner-specific context.  
**External service:** Groq API (`llama-3.3-70b-versatile`)  
**Response type:** Server-Sent Events (streaming text)

**Request body:**
```typescript
{
  messages: {
    role: 'user' | 'assistant';
    content: string;
  }[];
  profile: {
    userName: string;
    totalCompleted: number;
    overallAvgBand: number;
    skills: {
      [skill: string]: {
        avgBand: number;
        totalAttempts: number;
        accuracy?: number;
      };
    };
    questionTypeAccuracy: {
      [questionType: string]: { correct: number; total: number };
    };
    recentAttempts: {
      testTitle: string;
      skill: string;
      bandScore: number | null;
      rawScore: number | null;
      date: string;
    }[];
  };
}
```

**Response:** `text/plain` stream (Server-Sent Events). Each chunk is streamed advisor text.

**System prompt behavior:** Constructs a detailed learner profile context covering weak skills, question type accuracy, recent performance, and provides personalized study roadmap, realistic band improvement timeline, and daily practice suggestions.

**DB operations:** None — read-only, uses data passed in the request body.

---

### POST `/api/ai/grade-writing`

**File:** `app/api/ai/grade-writing/route.ts`  
**Purpose:** Grade IELTS Writing Task 1 and Task 2 essays with annotated HTML and per-criterion bands.  
**External service:** Groq API (`llama-3.3-70b-versatile`, JSON mode)

**Request body:**
```typescript
{
  testId: string;
  learnerId: string;
  task1Content: string;    // Essay text for Task 1
  task2Content: string;    // Essay text for Task 2
  task1Id: string;         // writing_tasks.id for Task 1
  task2Id: string;         // writing_tasks.id for Task 2
}
```

**Response body:**
```typescript
{
  gradingId: string;       // ai_writing_gradings.id
  submissionId: string;    // writing_submissions.id (Task 2)
  overallBand: number;     // Combined band (Task 2 weighted 2x)
  task1: {
    annotated_html: string;     // Essay with error annotations as HTML
    task_response: number;      // 0–9
    coherence: number;
    lexical: number;
    grammar: number;
    overall_band: number;
    suggestions: {
      type: string;             // e.g., 'grammar', 'vocabulary', 'coherence'
      original: string;
      improved: string;
      explanation: string;
    }[];
  };
  task2: { /* same shape as task1 */ };
}
```

**IELTS scoring rule:** Task 2 scores count double in the overall band calculation:
```
overallBand = (task1.overall_band + 2 * task2.overall_band) / 3
```

**DB operations (sequential):**
1. `POST /api/writing-submissions` — save task1 submission → get `task1SubmissionId`
2. `POST /api/writing-submissions` — save task2 submission → get `task2SubmissionId`
3. `POST /api/writing-gradings` — save AI grading for task1 (with annotated feedback in `feedback` JSONB)
4. `POST /api/writing-gradings` — save AI grading for task2
5. `POST /api/writing-submissions/:id/scores` — save per-criterion writing_scores for each task

---

### POST `/api/ai/generate-test`

**File:** `app/api/ai/generate-test/route.ts`  
**Purpose:** Generate a complete IELTS test from a topic description.  
**External service:** Groq API (`llama-3.3-70b-versatile`, JSON mode)

**Request body:**
```typescript
{
  skill: 'reading' | 'listening';
  topic: string;
  numSections?: number;        // Default: 3 for reading, 4 for listening
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  questionTypes?: string[];    // Filter to specific question types
  additionalInstructions?: string;
  isMock?: boolean;
}
```

**Response body:**
```typescript
{
  test: {
    title: string;
    skill: string;
    isMock: boolean;
    sections: {
      sectionOrder: number;
      passage?: string;        // Reading passage text
      audioUrl?: string;
      groups: {
        groupOrder: number;
        instructions: string;
        questions: {
          questionOrder: number;
          questionType: string;
          questionText: string;
          config: Record<string, any>;
          explanation: string;
          answer: {
            correctAnswers: string[];
            caseSensitive: boolean;
          };
        }[];
      }[];
    }[];
  }
}
```

**DB operations:** None — the admin frontend handles persistence by calling `POST /api/tests/manual` after receiving the AI response.

---

### POST `/api/ai/analyze-result`

**File:** `app/api/ai/analyze-result/route.ts`  
**Purpose:** Generate post-test AI feedback analyzing performance patterns and saving mistake data.  
**External service:** Groq SDK (`llama-3.3-70b-versatile`, non-streaming JSON)

**Request body:**
```typescript
{
  attemptId: string;
  learnerId: string;
  skill: string;
  testTitle: string;
  totalQ: number;
  correctQ: number;
  wrongQ: number;
  skippedQ: number;
  bandScore: number;
  wrongAnswers: {
    questionNumber: number;
    questionType: string;
    yourAnswer: string;
    correctAnswer: string;
  }[];
  wrongQuestionIds: string[];   // question IDs for mistake logging
  questionTypeStats: {
    [questionType: string]: { correct: number; total: number };
  };
}
```

**Response body:**
```typescript
{
  aiFeedback: string;    // Markdown-formatted performance analysis
}
```

**DB operations:**
1. **Supabase direct insert** — inserts one row per wrong question into `learner_mistakes` table (bypasses NestJS for speed)
2. `PUT /api/attempts/:attemptId/ai-feedback` — saves markdown feedback to `test_attempts.ai_feedback`

---

### POST `/api/ai/speaking-chat`

**File:** `app/api/ai/speaking-chat/route.ts`  
**Purpose:** Simulated IELTS speaking exam with an AI examiner that follows official protocol.  
**External service:** Groq API via direct HTTP (`llama-3.3-70b-versatile`, JSON mode)

**Request body:**
```typescript
{
  action: 'start_part' | 'respond' | 'grade_part';
  partNumber: 1 | 2 | 3;
  partConfig: SpeakingPartConfig;   // from speaking_parts.config
  conversationHistory: {
    role: 'examiner' | 'candidate';
    content: string;
  }[];
  userTranscript?: string;   // STT transcript of candidate's spoken response
}
```

**Response body:**
```typescript
{
  examinerMessage: string;
  isPartDone: boolean;
  grading?: {
    fluency: number;
    lexical: number;
    grammar: number;
    pronunciation: number;
    overall: number;
    suggestions: {
      criterion: string;
      feedback: string;
      improvement: string;
    }[];
  };
}
```

**Special behavior:**
- `action: 'start_part'` — examiner introduces the part with official IELTS opening
- `action: 'respond'` — examiner asks follow-up questions based on candidate response
- `action: 'grade_part'` — examiner grades the entire part (triggers `grading` in response)
- Enforces official IELTS exam protocol: specific Part 1/2/3 structures, timing cues, neutral examiner persona

**DB operations:** None — all state is managed client-side.

---

## Upload Routes

### POST `/api/upload/image`

**File:** `app/api/upload/image/route.ts`  
**Purpose:** Process and upload images for test content (passages, questions).  
**External service:** Sharp (processing) + Cloudinary (storage)  
**Request:** `multipart/form-data` with field `file`

**Validation:**
- Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `image/bmp`
- Max file size: **10 MB**

**Processing pipeline:**
1. Read uploaded buffer
2. Sharp: resize to max 1200px width (maintain aspect ratio)
3. Sharp: convert to WebP format, quality 85
4. Upload to Cloudinary folder `ielts-images`

**Response:**
```typescript
{
  url: string;        // Cloudinary secure URL
  publicId: string;   // Cloudinary public ID (for deletion)
  width: number;
  height: number;
}
```

---

### POST `/api/upload/audio`

**File:** `app/api/upload/audio/route.ts`  
**Purpose:** Upload audio files for listening test sections.  
**External service:** Cloudinary (with audio transcoding)  
**Request:** `multipart/form-data` with field `file`

**Validation:**
- Allowed MIME types: `audio/mpeg` (MP3), `audio/wav`, `audio/ogg`, `audio/x-m4a`, `audio/aac`, `video/mp4`
- Max file size: **50 MB**

**Processing:** Cloudinary automatically transcodes to MP3 at 128k bitrate.

**Response:**
```typescript
{
  url: string;        // Cloudinary secure URL (MP3)
  publicId: string;
  duration: number;   // Duration in seconds
}
```
