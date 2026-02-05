"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Database,
} from "lucide-react";
import {
  motion,
  AnimatePresence,
  FadeInUp,
  StaggerContainer,
  StaggerItem,
  Presence,
  useReducedMotion,
  staggerContainer,
  staggerItem,
} from "@/lib/animations";
import { toast } from "sonner";
import { ConsolidationDashboard } from "@/components/stage-4/consolidation-dashboard";
import { FindingsTable } from "@/components/stage-4/findings-table";
import { ReportGenerator } from "@/components/stage-4/report-generator";
import { ConsolidationResult } from "@/lib/consolidation/engine";
import { loadFallbackDataForStage, getStageData, hasStageData, setStageData } from "@/lib/stage-data";

export default function Stage6Page() {
  const params = useParams();
  const id = params.id as string;
  const shouldReduceMotion = useReducedMotion();

  const [consolidation, setConsolidation] = useState<ConsolidationResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasTestResults, setHasTestResults] = useState(false);

  // Check for prerequisite data and load stored consolidation
  useEffect(() => {
    setHasTestResults(hasStageData('testResults') || hasStageData('testingProgress'));

    // Check for stored consolidation
    const storedConsolidation = getStageData('consolidatedReport');
    if (storedConsolidation) {
      setConsolidation(storedConsolidation);
    }
    setIsLoading(false);
  }, []);

  // Load existing consolidation from API on mount
  useEffect(() => {
    const loadConsolidation = async () => {
      try {
        const response = await fetch(`/api/consolidation?auditRunId=${id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.length > 0) {
            // Get the latest consolidation
            const latest = data.sort(
              (a: ConsolidationResult, b: ConsolidationResult) =>
                new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
            )[0];
            setConsolidation(latest);
            setStageData('consolidatedReport', latest);
          }
        }
      } catch (error) {
        console.error("Failed to load consolidation:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadConsolidation();
  }, [id]);

  const handleLoadDemoData = () => {
    loadFallbackDataForStage(6);
    const demoConsolidation = getStageData('consolidatedReport');
    if (demoConsolidation) {
      setConsolidation(demoConsolidation);
    }
    setHasTestResults(true);
    toast.success("Demo data loaded for Stage 6");
  };

  const handleGenerateConsolidation = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/consolidation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          auditRunId: id,
          useMock: true, // Use mock data for demo
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate consolidation");
      }

      const data = await response.json();
      setConsolidation(data);
      setStageData('consolidatedReport', data);
      toast.success("Consolidation generated successfully");
    } catch {
      toast.error("Failed to generate consolidation");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefreshConsolidation = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/consolidation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "refresh",
          auditRunId: id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to refresh consolidation");
      }

      const data = await response.json();
      setConsolidation(data);
      setStageData('consolidatedReport', data);
      toast.success("Consolidation refreshed");
    } catch {
      toast.error("Failed to refresh consolidation");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-8 min-h-screen bg-crowe-indigo-dark">
      {/* Header */}
      <FadeInUp className="mb-8">
        <Link
          href={`/audit-runs/${id}`}
          className="inline-flex items-center text-sm text-white/50 hover:text-white mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Audit Run
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <motion.div
                initial={shouldReduceMotion ? undefined : { scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <Badge className="bg-orange-100 text-orange-700">Stage 6</Badge>
              </motion.div>
              <h1 className="text-3xl font-bold tracking-tight text-white">
                Consolidation & Reporting
              </h1>
            </div>
            <p className="text-white/50 mt-2">
              Consolidate all results, view dashboards, and generate final report
            </p>
          </div>
          <motion.div
            className="flex gap-2"
            initial={shouldReduceMotion ? undefined : { opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Button variant="outline" onClick={handleLoadDemoData}>
              <Database className="h-4 w-4 mr-2" />
              Load Demo Data
            </Button>
            <AnimatePresence mode="wait">
              {consolidation ? (
                <motion.div
                  key="refresh"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <Button
                    variant="outline"
                    onClick={handleRefreshConsolidation}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <motion.div
                        whileHover={shouldReduceMotion ? undefined : { rotate: 180 }}
                        transition={{ duration: 0.3 }}
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                      </motion.div>
                    )}
                    Refresh Data
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="generate"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <Button
                    onClick={handleGenerateConsolidation}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      "Generate Consolidation"
                    )}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </FadeInUp>

      {/* Status Banner */}
      <AnimatePresence mode="wait">
        {consolidation ? (
          <motion.div
            key="consolidation-available"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 bg-green-500/10 backdrop-blur-xl border border-green-500/30 rounded-lg flex items-center gap-3"
          >
            <motion.div
              initial={shouldReduceMotion ? undefined : { scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}
            >
              <CheckCircle2 className="h-5 w-5 text-green-400" />
            </motion.div>
            <div>
              <p className="font-medium text-green-300">
                Consolidation Available
              </p>
              <p className="text-sm text-green-400">
                Last generated: {new Date(consolidation.generatedAt).toLocaleString()} •{" "}
                {consolidation.rawData.totalRows} rows from {consolidation.rawData.workbookIds.length} workbook(s)
              </p>
            </div>
          </motion.div>
        ) : !isLoading && (
          <motion.div
            key="no-consolidation"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 bg-yellow-500/10 backdrop-blur-xl border border-yellow-500/30 rounded-lg flex items-center gap-3"
          >
            <motion.div
              animate={shouldReduceMotion ? undefined : { rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <AlertCircle className="h-5 w-5 text-yellow-400" />
            </motion.div>
            <div>
              <p className="font-medium text-yellow-300">
                No Consolidation Yet
              </p>
              <p className="text-sm text-yellow-400">
                Click &quot;Generate Consolidation&quot; or &quot;Load Demo Data&quot; to aggregate results
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Consolidation Dashboard */}
      <motion.div
        className="mb-8"
        initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.35 }}
      >
        <ConsolidationDashboard
          consolidation={consolidation}
          isLoading={isLoading}
        />
      </motion.div>

      {/* Findings Table */}
      <AnimatePresence>
        {consolidation && (
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: 0.3, duration: 0.35 }}
          >
            <FindingsTable
              exceptions={consolidation.exceptions}
              findingsByAttribute={consolidation.findingsByAttribute}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Report Generator */}
      <motion.div
        className="mb-8"
        initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.35 }}
      >
        <ReportGenerator
          consolidation={consolidation}
          auditRunId={id}
        />
      </motion.div>

      {/* Prerequisites Info (when no consolidation) */}
      <AnimatePresence>
        {!consolidation && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="mb-8 bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]">
              <CardHeader>
                <CardTitle className="text-white">Prerequisites</CardTitle>
                <CardDescription className="text-white/60">
                  Complete these steps before generating consolidation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <motion.div
                  className="space-y-3"
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                >
                  {[
                    { label: "Stage 1: Gap Assessment complete", complete: true },
                    { label: "Stage 2: Sample locked", complete: true },
                    { label: "Stage 3: Attributes extracted", complete: true },
                    { label: "Stage 4: Workbook generated", complete: true },
                    { label: "Stage 5: Testing completed", complete: hasTestResults, required: !hasTestResults },
                  ].map((step, index) => (
                    <motion.div
                      key={index}
                      className="flex items-center gap-3"
                      variants={staggerItem}
                    >
                      <motion.div
                        initial={shouldReduceMotion ? undefined : { scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.1, type: "spring", stiffness: 400 }}
                      >
                        {step.complete ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-yellow-500" />
                        )}
                      </motion.div>
                      <span className="text-white">
                        {step.label}
                        {step.required && (
                          <Badge variant="outline" className="ml-2 border-white/30 text-white/70">
                            Required
                          </Badge>
                        )}
                      </span>
                    </motion.div>
                  ))}
                </motion.div>
                <p className="text-sm text-white/50 mt-4">
                  Demo mode: Click &quot;Load Demo Data&quot; to populate all stages with sample data.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <motion.div
        className="flex justify-between"
        initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Link href={`/audit-runs/${id}/stage-5`}>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Stage 5
          </Button>
        </Link>
        <Link href={`/audit-runs/${id}`}>
          <Button variant="outline">Back to Overview</Button>
        </Link>
      </motion.div>
    </div>
  );
}
