import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import {
  sampleData,
  computePlan,
  SamplingConfig,
  SamplingPlan,
  addCoverageOverrides,
} from "@/lib/sampling/original-engine";
import { getMockPopulationData } from "@/lib/sampling/engine";

// In-memory stores for demo
const populationStore: Map<
  string,
  {
    id: string;
    auditRunId: string;
    fileName: string;
    columns: string[];
    rowCount: number;
    data: Record<string, unknown>[];
    uploadedAt: string;
  }
> = new Map();

const sampleStore: Map<
  string,
  {
    id: string;
    auditRunId: string;
    populationId: string;
    config: SamplingConfig;
    plan: SamplingPlan;
    sample: Record<string, unknown>[];
    summary: Record<string, unknown>;
    lockedAt: string | null;
    createdAt: string;
  }
> = new Map();

// GET - Retrieve population or sample data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const auditRunId = searchParams.get("auditRunId");
    const type = searchParams.get("type") || "population";
    const id = searchParams.get("id");

    if (id) {
      if (type === "sample") {
        const sample = sampleStore.get(id);
        if (!sample) {
          return NextResponse.json(
            { error: "Sample not found" },
            { status: 404 }
          );
        }
        return NextResponse.json(sample);
      } else {
        const pop = populationStore.get(id);
        if (!pop) {
          return NextResponse.json(
            { error: "Population not found" },
            { status: 404 }
          );
        }
        return NextResponse.json(pop);
      }
    }

    if (!auditRunId) {
      return NextResponse.json(
        { error: "auditRunId is required" },
        { status: 400 }
      );
    }

    if (type === "sample") {
      const samples = Array.from(sampleStore.values()).filter(
        (s) => s.auditRunId === auditRunId
      );
      return NextResponse.json(samples);
    } else {
      const populations = Array.from(populationStore.values()).filter(
        (p) => p.auditRunId === auditRunId
      );
      return NextResponse.json(populations);
    }
  } catch (error) {
    console.error("Error fetching sampling data:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}

// POST - Upload population or run sampling
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
      case "upload-population": {
        const { fileName, data, useMock } = body;

        let populationData: Record<string, unknown>[];
        let actualFileName: string;

        if (useMock || !data) {
          // Use mock data for demo
          populationData = getMockPopulationData();
          actualFileName = "synthetic_onboarding_data.xlsx";
        } else {
          populationData = data;
          actualFileName = fileName || "uploaded_file.xlsx";
        }

        if (!populationData.length) {
          return NextResponse.json(
            { error: "Population data is empty" },
            { status: 400 }
          );
        }

        const columns = Object.keys(populationData[0]);

        const id = uuidv4();
        const population = {
          id,
          auditRunId,
          fileName: actualFileName,
          columns,
          rowCount: populationData.length,
          data: populationData,
          uploadedAt: new Date().toISOString(),
        };

        populationStore.set(id, population);

        return NextResponse.json({
          id,
          fileName: actualFileName,
          columns,
          rowCount: populationData.length,
          uploadedAt: population.uploadedAt,
        });
      }

      case "compute-plan": {
        const { populationId, config } = body;

        const population = populationStore.get(populationId);
        if (!population) {
          return NextResponse.json(
            { error: "Population not found" },
            { status: 404 }
          );
        }

        const plan = computePlan(population.data, config as SamplingConfig);

        return NextResponse.json({ plan });
      }

      case "run-sampling": {
        const { populationId, config, plan } = body;

        const population = populationStore.get(populationId);
        if (!population) {
          return NextResponse.json(
            { error: "Population not found" },
            { status: 404 }
          );
        }

        // Use the original engine's sampleData function
        const result = sampleData(
          population.data,
          config as SamplingConfig,
          plan as SamplingPlan | null,
          population.fileName,
          "Sheet1"
        );

        const id = uuidv4();
        const sampleRecord = {
          id,
          auditRunId,
          populationId,
          config: config as SamplingConfig,
          plan: result.plan,
          sample: result.sample,
          summary: result.summary as unknown as Record<string, unknown>,
          lockedAt: null,
          createdAt: new Date().toISOString(),
        };

        sampleStore.set(id, sampleRecord);

        return NextResponse.json({
          id,
          sampleSize: result.sample.length,
          plan: result.plan,
          summary: result.summary,
        });
      }

      case "add-coverage-overrides": {
        const { plan } = body;

        if (!plan) {
          return NextResponse.json(
            { error: "Plan is required" },
            { status: 400 }
          );
        }

        const updatedPlan = addCoverageOverrides(plan as SamplingPlan);

        return NextResponse.json({ plan: updatedPlan });
      }

      case "lock-sample": {
        const { sampleId } = body;

        const sample = sampleStore.get(sampleId);
        if (!sample) {
          return NextResponse.json(
            { error: "Sample not found" },
            { status: 404 }
          );
        }

        sample.lockedAt = new Date().toISOString();
        sampleStore.set(sampleId, sample);

        return NextResponse.json({
          id: sampleId,
          lockedAt: sample.lockedAt,
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Sampling error:", error);
    return NextResponse.json(
      { error: "Sampling operation failed" },
      { status: 500 }
    );
  }
}

// DELETE - Remove population or sample
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const type = searchParams.get("type") || "population";

    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    if (type === "sample") {
      const deleted = sampleStore.delete(id);
      if (!deleted) {
        return NextResponse.json(
          { error: "Sample not found" },
          { status: 404 }
        );
      }
    } else {
      const deleted = populationStore.delete(id);
      if (!deleted) {
        return NextResponse.json(
          { error: "Population not found" },
          { status: 404 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Delete operation failed" },
      { status: 500 }
    );
  }
}
