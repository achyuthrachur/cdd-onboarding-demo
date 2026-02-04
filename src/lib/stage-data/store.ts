/**
 * Centralized Stage Data Store
 * In-memory store for stage results with persistence between stages
 */

import type { Attribute } from "@/lib/attribute-library/types";
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
  extractedFrom?: 'gap_assessment' | 'library' | 'manual';
  gapId?: string;
}

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

  // Stage 3: Attribute Extraction
  extractedAttributes?: ExtractedAttribute[];
  attributeExtractionComplete?: boolean;

  // Stage 4: Workbook Generation
  workbookState?: WorkbookState;
  generatedWorkbooks?: WorkbookState[];

  // Stage 5: Testing
  testResults?: TestResult[];
  testingProgress?: {
    totalTests: number;
    completedTests: number;
    passCount: number;
    failCount: number;
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
      keysToRemove.push('extractedAttributes', 'attributeExtractionComplete');
      break;
    case 4:
      keysToRemove.push('workbookState', 'generatedWorkbooks');
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
      'gapAssessment1', 'gapAssessment2', 'combinedGaps',
      'population', 'populationMetadata', 'samplingConfig', 'samplingResult',
      'extractedAttributes', 'attributeExtractionComplete',
      'workbookState', 'generatedWorkbooks',
      'testResults', 'testingProgress',
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
    stage3Complete: !!(stageDataStore.attributeExtractionComplete),
    stage4Complete: !!(stageDataStore.workbookState || (stageDataStore.generatedWorkbooks?.length ?? 0) > 0),
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

// Initialize from storage on module load (client-side only)
if (typeof window !== 'undefined') {
  loadStageDataFromStorage();
}
