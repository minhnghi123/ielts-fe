"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/auth-context";

export function HeroSection() {
  const router = useRouter();
  const { user, isLoggedIn, loading } = useAuth();

  if (loading) {
    return (
      <section className="mb-10">
        <Card className="overflow-hidden border-border shadow-sm">
          <div className="flex flex-col md:flex-row min-h-[240px] animate-pulse">
            <div className="w-full md:w-1/2 bg-muted min-h-[200px]" />
            <div className="w-full md:w-1/2 p-8 flex flex-col gap-4">
              <div className="h-8 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-full" />
              <div className="h-4 bg-muted rounded w-2/3" />
            </div>
          </div>
        </Card>
      </section>
    );
  }

  return (
    <section className="mb-10">
      <Card className="overflow-hidden border-border shadow-sm">
        <div className="flex flex-col md:flex-row">
          {/* Image */}
          <div
            className="w-full md:w-1/2 bg-cover bg-center min-h-[250px]"
            style={{
              backgroundImage:
                'url("https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1771&auto=format&fit=crop")',
            }}
          />

          {/* Content */}
          <div className="w-full md:w-1/2 p-8 flex flex-col justify-center gap-6 bg-white dark:bg-[#151c2a]">
            {isLoggedIn ? (
              /* ── Logged-in hero ─────────────────────────────── */
              <>
                <div>
                  <Badge className="mb-3 bg-primary/10 text-primary border-primary/20">
                    Welcome back 👋
                  </Badge>
                  <h1 className="text-3xl font-black leading-tight mb-3">
                    Ready to practise,{" "}
                    <span className="text-primary">
                      {user?.email.split("@")[0]}
                    </span>
                    ?
                  </h1>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    Keep the momentum going. Every session brings you closer to
                    your target band score.
                  </p>
                </div>
                <div className="flex flex-wrap gap-4">
                  <Button
                    onClick={() => router.push("/tests")}
                    className="bg-primary hover:bg-primary/90 font-bold px-8 py-6 text-base shadow-md shadow-primary/20"
                  >
                    <span className="material-symbols-outlined mr-2">
                      play_arrow
                    </span>
                    Start Practice
                  </Button>
                  <Button
                    onClick={() => router.push("/analysis")}
                    variant="secondary"
                    className="bg-primary/10 text-primary hover:bg-primary/20 font-bold px-8 py-6 text-base"
                  >
                    <span className="material-symbols-outlined mr-2">
                      analytics
                    </span>
                    View Progress
                  </Button>
                </div>
              </>
            ) : (
              /* ── Guest hero ──────────────────────────────────── */
              <>
                <div>
                  <Badge className="mb-3 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">
                    Trusted by 10,000+ students
                  </Badge>
                  <h1 className="text-3xl font-black leading-tight mb-3">
                    Achieve your{" "}
                    <span className="text-primary">target IELTS band</span>{" "}
                    score.
                  </h1>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    Practice with real test materials, get instant scores, and
                    track your improvement across all four skills.
                  </p>
                </div>
                <div className="flex flex-wrap gap-4">
                  <Button
                    onClick={() => router.push("/register")}
                    className="bg-primary hover:bg-primary/90 font-bold px-8 py-6 text-base shadow-md shadow-primary/20"
                  >
                    <span className="material-symbols-outlined mr-2">
                      rocket_launch
                    </span>
                    Start for Free
                  </Button>
                  <Button
                    onClick={() => router.push("/tests")}
                    variant="secondary"
                    className="bg-primary/10 text-primary hover:bg-primary/20 font-bold px-8 py-6 text-base"
                  >
                    Browse Tests
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </Card>
    </section>
  );
}
