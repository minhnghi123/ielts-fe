import { Button } from "@/components/ui/button";

export function Recommendations() {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-bold">Recommended for You</h2>

      <RecommendCard
        icon="edit_note"
        color="blue"
        title="Task 2 Writing Mastery"
        desc="Based on your last writing score of 6.5. Improve your cohesion."
        tag="45 min lesson"
      />
      <RecommendCard
        icon="record_voice_over"
        color="orange"
        title="Part 3 Speaking Strategies"
        desc="Learn how to extend your answers and use complex grammar."
        tag="Live Workshop"
      />
      <RecommendCard
        icon="menu_book"
        color="green"
        title="Advanced Vocabulary Quiz"
        desc="100+ high-frequency academic words for Band 8.0+ candidates."
        tag="Quick Drill"
      />

      {/* Promo Card */}
      <div className="bg-gradient-to-br from-primary to-blue-700 p-6 rounded-xl text-white shadow-lg mt-2">
        <h4 className="text-xl font-bold mb-2">Book Your Real Exam</h4>
        <p className="text-white/80 text-sm mb-4 leading-relaxed">
          You are ready! Experts suggest booking your exam while your scores are
          consistently high.
        </p>
        <Button className="bg-white text-primary hover:bg-white/90 font-bold w-full border-none shadow-sm">
          Find Test Centers
        </Button>
      </div>
    </div>
  );
}

function RecommendCard({ icon, color, title, desc, tag }: any) {
  const styles: any = {
    blue: {
      bg: "bg-primary/10",
      text: "text-primary",
      groupHover: "group-hover:bg-primary",
    },
    orange: {
      bg: "bg-orange-100 dark:bg-orange-900/30",
      text: "text-orange-600",
      groupHover: "group-hover:bg-orange-600",
    },
    green: {
      bg: "bg-green-100 dark:bg-green-900/30",
      text: "text-green-600",
      groupHover: "group-hover:bg-green-600",
    },
  };

  const s = styles[color];

  return (
    <div className="bg-white dark:bg-[#151c2a] p-5 rounded-xl border border-border shadow-sm hover:border-primary transition-colors cursor-pointer group">
      <div className="flex items-start gap-4">
        <div
          className={`p-3 rounded-lg transition-all ${s.bg} ${s.text} ${s.groupHover} group-hover:text-white`}
        >
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <div>
          <h4 className="font-bold mb-1 text-sm md:text-base">{title}</h4>
          <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
            {desc}
          </p>
          <p
            className={`mt-3 text-[10px] md:text-xs font-bold uppercase tracking-widest ${s.text}`}
          >
            {tag}
          </p>
        </div>
      </div>
    </div>
  );
}
