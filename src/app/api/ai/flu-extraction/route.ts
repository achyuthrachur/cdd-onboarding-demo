import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import {
  runAIAnalysis,
  getMockFLUExtractionResult,
  isAIConfigured,
} from "@/lib/ai/client";
import {
  FLU_PROCEDURE_EXTRACTION_SYSTEM_PROMPT,
  buildFLUExtractionPrompt,
} from "@/lib/ai/prompts";

// In-memory store for FLU extraction results
const fluExtractionStore: Map<string, {
  id: string;
  auditRunId: string;
  sourceFileName: string;
  result: unknown;
  tokensUsed: number;
  demoMode: boolean;
  createdAt: string;
}> = new Map();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      auditRunId,
      proceduresContent,
      sourceFileName = "FLU_Procedures.docx",
      useMock = false,
    } = body;

    console.log("[FLU-API] ========================================");
    console.log("[FLU-API] POST request received");
    console.log(`[FLU-API] Audit Run ID: ${auditRunId}`);
    console.log(`[FLU-API] Source file: ${sourceFileName}`);
    console.log(`[FLU-API] useMock flag: ${useMock}`);
    console.log(`[FLU-API] Content provided: ${!!proceduresContent}`);
    console.log(`[FLU-API] Content length: ${proceduresContent?.length || 0} chars`);

    if (!auditRunId) {
      console.error("[FLU-API] Missing audit run ID");
      return NextResponse.json(
        { error: "Audit run ID is required" },
        { status: 400 }
      );
    }

    // Check AI configuration
    const aiConfig = isAIConfigured();
    console.log(`[FLU-API] AI configured: ${aiConfig.configured}`);
    console.log(`[FLU-API] AI provider: ${aiConfig.provider || 'none'}`);

    let result;
    let tokensUsed = 0;
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

      console.log(`[FLU-API] Using DEMO MODE - Reason: ${reason}`);

      result = {
        success: true,
        demoMode: true,
        data: getMockFLUExtractionResult(),
      };

      console.log("[FLU-API] Mock data loaded successfully");
    } else {
      console.log("[FLU-API] Using REAL AI for FLU extraction");

      // Run AI analysis with FLU extraction prompt
      const userPrompt = buildFLUExtractionPrompt(proceduresContent, sourceFileName);
      console.log(`[FLU-API] Built user prompt: ${userPrompt.length} chars`);

      result = await runAIAnalysis(
        FLU_PROCEDURE_EXTRACTION_SYSTEM_PROMPT,
        userPrompt,
        {
          model: "gpt-4-turbo-preview",
          temperature: 0.1,
          maxTokens: 8192, // Larger output for comprehensive extraction
        }
      );

      // Check if AI returned demo mode flag (e.g., due to auth failure)
      if (result.demoMode) {
        console.log("[FLU-API] AI analysis returned demoMode flag, falling back to mock data");
        demoMode = true;
        result = {
          success: true,
          demoMode: true,
          data: getMockFLUExtractionResult(),
        };
      } else if (result.usage) {
        tokensUsed = result.usage.totalTokens;
      }
    }

    if (!result.success) {
      console.error(`[FLU-API] Extraction failed: ${result.error}`);

      // Even on failure, provide demo data if client-side error handling requests it
      if (result.demoMode) {
        console.log("[FLU-API] Falling back to demo data after failure");
        result = {
          success: true,
          demoMode: true,
          data: getMockFLUExtractionResult(),
        };
        demoMode = true;
      } else {
        return NextResponse.json(
          { error: result.error || "FLU extraction failed", demoMode: false },
          { status: 500 }
        );
      }
    }

    // Store the result
    const id = uuidv4();
    const extractionResult = {
      id,
      auditRunId,
      sourceFileName,
      result: result.data,
      tokensUsed,
      demoMode,
      createdAt: new Date().toISOString(),
    };

    fluExtractionStore.set(id, extractionResult);

    console.log(`[FLU-API] Extraction result stored with ID: ${id}`);
    console.log(`[FLU-API] Demo mode: ${demoMode}`);
    console.log(`[FLU-API] Tokens used: ${tokensUsed}`);
    console.log("[FLU-API] ========================================");

    return NextResponse.json({
      id,
      result: result.data,
      tokensUsed,
      demoMode,
    });
  } catch (error) {
    console.error("[FLU-API] ========================================");
    console.error("[FLU-API] Unhandled error:", error);
    console.error("[FLU-API] ========================================");

    return NextResponse.json(
      { error: "Failed to run FLU extraction", demoMode: false },
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
      const result = fluExtractionStore.get(id);
      if (!result) {
        return NextResponse.json(
          { error: "Result not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(result);
    }

    let results = Array.from(fluExtractionStore.values());

    if (auditRunId) {
      results = results.filter(
        (r) => r.auditRunId === auditRunId
      );
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error fetching FLU extraction results:", error);
    return NextResponse.json(
      { error: "Failed to fetch results" },
      { status: 500 }
    );
  }
}
