"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"; // Import Avatar Shadcn

export function LearnerSidebar() {
  const pathname = usePathname();

  const routes = [
    { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
    { href: "/practice", label: "Practice Tests", icon: "book_2" },
    { href: "/analysis", label: "Results Analysis", icon: "bar_chart" },
    { href: "/schedule", label: "Schedule", icon: "calendar_month" },
  ];

  return (
    <div className="hidden lg:flex flex-col w-[280px] border-r h-full bg-background">
      <div className="flex flex-col flex-1 p-6 gap-6">
        {/* --- PHẦN USER PROFILE (Đã thêm lại) --- */}
        <div className="flex items-center gap-3 pb-6 border-b">
          <div className="relative">
            <Avatar className="h-12 w-12 border-2 border-background">
              {/* Bạn thay link ảnh thật vào src nhé */}
              <AvatarImage
                src="https://github.com/shadcn.png"
                alt="Alex Johnson"
              />
              <AvatarFallback>AJ</AvatarFallback>
            </Avatar>
            {/* Online Status Dot */}
            <div className="absolute bottom-0 right-0 size-3 rounded-full bg-green-500 border-2 border-background"></div>
          </div>

          <div className="flex flex-col">
            <h1 className="text-sm font-semibold text-foreground">
              Alex Johnson
            </h1>
            <p className="text-xs text-muted-foreground">Standard Plan</p>
          </div>
        </div>
        {/* --------------------------------------- */}

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
          <Link
            href="/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <span className="material-symbols-outlined text-[24px]">
              settings
            </span>
            <span className="text-sm font-medium">Settings</span>
          </Link>

          <button className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 border text-foreground hover:bg-accent transition-colors">
            <span className="material-symbols-outlined text-sm">logout</span>
            <span className="text-sm font-medium">Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
