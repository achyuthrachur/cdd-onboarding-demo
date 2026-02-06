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
  PlusCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { SamplingConfig, SamplingPlan, SamplingSummary } from "@/lib/sampling/original-engine";
import { SamplingRationale } from "./sampling-rationale";

interface SamplePreviewProps {
  auditRunId: string;
  populationId: string;
  plan: SamplingPlan;
  config: SamplingConfig;
  sample: Record<string, unknown>[] | null;
  summary: SamplingSummary | null;
  sampleId: string | null;
  isLocked: boolean;
  fileName?: string;
  onSampleGenerated: (
    sample: Record<string, unknown>[],
    summary: SamplingSummary,
    sampleId: string
  ) => void;
  onSampleLocked: () => void;
  onPlanUpdated?: (plan: SamplingPlan) => void;
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
  fileName,
  onSampleGenerated,
  onSampleLocked,
  onPlanUpdated,
}: SamplePreviewProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [isLocking, setIsLocking] = useState(false);
  const [isAddingCoverage, setIsAddingCoverage] = useState(false);

  // Count strata with zero samples but population > 0
  const zeroStrata = plan.allocations.filter(
    (a) => a.sample_count === 0 && a.population_count > 0
  );
  const hasZeroStrata = zeroStrata.length > 0;
  const coverageOverrideCount = plan.coverageOverrides?.length || 0;

  const addCoverageOverrides = async () => {
    setIsAddingCoverage(true);
    try {
      const response = await fetch("/api/sampling", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add-coverage-overrides",
          auditRunId,
          plan,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add coverage overrides");
      }

      const data = await response.json();
      onPlanUpdated?.(data.plan);
      toast.success(`Added +1 to ${zeroStrata.length} zero-allocation strata`);
    } catch {
      toast.error("Failed to add coverage overrides");
    } finally {
      setIsAddingCoverage(false);
    }
  };

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
            <Badge variant="secondary" className="px-2.5 py-0.5 text-xs font-medium">
              Target: {plan.desiredSize.toLocaleString()} samples
            </Badge>
            <Badge variant="secondary" className="px-2.5 py-0.5 text-xs font-medium">
              Population: {(plan.populationSize || 0).toLocaleString()}
            </Badge>
            {plan.stratifyFields.length > 0 && (
              <Badge variant="outline" className="px-2.5 py-0.5 text-xs font-medium">
                Stratified by: {plan.stratifyFields.join(", ")}
              </Badge>
            )}
            {hasZeroStrata && (
              <Badge variant="destructive" className="px-2.5 py-0.5 text-xs font-medium">
                <AlertCircle className="mr-1 h-3 w-3" />
                {zeroStrata.length} stratum/strata with 0 samples
              </Badge>
            )}
            {coverageOverrideCount > 0 && (
              <Badge variant="default" className="px-2.5 py-0.5 text-xs font-medium bg-amber-500">
                {coverageOverrideCount} coverage override(s) applied
              </Badge>
            )}
          </div>

          {/* Allocations Table */}
          {plan.allocations.length > 1 && (
            <div className="rounded-md border border-gray-200 dark:border-white/10 mb-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-4 py-3 text-gray-700 dark:text-gray-200 font-semibold">#</TableHead>
                    <TableHead className="px-4 py-3 text-gray-700 dark:text-gray-200 font-semibold">Stratum</TableHead>
                    <TableHead className="px-4 py-3 text-right text-gray-700 dark:text-gray-200 font-semibold">Population</TableHead>
                    <TableHead className="px-4 py-3 text-right text-gray-700 dark:text-gray-200 font-semibold">Sample Size</TableHead>
                    <TableHead className="px-4 py-3 text-right text-gray-700 dark:text-gray-200 font-semibold">Share</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plan.allocations.map((alloc, idx) => {
                    const isZero = alloc.sample_count === 0 && alloc.population_count > 0;
                    const isOverridden = plan.coverageOverrides?.some(
                      (o) => JSON.stringify(o.stratum) === JSON.stringify(alloc.stratum)
                    );
                    return (
                      <TableRow
                        key={idx}
                        className={
                          isOverridden
                            ? "bg-crowe-amber/10"
                            : isZero
                            ? "bg-crowe-coral/10"
                            : ""
                        }
                      >
                        <TableCell className="px-4 py-2 font-mono text-sm text-gray-900 dark:text-white">{idx + 1}</TableCell>
                        <TableCell className="px-4 py-2 text-gray-900 dark:text-white">
                          {Object.entries(alloc.stratum)
                            .map(([k, v]) => `${k}: ${v ?? "NULL"}`)
                            .join(", ") || "(All)"}
                          {isOverridden && (
                            <span className="ml-2 text-xs text-crowe-amber">
                              (+1 override)
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-2 text-right text-gray-900 dark:text-white">
                          {alloc.population_count.toLocaleString()}
                        </TableCell>
                        <TableCell className="px-4 py-2 text-right font-medium text-gray-900 dark:text-white">
                          {alloc.sample_count.toLocaleString()}
                        </TableCell>
                        <TableCell className="px-4 py-2 text-right text-gray-600 dark:text-gray-300">
                          {(((alloc.population_count || 0) / (plan.populationSize || 1)) * 100).toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow className="font-medium bg-gray-50 dark:bg-white/5">
                    <TableCell className="px-4 py-2 text-gray-900 dark:text-white"></TableCell>
                    <TableCell className="px-4 py-2 text-gray-900 dark:text-white">Total</TableCell>
                    <TableCell className="px-4 py-2 text-right text-gray-900 dark:text-white">
                      {(plan.populationSize || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="px-4 py-2 text-right text-gray-900 dark:text-white">
                      {plan.plannedSize.toLocaleString()}
                    </TableCell>
                    <TableCell className="px-4 py-2 text-right text-gray-900 dark:text-white">100%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}

          {/* Add Coverage Override Button */}
          {hasZeroStrata && !isLocked && onPlanUpdated && (
            <Button
              onClick={addCoverageOverrides}
              disabled={isAddingCoverage}
              variant="outline"
              className="w-full mb-4 border-crowe-amber/50 text-crowe-amber-bright hover:bg-crowe-amber/10"
            >
              {isAddingCoverage ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding Coverage Overrides...
                </>
              ) : (
                <>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add +1 to {zeroStrata.length} Zero Strata (Coverage Override)
                </>
              )}
            </Button>
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
                <CardContent className="p-3 text-center flex flex-col items-center justify-center min-h-[80px]">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {summary.sample_selection_method.final_sample_size.toLocaleString()}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300">Sample Size</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center flex flex-col items-center justify-center min-h-[80px]">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {(summary.sampling_rationale.confidence_level * 100).toFixed(0)}%
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300">Confidence Level</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center flex flex-col items-center justify-center min-h-[80px]">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {(summary.sampling_rationale.tolerable_error_rate * 100).toFixed(1)}%
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300">Tolerable Error Rate</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center flex flex-col items-center justify-center min-h-[80px]">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {summary.sample_selection_method.seed}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300">Random Seed</p>
                </CardContent>
              </Card>
            </div>

            {/* Overrides Summary */}
            {summary.overrides?.has_overrides && (
              <div className="p-4 mb-6 border border-crowe-amber/30 bg-crowe-amber/10 rounded-lg">
                <h4 className="font-medium text-crowe-amber-bright mb-2">
                  Overrides Applied
                </h4>
                {summary.overrides.justification && (
                  <p className="text-sm text-crowe-amber mb-2">
                    Justification: {summary.overrides.justification}
                  </p>
                )}
                <div className="text-sm space-y-1">
                  {summary.overrides.parameter_overrides.population_size.applied && (
                    <p>Population Override: {summary.overrides.parameter_overrides.population_size.value?.toLocaleString()} (original: {summary.overrides.parameter_overrides.population_size.original?.toLocaleString()})</p>
                  )}
                  {summary.overrides.parameter_overrides.sample_size.applied && (
                    <p>Sample Size Override: {summary.overrides.parameter_overrides.sample_size.value?.toLocaleString()}</p>
                  )}
                  {summary.overrides.coverage_overrides.length > 0 && (
                    <p>Coverage Overrides: {summary.overrides.coverage_overrides.length} stratum/strata with +1 added</p>
                  )}
                  {summary.overrides.allocation_adjustments.length > 0 && (
                    <p>Allocation Adjustments: {summary.overrides.allocation_adjustments.length} manual adjustments</p>
                  )}
                </div>
              </div>
            )}

            {/* Sample Preview Table */}
            <div className="rounded-md border border-gray-200 dark:border-white/10">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px] px-4 py-3 text-gray-700 dark:text-gray-200 font-semibold">#</TableHead>
                    {Object.keys(sample[0] || {})
                      .slice(0, 5)
                      .map((col) => (
                        <TableHead key={col} className="px-4 py-3 text-gray-700 dark:text-gray-200 font-semibold">{col}</TableHead>
                      ))}
                    {Object.keys(sample[0] || {}).length > 5 && (
                      <TableHead className="px-4 py-3 text-gray-600 dark:text-gray-300 font-semibold">
                        +{Object.keys(sample[0]).length - 5} more
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sample.slice(0, 10).map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="px-4 py-2 font-mono text-sm text-gray-900 dark:text-white">{idx + 1}</TableCell>
                      {Object.keys(row)
                        .slice(0, 5)
                        .map((col) => (
                          <TableCell key={col} className="px-4 py-2 max-w-[150px] truncate text-gray-900 dark:text-white">
                            {String(row[col] ?? "")}
                          </TableCell>
                        ))}
                      {Object.keys(row).length > 5 && (
                        <TableCell className="px-4 py-2 text-gray-600 dark:text-gray-300">...</TableCell>
                      )}
                    </TableRow>
                  ))}
                  {sample.length > 10 && (
                    <TableRow>
                      <TableCell
                        colSpan={Math.min(7, Object.keys(sample[0] || {}).length + 1)}
                        className="text-center py-4 text-gray-600 dark:text-gray-300"
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
                <p className="text-xs text-gray-600 dark:text-gray-300 text-center mt-2">
                  Locking the sample will finalize it for testing. This action cannot be undone.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* AI-Generated Sampling Rationale */}
      {sample && summary && (
        <SamplingRationale
          plan={plan}
          config={config}
          summary={summary}
          fileName={fileName}
          isLocked={isLocked}
        />
      )}
    </div>
  );
}
