import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import {
  createWorkbookState,
  updateWorkbookRow,
  validateWorkbook,
  calculateWorkbookSummary,
  getMockAttributes,
  WorkbookState,
  WorkbookRow,
  Attribute,
} from "@/lib/workbook/builder";
import { getMockPopulationData } from "@/lib/sampling/engine";

// In-memory store for demo
const workbookStore: Map<string, WorkbookState> = new Map();

// GET - Retrieve workbook(s)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const auditRunId = searchParams.get("auditRunId");
    const id = searchParams.get("id");

    if (id) {
      const workbook = workbookStore.get(id);
      if (!workbook) {
        return NextResponse.json(
          { error: "Workbook not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(workbook);
    }

    if (!auditRunId) {
      return NextResponse.json(
        { error: "auditRunId is required" },
        { status: 400 }
      );
    }

    const workbooks = Array.from(workbookStore.values()).filter(
      (wb) => wb.auditRunId === auditRunId
    );

    return NextResponse.json(workbooks);
  } catch (error) {
    console.error("Error fetching workbooks:", error);
    return NextResponse.json(
      { error: "Failed to fetch workbooks" },
      { status: 500 }
    );
  }
}

// POST - Create workbook or perform actions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, auditRunId } = body;

    if (!auditRunId) {
      return NextResponse.json(
        { error: "auditRunId is required" },
        { status: 400 }
      );
    }

    switch (action) {
      case "generate": {
        const { attributes, sample, idColumn, nameColumn, useMock } = body;

        let actualAttributes: Attribute[];
        let actualSample: Record<string, unknown>[];

        if (useMock || (!attributes && !sample)) {
          // Use mock data for demo
          actualAttributes = getMockAttributes();
          // Get a sample subset of mock population
          const mockPop = getMockPopulationData();
          actualSample = mockPop.slice(0, 25); // 25 sample items for demo
        } else {
          actualAttributes = attributes || [];
          actualSample = sample || [];
        }

        if (!actualAttributes.length || !actualSample.length) {
          return NextResponse.json(
            { error: "Attributes and sample data are required" },
            { status: 400 }
          );
        }

        const workbook = createWorkbookState(
          auditRunId,
          actualAttributes,
          actualSample as { RecordID: string; EntityName: string; [key: string]: unknown }[],
          idColumn,
          nameColumn
        );

        workbook.id = uuidv4();
        workbookStore.set(workbook.id, workbook);

        return NextResponse.json({
          id: workbook.id,
          status: workbook.status,
          rowCount: workbook.rows.length,
          summary: workbook.summary,
          createdAt: workbook.createdAt,
        });
      }

      case "update-row": {
        const { workbookId, rowId, updates } = body;

        const workbook = workbookStore.get(workbookId);
        if (!workbook) {
          return NextResponse.json(
            { error: "Workbook not found" },
            { status: 404 }
          );
        }

        if (workbook.status === "submitted") {
          return NextResponse.json(
            { error: "Cannot modify submitted workbook" },
            { status: 400 }
          );
        }

        const updatedWorkbook = updateWorkbookRow(workbook, rowId, updates);
        workbookStore.set(workbookId, updatedWorkbook);

        return NextResponse.json({
          id: workbookId,
          summary: updatedWorkbook.summary,
          updatedAt: updatedWorkbook.updatedAt,
        });
      }

      case "save-state": {
        const { workbookId, rows } = body;

        const workbook = workbookStore.get(workbookId);
        if (!workbook) {
          return NextResponse.json(
            { error: "Workbook not found" },
            { status: 404 }
          );
        }

        if (workbook.status === "submitted") {
          return NextResponse.json(
            { error: "Cannot modify submitted workbook" },
            { status: 400 }
          );
        }

        // Update all rows
        const updatedWorkbook: WorkbookState = {
          ...workbook,
          rows: rows as WorkbookRow[],
          summary: calculateWorkbookSummary(rows as WorkbookRow[]),
          status: workbook.status === "draft" ? "in_progress" : workbook.status,
          updatedAt: new Date().toISOString(),
        };

        workbookStore.set(workbookId, updatedWorkbook);

        return NextResponse.json({
          id: workbookId,
          summary: updatedWorkbook.summary,
          updatedAt: updatedWorkbook.updatedAt,
        });
      }

      case "validate": {
        const { workbookId } = body;

        const workbook = workbookStore.get(workbookId);
        if (!workbook) {
          return NextResponse.json(
            { error: "Workbook not found" },
            { status: 404 }
          );
        }

        const validation = validateWorkbook(workbook);

        return NextResponse.json({
          id: workbookId,
          valid: validation.valid,
          errors: validation.errors,
          summary: workbook.summary,
        });
      }

      case "submit": {
        const { workbookId, force } = body;

        const workbook = workbookStore.get(workbookId);
        if (!workbook) {
          return NextResponse.json(
            { error: "Workbook not found" },
            { status: 404 }
          );
        }

        if (workbook.status === "submitted") {
          return NextResponse.json(
            { error: "Workbook already submitted" },
            { status: 400 }
          );
        }

        // Validate before submit
        const validation = validateWorkbook(workbook);
        if (!validation.valid && !force) {
          return NextResponse.json(
            {
              error: "Workbook validation failed",
              errors: validation.errors,
            },
            { status: 400 }
          );
        }

        const submittedWorkbook: WorkbookState = {
          ...workbook,
          status: "submitted",
          submittedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        workbookStore.set(workbookId, submittedWorkbook);

        return NextResponse.json({
          id: workbookId,
          status: submittedWorkbook.status,
          submittedAt: submittedWorkbook.submittedAt,
          summary: submittedWorkbook.summary,
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Workbook error:", error);
    return NextResponse.json(
      { error: "Workbook operation failed" },
      { status: 500 }
    );
  }
}

// DELETE - Remove workbook
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    const workbook = workbookStore.get(id);
    if (!workbook) {
      return NextResponse.json(
        { error: "Workbook not found" },
        { status: 404 }
      );
    }

    if (workbook.status === "submitted") {
      return NextResponse.json(
        { error: "Cannot delete submitted workbook" },
        { status: 400 }
      );
    }

    workbookStore.delete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Delete operation failed" },
      { status: 500 }
    );
  }
}
