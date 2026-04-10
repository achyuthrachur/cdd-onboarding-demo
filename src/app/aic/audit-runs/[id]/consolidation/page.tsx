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
  useReducedMotion,
  ScrollReveal,
  ScrollStagger,
  ScrollStaggerItem,
} from "@/lib/animations";
import { toast } from "sonner";
import { ConsolidationDashboard } from "@/components/stage-4/consolidation-dashboard";
import { FindingsTable } from "@/components/stage-4/findings-table";
import { ReportGenerator } from "@/components/stage-4/report-generator";
import { ConsolidationResult } from "@/lib/consolidation/engine";
import { loadFallbackDataForStage, getStageData, hasStageData, setStageData } from "@/lib/stage-data";

export default function AicConsolidationPage() {
  const params = useParams();
  const id = params.id as string;
  const shouldReduceMotion = useReducedMotion();

  const [consolidation, setConsolidation] = useState<ConsolidationResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasTestResults, setHasTestResults] = useState(false);

  // Check for prerequisite data and load stored consolidation
  useEffect(() => {
    setHasTestResults(hasStageData('testResults') || hasStageData('testingProgress') || hasStageData('auditorProgress'));

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
    toast.success("Demo data loaded for Consolidation");
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
    <div className="p-8">
      {/* Header */}
      <ScrollReveal direction="up" className="mb-8">
        <Link
          href={`/aic/audit-runs/${id}`}
          className="inline-flex items-center text-sm text-tint-700 dark:text-white/80 hover:text-tint-900 dark:hover:text-white mb-4"
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
                <Badge className="bg-crowe-amber/20 text-crowe-amber">Consolidation</Badge>
              </motion.div>
              <h1 className="text-3xl font-bold tracking-tight text-tint-900 dark:text-white">
                Consolidation & Reporting
              </h1>
            </div>
            <p className="text-tint-700 dark:text-white/80 mt-2">
              Consolidate all results, view dashboards, and generate final report
            </p>
          </div>
          <motion.div
            className="flex items-center gap-2"
            initial={shouldReduceMotion ? undefined : { opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Button variant="outline" size="sm" onClick={handleLoadDemoData} className="border-tint-200 dark:border-white/20 text-tint-900 dark:text-white hover:bg-tint-100 dark:hover:bg-white/10 hover:border-tint-300 dark:hover:border-white/30">
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
                    size="sm"
                    onClick={handleRefreshConsolidation}
                    disabled={isGenerating}
                    className="border-tint-200 dark:border-white/20 text-tint-900 dark:text-white hover:bg-tint-100 dark:hover:bg-white/10 hover:border-tint-300 dark:hover:border-white/30"
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
                    size="sm"
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
      </ScrollReveal>

      {/* Status Banner */}
      <AnimatePresence mode="wait">
        {consolidation ? (
          <motion.div
            key="consolidation-available"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 bg-crowe-teal/10 border border-crowe-teal/30 rounded-lg flex items-center gap-3"
          >
            <motion.div
              initial={shouldReduceMotion ? undefined : { scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}
            >
              <CheckCircle2 className="h-5 w-5 text-crowe-teal-dark dark:text-crowe-teal" />
            </motion.div>
            <div>
              <p className="font-medium text-crowe-teal-dark dark:text-crowe-teal">
                Consolidation Available
              </p>
              <p className="text-sm text-crowe-teal-dark dark:text-crowe-teal/80">
                Last generated: {new Date(consolidation.generatedAt).toLocaleString()} •{" "}
                {consolidation.rawData?.totalRows ?? 0} rows from {consolidation.rawData?.workbookIds?.length ?? 0} workbook(s)
              </p>
            </div>
          </motion.div>
        ) : !isLoading && (
          <motion.div
            key="no-consolidation"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 bg-crowe-amber/10 border border-crowe-amber/30 rounded-lg flex items-center gap-3"
          >
            <motion.div
              animate={shouldReduceMotion ? undefined : { rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <AlertCircle className="h-5 w-5 text-crowe-amber-dark dark:text-crowe-amber" />
            </motion.div>
            <div>
              <p className="font-medium text-crowe-amber-dark dark:text-crowe-amber">
                No Consolidation Yet
              </p>
              <p className="text-sm text-crowe-amber-dark dark:text-crowe-amber/80">
                Click &quot;Generate Consolidation&quot; or &quot;Load Demo Data&quot; to aggregate results
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Consolidation Dashboard */}
      <ScrollReveal direction="up" delay={0.1} className="mb-6">
        <ConsolidationDashboard
          consolidation={consolidation}
          isLoading={isLoading}
        />
      </ScrollReveal>

      {/* Findings Table */}
      {consolidation && (
        <ScrollReveal direction="up" delay={0.1} className="mb-6">
            <FindingsTable
              exceptions={consolidation.exceptions ?? []}
              findingsByAttribute={consolidation.findingsByAttribute ?? []}
            />
        </ScrollReveal>
      )}

      {/* Report Generator */}
      <ScrollReveal direction="up" delay={0.15} className="mb-6">
        <ReportGenerator
          consolidation={consolidation}
          auditRunId={id}
        />
      </ScrollReveal>

      {/* Prerequisites Info (when no consolidation) */}
      {!consolidation && !isLoading && (
        <ScrollReveal direction="up" delay={0.1} className="mb-6">
            <Card className="bg-white dark:bg-white/10 backdrop-blur-xl border border-tint-200/60 dark:border-white/20 shadow-md dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]">
              <CardHeader>
                <CardTitle className="text-tint-900 dark:text-white">Prerequisites</CardTitle>
                <CardDescription className="text-tint-700 dark:text-white/80">
                  Complete these steps before generating consolidation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollStagger className="space-y-3">
                  {[
                    { label: "Stage 1: Gap Assessment complete", complete: true },
                    { label: "Stage 2: Sample locked", complete: true },
                    { label: "Stage 3: Attributes extracted", complete: true },
                    { label: "Stage 4: Workbooks generated & published", complete: true },
                    { label: "Live Monitor: Auditors have submitted", complete: hasTestResults, required: !hasTestResults },
                  ].map((step, index) => (
                    <ScrollStaggerItem key={index} className="flex items-center gap-3">
                      <motion.div
                        initial={shouldReduceMotion ? undefined : { scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.1, type: "spring", stiffness: 400 }}
                      >
                        {step.complete ? (
                          <CheckCircle2 className="h-5 w-5 text-crowe-teal" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-crowe-amber" />
                        )}
                      </motion.div>
                      <span className="text-tint-900 dark:text-white">
                        {step.label}
                        {step.required && (
                          <Badge variant="outline" className="ml-2 border-tint-300 dark:border-white/30 text-tint-700 dark:text-white/80">
                            Required
                          </Badge>
                        )}
                      </span>
                    </ScrollStaggerItem>
                  ))}
                </ScrollStagger>
                <p className="text-sm text-tint-700 dark:text-white/80 mt-4">
                  Demo mode: Click &quot;Load Demo Data&quot; to populate all stages with sample data.
                </p>
              </CardContent>
            </Card>
        </ScrollReveal>
      )}

      {/* Navigation */}
      <ScrollReveal
        direction="up"
        delay={0.15}
        className="flex items-center justify-between mt-6 pt-4 border-t border-tint-200 dark:border-white/10"
      >
        <Link href={`/aic/audit-runs/${id}/monitor`}>
          <Button variant="outline" className="border-tint-200 dark:border-white/20 text-tint-900 dark:text-white hover:bg-tint-100 dark:hover:bg-white/10 hover:border-tint-300 dark:hover:border-white/30">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Live Monitor
          </Button>
        </Link>
        <Link href={`/aic/audit-runs/${id}`}>
          <Button variant="outline" className="border-tint-200 dark:border-white/20 text-tint-900 dark:text-white hover:bg-tint-100 dark:hover:bg-white/10 hover:border-tint-300 dark:hover:border-white/30">Back to Overview</Button>
        </Link>
      </ScrollReveal>
    </div>
  );
}
