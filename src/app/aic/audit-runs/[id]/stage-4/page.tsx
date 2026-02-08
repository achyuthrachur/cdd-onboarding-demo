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
  Send,
  AlertCircle,
} from "lucide-react";
import {
  motion,
  AnimatePresence,
  staggerContainer,
  staggerItem,
  fadeInUp,
  tabContent,
  useReducedMotion,
} from "@/lib/animations";
import { toast } from "sonner";
import {
  loadFallbackDataForStage,
  getStageData,
  setStageData,
  clearStageOutputs,
} from "@/lib/stage-data";
import type {
  AuditorWorkbook,
  ExtractedAttribute,
  SamplingResult,
  PivotedAuditorWorkbook,
} from "@/lib/stage-data/store";
import type { Auditor, AcceptableDoc } from "@/lib/attribute-library/types";
import { mockAuditors } from "@/lib/attribute-library/mock-data";
import { AuditorSelector } from "@/components/stage-4/auditor-selector";
import { AuditorWorkbookView } from "@/components/stage-4/auditor-workbook-view";
import {
  generateAuditorWorkbooks,
  generatePivotedAuditorWorkbooks,
  getPivotedAssignmentSummary,
} from "@/lib/workbook/auditor-assignment";
import { populateAllWorkbooksWithDemoData, getPopulationSummary, DEFAULT_POPULATION_CONFIG } from "@/lib/workbook/demo-data-populator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type WorkflowStep = "load" | "auditors" | "generate" | "view";

export default function AicStage4Page() {
  const params = useParams();
  const id = params.id as string;

  const [currentStep, setCurrentStep] = useState<WorkflowStep>("load");
  const [samplingResult, setSamplingResult] = useState<SamplingResult | null>(null);
  const [extractedAttributes, setExtractedAttributes] = useState<ExtractedAttribute[]>([]);
  const [acceptableDocs, setAcceptableDocs] = useState<AcceptableDoc[]>([]);
  const [availableAuditors, setAvailableAuditors] = useState<Auditor[]>([]);
  const [selectedAuditors, setSelectedAuditors] = useState<Auditor[]>([]);
  const [auditorWorkbooks, setAuditorWorkbooks] = useState<AuditorWorkbook[]>([]);
  const [pivotedWorkbooks, setPivotedWorkbooks] = useState<PivotedAuditorWorkbook[]>([]);
  const [activeAuditorId, setActiveAuditorId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPopulating, setIsPopulating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);

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

    // Load pivoted workbooks
    const storedPivoted = getStageData("pivotedWorkbooks");
    if (storedPivoted && storedPivoted.length > 0) {
      setPivotedWorkbooks(storedPivoted);
    }

    // Load selected auditors
    const storedAuditors = getStageData("selectedAuditors");
    if (storedAuditors) {
      setSelectedAuditors(storedAuditors);
    }

    // Check if workbooks are published
    const published = getStageData("workbooksPublished");
    if (published) {
      setIsPublished(true);
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

  const handleClearDemoData = () => {
    clearStageOutputs(4);
    setSamplingResult(null);
    setExtractedAttributes([]);
    setAcceptableDocs([]);
    toast.success("Stage 4 demo data cleared");
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

      // Generate workbooks (legacy format for backward compatibility)
      const workbooks = generateAuditorWorkbooks(
        samples,
        extractedAttributes,
        selectedAuditors,
        { strategy: "round-robin" }
      );

      // Generate pivoted workbooks (NEW format: rows=attributes, columns=customers)
      // Includes acceptable docs for each attribute to enable document-based testing dropdown
      const pivoted = generatePivotedAuditorWorkbooks(
        samples,
        extractedAttributes,
        selectedAuditors,
        { strategy: "round-robin" },
        acceptableDocs  // Pass acceptable docs for dropdown options
      );

      // Store in state and persist
      setAuditorWorkbooks(workbooks);
      setPivotedWorkbooks(pivoted);
      setStageData("auditorWorkbooks", workbooks);
      setStageData("pivotedWorkbooks", pivoted);
      setStageData("selectedAuditors", selectedAuditors);
      setStageData("workbookGenerationComplete", true);

      // Move to view step
      setCurrentStep("view");
      setActiveAuditorId(workbooks[0]?.auditorId || null);

      const pivotedSummary = getPivotedAssignmentSummary(pivoted);
      toast.success(
        `Generated ${pivoted.length} workbooks: ${pivotedSummary.totalAttributes} attributes × ${pivotedSummary.totalCustomers} customers`
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

  const handlePublishWorkbooks = async () => {
    setIsPublishing(true);

    if (pivotedWorkbooks.length === 0) {
      toast.error("No workbooks to publish. Generate workbooks first.");
      setIsPublishing(false);
      return;
    }

    try {
      // Simulate API call to publish workbooks
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Re-persist workbooks to guarantee auditor portal has data
      setStageData("pivotedWorkbooks", pivotedWorkbooks);
      setStageData("selectedAuditors", selectedAuditors);

      // In a real implementation, this would call the API to persist to database
      // await publishAllWorkbooksForAuditRun(id, 'AIC');

      // For demo, we just mark them as published in localStorage
      setStageData("workbooksPublished", {
        publishedAt: new Date().toISOString(),
        publishedBy: 'AIC',
        workbookCount: pivotedWorkbooks.length,
        auditorCount: selectedAuditors.length,
      });

      setIsPublished(true);
      setShowPublishDialog(false);

      toast.success(
        `Published ${pivotedWorkbooks.length} workbooks to auditors`,
        {
          description: "Auditors can now access their assigned workbooks",
        }
      );
    } catch (error) {
      console.error("Publish failed:", error);
      toast.error("Failed to publish workbooks");
    } finally {
      setIsPublishing(false);
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
    setPivotedWorkbooks([]);
    setStageData("auditorWorkbooks", undefined);
    setStageData("pivotedWorkbooks", undefined);
    setStageData("workbookGenerationComplete", false);
    setStageData("workbooksPublished", undefined);
    setCurrentStep("auditors");
    setActiveAuditorId(null);
    setIsPublished(false);
    toast.success("Workbooks cleared");
  };

  // Determine if can proceed to next stage
  const canProceed = isPublished;

  // Calculate step completion
  const stepComplete = {
    load: hasPrerequisites,
    auditors: selectedAuditors.length > 0,
    generate: auditorWorkbooks.length > 0,
    view: auditorWorkbooks.some((wb) => wb.summary.completedRows > 0),
  };

  const shouldReduceMotion = useReducedMotion();

  // Step cards data for rendering
  const steps = [
    {
      title: "Step 1: Load Data",
      description: "Sample & Attributes",
      isComplete: stepComplete.load,
      activeColor: "bg-crowe-indigo/20 text-crowe-indigo-bright",
      completeColor: "bg-green-500/20 text-green-400",
      Icon: Database,
      badgeText: `${samples.length} samples, ${extractedAttributes.length} attrs`,
    },
    {
      title: "Step 2: Auditors",
      description: "Select team",
      isComplete: stepComplete.auditors,
      activeColor: "bg-purple-500/20 text-purple-400",
      completeColor: "bg-green-500/20 text-green-400",
      Icon: Users,
      badgeText: `${selectedAuditors.length} selected`,
    },
    {
      title: "Step 3: Generate",
      description: "Create workbooks",
      isComplete: stepComplete.generate,
      activeColor: "bg-amber-500/20 text-amber-400",
      completeColor: "bg-green-500/20 text-green-400",
      Icon: FileSpreadsheet,
      badgeText: `${auditorWorkbooks.length} workbooks`,
    },
    {
      title: "Step 4: Publish",
      description: "Send to auditors",
      isComplete: isPublished,
      activeColor: "bg-crowe-teal/20 text-crowe-teal-bright",
      completeColor: "bg-green-500/20 text-green-400",
      Icon: Send,
      badgeText: isPublished ? "Published" : "Pending",
    },
  ];

  return (
    <div className="p-8 h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <motion.div
        className="mb-6 flex-shrink-0"
        initial={shouldReduceMotion ? undefined : "hidden"}
        animate="visible"
        variants={fadeInUp}
      >
        <Link
          href={`/aic/audit-runs/${id}`}
          className="inline-flex items-center text-sm text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Audit Run
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Badge className="bg-purple-500/20 text-purple-400">Stage 4</Badge>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                Workbook Generation & Publishing
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Generate auditor workbooks and publish to the audit team
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleLoadDemoData} className="border-gray-200 dark:border-white/20 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 hover:border-gray-300 dark:hover:border-white/30">
              <Database className="h-4 w-4 mr-2" />
              Load Demo Data
            </Button>
            {(extractedAttributes.length > 0 || samplingResult) && (
              <Button variant="ghost" size="sm" onClick={handleClearDemoData}>
                Clear Demo Data
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Workflow Steps */}
      <motion.div
        className="grid gap-4 md:grid-cols-4 mb-6 flex-shrink-0"
        initial={shouldReduceMotion ? undefined : "hidden"}
        animate="visible"
        variants={staggerContainer}
      >
        {steps.map((step, index) => (
          <motion.div key={index} variants={staggerItem}>
            <Card className={`bg-white dark:bg-white/10 backdrop-blur-xl border border-gray-200/60 dark:border-white/20 shadow-md dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] ${step.isComplete ? "border-green-500" : ""}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <motion.div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      step.isComplete ? "bg-green-500/20 text-green-400" : step.activeColor
                    }`}
                    animate={step.isComplete ? { scale: [1, 1.1, 1] } : undefined}
                    transition={{ duration: 0.3 }}
                  >
                    {step.isComplete ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <step.Icon className="h-5 w-5" />
                    )}
                  </motion.div>
                  <div>
                    <CardTitle className="text-base text-gray-900 dark:text-white">{step.title}</CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-300">{step.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step.badgeText}
                    initial={shouldReduceMotion ? undefined : { scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Badge variant={step.isComplete ? "default" : "outline"} className={!step.isComplete ? "border-gray-300 dark:border-white/30 text-gray-600 dark:text-gray-300" : ""}>
                      {step.badgeText}
                    </Badge>
                  </motion.div>
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Main Content Area */}
      <Tabs
        value={currentStep}
        onValueChange={(v) => setCurrentStep(v as WorkflowStep)}
        className="flex-1 flex flex-col min-h-0 overflow-y-auto"
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
            View & Publish
            {auditorWorkbooks.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {auditorWorkbooks.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Tab Content with Animations */}
        <AnimatePresence mode="wait">
          {/* Load Data Tab */}
          {currentStep === "load" && (
            <motion.div
              key="load"
              className="flex-1 min-h-0"
              initial={shouldReduceMotion ? undefined : "hidden"}
              animate="visible"
              exit="exit"
              variants={tabContent}
            >
              <TabsContent value="load" className="h-full m-0">
                <motion.div
                  className="grid gap-6 md:grid-cols-2 h-full"
                  initial={shouldReduceMotion ? undefined : "hidden"}
                  animate="visible"
                  variants={staggerContainer}
                >
                  {/* Sampling Data */}
                  <motion.div variants={staggerItem}>
                    <Card className="h-full bg-white dark:bg-white/10 backdrop-blur-xl border border-gray-200/60 dark:border-white/20 shadow-md dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]">
                      <CardHeader>
                        <CardTitle className="text-lg text-gray-900 dark:text-white">Sampling Data (Stage 2)</CardTitle>
                        <CardDescription className="text-gray-600 dark:text-gray-300">
                          Sample records from the locked sampling plan
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {samples.length > 0 ? (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600 dark:text-gray-300">Total Samples:</span>
                              <Badge variant="default">{samples.length}</Badge>
                            </div>
                            {samplingResult?.config && (
                              <>
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-600 dark:text-gray-300">Sample Method:</span>
                                  <span className="capitalize text-gray-900 dark:text-white">{samplingResult.config.method}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-600 dark:text-gray-300">Confidence Level:</span>
                                  <span className="text-gray-900 dark:text-white">{Math.round((samplingResult.config.confidence || 0.95) * 100)}%</span>
                                </div>
                              </>
                            )}
                            <motion.div
                              className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg"
                              initial={shouldReduceMotion ? undefined : { scale: 0.9, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: 0.2 }}
                            >
                              <CheckCircle2 className="h-5 w-5 text-green-400 mb-2" />
                              <p className="text-sm text-green-400">
                                Sampling data loaded and ready
                              </p>
                            </motion.div>
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-600 dark:text-gray-300">
                            <Database className="h-12 w-12 mx-auto mb-3 opacity-30" />
                            <p>No sampling data available</p>
                            <p className="text-sm">Complete Stage 2 or load demo data</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Attributes Data */}
                  <motion.div variants={staggerItem}>
                    <Card className="h-full bg-white dark:bg-white/10 backdrop-blur-xl border border-gray-200/60 dark:border-white/20 shadow-md dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]">
                      <CardHeader>
                        <CardTitle className="text-lg text-gray-900 dark:text-white">Attributes (Stage 3)</CardTitle>
                        <CardDescription className="text-gray-600 dark:text-gray-300">
                          CIP/CDD/EDD testing attributes from FLU procedures
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {extractedAttributes.length > 0 ? (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600 dark:text-gray-300">Total Attributes:</span>
                              <Badge variant="default">{extractedAttributes.length}</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600 dark:text-gray-300">Acceptable Docs:</span>
                              <Badge variant="secondary">{acceptableDocs.length}</Badge>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                              <Badge variant="outline" className="border-gray-300 dark:border-white/30 text-gray-600 dark:text-gray-300">
                                CIP: {extractedAttributes.filter((a) => a.Category === "CIP").length}
                              </Badge>
                              <Badge variant="outline" className="border-gray-300 dark:border-white/30 text-gray-600 dark:text-gray-300">
                                CDD: {extractedAttributes.filter((a) => a.Category === "CDD").length}
                              </Badge>
                              <Badge variant="outline" className="border-gray-300 dark:border-white/30 text-gray-600 dark:text-gray-300">
                                EDD: {extractedAttributes.filter((a) => a.Category === "EDD").length}
                              </Badge>
                            </div>
                            <motion.div
                              className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg"
                              initial={shouldReduceMotion ? undefined : { scale: 0.9, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: 0.3 }}
                            >
                              <CheckCircle2 className="h-5 w-5 text-green-400 mb-2" />
                              <p className="text-sm text-green-400">
                                Attributes loaded and ready
                              </p>
                            </motion.div>
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-600 dark:text-gray-300">
                            <FileSpreadsheet className="h-12 w-12 mx-auto mb-3 opacity-30" />
                            <p>No attributes available</p>
                            <p className="text-sm">Complete Stage 3 or load demo data</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                </motion.div>
              </TabsContent>
            </motion.div>
          )}

          {/* Auditors Tab */}
          {currentStep === "auditors" && (
            <motion.div
              key="auditors"
              className="flex-1 min-h-0"
              initial={shouldReduceMotion ? undefined : "hidden"}
              animate="visible"
              exit="exit"
              variants={tabContent}
            >
              <TabsContent value="auditors" className="h-full m-0">
                <AuditorSelector
                  availableAuditors={availableAuditors}
                  selectedAuditors={selectedAuditors}
                  onSelectionChange={setSelectedAuditors}
                  sampleCount={samples.length}
                />
              </TabsContent>
            </motion.div>
          )}

          {/* Generate Tab */}
          {currentStep === "generate" && (
            <motion.div
              key="generate"
              className="flex-1 min-h-0"
              initial={shouldReduceMotion ? undefined : "hidden"}
              animate="visible"
              exit="exit"
              variants={tabContent}
            >
              <TabsContent value="generate" className="h-full m-0">
                <Card className="bg-white dark:bg-white/10 backdrop-blur-xl border border-gray-200/60 dark:border-white/20 shadow-md dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]">
                  <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-white">Generate Auditor Workbooks</CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-300">
                      Create testing workbooks for each selected auditor
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Summary */}
                    <motion.div
                      className="grid grid-cols-3 gap-4"
                      initial={shouldReduceMotion ? undefined : "hidden"}
                      animate="visible"
                      variants={staggerContainer}
                    >
                      <motion.div variants={staggerItem} className="p-4 bg-gray-50 dark:bg-white/5 rounded-lg text-center border border-gray-200 dark:border-white/10">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{samples.length}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">Samples</div>
                      </motion.div>
                      <motion.div variants={staggerItem} className="p-4 bg-gray-50 dark:bg-white/5 rounded-lg text-center border border-gray-200 dark:border-white/10">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{selectedAuditors.length}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">Auditors</div>
                      </motion.div>
                      <motion.div variants={staggerItem} className="p-4 bg-gray-50 dark:bg-white/5 rounded-lg text-center border border-gray-200 dark:border-white/10">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{extractedAttributes.length}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">Attributes</div>
                      </motion.div>
                    </motion.div>

                    {/* Estimated Output */}
                    <motion.div
                      className="p-4 bg-crowe-indigo-bright/10 border border-crowe-indigo-bright/30 rounded-lg"
                      initial={shouldReduceMotion ? undefined : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <h4 className="font-medium mb-2 text-gray-900 dark:text-white">Estimated Output</h4>
                      <div className="text-sm space-y-1">
                        <p className="text-gray-900 dark:text-white">
                          <span className="text-gray-600 dark:text-gray-300">Samples per auditor: </span>
                          {Math.floor(samples.length / selectedAuditors.length)} (round-robin)
                        </p>
                        <p className="text-gray-900 dark:text-white">
                          <span className="text-gray-600 dark:text-gray-300">Rows per workbook: </span>
                          ~{Math.floor(samples.length / selectedAuditors.length) * extractedAttributes.length}
                        </p>
                        <p className="text-gray-900 dark:text-white">
                          <span className="text-gray-600 dark:text-gray-300">Total test rows: </span>
                          {samples.length * extractedAttributes.length}
                        </p>
                      </div>
                    </motion.div>

                    {/* Actions */}
                    <motion.div
                      className="flex gap-3"
                      initial={shouldReduceMotion ? undefined : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
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
                        <Button variant="outline" onClick={handleClearWorkbooks} className="border-gray-200 dark:border-white/20 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 hover:border-gray-300 dark:hover:border-white/30">
                          Clear & Regenerate
                        </Button>
                      )}
                    </motion.div>
                  </CardContent>
                </Card>
              </TabsContent>
            </motion.div>
          )}

          {/* View & Publish Tab */}
          {currentStep === "view" && (
            <motion.div
              key="view"
              className="flex-1 min-h-0 flex flex-col"
              initial={shouldReduceMotion ? undefined : "hidden"}
              animate="visible"
              exit="exit"
              variants={tabContent}
            >
              <TabsContent value="view" className="h-full m-0 flex flex-col">
                {/* Action Bar */}
                <motion.div
                  className="mb-4 flex items-center justify-between flex-shrink-0"
                  initial={shouldReduceMotion ? undefined : { opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-gray-300 dark:border-white/30 text-gray-600 dark:text-gray-300">
                      {auditorWorkbooks.reduce((sum, wb) => sum + wb.summary.totalRows, 0)} total rows
                    </Badge>
                    <Badge variant="outline" className="border-gray-300 dark:border-white/30 text-gray-600 dark:text-gray-300">
                      {auditorWorkbooks.reduce((sum, wb) => sum + wb.summary.completedRows, 0)} completed
                    </Badge>
                    {isPublished && (
                      <Badge className="bg-crowe-teal/15 text-crowe-teal-dark">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Published
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handlePopulateDemoData}
                      disabled={isPopulating || isPublished}
                      variant="outline"
                      size="sm"
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
                    <Button
                      onClick={() => setShowPublishDialog(true)}
                      disabled={isPublished || auditorWorkbooks.length === 0}
                      className="bg-crowe-teal hover:bg-crowe-teal-dark"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Publish to Auditors
                    </Button>
                  </div>
                </motion.div>

                {/* Published Banner */}
                {isPublished && (
                  <motion.div
                    className="mb-4 p-4 bg-crowe-teal/10 border border-crowe-teal/30 rounded-lg"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-crowe-teal" />
                      <div>
                        <p className="font-medium text-crowe-teal">
                          Workbooks Published Successfully
                        </p>
                        <p className="text-sm text-crowe-teal/80">
                          {pivotedWorkbooks.length} workbooks are now available to auditors.
                          You can monitor their progress on the Live Monitoring page.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

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
            </motion.div>
          )}
        </AnimatePresence>
      </Tabs>

      {/* Navigation */}
      <motion.div
        className="flex justify-between pt-4 flex-shrink-0 border-t border-gray-200 dark:border-white/10 mt-4 relative z-50 bg-white dark:bg-[#011E41]"
        initial={shouldReduceMotion ? undefined : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Link href={`/aic/audit-runs/${id}/stage-3`}>
          <Button variant="outline" className="border-gray-200 dark:border-white/20 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 hover:border-gray-300 dark:hover:border-white/30">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Stage 3
          </Button>
        </Link>

        {/* Context-aware forward navigation */}
        {currentStep === "load" && (
          <Button
            onClick={() => setCurrentStep("auditors")}
            disabled={!hasPrerequisites}
          >
            Continue to Auditor Selection
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
        {currentStep === "auditors" && (
          <Button
            onClick={() => setCurrentStep("generate")}
            disabled={selectedAuditors.length === 0}
          >
            Continue to Generation
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
        {currentStep === "generate" && (
          <Button
            onClick={() => setCurrentStep("view")}
            disabled={auditorWorkbooks.length === 0}
          >
            View Workbooks
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
        {currentStep === "view" && (
          canProceed ? (
            <Button asChild>
              <Link href={`/aic/audit-runs/${id}/monitor`}>
                Continue to Live Monitoring
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button disabled className="opacity-50 cursor-not-allowed">
              Continue to Live Monitoring
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )
        )}
      </motion.div>

      {/* Publish Confirmation Dialog */}
      <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">Publish Workbooks to Auditors</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-300">
              This will make workbooks available to the assigned auditors.
              They will be able to view and complete their assigned testing.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg">
                <span className="text-sm text-gray-900 dark:text-white">Workbooks to publish:</span>
                <Badge>{pivotedWorkbooks.length}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg">
                <span className="text-sm text-gray-900 dark:text-white">Auditors receiving workbooks:</span>
                <Badge>{selectedAuditors.length}</Badge>
              </div>
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-400 mt-0.5" />
                  <p className="text-sm text-amber-400">
                    Once published, workbooks cannot be regenerated without clearing
                    auditor progress. Make sure all settings are correct.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPublishDialog(false)} className="border-gray-200 dark:border-white/20 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 hover:border-gray-300 dark:hover:border-white/30">
              Cancel
            </Button>
            <Button
              onClick={handlePublishWorkbooks}
              disabled={isPublishing}
              className="bg-crowe-teal hover:bg-crowe-teal-dark"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Publish Workbooks
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
