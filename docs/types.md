# Frontend — TypeScript Types

All shared interfaces and type aliases are defined in [`lib/types/index.ts`](../lib/types/index.ts). This document is the canonical reference.

---

## Primitive Aliases

```typescript
type Skill = 'reading' | 'listening' | 'writing' | 'speaking';

type GradingStatus = 'pending' | 'ai_graded' | 'human_reviewed';
```

---

## Auth Domain

```typescript
// Stored in Zustand auth-store, populated from the `user` cookie after login
interface AuthUser {
  id: string;          // accounts.id (UUID)
  email: string;
  role: 'learner' | 'admin';
  profileId: string;   // learner_profiles.id or admin_profiles.id (UUID)
  fullName?: string;
  avatarUrl?: string;
}
```

**Important:** Always use `user.profileId` (not `user.id`) as the FK when calling submission or analytics endpoints.

---

## Test Domain

### Test

```typescript
interface Test {
  id: string;
  skill: Skill;
  title: string;
  isMock: boolean;
  createdBy: string;   // accounts.id of creator
  createdAt: string;   // ISO 8601
  sections?: Section[];
  writingTasks?: WritingTask[];
  speakingParts?: SpeakingPart[];
}
```

### Section

```typescript
interface Section {
  id: string;
  testId: string;
  sectionOrder: number;       // 1-based
  passage?: string;           // Reading passages (long text / HTML)
  audioUrl?: string;          // Listening audio Cloudinary URL
  timeLimit?: number;         // Seconds, nullable
  questionGroups?: QuestionGroup[];
}
```

### QuestionGroup

```typescript
interface QuestionGroup {
  id: string;
  sectionId: string;
  groupOrder: number;         // 1-based within section
  instructions?: string;      // Displayed above the question set
  questions?: Question[];
}
```

### Question

```typescript
interface Question {
  id: string;
  questionGroupId: string;
  questionOrder: number;      // 1-based within group
  questionType: string;       // See question types below
  questionText: string;
  config: Record<string, any>; // Type-specific config (see below)
  explanation?: string;
  answer?: QuestionAnswer;
}

// question.config shapes by questionType:
// 'multiple_choice'     → { options: string[] }
// 'fill_in_blank'       → { blanks: number }
// 'matching'            → { pairs: { left: string, right: string }[] }
// 'heading_matching'    → { headings: string[], paragraphs: string[] }
// 'matching_features'   → { features: string[], statements: string[] }
// 'sentence_ending'     → { sentence_starts: string[], endings: string[] }
```

### QuestionAnswer

```typescript
interface QuestionAnswer {
  id: string;
  questionId: string;
  correctAnswers: string[];   // Multiple acceptable answers (e.g., TFNG aliases, slash variants)
  caseSensitive: boolean;
}
```

### WritingTask

```typescript
interface WritingTask {
  id: string;
  testId: string;
  taskNumber: 1 | 2;
  prompt: string;
  wordLimit: number;          // Typically 150 (Task 1) or 250 (Task 2)
}
```

### SpeakingPart

```typescript
interface SpeakingPart {
  id: string;
  testId: string;
  partNumber: 1 | 2 | 3;
  prompt?: string;
  config?: SpeakingPartConfig;
}

interface SpeakingPartConfig {
  // Part 1 — Interview
  topics?: {
    topicName: string;
    questions: { questionText: string }[];
  }[];

  // Part 2 — Cue Card
  cues?: string[];
  prepTime?: number;          // Seconds (typically 60)
  speakTime?: number;         // Seconds (typically 120)

  // Part 3 — Discussion
  questions?: { questionText: string }[];
}
```

### Paginated Response

```typescript
interface PaginatedTests {
  data: Test[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

---

## Submissions Domain

### TestAttempt

```typescript
interface TestAttempt {
  id: string;
  learnerId: string;          // learner_profiles.id
  testId: string;
  startedAt: string;          // ISO 8601
  submittedAt?: string;
  rawScore?: number;          // Correct answer count (reading/listening)
  bandScore?: number;         // IELTS band 0–9 (1 decimal)
  aiFeedback?: string;        // Markdown from /api/ai/analyze-result
  test?: Test;
  questionAttempts?: QuestionAttempt[];
}
```

### QuestionAttempt

```typescript
interface QuestionAttempt {
  id: string;
  testAttemptId: string;
  questionId: string;
  answer?: string;
  isCorrect?: boolean;
  answeredAt?: string;        // ISO 8601
  question?: Question;
}
```

### WritingSubmission

```typescript
interface WritingSubmission {
  id: string;
  learnerId: string;
  writingTaskId: string;
  content: string;            // Raw essay text
  submittedAt: string;
  overallBand?: number;
  gradingStatus: GradingStatus;
  scores?: WritingScore[];
}
```

### WritingScore

```typescript
interface WritingScore {
  id: string;
  submissionId: string;
  criterion: string;          // e.g., 'Task Achievement', 'Coherence and Cohesion'
  band: number;               // 0–9
  feedback?: string;
}
```

### SpeakingSubmission

```typescript
interface SpeakingSubmission {
  id: string;
  learnerId: string;
  speakingPartId: string;
  audioUrl: string;           // Cloudinary URL
  transcript?: string;
  submittedAt: string;
  overallBand?: number;
  gradingStatus: GradingStatus;
  scores?: SpeakingScore[];
}
```

### SpeakingScore

```typescript
interface SpeakingScore {
  id: string;
  submissionId: string;
  criterion: string;          // e.g., 'Fluency and Coherence', 'Pronunciation'
  band: number;
  feedback?: string;
}
```

---

## Analytics Domain

### LearnerBandProfile

```typescript
interface LearnerBandProfile {
  id: string;
  learnerId: string;
  skill: Skill | 'overall';
  currentBand?: number;
  targetBand?: number;
  assessedAt: string;         // ISO 8601
}
```

### LearnerProgressSnapshot

```typescript
interface LearnerProgressSnapshot {
  id: string;
  learnerId: string;
  overallBand: number;
  snapshotAt: string;         // ISO 8601 — one entry per completed attempt
}
```

### LearnerMistake

```typescript
interface LearnerMistake {
  id: string;
  learnerId: string;
  questionId: string;
  mistakeType?: string;       // Question type string
  createdAt: string;
}
```

### DashboardSummary

```typescript
interface DashboardSummary {
  bandProfiles: LearnerBandProfile[];
  latestOverallBand: number | null;
  progressHistory: LearnerProgressSnapshot[];
  totalMistakes: number;
  mistakesByType: Record<string, number>;  // questionType → count
  totalAttempts?: number;
  averageBand?: number;
  practiceHours?: number;       // Derived from attempt durations (epoch diff)
  examReadiness?: number;       // (avgBand / 9) * 100, clamped 0–100

  questionTypeMastery?: {
    questionType: string;
    correct: number;
    total: number;
    accuracy: number;           // 0–1
    masteryLevel: 'beginner' | 'developing' | 'proficient' | 'advanced';
  }[];

  adaptiveStudyPlan?: {
    title: string;
    focusArea: string;
    priority: 'high' | 'medium' | 'low';
    dueInDays: number;
    recommendation: string;
  }[];

  rubricBreakdown?: {
    writing: null | {
      submissionId: string;
      submittedAt: string;
      overallBand: number | null;
      criteria: { criterion: string; band: number; feedback: string | null }[];
    };
    speaking: null | {
      submissionId: string;
      submittedAt: string;
      overallBand: number | null;
      criteria: { criterion: string; band: number; feedback: string | null }[];
    };
  };
}
```

### AdminGlobalStats

```typescript
interface AdminGlobalStats {
  totalLearners: number;
  totalAttempts: number;
  completedAttempts: number;
  averageBand: number;
  attemptsPerDay: { date: string; count: number }[];           // Last 30 days
  bandDistribution: { range: string; count: number; color: string }[];
  skillBreakdown: { skill: string; avgBand: number; totalAttempts: number }[];
  topLearners: { learnerId: string; email: string; avgBand: number; totalAttempts: number }[];
  recentActivity: { email: string; testTitle: string; bandScore: number | null; submittedAt: string }[];
}
```

---

## API Response Wrapper

Every NestJS response is wrapped by `TransformInterceptor`. Frontend modules unwrap with `.then(r => r.data.data)`.

```typescript
interface ApiResponse<T> {
  statusCode: number;
  message: string;   // Always 'Success' on 2xx
  data: T;
}
```
