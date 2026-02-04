import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import {
  runAIAnalysis,
  getMockGapAssessmentResult,
} from "@/lib/ai/client";
import {
  GAP_ASSESSMENT_SYSTEM_PROMPT,
  buildGapAssessmentPrompt,
} from "@/lib/ai/prompts";

// In-memory store for demo
const stage1ResultsStore: Map<string, {
  id: string;
  auditRunId: string;
  jurisdiction: string | null;
  comparisonType: string;
  gapsJson: unknown;
  attributesJson: unknown | null;
  notes: string | null;
  version: number;
  status: string;
  createdAt: string;
}> = new Map();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      auditRunId,
      standardsContent,
      proceduresContent,
      jurisdiction,
      useMock = false,
    } = body;

    if (!auditRunId) {
      return NextResponse.json(
        { error: "Audit run ID is required" },
        { status: 400 }
      );
    }

    let result;

    // Debug: Log whether API key is present (not the actual key!)
    console.log("OPENAI_API_KEY present:", !!process.env.OPENAI_API_KEY);
    console.log("useMock flag:", useMock);

    if (useMock || !process.env.OPENAI_API_KEY) {
      // Use mock data for demo
      console.log("Using MOCK data - either useMock=true or no API key");
      result = {
        success: true,
        data: getMockGapAssessmentResult(),
      };
    } else {
      console.log("Using REAL OpenAI API");
      if (!standardsContent || !proceduresContent) {
        return NextResponse.json(
          { error: "Both standards and procedures content are required" },
          { status: 400 }
        );
      }

      // Run AI analysis
      const userPrompt = buildGapAssessmentPrompt(
        standardsContent,
        proceduresContent
      );

      result = await runAIAnalysis(
        GAP_ASSESSMENT_SYSTEM_PROMPT,
        userPrompt,
        {
          model: "gpt-4-turbo-preview",
          temperature: 0.1,
          maxTokens: 4096,
        }
      );
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "AI analysis failed" },
        { status: 500 }
      );
    }

    // Store the result
    const id = uuidv4();
    const stage1Result = {
      id,
      auditRunId,
      jurisdiction: jurisdiction || null,
      comparisonType: "std_vs_flu",
      gapsJson: result.data,
      attributesJson: null,
      notes: null,
      version: 1,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    stage1ResultsStore.set(id, stage1Result);

    return NextResponse.json({
      id,
      result: result.data,
      usage: result.usage,
    });
  } catch (error) {
    console.error("Gap assessment error:", error);
    return NextResponse.json(
      { error: "Failed to run gap assessment" },
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
        (r) => r.auditRunId === auditRunId && r.gapsJson !== null
      );
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error fetching gap assessment results:", error);
    return NextResponse.json(
      { error: "Failed to fetch results" },
      { status: 500 }
    );
  }
}
