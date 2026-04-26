# Frontend — Middleware & Route Protection

**File:** [`middleware.ts`](../middleware.ts)

Next.js middleware runs at the Edge on every navigation request before the page renders. It reads the `accessToken` cookie to determine auth state and applies role-based access control.

---

## Route Categories

### Protected Routes (require login)

Any user must have a valid `accessToken` cookie to access these paths. Unauthenticated users are redirected to `/login`.

| Path prefix | Additional role check |
|---|---|
| `/admin/*` | Must have `role === 'admin'` in the `user` cookie |
| `/dashboard/*` | Must have `role === 'learner'` |
| `/analysis/*` | Must have `role === 'learner'` |
| `/schedule/*` | Must have `role === 'learner'` |
| `/practice/*` | Must have `role === 'learner'` |

### Auth Pages (redirect if already logged in)

Users with a valid `accessToken` are redirected away from auth pages to prevent re-login.

| Path | Redirects to (if logged in) |
|---|---|
| `/login` | `/` |
| `/register` | `/` |

### Public Routes (no check)

Everything else (home, tests, rankings, resources) is accessible without authentication.

---

## RBAC Rules

| Scenario | Result |
|---|---|
| Learner accesses `/admin/*` | Redirect to `/` |
| Admin accesses `/dashboard/*`, `/practice/*`, `/analysis/*` | Redirect to `/admin/dashboard` |
| Unauthenticated accesses any protected route | Redirect to `/login` |
| Authenticated accesses `/login` or `/register` | Redirect to `/` |

---

## Implementation Detail

```typescript
// middleware.ts (simplified)
export function middleware(request: NextRequest) {
  const token = request.cookies.get('accessToken')?.value;
  const userCookie = request.cookies.get('user')?.value;
  const user = userCookie ? JSON.parse(userCookie) : null;
  const { pathname } = request.nextUrl;

  const isAdminRoute = pathname.startsWith('/admin');
  const isLearnerRoute = ['/dashboard', '/analysis', '/schedule', '/practice']
    .some(p => pathname.startsWith(p));
  const isAuthPage = ['/login', '/register'].some(p => pathname.startsWith(p));

  // No token → redirect to login for protected routes
  if (!token && (isAdminRoute || isLearnerRoute)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Logged-in user on auth page → go home
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Role mismatch
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

---

## Matcher Configuration

The middleware runs only on routes specified in the `matcher` config (excludes static files and Next.js internals):

```typescript
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
```

---

## Important Caveats

1. **Frontend-only enforcement** — The API Gateway does not validate admin roles before proxying. A learner with a valid JWT can still call admin NestJS endpoints directly if they know the URL. Backend guard enforcement is a planned improvement.

2. **Cookie parsing is synchronous** — The `user` cookie is parsed with `JSON.parse` without try/catch in the middleware. A malformed cookie will crash the middleware. Handle this defensively if the cookie format changes.

3. **Token expiry** — The middleware only checks for cookie presence, not JWT expiry. An expired token passes the middleware but fails at the API (401), which then triggers the Axios interceptor to redirect to `/login`.
