"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { authApi } from "@/lib/api/auth";
import { useAuth } from "@/contexts/auth-context";

export default function AuthGoogleCallbackPage() {
    const router = useRouter();
    const { setUser } = useAuth();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const handleGoogleAuth = async () => {
            try {
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();

                if (sessionError) throw sessionError;

                if (!session?.access_token) {
                    throw new Error("No access token found from Supabase");
                }

                // Send the Supabase access token to our backend
                const response = await authApi.google(session.access_token);

                if (response?.data?.accessToken) {
                    const user = response.data.user as any;
                    setUser(user);

                    if (user.role === "admin") {
                        router.push("/admin");
                    } else {
                        router.push("/");
                    }
                } else {
                    throw new Error("Login failed to return access token from backend");
                }
            } catch (err: any) {
                console.error("Google Auth Error:", err);
                setError(err.message || "An error occurred during Google authentication");
            }
        };

        handleGoogleAuth();
    }, [router, setUser]);

    if (error) {
        return (
            <div className="w-full h-screen flex flex-col items-center justify-center bg-background">
                <h1 className="text-2xl font-bold text-red-500 mb-4">Authentication Error</h1>
                <p className="text-muted-foreground">{error}</p>
                <button
                    onClick={() => router.push('/login')}
                    className="mt-6 px-4 py-2 bg-primary text-primary-foreground rounded-md"
                >
                    Return to Login
                </button>
            </div>
        );
    }

    return (
        <div className="w-full h-screen flex flex-col items-center justify-center bg-background space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-muted-foreground animate-pulse text-sm font-medium">
                Authenticating with Google...
            </p>
        </div>
    );
}
