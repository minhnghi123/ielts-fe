"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useAnalyticsDashboard } from "@/lib/hooks/use-analytics";

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
} as const;

const SKILL_ICON: Record<string, string> = {
  listening: "headphones",
  reading: "menu_book",
  writing: "edit_note",
  speaking: "record_voice_over",
};

/**
 * "Recommended for You" is driven by the analytics-service adaptive study plan
 * (weakest skills + weakest question types). Visitors who are not signed in or
 * have no attempts yet get a getting-started path instead of fake data.
 */
export function Recommendations() {
  const router = useRouter();
  const { user, isLoggedIn } = useAuth();
  const learnerId = (user as any)?.profileId || user?.id;
  const { data, isLoading } = useAnalyticsDashboard(isLoggedIn ? learnerId : undefined);

  const plan = (data?.adaptiveStudyPlan ?? []).slice(0, 3);
  const hasHistory = (data?.totalAttempts ?? 0) > 0;

  const cards = hasHistory && plan.length > 0
    ? plan.map((task) => {
        const skill = (task.focusArea || "").toLowerCase().split(/[^a-z]/)[0];
        return {
          icon: SKILL_ICON[skill] ?? "target",
          title: task.title,
          desc: task.recommendation,
          tag: task.priority === "high" ? "Priority" : task.priority === "medium" ? "Next up" : "Keep sharp",
          href: SKILL_ICON[skill] ? `/tests?skill=${skill}` : "/tests",
        };
      })
    : [
        { icon: "headphones", title: "Take a Listening diagnostic", desc: "30 minutes, 40 questions — the fastest way to find your starting band.", tag: "Start here", href: "/tests?skill=listening" },
        { icon: "menu_book", title: "Try an Academic Reading test", desc: "Three passages with the full range of IELTS question types.", tag: "60 min", href: "/tests?skill=reading" },
        { icon: "edit_note", title: "Get AI feedback on an essay", desc: "Write Task 1 & Task 2 and receive band scores per criterion with corrections.", tag: "AI graded", href: "/tests?skill=writing" },
      ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Recommended for You</h2>
        {hasHistory && (
          <span className="text-xs text-muted-foreground">
            Based on {data?.totalAttempts} attempt{data?.totalAttempts === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3" aria-busy="true">
          {[0, 1, 2].map((i) => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : (
        <motion.div className="flex flex-col gap-3" variants={container} initial="hidden" animate="visible">
          {cards.map((c) => (
            <motion.div key={c.title} variants={item}>
              <RecommendCard icon={c.icon} title={c.title} desc={c.desc} tag={c.tag} onClick={() => router.push(c.href)} />
            </motion.div>
          ))}
          <motion.div variants={item}>
            <div className="bg-primary rounded-xl p-5 text-white">
              <h4 className="font-semibold text-sm text-white mb-1">
                {hasHistory ? "See your full study plan" : "Ready for the real exam?"}
              </h4>
              <p className="text-xs text-white/75 mb-3 leading-relaxed">
                {hasHistory
                  ? "Band history, question-type mastery and the mistakes you repeat most."
                  : "Book your test when your scores are consistently above your target band."}
              </p>
              <Button
                size="sm"
                onClick={() => hasHistory ? router.push("/dashboard") : window.open("https://ielts.org", "_blank")}
                className="w-full text-xs bg-white text-primary hover:bg-white/90"
              >
                {hasHistory ? "Open Dashboard" : "Find Test Centers"}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

function RecommendCard({ icon, title, desc, tag, onClick }: {
  icon: string;
  title: string;
  desc: string;
  tag: string;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="bg-card p-4 rounded-xl border border-zinc-200 hover:border-zinc-300 transition-all duration-150 cursor-pointer group"
    >
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors duration-150 flex-shrink-0">
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-zinc-950 mb-0.5">{title}</h4>
          <p className="text-xs text-zinc-500 leading-relaxed">{desc}</p>
          <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">{tag}</p>
        </div>
      </div>
    </div>
  );
}
