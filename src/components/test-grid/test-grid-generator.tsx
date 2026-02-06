"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Play,
  FileDown,
  FileSpreadsheet,
  Users,
  CheckCircle2,
  AlertCircle,
  Download,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { ProgressDialog } from "@/components/modals/progress-dialog";
import type { GenerationReviewRow, Attribute } from "@/lib/attribute-library/types";
import {
  generateTestGrids,
  type GeneratedWorkbook,
} from "@/lib/attribute-library/generation-engine";
import {
  downloadTestGrid,
  downloadAllTestGrids,
} from "./test-grid-export";

interface TestGridGeneratorProps {
  assignments: GenerationReviewRow[];
  attributes: Attribute[];
  onWorkbooksGenerated?: (workbooks: GeneratedWorkbook[]) => void;
  onViewWorkbook?: (workbook: GeneratedWorkbook) => void;
}

export function TestGridGenerator({
  assignments,
  attributes,
  onWorkbooksGenerated,
  onViewWorkbook,
}: TestGridGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState("");
  const [generatedWorkbooks, setGeneratedWorkbooks] = useState<GeneratedWorkbook[]>([]);
  const [isCancelled, setIsCancelled] = useState(false);

  // Validation checks
  const hasAssignments = assignments.length > 0;
  const hasAttributes = attributes.length > 0;
  const hasUnassigned = assignments.some(a => !a.AuditorID);
  const canGenerate = hasAssignments && hasAttributes && !hasUnassigned;

  // Get unique auditor count
  const uniqueAuditors = new Set(assignments.map(a => a.AuditorID)).size;

  // Handle progress updates
  const handleProgress = useCallback((current: number, total: number, status: string) => {
    if (isCancelled) return;
    const percentage = total > 0 ? (current / total) * 100 : 0;
    setProgress(percentage);
    setProgressStatus(status);
  }, [isCancelled]);

  // Generate workbooks
  const handleGenerate = async () => {
    setIsGenerating(true);
    setIsCancelled(false);
    setProgress(0);
    setProgressStatus("Initializing generation...");

    try {
      const workbooks = await generateTestGrids(
        assignments,
        attributes,
        handleProgress
      );

      if (!isCancelled) {
        setGeneratedWorkbooks(workbooks);
        onWorkbooksGenerated?.(workbooks);

        const totalRows = workbooks.reduce((sum, wb) => sum + wb.rows.length, 0);
        toast.success(
          `Generated ${workbooks.length} workbooks with ${totalRows} total test rows`
        );
      }
    } catch (error) {
      console.error("Generation error:", error);
      toast.error("Failed to generate test grids");
    } finally {
      setIsGenerating(false);
    }
  };

  // Cancel generation
  const handleCancel = () => {
    setIsCancelled(true);
    setIsGenerating(false);
    toast.info("Generation cancelled");
  };

  // Export single workbook
  const handleExportSingle = async (workbook: GeneratedWorkbook) => {
    try {
      await downloadTestGrid(workbook);
      toast.success(`Exported workbook for ${workbook.auditorName}`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export workbook");
    }
  };

  // Export all workbooks
  const handleExportAll = async () => {
    if (generatedWorkbooks.length === 0) return;

    try {
      await downloadAllTestGrids(generatedWorkbooks);
      toast.success(`Exported ${generatedWorkbooks.length} workbooks`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export workbooks");
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Dialog */}
      <ProgressDialog
        open={isGenerating}
        title="Generating Test Grids"
        progress={progress}
        status={progressStatus}
        onCancel={handleCancel}
      />

      {/* Generation Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Generate Test Grids
          </CardTitle>
          <CardDescription>
            Create auditor workbooks from sample assignments and attributes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Prerequisites */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Prerequisites:</p>
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={hasAssignments ? "default" : "outline"}
                className={hasAssignments ? "bg-green-500/20 text-green-300" : ""}
              >
                {hasAssignments ? (
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                ) : (
                  <AlertCircle className="mr-1 h-3 w-3" />
                )}
                {assignments.length} Assignments
              </Badge>
              <Badge
                variant={hasAttributes ? "default" : "outline"}
                className={hasAttributes ? "bg-green-500/20 text-green-300" : ""}
              >
                {hasAttributes ? (
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                ) : (
                  <AlertCircle className="mr-1 h-3 w-3" />
                )}
                {attributes.length} Attributes
              </Badge>
              <Badge
                variant={!hasUnassigned ? "default" : "destructive"}
                className={!hasUnassigned ? "bg-green-500/20 text-green-300" : ""}
              >
                {!hasUnassigned ? (
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                ) : (
                  <AlertCircle className="mr-1 h-3 w-3" />
                )}
                {hasUnassigned ? "Has Unassigned" : "All Assigned"}
              </Badge>
              <Badge variant="outline">
                <Users className="mr-1 h-3 w-3" />
                {uniqueAuditors} Auditors
              </Badge>
            </div>
          </div>

          {/* Generation Summary */}
          <div className="rounded-md bg-white/10 p-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-2xl font-bold text-white">{assignments.length}</p>
                <p className="text-xs text-white/70">Entities</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{attributes.length}</p>
                <p className="text-xs text-white/70">Attributes</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{uniqueAuditors}</p>
                <p className="text-xs text-white/70">Workbooks</p>
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={!canGenerate || isGenerating}
            className="w-full"
            size="lg"
          >
            <Play className="mr-2 h-4 w-4" />
            Generate Test Grids
          </Button>

          {!canGenerate && (
            <p className="text-xs text-white/70 text-center">
              {!hasAssignments && "No assignments available. "}
              {!hasAttributes && "No attributes available. "}
              {hasUnassigned && "Some entities are unassigned. "}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Generated Workbooks */}
      {generatedWorkbooks.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Generated Workbooks
                </CardTitle>
                <CardDescription>
                  {generatedWorkbooks.length} workbooks generated successfully
                </CardDescription>
              </div>
              <Button variant="outline" onClick={handleExportAll}>
                <Download className="mr-2 h-4 w-4" />
                Export All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Summary Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold">
                    {generatedWorkbooks.reduce((sum, wb) => sum + wb.entityCount, 0)}
                  </div>
                  <p className="text-xs text-white/70">Total Entities</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold">
                    {generatedWorkbooks.reduce((sum, wb) => sum + wb.summary.totalRows, 0)}
                  </div>
                  <p className="text-xs text-white/70">Total Test Rows</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-green-600">
                    {generatedWorkbooks.reduce((sum, wb) => sum + wb.summary.passCount, 0)}
                  </div>
                  <p className="text-xs text-white/70">Pass</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-red-600">
                    {generatedWorkbooks.reduce(
                      (sum, wb) => sum + wb.summary.fail1Count + wb.summary.fail2Count,
                      0
                    )}
                  </div>
                  <p className="text-xs text-white/70">Fail</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold">
                    {generatedWorkbooks.reduce((sum, wb) => sum + wb.summary.emptyCount, 0)}
                  </div>
                  <p className="text-xs text-white/70">Pending</p>
                </CardContent>
              </Card>
            </div>

            {/* Workbooks Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-4 py-3 text-left text-sm font-medium">Auditor</TableHead>
                    <TableHead className="px-4 py-3 text-center text-sm font-medium">Entities</TableHead>
                    <TableHead className="px-4 py-3 text-center text-sm font-medium">Test Rows</TableHead>
                    <TableHead className="px-4 py-3 text-center text-sm font-medium">Pass</TableHead>
                    <TableHead className="px-4 py-3 text-center text-sm font-medium">Fail</TableHead>
                    <TableHead className="px-4 py-3 text-center text-sm font-medium">Pending</TableHead>
                    <TableHead className="px-4 py-3 text-center text-sm font-medium">% Complete</TableHead>
                    <TableHead className="px-4 py-3 text-right text-sm font-medium">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {generatedWorkbooks.map((workbook) => (
                    <TableRow key={workbook.auditorId}>
                      <TableCell className="px-4 py-2">
                        <div>
                          <p className="font-medium text-sm">{workbook.auditorName}</p>
                          <p className="text-xs text-white/70">
                            {workbook.auditorId}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-2 text-center text-sm">
                        {workbook.entityCount}
                      </TableCell>
                      <TableCell className="px-4 py-2 text-center text-sm">
                        {workbook.summary.totalRows}
                      </TableCell>
                      <TableCell className="px-4 py-2 text-center text-sm">
                        <span className="text-green-600 font-medium">
                          {workbook.summary.passCount}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-2 text-center text-sm">
                        <span className="text-red-600 font-medium">
                          {workbook.summary.fail1Count + workbook.summary.fail2Count}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-2 text-center text-sm">
                        {workbook.summary.emptyCount}
                      </TableCell>
                      <TableCell className="px-4 py-2 text-center">
                        <Badge
                          variant={
                            workbook.summary.completionPercentage >= 100
                              ? "default"
                              : workbook.summary.completionPercentage > 0
                              ? "secondary"
                              : "outline"
                          }
                          className={
                            workbook.summary.completionPercentage >= 100
                              ? "bg-green-500/20 text-green-300"
                              : ""
                          }
                        >
                          {workbook.summary.completionPercentage.toFixed(0)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {onViewWorkbook && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onViewWorkbook(workbook)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleExportSingle(workbook)}
                          >
                            <FileDown className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
