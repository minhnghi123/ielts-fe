"use client";

import { useRouter } from "next/navigation";
import { ClipboardList, GraduationCap, LayoutDashboard, Presentation, Sparkles, Users } from "lucide-react";
import { SideNav, type NavRoute } from "@/components/app-shell/side-nav";
import { authApi } from "@/lib/api/auth";
import { useAuth } from "@/contexts/auth-context";

const ROUTES: NavRoute[] = [
  { href: "/admin/dashboard", label: "Tổng quan", icon: LayoutDashboard, exact: true },
  { href: "/admin/tests", label: "Quản lý đề", icon: ClipboardList },
  { href: "/admin/ai-generator", label: "Tạo đề bằng AI", icon: Sparkles },
  { href: "/admin/users", label: "Người dùng", icon: Users },
  { href: "/admin/teachers", label: "Giáo viên", icon: Presentation },
];

export function AdminSidebar() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <SideNav
      brand="IELTS Admin"
      brandIcon={GraduationCap}
      routes={ROUTES}
      user={user}
      roleLabel="Quản trị viên"
      onLogout={() => { authApi.logout(); router.push("/login"); }}
    />
  );
}
