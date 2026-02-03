"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings2, Calculator, Layers, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SamplingConfig as SamplingConfigType, SamplingPlan, calculateSampleSize } from "@/lib/sampling/engine";

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
  const [method, setMethod] = useState<"statistical" | "random" | "systematic" | "percentage">("statistical");
  const [confidence, setConfidence] = useState(95);
  const [margin, setMargin] = useState(5);
  const [expectedError, setExpectedError] = useState(1);
  const [sampleSizeOverride, setSampleSizeOverride] = useState("");
  const [samplePercentage, setSamplePercentage] = useState("");
  const [seed, setSeed] = useState(42);
  const [stratifyFields, setStratifyFields] = useState<string[]>([]);
  const [idColumn, setIdColumn] = useState("");
  const [isComputing, setIsComputing] = useState(false);

  // Calculate estimated sample size
  const [estimatedSize, setEstimatedSize] = useState(0);

  useEffect(() => {
    if (sampleSizeOverride) {
      setEstimatedSize(parseInt(sampleSizeOverride) || 0);
    } else if (method === "percentage" && samplePercentage) {
      setEstimatedSize(Math.ceil(populationSize * (parseFloat(samplePercentage) / 100)));
    } else {
      const size = calculateSampleSize(
        populationSize,
        confidence / 100,
        margin / 100,
        expectedError / 100
      );
      setEstimatedSize(size);
    }
  }, [populationSize, confidence, margin, expectedError, sampleSizeOverride, method, samplePercentage]);

  const addStratifyField = (field: string) => {
    if (field && !stratifyFields.includes(field)) {
      setStratifyFields([...stratifyFields, field]);
    }
  };

  const removeStratifyField = (field: string) => {
    setStratifyFields(stratifyFields.filter((f) => f !== field));
  };

  const computePlan = async () => {
    setIsComputing(true);
    try {
      const config: SamplingConfigType = {
        method,
        confidence: confidence / 100,
        margin: margin / 100,
        expectedErrorRate: expectedError / 100,
        sampleSize: sampleSizeOverride ? parseInt(sampleSizeOverride) : undefined,
        samplePercentage: samplePercentage ? parseFloat(samplePercentage) : undefined,
        seed,
        stratifyFields,
        idColumn: idColumn || undefined,
        systematicRandomStart: true,
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
        <div className="space-y-2">
          <Label>Sampling Method</Label>
          <Select
            value={method}
            onValueChange={(v) =>
              setMethod(v as "statistical" | "random" | "systematic" | "percentage")
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="statistical">Statistical (Recommended)</SelectItem>
              <SelectItem value="random">Simple Random</SelectItem>
              <SelectItem value="systematic">Systematic</SelectItem>
              <SelectItem value="percentage">Percentage-based</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {method === "statistical" &&
              "Uses confidence level, margin of error, and expected error rate to calculate sample size"}
            {method === "random" &&
              "Randomly selects records from the population"}
            {method === "systematic" &&
              "Selects every Nth record with a random starting point"}
            {method === "percentage" &&
              "Selects a fixed percentage of the population"}
          </p>
        </div>

        {/* Statistical Parameters */}
        {(method === "statistical" || method === "random" || method === "systematic") && (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="confidence">Confidence Level (%)</Label>
              <Input
                id="confidence"
                type="number"
                min={80}
                max={99}
                value={confidence}
                onChange={(e) => setConfidence(parseFloat(e.target.value) || 95)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="margin">Margin of Error (%)</Label>
              <Input
                id="margin"
                type="number"
                min={1}
                max={20}
                step={0.5}
                value={margin}
                onChange={(e) => setMargin(parseFloat(e.target.value) || 5)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expectedError">Expected Error Rate (%)</Label>
              <Input
                id="expectedError"
                type="number"
                min={0}
                max={50}
                step={0.5}
                value={expectedError}
                onChange={(e) => setExpectedError(parseFloat(e.target.value) || 1)}
              />
            </div>
          </div>
        )}

        {/* Percentage Method */}
        {method === "percentage" && (
          <div className="space-y-2">
            <Label htmlFor="samplePercentage">Sample Percentage (%)</Label>
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
          </div>
        )}

        {/* Overrides */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="sampleSizeOverride">Sample Size Override</Label>
            <Input
              id="sampleSizeOverride"
              type="number"
              min={1}
              max={populationSize}
              value={sampleSizeOverride}
              onChange={(e) => setSampleSizeOverride(e.target.value)}
              placeholder="Leave empty to use calculated size"
            />
            <p className="text-xs text-muted-foreground">
              Override the calculated sample size with a specific number
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="seed">Random Seed</Label>
            <Input
              id="seed"
              type="number"
              value={seed}
              onChange={(e) => setSeed(parseInt(e.target.value) || 42)}
            />
            <p className="text-xs text-muted-foreground">
              Ensures reproducible sampling results
            </p>
          </div>
        </div>

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
          <p className="text-xs text-muted-foreground">
            Stratification ensures proportional representation across categories
          </p>
        </div>

        {/* ID Column */}
        <div className="space-y-2">
          <Label>ID Column (for tracking)</Label>
          <Select value={idColumn} onValueChange={setIdColumn}>
            <SelectTrigger>
              <SelectValue placeholder="Select ID column..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              {columns.map((col) => (
                <SelectItem key={col} value={col}>
                  {col}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Estimated Sample Size */}
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-3">
            <Calculator className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Estimated Sample Size</p>
              <p className="text-xs text-muted-foreground">
                Based on current configuration
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{estimatedSize.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">
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
