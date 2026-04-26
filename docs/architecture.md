# Frontend — Architecture

---

## App Router Structure

The app uses Next.js App Router with **route groups** (parentheses in folder names) to isolate layouts without affecting URLs.

```
app/
├── layout.tsx                    # Root layout: fonts, QueryProvider, AuthHydrator, Toaster
│
├── (auth)/                       # Layout: bare page (no nav)
│   ├── login/page.tsx
│   ├── register/page.tsx
│   └── auth/google/callback/page.tsx
│
├── (home)/                       # Layout: HomeNavbar + Footer
│   ├── page.tsx                  # / — public landing page
│   ├── tests/page.tsx            # /tests — test browser
│   ├── tests/[id]/page.tsx       # /tests/:id — test detail
│   ├── rankings/page.tsx
│   └── resources/page.tsx
│
├── (learner)/                    # Layout: LearnerSidebar (requires login + role=learner)
│   ├── dashboard/page.tsx
│   ├── analysis/page.tsx
│   ├── ai-advisor/page.tsx
│   └── profile/page.tsx
│
├── (admin)/                      # Layout: AdminSidebar (requires login + role=admin)
│   └── admin/
│       ├── dashboard/page.tsx
│       ├── tests/page.tsx
│       ├── tests/[id]/page.tsx
│       ├── tests/add/page.tsx
│       ├── tests/import/page.tsx
│       ├── ai-generator/page.tsx
│       ├── users/page.tsx
│       └── settings/page.tsx
│
├── (root)/                       # Layout: minimal (no sidebar)
│   └── practice/[id]/
│       ├── page.tsx              # Test-taking interface
│       └── result/page.tsx       # Results after submission
│
└── api/                          # Server-side API routes (no UI)
    ├── ai/advisor/route.ts
    ├── ai/grade-writing/route.ts
    ├── ai/generate-test/route.ts
    ├── ai/analyze-result/route.ts
    ├── ai/speaking-chat/route.ts
    ├── upload/image/route.ts
    └── upload/audio/route.ts
```

---

## Auth Flow

```
1. User submits login form
        │
        ▼
2. POST /api/auth/login (NestJS auth-service via proxy)
   → Response sets two cookies:
     - accessToken  (JWT, JS-readable — see known issues)
     - user         (JSON-encoded AuthUser object)
        │
        ▼
3. AuthHydrator (components/providers/auth-hydrator.tsx)
   → Runs on every page mount (zero-render client component)
   → Calls hydrateFromCookie()
   → Reads `user` cookie → populates Zustand auth-store
        │
        ▼
4. Zustand auth-store (stores/auth-store.ts)
   → isLoggedIn: true
   → user: { id, email, role, profileId, fullName, avatarUrl }
        │
        ▼
5. middleware.ts (runs on every navigation)
   → Reads `accessToken` cookie (edge-compatible)
   → Applies RBAC rules (redirect if unauthorized)
        │
        ▼
6. API calls (lib/api/*.ts)
   → Axios request interceptor reads `accessToken` cookie
   → Attaches: Authorization: Bearer <token>
   → 401 response interceptor → clears cookies, redirect to /login
```

**Security note:** `accessToken` is stored in a standard cookie (not HttpOnly), making it readable by JavaScript. This is a known issue — migration to HttpOnly cookies is planned.

---

## State Layering

| Concern | Tool | Persistence |
|---|---|---|
| Auth user / login status | Zustand `useAuthStore` | sessionStorage (survives navigation, resets on tab close) |
| Server data (tests, attempts, analytics) | TanStack React Query v5 | In-memory cache with configurable staleTime |
| Test-taking session (timer, answers, attemptId) | `PracticeContext` + localStorage | `ielts_session_<testId>` in localStorage |
| Local UI state (dialogs, forms, toggles) | `useState` | None |

---

## Data Fetching Pattern

All server data goes through React Query — **no server components fetch data**.

```typescript
// 1. Define a query key (lib/query-keys.ts)
queryKeys.tests.detail(id)  // → ['tests', 'detail', id]

// 2. Use a query hook (lib/hooks/use-tests.ts)
const { data: test, isLoading } = useTestById(id);

// 3. Under the hood — lib/api/tests.ts
const testApi = {
  getTestById: (id: string) =>
    apiClient.get<ApiResponse<Test>>(`/api/tests/${id}`)
      .then(r => r.data.data),
};

// 4. Invalidate on mutation
const mutation = useCreateTest({
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.tests.list() });
  }
});
```

### Cache Configuration (components/providers/query-provider.tsx)

| Setting | Value |
|---|---|
| `staleTime` | 30 000 ms (default) |
| `retry` | 1 on queries; 0 on mutations |
| `refetchOnWindowFocus` | `true` |

Domain overrides:
- Auth profile: `staleTime: Infinity`
- Tests: `staleTime: 30 000–60 000`
- Analytics dashboard: `staleTime: 60 000`
- Analytics bands/progress: `staleTime: 60 000–120 000`

---

## Test-Taking Session

The practice interface persists session state to localStorage to survive page refreshes.

**localStorage key:** `ielts_session_<testId>`

**Shape:**
```typescript
{
  attemptId: string;
  startedAt: string;      // ISO 8601
  durationMs: number;     // Total time limit
  answers: Record<string, string>;  // questionId → answer
}
```

**Lifecycle:**
1. Mount: check localStorage → if session exists, show resume prompt
2. Start new: create attempt via API → write session to localStorage
3. Answer change: update localStorage immediately + debounced API save
4. `beforeunload`: flush pending answers
5. Submit: call submit API → clear localStorage → redirect to result

---

## AI Routes Architecture

Next.js AI routes (`app/api/ai/`) run as **server-side functions** and call Groq directly. They **never** proxy through NestJS.

```
Browser → POST /api/ai/grade-writing
                 │
                 ▼ (server-side only)
          Next.js API Route
          ├── Validate input
          ├── Call Groq API (llama-3.3-70b-versatile)
          ├── Parse JSON response
          ├── POST to NestJS backend (save submissions/gradings)
          └── Return result to browser
```

This means:
- AI API keys (`GROQ_API_KEY`) are never sent to the browser
- Latency is slightly higher (two hops for DB writes)
- AI features work independently of NestJS service health
