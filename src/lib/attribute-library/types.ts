// Attribute Library Types
// Matches the structure of the Excel Attribute Library Workbook

/**
 * Attribute - Core testing attribute with 13 fields
 * Maps to the "Attributes" sheet in the Excel workbook
 */
export interface Attribute {
  Source_File: string;
  Attribute_ID: string;
  Attribute_Name: string;
  Category: string;
  Source: string;
  Source_Page: string;
  Question_Text: string;
  Notes: string;
  Jurisdiction_ID: string;
  RiskScope: 'Base' | 'EDD' | 'Both';
  IsRequired: 'Y' | 'N';
  DocumentationAgeRule: string;
  Group: string;
}

/**
 * AcceptableDoc - Acceptable documentation for attributes with 6 fields
 * Maps to the "Acceptable Docs" sheet in the Excel workbook
 */
export interface AcceptableDoc {
  Source_File: string;
  Attribute_ID: string;
  Document_Name: string;
  Evidence_Source_Document: string;
  Jurisdiction_ID: string;
  Notes: string;
}

/**
 * GenerationReviewRow - Sample assignment data with 12 fields
 * Maps to the "Generation Review" sheet in the Excel workbook
 * This is the main hub for workbook generation
 */
export interface GenerationReviewRow {
  Sampling_Index: number;
  GCI: string;
  Legal_Name: string;
  Jurisdiction_ID: string;
  Jurisdiction: string;
  AuditorID: string;
  Auditor_Name: string;
  IRR: number;
  DRR: number;
  Party_Type: string;
  KYC_Date: string;
  Primary_FLU: string;
}

/**
 * Auditor - Auditor reference data with 3 fields
 * Maps to the "Auditors" sheet in the Excel workbook
 */
export interface Auditor {
  id: string;
  name: string;
  email: string;
}

/**
 * Legacy Auditor format for Excel workbook compatibility
 */
export interface LegacyAuditor {
  AuditorID: string;
  AuditorName: string;
  Email: string;
}

/**
 * ClientTypeRisk - Client type to risk tier mapping with 3 fields
 * Maps to the "ClientTypeRisk" sheet in the Excel workbook
 */
export interface ClientTypeRisk {
  ClientType: string;
  RiskTier: 'Low' | 'Medium' | 'High' | 'Critical';
  IsEDD: boolean;
}

/**
 * Jurisdiction - Jurisdiction reference data
 * Maps to the "Jurisdictions" sheet in the Excel workbook
 */
export interface Jurisdiction {
  Jurisdiction_ID: string;
  Jurisdiction_Name: string;
}

/**
 * SamplingConfig - Sampling configuration for the batch
 * Maps to the "Sampling" sheet in the Excel workbook
 */
export interface SamplingConfig {
  BatchID: string;
  SamplingMethod: 'Random' | 'Stratified' | 'Systematic' | 'MUS';
  ConfidenceLevel: number;
  MarginOfError: number;
  SampleSize: number;
  PopulationSize: number;
  LockedDate: string;
  Status: 'Draft' | 'Locked' | 'Completed';
}

/**
 * BatchConfig - Configuration for the current generation batch
 * Used in the Generation Review sheet header section
 */
export interface BatchConfig {
  BatchID: string;
  LastRefresh: string;
  OutputFolder: string;
  Status: 'Ready' | 'In Progress' | 'Completed' | 'Error';
  TotalSamples: number;
  AssignedCount: number;
  UnassignedCount: number;
}

/**
 * Sheet names in the Attribute Library Workbook
 */
export type AttributeLibrarySheet =
  | 'Generation Review'
  | 'Attributes'
  | 'Acceptable Docs'
  | 'Jurisdictions'
  | 'Auditors'
  | 'ClientTypeRisk'
  | 'Sampling';

/**
 * Filter state for tables
 */
export interface TableFilters {
  search: string;
  jurisdiction?: string;
  category?: string;
  group?: string;
  riskScope?: string;
  auditor?: string;
  partyType?: string;
}

/**
 * Column definition for sortable/filterable tables
 */
export interface ColumnDef<T> {
  key: keyof T;
  header: string;
  width?: number;
  sortable?: boolean;
  filterable?: boolean;
  filterOptions?: string[];
  render?: (value: T[keyof T], row: T) => React.ReactNode;
}
