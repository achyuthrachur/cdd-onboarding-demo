import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import {
  runAIAnalysis,
  getMockAttributeExtractionResult,
  isAIConfigured,
} from "@/lib/ai/client";
import {
  ATTRIBUTE_EXTRACTION_SYSTEM_PROMPT,
  buildAttributeExtractionPrompt,
} from "@/lib/ai/prompts";

// In-memory store for demo
const stage1ResultsStore: Map<string, {
  id: string;
  auditRunId: string;
  jurisdiction: string | null;
  comparisonType: string;
  gapsJson: unknown | null;
  attributesJson: unknown;
  notes: string | null;
  version: number;
  status: string;
  demoMode: boolean;
  createdAt: string;
}> = new Map();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      auditRunId,
      proceduresContent,
      sourceFileName,
      jurisdiction,
      useMock = false,
    } = body;

    console.log("[ATTR-API] ========================================");
    console.log("[ATTR-API] POST request received");
    console.log(`[ATTR-API] Audit Run ID: ${auditRunId}`);
    console.log(`[ATTR-API] Source file: ${sourceFileName || 'not specified'}`);
    console.log(`[ATTR-API] Jurisdiction: ${jurisdiction || 'not specified'}`);
    console.log(`[ATTR-API] useMock flag: ${useMock}`);
    console.log(`[ATTR-API] Content provided: ${!!proceduresContent}`);
    console.log(`[ATTR-API] Content length: ${proceduresContent?.length || 0} chars`);

    if (!auditRunId) {
      console.error("[ATTR-API] Missing audit run ID");
      return NextResponse.json(
        { error: "Audit run ID is required" },
        { status: 400 }
      );
    }

    // Check AI configuration
    const aiConfig = isAIConfigured();
    console.log(`[ATTR-API] AI configured: ${aiConfig.configured}`);
    console.log(`[ATTR-API] AI provider: ${aiConfig.provider || 'none'}`);

    let result;
    let demoMode = false;

    // Determine if we should use mock data
    const shouldUseMock = useMock || !aiConfig.configured || !proceduresContent;

    if (shouldUseMock) {
      demoMode = true;
      const reason = useMock
        ? "useMock flag set to true"
        : !aiConfig.configured
          ? "No AI API key configured"
          : "No procedures content provided";

      console.log(`[ATTR-API] Using DEMO MODE - Reason: ${reason}`);

      result = {
        success: true,
        demoMode: true,
        data: getMockAttributeExtractionResult(),
      };

      console.log("[ATTR-API] Mock attribute extraction data loaded");
    } else {
      console.log("[ATTR-API] Using REAL AI for attribute extraction");

      // Run AI analysis
      const userPrompt = buildAttributeExtractionPrompt(
        proceduresContent,
        sourceFileName || "Unknown"
      );

      console.log(`[ATTR-API] User prompt length: ${userPrompt.length} chars`);

      result = await runAIAnalysis(
        ATTRIBUTE_EXTRACTION_SYSTEM_PROMPT,
        userPrompt,
        {
          model: "gpt-4-turbo",
          temperature: 0.1,
          maxTokens: 4096,
        }
      );

      // Check if AI returned demo mode flag (e.g., due to auth failure)
      if (result.demoMode) {
        console.log("[ATTR-API] AI analysis returned demoMode flag, falling back to mock data");
        demoMode = true;
        result = {
          success: true,
          demoMode: true,
          data: getMockAttributeExtractionResult(),
        };
      }
    }

    if (!result.success) {
      console.error(`[ATTR-API] Extraction failed: ${result.error}`);

      // Fall back to demo data if flagged
      if (result.demoMode) {
        console.log("[ATTR-API] Falling back to demo data after failure");
        result = {
          success: true,
          demoMode: true,
          data: getMockAttributeExtractionResult(),
        };
        demoMode = true;
      } else {
        return NextResponse.json(
          { error: result.error || "AI analysis failed", demoMode: false },
          { status: 500 }
        );
      }
    }

    // Store the result
    const id = uuidv4();
    const stage1Result = {
      id,
      auditRunId,
      jurisdiction: jurisdiction || null,
      comparisonType: "attribute_extraction",
      gapsJson: null,
      attributesJson: result.data,
      notes: null,
      version: 1,
      status: "pending",
      demoMode,
      createdAt: new Date().toISOString(),
    };

    stage1ResultsStore.set(id, stage1Result);

    console.log(`[ATTR-API] Result stored with ID: ${id}`);
    console.log(`[ATTR-API] Demo mode: ${demoMode}`);
    console.log("[ATTR-API] ========================================");

    return NextResponse.json({
      id,
      result: result.data,
      usage: result.usage,
      demoMode,
    });
  } catch (error) {
    console.error("[ATTR-API] ========================================");
    console.error("[ATTR-API] Unhandled error:", error);
    console.error("[ATTR-API] ========================================");

    return NextResponse.json(
      { error: "Failed to run attribute extraction", demoMode: false },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const auditRunId = searchParams.get("auditRunId");
    const id = searchParams.get("id");

    if (id) {
      const result = stage1ResultsStore.get(id);
      if (!result) {
        return NextResponse.json(
          { error: "Result not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(result);
    }

    let results = Array.from(stage1ResultsStore.values());

    if (auditRunId) {
      results = results.filter(
        (r) => r.auditRunId === auditRunId && r.attributesJson !== null
      );
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error fetching attribute extraction results:", error);
    return NextResponse.json(
      { error: "Failed to fetch results" },
      { status: 500 }
    );
  }
}
