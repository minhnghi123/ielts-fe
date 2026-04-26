<div align="center">

# IELTS Master — Frontend

**An AI-powered IELTS practice platform with instant feedback and personalized analytics**

[![Next.js](https://img.shields.io/badge/Next.js-16.1-black?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss)](https://tailwindcss.com)

</div>

---

## About the Project

**IELTS Master** is the graduation thesis project of **Nghi Minh Nguyen** — a full-stack online IELTS practice platform powered by large language models.

### Background & Motivation

The IELTS exam is a critical milestone for millions of students in Vietnam who aspire to study abroad, immigrate, or work in international environments. Yet most learners face the same fundamental pain points:

- **No quality feedback** — Writing and Speaking require human graders. Costs are high, turnaround is slow, and access is limited.
- **No insight into weak areas** — After finishing a test, learners see a score but not *which question types* they consistently fail or *which skill* needs the most work.
- **No personalized study path** — Every learner has a different current band and a different target. A one-size-fits-all curriculum doesn't work.
- **No realistic practice environment** — Access to authentic, timed, full-length test simulations is scarce.

### What This Project Sets Out to Solve

> *Give every learner a personal IELTS assistant — available 24/7, grading instantly, tracking progress continuously, and recommending exactly what to study next.*

The platform addresses all four pain points by combining:

1. **A full 4-skill test bank** — Reading, Listening, Writing, and Speaking tests built on a structured `section → question_group → question` hierarchy that mirrors the real IELTS format.
2. **Instant AI Writing grading** — Groq LLM analyzes essays, annotates errors with colored HTML highlights, scores all 4 IELTS criteria (Task Response, Coherence, Lexical Resource, Grammatical Range), and provides specific improvement suggestions.
3. **AI Speaking examiner** — A chatbot simulates a real IELTS examiner across all three parts, then grades performance on 4 criteria.
4. **Personalized analytics** — Band score progression over time, per-question-type mastery levels, adaptive study plan generated from actual performance data.
5. **AI Advisor** — A coaching chat that has full access to the learner's history and provides a concrete weekly study roadmap.
6. **Admin tools** — Test management, DOCX bulk import, and AI-powered test generation.

---

## Architecture Overview

```
my-app/                         ← You are here
├── app/                        # Next.js App Router
│   ├── (auth)/                 # Login, Register, Google OAuth callback
│   ├── (home)/                 # Public pages: test browser, rankings, resources
│   ├── (learner)/              # Dashboard, Analysis, AI Advisor, Profile
│   ├── (admin)/                # Test management, users, AI generator
│   ├── (root)/practice/[id]/   # Test-taking interface + result page
│   └── api/                    # Server-side API routes (AI, uploads)
│       ├── ai/advisor/         # Streaming coaching chat (Groq SSE)
│       ├── ai/grade-writing/   # AI Writing grader (structured JSON output)
│       ├── ai/generate-test/   # AI test generator
│       ├── ai/analyze-result/  # Post-test performance analysis
│       ├── ai/speaking-chat/   # AI IELTS examiner
│       ├── upload/image/       # Sharp → Cloudinary (WebP, max 10 MB)
│       └── upload/audio/       # Audio → Cloudinary (MP3, max 50 MB)
├── components/ui/              # 17 Radix UI-based components
├── lib/
│   ├── api/                    # Axios API modules (auth, tests, attempts, analytics)
│   ├── hooks/                  # React Query hooks per domain
│   └── query-keys.ts           # Centralized cache key factory
├── stores/auth-store.ts        # Zustand auth state (sessionStorage)
└── docs/                       # Detailed documentation
```

**Tech stack:**

| Concern | Technology |
|---|---|
| Framework | Next.js 16 App Router |
| UI | Radix UI + Tailwind CSS v4 |
| Auth state | Zustand 5 (sessionStorage persist) |
| Server data | TanStack React Query v5 |
| HTTP client | Axios with auto-JWT interceptor |
| AI / LLM | Groq SDK — `llama-3.3-70b-versatile` |
| Media | Cloudinary + Sharp |
| Database (direct) | Supabase JS client (used in AI routes only) |

---

## Key Features

### For Learners

- **4-skill timed tests** with skill-specific interfaces and countdown timer
- **Resume test** — close the tab and come back later; progress is restored from localStorage
- **AI Writing grader** — receive results in seconds with color-annotated essays and per-criterion band scores
- **AI Speaking practice** — interact with an AI examiner that follows the official IELTS Part 1/2/3 structure
- **Analytics dashboard** — band score progress chart, mastery level per question type, exam readiness percentage
- **AI Advisor** — coaching chat that knows your full performance history and gives you a concrete weekly plan

### For Admins

- **Test management** — full CRUD for reading, listening, writing, and speaking tests
- **DOCX import** — convert Word documents into structured test content
- **AI test generator** — input a topic and difficulty level; the AI produces a complete test
- **Admin dashboard** — platform-wide stats, band distribution, skill breakdown, top learners

---

## Getting Started

### Prerequisites

- Node.js 20+
- The NestJS API Gateway running at `http://localhost:5000` — see [api-gateway/README.md](../api-gateway/README.md)

### Step 1 — Install

```bash
cd my-app
npm install
```

### Step 2 — Configure Environment

```bash
cp .env.example .env
```

Fill in your values:

```env
# Backend API Gateway
NEXT_PUBLIC_API_URL=http://localhost:5000

# Supabase (from Supabase Dashboard → Project Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>

# Cloudinary (from Cloudinary Dashboard)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=<cloud-name>
CLOUDINARY_API_KEY=<api-key>
CLOUDINARY_API_SECRET=<api-secret>

# Groq (from console.groq.com)
GROQ_API_KEY=<your-groq-api-key>
```

See [docs/environment.md](docs/environment.md) for the full variable reference and `NEXT_PUBLIC_` rules.

### Step 3 — Run

```bash
# Development server with hot reload (port 3000)
npm run dev

# Production build
npm run build
npm run start

# Lint
npm run lint
```

---

## Core Request Flow

```
Learner logs in
    → Backend sets accessToken + user cookies
    → AuthHydrator reads cookies on mount → Zustand store
    → Middleware enforces role-based route protection

Learner starts a test
    → React Query fetches test detail
    → POST /api/tests/:id/attempts → TestAttempt created
    → Session written to localStorage (key: ielts_session_<testId>)

During the test
    → Each answer change → debounced save to localStorage + API
    → Timer counts down, auto-submits on expiry

After submission (Reading / Listening)
    → Backend auto-grades → returns band score
    → POST /api/ai/analyze-result → Groq analyzes mistakes → saves feedback
    → Analytics service rebuilds learner stats via RabbitMQ event

After submission (Writing)
    → POST /api/ai/grade-writing → Groq grades all 4 criteria
    → Returns annotated HTML + band scores → saved to DB
    → Result page displays color-highlighted essay with suggestions
```

---

## Documentation

Detailed documentation is in the [`docs/`](docs/) folder:

| File | Contents |
|---|---|
| [docs/architecture.md](docs/architecture.md) | App Router structure, auth flow, state layering, AI routes pattern |
| [docs/pages.md](docs/pages.md) | Every page and route described in detail |
| [docs/api-client.md](docs/api-client.md) | Axios instance, interceptors, all API module methods |
| [docs/ai-routes.md](docs/ai-routes.md) | 5 AI routes + 2 upload routes — input, output, external services |
| [docs/state-management.md](docs/state-management.md) | Zustand store, React Query config, query keys, cache strategy |
| [docs/components.md](docs/components.md) | UI component library, providers, feature components |
| [docs/middleware.md](docs/middleware.md) | Route protection rules, RBAC implementation |
| [docs/environment.md](docs/environment.md) | All environment variables with descriptions |
| [docs/types.md](docs/types.md) | TypeScript interfaces for all domains |

---

## Author

**Nghi Minh Nguyen**  
Undergraduate — Graduation Thesis Project, 2025

---

## Related

- [Backend — api-gateway](../api-gateway/README.md)
- [Database Schema](../db/database_schema.sql)
- [Full API Reference](../api-gateway/docs/api-reference.md)
