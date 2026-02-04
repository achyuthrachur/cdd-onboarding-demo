"use client";

import { useState, useEffect, useRef } from "react";
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
  ListChecks,
  FileText,
  Database,
  Loader2,
  Library,
  Plus,
  Trash2,
} from "lucide-react";
import { HotTable, HotTableClass } from "@handsontable/react";
import { registerAllModules } from "handsontable/registry";
import "handsontable/dist/handsontable.full.min.css";
import { toast } from "sonner";
import {
  loadFallbackDataForStage,
  getStageData,
  hasStageData,
  setStageData,
  getCombinedGaps,
  ExtractedAttribute,
  GapItem,
} from "@/lib/stage-data";
import { getMockAttributeExtractionResult } from "@/lib/ai/client";
import { mockAttributes } from "@/lib/attribute-library/mock-data";

// Register Handsontable modules
registerAllModules();

type ViewMode = "extraction" | "library" | "gaps";

export default function Stage3Page() {
  const params = useParams();
  const id = params.id as string;
  const hotRef = useRef<HotTableClass>(null);

  const [viewMode, setViewMode] = useState<ViewMode>("extraction");
  const [hasGapResults, setHasGapResults] = useState(false);
  const [hasSample, setHasSample] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedAttributes, setExtractedAttributes] = useState<ExtractedAttribute[]>([]);
  const [gaps, setGaps] = useState<GapItem[]>([]);
  const [extractionComplete, setExtractionComplete] = useState(false);

  // Check for prerequisite data
  useEffect(() => {
    const hasGaps = hasStageData('gapAssessment1') || hasStageData('gapAssessment2') || hasStageData('combinedGaps');
    setHasGapResults(hasGaps);
    setHasSample(hasStageData('samplingResult'));

    // Load existing extracted attributes
    const storedAttributes = getStageData('extractedAttributes');
    if (storedAttributes) {
      setExtractedAttributes(storedAttributes);
      setExtractionComplete(true);
    }

    // Load gaps
    const storedGaps = getCombinedGaps();
    if (storedGaps.length > 0) {
      setGaps(storedGaps);
    }
  }, []);

  const handleLoadDemoData = () => {
    loadFallbackDataForStage(3);
    const attrs = getStageData('extractedAttributes');
    if (attrs) {
      setExtractedAttributes(attrs);
      setExtractionComplete(true);
    }
    const gapData = getCombinedGaps();
    if (gapData.length > 0) {
      setGaps(gapData);
    }
    setHasGapResults(true);
    setHasSample(true);
    toast.success("Demo data loaded for Stage 3");
  };

  const handleExtractAttributes = async () => {
    setIsExtracting(true);
    try {
      // Simulate AI extraction delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Use mock AI extraction result
      const aiResult = getMockAttributeExtractionResult();
      const attributesSheet = aiResult.workbook.sheets.find(s => s.name === 'Attributes');

      if (attributesSheet?.rows) {
        const extracted: ExtractedAttribute[] = attributesSheet.rows.map(r => {
          const row = r as Record<string, unknown>;
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
            extractedFrom: 'gap_assessment' as const,
          };
        });

        setExtractedAttributes(extracted);
        setStageData('extractedAttributes', extracted);
        setStageData('attributeExtractionComplete', true);
        setExtractionComplete(true);
        toast.success(`Extracted ${extracted.length} attributes from gap assessment`);
      }
    } catch (error) {
      console.error('Extraction failed:', error);
      toast.error('Failed to extract attributes');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleLoadFromLibrary = () => {
    const libraryAttrs: ExtractedAttribute[] = mockAttributes.map(attr => ({
      ...attr,
      extractedFrom: 'library' as const,
    }));

    setExtractedAttributes(libraryAttrs);
    setStageData('extractedAttributes', libraryAttrs);
    setStageData('attributeExtractionComplete', true);
    setExtractionComplete(true);
    toast.success(`Loaded ${libraryAttrs.length} attributes from library`);
  };

  const handleClearAttributes = () => {
    setExtractedAttributes([]);
    setStageData('extractedAttributes', undefined);
    setStageData('attributeExtractionComplete', false);
    setExtractionComplete(false);
    toast.success('Attributes cleared');
  };

  const canProceed = extractionComplete && extractedAttributes.length > 0;

  // Prepare data for Handsontable
  const attributeTableData = extractedAttributes.map(attr => [
    attr.Attribute_ID,
    attr.Attribute_Name,
    attr.Category,
    attr.Question_Text,
    attr.IsRequired,
    attr.RiskScope,
    attr.Group,
    attr.extractedFrom || 'library',
  ]);

  const gapTableData = gaps.map(gap => [
    gap.Gap_ID,
    gap.Disposition,
    gap.Severity,
    gap.Standard_Requirement_ID,
    gap.Gap_Description,
    gap.Recommended_Remediation,
  ]);

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
              <Badge className="bg-amber-100 text-amber-700">Stage 3</Badge>
              <h1 className="text-3xl font-bold tracking-tight">
                Attribute Extraction
              </h1>
            </div>
            <p className="text-muted-foreground mt-2">
              Extract testing attributes from gap analysis results or use the attribute library
            </p>
          </div>
          <Button variant="outline" onClick={handleLoadDemoData}>
            <Database className="h-4 w-4 mr-2" />
            Load Demo Data
          </Button>
        </div>
      </div>

      {/* Prerequisites Check */}
      {!hasGapResults && (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <h3 className="font-medium text-yellow-700 dark:text-yellow-300 mb-2">
            Prerequisites Required
          </h3>
          <ul className="text-sm text-yellow-600 dark:text-yellow-400 space-y-1">
            <li>• Complete Stage 1 (Gap Assessment) or load demo data</li>
          </ul>
        </div>
      )}

      {/* Workflow Steps */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card className={hasGapResults ? "border-green-500" : ""}>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  hasGapResults
                    ? "bg-green-100 text-green-600"
                    : "bg-blue-100 text-blue-600"
                }`}
              >
                {hasGapResults ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <FileText className="h-5 w-5" />
                )}
              </div>
              <div>
                <CardTitle className="text-base">Step 1: Input</CardTitle>
                <CardDescription>Gap assessment results</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Badge variant={hasGapResults ? "default" : "outline"}>
              {hasGapResults ? `${gaps.length} gaps available` : "No gap data"}
            </Badge>
          </CardContent>
        </Card>

        <Card className={extractedAttributes.length > 0 ? "border-green-500" : ""}>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  extractedAttributes.length > 0
                    ? "bg-green-100 text-green-600"
                    : "bg-amber-100 text-amber-600"
                }`}
              >
                {extractedAttributes.length > 0 ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <Sparkles className="h-5 w-5" />
                )}
              </div>
              <div>
                <CardTitle className="text-base">Step 2: Extract</CardTitle>
                <CardDescription>Identify attributes</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Badge variant={extractedAttributes.length > 0 ? "default" : "outline"}>
              {extractedAttributes.length > 0
                ? `${extractedAttributes.length} attributes`
                : "Pending extraction"}
            </Badge>
          </CardContent>
        </Card>

        <Card className={extractionComplete ? "border-green-500" : ""}>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  extractionComplete
                    ? "bg-green-100 text-green-600"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {extractionComplete ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <ListChecks className="h-5 w-5" />
                )}
              </div>
              <div>
                <CardTitle className="text-base">Step 3: Review</CardTitle>
                <CardDescription>Confirm attributes</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Badge variant={extractionComplete ? "default" : "outline"}>
              {extractionComplete ? "Ready for workbook" : "Pending"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* View Mode Tabs */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)} className="mb-6">
        <TabsList>
          <TabsTrigger value="extraction" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Attribute Extraction
            {extractedAttributes.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {extractedAttributes.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="library" className="flex items-center gap-2">
            <Library className="h-4 w-4" />
            Attribute Library
          </TabsTrigger>
          <TabsTrigger value="gaps" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Gap Details
            {gaps.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {gaps.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Extraction View */}
        <TabsContent value="extraction" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Extracted Attributes</CardTitle>
                  <CardDescription>
                    Attributes to be tested in the workbook
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {extractedAttributes.length > 0 && (
                    <Button variant="outline" size="sm" onClick={handleClearAttributes}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear
                    </Button>
                  )}
                  <Button
                    onClick={handleExtractAttributes}
                    disabled={isExtracting || !hasGapResults}
                    size="sm"
                  >
                    {isExtracting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Extracting...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Extract from Gaps
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleLoadFromLibrary}
                    size="sm"
                  >
                    <Library className="h-4 w-4 mr-2" />
                    Load from Library
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {extractedAttributes.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <HotTable
                    ref={hotRef}
                    data={attributeTableData}
                    colHeaders={['Attribute ID', 'Name', 'Category', 'Question Text', 'Required', 'Risk Scope', 'Group', 'Source']}
                    rowHeaders={true}
                    width="100%"
                    height="auto"
                    licenseKey="non-commercial-and-evaluation"
                    stretchH="all"
                    autoRowSize={true}
                    readOnly={true}
                    columnSorting={true}
                    filters={true}
                    dropdownMenu={true}
                    manualColumnResize={true}
                    colWidths={[100, 150, 120, 300, 80, 80, 100, 80]}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Sparkles className="h-16 w-16 mb-4 opacity-30" />
                  <h3 className="font-medium mb-2">No Attributes Extracted</h3>
                  <p className="text-sm text-center max-w-md">
                    Click &quot;Extract from Gaps&quot; to use AI to identify testing attributes from the gap assessment,
                    or &quot;Load from Library&quot; to use predefined attributes.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Library View */}
        <TabsContent value="library" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Attribute Library</CardTitle>
                  <CardDescription>
                    Predefined attributes available for testing
                  </CardDescription>
                </div>
                <Button onClick={handleLoadFromLibrary} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Use Library Attributes
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <HotTable
                  data={mockAttributes.map(attr => [
                    attr.Attribute_ID,
                    attr.Attribute_Name,
                    attr.Category,
                    attr.Question_Text,
                    attr.IsRequired,
                    attr.RiskScope,
                    attr.Jurisdiction_ID,
                    attr.Group,
                  ])}
                  colHeaders={['Attribute ID', 'Name', 'Category', 'Question Text', 'Required', 'Risk Scope', 'Jurisdiction', 'Group']}
                  rowHeaders={true}
                  width="100%"
                  height="auto"
                  licenseKey="non-commercial-and-evaluation"
                  stretchH="all"
                  autoRowSize={true}
                  readOnly={true}
                  columnSorting={true}
                  filters={true}
                  dropdownMenu={true}
                  manualColumnResize={true}
                  colWidths={[100, 150, 120, 280, 80, 80, 100, 100]}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gaps View */}
        <TabsContent value="gaps" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Gap Details</CardTitle>
              <CardDescription>
                Combined gaps from Stage 1 assessments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {gaps.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <HotTable
                    data={gapTableData}
                    colHeaders={['Gap ID', 'Disposition', 'Severity', 'Requirement ID', 'Description', 'Remediation']}
                    rowHeaders={true}
                    width="100%"
                    height="auto"
                    licenseKey="non-commercial-and-evaluation"
                    stretchH="all"
                    autoRowSize={true}
                    readOnly={true}
                    columnSorting={true}
                    filters={true}
                    dropdownMenu={true}
                    manualColumnResize={true}
                    colWidths={[100, 120, 100, 140, 300, 250]}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <FileText className="h-16 w-16 mb-4 opacity-30" />
                  <h3 className="font-medium mb-2">No Gap Data</h3>
                  <p className="text-sm">
                    Complete Stage 1 Gap Assessment or load demo data to view gaps.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Summary Card */}
      {extractionComplete && (
        <Card className="mb-6 border-green-500">
          <CardHeader>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <CardTitle className="text-green-700">Attribute Extraction Complete</CardTitle>
                <CardDescription>
                  {extractedAttributes.length} attributes ready for workbook generation
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Total:</span>{' '}
                <span className="font-medium">{extractedAttributes.length}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Required:</span>{' '}
                <span className="font-medium">
                  {extractedAttributes.filter(a => a.IsRequired === 'Y').length}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">EDD Only:</span>{' '}
                <span className="font-medium">
                  {extractedAttributes.filter(a => a.RiskScope === 'EDD').length}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Categories:</span>{' '}
                <span className="font-medium">
                  {new Set(extractedAttributes.map(a => a.Category)).size}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
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
