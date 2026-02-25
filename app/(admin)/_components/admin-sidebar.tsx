"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { authApi } from "@/lib/api/auth";

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = authApi.getStoredUser();
    setUser(storedUser);
  }, []);

  const handleLogout = () => {
    authApi.logout();
    router.push("/login");
  };

  const routes = [
    { href: "/admin", label: "Dashboard", icon: "dashboard", exact: true },
    { href: "/admin/tests", label: "Test Management", icon: "assignment", exact: false },
    { href: "/admin/tests/import", label: "Import Test", icon: "upload_file", exact: false },
    { href: "/admin/users", label: "User Management", icon: "group", exact: false },
    { href: "/admin/analytics", label: "Analytics", icon: "analytics", exact: false },
    { href: "/admin/settings", label: "System Settings", icon: "settings", exact: false },
  ];

  return (
    <div className="hidden lg:flex flex-col w-[280px] border-r h-full bg-background">
      <div className="flex flex-col flex-1 p-6 gap-6">
        {/* Logo/Brand */}
        <div className="flex items-center gap-2 pb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-white">
            <span className="material-symbols-outlined text-[20px]">
              school
            </span>
          </div>
          <span className="text-lg font-bold">IELTS Admin</span>
        </div>

        {/* Admin Profile */}
        <div className="flex items-center gap-3 pb-6 border-b">
          <div className="relative">
            <Avatar className="h-12 w-12 border-2 border-orange-500">
              <AvatarImage
                src="https://github.com/shadcn.png"
                alt={user?.email || "Admin"}
              />
              <AvatarFallback className="bg-orange-100 text-orange-600">
                {user?.email?.charAt(0).toUpperCase() || "A"}
              </AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 right-0 size-3 rounded-full bg-green-500 border-2 border-background"></div>
          </div>

          <div className="flex flex-col">
            <h1 className="text-sm font-semibold text-foreground">
              {user?.email || "Loading..."}
            </h1>
            <p className="text-xs text-orange-600 font-semibold uppercase">
              Administrator
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-col gap-2">
          {routes.map((route) => {
            const isActive = route.exact ? pathname === route.href : pathname.startsWith(route.href);
            return (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                  isActive
                    ? "bg-orange-500/10 text-orange-600 font-semibold"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground font-medium",
                )}
              >
                <span className="material-symbols-outlined text-[24px]">
                  {route.icon}
                </span>
                <span className="text-sm">{route.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Bottom Actions */}
        <div className="mt-auto flex flex-col gap-2">
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 border text-foreground hover:bg-accent transition-colors"
          >
            <span className="material-symbols-outlined text-sm">logout</span>
            <span className="text-sm font-medium">Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
