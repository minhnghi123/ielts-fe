"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, x: -6 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.2, ease: "easeOut" } },
} as const;

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <motion.nav
      aria-label="breadcrumb"
      className={cn("flex items-center gap-1 text-sm", className)}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <motion.div key={index} variants={itemVariants} className="flex items-center gap-1">
            {index > 0 && (
              <span className="material-symbols-outlined text-[14px] text-muted-foreground/50 select-none">
                chevron_right
              </span>
            )}
            {isLast ? (
              <span className="flex items-center gap-1.5 font-semibold text-foreground">
                {item.icon && (
                  <span className="material-symbols-outlined text-[14px] text-primary">{item.icon}</span>
                )}
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href ?? "#"}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors duration-150"
              >
                {item.icon && (
                  <span className="material-symbols-outlined text-[14px]">{item.icon}</span>
                )}
                {item.label}
              </Link>
            )}
          </motion.div>
        );
      })}
    </motion.nav>
  );
}
