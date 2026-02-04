"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Stage {
  number: number;
  name: string;
  href: string;
}

interface StageNavProps {
  stages: Stage[];
  currentStage: number;
}

export function StageNav({ stages, currentStage }: StageNavProps) {
  return (
    <nav aria-label="Progress" className="mb-8">
      <ol role="list" className="flex items-center">
        {stages.map((stage, index) => {
          const isCompleted = currentStage > stage.number;
          const isCurrent = currentStage === stage.number;
          const isPending = currentStage < stage.number;

          return (
            <li
              key={stage.number}
              className={cn(
                "relative",
                index !== stages.length - 1 ? "flex-1 pr-8 sm:pr-20" : ""
              )}
            >
              {/* Connector line */}
              {index !== stages.length - 1 && (
                <div
                  className="absolute top-4 left-4 w-full h-0.5 -translate-y-1/2"
                  aria-hidden="true"
                >
                  <div
                    className={cn(
                      "h-full",
                      isCompleted ? "bg-primary" : "bg-muted"
                    )}
                  />
                </div>
              )}

              <Link
                href={isPending ? "#" : stage.href}
                className={cn(
                  "group relative flex items-center",
                  isPending && "pointer-events-none"
                )}
              >
                <span className="flex h-8 items-center" aria-hidden="true">
                  <span
                    className={cn(
                      "relative z-10 flex h-8 w-8 items-center justify-center rounded-full",
                      isCompleted && "bg-primary text-primary-foreground",
                      isCurrent &&
                        "border-2 border-primary bg-background text-primary",
                      isPending && "border-2 border-muted bg-background text-muted-foreground"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <span className="text-sm font-medium">{stage.number}</span>
                    )}
                  </span>
                </span>
                <span className="ml-3 hidden sm:block">
                  <span
                    className={cn(
                      "text-sm font-medium",
                      isCurrent ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {stage.name}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
