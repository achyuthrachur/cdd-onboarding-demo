"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings2, Calculator, Layers, X, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  SamplingConfig as SamplingConfigType,
  SamplingPlan,
  calculateSampleSize,
  hasOverrides,
} from "@/lib/sampling/original-engine";

interface SamplingConfigProps {
  auditRunId: string;
  populationId: string;
  columns: string[];
  populationSize: number;
  onPlanComputed: (plan: SamplingPlan, config: SamplingConfigType) => void;
}

export function SamplingConfig({
  auditRunId,
  populationId,
  columns,
  populationSize,
  onPlanComputed,
}: SamplingConfigProps) {
  // Method now uses "simple_random" to match the original HTML tool
  const [method, setMethod] = useState<"statistical" | "simple_random" | "systematic" | "percentage">("statistical");
  const [confidence, setConfidence] = useState(95);
  const [margin, setMargin] = useState(5);
  const [expectedError, setExpectedError] = useState(1);
  const [sampleSizeOverride, setSampleSizeOverride] = useState("");
  const [samplePercentage, setSamplePercentage] = useState("");
  const [seed, setSeed] = useState(42);
  const [stratifyFields, setStratifyFields] = useState<string[]>([]);
  const [idColumn, setIdColumn] = useState("");
  const [isComputing, setIsComputing] = useState(false);

  // New fields from original HTML tool
  const [populationOverride, setPopulationOverride] = useState("");
  const [overrideJustification, setOverrideJustification] = useState("");
  const [systematicStep, setSystematicStep] = useState("");

  // Calculate estimated sample size
  const [estimatedSize, setEstimatedSize] = useState(0);

  // Check if any overrides are active
  const configHasOverrides = hasOverrides({
    method,
    confidence: confidence / 100,
    margin: margin / 100,
    expectedErrorRate: expectedError / 100,
    sampleSize: sampleSizeOverride ? parseInt(sampleSizeOverride) : null,
    samplePercentage: samplePercentage ? parseFloat(samplePercentage) : null,
    systematicStep: systematicStep ? parseInt(systematicStep) : null,
    seed,
    stratifyFields,
    populationOverride: populationOverride ? parseInt(populationOverride) : null,
  });

  useEffect(() => {
    // Use population override if set, otherwise actual population size
    const effectivePop = populationOverride ? parseInt(populationOverride) : populationSize;

    if (sampleSizeOverride) {
      setEstimatedSize(parseInt(sampleSizeOverride) || 0);
    } else if (method === "percentage" && samplePercentage) {
      setEstimatedSize(Math.ceil(effectivePop * (parseFloat(samplePercentage) / 100)));
    } else {
      try {
        const size = calculateSampleSize(
          effectivePop,
          confidence / 100,
          margin / 100,
          expectedError / 100
        );
        setEstimatedSize(size);
      } catch {
        // Handle error (e.g., TER must exceed EER)
        setEstimatedSize(0);
      }
    }
  }, [populationSize, populationOverride, confidence, margin, expectedError, sampleSizeOverride, method, samplePercentage]);

  const addStratifyField = (field: string) => {
    if (field && !stratifyFields.includes(field)) {
      setStratifyFields([...stratifyFields, field]);
    }
  };

  const removeStratifyField = (field: string) => {
    setStratifyFields(stratifyFields.filter((f) => f !== field));
  };

  const computePlan = async () => {
    // Validate simple_random method requires sample size or percentage
    if (method === "simple_random" && !sampleSizeOverride && !samplePercentage) {
      toast.error("Simple Random sampling requires either a sample size or percentage");
      return;
    }

    // Validate percentage method requires sample percentage
    if (method === "percentage" && !samplePercentage) {
      toast.error("Percentage-based sampling requires a sample percentage");
      return;
    }

    // Validate override justification if overrides are active
    if (configHasOverrides && !overrideJustification.trim()) {
      toast.error("Override justification is required when using overrides");
      return;
    }

    setIsComputing(true);
    try {
      const config: SamplingConfigType = {
        method,
        confidence: confidence / 100,
        margin: margin / 100,
        expectedErrorRate: expectedError / 100,
        sampleSize: sampleSizeOverride ? parseInt(sampleSizeOverride) : null,
        samplePercentage: samplePercentage ? parseFloat(samplePercentage) : null,
        systematicStep: systematicStep ? parseInt(systematicStep) : null,
        seed,
        stratifyFields,
        idColumn: idColumn || undefined,
        systematicRandomStart: true,
        overrideJustification: overrideJustification.trim() || undefined,
        populationOverride: populationOverride ? parseInt(populationOverride) : null,
      };

      const response = await fetch("/api/sampling", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "compute-plan",
          auditRunId,
          populationId,
          config,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to compute sampling plan");
      }

      const data = await response.json();
      onPlanComputed(data.plan, config);
      toast.success("Sampling plan computed");
    } catch {
      toast.error("Failed to compute sampling plan");
    } finally {
      setIsComputing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="h-5 w-5" />
          Sampling Configuration
        </CardTitle>
        <CardDescription>
          Configure sampling parameters and stratification
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Method Selection */}
        <div className="space-y-1.5">
          <Label>Sampling Method</Label>
          <Select
            value={method}
            onValueChange={(v) =>
              setMethod(v as "statistical" | "simple_random" | "systematic" | "percentage")
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="statistical">Statistical (Recommended)</SelectItem>
              <SelectItem value="simple_random">Simple Random</SelectItem>
              <SelectItem value="systematic">Systematic</SelectItem>
              <SelectItem value="percentage">Percentage-based</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-600 dark:text-gray-300">
            {method === "statistical" &&
              "Uses confidence level, tolerable error rate, and expected error rate to calculate sample size (Wald CI + FPC)"}
            {method === "simple_random" &&
              "Randomly selects records from the population using Fisher-Yates shuffle"}
            {method === "systematic" &&
              "Selects every Nth record with a random starting point"}
            {method === "percentage" &&
              "Selects a fixed percentage of the population"}
          </p>
        </div>

        {/* Statistical Parameters */}
        {(method === "statistical" || method === "systematic") && (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="confidence">Confidence Level (%)</Label>
              <Input
                id="confidence"
                type="number"
                min={50}
                max={99.9}
                step={0.1}
                value={confidence}
                onChange={(e) => setConfidence(parseFloat(e.target.value) || 95)}
              />
              <p className="text-xs text-gray-600 dark:text-gray-300">50-99.9%</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="margin">Tolerable Error Rate (%)</Label>
              <Input
                id="margin"
                type="number"
                min={0.01}
                max={100}
                step={0.1}
                value={margin}
                onChange={(e) => setMargin(parseFloat(e.target.value) || 5)}
              />
              <p className="text-xs text-gray-600 dark:text-gray-300">Must exceed Expected Error Rate</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="expectedError">Expected Error Rate (%)</Label>
              <Input
                id="expectedError"
                type="number"
                min={0}
                max={99}
                step={0.1}
                value={expectedError}
                onChange={(e) => setExpectedError(parseFloat(e.target.value) || 1)}
              />
              <p className="text-xs text-gray-600 dark:text-gray-300">Based on historical performance</p>
            </div>
          </div>
        )}

        {/* Percentage Method */}
        {method === "percentage" && (
          <div className="space-y-1.5">
            <Label htmlFor="samplePercentage">Sample Percentage (%) <span className="text-red-500">*</span></Label>
            <Input
              id="samplePercentage"
              type="number"
              min={1}
              max={100}
              step={1}
              value={samplePercentage}
              onChange={(e) => setSamplePercentage(e.target.value)}
              placeholder="e.g., 10"
            />
            <p className="text-xs text-gray-600 dark:text-gray-300">Required for percentage-based sampling</p>
          </div>
        )}

        {/* Simple Random Method - requires sample size or percentage */}
        {method === "simple_random" && (
          <div className="grid gap-4 md:grid-cols-2 p-4 border border-crowe-blue/30 bg-crowe-blue/10 rounded-lg">
            <div className="space-y-1.5">
              <Label htmlFor="simpleRandomSize">Sample Size <span className="text-red-500">*</span></Label>
              <Input
                id="simpleRandomSize"
                type="number"
                min={1}
                max={populationSize}
                value={sampleSizeOverride}
                onChange={(e) => setSampleSizeOverride(e.target.value)}
                placeholder="e.g., 100"
              />
              <p className="text-xs text-gray-600 dark:text-gray-300">Number of records to sample</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="simpleRandomPercentage">Or Sample Percentage (%)</Label>
              <Input
                id="simpleRandomPercentage"
                type="number"
                min={1}
                max={100}
                step={1}
                value={samplePercentage}
                onChange={(e) => setSamplePercentage(e.target.value)}
                placeholder="e.g., 10"
              />
              <p className="text-xs text-gray-600 dark:text-gray-300">Alternative to fixed sample size</p>
            </div>
            <p className="col-span-2 text-xs text-crowe-blue-light">
              Simple Random sampling requires either a sample size or percentage.
            </p>
          </div>
        )}

        {/* Overrides - only show for methods where these are actual overrides */}
        {method !== "simple_random" && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="populationOverride">Population Size Override</Label>
              <Input
                id="populationOverride"
                type="number"
                min={1}
                value={populationOverride}
                onChange={(e) => setPopulationOverride(e.target.value)}
                placeholder={`Actual: ${populationSize.toLocaleString()}`}
              />
              <p className="text-xs text-gray-600 dark:text-gray-300">
                Test sample calculations with different population assumptions
              </p>
            </div>
            {method !== "percentage" && (
              <div className="space-y-1.5">
                <Label htmlFor="sampleSizeOverride">Sample Size Override</Label>
                <Input
                  id="sampleSizeOverride"
                  type="number"
                  min={1}
                  max={populationOverride ? parseInt(populationOverride) : populationSize}
                  value={sampleSizeOverride}
                  onChange={(e) => setSampleSizeOverride(e.target.value)}
                  placeholder="Leave empty to use calculated size"
                />
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  Override the calculated sample size with a specific number
                </p>
              </div>
            )}
          </div>
        )}

        {/* Population Override for simple_random method */}
        {method === "simple_random" && (
          <div className="space-y-1.5">
            <Label htmlFor="populationOverride">Population Size Override (Optional)</Label>
            <Input
              id="populationOverride"
              type="number"
              min={1}
              value={populationOverride}
              onChange={(e) => setPopulationOverride(e.target.value)}
              placeholder={`Actual: ${populationSize.toLocaleString()}`}
            />
            <p className="text-xs text-gray-600 dark:text-gray-300">
              Test sample calculations with different population assumptions
            </p>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {method === "systematic" && (
            <div className="space-y-1.5">
              <Label htmlFor="systematicStep">Systematic Step (Interval)</Label>
              <Input
                id="systematicStep"
                type="number"
                min={1}
                value={systematicStep}
                onChange={(e) => setSystematicStep(e.target.value)}
                placeholder="Leave empty to calculate automatically"
              />
              <p className="text-xs text-gray-600 dark:text-gray-300">
                Explicit interval for systematic sampling
              </p>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="seed">Random Seed</Label>
            <Input
              id="seed"
              type="number"
              value={seed}
              onChange={(e) => setSeed(parseInt(e.target.value) || 42)}
            />
            <p className="text-xs text-gray-600 dark:text-gray-300">
              Ensures reproducible sampling results (Mulberry32 PRNG)
            </p>
          </div>
        </div>

        {/* Override Justification - Required when overrides are active */}
        {configHasOverrides && (
          <div className="space-y-2 p-4 border border-crowe-amber/30 bg-crowe-amber/10 rounded-lg">
            <div className="flex items-center gap-2 text-crowe-amber-bright">
              <AlertTriangle className="h-4 w-4" />
              <Label htmlFor="overrideJustification" className="font-medium">
                Override Justification (Required)
              </Label>
            </div>
            <Textarea
              id="overrideJustification"
              value={overrideJustification}
              onChange={(e) => setOverrideJustification(e.target.value)}
              placeholder="Provide justification for using overrides..."
              className="min-h-[80px]"
            />
            <p className="text-xs text-crowe-amber">
              Overrides detected. A justification is required for audit documentation.
            </p>
          </div>
        )}

        {/* Stratification */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Stratification Fields
          </Label>
          <Select onValueChange={addStratifyField}>
            <SelectTrigger>
              <SelectValue placeholder="Add stratification field..." />
            </SelectTrigger>
            <SelectContent>
              {columns
                .filter((c) => !stratifyFields.includes(c))
                .map((col) => (
                  <SelectItem key={col} value={col}>
                    {col}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          {stratifyFields.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {stratifyFields.map((field) => (
                <Badge key={field} variant="secondary" className="flex items-center gap-1">
                  {field}
                  <button
                    type="button"
                    onClick={() => removeStratifyField(field)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-600 dark:text-gray-300">
            Stratification ensures proportional representation across categories
          </p>
        </div>

        {/* ID Column */}
        <div className="space-y-1.5">
          <Label>ID Column (for tracking)</Label>
          <Select value={idColumn || "none"} onValueChange={(v) => setIdColumn(v === "none" ? "" : v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select ID column..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {columns.map((col) => (
                <SelectItem key={col} value={col}>
                  {col}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Estimated Sample Size */}
        <div className="flex items-center justify-between p-4 bg-white/10 rounded-lg">
          <div className="flex items-center gap-3">
            <Calculator className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Estimated Sample Size</p>
              <p className="text-xs text-gray-600 dark:text-gray-300">
                Based on current configuration
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{estimatedSize.toLocaleString()}</p>
            <p className="text-xs text-gray-600 dark:text-gray-300">
              of {populationSize.toLocaleString()} ({((estimatedSize / populationSize) * 100).toFixed(1)}%)
            </p>
          </div>
        </div>

        {/* Compute Plan Button */}
        <Button onClick={computePlan} disabled={isComputing} className="w-full">
          {isComputing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Computing Plan...
            </>
          ) : (
            <>
              <Calculator className="mr-2 h-4 w-4" />
              Compute Sampling Plan
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
