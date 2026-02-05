/**
 * Centralized Stage Data Store
 * In-memory store for stage results with persistence between stages
 */

import type { Attribute, Auditor, AcceptableDoc } from "@/lib/attribute-library/types";
import type { WorkbookState, WorkbookRow } from "@/lib/workbook/builder";
import type { ConsolidationResult } from "@/lib/consolidation/engine";
import type { SamplingPlan, SamplingSummary, SamplingConfig } from "@/lib/sampling/original-engine";

// Gap Assessment Result Types
export interface GapAssessmentResult {
  workbook: {
    title?: string;
    generated_at?: string;
    sheets: Array<{
      name: string;
      rows: Array<Record<string, unknown>>;
    }>;
  };
}

export interface GapItem {
  Gap_ID: string;
  Disposition: string;
  Severity: string;
  Standard_Requirement_ID: string;
  Standard_Requirement_Text: string;
  Procedure_Reference_ID: string;
  Gap_Description: string;
  Recommended_Remediation: string;
  Confidence: string;
}

// Sampling Result Types
export interface SamplingResult {
  id?: string;
  sampleId?: string;
  sample: Record<string, unknown>[];
  summary: SamplingSummary;
  plan: SamplingPlan;
  config: SamplingConfig;
  lockedAt?: string;
  isLocked?: boolean;
}

// Extracted Attribute (from Stage 3)
export interface ExtractedAttribute extends Attribute {
  extractedFrom?: 'flu_procedures' | 'library' | 'manual';
  gapId?: string;
}

// FLU Procedure Document (Stage 3)
export interface FLUProcedureDocument {
  id: string;
  fileName: string;
  docType: 'flu_procedure';
  jurisdiction: string | null;
  fileUrl?: string;
  uploadedAt: string;
  content?: string;
}

// FLU Extraction Result (Stage 3)
export interface FLUExtractionResult {
  id?: string;
  workbook: {
    title: string;
    generated_at: string;
    sheets: Array<{
      name: string;
      rows: Array<ExtractedAttribute | AcceptableDoc>;
    }>;
  };
  tokensUsed?: number;
}

// Auditor Workbook Row (Stage 4) - matches VBA structure
export interface AuditorWorkbookRow {
  id: string;
  // Sample identification
  caseId: string;           // GCI
  legalName: string;
  jurisdiction: string;
  irr: string;
  drr: string;
  partyType: string;
  kycDate: string;
  primaryFlu: string;
  samplingIndex: number;

  // Attribute info
  attributeId: string;
  attributeName: string;
  attributeCategory: string;  // CIP/CDD/EDD
  questionText: string;
  sourceFile: string;
  source: string;
  sourcePage: string;
  group: string;

  // Testing fields (Result dropdown from VBA)
  result: 'Pass' | 'Pass w/Observation' | 'Fail 1 - Regulatory' | 'Fail 2 - Procedure' | 'Question to LOB' | 'N/A' | '';
  observation: string;
  observationType?: 'standard' | 'custom';
  acceptableDocUsed: string;  // Which acceptable doc was found
  evidenceReference: string;
  auditorNotes: string;

  // Auditor info
  auditorId: string;
  auditorName: string;

  // Timestamps
  testedAt?: string;
}

// Auditor Workbook Summary (Stage 4)
export interface AuditorWorkbookSummary {
  totalRows: number;
  completedRows: number;
  passCount: number;
  passWithObsCount: number;
  fail1RegulatoryCount: number;
  fail2ProcedureCount: number;
  questionToLOBCount: number;
  naCount: number;
  emptyCount: number;
  completionPercentage: number;
}

// Auditor Workbook (Stage 4)
export interface AuditorWorkbook {
  id: string;
  auditorId: string;
  auditorName: string;
  auditorEmail: string;
  assignedSamples: Record<string, unknown>[];
  rows: AuditorWorkbookRow[];
  status: 'draft' | 'in_progress' | 'completed' | 'submitted';
  summary: AuditorWorkbookSummary;
  createdAt: string;
  updatedAt: string;
}

// Re-export Auditor from attribute-library
export type { Auditor, AcceptableDoc };

// Test Result (from Stage 5)
export interface TestResult {
  id: string;
  sampleItemId: string;
  attributeId: string;
  result: "Pass" | "Fail" | "N/A" | "";
  observation: string;
  evidenceReference: string;
  auditorNotes: string;
  testedAt?: string;
  testedBy?: string;
}

// Store Interface
export interface StageDataStore {
  // Stage 1: Gap Assessment
  gapAssessment1?: GapAssessmentResult;
  gapAssessment2?: GapAssessmentResult;
  combinedGaps?: GapItem[];

  // Stage 2: Sampling
  population?: Record<string, unknown>[];
  populationMetadata?: {
    id: string;
    fileName: string;
    columns: string[];
    rowCount: number;
    uploadedAt: string;
  };
  samplingConfig?: SamplingConfig;
  samplingResult?: SamplingResult;

  // Stage 3: Attribute Extraction (from FLU Procedures)
  fluProcedures?: FLUProcedureDocument[];
  fluExtractionResult?: FLUExtractionResult;
  extractedAttributes?: ExtractedAttribute[];
  acceptableDocs?: AcceptableDoc[];
  attributeExtractionComplete?: boolean;

  // Stage 4: Workbook Generation (per-auditor)
  selectedAuditors?: Auditor[];
  auditorWorkbooks?: AuditorWorkbook[];
  activeAuditorId?: string;
  workbookGenerationComplete?: boolean;
  // Legacy fields for backward compatibility
  workbookState?: WorkbookState;
  generatedWorkbooks?: WorkbookState[];

  // Stage 5: Testing
  testResults?: TestResult[];
  testingProgress?: {
    totalTests: number;
    completedTests: number;
    passCount: number;
    passWithObsCount: number;
    fail1RegulatoryCount: number;
    fail2ProcedureCount: number;
    questionToLOBCount: number;
    naCount: number;
  };

  // Stage 6: Consolidation
  consolidatedReport?: ConsolidationResult;
}

// In-memory store (singleton pattern)
let stageDataStore: StageDataStore = {};

// Store change listeners
type StoreListener = (key: keyof StageDataStore, value: unknown) => void;
const listeners: Set<StoreListener> = new Set();

/**
 * Get data for a specific stage key
 */
export function getStageData<K extends keyof StageDataStore>(
  key: K
): StageDataStore[K] {
  return stageDataStore[key];
}

/**
 * Set data for a specific stage key
 */
export function setStageData<K extends keyof StageDataStore>(
  key: K,
  value: StageDataStore[K]
): void {
  stageDataStore[key] = value;

  // Notify listeners
  listeners.forEach(listener => listener(key, value));

  // Persist to sessionStorage for cross-page persistence
  try {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(
        `stageData_${key}`,
        JSON.stringify(value)
      );
    }
  } catch (error) {
    console.warn('Failed to persist stage data to sessionStorage:', error);
  }
}

/**
 * Check if data exists for a specific stage key
 */
export function hasStageData(key: keyof StageDataStore): boolean {
  return stageDataStore[key] !== undefined;
}

/**
 * Clear all stage data
 */
export function clearStageData(): void {
  stageDataStore = {};

  // Clear from sessionStorage
  try {
    if (typeof window !== 'undefined') {
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('stageData_')) {
          sessionStorage.removeItem(key);
        }
      });
    }
  } catch (error) {
    console.warn('Failed to clear stage data from sessionStorage:', error);
  }

  // Notify listeners
  listeners.forEach(listener => listener('gapAssessment1' as keyof StageDataStore, undefined));
}

/**
 * Clear data for a specific stage
 */
export function clearStageDataForStage(stageNumber: 1 | 2 | 3 | 4 | 5 | 6): void {
  const keysToRemove: (keyof StageDataStore)[] = [];

  switch (stageNumber) {
    case 1:
      keysToRemove.push('gapAssessment1', 'gapAssessment2', 'combinedGaps');
      break;
    case 2:
      keysToRemove.push('population', 'populationMetadata', 'samplingConfig', 'samplingResult');
      break;
    case 3:
      keysToRemove.push('fluProcedures', 'fluExtractionResult', 'extractedAttributes', 'acceptableDocs', 'attributeExtractionComplete');
      break;
    case 4:
      keysToRemove.push('selectedAuditors', 'auditorWorkbooks', 'activeAuditorId', 'workbookGenerationComplete', 'workbookState', 'generatedWorkbooks');
      break;
    case 5:
      keysToRemove.push('testResults', 'testingProgress');
      break;
    case 6:
      keysToRemove.push('consolidatedReport');
      break;
  }

  keysToRemove.forEach(key => {
    delete stageDataStore[key];
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(`stageData_${key}`);
      }
    } catch (error) {
      console.warn('Failed to clear stage data key:', error);
    }
  });
}

/**
 * Load stage data from sessionStorage (for page reloads)
 */
export function loadStageDataFromStorage(): void {
  if (typeof window === 'undefined') return;

  try {
    const keys: (keyof StageDataStore)[] = [
      // Stage 1
      'gapAssessment1', 'gapAssessment2', 'combinedGaps',
      // Stage 2
      'population', 'populationMetadata', 'samplingConfig', 'samplingResult',
      // Stage 3
      'fluProcedures', 'fluExtractionResult', 'extractedAttributes', 'acceptableDocs', 'attributeExtractionComplete',
      // Stage 4
      'selectedAuditors', 'auditorWorkbooks', 'activeAuditorId', 'workbookGenerationComplete', 'workbookState', 'generatedWorkbooks',
      // Stage 5
      'testResults', 'testingProgress',
      // Stage 6
      'consolidatedReport'
    ];

    keys.forEach(key => {
      const stored = sessionStorage.getItem(`stageData_${key}`);
      if (stored) {
        try {
          stageDataStore[key] = JSON.parse(stored);
        } catch {
          console.warn(`Failed to parse stored data for ${key}`);
        }
      }
    });
  } catch (error) {
    console.warn('Failed to load stage data from sessionStorage:', error);
  }
}

/**
 * Subscribe to store changes
 */
export function subscribeToStageData(listener: StoreListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Get a summary of what data is available across all stages
 */
export function getStageDataSummary(): {
  stage1Complete: boolean;
  stage2Complete: boolean;
  stage3Complete: boolean;
  stage4Complete: boolean;
  stage5Complete: boolean;
  stage6Complete: boolean;
  hasData: Record<keyof StageDataStore, boolean>;
} {
  const hasData = {} as Record<keyof StageDataStore, boolean>;

  Object.keys(stageDataStore).forEach(key => {
    hasData[key as keyof StageDataStore] = stageDataStore[key as keyof StageDataStore] !== undefined;
  });

  return {
    stage1Complete: !!(stageDataStore.gapAssessment1 && stageDataStore.gapAssessment2),
    stage2Complete: !!(stageDataStore.samplingResult?.lockedAt),
    stage3Complete: !!(stageDataStore.attributeExtractionComplete &&
      stageDataStore.extractedAttributes &&
      stageDataStore.extractedAttributes.length > 0),
    stage4Complete: !!(stageDataStore.workbookGenerationComplete ||
      (stageDataStore.auditorWorkbooks && stageDataStore.auditorWorkbooks.length > 0) ||
      stageDataStore.workbookState ||
      (stageDataStore.generatedWorkbooks?.length ?? 0) > 0),
    stage5Complete: !!(stageDataStore.testingProgress &&
      stageDataStore.testingProgress.completedTests === stageDataStore.testingProgress.totalTests),
    stage6Complete: !!(stageDataStore.consolidatedReport),
    hasData,
  };
}

/**
 * Get combined gaps from both gap assessments
 */
export function getCombinedGaps(): GapItem[] {
  if (stageDataStore.combinedGaps) {
    return stageDataStore.combinedGaps;
  }

  const gaps: GapItem[] = [];

  // Extract from assessment 1
  if (stageDataStore.gapAssessment1?.workbook?.sheets) {
    const gapSheet = stageDataStore.gapAssessment1.workbook.sheets.find(
      s => s.name === 'Gap_Details'
    );
    if (gapSheet?.rows) {
      gaps.push(...gapSheet.rows.map(row => ({
        Gap_ID: String(row.Gap_ID || row.Change_ID || ''),
        Disposition: String(row.Disposition || row.Change_Type || ''),
        Severity: String(row.Severity || row.Impact || ''),
        Standard_Requirement_ID: String(row.Standard_Requirement_ID || row.Old_Requirement_ID || ''),
        Standard_Requirement_Text: String(row.Standard_Requirement_Text || ''),
        Procedure_Reference_ID: String(row.Procedure_Reference_ID || row.Current_Requirement_ID || ''),
        Gap_Description: String(row.Gap_Description || row.Change_Description || ''),
        Recommended_Remediation: String(row.Recommended_Remediation || ''),
        Confidence: String(row.Confidence || ''),
      })));
    }
  }

  // Extract from assessment 2
  if (stageDataStore.gapAssessment2?.workbook?.sheets) {
    const gapSheet = stageDataStore.gapAssessment2.workbook.sheets.find(
      s => s.name === 'Gap_Details'
    );
    if (gapSheet?.rows) {
      gaps.push(...gapSheet.rows.map(row => ({
        Gap_ID: String(row.Gap_ID || ''),
        Disposition: String(row.Disposition || ''),
        Severity: String(row.Severity || ''),
        Standard_Requirement_ID: String(row.Standard_Requirement_ID || ''),
        Standard_Requirement_Text: String(row.Standard_Requirement_Text || ''),
        Procedure_Reference_ID: String(row.Procedure_Reference_ID || ''),
        Gap_Description: String(row.Gap_Description || ''),
        Recommended_Remediation: String(row.Recommended_Remediation || ''),
        Confidence: String(row.Confidence || ''),
      })));
    }
  }

  return gaps;
}

/**
 * Calculate summary statistics for an auditor workbook
 */
export function calculateAuditorWorkbookSummary(rows: AuditorWorkbookRow[]): AuditorWorkbookSummary {
  const totalRows = rows.length;
  let passCount = 0;
  let passWithObsCount = 0;
  let fail1RegulatoryCount = 0;
  let fail2ProcedureCount = 0;
  let questionToLOBCount = 0;
  let naCount = 0;
  let emptyCount = 0;

  rows.forEach(row => {
    switch (row.result) {
      case 'Pass':
        passCount++;
        break;
      case 'Pass w/Observation':
        passWithObsCount++;
        break;
      case 'Fail 1 - Regulatory':
        fail1RegulatoryCount++;
        break;
      case 'Fail 2 - Procedure':
        fail2ProcedureCount++;
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
 * Get acceptable documents for a specific attribute
 */
export function getAcceptableDocsForAttribute(attributeId: string): AcceptableDoc[] {
  const docs = stageDataStore.acceptableDocs || [];
  return docs.filter(doc => doc.Attribute_ID === attributeId);
}

// Initialize from storage on module load (client-side only)
if (typeof window !== 'undefined') {
  loadStageDataFromStorage();
}
