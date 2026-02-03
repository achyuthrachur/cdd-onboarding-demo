"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileSpreadsheet, Plus, Loader2, Database, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

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

interface WorkbookGeneratorProps {
  auditRunId: string;
  hasStage1Results: boolean;
  hasLockedSample: boolean;
  workbooks: WorkbookSummary[];
  onWorkbookGenerated: (workbook: WorkbookSummary) => void;
}

export function WorkbookGenerator({
  auditRunId,
  hasStage1Results,
  hasLockedSample,
  workbooks,
  onWorkbookGenerated,
}: WorkbookGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const canGenerate = hasStage1Results && hasLockedSample;

  const generateWorkbook = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/workbooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          auditRunId,
          useMock: true, // Use mock data for demo
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate workbook");
      }

      const data = await response.json();
      onWorkbookGenerated(data);
      toast.success(`Generated workbook with ${data.rowCount} test rows`);
    } catch {
      toast.error("Failed to generate workbook");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Generate Testing Workbook
        </CardTitle>
        <CardDescription>
          Create a new testing workbook from attributes and sample data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Prerequisites */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Prerequisites:</p>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={hasStage1Results ? "default" : "outline"}
              className={hasStage1Results ? "bg-green-100 text-green-700" : ""}
            >
              {hasStage1Results ? (
                <CheckCircle2 className="mr-1 h-3 w-3" />
              ) : null}
              Stage 1: Attributes
            </Badge>
            <Badge
              variant={hasLockedSample ? "default" : "outline"}
              className={hasLockedSample ? "bg-green-100 text-green-700" : ""}
            >
              {hasLockedSample ? (
                <CheckCircle2 className="mr-1 h-3 w-3" />
              ) : null}
              Stage 2: Locked Sample
            </Badge>
          </div>
        </div>

        {/* Existing Workbooks */}
        {workbooks.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Existing Workbooks:</p>
            <div className="space-y-2">
              {workbooks.map((wb) => (
                <div
                  key={wb.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Database className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        Workbook - {new Date(wb.createdAt).toLocaleDateString()}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{wb.rowCount} rows</span>
                        <span>•</span>
                        <span>{wb.summary.completionPercentage.toFixed(0)}% complete</span>
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant={
                      wb.status === "submitted"
                        ? "default"
                        : wb.status === "in_progress"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {wb.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Generate Button */}
        <Button
          onClick={generateWorkbook}
          disabled={!canGenerate || isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Workbook...
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Generate New Workbook
            </>
          )}
        </Button>

        {!canGenerate && (
          <p className="text-xs text-muted-foreground text-center">
            Complete Stages 1 and 2 (with locked sample) to generate a workbook.
          </p>
        )}

        <p className="text-xs text-muted-foreground text-center">
          Demo mode: Uses mock attributes and sample data.
        </p>
      </CardContent>
    </Card>
  );
}
