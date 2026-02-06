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
          className="inline-flex items-center text-sm text-white/50 hover:text-white mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Audit Run
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Badge className="bg-crowe-teal/20 text-crowe-teal">Live Monitor</Badge>
              <h1 className="text-3xl font-bold tracking-tight text-white">
                Auditor Progress Tracking
              </h1>
              {isPolling && isPublished && (
                <motion.div
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Badge variant="outline" className="text-crowe-teal border-crowe-teal">
                    <Activity className="h-3 w-3 mr-1" />
                    Live
                  </Badge>
                </motion.div>
              )}
            </div>
            <p className="text-white/50 mt-2">
              Real-time tracking of auditor workbook completion (5-second refresh)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleLoadDemoData} className="border-white/20 text-white hover:bg-white/10 hover:border-white/30">
              <Database className="h-4 w-4 mr-2" />
              Load Demo Data
            </Button>
            {isPublished && (
              <Button variant="outline" size="sm" onClick={handleSimulateProgress} className="border-white/20 text-white hover:bg-white/10 hover:border-white/30">
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
          className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-400" />
            <div>
              <p className="font-medium text-amber-400">
                Workbooks Not Published
              </p>
              <p className="text-sm text-amber-400/80">
                Publish workbooks in Stage 4 to enable live monitoring.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Summary Stats */}
      <motion.div
        className="grid gap-3 md:grid-cols-4 mb-6"
        initial={shouldReduceMotion ? undefined : "hidden"}
        animate="visible"
        variants={staggerContainer}
      >
        <motion.div variants={staggerItem}>
          <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]">
            <CardHeader className="pb-2">
              <CardDescription className="text-white/60">Total Auditors</CardDescription>
              <CardTitle className="text-3xl text-white">{totalAuditors}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-white/50">
                <User className="h-4 w-4" />
                Assigned to workbooks
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]">
            <CardHeader className="pb-2">
              <CardDescription className="text-white/60">Submitted</CardDescription>
              <CardTitle className="text-3xl text-white">{submittedCount} / {totalAuditors}</CardTitle>
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
          <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]">
            <CardHeader className="pb-2">
              <CardDescription className="text-white/60">Average Completion</CardDescription>
              <CardTitle className="text-3xl text-white">{averageCompletion}%</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={averageCompletion} className="h-2" />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]">
            <CardHeader className="pb-2">
              <CardDescription className="text-white/60">Last Updated</CardDescription>
              <CardTitle className="text-lg text-white">
                {lastRefresh ? lastRefresh.toLocaleTimeString() : '--:--:--'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-white/50">
                <Clock className="h-4 w-4" />
                {isPolling ? 'Auto-refresh every 5s' : 'Paused'}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Auditor Progress Cards */}
      <motion.div
        className="mb-6"
        initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">Auditor Progress</CardTitle>
                <CardDescription className="text-white/60">
                  Individual completion status for each auditor
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPolling(!isPolling)}
                className="text-white hover:bg-white/10"
              >
                {isPolling ? (
                  <>
                    <Activity className="h-4 w-4 mr-2 text-green-400" />
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
                <Loader2 className="h-8 w-8 animate-spin text-white/50" />
              </div>
            ) : progress.length === 0 ? (
              <div className="text-center py-12 text-white/50">
                <User className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>No auditor workbooks found</p>
                <p className="text-sm">Generate and publish workbooks in Stage 4</p>
              </div>
            ) : (
              <motion.div
                className="grid gap-3 md:grid-cols-2"
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
                      <Card className={`transition-all bg-white/5 border border-white/10 ${
                        auditor.status === 'submitted'
                          ? 'border-green-500 bg-green-500/10'
                          : ''
                      }`}>
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg text-white">{auditor.auditorName}</CardTitle>
                              <CardDescription className="text-white/60">{auditor.auditorEmail}</CardDescription>
                            </div>
                            <Badge
                              variant={auditor.status === 'submitted' ? 'default' : 'outline'}
                              className={auditor.status === 'submitted' ? 'bg-green-600' : 'border-white/30 text-white/70'}
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
                        <CardContent className="space-y-3">
                          {/* Progress Bar */}
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-white/50">Completion</span>
                              <span className="font-medium text-white">{auditor.completionPercentage}%</span>
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
                          <div className="flex items-center justify-between text-sm text-white/50">
                            <span>{auditor.totalAttributes} attributes × {auditor.totalCustomers} customers</span>
                          </div>

                          {/* Last Activity */}
                          <div className="flex items-center gap-2 text-xs text-white/40">
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
            className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
              >
                <CheckCircle2 className="h-10 w-10 text-green-400" />
              </motion.div>
              <div>
                <h3 className="font-semibold text-green-400">
                  All Workbooks Submitted
                </h3>
                <p className="text-sm text-green-400/80">
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
        className="flex items-center justify-between mt-6 pt-4 border-t border-white/10"
        initial={shouldReduceMotion ? undefined : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <Link href={`/aic/audit-runs/${id}/stage-4`}>
          <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 hover:border-white/30">
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
