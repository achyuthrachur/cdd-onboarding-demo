"use client";

import { useState, useEffect, useMemo } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Save,
  Send,
  Loader2,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Filter,
  Search,
  Eye,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { WorkbookState, WorkbookRow, STANDARD_OBSERVATIONS, RESULT_OPTIONS } from "@/lib/workbook/builder";

interface WorkbookEditorProps {
  workbookId: string;
  onSubmitted: () => void;
}

export function WorkbookEditor({ workbookId, onSubmitted }: WorkbookEditorProps) {
  const [workbook, setWorkbook] = useState<WorkbookState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [resultFilter, setResultFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedRow, setSelectedRow] = useState<WorkbookRow | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const loadWorkbook = async () => {
      try {
        const response = await fetch(`/api/workbooks?id=${workbookId}`);
        if (!response.ok) throw new Error("Failed to load workbook");
        const data = await response.json();
        setWorkbook(data);
      } catch {
        toast.error("Failed to load workbook");
      } finally {
        setIsLoading(false);
      }
    };

    loadWorkbook();
  }, [workbookId]);

  const categories = useMemo(() => {
    if (!workbook) return [];
    return [...new Set(workbook.rows.map((r) => r.category))];
  }, [workbook]);

  const filteredRows = useMemo(() => {
    if (!workbook) return [];
    return workbook.rows.filter((row) => {
      const matchesSearch =
        row.sampleItemId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.entityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.attributeName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesResult =
        resultFilter === "all" ||
        (resultFilter === "incomplete" && row.result === "") ||
        row.result === resultFilter;

      const matchesCategory =
        categoryFilter === "all" || row.category === categoryFilter;

      return matchesSearch && matchesResult && matchesCategory;
    });
  }, [workbook, searchTerm, resultFilter, categoryFilter]);

  const updateRow = (rowId: string, field: keyof WorkbookRow, value: string) => {
    if (!workbook) return;

    const updatedRows = workbook.rows.map((row) =>
      row.id === rowId ? { ...row, [field]: value } : row
    );

    const summary = {
      totalRows: updatedRows.length,
      passCount: updatedRows.filter((r) => r.result === "Pass").length,
      failCount: updatedRows.filter((r) => r.result === "Fail").length,
      naCount: updatedRows.filter((r) => r.result === "N/A").length,
      completedRows: updatedRows.filter((r) => r.result !== "").length,
      incompleteCount: updatedRows.filter((r) => r.result === "").length,
      exceptionsCount: updatedRows.filter((r) => r.result === "Fail").length,
      completionPercentage:
        (updatedRows.filter((r) => r.result !== "").length / updatedRows.length) * 100,
    };

    setWorkbook({
      ...workbook,
      rows: updatedRows,
      summary,
    });
    setHasChanges(true);
  };

  const saveWorkbook = async () => {
    if (!workbook) return;

    setIsSaving(true);
    try {
      const response = await fetch("/api/workbooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save-state",
          auditRunId: workbook.auditRunId,
          workbookId: workbook.id,
          rows: workbook.rows,
        }),
      });

      if (!response.ok) throw new Error("Failed to save workbook");

      setHasChanges(false);
      toast.success("Workbook saved");
    } catch {
      toast.error("Failed to save workbook");
    } finally {
      setIsSaving(false);
    }
  };

  const submitWorkbook = async () => {
    if (!workbook) return;

    // First validate
    const validateResponse = await fetch("/api/workbooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "validate",
        auditRunId: workbook.auditRunId,
        workbookId: workbook.id,
      }),
    });

    const validation = await validateResponse.json();

    if (!validation.valid) {
      const confirmSubmit = window.confirm(
        `Workbook has validation warnings:\n\n${validation.errors.join("\n")}\n\nDo you want to submit anyway?`
      );
      if (!confirmSubmit) return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/workbooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit",
          auditRunId: workbook.auditRunId,
          workbookId: workbook.id,
          force: true, // Allow submit with warnings
        }),
      });

      if (!response.ok) throw new Error("Failed to submit workbook");

      toast.success("Workbook submitted successfully");
      onSubmitted();
    } catch {
      toast.error("Failed to submit workbook");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getResultIcon = (result: string) => {
    switch (result) {
      case "Pass":
        return <CheckCircle2 className="h-4 w-4 text-crowe-teal-bright" />;
      case "Fail":
        return <XCircle className="h-4 w-4 text-crowe-coral-bright" />;
      case "N/A":
        return <MinusCircle className="h-4 w-4 text-white/50" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-white/60" />
        </CardContent>
      </Card>
    );
  }

  if (!workbook) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-white/60">Workbook not found</p>
        </CardContent>
      </Card>
    );
  }

  const isSubmitted = workbook.status === "submitted";

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-3 text-center flex flex-col items-center justify-center min-h-[80px]">
            <div className="text-2xl font-bold">{workbook.summary.totalRows}</div>
            <p className="text-xs text-white/60">Total Tests</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center flex flex-col items-center justify-center min-h-[80px]">
            <div className="text-2xl font-bold text-crowe-teal-bright">
              {workbook.summary.passCount}
            </div>
            <p className="text-xs text-white/60">Passed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center flex flex-col items-center justify-center min-h-[80px]">
            <div className="text-2xl font-bold text-crowe-coral-bright">
              {workbook.summary.failCount}
            </div>
            <p className="text-xs text-white/60">Failed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center flex flex-col items-center justify-center min-h-[80px]">
            <div className="text-2xl font-bold text-white/70">
              {workbook.summary.naCount}
            </div>
            <p className="text-xs text-white/60">N/A</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center flex flex-col items-center justify-center min-h-[80px]">
            <div className="text-2xl font-bold">
              {workbook.summary.completionPercentage.toFixed(0)}%
            </div>
            <p className="text-xs text-white/60">Complete</p>
          </CardContent>
        </Card>
      </div>

      {/* Editor Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Testing Workbook
                <Badge
                  variant={isSubmitted ? "default" : "secondary"}
                  className={isSubmitted ? "bg-green-500" : ""}
                >
                  {workbook.status}
                </Badge>
                {hasChanges && !isSubmitted && (
                  <Badge variant="outline" className="text-crowe-amber-bright">
                    Unsaved changes
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {filteredRows.length} of {workbook.rows.length} rows shown
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={saveWorkbook}
                disabled={isSaving || isSubmitted || !hasChanges}
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save
              </Button>
              <Button
                onClick={submitWorkbook}
                disabled={isSubmitting || isSubmitted}
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Submit
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                <Input
                  placeholder="Search by ID, entity, or attribute..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={resultFilter} onValueChange={setResultFilter}>
              <SelectTrigger className="w-[150px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Result" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Results</SelectItem>
                <SelectItem value="incomplete">Incomplete</SelectItem>
                <SelectItem value="Pass">Pass</SelectItem>
                <SelectItem value="Fail">Fail</SelectItem>
                <SelectItem value="N/A">N/A</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
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

          {/* Table */}
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px] px-4 py-3">Sample ID</TableHead>
                  <TableHead className="w-[150px] px-4 py-3">Entity</TableHead>
                  <TableHead className="w-[150px] px-4 py-3">Attribute</TableHead>
                  <TableHead className="w-[100px] px-4 py-3">Result</TableHead>
                  <TableHead className="w-[200px] px-4 py-3">Observation</TableHead>
                  <TableHead className="w-[80px] px-4 py-3">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.slice(0, 50).map((row) => (
                  <TableRow key={row.id} className={row.result === "Fail" ? "bg-crowe-coral/10" : ""}>
                    <TableCell className="px-4 py-2 font-mono text-sm">
                      {row.sampleItemId}
                    </TableCell>
                    <TableCell className="px-4 py-2 max-w-[150px] truncate">
                      {row.entityName}
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{row.attributeId}</span>
                        <span className="text-xs text-white/60 truncate max-w-[150px]">
                          {row.attributeName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <Select
                        value={row.result || ""}
                        onValueChange={(v) => updateRow(row.id, "result", v)}
                        disabled={isSubmitted}
                      >
                        <SelectTrigger className="w-[90px] h-8">
                          <div className="flex items-center gap-1">
                            {getResultIcon(row.result)}
                            <SelectValue placeholder="-" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {RESULT_OPTIONS.map((opt) => (
                            <SelectItem key={opt || "empty"} value={opt || ""}>
                              <div className="flex items-center gap-2">
                                {getResultIcon(opt)}
                                {opt || "-"}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <Select
                        value={row.observation || "none"}
                        onValueChange={(v) => updateRow(row.id, "observation", v === "none" ? "" : v)}
                        disabled={isSubmitted}
                      >
                        <SelectTrigger className="w-[200px] h-8">
                          <SelectValue placeholder="Select observation...">
                            <span className="truncate">{row.observation || "Select..."}</span>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {STANDARD_OBSERVATIONS.map((obs) => (
                            <SelectItem key={obs.id} value={obs.text}>
                              <span className="truncate max-w-[250px]">{obs.text}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedRow(row)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              {row.sampleItemId} - {row.attributeId}
                              {row.isRequired && (
                                <Badge variant="secondary" className="bg-crowe-amber/20 text-crowe-amber-bright">
                                  Required
                                </Badge>
                              )}
                            </DialogTitle>
                            <DialogDescription>
                              {row.entityName} • {row.category}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 mt-4">
                            <div>
                              <h4 className="font-semibold text-sm mb-1">Test Question</h4>
                              <p className="text-sm bg-white/10 p-3 rounded">{row.questionText}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <h4 className="font-semibold text-sm">Result</h4>
                                <Select
                                  value={row.result || "Not tested"}
                                  onValueChange={(v) => updateRow(row.id, "result", v === "Not tested" ? "" : v)}
                                  disabled={isSubmitted}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select result" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {RESULT_OPTIONS.map((opt) => (
                                      <SelectItem key={opt} value={opt}>
                                        {opt}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <h4 className="font-semibold text-sm">Evidence Reference</h4>
                                <Input
                                  value={row.evidenceReference}
                                  onChange={(e) =>
                                    updateRow(row.id, "evidenceReference", e.target.value)
                                  }
                                  placeholder="e.g., DOC-001, Page 5"
                                  disabled={isSubmitted}
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <h4 className="font-semibold text-sm">Observation</h4>
                              <Select
                                value={row.observation || "none"}
                                onValueChange={(v) => updateRow(row.id, "observation", v === "none" ? "" : v)}
                                disabled={isSubmitted}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select observation..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">None</SelectItem>
                                  {STANDARD_OBSERVATIONS.map((obs) => (
                                    <SelectItem key={obs.id} value={obs.text}>
                                      {obs.text}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <h4 className="font-semibold text-sm">Auditor Notes</h4>
                              <Textarea
                                value={row.auditorNotes}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                                  updateRow(row.id, "auditorNotes", e.target.value)
                                }
                                placeholder="Additional notes..."
                                rows={3}
                                disabled={isSubmitted}
                              />
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredRows.length > 50 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4 text-white/60">
                      <AlertTriangle className="h-4 w-4 inline mr-2" />
                      Showing first 50 of {filteredRows.length} rows. Use filters to narrow results.
                    </TableCell>
                  </TableRow>
                )}
                {filteredRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-white/60">
                      No rows match your filters
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
