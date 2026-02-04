"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, ArrowRight, Upload, Sparkles, CheckCircle2, Loader2, FileText, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { DocumentUploader } from "@/components/stage-1/document-uploader";
import { GapsTable } from "@/components/stage-1/gaps-table";
import { AttributesTable } from "@/components/stage-1/attributes-table";

interface Document {
  id: string;
  fileName: string;
  docType: string;
  jurisdiction: string | null;
  uploadedAt: string;
}

interface GapResult {
  workbook: {
    sheets: Array<{
      name: string;
      rows: Array<Record<string, unknown>>;
    }>;
  };
}

interface AttributeResult {
  workbook: {
    sheets: Array<{
      name: string;
      rows: Array<Record<string, unknown>>;
    }>;
  };
}

export default function Stage1Page() {
  const params = useParams();
  const id = params.id as string;

  const [documents, setDocuments] = useState<Document[]>([]);
  const [gapResults, setGapResults] = useState<GapResult | null>(null);
  const [attributeResults, setAttributeResults] = useState<AttributeResult | null>(null);
  const [isRunningGapAssessment, setIsRunningGapAssessment] = useState(false);
  const [isRunningAttributeExtraction, setIsRunningAttributeExtraction] = useState(false);
  const [activeTab, setActiveTab] = useState("documents");

  // Load documents on mount
  useEffect(() => {
    const loadDocuments = async () => {
      try {
        const response = await fetch(`/api/documents?auditRunId=${id}`);
        if (response.ok) {
          const docs = await response.json();
          setDocuments(docs);
        }
      } catch (error) {
        console.error("Failed to load documents:", error);
      }
    };

    loadDocuments();
  }, [id]);

  const handleDocumentUploaded = (doc: Document) => {
    setDocuments((prev) => [...prev, doc]);
  };

  const handleDocumentDeleted = (docId: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
  };

  const runGapAssessment = async () => {
    setIsRunningGapAssessment(true);
    try {
      const response = await fetch("/api/ai/gap-assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auditRunId: id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to run gap assessment");
      }

      const data = await response.json();
      setGapResults(data.result);
      setActiveTab("gaps");
      toast.success("Gap assessment completed");
    } catch {
      toast.error("Failed to run gap assessment");
    } finally {
      setIsRunningGapAssessment(false);
    }
  };

  const runAttributeExtraction = async () => {
    setIsRunningAttributeExtraction(true);
    try {
      const response = await fetch("/api/ai/attribute-extraction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auditRunId: id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to run attribute extraction");
      }

      const data = await response.json();
      setAttributeResults(data.result);
      setActiveTab("attributes");
      toast.success("Attribute extraction completed");
    } catch {
      toast.error("Failed to run attribute extraction");
    } finally {
      setIsRunningAttributeExtraction(false);
    }
  };

  const getGaps = () => {
    if (!gapResults?.workbook?.sheets) return [];
    const gapSheet = gapResults.workbook.sheets.find((s) => s.name === "Gap_Details");
    return (gapSheet?.rows || []) as Array<Record<string, string>>;
  };

  const getSummary = () => {
    if (!gapResults?.workbook?.sheets) return [];
    const summarySheet = gapResults.workbook.sheets.find((s) => s.name === "Summary");
    return (summarySheet?.rows || []) as Array<{ Metric: string; Value: number }>;
  };

  const getAttributes = () => {
    if (!attributeResults?.workbook?.sheets) return [];
    const attrSheet = attributeResults.workbook.sheets.find((s) => s.name === "Attributes");
    return (attrSheet?.rows || []) as Array<Record<string, string>>;
  };

  const getAcceptableDocs = () => {
    if (!attributeResults?.workbook?.sheets) return [];
    const docsSheet = attributeResults.workbook.sheets.find((s) => s.name === "Acceptable_Docs");
    return (docsSheet?.rows || []) as Array<Record<string, string>>;
  };

  const canProceed = gapResults && attributeResults;

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
              <Badge className="bg-blue-100 text-blue-700">Stage 1</Badge>
              <h1 className="text-3xl font-bold tracking-tight">Gap Assessment & Attribute Extraction</h1>
            </div>
            <p className="text-muted-foreground mt-2">
              Upload documents, run AI analysis, and review extracted attributes
            </p>
          </div>
        </div>
      </div>

      {/* Workflow Steps */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card className={documents.length > 0 ? "border-green-500" : ""}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                documents.length > 0 ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"
              }`}>
                {documents.length > 0 ? <CheckCircle2 className="h-5 w-5" /> : <Upload className="h-5 w-5" />}
              </div>
              <div>
                <CardTitle className="text-base">Step 1</CardTitle>
                <CardDescription>Upload Documents</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Upload Global Standards and FLU procedure documents for comparison.
            </p>
            <Badge variant={documents.length > 0 ? "default" : "outline"}>
              {documents.length} document{documents.length !== 1 ? "s" : ""}
            </Badge>
          </CardContent>
        </Card>

        <Card className={gapResults && attributeResults ? "border-green-500" : ""}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                gapResults && attributeResults ? "bg-green-100 text-green-600" : "bg-purple-100 text-purple-600"
              }`}>
                {gapResults && attributeResults ? <CheckCircle2 className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
              </div>
              <div>
                <CardTitle className="text-base">Step 2</CardTitle>
                <CardDescription>Run AI Analysis</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Run gap assessment and attribute extraction using AI.
            </p>
            <Badge variant={gapResults && attributeResults ? "default" : "outline"}>
              {gapResults && attributeResults ? "Completed" : gapResults || attributeResults ? "Partial" : "Not started"}
            </Badge>
          </CardContent>
        </Card>

        <Card className={canProceed ? "border-green-500" : ""}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                canProceed ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
              }`}>
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base">Step 3</CardTitle>
                <CardDescription>Review & Approve</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Review results and approve to proceed to sampling.
            </p>
            <Badge variant={canProceed ? "default" : "outline"}>
              {canProceed ? "Ready" : "Pending"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documents
            {documents.length > 0 && (
              <Badge variant="secondary" className="ml-1">{documents.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="gaps" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Gap Assessment
            {gapResults && <CheckCircle2 className="h-4 w-4 text-green-500 ml-1" />}
          </TabsTrigger>
          <TabsTrigger value="attributes" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Attributes
            {attributeResults && <CheckCircle2 className="h-4 w-4 text-green-500 ml-1" />}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="mt-6">
          <DocumentUploader
            auditRunId={id}
            documents={documents}
            onDocumentUploaded={handleDocumentUploaded}
            onDocumentDeleted={handleDocumentDeleted}
          />

          {/* AI Analysis Actions */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Run AI Analysis
              </CardTitle>
              <CardDescription>
                Run AI-powered gap assessment and attribute extraction
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <Button
                  onClick={runGapAssessment}
                  disabled={isRunningGapAssessment}
                  className="w-full"
                >
                  {isRunningGapAssessment ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Running Gap Assessment...
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="mr-2 h-4 w-4" />
                      Run Gap Assessment
                      {gapResults && <CheckCircle2 className="ml-2 h-4 w-4 text-green-300" />}
                    </>
                  )}
                </Button>
                <Button
                  onClick={runAttributeExtraction}
                  disabled={isRunningAttributeExtraction}
                  className="w-full"
                >
                  {isRunningAttributeExtraction ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Extracting Attributes...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Extract Attributes
                      {attributeResults && <CheckCircle2 className="ml-2 h-4 w-4 text-green-300" />}
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-4 text-center">
                AI-powered analysis using OpenAI GPT-4
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gaps" className="mt-6">
          {gapResults ? (
            <GapsTable
              gaps={getGaps() as unknown as Parameters<typeof GapsTable>[0]["gaps"]}
              summary={getSummary()}
            />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">No gap assessment results</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Run the gap assessment to view results
                </p>
                <Button onClick={runGapAssessment} disabled={isRunningGapAssessment}>
                  {isRunningGapAssessment ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Run Gap Assessment
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="attributes" className="mt-6">
          {attributeResults ? (
            <AttributesTable
              attributes={getAttributes() as unknown as Parameters<typeof AttributesTable>[0]["attributes"]}
              acceptableDocs={getAcceptableDocs() as unknown as Parameters<typeof AttributesTable>[0]["acceptableDocs"]}
            />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">No attribute extraction results</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Run attribute extraction to view results
                </p>
                <Button onClick={runAttributeExtraction} disabled={isRunningAttributeExtraction}>
                  {isRunningAttributeExtraction ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Extract Attributes
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Navigation */}
      <div className="flex justify-between">
        <Link href={`/audit-runs/${id}`}>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Overview
          </Button>
        </Link>
        <Link href={`/audit-runs/${id}/stage-2`}>
          <Button disabled={!canProceed}>
            Continue to Sampling
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
