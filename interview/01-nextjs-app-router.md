# Interview: Next.js App Router & Kiến trúc Frontend

---

## Q1. Dự án dùng Next.js App Router. App Router khác Pages Router như thế nào? Tại sao dự án này chọn App Router?

**Trả lời:**

App Router (ra mắt Next.js 13, ổn định từ 13.4) là kiến trúc hoàn toàn mới dựa trên **React Server Components (RSC)**. Sự khác biệt cốt lõi:

| Khía cạnh | Pages Router (`/pages`) | App Router (`/app`) |
|---|---|---|
| Default component | Client Component | **Server Component** |
| Data fetching | `getServerSideProps`, `getStaticProps` | `async/await` trực tiếp trong component |
| Layout | `_app.tsx` (global), không nested | `layout.tsx` nested ở mọi cấp |
| Route groups | Không có | `(groupName)` — tổ chức layout, không ảnh hưởng URL |
| Loading state | Tự quản lý | `loading.tsx` tự động |

**Tại sao dự án này chọn App Router:**

1. **Route groups để tách layout** — dự án có 4 loại layout riêng biệt (auth, home, learner, admin). App Router cho phép tạo `(auth)/`, `(home)/`, `(learner)/`, `(admin)/` với layout file riêng, hoàn toàn tách biệt nhau mà URL không thay đổi.

2. **Server-side AI routes** — `app/api/ai/*/route.ts` là Route Handlers của App Router, thay thế cho `pages/api/`. Chúng chạy server-side, cho phép giữ bí mật `GROQ_API_KEY` hoàn toàn khỏi browser.

**Lưu ý quan trọng của dự án này:** Mặc dù App Router mặc định dùng Server Components, dự án này **KHÔNG fetch data trong server components**. Tất cả data fetching đều qua React Query trên client. Đây là quyết định kiến trúc có chủ ý — giữ mọi state/data ở client để dễ cache, invalidate, và maintain hơn.

---

## Q2. Route Groups trong dự án hoạt động như thế nào? Giải thích cấu trúc `(auth)`, `(admin)`, `(learner)`, `(home)`.

**Trả lời:**

Route Groups là folder có tên đặt trong ngoặc tròn `(groupName)`. Next.js **bỏ qua hoàn toàn tên folder này** khi tạo URL — nó chỉ phục vụ mục đích tổ chức code và **gán layout file**.

```
app/
├── (auth)/
│   ├── layout.tsx        ← Layout riêng: bare page, không có navbar
│   ├── login/page.tsx    → URL: /login
│   └── register/page.tsx → URL: /register
│
├── (home)/
│   ├── layout.tsx        ← Layout riêng: HomeNavbar + Footer
│   ├── page.tsx          → URL: /
│   └── tests/page.tsx    → URL: /tests
│
├── (learner)/
│   ├── layout.tsx        ← Layout riêng: LearnerSidebar
│   └── dashboard/page.tsx → URL: /dashboard
│
└── (admin)/
    ├── layout.tsx        ← Layout riêng: AdminSidebar
    └── admin/dashboard/page.tsx → URL: /admin/dashboard
```

**Cách layout nesting hoạt động:**

Root layout (`app/layout.tsx`) luôn được áp dụng cho tất cả. Sau đó, route group layout được áp dụng chồng lên:

```
/dashboard → app/layout.tsx (root) → app/(learner)/layout.tsx → dashboard/page.tsx
/admin     → app/layout.tsx (root) → app/(admin)/layout.tsx  → admin/page.tsx
```

Root layout của dự án chứa:
```tsx
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <QueryProvider>      {/* TanStack React Query */}
          <AuthHydrator />   {/* Sync Zustand từ cookie */}
          <Toaster />        {/* Sonner notifications */}
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
```

**Tại sao không dùng route groups cho `/practice`?**

Practice route (`/practice/[id]`) nằm trong `(root)/` với layout minimal (không có sidebar). Đây là intentional — khi làm bài thi, UI phải full-screen, không có distraction.

---

## Q3. Giải thích sự khác biệt giữa Server Components và Client Components. Dự án này dùng cái nào ở đâu?

**Trả lời:**

**Server Components (default trong App Router):**
- Render trên server, gửi HTML xuống client
- Có thể `async/await` trực tiếp, access database, filesystem
- **Không có** browser APIs (`window`, `localStorage`, event handlers)
- Không gây hydration overhead trên client
- Secrets (API keys) an toàn vì không bao giờ xuống browser

**Client Components (`'use client'` directive):**
- Hydrate trên browser, có đầy đủ React interactivity
- Có `useState`, `useEffect`, event handlers
- Có thể access `window`, `localStorage`, browser APIs

**Trong dự án này:**

```
Server Components (không có 'use client'):
- app/layout.tsx (root)
- Page files (app/(learner)/dashboard/page.tsx, v.v.)
  → Thực ra chúng chỉ là "shell" — không fetch data

Client Components ('use client'):
- Hầu như TẤT CẢ components thực sự
- Vì dự án dùng React Query để fetch (client-side)
- Vì dùng Zustand (client-side state)
- components/providers/query-provider.tsx
- components/providers/auth-hydrator.tsx
- stores/auth-store.ts
- Tất cả form components, interactive UI
```

**Tại sao các page files không fetch data trực tiếp?**

Mặc dù có thể viết:
```tsx
// ❌ Không dùng theo pattern này trong dự án
async function DashboardPage() {
  const data = await fetch('/api/analytics/...')
  return <Dashboard data={data} />
}
```

Dự án chọn:
```tsx
// ✅ Pattern thực tế của dự án
function DashboardPage() {
  return <DashboardClient /> // Client Component dùng React Query
}
```

**Lý do:** React Query cache, invalidation, optimistic updates, và loading states phức tạp hơn nhiều so với server fetching một lần. Đồng thời giữ consistency — tất cả data đều đi qua một layer.

---

## Q4. `AuthHydrator` là gì? Tại sao cần component này?

**Trả lời:**

`AuthHydrator` là một **zero-render Client Component** — nó không render ra UI gì cả, chỉ chạy side effect khi mount:

```tsx
// components/providers/auth-hydrator.tsx
'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';

export function AuthHydrator() {
  const { hydrateFromCookie } = useAuthStore();

  useEffect(() => {
    hydrateFromCookie(); // Đọc cookie 'user' → populate Zustand
  }, []);

  return null; // Không render gì
}
```

**Vấn đề nó giải quyết:**

Zustand store được persist vào `sessionStorage`. Nhưng khi user refresh trang, có một khoảnh khắc ngắn (`hydration gap`) mà:
1. HTML đã render (từ server)
2. Zustand chưa load từ sessionStorage
3. → UI flash "không logged in" trong milliseconds

Tệ hơn, nếu user đăng nhập ở tab khác, `sessionStorage` không sync giữa các tab. Nhưng **cookie thì sync**.

`AuthHydrator` giải quyết bằng cách luôn đồng bộ Zustand từ cookie `user` mỗi khi mount — đảm bảo Zustand luôn nhất quán với cookie (source of truth thực sự).

**Vị trí trong component tree:**

```tsx
// app/layout.tsx
<QueryProvider>
  <AuthHydrator />  ← Chạy trên mọi trang, mọi lần mount
  {children}
</QueryProvider>
```

Đặt trong root layout → chạy trước bất kỳ page component nào → đảm bảo `useUser()` luôn có giá trị đúng.

---

## Q5. `app/api/` Route Handlers hoạt động như thế nào? Tại sao AI routes được đặt ở đây thay vì NestJS?

**Trả lời:**

Route Handlers là file `route.ts` trong `app/api/` — chúng là **server-side functions** chạy trong Next.js Node.js runtime, không phải trình duyệt.

```ts
// app/api/ai/grade-writing/route.ts
export async function POST(request: Request) {
  const body = await request.json();
  // ← Server-side: có thể dùng process.env.GROQ_API_KEY
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  // ...
  return Response.json({ gradingId, overallBand, task1, task2 });
}
```

**Tại sao AI routes không đi qua NestJS:**

1. **Bảo mật API key:** `GROQ_API_KEY`, `CLOUDINARY_API_SECRET` không có prefix `NEXT_PUBLIC_` → chỉ available server-side. Nếu để NestJS gọi, frontend vẫn phải gọi NestJS → NestJS gọi Groq, thêm một hop không cần thiết.

2. **Independence:** AI features hoạt động ngay cả khi NestJS services down (chỉ ảnh hưởng phần persist). Đây là resilience design.

3. **Latency:** Browser → Next.js route → Groq. Loại bỏ một hop so với Browser → NestJS → Groq.

4. **Streaming dễ hơn:** Next.js Route Handlers hỗ trợ streaming response (`ReadableStream`) cực dễ. NestJS cần config thêm.

**Pattern tổng quát của AI routes:**

```
1. Validate input
2. Call Groq (với GROQ_API_KEY server-side)
3. Parse JSON response từ Groq
4. Persist side effects → fetch(NestJS API)  ← gọi qua HTTP
5. Return result to browser
```

Bước 4 là điểm thú vị: AI route gọi NestJS để lưu data. Điều này nghĩa là AI route vừa là "client" của Groq, vừa là "client" của NestJS.

---

## Q6. Streaming response hoạt động thế nào trong route `/api/ai/advisor`?

**Trả lời:**

Route advisor dùng **Server-Sent Events (SSE)** để stream text từng chunk từ Groq về browser:

```ts
// app/api/ai/advisor/route.ts
export async function POST(request: Request) {
  const { messages, profile } = await request.json();

  const stream = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    stream: true,          // ← Bật streaming
    messages: [
      { role: 'system', content: buildSystemPrompt(profile) },
      ...messages,
    ],
  });

  // Tạo ReadableStream để pipe về client
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? '';
        controller.enqueue(text);
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain' }, // text/event-stream cho SSE chuẩn
  });
}
```

**Frontend nhận stream như thế nào:**

```tsx
// app/(learner)/ai-advisor/page.tsx (simplified)
const response = await fetch('/api/ai/advisor', { method: 'POST', body: JSON.stringify(payload) });
const reader = response.body!.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  setAdvisorText(prev => prev + decoder.decode(value)); // Append từng chunk
}
```

**Tại sao streaming quan trọng:**

LLM response có thể mất 5-15 giây. Không streaming → user thấy blank screen trong suốt thời gian đó. Streaming → text xuất hiện ngay sau ~200ms (time to first token), trải nghiệm giống ChatGPT.

**Lưu ý:** `TransformInterceptor` của NestJS KHÔNG được dùng ở đây — đó là cho NestJS routes. Next.js routes tự quản lý response format.

---

## Q7. `PracticeContext` hoạt động như thế nào? Tại sao dùng Context thay vì Zustand ở đây?

**Trả lời:**

`PracticeContext` là React Context cung cấp state cho toàn bộ test-taking session:

```tsx
interface PracticeContextValue {
  attemptId: string | null;
  testId: string;
  skill: string;
  answers: Record<string, string>;  // questionId → answer
  timer: number;                     // seconds remaining
  isSubmitting: boolean;
  setAnswer: (questionId: string, answer: string) => void;
  submitAttempt: () => Promise<void>;
}
```

**Tại sao Context thay vì Zustand?**

Zustand là **global singleton** — state tồn tại suốt lifetime của app. Practice session state là **ephemeral** — chỉ cần khi user đang trong `/practice/[id]`. Khi user rời khỏi trang, state này phải được destroy.

Context được mount tại `app/(root)/practice/[id]/layout.tsx` (hoặc trong page component) và unmount khi user navigate away → automatic cleanup.

Nếu dùng Zustand, phải nhớ manually reset store khi rời practice route — dễ bug.

**localStorage persistence:**

Session được lưu vào localStorage để survive page refresh (lỡ mất điện, F5):

```ts
// Key: ielts_session_<testId>
const session = {
  attemptId: 'uuid',
  startedAt: '2025-01-15T10:00:00Z',
  durationMs: 3600000,  // 60 phút
  answers: { 'q-uuid-1': 'TRUE', 'q-uuid-2': 'B', ... }
};
localStorage.setItem(`ielts_session_${testId}`, JSON.stringify(session));
```

**Resume flow:**

```
Mount practice page
  ↓
Check localStorage có session cũ không?
  ↓ Có
Show dialog: "Bạn có muốn tiếp tục bài thi trước không?"
  ↓ Yes        ↓ No
Restore answers  Delete old session → start fresh
```
