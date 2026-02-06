/**
 * Consolidation Engine
 * Aggregates results from submitted workbooks for reporting
 */

import { WorkbookState, WorkbookRow } from "@/lib/workbook/builder";
import type { GeneratedWorkbook, TestGridRow } from "@/lib/attribute-library/generation-engine";

export interface ConsolidatedMetrics {
  totalTests: number;
  passCount: number;
  passWithObservationCount: number;
  failCount: number;
  fail1RegulatoryCount: number;
  fail2ProcedureCount: number;
  questionToLOBCount: number;
  naCount: number;
  passRate: number;
  failRate: number;
  exceptionsCount: number;
  uniqueEntitiesTested: number;
  uniqueAttributesTested: number;
  workbooksSubmitted: number;
}

export interface FindingsByCategory {
  category: string;
  totalTests: number;
  passCount: number;
  failCount: number;
  naCount: number;
  failRate: number;
}

export interface FindingsByAttribute {
  attributeId: string;
  attributeName: string;
  category: string;
  totalTests: number;
  passCount: number;
  failCount: number;
  naCount: number;
  failRate: number;
  observations: string[];
}

export interface ExceptionDetail {
  id: string;
  sampleItemId: string;
  entityName: string;
  attributeId: string;
  attributeName: string;
  category: string;
  observation: string;
  evidenceReference: string;
  auditorNotes: string;
  resultType?: 'Fail 1 - Regulatory' | 'Fail 2 - Procedure' | 'Question to LOB';
  jurisdictionId?: string;
  auditorId?: string;
  auditorName?: string;
  riskTier?: string;
  partyType?: string;
}

// Metrics by Jurisdiction
export interface JurisdictionMetrics {
  jurisdictionId: string;
  jurisdictionName: string;
  totalTests: number;
  passCount: number;
  passWithObservationCount: number;
  fail1Count: number;
  fail2Count: number;
  questionToLOBCount: number;
  naCount: number;
  passRate: number;
  failRate: number;
  entityCount: number;
}

// Metrics by Auditor
export interface AuditorMetrics {
  auditorId: string;
  auditorName: string;
  totalTests: number;
  passCount: number;
  passWithObservationCount: number;
  fail1Count: number;
  fail2Count: number;
  questionToLOBCount: number;
  naCount: number;
  passRate: number;
  failRate: number;
  entityCount: number;
  completionRate: number;
}

// Metrics by Category
export interface CategoryMetrics {
  category: string;
  totalTests: number;
  passCount: number;
  passWithObservationCount: number;
  fail1Count: number;
  fail2Count: number;
  questionToLOBCount: number;
  naCount: number;
  passRate: number;
  failRate: number;
  attributeCount: number;
}

// Metrics by Risk Tier
export interface RiskTierMetrics {
  riskTier: string;
  totalTests: number;
  passCount: number;
  failCount: number;
  naCount: number;
  passRate: number;
  failRate: number;
  entityCount: number;
}

// ============================================================================
// CONSOLIDATED CUSTOMER DATA STRUCTURES
// ============================================================================

/**
 * Observation detail for a customer
 */
export interface CustomerObservation {
  attributeId: string;
  attributeName: string;
  attributeCategory: string;
  observationText: string;
  auditorId: string;
  auditorName: string;
  timestamp: Date;
}

/**
 * Question to LOB detail for a customer
 */
export interface CustomerQuestion {
  attributeId: string;
  attributeName: string;
  attributeCategory: string;
  questionText: string;
  auditorId: string;
  auditorName: string;
  timestamp: Date;
}

/**
 * Failure detail for a customer
 */
export interface CustomerFailure {
  attributeId: string;
  attributeName: string;
  attributeCategory: string;
  failureType: 'Regulatory' | 'Procedure';
  failureReason: string;
  auditorId: string;
  auditorName: string;
  timestamp: Date;
}

/**
 * Consolidated customer with all observations, questions, and failures
 * This interface groups ALL findings for a single customer/entity
 */
export interface ConsolidatedCustomer {
  customerId: string;
  customerName: string;
  jurisdictionId: string;
  partyType: string;
  riskTier: string;
  totalTests: number;
  passCount: number;
  passWithObservationCount: number;
  failCount: number;
  questionCount: number;
  naCount: number;
  overallResult: 'Pass' | 'Pass w/Observation' | 'Fail' | 'Question';

  // All observations for this customer (can be multiple per customer)
  observations: CustomerObservation[];

  // All questions to LOB for this customer
  questionsToLOB: CustomerQuestion[];

  // All failures for this customer
  failures: CustomerFailure[];
}

export interface ConsolidationResult {
  id: string;
  auditRunId: string;
  generatedAt: string;
  metrics: ConsolidatedMetrics;
  findingsByCategory: FindingsByCategory[];
  findingsByAttribute: FindingsByAttribute[];
  findingsByJurisdiction: JurisdictionMetrics[];
  findingsByAuditor: AuditorMetrics[];
  findingsByRiskTier: RiskTierMetrics[];
  exceptions: ExceptionDetail[];
  // NEW: Customer-level findings with all observations grouped by customer
  customerFindings: ConsolidatedCustomer[];
  rawData: {
    workbookIds: string[];
    totalRows: number;
    testGridRows?: TestGridRow[];
  };
}

// Consolidate multiple workbooks (legacy format)
export function consolidateWorkbooks(
  workbooks: WorkbookState[]
): ConsolidationResult {
  const submittedWorkbooks = workbooks.filter(
    (wb) => wb.status === "submitted"
  );

  if (submittedWorkbooks.length === 0) {
    return createEmptyConsolidation("");
  }

  // Gather all rows from submitted workbooks
  const allRows: WorkbookRow[] = submittedWorkbooks.flatMap((wb) => wb.rows);

  // Calculate metrics
  const metrics = calculateMetrics(allRows, submittedWorkbooks.length);

  // Group by category
  const findingsByCategory = calculateFindingsByCategory(allRows);

  // Group by attribute
  const findingsByAttribute = calculateFindingsByAttribute(allRows);

  // Extract exceptions (failures)
  const exceptions = extractExceptions(allRows);

  return {
    id: `CONSOL-${Date.now()}`,
    auditRunId: submittedWorkbooks[0]?.auditRunId || "",
    generatedAt: new Date().toISOString(),
    metrics,
    findingsByCategory,
    findingsByAttribute,
    findingsByJurisdiction: [],
    findingsByAuditor: [],
    findingsByRiskTier: [],
    exceptions,
    customerFindings: [], // Legacy format doesn't have customer-level consolidation
    rawData: {
      workbookIds: submittedWorkbooks.map((wb) => wb.id),
      totalRows: allRows.length,
    },
  };
}

function calculateMetrics(
  rows: WorkbookRow[],
  workbookCount: number
): ConsolidatedMetrics {
  const totalTests = rows.length;
  const passCount = rows.filter((r) => r.result === "Pass").length;
  const failCount = rows.filter((r) => r.result === "Fail").length;
  const naCount = rows.filter((r) => r.result === "N/A").length;

  const testedRows = passCount + failCount + naCount;
  const passRate = testedRows > 0 ? (passCount / testedRows) * 100 : 0;
  const failRate = testedRows > 0 ? (failCount / testedRows) * 100 : 0;

  const uniqueEntities = new Set(rows.map((r) => r.sampleItemId));
  const uniqueAttributes = new Set(rows.map((r) => r.attributeId));

  return {
    totalTests,
    passCount,
    passWithObservationCount: 0,
    failCount,
    fail1RegulatoryCount: 0,
    fail2ProcedureCount: 0,
    questionToLOBCount: 0,
    naCount,
    passRate,
    failRate,
    exceptionsCount: failCount,
    uniqueEntitiesTested: uniqueEntities.size,
    uniqueAttributesTested: uniqueAttributes.size,
    workbooksSubmitted: workbookCount,
  };
}

function calculateFindingsByCategory(rows: WorkbookRow[]): FindingsByCategory[] {
  const categories = new Map<string, FindingsByCategory>();

  for (const row of rows) {
    const cat = row.category || "Uncategorized";

    if (!categories.has(cat)) {
      categories.set(cat, {
        category: cat,
        totalTests: 0,
        passCount: 0,
        failCount: 0,
        naCount: 0,
        failRate: 0,
      });
    }

    const finding = categories.get(cat)!;
    finding.totalTests++;

    if (row.result === "Pass") finding.passCount++;
    else if (row.result === "Fail") finding.failCount++;
    else if (row.result === "N/A") finding.naCount++;
  }

  // Calculate fail rates
  for (const finding of categories.values()) {
    const tested = finding.passCount + finding.failCount + finding.naCount;
    finding.failRate = tested > 0 ? (finding.failCount / tested) * 100 : 0;
  }

  return Array.from(categories.values()).sort((a, b) => b.failRate - a.failRate);
}

function calculateFindingsByAttribute(rows: WorkbookRow[]): FindingsByAttribute[] {
  const attributes = new Map<string, FindingsByAttribute>();

  for (const row of rows) {
    const attrId = row.attributeId;

    if (!attributes.has(attrId)) {
      attributes.set(attrId, {
        attributeId: attrId,
        attributeName: row.attributeName,
        category: row.category,
        totalTests: 0,
        passCount: 0,
        failCount: 0,
        naCount: 0,
        failRate: 0,
        observations: [],
      });
    }

    const finding = attributes.get(attrId)!;
    finding.totalTests++;

    if (row.result === "Pass") finding.passCount++;
    else if (row.result === "Fail") {
      finding.failCount++;
      if (row.observation && !finding.observations.includes(row.observation)) {
        finding.observations.push(row.observation);
      }
    }
    else if (row.result === "N/A") finding.naCount++;
  }

  // Calculate fail rates
  for (const finding of attributes.values()) {
    const tested = finding.passCount + finding.failCount + finding.naCount;
    finding.failRate = tested > 0 ? (finding.failCount / tested) * 100 : 0;
  }

  return Array.from(attributes.values()).sort((a, b) => b.failRate - a.failRate);
}

function extractExceptions(rows: WorkbookRow[]): ExceptionDetail[] {
  return rows
    .filter((r) => r.result === "Fail")
    .map((r) => ({
      id: r.id,
      sampleItemId: r.sampleItemId,
      entityName: r.entityName,
      attributeId: r.attributeId,
      attributeName: r.attributeName,
      category: r.category,
      observation: r.observation,
      evidenceReference: r.evidenceReference,
      auditorNotes: r.auditorNotes,
    }));
}

function createEmptyConsolidation(auditRunId: string): ConsolidationResult {
  return {
    id: `CONSOL-${Date.now()}`,
    auditRunId,
    generatedAt: new Date().toISOString(),
    metrics: {
      totalTests: 0,
      passCount: 0,
      passWithObservationCount: 0,
      failCount: 0,
      fail1RegulatoryCount: 0,
      fail2ProcedureCount: 0,
      questionToLOBCount: 0,
      naCount: 0,
      passRate: 0,
      failRate: 0,
      exceptionsCount: 0,
      uniqueEntitiesTested: 0,
      uniqueAttributesTested: 0,
      workbooksSubmitted: 0,
    },
    findingsByCategory: [],
    findingsByAttribute: [],
    findingsByJurisdiction: [],
    findingsByAuditor: [],
    findingsByRiskTier: [],
    exceptions: [],
    customerFindings: [],
    rawData: {
      workbookIds: [],
      totalRows: 0,
    },
  };
}

// Generate mock consolidation data for demo
export function getMockConsolidation(auditRunId: string): ConsolidationResult {
  return {
    id: `CONSOL-MOCK-${Date.now()}`,
    auditRunId,
    generatedAt: new Date().toISOString(),
    metrics: {
      totalTests: 250,
      passCount: 200,
      passWithObservationCount: 15,
      failCount: 25,
      fail1RegulatoryCount: 15,
      fail2ProcedureCount: 10,
      questionToLOBCount: 5,
      naCount: 10,
      passRate: 86.0,
      failRate: 10.0,
      exceptionsCount: 25,
      uniqueEntitiesTested: 25,
      uniqueAttributesTested: 10,
      workbooksSubmitted: 3,
    },
    findingsByCategory: [
      { category: "Ownership", totalTests: 50, passCount: 40, failCount: 8, naCount: 2, failRate: 16.0 },
      { category: "AML", totalTests: 50, passCount: 42, failCount: 6, naCount: 2, failRate: 12.0 },
      { category: "Entity Profile", totalTests: 75, passCount: 68, failCount: 5, naCount: 2, failRate: 6.7 },
      { category: "Registration", totalTests: 25, passCount: 22, failCount: 2, naCount: 1, failRate: 8.0 },
      { category: "EDD", totalTests: 25, passCount: 21, failCount: 3, naCount: 1, failRate: 12.0 },
      { category: "Compliance", totalTests: 25, passCount: 22, failCount: 1, naCount: 2, failRate: 4.0 },
    ],
    findingsByAttribute: [
      { attributeId: "ATTR004", attributeName: "Beneficial Owner Identification", category: "Ownership", totalTests: 25, passCount: 20, failCount: 4, naCount: 1, failRate: 16.0, observations: ["Documentation appears incomplete. Additional verification required."] },
      { attributeId: "ATTR005", attributeName: "Beneficial Owner Verification", category: "Ownership", totalTests: 25, passCount: 20, failCount: 4, naCount: 1, failRate: 16.0, observations: ["Supporting evidence provided does not fully address the requirement."] },
      { attributeId: "ATTR006", attributeName: "PEP Screening", category: "AML", totalTests: 25, passCount: 22, failCount: 3, naCount: 0, failRate: 12.0, observations: ["Third-party verification pending. Awaiting confirmation."] },
      { attributeId: "ATTR007", attributeName: "Sanctions Screening", category: "AML", totalTests: 25, passCount: 22, failCount: 3, naCount: 0, failRate: 12.0, observations: ["Documentation dated outside acceptable period. Updated records needed."] },
      { attributeId: "ATTR009", attributeName: "Source of Funds", category: "EDD", totalTests: 25, passCount: 21, failCount: 3, naCount: 1, failRate: 12.0, observations: ["Additional clarification required from entity management."] },
    ],
    findingsByJurisdiction: [
      { jurisdictionId: "US", jurisdictionName: "United States", totalTests: 100, passCount: 88, passWithObservationCount: 5, fail1Count: 5, fail2Count: 3, questionToLOBCount: 2, naCount: 4, passRate: 88.0, failRate: 8.0, entityCount: 10 },
      { jurisdictionId: "UK", jurisdictionName: "United Kingdom", totalTests: 75, passCount: 65, passWithObservationCount: 5, fail1Count: 4, fail2Count: 3, questionToLOBCount: 1, naCount: 3, passRate: 86.7, failRate: 9.3, entityCount: 8 },
      { jurisdictionId: "HK", jurisdictionName: "Hong Kong", totalTests: 75, passCount: 62, passWithObservationCount: 5, fail1Count: 6, fail2Count: 4, questionToLOBCount: 2, naCount: 3, passRate: 82.7, failRate: 13.3, entityCount: 7 },
    ],
    findingsByAuditor: [
      { auditorId: "AUD001", auditorName: "John Smith", totalTests: 85, passCount: 75, passWithObservationCount: 5, fail1Count: 5, fail2Count: 3, questionToLOBCount: 1, naCount: 3, passRate: 88.2, failRate: 9.4, entityCount: 9, completionRate: 100 },
      { auditorId: "AUD002", auditorName: "Sarah Johnson", totalTests: 85, passCount: 73, passWithObservationCount: 5, fail1Count: 5, fail2Count: 4, questionToLOBCount: 2, naCount: 4, passRate: 85.9, failRate: 10.6, entityCount: 8, completionRate: 100 },
      { auditorId: "AUD003", auditorName: "Michael Chen", totalTests: 80, passCount: 67, passWithObservationCount: 5, fail1Count: 5, fail2Count: 3, questionToLOBCount: 2, naCount: 3, passRate: 83.8, failRate: 10.0, entityCount: 8, completionRate: 100 },
    ],
    findingsByRiskTier: [
      { riskTier: "High", totalTests: 50, passCount: 40, failCount: 8, naCount: 2, passRate: 80.0, failRate: 16.0, entityCount: 5 },
      { riskTier: "Medium", totalTests: 100, passCount: 88, failCount: 9, naCount: 3, passRate: 88.0, failRate: 9.0, entityCount: 10 },
      { riskTier: "Low", totalTests: 100, passCount: 87, failCount: 8, naCount: 5, passRate: 87.0, failRate: 8.0, entityCount: 10 },
    ],
    exceptions: [
      { id: "EXC001", sampleItemId: "REC-00005", entityName: "Entity 5", attributeId: "ATTR004", attributeName: "Beneficial Owner Identification", category: "Ownership", observation: "Documentation appears incomplete. Additional verification required.", evidenceReference: "DOC-005", auditorNotes: "Pending BO certification", resultType: "Fail 1 - Regulatory", jurisdictionId: "US", auditorId: "AUD001", auditorName: "John Smith" },
      { id: "EXC002", sampleItemId: "REC-00012", entityName: "Entity 12", attributeId: "ATTR005", attributeName: "Beneficial Owner Verification", category: "Ownership", observation: "Supporting evidence provided does not fully address the requirement.", evidenceReference: "DOC-012", auditorNotes: "ID copy expired", resultType: "Fail 1 - Regulatory", jurisdictionId: "UK", auditorId: "AUD002", auditorName: "Sarah Johnson" },
      { id: "EXC003", sampleItemId: "REC-00018", entityName: "Entity 18", attributeId: "ATTR006", attributeName: "PEP Screening", category: "AML", observation: "Third-party verification pending. Awaiting confirmation.", evidenceReference: "DOC-018", auditorNotes: "Awaiting vendor response", resultType: "Fail 2 - Procedure", jurisdictionId: "HK", auditorId: "AUD003", auditorName: "Michael Chen" },
      { id: "EXC004", sampleItemId: "REC-00023", entityName: "Entity 23", attributeId: "ATTR007", attributeName: "Sanctions Screening", category: "AML", observation: "Documentation dated outside acceptable period. Updated records needed.", evidenceReference: "DOC-023", auditorNotes: "Screening from 2022", resultType: "Fail 2 - Procedure", jurisdictionId: "US", auditorId: "AUD001", auditorName: "John Smith" },
      { id: "EXC005", sampleItemId: "REC-00007", entityName: "Entity 7", attributeId: "ATTR009", attributeName: "Source of Funds", category: "EDD", observation: "Additional clarification required from entity management.", evidenceReference: "DOC-007", auditorNotes: "Vague description", resultType: "Question to LOB", jurisdictionId: "UK", auditorId: "AUD002", auditorName: "Sarah Johnson" },
    ],
    // NEW: Customer-level findings with multiple observations per customer
    customerFindings: [
      {
        customerId: "REC-00005",
        customerName: "Acme Global Holdings Ltd",
        jurisdictionId: "US",
        partyType: "Corporate",
        riskTier: "High",
        totalTests: 10,
        passCount: 6,
        passWithObservationCount: 2,
        failCount: 1,
        questionCount: 1,
        naCount: 0,
        overallResult: 'Fail',
        observations: [
          { attributeId: "ATTR001", attributeName: "Legal Name Verification", attributeCategory: "Entity Profile", observationText: "Legal name matches incorporation documents but DBA not registered.", auditorId: "AUD001", auditorName: "John Smith", timestamp: new Date() },
          { attributeId: "ATTR002", attributeName: "Address Verification", attributeCategory: "Entity Profile", observationText: "PO Box used as primary address; physical location confirmed separately.", auditorId: "AUD001", auditorName: "John Smith", timestamp: new Date() },
        ],
        questionsToLOB: [
          { attributeId: "ATTR009", attributeName: "Source of Funds", attributeCategory: "EDD", questionText: "Please confirm the nature of intercompany transfers from subsidiary.", auditorId: "AUD001", auditorName: "John Smith", timestamp: new Date() },
        ],
        failures: [
          { attributeId: "ATTR004", attributeName: "Beneficial Owner Identification", attributeCategory: "Ownership", failureType: 'Regulatory', failureReason: "BO certification expired; current ownership structure not documented.", auditorId: "AUD001", auditorName: "John Smith", timestamp: new Date() },
        ],
      },
      {
        customerId: "REC-00012",
        customerName: "Oceanic Trade Partners Inc",
        jurisdictionId: "UK",
        partyType: "Corporate",
        riskTier: "Medium",
        totalTests: 10,
        passCount: 5,
        passWithObservationCount: 3,
        failCount: 2,
        questionCount: 0,
        naCount: 0,
        overallResult: 'Fail',
        observations: [
          { attributeId: "ATTR003", attributeName: "Tax Identification", attributeCategory: "Registration", observationText: "Tax ID valid but renewal pending within 30 days.", auditorId: "AUD002", auditorName: "Sarah Johnson", timestamp: new Date() },
          { attributeId: "ATTR006", attributeName: "PEP Screening", attributeCategory: "AML", observationText: "No PEP matches found; enhanced screening completed due to jurisdiction.", auditorId: "AUD002", auditorName: "Sarah Johnson", timestamp: new Date() },
          { attributeId: "ATTR008", attributeName: "Adverse Media Screening", attributeCategory: "AML", observationText: "Historical media mention from 2019 reviewed and deemed immaterial.", auditorId: "AUD002", auditorName: "Sarah Johnson", timestamp: new Date() },
        ],
        questionsToLOB: [],
        failures: [
          { attributeId: "ATTR005", attributeName: "Beneficial Owner Verification", attributeCategory: "Ownership", failureType: 'Regulatory', failureReason: "ID documentation for 25% owner expired.", auditorId: "AUD002", auditorName: "Sarah Johnson", timestamp: new Date() },
          { attributeId: "ATTR010", attributeName: "Expected Activity", attributeCategory: "EDD", failureType: 'Procedure', failureReason: "Transaction volume significantly exceeds documented expected activity.", auditorId: "AUD002", auditorName: "Sarah Johnson", timestamp: new Date() },
        ],
      },
      {
        customerId: "REC-00018",
        customerName: "Pacific Rim Investments Group",
        jurisdictionId: "HK",
        partyType: "Investment Fund",
        riskTier: "High",
        totalTests: 10,
        passCount: 6,
        passWithObservationCount: 2,
        failCount: 1,
        questionCount: 1,
        naCount: 0,
        overallResult: 'Fail',
        observations: [
          { attributeId: "ATTR001", attributeName: "Legal Name Verification", attributeCategory: "Entity Profile", observationText: "Name verified against HK registry; Chinese characters transliteration noted.", auditorId: "AUD003", auditorName: "Michael Chen", timestamp: new Date() },
          { attributeId: "ATTR007", attributeName: "Sanctions Screening", attributeCategory: "AML", observationText: "No direct matches; affiliated entity in mainland China screened separately.", auditorId: "AUD003", auditorName: "Michael Chen", timestamp: new Date() },
        ],
        questionsToLOB: [
          { attributeId: "ATTR011", attributeName: "Fund Structure", attributeCategory: "EDD", questionText: "Please clarify the relationship with feeder funds domiciled in Cayman Islands.", auditorId: "AUD003", auditorName: "Michael Chen", timestamp: new Date() },
        ],
        failures: [
          { attributeId: "ATTR006", attributeName: "PEP Screening", attributeCategory: "AML", failureType: 'Procedure', failureReason: "PEP screening not completed within required timeframe per procedure.", auditorId: "AUD003", auditorName: "Michael Chen", timestamp: new Date() },
        ],
      },
      {
        customerId: "REC-00007",
        customerName: "Nordic Shipping Solutions AS",
        jurisdictionId: "UK",
        partyType: "Corporate",
        riskTier: "Medium",
        totalTests: 10,
        passCount: 7,
        passWithObservationCount: 2,
        failCount: 0,
        questionCount: 1,
        naCount: 0,
        overallResult: 'Question',
        observations: [
          { attributeId: "ATTR002", attributeName: "Address Verification", attributeCategory: "Entity Profile", observationText: "Registered office different from operational headquarters; both verified.", auditorId: "AUD002", auditorName: "Sarah Johnson", timestamp: new Date() },
          { attributeId: "ATTR004", attributeName: "Beneficial Owner Identification", attributeCategory: "Ownership", observationText: "Complex ownership through Norwegian holding company; full chain documented.", auditorId: "AUD002", auditorName: "Sarah Johnson", timestamp: new Date() },
        ],
        questionsToLOB: [
          { attributeId: "ATTR009", attributeName: "Source of Funds", attributeCategory: "EDD", questionText: "Please confirm whether charter revenue from sanctioned vessel routes is excluded.", auditorId: "AUD002", auditorName: "Sarah Johnson", timestamp: new Date() },
        ],
        failures: [],
      },
      {
        customerId: "REC-00023",
        customerName: "Midwest Agricultural Cooperative",
        jurisdictionId: "US",
        partyType: "Cooperative",
        riskTier: "Low",
        totalTests: 10,
        passCount: 8,
        passWithObservationCount: 1,
        failCount: 1,
        questionCount: 0,
        naCount: 0,
        overallResult: 'Fail',
        observations: [
          { attributeId: "ATTR003", attributeName: "Tax Identification", attributeCategory: "Registration", observationText: "501(c)(3) status verified; annual renewal documentation on file.", auditorId: "AUD001", auditorName: "John Smith", timestamp: new Date() },
        ],
        questionsToLOB: [],
        failures: [
          { attributeId: "ATTR007", attributeName: "Sanctions Screening", attributeCategory: "AML", failureType: 'Procedure', failureReason: "Sanctions screening dated December 2022; exceeds 12-month refresh requirement.", auditorId: "AUD001", auditorName: "John Smith", timestamp: new Date() },
        ],
      },
      {
        customerId: "REC-00015",
        customerName: "Mediterranean Hospitality Group",
        jurisdictionId: "UK",
        partyType: "Corporate",
        riskTier: "Medium",
        totalTests: 10,
        passCount: 7,
        passWithObservationCount: 3,
        failCount: 0,
        questionCount: 0,
        naCount: 0,
        overallResult: 'Pass w/Observation',
        observations: [
          { attributeId: "ATTR001", attributeName: "Legal Name Verification", attributeCategory: "Entity Profile", observationText: "Trading names in multiple EU countries verified against local registries.", auditorId: "AUD002", auditorName: "Sarah Johnson", timestamp: new Date() },
          { attributeId: "ATTR005", attributeName: "Beneficial Owner Verification", attributeCategory: "Ownership", observationText: "Family trust structure documented; beneficial ownership traced to individuals.", auditorId: "AUD002", auditorName: "Sarah Johnson", timestamp: new Date() },
          { attributeId: "ATTR008", attributeName: "Adverse Media Screening", attributeCategory: "AML", observationText: "COVID-19 related media coverage reviewed; no compliance concerns identified.", auditorId: "AUD002", auditorName: "Sarah Johnson", timestamp: new Date() },
        ],
        questionsToLOB: [],
        failures: [],
      },
      {
        customerId: "REC-00021",
        customerName: "Digital Assets Trading LLC",
        jurisdictionId: "US",
        partyType: "FinTech",
        riskTier: "High",
        totalTests: 10,
        passCount: 6,
        passWithObservationCount: 2,
        failCount: 0,
        questionCount: 2,
        naCount: 0,
        overallResult: 'Question',
        observations: [
          { attributeId: "ATTR003", attributeName: "Tax Identification", attributeCategory: "Registration", observationText: "State money transmitter licenses verified for 48 states; 2 pending.", auditorId: "AUD001", auditorName: "John Smith", timestamp: new Date() },
          { attributeId: "ATTR006", attributeName: "PEP Screening", attributeCategory: "AML", observationText: "Board member formerly employed by CFTC; no active PEP status.", auditorId: "AUD001", auditorName: "John Smith", timestamp: new Date() },
        ],
        questionsToLOB: [
          { attributeId: "ATTR009", attributeName: "Source of Funds", attributeCategory: "EDD", questionText: "Please clarify wallet custody arrangements for customer digital assets.", auditorId: "AUD001", auditorName: "John Smith", timestamp: new Date() },
          { attributeId: "ATTR012", attributeName: "Business Model", attributeCategory: "EDD", questionText: "Confirm whether DeFi protocol interactions are within approved product scope.", auditorId: "AUD001", auditorName: "John Smith", timestamp: new Date() },
        ],
        failures: [],
      },
    ],
    rawData: {
      workbookIds: ["mock-wb-001", "mock-wb-002", "mock-wb-003"],
      totalRows: 250,
    },
  };
}

// ============================================================================
// NEW TEST GRID CONSOLIDATION FUNCTIONS
// ============================================================================

/**
 * Consolidate from new test grid format (GeneratedWorkbook[])
 * This is the primary consolidation function for the new generation engine
 */
export function consolidateTestGridWorkbooks(
  workbooks: GeneratedWorkbook[]
): ConsolidationResult {
  if (workbooks.length === 0) {
    return createEmptyConsolidation("");
  }

  // Gather all rows from all workbooks
  const allRows: TestGridRow[] = workbooks.flatMap((wb) => wb.rows);

  // Calculate comprehensive metrics
  const metrics = calculateTestGridMetrics(allRows, workbooks.length);

  // Group by category
  const findingsByCategory = calculateTestGridFindingsByCategory(allRows);

  // Group by attribute
  const findingsByAttribute = calculateTestGridFindingsByAttribute(allRows);

  // Group by jurisdiction
  const findingsByJurisdiction = calculateFindingsByJurisdiction(allRows);

  // Group by auditor
  const findingsByAuditor = calculateFindingsByAuditor(allRows);

  // Group by risk tier (based on IRR)
  const findingsByRiskTier = calculateFindingsByRiskTier(allRows);

  // Extract exceptions (all failure types)
  const exceptions = extractTestGridExceptions(allRows);

  // NEW: Consolidate findings by customer (multiple observations per customer)
  const customerFindings = consolidateByCustomer(allRows);

  return {
    id: `CONSOL-${Date.now()}`,
    auditRunId: workbooks[0]?.auditorId ? `BATCH-${Date.now()}` : "",
    generatedAt: new Date().toISOString(),
    metrics,
    findingsByCategory,
    findingsByAttribute,
    findingsByJurisdiction,
    findingsByAuditor,
    findingsByRiskTier,
    exceptions,
    customerFindings,
    rawData: {
      workbookIds: workbooks.map((wb) => wb.auditorId),
      totalRows: allRows.length,
      testGridRows: allRows,
    },
  };
}

/**
 * Calculate metrics from TestGridRow[] format
 */
function calculateTestGridMetrics(
  rows: TestGridRow[],
  workbookCount: number
): ConsolidatedMetrics {
  const totalTests = rows.length;
  let passCount = 0;
  let passWithObservationCount = 0;
  let fail1RegulatoryCount = 0;
  let fail2ProcedureCount = 0;
  let questionToLOBCount = 0;
  let naCount = 0;

  for (const row of rows) {
    switch (row.result) {
      case "Pass":
        passCount++;
        break;
      case "Pass w/Observation":
        passWithObservationCount++;
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
    }
  }

  const totalFailCount = fail1RegulatoryCount + fail2ProcedureCount;
  const totalPassCount = passCount + passWithObservationCount;
  const testedRows = totalPassCount + totalFailCount + naCount + questionToLOBCount;
  const passRate = testedRows > 0 ? (totalPassCount / testedRows) * 100 : 0;
  const failRate = testedRows > 0 ? (totalFailCount / testedRows) * 100 : 0;

  const uniqueEntities = new Set(rows.map((r) => r.caseId));
  const uniqueAttributes = new Set(rows.map((r) => r.attributeId));

  return {
    totalTests,
    passCount,
    passWithObservationCount,
    failCount: totalFailCount,
    fail1RegulatoryCount,
    fail2ProcedureCount,
    questionToLOBCount,
    naCount,
    passRate,
    failRate,
    exceptionsCount: totalFailCount + questionToLOBCount,
    uniqueEntitiesTested: uniqueEntities.size,
    uniqueAttributesTested: uniqueAttributes.size,
    workbooksSubmitted: workbookCount,
  };
}

/**
 * Calculate findings by category from test grid rows
 */
function calculateTestGridFindingsByCategory(rows: TestGridRow[]): FindingsByCategory[] {
  const categories = new Map<string, FindingsByCategory>();

  for (const row of rows) {
    const cat = row.category || "Uncategorized";

    if (!categories.has(cat)) {
      categories.set(cat, {
        category: cat,
        totalTests: 0,
        passCount: 0,
        failCount: 0,
        naCount: 0,
        failRate: 0,
      });
    }

    const finding = categories.get(cat)!;
    finding.totalTests++;

    if (row.result === "Pass" || row.result === "Pass w/Observation") {
      finding.passCount++;
    } else if (row.result === "Fail 1 - Regulatory" || row.result === "Fail 2 - Procedure") {
      finding.failCount++;
    } else if (row.result === "N/A") {
      finding.naCount++;
    }
  }

  // Calculate fail rates
  for (const finding of categories.values()) {
    const tested = finding.passCount + finding.failCount + finding.naCount;
    finding.failRate = tested > 0 ? (finding.failCount / tested) * 100 : 0;
  }

  return Array.from(categories.values()).sort((a, b) => b.failRate - a.failRate);
}

/**
 * Calculate findings by attribute from test grid rows
 */
function calculateTestGridFindingsByAttribute(rows: TestGridRow[]): FindingsByAttribute[] {
  const attributes = new Map<string, FindingsByAttribute>();

  for (const row of rows) {
    const attrId = row.attributeId;

    if (!attributes.has(attrId)) {
      attributes.set(attrId, {
        attributeId: attrId,
        attributeName: row.attributeName,
        category: row.category,
        totalTests: 0,
        passCount: 0,
        failCount: 0,
        naCount: 0,
        failRate: 0,
        observations: [],
      });
    }

    const finding = attributes.get(attrId)!;
    finding.totalTests++;

    if (row.result === "Pass" || row.result === "Pass w/Observation") {
      finding.passCount++;
    } else if (row.result === "Fail 1 - Regulatory" || row.result === "Fail 2 - Procedure") {
      finding.failCount++;
      if (row.comments && !finding.observations.includes(row.comments)) {
        finding.observations.push(row.comments);
      }
    } else if (row.result === "N/A") {
      finding.naCount++;
    }
  }

  // Calculate fail rates
  for (const finding of attributes.values()) {
    const tested = finding.passCount + finding.failCount + finding.naCount;
    finding.failRate = tested > 0 ? (finding.failCount / tested) * 100 : 0;
  }

  return Array.from(attributes.values()).sort((a, b) => b.failRate - a.failRate);
}

/**
 * Calculate findings by jurisdiction
 */
function calculateFindingsByJurisdiction(rows: TestGridRow[]): JurisdictionMetrics[] {
  const jurisdictions = new Map<string, JurisdictionMetrics>();

  for (const row of rows) {
    const jurId = row.jurisdictionId || "Unknown";

    if (!jurisdictions.has(jurId)) {
      jurisdictions.set(jurId, {
        jurisdictionId: jurId,
        jurisdictionName: jurId, // Could be enhanced with a lookup
        totalTests: 0,
        passCount: 0,
        passWithObservationCount: 0,
        fail1Count: 0,
        fail2Count: 0,
        questionToLOBCount: 0,
        naCount: 0,
        passRate: 0,
        failRate: 0,
        entityCount: 0,
      });
    }

    const finding = jurisdictions.get(jurId)!;
    finding.totalTests++;

    switch (row.result) {
      case "Pass":
        finding.passCount++;
        break;
      case "Pass w/Observation":
        finding.passWithObservationCount++;
        break;
      case "Fail 1 - Regulatory":
        finding.fail1Count++;
        break;
      case "Fail 2 - Procedure":
        finding.fail2Count++;
        break;
      case "Question to LOB":
        finding.questionToLOBCount++;
        break;
      case "N/A":
        finding.naCount++;
        break;
    }
  }

  // Calculate rates and entity counts
  for (const [jurId, finding] of jurisdictions) {
    const tested = finding.passCount + finding.passWithObservationCount +
                   finding.fail1Count + finding.fail2Count + finding.naCount;
    finding.passRate = tested > 0 ? ((finding.passCount + finding.passWithObservationCount) / tested) * 100 : 0;
    finding.failRate = tested > 0 ? ((finding.fail1Count + finding.fail2Count) / tested) * 100 : 0;

    // Count unique entities per jurisdiction
    const entitiesInJur = new Set(rows.filter(r => r.jurisdictionId === jurId).map(r => r.caseId));
    finding.entityCount = entitiesInJur.size;
  }

  return Array.from(jurisdictions.values()).sort((a, b) => b.totalTests - a.totalTests);
}

/**
 * Calculate findings by auditor
 */
function calculateFindingsByAuditor(rows: TestGridRow[]): AuditorMetrics[] {
  const auditors = new Map<string, AuditorMetrics>();

  for (const row of rows) {
    const audId = row.auditor || "Unknown";

    if (!auditors.has(audId)) {
      auditors.set(audId, {
        auditorId: audId,
        auditorName: row.auditorName || audId,
        totalTests: 0,
        passCount: 0,
        passWithObservationCount: 0,
        fail1Count: 0,
        fail2Count: 0,
        questionToLOBCount: 0,
        naCount: 0,
        passRate: 0,
        failRate: 0,
        entityCount: 0,
        completionRate: 0,
      });
    }

    const finding = auditors.get(audId)!;
    finding.totalTests++;

    switch (row.result) {
      case "Pass":
        finding.passCount++;
        break;
      case "Pass w/Observation":
        finding.passWithObservationCount++;
        break;
      case "Fail 1 - Regulatory":
        finding.fail1Count++;
        break;
      case "Fail 2 - Procedure":
        finding.fail2Count++;
        break;
      case "Question to LOB":
        finding.questionToLOBCount++;
        break;
      case "N/A":
        finding.naCount++;
        break;
    }
  }

  // Calculate rates and entity counts
  for (const [audId, finding] of auditors) {
    const tested = finding.passCount + finding.passWithObservationCount +
                   finding.fail1Count + finding.fail2Count + finding.naCount;
    finding.passRate = tested > 0 ? ((finding.passCount + finding.passWithObservationCount) / tested) * 100 : 0;
    finding.failRate = tested > 0 ? ((finding.fail1Count + finding.fail2Count) / tested) * 100 : 0;

    // Count unique entities per auditor
    const entitiesForAuditor = new Set(rows.filter(r => r.auditor === audId).map(r => r.caseId));
    finding.entityCount = entitiesForAuditor.size;

    // Calculate completion rate (rows with results vs total)
    const auditorRows = rows.filter(r => r.auditor === audId);
    const completedRows = auditorRows.filter(r => r.result !== "").length;
    finding.completionRate = auditorRows.length > 0 ? (completedRows / auditorRows.length) * 100 : 0;
  }

  return Array.from(auditors.values()).sort((a, b) => b.totalTests - a.totalTests);
}

/**
 * Calculate findings by risk tier (based on IRR)
 */
function calculateFindingsByRiskTier(rows: TestGridRow[]): RiskTierMetrics[] {
  const riskTiers = new Map<string, RiskTierMetrics>();

  for (const row of rows) {
    // Determine risk tier based on IRR
    let tier: string;
    if (row.irr >= 4) {
      tier = "Critical";
    } else if (row.irr >= 3) {
      tier = "High";
    } else if (row.irr >= 2) {
      tier = "Medium";
    } else {
      tier = "Low";
    }

    if (!riskTiers.has(tier)) {
      riskTiers.set(tier, {
        riskTier: tier,
        totalTests: 0,
        passCount: 0,
        failCount: 0,
        naCount: 0,
        passRate: 0,
        failRate: 0,
        entityCount: 0,
      });
    }

    const finding = riskTiers.get(tier)!;
    finding.totalTests++;

    if (row.result === "Pass" || row.result === "Pass w/Observation") {
      finding.passCount++;
    } else if (row.result === "Fail 1 - Regulatory" || row.result === "Fail 2 - Procedure") {
      finding.failCount++;
    } else if (row.result === "N/A") {
      finding.naCount++;
    }
  }

  // Calculate rates and entity counts
  for (const [tier, finding] of riskTiers) {
    const tested = finding.passCount + finding.failCount + finding.naCount;
    finding.passRate = tested > 0 ? (finding.passCount / tested) * 100 : 0;
    finding.failRate = tested > 0 ? (finding.failCount / tested) * 100 : 0;

    // Count unique entities per tier
    const entitiesInTier = new Set(
      rows.filter(r => {
        if (r.irr >= 4) return tier === "Critical";
        if (r.irr >= 3) return tier === "High";
        if (r.irr >= 2) return tier === "Medium";
        return tier === "Low";
      }).map(r => r.caseId)
    );
    finding.entityCount = entitiesInTier.size;
  }

  // Sort by risk level (Critical first)
  const tierOrder = ["Critical", "High", "Medium", "Low"];
  return Array.from(riskTiers.values()).sort(
    (a, b) => tierOrder.indexOf(a.riskTier) - tierOrder.indexOf(b.riskTier)
  );
}

/**
 * Extract exceptions from test grid rows
 */
function extractTestGridExceptions(rows: TestGridRow[]): ExceptionDetail[] {
  return rows
    .filter((r) =>
      r.result === "Fail 1 - Regulatory" ||
      r.result === "Fail 2 - Procedure" ||
      r.result === "Question to LOB"
    )
    .map((r, index) => ({
      id: `EXC-${Date.now()}-${index}`,
      sampleItemId: r.caseId,
      entityName: r.legalName,
      attributeId: r.attributeId,
      attributeName: r.attributeName,
      category: r.category,
      observation: r.comments || "",
      evidenceReference: r.sourceFile || "",
      auditorNotes: r.comments || "",
      resultType: r.result as 'Fail 1 - Regulatory' | 'Fail 2 - Procedure' | 'Question to LOB',
      jurisdictionId: r.jurisdictionId,
      auditorId: r.auditor,
      auditorName: r.auditorName,
      partyType: r.partyType,
    }));
}

/**
 * Consolidate findings by customer
 * Groups ALL observations, questions, and failures by customer/entity
 */
export function consolidateByCustomer(rows: TestGridRow[]): ConsolidatedCustomer[] {
  const customerMap = new Map<string, ConsolidatedCustomer>();

  for (const row of rows) {
    const customerId = row.caseId;

    if (!customerMap.has(customerId)) {
      // Determine risk tier based on IRR
      let riskTier: string;
      if (row.irr >= 4) {
        riskTier = "Critical";
      } else if (row.irr >= 3) {
        riskTier = "High";
      } else if (row.irr >= 2) {
        riskTier = "Medium";
      } else {
        riskTier = "Low";
      }

      customerMap.set(customerId, {
        customerId,
        customerName: row.legalName,
        jurisdictionId: row.jurisdictionId || "Unknown",
        partyType: row.partyType || "Unknown",
        riskTier,
        totalTests: 0,
        passCount: 0,
        passWithObservationCount: 0,
        failCount: 0,
        questionCount: 0,
        naCount: 0,
        overallResult: 'Pass',
        observations: [],
        questionsToLOB: [],
        failures: [],
      });
    }

    const customer = customerMap.get(customerId)!;
    customer.totalTests++;

    // Count result types
    switch (row.result) {
      case "Pass":
        customer.passCount++;
        break;
      case "Pass w/Observation":
        customer.passWithObservationCount++;
        // Collect observation
        if (row.comments) {
          customer.observations.push({
            attributeId: row.attributeId,
            attributeName: row.attributeName,
            attributeCategory: row.category,
            observationText: row.comments,
            auditorId: row.auditor || "Unknown",
            auditorName: row.auditorName || "Unknown Auditor",
            timestamp: new Date(),
          });
        }
        break;
      case "Fail 1 - Regulatory":
        customer.failCount++;
        if (row.comments) {
          customer.failures.push({
            attributeId: row.attributeId,
            attributeName: row.attributeName,
            attributeCategory: row.category,
            failureType: 'Regulatory',
            failureReason: row.comments,
            auditorId: row.auditor || "Unknown",
            auditorName: row.auditorName || "Unknown Auditor",
            timestamp: new Date(),
          });
        }
        break;
      case "Fail 2 - Procedure":
        customer.failCount++;
        if (row.comments) {
          customer.failures.push({
            attributeId: row.attributeId,
            attributeName: row.attributeName,
            attributeCategory: row.category,
            failureType: 'Procedure',
            failureReason: row.comments,
            auditorId: row.auditor || "Unknown",
            auditorName: row.auditorName || "Unknown Auditor",
            timestamp: new Date(),
          });
        }
        break;
      case "Question to LOB":
        customer.questionCount++;
        if (row.comments) {
          customer.questionsToLOB.push({
            attributeId: row.attributeId,
            attributeName: row.attributeName,
            attributeCategory: row.category,
            questionText: row.comments,
            auditorId: row.auditor || "Unknown",
            auditorName: row.auditorName || "Unknown Auditor",
            timestamp: new Date(),
          });
        }
        break;
      case "N/A":
        customer.naCount++;
        break;
    }
  }

  // Determine overall result for each customer based on worst outcome
  for (const customer of customerMap.values()) {
    if (customer.failCount > 0) {
      customer.overallResult = 'Fail';
    } else if (customer.questionCount > 0) {
      customer.overallResult = 'Question';
    } else if (customer.passWithObservationCount > 0 || customer.observations.length > 0) {
      customer.overallResult = 'Pass w/Observation';
    } else {
      customer.overallResult = 'Pass';
    }
  }

  // Sort by overall result (Fail first, then Question, then Pass w/Observation, then Pass)
  const resultOrder = { 'Fail': 0, 'Question': 1, 'Pass w/Observation': 2, 'Pass': 3 };
  return Array.from(customerMap.values()).sort((a, b) => {
    const orderDiff = resultOrder[a.overallResult] - resultOrder[b.overallResult];
    if (orderDiff !== 0) return orderDiff;
    // Secondary sort by total findings count
    const aFindingsCount = a.failures.length + a.questionsToLOB.length + a.observations.length;
    const bFindingsCount = b.failures.length + b.questionsToLOB.length + b.observations.length;
    return bFindingsCount - aFindingsCount;
  });
}

// ============================================================================
// CONVENIENCE GETTER FUNCTIONS
// ============================================================================

/**
 * Get metrics grouped by jurisdiction from a consolidation result
 */
export function getMetricsByJurisdiction(result: ConsolidationResult): JurisdictionMetrics[] {
  return result.findingsByJurisdiction;
}

/**
 * Get metrics grouped by auditor from a consolidation result
 */
export function getMetricsByAuditor(result: ConsolidationResult): AuditorMetrics[] {
  return result.findingsByAuditor;
}

/**
 * Get metrics grouped by category from a consolidation result
 */
export function getMetricsByCategory(result: ConsolidationResult): CategoryMetrics[] {
  return result.findingsByCategory.map(cat => ({
    category: cat.category,
    totalTests: cat.totalTests,
    passCount: cat.passCount,
    passWithObservationCount: 0, // Legacy format doesn't track this
    fail1Count: 0,
    fail2Count: 0,
    questionToLOBCount: 0,
    naCount: cat.naCount,
    passRate: cat.totalTests > 0 ? (cat.passCount / cat.totalTests) * 100 : 0,
    failRate: cat.failRate,
    attributeCount: 0,
  }));
}

/**
 * Get metrics grouped by risk tier from a consolidation result
 */
export function getMetricsByRiskTier(result: ConsolidationResult): RiskTierMetrics[] {
  return result.findingsByRiskTier;
}
