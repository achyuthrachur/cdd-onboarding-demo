"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AnimatedProgress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Save,
  Download,
  Database,
  AlertCircle,
  Loader2,
  User,
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
  loadFallbackDataForStage,
  getStageData,
  setStageData,
  PivotedAuditorWorkbook,
  PivotedWorkbookRow,
  AssignedCustomer,
} from "@/lib/stage-data";
import { RESULT_OPTIONS, STANDARD_OBSERVATIONS } from "@/lib/workbook/builder";

// Register Handsontable modules
registerAllModules();

// Result options for dropdown
const RESULT_DROPDOWN_OPTIONS = ['', 'Pass', 'Pass w/Observation', 'Fail 1 - Regulatory', 'Fail 2 - Procedure', 'Question to LOB', 'N/A'];

export default function Stage5Page() {
  const params = useParams();
  const id = params.id as string;
  const hotRef = useRef<HotTableClass>(null);

  const [pivotedWorkbooks, setPivotedWorkbooks] = useState<PivotedAuditorWorkbook[]>([]);
  const [activeAuditorId, setActiveAuditorId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
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

  // Load pivoted workbooks on mount
  useEffect(() => {
    const storedPivotedWorkbooks = getStageData("pivotedWorkbooks");
    if (storedPivotedWorkbooks && storedPivotedWorkbooks.length > 0) {
      setPivotedWorkbooks(storedPivotedWorkbooks);
      setActiveAuditorId(storedPivotedWorkbooks[0].auditorId);
      updateProgressFromWorkbooks(storedPivotedWorkbooks);
    }
  }, []);

  // Get active workbook
  const activeWorkbook = useMemo(() => {
    if (!activeAuditorId) return pivotedWorkbooks[0] || null;
    return pivotedWorkbooks.find(wb => wb.auditorId === activeAuditorId) || null;
  }, [pivotedWorkbooks, activeAuditorId]);

  // Build Handsontable columns dynamically based on assigned customers
  const { columns, colHeaders } = useMemo(() => {
    if (!activeWorkbook) {
      return { columns: [], colHeaders: [] };
    }

    const cols: Handsontable.ColumnSettings[] = [
      { data: 0, readOnly: true, width: 80 },   // Attr ID
      { data: 1, readOnly: true, width: 60 },   // Category
      { data: 2, readOnly: true, width: 300 },  // Question Text
    ];

    const headers: string[] = ['Attr ID', 'Category', 'Question Text'];

    // Add columns for each customer (Result + Observation)
    activeWorkbook.assignedCustomers.forEach((customer, idx) => {
      const baseCol = 3 + (idx * 2);

      // Result column
      cols.push({
        data: baseCol,
        type: 'dropdown',
        source: RESULT_DROPDOWN_OPTIONS,
        width: 120,
      });
      headers.push(`${customer.customerName.substring(0, 15)}... Result`);

      // Observation column
      cols.push({
        data: baseCol + 1,
        type: 'dropdown',
        source: ['', ...STANDARD_OBSERVATIONS.map(o => o.text)],
        width: 150,
      });
      headers.push(`Observation`);
    });

    return { columns: cols, colHeaders: headers };
  }, [activeWorkbook]);

  // Convert pivoted rows to Handsontable format
  const tableData = useMemo(() => {
    if (!activeWorkbook) return [];

    return activeWorkbook.rows.map(row => {
      const rowData: (string | number)[] = [
        row.attributeId,
        row.attributeCategory,
        row.questionText,
      ];

      // Add customer results in order
      activeWorkbook.assignedCustomers.forEach(customer => {
        const result = row.customerResults[customer.customerId];
        rowData.push(result?.result || '');
        rowData.push(result?.observation || '');
      });

      return rowData;
    });
  }, [activeWorkbook]);

  // Update progress from all workbooks
  const updateProgressFromWorkbooks = (workbooks: PivotedAuditorWorkbook[]) => {
    let totalTests = 0;
    let passCount = 0;
    let passWithObsCount = 0;
    let fail1RegulatoryCount = 0;
    let fail2ProcedureCount = 0;
    let questionToLOBCount = 0;
    let naCount = 0;

    workbooks.forEach(wb => {
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

    setStageData('testingProgress', {
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
    if (!changes || !activeWorkbook) return;

    const updatedWorkbooks = [...pivotedWorkbooks];
    const workbookIndex = updatedWorkbooks.findIndex(wb => wb.auditorId === activeWorkbook.auditorId);
    if (workbookIndex === -1) return;

    const workbook = { ...updatedWorkbooks[workbookIndex] };
    const updatedRows = [...workbook.rows];

    changes.forEach(([rowIndex, colIndex, , newValue]) => {
      if (typeof colIndex !== 'number' || colIndex < 3) return; // Skip attribute columns

      // Calculate which customer and field this change is for
      const customerIndex = Math.floor((colIndex - 3) / 2);
      const isResultField = (colIndex - 3) % 2 === 0;
      const customer = activeWorkbook.assignedCustomers[customerIndex];

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

    workbook.rows = updatedRows;
    updatedWorkbooks[workbookIndex] = workbook;

    setPivotedWorkbooks(updatedWorkbooks);
    updateProgressFromWorkbooks(updatedWorkbooks);
  }, [activeWorkbook, pivotedWorkbooks]);

  // Load demo data
  const handleLoadDemoData = () => {
    loadFallbackDataForStage(5);

    // Also reload pivoted workbooks
    const storedPivotedWorkbooks = getStageData("pivotedWorkbooks");
    if (storedPivotedWorkbooks && storedPivotedWorkbooks.length > 0) {
      // Populate with demo results
      const populatedWorkbooks = storedPivotedWorkbooks.map((wb: PivotedAuditorWorkbook) => ({
        ...wb,
        rows: wb.rows.map((row: PivotedWorkbookRow) => ({
          ...row,
          customerResults: Object.fromEntries(
            Object.entries(row.customerResults).map(([customerId, result]) => {
              // Random demo results
              const resultOptions = ['Pass', 'Pass', 'Pass', 'Pass w/Observation', 'N/A', 'Fail 1 - Regulatory'] as const;
              const randomResult = resultOptions[Math.floor(Math.random() * resultOptions.length)];
              const needsObs = randomResult === 'Pass w/Observation' || randomResult.startsWith('Fail');
              const obs = needsObs ? STANDARD_OBSERVATIONS[Math.floor(Math.random() * STANDARD_OBSERVATIONS.length)]?.text || '' : '';

              return [customerId, {
                ...result,
                result: randomResult,
                observation: obs,
              }];
            })
          ),
        })),
      }));

      setPivotedWorkbooks(populatedWorkbooks);
      setStageData("pivotedWorkbooks", populatedWorkbooks);
      setActiveAuditorId(populatedWorkbooks[0]?.auditorId || null);
      updateProgressFromWorkbooks(populatedWorkbooks);
    }

    toast.success("Demo data loaded for Stage 5");
  };

  // Save results
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setStageData("pivotedWorkbooks", pivotedWorkbooks);
      toast.success("Test results saved");
    } catch (error) {
      console.error("Save failed:", error);
      toast.error("Failed to save test results");
    } finally {
      setIsSaving(false);
    }
  };

  // Export to Excel
  const handleExportToExcel = () => {
    if (!activeWorkbook) return;

    const wb = XLSX.utils.book_new();

    // Build header row
    const headers = ['Attribute ID', 'Category', 'Question Text'];
    activeWorkbook.assignedCustomers.forEach(customer => {
      headers.push(`${customer.customerName} - Result`);
      headers.push(`${customer.customerName} - Observation`);
    });

    // Build data rows
    const data = [headers, ...tableData];

    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, `${activeWorkbook.auditorName} Workbook`);
    XLSX.writeFile(wb, `Testing_Workbook_${activeWorkbook.auditorName}_${id}.xlsx`);
    toast.success("Exported to Excel");
  };

  // Calculate completion percentage
  const completionPercentage = testingProgress.totalTests > 0
    ? (testingProgress.completedTests / testingProgress.totalTests) * 100
    : 0;

  const canProceed = completionPercentage >= 95;

  // Animated count-ups
  const animatedPassCount = useCountUp(testingProgress.passCount + testingProgress.passWithObsCount, { duration: 0.8, delay: 0.2 });
  const animatedFailCount = useCountUp(testingProgress.fail1RegulatoryCount + testingProgress.fail2ProcedureCount, { duration: 0.8, delay: 0.3 });
  const animatedNACount = useCountUp(testingProgress.naCount, { duration: 0.8, delay: 0.4 });

  return (
    <div className="p-8 min-h-screen bg-crowe-indigo-dark">
      {/* Header */}
      <FadeInUp className="mb-8">
        <Link
          href={`/audit-runs/${id}`}
          className="inline-flex items-center text-sm text-white/70 hover:text-white mb-4"
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
                <Badge className="bg-teal-500/20 text-teal-400">Stage 5</Badge>
              </motion.div>
              <h1 className="text-3xl font-bold tracking-tight text-white">Testing</h1>
            </div>
            <p className="text-white/70 mt-2">
              Execute testing workbook - Rows: Test Questions, Columns: Customers
            </p>
          </div>
          <motion.div
            className="flex gap-2"
            initial={shouldReduceMotion ? undefined : { opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Button variant="outline" onClick={handleLoadDemoData} className="border-white/20 text-white hover:bg-white/10 hover:border-white/30">
              <Database className="h-4 w-4 mr-2" />
              Load Demo Data
            </Button>
            <Button variant="outline" onClick={handleExportToExcel} disabled={!activeWorkbook} className="border-white/20 text-white hover:bg-white/10 hover:border-white/30">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={handleSave} disabled={isSaving || pivotedWorkbooks.length === 0}>
              {isSaving ? (
                <span className="flex items-center">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </span>
              ) : (
                <span className="flex items-center">
                  <Save className="h-4 w-4 mr-2" />
                  Save Results
                </span>
              )}
            </Button>
          </motion.div>
        </div>
      </FadeInUp>

      {/* Prerequisites Check */}
      <AnimatePresence>
        {pivotedWorkbooks.length === 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-4 bg-yellow-500/10 backdrop-blur-xl border border-yellow-500/30 rounded-lg"
          >
            <h3 className="font-medium text-yellow-300 mb-2">
              Prerequisites Required
            </h3>
            <ul className="text-sm text-yellow-400 space-y-1">
              <li>• Complete Stage 4 (Generate Workbooks) or click &quot;Load Demo Data&quot;</li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

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
              <CardTitle className="text-sm font-medium text-white/70">
                Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{completionPercentage.toFixed(0)}%</div>
              <AnimatedProgress value={completionPercentage} className="mt-2" showShimmer={isSaving} />
              <p className="text-xs text-white/70 mt-1">
                {testingProgress.completedTests} / {testingProgress.totalTests} tests
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card className={`bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] ${testingProgress.passCount > 0 ? "border-green-500/50" : ""}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-400">Pass</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400 tabular-nums">
                {animatedPassCount}
              </div>
              <p className="text-xs text-white/70 mt-1">
                {testingProgress.totalTests > 0
                  ? (((testingProgress.passCount + testingProgress.passWithObsCount) / testingProgress.totalTests) * 100).toFixed(1)
                  : 0}% pass rate
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card className={`bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] ${testingProgress.fail1RegulatoryCount > 0 ? "border-red-500/50" : ""}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-400">Fail</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-400 tabular-nums">
                {animatedFailCount}
              </div>
              <p className="text-xs text-white/70 mt-1">
                {testingProgress.fail1RegulatoryCount + testingProgress.fail2ProcedureCount} exception(s)
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white/70">N/A</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums text-white">{animatedNACount}</div>
              <p className="text-xs text-white/70 mt-1">Not applicable</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Auditor Tabs + Testing Workbook */}
      {pivotedWorkbooks.length > 0 && (
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
                    <ClipboardCheck className="h-5 w-5" />
                    Testing Workbook
                  </CardTitle>
                  <CardDescription className="text-white/60">
                    Rows: Test Questions | Columns: Customer Results (Result + Observation)
                  </CardDescription>
                </div>
                <AnimatePresence>
                  {canProceed && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8, x: 20 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.8, x: 20 }}
                    >
                      <Badge className="bg-green-500/20 text-green-400">
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Ready for Consolidation
                      </Badge>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </CardHeader>
            <CardContent>
              {/* Auditor Tabs */}
              <Tabs
                value={activeAuditorId || pivotedWorkbooks[0]?.auditorId}
                onValueChange={setActiveAuditorId}
                className="mb-4"
              >
                <TabsList>
                  {pivotedWorkbooks.map(wb => (
                    <TabsTrigger key={wb.auditorId} value={wb.auditorId} className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {wb.auditorName}
                      <Badge variant="secondary" className="ml-1">
                        {wb.assignedCustomers.length} customers
                      </Badge>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              {/* Customer Legend */}
              {activeWorkbook && (
                <div className="mb-4 p-3 bg-white/5 rounded-lg">
                  <div className="text-xs font-medium text-white/70 mb-2">Assigned Customers:</div>
                  <div className="flex flex-wrap gap-2">
                    {activeWorkbook.assignedCustomers.map((customer, idx) => (
                      <Badge key={customer.customerId} variant="outline" className="text-xs border-white/30 text-white/70">
                        {idx + 1}. {customer.customerName} ({customer.customerId})
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Handsontable */}
              {activeWorkbook && tableData.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
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
                      // Color result columns based on value
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

              {/* Empty State */}
              {(!activeWorkbook || tableData.length === 0) && (
                <div className="flex flex-col items-center justify-center py-16 text-white/70">
                  <ClipboardCheck className="h-16 w-16 mb-4 opacity-30" />
                  <h3 className="font-medium mb-2 text-white">No Testing Data</h3>
                  <p className="text-sm text-center max-w-md">
                    Complete Stage 4 to generate workbooks, or click &quot;Load Demo Data&quot;.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Completion Requirements */}
      <AnimatePresence>
        {!canProceed && pivotedWorkbooks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="mb-6 bg-yellow-500/10 backdrop-blur-xl border border-yellow-500/30 shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-400" />
                  <CardTitle className="text-yellow-300">Completion Required</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-yellow-200">
                  At least 95% of tests must be completed to proceed to consolidation.
                  Currently at {completionPercentage.toFixed(1)}%.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <motion.div
        className="flex justify-between"
        initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Link href={`/audit-runs/${id}/stage-4`}>
          <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 hover:border-white/30">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Stage 4
          </Button>
        </Link>
        <Link href={`/audit-runs/${id}/stage-6`}>
          <Button disabled={!canProceed}>
            Continue to Consolidation
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}
