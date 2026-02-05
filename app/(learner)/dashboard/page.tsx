import { WelcomeHeader } from "./_components/welcome-header";
import { StatOverview } from "./_components/stat-overview";
import { ModuleGrid } from "./_components/module-grid";

export default function DashboardPage() {
  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full flex flex-col gap-10">
      <WelcomeHeader />
      <StatOverview />

      <div className="flex flex-col gap-6">
        <h2 className="text-xl font-bold">Select Test Module</h2>
        <ModuleGrid />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Recent Activity</h2>
            <button className="text-sm text-primary font-medium hover:underline">View All</button>
          </div>
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-white dark:bg-card border rounded-xl shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center">
                    <span className="material-symbols-outlined">headphones</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Listening Practice Test {i}</h4>
                    <p className="text-xs text-muted-foreground">Completed 2 hours ago</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">8.5</p>
                  <p className="text-xs text-muted-foreground">Band Score</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Tip */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold">Daily Tip</h2>
          <div className="bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 p-6 rounded-2xl">
            <div className="flex items-center gap-2 mb-3 text-amber-700 dark:text-amber-500">
              <span className="material-symbols-outlined">lightbulb</span>
              <span className="font-bold uppercase tracking-wider text-xs">Reading Tip</span>
            </div>
            <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100 mb-2">Synonyms are key!</h3>
            <p className="text-amber-800 dark:text-amber-200/80 text-sm leading-relaxed">
              In the Reading test, the text will rarely use the exact words from the question. Look for synonyms and paraphrasing to find the correct answer.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
