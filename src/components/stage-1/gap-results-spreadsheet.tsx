"use client";

import { useRef, useEffect } from "react";
import { HotTable, HotTableClass } from "@handsontable/react";
import { registerAllModules } from "handsontable/registry";
import "handsontable/dist/handsontable.full.min.css";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Download, Table2, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";

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
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <FileSpreadsheet className="h-16 w-16 mb-4 opacity-30" />
          <h3 className="font-medium mb-2">No results yet</h3>
          <p className="text-sm">
            Run Gap Assessment {assessmentNum} to see results here
          </p>
        </div>
      );
    }

    const gapDetails = getSheetData(result, "Gap_Details");
    const summary = getSheetData(result, "Summary");

    return (
      <Tabs defaultValue="details" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="details" className="gap-2">
              <Table2 className="h-4 w-4" />
              Gap Details
              {gapDetails.data.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {gapDetails.data.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="summary" className="gap-2">
              Summary
            </TabsTrigger>
          </TabsList>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportToExcel(assessmentNum)}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export to Excel
          </Button>
        </div>

        <TabsContent value="details" className="mt-0">
          <div className="border rounded-lg overflow-hidden">
            <HotTable
              ref={hotRef}
              data={gapDetails.data}
              colHeaders={gapDetails.columns}
              rowHeaders={true}
              width="100%"
              height={400}
              licenseKey="non-commercial-and-evaluation"
              stretchH="all"
              readOnly={true}
              columnSorting={true}
              filters={true}
              dropdownMenu={true}
              manualColumnResize={true}
              autoWrapRow={true}
              autoWrapCol={true}
              className="htCenter"
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
          </div>
        </TabsContent>

        <TabsContent value="summary" className="mt-0">
          <div className="border rounded-lg overflow-hidden">
            <HotTable
              data={summary.data}
              colHeaders={summary.columns}
              rowHeaders={true}
              width="100%"
              height={300}
              licenseKey="non-commercial-and-evaluation"
              stretchH="all"
              readOnly={true}
              manualColumnResize={true}
            />
          </div>
        </TabsContent>
      </Tabs>
    );
  };

  return (
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
              {assessment1Result && (
                <Badge variant="default" className="ml-1 bg-green-600">
                  Complete
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="assessment2" className="gap-2">
              Assessment 2
              {assessment2Result && (
                <Badge variant="default" className="ml-1 bg-green-600">
                  Complete
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assessment1">
            <div className="mb-4">
              <h3 className="font-medium">Old GFC vs Current GFC</h3>
              <p className="text-sm text-muted-foreground">
                Comparison of changes between Global Financial Standards versions
              </p>
            </div>
            {renderSpreadsheet(assessment1Result, hotRef1, 1)}
          </TabsContent>

          <TabsContent value="assessment2">
            <div className="mb-4">
              <h3 className="font-medium">Current GFC vs FLU Procedures</h3>
              <p className="text-sm text-muted-foreground">
                Gap analysis between standards and implemented procedures
              </p>
            </div>
            {renderSpreadsheet(assessment2Result, hotRef2, 2)}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
