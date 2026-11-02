import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("accessToken")?.value;
  const userCookie = request.cookies.get("user")?.value;

  let user = null;
  if (userCookie) {
    try {
      user = JSON.parse(userCookie);
    } catch (e) {
      console.error("Failed to parse user cookie");
    }
  }

  const { pathname } = request.nextUrl;

  const isAuthPage =
    pathname.startsWith("/login") || pathname.startsWith("/register");
  const isAdminPage = pathname.startsWith("/admin");
  const isTeacherPage = pathname.startsWith("/teacher");
  const isLearnerProtectedPage =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/practice") ||
    pathname.startsWith("/analysis") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/ai-advisor") ||
    pathname.startsWith("/classes") ||
    pathname.startsWith("/schedule");

  // Redirect to login if accessing protected pages without token
  if ((isAdminPage || isTeacherPage || isLearnerProtectedPage) && !token) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  // Redirect authenticated users away from auth pages
  if (isAuthPage && token && user) {
    if (user.role === "admin") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    if (user.role === "teacher") {
      return NextResponse.redirect(new URL("/teacher", request.url));
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Teacher area is for teachers (admins may inspect it too)
  if (isTeacherPage && user?.role !== "teacher" && user?.role !== "admin") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Teachers preview tests from their own area; they do not sit exams or own learner analytics
  if (isLearnerProtectedPage && user?.role === "teacher") {
    return NextResponse.redirect(new URL("/teacher", request.url));
  }

  // Role-based access control - prevent learners from accessing admin
  if (isAdminPage && user?.role !== "admin") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Redirect admin users trying to access learner pages to admin dashboard
  if (isLearnerProtectedPage && user?.role === "admin") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/practice/:path*",
    "/profile/:path*",
    "/ai-advisor/:path*",
    "/analysis/:path*",
    "/schedule/:path*",
    "/admin/:path*",
    "/teacher/:path*",
    "/classes/:path*",
    "/login",
    "/register",
  ],
};
