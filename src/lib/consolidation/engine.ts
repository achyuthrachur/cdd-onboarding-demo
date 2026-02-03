/**
 * Consolidation Engine
 * Aggregates results from submitted workbooks for reporting
 */

import { WorkbookState, WorkbookRow } from "@/lib/workbook/builder";

export interface ConsolidatedMetrics {
  totalTests: number;
  passCount: number;
  failCount: number;
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
}

export interface ConsolidationResult {
  id: string;
  auditRunId: string;
  generatedAt: string;
  metrics: ConsolidatedMetrics;
  findingsByCategory: FindingsByCategory[];
  findingsByAttribute: FindingsByAttribute[];
  exceptions: ExceptionDetail[];
  rawData: {
    workbookIds: string[];
    totalRows: number;
  };
}

// Consolidate multiple workbooks
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
    exceptions,
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
    failCount,
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
      failCount: 0,
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
    exceptions: [],
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
      passCount: 215,
      failCount: 25,
      naCount: 10,
      passRate: 89.6,
      failRate: 10.4,
      exceptionsCount: 25,
      uniqueEntitiesTested: 25,
      uniqueAttributesTested: 10,
      workbooksSubmitted: 1,
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
    exceptions: [
      { id: "EXC001", sampleItemId: "REC-00005", entityName: "Entity 5", attributeId: "ATTR004", attributeName: "Beneficial Owner Identification", category: "Ownership", observation: "Documentation appears incomplete. Additional verification required.", evidenceReference: "DOC-005", auditorNotes: "Pending BO certification" },
      { id: "EXC002", sampleItemId: "REC-00012", entityName: "Entity 12", attributeId: "ATTR005", attributeName: "Beneficial Owner Verification", category: "Ownership", observation: "Supporting evidence provided does not fully address the requirement.", evidenceReference: "DOC-012", auditorNotes: "ID copy expired" },
      { id: "EXC003", sampleItemId: "REC-00018", entityName: "Entity 18", attributeId: "ATTR006", attributeName: "PEP Screening", category: "AML", observation: "Third-party verification pending. Awaiting confirmation.", evidenceReference: "DOC-018", auditorNotes: "Awaiting vendor response" },
      { id: "EXC004", sampleItemId: "REC-00023", entityName: "Entity 23", attributeId: "ATTR007", attributeName: "Sanctions Screening", category: "AML", observation: "Documentation dated outside acceptable period. Updated records needed.", evidenceReference: "DOC-023", auditorNotes: "Screening from 2022" },
      { id: "EXC005", sampleItemId: "REC-00007", entityName: "Entity 7", attributeId: "ATTR009", attributeName: "Source of Funds", category: "EDD", observation: "Additional clarification required from entity management.", evidenceReference: "DOC-007", auditorNotes: "Vague description" },
    ],
    rawData: {
      workbookIds: ["mock-wb-001"],
      totalRows: 250,
    },
  };
}
