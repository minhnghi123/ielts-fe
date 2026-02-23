"use client";

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    ReactNode,
} from "react";

export interface AuthUser {
    id: string;
    email: string;
    role: "learner" | "admin";
    profileId: string;
}

interface AuthContextValue {
    user: AuthUser | null;
    isLoggedIn: boolean;
    loading: boolean;
    logout: () => void;
    setUser: (user: AuthUser | null) => void;
}

const AuthContext = createContext<AuthContextValue>({
    user: null,
    isLoggedIn: false,
    loading: true,
    logout: () => { },
    setUser: () => { },
});

function parseCookies(): Record<string, string> {
    if (typeof document === "undefined") return {};
    return document.cookie.split(";").reduce(
        (acc, c) => {
            const [k, ...v] = c.trim().split("=");
            if (k) acc[k.trim()] = decodeURIComponent(v.join("="));
            return acc;
        },
        {} as Record<string, string>,
    );
}

function deleteCookie(name: string) {
    document.cookie = `${name}=; Max-Age=0; path=/`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const cookies = parseCookies();
        if (cookies.user) {
            try {
                setUser(JSON.parse(cookies.user));
            } catch {
                /* malformed cookie — ignore */
            }
        }
        setLoading(false);
    }, []);

    const logout = useCallback(() => {
        deleteCookie("accessToken");
        deleteCookie("user");
        setUser(null);
        window.location.href = "/login";
    }, []);

    return (
        <AuthContext.Provider
            value={{ user, isLoggedIn: !!user, loading, logout, setUser }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
