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
  const isLearnerProtectedPage =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/practice") ||
    pathname.startsWith("/analysis") ||
    pathname.startsWith("/schedule");

  // Redirect to login if accessing protected pages without token
  if ((isAdminPage || isLearnerProtectedPage) && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect authenticated users away from auth pages
  if (isAuthPage && token && user) {
    if (user.role === "admin") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.redirect(new URL("/", request.url));
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
    // "/practice/:path*",
    "/analysis/:path*",
    "/schedule/:path*",
    "/admin/:path*",
    "/login",
    "/register",
  ],
};
