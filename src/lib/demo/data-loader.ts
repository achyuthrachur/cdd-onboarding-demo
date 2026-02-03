/**
 * Demo Data Loader
 * Pre-populates data for demo mode across all stages
 */

export interface DemoStatus {
  stage1: {
    documentsUploaded: boolean;
    attributesExtracted: boolean;
    gapAssessmentComplete: boolean;
  };
  stage2: {
    populationUploaded: boolean;
    sampleGenerated: boolean;
    sampleLocked: boolean;
  };
  stage3: {
    workbookGenerated: boolean;
    workbookSubmitted: boolean;
  };
  stage4: {
    consolidationGenerated: boolean;
    reportAvailable: boolean;
  };
}

export async function getDemoStatus(auditRunId: string): Promise<DemoStatus> {
  // Check status of each stage
  const status: DemoStatus = {
    stage1: {
      documentsUploaded: false,
      attributesExtracted: false,
      gapAssessmentComplete: false,
    },
    stage2: {
      populationUploaded: false,
      sampleGenerated: false,
      sampleLocked: false,
    },
    stage3: {
      workbookGenerated: false,
      workbookSubmitted: false,
    },
    stage4: {
      consolidationGenerated: false,
      reportAvailable: false,
    },
  };

  try {
    // Check Stage 1 - Documents
    const docsResponse = await fetch(`/api/documents?auditRunId=${auditRunId}`);
    if (docsResponse.ok) {
      const docs = await docsResponse.json();
      status.stage1.documentsUploaded = docs.length > 0;
      status.stage1.attributesExtracted = docs.some((d: { hasResults?: boolean }) => d.hasResults);
    }

    // Check Stage 2 - Sampling
    const sampleResponse = await fetch(`/api/sampling?action=get-sample&auditRunId=${auditRunId}`);
    if (sampleResponse.ok) {
      const sample = await sampleResponse.json();
      status.stage2.sampleGenerated = !!sample.results;
      status.stage2.sampleLocked = sample.lockedAt !== null;
    }

    // Check Stage 3 - Workbooks
    const workbooksResponse = await fetch(`/api/workbooks?auditRunId=${auditRunId}`);
    if (workbooksResponse.ok) {
      const workbooks = await workbooksResponse.json();
      status.stage3.workbookGenerated = workbooks.length > 0;
      status.stage3.workbookSubmitted = workbooks.some((wb: { status: string }) => wb.status === "submitted");
    }

    // Check Stage 4 - Consolidation
    const consolidationResponse = await fetch(`/api/consolidation?auditRunId=${auditRunId}`);
    if (consolidationResponse.ok) {
      const consolidations = await consolidationResponse.json();
      status.stage4.consolidationGenerated = consolidations.length > 0;
      status.stage4.reportAvailable = consolidations.length > 0;
    }
  } catch (error) {
    console.error("Error fetching demo status:", error);
  }

  return status;
}

export async function runDemoStage1(auditRunId: string): Promise<boolean> {
  try {
    // Upload mock documents
    const uploadResponse = await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auditRunId,
        docType: "flu",
        fileName: "CIP_CDD_Procedures_Mock.docx",
        useMock: true,
      }),
    });

    return uploadResponse.ok;
  } catch (error) {
    console.error("Error running demo stage 1:", error);
    return false;
  }
}

export async function runDemoStage2(auditRunId: string): Promise<boolean> {
  try {
    // Upload mock population
    const uploadResponse = await fetch("/api/sampling", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "upload-population",
        auditRunId,
        useMock: true,
      }),
    });

    if (!uploadResponse.ok) return false;

    // Generate and lock sample
    const sampleResponse = await fetch("/api/sampling", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "run-sampling",
        auditRunId,
        config: {
          method: "statistical",
          confidence: 95,
          margin: 5,
          expectedErrorRate: 5,
          seed: 42,
          stratifyFields: [],
        },
        useMock: true,
      }),
    });

    if (!sampleResponse.ok) return false;

    // Lock sample
    const lockResponse = await fetch("/api/sampling", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "lock-sample",
        auditRunId,
      }),
    });

    return lockResponse.ok;
  } catch (error) {
    console.error("Error running demo stage 2:", error);
    return false;
  }
}

export async function runDemoStage3(auditRunId: string): Promise<boolean> {
  try {
    // Generate workbook
    const generateResponse = await fetch("/api/workbooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "generate",
        auditRunId,
        useMock: true,
      }),
    });

    if (!generateResponse.ok) return false;

    const workbook = await generateResponse.json();

    // Submit workbook (auto-completes for demo)
    const submitResponse = await fetch("/api/workbooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "submit",
        workbookId: workbook.id,
        overrideValidation: true,
      }),
    });

    return submitResponse.ok;
  } catch (error) {
    console.error("Error running demo stage 3:", error);
    return false;
  }
}

export async function runDemoStage4(auditRunId: string): Promise<boolean> {
  try {
    // Generate consolidation
    const consolidationResponse = await fetch("/api/consolidation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "generate",
        auditRunId,
        useMock: true,
      }),
    });

    return consolidationResponse.ok;
  } catch (error) {
    console.error("Error running demo stage 4:", error);
    return false;
  }
}

export async function runFullDemo(auditRunId: string): Promise<{
  success: boolean;
  completedStages: number[];
  error?: string;
}> {
  const completedStages: number[] = [];

  try {
    // Run Stage 1
    const stage1Success = await runDemoStage1(auditRunId);
    if (stage1Success) completedStages.push(1);

    // Run Stage 2
    const stage2Success = await runDemoStage2(auditRunId);
    if (stage2Success) completedStages.push(2);

    // Run Stage 3
    const stage3Success = await runDemoStage3(auditRunId);
    if (stage3Success) completedStages.push(3);

    // Run Stage 4
    const stage4Success = await runDemoStage4(auditRunId);
    if (stage4Success) completedStages.push(4);

    return {
      success: completedStages.length === 4,
      completedStages,
    };
  } catch (error) {
    return {
      success: false,
      completedStages,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
