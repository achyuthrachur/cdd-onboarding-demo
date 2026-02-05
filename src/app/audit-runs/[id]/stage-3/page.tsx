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
import { toast } from "sonner";
import {
  loadFallbackDataForStage,
  getStageData,
  hasStageData,
  setStageData,
} from "@/lib/stage-data";
import type { FLUExtractionResult, ExtractedAttribute } from "@/lib/stage-data/store";
import type { AcceptableDoc } from "@/lib/attribute-library/types";
import { FLUProcedureChat } from "@/components/stage-3/flu-procedure-chat";
import { ExtractionResultsView } from "@/components/stage-3/extraction-results-view";
import { getMockFLUExtractionResult } from "@/lib/ai/client";

type ViewMode = "chat" | "results";

export default function Stage3Page() {
  const params = useParams();
  const id = params.id as string;

  const [viewMode, setViewMode] = useState<ViewMode>("chat");
  const [extractionResult, setExtractionResult] = useState<FLUExtractionResult | null>(null);
  const [hasSample, setHasSample] = useState(false);

  // Check for prerequisite data and load existing extraction
  useEffect(() => {
    setHasSample(hasStageData('samplingResult'));

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
      </div>

      {/* Workflow Steps */}
      <div className="grid gap-4 md:grid-cols-3 mb-6 flex-shrink-0">
        <Card className="border-green-500">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base">Step 1: Upload</CardTitle>
                <CardDescription>FLU Procedures</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Badge variant="default">Ready</Badge>
          </CardContent>
        </Card>

        <Card className={attributeCount > 0 ? "border-green-500" : ""}>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  attributeCount > 0
                    ? "bg-green-100 text-green-600"
                    : "bg-amber-100 text-amber-600"
                }`}
              >
                {attributeCount > 0 ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <Bot className="h-5 w-5" />
                )}
              </div>
              <div>
                <CardTitle className="text-base">Step 2: Extract</CardTitle>
                <CardDescription>AI Attribute Extraction</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Badge variant={attributeCount > 0 ? "default" : "outline"}>
              {attributeCount > 0
                ? `${attributeCount} attributes`
                : "Pending extraction"}
            </Badge>
          </CardContent>
        </Card>

        <Card className={canProceed ? "border-green-500" : ""}>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  canProceed
                    ? "bg-green-100 text-green-600"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {canProceed ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <FileSpreadsheet className="h-5 w-5" />
                )}
              </div>
              <div>
                <CardTitle className="text-base">Step 3: Review</CardTitle>
                <CardDescription>Confirm & Export</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Badge variant={canProceed ? "default" : "outline"}>
              {canProceed ? `${docsCount} docs mapped` : "Pending"}
            </Badge>
          </CardContent>
        </Card>
      </div>

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

        {/* Chat View */}
        <TabsContent value="chat" className="flex-1 min-h-0 mt-0">
          <FLUProcedureChat
            onExtractionComplete={handleExtractionComplete}
            extractionResult={extractionResult}
            auditRunId={id}
          />
        </TabsContent>

        {/* Results View */}
        <TabsContent value="results" className="flex-1 min-h-0 mt-0">
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
      </Tabs>

      {/* Navigation */}
      <div className="flex justify-between pt-4 flex-shrink-0 border-t mt-4">
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
      </div>
    </div>
  );
}
