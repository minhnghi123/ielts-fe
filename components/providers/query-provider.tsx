"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

/**
 * QueryProvider — wraps the app with TanStack Query's client.
 *
 * The QueryClient is created once per component lifecycle using useState
 * (not a module-level singleton) so it's SSR-safe and each request gets
 * its own isolated client on the server.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data is considered fresh for 30 seconds by default.
            staleTime: 30_000,
            // Retry failed requests once before surfacing the error.
            retry: 1,
            // Refetch when the window regains focus (great for dashboards).
            refetchOnWindowFocus: true,
          },
          mutations: {
            // Don't retry mutations — they can have side effects.
            retry: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools: only rendered in development builds */}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
      )}
    </QueryClientProvider>
  );
}
