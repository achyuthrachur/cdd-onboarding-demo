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
  Database,
} from "lucide-react";
import {
  motion,
  ScrollReveal,
  ScrollStagger,
  ScrollStaggerItem,
  useReducedMotion,
} from "@/lib/animations";
import { PopulationUploader } from "@/components/stage-2/population-uploader";
import { SamplingConfig } from "@/components/stage-2/sampling-config";
import { SamplePreview } from "@/components/stage-2/sample-preview";
import {
  SamplingConfig as SamplingConfigType,
  SamplingPlan,
  SamplingSummary,
} from "@/lib/sampling/original-engine";
import { toast } from "sonner";
import {
  loadFallbackDataForStage,
  getStageData,
  setStageData,
  hasStageData,
  clearStageOutputs,
} from "@/lib/stage-data";

interface PopulationData {
  id: string;
  fileName: string;
  columns: string[];
  rowCount: number;
  uploadedAt: string;
}

export default function AicStage2Page() {
  const params = useParams();
  const id = params.id as string;

  const [population, setPopulation] = useState<PopulationData | null>(null);
  const [plan, setPlan] = useState<SamplingPlan | null>(null);
  const [config, setConfig] = useState<SamplingConfigType | null>(null);
  const [sample, setSample] = useState<Record<string, unknown>[] | null>(null);
  const [summary, setSummary] = useState<SamplingSummary | null>(null);
  const [sampleId, setSampleId] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [hasGapData, setHasGapData] = useState(false);

  useEffect(() => {
    setHasGapData(hasStageData('gapAssessment1') || hasStageData('combinedGaps'));

    const storedSamplingResult = getStageData('samplingResult');
    if (storedSamplingResult) {
      setSample(storedSamplingResult.sample);
      setSummary(storedSamplingResult.summary);
      setPlan(storedSamplingResult.plan);
      setConfig(storedSamplingResult.config);
      setIsLocked(storedSamplingResult.isLocked || false);
      setSampleId(storedSamplingResult.sampleId || null);
    }

    const loadExistingData = async () => {
      try {
        const response = await fetch(`/api/sampling?auditRunId=${id}&type=population`);
        if (response.ok) {
          const populations = await response.json();
          if (populations.length > 0) {
            setPopulation(populations[0]);
          }
        }

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
    if (sample && plan && config && summary) {
      setStageData('samplingResult', {
        sample,
        plan,
        config,
        summary,
        sampleId: sampleId || undefined,
        isLocked: true,
      });
    }
  };

  const handleLoadDemoData = () => {
    loadFallbackDataForStage(2);
    const storedSamplingResult = getStageData('samplingResult');
    if (storedSamplingResult) {
      setSample(storedSamplingResult.sample);
      setSummary(storedSamplingResult.summary);
      setPlan(storedSamplingResult.plan);
      setConfig(storedSamplingResult.config);
      setIsLocked(storedSamplingResult.isLocked || false);
      setSampleId(storedSamplingResult.sampleId || null);
      setPopulation({
        id: 'demo-population',
        fileName: 'synthetic_onboarding_data.xlsx',
        columns: ['Entity_ID', 'Entity_Name', 'Country', 'Risk_Rating', 'Onboarding_Date'],
        rowCount: 10000,
        uploadedAt: new Date().toISOString(),
      });
    }
    setHasGapData(true);
    toast.success("Demo data loaded for Stage 2");
  };

  const handleClearDemoData = () => {
    clearStageOutputs(2);
    setSample(null);
    setSummary(null);
    setPlan(null);
    setConfig(null);
    setIsLocked(false);
    setSampleId(null);
    toast.success("Stage 2 demo data cleared");
  };

  const handlePlanUpdated = (updatedPlan: SamplingPlan) => {
    setPlan(updatedPlan);
    setSample(null);
    setSummary(null);
    setSampleId(null);
    setIsLocked(false);
  };

  const canProceed = isLocked && sample && sample.length > 0;
  const shouldReduceMotion = useReducedMotion();

  const steps = [
    {
      title: "Step 1",
      description: "Upload Population",
      isComplete: !!population,
      activeColor: "bg-crowe-blue/20 text-crowe-blue",
      completeColor: "bg-crowe-teal/20 text-crowe-teal",
      Icon: Upload,
      badgeText: population
        ? `${population.rowCount.toLocaleString()} records`
        : "No file uploaded",
      helpText: "Upload population file (CSV/Excel) for sampling.",
    },
    {
      title: "Step 2",
      description: "Configure & Sample",
      isComplete: !!plan,
      activeColor: "bg-crowe-violet/20 text-crowe-violet",
      completeColor: "bg-crowe-teal/20 text-crowe-teal",
      Icon: Settings,
      badgeText: sample
        ? `${sample.length.toLocaleString()} sampled`
        : plan
        ? "Plan ready"
        : "Not configured",
      helpText: "Set sampling method, confidence level, and generate sample.",
    },
    {
      title: "Step 3",
      description: "Lock Sample",
      isComplete: isLocked,
      activeColor: "bg-tint-100 dark:bg-white/10 text-tint-700 dark:text-white/80",
      completeColor: "bg-crowe-teal/20 text-crowe-teal",
      Icon: Lock,
      badgeText: isLocked ? "Locked" : "Pending",
      helpText: "Review and lock the sample to proceed to workbooks.",
    },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <ScrollReveal direction="up" className="mb-8">
        <Link
          href={`/aic/audit-runs/${id}`}
          className="inline-flex items-center text-sm text-tint-500 dark:text-tint-300 hover:text-tint-900 dark:hover:text-white mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Audit Run
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Badge className="bg-crowe-teal/20 text-crowe-teal">Stage 2</Badge>
              <h1 className="text-3xl font-bold tracking-tight text-tint-900 dark:text-white">
                Statistical Sampling
              </h1>
            </div>
            <p className="text-tint-700 dark:text-tint-300 mt-2">
              Upload population data, configure sampling parameters, and generate
              your sample set
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleLoadDemoData} className="border-tint-200 dark:border-white/20 text-tint-900 dark:text-white hover:bg-tint-100 dark:hover:bg-white/10 hover:border-tint-300 dark:hover:border-white/30">
              <Database className="h-4 w-4 mr-2" />
              Load Demo Data
            </Button>
            {sample && (
              <Button variant="ghost" size="sm" onClick={handleClearDemoData}>
                Clear Demo Data
              </Button>
            )}
          </div>
        </div>
      </ScrollReveal>

      {/* Workflow Steps */}
      <ScrollStagger className="grid gap-3 md:grid-cols-3 mb-6">
        {steps.map((step, index) => (
          <ScrollStaggerItem key={index}>
            <Card className={`bg-white dark:bg-white/10 backdrop-blur-xl border border-tint-200/60 dark:border-white/20 shadow-md dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] ${step.isComplete ? "border-crowe-teal" : ""}`}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <motion.div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      step.isComplete ? "bg-crowe-teal/20 text-crowe-teal" : step.activeColor
                    }`}
                  >
                    {step.isComplete ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <step.Icon className="h-5 w-5" />
                    )}
                  </motion.div>
                  <div>
                    <CardTitle className="text-base text-tint-900 dark:text-white">{step.title}</CardTitle>
                    <CardDescription className="text-tint-700 dark:text-tint-300">{step.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-tint-700 dark:text-tint-300 mb-3">
                  {step.helpText}
                </p>
                <Badge variant={step.isComplete ? "default" : "outline"} className={!step.isComplete ? "border-tint-300 dark:border-white/30 text-tint-700 dark:text-tint-300" : ""}>
                  {step.badgeText}
                </Badge>
              </CardContent>
            </Card>
          </ScrollStaggerItem>
        ))}
      </ScrollStagger>

      {/* Population Uploader */}
      <ScrollReveal direction="up" delay={0.1} className="mb-6">
        <PopulationUploader
          auditRunId={id}
          population={population}
          onPopulationLoaded={handlePopulationLoaded}
          onPopulationCleared={handlePopulationCleared}
        />
      </ScrollReveal>

      {/* Sampling Configuration */}
      {population && !isLocked && (
        <ScrollReveal direction="up" delay={0.15} className="mb-6">
            <SamplingConfig
              auditRunId={id}
              populationId={population.id}
              columns={population.columns}
              populationSize={population.rowCount}
              onPlanComputed={handlePlanComputed}
            />
        </ScrollReveal>
      )}

      {/* Sample Preview */}
      {plan && config && (
        <ScrollReveal direction="up" delay={0.1} className="mb-6">
            <SamplePreview
              auditRunId={id}
              populationId={population?.id || ""}
              plan={plan}
              config={config}
              sample={sample}
              summary={summary}
              sampleId={sampleId}
              isLocked={isLocked}
              fileName={population?.fileName}
              onSampleGenerated={handleSampleGenerated}
              onSampleLocked={handleSampleLocked}
              onPlanUpdated={handlePlanUpdated}
            />
        </ScrollReveal>
      )}

      {/* Navigation Footer - Sticky with proper z-index */}
      <footer className="sticky bottom-0 mt-8 pt-4 pb-4 -mx-8 px-8 bg-white/95 dark:bg-crowe-indigo-dark/95 backdrop-blur-sm border-t border-tint-200 dark:border-white/10 z-10">
        <ScrollReveal direction="up" delay={0.15}>
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <Link href={`/aic/audit-runs/${id}/stage-1`}>
            <Button variant="outline" className="border-tint-200 dark:border-white/20 text-tint-900 dark:text-white hover:bg-tint-100 dark:hover:bg-white/10 hover:border-tint-300 dark:hover:border-white/30">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Stage 1
            </Button>
          </Link>
          <Link href={`/aic/audit-runs/${id}/stage-3`}>
            <Button disabled={!canProceed}>
              Continue to Attribute Extraction
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
        </ScrollReveal>
      </footer>
    </div>
  );
}
