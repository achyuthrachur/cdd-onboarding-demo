"use client";

import { cn } from "@/lib/utils";

interface ChartContainerProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
}

export function ChartContainer({ children, className, title, subtitle }: ChartContainerProps) {
  return (
    <div className={cn(
      "bg-crowe-indigo-dark rounded-xl p-6 border border-white/10",
      className
    )}>
      {title && (
        <div className="mb-4">
          <h3 className="text-white font-semibold text-sm">{title}</h3>
          {subtitle && <p className="text-white/70 text-xs mt-1">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
}
