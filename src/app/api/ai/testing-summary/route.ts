import { NextRequest, NextResponse } from "next/server";
import {
  generateTestingSummary,
  TestingSummaryInput,
  getDemoTestingSummary,
} from "@/lib/ai/testing-summary";
import { isAIConfigured } from "@/lib/ai/client";

// In-memory store for testing summaries
const testingSummaryStore: Map<
  string,
  {
    id: string;
    auditRunId: string;
    summary: string;
    tokensUsed: number;
    demoMode: boolean;
    createdAt: string;
  }
> = new Map();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { input, useMock = false } = body as {
      input: TestingSummaryInput;
      useMock?: boolean;
    };

    console.log("[TestingSummary-API] ========================================");
    console.log("[TestingSummary-API] POST request received");
    console.log(`[TestingSummary-API] Audit Run ID: ${input?.auditRunId}`);
    console.log(`[TestingSummary-API] Total entities: ${input?.totalEntities}`);
    console.log(`[TestingSummary-API] useMock flag: ${useMock}`);

    if (!input || !input.auditRunId) {
      console.error("[TestingSummary-API] Missing required input");
      return NextResponse.json(
        { error: "Testing summary input is required" },
        { status: 400 }
      );
    }

    // Check AI configuration
    const aiConfig = isAIConfigured();
    console.log(`[TestingSummary-API] AI configured: ${aiConfig.configured}`);
    console.log(`[TestingSummary-API] AI provider: ${aiConfig.provider || "none"}`);

    let summary: string;
    let tokensUsed = 0;
    let demoMode = false;

    // Determine if we should use mock data
    const shouldUseMock = useMock || !aiConfig.configured;

    if (shouldUseMock) {
      demoMode = true;
      const reason = useMock
        ? "useMock flag set to true"
        : "No AI API key configured";

      console.log(`[TestingSummary-API] Using DEMO MODE - Reason: ${reason}`);
      summary = getDemoTestingSummary(input);
      console.log("[TestingSummary-API] Demo summary generated successfully");
    } else {
      console.log("[TestingSummary-API] Using REAL AI for summary generation");

      const result = await generateTestingSummary(input);

      if (!result.success || !result.summary) {
        console.error(`[TestingSummary-API] Generation failed: ${result.error}`);

        // Fall back to demo mode
        demoMode = true;
        summary = getDemoTestingSummary(input);
        console.log("[TestingSummary-API] Falling back to demo summary");
      } else {
        demoMode = result.demoMode || false;
        summary = result.summary;
        tokensUsed = result.tokensUsed || 0;
      }
    }

    // Store the result
    const id = `SUMMARY-${input.auditRunId}-${Date.now()}`;
    const summaryResult = {
      id,
      auditRunId: input.auditRunId,
      summary,
      tokensUsed,
      demoMode,
      createdAt: new Date().toISOString(),
    };

    testingSummaryStore.set(id, summaryResult);

    console.log(`[TestingSummary-API] Summary stored with ID: ${id}`);
    console.log(`[TestingSummary-API] Demo mode: ${demoMode}`);
    console.log(`[TestingSummary-API] Tokens used: ${tokensUsed}`);
    console.log(`[TestingSummary-API] Summary length: ${summary.length} chars`);
    console.log("[TestingSummary-API] ========================================");

    return NextResponse.json({
      id,
      summary,
      tokensUsed,
      demoMode,
    });
  } catch (error) {
    console.error("[TestingSummary-API] ========================================");
    console.error("[TestingSummary-API] Unhandled error:", error);
    console.error("[TestingSummary-API] ========================================");

    return NextResponse.json(
      {
        error: "Failed to generate testing summary",
        details: error instanceof Error ? error.message : "Unknown error",
      },
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
      const result = testingSummaryStore.get(id);
      if (!result) {
        return NextResponse.json(
          { error: "Summary not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(result);
    }

    let results = Array.from(testingSummaryStore.values());

    if (auditRunId) {
      results = results.filter((r) => r.auditRunId === auditRunId);
    }

    // Return most recent first
    results.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error fetching testing summaries:", error);
    return NextResponse.json(
      { error: "Failed to fetch summaries" },
      { status: 500 }
    );
  }
}
