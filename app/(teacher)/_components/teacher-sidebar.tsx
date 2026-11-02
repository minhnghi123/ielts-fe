"use client";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { authApi } from "@/lib/api/auth";
import { useAuth } from "@/contexts/auth-context";

const ROUTES = [
  { href: "/teacher", label: "Overview", icon: "space_dashboard", exact: true },
  { href: "/teacher/classes", label: "Classes", icon: "groups", exact: false },
  { href: "/teacher/tests", label: "My Test Bank", icon: "library_books", exact: false },
  { href: "/teacher/profile", label: "Profile", icon: "person", exact: false },
];

export function TeacherSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const pending = user?.teacherStatus && user.teacherStatus !== "approved";

  const handleLogout = () => {
    authApi.logout();
    router.push("/login");
  };

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r h-full bg-card">
      <div className="flex flex-col flex-1 p-6 gap-6">
        <div className="flex items-center gap-3 pb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <span className="material-symbols-outlined text-[20px]">co_present</span>
          </div>
          <span className="font-display text-base font-bold text-foreground">IELTS Teacher</span>
        </div>

        <div className="flex items-center gap-3 pb-6 border-b border-border">
          <Avatar className="h-12 w-12 border-2 border-primary/30">
            <AvatarImage src={user?.avatarUrl} alt={user?.fullName || user?.email || "Teacher"} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {(user?.fullName || user?.email || "T").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col flex-1 overflow-hidden">
            <h1 className="text-sm font-semibold text-foreground truncate">
              {user?.fullName || user?.email || "Loading..."}
            </h1>
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              {pending ? "Pending approval" : "Teacher"}
            </p>
          </div>
        </div>

        <nav className="flex flex-col gap-1" aria-label="Teacher navigation">
          {ROUTES.map((route) => {
            const isActive = route.exact ? pathname === route.href : pathname.startsWith(route.href);
            return (
              <Link
                key={route.href}
                href={route.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150",
                  isActive
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground font-medium",
                )}
              >
                <span className="material-symbols-outlined text-[20px]">{route.icon}</span>
                <span className="text-sm">{route.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-2">
          <Link
            href="/tests"
            className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-150 text-sm"
          >
            <span className="material-symbols-outlined text-sm">public</span>
            Browse public tests
          </Link>
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 border border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-150"
          >
            <span className="material-symbols-outlined text-sm">logout</span>
            <span className="text-sm font-medium">Log Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
