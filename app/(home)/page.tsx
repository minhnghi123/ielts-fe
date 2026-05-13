"use client";

import { motion } from "framer-motion";
import { HeroSection } from "./_components/hero-section";
import { HomeStats } from "./_components/home-stats";
import { RecentActivity } from "./_components/recent-activity";
import { Recommendations } from "./_components/recommendations";

export default function HomePage() {
  return (
    <motion.div
      className="space-y-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      <HeroSection />

      <HomeStats />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-10">
        <div className="lg:col-span-2">
          <RecentActivity />
        </div>

        <div className="flex flex-col">
          <Recommendations />
        </div>
      </div>
    </motion.div>
  );
}
