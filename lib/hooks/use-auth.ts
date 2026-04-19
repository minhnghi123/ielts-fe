import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth';
import { queryKeys } from '@/lib/query-keys';
import { useAuthStore } from '@/stores/auth-store';

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Fetch the current user profile from the API.
 * staleTime: Infinity — profile data rarely changes mid-session.
 */
export function useProfile() {
    return useQuery({
        queryKey: queryKeys.auth.profile(),
        queryFn: () => authApi.getProfile(),
        staleTime: Infinity,
        retry: false,
    });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/** Login mutation — sets Zustand user on success. */
export function useLoginMutation() {
    const setUser = useAuthStore((s) => s.setUser);

    return useMutation({
        mutationFn: authApi.login,
        onSuccess: (data) => {
            if (data?.data?.user) {
                setUser(data.data.user as any);
            }
        },
    });
}

/** Register mutation. */
export function useRegisterMutation() {
    return useMutation({
        mutationFn: authApi.register,
    });
}

/** Google OAuth mutation — sets Zustand user on success. */
export function useGoogleAuthMutation() {
    const setUser = useAuthStore((s) => s.setUser);

    return useMutation({
        mutationFn: authApi.google,
        onSuccess: (data) => {
            if (data?.data?.user) {
                setUser(data.data.user as any);
            }
        },
    });
}

/** Logout — clears store + all cached queries. */
export function useLogout() {
    const queryClient = useQueryClient();
    const logout = useAuthStore((s) => s.logout);

    return () => {
        queryClient.clear();
        logout();
    };
}
