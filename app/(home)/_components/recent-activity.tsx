import { Card } from "@/components/ui/card";

export function RecentActivity() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold">Recent Activity</h2>
        <a href="#" className="text-primary text-sm font-bold hover:underline">
          View All History
        </a>
      </div>

      <Card className="overflow-hidden border-border bg-white dark:bg-[#151c2a]">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-border">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase">
                Test Name
              </th>
              <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase hidden sm:table-cell">
                Date
              </th>
              <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase">
                Focus Area
              </th>
              <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase">
                Score
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            <ActivityRow
              name="Mock Test #14"
              date="Oct 24, 2023"
              tag="Listening"
              score="8.5"
              color="blue"
            />
            <ActivityRow
              name="Daily Exercise #112"
              date="Oct 22, 2023"
              tag="Reading"
              score="7.0"
              color="purple"
            />
            <ActivityRow
              name="Speaking Drill"
              date="Oct 21, 2023"
              tag="Speaking"
              score="7.5"
              color="orange"
            />
            <ActivityRow
              name="Full Mock Exam A"
              date="Oct 18, 2023"
              tag="Full Test"
              score="7.5"
              color="green"
            />
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function ActivityRow({ name, date, tag, score, color }: any) {
  const colors: any = {
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    purple:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    orange:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
    green:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  };
  return (
    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
      <td className="px-6 py-4 font-semibold text-sm">{name}</td>
      <td className="px-6 py-4 text-sm text-muted-foreground hidden sm:table-cell">
        {date}
      </td>
      <td className="px-6 py-4">
        <span
          className={`${colors[color]} px-3 py-1 rounded-full text-xs font-medium`}
        >
          {tag}
        </span>
      </td>
      <td className="px-6 py-4 font-bold text-primary">{score}</td>
    </tr>
  );
}
