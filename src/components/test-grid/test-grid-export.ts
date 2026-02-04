// Test Grid Export Utility
// Exports generated workbooks to Excel format using xlsx library

import * as XLSX from 'xlsx';
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
    Math.round(row.percentComplete * 100) / 100,
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
 * Create column widths for the Excel sheet
 */
function getColumnWidths(): XLSX.ColInfo[] {
  return [
    { wch: 10 },  // Auditor
    { wch: 25 },  // Legal Name
    { wch: 6 },   // IRR
    { wch: 6 },   // DRR
    { wch: 15 },  // Case ID
    { wch: 12 },  // Primary FLU
    { wch: 18 },  // Party Type
    { wch: 12 },  // Attribute ID
    { wch: 25 },  // Attribute Name
    { wch: 15 },  // Category
    { wch: 20 },  // Source File
    { wch: 15 },  // Source
    { wch: 10 },  // Source Page
    { wch: 10 },  // Pass Count
    { wch: 12 },  // Sampling Index
    { wch: 15 },  // Auditor Name
    { wch: 10 },  // Empty Count
    { wch: 12 },  // Percent Complete
    { wch: 12 },  // KYC Date
    { wch: 12 },  // Pass w/Obs Count
    { wch: 12 },  // Fail 1 Count
    { wch: 12 },  // Fail 2 Count
    { wch: 12 },  // Q to LOB Count
    { wch: 15 },  // GCI #s
    { wch: 15 },  // Group
    { wch: 10 },  // N/A Count
    { wch: 12 },  // Attribute Count
    { wch: 50 },  // Attribute Text
    { wch: 20 },  // Result
    { wch: 30 },  // Comments
  ];
}

/**
 * Create a summary sheet with workbook statistics
 */
function createSummarySheet(workbook: GeneratedWorkbook): XLSX.WorkSheet {
  const summaryData = [
    ['Test Grid Workbook Summary'],
    [],
    ['Auditor ID', workbook.auditorId],
    ['Auditor Name', workbook.auditorName],
    ['Generated At', new Date(workbook.generatedAt).toLocaleString()],
    [],
    ['Statistics'],
    ['Total Entities', workbook.entityCount],
    ['Total Test Rows', workbook.summary.totalRows],
    ['Completed Rows', workbook.summary.completedRows],
    ['Completion %', `${workbook.summary.completionPercentage.toFixed(1)}%`],
    [],
    ['Results Breakdown'],
    ['Pass', workbook.summary.passCount],
    ['Pass w/Observation', workbook.summary.passWithObservationCount],
    ['Fail 1 - Regulatory', workbook.summary.fail1Count],
    ['Fail 2 - Procedure', workbook.summary.fail2Count],
    ['Question to LOB', workbook.summary.questionToLOBCount],
    ['N/A', workbook.summary.naCount],
    ['Empty', workbook.summary.emptyCount],
  ];

  const ws = XLSX.utils.aoa_to_sheet(summaryData);

  // Set column widths
  ws['!cols'] = [{ wch: 20 }, { wch: 30 }];

  return ws;
}

/**
 * Export a single workbook to Excel format
 * @param workbook - The generated workbook to export
 * @returns Blob containing the Excel file
 */
export function exportTestGridToExcel(workbook: GeneratedWorkbook): Blob {
  // Create workbook
  const wb = XLSX.utils.book_new();

  // Create summary sheet
  const summarySheet = createSummarySheet(workbook);
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

  // Create test grid sheet
  const gridData = [EXCEL_HEADERS, ...workbook.rows.map(rowToArray)];
  const gridSheet = XLSX.utils.aoa_to_sheet(gridData);

  // Set column widths
  gridSheet['!cols'] = getColumnWidths();

  // Freeze first row (header)
  gridSheet['!freeze'] = { xSplit: 0, ySplit: 1 };

  XLSX.utils.book_append_sheet(wb, gridSheet, 'Test Grid');

  // Create entity breakdown sheet
  const entityBreakdown = createEntityBreakdownSheet(workbook.rows);
  XLSX.utils.book_append_sheet(wb, entityBreakdown, 'Entity Breakdown');

  // Generate Excel file
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

  return new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

/**
 * Create entity breakdown sheet showing completion by entity
 */
function createEntityBreakdownSheet(rows: TestGridRow[]): XLSX.WorkSheet {
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

  // Build data array
  const headers = [
    'Case ID',
    'Legal Name',
    'Total Attributes',
    'Completed',
    '% Complete',
    'Pass',
    'Pass w/Obs',
    'Fail 1',
    'Fail 2',
    'Q to LOB',
    'N/A',
  ];

  const dataRows = Array.from(entityMap.entries()).map(([caseId, data]) => [
    caseId,
    data.legalName,
    data.totalAttributes,
    data.completed,
    `${((data.completed / data.totalAttributes) * 100).toFixed(1)}%`,
    data.pass,
    data.passObs,
    data.fail1,
    data.fail2,
    data.qLob,
    data.na,
  ]);

  const sheetData = [headers, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  ws['!cols'] = [
    { wch: 15 },
    { wch: 25 },
    { wch: 15 },
    { wch: 10 },
    { wch: 12 },
    { wch: 8 },
    { wch: 10 },
    { wch: 8 },
    { wch: 8 },
    { wch: 10 },
    { wch: 8 },
  ];

  return ws;
}

/**
 * Export all workbooks to a single Excel file with multiple sheets
 * @param workbooks - Array of generated workbooks
 * @returns Blob containing the Excel file
 */
export function exportAllTestGrids(workbooks: GeneratedWorkbook[]): Blob {
  const wb = XLSX.utils.book_new();

  // Create master summary sheet
  const masterSummary = createMasterSummarySheet(workbooks);
  XLSX.utils.book_append_sheet(wb, masterSummary, 'Master Summary');

  // Add each auditor's workbook as separate sheets
  for (const workbook of workbooks) {
    // Truncate sheet name to 31 chars (Excel limit)
    const sheetName = workbook.auditorName.substring(0, 28);

    // Create grid sheet for this auditor
    const gridData = [EXCEL_HEADERS, ...workbook.rows.map(rowToArray)];
    const gridSheet = XLSX.utils.aoa_to_sheet(gridData);
    gridSheet['!cols'] = getColumnWidths();

    XLSX.utils.book_append_sheet(wb, gridSheet, sheetName);
  }

  // Generate Excel file
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

  return new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

/**
 * Create master summary sheet for all workbooks
 */
function createMasterSummarySheet(workbooks: GeneratedWorkbook[]): XLSX.WorkSheet {
  const headers = [
    'Auditor ID',
    'Auditor Name',
    'Entities',
    'Total Rows',
    'Completed',
    '% Complete',
    'Pass',
    'Pass w/Obs',
    'Fail 1',
    'Fail 2',
    'Q to LOB',
    'N/A',
    'Empty',
  ];

  const dataRows = workbooks.map(wb => [
    wb.auditorId,
    wb.auditorName,
    wb.entityCount,
    wb.summary.totalRows,
    wb.summary.completedRows,
    `${wb.summary.completionPercentage.toFixed(1)}%`,
    wb.summary.passCount,
    wb.summary.passWithObservationCount,
    wb.summary.fail1Count,
    wb.summary.fail2Count,
    wb.summary.questionToLOBCount,
    wb.summary.naCount,
    wb.summary.emptyCount,
  ]);

  // Add totals row
  const totals = workbooks.reduce(
    (acc, wb) => ({
      entities: acc.entities + wb.entityCount,
      totalRows: acc.totalRows + wb.summary.totalRows,
      completed: acc.completed + wb.summary.completedRows,
      pass: acc.pass + wb.summary.passCount,
      passObs: acc.passObs + wb.summary.passWithObservationCount,
      fail1: acc.fail1 + wb.summary.fail1Count,
      fail2: acc.fail2 + wb.summary.fail2Count,
      qLob: acc.qLob + wb.summary.questionToLOBCount,
      na: acc.na + wb.summary.naCount,
      empty: acc.empty + wb.summary.emptyCount,
    }),
    {
      entities: 0,
      totalRows: 0,
      completed: 0,
      pass: 0,
      passObs: 0,
      fail1: 0,
      fail2: 0,
      qLob: 0,
      na: 0,
      empty: 0,
    }
  );

  const totalsRow = [
    'TOTAL',
    '',
    totals.entities,
    totals.totalRows,
    totals.completed,
    `${((totals.completed / totals.totalRows) * 100).toFixed(1)}%`,
    totals.pass,
    totals.passObs,
    totals.fail1,
    totals.fail2,
    totals.qLob,
    totals.na,
    totals.empty,
  ];

  const sheetData = [
    ['Test Grid Generation - Master Summary'],
    [`Generated: ${new Date().toLocaleString()}`],
    [],
    headers,
    ...dataRows,
    [],
    totalsRow,
  ];

  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  ws['!cols'] = [
    { wch: 12 },
    { wch: 18 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 12 },
    { wch: 8 },
    { wch: 10 },
    { wch: 8 },
    { wch: 8 },
    { wch: 10 },
    { wch: 8 },
    { wch: 8 },
  ];

  return ws;
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
export function downloadTestGrid(workbook: GeneratedWorkbook): void {
  const blob = exportTestGridToExcel(workbook);
  const filename = `TestGrid_${workbook.auditorName.replace(/\s+/g, '_')}_${
    new Date().toISOString().split('T')[0]
  }.xlsx`;
  downloadBlob(blob, filename);
}

/**
 * Export and download all workbooks
 */
export function downloadAllTestGrids(workbooks: GeneratedWorkbook[]): void {
  const blob = exportAllTestGrids(workbooks);
  const filename = `TestGrids_All_Auditors_${
    new Date().toISOString().split('T')[0]
  }.xlsx`;
  downloadBlob(blob, filename);
}
