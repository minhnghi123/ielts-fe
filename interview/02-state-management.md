# Interview: State Management — Zustand & TanStack React Query

---

## Q1. Dự án dùng 2 state management libraries. Giải thích khi nào dùng Zustand, khi nào dùng React Query?

**Trả lời:**

Đây là câu hỏi phân biệt rõ **client state** vs **server state** — một trong những nguyên tắc quan trọng nhất của modern React.

**Zustand** — cho **client/UI state** (không phải từ server):
```
✅ Auth user info (đăng nhập hay chưa, role gì, userId)
✅ UI state (modal open/close, sidebar collapsed)
✅ Form state phức tạp nằm nhiều components
```

**TanStack React Query** — cho **server state** (data từ API):
```
✅ Test list, test detail
✅ Attempt history
✅ Analytics dashboard data
✅ Band profiles
```

**Rule of thumb:** Nếu data có thể "stale" (cũ đi) và cần sync với server → dùng React Query. Nếu data chỉ tồn tại trên client (user preferences, UI state) → dùng Zustand.

**Trong dự án:**

| State | Tool | Lý do |
|---|---|---|
| `isLoggedIn`, `user`, `role` | Zustand | Client-only, cần instantaneous, không cần refetch |
| Tests list | React Query | Từ API, cần cache, invalidation khi admin create/delete |
| Analytics dashboard | React Query | Nặng (nhiều bảng join), cần cache 60s tránh over-fetch |
| Timer, answers in practice | PracticeContext + localStorage | Ephemeral, cần persist across refresh |
| Dialog open state | `useState` | Cực local, không cần share |

---

## Q2. Zustand store trong dự án được cấu hình như thế nào? Giải thích `persist` middleware.

**Trả lời:**

```typescript
// stores/auth-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: AuthUser | null;
  isLoggedIn: boolean;
  loading: boolean;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;
  hydrateFromCookie: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoggedIn: false,
      loading: false,

      setUser: (user) => set({ user, isLoggedIn: !!user }),

      logout: () => {
        removeCookie('accessToken');
        removeCookie('user');
        set({ user: null, isLoggedIn: false });
        queryClient.clear(); // Xóa toàn bộ React Query cache
        router.push('/login');
      },

      hydrateFromCookie: () => {
        const userCookie = getCookie('user');
        if (userCookie) {
          try {
            const user = JSON.parse(userCookie);
            set({ user, isLoggedIn: true });
          } catch { /* malformed cookie */ }
        }
      },
    }),
    {
      name: 'auth-storage',     // key trong sessionStorage
      storage: createJSONStorage(() => sessionStorage), // dùng sessionStorage
    }
  )
);
```

**`persist` middleware làm gì:**

1. Sau mỗi lần `set()`, tự động serialize state → lưu vào `sessionStorage['auth-storage']`
2. Khi store khởi tạo lần đầu, tự động load từ `sessionStorage` → rehydrate

**Tại sao `sessionStorage` thay vì `localStorage`?**

| | sessionStorage | localStorage |
|---|---|---|
| Lifetime | Đóng tab → xóa | Tồn tại mãi |
| Tab isolation | Mỗi tab riêng biệt | Shared across tabs |
| Security | Tốt hơn cho auth token | Rủi ro nếu để token |

Auth data nên clear khi đóng tab (security). `sessionStorage` tự làm điều đó.

**Selector pattern để tránh re-render không cần thiết:**

```typescript
// ❌ Tệ: Subscribe cả store, re-render khi bất kỳ field nào thay đổi
const store = useAuthStore();

// ✅ Tốt: Chỉ subscribe field cần thiết
const user = useAuthStore(state => state.user);
const isLoggedIn = useAuthStore(state => state.isLoggedIn);
```

Khi chỉ dùng `user`, component chỉ re-render khi `user` thay đổi, không phải khi `loading` thay đổi.

---

## Q3. TanStack React Query v5 hoạt động như thế nào? Giải thích `staleTime`, `gcTime`, và cache invalidation.

**Trả lời:**

React Query quản lý một **in-memory cache** cho server data. Hiểu flow này là cốt lõi:

```
Component mount
  ↓
useQuery({ queryKey: ['tests', 'list'], queryFn: fetchTests })
  ↓
Kiểm tra cache: có key ['tests', 'list'] không?
  ├── Không có → fetch ngay, show loading
  ├── Có, còn fresh (< staleTime) → trả cache, KHÔNG fetch
  └── Có, đã stale (> staleTime) → trả cache NGAY (no loading flash),
                                   fetch background, update khi xong
```

**`staleTime`:** Thời gian data được coi là "fresh". Trong thời gian này, React Query KHÔNG tự động refetch.

```typescript
// QueryClient config của dự án
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,  // 30 giây default
    },
  },
});

// Override per-hook:
useQuery({
  queryKey: ['auth', 'profile'],
  queryFn: getProfile,
  staleTime: Infinity,  // Profile không bao giờ tự stale — chỉ invalidate manually
});
```

**`gcTime` (garbage collection time, trước gọi là `cacheTime`):**
Sau khi không có component nào subscribe query, data vẫn giữ trong cache `gcTime` milliseconds. Default 5 phút. Nếu user navigate đi rồi quay lại trong 5 phút → data vẫn còn, show ngay.

**Refetch triggers (khi nào React Query tự fetch lại):**

```typescript
defaultOptions: {
  queries: {
    refetchOnWindowFocus: true,  // User switch tab rồi quay lại → refetch stale data
    retry: 1,                    // Retry 1 lần nếu fail
  },
}
```

**Domain-specific staleTime trong dự án:**

```
Auth profile:       Infinity  ← Hiếm khi thay đổi, invalidate manually
Tests list:         30-60s    ← Admin thỉnh thoảng thêm test
Analytics dashboard: 60s      ← Data aggregate, không cần real-time
Band profiles:      60s
Progress history:   120s      ← Ít thay đổi nhất
```

**Cache Invalidation:**

Khi user thực hiện mutation (thêm test, submit attempt), cần invalidate cache liên quan:

```typescript
const createTest = useMutation({
  mutationFn: (dto) => testApi.createTest(dto),
  onSuccess: () => {
    // Báo cho React Query: data có key này đã cũ, fetch lại lần sau
    queryClient.invalidateQueries({ queryKey: queryKeys.tests.list() });
  },
});
```

`invalidateQueries` không xóa cache ngay — nó đánh dấu query là "stale". Lần sau component cần data đó → tự động refetch.

---

## Q4. Giải thích Query Keys Factory pattern trong dự án. Tại sao không dùng string trực tiếp?

**Trả lời:**

```typescript
// lib/query-keys.ts
export const queryKeys = {
  tests: {
    list: (params?: QueryTestsParams) => ['tests', 'list', params] as const,
    detail: (id: string) => ['tests', 'detail', id] as const,
    sections: (testId: string) => ['tests', 'sections', testId] as const,
  },
  analytics: {
    dashboard: (learnerId: string) => ['analytics', 'dashboard', learnerId] as const,
    bands: (learnerId: string) => ['analytics', 'bands', learnerId] as const,
  },
};
```

**Vấn đề khi dùng string trực tiếp:**

```typescript
// ❌ Dễ typo, không refactor-safe
useQuery({ queryKey: ['tests-list'] })  // ở component A

// Ở nơi khác:
queryClient.invalidateQueries({ queryKey: ['test_list'] })  // typo! 's' vs '_'
// → Invalidation không hoạt động, cache không được clear
```

**Lợi ích của factory:**

```typescript
// ✅ TypeScript kiểm tra, refactor an toàn
useQuery({ queryKey: queryKeys.tests.list(params) })

// Invalidate chính xác:
queryClient.invalidateQueries({ queryKey: queryKeys.tests.list() })
// ['tests', 'list'] prefix match → invalidate CẢ ['tests', 'list', { skill: 'reading' }]
```

**Hierarchical invalidation:**

React Query invalidation hỗ trợ **prefix matching**:

```typescript
// Invalidate tất cả tests queries (list, detail, sections, etc.)
queryClient.invalidateQueries({ queryKey: ['tests'] });

// Chỉ invalidate list (không ảnh hưởng detail cache)
queryClient.invalidateQueries({ queryKey: queryKeys.tests.list() });
```

`as const` trong TypeScript làm tuple readonly, giúp TypeScript infer type chính xác hơn là `string[]`.

---

## Q5. LearnerId pattern là gì? Tại sao `user.profileId` thay vì `user.id`?

**Trả lời:**

Đây là một trong những gotcha quan trọng nhất của dự án. Database có thiết kế:

```sql
accounts (id: uuid)            ← accounts.id = user.id trong JWT
  └── learner_profiles (id: uuid, account_id: uuid)   ← learner_profiles.id = profileId
```

Khi gọi submission hoặc analytics API:

```typescript
// ❌ SAI — dùng account ID
POST /api/writing-submissions
{ learnerId: user.id }         // Foreign key mismatch! DB expects learner_profiles.id

// ✅ ĐÚNG — dùng profile ID
const learnerId = user?.profileId ?? user?.id;
POST /api/writing-submissions
{ learnerId }                  // learner_profiles.id → FK hợp lệ
```

**Tại sao có `?? user?.id` fallback?**

Trong một số edge cases (OAuth mới, admin user), `profileId` có thể chưa được set. Fallback về `user.id` tránh undefined, nhưng cần validate là UUID hợp lệ trước khi gửi lên backend.

**UUID validation trước khi gửi:**

```typescript
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

const learnerId = user?.profileId ?? user?.id;
if (!learnerId || !isValidUUID(learnerId)) {
  throw new Error('Invalid learnerId');
}
```

Route `/api/ai/grade-writing` thực sự có UUID validation cứng — trả 400 nếu `learnerId` không phải UUID v4 hợp lệ.

---

## Q6. Khi nào dùng `useQuery` và khi nào dùng `useMutation`? Cho ví dụ từ dự án.

**Trả lời:**

**`useQuery`** — cho **read operations (GET)**:
- Data được cache
- Tự động refetch
- Background updates
- Loading/error states tự động

**`useMutation`** — cho **write operations (POST, PUT, DELETE)**:
- Không cache
- Không tự động refetch
- Manual trigger (gọi `mutation.mutate()`)
- Side effects: invalidate cache, toast, redirect

**Ví dụ từ dự án:**

```typescript
// lib/hooks/use-tests.ts

// READ: lấy danh sách tests
export function useTests(params?: QueryTestsParams) {
  return useQuery({
    queryKey: queryKeys.tests.list(params),
    queryFn: () => testApi.getTests(params),
    staleTime: 30_000,
  });
}

// WRITE: tạo test mới
export function useCreateTest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateTestDto) => testApi.createTest(dto),
    onSuccess: () => {
      // Invalidate list cache → trigger refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.tests.list() });
      toast.success('Test created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create test');
    },
  });
}

// Dùng trong component:
function AdminTestsPage() {
  const { data: tests, isLoading } = useTests({ skill: 'reading' });
  const createTest = useCreateTest();

  return (
    <button onClick={() => createTest.mutate({ title: '...', skill: 'reading' })}>
      {createTest.isPending ? 'Creating...' : 'Create Test'}
    </button>
  );
}
```

**`onSuccess` callback pattern:**

Sau khi submit attempt:
```typescript
useSubmitAttempt({
  onSuccess: (data) => {
    // Invalidate nhiều queries liên quan
    queryClient.invalidateQueries({ queryKey: queryKeys.attempts.byLearner(learnerId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.attempts.detail(attemptId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.analytics.dashboard(learnerId) });
    // Navigate to result page
    router.push(`/practice/${testId}/result`);
  },
});
```

---

## Q7. Giải thích `refetchOnWindowFocus`. Khi nào nó có lợi, khi nào nó gây vấn đề?

**Trả lời:**

`refetchOnWindowFocus: true` (default) có nghĩa: khi user switch sang tab khác rồi quay lại → React Query sẽ refetch tất cả queries đang active (nếu data đã stale).

**Khi nào có lợi:**

User đang xem analytics dashboard → chuyển sang tab khác trong 5 phút → quay lại → React Query tự động fetch data mới nhất. User luôn thấy data up-to-date mà không cần manual refresh.

**Khi nào gây vấn đề:**

```typescript
// Analytics dashboard query: staleTime 60s
// User đang xem dashboard, switch tab 1 phút, quay lại
// → Data chưa stale (60s) → KHÔNG refetch → OK

// Nhưng nếu staleTime quá ngắn:
staleTime: 0  // Luôn stale → mỗi lần focus window → fetch lại → spam API
```

Dự án set `staleTime: 30_000–120_000` cho hầu hết queries → tránh over-fetching.

**Disable cho queries nhạy cảm:**

```typescript
// Profile không bao giờ tự refetch khi focus window
useQuery({
  queryKey: queryKeys.auth.profile(),
  staleTime: Infinity,
  refetchOnWindowFocus: false,  // Override default
});
```
