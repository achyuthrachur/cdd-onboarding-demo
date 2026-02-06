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
  PivotedAuditorWorkbook,
  PivotedWorkbookRow,
  AssignedCustomer,
  CustomerTestResult,
  AcceptableDocOption,
} from "@/lib/stage-data/store";
import { getAcceptableDocsForAttribute, getStageData } from "@/lib/stage-data/store";
import type { AcceptableDoc } from "@/lib/attribute-library/types";

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

// ============================================
// PIVOTED WORKBOOK GENERATION (NEW)
// Rows = Attributes/Questions
// Columns = Customer results (Result + Observation per customer)
// ============================================

/**
 * Convert sample data to AssignedCustomer format
 */
function sampleToAssignedCustomer(sample: Record<string, unknown>, index: number): AssignedCustomer {
  return {
    customerId: String(sample.GCI || sample.Case_ID || sample.caseId || `CASE-${index + 1}`),
    customerName: String(sample.Legal_Name || sample.legalName || sample["Legal Name"] || ""),
    jurisdiction: String(sample.Jurisdiction || sample.jurisdiction || ""),
    irr: String(sample.IRR || sample.irr || ""),
    drr: String(sample.DRR || sample.drr || ""),
    partyType: String(sample.Party_Type || sample.partyType || sample["Party Type"] || ""),
    kycDate: String(sample.KYC_Date || sample.kycDate || sample["KYC Date"] || ""),
    primaryFlu: String(sample.Primary_FLU || sample.primaryFlu || sample["Primary FLU"] || ""),
    samplingIndex: index + 1,
  };
}

/**
 * System options that appear in all testing dropdowns
 */
const SYSTEM_DROPDOWN_OPTIONS: AcceptableDocOption[] = [
  { value: "doc-not-found", label: "Document Not Found", resultMapping: "Fail 1 - Regulatory", isSystemOption: true },
  { value: "doc-expired", label: "Document Expired", resultMapping: "Fail 2 - Procedure", isSystemOption: true },
  { value: "other-issue", label: "Other Issue (Add Observation)", resultMapping: "Pass w/Observation", isSystemOption: true },
  { value: "question-lob", label: "Question to LOB", resultMapping: "Question to LOB", isSystemOption: true },
  { value: "na", label: "N/A", resultMapping: "N/A", isSystemOption: true },
];

/**
 * Convert acceptable docs to dropdown options
 * Each acceptable doc maps to a "Pass" result
 */
function buildAcceptableDocOptions(attributeId: string, allAcceptableDocs: AcceptableDoc[]): AcceptableDocOption[] {
  // Get acceptable docs for this attribute
  const attributeDocs = allAcceptableDocs.filter(doc => doc.Attribute_ID === attributeId);

  // Convert to dropdown options (selecting any acceptable doc = Pass)
  const docOptions: AcceptableDocOption[] = attributeDocs.map((doc, index) => ({
    value: `doc-${attributeId}-${index}`, // Unique value
    label: doc.Document_Name,
    resultMapping: "Pass" as const,
    isSystemOption: false,
  }));

  // Combine doc options with system options
  return [...docOptions, ...SYSTEM_DROPDOWN_OPTIONS];
}

/**
 * Generate pivoted workbook rows for a single auditor
 * Each row = one attribute, with customer results as columns
 */
export function generatePivotedWorkbookRows(
  assignedCustomers: AssignedCustomer[],
  attributes: ExtractedAttribute[],
  allAcceptableDocs?: AcceptableDoc[]
): PivotedWorkbookRow[] {
  const rows: PivotedWorkbookRow[] = [];

  // Get acceptable docs from store if not provided
  const acceptableDocs = allAcceptableDocs || getStageData("acceptableDocs") || [];

  // For each attribute, create one row with results for all assigned customers
  attributes.forEach((attr) => {
    const customerResults: Record<string, CustomerTestResult> = {};

    // Initialize empty result for each customer
    assignedCustomers.forEach((customer) => {
      // Check if this attribute applies to this customer based on risk scope
      const isHighRisk = customer.irr.toLowerCase().includes("high") ||
                         customer.irr.toLowerCase().includes("enhanced");

      // Determine if attribute applies
      let applies = true;
      if (attr.RiskScope === "EDD" && !isHighRisk) {
        applies = false;
      }

      if (applies) {
        customerResults[customer.customerId] = {
          customerId: customer.customerId,
          customerName: customer.customerName,
          selectedDocument: undefined,
          result: "",
          observation: "",
        };
      }
    });

    // Only add row if at least one customer needs this test
    if (Object.keys(customerResults).length > 0) {
      // Build acceptable docs dropdown options for this attribute
      const acceptableDocOptions = buildAcceptableDocOptions(attr.Attribute_ID, acceptableDocs);

      const row: PivotedWorkbookRow = {
        id: uuidv4(),
        attributeId: attr.Attribute_ID,
        attributeCategory: attr.Category,
        questionText: attr.Question_Text,
        attributeName: attr.Attribute_Name,
        sourceFile: attr.Source_File,
        source: attr.Source,
        sourcePage: attr.Source_Page,
        group: attr.Group,
        acceptableDocs: acceptableDocOptions,
        customerResults,
      };

      rows.push(row);
    }
  });

  return rows;
}

/**
 * Calculate summary for pivoted workbook
 */
export function calculatePivotedWorkbookSummary(rows: PivotedWorkbookRow[]): AuditorWorkbookSummary {
  let totalCells = 0;
  let passCount = 0;
  let passWithObsCount = 0;
  let fail1RegulatoryCount = 0;
  let fail2ProcedureCount = 0;
  let questionToLOBCount = 0;
  let naCount = 0;
  let emptyCount = 0;

  rows.forEach((row) => {
    Object.values(row.customerResults).forEach((result) => {
      totalCells++;
      switch (result.result) {
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
  });

  const completedCells = totalCells - emptyCount;
  const completionPercentage = totalCells > 0 ? Math.round((completedCells / totalCells) * 100) : 0;

  return {
    totalRows: totalCells,
    completedRows: completedCells,
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
 * Generate pivoted auditor workbooks
 * Structure: Rows = Attributes, Columns = Customer results
 */
export function generatePivotedAuditorWorkbooks(
  samples: Record<string, unknown>[],
  attributes: ExtractedAttribute[],
  auditors: Auditor[],
  config: AssignmentConfig = { strategy: "round-robin" },
  acceptableDocs?: AcceptableDoc[]
): PivotedAuditorWorkbook[] {
  // Assign samples to auditors (same logic as before)
  const assignments = assignSamplesToAuditors(samples, auditors, config);

  // Get acceptable docs from store if not provided
  const allAcceptableDocs = acceptableDocs || getStageData("acceptableDocs") || [];

  // Generate pivoted workbooks for each auditor
  const workbooks: PivotedAuditorWorkbook[] = auditors.map((auditor) => {
    const assignedSamples = assignments.get(auditor.id) || [];

    // Convert samples to AssignedCustomer format
    const assignedCustomers = assignedSamples.map((sample, index) =>
      sampleToAssignedCustomer(sample, index)
    );

    // Generate pivoted rows (one per attribute) with acceptable docs
    const rows = generatePivotedWorkbookRows(assignedCustomers, attributes, allAcceptableDocs);
    const summary = calculatePivotedWorkbookSummary(rows);

    // Build attribute list for reference
    const attributeList = attributes.map((attr) => ({
      attributeId: attr.Attribute_ID,
      attributeName: attr.Attribute_Name,
      attributeCategory: attr.Category,
      questionText: attr.Question_Text,
    }));

    return {
      id: uuidv4(),
      auditorId: auditor.id,
      auditorName: auditor.name,
      auditorEmail: auditor.email,
      assignedCustomers,
      rows,
      attributes: attributeList,
      status: "draft" as const,
      summary,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

  return workbooks;
}

/**
 * Get pivoted assignment summary
 */
export function getPivotedAssignmentSummary(
  workbooks: PivotedAuditorWorkbook[]
): {
  totalCustomers: number;
  totalAttributes: number;
  totalTestCells: number;
  auditorBreakdown: Array<{
    auditorId: string;
    auditorName: string;
    customerCount: number;
    attributeCount: number;
    testCellCount: number;
  }>;
} {
  const auditorBreakdown = workbooks.map((wb) => {
    const testCellCount = wb.rows.reduce(
      (sum, row) => sum + Object.keys(row.customerResults).length,
      0
    );
    return {
      auditorId: wb.auditorId,
      auditorName: wb.auditorName,
      customerCount: wb.assignedCustomers.length,
      attributeCount: wb.rows.length,
      testCellCount,
    };
  });

  return {
    totalCustomers: auditorBreakdown.reduce((sum, a) => sum + a.customerCount, 0),
    totalAttributes: workbooks[0]?.rows.length || 0,
    totalTestCells: auditorBreakdown.reduce((sum, a) => sum + a.testCellCount, 0),
    auditorBreakdown,
  };
}
