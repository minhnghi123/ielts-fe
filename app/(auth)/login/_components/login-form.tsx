"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { authApi } from "@/lib/api/auth";
import { useAuth } from "@/contexts/auth-context";
import { Suspense } from "react";
import { supabase } from "@/lib/supabase/client";

export function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({ email: "", password: "" });

  const registered = searchParams.get("registered");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await authApi.login(formData);

      if (response?.data?.accessToken) {
        const user = response.data.user as {
          id: string;
          email: string;
          role: "learner" | "admin";
          profileId: string;
        };

        // Update AuthContext in-memory so navbar switches immediately
        setUser(user);

        // Role-based redirect (full navigation so middleware also picks up cookies)
        if (user.role === "admin") {
          router.push("/admin");
        } else {
          router.push("/");
        }
      } else {
        setError("Unexpected response from server. Please try again.");
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError(
        err.response?.data?.message ||
        err.response?.data?.error?.message ||
        "Login failed. Please check your credentials.",
      );
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/google/callback`,
      },
    });

    if (error) {
      console.error(error);
      setError("Failed to initialize Google Login.");
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-[420px] border-none shadow-none bg-transparent relative z-10">
      <CardHeader className="space-y-1 mb-4 px-0">
        {/* Mobile-only Logo (hidden on lg) */}
        <div className="flex lg:hidden items-center gap-2 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="material-symbols-outlined">school</span>
          </div>
          <span className="text-xl font-bold">IELTS Master</span>
        </div>

        <CardTitle className="text-3xl font-bold tracking-tight">
          Welcome back
        </CardTitle>
        <CardDescription className="text-base text-muted-foreground">
          Enter your email to access your account
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        {registered && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 px-4 py-3 rounded-xl text-sm mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">
              check_circle
            </span>
            Registration successful! Please sign in.
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">error</span>
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              className="h-11 rounded-lg"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              className="h-11 rounded-lg"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full h-11 rounded-lg text-base font-medium shadow-md hover:shadow-lg transition-all"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <span className="animate-spin material-symbols-outlined text-lg">
                  progress_activity
                </span>
                Signing In...
              </div>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="px-0 flex flex-col gap-4">
        <div className="relative w-full">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        {/* Social Login */}
        <div className="grid grid-cols-1 gap-3 w-full">
          <Button
            variant="outline"
            className="w-full h-10 rounded-lg"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            type="button"
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.17c-.22-.66-.35-1.36-.35-2.17s.13-1.51.35-2.17V7.66H2.18C1.43 9.17 1 10.86 1 12.63s.43 3.46 1.18 4.97l3.66-2.86.35-.57z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Google
          </Button>
        </div>

        <div className="text-center text-sm pt-4">
          <span className="text-muted-foreground">
            Don&apos;t have an account?{" "}
          </span>
          <Link
            href="/register"
            className="text-primary font-bold hover:underline transition-all"
          >
            Create Account
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}

export function LoginForm() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-[420px] h-[400px] flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}