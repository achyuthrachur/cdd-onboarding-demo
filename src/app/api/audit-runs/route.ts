import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

// In-memory store for demo (replace with database in production)
const auditRunsStore: Map<string, {
  id: string;
  name: string;
  status: string;
  createdBy: string;
  createdAt: string;
  scenarioId: string | null;
  scope: Record<string, unknown> | null;
}> = new Map();

export async function GET() {
  try {
    const auditRuns = Array.from(auditRunsStore.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json(auditRuns);
  } catch (error) {
    console.error("Error fetching audit runs:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit runs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, scope, scenarioId } = body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const id = uuidv4();
    const auditRun = {
      id,
      name: name.trim(),
      status: "draft",
      createdBy: "demo-user", // Replace with actual user from auth
      createdAt: new Date().toISOString(),
      scenarioId: scenarioId || null,
      scope: scope || null,
    };

    auditRunsStore.set(id, auditRun);

    return NextResponse.json(auditRun, { status: 201 });
  } catch (error) {
    console.error("Error creating audit run:", error);
    return NextResponse.json(
      { error: "Failed to create audit run" },
      { status: 500 }
    );
  }
}
