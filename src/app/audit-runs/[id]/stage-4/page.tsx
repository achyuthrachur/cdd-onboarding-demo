"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileSpreadsheet,
  Database,
  Users,
  ListChecks,
  Play,
  Loader2,
  Sparkles,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import {
  loadFallbackDataForStage,
  getStageData,
  hasStageData,
  setStageData,
} from "@/lib/stage-data";
import type {
  AuditorWorkbook,
  ExtractedAttribute,
  SamplingResult,
} from "@/lib/stage-data/store";
import type { Auditor, AcceptableDoc } from "@/lib/attribute-library/types";
import { mockAuditors } from "@/lib/attribute-library/mock-data";
import { AuditorSelector } from "@/components/stage-4/auditor-selector";
import { AuditorWorkbookView } from "@/components/stage-4/auditor-workbook-view";
import { generateAuditorWorkbooks, getAssignmentSummary } from "@/lib/workbook/auditor-assignment";
import { populateAllWorkbooksWithDemoData, getPopulationSummary, DEFAULT_POPULATION_CONFIG } from "@/lib/workbook/demo-data-populator";

type WorkflowStep = "load" | "auditors" | "generate" | "view";

export default function Stage4Page() {
  const params = useParams();
  const id = params.id as string;

  const [currentStep, setCurrentStep] = useState<WorkflowStep>("load");
  const [samplingResult, setSamplingResult] = useState<SamplingResult | null>(null);
  const [extractedAttributes, setExtractedAttributes] = useState<ExtractedAttribute[]>([]);
  const [acceptableDocs, setAcceptableDocs] = useState<AcceptableDoc[]>([]);
  const [availableAuditors, setAvailableAuditors] = useState<Auditor[]>([]);
  const [selectedAuditors, setSelectedAuditors] = useState<Auditor[]>([]);
  const [auditorWorkbooks, setAuditorWorkbooks] = useState<AuditorWorkbook[]>([]);
  const [activeAuditorId, setActiveAuditorId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPopulating, setIsPopulating] = useState(false);

  // Load prerequisite data on mount
  useEffect(() => {
    // Load sampling result
    const storedSampling = getStageData("samplingResult");
    if (storedSampling) {
      setSamplingResult(storedSampling);
    }

    // Load extracted attributes
    const storedAttributes = getStageData("extractedAttributes");
    if (storedAttributes) {
      setExtractedAttributes(storedAttributes);
    }

    // Load acceptable docs
    const storedDocs = getStageData("acceptableDocs");
    if (storedDocs) {
      setAcceptableDocs(storedDocs);
    }

    // Load existing auditor workbooks
    const storedWorkbooks = getStageData("auditorWorkbooks");
    if (storedWorkbooks && storedWorkbooks.length > 0) {
      setAuditorWorkbooks(storedWorkbooks);
      setCurrentStep("view");
      setActiveAuditorId(storedWorkbooks[0].auditorId);
    }

    // Load selected auditors
    const storedAuditors = getStageData("selectedAuditors");
    if (storedAuditors) {
      setSelectedAuditors(storedAuditors);
    }

    // Initialize available auditors from mock data
    setAvailableAuditors(mockAuditors);
  }, []);

  // Derived state
  const samples = useMemo(() => {
    return samplingResult?.sample || [];
  }, [samplingResult]);

  const hasPrerequisites = samples.length > 0 && extractedAttributes.length > 0;

  const handleLoadDemoData = () => {
    // Load Stage 2 data
    loadFallbackDataForStage(2);
    const newSampling = getStageData("samplingResult");
    if (newSampling) {
      setSamplingResult(newSampling);
    }

    // Load Stage 3 data
    loadFallbackDataForStage(3);
    const newAttributes = getStageData("extractedAttributes");
    if (newAttributes) {
      setExtractedAttributes(newAttributes);
    }
    const newDocs = getStageData("acceptableDocs");
    if (newDocs) {
      setAcceptableDocs(newDocs);
    }

    toast.success("Demo data loaded for Stage 4");
  };

  const handleGenerateWorkbooks = async () => {
    if (selectedAuditors.length === 0) {
      toast.error("Please select at least one auditor");
      return;
    }

    setIsGenerating(true);

    try {
      // Simulate processing delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Generate workbooks
      const workbooks = generateAuditorWorkbooks(
        samples,
        extractedAttributes,
        selectedAuditors,
        { strategy: "round-robin" }
      );

      // Store in state and persist
      setAuditorWorkbooks(workbooks);
      setStageData("auditorWorkbooks", workbooks);
      setStageData("selectedAuditors", selectedAuditors);
      setStageData("workbookGenerationComplete", true);

      // Move to view step
      setCurrentStep("view");
      setActiveAuditorId(workbooks[0]?.auditorId || null);

      const summary = getAssignmentSummary(workbooks);
      toast.success(
        `Generated ${workbooks.length} workbooks with ${summary.totalRows} total test rows`
      );
    } catch (error) {
      console.error("Workbook generation failed:", error);
      toast.error("Failed to generate workbooks");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePopulateDemoData = async () => {
    if (auditorWorkbooks.length === 0) return;

    setIsPopulating(true);

    try {
      // Simulate processing delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Populate with demo data
      const populatedWorkbooks = populateAllWorkbooksWithDemoData(
        auditorWorkbooks,
        DEFAULT_POPULATION_CONFIG
      );

      // Update state and persist
      setAuditorWorkbooks(populatedWorkbooks);
      setStageData("auditorWorkbooks", populatedWorkbooks);

      const summary = getPopulationSummary(populatedWorkbooks);
      toast.success(
        `Populated ${summary.completed} test results with ${(summary.passRate * 100).toFixed(0)}% pass rate`
      );
    } catch (error) {
      console.error("Population failed:", error);
      toast.error("Failed to populate demo data");
    } finally {
      setIsPopulating(false);
    }
  };

  const handleExportWorkbook = (auditorId: string) => {
    const workbook = auditorWorkbooks.find((wb) => wb.auditorId === auditorId);
    if (!workbook) return;

    // Create CSV export
    const headers = [
      "Case_ID",
      "Legal_Name",
      "Jurisdiction",
      "Attribute_ID",
      "Attribute_Name",
      "Category",
      "Question_Text",
      "Result",
      "Acceptable_Doc_Used",
      "Observation",
      "Evidence_Reference",
      "Auditor_Notes",
    ];

    const rows = workbook.rows.map((row) => [
      row.caseId,
      row.legalName,
      row.jurisdiction,
      row.attributeId,
      row.attributeName,
      row.attributeCategory,
      row.questionText,
      row.result,
      row.acceptableDocUsed,
      row.observation,
      row.evidenceReference,
      row.auditorNotes,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((r) =>
        r
          .map((cell) =>
            typeof cell === "string" && (cell.includes(",") || cell.includes('"'))
              ? `"${cell.replace(/"/g, '""')}"`
              : cell
          )
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `workbook_${workbook.auditorName.replace(/\s+/g, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success(`Exported workbook for ${workbook.auditorName}`);
  };

  const handleClearWorkbooks = () => {
    setAuditorWorkbooks([]);
    setStageData("auditorWorkbooks", undefined);
    setStageData("workbookGenerationComplete", false);
    setCurrentStep("auditors");
    setActiveAuditorId(null);
    toast.success("Workbooks cleared");
  };

  // Determine if can proceed to next stage
  const canProceed = auditorWorkbooks.length > 0 &&
    auditorWorkbooks.some((wb) => wb.summary.completedRows > 0);

  // Calculate step completion
  const stepComplete = {
    load: hasPrerequisites,
    auditors: selectedAuditors.length > 0,
    generate: auditorWorkbooks.length > 0,
    view: auditorWorkbooks.some((wb) => wb.summary.completedRows > 0),
  };

  return (
    <div className="p-8 h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="mb-6 flex-shrink-0">
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
              <Badge className="bg-purple-100 text-purple-700">Stage 4</Badge>
              <h1 className="text-3xl font-bold tracking-tight">
                Auditor Workbook Generation
              </h1>
            </div>
            <p className="text-muted-foreground mt-2">
              Assign samples to auditors and generate per-auditor testing workbooks
            </p>
          </div>
          <Button variant="outline" onClick={handleLoadDemoData}>
            <Database className="h-4 w-4 mr-2" />
            Load Demo Data
          </Button>
        </div>
      </div>

      {/* Workflow Steps */}
      <div className="grid gap-4 md:grid-cols-4 mb-6 flex-shrink-0">
        <Card className={stepComplete.load ? "border-green-500" : ""}>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  stepComplete.load
                    ? "bg-green-100 text-green-600"
                    : "bg-blue-100 text-blue-600"
                }`}
              >
                {stepComplete.load ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <Database className="h-5 w-5" />
                )}
              </div>
              <div>
                <CardTitle className="text-base">Step 1: Load Data</CardTitle>
                <CardDescription>Sample & Attributes</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Badge variant={stepComplete.load ? "default" : "outline"}>
              {samples.length} samples, {extractedAttributes.length} attrs
            </Badge>
          </CardContent>
        </Card>

        <Card className={stepComplete.auditors ? "border-green-500" : ""}>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  stepComplete.auditors
                    ? "bg-green-100 text-green-600"
                    : "bg-purple-100 text-purple-600"
                }`}
              >
                {stepComplete.auditors ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <Users className="h-5 w-5" />
                )}
              </div>
              <div>
                <CardTitle className="text-base">Step 2: Auditors</CardTitle>
                <CardDescription>Select team</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Badge variant={stepComplete.auditors ? "default" : "outline"}>
              {selectedAuditors.length} selected
            </Badge>
          </CardContent>
        </Card>

        <Card className={stepComplete.generate ? "border-green-500" : ""}>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  stepComplete.generate
                    ? "bg-green-100 text-green-600"
                    : "bg-amber-100 text-amber-600"
                }`}
              >
                {stepComplete.generate ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <FileSpreadsheet className="h-5 w-5" />
                )}
              </div>
              <div>
                <CardTitle className="text-base">Step 3: Generate</CardTitle>
                <CardDescription>Create workbooks</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Badge variant={stepComplete.generate ? "default" : "outline"}>
              {auditorWorkbooks.length} workbooks
            </Badge>
          </CardContent>
        </Card>

        <Card className={stepComplete.view ? "border-green-500" : ""}>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  stepComplete.view
                    ? "bg-green-100 text-green-600"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {stepComplete.view ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <ListChecks className="h-5 w-5" />
                )}
              </div>
              <div>
                <CardTitle className="text-base">Step 4: Populate</CardTitle>
                <CardDescription>Fill demo data</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Badge variant={stepComplete.view ? "default" : "outline"}>
              {stepComplete.view ? "Ready" : "Pending"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <Tabs
        value={currentStep}
        onValueChange={(v) => setCurrentStep(v as WorkflowStep)}
        className="flex-1 flex flex-col min-h-0"
      >
        <TabsList className="flex-shrink-0 mb-4">
          <TabsTrigger value="load" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Data
          </TabsTrigger>
          <TabsTrigger
            value="auditors"
            className="flex items-center gap-2"
            disabled={!stepComplete.load}
          >
            <Users className="h-4 w-4" />
            Auditors
          </TabsTrigger>
          <TabsTrigger
            value="generate"
            className="flex items-center gap-2"
            disabled={!stepComplete.auditors}
          >
            <FileSpreadsheet className="h-4 w-4" />
            Generate
          </TabsTrigger>
          <TabsTrigger
            value="view"
            className="flex items-center gap-2"
            disabled={!stepComplete.generate}
          >
            <ListChecks className="h-4 w-4" />
            View Workbooks
            {auditorWorkbooks.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {auditorWorkbooks.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Load Data Tab */}
        <TabsContent value="load" className="flex-1 min-h-0 mt-0">
          <div className="grid gap-6 md:grid-cols-2 h-full">
            {/* Sampling Data */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sampling Data (Stage 2)</CardTitle>
                <CardDescription>
                  Sample records from the locked sampling plan
                </CardDescription>
              </CardHeader>
              <CardContent>
                {samples.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Total Samples:</span>
                      <Badge variant="default">{samples.length}</Badge>
                    </div>
                    {samplingResult?.config && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Sample Method:</span>
                          <span className="capitalize">{samplingResult.config.method}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Confidence Level:</span>
                          <span>{Math.round((samplingResult.config.confidence || 0.95) * 100)}%</span>
                        </div>
                      </>
                    )}
                    <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mb-2" />
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Sampling data loaded and ready
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Database className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>No sampling data available</p>
                    <p className="text-sm">Complete Stage 2 or load demo data</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Attributes Data */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Attributes (Stage 3)</CardTitle>
                <CardDescription>
                  CIP/CDD/EDD testing attributes from FLU procedures
                </CardDescription>
              </CardHeader>
              <CardContent>
                {extractedAttributes.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Total Attributes:</span>
                      <Badge variant="default">{extractedAttributes.length}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Acceptable Docs:</span>
                      <Badge variant="secondary">{acceptableDocs.length}</Badge>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="outline">
                        CIP: {extractedAttributes.filter((a) => a.Category === "CIP").length}
                      </Badge>
                      <Badge variant="outline">
                        CDD: {extractedAttributes.filter((a) => a.Category === "CDD").length}
                      </Badge>
                      <Badge variant="outline">
                        EDD: {extractedAttributes.filter((a) => a.Category === "EDD").length}
                      </Badge>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mb-2" />
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Attributes loaded and ready
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileSpreadsheet className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>No attributes available</p>
                    <p className="text-sm">Complete Stage 3 or load demo data</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {hasPrerequisites && (
            <div className="mt-4 flex justify-end">
              <Button onClick={() => setCurrentStep("auditors")}>
                Continue to Auditor Selection
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Auditors Tab */}
        <TabsContent value="auditors" className="flex-1 min-h-0 mt-0">
          <AuditorSelector
            availableAuditors={availableAuditors}
            selectedAuditors={selectedAuditors}
            onSelectionChange={setSelectedAuditors}
            sampleCount={samples.length}
          />

          {selectedAuditors.length > 0 && (
            <div className="mt-4 flex justify-end">
              <Button onClick={() => setCurrentStep("generate")}>
                Continue to Generation
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Generate Tab */}
        <TabsContent value="generate" className="flex-1 min-h-0 mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Generate Auditor Workbooks</CardTitle>
              <CardDescription>
                Create testing workbooks for each selected auditor
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-muted rounded-lg text-center">
                  <div className="text-2xl font-bold">{samples.length}</div>
                  <div className="text-sm text-muted-foreground">Samples</div>
                </div>
                <div className="p-4 bg-muted rounded-lg text-center">
                  <div className="text-2xl font-bold">{selectedAuditors.length}</div>
                  <div className="text-sm text-muted-foreground">Auditors</div>
                </div>
                <div className="p-4 bg-muted rounded-lg text-center">
                  <div className="text-2xl font-bold">{extractedAttributes.length}</div>
                  <div className="text-sm text-muted-foreground">Attributes</div>
                </div>
              </div>

              {/* Estimated Output */}
              <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h4 className="font-medium mb-2">Estimated Output</h4>
                <div className="text-sm space-y-1">
                  <p>
                    <span className="text-muted-foreground">Samples per auditor: </span>
                    {Math.floor(samples.length / selectedAuditors.length)} (round-robin)
                  </p>
                  <p>
                    <span className="text-muted-foreground">Rows per workbook: </span>
                    ~{Math.floor(samples.length / selectedAuditors.length) * extractedAttributes.length}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Total test rows: </span>
                    {samples.length * extractedAttributes.length}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={handleGenerateWorkbooks}
                  disabled={isGenerating || auditorWorkbooks.length > 0}
                  className="flex-1"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : auditorWorkbooks.length > 0 ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Workbooks Generated
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Generate Workbooks
                    </>
                  )}
                </Button>
                {auditorWorkbooks.length > 0 && (
                  <Button variant="outline" onClick={handleClearWorkbooks}>
                    Clear & Regenerate
                  </Button>
                )}
              </div>

              {auditorWorkbooks.length > 0 && (
                <div className="flex justify-end">
                  <Button onClick={() => setCurrentStep("view")}>
                    View Workbooks
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* View Workbooks Tab */}
        <TabsContent value="view" className="flex-1 min-h-0 mt-0 flex flex-col">
          {/* Populate Button */}
          <div className="mb-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {auditorWorkbooks.reduce((sum, wb) => sum + wb.summary.totalRows, 0)} total rows
              </Badge>
              <Badge variant="outline">
                {auditorWorkbooks.reduce((sum, wb) => sum + wb.summary.completedRows, 0)} completed
              </Badge>
            </div>
            <Button
              onClick={handlePopulateDemoData}
              disabled={isPopulating}
              variant={auditorWorkbooks.some((wb) => wb.summary.completedRows > 0) ? "outline" : "default"}
            >
              {isPopulating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Populating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Populate Demo Data
                </>
              )}
            </Button>
          </div>

          {/* Workbook View */}
          <div className="flex-1 min-h-0">
            <AuditorWorkbookView
              workbooks={auditorWorkbooks}
              activeAuditorId={activeAuditorId}
              onAuditorChange={setActiveAuditorId}
              onExport={handleExportWorkbook}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Navigation */}
      <div className="flex justify-between pt-4 flex-shrink-0 border-t mt-4">
        <Link href={`/audit-runs/${id}/stage-3`}>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Stage 3
          </Button>
        </Link>
        <Link href={`/audit-runs/${id}/stage-5`}>
          <Button disabled={!canProceed}>
            Continue to Testing
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
