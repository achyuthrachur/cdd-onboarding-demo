"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  FileText,
  Database,
  Bot,
  FileSpreadsheet,
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
  hasStageData,
  setStageData,
} from "@/lib/stage-data";
import type { FLUExtractionResult, ExtractedAttribute, FLUProcedureDocument } from "@/lib/stage-data/store";
import type { AcceptableDoc } from "@/lib/attribute-library/types";
import { FLUProcedureChat } from "@/components/stage-3/flu-procedure-chat";
import { ExtractionResultsView } from "@/components/stage-3/extraction-results-view";
import { getMockFLUExtractionResult } from "@/lib/ai/client";

const DEMO_FLU_DOCUMENT: FLUProcedureDocument = {
  id: "demo-flu-procedures",
  fileName: "FLU_CIP_CDD_Procedures.docx",
  docType: "flu_procedure",
  jurisdiction: "ENT",
  uploadedAt: new Date().toISOString(),
  content: `FRONT LINE UNIT PROCEDURES - CIP/CDD/EDD COMPLIANCE...`,
};

type ViewMode = "chat" | "results";

export default function AicStage3Page() {
  const params = useParams();
  const id = params.id as string;

  const [viewMode, setViewMode] = useState<ViewMode>("chat");
  const [extractionResult, setExtractionResult] = useState<FLUExtractionResult | null>(null);
  const [hasSample, setHasSample] = useState(false);
  const [preloadedDoc, setPreloadedDoc] = useState<FLUProcedureDocument | null>(null);

  useEffect(() => {
    setHasSample(hasStageData('samplingResult'));

    const storedFluProcedures = getStageData('fluProcedures');
    if (storedFluProcedures && storedFluProcedures.length > 0) {
      setPreloadedDoc(storedFluProcedures[0]);
    } else {
      setPreloadedDoc(DEMO_FLU_DOCUMENT);
    }

    const storedResult = getStageData('fluExtractionResult');
    if (storedResult) {
      setExtractionResult(storedResult);
    }

    const storedAttributes = getStageData('extractedAttributes');
    if (storedAttributes && storedAttributes.length > 0 && !storedResult) {
      const acceptableDocs = getStageData('acceptableDocs') || [];
      setExtractionResult({
        workbook: {
          title: "FLU Procedure Attribute Extraction — CIP/CDD/EDD",
          generated_at: new Date().toISOString().split("T")[0],
          sheets: [
            { name: "Attributes", rows: storedAttributes },
            { name: "Acceptable_Docs", rows: acceptableDocs },
          ],
        },
      });
    }
  }, []);

  const handleLoadDemoData = () => {
    const mockResult = getMockFLUExtractionResult();
    const result: FLUExtractionResult = {
      id: `flu-demo-${Date.now()}`,
      workbook: mockResult.workbook as FLUExtractionResult['workbook'],
      tokensUsed: 0,
    };

    setStageData('fluExtractionResult', result);

    const attributesSheet = result.workbook.sheets.find(s => s.name === 'Attributes');
    if (attributesSheet?.rows) {
      const extracted: ExtractedAttribute[] = attributesSheet.rows.map(r => {
        const row = r as unknown as Record<string, unknown>;
        return {
          Source_File: String(row.Source_File || ''),
          Attribute_ID: String(row.Attribute_ID || ''),
          Attribute_Name: String(row.Attribute_Name || ''),
          Category: String(row.Category || ''),
          Source: String(row.Source || ''),
          Source_Page: String(row.Source_Page || ''),
          Question_Text: String(row.Question_Text || ''),
          Notes: String(row.Notes || ''),
          Jurisdiction_ID: String(row.Jurisdiction_ID || 'ENT'),
          RiskScope: (row.RiskScope as 'Base' | 'EDD' | 'Both') || 'Base',
          IsRequired: (row.IsRequired as 'Y' | 'N') || 'Y',
          DocumentationAgeRule: String(row.DocumentationAgeRule || ''),
          Group: String(row.Group || ''),
          extractedFrom: 'flu_procedures' as const,
        };
      });
      setStageData('extractedAttributes', extracted);
    }

    const docsSheet = result.workbook.sheets.find(s => s.name === 'Acceptable_Docs');
    if (docsSheet?.rows) {
      const docs: AcceptableDoc[] = docsSheet.rows.map(r => {
        const row = r as unknown as Record<string, unknown>;
        return {
          Source_File: String(row.Source_File || ''),
          Attribute_ID: String(row.Attribute_ID || ''),
          Document_Name: String(row.Document_Name || ''),
          Evidence_Source_Document: String(row.Evidence_Source_Document || ''),
          Jurisdiction_ID: String(row.Jurisdiction_ID || ''),
          Notes: String(row.Notes || ''),
        };
      });
      setStageData('acceptableDocs', docs);
    }

    setStageData('attributeExtractionComplete', true);
    setExtractionResult(result);
    setHasSample(true);

    if (!hasStageData('samplingResult')) {
      loadFallbackDataForStage(2);
    }

    toast.success("Demo data loaded for Stage 3");
  };

  const handleExtractionComplete = (result: FLUExtractionResult) => {
    setStageData('fluExtractionResult', result);

    const attributesSheet = result.workbook.sheets.find(s => s.name === 'Attributes');
    if (attributesSheet?.rows) {
      const extracted: ExtractedAttribute[] = attributesSheet.rows.map(r => {
        const row = r as unknown as Record<string, unknown>;
        return {
          Source_File: String(row.Source_File || ''),
          Attribute_ID: String(row.Attribute_ID || ''),
          Attribute_Name: String(row.Attribute_Name || ''),
          Category: String(row.Category || ''),
          Source: String(row.Source || ''),
          Source_Page: String(row.Source_Page || ''),
          Question_Text: String(row.Question_Text || ''),
          Notes: String(row.Notes || ''),
          Jurisdiction_ID: String(row.Jurisdiction_ID || 'ENT'),
          RiskScope: (row.RiskScope as 'Base' | 'EDD' | 'Both') || 'Base',
          IsRequired: (row.IsRequired as 'Y' | 'N') || 'Y',
          DocumentationAgeRule: String(row.DocumentationAgeRule || ''),
          Group: String(row.Group || ''),
          extractedFrom: 'flu_procedures' as const,
        };
      });
      setStageData('extractedAttributes', extracted);
    }

    const docsSheet = result.workbook.sheets.find(s => s.name === 'Acceptable_Docs');
    if (docsSheet?.rows) {
      const docs: AcceptableDoc[] = docsSheet.rows.map(r => {
        const row = r as unknown as Record<string, unknown>;
        return {
          Source_File: String(row.Source_File || ''),
          Attribute_ID: String(row.Attribute_ID || ''),
          Document_Name: String(row.Document_Name || ''),
          Evidence_Source_Document: String(row.Evidence_Source_Document || ''),
          Jurisdiction_ID: String(row.Jurisdiction_ID || ''),
          Notes: String(row.Notes || ''),
        };
      });
      setStageData('acceptableDocs', docs);
    }

    setStageData('attributeExtractionComplete', true);
    setExtractionResult(result);
    setViewMode("results");
  };

  const handleExportExcel = () => {
    if (!extractionResult) return;

    toast.success("Exporting to Excel...", {
      description: "Download will start shortly",
    });

    const attributesSheet = extractionResult.workbook.sheets.find(s => s.name === 'Attributes');
    if (attributesSheet?.rows && attributesSheet.rows.length > 0) {
      const headers = Object.keys(attributesSheet.rows[0] as object);
      const csvContent = [
        headers.join(','),
        ...attributesSheet.rows.map(row =>
          headers.map(h => {
            const value = (row as unknown as Record<string, unknown>)[h];
            return typeof value === 'string' && value.includes(',')
              ? `"${value}"`
              : value;
          }).join(',')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'flu_extraction_attributes.csv';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const attributeCount = extractionResult?.workbook.sheets.find(s => s.name === 'Attributes')?.rows.length || 0;
  const docsCount = extractionResult?.workbook.sheets.find(s => s.name === 'Acceptable_Docs')?.rows.length || 0;

  const canProceed = extractionResult !== null && attributeCount > 0;
  const shouldReduceMotion = useReducedMotion();

  const steps = [
    {
      title: "Step 1: Upload",
      description: "FLU Procedures",
      isComplete: true,
      activeColor: "bg-green-500/20 text-green-400",
      completeColor: "bg-green-500/20 text-green-400",
      Icon: FileText,
      badgeText: "Ready",
    },
    {
      title: "Step 2: Extract",
      description: "AI Attribute Extraction",
      isComplete: attributeCount > 0,
      activeColor: "bg-amber-500/20 text-amber-400",
      completeColor: "bg-green-500/20 text-green-400",
      Icon: Bot,
      badgeText: attributeCount > 0
        ? `${attributeCount} attributes`
        : "Pending extraction",
    },
    {
      title: "Step 3: Review",
      description: "Confirm & Export",
      isComplete: canProceed,
      activeColor: "bg-white/10 text-white/40",
      completeColor: "bg-green-500/20 text-green-400",
      Icon: FileSpreadsheet,
      badgeText: canProceed ? `${docsCount} docs mapped` : "Pending",
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
          className="inline-flex items-center text-sm text-white/50 hover:text-white mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Audit Run
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Badge className="bg-amber-500/20 text-amber-400">Stage 3</Badge>
              <h1 className="text-3xl font-bold tracking-tight text-white">
                FLU Procedure Extraction
              </h1>
            </div>
            <p className="text-white/50 mt-2">
              Extract CIP, CDD, and EDD testing attributes from Front Line Unit procedures
            </p>
          </div>
          <Button variant="outline" onClick={handleLoadDemoData} className="border-white/20 text-white hover:bg-white/10 hover:border-white/30">
            <Database className="h-4 w-4 mr-2" />
            Load Demo Data
          </Button>
        </div>
      </motion.div>

      {/* Workflow Steps */}
      <motion.div
        className="grid gap-3 md:grid-cols-3 mb-6 flex-shrink-0"
        initial={shouldReduceMotion ? undefined : "hidden"}
        animate="visible"
        variants={staggerContainer}
      >
        {steps.map((step, index) => (
          <motion.div key={index} variants={staggerItem}>
            <Card className={`bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] ${step.isComplete ? "border-green-500" : ""}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <motion.div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      step.isComplete ? "bg-green-500/20 text-green-400" : step.activeColor
                    }`}
                  >
                    {step.isComplete ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <step.Icon className="h-5 w-5" />
                    )}
                  </motion.div>
                  <div>
                    <CardTitle className="text-base text-white">{step.title}</CardTitle>
                    <CardDescription className="text-white/60">{step.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Badge variant={step.isComplete ? "default" : "outline"} className={!step.isComplete ? "border-white/30 text-white/70" : ""}>
                  {step.badgeText}
                </Badge>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* View Mode Tabs */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)} className="flex-1 flex flex-col min-h-0">
        <TabsList className="flex-shrink-0 mb-4">
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            AI Extraction
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-2" disabled={!extractionResult}>
            <FileSpreadsheet className="h-4 w-4" />
            Results
            {attributeCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {attributeCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          {viewMode === "chat" && (
            <motion.div
              key="chat"
              className="flex-1 min-h-0"
              initial={shouldReduceMotion ? undefined : "hidden"}
              animate="visible"
              exit="exit"
              variants={tabContent}
            >
              <TabsContent value="chat" className="h-full m-0">
                <FLUProcedureChat
                  onExtractionComplete={handleExtractionComplete}
                  extractionResult={extractionResult}
                  auditRunId={id}
                  preloadedDocument={preloadedDoc}
                />
              </TabsContent>
            </motion.div>
          )}

          {viewMode === "results" && (
            <motion.div
              key="results"
              className="flex-1 min-h-0"
              initial={shouldReduceMotion ? undefined : "hidden"}
              animate="visible"
              exit="exit"
              variants={tabContent}
            >
              <TabsContent value="results" className="h-full m-0">
                {extractionResult ? (
                  <ExtractionResultsView
                    result={extractionResult}
                    onExportExcel={handleExportExcel}
                    demoMode={extractionResult.demoMode}
                  />
                ) : (
                  <Card className="h-full flex items-center justify-center bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]">
                    <div className="text-center">
                      <Sparkles className="h-16 w-16 mx-auto mb-4 text-white/30" />
                      <h3 className="font-medium mb-2 text-white">No Extraction Results</h3>
                      <p className="text-sm text-white/50">
                        Upload FLU procedures and run extraction to view results
                      </p>
                    </div>
                  </Card>
                )}
              </TabsContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Tabs>

      {/* Navigation */}
      <motion.div
        className="flex items-center justify-between pt-4 flex-shrink-0 border-t border-white/10 mt-6"
        initial={shouldReduceMotion ? undefined : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Link href={`/aic/audit-runs/${id}/stage-2`}>
          <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 hover:border-white/30">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Stage 2
          </Button>
        </Link>
        <Link href={`/aic/audit-runs/${id}/stage-4`}>
          <Button disabled={!canProceed}>
            Continue to Workbook Generation
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}
