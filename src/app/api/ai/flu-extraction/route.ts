import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import {
  runAIAnalysis,
  getMockFLUExtractionResult,
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

    if (!auditRunId) {
      return NextResponse.json(
        { error: "Audit run ID is required" },
        { status: 400 }
      );
    }

    let result;
    let tokensUsed = 0;

    // Debug: Log whether API key is present (not the actual key!)
    console.log("OPENAI_API_KEY present:", !!process.env.OPENAI_API_KEY);
    console.log("useMock flag:", useMock);
    console.log("sourceFileName:", sourceFileName);

    if (useMock || !process.env.OPENAI_API_KEY) {
      // Use mock data for demo
      console.log("Using MOCK data - either useMock=true or no API key");
      result = {
        success: true,
        data: getMockFLUExtractionResult(),
      };
    } else {
      console.log("Using REAL OpenAI API for FLU extraction");

      if (!proceduresContent) {
        return NextResponse.json(
          { error: "FLU procedures content is required" },
          { status: 400 }
        );
      }

      // Run AI analysis with FLU extraction prompt
      const userPrompt = buildFLUExtractionPrompt(proceduresContent, sourceFileName);

      result = await runAIAnalysis(
        FLU_PROCEDURE_EXTRACTION_SYSTEM_PROMPT,
        userPrompt,
        {
          model: "gpt-4-turbo-preview",
          temperature: 0.1,
          maxTokens: 8192, // Larger output for comprehensive extraction
        }
      );

      if (result.usage) {
        tokensUsed = result.usage.totalTokens;
      }
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "FLU extraction failed" },
        { status: 500 }
      );
    }

    // Store the result
    const id = uuidv4();
    const extractionResult = {
      id,
      auditRunId,
      sourceFileName,
      result: result.data,
      tokensUsed,
      createdAt: new Date().toISOString(),
    };

    fluExtractionStore.set(id, extractionResult);

    return NextResponse.json({
      id,
      result: result.data,
      tokensUsed,
    });
  } catch (error) {
    console.error("FLU extraction error:", error);
    return NextResponse.json(
      { error: "Failed to run FLU extraction" },
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
