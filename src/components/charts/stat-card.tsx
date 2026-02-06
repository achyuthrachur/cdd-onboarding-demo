"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCountUp, useReducedMotion } from "@/lib/animations";

interface StatCardProps {
  title: string;
  value: number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  variant?: "default" | "success" | "warning" | "danger";
  suffix?: string;
  prefix?: string;
  animate?: boolean;
  delay?: number;
}

const variantStyles = {
  default: "text-white",
  success: "text-crowe-teal-bright",
  warning: "text-crowe-amber-bright",
  danger: "text-crowe-coral-bright",
};

const bgStyles = {
  default: "bg-white/5",
  success: "bg-crowe-teal/10",
  warning: "bg-crowe-amber/10",
  danger: "bg-crowe-coral/10",
};

/**
 * Stat Card Component
 * Displays a single metric with optional animation and trend indicator
 */
export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  variant = "default",
  suffix = "",
  prefix = "",
  animate = true,
  delay = 0,
}: StatCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const animatedValue = useCountUp(value, { duration: 1, delay });

  const displayValue = animate && !shouldReduceMotion ? animatedValue : value;

  return (
    <motion.div
      className={cn(
        "p-4 rounded-lg border border-white/10",
        bgStyles[variant]
      )}
      initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1 }}
      whileHover={shouldReduceMotion ? undefined : { scale: 1.02, y: -2 }}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-sm text-white/60">{title}</span>
        {Icon && <Icon className="h-4 w-4 text-white/40" />}
      </div>
      <div className={cn("text-2xl font-bold tabular-nums", variantStyles[variant])}>
        {prefix}
        {displayValue}
        {suffix}
      </div>
      {(subtitle || trendValue) && (
        <div className="flex items-center gap-2 mt-1">
          {subtitle && <span className="text-xs text-white/50">{subtitle}</span>}
          {trendValue && (
            <span
              className={cn(
                "text-xs",
                trend === "up" && "text-crowe-teal-bright",
                trend === "down" && "text-crowe-coral-bright",
                trend === "neutral" && "text-white/50"
              )}
            >
              {trend === "up" && "+"}
              {trendValue}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}

/**
 * Stat Card Grid
 * Container for multiple stat cards
 */
interface StatCardGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4 | 6;
}

export function StatCardGrid({ children, columns = 4 }: StatCardGridProps) {
  const gridCols = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4",
    6: "md:grid-cols-6",
  };

  return (
    <div className={cn("grid gap-4", gridCols[columns])}>
      {children}
    </div>
  );
}
