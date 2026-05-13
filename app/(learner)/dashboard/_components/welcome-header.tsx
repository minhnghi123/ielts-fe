"use client";

import { motion } from "framer-motion";

interface Props {
  userName: string;
}

export function WelcomeHeader({ userName }: Props) {
  const firstName = userName?.split(/[\s@]/)[0] || "there";

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good Morning" :
      hour < 17 ? "Good Afternoon" :
        "Good Evening";

  return (
    <motion.div
      className="flex flex-col gap-2"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
        {greeting}, {firstName}
      </h1>
      <p className="font-body text-sm text-muted-foreground">
        Ready to improve your band score today? Choose a module to begin practice.
      </p>
    </motion.div>
  );
}
