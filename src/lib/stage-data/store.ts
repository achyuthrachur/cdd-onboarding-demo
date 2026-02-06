/**
 * Centralized Stage Data Store
 * In-memory store for stage results with persistence between stages
 */

import { stageDataLogger } from "@/lib/logger";
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
  demoMode?: boolean;
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

// Auditor Workbook (Stage 4) - LEGACY format (sample × attribute rows)
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

// ============================================
// PIVOTED WORKBOOK STRUCTURE (NEW)
// Rows = Attributes/Questions
// Columns = Customer results (Result + Observation per customer)
// ============================================

// Result for a single customer on a single attribute
export interface CustomerTestResult {
  customerId: string;       // GCI/Case ID
  customerName: string;     // Legal Name
  selectedDocument?: string; // The specific doc the auditor selected (e.g., "driver-license", "passport")
  result: 'Pass' | 'Pass w/Observation' | 'Fail 1 - Regulatory' | 'Fail 2 - Procedure' | 'Question to LOB' | 'N/A' | '';
  observation: string;
}

// Customer info for column headers
export interface AssignedCustomer {
  customerId: string;       // GCI
  customerName: string;     // Legal Name
  jurisdiction: string;
  irr: string;
  drr: string;
  partyType: string;
  kycDate: string;
  primaryFlu: string;
  samplingIndex: number;
}

// Acceptable document option for dropdown
export interface AcceptableDocOption {
  value: string;        // Unique identifier (e.g., "driver-license", "passport")
  label: string;        // Display name (e.g., "Driver's License", "Passport")
  resultMapping: 'Pass' | 'Pass w/Observation' | 'Fail 1 - Regulatory' | 'Fail 2 - Procedure' | 'Question to LOB' | 'N/A';
  isSystemOption?: boolean; // True for system options like "Document Not Found", "N/A"
}

// A single row in the pivoted workbook (one per attribute)
export interface PivotedWorkbookRow {
  id: string;
  // Attribute info (fixed columns - visible to auditor)
  attributeId: string;
  attributeCategory: string;  // CIP/CDD/EDD
  questionText: string;

  // Additional attribute metadata
  attributeName?: string;
  sourceFile?: string;
  source?: string;
  sourcePage?: string;
  group?: string;

  // Acceptable documents for this attribute (for dropdown)
  acceptableDocs: AcceptableDocOption[];

  // Customer results (keyed by customerId)
  // Each entry has: result, observation, selectedDocument
  customerResults: Record<string, CustomerTestResult>;
}

// Pivoted Auditor Workbook (NEW structure for Stage 5)
export interface PivotedAuditorWorkbook {
  id: string;
  auditorId: string;
  auditorName: string;
  auditorEmail: string;

  // Customers assigned to this auditor (for column headers)
  assignedCustomers: AssignedCustomer[];

  // Rows (one per attribute, with customer results as nested columns)
  rows: PivotedWorkbookRow[];

  // Attribute list for reference
  attributes: Array<{
    attributeId: string;
    attributeName: string;
    attributeCategory: string;
    questionText: string;
  }>;

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
  pivotedWorkbooks?: PivotedAuditorWorkbook[];  // NEW: Pivoted structure for testing
  activeAuditorId?: string;
  workbookGenerationComplete?: boolean;
  // Legacy fields for backward compatibility
  workbookState?: WorkbookState;
  generatedWorkbooks?: WorkbookState[];

  // Stage 5: Testing (uses pivotedWorkbooks)
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

  // AIC/Auditor Portal - Publishing & Progress Tracking
  workbooksPublished?: {
    publishedAt: string;
    publishedBy: string;
    workbookCount: number;
    auditorCount: number;
  };
  auditorProgress?: Record<string, {
    completionPercentage: number;
    status: 'draft' | 'in_progress' | 'submitted';
    lastActivityAt: string;
    submittedAt: string | null;
  }>;
}

// ============================================
// Portal Types and Data Ownership
// Separates AIC and Auditor data scopes
// ============================================

export type PortalType = 'aic' | 'auditor';

/**
 * Data ownership mapping - determines which portal owns each data key
 * 'aic' = AIC-only data (Stages 1-4 setup)
 * 'auditor' = Auditor-only data (testing progress)
 * 'shared' = Published by AIC, consumed by Auditor
 */
export const DATA_OWNERSHIP: Record<keyof StageDataStore, PortalType | 'shared'> = {
  // Stage 1: Gap Assessment (AIC-owned)
  gapAssessment1: 'aic',
  gapAssessment2: 'aic',
  combinedGaps: 'aic',

  // Stage 2: Sampling (AIC-owned)
  population: 'aic',
  populationMetadata: 'aic',
  samplingConfig: 'aic',
  samplingResult: 'aic',

  // Stage 3: Attribute Extraction (AIC-owned)
  fluProcedures: 'aic',
  fluExtractionResult: 'aic',
  extractedAttributes: 'aic',
  acceptableDocs: 'aic',
  attributeExtractionComplete: 'aic',

  // Stage 4: Workbook Generation (AIC-owned until published)
  selectedAuditors: 'aic',
  auditorWorkbooks: 'shared',        // Published to auditors
  pivotedWorkbooks: 'shared',        // Published to auditors
  activeAuditorId: 'aic',
  workbookGenerationComplete: 'aic',
  workbookState: 'aic',
  generatedWorkbooks: 'aic',

  // Publication tracking (shared)
  workbooksPublished: 'shared',
  auditorProgress: 'shared',

  // Stage 5: Testing (Auditor-owned)
  testResults: 'auditor',
  testingProgress: 'auditor',

  // Stage 6: Consolidation (AIC-owned)
  consolidatedReport: 'aic',
};

/**
 * Get storage key with optional portal prefix
 */
function getStorageKey(key: string, portal?: PortalType): string {
  // Shared data doesn't get a portal prefix
  const ownership = DATA_OWNERSHIP[key as keyof StageDataStore];
  if (ownership === 'shared' || !portal) {
    return `stageData_${key}`;
  }
  return `stageData_${portal}_${key}`;
}

/**
 * Check if current portal can access a data key
 */
export function canPortalAccessKey(portal: PortalType, key: keyof StageDataStore): boolean {
  const ownership = DATA_OWNERSHIP[key];
  if (ownership === 'shared') return true;
  if (ownership === portal) return true;
  return false;
}

/**
 * Get data keys accessible by a portal
 */
export function getPortalAccessibleKeys(portal: PortalType): (keyof StageDataStore)[] {
  return (Object.keys(DATA_OWNERSHIP) as (keyof StageDataStore)[]).filter(
    key => canPortalAccessKey(portal, key)
  );
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

  // Persist to localStorage for cross-page persistence
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        `stageData_${key}`,
        JSON.stringify(value)
      );
    }
  } catch (error) {
    stageDataLogger.warn('Failed to persist stage data to localStorage:', error);
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

  // Clear from localStorage
  try {
    if (typeof window !== 'undefined') {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('stageData_')) {
          localStorage.removeItem(key);
        }
      });
    }
  } catch (error) {
    stageDataLogger.warn('Failed to clear stage data from localStorage:', error);
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
      keysToRemove.push('selectedAuditors', 'auditorWorkbooks', 'activeAuditorId', 'workbookGenerationComplete', 'workbookState', 'generatedWorkbooks', 'pivotedWorkbooks', 'workbooksPublished', 'auditorProgress');
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
        localStorage.removeItem(`stageData_${key}`);
      }
    } catch (error) {
      stageDataLogger.warn('Failed to clear stage data key:', error);
    }
  });
}

/**
 * Load stage data from localStorage (for page reloads)
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
      'selectedAuditors', 'auditorWorkbooks', 'pivotedWorkbooks', 'activeAuditorId', 'workbookGenerationComplete', 'workbookState', 'generatedWorkbooks',
      // Stage 5
      'testResults', 'testingProgress',
      // Stage 6
      'consolidatedReport',
      // AIC/Auditor Portal
      'workbooksPublished', 'auditorProgress'
    ];

    keys.forEach(key => {
      const stored = localStorage.getItem(`stageData_${key}`);
      if (stored) {
        try {
          stageDataStore[key] = JSON.parse(stored);
        } catch {
          stageDataLogger.warn(`Failed to parse stored data for ${key}`);
        }
      }
    });
  } catch (error) {
    stageDataLogger.warn('Failed to load stage data from localStorage:', error);
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

// ============================================
// NEW: Selective Loading Functions
// Separate INPUT data from OUTPUT data
// ============================================

/**
 * Keys that represent INPUT data (documents, procedures, configs)
 * These can be preloaded without showing results
 */
const INPUT_KEYS: (keyof StageDataStore)[] = [
  'population',
  'populationMetadata',
  'samplingConfig',
  'fluProcedures',
  'selectedAuditors',
];

/**
 * Keys that represent OUTPUT data (results, extractions)
 * These should only appear after explicit user action
 */
const OUTPUT_KEYS: (keyof StageDataStore)[] = [
  'gapAssessment1',
  'gapAssessment2',
  'combinedGaps',
  'samplingResult',
  'fluExtractionResult',
  'extractedAttributes',
  'acceptableDocs',
  'attributeExtractionComplete',
  'auditorWorkbooks',
  'pivotedWorkbooks',
  'workbookGenerationComplete',
  'workbookState',
  'generatedWorkbooks',
  'testResults',
  'testingProgress',
  'consolidatedReport',
  'workbooksPublished',
  'auditorProgress',
];

/**
 * Load only INPUT data from localStorage (not outputs/results)
 * Call this on app initialization to restore document uploads etc.
 * without showing previously generated results
 */
export function loadStageInputsFromStorage(): void {
  if (typeof window === 'undefined') return;

  try {
    INPUT_KEYS.forEach(key => {
      const stored = localStorage.getItem(`stageData_${key}`);
      if (stored) {
        try {
          stageDataStore[key] = JSON.parse(stored);
        } catch {
          stageDataLogger.warn(`Failed to parse stored input data for ${key}`);
        }
      }
    });
    stageDataLogger.info('Loaded stage inputs from storage');
  } catch (error) {
    stageDataLogger.warn('Failed to load stage inputs from localStorage:', error);
  }
}

/**
 * Load OUTPUT data from localStorage for a specific stage
 * Call this when user explicitly wants to restore previous results
 */
export function loadStageOutputsFromStorage(stageNumber?: 1 | 2 | 3 | 4 | 5 | 6): void {
  if (typeof window === 'undefined') return;

  const keysToLoad: (keyof StageDataStore)[] = [];

  if (!stageNumber) {
    // Load all outputs
    keysToLoad.push(...OUTPUT_KEYS);
  } else {
    // Load stage-specific outputs
    switch (stageNumber) {
      case 1:
        keysToLoad.push('gapAssessment1', 'gapAssessment2', 'combinedGaps');
        break;
      case 2:
        keysToLoad.push('samplingResult');
        break;
      case 3:
        keysToLoad.push('fluExtractionResult', 'extractedAttributes', 'acceptableDocs', 'attributeExtractionComplete');
        break;
      case 4:
        keysToLoad.push('auditorWorkbooks', 'pivotedWorkbooks', 'workbookGenerationComplete', 'workbookState', 'generatedWorkbooks', 'workbooksPublished', 'auditorProgress');
        break;
      case 5:
        keysToLoad.push('testResults', 'testingProgress');
        break;
      case 6:
        keysToLoad.push('consolidatedReport');
        break;
    }
  }

  try {
    keysToLoad.forEach(key => {
      const stored = localStorage.getItem(`stageData_${key}`);
      if (stored) {
        try {
          stageDataStore[key] = JSON.parse(stored);
        } catch {
          stageDataLogger.warn(`Failed to parse stored output data for ${key}`);
        }
      }
    });
    stageDataLogger.info(`Loaded stage ${stageNumber || 'all'} outputs from storage`);
  } catch (error) {
    stageDataLogger.warn('Failed to load stage outputs from localStorage:', error);
  }
}

/**
 * Clear OUTPUT data for a specific stage (keep inputs)
 * Use this when user wants to re-run with real AI instead of demo data
 */
export function clearStageOutputs(stageNumber: 1 | 2 | 3 | 4 | 5 | 6): void {
  const keysToRemove: (keyof StageDataStore)[] = [];

  switch (stageNumber) {
    case 1:
      keysToRemove.push('gapAssessment1', 'gapAssessment2', 'combinedGaps');
      break;
    case 2:
      keysToRemove.push('samplingResult');
      break;
    case 3:
      keysToRemove.push('fluExtractionResult', 'extractedAttributes', 'acceptableDocs', 'attributeExtractionComplete');
      break;
    case 4:
      keysToRemove.push('auditorWorkbooks', 'pivotedWorkbooks', 'workbookGenerationComplete', 'workbookState', 'generatedWorkbooks', 'workbooksPublished', 'auditorProgress');
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
        localStorage.removeItem(`stageData_${key}`);
      }
    } catch (error) {
      stageDataLogger.warn('Failed to clear stage output key:', error);
    }
  });

  // Notify listeners
  listeners.forEach(listener => listener('gapAssessment1' as keyof StageDataStore, undefined));
  stageDataLogger.info(`Cleared stage ${stageNumber} outputs`);
}

/**
 * Check if OUTPUT data exists for a specific stage
 */
export function hasStageOutputs(stageNumber: 1 | 2 | 3 | 4 | 5 | 6): boolean {
  switch (stageNumber) {
    case 1:
      return !!(stageDataStore.gapAssessment1 || stageDataStore.gapAssessment2);
    case 2:
      return !!stageDataStore.samplingResult;
    case 3:
      return !!(stageDataStore.fluExtractionResult || stageDataStore.extractedAttributes);
    case 4:
      return !!(stageDataStore.auditorWorkbooks || stageDataStore.pivotedWorkbooks || stageDataStore.workbookState);
    case 5:
      return !!(stageDataStore.testResults || stageDataStore.testingProgress);
    case 6:
      return !!stageDataStore.consolidatedReport;
    default:
      return false;
  }
}

// ============================================
// REMOVED: Auto-load on module import
// Previously: loadStageDataFromStorage() was called here
// Now: Apps should call loadStageInputsFromStorage() explicitly
// or loadStageOutputsFromStorage() when restoring previous session
// ============================================

// ============================================
// Cross-Portal Publication Flow
// AIC publishes workbooks -> Auditors can access
// ============================================

export interface WorkbookPublication {
  publishedAt: string;
  publishedBy: string;
  workbookCount: number;
  auditorCount: number;
}

/**
 * Publish workbooks from AIC to Auditor portal
 * This makes workbooks visible to auditors
 */
export function publishWorkbooksToAuditor(publishedBy: string = 'AIC User'): WorkbookPublication {
  const workbooks = stageDataStore.pivotedWorkbooks;
  const auditors = stageDataStore.selectedAuditors;

  if (!workbooks || workbooks.length === 0) {
    throw new Error('Cannot publish: no workbooks generated');
  }
  if (!auditors || auditors.length === 0) {
    throw new Error('Cannot publish: no auditors selected');
  }

  // Mark as published
  const publication: WorkbookPublication = {
    publishedAt: new Date().toISOString(),
    publishedBy,
    workbookCount: workbooks.length,
    auditorCount: auditors.length,
  };

  setStageData('workbooksPublished', publication);

  // Initialize auditor progress for each auditor
  const initialProgress: Record<string, {
    completionPercentage: number;
    status: 'draft' | 'in_progress' | 'submitted';
    lastActivityAt: string;
    submittedAt: string | null;
  }> = {};

  auditors.forEach(auditor => {
    const auditorWorkbook = workbooks.find(wb => wb.auditorId === auditor.id);
    const totalTests = auditorWorkbook
      ? auditorWorkbook.rows.length * auditorWorkbook.assignedCustomers.length
      : 0;

    initialProgress[auditor.id] = {
      completionPercentage: 0,
      status: 'draft',
      lastActivityAt: new Date().toISOString(),
      submittedAt: null,
    };
  });

  setStageData('auditorProgress', initialProgress);

  stageDataLogger.info(`Published ${workbooks.length} workbooks to ${auditors.length} auditors`);

  return publication;
}

/**
 * Check if workbooks have been published
 */
export function areWorkbooksPublished(): boolean {
  return !!stageDataStore.workbooksPublished;
}

/**
 * Get publication info
 */
export function getPublicationInfo(): WorkbookPublication | null {
  return stageDataStore.workbooksPublished || null;
}

/**
 * Get auditor-visible data (only what they should see)
 * This enforces data visibility rules for the Auditor portal
 */
export function getAuditorVisibleData(auditorId: string) {
  // Check if workbooks are published
  if (!areWorkbooksPublished()) {
    return {
      workbook: null,
      progress: null,
      canEdit: false,
      error: 'Workbooks not yet published by AIC',
    };
  }

  const workbooks = stageDataStore.pivotedWorkbooks || [];
  const auditorWorkbook = workbooks.find(wb => wb.auditorId === auditorId);
  const progress = stageDataStore.auditorProgress?.[auditorId];

  if (!auditorWorkbook) {
    return {
      workbook: null,
      progress: null,
      canEdit: false,
      error: 'No workbook assigned to this auditor',
    };
  }

  return {
    workbook: auditorWorkbook,
    progress,
    canEdit: progress?.status !== 'submitted',
    error: null,
  };
}

/**
 * Update auditor progress (called from Auditor portal)
 */
export function updateAuditorProgress(
  auditorId: string,
  updates: Partial<{
    completionPercentage: number;
    status: 'draft' | 'in_progress' | 'submitted';
  }>
): void {
  const currentProgress = stageDataStore.auditorProgress || {};
  const auditorProgress = currentProgress[auditorId] || {
    completionPercentage: 0,
    status: 'draft' as const,
    lastActivityAt: new Date().toISOString(),
    submittedAt: null,
  };

  const updatedProgress = {
    ...auditorProgress,
    ...updates,
    lastActivityAt: new Date().toISOString(),
  };

  // If submitting, record submission time
  if (updates.status === 'submitted' && auditorProgress.status !== 'submitted') {
    updatedProgress.submittedAt = new Date().toISOString();
  }

  setStageData('auditorProgress', {
    ...currentProgress,
    [auditorId]: updatedProgress,
  });

  stageDataLogger.info(`Updated progress for auditor ${auditorId}:`, updates);
}

/**
 * Get all auditor progress (for AIC monitoring)
 */
export function getAllAuditorProgress(): Record<string, {
  completionPercentage: number;
  status: 'draft' | 'in_progress' | 'submitted';
  lastActivityAt: string;
  submittedAt: string | null;
}> {
  return stageDataStore.auditorProgress || {};
}

/**
 * Clear portal-specific data
 */
export function clearPortalData(portal: PortalType): void {
  const keysToRemove = getPortalAccessibleKeys(portal).filter(
    key => DATA_OWNERSHIP[key] === portal // Only clear data owned by this portal
  );

  keysToRemove.forEach(key => {
    delete stageDataStore[key];
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`stageData_${key}`);
      }
    } catch (error) {
      stageDataLogger.warn(`Failed to clear portal data key ${key}:`, error);
    }
  });

  stageDataLogger.info(`Cleared ${portal} portal data`);
}

/**
 * Load data for a specific portal
 * Only loads data that portal has access to
 */
export function loadPortalData(portal: PortalType): void {
  if (typeof window === 'undefined') return;

  const accessibleKeys = getPortalAccessibleKeys(portal);

  try {
    accessibleKeys.forEach(key => {
      const storageKey = `stageData_${key}`;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          stageDataStore[key] = JSON.parse(stored);
        } catch {
          stageDataLogger.warn(`Failed to parse stored data for ${key}`);
        }
      }
    });
    stageDataLogger.info(`Loaded ${portal} portal data`);
  } catch (error) {
    stageDataLogger.warn(`Failed to load ${portal} portal data:`, error);
  }
}
