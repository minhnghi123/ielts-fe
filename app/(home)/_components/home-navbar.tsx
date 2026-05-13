"use client";

import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
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
import { useAuthStore } from "@/stores/auth-store";
import { useLogout } from "@/lib/hooks/use-auth";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/tests", label: "Tests" },
  { href: "/rankings", label: "Rankings" },
  { href: "/resources", label: "Resources" },
];

export function HomeNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const loading = useAuthStore((s) => s.loading);
  const logout = useLogout();

  const initials = user?.fullName
    ? user.fullName.charAt(0).toUpperCase()
    : user?.email
      ? user.email.slice(0, 2).toUpperCase()
      : "?";

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border"
    >
      <div className="max-w-[1200px] mx-auto flex items-center justify-between px-6 py-3">
        {/* Left: Logo + Nav */}
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center gap-3 cursor-pointer">
            <div className="text-primary h-8 w-8 bg-primary/10 flex items-center justify-center rounded-lg">
              <span className="material-symbols-outlined">school</span>
            </div>
            <h2 className="font-display text-xl font-bold tracking-tight">IELTS-MN</h2>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(({ href, label }) => {
              const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`text-sm font-medium transition-all duration-150 pb-1 ${isActive
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Auth */}
        <div className="flex items-center gap-4">
          {loading ? (
            <div className="h-9 w-9 rounded-full bg-zinc-100 animate-pulse" />
          ) : isLoggedIn ? (
            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="h-9 w-9 border-2 border-primary/30 cursor-pointer hover:border-primary transition-all duration-150">
                    <AvatarImage src={user?.avatarUrl} alt={user?.fullName || user?.email} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <div className="px-3 py-2">
                    <p className="text-sm font-semibold truncate">{user?.fullName || user?.email}</p>
                    <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push(user?.role === "admin" ? "/admin/dashboard" : "/dashboard")}>
                    <span className="material-symbols-outlined text-[18px] mr-2">dashboard</span>
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={logout}
                  >
                    <span className="material-symbols-outlined text-[18px] mr-2">logout</span>
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => router.push("/login")}>
                Sign In
              </Button>
              <Button size="sm" onClick={() => router.push("/register")}>
                Get Started
              </Button>
            </div>
          )}
        </div>
      </div>
    </motion.header>
  );
}
