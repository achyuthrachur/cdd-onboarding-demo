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
  Database,
} from "lucide-react";
import {
  motion,
  staggerContainer,
  staggerItem,
  fadeInUp,
  useReducedMotion,
} from "@/lib/animations";
import { toast } from "sonner";
import { getCurrentAuditorId } from "@/lib/auth/session";
import { getStageData, setStageData, loadFallbackDataForStage } from "@/lib/stage-data";
import type { PivotedAuditorWorkbook, CustomerTestResult } from "@/lib/stage-data/store";

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

export default function AuditorWorkbooksPage() {
  const shouldReduceMotion = useReducedMotion();
  const [workbooks, setWorkbooks] = useState<WorkbookSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadWorkbooks = () => {
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
    } else {
      setWorkbooks([]);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadWorkbooks();
  }, []);

  const handleLoadDemoData = () => {
    try {
      // Check if AIC has already published workbooks — don't overwrite them
      const existingPublished = getStageData("workbooksPublished");
      const existingWorkbooks = getStageData("pivotedWorkbooks") as PivotedAuditorWorkbook[] | null;

      if (existingPublished && existingWorkbooks && existingWorkbooks.length > 0) {
        // Workbooks already exist from AIC publication
        // Populate demo testing results for the current auditor's workbook
        const currentAuditorId = getCurrentAuditorId();
        if (currentAuditorId) {
          const wbIndex = existingWorkbooks.findIndex(wb => wb.auditorId === currentAuditorId);
          if (wbIndex >= 0) {
            const wb = existingWorkbooks[wbIndex];
            // Check if results are already populated (idempotent)
            const alreadyPopulated = wb.rows.some(row =>
              Object.values(row.customerResults).some(r => r.result !== '')
            );
            if (!alreadyPopulated) {
              const resultOptions: Array<CustomerTestResult['result']> = [
                'Pass', 'Pass', 'Pass', 'Pass', // weighted toward Pass
                'Pass w/Observation',
                'Fail 1 - Regulatory',
                'Fail 2 - Procedure',
                'N/A',
                '', // empty = not yet tested
                '',
              ];
              let filledCount = 0;
              let totalCells = 0;
              const updatedRows = wb.rows.map(row => {
                const updatedResults: Record<string, CustomerTestResult> = {};
                for (const customer of wb.assignedCustomers) {
                  totalCells++;
                  const existing = row.customerResults[customer.customerId];
                  // ~35% of cells get a result
                  if (Math.random() < 0.35) {
                    const result = resultOptions[Math.floor(Math.random() * resultOptions.length)];
                    if (result !== '') {
                      filledCount++;
                      // Pick a document from acceptableDocs if available
                      const doc = row.acceptableDocs.length > 0
                        ? row.acceptableDocs[Math.floor(Math.random() * row.acceptableDocs.length)]
                        : undefined;
                      updatedResults[customer.customerId] = {
                        customerId: customer.customerId,
                        customerName: customer.customerName,
                        selectedDocument: doc?.value || '',
                        result,
                        observation: result === 'Pass w/Observation' ? 'Minor documentation gap noted' : '',
                      };
                      continue;
                    }
                  }
                  // Keep empty
                  updatedResults[customer.customerId] = existing || {
                    customerId: customer.customerId,
                    customerName: customer.customerName,
                    selectedDocument: '',
                    result: '' as CustomerTestResult['result'],
                    observation: '',
                  };
                }
                return { ...row, customerResults: updatedResults };
              });

              const completionPct = totalCells > 0 ? Math.round((filledCount / totalCells) * 100) : 0;

              // Update the workbook in store
              const updatedWorkbooks = [...existingWorkbooks];
              updatedWorkbooks[wbIndex] = { ...wb, rows: updatedRows, status: 'in_progress' };
              setStageData("pivotedWorkbooks", updatedWorkbooks);

              // Update auditor progress
              const existingProgress = (getStageData("auditorProgress") || {}) as Record<string, {
                completionPercentage: number;
                status: 'draft' | 'in_progress' | 'submitted';
                lastActivityAt: string;
                submittedAt: string | null;
              }>;
              setStageData("auditorProgress", {
                ...existingProgress,
                [currentAuditorId]: {
                  completionPercentage: completionPct,
                  status: 'in_progress' as const,
                  lastActivityAt: new Date().toISOString(),
                  submittedAt: null,
                },
              });
            }
          }
        }
        loadWorkbooks();
        toast.info("Loaded existing published workbooks with demo testing results.");
        return;
      }

      // No published workbooks exist — generate demo data from scratch
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

      // Add some progress for the current auditor
      const currentAuditorId = getCurrentAuditorId();
      const pivotedWorkbooks = getStageData("pivotedWorkbooks") as PivotedAuditorWorkbook[] | null;

      if (pivotedWorkbooks && currentAuditorId) {
        const myWorkbook = pivotedWorkbooks.find(wb => wb.auditorId === currentAuditorId);
        if (myWorkbook) {
          const auditorProgress = getStageData("auditorProgress") || {};
          const updatedProgress = {
            ...auditorProgress,
            [currentAuditorId]: {
              completionPercentage: 35,
              status: 'in_progress' as const,
              lastActivityAt: new Date().toISOString(),
              submittedAt: null,
            },
          };
          setStageData("auditorProgress", updatedProgress);
        }
      }

      // Use setTimeout to ensure localStorage updates are complete before reloading
      setTimeout(() => {
        loadWorkbooks();
        toast.success(`Demo data loaded! ${pivotedWorkbooks?.length || 0} workbooks available.`);
      }, 100);
    } catch (error) {
      console.error("Error loading demo data:", error);
      toast.error("Failed to load demo data. Please try again.");
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <motion.div
        className="mb-8"
        initial={shouldReduceMotion ? undefined : "hidden"}
        animate="visible"
        variants={fadeInUp}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">My Workbooks</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              View and complete your assigned testing workbooks
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleLoadDemoData} className="border-gray-200 dark:border-white/20 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10">
            <Database className="h-4 w-4 mr-2" />
            Load Demo Data
          </Button>
        </div>
      </motion.div>

      {/* Workbooks List */}
      <Card className="bg-white dark:bg-white/10 backdrop-blur-xl border border-gray-200/60 dark:border-white/20 shadow-lg dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Assigned Workbooks</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300">
            Testing workbooks published by the AIC for your completion
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-600 dark:text-gray-300">Loading workbooks...</div>
            </div>
          ) : workbooks.length === 0 ? (
            <div className="text-center py-12">
              <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
              <h3 className="font-medium mb-2 text-gray-900 dark:text-white">No Workbooks Available</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                You don&apos;t have any published workbooks assigned to you yet.
              </p>
              <div className="p-4 bg-crowe-amber/20 border border-crowe-amber/40 rounded-lg inline-block">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-crowe-amber mt-0.5" />
                  <div className="text-sm text-crowe-amber-bright text-left">
                    <p className="mb-2">
                      The AIC needs to publish workbooks before you can see them here.
                    </p>
                    <p>
                      For demo purposes, click &quot;Load Demo Data&quot; above to simulate published workbooks.
                    </p>
                  </div>
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
                    <Card className={`transition-all cursor-pointer bg-white dark:bg-white/10 backdrop-blur-xl border border-gray-200/60 dark:border-white/20 shadow-md dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] hover:bg-gray-50 dark:hover:bg-white/15 ${
                      workbook.status === 'submitted'
                        ? 'border-crowe-teal/50'
                        : 'hover:border-crowe-amber/50'
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <FileSpreadsheet className="h-5 w-5 text-crowe-amber" />
                              <h3 className="font-medium text-lg text-gray-900 dark:text-white">Testing Workbook</h3>
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
                            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300 mb-3">
                              <span>{workbook.totalAttributes} attributes to test</span>
                              <span>|</span>
                              <span>{workbook.totalCustomers} customers assigned</span>
                              <span>|</span>
                              <span>{workbook.totalAttributes * workbook.totalCustomers} total tests</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex-1 max-w-md">
                                <div className="flex justify-between text-sm mb-1 text-gray-600 dark:text-gray-300">
                                  <span>Completion Progress</span>
                                  <span className="font-medium text-gray-900 dark:text-white">{workbook.completionPercentage}%</span>
                                </div>
                                <Progress
                                  value={workbook.completionPercentage}
                                  className={`h-3 ${
                                    workbook.completionPercentage >= 95
                                      ? '[&>div]:bg-crowe-teal'
                                      : workbook.completionPercentage >= 50
                                      ? '[&>div]:bg-crowe-amber'
                                      : ''
                                  }`}
                                />
                                {workbook.completionPercentage >= 95 && workbook.status !== 'submitted' && (
                                  <p className="text-xs text-crowe-teal mt-1">
                                    Ready to submit!
                                  </p>
                                )}
                              </div>
                              {workbook.lastActivityAt && (
                                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-300">
                                  <Clock className="h-4 w-4" />
                                  Last activity: {new Date(workbook.lastActivityAt).toLocaleString()}
                                </div>
                              )}
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="ml-3 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10">
                            {workbook.status === 'submitted' ? 'View' : 'Continue'}
                            <ArrowRight className="h-5 w-5 ml-2" />
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
    </div>
  );
}
