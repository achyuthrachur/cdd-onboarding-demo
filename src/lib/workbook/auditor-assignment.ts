/**
 * Auditor Assignment Logic
 * Handles sample-to-auditor assignment using round-robin distribution
 */

import { v4 as uuidv4 } from "uuid";
import type { Auditor } from "@/lib/attribute-library/types";
import type {
  AuditorWorkbook,
  AuditorWorkbookRow,
  ExtractedAttribute,
  AuditorWorkbookSummary,
} from "@/lib/stage-data/store";
import { getAcceptableDocsForAttribute } from "@/lib/stage-data/store";

export interface AssignmentConfig {
  strategy: "round-robin" | "random" | "balanced";
}

/**
 * Assign samples to auditors using round-robin distribution
 */
export function assignSamplesToAuditors(
  samples: Record<string, unknown>[],
  auditors: Auditor[],
  config: AssignmentConfig = { strategy: "round-robin" }
): Map<string, Record<string, unknown>[]> {
  const assignments = new Map<string, Record<string, unknown>[]>();

  // Initialize empty arrays for each auditor
  auditors.forEach((auditor) => {
    assignments.set(auditor.id, []);
  });

  if (auditors.length === 0) return assignments;

  switch (config.strategy) {
    case "round-robin":
      samples.forEach((sample, index) => {
        const auditorIndex = index % auditors.length;
        const auditor = auditors[auditorIndex];
        assignments.get(auditor.id)?.push(sample);
      });
      break;

    case "random":
      samples.forEach((sample) => {
        const randomIndex = Math.floor(Math.random() * auditors.length);
        const auditor = auditors[randomIndex];
        assignments.get(auditor.id)?.push(sample);
      });
      break;

    case "balanced":
      // For balanced, try to keep equal distribution but handle remainders
      const baseCount = Math.floor(samples.length / auditors.length);
      const remainder = samples.length % auditors.length;
      let sampleIndex = 0;

      auditors.forEach((auditor, auditorIndex) => {
        const count = baseCount + (auditorIndex < remainder ? 1 : 0);
        for (let i = 0; i < count && sampleIndex < samples.length; i++) {
          assignments.get(auditor.id)?.push(samples[sampleIndex]);
          sampleIndex++;
        }
      });
      break;
  }

  return assignments;
}

/**
 * Generate workbook rows for a single auditor
 */
export function generateAuditorWorkbookRows(
  auditor: Auditor,
  assignedSamples: Record<string, unknown>[],
  attributes: ExtractedAttribute[]
): AuditorWorkbookRow[] {
  const rows: AuditorWorkbookRow[] = [];

  assignedSamples.forEach((sample, sampleIndex) => {
    // Get applicable attributes for this sample based on risk scope
    const irr = String(sample.IRR || sample.irr || "Medium");
    const isHighRisk = irr.toLowerCase().includes("high");

    // Filter attributes based on risk scope
    const applicableAttributes = attributes.filter((attr) => {
      if (attr.RiskScope === "Both") return true;
      if (attr.RiskScope === "Base") return true;
      if (attr.RiskScope === "EDD" && isHighRisk) return true;
      return false;
    });

    applicableAttributes.forEach((attr) => {
      const row: AuditorWorkbookRow = {
        id: uuidv4(),
        // Sample identification
        caseId: String(sample.GCI || sample.Case_ID || sample.caseId || `CASE-${sampleIndex + 1}`),
        legalName: String(sample.Legal_Name || sample.legalName || sample["Legal Name"] || ""),
        jurisdiction: String(sample.Jurisdiction || sample.jurisdiction || ""),
        irr: String(sample.IRR || sample.irr || ""),
        drr: String(sample.DRR || sample.drr || ""),
        partyType: String(sample.Party_Type || sample.partyType || sample["Party Type"] || ""),
        kycDate: String(sample.KYC_Date || sample.kycDate || sample["KYC Date"] || ""),
        primaryFlu: String(sample.Primary_FLU || sample.primaryFlu || sample["Primary FLU"] || ""),
        samplingIndex: sampleIndex + 1,

        // Attribute info
        attributeId: attr.Attribute_ID,
        attributeName: attr.Attribute_Name,
        attributeCategory: attr.Category,
        questionText: attr.Question_Text,
        sourceFile: attr.Source_File,
        source: attr.Source,
        sourcePage: attr.Source_Page,
        group: attr.Group,

        // Testing fields (initially empty)
        result: "",
        observation: "",
        acceptableDocUsed: "",
        evidenceReference: "",
        auditorNotes: "",

        // Auditor info
        auditorId: auditor.id,
        auditorName: auditor.name,
      };

      rows.push(row);
    });
  });

  return rows;
}

/**
 * Calculate summary statistics for workbook rows
 */
export function calculateWorkbookSummary(rows: AuditorWorkbookRow[]): AuditorWorkbookSummary {
  const totalRows = rows.length;
  let passCount = 0;
  let passWithObsCount = 0;
  let fail1RegulatoryCount = 0;
  let fail2ProcedureCount = 0;
  let questionToLOBCount = 0;
  let naCount = 0;
  let emptyCount = 0;

  rows.forEach((row) => {
    switch (row.result) {
      case "Pass":
        passCount++;
        break;
      case "Pass w/Observation":
        passWithObsCount++;
        break;
      case "Fail 1 - Regulatory":
        fail1RegulatoryCount++;
        break;
      case "Fail 2 - Procedure":
        fail2ProcedureCount++;
        break;
      case "Question to LOB":
        questionToLOBCount++;
        break;
      case "N/A":
        naCount++;
        break;
      default:
        emptyCount++;
    }
  });

  const completedRows = totalRows - emptyCount;
  const completionPercentage = totalRows > 0 ? Math.round((completedRows / totalRows) * 100) : 0;

  return {
    totalRows,
    completedRows,
    passCount,
    passWithObsCount,
    fail1RegulatoryCount,
    fail2ProcedureCount,
    questionToLOBCount,
    naCount,
    emptyCount,
    completionPercentage,
  };
}

/**
 * Generate complete auditor workbooks from samples and attributes
 */
export function generateAuditorWorkbooks(
  samples: Record<string, unknown>[],
  attributes: ExtractedAttribute[],
  auditors: Auditor[],
  config: AssignmentConfig = { strategy: "round-robin" }
): AuditorWorkbook[] {
  // Assign samples to auditors
  const assignments = assignSamplesToAuditors(samples, auditors, config);

  // Generate workbooks for each auditor
  const workbooks: AuditorWorkbook[] = auditors.map((auditor) => {
    const assignedSamples = assignments.get(auditor.id) || [];
    const rows = generateAuditorWorkbookRows(auditor, assignedSamples, attributes);
    const summary = calculateWorkbookSummary(rows);

    return {
      id: uuidv4(),
      auditorId: auditor.id,
      auditorName: auditor.name,
      auditorEmail: auditor.email,
      assignedSamples,
      rows,
      status: "draft" as const,
      summary,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

  return workbooks;
}

/**
 * Get assignment summary
 */
export function getAssignmentSummary(
  workbooks: AuditorWorkbook[]
): {
  totalSamples: number;
  totalRows: number;
  auditorBreakdown: Array<{
    auditorId: string;
    auditorName: string;
    sampleCount: number;
    rowCount: number;
  }>;
} {
  const auditorBreakdown = workbooks.map((wb) => ({
    auditorId: wb.auditorId,
    auditorName: wb.auditorName,
    sampleCount: wb.assignedSamples.length,
    rowCount: wb.rows.length,
  }));

  return {
    totalSamples: auditorBreakdown.reduce((sum, a) => sum + a.sampleCount, 0),
    totalRows: auditorBreakdown.reduce((sum, a) => sum + a.rowCount, 0),
    auditorBreakdown,
  };
}
