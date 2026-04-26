# Frontend — API Client

All backend communication goes through a shared Axios instance with interceptors. Domain-specific modules wrap the instance with typed methods.

---

## Shared Axios Instance

**File:** [`lib/api.ts`](../lib/api.ts)

```typescript
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});
```

### Request Interceptor

Automatically attaches the JWT from the `accessToken` cookie to every outgoing request:

```typescript
apiClient.interceptors.request.use(config => {
  const token = getCookie('accessToken');  // js-cookie
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Response Interceptor

On 401, clears auth cookies and redirects to login:

```typescript
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      removeCookie('accessToken');
      removeCookie('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

## Domain API Modules

All modules live in [`lib/api/`](../lib/api/) and export a plain object of typed methods. Each method unwraps the `ApiResponse<T>` envelope: `.then(r => r.data.data)`.

---

### auth.ts — Authentication

```typescript
// Register new learner account
register(dto: {
  email: string;
  password: string;
  confirmPassword: string;
}): Promise<{ id: string; email: string }>

// Login with email/password
// Side effect: sets `accessToken` + `user` cookies
login(data: {
  email: string;
  password: string;
}): Promise<{ accessToken: string; user: AuthUser }>

// Exchange Google OAuth access token for a JWT
google(accessToken: string): Promise<{ accessToken: string; user: AuthUser }>

// Get current user's full profile
getProfile(): Promise<{ account: Account; profile: LearnerProfile | AdminProfile }>

// Update display name and/or avatar
updateProfile(data: { fullName?: string; avatarUrl?: string }): Promise<Account>

// Clear auth cookies (client-side only, no API call)
logout(): void

// Get paginated user list (admin)
getUsers(params?: { page?: number; limit?: number; search?: string }): Promise<PaginatedUsers>
```

---

### tests.ts — Test Content

```typescript
// Paginated test list
getTests(params?: {
  skill?: 'reading' | 'listening' | 'writing' | 'speaking';
  isMock?: boolean;
  page?: number;
  limit?: number;
}): Promise<PaginatedTests>

// Single test with full nested data
getTestById(id: string): Promise<Test>

// Sections for a test (with question groups)
getSections(testId: string): Promise<Section[]>

// Questions in a group (with answers)
getQuestions(groupId: string): Promise<Question[]>

// Writing task prompts for a test
getWritingTasks(testId: string): Promise<WritingTask[]>

// Speaking part configs for a test
getSpeakingParts(testId: string): Promise<SpeakingPart[]>

// Create a basic test record
createTest(dto: {
  skill: string; title: string; isMock: boolean; createdBy: string;
}): Promise<Test>

// Create test with all nested sections/questions in one call
createManualTest(dto: CreateManualTestDto): Promise<Test>

// Create writing test (title + 2 tasks)
createWritingTest(dto: CreateWritingTestDto): Promise<Test>

// Create speaking test (title + 3 parts)
createSpeakingTest(dto: CreateSpeakingTestDto): Promise<Test>

// Update test metadata
updateTest(id: string, dto: Partial<Test>): Promise<Test>

// Atomically replace all writing tasks
updateWritingTest(id: string, dto: UpdateWritingTestDto): Promise<Test>

// Atomically replace all speaking parts
updateSpeakingTest(id: string, dto: UpdateSpeakingTestDto): Promise<Test>

// Delete test (cascades to sections/questions)
deleteTest(id: string): Promise<void>

// Section management
createSection(testId: string, dto: CreateSectionDto): Promise<Section>
updateSection(sectionId: string, dto: Partial<Section>): Promise<Section>
deleteSection(sectionId: string): Promise<void>

// Group management
createGroup(sectionId: string, dto: CreateGroupDto): Promise<QuestionGroup>
updateGroup(groupId: string, dto: Partial<QuestionGroup>): Promise<QuestionGroup>
deleteGroup(groupId: string): Promise<void>

// Question management
createQuestion(groupId: string, dto: CreateQuestionDto): Promise<Question>
updateQuestion(questionId: string, dto: Partial<Question>): Promise<Question>
deleteQuestion(questionId: string): Promise<void>

// Writing task management
createWritingTask(testId: string, dto: CreateWritingTaskDto): Promise<WritingTask>
deleteWritingTask(taskId: string): Promise<void>

// Speaking part management
createSpeakingPart(testId: string, dto: CreateSpeakingPartDto): Promise<SpeakingPart>
deleteSpeakingPart(partId: string): Promise<void>

// Test attempts
startAttempt(testId: string, learnerId: string): Promise<TestAttempt>
getAttemptById(attemptId: string): Promise<TestAttempt>
submitAttempt(attemptId: string, dto: SubmitAttemptDto): Promise<TestAttempt>
getAttemptsByLearnerId(learnerId: string): Promise<TestAttempt[]>
saveAiFeedback(attemptId: string, feedback: string): Promise<TestAttempt>
```

---

### attempts.ts — Submission Flow

This module covers the real-time submission flow during a test session.

```typescript
// Start a new test attempt
startAttempt(learnerId: string, testId: string): Promise<TestAttempt>

// Save a single answer (called on each answer change)
saveAnswer(
  attemptId: string,
  questionId: string,
  answer: string
): Promise<QuestionAttempt>

// Finalize and submit the attempt (triggers auto-grading)
submitAttempt(attemptId: string): Promise<TestAttempt>

// Get attempt with all question attempts
getAttempt(attemptId: string): Promise<TestAttempt>

// Get all attempts for a learner
getAttemptsByLearner(learnerId: string): Promise<TestAttempt[]>

// Submit a writing essay
submitWriting(
  learnerId: string,
  taskId: string,
  content: string
): Promise<WritingSubmission>

// Get a writing submission
getWritingSubmission(id: string): Promise<WritingSubmission>

// Submit a speaking recording
submitSpeaking(
  learnerId: string,
  partId: string,
  audioUrl: string,
  transcript?: string
): Promise<SpeakingSubmission>

// Get a speaking submission
getSpeakingSubmission(id: string): Promise<SpeakingSubmission>
```

---

### analytics.ts — Analytics Queries

```typescript
// Full dashboard data (expensive — cached 60s in React Query)
getDashboardSummary(learnerId: string): Promise<DashboardSummary>

// Per-skill band profiles
getBandProfiles(learnerId: string): Promise<LearnerBandProfile[]>

// Update current/target band for a skill
upsertBandProfile(dto: {
  learnerId: string;
  skill: string;
  currentBand?: number;
  targetBand?: number;
}): Promise<LearnerBandProfile>

// Progress time series (for charts)
getProgress(learnerId: string): Promise<LearnerProgressSnapshot[]>

// Record a new progress snapshot
createSnapshot(learnerId: string, overallBand: number): Promise<LearnerProgressSnapshot>

// Mistake log
getMistakes(learnerId: string): Promise<LearnerMistake[]>

// Rebuild all analytics for one learner
syncLearner(learnerId: string): Promise<void>

// Rebuild analytics for all learners (admin)
syncAll(): Promise<void>

// Platform-wide metrics (admin dashboard)
getAdminGlobalStats(): Promise<AdminGlobalStats>
```
