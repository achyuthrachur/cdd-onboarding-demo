"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  PieChart,
  BarChart3,
  LineChart,
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
import {
  ResultPieChart,
  AuditorBarChart,
  ProgressTimeline,
  CategoryBreakdown,
  generateMockTimelineData,
  CHART_COLORS,
} from "@/components/charts";

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
      auditorCount: 4,
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
  const inProgressCount = progress.filter(p => p.status === 'in_progress').length;
  const draftCount = progress.filter(p => p.status === 'draft').length;
  const averageCompletion = progress.length > 0
    ? Math.round(progress.reduce((sum, p) => sum + p.completionPercentage, 0) / progress.length)
    : 0;
  const allSubmitted = totalAuditors > 0 && submittedCount === totalAuditors;

  // Prepare chart data
  const statusPieData = useMemo(() => [
    { name: 'Submitted', value: submittedCount, color: CHART_COLORS.completed },
    { name: 'In Progress', value: inProgressCount, color: CHART_COLORS.inProgress },
    { name: 'Draft', value: draftCount, color: CHART_COLORS.draft },
  ].filter(item => item.value > 0), [submittedCount, inProgressCount, draftCount]);

  const auditorChartData = useMemo(() =>
    progress.map(p => ({
      name: p.auditorName.split(' ')[0], // First name only for brevity
      completed: p.completionPercentage,
      total: 100,
    }))
  , [progress]);

  // Mock timeline data based on average completion
  const timelineData = useMemo(() =>
    generateMockTimelineData(10, averageCompletion)
  , [averageCompletion]);

  // Category data (mock for demo - would come from actual workbook data)
  const categoryData = useMemo(() => {
    if (progress.length === 0) return [];
    // Generate mock category breakdown based on progress
    return [
      { category: 'Ownership', passCount: Math.round(averageCompletion * 0.8), failCount: Math.round((100 - averageCompletion) * 0.3), totalTests: 25 },
      { category: 'AML', passCount: Math.round(averageCompletion * 0.9), failCount: Math.round((100 - averageCompletion) * 0.2), totalTests: 25 },
      { category: 'Entity Profile', passCount: Math.round(averageCompletion * 0.85), failCount: Math.round((100 - averageCompletion) * 0.25), totalTests: 30 },
      { category: 'EDD', passCount: Math.round(averageCompletion * 0.75), failCount: Math.round((100 - averageCompletion) * 0.35), totalTests: 20 },
    ];
  }, [progress, averageCompletion]);

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
          className="inline-flex items-center text-sm text-gray-600 dark:text-white/80 hover:text-gray-900 dark:hover:text-white mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Audit Run
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Badge className="bg-crowe-teal/20 text-crowe-teal">Live Monitor</Badge>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
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
            <p className="text-gray-600 dark:text-white/80 mt-2">
              Real-time tracking of auditor workbook completion (5-second refresh)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleLoadDemoData} className="border-gray-200 dark:border-white/20 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 hover:border-gray-300 dark:hover:border-white/30">
              <Database className="h-4 w-4 mr-2" />
              Load Demo Data
            </Button>
            {isPublished && (
              <Button variant="outline" size="sm" onClick={handleSimulateProgress} className="border-gray-200 dark:border-white/20 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 hover:border-gray-300 dark:hover:border-white/30">
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
          <Card className="bg-white dark:bg-white/10 backdrop-blur-xl border border-gray-200/60 dark:border-white/20 shadow-md dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]">
            <CardHeader className="pb-2">
              <CardDescription className="text-gray-600 dark:text-white/80">Total Auditors</CardDescription>
              <CardTitle className="text-3xl text-gray-900 dark:text-white">{totalAuditors}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-white/80">
                <User className="h-4 w-4" />
                Assigned to workbooks
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card className="bg-white dark:bg-white/10 backdrop-blur-xl border border-gray-200/60 dark:border-white/20 shadow-md dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]">
            <CardHeader className="pb-2">
              <CardDescription className="text-gray-600 dark:text-white/80">Submitted</CardDescription>
              <CardTitle className="text-3xl text-gray-900 dark:text-white">{submittedCount} / {totalAuditors}</CardTitle>
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
          <Card className="bg-white dark:bg-white/10 backdrop-blur-xl border border-gray-200/60 dark:border-white/20 shadow-md dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]">
            <CardHeader className="pb-2">
              <CardDescription className="text-gray-600 dark:text-white/80">Average Completion</CardDescription>
              <CardTitle className="text-3xl text-gray-900 dark:text-white">{averageCompletion}%</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={averageCompletion} className="h-2" />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card className="bg-white dark:bg-white/10 backdrop-blur-xl border border-gray-200/60 dark:border-white/20 shadow-md dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]">
            <CardHeader className="pb-2">
              <CardDescription className="text-gray-600 dark:text-white/80">Last Updated</CardDescription>
              <CardTitle className="text-lg text-gray-900 dark:text-white">
                {lastRefresh ? lastRefresh.toLocaleTimeString() : '--:--:--'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-white/80">
                <Clock className="h-4 w-4" />
                {isPolling ? 'Auto-refresh every 5s' : 'Paused'}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Charts Section */}
      {isPublished && progress.length > 0 && (
        <motion.div
          className="mb-6"
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4 bg-gray-100 dark:bg-white/5">
              <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-white/10">
                <PieChart className="h-4 w-4" />
                Status Overview
              </TabsTrigger>
              <TabsTrigger value="auditors" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-white/10">
                <BarChart3 className="h-4 w-4" />
                Auditor Performance
              </TabsTrigger>
              <TabsTrigger value="timeline" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-white/10">
                <LineChart className="h-4 w-4" />
                Timeline
              </TabsTrigger>
              <TabsTrigger value="categories" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-white/10">
                <BarChart3 className="h-4 w-4" />
                By Category
              </TabsTrigger>
            </TabsList>

            {/* Status Overview Tab */}
            <TabsContent value="overview">
              <Card className="bg-white dark:bg-white/10 backdrop-blur-xl border border-gray-200/60 dark:border-white/20">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Completion Status Distribution
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-white/80">
                    Overview of workbook submission status across all auditors
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <ResultPieChart
                        data={statusPieData}
                        height={280}
                        innerRadius={50}
                        outerRadius={90}
                      />
                    </div>
                    <div className="flex flex-col justify-center space-y-4">
                      <div className="p-4 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                        <div className="text-sm text-gray-600 dark:text-white/80 mb-1">Total Auditors</div>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white">{totalAuditors}</div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 rounded-lg bg-crowe-teal/10 border border-crowe-teal/30 text-center">
                          <div className="text-xl font-bold text-crowe-teal-bright">{submittedCount}</div>
                          <div className="text-xs text-gray-600 dark:text-white/80">Submitted</div>
                        </div>
                        <div className="p-3 rounded-lg bg-crowe-cyan/10 border border-crowe-cyan/30 text-center">
                          <div className="text-xl font-bold text-crowe-cyan">{inProgressCount}</div>
                          <div className="text-xs text-gray-600 dark:text-white/80">In Progress</div>
                        </div>
                        <div className="p-3 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-center">
                          <div className="text-xl font-bold text-gray-600 dark:text-white/80">{draftCount}</div>
                          <div className="text-xs text-gray-600 dark:text-white/80">Draft</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Auditor Performance Tab */}
            <TabsContent value="auditors">
              <Card className="bg-white dark:bg-white/10 backdrop-blur-xl border border-gray-200/60 dark:border-white/20">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Auditor Completion Progress
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-white/80">
                    Individual completion percentage for each assigned auditor
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AuditorBarChart
                    data={auditorChartData}
                    height={Math.max(200, progress.length * 50)}
                    variant="completion"
                    barSize={30}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Timeline Tab */}
            <TabsContent value="timeline">
              <Card className="bg-white dark:bg-white/10 backdrop-blur-xl border border-gray-200/60 dark:border-white/20">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                    <LineChart className="h-5 w-5" />
                    Completion Progress Over Time
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-white/80">
                    Tracking average completion rate throughout the audit period
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ProgressTimeline
                    data={timelineData}
                    height={300}
                    showArea={true}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Category Breakdown Tab */}
            <TabsContent value="categories">
              <Card className="bg-white dark:bg-white/10 backdrop-blur-xl border border-gray-200/60 dark:border-white/20">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Results by Attribute Category
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-white/80">
                    Pass/Fail breakdown by testing category (preliminary data)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CategoryBreakdown
                    data={categoryData}
                    height={250}
                    variant="stacked"
                    layout="vertical"
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      )}

      {/* Auditor Progress Cards */}
      <motion.div
        className="mb-6"
        initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-white dark:bg-white/10 backdrop-blur-xl border border-gray-200/60 dark:border-white/20 shadow-md dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-gray-900 dark:text-white">Auditor Progress</CardTitle>
                <CardDescription className="text-gray-600 dark:text-white/80">
                  Individual completion status for each auditor
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPolling(!isPolling)}
                className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10"
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
                <Loader2 className="h-8 w-8 animate-spin text-gray-600 dark:text-white/80" />
              </div>
            ) : progress.length === 0 ? (
              <div className="text-center py-12 text-gray-600 dark:text-white/80">
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
                      <Card className={`transition-all bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 ${
                        auditor.status === 'submitted'
                          ? 'border-green-500 bg-green-500/10'
                          : ''
                      }`}>
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg text-gray-900 dark:text-white">{auditor.auditorName}</CardTitle>
                              <CardDescription className="text-gray-600 dark:text-white/80">{auditor.auditorEmail}</CardDescription>
                            </div>
                            <Badge
                              variant={auditor.status === 'submitted' ? 'default' : 'outline'}
                              className={auditor.status === 'submitted' ? 'bg-green-600' : 'border-gray-300 dark:border-white/30 text-gray-600 dark:text-white/80'}
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
                              <span className="text-gray-600 dark:text-white/80">Completion</span>
                              <span className="font-medium text-gray-900 dark:text-white">{auditor.completionPercentage}%</span>
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
                          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-white/80">
                            <span>{auditor.totalAttributes} attributes × {auditor.totalCustomers} customers</span>
                          </div>

                          {/* Last Activity */}
                          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-white/80">
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
        className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-white/10"
        initial={shouldReduceMotion ? undefined : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <Link href={`/aic/audit-runs/${id}/stage-4`}>
          <Button variant="outline" className="border-gray-200 dark:border-white/20 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 hover:border-gray-300 dark:hover:border-white/30">
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
