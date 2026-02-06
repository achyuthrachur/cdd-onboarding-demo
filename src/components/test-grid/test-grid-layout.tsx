"use client";

import { useState, useMemo, useCallback } from "react";
import { HotTable } from "@handsontable/react";
import { registerAllModules } from "handsontable/registry";
import type { CellChange, ChangeSource } from "handsontable/common";
import "handsontable/dist/handsontable.full.min.css";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Filter,
  FileDown,
  Save,
  Columns,
  RefreshCw,
} from "lucide-react";
import {
  type TestGridRow,
  type TestResult,
  type GeneratedWorkbook,
  RESULT_OPTIONS,
  updateRowResult,
  getUniqueEntities,
} from "@/lib/attribute-library/generation-engine";
import { downloadTestGrid } from "./test-grid-export";
import { toast } from "sonner";

// Register all Handsontable modules
registerAllModules();

interface TestGridLayoutProps {
  workbook: GeneratedWorkbook;
  onWorkbookUpdate?: (workbook: GeneratedWorkbook) => void;
  onSave?: (workbook: GeneratedWorkbook) => void;
}

// Column configuration type
interface ColumnConfig {
  key: string;
  header: string;
  width: number;
  readOnly?: boolean;
  type?: string;
}

// Column configuration
const COLLAPSIBLE_COLUMNS: ColumnConfig[] = [
  { key: "auditor", header: "Auditor", width: 80, readOnly: true },
  { key: "legalName", header: "Legal Name", width: 180, readOnly: true },
  { key: "irr", header: "IRR", width: 50, readOnly: true },
  { key: "drr", header: "DRR", width: 50, readOnly: true },
  { key: "caseId", header: "Case ID", width: 120, readOnly: true },
  { key: "primaryFLU", header: "Primary FLU", width: 100, readOnly: true },
  { key: "partyType", header: "Party Type", width: 130, readOnly: true },
];

const MAIN_COLUMNS: ColumnConfig[] = [
  { key: "attributeId", header: "Attribute ID", width: 100, readOnly: true },
  { key: "attributeName", header: "Attribute Name", width: 180, readOnly: true },
  { key: "category", header: "Category", width: 110, readOnly: true },
  { key: "result", header: "Result", width: 150, type: "dropdown" },
  { key: "comments", header: "Comments", width: 200 },
  { key: "sourceFile", header: "Source File", width: 150, readOnly: true },
  { key: "source", header: "Source", width: 120, readOnly: true },
  { key: "sourcePage", header: "Source Page", width: 80, readOnly: true },
  { key: "passCount", header: "Pass", width: 60, readOnly: true },
  { key: "passWithObservationCount", header: "Pass Obs", width: 70, readOnly: true },
  { key: "fail1RegulatoryCount", header: "Fail 1", width: 60, readOnly: true },
  { key: "fail2ProcedureCount", header: "Fail 2", width: 60, readOnly: true },
  { key: "naCount", header: "N/A", width: 50, readOnly: true },
  { key: "emptyCount", header: "Empty", width: 60, readOnly: true },
  { key: "percentComplete", header: "% Complete", width: 90, readOnly: true },
  { key: "group", header: "Group", width: 100, readOnly: true },
  { key: "attributeText", header: "Question Text", width: 300, readOnly: true },
];

export function TestGridLayout({
  workbook,
  onWorkbookUpdate,
  onSave,
}: TestGridLayoutProps) {
  const [rows, setRows] = useState<TestGridRow[]>(workbook.rows);
  const [showCollapsedColumns, setShowCollapsedColumns] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [resultFilter, setResultFilter] = useState<string>("all");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Get unique values for filters
  const entities = useMemo(() => getUniqueEntities(rows), [rows]);
  const categories = useMemo(
    () => [...new Set(rows.map((r) => r.category))].sort(),
    [rows]
  );

  // Filter rows
  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchesSearch =
        !searchTerm ||
        row.attributeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.attributeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.legalName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesEntity = entityFilter === "all" || row.caseId === entityFilter;
      const matchesCategory = categoryFilter === "all" || row.category === categoryFilter;
      const matchesResult =
        resultFilter === "all" ||
        (resultFilter === "empty" && !row.result) ||
        row.result === resultFilter;

      return matchesSearch && matchesEntity && matchesCategory && matchesResult;
    });
  }, [rows, searchTerm, entityFilter, categoryFilter, resultFilter]);

  // Calculate summary
  const summary = useMemo(() => {
    const total = filteredRows.length;
    const completed = filteredRows.filter((r) => r.result).length;
    const pass = filteredRows.filter((r) => r.result === "Pass").length;
    const passObs = filteredRows.filter((r) => r.result === "Pass w/Observation").length;
    const fail1 = filteredRows.filter((r) => r.result === "Fail 1 - Regulatory").length;
    const fail2 = filteredRows.filter((r) => r.result === "Fail 2 - Procedure").length;
    const qLob = filteredRows.filter((r) => r.result === "Question to LOB").length;
    const na = filteredRows.filter((r) => r.result === "N/A").length;
    const empty = total - completed;

    return {
      total,
      completed,
      pass,
      passObs,
      fail1,
      fail2,
      qLob,
      na,
      empty,
      percentage: total > 0 ? (completed / total) * 100 : 0,
    };
  }, [filteredRows]);

  // Determine visible columns
  const visibleColumns = useMemo((): ColumnConfig[] => {
    if (showCollapsedColumns) {
      return [...COLLAPSIBLE_COLUMNS, ...MAIN_COLUMNS];
    }
    return MAIN_COLUMNS;
  }, [showCollapsedColumns]);

  // Convert rows to data array for Handsontable
  const tableData = useMemo(() => {
    return filteredRows.map((row) => {
      const rowData: Record<string, unknown> = {};
      for (const col of visibleColumns) {
        rowData[col.key] = row[col.key as keyof TestGridRow];
      }
      return rowData;
    });
  }, [filteredRows, visibleColumns]);

  // Handle cell changes - properly typed for Handsontable
  const handleAfterChange = useCallback(
    (changes: CellChange[] | null, source: ChangeSource) => {
      if (!changes || source === "loadData") return;

      let updatedRows = [...rows];

      for (const change of changes) {
        const [visualRow, prop, , newValue] = change;
        const filteredRow = filteredRows[visualRow];
        if (!filteredRow) continue;

        const rowIndex = rows.findIndex((r) => r.rowId === filteredRow.rowId);
        if (rowIndex === -1) continue;

        const propKey = String(prop);

        if (propKey === "result") {
          updatedRows = updateRowResult(
            updatedRows,
            filteredRow.rowId,
            newValue as TestResult
          );
        } else if (propKey === "comments") {
          updatedRows[rowIndex] = {
            ...updatedRows[rowIndex],
            comments: String(newValue ?? ""),
          };
        }
      }

      setRows(updatedRows);
      setHasUnsavedChanges(true);
    },
    [rows, filteredRows]
  );

  // Handle save
  const handleSave = () => {
    const updatedWorkbook: GeneratedWorkbook = {
      ...workbook,
      rows,
      summary: {
        totalRows: rows.length,
        completedRows: rows.filter((r) => r.result).length,
        passCount: rows.filter((r) => r.result === "Pass").length,
        passWithObservationCount: rows.filter((r) => r.result === "Pass w/Observation").length,
        fail1Count: rows.filter((r) => r.result === "Fail 1 - Regulatory").length,
        fail2Count: rows.filter((r) => r.result === "Fail 2 - Procedure").length,
        questionToLOBCount: rows.filter((r) => r.result === "Question to LOB").length,
        naCount: rows.filter((r) => r.result === "N/A").length,
        emptyCount: rows.filter((r) => !r.result).length,
        completionPercentage:
          rows.length > 0
            ? (rows.filter((r) => r.result).length / rows.length) * 100
            : 0,
      },
    };

    onSave?.(updatedWorkbook);
    onWorkbookUpdate?.(updatedWorkbook);
    setHasUnsavedChanges(false);
    toast.success("Changes saved successfully");
  };

  // Handle export
  const handleExport = async () => {
    const exportWorkbook: GeneratedWorkbook = {
      ...workbook,
      rows,
    };
    await downloadTestGrid(exportWorkbook);
    toast.success("Workbook exported successfully");
  };

  // Reset filters
  const handleResetFilters = () => {
    setSearchTerm("");
    setEntityFilter("all");
    setCategoryFilter("all");
    setResultFilter("all");
  };

  // Build column settings for Handsontable
  const columnSettings = useMemo(() => {
    return visibleColumns.map((col) => ({
      data: col.key,
      width: col.width,
      readOnly: col.readOnly ?? false,
      type: col.type === "dropdown" ? ("dropdown" as const) : ("text" as const),
      source: col.type === "dropdown" ? [...RESULT_OPTIONS] : undefined,
    }));
  }, [visibleColumns]);

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Test Grid - {workbook.auditorName}
                {hasUnsavedChanges && (
                  <Badge variant="outline" className="text-orange-600">
                    Unsaved Changes
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {workbook.entityCount} entities | {workbook.attributeCount} test rows
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCollapsedColumns(!showCollapsedColumns)}
              >
                <Columns className="mr-2 h-4 w-4" />
                {showCollapsedColumns ? "Hide Entity Cols" : "Show Entity Cols"}
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <FileDown className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!hasUnsavedChanges}
              >
                <Save className="mr-2 h-4 w-4" />
                Save
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Summary Stats */}
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-3 mb-4">
            <div className="text-center p-3 rounded bg-white/10">
              <p className="text-lg font-bold text-white">{summary.total}</p>
              <p className="text-xs text-white/70">Total</p>
            </div>
            <div className="text-center p-3 rounded bg-green-500/20">
              <p className="text-lg font-bold text-green-300">{summary.pass}</p>
              <p className="text-xs text-white/70">Pass</p>
            </div>
            <div className="text-center p-3 rounded bg-yellow-500/20">
              <p className="text-lg font-bold text-yellow-300">{summary.passObs}</p>
              <p className="text-xs text-white/70">Pass Obs</p>
            </div>
            <div className="text-center p-3 rounded bg-red-500/20">
              <p className="text-lg font-bold text-red-300">{summary.fail1}</p>
              <p className="text-xs text-white/70">Fail 1</p>
            </div>
            <div className="text-center p-3 rounded bg-red-500/20">
              <p className="text-lg font-bold text-red-300">{summary.fail2}</p>
              <p className="text-xs text-white/70">Fail 2</p>
            </div>
            <div className="text-center p-3 rounded bg-blue-500/20">
              <p className="text-lg font-bold text-blue-300">{summary.qLob}</p>
              <p className="text-xs text-white/70">Q to LOB</p>
            </div>
            <div className="text-center p-3 rounded bg-white/5">
              <p className="text-lg font-bold text-white/70">{summary.na}</p>
              <p className="text-xs text-white/70">N/A</p>
            </div>
            <div className="text-center p-3 rounded bg-white/10">
              <p className="text-lg font-bold text-white">{summary.empty}</p>
              <p className="text-xs text-white/70">Empty</p>
            </div>
            <div className="text-center p-3 rounded bg-crowe-amber/20">
              <p className="text-lg font-bold text-crowe-amber">{summary.percentage.toFixed(0)}%</p>
              <p className="text-xs text-white/70">Complete</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70" />
                <Input
                  placeholder="Search attributes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Entity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entities</SelectItem>
                  {entities.map((e) => (
                    <SelectItem key={e.caseId} value={e.caseId}>
                      {e.legalName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={resultFilter} onValueChange={setResultFilter}>
                <SelectTrigger className="w-[160px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Result" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Results</SelectItem>
                  <SelectItem value="empty">Empty (Pending)</SelectItem>
                  {RESULT_OPTIONS.filter((r) => r).map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" onClick={handleResetFilters}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Row count */}
          <p className="text-sm text-white/70 mb-2">
            Showing {filteredRows.length} of {rows.length} rows
          </p>
        </CardContent>
      </Card>

      {/* Handsontable Grid */}
      <Card>
        <CardContent className="p-0 overflow-hidden">
          <div className="h-[600px]">
            <HotTable
              data={tableData}
              colHeaders={visibleColumns.map((c) => c.header)}
              columns={columnSettings}
              rowHeaders={true}
              height="100%"
              licenseKey="non-commercial-and-evaluation"
              stretchH="all"
              autoWrapRow={true}
              autoWrapCol={true}
              manualColumnResize={true}
              manualRowResize={true}
              fixedRowsTop={0}
              fixedColumnsStart={0}
              afterChange={handleAfterChange}
              className="htCenter htMiddle"
              columnSorting={true}
              filters={true}
              dropdownMenu={true}
              contextMenu={["copy", "cut"]}
              copyPaste={true}
              undo={true}
              renderAllRows={false}
              viewportRowRenderingOffset={50}
              cells={(row, col) => {
                const cellProperties: Record<string, unknown> = {};

                // Style result column based on value
                if (visibleColumns[col]?.key === "result") {
                  const result = filteredRows[row]?.result;
                  if (result === "Pass") {
                    cellProperties.className = "htCenter bg-green-500/20 text-green-300";
                  } else if (result === "Pass w/Observation") {
                    cellProperties.className = "htCenter bg-yellow-500/20 text-yellow-300";
                  } else if (result?.startsWith("Fail")) {
                    cellProperties.className = "htCenter bg-red-500/20 text-red-300";
                  } else if (result === "Question to LOB") {
                    cellProperties.className = "htCenter bg-blue-500/20 text-blue-300";
                  } else if (result === "N/A") {
                    cellProperties.className = "htCenter bg-white/5 text-white/70";
                  }
                }

                // Style percentage column
                if (visibleColumns[col]?.key === "percentComplete") {
                  const pct = filteredRows[row]?.percentComplete || 0;
                  if (pct >= 100) {
                    cellProperties.className = "htCenter bg-green-500/30 text-green-300 font-bold";
                  } else if (pct >= 50) {
                    cellProperties.className = "htCenter bg-yellow-500/20 text-yellow-300";
                  }
                }

                return cellProperties;
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Entity Navigation */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Entity Quick Navigation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2">
            {entities.map((entity) => (
              <Button
                key={entity.caseId}
                variant={entityFilter === entity.caseId ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  setEntityFilter(
                    entityFilter === entity.caseId ? "all" : entity.caseId
                  )
                }
              >
                <span className="max-w-[150px] truncate">{entity.legalName}</span>
                <Badge
                  variant="secondary"
                  className={`ml-2 ${
                    entity.percentComplete >= 100
                      ? "bg-green-500/20 text-green-300"
                      : entity.percentComplete > 0
                      ? "bg-yellow-500/20 text-yellow-300"
                      : "bg-white/10 text-white/70"
                  }`}
                >
                  {entity.percentComplete.toFixed(0)}%
                </Badge>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
