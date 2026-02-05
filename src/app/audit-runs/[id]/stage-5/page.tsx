"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AnimatedProgress } from "@/components/ui/progress";
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
} from "lucide-react";
import {
  motion,
  AnimatePresence,
  FadeInUp,
  StaggerContainer,
  StaggerItem,
  Presence,
  useCountUp,
  useReducedMotion,
  staggerContainer,
  staggerItem,
  fadeInUp,
  scaleIn,
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
  hasStageData,
  setStageData,
  TestResult,
} from "@/lib/stage-data";
import { RESULT_OPTIONS, STANDARD_OBSERVATIONS } from "@/lib/workbook/builder";

// Register Handsontable modules
registerAllModules();

interface TestRow {
  id: string;
  sampleItemId: string;
  entityName: string;
  attributeId: string;
  attributeName: string;
  questionText: string;
  result: "Pass" | "Fail" | "N/A" | "";
  observation: string;
  evidenceReference: string;
  auditorNotes: string;
}

export default function Stage5Page() {
  const params = useParams();
  const id = params.id as string;
  const hotRef = useRef<HotTableClass>(null);

  const [hasWorkbook, setHasWorkbook] = useState(false);
  const [testRows, setTestRows] = useState<TestRow[]>([]);
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

  // Check for prerequisite data and load test rows
  useEffect(() => {
    const workbookData = getStageData('workbookState');
    const generatedWorkbooks = getStageData('generatedWorkbooks');
    setHasWorkbook(!!(workbookData || (generatedWorkbooks && generatedWorkbooks.length > 0)));

    // Load existing test results
    const storedResults = getStageData('testResults');
    if (storedResults && storedResults.length > 0) {
      // Convert TestResult to TestRow format
      const rows = convertResultsToRows(storedResults);
      setTestRows(rows);
      updateProgress(rows);
    } else if (workbookData?.rows) {
      // Use workbook rows as starting point
      setTestRows(workbookData.rows.map((row: TestRow) => ({
        ...row,
        result: row.result || '',
        observation: row.observation || '',
        evidenceReference: row.evidenceReference || '',
        auditorNotes: row.auditorNotes || '',
      })));
      setTestingProgress({
        totalTests: workbookData.rows.length,
        completedTests: 0,
        passCount: 0,
        passWithObsCount: 0,
        fail1RegulatoryCount: 0,
        fail2ProcedureCount: 0,
        questionToLOBCount: 0,
        naCount: 0,
      });
    }
  }, []);

  const convertResultsToRows = (results: TestResult[]): TestRow[] => {
    const workbookData = getStageData('workbookState');
    if (!workbookData?.rows) return [];

    return workbookData.rows.map((row: TestRow, index: number) => {
      const result = results.find(r => r.sampleItemId === row.sampleItemId && r.attributeId === row.attributeId);
      return {
        ...row,
        result: result?.result || '',
        observation: result?.observation || '',
        evidenceReference: result?.evidenceReference || '',
        auditorNotes: result?.auditorNotes || '',
      };
    });
  };

  const updateProgress = (rows: TestRow[]) => {
    const passCount = rows.filter(r => r.result === 'Pass').length;
    const failCount = rows.filter(r => r.result === 'Fail').length;
    const naCount = rows.filter(r => r.result === 'N/A').length;
    const completedTests = passCount + failCount + naCount;

    const progress = {
      totalTests: rows.length,
      completedTests,
      passCount,
      passWithObsCount: 0,
      fail1RegulatoryCount: failCount, // Map legacy Fail to regulatory for compatibility
      fail2ProcedureCount: 0,
      questionToLOBCount: 0,
      naCount,
    };

    setTestingProgress(progress);
    setStageData('testingProgress', progress);
  };

  const handleLoadDemoData = () => {
    loadFallbackDataForStage(5);
    const results = getStageData('testResults');
    if (results) {
      const rows = convertResultsToRows(results);
      setTestRows(rows);
      updateProgress(rows);
    }
    setHasWorkbook(true);
    toast.success("Demo data loaded for Stage 5");
  };

  const handleDataChange = useCallback((changes: Handsontable.CellChange[] | null) => {
    if (!changes) return;

    const updatedRows = [...testRows];
    changes.forEach((change) => {
      const [row, prop, , newVal] = change;
      if (typeof prop === 'number') {
        // Map column index to property
        const propMap = ['sampleItemId', 'entityName', 'attributeId', 'attributeName', 'questionText', 'result', 'observation', 'evidenceReference', 'auditorNotes'];
        const propName = propMap[prop];
        if (propName && updatedRows[row]) {
          (updatedRows[row] as unknown as Record<string, unknown>)[propName] = newVal;
        }
      }
    });

    setTestRows(updatedRows);
    updateProgress(updatedRows);
  }, [testRows]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Convert rows to TestResult format
      const results: TestResult[] = testRows
        .filter(row => row.result !== '')
        .map(row => ({
          id: `TEST-${row.id}`,
          sampleItemId: row.sampleItemId,
          attributeId: row.attributeId,
          result: row.result,
          observation: row.observation,
          evidenceReference: row.evidenceReference,
          auditorNotes: row.auditorNotes,
          testedAt: new Date().toISOString(),
          testedBy: 'Current User',
        }));

      setStageData('testResults', results);
      updateProgress(testRows);
      toast.success('Test results saved');
    } catch (error) {
      console.error('Save failed:', error);
      toast.error('Failed to save test results');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportToExcel = () => {
    const wb = XLSX.utils.book_new();
    const wsData = [
      ['Sample ID', 'Entity Name', 'Attribute ID', 'Attribute', 'Question', 'Result', 'Observation', 'Evidence Ref', 'Notes'],
      ...testRows.map(row => [
        row.sampleItemId,
        row.entityName,
        row.attributeId,
        row.attributeName,
        row.questionText,
        row.result,
        row.observation,
        row.evidenceReference,
        row.auditorNotes,
      ]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Testing Workbook');
    XLSX.writeFile(wb, `Testing_Workbook_${id}.xlsx`);
    toast.success('Exported to Excel');
  };

  const completionPercentage = testingProgress.totalTests > 0
    ? (testingProgress.completedTests / testingProgress.totalTests) * 100
    : 0;

  const canProceed = completionPercentage >= 95;
  const shouldReduceMotion = useReducedMotion();

  // Animated count-ups for metrics
  const animatedPassCount = useCountUp(testingProgress.passCount, { duration: 0.8, delay: 0.2 });
  const animatedFailCount = useCountUp(testingProgress.fail1RegulatoryCount, { duration: 0.8, delay: 0.3 });
  const animatedNACount = useCountUp(testingProgress.naCount, { duration: 0.8, delay: 0.4 });

  // Prepare data for Handsontable
  const tableData = testRows.map(row => [
    row.sampleItemId,
    row.entityName,
    row.attributeId,
    row.attributeName,
    row.questionText,
    row.result,
    row.observation,
    row.evidenceReference,
    row.auditorNotes,
  ]);

  return (
    <div className="p-8">
      {/* Header */}
      <FadeInUp className="mb-8">
        <Link
          href={`/audit-runs/${id}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
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
                <Badge className="bg-teal-100 text-teal-700">Stage 5</Badge>
              </motion.div>
              <h1 className="text-3xl font-bold tracking-tight">
                Testing
              </h1>
            </div>
            <p className="text-muted-foreground mt-2">
              Execute testing workbook and record results
            </p>
          </div>
          <motion.div
            className="flex gap-2"
            initial={shouldReduceMotion ? undefined : { opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Button variant="outline" onClick={handleLoadDemoData}>
              <Database className="h-4 w-4 mr-2" />
              Load Demo Data
            </Button>
            <Button variant="outline" onClick={handleExportToExcel} disabled={testRows.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={handleSave} disabled={isSaving || testRows.length === 0}>
              <AnimatePresence mode="wait">
                {isSaving ? (
                  <motion.span
                    key="saving"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center"
                  >
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </motion.span>
                ) : (
                  <motion.span
                    key="save"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Results
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          </motion.div>
        </div>
      </FadeInUp>

      {/* Prerequisites Check */}
      <Presence isVisible={!hasWorkbook && testRows.length === 0}>
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <h3 className="font-medium text-yellow-700 dark:text-yellow-300 mb-2">
            Prerequisites Required
          </h3>
          <ul className="text-sm text-yellow-600 dark:text-yellow-400 space-y-1">
            <li>• Complete Stage 4 (Workbook Generation) or load demo data</li>
          </ul>
        </div>
      </Presence>

      {/* Progress Summary */}
      <motion.div
        className="grid gap-6 md:grid-cols-4 mb-8"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={staggerItem}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <motion.div
                className="text-2xl font-bold"
                initial={shouldReduceMotion ? undefined : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {completionPercentage.toFixed(0)}%
              </motion.div>
              <AnimatedProgress value={completionPercentage} className="mt-2" showShimmer={isSaving} />
              <p className="text-xs text-muted-foreground mt-1">
                {testingProgress.completedTests} / {testingProgress.totalTests} tests
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card className={testingProgress.passCount > 0 ? "border-green-200" : ""}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-600">
                Pass
              </CardTitle>
            </CardHeader>
            <CardContent>
              <motion.div className="text-2xl font-bold text-green-600 tabular-nums">
                {animatedPassCount}
              </motion.div>
              <p className="text-xs text-muted-foreground mt-1">
                {testingProgress.totalTests > 0
                  ? ((testingProgress.passCount / testingProgress.totalTests) * 100).toFixed(1)
                  : 0}% pass rate
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card className={testingProgress.fail1RegulatoryCount > 0 ? "border-red-200" : ""}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-600">
                Fail
              </CardTitle>
            </CardHeader>
            <CardContent>
              <motion.div className="text-2xl font-bold text-red-600 tabular-nums">
                {animatedFailCount}
              </motion.div>
              <p className="text-xs text-muted-foreground mt-1">
                {testingProgress.fail1RegulatoryCount} exception(s)
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                N/A
              </CardTitle>
            </CardHeader>
            <CardContent>
              <motion.div className="text-2xl font-bold tabular-nums">
                {animatedNACount}
              </motion.div>
              <p className="text-xs text-muted-foreground mt-1">
                Not applicable
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Testing Workbook */}
      <motion.div
        initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.35 }}
      >
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5" />
                  Testing Workbook
                </CardTitle>
                <CardDescription>
                  Enter test results for each attribute
                </CardDescription>
              </div>
              <AnimatePresence>
                {canProceed && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, x: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.8, x: 20 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <Badge className="bg-green-100 text-green-700">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1, type: "spring" }}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                      </motion.div>
                      Ready for Consolidation
                    </Badge>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </CardHeader>
          <CardContent>
            {testRows.length > 0 ? (
              <motion.div
                className="border rounded-lg overflow-hidden"
                initial={shouldReduceMotion ? undefined : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <HotTable
                ref={hotRef}
                data={tableData}
                colHeaders={['Sample ID', 'Entity Name', 'Attr ID', 'Attribute', 'Test Question', 'Result', 'Observation', 'Evidence Ref', 'Notes']}
                rowHeaders={true}
                width="100%"
                height="auto"
                licenseKey="non-commercial-and-evaluation"
                stretchH="all"
                autoRowSize={true}
                columnSorting={true}
                filters={true}
                dropdownMenu={true}
                manualColumnResize={true}
                afterChange={handleDataChange}
                columns={[
                  { data: 0, readOnly: true, width: 100 },
                  { data: 1, readOnly: true, width: 150 },
                  { data: 2, readOnly: true, width: 80 },
                  { data: 3, readOnly: true, width: 150 },
                  { data: 4, readOnly: true, width: 250 },
                  { data: 5, type: 'dropdown', source: ['', ...RESULT_OPTIONS], width: 100 },
                  { data: 6, type: 'dropdown', source: ['', ...STANDARD_OBSERVATIONS.map(o => o.text)], width: 200 },
                  { data: 7, width: 120 },
                  { data: 8, width: 150 },
                ]}
                cells={(row, col) => {
                  const cellProperties: { className?: string } = {};
                  if (col === 5 && tableData[row]) {
                    const value = String(tableData[row][5] || '').toLowerCase();
                    if (value === 'pass') {
                      cellProperties.className = 'bg-green-50 dark:bg-green-950';
                    } else if (value === 'fail') {
                      cellProperties.className = 'bg-red-50 dark:bg-red-950';
                    } else if (value === 'n/a') {
                      cellProperties.className = 'bg-gray-50 dark:bg-gray-950';
                    }
                  }
                  return cellProperties;
                }}
              />
              </motion.div>
            ) : (
              <motion.div
                className="flex flex-col items-center justify-center py-16 text-muted-foreground"
                initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <motion.div
                  initial={shouldReduceMotion ? undefined : { scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring" }}
                >
                  <ClipboardCheck className="h-16 w-16 mb-4 opacity-30" />
                </motion.div>
                <h3 className="font-medium mb-2">No Testing Data</h3>
                <p className="text-sm text-center max-w-md">
                  Complete Stage 4 to generate a workbook, or click &quot;Load Demo Data&quot; to see sample testing data.
                </p>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Completion Requirements */}
      <AnimatePresence>
        {!canProceed && testRows.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            <Card className="mb-6 border-yellow-200">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: [0, -10, 10, -10, 0] }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                  </motion.div>
                  <CardTitle className="text-yellow-700">Completion Required</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-yellow-600">
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
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Stage 4
          </Button>
        </Link>
        <Link href={`/audit-runs/${id}/stage-6`}>
          <motion.div
            whileHover={shouldReduceMotion ? undefined : { scale: 1.02 }}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
          >
            <Button disabled={!canProceed}>
              Continue to Consolidation
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        </Link>
      </motion.div>
    </div>
  );
}
