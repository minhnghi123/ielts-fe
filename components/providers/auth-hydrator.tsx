"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";

/**
 * AuthHydrator — a zero-render client component that populates the Zustand
 * auth store from the `user` cookie on the very first client render.
 *
 * Why a separate component?
 * - The root layout is a Server Component, so it can't call useEffect.
 * - This tiny client island is the minimal surface area needed to bridge
 *   the server-set cookie → client Zustand store.
 */
export function AuthHydrator() {
  const hydrateFromCookie = useAuthStore((s) => s.hydrateFromCookie);

  useEffect(() => {
    hydrateFromCookie();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Renders nothing — this component exists purely for its side effect.
  return null;
}
