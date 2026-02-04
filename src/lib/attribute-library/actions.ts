/**
 * Action Handlers for Attribute Library
 * Implements the 6 main action buttons in Generation Review
 */

import type {
  Attribute,
  AcceptableDoc,
  GenerationReviewRow,
  Auditor,
  Jurisdiction,
  BatchConfig,
} from "./types";
import {
  parseAttributesAndDocsFile,
  parseSamplingFile,
  exportToExcel,
  exportMultiSheetExcel,
  downloadBlob,
  type SamplingRecord,
} from "./import-export";
import {
  buildNarrativePrompt,
  type NarrativeContext,
  type TestResults,
} from "@/lib/narrative/prompt-builder";
import { consolidateWorkbooks, type ConsolidationResult } from "@/lib/consolidation/engine";
import type { WorkbookState } from "@/lib/workbook/builder";

// ============================================================================
// Types
// ============================================================================

export interface ImportResult {
  success: boolean;
  attributes: Attribute[];
  acceptableDocs: AcceptableDoc[];
  error?: string;
}

export interface GeneratedWorkbook {
  id: string;
  entityGCI: string;
  entityName: string;
  jurisdictionId: string;
  auditorId: string;
  auditorName: string;
  attributeCount: number;
  status: "pending" | "generated" | "error";
  filePath?: string;
  error?: string;
}

export interface GenerationProgress {
  current: number;
  total: number;
  currentEntity?: string;
  status: "idle" | "generating" | "completed" | "cancelled" | "error";
  message: string;
}

export type ProgressCallback = (progress: GenerationProgress) => void;

// ============================================================================
// Button 1: Import Attributes and Acceptable Docs
// ============================================================================

/**
 * Import attributes and acceptable docs from an Excel/CSV file
 */
export async function importAttributesAndDocs(file: File): Promise<ImportResult> {
  try {
    const { attributes, acceptableDocs } = await parseAttributesAndDocsFile(file);

    if (attributes.length === 0) {
      return {
        success: false,
        attributes: [],
        acceptableDocs: [],
        error: "No attributes found in the file. Please check the file format.",
      };
    }

    return {
      success: true,
      attributes,
      acceptableDocs,
    };
  } catch (error) {
    return {
      success: false,
      attributes: [],
      acceptableDocs: [],
      error: error instanceof Error ? error.message : "Failed to parse file",
    };
  }
}

// ============================================================================
// Button 2: Generate Test Grids
// ============================================================================

/**
 * Generate test grid workbooks for all assignments
 * This is a placeholder that will integrate with AGENT-4's generation engine
 */
export async function generateTestGrids(
  assignments: GenerationReviewRow[],
  attributes: Attribute[],
  onProgress?: ProgressCallback
): Promise<GeneratedWorkbook[]> {
  const results: GeneratedWorkbook[] = [];
  const total = assignments.length;

  // Initial progress
  onProgress?.({
    current: 0,
    total,
    status: "generating",
    message: "Initializing workbook generation...",
  });

  for (let i = 0; i < assignments.length; i++) {
    const assignment = assignments[i];

    // Update progress
    onProgress?.({
      current: i,
      total,
      currentEntity: assignment.Legal_Name,
      status: "generating",
      message: `Generating workbook for ${assignment.Legal_Name}...`,
    });

    // Simulate generation delay (in real implementation, this would call the generation engine)
    await delay(100);

    // Get applicable attributes for this entity's jurisdiction
    const applicableAttributes = getApplicableAttributes(
      attributes,
      assignment.Jurisdiction_ID,
      assignment.Party_Type
    );

    // Create generated workbook record
    const workbook: GeneratedWorkbook = {
      id: `WB-${assignment.GCI}-${Date.now()}`,
      entityGCI: assignment.GCI,
      entityName: assignment.Legal_Name,
      jurisdictionId: assignment.Jurisdiction_ID,
      auditorId: assignment.AuditorID,
      auditorName: assignment.Auditor_Name,
      attributeCount: applicableAttributes.length,
      status: "generated",
      filePath: `workbooks/${assignment.GCI}_TestGrid.xlsx`,
    };

    results.push(workbook);
  }

  // Completion progress
  onProgress?.({
    current: total,
    total,
    status: "completed",
    message: `Successfully generated ${results.length} workbooks`,
  });

  return results;
}

/**
 * Get attributes applicable to an entity based on jurisdiction and party type
 */
function getApplicableAttributes(
  attributes: Attribute[],
  jurisdictionId: string,
  partyType: string
): Attribute[] {
  // Determine if EDD is required based on party type
  const isEDD = isEDDRequired(partyType);

  return attributes.filter((attr) => {
    // Include enterprise-wide (ENT) and jurisdiction-specific attributes
    const jurisdictionMatch =
      attr.Jurisdiction_ID === "ENT" || attr.Jurisdiction_ID === jurisdictionId;

    // Include based on risk scope
    const riskScopeMatch =
      attr.RiskScope === "Base" ||
      attr.RiskScope === "Both" ||
      (attr.RiskScope === "EDD" && isEDD);

    return jurisdictionMatch && riskScopeMatch;
  });
}

/**
 * Determine if Enhanced Due Diligence is required based on party type
 */
function isEDDRequired(partyType: string): boolean {
  const eddPartyTypes = [
    "PEP",
    "Fund",
    "Correspondent Bank",
    "Trust",
    "Individual - Foreign",
    "Corporate - Foreign",
  ];
  return eddPartyTypes.some((type) =>
    partyType.toLowerCase().includes(type.toLowerCase())
  );
}

// ============================================================================
// Button 3: Consolidate Test Grids
// ============================================================================

/**
 * Consolidate results from all submitted workbooks
 */
export async function consolidateTestGrids(
  workbooks: WorkbookState[]
): Promise<ConsolidationResult> {
  // Filter to only submitted workbooks
  const submittedWorkbooks = workbooks.filter((wb) => wb.status === "submitted");

  // Use the existing consolidation engine
  return consolidateWorkbooks(submittedWorkbooks);
}

/**
 * Export consolidation results to Excel
 */
export function exportConsolidationResults(result: ConsolidationResult): void {
  const sheets = [
    {
      name: "Summary",
      data: [
        {
          Metric: "Total Tests",
          Value: result.metrics.totalTests,
        },
        {
          Metric: "Pass Count",
          Value: result.metrics.passCount,
        },
        {
          Metric: "Fail Count",
          Value: result.metrics.failCount,
        },
        {
          Metric: "N/A Count",
          Value: result.metrics.naCount,
        },
        {
          Metric: "Pass Rate",
          Value: `${result.metrics.passRate.toFixed(1)}%`,
        },
        {
          Metric: "Fail Rate",
          Value: `${result.metrics.failRate.toFixed(1)}%`,
        },
        {
          Metric: "Exceptions Count",
          Value: result.metrics.exceptionsCount,
        },
        {
          Metric: "Unique Entities Tested",
          Value: result.metrics.uniqueEntitiesTested,
        },
        {
          Metric: "Workbooks Submitted",
          Value: result.metrics.workbooksSubmitted,
        },
      ],
    },
    {
      name: "By Category",
      data: result.findingsByCategory.map((f) => ({
        Category: f.category,
        "Total Tests": f.totalTests,
        Pass: f.passCount,
        Fail: f.failCount,
        "N/A": f.naCount,
        "Fail Rate": `${f.failRate.toFixed(1)}%`,
      })),
    },
    {
      name: "By Attribute",
      data: result.findingsByAttribute.map((f) => ({
        "Attribute ID": f.attributeId,
        "Attribute Name": f.attributeName,
        Category: f.category,
        "Total Tests": f.totalTests,
        Pass: f.passCount,
        Fail: f.failCount,
        "N/A": f.naCount,
        "Fail Rate": `${f.failRate.toFixed(1)}%`,
        Observations: f.observations.join("; "),
      })),
    },
    {
      name: "Exceptions",
      data: result.exceptions.map((e) => ({
        ID: e.id,
        "Sample Item": e.sampleItemId,
        "Entity Name": e.entityName,
        "Attribute ID": e.attributeId,
        "Attribute Name": e.attributeName,
        Category: e.category,
        Observation: e.observation,
        "Evidence Reference": e.evidenceReference,
        "Auditor Notes": e.auditorNotes,
      })),
    },
  ];

  const blob = exportMultiSheetExcel(sheets);
  downloadBlob(blob, `Consolidation_${result.id}_${new Date().toISOString().split("T")[0]}.xlsx`);
}

// ============================================================================
// Button 4: Generate CoPilot Narrative Prompt
// ============================================================================

/**
 * Generate a narrative prompt for AI/CoPilot
 */
export function generateNarrativePrompt(
  assignments: GenerationReviewRow[],
  attributes: Attribute[],
  batchId: string,
  testResults?: TestResults
): string {
  const context: NarrativeContext = {
    batchId,
    assignments,
    attributes,
    testResults,
  };

  return buildNarrativePrompt(context);
}

// ============================================================================
// Button 5: Populate Generation Review
// ============================================================================

/**
 * Populate the generation review table from sampling results
 */
export function populateGenerationReview(
  samplingResults: SamplingRecord[],
  auditors: Auditor[],
  jurisdictions: Jurisdiction[],
  assignmentStrategy: "round-robin" | "by-jurisdiction" = "round-robin"
): GenerationReviewRow[] {
  const rows: GenerationReviewRow[] = [];

  // Create a mapping of jurisdiction ID to name
  const jurisdictionMap = new Map(
    jurisdictions.map((j) => [j.Jurisdiction_ID, j.Jurisdiction_Name])
  );

  // Create auditor assignment logic
  let auditorIndex = 0;
  const jurisdictionAuditorMap = new Map<string, Auditor>();

  // If assigning by jurisdiction, pre-map auditors to jurisdictions
  if (assignmentStrategy === "by-jurisdiction" && auditors.length > 0) {
    const uniqueJurisdictions = [...new Set(samplingResults.map((s) => s.Jurisdiction_ID))];
    uniqueJurisdictions.forEach((jur, index) => {
      jurisdictionAuditorMap.set(jur, auditors[index % auditors.length]);
    });
  }

  for (const sample of samplingResults) {
    // Get auditor based on strategy
    let auditor: Auditor;
    if (assignmentStrategy === "by-jurisdiction") {
      auditor =
        jurisdictionAuditorMap.get(sample.Jurisdiction_ID) || auditors[0] || createDefaultAuditor();
    } else {
      // Round-robin assignment
      auditor = auditors[auditorIndex % auditors.length] || createDefaultAuditor();
      auditorIndex++;
    }

    const row: GenerationReviewRow = {
      Sampling_Index: sample.Sampling_Index,
      GCI: sample.GCI,
      Legal_Name: sample.Legal_Name,
      Jurisdiction_ID: sample.Jurisdiction_ID,
      Jurisdiction:
        sample.Jurisdiction ||
        jurisdictionMap.get(sample.Jurisdiction_ID) ||
        sample.Jurisdiction_ID,
      AuditorID: auditor.AuditorID,
      Auditor_Name: auditor.AuditorName,
      IRR: sample.IRR,
      DRR: sample.DRR,
      Party_Type: sample.Party_Type,
      KYC_Date: sample.KYC_Date,
      Primary_FLU: sample.Primary_FLU,
    };

    rows.push(row);
  }

  return rows;
}

/**
 * Auto-assign auditors to existing rows
 */
export function autoAssignAuditors(
  rows: GenerationReviewRow[],
  auditors: Auditor[],
  strategy: "round-robin" | "by-jurisdiction" | "balance-workload" = "balance-workload"
): GenerationReviewRow[] {
  if (auditors.length === 0) {
    return rows;
  }

  const updatedRows = [...rows];

  switch (strategy) {
    case "round-robin": {
      updatedRows.forEach((row, index) => {
        const auditor = auditors[index % auditors.length];
        row.AuditorID = auditor.AuditorID;
        row.Auditor_Name = auditor.AuditorName;
      });
      break;
    }

    case "by-jurisdiction": {
      const jurisdictionAuditors = new Map<string, Auditor>();
      const uniqueJurisdictions = [...new Set(rows.map((r) => r.Jurisdiction_ID))];
      uniqueJurisdictions.forEach((jur, index) => {
        jurisdictionAuditors.set(jur, auditors[index % auditors.length]);
      });

      updatedRows.forEach((row) => {
        const auditor = jurisdictionAuditors.get(row.Jurisdiction_ID) || auditors[0];
        row.AuditorID = auditor.AuditorID;
        row.Auditor_Name = auditor.AuditorName;
      });
      break;
    }

    case "balance-workload": {
      // Balance workload while keeping jurisdiction consistency where possible
      const workloadCounts = new Map<string, number>();
      auditors.forEach((a) => workloadCounts.set(a.AuditorID, 0));

      // Sort rows by jurisdiction to keep similar entities together
      const sortedRows = [...updatedRows].sort((a, b) =>
        a.Jurisdiction_ID.localeCompare(b.Jurisdiction_ID)
      );

      sortedRows.forEach((row) => {
        // Find auditor with least workload
        let minWorkload = Infinity;
        let selectedAuditor = auditors[0];

        for (const auditor of auditors) {
          const workload = workloadCounts.get(auditor.AuditorID) || 0;
          if (workload < minWorkload) {
            minWorkload = workload;
            selectedAuditor = auditor;
          }
        }

        row.AuditorID = selectedAuditor.AuditorID;
        row.Auditor_Name = selectedAuditor.AuditorName;
        workloadCounts.set(
          selectedAuditor.AuditorID,
          (workloadCounts.get(selectedAuditor.AuditorID) || 0) + 1
        );
      });
      break;
    }
  }

  return updatedRows;
}

function createDefaultAuditor(): Auditor {
  return {
    AuditorID: "UNASSIGNED",
    AuditorName: "Unassigned",
    Email: "",
  };
}

// ============================================================================
// Button 6: Import Sampling
// ============================================================================

/**
 * Import sampling results from a file
 */
export async function importSampling(file: File): Promise<{
  success: boolean;
  records: SamplingRecord[];
  error?: string;
}> {
  try {
    const records = await parseSamplingFile(file);

    if (records.length === 0) {
      return {
        success: false,
        records: [],
        error: "No sampling records found in the file. Please check the file format.",
      };
    }

    return {
      success: true,
      records,
    };
  } catch (error) {
    return {
      success: false,
      records: [],
      error: error instanceof Error ? error.message : "Failed to parse sampling file",
    };
  }
}

// ============================================================================
// Export/Utility Functions
// ============================================================================

/**
 * Export generation review data to Excel
 */
export function exportGenerationReview(
  rows: GenerationReviewRow[],
  batchConfig: BatchConfig
): void {
  const sheets = [
    {
      name: "Generation Review",
      data: rows.map((r) => ({
        "Sample #": r.Sampling_Index,
        GCI: r.GCI,
        "Legal Name": r.Legal_Name,
        "Jurisdiction ID": r.Jurisdiction_ID,
        Jurisdiction: r.Jurisdiction,
        "Auditor ID": r.AuditorID,
        "Auditor Name": r.Auditor_Name,
        IRR: r.IRR,
        DRR: r.DRR,
        "Party Type": r.Party_Type,
        "KYC Date": r.KYC_Date,
        "Primary FLU": r.Primary_FLU,
      })),
    },
    {
      name: "Batch Config",
      data: [
        { Setting: "Batch ID", Value: batchConfig.BatchID },
        { Setting: "Status", Value: batchConfig.Status },
        { Setting: "Total Samples", Value: batchConfig.TotalSamples },
        { Setting: "Assigned Count", Value: batchConfig.AssignedCount },
        { Setting: "Unassigned Count", Value: batchConfig.UnassignedCount },
        { Setting: "Last Refresh", Value: batchConfig.LastRefresh },
        { Setting: "Output Folder", Value: batchConfig.OutputFolder },
      ],
    },
  ];

  const blob = exportMultiSheetExcel(sheets);
  downloadBlob(
    blob,
    `GenerationReview_${batchConfig.BatchID}_${new Date().toISOString().split("T")[0]}.xlsx`
  );
}

/**
 * Validate generation review data before generation
 */
export function validateGenerationReview(rows: GenerationReviewRow[]): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (rows.length === 0) {
    errors.push("No assignments found. Please populate the generation review first.");
    return { valid: false, errors, warnings };
  }

  // Check for unassigned auditors
  const unassigned = rows.filter(
    (r) => !r.AuditorID || r.AuditorID === "UNASSIGNED"
  );
  if (unassigned.length > 0) {
    errors.push(`${unassigned.length} entities have no auditor assigned.`);
  }

  // Check for missing GCIs
  const missingGCI = rows.filter((r) => !r.GCI);
  if (missingGCI.length > 0) {
    errors.push(`${missingGCI.length} entities are missing GCI values.`);
  }

  // Check for duplicate GCIs
  const gciCounts = rows.reduce((acc, r) => {
    acc[r.GCI] = (acc[r.GCI] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const duplicates = Object.entries(gciCounts).filter(([, count]) => count > 1);
  if (duplicates.length > 0) {
    warnings.push(
      `${duplicates.length} duplicate GCI value(s) found: ${duplicates.map(([gci]) => gci).join(", ")}`
    );
  }

  // Check for high-risk entities without EDD flag
  const highRiskNoEDD = rows.filter((r) => r.IRR >= 7 || r.DRR >= 7);
  if (highRiskNoEDD.length > 0) {
    warnings.push(
      `${highRiskNoEDD.length} high-risk entities (IRR/DRR >= 7) identified. Ensure EDD attributes are included.`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// Helper functions

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
