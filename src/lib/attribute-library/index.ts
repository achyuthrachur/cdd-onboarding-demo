// Attribute Library Exports
export * from './types';
export * from './mock-data';
export * from './import-export';
export * from './actions';

// Generation Engine exports (with explicit names to avoid conflicts)
export {
  type TestGridRow,
  type TestResult,
  type WorkbookSummary,
  getApplicableAttributes,
  createEntityAttributeRows,
  updateRowCounts,
  generateTestGrids as generateTestGridWorkbooks,
  updateRowResult,
  getUniqueEntities,
  filterRowsByEntity,
  TEST_GRID_COLUMNS,
  RESULT_OPTIONS,
} from './generation-engine';

// Re-export GeneratedWorkbook from generation-engine with a different name
export type { GeneratedWorkbook as TestGridWorkbook } from './generation-engine';
