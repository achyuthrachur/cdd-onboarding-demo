"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Bot,
  FileSpreadsheet,
  Database,
} from "lucide-react";
import { AIAgentChat } from "@/components/stage-1/ai-agent-chat";
import { GapResultsSpreadsheet } from "@/components/stage-1/gap-results-spreadsheet";
import { toast } from "sonner";
import {
  loadFallbackDataForStage,
  getStageData,
  setStageData,
  GapAssessmentResult as StoreGapAssessmentResult
} from "@/lib/stage-data";

interface Document {
  id: string;
  fileName: string;
  docType: string;
  jurisdiction: string | null;
  fileUrl?: string;
}

interface GapAssessmentResult {
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
  const [assessment1Result, setAssessment1Result] = useState<GapAssessmentResult | null>(null);
  const [assessment2Result, setAssessment2Result] = useState<GapAssessmentResult | null>(null);
  const [activeTab, setActiveTab] = useState("agent");

  // Load documents and check for existing stage data on mount
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

    // Check for existing stage data
    const storedAssessment1 = getStageData('gapAssessment1');
    const storedAssessment2 = getStageData('gapAssessment2');
    if (storedAssessment1) {
      setAssessment1Result(storedAssessment1 as unknown as GapAssessmentResult);
    }
    if (storedAssessment2) {
      setAssessment2Result(storedAssessment2 as unknown as GapAssessmentResult);
      if (storedAssessment1) {
        setActiveTab("results");
      }
    }
  }, [id]);

  const handleAssessment1Complete = (result: GapAssessmentResult) => {
    setAssessment1Result(result);
    // Save to centralized store
    setStageData('gapAssessment1', result as unknown as StoreGapAssessmentResult);
  };

  const handleAssessment2Complete = (result: GapAssessmentResult) => {
    setAssessment2Result(result);
    setActiveTab("results"); // Switch to results tab after completing both
    // Save to centralized store
    setStageData('gapAssessment2', result as unknown as StoreGapAssessmentResult);
  };

  const handleLoadDemoData = () => {
    loadFallbackDataForStage(1);
    const storedAssessment1 = getStageData('gapAssessment1');
    const storedAssessment2 = getStageData('gapAssessment2');
    if (storedAssessment1) {
      setAssessment1Result(storedAssessment1 as unknown as GapAssessmentResult);
    }
    if (storedAssessment2) {
      setAssessment2Result(storedAssessment2 as unknown as GapAssessmentResult);
    }
    setActiveTab("results");
    toast.success("Demo data loaded for Stage 1");
  };

  const canProceed = assessment1Result && assessment2Result;

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
              <h1 className="text-3xl font-bold tracking-tight">Gap Assessment</h1>
            </div>
            <p className="text-muted-foreground mt-2">
              Run sequential gap assessments using the AI assistant
            </p>
          </div>
          <Button variant="outline" onClick={handleLoadDemoData}>
            <Database className="h-4 w-4 mr-2" />
            Load Demo Data
          </Button>
        </div>
      </div>

      {/* Workflow Progress */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card className={assessment1Result ? "border-green-500" : ""}>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                assessment1Result ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"
              }`}>
                {assessment1Result ? <CheckCircle2 className="h-5 w-5" /> : <span className="font-bold">1</span>}
              </div>
              <div>
                <CardTitle className="text-base">Gap Assessment 1</CardTitle>
                <CardDescription>Old GFC vs Current GFC</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Badge variant={assessment1Result ? "default" : "outline"}>
              {assessment1Result ? "Completed" : "Pending"}
            </Badge>
          </CardContent>
        </Card>

        <Card className={assessment2Result ? "border-green-500" : ""}>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                assessment2Result ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"
              }`}>
                {assessment2Result ? <CheckCircle2 className="h-5 w-5" /> : <span className="font-bold">2</span>}
              </div>
              <div>
                <CardTitle className="text-base">Gap Assessment 2</CardTitle>
                <CardDescription>Current GFC vs FLU Procedures</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Badge variant={assessment2Result ? "default" : "outline"}>
              {assessment2Result ? "Completed" : "Pending"}
            </Badge>
          </CardContent>
        </Card>

        <Card className={canProceed ? "border-green-500" : ""}>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                canProceed ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
              }`}>
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base">Ready for Sampling</CardTitle>
                <CardDescription>Review & proceed</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Badge variant={canProceed ? "default" : "outline"}>
              {canProceed ? "Ready" : "Pending"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="agent" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            AI Assistant
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Results
            {(assessment1Result || assessment2Result) && (
              <Badge variant="secondary" className="ml-1">
                {[assessment1Result, assessment2Result].filter(Boolean).length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="agent" className="mt-6">
          <AIAgentChat
            documents={documents}
            onAssessment1Complete={handleAssessment1Complete}
            onAssessment2Complete={handleAssessment2Complete}
            assessment1Result={assessment1Result}
            assessment2Result={assessment2Result}
          />
        </TabsContent>

        <TabsContent value="results" className="mt-6">
          <GapResultsSpreadsheet
            assessment1Result={assessment1Result}
            assessment2Result={assessment2Result}
          />
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
