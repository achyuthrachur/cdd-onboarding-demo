"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Play,
  Loader2,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { runFullDemo } from "@/lib/demo/data-loader";

interface DemoModeBannerProps {
  auditRunId: string;
  onDemoComplete?: () => void;
}

export function DemoModeBanner({
  auditRunId,
  onDemoComplete,
}: DemoModeBannerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState<number | null>(null);
  const [completedStages, setCompletedStages] = useState<number[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);

  const stages = [
    { num: 1, name: "Document Analysis" },
    { num: 2, name: "Statistical Sampling" },
    { num: 3, name: "Testing Workbooks" },
    { num: 4, name: "Consolidation" },
  ];

  const handleRunDemo = async () => {
    setIsRunning(true);
    setProgress(0);
    setCompletedStages([]);

    try {
      // Simulate stage progression with delays for better UX
      for (let i = 1; i <= 4; i++) {
        setCurrentStage(i);
        setProgress((i - 1) * 25);

        // Small delay between stages for visual feedback
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      const result = await runFullDemo(auditRunId);
      setCompletedStages(result.completedStages);
      setProgress(100);

      if (result.success) {
        toast.success("Demo completed successfully! All stages populated.");
        onDemoComplete?.();
      } else {
        toast.error(
          `Demo partially completed. Stages ${result.completedStages.join(", ")} succeeded.`
        );
      }
    } catch {
      toast.error("Failed to run demo");
    } finally {
      setIsRunning(false);
      setCurrentStage(null);
    }
  };

  return (
    <Card className="bg-gradient-to-r from-crowe-violet-dark/30 to-crowe-indigo/30 border-crowe-violet/30">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-crowe-violet/20">
              <Sparkles className="h-5 w-5 text-crowe-violet-bright" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white">Demo Mode</h3>
                <Badge variant="secondary" className="bg-crowe-violet/20 text-crowe-violet-bright border-0">
                  Quick Start
                </Badge>
              </div>
              <p className="text-sm text-white/70">
                Populate all stages with sample data in one click
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {completedStages.length === 4 ? (
              <Badge className="bg-crowe-teal text-white">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Complete
              </Badge>
            ) : (
              <Button
                onClick={handleRunDemo}
                disabled={isRunning}
                className="bg-crowe-violet hover:bg-crowe-violet-dark text-white"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Run Full Demo
                  </>
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-white/10">
            {isRunning && (
              <div className="mb-4">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-white/70 mt-2">
                  {currentStage
                    ? `Running Stage ${currentStage}: ${stages[currentStage - 1].name}...`
                    : "Initializing..."}
                </p>
              </div>
            )}

            <div className="grid grid-cols-4 gap-2">
              {stages.map((stage) => {
                const isComplete = completedStages.includes(stage.num);
                const isCurrent = currentStage === stage.num;

                return (
                  <div
                    key={stage.num}
                    className={`p-2 rounded-lg text-center text-sm transition-colors ${
                      isComplete
                        ? "bg-crowe-teal/20 text-crowe-teal-bright"
                        : isCurrent
                        ? "bg-crowe-violet/20 text-crowe-violet-bright"
                        : "bg-white/10 text-white/70"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      {isComplete ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : isCurrent ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : null}
                      <span className="font-medium">Stage {stage.num}</span>
                    </div>
                    <p className="text-xs mt-1 truncate">{stage.name}</p>
                  </div>
                );
              })}
            </div>

            <p className="text-xs text-white/50 mt-3">
              The demo will generate sample documents, population data, testing
              workbooks, and consolidation results using mock data.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
