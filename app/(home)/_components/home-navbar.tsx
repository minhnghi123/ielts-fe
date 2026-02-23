"use client";
import { useRouter, usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/tests", label: "Tests" },
  { href: "/analysis", label: "Results" },
  { href: "/resources", label: "Resources" },
];

export function HomeNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoggedIn, loading, logout } = useAuth();

  // Get initials from email for avatar fallback
  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : "?";

  return (
    <header className="sticky top-0 z-50 w-full bg-white dark:bg-[#151c2a] border-b border-border">
      <div className="max-w-[1200px] mx-auto flex items-center justify-between px-6 py-3">
        {/* Left: Logo + Nav */}
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center gap-3 cursor-pointer">
            <div className="text-primary h-8 w-8 bg-primary/10 flex items-center justify-center rounded-lg">
              <span className="material-symbols-outlined">school</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight">IELTS Master</h2>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(({ href, label }) => {
              const isActive =
                href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`text-sm font-medium transition-colors pb-1 ${isActive
                      ? "text-primary border-b-2 border-primary"
                      : "text-muted-foreground hover:text-primary"
                    }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Search + Auth */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-1.5 w-56">
            <span className="material-symbols-outlined text-muted-foreground text-[20px]">
              search
            </span>
            <input
              className="bg-transparent border-none focus:outline-none text-sm w-full placeholder:text-muted-foreground ml-2 text-foreground"
              placeholder="Search tests..."
              type="text"
            />
          </div>

          {/* Auth area */}
          {loading ? (
            <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
          ) : isLoggedIn ? (
            /* Logged-in state */
            <div className="flex items-center gap-3">
              <button className="text-muted-foreground hover:text-primary transition-colors">
                <span className="material-symbols-outlined">notifications</span>
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="h-9 w-9 border-2 border-primary/30 cursor-pointer hover:border-primary transition-all">
                    <AvatarImage src={undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <div className="px-3 py-2">
                    <p className="text-sm font-semibold truncate">{user?.email}</p>
                    <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/dashboard")}>
                    <span className="material-symbols-outlined text-[18px] mr-2">
                      dashboard
                    </span>
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/analysis")}>
                    <span className="material-symbols-outlined text-[18px] mr-2">
                      analytics
                    </span>
                    My Results
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={logout}
                  >
                    <span className="material-symbols-outlined text-[18px] mr-2">
                      logout
                    </span>
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            /* Guest state */
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/login")}
              >
                Sign In
              </Button>
              <Button size="sm" onClick={() => router.push("/register")}>
                Get Started
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
