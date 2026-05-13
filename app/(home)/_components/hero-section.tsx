"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";

export function HeroSection() {
  const router = useRouter();
  const { user, isLoggedIn, loading } = useAuth();

  if (loading) {
    return (
      <section className="mb-10">
        <Card className="overflow-hidden border-zinc-200">
          <div className="px-10 py-12 flex flex-col gap-4 animate-pulse max-w-2xl">
            <div className="h-3 bg-zinc-100 rounded w-1/4 mb-2" />
            <div className="h-8 bg-zinc-100 rounded w-3/4" />
            <div className="h-4 bg-zinc-100 rounded w-full" />
            <div className="h-4 bg-zinc-100 rounded w-2/3" />
            <div className="flex gap-3 mt-2">
              <div className="h-10 bg-zinc-100 rounded w-32" />
              <div className="h-10 bg-zinc-100 rounded w-28" />
            </div>
          </div>
        </Card>
      </section>
    );
  }

  return (
    <section className="mb-10">
      <Card className="overflow-hidden border-zinc-200">
        <motion.div
          className="px-10 py-12 flex flex-col gap-6 bg-card max-w-2xl"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {isLoggedIn ? (
            <>
              <div>
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3">
                  Welcome back
                </p>
                <h1 className="font-display text-3xl font-bold tracking-tight leading-tight text-zinc-950 mb-3">
                  Ready to practise,{" "}
                  <span>{user?.email.split("@")[0]}</span>?
                </h1>
                <p className="text-zinc-500 text-base leading-relaxed">
                  Keep the momentum going. Every session brings you closer to your target band score.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => router.push("/tests")}
                  className="px-6 py-5 text-sm font-semibold"
                >
                  <span className="material-symbols-outlined mr-2 text-[18px]">play_arrow</span>
                  Start Practice
                </Button>
                <Button
                  onClick={() => router.push("/analysis")}
                  variant="outline"
                  className="px-6 py-5 text-sm font-semibold"
                >
                  <span className="material-symbols-outlined mr-2 text-[18px]">analytics</span>
                  View Progress
                </Button>
              </div>
            </>
          ) : (
            <>
              <div>
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3">
                  Trusted by 10,000+ students
                </p>
                <h1 className="font-display text-3xl font-bold tracking-tight leading-tight text-zinc-950 mb-3">
                  Achieve your target IELTS band score.
                </h1>
                <p className="text-zinc-500 text-base leading-relaxed">
                  Practice with real test materials, get instant scores, and track your improvement across all four skills.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => router.push("/register")}
                  className="px-6 py-5 text-sm font-semibold"
                >
                  <span className="material-symbols-outlined mr-2 text-[18px]">rocket_launch</span>
                  Start for Free
                </Button>
                <Button
                  onClick={() => router.push("/tests")}
                  variant="outline"
                  className="px-6 py-5 text-sm font-semibold"
                >
                  Browse Tests
                </Button>
              </div>
            </>
          )}
        </motion.div>
      </Card>
    </section>
  );
}
