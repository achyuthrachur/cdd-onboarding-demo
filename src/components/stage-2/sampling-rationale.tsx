"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Copy, Check, Loader2, AlertCircle, FileText } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { SamplingPlan, SamplingConfig, SamplingSummary } from "@/lib/sampling/original-engine";

interface SamplingRationaleProps {
  plan: SamplingPlan;
  config: SamplingConfig;
  summary: SamplingSummary | null;
  fileName?: string;
  isLocked: boolean;
}

export function SamplingRationale({
  plan,
  config,
  summary,
  fileName,
  isLocked,
}: SamplingRationaleProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [rationale, setRationale] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateRationale = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // Build the config for the API
      const rationaleConfig = {
        populationSize: plan.populationSize || 0,
        fileName: fileName,
        stratification: plan.stratifyFields.length > 0
          ? {
              enabled: true,
              fields: plan.stratifyFields,
              strata: plan.allocations.map((a, idx) => ({
                name: Object.entries(a.stratum).map(([k, v]) => `${k}: ${v ?? 'NULL'}`).join(', ') || `Stratum ${idx + 1}`,
                stratum: a.stratum,
                population: a.population_count,
                sampleSize: a.sample_count,
              })),
            }
          : undefined,
        confidenceLevel: config.confidence,
        marginOfError: config.margin,
        expectedErrorRate: config.expectedErrorRate,
        calculatedSampleSize: plan.desiredSize,
        finalSampleSize: summary?.sample_selection_method?.final_sample_size || plan.plannedSize,
        method: config.method,
        seed: config.seed,
        allocation: plan.stratifyFields.length > 0
          ? "Proportional allocation based on stratum population sizes."
          : "Simple random selection from the entire population.",
        overrides: summary?.overrides?.has_overrides
          ? {
              hasOverrides: true,
              justification: summary.overrides.justification,
              populationOverride: summary.overrides.parameter_overrides?.population_size?.applied
                ? {
                    original: summary.overrides.parameter_overrides.population_size.original || 0,
                    value: summary.overrides.parameter_overrides.population_size.value || 0,
                  }
                : undefined,
              sampleSizeOverride: summary.overrides.parameter_overrides?.sample_size?.applied
                ? {
                    calculated: plan.desiredSize,
                    value: summary.overrides.parameter_overrides.sample_size.value || 0,
                  }
                : undefined,
              coverageOverrides: summary.overrides.coverage_overrides?.map((o) => ({
                stratum: o.stratum,
                added: o.adjusted_to - o.original_sample_count,
              })),
            }
          : undefined,
      };

      const response = await fetch('/api/ai/sampling-rationale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rationaleConfig),
      });

      const result = await response.json();

      if (!result.success && !result.rationale) {
        throw new Error(result.error || 'Failed to generate rationale');
      }

      setRationale(result.rationale);
      setIsDemoMode(result.demoMode || false);

      if (result.demoMode) {
        toast.info("Generated demo rationale (AI not configured)");
      } else {
        toast.success("Sampling rationale generated successfully");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      toast.error(`Failed to generate rationale: ${message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    if (!rationale) return;

    try {
      await navigator.clipboard.writeText(rationale);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  return (
    <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-white">
            <FileText className="h-5 w-5" />
            AI-Generated Sampling Rationale
            {isDemoMode && (
              <Badge variant="outline" className="ml-2 border-crowe-amber/50 text-crowe-amber-bright">
                Demo Mode
              </Badge>
            )}
          </CardTitle>
          <CardDescription className="text-white/60">
            Generate audit documentation for the sampling methodology
          </CardDescription>
        </div>
        <Button
          onClick={handleGenerateRationale}
          disabled={isGenerating || !isLocked}
          className="bg-crowe-violet hover:bg-crowe-violet-dark text-white"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              {rationale ? 'Regenerate' : 'Generate'} Rationale
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {!isLocked && (
          <div className="flex items-center gap-2 p-4 rounded-lg bg-crowe-amber/10 border border-crowe-amber/30 text-crowe-amber-bright">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">
              Lock the sample first to generate the sampling rationale documentation.
            </p>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-4 rounded-lg bg-crowe-coral/10 border border-crowe-coral/30 text-crowe-coral-bright">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {rationale ? (
          <div className="space-y-4">
            <div className="prose prose-invert max-w-none rounded-lg bg-white/5 p-6 border border-white/10">
              <ReactMarkdown
                components={{
                  h2: ({ children }) => (
                    <h2 className="text-xl font-bold text-white mt-6 mb-4 first:mt-0 border-b border-white/20 pb-2">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-lg font-semibold text-white mt-4 mb-2">
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => (
                    <p className="text-white/80 mb-3 leading-relaxed">{children}</p>
                  ),
                  ul: ({ children }) => (
                    <ul className="text-white/80 list-disc list-inside mb-3 space-y-1">
                      {children}
                    </ul>
                  ),
                  li: ({ children }) => (
                    <li className="text-white/80">{children}</li>
                  ),
                  strong: ({ children }) => (
                    <strong className="text-white font-semibold">{children}</strong>
                  ),
                  table: ({ children }) => (
                    <div className="overflow-x-auto my-4">
                      <table className="w-full border-collapse border border-white/20 text-sm">
                        {children}
                      </table>
                    </div>
                  ),
                  thead: ({ children }) => (
                    <thead className="bg-white/10">{children}</thead>
                  ),
                  th: ({ children }) => (
                    <th className="border border-white/20 px-4 py-2 text-left text-white font-semibold">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="border border-white/20 px-4 py-2 text-white/80">
                      {children}
                    </td>
                  ),
                  hr: () => <hr className="border-white/20 my-6" />,
                  em: ({ children }) => (
                    <em className="text-white/60 italic">{children}</em>
                  ),
                }}
              >
                {rationale}
              </ReactMarkdown>
            </div>
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={copyToClipboard}
                className="border-white/20 text-white hover:bg-white/10"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2 text-green-400" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy to Clipboard
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : isLocked && !error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Sparkles className="h-12 w-12 text-white/30 mb-4" />
            <p className="text-white/70 mb-2">
              Click &quot;Generate Rationale&quot; to create audit documentation
            </p>
            <p className="text-sm text-white/30">
              The AI will analyze your sampling configuration and generate a narrative summary
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
