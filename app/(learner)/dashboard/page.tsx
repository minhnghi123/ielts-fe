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
    </div>
  );
}
