// Test Grid Generation Engine
// Generates auditor workbooks from assignments and attributes

import type { GenerationReviewRow, Attribute } from './types';

/**
 * Test result values for the result dropdown
 */
export type TestResult =
  | 'Pass'
  | 'Pass w/Observation'
  | 'Fail 1 - Regulatory'
  | 'Fail 2 - Procedure'
  | 'Question to LOB'
  | 'N/A'
  | '';

/**
 * TestGridRow - Represents a single row in the test grid with all 28 columns
 */
export interface TestGridRow {
  // Columns 1-7: Entity Information (collapsible)
  auditor: string;                    // Col 1: Auditor ID
  legalName: string;                  // Col 2: Legal Name
  irr: number;                        // Col 3: Inherent Risk Rating
  drr: number;                        // Col 4: Design Risk Rating
  caseId: string;                     // Col 5: Case ID (Aware/GCI)
  primaryFLU: string;                 // Col 6: Primary FLU
  partyType: string;                  // Col 7: Party Type

  // Columns 8-13: Attribute Information
  attributeId: string;                // Col 8: Attribute ID
  attributeName: string;              // Col 9: Attribute Name
  category: string;                   // Col 10: Category
  sourceFile: string;                 // Col 11: Source File
  source: string;                     // Col 12: Source
  sourcePage: string;                 // Col 13: Source Page

  // Columns 14-18: Metrics
  passCount: number;                  // Col 14: Pass Count
  samplingIndex: number;              // Col 15: Sampling Index
  auditorName: string;                // Col 16: Auditor Name (display)
  emptyCount: number;                 // Col 17: Empty Count
  percentComplete: number;            // Col 18: Percent Complete

  // Columns 19-23: KYC & Results
  kycDate: string;                    // Col 19: KYC Date
  passWithObservationCount: number;   // Col 20: Pass w/Observation Count
  fail1RegulatoryCount: number;       // Col 21: Fail 1 - Regulatory Count
  fail2ProcedureCount: number;        // Col 22: Fail 2 - Procedure Count
  questionToLOBCount: number;         // Col 23: Question to LOB Count

  // Columns 24-28: Additional Fields
  gciNumbers: string;                 // Col 24: GCI #s
  group: string;                      // Col 25: Group
  naCount: number;                    // Col 26: N/A Count
  attributeCount: number;             // Col 27: Attribute Count
  attributeText: string;              // Col 28: Attribute Text (Question)

  // Additional fields for functionality (not displayed as columns)
  result: TestResult;                 // Current test result
  comments: string;                   // Auditor comments
  jurisdictionId: string;             // Jurisdiction ID for filtering
  riskScope: 'Base' | 'EDD' | 'Both'; // Risk scope
  rowId: string;                      // Unique row identifier
}

/**
 * GeneratedWorkbook - A complete workbook for a single auditor
 */
export interface GeneratedWorkbook {
  auditorId: string;
  auditorName: string;
  rows: TestGridRow[];
  generatedAt: string;
  entityCount: number;
  attributeCount: number;
  summary: WorkbookSummary;
}

/**
 * WorkbookSummary - Summary statistics for a workbook
 */
export interface WorkbookSummary {
  totalRows: number;
  completedRows: number;
  passCount: number;
  passWithObservationCount: number;
  fail1Count: number;
  fail2Count: number;
  questionToLOBCount: number;
  naCount: number;
  emptyCount: number;
  completionPercentage: number;
}

/**
 * Determines if an entity requires EDD based on party type
 */
function requiresEDD(partyType: string): boolean {
  const eddPartyTypes = ['PEP', 'Fund', 'Correspondent Bank'];
  return eddPartyTypes.includes(partyType);
}

/**
 * Filter attributes by jurisdiction and risk scope
 * @param attributes - All available attributes
 * @param jurisdictionId - Target jurisdiction ID
 * @param riskScope - Risk scope filter ('Base', 'EDD', or 'Both')
 * @returns Filtered list of applicable attributes
 */
export function getApplicableAttributes(
  attributes: Attribute[],
  jurisdictionId: string,
  riskScope: 'Base' | 'EDD' | 'Both'
): Attribute[] {
  return attributes.filter((attr) => {
    // Check jurisdiction match (attribute must be ENT (global) or match specific jurisdiction)
    const jurisdictionMatch =
      attr.Jurisdiction_ID === 'ENT' ||
      attr.Jurisdiction_ID === jurisdictionId;

    if (!jurisdictionMatch) return false;

    // Check risk scope match
    if (riskScope === 'Both') {
      // Include all attributes
      return true;
    } else if (riskScope === 'EDD') {
      // Include EDD and Both attributes, plus all Base attributes
      return true; // EDD entities get all attributes
    } else {
      // Base scope - exclude EDD-only attributes
      return attr.RiskScope === 'Base' || attr.RiskScope === 'Both';
    }
  });
}

/**
 * Create rows for a single entity x attribute matrix
 * @param assignment - The entity assignment
 * @param applicableAttributes - Attributes applicable to this entity
 * @returns Array of TestGridRow for this entity
 */
export function createEntityAttributeRows(
  assignment: GenerationReviewRow,
  applicableAttributes: Attribute[]
): TestGridRow[] {
  return applicableAttributes.map((attr, index) => {
    const rowId = `${assignment.GCI}-${attr.Attribute_ID}-${index}`;

    return {
      // Entity Information (Columns 1-7)
      auditor: assignment.AuditorID,
      legalName: assignment.Legal_Name,
      irr: assignment.IRR,
      drr: assignment.DRR,
      caseId: assignment.GCI,
      primaryFLU: assignment.Primary_FLU,
      partyType: assignment.Party_Type,

      // Attribute Information (Columns 8-13)
      attributeId: attr.Attribute_ID,
      attributeName: attr.Attribute_Name,
      category: attr.Category,
      sourceFile: attr.Source_File,
      source: attr.Source,
      sourcePage: attr.Source_Page,

      // Metrics (Columns 14-18)
      passCount: 0,
      samplingIndex: assignment.Sampling_Index,
      auditorName: assignment.Auditor_Name,
      emptyCount: 0,
      percentComplete: 0,

      // KYC & Results (Columns 19-23)
      kycDate: assignment.KYC_Date,
      passWithObservationCount: 0,
      fail1RegulatoryCount: 0,
      fail2ProcedureCount: 0,
      questionToLOBCount: 0,

      // Additional Fields (Columns 24-28)
      gciNumbers: assignment.GCI,
      group: attr.Group,
      naCount: 0,
      attributeCount: 1, // Each row represents one attribute
      attributeText: attr.Question_Text,

      // Functional fields
      result: '',
      comments: '',
      jurisdictionId: assignment.Jurisdiction_ID,
      riskScope: attr.RiskScope,
      rowId,
    };
  });
}

/**
 * Calculate workbook summary statistics
 */
function calculateSummary(rows: TestGridRow[]): WorkbookSummary {
  const totalRows = rows.length;
  let passCount = 0;
  let passWithObservationCount = 0;
  let fail1Count = 0;
  let fail2Count = 0;
  let questionToLOBCount = 0;
  let naCount = 0;
  let emptyCount = 0;

  for (const row of rows) {
    switch (row.result) {
      case 'Pass':
        passCount++;
        break;
      case 'Pass w/Observation':
        passWithObservationCount++;
        break;
      case 'Fail 1 - Regulatory':
        fail1Count++;
        break;
      case 'Fail 2 - Procedure':
        fail2Count++;
        break;
      case 'Question to LOB':
        questionToLOBCount++;
        break;
      case 'N/A':
        naCount++;
        break;
      default:
        emptyCount++;
    }
  }

  const completedRows = totalRows - emptyCount;
  const completionPercentage = totalRows > 0
    ? (completedRows / totalRows) * 100
    : 0;

  return {
    totalRows,
    completedRows,
    passCount,
    passWithObservationCount,
    fail1Count,
    fail2Count,
    questionToLOBCount,
    naCount,
    emptyCount,
    completionPercentage,
  };
}

/**
 * Update row counts based on results (for a single entity's rows)
 */
export function updateRowCounts(rows: TestGridRow[]): TestGridRow[] {
  // Group rows by entity (caseId)
  const entityGroups = new Map<string, TestGridRow[]>();

  for (const row of rows) {
    const existing = entityGroups.get(row.caseId) || [];
    existing.push(row);
    entityGroups.set(row.caseId, existing);
  }

  // Update counts for each entity group
  const updatedRows: TestGridRow[] = [];

  for (const entityRows of entityGroups.values()) {
    // Calculate counts for this entity
    let passCount = 0;
    let passWithObservationCount = 0;
    let fail1Count = 0;
    let fail2Count = 0;
    let questionToLOBCount = 0;
    let naCount = 0;
    let emptyCount = 0;

    for (const row of entityRows) {
      switch (row.result) {
        case 'Pass':
          passCount++;
          break;
        case 'Pass w/Observation':
          passWithObservationCount++;
          break;
        case 'Fail 1 - Regulatory':
          fail1Count++;
          break;
        case 'Fail 2 - Procedure':
          fail2Count++;
          break;
        case 'Question to LOB':
          questionToLOBCount++;
          break;
        case 'N/A':
          naCount++;
          break;
        default:
          emptyCount++;
      }
    }

    const totalAttributes = entityRows.length;
    const completedAttributes = totalAttributes - emptyCount;
    const percentComplete = totalAttributes > 0
      ? (completedAttributes / totalAttributes) * 100
      : 0;

    // Update each row with the entity-level counts
    for (const row of entityRows) {
      updatedRows.push({
        ...row,
        passCount,
        passWithObservationCount,
        fail1RegulatoryCount: fail1Count,
        fail2ProcedureCount: fail2Count,
        questionToLOBCount,
        naCount,
        emptyCount,
        percentComplete,
        attributeCount: totalAttributes,
      });
    }
  }

  return updatedRows;
}

/**
 * Main generation function - generates test grids for all auditors
 * @param assignments - Array of GenerationReviewRow assignments
 * @param attributes - Array of all Attribute definitions
 * @param onProgress - Optional callback for progress updates
 * @returns Array of GeneratedWorkbook objects, one per auditor
 */
export async function generateTestGrids(
  assignments: GenerationReviewRow[],
  attributes: Attribute[],
  onProgress?: (current: number, total: number, status: string) => void
): Promise<GeneratedWorkbook[]> {
  const workbooks: GeneratedWorkbook[] = [];

  // Group assignments by AuditorID
  const auditorAssignments = new Map<string, GenerationReviewRow[]>();

  for (const assignment of assignments) {
    const existing = auditorAssignments.get(assignment.AuditorID) || [];
    existing.push(assignment);
    auditorAssignments.set(assignment.AuditorID, existing);
  }

  const totalAuditors = auditorAssignments.size;
  let processedAuditors = 0;

  // Process each auditor
  for (const [auditorId, auditorEntities] of auditorAssignments) {
    const auditorName = auditorEntities[0]?.Auditor_Name || auditorId;

    onProgress?.(
      processedAuditors,
      totalAuditors,
      `Processing workbook for ${auditorName}...`
    );

    const allRows: TestGridRow[] = [];
    const processedEntities = new Set<string>();

    // Process each entity for this auditor
    for (const entity of auditorEntities) {
      // Determine risk scope based on party type
      const riskScope = requiresEDD(entity.Party_Type) ? 'EDD' : 'Base';

      // Get applicable attributes for this entity
      const applicableAttrs = getApplicableAttributes(
        attributes,
        entity.Jurisdiction_ID,
        riskScope
      );

      // Create rows for this entity
      const entityRows = createEntityAttributeRows(entity, applicableAttrs);
      allRows.push(...entityRows);
      processedEntities.add(entity.GCI);
    }

    // Update counts across all rows
    const updatedRows = updateRowCounts(allRows);

    // Calculate summary
    const summary = calculateSummary(updatedRows);

    // Create workbook
    const workbook: GeneratedWorkbook = {
      auditorId,
      auditorName,
      rows: updatedRows,
      generatedAt: new Date().toISOString(),
      entityCount: processedEntities.size,
      attributeCount: updatedRows.length,
      summary,
    };

    workbooks.push(workbook);
    processedAuditors++;

    // Small delay to allow UI updates
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  onProgress?.(totalAuditors, totalAuditors, 'Generation complete!');

  return workbooks;
}

/**
 * Update a single row's result and recalculate counts
 */
export function updateRowResult(
  rows: TestGridRow[],
  rowId: string,
  result: TestResult,
  comments?: string
): TestGridRow[] {
  // Update the specific row
  const updatedRows = rows.map(row => {
    if (row.rowId === rowId) {
      return {
        ...row,
        result,
        comments: comments ?? row.comments,
      };
    }
    return row;
  });

  // Recalculate all counts
  return updateRowCounts(updatedRows);
}

/**
 * Get all unique entities from a workbook
 */
export function getUniqueEntities(rows: TestGridRow[]): {
  caseId: string;
  legalName: string;
  attributeCount: number;
  percentComplete: number;
}[] {
  const entityMap = new Map<string, {
    legalName: string;
    attributeCount: number;
    percentComplete: number;
  }>();

  for (const row of rows) {
    if (!entityMap.has(row.caseId)) {
      entityMap.set(row.caseId, {
        legalName: row.legalName,
        attributeCount: row.attributeCount,
        percentComplete: row.percentComplete,
      });
    }
  }

  return Array.from(entityMap.entries()).map(([caseId, data]) => ({
    caseId,
    ...data,
  }));
}

/**
 * Filter rows by entity
 */
export function filterRowsByEntity(rows: TestGridRow[], caseId: string): TestGridRow[] {
  return rows.filter(row => row.caseId === caseId);
}

/**
 * Column definitions for the test grid (all 28 columns)
 */
export const TEST_GRID_COLUMNS = [
  { key: 'auditor', header: 'Auditor', width: 80, collapsible: true },
  { key: 'legalName', header: 'Legal Name', width: 180, collapsible: true },
  { key: 'irr', header: 'IRR', width: 60, collapsible: true },
  { key: 'drr', header: 'DRR', width: 60, collapsible: true },
  { key: 'caseId', header: 'Case ID (Aware)', width: 120, collapsible: true },
  { key: 'primaryFLU', header: 'Primary FLU', width: 100, collapsible: true },
  { key: 'partyType', header: 'Party Type', width: 140, collapsible: true },
  { key: 'attributeId', header: 'Attribute ID', width: 100, collapsible: false },
  { key: 'attributeName', header: 'Attribute Name', width: 180, collapsible: false },
  { key: 'category', header: 'Category', width: 120, collapsible: false },
  { key: 'sourceFile', header: 'Source File', width: 150, collapsible: false },
  { key: 'source', header: 'Source', width: 120, collapsible: false },
  { key: 'sourcePage', header: 'Source Page', width: 80, collapsible: false },
  { key: 'passCount', header: 'Pass Count', width: 80, collapsible: false },
  { key: 'samplingIndex', header: 'Sampling Index', width: 100, collapsible: false },
  { key: 'auditorName', header: 'Auditor Name', width: 120, collapsible: false },
  { key: 'emptyCount', header: 'Empty Count', width: 80, collapsible: false },
  { key: 'percentComplete', header: 'Percent Complete', width: 100, collapsible: false },
  { key: 'kycDate', header: 'KYC Date', width: 100, collapsible: false },
  { key: 'passWithObservationCount', header: 'Pass w/Obs Count', width: 100, collapsible: false },
  { key: 'fail1RegulatoryCount', header: 'Fail 1 Count', width: 80, collapsible: false },
  { key: 'fail2ProcedureCount', header: 'Fail 2 Count', width: 80, collapsible: false },
  { key: 'questionToLOBCount', header: 'Q to LOB Count', width: 90, collapsible: false },
  { key: 'gciNumbers', header: 'GCI #s', width: 120, collapsible: false },
  { key: 'group', header: 'Group', width: 100, collapsible: false },
  { key: 'naCount', header: 'N/A Count', width: 70, collapsible: false },
  { key: 'attributeCount', header: 'Attribute Count', width: 100, collapsible: false },
  { key: 'attributeText', header: 'Attribute Text', width: 300, collapsible: false },
] as const;

/**
 * Result options for dropdown
 */
export const RESULT_OPTIONS: TestResult[] = [
  '',
  'Pass',
  'Pass w/Observation',
  'Fail 1 - Regulatory',
  'Fail 2 - Procedure',
  'Question to LOB',
  'N/A',
];
