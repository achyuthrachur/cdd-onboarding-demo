/**
 * Consolidation Excel Export
 * Exports consolidation results to Excel format matching Excel output format
 */

import * as XLSX from "xlsx";
import type {
  ConsolidationResult,
  ExceptionDetail,
  FindingsByCategory,
  FindingsByAttribute,
  JurisdictionMetrics,
  AuditorMetrics,
  RiskTierMetrics,
} from "./engine";
import type { TestGridRow } from "@/lib/attribute-library/generation-engine";

/**
 * Export consolidation results to a multi-sheet Excel workbook
 */
export function exportConsolidationToExcel(result: ConsolidationResult): Blob {
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Executive Summary
  const executiveSummarySheet = createExecutiveSummarySheet(result);
  XLSX.utils.book_append_sheet(workbook, executiveSummarySheet, "Executive Summary");

  // Sheet 2: Findings by Category
  const categorySheet = createCategorySheet(result.findingsByCategory);
  XLSX.utils.book_append_sheet(workbook, categorySheet, "By Category");

  // Sheet 3: Findings by Attribute
  const attributeSheet = createAttributeSheet(result.findingsByAttribute);
  XLSX.utils.book_append_sheet(workbook, attributeSheet, "By Attribute");

  // Sheet 4: Findings by Jurisdiction
  if (result.findingsByJurisdiction.length > 0) {
    const jurisdictionSheet = createJurisdictionSheet(result.findingsByJurisdiction);
    XLSX.utils.book_append_sheet(workbook, jurisdictionSheet, "By Jurisdiction");
  }

  // Sheet 5: Findings by Auditor
  if (result.findingsByAuditor.length > 0) {
    const auditorSheet = createAuditorSheet(result.findingsByAuditor);
    XLSX.utils.book_append_sheet(workbook, auditorSheet, "By Auditor");
  }

  // Sheet 6: Findings by Risk Tier
  if (result.findingsByRiskTier.length > 0) {
    const riskTierSheet = createRiskTierSheet(result.findingsByRiskTier);
    XLSX.utils.book_append_sheet(workbook, riskTierSheet, "By Risk Tier");
  }

  // Sheet 7: Exceptions Detail
  const exceptionsSheet = createExceptionsSheet(result.exceptions);
  XLSX.utils.book_append_sheet(workbook, exceptionsSheet, "Exceptions Detail");

  // Sheet 8: Raw Data (if available)
  if (result.rawData.testGridRows && result.rawData.testGridRows.length > 0) {
    const rawDataSheet = createRawDataSheet(result.rawData.testGridRows);
    XLSX.utils.book_append_sheet(workbook, rawDataSheet, "Raw Data");
  }

  // Generate Excel buffer
  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  return new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

/**
 * Create Executive Summary sheet
 */
function createExecutiveSummarySheet(result: ConsolidationResult): XLSX.WorkSheet {
  const { metrics } = result;

  const data = [
    ["CDD Audit Consolidation Report"],
    [""],
    ["Report Information"],
    ["Report ID", result.id],
    ["Audit Run ID", result.auditRunId],
    ["Generated At", new Date(result.generatedAt).toLocaleString()],
    [""],
    ["Test Summary"],
    ["Total Tests Performed", metrics.totalTests],
    ["Workbooks Submitted", metrics.workbooksSubmitted],
    ["Unique Entities Tested", metrics.uniqueEntitiesTested],
    ["Unique Attributes Tested", metrics.uniqueAttributesTested],
    [""],
    ["Results Summary"],
    ["Pass", metrics.passCount, formatPercent(metrics.passCount, metrics.totalTests)],
    ["Pass with Observation", metrics.passWithObservationCount, formatPercent(metrics.passWithObservationCount, metrics.totalTests)],
    ["Fail 1 - Regulatory", metrics.fail1RegulatoryCount, formatPercent(metrics.fail1RegulatoryCount, metrics.totalTests)],
    ["Fail 2 - Procedure", metrics.fail2ProcedureCount, formatPercent(metrics.fail2ProcedureCount, metrics.totalTests)],
    ["Question to LOB", metrics.questionToLOBCount, formatPercent(metrics.questionToLOBCount, metrics.totalTests)],
    ["N/A", metrics.naCount, formatPercent(metrics.naCount, metrics.totalTests)],
    [""],
    ["Key Metrics"],
    ["Overall Pass Rate", `${metrics.passRate.toFixed(2)}%`],
    ["Overall Fail Rate", `${metrics.failRate.toFixed(2)}%`],
    ["Total Exceptions", metrics.exceptionsCount],
  ];

  const sheet = XLSX.utils.aoa_to_sheet(data);

  // Set column widths
  sheet["!cols"] = [
    { wch: 25 },
    { wch: 20 },
    { wch: 15 },
  ];

  // Apply merge for title row
  sheet["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } },
  ];

  return sheet;
}

/**
 * Create Findings by Category sheet
 */
function createCategorySheet(findings: FindingsByCategory[]): XLSX.WorkSheet {
  const headers = [
    "Category",
    "Total Tests",
    "Pass Count",
    "Fail Count",
    "N/A Count",
    "Fail Rate (%)",
    "Pass Rate (%)",
  ];

  const rows = findings.map(f => [
    f.category,
    f.totalTests,
    f.passCount,
    f.failCount,
    f.naCount,
    f.failRate.toFixed(2),
    ((f.passCount / f.totalTests) * 100).toFixed(2),
  ]);

  // Add totals row
  const totalTests = findings.reduce((sum, f) => sum + f.totalTests, 0);
  const totalPass = findings.reduce((sum, f) => sum + f.passCount, 0);
  const totalFail = findings.reduce((sum, f) => sum + f.failCount, 0);
  const totalNA = findings.reduce((sum, f) => sum + f.naCount, 0);

  rows.push([
    "TOTAL",
    totalTests,
    totalPass,
    totalFail,
    totalNA,
    totalTests > 0 ? ((totalFail / totalTests) * 100).toFixed(2) : "0.00",
    totalTests > 0 ? ((totalPass / totalTests) * 100).toFixed(2) : "0.00",
  ]);

  const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  sheet["!cols"] = calculateColumnWidths([headers, ...rows]);

  return sheet;
}

/**
 * Create Findings by Attribute sheet
 */
function createAttributeSheet(findings: FindingsByAttribute[]): XLSX.WorkSheet {
  const headers = [
    "Attribute ID",
    "Attribute Name",
    "Category",
    "Total Tests",
    "Pass Count",
    "Fail Count",
    "N/A Count",
    "Fail Rate (%)",
    "Observations",
  ];

  const rows = findings.map(f => [
    f.attributeId,
    f.attributeName,
    f.category,
    f.totalTests,
    f.passCount,
    f.failCount,
    f.naCount,
    f.failRate.toFixed(2),
    f.observations.slice(0, 3).join("; "), // Limit observations for display
  ]);

  const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  sheet["!cols"] = [
    { wch: 15 },
    { wch: 35 },
    { wch: 20 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 60 },
  ];

  return sheet;
}

/**
 * Create Findings by Jurisdiction sheet
 */
function createJurisdictionSheet(findings: JurisdictionMetrics[]): XLSX.WorkSheet {
  const headers = [
    "Jurisdiction ID",
    "Jurisdiction Name",
    "Entity Count",
    "Total Tests",
    "Pass",
    "Pass w/Obs",
    "Fail 1 - Reg",
    "Fail 2 - Proc",
    "Q to LOB",
    "N/A",
    "Pass Rate (%)",
    "Fail Rate (%)",
  ];

  const rows = findings.map(f => [
    f.jurisdictionId,
    f.jurisdictionName,
    f.entityCount,
    f.totalTests,
    f.passCount,
    f.passWithObservationCount,
    f.fail1Count,
    f.fail2Count,
    f.questionToLOBCount,
    f.naCount,
    f.passRate.toFixed(2),
    f.failRate.toFixed(2),
  ]);

  // Add totals row
  const totals = findings.reduce(
    (acc, f) => ({
      entityCount: acc.entityCount + f.entityCount,
      totalTests: acc.totalTests + f.totalTests,
      passCount: acc.passCount + f.passCount,
      passWithObservationCount: acc.passWithObservationCount + f.passWithObservationCount,
      fail1Count: acc.fail1Count + f.fail1Count,
      fail2Count: acc.fail2Count + f.fail2Count,
      questionToLOBCount: acc.questionToLOBCount + f.questionToLOBCount,
      naCount: acc.naCount + f.naCount,
    }),
    { entityCount: 0, totalTests: 0, passCount: 0, passWithObservationCount: 0, fail1Count: 0, fail2Count: 0, questionToLOBCount: 0, naCount: 0 }
  );

  const totalPassRate = totals.totalTests > 0
    ? ((totals.passCount + totals.passWithObservationCount) / totals.totalTests) * 100
    : 0;
  const totalFailRate = totals.totalTests > 0
    ? ((totals.fail1Count + totals.fail2Count) / totals.totalTests) * 100
    : 0;

  rows.push([
    "TOTAL",
    "",
    totals.entityCount,
    totals.totalTests,
    totals.passCount,
    totals.passWithObservationCount,
    totals.fail1Count,
    totals.fail2Count,
    totals.questionToLOBCount,
    totals.naCount,
    totalPassRate.toFixed(2),
    totalFailRate.toFixed(2),
  ]);

  const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  sheet["!cols"] = calculateColumnWidths([headers, ...rows]);

  return sheet;
}

/**
 * Create Findings by Auditor sheet
 */
function createAuditorSheet(findings: AuditorMetrics[]): XLSX.WorkSheet {
  const headers = [
    "Auditor ID",
    "Auditor Name",
    "Entity Count",
    "Total Tests",
    "Pass",
    "Pass w/Obs",
    "Fail 1 - Reg",
    "Fail 2 - Proc",
    "Q to LOB",
    "N/A",
    "Pass Rate (%)",
    "Fail Rate (%)",
    "Completion (%)",
  ];

  const rows = findings.map(f => [
    f.auditorId,
    f.auditorName,
    f.entityCount,
    f.totalTests,
    f.passCount,
    f.passWithObservationCount,
    f.fail1Count,
    f.fail2Count,
    f.questionToLOBCount,
    f.naCount,
    f.passRate.toFixed(2),
    f.failRate.toFixed(2),
    f.completionRate.toFixed(2),
  ]);

  const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  sheet["!cols"] = calculateColumnWidths([headers, ...rows]);

  return sheet;
}

/**
 * Create Findings by Risk Tier sheet
 */
function createRiskTierSheet(findings: RiskTierMetrics[]): XLSX.WorkSheet {
  const headers = [
    "Risk Tier",
    "Entity Count",
    "Total Tests",
    "Pass Count",
    "Fail Count",
    "N/A Count",
    "Pass Rate (%)",
    "Fail Rate (%)",
  ];

  const rows = findings.map(f => [
    f.riskTier,
    f.entityCount,
    f.totalTests,
    f.passCount,
    f.failCount,
    f.naCount,
    f.passRate.toFixed(2),
    f.failRate.toFixed(2),
  ]);

  const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  sheet["!cols"] = calculateColumnWidths([headers, ...rows]);

  return sheet;
}

/**
 * Create Exceptions Detail sheet
 */
function createExceptionsSheet(exceptions: ExceptionDetail[]): XLSX.WorkSheet {
  const headers = [
    "Exception ID",
    "Entity Name",
    "Case ID",
    "Jurisdiction",
    "Attribute ID",
    "Attribute Name",
    "Category",
    "Result Type",
    "Observation",
    "Evidence Reference",
    "Auditor ID",
    "Auditor Name",
    "Auditor Notes",
  ];

  const rows = exceptions.map(e => [
    e.id,
    e.entityName,
    e.sampleItemId,
    e.jurisdictionId || "",
    e.attributeId,
    e.attributeName,
    e.category,
    e.resultType || "Fail",
    e.observation,
    e.evidenceReference,
    e.auditorId || "",
    e.auditorName || "",
    e.auditorNotes,
  ]);

  const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  sheet["!cols"] = [
    { wch: 20 },
    { wch: 25 },
    { wch: 15 },
    { wch: 12 },
    { wch: 15 },
    { wch: 35 },
    { wch: 15 },
    { wch: 18 },
    { wch: 50 },
    { wch: 20 },
    { wch: 12 },
    { wch: 20 },
    { wch: 40 },
  ];

  return sheet;
}

/**
 * Create Raw Data sheet from test grid rows
 */
function createRawDataSheet(rows: TestGridRow[]): XLSX.WorkSheet {
  const headers = [
    "Row ID",
    "Auditor",
    "Auditor Name",
    "Legal Name",
    "Case ID",
    "Jurisdiction",
    "Party Type",
    "IRR",
    "DRR",
    "Attribute ID",
    "Attribute Name",
    "Category",
    "Group",
    "Result",
    "Comments",
    "Source File",
    "Source",
    "Source Page",
    "KYC Date",
    "Primary FLU",
    "Pass Count",
    "Fail 1 Count",
    "Fail 2 Count",
    "N/A Count",
    "Percent Complete",
  ];

  const dataRows = rows.map(r => [
    r.rowId,
    r.auditor,
    r.auditorName,
    r.legalName,
    r.caseId,
    r.jurisdictionId,
    r.partyType,
    r.irr,
    r.drr,
    r.attributeId,
    r.attributeName,
    r.category,
    r.group,
    r.result,
    r.comments,
    r.sourceFile,
    r.source,
    r.sourcePage,
    r.kycDate,
    r.primaryFLU,
    r.passCount,
    r.fail1RegulatoryCount,
    r.fail2ProcedureCount,
    r.naCount,
    r.percentComplete.toFixed(2),
  ]);

  const sheet = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
  sheet["!cols"] = calculateColumnWidths([headers, ...dataRows.slice(0, 100)]); // Sample first 100 for width calc

  return sheet;
}

// Helper functions

function formatPercent(value: number, total: number): string {
  if (total === 0) return "0.00%";
  return `${((value / total) * 100).toFixed(2)}%`;
}

function calculateColumnWidths(data: (string | number | undefined)[][]): { wch: number }[] {
  if (data.length === 0) return [];

  const numCols = Math.max(...data.map(row => row.length));
  const widths: { wch: number }[] = [];

  for (let col = 0; col < numCols; col++) {
    let maxLength = 0;
    for (const row of data) {
      const cell = row[col];
      const cellLength = cell !== undefined ? String(cell).length : 0;
      if (cellLength > maxLength) {
        maxLength = cellLength;
      }
    }
    // Limit width between 10 and 50 characters
    widths.push({ wch: Math.min(Math.max(maxLength + 2, 10), 50) });
  }

  return widths;
}

/**
 * Download consolidation as Excel file
 */
export function downloadConsolidationExcel(
  result: ConsolidationResult,
  filename?: string
): void {
  const blob = exportConsolidationToExcel(result);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename || `consolidation-report-${new Date().toISOString().split("T")[0]}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
