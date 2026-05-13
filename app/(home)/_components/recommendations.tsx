"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
} as const;

export function Recommendations() {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold">Recommended for You</h2>

      <motion.div className="flex flex-col gap-3" variants={container} initial="hidden" animate="visible">
        <motion.div variants={item}>
          <RecommendCard
            icon="edit_note"
            title="Task 2 Writing Mastery"
            desc="Based on your last writing score of 6.5. Improve your cohesion."
            tag="45 min lesson"
            onClick={() => router.push("/tests?skill=writing")}
          />
        </motion.div>
        <motion.div variants={item}>
          <RecommendCard
            icon="record_voice_over"
            title="Part 3 Speaking Strategies"
            desc="Learn how to extend your answers and use complex grammar."
            tag="Live Workshop"
            onClick={() => router.push("/tests?skill=speaking")}
          />
        </motion.div>
        <motion.div variants={item}>
          <RecommendCard
            icon="menu_book"
            title="Advanced Vocabulary Quiz"
            desc="100+ high-frequency academic words for Band 8.0+ candidates."
            tag="Quick Drill"
            onClick={() => router.push("/tests?skill=reading")}
          />
        </motion.div>
        <motion.div variants={item}>
          <div className="bg-gradient-to-br from-primary to-blue-700 rounded-xl p-5 text-white">
            <h4 className="font-semibold text-sm text-white mb-1">Ready for the real exam?</h4>
            <p className="text-xs text-white/75 mb-3 leading-relaxed">
              Book your test when your scores are consistently above your target band.
            </p>
            <Button
              size="sm"
              onClick={() => window.open("https://ielts.org", "_blank")}
              className="w-full text-xs bg-white text-primary hover:bg-white/90"
            >
              Find Test Centers
            </Button>
          </div>
        </motion.div>
      </motion.div>
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
