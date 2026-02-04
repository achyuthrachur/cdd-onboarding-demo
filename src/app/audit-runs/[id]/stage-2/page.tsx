"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ArrowRight,
  Upload,
  Settings,
  Lock,
  CheckCircle2,
} from "lucide-react";
import { PopulationUploader } from "@/components/stage-2/population-uploader";
import { SamplingConfig } from "@/components/stage-2/sampling-config";
import { SamplePreview } from "@/components/stage-2/sample-preview";
import {
  SamplingConfig as SamplingConfigType,
  SamplingPlan,
  SamplingSummary,
} from "@/lib/sampling/original-engine";

interface PopulationData {
  id: string;
  fileName: string;
  columns: string[];
  rowCount: number;
  uploadedAt: string;
}

export default function Stage2Page() {
  const params = useParams();
  const id = params.id as string;

  const [population, setPopulation] = useState<PopulationData | null>(null);
  const [plan, setPlan] = useState<SamplingPlan | null>(null);
  const [config, setConfig] = useState<SamplingConfigType | null>(null);
  const [sample, setSample] = useState<Record<string, unknown>[] | null>(null);
  const [summary, setSummary] = useState<SamplingSummary | null>(null);
  const [sampleId, setSampleId] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  // Load existing population data on mount
  useEffect(() => {
    const loadExistingData = async () => {
      try {
        const response = await fetch(`/api/sampling?auditRunId=${id}&type=population`);
        if (response.ok) {
          const populations = await response.json();
          if (populations.length > 0) {
            setPopulation(populations[0]);
          }
        }

        // Also check for existing samples
        const sampleResponse = await fetch(`/api/sampling?auditRunId=${id}&type=sample`);
        if (sampleResponse.ok) {
          const samples = await sampleResponse.json();
          if (samples.length > 0) {
            const latestSample = samples[samples.length - 1];
            setSampleId(latestSample.id);
            setSample(latestSample.sample);
            setSummary(latestSample.summary);
            setPlan(latestSample.plan);
            setConfig(latestSample.config);
            setIsLocked(!!latestSample.lockedAt);
          }
        }
      } catch (error) {
        console.error("Failed to load existing data:", error);
      }
    };

    loadExistingData();
  }, [id]);

  const handlePopulationLoaded = (data: PopulationData) => {
    setPopulation(data);
    // Clear existing sample data when new population is loaded
    setPlan(null);
    setConfig(null);
    setSample(null);
    setSummary(null);
    setSampleId(null);
    setIsLocked(false);
  };

  const handlePopulationCleared = () => {
    setPopulation(null);
    setPlan(null);
    setConfig(null);
    setSample(null);
    setSummary(null);
    setSampleId(null);
    setIsLocked(false);
  };

  const handlePlanComputed = (newPlan: SamplingPlan, newConfig: SamplingConfigType) => {
    setPlan(newPlan);
    setConfig(newConfig);
    // Clear sample when plan changes
    setSample(null);
    setSummary(null);
    setSampleId(null);
    setIsLocked(false);
  };

  const handleSampleGenerated = (
    newSample: Record<string, unknown>[],
    newSummary: SamplingSummary,
    newSampleId: string
  ) => {
    setSample(newSample);
    setSummary(newSummary);
    setSampleId(newSampleId);
    setIsLocked(false);
  };

  const handleSampleLocked = () => {
    setIsLocked(true);
  };

  const handlePlanUpdated = (updatedPlan: SamplingPlan) => {
    setPlan(updatedPlan);
    // Clear sample when plan changes
    setSample(null);
    setSummary(null);
    setSampleId(null);
    setIsLocked(false);
  };

  const canProceed = isLocked && sample && sample.length > 0;

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
              <Badge className="bg-green-100 text-green-700">Stage 2</Badge>
              <h1 className="text-3xl font-bold tracking-tight">
                Statistical Sampling
              </h1>
            </div>
            <p className="text-muted-foreground mt-2">
              Upload population data, configure sampling parameters, and generate
              your sample set
            </p>
          </div>
        </div>
      </div>

      {/* Workflow Steps */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card className={population ? "border-green-500" : ""}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  population
                    ? "bg-green-100 text-green-600"
                    : "bg-blue-100 text-blue-600"
                }`}
              >
                {population ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <Upload className="h-5 w-5" />
                )}
              </div>
              <div>
                <CardTitle className="text-base">Step 1</CardTitle>
                <CardDescription>Upload Population</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Upload population file (CSV/Excel) for sampling.
            </p>
            <Badge variant={population ? "default" : "outline"}>
              {population
                ? `${population.rowCount.toLocaleString()} records`
                : "No file uploaded"}
            </Badge>
          </CardContent>
        </Card>

        <Card className={plan ? "border-green-500" : ""}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  plan
                    ? "bg-green-100 text-green-600"
                    : "bg-purple-100 text-purple-600"
                }`}
              >
                {plan ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <Settings className="h-5 w-5" />
                )}
              </div>
              <div>
                <CardTitle className="text-base">Step 2</CardTitle>
                <CardDescription>Configure & Sample</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Set sampling method, confidence level, and generate sample.
            </p>
            <Badge variant={plan ? "default" : "outline"}>
              {sample
                ? `${sample.length.toLocaleString()} sampled`
                : plan
                ? "Plan ready"
                : "Not configured"}
            </Badge>
          </CardContent>
        </Card>

        <Card className={isLocked ? "border-green-500" : ""}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  isLocked
                    ? "bg-green-100 text-green-600"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {isLocked ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <Lock className="h-5 w-5" />
                )}
              </div>
              <div>
                <CardTitle className="text-base">Step 3</CardTitle>
                <CardDescription>Lock Sample</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Review and lock the sample to proceed to workbooks.
            </p>
            <Badge variant={isLocked ? "default" : "outline"}>
              {isLocked ? "Locked" : "Pending"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Population Uploader */}
      <div className="mb-6">
        <PopulationUploader
          auditRunId={id}
          population={population}
          onPopulationLoaded={handlePopulationLoaded}
          onPopulationCleared={handlePopulationCleared}
        />
      </div>

      {/* Sampling Configuration */}
      {population && !isLocked && (
        <div className="mb-6">
          <SamplingConfig
            auditRunId={id}
            populationId={population.id}
            columns={population.columns}
            populationSize={population.rowCount}
            onPlanComputed={handlePlanComputed}
          />
        </div>
      )}

      {/* Sample Preview */}
      {plan && config && (
        <div className="mb-6">
          <SamplePreview
            auditRunId={id}
            populationId={population?.id || ""}
            plan={plan}
            config={config}
            sample={sample}
            summary={summary}
            sampleId={sampleId}
            isLocked={isLocked}
            onSampleGenerated={handleSampleGenerated}
            onSampleLocked={handleSampleLocked}
            onPlanUpdated={handlePlanUpdated}
          />
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Link href={`/audit-runs/${id}/stage-1`}>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Stage 1
          </Button>
        </Link>
        <Link href={`/audit-runs/${id}/stage-3`}>
          <Button disabled={!canProceed}>
            Continue to Workbooks
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
