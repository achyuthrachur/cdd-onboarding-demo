"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AnimatedProgress } from "@/components/ui/progress";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  Save,
  Download,
  Send,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  motion,
  AnimatePresence,
  FadeInUp,
  useCountUp,
  useReducedMotion,
  staggerContainer,
  staggerItem,
} from "@/lib/animations";
import { HotTable, HotTableClass } from "@handsontable/react";
import { registerAllModules } from "handsontable/registry";
import Handsontable from "handsontable";
import "handsontable/dist/handsontable.full.min.css";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import {
  getStageData,
  setStageData,
  PivotedAuditorWorkbook,
  PivotedWorkbookRow,
} from "@/lib/stage-data";
import { STANDARD_OBSERVATIONS } from "@/lib/workbook/builder";
import { getCurrentAuditorId } from "@/lib/auth/session";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Register Handsontable modules
registerAllModules();

// Result options for dropdown
const RESULT_DROPDOWN_OPTIONS = ['', 'Pass', 'Pass w/Observation', 'Fail 1 - Regulatory', 'Fail 2 - Procedure', 'Question to LOB', 'N/A'];

export default function AuditorWorkbookPage() {
  const params = useParams();
  const router = useRouter();
  const workbookId = params.id as string;
  const hotRef = useRef<HotTableClass>(null);

  const [workbook, setWorkbook] = useState<PivotedAuditorWorkbook | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [testingProgress, setTestingProgress] = useState({
    totalTests: 0,
    completedTests: 0,
    passCount: 0,
    passWithObsCount: 0,
    fail1RegulatoryCount: 0,
    fail2ProcedureCount: 0,
    questionToLOBCount: 0,
    naCount: 0,
  });

  const shouldReduceMotion = useReducedMotion();

  // Load workbook on mount
  useEffect(() => {
    const currentAuditorId = getCurrentAuditorId();
    const pivotedWorkbooks = getStageData("pivotedWorkbooks") as PivotedAuditorWorkbook[] | null;
    const auditorProgress = getStageData("auditorProgress") as Record<string, {
      completionPercentage: number;
      status: 'draft' | 'in_progress' | 'submitted';
      lastActivityAt: string;
      submittedAt: string | null;
    }> | null;

    if (pivotedWorkbooks) {
      // Find this auditor's workbook
      const myWorkbook = pivotedWorkbooks.find(wb => wb.auditorId === workbookId);
      if (myWorkbook) {
        // Verify this workbook belongs to the current auditor
        if (currentAuditorId && myWorkbook.auditorId !== currentAuditorId) {
          toast.error("You don't have access to this workbook");
          router.push("/auditor/workbooks");
          return;
        }

        setWorkbook(myWorkbook);
        updateProgressFromWorkbook(myWorkbook);

        // Check if submitted
        const progress = auditorProgress?.[myWorkbook.auditorId];
        if (progress?.status === 'submitted') {
          setIsSubmitted(true);
        }
      }
    }

    setIsLoading(false);
  }, [workbookId, router]);

  // Build Handsontable columns dynamically
  const { columns, colHeaders } = useMemo(() => {
    if (!workbook) {
      return { columns: [], colHeaders: [] };
    }

    const cols: Handsontable.ColumnSettings[] = [
      { data: 0, readOnly: true, width: 80 },
      { data: 1, readOnly: true, width: 60 },
      { data: 2, readOnly: true, width: 300 },
    ];

    const headers: string[] = ['Attr ID', 'Category', 'Question Text'];

    // Add columns for each customer
    workbook.assignedCustomers.forEach((customer, idx) => {
      const baseCol = 3 + (idx * 2);

      cols.push({
        data: baseCol,
        type: 'dropdown',
        source: RESULT_DROPDOWN_OPTIONS,
        width: 120,
        readOnly: isSubmitted,
      });
      headers.push(`${customer.customerName.substring(0, 15)}... Result`);

      cols.push({
        data: baseCol + 1,
        type: 'dropdown',
        source: ['', ...STANDARD_OBSERVATIONS.map(o => o.text)],
        width: 150,
        readOnly: isSubmitted,
      });
      headers.push(`Observation`);
    });

    return { columns: cols, colHeaders: headers };
  }, [workbook, isSubmitted]);

  // Convert rows to table format
  const tableData = useMemo(() => {
    if (!workbook) return [];

    return workbook.rows.map(row => {
      const rowData: (string | number)[] = [
        row.attributeId,
        row.attributeCategory,
        row.questionText,
      ];

      workbook.assignedCustomers.forEach(customer => {
        const result = row.customerResults[customer.customerId];
        rowData.push(result?.result || '');
        rowData.push(result?.observation || '');
      });

      return rowData;
    });
  }, [workbook]);

  // Calculate progress
  const updateProgressFromWorkbook = (wb: PivotedAuditorWorkbook) => {
    let totalTests = 0;
    let passCount = 0;
    let passWithObsCount = 0;
    let fail1RegulatoryCount = 0;
    let fail2ProcedureCount = 0;
    let questionToLOBCount = 0;
    let naCount = 0;

    wb.rows.forEach(row => {
      Object.values(row.customerResults).forEach(result => {
        totalTests++;
        switch (result.result) {
          case 'Pass':
            passCount++;
            break;
          case 'Pass w/Observation':
            passWithObsCount++;
            break;
          case 'Fail 1 - Regulatory':
            fail1RegulatoryCount++;
            break;
          case 'Fail 2 - Procedure':
            fail2ProcedureCount++;
            break;
          case 'Question to LOB':
            questionToLOBCount++;
            break;
          case 'N/A':
            naCount++;
            break;
        }
      });
    });

    const completedTests = passCount + passWithObsCount + fail1RegulatoryCount +
                          fail2ProcedureCount + questionToLOBCount + naCount;

    setTestingProgress({
      totalTests,
      completedTests,
      passCount,
      passWithObsCount,
      fail1RegulatoryCount,
      fail2ProcedureCount,
      questionToLOBCount,
      naCount,
    });
  };

  // Handle cell changes
  const handleDataChange = useCallback((changes: Handsontable.CellChange[] | null) => {
    if (!changes || !workbook || isSubmitted) return;

    const updatedWorkbook = { ...workbook };
    const updatedRows = [...updatedWorkbook.rows];

    changes.forEach(([rowIndex, colIndex, , newValue]) => {
      if (typeof colIndex !== 'number' || colIndex < 3) return;

      const customerIndex = Math.floor((colIndex - 3) / 2);
      const isResultField = (colIndex - 3) % 2 === 0;
      const customer = workbook.assignedCustomers[customerIndex];

      if (!customer) return;

      const row = { ...updatedRows[rowIndex] };
      const customerResults = { ...row.customerResults };
      const customerResult = { ...(customerResults[customer.customerId] || {
        customerId: customer.customerId,
        customerName: customer.customerName,
        result: '',
        observation: '',
      }) };

      if (isResultField) {
        customerResult.result = newValue as PivotedWorkbookRow['customerResults'][string]['result'];
      } else {
        customerResult.observation = String(newValue || '');
      }

      customerResults[customer.customerId] = customerResult;
      row.customerResults = customerResults;
      updatedRows[rowIndex] = row;
    });

    updatedWorkbook.rows = updatedRows;
    setWorkbook(updatedWorkbook);
    updateProgressFromWorkbook(updatedWorkbook);

    // Update in storage (auto-save)
    const pivotedWorkbooks = getStageData("pivotedWorkbooks") as PivotedAuditorWorkbook[] | null;
    if (pivotedWorkbooks) {
      const idx = pivotedWorkbooks.findIndex(wb => wb.auditorId === workbook.auditorId);
      if (idx !== -1) {
        pivotedWorkbooks[idx] = updatedWorkbook;
        setStageData("pivotedWorkbooks", pivotedWorkbooks);
      }
    }
  }, [workbook, isSubmitted]);

  // Save progress
  const handleSave = async () => {
    if (!workbook) return;

    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      // Update auditor progress
      const auditorProgress = getStageData("auditorProgress") || {};
      const updatedProgress = {
        ...auditorProgress,
        [workbook.auditorId]: {
          completionPercentage: completionPercentage,
          status: 'in_progress' as const,
          lastActivityAt: new Date().toISOString(),
          submittedAt: null,
        },
      };
      setStageData("auditorProgress", updatedProgress);

      toast.success("Progress saved");
    } catch (error) {
      console.error("Save failed:", error);
      toast.error("Failed to save progress");
    } finally {
      setIsSaving(false);
    }
  };

  // Submit workbook
  const handleSubmit = async () => {
    if (!workbook || completionPercentage < 95) return;

    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update auditor progress
      const auditorProgress = getStageData("auditorProgress") || {};
      const updatedProgress = {
        ...auditorProgress,
        [workbook.auditorId]: {
          completionPercentage: completionPercentage,
          status: 'submitted' as const,
          lastActivityAt: new Date().toISOString(),
          submittedAt: new Date().toISOString(),
        },
      };
      setStageData("auditorProgress", updatedProgress);

      setIsSubmitted(true);
      setShowSubmitDialog(false);
      toast.success("Workbook submitted successfully!", {
        description: "Your testing results have been submitted to the AIC.",
      });
    } catch (error) {
      console.error("Submit failed:", error);
      toast.error("Failed to submit workbook");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Export to Excel
  const handleExportToExcel = () => {
    if (!workbook) return;

    const wb = XLSX.utils.book_new();

    const headers = ['Attribute ID', 'Category', 'Question Text'];
    workbook.assignedCustomers.forEach(customer => {
      headers.push(`${customer.customerName} - Result`);
      headers.push(`${customer.customerName} - Observation`);
    });

    const data = [headers, ...tableData];

    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Testing Workbook');
    XLSX.writeFile(wb, `Testing_Workbook_${workbook.auditorName}.xlsx`);
    toast.success("Exported to Excel");
  };

  // Calculate completion
  const completionPercentage = testingProgress.totalTests > 0
    ? Math.round((testingProgress.completedTests / testingProgress.totalTests) * 100)
    : 0;

  const canSubmit = completionPercentage >= 95 && !isSubmitted;

  // Animated counts
  const animatedPassCount = useCountUp(testingProgress.passCount + testingProgress.passWithObsCount, { duration: 0.8, delay: 0.2 });
  const animatedFailCount = useCountUp(testingProgress.fail1RegulatoryCount + testingProgress.fail2ProcedureCount, { duration: 0.8, delay: 0.3 });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white/50" />
      </div>
    );
  }

  if (!workbook) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-white/30" />
          <h2 className="text-lg font-medium mb-2 text-white">Workbook Not Found</h2>
          <p className="text-white/50 mb-4">
            This workbook doesn&apos;t exist or you don&apos;t have access to it.
          </p>
          <Link href="/auditor/workbooks">
            <Button className="bg-crowe-amber text-crowe-indigo-dark hover:bg-crowe-amber-bright">Back to Workbooks</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <FadeInUp className="mb-8">
        <Link
          href="/auditor/workbooks"
          className="inline-flex items-center text-sm text-white/50 hover:text-white mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Workbooks
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-white">Testing Workbook</h1>
              {isSubmitted && (
                <Badge className="bg-green-600">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Submitted
                </Badge>
              )}
            </div>
            <p className="text-white/50 mt-2">
              {workbook.assignedCustomers.length} customers • {workbook.attributes.length} attributes
            </p>
          </div>
          <motion.div
            className="flex gap-2"
            initial={shouldReduceMotion ? undefined : { opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Button variant="outline" onClick={handleExportToExcel} className="border-white/20 text-white hover:bg-white/10">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            {!isSubmitted && (
              <>
                <Button variant="outline" onClick={handleSave} disabled={isSaving} className="border-white/20 text-white hover:bg-white/10">
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save
                </Button>
                <Button
                  onClick={() => setShowSubmitDialog(true)}
                  disabled={!canSubmit}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Submit
                </Button>
              </>
            )}
          </motion.div>
        </div>
      </FadeInUp>

      {/* Submitted Banner */}
      {isSubmitted && (
        <motion.div
          className="mb-6 p-4 bg-crowe-teal/20 border border-crowe-teal/40 rounded-lg backdrop-blur-xl"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-crowe-teal-bright" />
            <div>
              <p className="font-medium text-crowe-teal-bright">
                Workbook Submitted
              </p>
              <p className="text-sm text-crowe-teal">
                Your testing results have been submitted. The workbook is now read-only.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Progress Summary */}
      <motion.div
        className="grid gap-6 md:grid-cols-4 mb-8"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={staggerItem}>
          <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white/50">
                Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{completionPercentage}%</div>
              <AnimatedProgress
                value={completionPercentage}
                className={`mt-2 ${completionPercentage >= 95 ? '[&>div]:bg-crowe-teal' : ''}`}
              />
              <p className="text-xs text-white/50 mt-1">
                {testingProgress.completedTests} / {testingProgress.totalTests} tests
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card className={`bg-white/10 backdrop-blur-xl border shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] ${testingProgress.passCount > 0 ? "border-crowe-teal/50" : "border-white/20"}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-crowe-teal-bright">Pass</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-crowe-teal-bright tabular-nums">
                {animatedPassCount}
              </div>
              <p className="text-xs text-white/50 mt-1">
                {testingProgress.totalTests > 0
                  ? (((testingProgress.passCount + testingProgress.passWithObsCount) / testingProgress.totalTests) * 100).toFixed(1)
                  : 0}% pass rate
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card className={`bg-white/10 backdrop-blur-xl border shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] ${testingProgress.fail1RegulatoryCount > 0 ? "border-crowe-coral/50" : "border-white/20"}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-crowe-coral-bright">Fail</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-crowe-coral-bright tabular-nums">
                {animatedFailCount}
              </div>
              <p className="text-xs text-white/50 mt-1">
                {testingProgress.fail1RegulatoryCount + testingProgress.fail2ProcedureCount} exception(s)
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white/50">N/A</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums text-white">{testingProgress.naCount}</div>
              <p className="text-xs text-white/50 mt-1">Not applicable</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Testing Workbook */}
      <motion.div
        initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="mb-6 bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-white">
                  <ClipboardCheck className="h-5 w-5 text-crowe-amber" />
                  Testing Grid
                </CardTitle>
                <CardDescription className="text-white/60">
                  Rows: Attributes | Columns: Customer Results
                </CardDescription>
              </div>
              <AnimatePresence>
                {canSubmit && !isSubmitted && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, x: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.8, x: 20 }}
                  >
                    <Badge className="bg-green-100 text-green-700">
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Ready to Submit
                    </Badge>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </CardHeader>
          <CardContent>
            {/* Customer Legend */}
            <div className="mb-4 p-3 bg-white/5 rounded-lg border border-white/10">
              <div className="text-xs font-medium text-white/50 mb-2">Assigned Customers:</div>
              <div className="flex flex-wrap gap-2">
                {workbook.assignedCustomers.map((customer, idx) => (
                  <Badge key={customer.customerId} variant="outline" className="text-xs border-white/20 text-white/70">
                    {idx + 1}. {customer.customerName} ({customer.customerId})
                  </Badge>
                ))}
              </div>
            </div>

            {/* Handsontable */}
            {tableData.length > 0 && (
              <div className="border border-white/20 rounded-lg overflow-hidden bg-white/5">
                <HotTable
                  ref={hotRef}
                  data={tableData}
                  colHeaders={colHeaders}
                  rowHeaders={true}
                  width="100%"
                  height={500}
                  licenseKey="non-commercial-and-evaluation"
                  stretchH="all"
                  autoRowSize={true}
                  columnSorting={true}
                  filters={true}
                  dropdownMenu={true}
                  manualColumnResize={true}
                  fixedColumnsStart={3}
                  afterChange={handleDataChange}
                  columns={columns}
                  cells={(row, col) => {
                    const cellProperties: { className?: string } = {};
                    if (col >= 3 && (col - 3) % 2 === 0 && tableData[row]) {
                      const value = String(tableData[row][col] || '').toLowerCase();
                      if (value.startsWith('pass')) {
                        cellProperties.className = 'bg-green-50 dark:bg-green-950';
                      } else if (value.startsWith('fail')) {
                        cellProperties.className = 'bg-red-50 dark:bg-red-950';
                      } else if (value === 'n/a') {
                        cellProperties.className = 'bg-gray-50 dark:bg-gray-950';
                      } else if (value === 'question to lob') {
                        cellProperties.className = 'bg-blue-50 dark:bg-blue-950';
                      }
                    }
                    return cellProperties;
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Completion Requirements */}
      <AnimatePresence>
        {!canSubmit && !isSubmitted && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="mb-6 bg-crowe-amber/20 border border-crowe-amber/40 backdrop-blur-xl">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-crowe-amber" />
                  <CardTitle className="text-crowe-amber-bright">Completion Required</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-crowe-amber">
                  At least 95% of tests must be completed to submit.
                  Currently at {completionPercentage}%.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit Confirmation Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent className="bg-crowe-indigo-dark/95 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <DialogHeader>
            <DialogTitle className="text-white">Submit Workbook</DialogTitle>
            <DialogDescription className="text-white/60">
              Are you sure you want to submit this workbook? Once submitted,
              you will not be able to make further changes.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg border border-white/10">
                <span className="text-sm text-white/70">Completion:</span>
                <Badge className="bg-crowe-teal">{completionPercentage}%</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg border border-white/10">
                <span className="text-sm text-white/70">Tests Completed:</span>
                <Badge className="bg-crowe-indigo">{testingProgress.completedTests} / {testingProgress.totalTests}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg border border-white/10">
                <span className="text-sm text-white/70">Pass Rate:</span>
                <Badge variant="outline" className="border-white/20 text-white">
                  {testingProgress.totalTests > 0
                    ? (((testingProgress.passCount + testingProgress.passWithObsCount) / testingProgress.totalTests) * 100).toFixed(1)
                    : 0}%
                </Badge>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)} className="border-white/20 text-white hover:bg-white/10">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Workbook
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
