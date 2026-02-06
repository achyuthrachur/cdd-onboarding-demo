"use client";

import { useRef } from "react";
import { HotTable, HotTableClass } from "@handsontable/react";
import { registerAllModules } from "handsontable/registry";
import "handsontable/dist/handsontable.full.min.css";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Download, Table2, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";
import { motion, AnimatePresence, useReducedMotion, fadeInUp, scaleIn } from "@/lib/animations";

// Register Handsontable modules
registerAllModules();

interface GapAssessmentResult {
  workbook: {
    sheets: Array<{
      name: string;
      rows: Array<Record<string, unknown>>;
    }>;
  };
}

interface GapResultsSpreadsheetProps {
  assessment1Result: GapAssessmentResult | null;
  assessment2Result: GapAssessmentResult | null;
}

export function GapResultsSpreadsheet({
  assessment1Result,
  assessment2Result,
}: GapResultsSpreadsheetProps) {
  const hotRef1 = useRef<HotTableClass>(null);
  const hotRef2 = useRef<HotTableClass>(null);
  const shouldReduceMotion = useReducedMotion();

  const getSheetData = (result: GapAssessmentResult | null, sheetName: string) => {
    if (!result?.workbook?.sheets) return { columns: [], data: [] };
    const sheet = result.workbook.sheets.find(s => s.name === sheetName);
    if (!sheet || !sheet.rows || sheet.rows.length === 0) return { columns: [], data: [] };

    const columns = Object.keys(sheet.rows[0]);
    const data = sheet.rows.map(row => columns.map(col => row[col] ?? ""));

    return { columns, data };
  };

  const exportToExcel = (assessmentNum: 1 | 2) => {
    const result = assessmentNum === 1 ? assessment1Result : assessment2Result;
    if (!result) return;

    const wb = XLSX.utils.book_new();

    result.workbook.sheets.forEach(sheet => {
      const wsData = [Object.keys(sheet.rows[0] || {}), ...sheet.rows.map(row => Object.values(row))];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      XLSX.utils.book_append_sheet(wb, ws, sheet.name);
    });

    XLSX.writeFile(wb, `Gap_Assessment_${assessmentNum}_Results.xlsx`);
  };

  const renderSpreadsheet = (
    result: GapAssessmentResult | null,
    hotRef: React.RefObject<HotTableClass | null>,
    assessmentNum: 1 | 2
  ) => {
    if (!result) {
      return (
        <motion.div
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center justify-center py-16 text-white/60"
        >
          <motion.div
            animate={shouldReduceMotion ? {} : {
              y: [0, -5, 0],
              transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
          >
            <FileSpreadsheet className="h-16 w-16 mb-4 opacity-30" />
          </motion.div>
          <h3 className="font-medium mb-2">No results yet</h3>
          <p className="text-sm">
            Run Gap Assessment {assessmentNum} to see results here
          </p>
        </motion.div>
      );
    }

    const gapDetails = getSheetData(result, "Gap_Details");
    const summary = getSheetData(result, "Summary");

    return (
      <motion.div
        initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Tabs defaultValue="details" className="w-full">
          <motion.div
            initial={shouldReduceMotion ? undefined : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="flex items-center justify-between mb-4"
          >
            <TabsList>
              <TabsTrigger value="details" className="gap-2">
                <Table2 className="h-4 w-4" />
                Gap Details
                {gapDetails.data.length > 0 && (
                  <motion.span
                    initial={shouldReduceMotion ? undefined : { scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, delay: 0.3 }}
                  >
                    <Badge variant="secondary" className="ml-1">
                      {gapDetails.data.length}
                    </Badge>
                  </motion.span>
                )}
              </TabsTrigger>
              <TabsTrigger value="summary" className="gap-2">
                Summary
              </TabsTrigger>
            </TabsList>
            <motion.div
              whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
              whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportToExcel(assessmentNum)}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Export to Excel
              </Button>
            </motion.div>
          </motion.div>

          <TabsContent value="details" className="mt-0">
            <motion.div
              initial={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="border rounded-lg overflow-hidden"
            >
              <HotTable
                ref={hotRef}
                data={gapDetails.data}
                colHeaders={gapDetails.columns}
                rowHeaders={true}
                width="100%"
                height={Math.min(600, Math.max(250, gapDetails.data.length * 50 + 40))}
                licenseKey="non-commercial-and-evaluation"
                stretchH="all"
                autoRowSize={true}
                rowHeights={48}
                readOnly={true}
                columnSorting={true}
                filters={true}
                dropdownMenu={true}
                manualColumnResize={true}
                autoWrapRow={true}
                autoWrapCol={true}
                wordWrap={true}
                className="htCenter htMiddle"
                colWidths={function(index: number) {
                  const col = gapDetails.columns[index];
                  // Give more width to text-heavy columns
                  if (col?.includes('Text') || col?.includes('Description')) {
                    return 300;
                  }
                  if (col?.includes('ID')) {
                    return 80;
                  }
                  if (col === 'Change_Type' || col === 'Impact') {
                    return 90;
                  }
                  return 120;
                }}
                cells={function(row, col) {
                  const cellProperties: { className?: string } = {};
                  const data = gapDetails.data[row];
                  if (data) {
                    const value = String(data[col] || "").toLowerCase();
                    // Color-code gap status
                    if (value === "gap" || value === "removed") {
                      cellProperties.className = "bg-red-50 dark:bg-red-950";
                    } else if (value === "partially met" || value === "modified") {
                      cellProperties.className = "bg-yellow-50 dark:bg-yellow-950";
                    } else if (value === "met" || value === "unchanged" || value === "enhanced") {
                      cellProperties.className = "bg-green-50 dark:bg-green-950";
                    } else if (value === "new") {
                      cellProperties.className = "bg-blue-50 dark:bg-blue-950";
                    }
                  }
                  return cellProperties;
                }}
              />
            </motion.div>
          </TabsContent>

          <TabsContent value="summary" className="mt-0">
            <motion.div
              initial={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="border rounded-lg overflow-hidden"
            >
              <HotTable
                data={summary.data}
                colHeaders={summary.columns}
                rowHeaders={true}
                width="100%"
                height={Math.min(400, Math.max(100, (summary.data.length + 1) * 28))}
                licenseKey="non-commercial-and-evaluation"
                stretchH="all"
                autoRowSize={false}
                rowHeights={26}
                readOnly={true}
                manualColumnResize={true}
              />
            </motion.div>
          </TabsContent>
        </Tabs>
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Assessment Results
          </CardTitle>
          <CardDescription>
            Review and export gap assessment findings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="assessment1" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="assessment1" className="gap-2">
                Assessment 1
                <AnimatePresence mode="wait">
                  {assessment1Result && (
                    <motion.span
                      initial={shouldReduceMotion ? undefined : { scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <Badge variant="default" className="ml-1 bg-green-600">
                        Complete
                      </Badge>
                    </motion.span>
                  )}
                </AnimatePresence>
              </TabsTrigger>
              <TabsTrigger value="assessment2" className="gap-2">
                Assessment 2
                <AnimatePresence mode="wait">
                  {assessment2Result && (
                    <motion.span
                      initial={shouldReduceMotion ? undefined : { scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <Badge variant="default" className="ml-1 bg-green-600">
                        Complete
                      </Badge>
                    </motion.span>
                  )}
                </AnimatePresence>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="assessment1">
              <motion.div
                initial={shouldReduceMotion ? undefined : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="mb-4"
              >
                <h3 className="font-medium">Old GFC vs Current GFC</h3>
                <p className="text-sm text-white/60">
                  Comparison of changes between Global Financial Standards versions
                </p>
              </motion.div>
              {renderSpreadsheet(assessment1Result, hotRef1, 1)}
            </TabsContent>

            <TabsContent value="assessment2">
              <motion.div
                initial={shouldReduceMotion ? undefined : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="mb-4"
              >
                <h3 className="font-medium">Current GFC vs FLU Procedures</h3>
                <p className="text-sm text-white/60">
                  Gap analysis between standards and implemented procedures
                </p>
              </motion.div>
              {renderSpreadsheet(assessment2Result, hotRef2, 2)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
}
