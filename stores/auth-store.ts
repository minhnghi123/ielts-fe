import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
    id: string;
    email: string;
    role: 'learner' | 'admin';
    profileId: string;
    fullName?: string;
    avatarUrl?: string;
}

interface AuthState {
    user: AuthUser | null;
    isLoggedIn: boolean;
    loading: boolean;
    // ── Actions ──────────────────────────────────────────────────────────────
    setUser: (user: AuthUser | null) => void;
    logout: () => void;
    hydrateFromCookie: () => void;
}

// ─── Cookie Helpers ───────────────────────────────────────────────────────────

function readUserCookie(): AuthUser | null {
    if (typeof document === 'undefined') return null;
    const raw = document.cookie
        .split(';')
        .reduce((acc, c) => {
            const [k, ...v] = c.trim().split('=');
            if (k) acc[k.trim()] = decodeURIComponent(v.join('='));
            return acc;
        }, {} as Record<string, string>)['user'];
    if (!raw) return null;
    try {
        return JSON.parse(raw) as AuthUser;
    } catch {
        return null;
    }
}

function deleteCookie(name: string) {
    document.cookie = `${name}=; Max-Age=0; path=/`;
}

// ─── Zustand Store ────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isLoggedIn: false,
            loading: true,

            setUser: (user) =>
                set({
                    user,
                    isLoggedIn: !!user,
                    loading: false,
                }),

            logout: () => {
                deleteCookie('accessToken');
                deleteCookie('user');
                set({ user: null, isLoggedIn: false, loading: false });
                if (typeof window !== 'undefined') {
                    window.location.href = '/login';
                }
            },

            /**
             * Read the `user` cookie that was set by authApi.login() and populate
             * the store. Called once on app mount via <AuthHydrator />.
             */
            hydrateFromCookie: () => {
                const user = readUserCookie();
                set({ user, isLoggedIn: !!user, loading: false });
            },
        }),
        {
            name: 'ielts-auth',
            // Use sessionStorage so the store resets on tab close but survives
            // client-side navigation within the same session.
            storage: createJSONStorage(() =>
                typeof window !== 'undefined' ? sessionStorage : ({} as Storage),
            ),
            // Only persist the user object; loading is always derived on mount.
            partialize: (state) => ({ user: state.user }),
        },
    ),
);

// ─── Convenience selector hooks ───────────────────────────────────────────────

/** Returns just the current user. */
export const useUser = () => useAuthStore((s) => s.user);

/** Returns true when a user is authenticated. */
export const useIsLoggedIn = () => useAuthStore((s) => s.isLoggedIn);
