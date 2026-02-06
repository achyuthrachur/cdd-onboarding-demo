"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

interface WorkbookStats {
  total: number;
  inProgress: number;
  submitted: number;
  averageCompletion: number;
}

export default function AuditorDashboardPage() {
  const shouldReduceMotion = useReducedMotion();
  const [auditorName, setAuditorName] = useState<string>("");
  const [stats, setStats] = useState<WorkbookStats>({ total: 0, inProgress: 0, submitted: 0, averageCompletion: 0 });
  const [hasWorkbooks, setHasWorkbooks] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const session = getSession();
    if (session?.auditorName) {
      setAuditorName(session.auditorName);
    }

    // Load workbook stats for current auditor
    const currentAuditorId = getCurrentAuditorId();
    const published = getStageData("workbooksPublished");
    const pivotedWorkbooks = getStageData("pivotedWorkbooks") as PivotedAuditorWorkbook[] | null;
    const auditorProgress = getStageData("auditorProgress") as Record<string, {
      completionPercentage: number;
      status: 'draft' | 'in_progress' | 'submitted';
    }> | null;

    if (published && pivotedWorkbooks && currentAuditorId) {
      const myWorkbooks = pivotedWorkbooks.filter(wb => wb.auditorId === currentAuditorId);

      if (myWorkbooks.length > 0) {
        setHasWorkbooks(true);

        const workbookStats = myWorkbooks.map(wb => {
          const progress = auditorProgress?.[wb.auditorId];
          return {
            status: progress?.status || 'in_progress',
            completionPercentage: progress?.completionPercentage || 0,
          };
        });

        const total = workbookStats.length;
        const submitted = workbookStats.filter(w => w.status === 'submitted').length;
        const inProgress = workbookStats.filter(w => w.status === 'in_progress').length;
        const averageCompletion = total > 0
          ? Math.round(workbookStats.reduce((sum, w) => sum + w.completionPercentage, 0) / total)
          : 0;

        setStats({ total, inProgress, submitted, averageCompletion });
      }
    }

    setIsLoading(false);
  }, []);

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
        <p className="text-gray-500 dark:text-gray-300 mt-2">
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
              <CardTitle className="text-3xl">{stats.total}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-300">
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
              <CardTitle className="text-3xl text-crowe-amber-dark dark:text-crowe-amber">{stats.inProgress}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-300">
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
              <CardTitle className="text-3xl text-crowe-teal-dark dark:text-crowe-teal-bright">{stats.submitted}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-300">
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
              <CardTitle className="text-3xl">{stats.averageCompletion}%</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={stats.averageCompletion} className="h-2" />
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Access your testing workbooks
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-500 dark:text-gray-300">Loading...</div>
              </div>
            ) : hasWorkbooks ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="h-8 w-8 text-crowe-amber" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {stats.inProgress > 0 ? `${stats.inProgress} workbook${stats.inProgress > 1 ? 's' : ''} in progress` : 'All workbooks submitted'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-300">
                        {stats.averageCompletion}% average completion
                      </p>
                    </div>
                  </div>
                  <Link href="/auditor/workbooks">
                    <Button>
                      View Workbooks
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                <h3 className="font-medium mb-2 text-gray-900 dark:text-white">No Workbooks Assigned</h3>
                <p className="text-sm text-gray-500 dark:text-gray-300 mb-4">
                  You don&apos;t have any published workbooks assigned to you yet.
                </p>
                <div className="p-4 bg-crowe-amber/10 border border-crowe-amber/30 rounded-lg inline-block">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-crowe-amber-dark dark:text-crowe-amber mt-0.5" />
                    <p className="text-sm text-crowe-amber-dark dark:text-crowe-amber text-left">
                      The AIC needs to publish workbooks in Stage 4 before you can see them here.
                      Go to <Link href="/auditor/workbooks" className="underline font-medium">My Workbooks</Link> to load demo data.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
