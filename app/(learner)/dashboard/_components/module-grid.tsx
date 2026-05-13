"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ModuleCardSkeleton } from "@/components/ui/skeleton";
import type { TestAttempt } from "@/lib/types";

interface Props {
  testCounts: Record<string, number>;
  attempts: TestAttempt[];
  loading: boolean;
}

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const cardVariant = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.25, ease: "easeOut" } },
} as const;

const themeConfig: Record<string, {
  iconBg: string; iconColor: string; progressBg: string; badgeColor: string;
}> = {
  listening: {
    iconBg: "bg-blue-100 group-hover:bg-blue-200",
    iconColor: "text-blue-600",
    progressBg: "bg-blue-500",
    badgeColor: "text-blue-500",
  },
  reading: {
    iconBg: "bg-emerald-100 group-hover:bg-emerald-200",
    iconColor: "text-emerald-600",
    progressBg: "bg-emerald-500",
    badgeColor: "text-emerald-500",
  },
  writing: {
    iconBg: "bg-amber-100 group-hover:bg-amber-200",
    iconColor: "text-amber-600",
    progressBg: "bg-amber-500",
    badgeColor: "text-amber-500",
  },
  speaking: {
    iconBg: "bg-violet-100 group-hover:bg-violet-200",
    iconColor: "text-violet-600",
    progressBg: "bg-violet-500",
    badgeColor: "text-violet-500",
  },
};

export function ModuleGrid({ testCounts, attempts, loading }: Props) {
  const router = useRouter();

  function masteryForSkill(skill: string): number {
    const graded = attempts.filter(
      a => (a.test as any)?.skill === skill && Number(a.bandScore ?? 0) > 0,
    );
    if (graded.length === 0) return 0;
    const avg = graded.reduce((s, a) => s + Number(a.bandScore ?? 0), 0) / graded.length;
    return Math.round((avg / 9) * 100);
  }

  const modules = [
    {
      id: "listening",
      title: "Listening Module",
      info: "30 mins · 4 Sections · 40 Questions",
      icon: "headphones",
    },
    {
      id: "reading",
      title: "Reading Module",
      info: "60 mins · 3 Passages · 40 Questions",
      icon: "menu_book",
    },
    {
      id: "writing",
      title: "Writing Module",
      info: "60 mins · 2 Tasks · Academic / General",
      icon: "edit_note",
    },
    {
      id: "speaking",
      title: "Speaking Module",
      info: "11–14 mins · 3 Parts · One-on-one",
      icon: "record_voice_over",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <ModuleCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 gap-6"
      variants={container}
      initial="hidden"
      animate="visible"
    >
      {modules.map(module => {
        const theme = themeConfig[module.id];
        const available = loading ? "—" : String(testCounts[module.id] ?? 0);
        const mastery = masteryForSkill(module.id);

        return (
          <motion.div
            key={module.id}
            variants={cardVariant}
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.15 }}
          >
            <Card className="group flex flex-col justify-between min-h-[280px] hover:shadow-md transition-all duration-150 h-full">
              <CardContent className="p-8 flex flex-col justify-between h-full">
                <div className="flex flex-col gap-6">
                  {/* Icon */}
                  <div className={`w-fit p-3 rounded-xl transition-colors duration-150 ${theme.iconBg} ${theme.iconColor}`}>
                    <span className="material-symbols-outlined text-[28px]">{module.icon}</span>
                  </div>

                  {/* Title & Info */}
                  <div>
                    <h3 className="font-display text-xl font-semibold text-foreground mb-2">{module.title}</h3>
                    <p className="text-muted-foreground mb-4">{module.info}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className={`material-symbols-outlined text-[18px] ${theme.badgeColor}`}>check_circle</span>
                      <span>{available} {available === "1" ? "test" : "tests"} available</span>
                    </div>
                  </div>
                </div>

                {/* Progress */}
                <div className="mt-6 pt-6 border-t border-border">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium text-muted-foreground">Mastery Level</span>
                    <span className="text-sm font-bold text-foreground">
                      {loading ? "—" : mastery > 0 ? `${mastery}%` : "Not started"}
                    </span>
                  </div>

                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${theme.progressBg}`}
                      style={{ width: `${loading ? 0 : mastery}%` }}
                    />
                  </div>

                  <Button
                    onClick={() => router.push(`/tests`)}
                    className="mt-4 w-full font-semibold"
                  >
                    <span>Start {module.title.split(" ")[0]} Test</span>
                    <span className="material-symbols-outlined ml-2 text-[18px]">arrow_forward</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
