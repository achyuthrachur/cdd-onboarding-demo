"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ArrowLeft,
  ArrowRight,
  Grid3X3,
  CheckSquare,
  FileDown,
  CheckCircle2,
  FileSpreadsheet,
  Library,
} from "lucide-react";
import { WorkbookGenerator } from "@/components/stage-3/workbook-generator";
import { WorkbookEditor } from "@/components/stage-3/workbook-editor";
import { AttributeLibraryUI } from "@/components/attribute-library";

interface WorkbookSummary {
  id: string;
  status: string;
  rowCount: number;
  summary: {
    totalRows: number;
    completedRows: number;
    passCount: number;
    failCount: number;
    naCount: number;
    completionPercentage: number;
  };
  createdAt: string;
}

type ViewMode = "workbooks" | "attribute-library";

export default function Stage3Page() {
  const params = useParams();
  const id = params.id as string;

  const [viewMode, setViewMode] = useState<ViewMode>("workbooks");
  const [workbooks, setWorkbooks] = useState<WorkbookSummary[]>([]);
  const [selectedWorkbookId, setSelectedWorkbookId] = useState<string | null>(null);
  const [hasStage1Results, setHasStage1Results] = useState(true); // Demo mode
  const [hasLockedSample, setHasLockedSample] = useState(true); // Demo mode

  // Load existing workbooks on mount
  useEffect(() => {
    const loadWorkbooks = async () => {
      try {
        const response = await fetch(`/api/workbooks?auditRunId=${id}`);
        if (response.ok) {
          const data = await response.json();
          setWorkbooks(data);
          // Auto-select the first non-submitted workbook
          const activeWorkbook = data.find(
            (wb: WorkbookSummary) => wb.status !== "submitted"
          );
          if (activeWorkbook) {
            setSelectedWorkbookId(activeWorkbook.id);
          }
        }
      } catch (error) {
        console.error("Failed to load workbooks:", error);
      }
    };

    loadWorkbooks();
  }, [id]);

  const handleWorkbookGenerated = (workbook: WorkbookSummary) => {
    setWorkbooks([...workbooks, workbook]);
    setSelectedWorkbookId(workbook.id);
  };

  const handleWorkbookSubmitted = () => {
    // Refresh workbooks list
    setWorkbooks(
      workbooks.map((wb) =>
        wb.id === selectedWorkbookId ? { ...wb, status: "submitted" } : wb
      )
    );
    setSelectedWorkbookId(null);
  };

  const handleGenerateFromLibrary = () => {
    // Switch to workbooks view and trigger generation
    setViewMode("workbooks");
  };

  const hasSubmittedWorkbook = workbooks.some((wb) => wb.status === "submitted");
  const canProceed = hasSubmittedWorkbook;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
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
              <Badge className="bg-purple-100 text-purple-700">Stage 3</Badge>
              <h1 className="text-3xl font-bold tracking-tight">
                Testing Workbooks
              </h1>
            </div>
            <p className="text-muted-foreground mt-2">
              Generate workbooks, complete testing, and submit results
            </p>
          </div>
        </div>
      </div>

      {/* View Mode Tabs */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)} className="mb-6">
        <TabsList>
          <TabsTrigger value="workbooks" className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Workbook Testing
          </TabsTrigger>
          <TabsTrigger value="attribute-library" className="flex items-center gap-2">
            <Library className="h-4 w-4" />
            Attribute Library
          </TabsTrigger>
        </TabsList>

        {/* Workbook Testing View */}
        <TabsContent value="workbooks" className="mt-6">
          {/* Workflow Steps */}
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <Card className={workbooks.length > 0 ? "border-green-500" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      workbooks.length > 0
                        ? "bg-green-100 text-green-600"
                        : "bg-blue-100 text-blue-600"
                    }`}
                  >
                    {workbooks.length > 0 ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Grid3X3 className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-base">Step 1: Generate</CardTitle>
                    <CardDescription>Create workbooks</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Badge variant={workbooks.length > 0 ? "default" : "outline"}>
                  {workbooks.length > 0
                    ? `${workbooks.length} workbook(s)`
                    : "No workbooks"}
                </Badge>
              </CardContent>
            </Card>

            <Card
              className={
                workbooks.some((wb) => wb.status === "in_progress")
                  ? "border-green-500"
                  : ""
              }
            >
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      workbooks.some(
                        (wb) =>
                          wb.status === "in_progress" || wb.status === "submitted"
                      )
                        ? "bg-green-100 text-green-600"
                        : "bg-purple-100 text-purple-600"
                    }`}
                  >
                    {workbooks.some(
                      (wb) =>
                        wb.status === "in_progress" || wb.status === "submitted"
                    ) ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <CheckSquare className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-base">Step 2: Complete</CardTitle>
                    <CardDescription>Test samples</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Badge
                  variant={
                    workbooks.some((wb) => wb.summary?.completionPercentage > 0)
                      ? "default"
                      : "outline"
                  }
                >
                  {workbooks.length > 0
                    ? `${Math.round(
                        workbooks.reduce(
                          (sum, wb) => sum + (wb.summary?.completionPercentage || 0),
                          0
                        ) / workbooks.length
                      )}% avg completion`
                    : "Pending"}
                </Badge>
              </CardContent>
            </Card>

            <Card className={hasSubmittedWorkbook ? "border-green-500" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      hasSubmittedWorkbook
                        ? "bg-green-100 text-green-600"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {hasSubmittedWorkbook ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <FileDown className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-base">Step 3: Submit</CardTitle>
                    <CardDescription>For consolidation</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Badge variant={hasSubmittedWorkbook ? "default" : "outline"}>
                  {hasSubmittedWorkbook
                    ? `${workbooks.filter((wb) => wb.status === "submitted").length} submitted`
                    : "Pending"}
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Workbook Generator */}
          <div className="mb-6">
            <WorkbookGenerator
              auditRunId={id}
              hasStage1Results={hasStage1Results}
              hasLockedSample={hasLockedSample}
              workbooks={workbooks}
              onWorkbookGenerated={handleWorkbookGenerated}
            />
          </div>

          {/* Workbook Selector */}
          {workbooks.length > 0 && !selectedWorkbookId && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Select Workbook to Edit</CardTitle>
                <CardDescription>
                  Choose a workbook to continue testing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {workbooks.map((wb) => (
                    <div
                      key={wb.id}
                      className="flex items-center justify-between p-4 bg-muted rounded-lg cursor-pointer hover:bg-muted/80"
                      onClick={() =>
                        wb.status !== "submitted" && setSelectedWorkbookId(wb.id)
                      }
                    >
                      <div>
                        <p className="font-medium">
                          Workbook - {new Date(wb.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {wb.rowCount} tests • {wb.summary.completionPercentage.toFixed(0)}%
                          complete
                        </p>
                      </div>
                      <Badge
                        variant={
                          wb.status === "submitted"
                            ? "default"
                            : wb.status === "in_progress"
                            ? "secondary"
                            : "outline"
                        }
                        className={wb.status === "submitted" ? "bg-green-500" : ""}
                      >
                        {wb.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Workbook Editor */}
          {selectedWorkbookId && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <Button
                  variant="outline"
                  onClick={() => setSelectedWorkbookId(null)}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Workbook List
                </Button>
              </div>
              <WorkbookEditor
                workbookId={selectedWorkbookId}
                onSubmitted={handleWorkbookSubmitted}
              />
            </div>
          )}
        </TabsContent>

        {/* Attribute Library View */}
        <TabsContent value="attribute-library" className="mt-6">
          <AttributeLibraryUI
            auditRunId={id}
            onWorkbookGenerate={handleGenerateFromLibrary}
          />
        </TabsContent>
      </Tabs>

      {/* Navigation */}
      <div className="flex justify-between">
        <Link href={`/audit-runs/${id}/stage-2`}>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Stage 2
          </Button>
        </Link>
        <Link href={`/audit-runs/${id}/stage-4`}>
          <Button disabled={!canProceed}>
            Continue to Reporting
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
