"use client";

import { useMemo, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnimatedProgress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  CheckCircle2,
  XCircle,
  MinusCircle,
  TrendingUp,
  TrendingDown,
  Users,
  ClipboardList,
  Globe,
  AlertTriangle,
  Download,
  FileSpreadsheet,
  Building2,
  PieChart,
  Sparkles,
  Copy,
  FileText,
  Loader2,
  Bot,
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { ConsolidationResult } from "@/lib/consolidation/engine";
import { downloadConsolidationExcel } from "@/lib/consolidation/export";
import { buildTestingSummaryInput } from "@/lib/ai/testing-summary";
import { CustomerFindingsView } from "./customer-findings-view";
import {
  motion,
  AnimatePresence,
  StaggerContainer,
  StaggerItem,
  useCountUp,
  useReducedMotion,
  staggerContainer,
  staggerItem,
} from "@/lib/animations";
import {
  ResultPieChart,
  FailureAnalysisChart,
  CategoryBreakdown,
  CHART_COLORS,
} from "@/components/charts";

interface ConsolidationDashboardProps {
  consolidation: ConsolidationResult | null;
  isLoading?: boolean;
}

export function ConsolidationDashboard({
  consolidation,
  isLoading,
}: ConsolidationDashboardProps) {
  const shouldReduceMotion = useReducedMotion();

  // Animated count-ups for metrics
  const animatedTotalTests = useCountUp(consolidation?.metrics.totalTests || 0, { duration: 1, delay: 0.2 });
  const animatedPassRate = useCountUp(consolidation?.metrics.passRate || 0, { duration: 1.2, delay: 0.3 });
  const animatedExceptions = useCountUp(consolidation?.metrics.exceptionsCount || 0, { duration: 0.8, delay: 0.4 });
  const animatedWorkbooks = useCountUp(consolidation?.metrics.workbooksSubmitted || 0, { duration: 0.6, delay: 0.5 });

  // Animated counts for result breakdown
  const animatedPassCount = useCountUp(consolidation?.metrics.passCount || 0, { duration: 0.8, delay: 0.6 });
  const animatedPassWithObs = useCountUp(consolidation?.metrics.passWithObservationCount || 0, { duration: 0.8, delay: 0.7 });
  const animatedFail1 = useCountUp(consolidation?.metrics.fail1RegulatoryCount || 0, { duration: 0.8, delay: 0.8 });
  const animatedFail2 = useCountUp(consolidation?.metrics.fail2ProcedureCount || 0, { duration: 0.8, delay: 0.9 });
  const animatedQLOB = useCountUp(consolidation?.metrics.questionToLOBCount || 0, { duration: 0.8, delay: 1.0 });
  const animatedNA = useCountUp(consolidation?.metrics.naCount || 0, { duration: 0.8, delay: 1.1 });

  // AI Testing Summary state
  const [testingSummary, setTestingSummary] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summaryDemoMode, setSummaryDemoMode] = useState(false);

  // Generate AI Testing Summary
  const handleGenerateSummary = useCallback(async () => {
    if (!consolidation) return;

    setIsGeneratingSummary(true);
    try {
      const input = buildTestingSummaryInput(
        consolidation,
        `CDD Testing - ${consolidation.auditRunId}`
      );

      const response = await fetch("/api/ai/testing-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate summary");
      }

      const data = await response.json();
      setTestingSummary(data.summary);
      setSummaryDemoMode(data.demoMode || false);

      if (data.demoMode) {
        toast.info("Generated demo summary (AI not configured)");
      } else {
        toast.success("Testing summary generated successfully");
      }
    } catch (error) {
      console.error("Summary generation error:", error);
      toast.error("Failed to generate testing summary");
    } finally {
      setIsGeneratingSummary(false);
    }
  }, [consolidation]);

  // Copy summary to clipboard
  const handleCopyToClipboard = useCallback(async () => {
    if (!testingSummary) return;

    try {
      await navigator.clipboard.writeText(testingSummary);
      toast.success("Summary copied to clipboard");
    } catch (error) {
      console.error("Copy error:", error);
      toast.error("Failed to copy to clipboard");
    }
  }, [testingSummary]);

  // Export summary to Word-compatible format (downloads as .txt for simplicity)
  const handleExportToWord = useCallback(() => {
    if (!testingSummary) return;

    try {
      const blob = new Blob([testingSummary], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `testing-summary-${consolidation?.auditRunId || "audit"}-${new Date().toISOString().split("T")[0]}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Summary exported successfully");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export summary");
    }
  }, [testingSummary, consolidation?.auditRunId]);

  const handleExportExcel = async () => {
    if (!consolidation) return;
    try {
      const filename = `consolidation-report-${consolidation.auditRunId || 'audit'}-${new Date().toISOString().split("T")[0]}.xlsx`;
      await downloadConsolidationExcel(consolidation, filename);
      toast.success("Excel report exported successfully");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export Excel report");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Loading Summary Cards */}
        <motion.div
          className="grid gap-4 md:grid-cols-4"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {[...Array(4)].map((_, i) => (
            <motion.div key={i} variants={staggerItem}>
              <Card>
                <CardHeader className="pb-2">
                  <div className="h-4 w-24 bg-white/10 animate-pulse rounded" />
                </CardHeader>
                <CardContent>
                  <div className="h-8 w-16 bg-white/10 animate-pulse rounded mb-2" />
                  <div className="h-3 w-20 bg-white/10 animate-pulse rounded" />
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    );
  }

  if (!consolidation) {
    return (
      <motion.div
        className="text-center py-12 text-white/80"
        initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <motion.div
          initial={shouldReduceMotion ? undefined : { scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring" }}
        >
          <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
        </motion.div>
        <h3 className="font-medium mb-2">No consolidation data</h3>
        <p className="text-sm">
          Generate a consolidation to view metrics and results
        </p>
      </motion.div>
    );
  }

  const { metrics, findingsByCategory, findingsByJurisdiction, findingsByAuditor, findingsByRiskTier } = consolidation;

  // Prepare chart data
  const resultPieData = useMemo(() => [
    { name: 'Pass', value: metrics.passCount, color: CHART_COLORS.pass },
    { name: 'Pass w/Obs', value: metrics.passWithObservationCount, color: CHART_COLORS.passObs },
    { name: 'Fail 1 - Reg', value: metrics.fail1RegulatoryCount, color: CHART_COLORS.fail1 },
    { name: 'Fail 2 - Proc', value: metrics.fail2ProcedureCount, color: CHART_COLORS.fail2 },
    { name: 'Questions', value: metrics.questionToLOBCount, color: CHART_COLORS.questions },
    { name: 'N/A', value: metrics.naCount, color: CHART_COLORS.na },
  ].filter(item => item.value > 0), [metrics]);

  const categoryChartData = useMemo(() =>
    findingsByCategory.map(cat => ({
      category: cat.category,
      passCount: cat.passCount,
      failCount: cat.failCount,
      naCount: cat.naCount,
      totalTests: cat.totalTests,
      failRate: cat.failRate,
    }))
  , [findingsByCategory]);

  return (
    <div className="space-y-6">
      {/* Export Button */}
      <motion.div
        className="flex justify-end"
        initial={shouldReduceMotion ? undefined : { opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Button onClick={handleExportExcel} variant="outline">
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Export to Excel
        </Button>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        className="grid gap-4 md:grid-cols-4"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={staggerItem}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white/80 flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                Total Tests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <motion.div className="text-2xl font-bold tabular-nums">
                {animatedTotalTests}
              </motion.div>
              <p className="text-xs text-white/80">
                across {metrics.uniqueEntitiesTested} entities
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white/80 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Pass Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <motion.div className={`text-2xl font-bold tabular-nums ${metrics.passRate >= 80 ? 'text-crowe-teal-bright' : metrics.passRate >= 60 ? 'text-crowe-amber-bright' : 'text-crowe-coral-bright'}`}>
                {animatedPassRate}%
              </motion.div>
              <div className="flex items-center gap-2 mt-1">
                <AnimatedProgress value={metrics.passRate} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white/80 flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Exceptions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <motion.div className="text-2xl font-bold text-crowe-coral-bright tabular-nums">
                {animatedExceptions}
              </motion.div>
              <p className="text-xs text-white/80">
                {metrics.failRate.toFixed(1)}% fail rate
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white/80 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Workbooks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <motion.div className="text-2xl font-bold tabular-nums">
                {animatedWorkbooks}
              </motion.div>
              <p className="text-xs text-white/80">
                submitted for consolidation
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Test Results Summary */}
      <motion.div
        initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Test Results Summary</CardTitle>
            <CardDescription>
              Breakdown of all test results across submitted workbooks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <motion.div
              className="grid gap-4 md:grid-cols-3 lg:grid-cols-6"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              <motion.div
                variants={staggerItem}
                className="p-3 rounded-lg text-center flex flex-col items-center justify-center min-h-[80px] bg-crowe-teal/10"
                whileHover={shouldReduceMotion ? undefined : { scale: 1.02, y: -2 }}
              >
                <CheckCircle2 className="h-6 w-6 text-crowe-teal-bright mb-1" />
                <motion.div className="text-xl font-bold text-crowe-teal-bright tabular-nums">
                  {animatedPassCount}
                </motion.div>
                <p className="text-xs text-white/80">Pass</p>
              </motion.div>

              <motion.div
                variants={staggerItem}
                className="p-3 rounded-lg text-center flex flex-col items-center justify-center min-h-[80px] bg-crowe-amber/10"
                whileHover={shouldReduceMotion ? undefined : { scale: 1.02, y: -2 }}
              >
                <CheckCircle2 className="h-6 w-6 text-crowe-amber-bright mb-1" />
                <motion.div className="text-xl font-bold text-crowe-amber-bright tabular-nums">
                  {animatedPassWithObs}
                </motion.div>
                <p className="text-xs text-white/80">Pass w/Obs</p>
              </motion.div>

              <motion.div
                variants={staggerItem}
                className="p-3 rounded-lg text-center flex flex-col items-center justify-center min-h-[80px] bg-crowe-coral/10"
                whileHover={shouldReduceMotion ? undefined : { scale: 1.02, y: -2 }}
              >
                <XCircle className="h-6 w-6 text-crowe-coral-bright mb-1" />
                <motion.div className="text-xl font-bold text-crowe-coral-bright tabular-nums">
                  {animatedFail1}
                </motion.div>
                <p className="text-xs text-white/80">Fail 1 - Reg</p>
              </motion.div>

              <motion.div
                variants={staggerItem}
                className="p-3 rounded-lg text-center flex flex-col items-center justify-center min-h-[80px] bg-crowe-amber-dark/10"
                whileHover={shouldReduceMotion ? undefined : { scale: 1.02, y: -2 }}
              >
                <XCircle className="h-6 w-6 text-crowe-amber mb-1" />
                <motion.div className="text-xl font-bold text-crowe-amber tabular-nums">
                  {animatedFail2}
                </motion.div>
                <p className="text-xs text-white/80">Fail 2 - Proc</p>
              </motion.div>

              <motion.div
                variants={staggerItem}
                className="p-3 rounded-lg text-center flex flex-col items-center justify-center min-h-[80px] bg-crowe-blue/10"
                whileHover={shouldReduceMotion ? undefined : { scale: 1.02, y: -2 }}
              >
                <AlertTriangle className="h-6 w-6 text-crowe-blue-light mb-1" />
                <motion.div className="text-xl font-bold text-crowe-blue-light tabular-nums">
                  {animatedQLOB}
                </motion.div>
                <p className="text-xs text-white/80">Q to LOB</p>
              </motion.div>

              <motion.div
                variants={staggerItem}
                className="p-3 rounded-lg text-center flex flex-col items-center justify-center min-h-[80px] bg-white/10"
                whileHover={shouldReduceMotion ? undefined : { scale: 1.02, y: -2 }}
              >
                <MinusCircle className="h-6 w-6 text-white/80 mb-1" />
                <motion.div className="text-xl font-bold text-white/80 tabular-nums">
                  {animatedNA}
                </motion.div>
                <p className="text-xs text-white/80">N/A</p>
              </motion.div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Visual Analytics Section */}
      <motion.div
        initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
      >
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Result Distribution Pie Chart */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <PieChart className="h-4 w-4" />
                Result Distribution
              </CardTitle>
              <CardDescription>
                Overall breakdown of test results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResultPieChart
                data={resultPieData}
                height={280}
                innerRadius={50}
                outerRadius={90}
                showLegend={true}
              />
            </CardContent>
          </Card>

          {/* Failure Analysis Chart */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="h-4 w-4 text-crowe-coral-bright" />
                Exception Breakdown
              </CardTitle>
              <CardDescription>
                Analysis of failures and questions by type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FailureAnalysisChart
                fail1Count={metrics.fail1RegulatoryCount}
                fail2Count={metrics.fail2ProcedureCount}
                questionCount={metrics.questionToLOBCount}
                height={280}
                variant="bar"
                showLegend={false}
              />
            </CardContent>
          </Card>

          {/* Category Performance Chart */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-4 w-4" />
                Category Fail Rates
              </CardTitle>
              <CardDescription>
                Failure rate by attribute category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CategoryBreakdown
                data={categoryChartData}
                height={280}
                variant="failRate"
                layout="vertical"
                showLegend={false}
              />
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Tabbed Breakdown View */}
      <motion.div
        initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Tabs defaultValue="category" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="category" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            By Category
          </TabsTrigger>
          <TabsTrigger value="jurisdiction" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            By Jurisdiction
          </TabsTrigger>
          <TabsTrigger value="auditor" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            By Auditor
          </TabsTrigger>
          <TabsTrigger value="risk" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            By Risk Tier
          </TabsTrigger>
          <TabsTrigger value="customer" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            By Customer
          </TabsTrigger>
        </TabsList>

        {/* Results by Category */}
        <TabsContent value="category">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Results by Category
              </CardTitle>
              <CardDescription>
                Pass/Fail breakdown by testing category (sorted by fail rate)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {findingsByCategory.length === 0 ? (
                <div className="text-center py-8 text-white/80">
                  <p className="text-sm">No category data available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {findingsByCategory.map((category) => {
                    const total = category.passCount + category.failCount + category.naCount;
                    const passPercent = total > 0 ? (category.passCount / total) * 100 : 0;
                    const failPercent = total > 0 ? (category.failCount / total) * 100 : 0;

                    return (
                      <div key={category.category} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{category.category}</span>
                            <Badge variant="outline" className="px-2.5 py-0.5 text-xs font-medium">
                              {category.totalTests} tests
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-crowe-teal-bright">
                              {category.passCount} pass
                            </span>
                            <span className="text-crowe-coral-bright">
                              {category.failCount} fail
                            </span>
                            {category.naCount > 0 && (
                              <span className="text-white/80">
                                {category.naCount} N/A
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="h-2 rounded-full bg-white/10 overflow-hidden flex">
                          <div
                            className="bg-crowe-teal h-full transition-all"
                            style={{ width: `${passPercent}%` }}
                          />
                          <div
                            className="bg-crowe-coral h-full transition-all"
                            style={{ width: `${failPercent}%` }}
                          />
                        </div>
                        {category.failRate > 10 && (
                          <p className="text-xs text-crowe-coral-bright">
                            {category.failRate.toFixed(1)}% failure rate - requires attention
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Results by Jurisdiction */}
        <TabsContent value="jurisdiction">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Results by Jurisdiction
              </CardTitle>
              <CardDescription>
                Testing results breakdown by jurisdiction
              </CardDescription>
            </CardHeader>
            <CardContent>
              {findingsByJurisdiction.length === 0 ? (
                <div className="text-center py-8 text-white/80">
                  <p className="text-sm">No jurisdiction data available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {findingsByJurisdiction.map((jur) => {
                    const totalPass = jur.passCount + jur.passWithObservationCount;
                    const totalFail = jur.fail1Count + jur.fail2Count;
                    const total = totalPass + totalFail + jur.naCount + jur.questionToLOBCount;
                    const passPercent = total > 0 ? (totalPass / total) * 100 : 0;
                    const failPercent = total > 0 ? (totalFail / total) * 100 : 0;

                    return (
                      <div key={jur.jurisdictionId} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{jur.jurisdictionName || jur.jurisdictionId}</span>
                            <Badge variant="outline" className="px-2.5 py-0.5 text-xs font-medium">
                              {jur.entityCount} entities
                            </Badge>
                            <Badge variant="secondary" className="px-2.5 py-0.5 text-xs font-medium">
                              {jur.totalTests} tests
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <span className="text-crowe-teal-bright">{totalPass} pass</span>
                            <span className="text-crowe-coral-bright">{totalFail} fail</span>
                            {jur.questionToLOBCount > 0 && (
                              <span className="text-crowe-amber-bright">{jur.questionToLOBCount} Q</span>
                            )}
                          </div>
                        </div>
                        <div className="h-2 rounded-full bg-white/10 overflow-hidden flex">
                          <div
                            className="bg-crowe-teal h-full transition-all"
                            style={{ width: `${passPercent}%` }}
                          />
                          <div
                            className="bg-crowe-coral h-full transition-all"
                            style={{ width: `${failPercent}%` }}
                          />
                        </div>
                        <div className="flex gap-4 text-xs text-white/80">
                          <span>Pass Rate: {jur.passRate.toFixed(1)}%</span>
                          <span>Fail Rate: {jur.failRate.toFixed(1)}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Results by Auditor */}
        <TabsContent value="auditor">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Results by Auditor
              </CardTitle>
              <CardDescription>
                Testing results breakdown by auditor
              </CardDescription>
            </CardHeader>
            <CardContent>
              {findingsByAuditor.length === 0 ? (
                <div className="text-center py-8 text-white/80">
                  <p className="text-sm">No auditor data available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {findingsByAuditor.map((aud) => {
                    const totalPass = aud.passCount + aud.passWithObservationCount;
                    const totalFail = aud.fail1Count + aud.fail2Count;
                    const total = totalPass + totalFail + aud.naCount + aud.questionToLOBCount;
                    const passPercent = total > 0 ? (totalPass / total) * 100 : 0;
                    const failPercent = total > 0 ? (totalFail / total) * 100 : 0;

                    return (
                      <div key={aud.auditorId} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{aud.auditorName}</span>
                            <Badge variant="outline" className="px-2.5 py-0.5 text-xs font-medium">
                              {aud.entityCount} entities
                            </Badge>
                            <Badge variant="secondary" className="px-2.5 py-0.5 text-xs font-medium">
                              {aud.totalTests} tests
                            </Badge>
                            <Badge
                              variant={aud.completionRate >= 100 ? "default" : "destructive"}
                              className="px-2.5 py-0.5 text-xs font-medium"
                            >
                              {aud.completionRate.toFixed(0)}% complete
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <span className="text-crowe-teal-bright">{totalPass} pass</span>
                            <span className="text-crowe-coral-bright">{totalFail} fail</span>
                          </div>
                        </div>
                        <div className="h-2 rounded-full bg-white/10 overflow-hidden flex">
                          <div
                            className="bg-crowe-teal h-full transition-all"
                            style={{ width: `${passPercent}%` }}
                          />
                          <div
                            className="bg-crowe-coral h-full transition-all"
                            style={{ width: `${failPercent}%` }}
                          />
                        </div>
                        <div className="flex gap-4 text-xs text-white/80">
                          <span>Pass Rate: {aud.passRate.toFixed(1)}%</span>
                          <span>Fail Rate: {aud.failRate.toFixed(1)}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Results by Risk Tier */}
        <TabsContent value="risk">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Results by Risk Tier
              </CardTitle>
              <CardDescription>
                Testing results breakdown by entity risk tier (based on IRR)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {findingsByRiskTier.length === 0 ? (
                <div className="text-center py-8 text-white/80">
                  <p className="text-sm">No risk tier data available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {findingsByRiskTier.map((tier) => {
                    const total = tier.passCount + tier.failCount + tier.naCount;
                    const passPercent = total > 0 ? (tier.passCount / total) * 100 : 0;
                    const failPercent = total > 0 ? (tier.failCount / total) * 100 : 0;

                    const tierColor = {
                      Critical: "text-crowe-coral-bright bg-crowe-coral/20",
                      High: "text-crowe-amber bg-crowe-amber-dark/20",
                      Medium: "text-crowe-amber-bright bg-crowe-amber/20",
                      Low: "text-crowe-teal-bright bg-crowe-teal/20",
                    }[tier.riskTier] || "text-white/80 bg-white/10";

                    return (
                      <div key={tier.riskTier} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className={`px-2.5 py-0.5 text-xs font-medium ${tierColor}`}>{tier.riskTier}</Badge>
                            <Badge variant="outline" className="px-2.5 py-0.5 text-xs font-medium">
                              {tier.entityCount} entities
                            </Badge>
                            <Badge variant="secondary" className="px-2.5 py-0.5 text-xs font-medium">
                              {tier.totalTests} tests
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <span className="text-crowe-teal-bright">{tier.passCount} pass</span>
                            <span className="text-crowe-coral-bright">{tier.failCount} fail</span>
                            {tier.naCount > 0 && (
                              <span className="text-white/80">{tier.naCount} N/A</span>
                            )}
                          </div>
                        </div>
                        <div className="h-2 rounded-full bg-white/10 overflow-hidden flex">
                          <div
                            className="bg-crowe-teal h-full transition-all"
                            style={{ width: `${passPercent}%` }}
                          />
                          <div
                            className="bg-crowe-coral h-full transition-all"
                            style={{ width: `${failPercent}%` }}
                          />
                        </div>
                        <div className="flex gap-4 text-xs text-white/80">
                          <span>Pass Rate: {tier.passRate.toFixed(1)}%</span>
                          <span>Fail Rate: {tier.failRate.toFixed(1)}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Results by Customer */}
        <TabsContent value="customer">
          <CustomerFindingsView
            customerFindings={consolidation.customerFindings || []}
          />
        </TabsContent>
        </Tabs>
      </motion.div>

      {/* AI-Generated Testing Summary */}
      <motion.div
        initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="border-crowe-indigo/30 bg-gradient-to-br from-crowe-indigo-dark/20 to-crowe-indigo/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-white">
                <Bot className="h-5 w-5 text-crowe-amber" />
                AI-Generated Testing Summary
              </CardTitle>
              <CardDescription className="text-white/80">
                Comprehensive audit documentation generated from testing results
              </CardDescription>
            </div>
            <Button
              onClick={handleGenerateSummary}
              disabled={isGeneratingSummary}
              className="bg-crowe-amber hover:bg-crowe-amber-dark text-crowe-indigo-dark font-medium"
            >
              {isGeneratingSummary ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Summary
                </>
              )}
            </Button>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              {testingSummary ? (
                <motion.div
                  key="summary"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Demo Mode Badge */}
                  {summaryDemoMode && (
                    <div className="mb-4 flex items-center gap-2">
                      <Badge variant="outline" className="bg-crowe-amber/10 text-crowe-amber-bright border-crowe-amber/30">
                        <Bot className="h-3 w-3 mr-1" />
                        Demo Mode
                      </Badge>
                      <span className="text-xs text-white/80">
                        AI API not configured - showing sample summary
                      </span>
                    </div>
                  )}

                  {/* Summary Content */}
                  <div className="prose prose-invert prose-sm max-w-none rounded-lg bg-white/5 p-6 border border-white/10">
                    <ReactMarkdown
                      components={{
                        h1: ({ children }) => (
                          <h1 className="text-xl font-bold text-white mb-4 mt-0">{children}</h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="text-lg font-semibold text-crowe-amber-bright mb-3 mt-6 border-b border-white/10 pb-2">{children}</h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className="text-base font-medium text-white/90 mb-2 mt-4">{children}</h3>
                        ),
                        p: ({ children }) => (
                          <p className="text-white/80 mb-3 leading-relaxed">{children}</p>
                        ),
                        ul: ({ children }) => (
                          <ul className="text-white/80 mb-4 ml-4 list-disc space-y-1">{children}</ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="text-white/80 mb-4 ml-4 list-decimal space-y-1">{children}</ol>
                        ),
                        li: ({ children }) => (
                          <li className="text-white/80">{children}</li>
                        ),
                        strong: ({ children }) => (
                          <strong className="text-white font-semibold">{children}</strong>
                        ),
                        em: ({ children }) => (
                          <em className="text-white/80 italic">{children}</em>
                        ),
                        table: ({ children }) => (
                          <div className="overflow-x-auto my-4">
                            <table className="w-full border-collapse border border-white/20 text-sm">{children}</table>
                          </div>
                        ),
                        thead: ({ children }) => (
                          <thead className="bg-white/10">{children}</thead>
                        ),
                        th: ({ children }) => (
                          <th className="border border-white/20 px-3 py-2 text-left text-white font-semibold">{children}</th>
                        ),
                        td: ({ children }) => (
                          <td className="border border-white/20 px-3 py-2 text-white/80">{children}</td>
                        ),
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-4 border-crowe-amber/50 pl-4 my-4 text-white/80 italic">{children}</blockquote>
                        ),
                        hr: () => (
                          <hr className="border-white/20 my-6" />
                        ),
                        code: ({ children }) => (
                          <code className="bg-white/10 px-1.5 py-0.5 rounded text-crowe-cyan-light text-sm">{children}</code>
                        ),
                      }}
                    >
                      {testingSummary}
                    </ReactMarkdown>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 mt-4">
                    <Button
                      variant="outline"
                      onClick={handleCopyToClipboard}
                      className="border-white/20 hover:bg-white/10"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy to Clipboard
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleExportToWord}
                      className="border-white/20 hover:bg-white/10"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Export as Markdown
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-12"
                >
                  <Bot className="h-12 w-12 mx-auto mb-4 text-white/50" />
                  <p className="text-white/80 mb-2">
                    No summary generated yet
                  </p>
                  <p className="text-sm text-white/80">
                    Click &quot;Generate Summary&quot; to create comprehensive audit documentation
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
