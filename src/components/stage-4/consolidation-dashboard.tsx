"use client";

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
} from "lucide-react";
import { toast } from "sonner";
import { ConsolidationResult } from "@/lib/consolidation/engine";
import { downloadConsolidationExcel } from "@/lib/consolidation/export";
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

  const handleExportExcel = () => {
    if (!consolidation) return;
    try {
      const filename = `consolidation-report-${consolidation.auditRunId || 'audit'}-${new Date().toISOString().split("T")[0]}.xlsx`;
      downloadConsolidationExcel(consolidation, filename);
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
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                </CardHeader>
                <CardContent>
                  <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2" />
                  <div className="h-3 w-20 bg-muted animate-pulse rounded" />
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
        className="text-center py-12 text-muted-foreground"
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
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                Total Tests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <motion.div className="text-2xl font-bold tabular-nums">
                {animatedTotalTests}
              </motion.div>
              <p className="text-xs text-muted-foreground">
                across {metrics.uniqueEntitiesTested} entities
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Pass Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <motion.div className={`text-2xl font-bold tabular-nums ${metrics.passRate >= 80 ? 'text-green-600' : metrics.passRate >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
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
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Exceptions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <motion.div className="text-2xl font-bold text-red-600 tabular-nums">
                {animatedExceptions}
              </motion.div>
              <p className="text-xs text-muted-foreground">
                {metrics.failRate.toFixed(1)}% fail rate
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Workbooks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <motion.div className="text-2xl font-bold tabular-nums">
                {animatedWorkbooks}
              </motion.div>
              <p className="text-xs text-muted-foreground">
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
                className="flex items-center gap-4 p-4 bg-green-50 dark:bg-green-950 rounded-lg"
                whileHover={shouldReduceMotion ? undefined : { scale: 1.02, y: -2 }}
              >
                <CheckCircle2 className="h-8 w-8 text-green-600" />
                <div>
                  <motion.div className="text-xl font-bold text-green-600 tabular-nums">
                    {animatedPassCount}
                  </motion.div>
                  <p className="text-xs text-muted-foreground">Pass</p>
                </div>
              </motion.div>

              <motion.div
                variants={staggerItem}
                className="flex items-center gap-4 p-4 bg-green-50 dark:bg-green-950 rounded-lg"
                whileHover={shouldReduceMotion ? undefined : { scale: 1.02, y: -2 }}
              >
                <CheckCircle2 className="h-8 w-8 text-green-500" />
                <div>
                  <motion.div className="text-xl font-bold text-green-500 tabular-nums">
                    {animatedPassWithObs}
                  </motion.div>
                  <p className="text-xs text-muted-foreground">Pass w/Obs</p>
                </div>
              </motion.div>

              <motion.div
                variants={staggerItem}
                className="flex items-center gap-4 p-4 bg-red-50 dark:bg-red-950 rounded-lg"
                whileHover={shouldReduceMotion ? undefined : { scale: 1.02, y: -2 }}
              >
                <XCircle className="h-8 w-8 text-red-600" />
                <div>
                  <motion.div className="text-xl font-bold text-red-600 tabular-nums">
                    {animatedFail1}
                  </motion.div>
                  <p className="text-xs text-muted-foreground">Fail 1 - Reg</p>
                </div>
              </motion.div>

              <motion.div
                variants={staggerItem}
                className="flex items-center gap-4 p-4 bg-orange-50 dark:bg-orange-950 rounded-lg"
                whileHover={shouldReduceMotion ? undefined : { scale: 1.02, y: -2 }}
              >
                <XCircle className="h-8 w-8 text-orange-600" />
                <div>
                  <motion.div className="text-xl font-bold text-orange-600 tabular-nums">
                    {animatedFail2}
                  </motion.div>
                  <p className="text-xs text-muted-foreground">Fail 2 - Proc</p>
                </div>
              </motion.div>

              <motion.div
                variants={staggerItem}
                className="flex items-center gap-4 p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg"
                whileHover={shouldReduceMotion ? undefined : { scale: 1.02, y: -2 }}
              >
                <AlertTriangle className="h-8 w-8 text-yellow-600" />
                <div>
                  <motion.div className="text-xl font-bold text-yellow-600 tabular-nums">
                    {animatedQLOB}
                  </motion.div>
                  <p className="text-xs text-muted-foreground">Q to LOB</p>
                </div>
              </motion.div>

              <motion.div
                variants={staggerItem}
                className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg"
                whileHover={shouldReduceMotion ? undefined : { scale: 1.02, y: -2 }}
              >
                <MinusCircle className="h-8 w-8 text-gray-500" />
                <div>
                  <motion.div className="text-xl font-bold text-gray-500 tabular-nums">
                    {animatedNA}
                  </motion.div>
                  <p className="text-xs text-muted-foreground">N/A</p>
                </div>
              </motion.div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabbed Breakdown View */}
      <motion.div
        initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Tabs defaultValue="category" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
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
                <div className="text-center py-8 text-muted-foreground">
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
                            <Badge variant="outline" className="text-xs">
                              {category.totalTests} tests
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-green-600">
                              {category.passCount} pass
                            </span>
                            <span className="text-red-600">
                              {category.failCount} fail
                            </span>
                            {category.naCount > 0 && (
                              <span className="text-gray-500">
                                {category.naCount} N/A
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="h-3 rounded-full bg-muted overflow-hidden flex">
                          <div
                            className="bg-green-500 h-full transition-all"
                            style={{ width: `${passPercent}%` }}
                          />
                          <div
                            className="bg-red-500 h-full transition-all"
                            style={{ width: `${failPercent}%` }}
                          />
                        </div>
                        {category.failRate > 10 && (
                          <p className="text-xs text-red-600">
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
                <div className="text-center py-8 text-muted-foreground">
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
                            <Badge variant="outline" className="text-xs">
                              {jur.entityCount} entities
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {jur.totalTests} tests
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <span className="text-green-600">{totalPass} pass</span>
                            <span className="text-red-600">{totalFail} fail</span>
                            {jur.questionToLOBCount > 0 && (
                              <span className="text-yellow-600">{jur.questionToLOBCount} Q</span>
                            )}
                          </div>
                        </div>
                        <div className="h-3 rounded-full bg-muted overflow-hidden flex">
                          <div
                            className="bg-green-500 h-full transition-all"
                            style={{ width: `${passPercent}%` }}
                          />
                          <div
                            className="bg-red-500 h-full transition-all"
                            style={{ width: `${failPercent}%` }}
                          />
                        </div>
                        <div className="flex gap-4 text-xs text-muted-foreground">
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
                <div className="text-center py-8 text-muted-foreground">
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
                            <Badge variant="outline" className="text-xs">
                              {aud.entityCount} entities
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {aud.totalTests} tests
                            </Badge>
                            <Badge
                              variant={aud.completionRate >= 100 ? "default" : "destructive"}
                              className="text-xs"
                            >
                              {aud.completionRate.toFixed(0)}% complete
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <span className="text-green-600">{totalPass} pass</span>
                            <span className="text-red-600">{totalFail} fail</span>
                          </div>
                        </div>
                        <div className="h-3 rounded-full bg-muted overflow-hidden flex">
                          <div
                            className="bg-green-500 h-full transition-all"
                            style={{ width: `${passPercent}%` }}
                          />
                          <div
                            className="bg-red-500 h-full transition-all"
                            style={{ width: `${failPercent}%` }}
                          />
                        </div>
                        <div className="flex gap-4 text-xs text-muted-foreground">
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
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">No risk tier data available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {findingsByRiskTier.map((tier) => {
                    const total = tier.passCount + tier.failCount + tier.naCount;
                    const passPercent = total > 0 ? (tier.passCount / total) * 100 : 0;
                    const failPercent = total > 0 ? (tier.failCount / total) * 100 : 0;

                    const tierColor = {
                      Critical: "text-red-700 bg-red-100 dark:bg-red-900",
                      High: "text-orange-700 bg-orange-100 dark:bg-orange-900",
                      Medium: "text-yellow-700 bg-yellow-100 dark:bg-yellow-900",
                      Low: "text-green-700 bg-green-100 dark:bg-green-900",
                    }[tier.riskTier] || "text-gray-700 bg-gray-100";

                    return (
                      <div key={tier.riskTier} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className={tierColor}>{tier.riskTier}</Badge>
                            <Badge variant="outline" className="text-xs">
                              {tier.entityCount} entities
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {tier.totalTests} tests
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <span className="text-green-600">{tier.passCount} pass</span>
                            <span className="text-red-600">{tier.failCount} fail</span>
                            {tier.naCount > 0 && (
                              <span className="text-gray-500">{tier.naCount} N/A</span>
                            )}
                          </div>
                        </div>
                        <div className="h-3 rounded-full bg-muted overflow-hidden flex">
                          <div
                            className="bg-green-500 h-full transition-all"
                            style={{ width: `${passPercent}%` }}
                          />
                          <div
                            className="bg-red-500 h-full transition-all"
                            style={{ width: `${failPercent}%` }}
                          />
                        </div>
                        <div className="flex gap-4 text-xs text-muted-foreground">
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
        </Tabs>
      </motion.div>
    </div>
  );
}
