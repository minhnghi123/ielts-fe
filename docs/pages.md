# Frontend — Pages & Routes

All pages use Next.js App Router. Route groups (parentheses) affect layout isolation only, not URLs.

---

## Public Pages — `(home)` group

Layout: `HomeNavbar` + `Footer`

### `/` — Home

**File:** `app/(home)/page.tsx`  
**Access:** Public  
**Components:** `HeroSection`, `HomeStats`, `RecentActivity`, `Recommendations`  
**Purpose:** Landing page with platform statistics and feature overview.

---

### `/tests` — Test Browser

**File:** `app/(home)/tests/page.tsx`  
**Access:** Public  
**Components:** `TestCard`  
**Data:** `useTests()` — paginated, filterable by skill and isMock  
**Purpose:** Browse all available tests. Clicking "Start" navigates to `/practice/:id` (requires login).

---

### `/tests/:id` — Test Detail

**File:** `app/(home)/tests/[id]/page.tsx`  
**Access:** Public  
**Data:** `useTestById(id)`, `useTestSections(id)`, `useWritingTasks(id)`, `useSpeakingParts(id)`  
**Purpose:** Preview test structure, sections, question types, and task prompts before starting.

---

### `/rankings` — Leaderboard

**File:** `app/(home)/rankings/page.tsx`  
**Access:** Public  
**Data:** `useAdminGlobalStats()` → topLearners  
**Purpose:** Display top learners by average band score.

---

### `/resources` — Study Materials

**File:** `app/(home)/resources/page.tsx`  
**Access:** Public  
**Purpose:** Static collection of IELTS study resources and links.

---

## Auth Pages — `(auth)` group

Layout: Bare (no navigation)

### `/login`

**File:** `app/(auth)/login/page.tsx`  
**Component:** `LoginForm` (`_components/login-form.tsx`)  
**Access:** Public (redirect to `/` if already logged in)  
**Features:**
- Email/password login via `useLoginMutation()`
- Google OAuth button that triggers Supabase Google OAuth flow
- On success: backend sets `accessToken` + `user` cookies → redirect to role-appropriate dashboard

---

### `/register`

**File:** `app/(auth)/register/page.tsx`  
**Component:** `RegisterForm` (`_components/register-form.tsx`)  
**Access:** Public (redirect to `/` if already logged in)  
**Features:**
- Email/password registration via `useRegisterMutation()`
- Password strength validation: 8–32 chars, uppercase, lowercase, number, special char
- On success: auto-login + redirect to `/dashboard`

---

### `/auth/google/callback`

**File:** `app/(auth)/auth/google/callback/page.tsx`  
**Access:** Public  
**Purpose:** Handles Google OAuth callback. Exchanges Supabase session for a platform JWT via `useGoogleAuthMutation()`. Redirects to `/dashboard` on success.

---

## Learner Pages — `(learner)` group

Layout: `LearnerSidebar` (with navigation links)  
**Access:** Requires login + `role === 'learner'`

### `/dashboard` — Learner Dashboard

**File:** `app/(learner)/dashboard/page.tsx`  
**Components:** `WelcomeHeader`, `StatOverview`, `ModuleGrid`  
**Data:** `useAnalyticsDashboard(learnerId)`, `useAttemptsByLearnerId(learnerId)`  
**Features:**
- Band score cards per skill (reading, listening, writing, speaking)
- Exam readiness gauge
- Adaptive study plan with priorities
- Recent attempt history
- Module navigation grid

---

### `/analysis` — Performance Analysis

**File:** `app/(learner)/analysis/page.tsx`  
**Data:** `useProgress(learnerId)`, `useBandProfiles(learnerId)`, `useMistakes(learnerId)`  
**Features:**
- Band progress chart (time series)
- Question type mastery breakdown
- Mistake analysis grouped by type
- Writing/speaking rubric breakdown (latest submission scores)

---

### `/ai-advisor` — AI Coaching Chat

**File:** `app/(learner)/ai-advisor/page.tsx`  
**Data:** `useAnalyticsDashboard(learnerId)` → builds learner profile  
**External:** `POST /api/ai/advisor` (SSE stream)  
**Features:**
- Chat interface with AI IELTS coach
- Streams responses from Groq (`llama-3.3-70b-versatile`)
- Context includes skill bands, accuracy stats, recent attempts
- Provides study roadmap, weekly schedule, practice recommendations

---

### `/profile` — User Profile

**File:** `app/(learner)/profile/page.tsx`  
**Data:** `useProfile()`  
**Features:**
- Display name and avatar edit
- Avatar upload via `AvatarUpload` component → `POST /api/upload/image`
- Band target setting (calls `useUpsertBandProfile()`)
- Account info display

---

## Admin Pages — `(admin)` group

Layout: `AdminSidebar`  
**Access:** Requires login + `role === 'admin'`  
URL prefix: `/admin/`

### `/admin/dashboard` — Admin Dashboard

**File:** `app/(admin)/admin/dashboard/page.tsx`  
**Data:** `useAdminGlobalStats()`  
**Features:**
- Platform metrics: total learners, attempts, average band
- Attempts-per-day chart (last 30 days)
- Band distribution chart
- Skill breakdown table
- Top 5 learners leaderboard
- Recent 10 activity feed

---

### `/admin/tests` — Test Management

**File:** `app/(admin)/admin/tests/page.tsx`  
**Data:** `useTests()` (paginated, all skills)  
**Features:**
- Test list with skill filter tabs
- Delete test with confirmation
- Links to edit (`/admin/tests/:id`) and create (`/admin/tests/add`)
- Import button → `/admin/tests/import`

---

### `/admin/tests/:id` — Test Editor (Reading/Listening)

**File:** `app/(admin)/admin/tests/[id]/page.tsx`  
**Data:** `useTestById(id)`, `useTestSections(id)`  
**Features:**
- Section management (add/edit/delete)
- Question group management
- Question editor with 6 question types
- Answer key editing
- Image/audio upload per section

---

### `/admin/tests/:id/writing` — Writing Test Editor

**File:** `app/(admin)/admin/tests/[id]/writing/page.tsx`  
**Data:** `useWritingTasks(id)`  
**Features:**
- Edit Task 1 and Task 2 prompts
- Rich text editor (`RichTextEditor` — React Quill)
- Word limit configuration
- Media URL attachment

---

### `/admin/tests/:id/speaking` — Speaking Test Editor

**File:** `app/(admin)/admin/tests/[id]/speaking/page.tsx`  
**Data:** `useSpeakingParts(id)`  
**Features:**
- Part 1 topics and questions editor
- Part 2 cue card configuration (main topic, bullet points, prep/speak time)
- Part 3 discussion questions editor
- Audio upload per part

---

### `/admin/tests/add` — Create Test (Reading/Listening)

**File:** `app/(admin)/admin/tests/add/page.tsx`  
**Components:** `SectionCard`, `GroupCard`, `QuestionItem`, `AudioUploader`, `ImageUploader`  
**Features:**
- Step-by-step test builder
- Add sections with passages or audio
- Add question groups with typed questions
- Inline answer key for each question
- Submit calls `createManualTest()` (one transactional API call)

---

### `/admin/tests/add/writing` — Create Writing Test

**File:** `app/(admin)/admin/tests/add/writing/page.tsx`  
**Components:** `WritingTaskCard`  
**Features:**
- Task 1 and Task 2 prompt editor
- Media upload for visual prompts (graphs, charts)
- Submit calls `createWritingTest()`

---

### `/admin/tests/add/speaking` — Create Speaking Test

**File:** `app/(admin)/admin/tests/add/speaking/page.tsx`  
**Components:** `SpeakingPartCard`  
**Features:**
- Part 1, 2, 3 configuration forms
- Submit calls `createSpeakingTest()`

---

### `/admin/tests/import` — DOCX Import

**File:** `app/(admin)/admin/tests/import/page.tsx`  
**Features:**
- File upload form for `.docx` test documents
- Optional audio file attachments
- Calls `POST /api/tests/import` (multipart)
- Preview imported test structure before saving

---

### `/admin/ai-generator` — AI Test Generator

**File:** `app/(admin)/admin/ai-generator/page.tsx`  
**External:** `POST /api/ai/generate-test`  
**Features:**
- Select skill (reading/listening), topic, difficulty
- Optional question type filter and additional instructions
- Preview AI-generated test
- Save button calls `createManualTest()` with the AI output

---

### `/admin/users` — User Management

**File:** `app/(admin)/admin/users/page.tsx`  
**Data:** `getUsers()` (paginated with search)  
**Features:**
- Searchable user list
- Display: email, name, role, join date

---

### `/admin/settings` — Platform Settings

**File:** `app/(admin)/admin/settings/page.tsx`  
**Purpose:** Admin configuration page (UI placeholder).

---

## Practice Pages — `(root)` group

Layout: Minimal (no sidebar — full-screen test experience)  
**Access:** Requires login + `role === 'learner'`

### `/practice/:id` — Test Taking Interface

**File:** `app/(root)/practice/[id]/page.tsx`  
**Components:** `TestInstructions`, `ReadingTestInterface`, `ListeningTestInterface`, `WritingTestInterface`, `SpeakingTestInterface`  
**State:** `PracticeContext` + localStorage session  
**Features:**
- Resume prompt if incomplete session exists in localStorage
- Countdown timer with auto-submit on expiry
- Per-skill UI:
  - **Reading:** Side-by-side passage and questions, scroll-synced
  - **Listening:** Audio player with question panel
  - **Writing:** Task prompt + rich text editors for Task 1 and Task 2
  - **Speaking:** Chatbot-style interface with `/api/ai/speaking-chat` integration
- Answer persistence to localStorage + debounced API saves
- `beforeunload` flush

---

### `/practice/:id/result` — Result Page

**File:** `app/(root)/practice/[id]/result/page.tsx`  
**Data:** `getAttemptById(attemptId)` from URL params  
**Features:**
- Band score display
- Per-question correctness review
- AI feedback (markdown rendered)
- Writing grading: `POST /api/ai/grade-writing` → display annotated essays + criteria
- Analyze result button: `POST /api/ai/analyze-result` → save to `ai_feedback`
