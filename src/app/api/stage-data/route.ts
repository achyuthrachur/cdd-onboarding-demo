import { NextRequest, NextResponse } from "next/server";

// In-memory storage for server-side stage data (in production, use a database)
const stageDataStore: Map<string, Record<string, unknown>> = new Map();

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const auditRunId = searchParams.get("auditRunId");
  const stage = searchParams.get("stage");
  const key = searchParams.get("key");

  if (!auditRunId) {
    return NextResponse.json(
      { error: "auditRunId is required" },
      { status: 400 }
    );
  }

  const storeKey = `${auditRunId}`;
  const storeData = stageDataStore.get(storeKey) || {};

  if (key) {
    // Return specific key
    return NextResponse.json({ [key]: storeData[key] || null });
  }

  if (stage) {
    // Return all data for a specific stage
    const stageKeys: Record<string, string[]> = {
      "1": ["gapAssessment1", "gapAssessment2", "combinedGaps"],
      "2": ["population", "samplingConfig", "samplingResult"],
      "3": ["extractedAttributes", "attributeExtractionComplete"],
      "4": ["workbookState", "generatedWorkbooks"],
      "5": ["testResults", "testingProgress"],
      "6": ["consolidatedReport"],
    };

    const keysForStage = stageKeys[stage] || [];
    const result: Record<string, unknown> = {};
    keysForStage.forEach((k) => {
      if (storeData[k]) {
        result[k] = storeData[k];
      }
    });

    return NextResponse.json(result);
  }

  // Return all data
  return NextResponse.json(storeData);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { auditRunId, key, value, action } = body;

    if (!auditRunId) {
      return NextResponse.json(
        { error: "auditRunId is required" },
        { status: 400 }
      );
    }

    const storeKey = `${auditRunId}`;

    // Handle load-fallback action
    if (action === "load-fallback") {
      const { stage } = body;
      if (!stage) {
        return NextResponse.json(
          { error: "stage is required for load-fallback action" },
          { status: 400 }
        );
      }

      // Import fallback data dynamically
      const { loadFallbackDataForStage } = await import("@/lib/stage-data");
      loadFallbackDataForStage(stage);

      return NextResponse.json({
        success: true,
        message: `Fallback data loaded for stage ${stage}`,
      });
    }

    // Handle clear action
    if (action === "clear") {
      stageDataStore.delete(storeKey);
      return NextResponse.json({
        success: true,
        message: "Stage data cleared",
      });
    }

    // Handle save action (default)
    if (!key) {
      return NextResponse.json(
        { error: "key is required" },
        { status: 400 }
      );
    }

    const existingData = stageDataStore.get(storeKey) || {};
    existingData[key] = value;
    stageDataStore.set(storeKey, existingData);

    return NextResponse.json({
      success: true,
      key,
      message: `Data saved for key: ${key}`,
    });
  } catch (error) {
    console.error("Error in stage-data API:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const auditRunId = searchParams.get("auditRunId");
  const key = searchParams.get("key");

  if (!auditRunId) {
    return NextResponse.json(
      { error: "auditRunId is required" },
      { status: 400 }
    );
  }

  const storeKey = `${auditRunId}`;

  if (key) {
    // Delete specific key
    const existingData = stageDataStore.get(storeKey) || {};
    delete existingData[key];
    stageDataStore.set(storeKey, existingData);

    return NextResponse.json({
      success: true,
      message: `Deleted key: ${key}`,
    });
  }

  // Delete all data for audit run
  stageDataStore.delete(storeKey);

  return NextResponse.json({
    success: true,
    message: "All stage data deleted for audit run",
  });
}
