import { HeroSection } from "./_components/hero-section";
import { HomeStats } from "./_components/home-stats";
import { RecentActivity } from "./_components/recent-activity";
import { Recommendations } from "./_components/recommendations";

export default function HomePage() {
  return (
    <div className="space-y-2">
      <HeroSection />

      <HomeStats />

      {/* Grid Layout: 2 cột Activity (rộng) + 1 cột Recommend (hẹp) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-10">
        <div className="lg:col-span-2">
          <RecentActivity />
        </div>

        <div className="flex flex-col">
          <Recommendations />
        </div>
      </div>
    </div>
  );
}
