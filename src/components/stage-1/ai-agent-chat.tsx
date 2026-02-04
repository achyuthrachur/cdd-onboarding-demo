"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Bot,
  FileText,
  Play,
  Upload,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DocumentCard } from "./document-card";
import { ChatMessage, MessageType } from "./chat-message";
import { toast } from "sonner";

interface Document {
  id: string;
  fileName: string;
  docType: string;
  jurisdiction: string | null;
  fileUrl?: string;
}

interface ChatMessageData {
  id: string;
  type: MessageType;
  content: string;
  timestamp: Date;
  documents?: Array<{ fileName: string; docType: string }>;
  isPrompt?: boolean;
}

interface GapAssessmentResult {
  workbook: {
    sheets: Array<{
      name: string;
      rows: Array<Record<string, unknown>>;
    }>;
  };
}

interface AIAgentChatProps {
  documents: Document[];
  onAssessment1Complete: (result: GapAssessmentResult) => void;
  onAssessment2Complete: (result: GapAssessmentResult) => void;
  assessment1Result: GapAssessmentResult | null;
  assessment2Result: GapAssessmentResult | null;
}

// System prompts for display
const ASSESSMENT_1_PROMPT = `You are an expert compliance analyst. Your task is to compare two versions of Global Financial Standards documents and identify changes between them.

**Document A:** Old Global Financial Standards (Previous Version)
**Document B:** Current Global Financial Standards (New Version)

For each requirement in Document A, determine if Document B:
• UNCHANGED - The requirement exists in both versions with no significant changes
• MODIFIED - The requirement exists in both but has been updated or clarified
• REMOVED - The requirement from Document A is no longer in Document B
• NEW - A requirement in Document B that didn't exist in Document A

Output your analysis in a structured format with:
1. Requirement ID/Section
2. Change Type (UNCHANGED/MODIFIED/REMOVED/NEW)
3. Description of Change
4. Impact Assessment (High/Medium/Low)`;

const ASSESSMENT_2_PROMPT = `You are an expert compliance analyst. Your task is to compare the Current Global Financial Standards against the FLU (First Line Unit) Procedures and identify any gaps.

**Document A:** Current Global Financial Standards (Required Controls)
**Document B:** FLU Procedures (Implemented Controls)

For each requirement in the Global Standards, determine if the FLU Procedures:
• MET - The FLU procedures fully address the requirement
• PARTIALLY MET - The FLU procedures partially address the requirement
• GAP - The FLU procedures do not address the requirement
• ENHANCED - The FLU procedures exceed the requirement

Output your analysis in a structured format with:
1. Requirement ID/Section from Standards
2. FLU Procedure Reference (if applicable)
3. Gap Status (MET/PARTIALLY MET/GAP/ENHANCED)
4. Gap Description
5. Remediation Recommendation (if gap exists)`;

export function AIAgentChat({
  documents,
  onAssessment1Complete,
  onAssessment2Complete,
  assessment1Result,
  assessment2Result,
}: AIAgentChatProps) {
  const [selectedDocs, setSelectedDocs] = useState<Document[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [messages, setMessages] = useState<ChatMessageData[]>([
    {
      id: "welcome",
      type: "system",
      content: "Welcome to the Gap Assessment Assistant. I'll help you analyze compliance documents. Start by dragging documents from the left panel to begin.",
      timestamp: new Date(),
    },
  ]);
  const [currentAssessment, setCurrentAssessment] = useState<1 | 2 | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [draggingDocId, setDraggingDocId] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Determine which assessment is ready based on selected documents
  const getReadyAssessment = (): 1 | 2 | null => {
    if (selectedDocs.length !== 2) return null;

    const hasOldGFC = selectedDocs.some(d => d.docType === "global_std_old");
    const hasNewGFC = selectedDocs.some(d => d.docType === "global_std_new");
    const hasFLU = selectedDocs.some(d => d.docType === "flu_jurisdiction");

    if (hasOldGFC && hasNewGFC && !assessment1Result) return 1;
    if (hasNewGFC && hasFLU && assessment1Result && !assessment2Result) return 2;
    if (hasNewGFC && hasFLU && !assessment2Result) return 2;

    return null;
  };

  const readyAssessment = getReadyAssessment();

  const handleDragStart = (e: React.DragEvent, doc: Document) => {
    e.dataTransfer.setData("application/json", JSON.stringify(doc));
    e.dataTransfer.effectAllowed = "copy";
    setDraggingDocId(doc.id);
  };

  const handleDragEnd = () => {
    setDraggingDocId(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    try {
      const docData = JSON.parse(e.dataTransfer.getData("application/json")) as Document;

      // Check if already selected
      if (selectedDocs.some(d => d.id === docData.id)) {
        toast.info("Document already attached");
        return;
      }

      // Max 2 documents at a time
      if (selectedDocs.length >= 2) {
        toast.warning("Maximum 2 documents can be selected. Remove one first.");
        return;
      }

      setSelectedDocs(prev => [...prev, docData]);

      // Add user message
      addMessage({
        type: "user",
        content: `Attached document: ${docData.fileName}`,
        documents: [{ fileName: docData.fileName, docType: docData.docType }],
      });

    } catch (error) {
      console.error("Drop error:", error);
    }
  };

  const addMessage = (msg: Omit<ChatMessageData, "id" | "timestamp">) => {
    setMessages(prev => [
      ...prev,
      {
        ...msg,
        id: `msg-${Date.now()}`,
        timestamp: new Date(),
      },
    ]);
  };

  const removeSelectedDoc = (docId: string) => {
    const doc = selectedDocs.find(d => d.id === docId);
    setSelectedDocs(prev => prev.filter(d => d.id !== docId));
    if (doc) {
      addMessage({
        type: "user",
        content: `Removed document: ${doc.fileName}`,
      });
    }
  };

  const showPrompt = (assessmentNum: 1 | 2) => {
    const prompt = assessmentNum === 1 ? ASSESSMENT_1_PROMPT : ASSESSMENT_2_PROMPT;
    addMessage({
      type: "system",
      content: prompt,
      isPrompt: true,
    });
    setCurrentAssessment(assessmentNum);
  };

  const runAssessment = async () => {
    if (!readyAssessment || isProcessing) return;

    setIsProcessing(true);

    // Show the prompt first
    showPrompt(readyAssessment);

    // Add loading message
    const loadingMsgId = `loading-${Date.now()}`;
    setMessages(prev => [
      ...prev,
      {
        id: loadingMsgId,
        type: "loading",
        content: "Analyzing documents...",
        timestamp: new Date(),
      },
    ]);

    try {
      // Extract text from documents
      const docContents: Record<string, string> = {};

      for (const doc of selectedDocs) {
        if (doc.fileUrl) {
          const extractRes = await fetch("/api/documents/extract", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fileUrl: doc.fileUrl,
              fileName: doc.fileName,
            }),
          });

          if (extractRes.ok) {
            const data = await extractRes.json();
            docContents[doc.docType] = data.text;
          }
        }
      }

      // Run gap assessment
      const assessmentRes = await fetch("/api/ai/gap-assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auditRunId: "demo",
          assessmentType: readyAssessment === 1 ? "standards_comparison" : "standards_vs_flu",
          standardsContent: readyAssessment === 1
            ? docContents["global_std_old"]
            : docContents["global_std_new"],
          proceduresContent: readyAssessment === 1
            ? docContents["global_std_new"]
            : docContents["flu_jurisdiction"],
        }),
      });

      // Remove loading message
      setMessages(prev => prev.filter(m => m.id !== loadingMsgId));

      if (!assessmentRes.ok) {
        throw new Error("Assessment failed");
      }

      const result = await assessmentRes.json();

      // Add success message
      addMessage({
        type: "assistant",
        content: `Gap Assessment ${readyAssessment} completed successfully! Found ${
          result.result?.workbook?.sheets?.find((s: { name: string }) => s.name === "Gap_Details")?.rows?.length || 0
        } items to review. Check the Results tab for details.`,
      });

      // Notify parent
      if (readyAssessment === 1) {
        onAssessment1Complete(result.result);
      } else {
        onAssessment2Complete(result.result);
      }

      // Clear selected docs for next assessment
      setSelectedDocs([]);
      setCurrentAssessment(null);

      toast.success(`Gap Assessment ${readyAssessment} completed`);

    } catch (error) {
      // Remove loading message
      setMessages(prev => prev.filter(m => m.id !== loadingMsgId));

      addMessage({
        type: "error",
        content: `Failed to run Gap Assessment ${readyAssessment}. Please try again.`,
      });

      console.error("Assessment error:", error);
      toast.error("Assessment failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const getAssessmentInstructions = () => {
    if (assessment1Result && assessment2Result) {
      return "Both assessments complete! Review results in the tabs above.";
    }
    if (!assessment1Result) {
      return "Step 1: Drag 'Old Global Standards' and 'Current Global Standards' here to run Gap Assessment 1.";
    }
    return "Step 2: Drag 'Current Global Standards' and 'FLU Procedures' here to run Gap Assessment 2.";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Panel - Documents */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5" />
            Documents
          </CardTitle>
          <CardDescription>
            Drag documents to the chat panel to attach them
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {documents.map((doc) => (
            <DocumentCard
              key={doc.id}
              id={doc.id}
              fileName={doc.fileName}
              docType={doc.docType}
              jurisdiction={doc.jurisdiction}
              isDragging={draggingDocId === doc.id}
              isSelected={selectedDocs.some(d => d.id === doc.id)}
              onDragStart={(e) => handleDragStart(e, doc)}
              onDragEnd={handleDragEnd}
            />
          ))}
          {documents.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No documents uploaded</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Right Panel - Chat Interface */}
      <Card className="lg:col-span-2">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900">
                <Bot className="h-5 w-5 text-purple-600 dark:text-purple-300" />
              </div>
              <div>
                <CardTitle className="text-lg">Gap Assessment Assistant</CardTitle>
                <CardDescription>AI-powered document analysis</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={assessment1Result ? "default" : "outline"} className="gap-1">
                {assessment1Result && <CheckCircle2 className="h-3 w-3" />}
                Assessment 1
              </Badge>
              <Badge variant={assessment2Result ? "default" : "outline"} className="gap-1">
                {assessment2Result && <CheckCircle2 className="h-3 w-3" />}
                Assessment 2
              </Badge>
            </div>
          </div>
        </CardHeader>

        {/* Chat Messages */}
        <ScrollArea className="h-[400px]">
          <div className="divide-y">
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                type={msg.type}
                content={msg.content}
                timestamp={msg.timestamp}
                documents={msg.documents}
                isPrompt={msg.isPrompt}
              />
            ))}
            <div ref={chatEndRef} />
          </div>
        </ScrollArea>

        <Separator />

        {/* Drop Zone & Actions */}
        <div className="p-4">
          {/* Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "border-2 border-dashed rounded-lg p-4 mb-4 transition-colors",
              isDragOver
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-muted-foreground/50",
              selectedDocs.length >= 2 && "opacity-50"
            )}
          >
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                {getAssessmentInstructions()}
              </p>
              {selectedDocs.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center mt-3">
                  {selectedDocs.map((doc) => (
                    <Badge
                      key={doc.id}
                      variant="secondary"
                      className="flex items-center gap-1.5 py-1.5 px-3 cursor-pointer hover:bg-destructive/10"
                      onClick={() => removeSelectedDoc(doc.id)}
                    >
                      <FileText className="h-3 w-3" />
                      {doc.fileName}
                      <span className="text-xs ml-1">&times;</span>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action Button */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {selectedDocs.length}/2 documents selected
            </p>
            <Button
              onClick={runAssessment}
              disabled={!readyAssessment || isProcessing}
              className="gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : readyAssessment ? (
                <>
                  <Play className="h-4 w-4" />
                  Run Gap Assessment {readyAssessment}
                </>
              ) : assessment1Result && assessment2Result ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  All Assessments Complete
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Select Documents to Start
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
