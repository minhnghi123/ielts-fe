"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, LogOut, Menu, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface NavRoute {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

interface SideNavProps {
  brand: string;
  brandIcon: LucideIcon;
  routes: NavRoute[];
  user: { fullName?: string | null; email?: string | null; avatarUrl?: string | null } | null | undefined;
  roleLabel: string;
  onLogout: () => void;
  homeHref?: string;
  footer?: React.ReactNode;
}

/**
 * Khung điều hướng dùng chung cho học viên / giáo viên / admin:
 * ≥ lg: sidebar cố định 256px; < lg: thanh trên cùng + ngăn kéo (drawer) đóng khi đổi trang.
 */
export function SideNav({ brand, brandIcon: BrandIcon, routes, user, roleLabel, onLogout, homeHref = "/", footer }: SideNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const isActive = (r: NavRoute) => (r.exact ? pathname === r.href : pathname === r.href || pathname.startsWith(r.href + "/"));
  const displayName = user?.fullName || user?.email || "…";
  const initial = (user?.fullName || user?.email || "?").charAt(0).toUpperCase();

  const navList = (
    <nav className="flex flex-col gap-1" aria-label="Điều hướng chính">
      {routes.map((r) => {
        const active = isActive(r);
        return (
          <Link
            key={r.href}
            href={r.href}
            aria-current={active ? "page" : undefined}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
              active ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <r.icon className="h-[18px] w-[18px]" aria-hidden />
            {r.label}
          </Link>
        );
      })}
    </nav>
  );

  const profile = (
    <div className="flex items-center gap-3 border-b border-border pb-5">
      <Avatar className="h-10 w-10">
        <AvatarImage src={user?.avatarUrl ?? undefined} alt={displayName} />
        <AvatarFallback className="bg-primary/10 text-primary">{initial}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{displayName}</p>
        <p className="text-xs text-muted-foreground">{roleLabel}</p>
      </div>
    </div>
  );

  const bottom = (
    <div className="mt-auto flex flex-col gap-1">
      {footer}
      <button
        type="button"
        onClick={onLogout}
        className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <LogOut className="h-[18px] w-[18px]" aria-hidden />
        Đăng xuất
      </button>
    </div>
  );

  return (
    <>
      {/* Thanh trên cùng (mobile/tablet) */}
      <header className="flex items-center justify-between border-b border-border bg-card px-3 py-2 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Mở menu"
          aria-expanded={open}
          className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="text-sm font-semibold">{brand}</span>
        <Avatar className="h-8 w-8">
          <AvatarImage src={user?.avatarUrl ?? undefined} alt={displayName} />
          <AvatarFallback className="bg-primary/10 text-xs text-primary">{initial}</AvatarFallback>
        </Avatar>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button type="button" aria-label="Đóng menu" className="absolute inset-0 bg-foreground/30" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col gap-5 bg-card p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">{brand}</span>
              <button type="button" onClick={() => setOpen(false)} aria-label="Đóng menu" className="rounded-md p-2 text-muted-foreground hover:bg-accent">
                <X className="h-5 w-5" />
              </button>
            </div>
            {profile}
            {navList}
            {bottom}
          </div>
        </div>
      )}

      {/* Sidebar (desktop) */}
      <aside className="hidden h-full w-64 flex-col border-r border-border bg-card lg:flex">
        <div className="flex flex-1 flex-col gap-6 p-6">
          <div className="flex items-center gap-3">
            <Link href={homeHref} title="Về trang chủ" className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground">
              <ArrowLeft className="h-[18px] w-[18px]" aria-hidden />
            </Link>
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
              <BrandIcon className="h-[18px] w-[18px]" aria-hidden />
            </span>
            <span className="text-base font-semibold">{brand}</span>
          </div>
          {profile}
          {navList}
          {bottom}
        </div>
      </aside>
    </>
  );
}
