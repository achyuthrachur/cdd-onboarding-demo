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
import { motion, useReducedMotion, staggerContainer, staggerItem } from "@/lib/animations";

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

export default function AicStage1Page() {
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
    setStageData('gapAssessment1', result as unknown as StoreGapAssessmentResult);
  };

  const handleAssessment2Complete = (result: GapAssessmentResult) => {
    setAssessment2Result(result);
    setActiveTab("results");
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
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="p-8">
      {/* Header */}
      <motion.div
        initial={shouldReduceMotion ? undefined : { opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8"
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
              <motion.div
                initial={shouldReduceMotion ? undefined : { scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
              >
                <Badge className="bg-blue-500/20 text-blue-400">Stage 1</Badge>
              </motion.div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Gap Assessment</h1>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Run sequential gap assessments using the AI assistant
            </p>
          </div>
          <motion.div
            whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
            whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
          >
            <Button variant="outline" onClick={handleLoadDemoData} className="border-gray-200 dark:border-white/20 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 hover:border-gray-300 dark:hover:border-white/30">
              <Database className="h-4 w-4 mr-2" />
              Load Demo Data
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Workflow Progress */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={shouldReduceMotion ? {} : staggerContainer}
        className="grid gap-3 md:grid-cols-3 mb-6"
      >
        <motion.div variants={shouldReduceMotion ? {} : staggerItem}>
          <Card className={`bg-white dark:bg-white/10 backdrop-blur-xl border border-gray-200/60 dark:border-white/20 shadow-md dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] ${assessment1Result ? "border-green-500" : ""}`}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <motion.div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    assessment1Result ? "bg-green-500/20 text-green-400" : "bg-amber-500/20 text-amber-400"
                  }`}
                >
                  {assessment1Result ? <CheckCircle2 className="h-5 w-5" /> : <span className="font-bold">1</span>}
                </motion.div>
                <div>
                  <CardTitle className="text-base text-gray-900 dark:text-white">Gap Assessment 1</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-300">Old GFC vs Current GFC</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Badge variant={assessment1Result ? "default" : "outline"} className={!assessment1Result ? "border-gray-300 dark:border-white/30 text-gray-600 dark:text-gray-300" : ""}>
                {assessment1Result ? "Completed" : "Pending"}
              </Badge>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={shouldReduceMotion ? {} : staggerItem}>
          <Card className={`bg-white dark:bg-white/10 backdrop-blur-xl border border-gray-200/60 dark:border-white/20 shadow-md dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] ${assessment2Result ? "border-green-500" : ""}`}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <motion.div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    assessment2Result ? "bg-green-500/20 text-green-400" : "bg-blue-500/20 text-blue-400"
                  }`}
                >
                  {assessment2Result ? <CheckCircle2 className="h-5 w-5" /> : <span className="font-bold">2</span>}
                </motion.div>
                <div>
                  <CardTitle className="text-base text-gray-900 dark:text-white">Gap Assessment 2</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-300">Current GFC vs FLU Procedures</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Badge variant={assessment2Result ? "default" : "outline"} className={!assessment2Result ? "border-gray-300 dark:border-white/30 text-gray-600 dark:text-gray-300" : ""}>
                {assessment2Result ? "Completed" : "Pending"}
              </Badge>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={shouldReduceMotion ? {} : staggerItem}>
          <Card className={`bg-white dark:bg-white/10 backdrop-blur-xl border border-gray-200/60 dark:border-white/20 shadow-md dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] ${canProceed ? "border-green-500" : ""}`}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <motion.div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    canProceed ? "bg-green-500/20 text-green-400" : "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-300"
                  }`}
                >
                  <CheckCircle2 className="h-5 w-5" />
                </motion.div>
                <div>
                  <CardTitle className="text-base text-gray-900 dark:text-white">Ready for Sampling</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-300">Review & proceed</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Badge variant={canProceed ? "default" : "outline"} className={!canProceed ? "border-gray-300 dark:border-white/30 text-gray-600 dark:text-gray-300" : ""}>
                {canProceed ? "Ready" : "Pending"}
              </Badge>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Main Content Tabs */}
      <motion.div
        initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
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
      </motion.div>

      {/* Navigation */}
      <motion.div
        initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-white/10"
      >
        <Link href={`/aic/audit-runs/${id}`}>
          <Button variant="outline" className="border-gray-200 dark:border-white/20 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 hover:border-gray-300 dark:hover:border-white/30">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Overview
          </Button>
        </Link>
        <Link href={`/aic/audit-runs/${id}/stage-2`}>
          <Button disabled={!canProceed}>
            Continue to Sampling
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}
