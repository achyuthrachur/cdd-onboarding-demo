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
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatMessage, MessageType } from "@/components/stage-1/chat-message";
import { toast } from "sonner";
import type { FLUExtractionResult, FLUProcedureDocument } from "@/lib/stage-data/store";
import {
  motion,
  AnimatePresence,
  chatMessage as chatMessageVariant,
  fadeInUp,
  scaleIn,
  useReducedMotion,
} from "@/lib/animations";

interface ChatMessageData {
  id: string;
  type: MessageType;
  content: string;
  timestamp: Date;
  documents?: Array<{ fileName: string; docType: string }>;
  isPrompt?: boolean;
}

interface FLUProcedureChatProps {
  onExtractionComplete: (result: FLUExtractionResult) => void;
  extractionResult: FLUExtractionResult | null;
  auditRunId: string;
}

// System prompt for display
const FLU_EXTRACTION_PROMPT = `You are a Financial Crimes Audit Test Designer specializing in CIP/CDD/EDD compliance testing.

**Your Task:** Extract testing attributes from FLU (Front Line Unit) Procedures organized by:

1. **CIP (Customer Identification Program)**
   - Name, DOB, Address, ID verification
   - Documentary & non-documentary methods

2. **CDD (Customer Due Diligence)**
   - Beneficial ownership identification
   - Nature/purpose of relationship
   - Risk rating, Sanctions, PEP screening

3. **EDD (Enhanced Due Diligence)**
   - Source of funds/wealth verification
   - Senior management approval
   - High-risk jurisdiction requirements

**For each attribute, I will extract:**
- Unique ID (CIP-001, CDD-001, EDD-001, etc.)
- Testing question (Verify/Confirm/Obtain...)
- All acceptable documents
- Risk scope (Base, EDD, or Both)`;

export function FLUProcedureChat({
  onExtractionComplete,
  extractionResult,
  auditRunId,
}: FLUProcedureChatProps) {
  const [selectedDoc, setSelectedDoc] = useState<FLUProcedureDocument | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [messages, setMessages] = useState<ChatMessageData[]>([
    {
      id: "welcome",
      type: "system",
      content: "Welcome to the FLU Procedure Extraction Assistant. I'll help you extract CIP, CDD, and EDD testing attributes from your Front Line Unit procedures. Upload or drag a procedure document to begin.",
      timestamp: new Date(),
    },
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "text/plain",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a PDF, Word document, or text file");
      return;
    }

    const doc: FLUProcedureDocument = {
      id: `flu-${Date.now()}`,
      fileName: file.name,
      docType: "flu_procedure",
      jurisdiction: null,
      uploadedAt: new Date().toISOString(),
    };

    setSelectedDoc(doc);

    addMessage({
      type: "user",
      content: `Uploaded FLU Procedure document: ${file.name}`,
      documents: [{ fileName: file.name, docType: "flu_procedure" }],
    });

    addMessage({
      type: "system",
      content: "Document received. Click 'Extract Attributes' to analyze the procedures and extract CIP, CDD, and EDD testing attributes.",
    });
  };

  const removeSelectedDoc = () => {
    if (selectedDoc) {
      addMessage({
        type: "user",
        content: `Removed document: ${selectedDoc.fileName}`,
      });
      setSelectedDoc(null);
    }
  };

  const runExtraction = async () => {
    if (!selectedDoc || isProcessing) return;

    setIsProcessing(true);

    // Show the prompt
    addMessage({
      type: "system",
      content: FLU_EXTRACTION_PROMPT,
      isPrompt: true,
    });

    // Add loading message
    const loadingMsgId = `loading-${Date.now()}`;
    setMessages(prev => [
      ...prev,
      {
        id: loadingMsgId,
        type: "loading",
        content: "Analyzing FLU procedures and extracting attributes...",
        timestamp: new Date(),
      },
    ]);

    try {
      // Call the FLU extraction API
      const response = await fetch("/api/ai/flu-extraction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auditRunId,
          sourceFileName: selectedDoc.fileName,
          // For demo, we'll use mock data
          useMock: true,
        }),
      });

      // Remove loading message
      setMessages(prev => prev.filter(m => m.id !== loadingMsgId));

      if (!response.ok) {
        throw new Error("Extraction failed");
      }

      const data = await response.json();
      const result: FLUExtractionResult = {
        id: data.id,
        workbook: data.result.workbook,
        tokensUsed: data.tokensUsed || 0,
      };

      // Count attributes by category
      const attributes = result.workbook.sheets.find(s => s.name === "Attributes")?.rows || [];
      const cipCount = attributes.filter(a => (a as unknown as Record<string, unknown>).Category === "CIP").length;
      const cddCount = attributes.filter(a => (a as unknown as Record<string, unknown>).Category === "CDD").length;
      const eddCount = attributes.filter(a => (a as unknown as Record<string, unknown>).Category === "EDD").length;
      const docsCount = result.workbook.sheets.find(s => s.name === "Acceptable_Docs")?.rows.length || 0;

      // Add success message
      addMessage({
        type: "assistant",
        content: `Extraction completed successfully!

**Attributes Extracted:**
- CIP (Customer Identification Program): ${cipCount} attributes
- CDD (Customer Due Diligence): ${cddCount} attributes
- EDD (Enhanced Due Diligence): ${eddCount} attributes
- Acceptable Documents: ${docsCount} total

Click the "Results" tab to view and export the extracted attributes.`,
      });

      // Notify parent
      onExtractionComplete(result);

      toast.success("FLU attribute extraction completed");

    } catch (error) {
      // Remove loading message
      setMessages(prev => prev.filter(m => m.id !== loadingMsgId));

      addMessage({
        type: "error",
        content: "Failed to extract attributes from FLU procedures. Please try again.",
      });

      console.error("Extraction error:", error);
      toast.error("Extraction failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
              <Bot className="h-5 w-5 text-green-600 dark:text-green-300" />
            </div>
            <div>
              <CardTitle className="text-lg">FLU Procedure Extraction</CardTitle>
              <CardDescription>AI-powered attribute extraction</CardDescription>
            </div>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={extractionResult ? "complete" : "ready"}
              initial={shouldReduceMotion ? undefined : { scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Badge variant={extractionResult ? "default" : "outline"} className="gap-1">
                {extractionResult && <CheckCircle2 className="h-3 w-3" />}
                {extractionResult ? "Extraction Complete" : "Ready"}
              </Badge>
            </motion.div>
          </AnimatePresence>
        </div>
      </CardHeader>

      {/* Chat Messages - Animated */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="divide-y">
          <AnimatePresence initial={false}>
            {messages.map((msg, index) => (
              <motion.div
                key={msg.id}
                initial={shouldReduceMotion ? undefined : "hidden"}
                animate="visible"
                variants={chatMessageVariant}
                transition={{ delay: index === messages.length - 1 ? 0 : 0 }}
              >
                <ChatMessage
                  type={msg.type}
                  content={msg.content}
                  timestamp={msg.timestamp}
                  documents={msg.documents}
                  isPrompt={msg.isPrompt}
                />
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={chatEndRef} />
        </div>
      </ScrollArea>

      <Separator />

      {/* Upload Zone & Actions */}
      <div className="p-4 flex-shrink-0">
        {/* Drop Zone - Animated */}
        <motion.div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !selectedDoc && fileInputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-lg p-4 mb-4 transition-colors cursor-pointer",
            isDragOver
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50",
            selectedDoc && "cursor-default"
          )}
          animate={isDragOver ? { scale: 1.02 } : { scale: 1 }}
          transition={{ duration: 0.15 }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc,.txt"
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="text-center">
            <AnimatePresence mode="wait">
              {selectedDoc ? (
                <motion.div
                  key="selected"
                  className="flex items-center justify-center gap-2"
                  initial={shouldReduceMotion ? undefined : { scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1.5 py-1.5 px-3"
                  >
                    <FileText className="h-3 w-3" />
                    {selectedDoc.fileName}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSelectedDoc();
                      }}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                </motion.div>
              ) : (
                <motion.div
                  key="upload"
                  initial={shouldReduceMotion ? undefined : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Drag & drop FLU Procedures document here, or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Supports PDF, Word (.docx), and text files
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Action Button */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {selectedDoc ? "Ready to extract attributes" : "No document selected"}
          </p>
          <motion.div
            whileHover={shouldReduceMotion ? undefined : { scale: 1.02 }}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
          >
            <Button
              onClick={runExtraction}
              disabled={!selectedDoc || isProcessing || !!extractionResult}
              className="gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Extracting...
                </>
              ) : extractionResult ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Extraction Complete
                </>
              ) : selectedDoc ? (
                <>
                  <Play className="h-4 w-4" />
                  Extract Attributes
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Upload Document to Start
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </div>
    </Card>
  );
}
