// Re-export database types
export type {
  AuditRun,
  NewAuditRun,
  Document,
  NewDocument,
  Stage1Result,
  NewStage1Result,
  PopulationFile,
  NewPopulationFile,
  Sample,
  NewSample,
  Workbook,
  NewWorkbook,
  WorkbookRow,
  NewWorkbookRow,
  Consolidation,
  NewConsolidation,
  Report,
  NewReport,
} from '@/lib/db/schema';

// Audit Run Status
export type AuditRunStatus = 'draft' | 'in_progress' | 'completed' | 'archived';

// Document Types
export type DocumentType = 'global_std_old' | 'global_std_new' | 'flu_global' | 'flu_jurisdiction';

// Comparison Types
export type ComparisonType = 'std_vs_std' | 'std_vs_flu';

// Sampling Methods
export type SamplingMethod = 'random' | 'stratified' | 'systematic' | 'mus';

// Workbook Status
export type WorkbookStatus = 'draft' | 'in_progress' | 'submitted' | 'approved';

// Test Result
export type TestResult = 'pass' | 'fail' | 'n/a';

// Standard Observations (from VBA forms)
export const STANDARD_OBSERVATIONS = [
  'Documentation appears incomplete. Additional verification required.',
  'Discrepancy noted between reported values and supporting documents.',
  'Unable to verify information with provided documentation. Follow-up needed.',
  'Additional clarification required from entity management.',
  'Supporting evidence provided does not fully address the requirement.',
  'Documentation quality is poor. Clearer evidence requested.',
  'Information conflicts with prior period records. Needs reconciliation.',
  'Third-party verification pending. Awaiting confirmation.',
  'Entity provided partial information. Complete details required.',
  'Documentation dated outside acceptable period. Updated records needed.',
] as const;

export type StandardObservation = typeof STANDARD_OBSERVATIONS[number];

// Gap Severity
export type GapSeverity = 'Critical' | 'High' | 'Medium' | 'Low';

// Gap Disposition
export type GapDisposition =
  | 'Meets'
  | 'Partially Meets'
  | 'Does Not Meet'
  | 'Conflict'
  | 'Exceeds'
  | 'N/A';

// Attribute Category
export type AttributeCategory =
  | 'Entity Profile'
  | 'Individual Profile'
  | 'Ownership'
  | 'Documentation'
  | 'AML'
  | 'EDD'
  | 'Compliance'
  | 'Registration';

// Attribute Group
export type AttributeGroup =
  | 'Individuals'
  | 'Entity'
  | 'Beneficial Owner'
  | 'Screening';

// Risk Scope
export type RiskScope = 'Base' | 'EDD' | 'Both';

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Pagination
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Stage navigation
export type StageNumber = 1 | 2 | 3 | 4;

export interface StageInfo {
  number: StageNumber;
  name: string;
  description: string;
  path: string;
  isComplete: boolean;
  isActive: boolean;
}

// Workbook template structure
export interface WorkbookTemplate {
  sheets: Array<{
    name: string;
    columns: Array<{
      header: string;
      key: string;
      width: number;
      type?: 'text' | 'dropdown' | 'readonly';
      source?: string[];
      required?: boolean;
    }>;
  }>;
}

// Sampling configuration
export interface SamplingConfig {
  method: SamplingMethod;
  confidenceLevel: number;
  marginOfError: number;
  expectedErrorRate: number;
  sampleSize?: number;
  seed?: number;
  strataColumn?: string;
  idColumn?: string;
  exclusionFilters?: Array<{
    column: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
    value: string;
  }>;
}

// Consolidation metrics
export interface ConsolidationMetrics {
  totalTested: number;
  passCount: number;
  failCount: number;
  naCount: number;
  overallPassRate: number;
  exceptionCount: number;
  completionRate: number;
  byAttribute: Array<{
    attributeId: string;
    attributeName: string;
    passCount: number;
    failCount: number;
    naCount: number;
    passRate: number;
  }>;
  byJurisdiction?: Array<{
    jurisdiction: string;
    passCount: number;
    failCount: number;
    naCount: number;
  }>;
}
