"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Database,
} from "lucide-react";
import { toast } from "sonner";
import { ConsolidationDashboard } from "@/components/stage-4/consolidation-dashboard";
import { FindingsTable } from "@/components/stage-4/findings-table";
import { ReportGenerator } from "@/components/stage-4/report-generator";
import { ConsolidationResult } from "@/lib/consolidation/engine";
import { loadFallbackDataForStage, getStageData, hasStageData, setStageData } from "@/lib/stage-data";

export default function Stage6Page() {
  const params = useParams();
  const id = params.id as string;

  const [consolidation, setConsolidation] = useState<ConsolidationResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasTestResults, setHasTestResults] = useState(false);

  // Check for prerequisite data and load stored consolidation
  useEffect(() => {
    setHasTestResults(hasStageData('testResults') || hasStageData('testingProgress'));

    // Check for stored consolidation
    const storedConsolidation = getStageData('consolidatedReport');
    if (storedConsolidation) {
      setConsolidation(storedConsolidation);
    }
    setIsLoading(false);
  }, []);

  // Load existing consolidation from API on mount
  useEffect(() => {
    const loadConsolidation = async () => {
      try {
        const response = await fetch(`/api/consolidation?auditRunId=${id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.length > 0) {
            // Get the latest consolidation
            const latest = data.sort(
              (a: ConsolidationResult, b: ConsolidationResult) =>
                new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
            )[0];
            setConsolidation(latest);
            setStageData('consolidatedReport', latest);
          }
        }
      } catch (error) {
        console.error("Failed to load consolidation:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadConsolidation();
  }, [id]);

  const handleLoadDemoData = () => {
    loadFallbackDataForStage(6);
    const demoConsolidation = getStageData('consolidatedReport');
    if (demoConsolidation) {
      setConsolidation(demoConsolidation);
    }
    setHasTestResults(true);
    toast.success("Demo data loaded for Stage 6");
  };

  const handleGenerateConsolidation = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/consolidation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          auditRunId: id,
          useMock: true, // Use mock data for demo
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate consolidation");
      }

      const data = await response.json();
      setConsolidation(data);
      setStageData('consolidatedReport', data);
      toast.success("Consolidation generated successfully");
    } catch {
      toast.error("Failed to generate consolidation");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefreshConsolidation = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/consolidation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "refresh",
          auditRunId: id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to refresh consolidation");
      }

      const data = await response.json();
      setConsolidation(data);
      setStageData('consolidatedReport', data);
      toast.success("Consolidation refreshed");
    } catch {
      toast.error("Failed to refresh consolidation");
    } finally {
      setIsGenerating(false);
    }
  };

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
              <Badge className="bg-orange-100 text-orange-700">Stage 6</Badge>
              <h1 className="text-3xl font-bold tracking-tight">
                Consolidation & Reporting
              </h1>
            </div>
            <p className="text-muted-foreground mt-2">
              Consolidate all results, view dashboards, and generate final report
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleLoadDemoData}>
              <Database className="h-4 w-4 mr-2" />
              Load Demo Data
            </Button>
            {consolidation ? (
              <Button
                variant="outline"
                onClick={handleRefreshConsolidation}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Refresh Data
              </Button>
            ) : (
              <Button
                onClick={handleGenerateConsolidation}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Consolidation"
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Status Banner */}
      {consolidation ? (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <div>
            <p className="font-medium text-green-700 dark:text-green-300">
              Consolidation Available
            </p>
            <p className="text-sm text-green-600 dark:text-green-400">
              Last generated: {new Date(consolidation.generatedAt).toLocaleString()} •{" "}
              {consolidation.rawData.totalRows} rows from {consolidation.rawData.workbookIds.length} workbook(s)
            </p>
          </div>
        </div>
      ) : !isLoading && (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
          <div>
            <p className="font-medium text-yellow-700 dark:text-yellow-300">
              No Consolidation Yet
            </p>
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              Click &quot;Generate Consolidation&quot; or &quot;Load Demo Data&quot; to aggregate results
            </p>
          </div>
        </div>
      )}

      {/* Consolidation Dashboard */}
      <div className="mb-8">
        <ConsolidationDashboard
          consolidation={consolidation}
          isLoading={isLoading}
        />
      </div>

      {/* Findings Table */}
      {consolidation && (
        <div className="mb-8">
          <FindingsTable
            exceptions={consolidation.exceptions}
            findingsByAttribute={consolidation.findingsByAttribute}
          />
        </div>
      )}

      {/* Report Generator */}
      <div className="mb-8">
        <ReportGenerator
          consolidation={consolidation}
          auditRunId={id}
        />
      </div>

      {/* Prerequisites Info (when no consolidation) */}
      {!consolidation && !isLoading && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Prerequisites</CardTitle>
            <CardDescription>
              Complete these steps before generating consolidation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>Stage 1: Gap Assessment complete</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>Stage 2: Sample locked</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>Stage 3: Attributes extracted</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>Stage 4: Workbook generated</span>
              </div>
              <div className="flex items-center gap-3">
                {hasTestResults ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                )}
                <span>
                  Stage 5: Testing completed
                  {!hasTestResults && (
                    <Badge variant="outline" className="ml-2">
                      Required
                    </Badge>
                  )}
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Demo mode: Click &quot;Load Demo Data&quot; to populate all stages with sample data.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Link href={`/audit-runs/${id}/stage-5`}>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Stage 5
          </Button>
        </Link>
        <Link href={`/audit-runs/${id}`}>
          <Button variant="outline">Back to Overview</Button>
        </Link>
      </div>
    </div>
  );
}
