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
  Download,
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

// Demo FLU Procedures document that's preloaded for extraction
const DEMO_FLU_DOCUMENT: FLUProcedureDocument = {
  id: "demo-flu-procedures",
  fileName: "FLU_CIP_CDD_Procedures.docx",
  docType: "flu_procedure",
  jurisdiction: "ENT",
  uploadedAt: new Date().toISOString(),
  content: `FRONT LINE UNIT PROCEDURES - CIP/CDD/EDD COMPLIANCE

1. CUSTOMER IDENTIFICATION PROGRAM (CIP)
1.1 Identity Verification Requirements
- Verify customer's full legal name using government-issued ID
- Verify date of birth from documentary evidence
- Verify residential address through utility bill or bank statement
- For non-documentary verification, use credit bureau or public records

1.2 Documentary Evidence
Acceptable documents for identity verification:
- Valid passport (unexpired)
- Driver's license with photo
- State-issued ID card
- Military ID

2. CUSTOMER DUE DILIGENCE (CDD)
2.1 Beneficial Ownership
- Identify all beneficial owners with 25% or more ownership
- Verify identity of beneficial owners using CIP procedures
- Document control person for legal entity customers

2.2 Nature and Purpose
- Document nature of business relationship
- Understand expected account activity
- Assess customer risk rating (Low/Medium/High)

2.3 Ongoing Monitoring
- Conduct periodic reviews based on risk rating
- Monitor transactions for unusual activity
- Update customer information at trigger events

3. ENHANCED DUE DILIGENCE (EDD)
3.1 High-Risk Customers
- Senior management approval required
- Source of funds documentation
- Source of wealth verification

3.2 PEP Screening
- Screen against PEP databases
- Enhanced monitoring for PEP relationships
- Annual certification for PEP accounts

3.3 High-Risk Jurisdictions
- Additional documentation requirements
- Enhanced transaction monitoring
- Escalation procedures for suspicious activity`,
};

type ViewMode = "chat" | "results";

export default function Stage3Page() {
  const params = useParams();
  const id = params.id as string;

  const [viewMode, setViewMode] = useState<ViewMode>("chat");
  const [extractionResult, setExtractionResult] = useState<FLUExtractionResult | null>(null);
  const [hasSample, setHasSample] = useState(false);
  const [preloadedDoc, setPreloadedDoc] = useState<FLUProcedureDocument | null>(null);

  // Check for prerequisite data and load existing extraction
  useEffect(() => {
    setHasSample(hasStageData('samplingResult'));

    // Check for stored FLU procedures from stage-data, or use demo document
    const storedFluProcedures = getStageData('fluProcedures');
    if (storedFluProcedures && storedFluProcedures.length > 0) {
      setPreloadedDoc(storedFluProcedures[0]);
    } else {
      // Preload demo FLU document so users don't have to upload
      setPreloadedDoc(DEMO_FLU_DOCUMENT);
    }

    // Load existing extraction result
    const storedResult = getStageData('fluExtractionResult');
    if (storedResult) {
      setExtractionResult(storedResult);
    }

    // Also check if we have extracted attributes from a previous session
    const storedAttributes = getStageData('extractedAttributes');
    if (storedAttributes && storedAttributes.length > 0 && !storedResult) {
      // Reconstruct the result from stored attributes
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
    // Load demo data for Stage 3
    const mockResult = getMockFLUExtractionResult();
    const result: FLUExtractionResult = {
      id: `flu-demo-${Date.now()}`,
      workbook: mockResult.workbook as FLUExtractionResult['workbook'],
      tokensUsed: 0,
    };

    // Store the full result
    setStageData('fluExtractionResult', result);

    // Extract and store attributes
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

    // Extract and store acceptable docs
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

    // Also load sampling data if not present
    if (!hasStageData('samplingResult')) {
      loadFallbackDataForStage(2);
    }

    toast.success("Demo data loaded for Stage 3");
  };

  const handleExtractionComplete = (result: FLUExtractionResult) => {
    // Store the full result
    setStageData('fluExtractionResult', result);

    // Extract and store attributes
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

    // Extract and store acceptable docs
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

    // For demo, just show a toast
    toast.success("Exporting to Excel...", {
      description: "Download will start shortly",
    });

    // In a real implementation, this would call an API to generate and download the Excel file
    // For now, we'll create a simple CSV download
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

  // Calculate counts for display
  const attributeCount = extractionResult?.workbook.sheets.find(s => s.name === 'Attributes')?.rows.length || 0;
  const docsCount = extractionResult?.workbook.sheets.find(s => s.name === 'Acceptable_Docs')?.rows.length || 0;

  const canProceed = extractionResult !== null && attributeCount > 0;
  const shouldReduceMotion = useReducedMotion();

  // Step cards data for rendering
  const steps = [
    {
      title: "Step 1: Upload",
      description: "FLU Procedures",
      isComplete: true,
      activeColor: "bg-green-100 text-green-600",
      completeColor: "bg-green-100 text-green-600",
      Icon: FileText,
      badgeText: "Ready",
    },
    {
      title: "Step 2: Extract",
      description: "AI Attribute Extraction",
      isComplete: attributeCount > 0,
      activeColor: "bg-amber-100 text-amber-600",
      completeColor: "bg-green-100 text-green-600",
      Icon: Bot,
      badgeText: attributeCount > 0
        ? `${attributeCount} attributes`
        : "Pending extraction",
    },
    {
      title: "Step 3: Review",
      description: "Confirm & Export",
      isComplete: canProceed,
      activeColor: "bg-gray-100 text-gray-400",
      completeColor: "bg-green-100 text-green-600",
      Icon: FileSpreadsheet,
      badgeText: canProceed ? `${docsCount} docs mapped` : "Pending",
    },
  ];

  return (
    <div className="p-8 h-[calc(100vh-4rem)] flex flex-col">
      {/* Header - Animated */}
      <motion.div
        className="mb-6 flex-shrink-0"
        initial={shouldReduceMotion ? undefined : "hidden"}
        animate="visible"
        variants={fadeInUp}
      >
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
              <Badge className="bg-amber-100 text-amber-700">Stage 3</Badge>
              <h1 className="text-3xl font-bold tracking-tight">
                FLU Procedure Extraction
              </h1>
            </div>
            <p className="text-muted-foreground mt-2">
              Extract CIP, CDD, and EDD testing attributes from Front Line Unit procedures
            </p>
          </div>
          <Button variant="outline" onClick={handleLoadDemoData}>
            <Database className="h-4 w-4 mr-2" />
            Load Demo Data
          </Button>
        </div>
      </motion.div>

      {/* Workflow Steps - Staggered animation */}
      <motion.div
        className="grid gap-4 md:grid-cols-3 mb-6 flex-shrink-0"
        initial={shouldReduceMotion ? undefined : "hidden"}
        animate="visible"
        variants={staggerContainer}
      >
        {steps.map((step, index) => (
          <motion.div key={index} variants={staggerItem}>
            <Card className={step.isComplete ? "border-green-500" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <motion.div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      step.isComplete ? step.completeColor : step.activeColor
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
                    <CardTitle className="text-base">{step.title}</CardTitle>
                    <CardDescription>{step.description}</CardDescription>
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
                    <Badge variant={step.isComplete ? "default" : "outline"}>
                      {step.badgeText}
                    </Badge>
                  </motion.div>
                </AnimatePresence>
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

        {/* Tab Content with Animation */}
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
                  />
                ) : (
                  <Card className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <Sparkles className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-30" />
                      <h3 className="font-medium mb-2">No Extraction Results</h3>
                      <p className="text-sm text-muted-foreground">
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
        className="flex justify-between pt-4 flex-shrink-0 border-t mt-4"
        initial={shouldReduceMotion ? undefined : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Link href={`/audit-runs/${id}/stage-2`}>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Stage 2
          </Button>
        </Link>
        <Link href={`/audit-runs/${id}/stage-4`}>
          <Button disabled={!canProceed}>
            Continue to Workbook Generation
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}
