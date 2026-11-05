"use client";

import { BarChart3, BookA, Bot, GraduationCap, LayoutDashboard, Library, ListChecks, User, Users, Mic } from "lucide-react";
import { SideNav, type NavRoute } from "@/components/app-shell/side-nav";
import { authApi } from "@/lib/api/auth";
import { useAuthStore } from "@/stores/auth-store";
import { useLogout } from "@/lib/hooks/use-auth";

const ROUTES: NavRoute[] = [
  { href: "/dashboard", label: "Hôm nay", icon: LayoutDashboard, exact: true },
  { href: "/analysis", label: "Kết quả", icon: BarChart3 },
  { href: "/mistakes", label: "Sổ lỗi", icon: ListChecks },
  { href: "/words", label: "Từ vựng", icon: BookA },
  { href: "/speak", label: "Luyện nói", icon: Mic },
  { href: "/classes", label: "Lớp học", icon: Users },
  { href: "/ai-advisor", label: "Hỏi AI Coach", icon: Bot },
  { href: "/resources", label: "Tài nguyên", icon: Library },
  { href: "/profile", label: "Hồ sơ & mục tiêu", icon: User },
];

export function LearnerSidebar() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

  return (
    <SideNav
      brand="IELTS-MN"
      brandIcon={GraduationCap}
      routes={ROUTES}
      user={user}
      roleLabel="Học viên"
      onLogout={() => { authApi.logout(); logout(); }}
    />
  );
}
