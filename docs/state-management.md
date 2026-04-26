# Frontend — State Management

Two state systems work together: **Zustand** for auth/UI, **TanStack React Query** for server data.

---

## Zustand Auth Store

**File:** [`stores/auth-store.ts`](../stores/auth-store.ts)

### Store Shape

```typescript
interface AuthState {
  user: AuthUser | null;
  isLoggedIn: boolean;
  loading: boolean;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;
  hydrateFromCookie: () => void;
}

interface AuthUser {
  id: string;           // accounts.id
  email: string;
  role: 'learner' | 'admin';
  profileId: string;    // learner_profiles.id or admin_profiles.id
  fullName?: string;
  avatarUrl?: string;
}
```

### Selectors

```typescript
import { useAuthStore } from '@/stores/auth-store';

const { user, isLoggedIn, logout } = useAuthStore();

// Or with selector for performance
const user = useAuthStore(state => state.user);
```

### Convenience hooks (lib/hooks/use-auth.ts)

```typescript
const user = useUser();           // AuthUser | null
const isLoggedIn = useIsLoggedIn(); // boolean
```

### Persistence

Zustand persist middleware writes to `sessionStorage` under the key `auth-storage`. This means:
- Auth survives client-side navigation and page refresh
- Auth is cleared when the browser tab is closed
- Auth is **not** shared across tabs

### Hydration

On every page mount, `AuthHydrator` (a zero-render client component in `components/providers/auth-hydrator.tsx`) calls `hydrateFromCookie()`:

```typescript
function hydrateFromCookie() {
  const userCookie = getCookie('user');  // js-cookie
  if (userCookie) {
    const user = JSON.parse(userCookie);
    setUser(user);
  }
}
```

This ensures the Zustand store is always in sync with the `user` cookie set by the backend.

### Logout flow

```typescript
function logout() {
  removeCookie('accessToken');
  removeCookie('user');
  setUser(null);
  queryClient.clear();  // Remove all cached server data
  router.push('/login');
}
```

---

## TanStack React Query

**Version:** v5  
**Setup:** `components/providers/query-provider.tsx`  
**DevTools:** enabled in development mode

### QueryClient Configuration

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,        // 30s before refetch
      retry: 1,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 0,
    },
  },
});
```

---

## Query Keys Factory

**File:** [`lib/query-keys.ts`](../lib/query-keys.ts)

Centralized key factory prevents string typos and enables targeted cache invalidation.

```typescript
export const queryKeys = {
  auth: {
    profile: () => ['auth', 'profile'] as const,
  },
  tests: {
    list: (params?: QueryTestsParams) => ['tests', 'list', params] as const,
    detail: (id: string) => ['tests', 'detail', id] as const,
    sections: (testId: string) => ['tests', 'sections', testId] as const,
    writingTasks: (testId: string) => ['tests', 'writing-tasks', testId] as const,
    speakingParts: (testId: string) => ['tests', 'speaking-parts', testId] as const,
    questions: (groupId: string) => ['tests', 'questions', groupId] as const,
  },
  attempts: {
    byLearner: (learnerId: string) => ['attempts', 'by-learner', learnerId] as const,
    detail: (attemptId: string) => ['attempts', 'detail', attemptId] as const,
  },
  analytics: {
    dashboard: (learnerId: string) => ['analytics', 'dashboard', learnerId] as const,
    bands: (learnerId: string) => ['analytics', 'bands', learnerId] as const,
    progress: (learnerId: string) => ['analytics', 'progress', learnerId] as const,
    mistakes: (learnerId: string) => ['analytics', 'mistakes', learnerId] as const,
    adminStats: () => ['analytics', 'admin-stats'] as const,
  },
};
```

---

## Query Hooks

### Tests (`lib/hooks/use-tests.ts`)

| Hook | Cache key | staleTime | Description |
|---|---|---|---|
| `useTests(params?)` | `tests.list(params)` | 30s | Paginated test list |
| `useTestById(id)` | `tests.detail(id)` | 60s | Single test with sections |
| `useTestSections(testId)` | `tests.sections(testId)` | 60s | Sections with question groups |
| `useWritingTasks(testId)` | `tests.writingTasks(testId)` | 60s | Writing task prompts |
| `useSpeakingParts(testId)` | `tests.speakingParts(testId)` | 60s | Speaking part configs |
| `useGroupQuestions(groupId)` | `tests.questions(groupId)` | 60s | Questions in a group |
| `useAttemptsByLearnerId(learnerId)` | `attempts.byLearner(learnerId)` | 30s | Learner attempt history |

**Mutations with cache invalidation:**

| Hook | Invalidates |
|---|---|
| `useCreateTest()` | `tests.list()` |
| `useUpdateTest()` | `tests.detail(id)`, `tests.list()` |
| `useDeleteTest()` | `tests.list()` |
| `useStartAttempt()` | `attempts.byLearner(learnerId)` |
| `useSubmitAttempt()` | `attempts.byLearner(learnerId)`, `attempts.detail(id)` |

### Auth (`lib/hooks/use-auth.ts`)

| Hook | Cache key | staleTime | Description |
|---|---|---|---|
| `useProfile()` | `auth.profile()` | Infinity | Current user profile (rarely changes) |
| `useLoginMutation()` | — | — | Sets Zustand user on success |
| `useRegisterMutation()` | — | — | Register new learner |
| `useGoogleAuthMutation()` | — | — | Google OAuth exchange |
| `useLogout()` | — | — | Clear cache + Zustand + cookies |

### Analytics (`lib/hooks/use-analytics.ts`)

| Hook | Cache key | staleTime | Description |
|---|---|---|---|
| `useAnalyticsDashboard(learnerId)` | `analytics.dashboard(learnerId)` | 60s | Full dashboard summary |
| `useBandProfiles(learnerId)` | `analytics.bands(learnerId)` | 60s | Per-skill band profiles |
| `useProgress(learnerId)` | `analytics.progress(learnerId)` | 120s | Progress time series |
| `useMistakes(learnerId)` | `analytics.mistakes(learnerId)` | 120s | Mistake log |
| `useAdminGlobalStats()` | `analytics.adminStats()` | 60s | Platform-wide metrics |

**Mutations:**

| Hook | Invalidates |
|---|---|
| `useSyncLearner()` | `analytics.*` for that learnerId |
| `useSyncAll()` | `analytics.adminStats()` |
| `useUpsertBandProfile()` | `analytics.bands(learnerId)`, `analytics.dashboard(learnerId)` |

---

## learnerId Pattern

```typescript
const user = useUser();
const learnerId = user?.profileId ?? user?.id;
```

`user.profileId` is the UUID from `learner_profiles` table — always use this as the FK. Validate it is a UUID before sending to the backend. `user.id` is the `accounts.id` fallback (should not normally be needed).
