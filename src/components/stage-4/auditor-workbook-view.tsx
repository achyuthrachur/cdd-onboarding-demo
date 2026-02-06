"use client";

import { useState, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Download,
  User,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  MinusCircle,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AuditorWorkbook, AuditorWorkbookRow } from "@/lib/stage-data/store";

interface AuditorWorkbookViewProps {
  workbooks: AuditorWorkbook[];
  activeAuditorId: string | null;
  onAuditorChange: (auditorId: string) => void;
  onExport: (auditorId: string) => void;
}

const RESULT_OPTIONS = [
  { value: "all", label: "All Results" },
  { value: "Pass", label: "Pass", icon: CheckCircle2, color: "text-crowe-teal-bright" },
  { value: "Pass w/Observation", label: "Pass w/Observation", icon: CheckCircle2, color: "text-crowe-amber-bright" },
  { value: "Fail 1 - Regulatory", label: "Fail 1 - Regulatory", icon: XCircle, color: "text-crowe-coral-bright" },
  { value: "Fail 2 - Procedure", label: "Fail 2 - Procedure", icon: AlertTriangle, color: "text-crowe-amber" },
  { value: "Question to LOB", label: "Question to LOB", icon: HelpCircle, color: "text-crowe-blue-light" },
  { value: "N/A", label: "N/A", icon: MinusCircle, color: "text-white/60" },
  { value: "not-tested", label: "Not Tested", icon: MinusCircle, color: "text-white/40" },
];

export function AuditorWorkbookView({
  workbooks,
  activeAuditorId,
  onAuditorChange,
  onExport,
}: AuditorWorkbookViewProps) {
  const [resultFilter, setResultFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Get active workbook
  const activeWorkbook = useMemo(() => {
    if (!activeAuditorId) return workbooks[0] || null;
    return workbooks.find((wb) => wb.auditorId === activeAuditorId) || null;
  }, [workbooks, activeAuditorId]);

  // Get unique categories
  const categories = useMemo(() => {
    if (!activeWorkbook) return [];
    const cats = new Set(activeWorkbook.rows.map((r) => r.attributeCategory));
    return Array.from(cats);
  }, [activeWorkbook]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    if (!activeWorkbook) return [];
    return activeWorkbook.rows.filter((row) => {
      // Handle "not-tested" filter matching empty/undefined results
      const matchesResult = resultFilter === "all" ||
        (resultFilter === "not-tested" ? !row.result : row.result === resultFilter);
      const matchesCategory = categoryFilter === "all" || row.attributeCategory === categoryFilter;
      return matchesResult && matchesCategory;
    });
  }, [activeWorkbook, resultFilter, categoryFilter]);

  // Get result badge
  const getResultBadge = (result: string) => {
    // Handle empty results as "not-tested"
    const lookupValue = result || "not-tested";
    const option = RESULT_OPTIONS.find((o) => o.value === lookupValue);
    if (!option || !option.icon) return <Badge variant="outline">-</Badge>;

    const Icon = option.icon;
    let variant: "default" | "secondary" | "destructive" | "outline" = "outline";

    switch (result) {
      case "Pass":
        variant = "default";
        break;
      case "Pass w/Observation":
        variant = "secondary";
        break;
      case "Fail 1 - Regulatory":
      case "Fail 2 - Procedure":
        variant = "destructive";
        break;
    }

    return (
      <Badge variant={variant} className="gap-1 px-2.5 py-0.5 text-xs font-medium">
        <Icon className={cn("h-3 w-3", option.color)} />
        <span className="truncate max-w-[100px]">{option.label}</span>
      </Badge>
    );
  };

  if (!activeWorkbook) {
    return (
      <Card className="h-full flex items-center justify-center">
        <div className="text-center">
          <User className="h-16 w-16 mx-auto mb-4 text-white/60 opacity-30" />
          <h3 className="font-medium mb-2">No Workbook Selected</h3>
          <p className="text-sm text-white/60">
            Generate workbooks to view auditor assignments
          </p>
        </div>
      </Card>
    );
  }

  const { summary } = activeWorkbook;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0 border-b">
        {/* Auditor Tabs */}
        <div className="flex items-center justify-between mb-4">
          <Tabs value={activeAuditorId || workbooks[0]?.auditorId} onValueChange={onAuditorChange}>
            <TabsList>
              {workbooks.map((wb) => (
                <TabsTrigger
                  key={wb.auditorId}
                  value={wb.auditorId}
                  className="flex items-center gap-2"
                >
                  <User className="h-4 w-4" />
                  {wb.auditorName}
                  <Badge variant="secondary" className="ml-1">
                    {wb.assignedSamples.length}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onExport(activeWorkbook.auditorId)}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-6 gap-4">
          <div className="p-3 rounded-lg text-center flex flex-col items-center justify-center min-h-[80px] bg-crowe-teal/10">
            <div className="text-lg font-bold text-crowe-teal-bright">{summary.passCount}</div>
            <div className="text-xs text-white/60">Pass</div>
          </div>
          <div className="p-3 rounded-lg text-center flex flex-col items-center justify-center min-h-[80px] bg-crowe-amber/10">
            <div className="text-lg font-bold text-crowe-amber-bright">{summary.passWithObsCount}</div>
            <div className="text-xs text-white/60">Pass w/Obs</div>
          </div>
          <div className="p-3 rounded-lg text-center flex flex-col items-center justify-center min-h-[80px] bg-crowe-coral/10">
            <div className="text-lg font-bold text-crowe-coral-bright">{summary.fail1RegulatoryCount}</div>
            <div className="text-xs text-white/60">Fail 1</div>
          </div>
          <div className="p-3 rounded-lg text-center flex flex-col items-center justify-center min-h-[80px] bg-crowe-amber-dark/10">
            <div className="text-lg font-bold text-crowe-amber">{summary.fail2ProcedureCount}</div>
            <div className="text-xs text-white/60">Fail 2</div>
          </div>
          <div className="p-3 rounded-lg text-center flex flex-col items-center justify-center min-h-[80px] bg-crowe-blue/10">
            <div className="text-lg font-bold text-crowe-blue-light">{summary.questionToLOBCount}</div>
            <div className="text-xs text-white/60">Questions</div>
          </div>
          <div className="p-3 rounded-lg text-center flex flex-col items-center justify-center min-h-[80px] bg-white/10">
            <div className="text-lg font-bold text-white/70">{summary.naCount}</div>
            <div className="text-xs text-white/60">N/A</div>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-white/60">Completion Progress</span>
            <span className="font-medium">{summary.completionPercentage}%</span>
          </div>
          <Progress value={summary.completionPercentage} className="h-2 [&>div]:h-2" />
          <div className="text-xs text-white/60 mt-1">
            {summary.completedRows} of {summary.totalRows} rows completed
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mt-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-white/60" />
            <Select value={resultFilter} onValueChange={setResultFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by result" />
              </SelectTrigger>
              <SelectContent>
                {RESULT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-auto p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24 px-4 py-3 sticky top-0 bg-background">Case ID</TableHead>
              <TableHead className="w-40 px-4 py-3 sticky top-0 bg-background">Legal Name</TableHead>
              <TableHead className="w-20 px-4 py-3 sticky top-0 bg-background">Category</TableHead>
              <TableHead className="w-28 px-4 py-3 sticky top-0 bg-background">Attribute</TableHead>
              <TableHead className="w-32 px-4 py-3 sticky top-0 bg-background">Result</TableHead>
              <TableHead className="w-40 px-4 py-3 sticky top-0 bg-background">Acceptable Doc</TableHead>
              <TableHead className="px-4 py-3 sticky top-0 bg-background">Observation</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="px-4 py-2 font-mono text-xs">{row.caseId}</TableCell>
                <TableCell className="px-4 py-2 text-sm truncate max-w-[160px]" title={row.legalName}>
                  {row.legalName}
                </TableCell>
                <TableCell className="px-4 py-2">
                  <Badge variant="outline" className="px-2.5 py-0.5 text-xs font-medium">
                    {row.attributeCategory}
                  </Badge>
                </TableCell>
                <TableCell className="px-4 py-2 text-xs truncate max-w-[120px]" title={row.attributeName}>
                  {row.attributeId}
                </TableCell>
                <TableCell className="px-4 py-2">{getResultBadge(row.result)}</TableCell>
                <TableCell className="px-4 py-2 text-xs truncate max-w-[160px]" title={row.acceptableDocUsed}>
                  {row.acceptableDocUsed || "-"}
                </TableCell>
                <TableCell className="px-4 py-2 text-xs text-white/60 truncate max-w-[200px]" title={row.observation}>
                  {row.observation || "-"}
                </TableCell>
              </TableRow>
            ))}
            {filteredRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-white/60">
                  No rows match your filter criteria
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
