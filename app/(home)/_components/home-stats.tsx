import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function HomeStats() {
  return (
    <section className="mb-10">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">
          analytics
        </span>{" "}
        Quick Stats
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <StatCard title="Practice Hours" value="42.5h" badge="+12% this week" />

        {/* Card 2 - Primary Color */}
        <StatCard
          title="Avg. Band Score"
          value="7.5"
          badge="+0.5 target trend"
          isPrimary
        />

        {/* Card 3 */}
        <StatCard
          title="Tests Completed"
          value="12"
          badge="+2 new mock tests"
        />

        {/* Card 4 - Progress Bar */}
        <Card className="p-6 border-border shadow-sm bg-white dark:bg-[#151c2a]">
          <p className="text-muted-foreground text-sm font-medium mb-1">
            Exam Readiness
          </p>
          <div className="flex flex-col gap-2 mt-2">
            <div className="flex justify-between items-end">
              <p className="text-3xl font-bold">82%</p>
            </div>
            <Progress value={82} className="h-2" />
          </div>
        </Card>
      </div>
    </section>
  );
}

// Sub-component nhỏ dùng nội bộ file này
function StatCard({
  title,
  value,
  badge,
  isPrimary,
}: {
  title: string;
  value: string;
  badge: string;
  isPrimary?: boolean;
}) {
  return (
    <Card className="p-6 border-border shadow-sm bg-white dark:bg-[#151c2a]">
      <p className="text-muted-foreground text-sm font-medium mb-1">{title}</p>
      <div className="flex items-end justify-between mt-1">
        <p className={`text-3xl font-bold ${isPrimary ? "text-primary" : ""}`}>
          {value}
        </p>
        <span className="text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap">
          {badge}
        </span>
      </div>
    </Card>
  );
}
