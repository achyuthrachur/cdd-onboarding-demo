import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import {
  runAIAnalysis,
  getMockGapAssessmentResult,
  getMockStandardsComparisonResult,
  isAIConfigured,
} from "@/lib/ai/client";
import {
  GAP_ASSESSMENT_SYSTEM_PROMPT,
  STANDARDS_COMPARISON_SYSTEM_PROMPT,
  buildGapAssessmentPrompt,
  buildStandardsComparisonPrompt,
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
  demoMode: boolean;
  createdAt: string;
}> = new Map();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      auditRunId,
      standardsContent,
      proceduresContent,
      assessmentType = "standards_vs_flu", // "standards_comparison" | "standards_vs_flu"
      jurisdiction,
      useMock = false,
    } = body;

    console.log("[GAP-API] ========================================");
    console.log("[GAP-API] POST request received");
    console.log(`[GAP-API] Audit Run ID: ${auditRunId}`);
    console.log(`[GAP-API] Assessment type: ${assessmentType}`);
    console.log(`[GAP-API] Jurisdiction: ${jurisdiction || 'not specified'}`);
    console.log(`[GAP-API] useMock flag: ${useMock}`);
    console.log(`[GAP-API] Standards content provided: ${!!standardsContent}`);
    console.log(`[GAP-API] Procedures content provided: ${!!proceduresContent}`);

    if (!auditRunId) {
      console.error("[GAP-API] Missing audit run ID");
      return NextResponse.json(
        { error: "Audit run ID is required" },
        { status: 400 }
      );
    }

    // Check AI configuration
    const aiConfig = isAIConfigured();
    console.log(`[GAP-API] AI configured: ${aiConfig.configured}`);
    console.log(`[GAP-API] AI provider: ${aiConfig.provider || 'none'}`);

    let result;
    let demoMode = false;
    const isStandardsComparison = assessmentType === "standards_comparison";
    const hasContent = standardsContent && proceduresContent;

    // Determine if we should use mock data
    const shouldUseMock = useMock || !aiConfig.configured || !hasContent;

    if (shouldUseMock) {
      demoMode = true;
      const reason = useMock
        ? "useMock flag set to true"
        : !aiConfig.configured
          ? "No AI API key configured"
          : "Document content not provided";

      console.log(`[GAP-API] Using DEMO MODE - Reason: ${reason}`);

      result = {
        success: true,
        demoMode: true,
        data: isStandardsComparison
          ? getMockStandardsComparisonResult()
          : getMockGapAssessmentResult(),
      };

      console.log(`[GAP-API] Mock ${isStandardsComparison ? 'comparison' : 'gap assessment'} data loaded`);
    } else {
      console.log("[GAP-API] Using REAL AI for gap assessment");

      // Run AI analysis with appropriate prompt based on assessment type
      const systemPrompt = isStandardsComparison
        ? STANDARDS_COMPARISON_SYSTEM_PROMPT
        : GAP_ASSESSMENT_SYSTEM_PROMPT;

      const userPrompt = isStandardsComparison
        ? buildStandardsComparisonPrompt(standardsContent, proceduresContent)
        : buildGapAssessmentPrompt(standardsContent, proceduresContent);

      console.log(`[GAP-API] System prompt type: ${isStandardsComparison ? 'comparison' : 'gap assessment'}`);
      console.log(`[GAP-API] User prompt length: ${userPrompt.length} chars`);

      result = await runAIAnalysis(
        systemPrompt,
        userPrompt,
        {
          model: "gpt-4-turbo-preview",
          temperature: 0.1,
          maxTokens: 4096,
        }
      );

      // Check if AI returned demo mode flag (e.g., due to auth failure)
      if (result.demoMode) {
        console.log("[GAP-API] AI analysis returned demoMode flag, falling back to mock data");
        demoMode = true;
        result = {
          success: true,
          demoMode: true,
          data: isStandardsComparison
            ? getMockStandardsComparisonResult()
            : getMockGapAssessmentResult(),
        };
      }
    }

    if (!result.success) {
      console.error(`[GAP-API] Analysis failed: ${result.error}`);

      // Fall back to demo data if flagged
      if (result.demoMode) {
        console.log("[GAP-API] Falling back to demo data after failure");
        result = {
          success: true,
          demoMode: true,
          data: isStandardsComparison
            ? getMockStandardsComparisonResult()
            : getMockGapAssessmentResult(),
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
      comparisonType: isStandardsComparison ? "standards_comparison" : "std_vs_flu",
      gapsJson: result.data,
      attributesJson: null,
      notes: null,
      version: 1,
      status: "pending",
      demoMode,
      createdAt: new Date().toISOString(),
    };

    stage1ResultsStore.set(id, stage1Result);

    console.log(`[GAP-API] Result stored with ID: ${id}`);
    console.log(`[GAP-API] Demo mode: ${demoMode}`);
    console.log("[GAP-API] ========================================");

    return NextResponse.json({
      id,
      result: result.data,
      usage: result.usage,
      demoMode,
    });
  } catch (error) {
    console.error("[GAP-API] ========================================");
    console.error("[GAP-API] Unhandled error:", error);
    console.error("[GAP-API] ========================================");

    return NextResponse.json(
      { error: "Failed to run gap assessment", demoMode: false },
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
