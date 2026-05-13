"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  shimmer?: boolean;
}

export function Skeleton({ className, shimmer = true, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-md bg-muted",
        shimmer && "relative overflow-hidden after:absolute after:inset-0 after:translate-x-[-100%] after:bg-gradient-to-r after:from-transparent after:via-white/40 after:to-transparent after:animate-shimmer",
        className
      )}
      {...props}
    />
  );
}

// Stat card skeleton
export function StatCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-6 space-y-3">
      <div className="flex justify-between items-start">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <Skeleton className="h-4 w-32 mt-3" />
      <Skeleton className="h-8 w-16" />
    </div>
  );
}

// Module card skeleton
export function ModuleCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-8 space-y-6 min-h-[280px] flex flex-col justify-between">
      <div className="space-y-4">
        <Skeleton className="h-14 w-14 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56" />
          <Skeleton className="h-4 w-32 mt-2" />
        </div>
      </div>
      <div className="pt-6 border-t border-border space-y-3">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-12" />
        </div>
        <Skeleton className="h-1.5 w-full rounded-full" />
        <Skeleton className="h-9 w-full rounded-lg" />
      </div>
    </div>
  );
}

// Test card skeleton (for tests browse page)
export function TestCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card overflow-hidden flex flex-col">
      <Skeleton className="h-1.5 w-full rounded-none" />
      <div className="p-6 flex flex-col gap-4 flex-1">
        <div className="flex items-start justify-between gap-3">
          <Skeleton className="h-11 w-11 rounded-xl flex-shrink-0" />
          <Skeleton className="h-6 w-20 rounded-full ml-auto" />
        </div>
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-8 w-full rounded-md" />
      </div>
    </div>
  );
}

// Analysis skill card skeleton
export function SkillBandCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-5 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-8 w-12 rounded-lg" />
      </div>
      <div className="space-y-1.5">
        <div className="flex justify-between">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-8" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>
    </div>
  );
}

// Dashboard section skeleton (for full page loading)
export function DashboardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* Welcome header skeleton */}
      <div className="rounded-2xl border bg-card p-6 flex items-center gap-5">
        <Skeleton className="h-16 w-16 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>

      {/* Stat cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Module grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <ModuleCardSkeleton key={i} />
        ))}
      </div>
    </motion.div>
  );
}

// Table row skeleton
export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <Skeleton className={`h-4 ${i === 0 ? "w-48" : i === cols - 1 ? "w-16 ml-auto" : "w-24"}`} />
        </td>
      ))}
    </tr>
  );
}
