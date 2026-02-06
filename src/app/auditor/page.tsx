"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import {
  motion,
  staggerContainer,
  staggerItem,
  fadeInUp,
  useReducedMotion,
} from "@/lib/animations";
import { getSession, getCurrentAuditorId } from "@/lib/auth/session";
import { getStageData } from "@/lib/stage-data";
import type { PivotedAuditorWorkbook } from "@/lib/stage-data/store";

interface WorkbookSummary {
  id: string;
  auditorId: string;
  auditorName: string;
  status: 'draft' | 'in_progress' | 'submitted';
  completionPercentage: number;
  totalAttributes: number;
  totalCustomers: number;
  lastActivityAt: string | null;
  submittedAt: string | null;
}

export default function AuditorDashboardPage() {
  const shouldReduceMotion = useReducedMotion();
  const [workbooks, setWorkbooks] = useState<WorkbookSummary[]>([]);
  const [auditorName, setAuditorName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const session = getSession();
    if (session?.auditorName) {
      setAuditorName(session.auditorName);
    }

    // Load workbooks for current auditor
    const currentAuditorId = getCurrentAuditorId();
    const published = getStageData("workbooksPublished");
    const pivotedWorkbooks = getStageData("pivotedWorkbooks") as PivotedAuditorWorkbook[] | null;
    const auditorProgress = getStageData("auditorProgress") as Record<string, {
      completionPercentage: number;
      status: 'draft' | 'in_progress' | 'submitted';
      lastActivityAt: string;
      submittedAt: string | null;
    }> | null;

    if (published && pivotedWorkbooks && currentAuditorId) {
      // Filter to only this auditor's workbooks
      const myWorkbooks = pivotedWorkbooks
        .filter(wb => wb.auditorId === currentAuditorId)
        .map(wb => {
          const progress = auditorProgress?.[wb.auditorId];
          return {
            id: wb.auditorId,
            auditorId: wb.auditorId,
            auditorName: wb.auditorName,
            status: progress?.status || 'in_progress',
            completionPercentage: progress?.completionPercentage || 0,
            totalAttributes: wb.attributes.length,
            totalCustomers: wb.assignedCustomers.length,
            lastActivityAt: progress?.lastActivityAt || null,
            submittedAt: progress?.submittedAt || null,
          } as WorkbookSummary;
        });

      setWorkbooks(myWorkbooks);
    }

    setIsLoading(false);
  }, []);

  // Calculate stats
  const totalWorkbooks = workbooks.length;
  const submittedCount = workbooks.filter(w => w.status === 'submitted').length;
  const inProgressCount = workbooks.filter(w => w.status === 'in_progress').length;
  const averageCompletion = workbooks.length > 0
    ? Math.round(workbooks.reduce((sum, w) => sum + w.completionPercentage, 0) / workbooks.length)
    : 0;

  return (
    <div className="p-8 min-h-full">
      {/* Header */}
      <motion.div
        className="mb-8"
        initial={shouldReduceMotion ? undefined : "hidden"}
        animate="visible"
        variants={fadeInUp}
      >
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Welcome back, {auditorName || "Auditor"}
        </h1>
        <p className="text-gray-500 dark:text-white/80 mt-2">
          View and complete your assigned testing workbooks
        </p>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        className="grid gap-3 md:grid-cols-4 mb-6"
        initial={shouldReduceMotion ? undefined : "hidden"}
        animate="visible"
        variants={staggerContainer}
      >
        <motion.div variants={staggerItem}>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Workbooks</CardDescription>
              <CardTitle className="text-3xl">{totalWorkbooks}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-white/80">
                <FileSpreadsheet className="h-4 w-4" />
                Assigned to you
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>In Progress</CardDescription>
              <CardTitle className="text-3xl text-crowe-amber-dark dark:text-crowe-amber">{inProgressCount}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-white/80">
                <Clock className="h-4 w-4" />
                Awaiting completion
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Submitted</CardDescription>
              <CardTitle className="text-3xl text-crowe-teal-dark dark:text-crowe-teal-bright">{submittedCount}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-white/80">
                <CheckCircle2 className="h-4 w-4" />
                Completed
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Avg. Completion</CardDescription>
              <CardTitle className="text-3xl">{averageCompletion}%</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={averageCompletion} className="h-2" />
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Workbooks List */}
      <motion.div
        initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>My Workbooks</CardTitle>
            <CardDescription>
              Click on a workbook to continue testing
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-gray-500 dark:text-white/80">Loading workbooks...</div>
              </div>
            ) : workbooks.length === 0 ? (
              <div className="text-center py-12">
                <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-white/50" />
                <h3 className="font-medium mb-2 text-gray-900 dark:text-white">No Workbooks Assigned</h3>
                <p className="text-sm text-gray-500 dark:text-white/80 mb-4">
                  You don&apos;t have any published workbooks assigned to you yet.
                </p>
                <div className="p-4 bg-crowe-amber/10 border border-crowe-amber/30 rounded-lg inline-block">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-crowe-amber-dark dark:text-crowe-amber mt-0.5" />
                    <p className="text-sm text-crowe-amber-dark dark:text-crowe-amber text-left">
                      The AIC needs to publish workbooks in Stage 4 before you can see them here.
                      Please check back later or contact your AIC.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <motion.div
                className="space-y-3"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                {workbooks.map((workbook) => (
                  <motion.div key={workbook.id} variants={staggerItem}>
                    <Link href={`/auditor/workbooks/${workbook.id}`}>
                      <Card className={`transition-all cursor-pointer ${
                        workbook.status === 'submitted'
                          ? 'border-crowe-teal/50 bg-crowe-teal/10'
                          : 'hover:bg-gray-100 dark:hover:bg-white/15 hover:border-crowe-amber/50'
                      }`}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-medium text-gray-900 dark:text-white">Testing Workbook</h3>
                                <Badge
                                  variant={workbook.status === 'submitted' ? 'default' : 'outline'}
                                  className={workbook.status === 'submitted' ? 'bg-crowe-teal' : ''}
                                >
                                  {workbook.status === 'submitted' ? (
                                    <>
                                      <CheckCircle2 className="h-3 w-3 mr-1" />
                                      Submitted
                                    </>
                                  ) : (
                                    'In Progress'
                                  )}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-white/80 mb-3">
                                <span>{workbook.totalAttributes} attributes</span>
                                <span>|</span>
                                <span>{workbook.totalCustomers} customers</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="flex-1 max-w-xs">
                                  <div className="flex justify-between text-sm mb-1">
                                    <span>Completion</span>
                                    <span className="font-medium">{workbook.completionPercentage}%</span>
                                  </div>
                                  <Progress
                                    value={workbook.completionPercentage}
                                    className={`h-2 ${
                                      workbook.completionPercentage >= 95
                                        ? '[&>div]:bg-crowe-teal'
                                        : ''
                                    }`}
                                  />
                                </div>
                                {workbook.lastActivityAt && (
                                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-white/80">
                                    <Clock className="h-3 w-3" />
                                    Last activity: {new Date(workbook.lastActivityAt).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            </div>
                            <Button variant="ghost" size="icon">
                              <ArrowRight className="h-5 w-5" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
