"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Globe, LayoutDashboard, Library, Presentation, User, Users } from "lucide-react";
import { SideNav, type NavRoute } from "@/components/app-shell/side-nav";
import { authApi } from "@/lib/api/auth";
import { useAuth } from "@/contexts/auth-context";

const ROUTES: NavRoute[] = [
  { href: "/teacher", label: "Tổng quan", icon: LayoutDashboard, exact: true },
  { href: "/teacher/classes", label: "Lớp học", icon: Users },
  { href: "/teacher/tests", label: "Ngân hàng đề", icon: Library },
  { href: "/teacher/profile", label: "Hồ sơ", icon: User },
];

export function TeacherSidebar() {
  const router = useRouter();
  const { user } = useAuth();
  const pending = user?.teacherStatus && user.teacherStatus !== "approved";

  return (
    <SideNav
      brand="IELTS Teacher"
      brandIcon={Presentation}
      routes={ROUTES}
      user={user}
      roleLabel={pending ? "Chờ duyệt" : "Giáo viên"}
      onLogout={() => { authApi.logout(); router.push("/login"); }}
      footer={
        <Link href="/tests" className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground">
          <Globe className="h-[18px] w-[18px]" aria-hidden />
          Đề công khai
        </Link>
      }
    />
  );
}
