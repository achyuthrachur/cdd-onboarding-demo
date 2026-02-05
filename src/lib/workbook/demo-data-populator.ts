/**
 * Demo Data Populator
 * Populates auditor workbooks with realistic test results for demonstration
 */

import type {
  AuditorWorkbook,
  AuditorWorkbookRow,
} from "@/lib/stage-data/store";
import type { AcceptableDoc } from "@/lib/attribute-library/types";
import { getStageData } from "@/lib/stage-data/store";
import { calculateWorkbookSummary } from "./auditor-assignment";

export type ResultType =
  | "Pass"
  | "Pass w/Observation"
  | "Fail 1 - Regulatory"
  | "Fail 2 - Procedure"
  | "Question to LOB"
  | "N/A";

export interface PopulationConfig {
  passRate: number; // Percentage (0-1)
  passWithObsRate: number;
  fail1RegulatoryRate: number;
  fail2ProcedureRate: number;
  questionToLOBRate: number;
  naRate: number;
}

// Default distribution that adds up to 1.0
export const DEFAULT_POPULATION_CONFIG: PopulationConfig = {
  passRate: 0.65,
  passWithObsRate: 0.08,
  fail1RegulatoryRate: 0.08,
  fail2ProcedureRate: 0.10,
  questionToLOBRate: 0.04,
  naRate: 0.05,
};

// Standard observations from VBA (frmObservation.frm)
const STANDARD_OBSERVATIONS = [
  "Adverse media screening has expired as 1 year has passed since last clearing",
  "Documentary evidence not retained on file, CIP clearance based on non-documentary method only",
  "Onboarding checklist incomplete - missing several required fields",
  "Risk rating calculation contains an error but result still within acceptable range",
  "Delayed verification - CIP completed more than 30 days after account opening",
  "Address verification document dated more than 90 days prior to onboarding",
  "Beneficial ownership percentage calculation unclear in supporting documentation",
  "PEP screening completed but no disposition documented for close associate match",
  "Source of funds documentation acceptable but dated prior to relationship start",
  "Formation documents on file are copies - originals or certified copies required per procedures",
];

// Regulatory failure reasons
const REGULATORY_FAILURES = [
  "Customer identity not verified within reasonable time after account opening",
  "Beneficial owner not identified despite 25%+ ownership stake",
  "OFAC screening not performed at account opening",
  "Documentary verification missing - no government-issued ID on file",
  "CIP information incomplete - missing required data element",
  "No risk rating assigned at onboarding",
  "Foreign PEP not identified despite public information available",
];

// Procedural failure reasons
const PROCEDURAL_FAILURES = [
  "Address verification document exceeds 90-day requirement",
  "W-9 not signed or dated",
  "Ownership chart missing from file",
  "Second form of non-documentary verification not obtained",
  "EDD checklist not completed for high-risk customer",
  "Senior management approval not documented for EDD customer",
  "Screening results not dated/timestamped",
  "Control person certification form missing signature",
];

// Question to LOB reasons
const LOB_QUESTIONS = [
  "Unclear if customer is considered high-risk under procedures - awaiting clarification",
  "Conflicting information between formation docs and ownership certification",
  "Unable to locate supporting documentation referenced in case notes",
  "System shows different risk rating than documented in file",
];

/**
 * Get a random item from an array
 */
function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Get acceptable documents for an attribute from the store
 */
function getAcceptableDocsForAttribute(attributeId: string): AcceptableDoc[] {
  const allDocs = getStageData("acceptableDocs") || [];
  return allDocs.filter((doc) => doc.Attribute_ID === attributeId);
}

/**
 * Determine result type based on configured distribution
 */
function determineResultType(config: PopulationConfig): ResultType {
  const rand = Math.random();
  let cumulative = 0;

  cumulative += config.passRate;
  if (rand < cumulative) return "Pass";

  cumulative += config.passWithObsRate;
  if (rand < cumulative) return "Pass w/Observation";

  cumulative += config.fail1RegulatoryRate;
  if (rand < cumulative) return "Fail 1 - Regulatory";

  cumulative += config.fail2ProcedureRate;
  if (rand < cumulative) return "Fail 2 - Procedure";

  cumulative += config.questionToLOBRate;
  if (rand < cumulative) return "Question to LOB";

  return "N/A";
}

/**
 * Generate appropriate observation text based on result type
 */
function generateObservation(result: ResultType, attributeId: string): string {
  switch (result) {
    case "Pass":
      return "";
    case "Pass w/Observation":
      return getRandomItem(STANDARD_OBSERVATIONS);
    case "Fail 1 - Regulatory":
      return getRandomItem(REGULATORY_FAILURES);
    case "Fail 2 - Procedure":
      return getRandomItem(PROCEDURAL_FAILURES);
    case "Question to LOB":
      return getRandomItem(LOB_QUESTIONS);
    case "N/A":
      return "Not applicable to this customer type";
    default:
      return "";
  }
}

/**
 * Get acceptable document name for passing results
 */
function getAcceptableDocForPass(attributeId: string): string {
  const docs = getAcceptableDocsForAttribute(attributeId);
  if (docs.length > 0) {
    return getRandomItem(docs).Document_Name;
  }
  // Fallback generic docs
  const fallbackDocs = [
    "Passport",
    "Driver's License",
    "Bank Statement",
    "Utility Bill",
    "Certificate of Incorporation",
    "W-9 Form",
    "Beneficial Ownership Certification",
    "Screening Report",
  ];
  return getRandomItem(fallbackDocs);
}

/**
 * Populate a single workbook row with demo data
 */
function populateRow(
  row: AuditorWorkbookRow,
  config: PopulationConfig
): AuditorWorkbookRow {
  const result = determineResultType(config);
  const observation = generateObservation(result, row.attributeId);

  // For passing results, note which acceptable document was used
  const acceptableDocUsed =
    result === "Pass" || result === "Pass w/Observation"
      ? getAcceptableDocForPass(row.attributeId)
      : "";

  // Generate evidence reference for passing results
  const evidenceReference =
    result === "Pass" || result === "Pass w/Observation"
      ? `Doc: ${acceptableDocUsed} - verified on file`
      : result === "Fail 1 - Regulatory" || result === "Fail 2 - Procedure"
      ? "See observation for details"
      : "";

  return {
    ...row,
    result,
    observation,
    observationType: observation ? "standard" : undefined,
    acceptableDocUsed,
    evidenceReference,
    auditorNotes: "",
    testedAt: new Date().toISOString(),
  };
}

/**
 * Populate all rows in a workbook with demo data
 */
export function populateWorkbookWithDemoData(
  workbook: AuditorWorkbook,
  config: PopulationConfig = DEFAULT_POPULATION_CONFIG
): AuditorWorkbook {
  const populatedRows = workbook.rows.map((row) => populateRow(row, config));
  const summary = calculateWorkbookSummary(populatedRows);

  return {
    ...workbook,
    rows: populatedRows,
    status: "in_progress",
    summary,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Populate all workbooks with demo data
 */
export function populateAllWorkbooksWithDemoData(
  workbooks: AuditorWorkbook[],
  config: PopulationConfig = DEFAULT_POPULATION_CONFIG
): AuditorWorkbook[] {
  return workbooks.map((wb) => populateWorkbookWithDemoData(wb, config));
}

/**
 * Get population config with adjusted rates
 * Ensures rates sum to 1.0
 */
export function createPopulationConfig(
  overrides: Partial<PopulationConfig>
): PopulationConfig {
  const config = { ...DEFAULT_POPULATION_CONFIG, ...overrides };

  // Normalize to ensure sum = 1.0
  const sum =
    config.passRate +
    config.passWithObsRate +
    config.fail1RegulatoryRate +
    config.fail2ProcedureRate +
    config.questionToLOBRate +
    config.naRate;

  if (Math.abs(sum - 1.0) > 0.01) {
    // Adjust pass rate to normalize
    config.passRate =
      1.0 -
      (config.passWithObsRate +
        config.fail1RegulatoryRate +
        config.fail2ProcedureRate +
        config.questionToLOBRate +
        config.naRate);
  }

  return config;
}

/**
 * Get summary statistics across all workbooks
 */
export function getPopulationSummary(workbooks: AuditorWorkbook[]): {
  totalRows: number;
  completed: number;
  passCount: number;
  passWithObsCount: number;
  fail1Count: number;
  fail2Count: number;
  questionCount: number;
  naCount: number;
  passRate: number;
  failRate: number;
} {
  let totalRows = 0;
  let completed = 0;
  let passCount = 0;
  let passWithObsCount = 0;
  let fail1Count = 0;
  let fail2Count = 0;
  let questionCount = 0;
  let naCount = 0;

  workbooks.forEach((wb) => {
    totalRows += wb.summary.totalRows;
    completed += wb.summary.completedRows;
    passCount += wb.summary.passCount;
    passWithObsCount += wb.summary.passWithObsCount;
    fail1Count += wb.summary.fail1RegulatoryCount;
    fail2Count += wb.summary.fail2ProcedureCount;
    questionCount += wb.summary.questionToLOBCount;
    naCount += wb.summary.naCount;
  });

  const testedRows = completed - naCount;
  const passRate = testedRows > 0 ? (passCount + passWithObsCount) / testedRows : 0;
  const failRate = testedRows > 0 ? (fail1Count + fail2Count) / testedRows : 0;

  return {
    totalRows,
    completed,
    passCount,
    passWithObsCount,
    fail1Count,
    fail2Count,
    questionCount,
    naCount,
    passRate,
    failRate,
  };
}
