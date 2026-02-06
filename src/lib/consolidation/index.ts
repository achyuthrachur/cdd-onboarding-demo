/**
 * Consolidation Module
 * Exports all consolidation-related functions and types
 */

// Re-export everything from engine
export {
  consolidateWorkbooks,
  consolidateTestGridWorkbooks,
  consolidateByCustomer,
  getMockConsolidation,
  getMetricsByJurisdiction,
  getMetricsByAuditor,
  getMetricsByCategory,
  getMetricsByRiskTier,
} from "./engine";

// Re-export types from engine
export type {
  ConsolidatedMetrics,
  FindingsByCategory,
  FindingsByAttribute,
  ExceptionDetail,
  JurisdictionMetrics,
  AuditorMetrics,
  CategoryMetrics,
  RiskTierMetrics,
  ConsolidationResult,
  // Customer-level consolidation types
  ConsolidatedCustomer,
  CustomerObservation,
  CustomerQuestion,
  CustomerFailure,
} from "./engine";

// Re-export export functions
export {
  exportConsolidationToExcel,
  downloadConsolidationExcel,
} from "./export";
