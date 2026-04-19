"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { authApi } from "@/lib/api/auth";
import { useAuthStore } from "@/stores/auth-store";
import { useLogout } from "@/lib/hooks/use-auth";

export function LearnerSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

  const handleLogout = () => {
    authApi.logout();   // Clear cookies
    logout();           // Clear Zustand store + query cache → redirects to /login
  };

  const routes = [
    { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
    { href: "/analysis", label: "Analysis", icon: "analytics" },
    { href: "/ai-advisor", label: "AI Coach", icon: "smart_toy" },
    { href: "/resources", label: "Resources", icon: "library_books" },
    { href: "/profile", label: "Profile", icon: "person" },
  ];

  return (
    <div className="hidden lg:flex flex-col w-[280px] border-r h-full bg-background">
      <div className="flex flex-col flex-1 p-6 gap-6">
        {/* Logo and back button*/}
        {/* Logo/Brand */}
        <div className="flex items-center gap-3 pb-4">
          <Link
            href="/"
            className="flex items-center justify-center p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 rounded-lg transition-colors"
            title="Back to Home"
          >
            <span className="material-symbols-outlined text-[20px]">
              arrow_back
            </span>
          </Link>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-white">
            <span className="material-symbols-outlined text-[20px]">
              school
            </span>
          </div>
          <span className="text-lg font-bold"><Link href="/admin/dashboard">IELTS Admin</Link></span>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3 pb-6 border-b">
          <div className="relative">
            <Avatar className="h-12 w-12 border-2 border-background">
              <AvatarImage
                src={user?.avatarUrl}
                alt={user?.fullName || user?.email || "User"}
              />
              <AvatarFallback>
                {(user?.fullName || user?.email || "U").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 right-0 size-3 rounded-full bg-green-500 border-2 border-background"></div>
          </div>

          <div className="flex flex-col flex-1 overflow-hidden">
            <h1 className="text-sm font-semibold text-foreground truncate">
              {user?.fullName || user?.email || "Loading..."}
            </h1>
            <p className="text-xs text-muted-foreground capitalize">
              {user?.role || "Standard Plan"}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-col gap-2">
          {routes.map((route) => {
            const isActive = pathname === route.href;
            return (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary font-semibold"
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
