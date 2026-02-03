import { NextRequest, NextResponse } from "next/server";
import {
  consolidateWorkbooks,
  getMockConsolidation,
  ConsolidationResult,
} from "@/lib/consolidation/engine";
import { WorkbookState } from "@/lib/workbook/builder";

// In-memory store for consolidations
const consolidationStore: Map<string, ConsolidationResult> = new Map();

// Shared workbook store (imported pattern)
const workbookStore: Map<string, WorkbookState> = new Map();

// GET - Retrieve consolidation results
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const auditRunId = searchParams.get("auditRunId");
    const id = searchParams.get("id");

    if (id) {
      const consolidation = consolidationStore.get(id);
      if (!consolidation) {
        return NextResponse.json(
          { error: "Consolidation not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(consolidation);
    }

    if (!auditRunId) {
      return NextResponse.json(
        { error: "auditRunId is required" },
        { status: 400 }
      );
    }

    const consolidations = Array.from(consolidationStore.values()).filter(
      (c) => c.auditRunId === auditRunId
    );

    return NextResponse.json(consolidations);
  } catch (error) {
    console.error("Error fetching consolidations:", error);
    return NextResponse.json(
      { error: "Failed to fetch consolidations" },
      { status: 500 }
    );
  }
}

// POST - Generate consolidation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, auditRunId, useMock } = body;

    if (!auditRunId) {
      return NextResponse.json(
        { error: "auditRunId is required" },
        { status: 400 }
      );
    }

    switch (action) {
      case "generate": {
        let consolidation: ConsolidationResult;

        if (useMock) {
          // Use mock data for demo
          consolidation = getMockConsolidation(auditRunId);
        } else {
          // Get all submitted workbooks for this audit run
          const workbooks = Array.from(workbookStore.values()).filter(
            (wb) => wb.auditRunId === auditRunId && wb.status === "submitted"
          );

          if (workbooks.length === 0) {
            // If no real workbooks, return mock data for demo
            consolidation = getMockConsolidation(auditRunId);
          } else {
            consolidation = consolidateWorkbooks(workbooks);
          }
        }

        consolidationStore.set(consolidation.id, consolidation);

        return NextResponse.json(consolidation);
      }

      case "refresh": {
        // Get the latest consolidation and update it
        const consolidations = Array.from(consolidationStore.values()).filter(
          (c) => c.auditRunId === auditRunId
        );

        if (consolidations.length === 0) {
          // Generate a new one
          const consolidation = getMockConsolidation(auditRunId);
          consolidationStore.set(consolidation.id, consolidation);
          return NextResponse.json(consolidation);
        }

        // Return the latest
        const latest = consolidations.sort(
          (a, b) =>
            new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
        )[0];

        return NextResponse.json(latest);
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Consolidation error:", error);
    return NextResponse.json(
      { error: "Consolidation operation failed" },
      { status: 500 }
    );
  }
}
