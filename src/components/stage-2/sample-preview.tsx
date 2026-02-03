"use client";

import { useState } from "react";
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
  Lock,
  Download,
  Loader2,
  CheckCircle2,
  ListTree,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { SamplingConfig, SamplingPlan, SamplingSummary } from "@/lib/sampling/engine";

interface SamplePreviewProps {
  auditRunId: string;
  populationId: string;
  plan: SamplingPlan;
  config: SamplingConfig;
  sample: Record<string, unknown>[] | null;
  summary: SamplingSummary | null;
  sampleId: string | null;
  isLocked: boolean;
  onSampleGenerated: (
    sample: Record<string, unknown>[],
    summary: SamplingSummary,
    sampleId: string
  ) => void;
  onSampleLocked: () => void;
}

export function SamplePreview({
  auditRunId,
  populationId,
  plan,
  config,
  sample,
  summary,
  sampleId,
  isLocked,
  onSampleGenerated,
  onSampleLocked,
}: SamplePreviewProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [isLocking, setIsLocking] = useState(false);

  const runSampling = async () => {
    setIsRunning(true);
    try {
      const response = await fetch("/api/sampling", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "run-sampling",
          auditRunId,
          populationId,
          config,
          plan,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to run sampling");
      }

      const data = await response.json();

      // Fetch the full sample data
      const sampleResponse = await fetch(
        `/api/sampling?id=${data.id}&type=sample`
      );
      if (!sampleResponse.ok) {
        throw new Error("Failed to fetch sample data");
      }

      const sampleData = await sampleResponse.json();
      onSampleGenerated(sampleData.sample, data.summary, data.id);
      toast.success(`Generated sample of ${data.sampleSize} records`);
    } catch {
      toast.error("Failed to generate sample");
    } finally {
      setIsRunning(false);
    }
  };

  const lockSample = async () => {
    if (!sampleId) return;

    setIsLocking(true);
    try {
      const response = await fetch("/api/sampling", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "lock-sample",
          auditRunId,
          sampleId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to lock sample");
      }

      onSampleLocked();
      toast.success("Sample locked successfully");
    } catch {
      toast.error("Failed to lock sample");
    } finally {
      setIsLocking(false);
    }
  };

  const exportToCSV = () => {
    if (!sample || sample.length === 0) return;

    const columns = Object.keys(sample[0]);
    const escape = (v: unknown): string => {
      if (v === null || v === undefined) return "";
      const s = String(v).replace(/"/g, '""');
      return /[",\n]/.test(s) ? `"${s}"` : s;
    };

    const header = columns.join(",");
    const rows = sample.map((row) =>
      columns.map((col) => escape(row[col])).join(",")
    );
    const csv = [header, ...rows].join("\r\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sample_${auditRunId}_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Sample exported to CSV");
  };

  const exportSummaryToJSON = () => {
    if (!summary) return;

    const json = JSON.stringify(summary, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sample_summary_${auditRunId}_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Summary exported to JSON");
  };

  return (
    <div className="space-y-6">
      {/* Sampling Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListTree className="h-5 w-5" />
            Sampling Plan
          </CardTitle>
          <CardDescription>
            Review the allocation per stratum before generating the sample
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Plan Summary */}
          <div className="flex flex-wrap gap-3 mb-4">
            <Badge variant="secondary" className="text-sm">
              Target: {plan.desiredSize.toLocaleString()} samples
            </Badge>
            <Badge variant="secondary" className="text-sm">
              Population: {plan.populationSize.toLocaleString()}
            </Badge>
            {plan.stratifyFields.length > 0 && (
              <Badge variant="outline" className="text-sm">
                Stratified by: {plan.stratifyFields.join(", ")}
              </Badge>
            )}
          </div>

          {/* Allocations Table */}
          {plan.allocations.length > 1 && (
            <div className="rounded-md border mb-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Stratum</TableHead>
                    <TableHead className="text-right">Population</TableHead>
                    <TableHead className="text-right">Sample Size</TableHead>
                    <TableHead className="text-right">Share</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plan.allocations.map((alloc, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        {Object.entries(alloc.stratum)
                          .map(([k, v]) => `${k}: ${v ?? "NULL"}`)
                          .join(", ") || "(All)"}
                      </TableCell>
                      <TableCell className="text-right">
                        {alloc.populationCount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {alloc.sampleCount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {(alloc.shareOfPopulation * 100).toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-medium">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right">
                      {plan.populationSize.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {plan.plannedSize.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">100%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}

          {/* Generate Sample Button */}
          <Button
            onClick={runSampling}
            disabled={isRunning || isLocked}
            className="w-full"
          >
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Sample...
              </>
            ) : isLocked ? (
              <>
                <Lock className="mr-2 h-4 w-4" />
                Sample Locked
              </>
            ) : sample ? (
              <>
                <Play className="mr-2 h-4 w-4" />
                Regenerate Sample
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Generate Sample
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Sample Results */}
      {sample && summary && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Sample Results
                  {isLocked && (
                    <Badge variant="default" className="ml-2 bg-green-500">
                      <Lock className="mr-1 h-3 w-3" />
                      Locked
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {sample.length.toLocaleString()} records selected
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={exportToCSV}>
                  <Download className="mr-2 h-4 w-4" />
                  CSV
                </Button>
                <Button variant="outline" size="sm" onClick={exportSummaryToJSON}>
                  <Download className="mr-2 h-4 w-4" />
                  Summary
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Summary Stats */}
            <div className="grid gap-4 md:grid-cols-4 mb-6">
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold">
                    {summary.sampleSelectionMethod.finalSampleSize.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">Sample Size</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold">
                    {(summary.samplingRationale.confidenceLevel * 100).toFixed(0)}%
                  </div>
                  <p className="text-xs text-muted-foreground">Confidence Level</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold">
                    {(summary.samplingRationale.tolerableErrorRate * 100).toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">Margin of Error</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold">
                    {summary.sampleSelectionMethod.seed}
                  </div>
                  <p className="text-xs text-muted-foreground">Random Seed</p>
                </CardContent>
              </Card>
            </div>

            {/* Sample Preview Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">#</TableHead>
                    {Object.keys(sample[0] || {})
                      .slice(0, 5)
                      .map((col) => (
                        <TableHead key={col}>{col}</TableHead>
                      ))}
                    {Object.keys(sample[0] || {}).length > 5 && (
                      <TableHead className="text-muted-foreground">
                        +{Object.keys(sample[0]).length - 5} more
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sample.slice(0, 10).map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-mono text-sm">{idx + 1}</TableCell>
                      {Object.keys(row)
                        .slice(0, 5)
                        .map((col) => (
                          <TableCell key={col} className="max-w-[150px] truncate">
                            {String(row[col] ?? "")}
                          </TableCell>
                        ))}
                      {Object.keys(row).length > 5 && (
                        <TableCell className="text-muted-foreground">...</TableCell>
                      )}
                    </TableRow>
                  ))}
                  {sample.length > 10 && (
                    <TableRow>
                      <TableCell
                        colSpan={Math.min(7, Object.keys(sample[0] || {}).length + 1)}
                        className="text-center text-muted-foreground"
                      >
                        ... and {sample.length - 10} more rows
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Lock Sample Button */}
            {!isLocked && (
              <div className="mt-6">
                <Button
                  onClick={lockSample}
                  disabled={isLocking}
                  variant="default"
                  className="w-full"
                >
                  {isLocking ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Locking Sample...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Lock Sample & Proceed to Workbooks
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Locking the sample will finalize it for testing. This action cannot be undone.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
