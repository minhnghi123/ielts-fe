"use client";

/**
 * Backward-compatibility shim for the old AuthContext.
 *
 * Any component that still imports from "@/contexts/auth-context" will
 * transparently receive the Zustand store instead — zero refactoring needed.
 *
 * New code should import directly from "@/stores/auth-store".
 */
export type { AuthUser } from '@/stores/auth-store';
export { useAuthStore, useUser, useIsLoggedIn } from '@/stores/auth-store';

// Re-export useAuth as an alias for useAuthStore so existing consumers
// (useAuth()) continue to compile without any import changes.
export { useAuthStore as useAuth } from '@/stores/auth-store';

// AuthProvider is now a no-op passthrough — the Zustand store is global.
// Keep it exported so layout.tsx doesn't break if it still wraps children.
import type { ReactNode } from 'react';
export function AuthProvider({ children }: { children: ReactNode }) {
    return children as React.ReactElement;
}
