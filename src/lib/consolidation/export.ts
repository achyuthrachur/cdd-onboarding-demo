/**
 * Consolidation Excel Export
 * Exports consolidation results to Excel format with proper Excel table formatting
 * Uses ExcelJS for advanced formatting features like tables, filters, and frozen panes
 */

import * as ExcelJS from "exceljs";
import type {
  ConsolidationResult,
  ExceptionDetail,
  FindingsByCategory,
  FindingsByAttribute,
  JurisdictionMetrics,
  AuditorMetrics,
  RiskTierMetrics,
  ConsolidatedCustomer,
} from "./engine";
import type { TestGridRow } from "@/lib/attribute-library/generation-engine";

/**
 * Export consolidation results to a multi-sheet Excel workbook with proper table formatting
 */
export async function exportConsolidationToExcel(result: ConsolidationResult): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "CDD Onboarding Demo";
  workbook.created = new Date();
  workbook.modified = new Date();

  // Sheet 1: Executive Summary (Dashboard)
  createExecutiveSummarySheet(workbook, result);

  // Sheet 2: Findings by Category
  if (result.findingsByCategory.length > 0) {
    createCategorySheet(workbook, result.findingsByCategory);
  }

  // Sheet 3: Findings by Attribute
  if (result.findingsByAttribute.length > 0) {
    createAttributeSheet(workbook, result.findingsByAttribute);
  }

  // Sheet 4: Findings by Jurisdiction
  if (result.findingsByJurisdiction.length > 0) {
    createJurisdictionSheet(workbook, result.findingsByJurisdiction);
  }

  // Sheet 5: Findings by Auditor
  if (result.findingsByAuditor.length > 0) {
    createAuditorSheet(workbook, result.findingsByAuditor);
  }

  // Sheet 6: Findings by Risk Tier
  if (result.findingsByRiskTier.length > 0) {
    createRiskTierSheet(workbook, result.findingsByRiskTier);
  }

  // Sheet 7: Exceptions Detail
  if (result.exceptions.length > 0) {
    createExceptionsSheet(workbook, result.exceptions);
  }

  // Sheet 8: Customer Findings (all observations per customer)
  if (result.customerFindings && result.customerFindings.length > 0) {
    createCustomerFindingsSheet(workbook, result.customerFindings);
  }

  // Sheet 9: Raw Data (if available)
  if (result.rawData.testGridRows && result.rawData.testGridRows.length > 0) {
    createRawDataSheet(workbook, result.rawData.testGridRows);
  }

  // Generate Excel buffer
  const buffer = await workbook.xlsx.writeBuffer();

  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

/**
 * Create Executive Summary sheet (Dashboard style - no table)
 */
function createExecutiveSummarySheet(workbook: ExcelJS.Workbook, result: ConsolidationResult): void {
  const sheet = workbook.addWorksheet("Executive Summary", {
    properties: { tabColor: { argb: "FF002E62" } }, // Crowe Indigo
  });

  const { metrics } = result;

  // Title
  sheet.mergeCells("A1:C1");
  const titleCell = sheet.getCell("A1");
  titleCell.value = "CDD Audit Consolidation Report";
  titleCell.font = { size: 18, bold: true, color: { argb: "FF002E62" } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(1).height = 30;

  // Report Information Section
  let row = 3;
  sheet.getCell(`A${row}`).value = "Report Information";
  sheet.getCell(`A${row}`).font = { bold: true, size: 14, color: { argb: "FF002E62" } };
  row++;

  const reportInfo = [
    ["Report ID", result.id],
    ["Audit Run ID", result.auditRunId],
    ["Generated At", new Date(result.generatedAt).toLocaleString()],
  ];

  for (const [label, value] of reportInfo) {
    sheet.getCell(`A${row}`).value = label;
    sheet.getCell(`A${row}`).font = { bold: true };
    sheet.getCell(`B${row}`).value = value;
    row++;
  }

  // Test Summary Section
  row++;
  sheet.getCell(`A${row}`).value = "Test Summary";
  sheet.getCell(`A${row}`).font = { bold: true, size: 14, color: { argb: "FF002E62" } };
  row++;

  const testSummary = [
    ["Total Tests Performed", metrics.totalTests],
    ["Workbooks Submitted", metrics.workbooksSubmitted],
    ["Unique Entities Tested", metrics.uniqueEntitiesTested],
    ["Unique Attributes Tested", metrics.uniqueAttributesTested],
  ];

  for (const [label, value] of testSummary) {
    sheet.getCell(`A${row}`).value = label;
    sheet.getCell(`A${row}`).font = { bold: true };
    sheet.getCell(`B${row}`).value = value;
    sheet.getCell(`B${row}`).numFmt = "#,##0";
    row++;
  }

  // Results Summary Section
  row++;
  sheet.getCell(`A${row}`).value = "Results Summary";
  sheet.getCell(`A${row}`).font = { bold: true, size: 14, color: { argb: "FF002E62" } };
  row++;

  const resultsSummary = [
    ["Pass", metrics.passCount, formatPercent(metrics.passCount, metrics.totalTests)],
    ["Pass with Observation", metrics.passWithObservationCount, formatPercent(metrics.passWithObservationCount, metrics.totalTests)],
    ["Fail 1 - Regulatory", metrics.fail1RegulatoryCount, formatPercent(metrics.fail1RegulatoryCount, metrics.totalTests)],
    ["Fail 2 - Procedure", metrics.fail2ProcedureCount, formatPercent(metrics.fail2ProcedureCount, metrics.totalTests)],
    ["Question to LOB", metrics.questionToLOBCount, formatPercent(metrics.questionToLOBCount, metrics.totalTests)],
    ["N/A", metrics.naCount, formatPercent(metrics.naCount, metrics.totalTests)],
  ];

  for (const [label, count, percent] of resultsSummary) {
    sheet.getCell(`A${row}`).value = label;
    sheet.getCell(`A${row}`).font = { bold: true };
    sheet.getCell(`B${row}`).value = count;
    sheet.getCell(`B${row}`).numFmt = "#,##0";
    sheet.getCell(`C${row}`).value = percent;
    row++;
  }

  // Key Metrics Section
  row++;
  sheet.getCell(`A${row}`).value = "Key Metrics";
  sheet.getCell(`A${row}`).font = { bold: true, size: 14, color: { argb: "FF002E62" } };
  row++;

  const keyMetrics = [
    ["Overall Pass Rate", `${metrics.passRate.toFixed(2)}%`],
    ["Overall Fail Rate", `${metrics.failRate.toFixed(2)}%`],
    ["Total Exceptions", metrics.exceptionsCount],
  ];

  for (const [label, value] of keyMetrics) {
    sheet.getCell(`A${row}`).value = label;
    sheet.getCell(`A${row}`).font = { bold: true };
    sheet.getCell(`B${row}`).value = value;
    row++;
  }

  // Set column widths
  sheet.getColumn("A").width = 25;
  sheet.getColumn("B").width = 20;
  sheet.getColumn("C").width = 15;

  // Freeze panes
  sheet.views = [{ state: "frozen", ySplit: 1, xSplit: 0 }];
}

/**
 * Create Findings by Category sheet with Excel Table
 */
function createCategorySheet(workbook: ExcelJS.Workbook, findings: FindingsByCategory[]): void {
  const sheet = workbook.addWorksheet("By Category", {
    properties: { tabColor: { argb: "FFF5A800" } }, // Crowe Amber
  });

  // Calculate totals for totals row
  const totalTests = findings.reduce((sum, f) => sum + f.totalTests, 0);
  const totalPass = findings.reduce((sum, f) => sum + f.passCount, 0);
  const totalFail = findings.reduce((sum, f) => sum + f.failCount, 0);
  const totalNA = findings.reduce((sum, f) => sum + f.naCount, 0);

  // Prepare data rows
  const dataRows = findings.map(f => [
    f.category,
    f.totalTests,
    f.passCount,
    f.failCount,
    f.naCount,
    f.failRate / 100, // As decimal for percentage formatting
    f.passCount / f.totalTests, // Pass rate as decimal
  ]);

  // Add table
  sheet.addTable({
    name: "CategoryTable",
    ref: "A1",
    headerRow: true,
    totalsRow: true,
    style: {
      theme: "TableStyleMedium2",
      showRowStripes: true,
    },
    columns: [
      { name: "Category", totalsRowLabel: "Totals:", filterButton: true },
      { name: "Total Tests", totalsRowFunction: "sum", filterButton: true },
      { name: "Pass Count", totalsRowFunction: "sum", filterButton: true },
      { name: "Fail Count", totalsRowFunction: "sum", filterButton: true },
      { name: "N/A Count", totalsRowFunction: "sum", filterButton: true },
      { name: "Fail Rate (%)", totalsRowFunction: "average", filterButton: true },
      { name: "Pass Rate (%)", totalsRowFunction: "average", filterButton: true },
    ],
    rows: dataRows,
  });

  // Format percentage columns
  const percentColumns = [6, 7]; // Fail Rate and Pass Rate columns (1-indexed)
  for (const colNum of percentColumns) {
    sheet.getColumn(colNum).numFmt = "0.00%";
  }

  // Auto-fit columns
  autoFitColumns(sheet, [15, 12, 12, 12, 12, 12, 12]);

  // Freeze header row
  sheet.views = [{ state: "frozen", ySplit: 1, xSplit: 0 }];
}

/**
 * Create Findings by Attribute sheet with Excel Table
 */
function createAttributeSheet(workbook: ExcelJS.Workbook, findings: FindingsByAttribute[]): void {
  const sheet = workbook.addWorksheet("By Attribute", {
    properties: { tabColor: { argb: "FF05AB8C" } }, // Crowe Teal
  });

  // Prepare data rows
  const dataRows = findings.map(f => [
    f.attributeId,
    f.attributeName,
    f.category,
    f.totalTests,
    f.passCount,
    f.failCount,
    f.naCount,
    f.failRate / 100, // As decimal for percentage formatting
    f.observations.slice(0, 3).join("; "), // Limit observations
  ]);

  // Add table
  sheet.addTable({
    name: "AttributeTable",
    ref: "A1",
    headerRow: true,
    totalsRow: true,
    style: {
      theme: "TableStyleMedium9",
      showRowStripes: true,
    },
    columns: [
      { name: "Attribute ID", totalsRowLabel: "Totals:", filterButton: true },
      { name: "Attribute Name", filterButton: true },
      { name: "Category", filterButton: true },
      { name: "Total Tests", totalsRowFunction: "sum", filterButton: true },
      { name: "Pass Count", totalsRowFunction: "sum", filterButton: true },
      { name: "Fail Count", totalsRowFunction: "sum", filterButton: true },
      { name: "N/A Count", totalsRowFunction: "sum", filterButton: true },
      { name: "Fail Rate (%)", totalsRowFunction: "average", filterButton: true },
      { name: "Observations", filterButton: false },
    ],
    rows: dataRows,
  });

  // Format percentage column
  sheet.getColumn(8).numFmt = "0.00%";

  // Auto-fit columns
  autoFitColumns(sheet, [15, 35, 20, 12, 12, 12, 12, 12, 50]);

  // Freeze header row
  sheet.views = [{ state: "frozen", ySplit: 1, xSplit: 0 }];
}

/**
 * Create Findings by Jurisdiction sheet with Excel Table
 */
function createJurisdictionSheet(workbook: ExcelJS.Workbook, findings: JurisdictionMetrics[]): void {
  const sheet = workbook.addWorksheet("By Jurisdiction", {
    properties: { tabColor: { argb: "FF54C0E8" } }, // Crowe Cyan
  });

  // Prepare data rows
  const dataRows = findings.map(f => [
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
    f.passRate / 100,
    f.failRate / 100,
  ]);

  // Add table
  sheet.addTable({
    name: "JurisdictionTable",
    ref: "A1",
    headerRow: true,
    totalsRow: true,
    style: {
      theme: "TableStyleMedium4",
      showRowStripes: true,
    },
    columns: [
      { name: "Jurisdiction ID", totalsRowLabel: "Totals:", filterButton: true },
      { name: "Jurisdiction Name", filterButton: true },
      { name: "Entity Count", totalsRowFunction: "sum", filterButton: true },
      { name: "Total Tests", totalsRowFunction: "sum", filterButton: true },
      { name: "Pass", totalsRowFunction: "sum", filterButton: true },
      { name: "Pass w/Obs", totalsRowFunction: "sum", filterButton: true },
      { name: "Fail 1 - Reg", totalsRowFunction: "sum", filterButton: true },
      { name: "Fail 2 - Proc", totalsRowFunction: "sum", filterButton: true },
      { name: "Q to LOB", totalsRowFunction: "sum", filterButton: true },
      { name: "N/A", totalsRowFunction: "sum", filterButton: true },
      { name: "Pass Rate (%)", totalsRowFunction: "average", filterButton: true },
      { name: "Fail Rate (%)", totalsRowFunction: "average", filterButton: true },
    ],
    rows: dataRows,
  });

  // Format percentage columns
  sheet.getColumn(11).numFmt = "0.00%";
  sheet.getColumn(12).numFmt = "0.00%";

  // Auto-fit columns
  autoFitColumns(sheet, [15, 18, 12, 12, 10, 12, 12, 12, 10, 8, 12, 12]);

  // Freeze header row
  sheet.views = [{ state: "frozen", ySplit: 1, xSplit: 0 }];
}

/**
 * Create Findings by Auditor sheet with Excel Table
 */
function createAuditorSheet(workbook: ExcelJS.Workbook, findings: AuditorMetrics[]): void {
  const sheet = workbook.addWorksheet("By Auditor", {
    properties: { tabColor: { argb: "FF0075C9" } }, // Crowe Blue
  });

  // Prepare data rows
  const dataRows = findings.map(f => [
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
    f.passRate / 100,
    f.failRate / 100,
    f.completionRate / 100,
  ]);

  // Add table
  sheet.addTable({
    name: "AuditorTable",
    ref: "A1",
    headerRow: true,
    totalsRow: true,
    style: {
      theme: "TableStyleMedium6",
      showRowStripes: true,
    },
    columns: [
      { name: "Auditor ID", totalsRowLabel: "Totals:", filterButton: true },
      { name: "Auditor Name", filterButton: true },
      { name: "Entity Count", totalsRowFunction: "sum", filterButton: true },
      { name: "Total Tests", totalsRowFunction: "sum", filterButton: true },
      { name: "Pass", totalsRowFunction: "sum", filterButton: true },
      { name: "Pass w/Obs", totalsRowFunction: "sum", filterButton: true },
      { name: "Fail 1 - Reg", totalsRowFunction: "sum", filterButton: true },
      { name: "Fail 2 - Proc", totalsRowFunction: "sum", filterButton: true },
      { name: "Q to LOB", totalsRowFunction: "sum", filterButton: true },
      { name: "N/A", totalsRowFunction: "sum", filterButton: true },
      { name: "Pass Rate (%)", totalsRowFunction: "average", filterButton: true },
      { name: "Fail Rate (%)", totalsRowFunction: "average", filterButton: true },
      { name: "Completion (%)", totalsRowFunction: "average", filterButton: true },
    ],
    rows: dataRows,
  });

  // Format percentage columns
  sheet.getColumn(11).numFmt = "0.00%";
  sheet.getColumn(12).numFmt = "0.00%";
  sheet.getColumn(13).numFmt = "0.00%";

  // Auto-fit columns
  autoFitColumns(sheet, [12, 20, 12, 12, 10, 12, 12, 12, 10, 8, 12, 12, 12]);

  // Freeze header row
  sheet.views = [{ state: "frozen", ySplit: 1, xSplit: 0 }];
}

/**
 * Create Findings by Risk Tier sheet with Excel Table
 */
function createRiskTierSheet(workbook: ExcelJS.Workbook, findings: RiskTierMetrics[]): void {
  const sheet = workbook.addWorksheet("By Risk Tier", {
    properties: { tabColor: { argb: "FFE5376B" } }, // Crowe Coral
  });

  // Prepare data rows
  const dataRows = findings.map(f => [
    f.riskTier,
    f.entityCount,
    f.totalTests,
    f.passCount,
    f.failCount,
    f.naCount,
    f.passRate / 100,
    f.failRate / 100,
  ]);

  // Add table
  sheet.addTable({
    name: "RiskTierTable",
    ref: "A1",
    headerRow: true,
    totalsRow: true,
    style: {
      theme: "TableStyleMedium3",
      showRowStripes: true,
    },
    columns: [
      { name: "Risk Tier", totalsRowLabel: "Totals:", filterButton: true },
      { name: "Entity Count", totalsRowFunction: "sum", filterButton: true },
      { name: "Total Tests", totalsRowFunction: "sum", filterButton: true },
      { name: "Pass Count", totalsRowFunction: "sum", filterButton: true },
      { name: "Fail Count", totalsRowFunction: "sum", filterButton: true },
      { name: "N/A Count", totalsRowFunction: "sum", filterButton: true },
      { name: "Pass Rate (%)", totalsRowFunction: "average", filterButton: true },
      { name: "Fail Rate (%)", totalsRowFunction: "average", filterButton: true },
    ],
    rows: dataRows,
  });

  // Format percentage columns
  sheet.getColumn(7).numFmt = "0.00%";
  sheet.getColumn(8).numFmt = "0.00%";

  // Auto-fit columns
  autoFitColumns(sheet, [12, 12, 12, 12, 12, 12, 12, 12]);

  // Freeze header row
  sheet.views = [{ state: "frozen", ySplit: 1, xSplit: 0 }];
}

/**
 * Create Exceptions Detail sheet with Excel Table
 */
function createExceptionsSheet(workbook: ExcelJS.Workbook, exceptions: ExceptionDetail[]): void {
  const sheet = workbook.addWorksheet("Exceptions Detail", {
    properties: { tabColor: { argb: "FFB14FC5" } }, // Crowe Violet
  });

  // Prepare data rows
  const dataRows = exceptions.map(e => [
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

  // Add table
  sheet.addTable({
    name: "ExceptionsTable",
    ref: "A1",
    headerRow: true,
    totalsRow: false,
    style: {
      theme: "TableStyleMedium7",
      showRowStripes: true,
    },
    columns: [
      { name: "Exception ID", filterButton: true },
      { name: "Entity Name", filterButton: true },
      { name: "Case ID", filterButton: true },
      { name: "Jurisdiction", filterButton: true },
      { name: "Attribute ID", filterButton: true },
      { name: "Attribute Name", filterButton: true },
      { name: "Category", filterButton: true },
      { name: "Result Type", filterButton: true },
      { name: "Observation", filterButton: false },
      { name: "Evidence Reference", filterButton: true },
      { name: "Auditor ID", filterButton: true },
      { name: "Auditor Name", filterButton: true },
      { name: "Auditor Notes", filterButton: false },
    ],
    rows: dataRows,
  });

  // Auto-fit columns
  autoFitColumns(sheet, [20, 25, 15, 12, 15, 35, 15, 18, 50, 20, 12, 20, 40]);

  // Freeze header row
  sheet.views = [{ state: "frozen", ySplit: 1, xSplit: 0 }];
}

/**
 * Create Raw Data sheet from test grid rows with Excel Table
 */
function createRawDataSheet(workbook: ExcelJS.Workbook, rows: TestGridRow[]): void {
  const sheet = workbook.addWorksheet("Raw Data", {
    properties: { tabColor: { argb: "FF828282" } }, // Neutral gray
  });

  // Prepare data rows
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
    r.percentComplete / 100, // As decimal for percentage formatting
  ]);

  // Add table
  sheet.addTable({
    name: "RawDataTable",
    ref: "A1",
    headerRow: true,
    totalsRow: true,
    style: {
      theme: "TableStyleMedium1",
      showRowStripes: true,
    },
    columns: [
      { name: "Row ID", totalsRowLabel: "Totals:", filterButton: true },
      { name: "Auditor", filterButton: true },
      { name: "Auditor Name", filterButton: true },
      { name: "Legal Name", filterButton: true },
      { name: "Case ID", filterButton: true },
      { name: "Jurisdiction", filterButton: true },
      { name: "Party Type", filterButton: true },
      { name: "IRR", totalsRowFunction: "average", filterButton: true },
      { name: "DRR", totalsRowFunction: "average", filterButton: true },
      { name: "Attribute ID", filterButton: true },
      { name: "Attribute Name", filterButton: true },
      { name: "Category", filterButton: true },
      { name: "Group", filterButton: true },
      { name: "Result", filterButton: true },
      { name: "Comments", filterButton: false },
      { name: "Source File", filterButton: true },
      { name: "Source", filterButton: true },
      { name: "Source Page", filterButton: true },
      { name: "KYC Date", filterButton: true },
      { name: "Primary FLU", filterButton: true },
      { name: "Pass Count", totalsRowFunction: "sum", filterButton: true },
      { name: "Fail 1 Count", totalsRowFunction: "sum", filterButton: true },
      { name: "Fail 2 Count", totalsRowFunction: "sum", filterButton: true },
      { name: "N/A Count", totalsRowFunction: "sum", filterButton: true },
      { name: "% Complete", totalsRowFunction: "average", filterButton: true },
    ],
    rows: dataRows,
  });

  // Format percentage column
  sheet.getColumn(25).numFmt = "0.00%";

  // Auto-fit columns with max limits
  autoFitColumns(sheet, [
    10, 10, 18, 25, 15, 12, 15, 6, 6, 12, 25, 15, 12, 20, 40,
    18, 12, 10, 12, 12, 10, 10, 10, 10, 12
  ]);

  // Freeze header row
  sheet.views = [{ state: "frozen", ySplit: 1, xSplit: 0 }];
}

/**
 * Create Customer Findings sheet with all observations per customer
 * This sheet shows ALL observations, questions, and failures grouped by customer
 */
function createCustomerFindingsSheet(workbook: ExcelJS.Workbook, customers: ConsolidatedCustomer[]): void {
  const sheet = workbook.addWorksheet("Customer Findings", {
    properties: { tabColor: { argb: "FFF5A800" } }, // Crowe Amber
  });

  // Create a flattened view with one row per observation/question/failure
  const dataRows: (string | number)[][] = [];

  for (const customer of customers) {
    // Add observations
    for (const obs of customer.observations) {
      dataRows.push([
        customer.customerId,
        customer.customerName,
        customer.jurisdictionId,
        customer.partyType,
        customer.riskTier,
        customer.overallResult,
        "Observation",
        obs.attributeId,
        obs.attributeName,
        obs.attributeCategory,
        obs.observationText,
        obs.auditorName,
        customer.totalTests,
        customer.passCount,
        customer.passWithObservationCount,
        customer.failCount,
        customer.questionCount,
      ]);
    }

    // Add questions to LOB
    for (const q of customer.questionsToLOB) {
      dataRows.push([
        customer.customerId,
        customer.customerName,
        customer.jurisdictionId,
        customer.partyType,
        customer.riskTier,
        customer.overallResult,
        "Question to LOB",
        q.attributeId,
        q.attributeName,
        q.attributeCategory,
        q.questionText,
        q.auditorName,
        customer.totalTests,
        customer.passCount,
        customer.passWithObservationCount,
        customer.failCount,
        customer.questionCount,
      ]);
    }

    // Add failures
    for (const fail of customer.failures) {
      dataRows.push([
        customer.customerId,
        customer.customerName,
        customer.jurisdictionId,
        customer.partyType,
        customer.riskTier,
        customer.overallResult,
        `Failure - ${fail.failureType}`,
        fail.attributeId,
        fail.attributeName,
        fail.attributeCategory,
        fail.failureReason,
        fail.auditorName,
        customer.totalTests,
        customer.passCount,
        customer.passWithObservationCount,
        customer.failCount,
        customer.questionCount,
      ]);
    }

    // If customer has no findings but is in the list, add a summary row
    if (customer.observations.length === 0 &&
        customer.questionsToLOB.length === 0 &&
        customer.failures.length === 0) {
      dataRows.push([
        customer.customerId,
        customer.customerName,
        customer.jurisdictionId,
        customer.partyType,
        customer.riskTier,
        customer.overallResult,
        "No Findings",
        "",
        "",
        "",
        "All tests passed without observations",
        "",
        customer.totalTests,
        customer.passCount,
        customer.passWithObservationCount,
        customer.failCount,
        customer.questionCount,
      ]);
    }
  }

  // Add table if we have data
  if (dataRows.length > 0) {
    sheet.addTable({
      name: "CustomerFindingsTable",
      ref: "A1",
      headerRow: true,
      totalsRow: false,
      style: {
        theme: "TableStyleMedium5",
        showRowStripes: true,
      },
      columns: [
        { name: "Customer ID", filterButton: true },
        { name: "Customer Name", filterButton: true },
        { name: "Jurisdiction", filterButton: true },
        { name: "Party Type", filterButton: true },
        { name: "Risk Tier", filterButton: true },
        { name: "Overall Result", filterButton: true },
        { name: "Finding Type", filterButton: true },
        { name: "Attribute ID", filterButton: true },
        { name: "Attribute Name", filterButton: true },
        { name: "Category", filterButton: true },
        { name: "Finding Detail", filterButton: false },
        { name: "Auditor", filterButton: true },
        { name: "Total Tests", filterButton: true },
        { name: "Pass", filterButton: true },
        { name: "Pass w/Obs", filterButton: true },
        { name: "Fail", filterButton: true },
        { name: "Questions", filterButton: true },
      ],
      rows: dataRows,
    });
  }

  // Auto-fit columns
  autoFitColumns(sheet, [15, 30, 12, 15, 10, 18, 18, 12, 30, 15, 50, 18, 10, 8, 10, 8, 10]);

  // Freeze header row
  sheet.views = [{ state: "frozen", ySplit: 1, xSplit: 0 }];
}

// Helper functions

/**
 * Format a value as a percentage string
 */
function formatPercent(value: number, total: number): string {
  if (total === 0) return "0.00%";
  return `${((value / total) * 100).toFixed(2)}%`;
}

/**
 * Auto-fit column widths with specified minimum widths
 */
function autoFitColumns(sheet: ExcelJS.Worksheet, minWidths: number[]): void {
  sheet.columns.forEach((column, index) => {
    const minWidth = minWidths[index] || 10;
    let maxLength = minWidth;

    column.eachCell?.({ includeEmpty: false }, (cell) => {
      const cellValue = cell.value;
      const cellLength = cellValue ? String(cellValue).length : 0;
      if (cellLength > maxLength) {
        maxLength = cellLength;
      }
    });

    // Cap at 50 characters
    column.width = Math.min(maxLength + 2, 50);
  });
}

/**
 * Download consolidation as Excel file
 */
export async function downloadConsolidationExcel(
  result: ConsolidationResult,
  filename?: string
): Promise<void> {
  const blob = await exportConsolidationToExcel(result);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename || `consolidation-report-${new Date().toISOString().split("T")[0]}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
