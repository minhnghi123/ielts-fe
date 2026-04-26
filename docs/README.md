# Frontend — my-app

Next.js 16 (App Router) frontend for the IELTS Practice Platform. Learners take timed tests, receive AI-graded feedback on writing/speaking, and track progress over time. Admins manage tests, import DOCX, and use the AI test generator.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.1.3, React 19.2.3 |
| Language | TypeScript 5.9.3 (strict mode) |
| Styling | Tailwind CSS v4 |
| UI Components | Radix UI (headless) |
| State (auth/UI) | Zustand 5.0.12 (sessionStorage persist) |
| Server data | TanStack React Query v5 |
| HTTP client | Axios 1.13.3 |
| AI / LLM | Groq SDK (llama-3.3-70b-versatile) |
| Image processing | Sharp 0.34.5 |
| Media upload | Cloudinary |
| Auth cookies | js-cookie |
| Notifications | Sonner 2.0.7 |
| Rich text | React Quill 3.8.3 |

---

## Quick Start

```bash
# 1. Copy env template
cp .env.example .env
# Fill in NEXT_PUBLIC_API_URL, GROQ_API_KEY, Cloudinary keys, Supabase keys

# 2. Install dependencies
npm install

# 3. Start dev server (port 3000)
npm run dev

# 4. Build for production
npm run build

# 5. Lint
npm run lint
```

The app expects the NestJS API Gateway to be running at `NEXT_PUBLIC_API_URL` (default `http://localhost:5000`).

---

## Directory Structure

```
my-app/
├── app/                        # Next.js App Router — pages & server routes
│   ├── (auth)/                 # Login, register, Google callback
│   ├── (admin)/                # Admin dashboard + test management
│   ├── (learner)/              # Learner dashboard + analytics + AI advisor
│   ├── (home)/                 # Public pages: test browser, rankings, resources
│   ├── (root)/practice/[id]/   # Test-taking interface + result page
│   └── api/                    # Server-side API routes (AI, uploads)
│       ├── ai/advisor/
│       ├── ai/grade-writing/
│       ├── ai/generate-test/
│       ├── ai/analyze-result/
│       ├── ai/speaking-chat/
│       ├── upload/image/
│       └── upload/audio/
├── components/
│   ├── ui/                     # 17 Radix UI-based components
│   └── providers/              # QueryProvider, AuthHydrator
├── lib/
│   ├── api/                    # Domain API modules (auth, tests, attempts, analytics)
│   ├── api.ts                  # Shared Axios instance
│   ├── hooks/                  # React Query hooks per domain
│   ├── query-keys.ts           # Centralized query key factory
│   ├── supabase/               # Supabase client (direct DB writes from AI routes)
│   ├── types/                  # Shared TypeScript types
│   └── utils/                  # cn() and other utilities
├── stores/
│   └── auth-store.ts           # Zustand auth store
├── contexts/
│   └── auth-context.tsx        # Legacy shim → re-exports Zustand
├── middleware.ts               # Route protection + RBAC
└── docs/                       # ← You are here
```

---

## Documentation Index

| File | Covers |
|---|---|
| [architecture.md](architecture.md) | App Router route groups, auth flow, state layering |
| [pages.md](pages.md) | All pages/routes with descriptions and access rules |
| [api-client.md](api-client.md) | Axios instance, interceptors, domain API modules |
| [ai-routes.md](ai-routes.md) | Server-side AI & upload routes (input/output/external services) |
| [state-management.md](state-management.md) | Zustand store, React Query config, query keys |
| [components.md](components.md) | UI component library, providers |
| [middleware.md](middleware.md) | Route protection rules, RBAC |
| [environment.md](environment.md) | All environment variables |
| [types.md](types.md) | TypeScript interfaces for all domains |

---

## Key Architectural Decisions

- **Route groups** (`(auth)`, `(admin)`, `(learner)`, `(home)`) isolate layouts without affecting URL paths.
- **AI routes live entirely in Next.js** — they call Groq directly and never proxy through NestJS.
- **Auth is cookie-based** — `accessToken` cookie read by middleware for SSR protection and by Axios interceptor for API calls.
- **Data is never fetched in server components** — all data loading goes through React Query on the client.
- **Admin RBAC is currently frontend-only** — the API Gateway does not enforce admin guards yet (see `api-gateway/docs/README.md` known issues).
