// Test Grid Export Utility
// Exports generated workbooks to Excel format using ExcelJS library
// Provides proper Excel table formatting with filters, frozen headers, and alternating rows

import * as ExcelJS from 'exceljs';
import type { GeneratedWorkbook, TestGridRow } from '@/lib/attribute-library/generation-engine';

/**
 * Column headers for Excel export (all 28 columns)
 */
const EXCEL_HEADERS = [
  'Auditor',
  'Legal Name',
  'IRR',
  'DRR',
  'Case ID (Aware)',
  'Primary FLU',
  'Party Type',
  'Attribute ID',
  'Attribute Name',
  'Category',
  'Source File',
  'Source',
  'Source Page',
  'Pass Count',
  'Sampling Index',
  'Auditor Name',
  'Empty Count',
  'Percent Complete',
  'KYC Date',
  'Pass w/Observation Count',
  'Fail 1 - Regulatory Count',
  'Fail 2 - Procedure Count',
  'Question to LOB Count',
  'GCI #s',
  'Group',
  'N/A Count',
  'Attribute Count',
  'Attribute Text',
  'Result',
  'Comments',
];

/**
 * Column widths for test grid sheets
 */
const COLUMN_WIDTHS = [
  10,  // Auditor
  25,  // Legal Name
  6,   // IRR
  6,   // DRR
  15,  // Case ID
  12,  // Primary FLU
  18,  // Party Type
  12,  // Attribute ID
  25,  // Attribute Name
  15,  // Category
  20,  // Source File
  15,  // Source
  10,  // Source Page
  10,  // Pass Count
  12,  // Sampling Index
  15,  // Auditor Name
  10,  // Empty Count
  12,  // Percent Complete
  12,  // KYC Date
  12,  // Pass w/Obs Count
  12,  // Fail 1 Count
  12,  // Fail 2 Count
  12,  // Q to LOB Count
  15,  // GCI #s
  15,  // Group
  10,  // N/A Count
  12,  // Attribute Count
  50,  // Attribute Text
  20,  // Result
  30,  // Comments
];

/**
 * Convert a TestGridRow to an array for Excel export
 */
function rowToArray(row: TestGridRow): (string | number)[] {
  return [
    row.auditor,
    row.legalName,
    row.irr,
    row.drr,
    row.caseId,
    row.primaryFLU,
    row.partyType,
    row.attributeId,
    row.attributeName,
    row.category,
    row.sourceFile,
    row.source,
    row.sourcePage,
    row.passCount,
    row.samplingIndex,
    row.auditorName,
    row.emptyCount,
    row.percentComplete / 100, // As decimal for percentage
    row.kycDate,
    row.passWithObservationCount,
    row.fail1RegulatoryCount,
    row.fail2ProcedureCount,
    row.questionToLOBCount,
    row.gciNumbers,
    row.group,
    row.naCount,
    row.attributeCount,
    row.attributeText,
    row.result,
    row.comments,
  ];
}

/**
 * Create a summary sheet with workbook statistics
 */
function createSummarySheet(workbook: ExcelJS.Workbook, data: GeneratedWorkbook): void {
  const sheet = workbook.addWorksheet('Summary', {
    properties: { tabColor: { argb: 'FF002E62' } }, // Crowe Indigo
  });

  // Title
  sheet.mergeCells('A1:B1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = 'Test Grid Workbook Summary';
  titleCell.font = { size: 16, bold: true, color: { argb: 'FF002E62' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(1).height = 25;

  // Summary data
  const summaryData = [
    ['Auditor ID', data.auditorId],
    ['Auditor Name', data.auditorName],
    ['Generated At', new Date(data.generatedAt).toLocaleString()],
    ['', ''],
    ['Statistics', ''],
    ['Total Entities', data.entityCount],
    ['Total Test Rows', data.summary.totalRows],
    ['Completed Rows', data.summary.completedRows],
    ['Completion %', `${data.summary.completionPercentage.toFixed(1)}%`],
    ['', ''],
    ['Results Breakdown', ''],
    ['Pass', data.summary.passCount],
    ['Pass w/Observation', data.summary.passWithObservationCount],
    ['Fail 1 - Regulatory', data.summary.fail1Count],
    ['Fail 2 - Procedure', data.summary.fail2Count],
    ['Question to LOB', data.summary.questionToLOBCount],
    ['N/A', data.summary.naCount],
    ['Empty', data.summary.emptyCount],
  ];

  let rowNum = 3;
  for (const [label, value] of summaryData) {
    const labelCell = sheet.getCell(`A${rowNum}`);
    const valueCell = sheet.getCell(`B${rowNum}`);

    labelCell.value = label;
    valueCell.value = value;

    // Style section headers
    if (label === 'Statistics' || label === 'Results Breakdown') {
      labelCell.font = { bold: true, size: 14, color: { argb: 'FF002E62' } };
    } else if (label) {
      labelCell.font = { bold: true };
    }

    rowNum++;
  }

  // Set column widths
  sheet.getColumn('A').width = 22;
  sheet.getColumn('B').width = 30;

  // Freeze first row
  sheet.views = [{ state: 'frozen', ySplit: 1, xSplit: 0 }];
}

/**
 * Create the main test grid sheet with Excel Table formatting
 */
function createTestGridSheet(workbook: ExcelJS.Workbook, data: GeneratedWorkbook): void {
  const sheet = workbook.addWorksheet('Test Grid', {
    properties: { tabColor: { argb: 'FFF5A800' } }, // Crowe Amber
  });

  // Prepare data rows
  const dataRows = data.rows.map(rowToArray);

  // Add table
  sheet.addTable({
    name: 'TestGridTable',
    ref: 'A1',
    headerRow: true,
    totalsRow: true,
    style: {
      theme: 'TableStyleMedium2',
      showRowStripes: true,
    },
    columns: [
      { name: 'Auditor', totalsRowLabel: 'Totals:', filterButton: true },
      { name: 'Legal Name', filterButton: true },
      { name: 'IRR', totalsRowFunction: 'average', filterButton: true },
      { name: 'DRR', totalsRowFunction: 'average', filterButton: true },
      { name: 'Case ID (Aware)', filterButton: true },
      { name: 'Primary FLU', filterButton: true },
      { name: 'Party Type', filterButton: true },
      { name: 'Attribute ID', filterButton: true },
      { name: 'Attribute Name', filterButton: true },
      { name: 'Category', filterButton: true },
      { name: 'Source File', filterButton: true },
      { name: 'Source', filterButton: true },
      { name: 'Source Page', filterButton: true },
      { name: 'Pass Count', totalsRowFunction: 'sum', filterButton: true },
      { name: 'Sampling Index', filterButton: true },
      { name: 'Auditor Name', filterButton: true },
      { name: 'Empty Count', totalsRowFunction: 'sum', filterButton: true },
      { name: 'Percent Complete', totalsRowFunction: 'average', filterButton: true },
      { name: 'KYC Date', filterButton: true },
      { name: 'Pass w/Observation Count', totalsRowFunction: 'sum', filterButton: true },
      { name: 'Fail 1 - Regulatory Count', totalsRowFunction: 'sum', filterButton: true },
      { name: 'Fail 2 - Procedure Count', totalsRowFunction: 'sum', filterButton: true },
      { name: 'Question to LOB Count', totalsRowFunction: 'sum', filterButton: true },
      { name: 'GCI #s', filterButton: true },
      { name: 'Group', filterButton: true },
      { name: 'N/A Count', totalsRowFunction: 'sum', filterButton: true },
      { name: 'Attribute Count', totalsRowFunction: 'sum', filterButton: true },
      { name: 'Attribute Text', filterButton: false },
      { name: 'Result', filterButton: true },
      { name: 'Comments', filterButton: false },
    ],
    rows: dataRows,
  });

  // Format percent complete column
  sheet.getColumn(18).numFmt = '0.00%';

  // Set column widths
  COLUMN_WIDTHS.forEach((width, index) => {
    sheet.getColumn(index + 1).width = width;
  });

  // Freeze header row
  sheet.views = [{ state: 'frozen', ySplit: 1, xSplit: 0 }];
}

/**
 * Create entity breakdown sheet showing completion by entity
 */
function createEntityBreakdownSheet(workbook: ExcelJS.Workbook, rows: TestGridRow[]): void {
  const sheet = workbook.addWorksheet('Entity Breakdown', {
    properties: { tabColor: { argb: 'FF05AB8C' } }, // Crowe Teal
  });

  // Group by entity
  const entityMap = new Map<string, {
    legalName: string;
    totalAttributes: number;
    completed: number;
    pass: number;
    passObs: number;
    fail1: number;
    fail2: number;
    qLob: number;
    na: number;
  }>();

  for (const row of rows) {
    const entity = entityMap.get(row.caseId) || {
      legalName: row.legalName,
      totalAttributes: 0,
      completed: 0,
      pass: 0,
      passObs: 0,
      fail1: 0,
      fail2: 0,
      qLob: 0,
      na: 0,
    };

    entity.totalAttributes++;

    if (row.result) {
      entity.completed++;
      switch (row.result) {
        case 'Pass':
          entity.pass++;
          break;
        case 'Pass w/Observation':
          entity.passObs++;
          break;
        case 'Fail 1 - Regulatory':
          entity.fail1++;
          break;
        case 'Fail 2 - Procedure':
          entity.fail2++;
          break;
        case 'Question to LOB':
          entity.qLob++;
          break;
        case 'N/A':
          entity.na++;
          break;
      }
    }

    entityMap.set(row.caseId, entity);
  }

  // Prepare data rows
  const dataRows = Array.from(entityMap.entries()).map(([caseId, data]) => [
    caseId,
    data.legalName,
    data.totalAttributes,
    data.completed,
    data.totalAttributes > 0 ? data.completed / data.totalAttributes : 0, // As decimal for percentage
    data.pass,
    data.passObs,
    data.fail1,
    data.fail2,
    data.qLob,
    data.na,
  ]);

  // Add table
  sheet.addTable({
    name: 'EntityBreakdownTable',
    ref: 'A1',
    headerRow: true,
    totalsRow: true,
    style: {
      theme: 'TableStyleMedium9',
      showRowStripes: true,
    },
    columns: [
      { name: 'Case ID', totalsRowLabel: 'Totals:', filterButton: true },
      { name: 'Legal Name', filterButton: true },
      { name: 'Total Attributes', totalsRowFunction: 'sum', filterButton: true },
      { name: 'Completed', totalsRowFunction: 'sum', filterButton: true },
      { name: '% Complete', totalsRowFunction: 'average', filterButton: true },
      { name: 'Pass', totalsRowFunction: 'sum', filterButton: true },
      { name: 'Pass w/Obs', totalsRowFunction: 'sum', filterButton: true },
      { name: 'Fail 1', totalsRowFunction: 'sum', filterButton: true },
      { name: 'Fail 2', totalsRowFunction: 'sum', filterButton: true },
      { name: 'Q to LOB', totalsRowFunction: 'sum', filterButton: true },
      { name: 'N/A', totalsRowFunction: 'sum', filterButton: true },
    ],
    rows: dataRows,
  });

  // Format percentage column
  sheet.getColumn(5).numFmt = '0.0%';

  // Set column widths
  const widths = [15, 25, 15, 10, 12, 8, 10, 8, 8, 10, 8];
  widths.forEach((width, index) => {
    sheet.getColumn(index + 1).width = width;
  });

  // Freeze header row
  sheet.views = [{ state: 'frozen', ySplit: 1, xSplit: 0 }];
}

/**
 * Export a single workbook to Excel format
 * @param workbookData - The generated workbook to export
 * @returns Promise<Blob> containing the Excel file
 */
export async function exportTestGridToExcel(workbookData: GeneratedWorkbook): Promise<Blob> {
  // Create workbook
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CDD Onboarding Demo';
  workbook.created = new Date();
  workbook.modified = new Date();

  // Create summary sheet
  createSummarySheet(workbook, workbookData);

  // Create test grid sheet
  createTestGridSheet(workbook, workbookData);

  // Create entity breakdown sheet
  createEntityBreakdownSheet(workbook, workbookData.rows);

  // Generate Excel file
  const buffer = await workbook.xlsx.writeBuffer();

  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

/**
 * Create master summary sheet for all workbooks
 */
function createMasterSummarySheet(workbook: ExcelJS.Workbook, workbooks: GeneratedWorkbook[]): void {
  const sheet = workbook.addWorksheet('Master Summary', {
    properties: { tabColor: { argb: 'FF002E62' } }, // Crowe Indigo
  });

  // Title
  sheet.mergeCells('A1:M1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = 'Test Grid Generation - Master Summary';
  titleCell.font = { size: 16, bold: true, color: { argb: 'FF002E62' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(1).height = 25;

  // Generated timestamp
  sheet.getCell('A2').value = `Generated: ${new Date().toLocaleString()}`;
  sheet.getCell('A2').font = { italic: true, color: { argb: 'FF828282' } };

  // Prepare data rows
  const dataRows = workbooks.map(wb => [
    wb.auditorId,
    wb.auditorName,
    wb.entityCount,
    wb.summary.totalRows,
    wb.summary.completedRows,
    wb.summary.totalRows > 0 ? wb.summary.completedRows / wb.summary.totalRows : 0, // As decimal for percentage
    wb.summary.passCount,
    wb.summary.passWithObservationCount,
    wb.summary.fail1Count,
    wb.summary.fail2Count,
    wb.summary.questionToLOBCount,
    wb.summary.naCount,
    wb.summary.emptyCount,
  ]);

  // Add table starting at row 4
  sheet.addTable({
    name: 'MasterSummaryTable',
    ref: 'A4',
    headerRow: true,
    totalsRow: true,
    style: {
      theme: 'TableStyleMedium6',
      showRowStripes: true,
    },
    columns: [
      { name: 'Auditor ID', totalsRowLabel: 'Totals:', filterButton: true },
      { name: 'Auditor Name', filterButton: true },
      { name: 'Entities', totalsRowFunction: 'sum', filterButton: true },
      { name: 'Total Rows', totalsRowFunction: 'sum', filterButton: true },
      { name: 'Completed', totalsRowFunction: 'sum', filterButton: true },
      { name: '% Complete', totalsRowFunction: 'average', filterButton: true },
      { name: 'Pass', totalsRowFunction: 'sum', filterButton: true },
      { name: 'Pass w/Obs', totalsRowFunction: 'sum', filterButton: true },
      { name: 'Fail 1', totalsRowFunction: 'sum', filterButton: true },
      { name: 'Fail 2', totalsRowFunction: 'sum', filterButton: true },
      { name: 'Q to LOB', totalsRowFunction: 'sum', filterButton: true },
      { name: 'N/A', totalsRowFunction: 'sum', filterButton: true },
      { name: 'Empty', totalsRowFunction: 'sum', filterButton: true },
    ],
    rows: dataRows,
  });

  // Format percentage column
  sheet.getColumn(6).numFmt = '0.0%';

  // Set column widths
  const widths = [12, 18, 10, 10, 10, 12, 8, 10, 8, 8, 10, 8, 8];
  widths.forEach((width, index) => {
    sheet.getColumn(index + 1).width = width;
  });

  // Freeze first 4 rows (title, timestamp, blank, headers)
  sheet.views = [{ state: 'frozen', ySplit: 4, xSplit: 0 }];
}

/**
 * Export all workbooks to a single Excel file with multiple sheets
 * @param workbooks - Array of generated workbooks
 * @returns Promise<Blob> containing the Excel file
 */
export async function exportAllTestGrids(workbooks: GeneratedWorkbook[]): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CDD Onboarding Demo';
  workbook.created = new Date();
  workbook.modified = new Date();

  // Create master summary sheet
  createMasterSummarySheet(workbook, workbooks);

  // Add each auditor's workbook as separate sheets
  for (const wb of workbooks) {
    // Truncate sheet name to 31 chars (Excel limit)
    const sheetName = wb.auditorName.substring(0, 28);

    const sheet = workbook.addWorksheet(sheetName, {
      properties: { tabColor: { argb: 'FFF5A800' } }, // Crowe Amber
    });

    // Prepare data rows
    const dataRows = wb.rows.map(rowToArray);

    // Add table
    sheet.addTable({
      name: `TestGrid_${wb.auditorId.replace(/[^a-zA-Z0-9]/g, '_')}`,
      ref: 'A1',
      headerRow: true,
      totalsRow: false,
      style: {
        theme: 'TableStyleMedium2',
        showRowStripes: true,
      },
      columns: EXCEL_HEADERS.map((name, index) => ({
        name,
        filterButton: !['Attribute Text', 'Comments'].includes(name),
      })),
      rows: dataRows,
    });

    // Format percent complete column
    sheet.getColumn(18).numFmt = '0.00%';

    // Set column widths
    COLUMN_WIDTHS.forEach((width, index) => {
      sheet.getColumn(index + 1).width = width;
    });

    // Freeze header row
    sheet.views = [{ state: 'frozen', ySplit: 1, xSplit: 0 }];
  }

  // Generate Excel file
  const buffer = await workbook.xlsx.writeBuffer();

  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

/**
 * Download a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export and download a single workbook
 */
export async function downloadTestGrid(workbookData: GeneratedWorkbook): Promise<void> {
  const blob = await exportTestGridToExcel(workbookData);
  const filename = `TestGrid_${workbookData.auditorName.replace(/\s+/g, '_')}_${
    new Date().toISOString().split('T')[0]
  }.xlsx`;
  downloadBlob(blob, filename);
}

/**
 * Export and download all workbooks
 */
export async function downloadAllTestGrids(workbooks: GeneratedWorkbook[]): Promise<void> {
  const blob = await exportAllTestGrids(workbooks);
  const filename = `TestGrids_All_Auditors_${
    new Date().toISOString().split('T')[0]
  }.xlsx`;
  downloadBlob(blob, filename);
}
