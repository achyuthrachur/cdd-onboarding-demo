"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  Clock,
  User,
  Activity,
  Database,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  motion,
  AnimatePresence,
  staggerContainer,
  staggerItem,
  fadeInUp,
  useReducedMotion,
} from "@/lib/animations";
import { toast } from "sonner";
import { loadFallbackDataForStage, getStageData, setStageData } from "@/lib/stage-data";
import type { PivotedAuditorWorkbook } from "@/lib/stage-data/store";

interface AuditorProgress {
  auditorId: string;
  auditorName: string;
  auditorEmail: string;
  status: 'draft' | 'in_progress' | 'submitted';
  completionPercentage: number;
  lastActivityAt: string | null;
  submittedAt: string | null;
  totalAttributes: number;
  totalCustomers: number;
}

export default function AicMonitorPage() {
  const params = useParams();
  const id = params.id as string;
  const shouldReduceMotion = useReducedMotion();

  const [progress, setProgress] = useState<AuditorProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [isPolling, setIsPolling] = useState(true);
  const [isPublished, setIsPublished] = useState(false);

  // Load and transform workbook data
  const loadProgress = useCallback(() => {
    // Check if workbooks are published
    const published = getStageData("workbooksPublished");
    setIsPublished(!!published);

    // Get pivoted workbooks
    const pivotedWorkbooks = getStageData("pivotedWorkbooks") as PivotedAuditorWorkbook[] | null;

    if (!pivotedWorkbooks || pivotedWorkbooks.length === 0) {
      setProgress([]);
      setIsLoading(false);
      return;
    }

    // Get simulated progress from localStorage (for demo)
    const simulatedProgress = getStageData("auditorProgress") as Record<string, {
      completionPercentage: number;
      status: 'draft' | 'in_progress' | 'submitted';
      lastActivityAt: string;
      submittedAt: string | null;
    }> | null;

    // Transform workbooks to progress format
    const progressData: AuditorProgress[] = pivotedWorkbooks.map((wb) => {
      const simulated = simulatedProgress?.[wb.auditorId];

      return {
        auditorId: wb.auditorId,
        auditorName: wb.auditorName,
        auditorEmail: wb.auditorEmail,
        status: simulated?.status || (published ? 'in_progress' : 'draft'),
        completionPercentage: simulated?.completionPercentage || 0,
        lastActivityAt: simulated?.lastActivityAt || null,
        submittedAt: simulated?.submittedAt || null,
        totalAttributes: wb.attributes.length,
        totalCustomers: wb.assignedCustomers.length,
      };
    });

    setProgress(progressData);
    setLastRefresh(new Date());
    setIsLoading(false);
  }, []);

  // Initial load
  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  // Polling every 5 seconds
  useEffect(() => {
    if (!isPolling || !isPublished) return;

    const interval = setInterval(() => {
      loadProgress();
    }, 5000);

    return () => clearInterval(interval);
  }, [isPolling, isPublished, loadProgress]);

  const handleLoadDemoData = () => {
    // Load prerequisite stages
    loadFallbackDataForStage(2);
    loadFallbackDataForStage(3);
    loadFallbackDataForStage(4);

    // Mark as published
    setStageData("workbooksPublished", {
      publishedAt: new Date().toISOString(),
      publishedBy: 'AIC',
      workbookCount: 4,
    });

    // Simulate varying progress for each auditor
    const pivotedWorkbooks = getStageData("pivotedWorkbooks") as PivotedAuditorWorkbook[] | null;
    if (pivotedWorkbooks) {
      const simulatedProgress: Record<string, {
        completionPercentage: number;
        status: 'draft' | 'in_progress' | 'submitted';
        lastActivityAt: string;
        submittedAt: string | null;
      }> = {};

      pivotedWorkbooks.forEach((wb, index) => {
        // Vary progress for each auditor
        const progressLevels = [95, 72, 45, 28];
        const completion = progressLevels[index % progressLevels.length];
        const isSubmitted = completion >= 95;

        simulatedProgress[wb.auditorId] = {
          completionPercentage: completion,
          status: isSubmitted ? 'submitted' : 'in_progress',
          lastActivityAt: new Date(Date.now() - Math.random() * 3600000).toISOString(),
          submittedAt: isSubmitted ? new Date().toISOString() : null,
        };
      });

      setStageData("auditorProgress", simulatedProgress);
    }

    loadProgress();
    setIsPublished(true);
    toast.success("Demo data loaded for Live Monitoring");
  };

  const handleSimulateProgress = () => {
    // Simulate progress increase for demo
    const pivotedWorkbooks = getStageData("pivotedWorkbooks") as PivotedAuditorWorkbook[] | null;
    if (!pivotedWorkbooks) return;

    const currentProgress = getStageData("auditorProgress") as Record<string, {
      completionPercentage: number;
      status: 'draft' | 'in_progress' | 'submitted';
      lastActivityAt: string;
      submittedAt: string | null;
    }> | null || {};

    const updatedProgress = { ...currentProgress };

    pivotedWorkbooks.forEach((wb) => {
      const current = updatedProgress[wb.auditorId];
      if (!current || current.status === 'submitted') return;

      const newCompletion = Math.min(100, (current.completionPercentage || 0) + Math.floor(Math.random() * 15) + 5);
      const isSubmitted = newCompletion >= 95;

      updatedProgress[wb.auditorId] = {
        completionPercentage: newCompletion,
        status: isSubmitted ? 'submitted' : 'in_progress',
        lastActivityAt: new Date().toISOString(),
        submittedAt: isSubmitted ? new Date().toISOString() : null,
      };
    });

    setStageData("auditorProgress", updatedProgress);
    loadProgress();
    toast.success("Simulated auditor progress update");
  };

  // Calculate aggregate stats
  const totalAuditors = progress.length;
  const submittedCount = progress.filter(p => p.status === 'submitted').length;
  const averageCompletion = progress.length > 0
    ? Math.round(progress.reduce((sum, p) => sum + p.completionPercentage, 0) / progress.length)
    : 0;
  const allSubmitted = totalAuditors > 0 && submittedCount === totalAuditors;

  return (
    <div className="p-8">
      {/* Header */}
      <motion.div
        className="mb-8"
        initial={shouldReduceMotion ? undefined : "hidden"}
        animate="visible"
        variants={fadeInUp}
      >
        <Link
          href={`/aic/audit-runs/${id}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Audit Run
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Badge className="bg-teal-100 text-teal-700">Live Monitor</Badge>
              <h1 className="text-3xl font-bold tracking-tight">
                Auditor Progress Tracking
              </h1>
              {isPolling && isPublished && (
                <motion.div
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Badge variant="outline" className="text-teal-600 border-teal-600">
                    <Activity className="h-3 w-3 mr-1" />
                    Live
                  </Badge>
                </motion.div>
              )}
            </div>
            <p className="text-muted-foreground mt-2">
              Real-time tracking of auditor workbook completion (5-second refresh)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleLoadDemoData}>
              <Database className="h-4 w-4 mr-2" />
              Load Demo Data
            </Button>
            {isPublished && (
              <Button variant="outline" onClick={handleSimulateProgress}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Simulate Progress
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Status Banner */}
      {!isPublished && (
        <motion.div
          className="mb-6 p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <div>
              <p className="font-medium text-amber-700 dark:text-amber-300">
                Workbooks Not Published
              </p>
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Publish workbooks in Stage 4 to enable live monitoring.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Summary Stats */}
      <motion.div
        className="grid gap-4 md:grid-cols-4 mb-8"
        initial={shouldReduceMotion ? undefined : "hidden"}
        animate="visible"
        variants={staggerContainer}
      >
        <motion.div variants={staggerItem}>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Auditors</CardDescription>
              <CardTitle className="text-3xl">{totalAuditors}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                Assigned to workbooks
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Submitted</CardDescription>
              <CardTitle className="text-3xl">{submittedCount} / {totalAuditors}</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress
                value={totalAuditors > 0 ? (submittedCount / totalAuditors) * 100 : 0}
                className="h-2"
              />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Average Completion</CardDescription>
              <CardTitle className="text-3xl">{averageCompletion}%</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={averageCompletion} className="h-2" />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Last Updated</CardDescription>
              <CardTitle className="text-lg">
                {lastRefresh ? lastRefresh.toLocaleTimeString() : '--:--:--'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                {isPolling ? 'Auto-refresh every 5s' : 'Paused'}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Auditor Progress Cards */}
      <motion.div
        className="mb-8"
        initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Auditor Progress</CardTitle>
                <CardDescription>
                  Individual completion status for each auditor
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPolling(!isPolling)}
              >
                {isPolling ? (
                  <>
                    <Activity className="h-4 w-4 mr-2 text-green-500" />
                    Pause
                  </>
                ) : (
                  <>
                    <Activity className="h-4 w-4 mr-2" />
                    Resume
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : progress.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>No auditor workbooks found</p>
                <p className="text-sm">Generate and publish workbooks in Stage 4</p>
              </div>
            ) : (
              <motion.div
                className="grid gap-4 md:grid-cols-2"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                <AnimatePresence>
                  {progress.map((auditor) => (
                    <motion.div
                      key={auditor.auditorId}
                      variants={staggerItem}
                      layout
                    >
                      <Card className={`transition-all ${
                        auditor.status === 'submitted'
                          ? 'border-green-500 bg-green-50/50 dark:bg-green-950/20'
                          : ''
                      }`}>
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">{auditor.auditorName}</CardTitle>
                              <CardDescription>{auditor.auditorEmail}</CardDescription>
                            </div>
                            <Badge
                              variant={auditor.status === 'submitted' ? 'default' : 'outline'}
                              className={auditor.status === 'submitted' ? 'bg-green-600' : ''}
                            >
                              {auditor.status === 'submitted' ? (
                                <>
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Submitted
                                </>
                              ) : auditor.status === 'in_progress' ? (
                                'In Progress'
                              ) : (
                                'Draft'
                              )}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Progress Bar */}
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-muted-foreground">Completion</span>
                              <span className="font-medium">{auditor.completionPercentage}%</span>
                            </div>
                            <Progress
                              value={auditor.completionPercentage}
                              className={`h-2 ${
                                auditor.completionPercentage >= 95
                                  ? '[&>div]:bg-green-500'
                                  : auditor.completionPercentage >= 50
                                  ? '[&>div]:bg-blue-500'
                                  : '[&>div]:bg-amber-500'
                              }`}
                            />
                          </div>

                          {/* Stats */}
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>{auditor.totalAttributes} attributes × {auditor.totalCustomers} customers</span>
                          </div>

                          {/* Last Activity */}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {auditor.submittedAt ? (
                              <span>Submitted {new Date(auditor.submittedAt).toLocaleString()}</span>
                            ) : auditor.lastActivityAt ? (
                              <span>Last activity {new Date(auditor.lastActivityAt).toLocaleString()}</span>
                            ) : (
                              <span>No activity yet</span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* All Submitted Banner */}
      <AnimatePresence>
        {allSubmitted && (
          <motion.div
            className="mb-8 p-6 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
              >
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </motion.div>
              <div>
                <h3 className="text-lg font-semibold text-green-700 dark:text-green-300">
                  All Workbooks Submitted
                </h3>
                <p className="text-green-600 dark:text-green-400">
                  All {totalAuditors} auditors have completed and submitted their workbooks.
                  You can now proceed to consolidation.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <motion.div
        className="flex justify-between"
        initial={shouldReduceMotion ? undefined : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <Link href={`/aic/audit-runs/${id}/stage-4`}>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Stage 4
          </Button>
        </Link>
        <Link href={`/aic/audit-runs/${id}/consolidation`}>
          <Button disabled={!allSubmitted && !isPublished}>
            Continue to Consolidation
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}
