"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { authApi } from "@/lib/api/auth";
import { useAuthStore } from "@/stores/auth-store";
import { useLogout } from "@/lib/hooks/use-auth";

const navVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
};

const navItemVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.2, ease: "easeOut" } },
} as const;

export function LearnerSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

  const handleLogout = () => {
    authApi.logout();
    logout();
  };

  const routes = [
    { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
    { href: "/analysis", label: "Analysis", icon: "analytics" },
    { href: "/ai-advisor", label: "AI Coach", icon: "smart_toy" },
    { href: "/resources", label: "Resources", icon: "library_books" },
    { href: "/profile", label: "Profile", icon: "person" },
  ];

  return (
    <div className="hidden lg:flex flex-col w-64 border-r h-full bg-card">
      <div className="flex flex-col flex-1 p-6 gap-6">
        {/* Logo/Brand */}
        <div className="flex items-center gap-3 pb-4">
          <Link
            href="/"
            className="flex items-center justify-center p-1.5 text-muted-foreground hover:bg-zinc-100 hover:text-zinc-900 rounded-lg transition-all duration-150"
            title="Back to Home"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </Link>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <span className="material-symbols-outlined text-[20px]">school</span>
          </div>
          <span className="font-display text-base font-bold text-foreground">IELTS-MN</span>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3 pb-6 border-b">
          <div className="relative">
            <Avatar className="h-12 w-12 border-2 border-primary/30">
              <AvatarImage
                src={user?.avatarUrl}
                alt={user?.fullName || user?.email || "User"}
              />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {(user?.fullName || user?.email || "U").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-card" />
          </div>

          <div className="flex flex-col flex-1 overflow-hidden">
            <h1 className="text-sm font-semibold text-foreground truncate">
              {user?.fullName || user?.email || "Loading..."}
            </h1>
            <p className="text-xs text-muted-foreground capitalize">
              {user?.role || "Learner"}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <motion.div
          className="flex flex-col gap-1"
          variants={navVariants}
          initial="hidden"
          animate="visible"
        >
          {routes.map((route) => {
            const isActive = pathname === route.href;
            return (
              <motion.div key={route.href} variants={navItemVariants}>
                <Link
                  href={route.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150",
                    isActive
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground font-medium",
                  )}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {route.icon}
                  </span>
                  <span className="text-sm">{route.label}</span>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Bottom Actions */}
        <div className="mt-auto flex flex-col gap-2">
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 border border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-150"
          >
            <span className="material-symbols-outlined text-sm">logout</span>
            <span className="text-sm font-medium">Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
