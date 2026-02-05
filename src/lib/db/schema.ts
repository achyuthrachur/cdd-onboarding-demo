import { pgTable, uuid, text, timestamp, json, integer, pgEnum } from 'drizzle-orm/pg-core';

// Enums
export const auditRunStatusEnum = pgEnum('audit_run_status', ['draft', 'in_progress', 'completed', 'archived']);
export const documentTypeEnum = pgEnum('document_type', ['global_std_old', 'global_std_new', 'flu_global', 'flu_jurisdiction']);
export const comparisonTypeEnum = pgEnum('comparison_type', ['std_vs_std', 'std_vs_flu']);
export const samplingMethodEnum = pgEnum('sampling_method', ['random', 'stratified', 'systematic', 'mus']);
export const workbookStatusEnum = pgEnum('workbook_status', ['draft', 'in_progress', 'submitted', 'approved']);

// Audit Runs - Root entity
export const auditRuns = pgTable('audit_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  status: auditRunStatusEnum('status').default('draft').notNull(),
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  scenarioId: text('scenario_id'),
  scope: json('scope').$type<{
    jurisdictions?: string[];
    auditPeriodStart?: string;
    auditPeriodEnd?: string;
    description?: string;
  }>(),
});

// Documents - Uploaded files
export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  auditRunId: uuid('audit_run_id').references(() => auditRuns.id, { onDelete: 'cascade' }).notNull(),
  docType: documentTypeEnum('doc_type').notNull(),
  jurisdiction: text('jurisdiction'),
  fileName: text('file_name').notNull(),
  fileUrl: text('file_url').notNull(),
  fileHash: text('file_hash'),
  uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
});

// Stage 1 Results - Gap assessment & attribute extraction
export const stage1Results = pgTable('stage1_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  auditRunId: uuid('audit_run_id').references(() => auditRuns.id, { onDelete: 'cascade' }).notNull(),
  jurisdiction: text('jurisdiction'),
  comparisonType: comparisonTypeEnum('comparison_type').notNull(),
  gapsJson: json('gaps_json').$type<{
    summary?: Record<string, number>;
    gaps?: Array<{
      gapId: string;
      disposition: string;
      severity: string;
      standardRequirementId: string;
      standardRequirementText: string;
      procedureReferenceId: string;
      procedureTextSummary: string;
      gapDescription: string;
      impactRationale: string;
      testingImplication: string;
      recommendedRemediation: string;
      evidenceExpected: string;
      standardCitation: string;
      procedureCitation: string;
      sourceQuoteA: string;
      sourceQuoteB: string;
      confidence: string;
      notes: string;
    }>;
  }>(),
  attributesJson: json('attributes_json').$type<{
    attributes?: Array<{
      attributeId: string;
      attributeName: string;
      category: string;
      source: string;
      sourcePage: string;
      questionText: string;
      notes: string;
      jurisdictionId: string;
      riskScope: string;
      isRequired: string;
      documentationAgeRule: string;
      group: string;
    }>;
    acceptableDocs?: Array<{
      attributeId: string;
      documentName: string;
      evidenceSourceDocument: string;
      jurisdictionId: string;
      notes: string;
    }>;
  }>(),
  notes: text('notes'),
  version: integer('version').default(1).notNull(),
  status: text('status').default('pending').$type<'pending' | 'approved' | 'rejected'>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Population Files - Uploaded population data
export const populationFiles = pgTable('population_files', {
  id: uuid('id').primaryKey().defaultRandom(),
  auditRunId: uuid('audit_run_id').references(() => auditRuns.id, { onDelete: 'cascade' }).notNull(),
  fileName: text('file_name').notNull(),
  fileUrl: text('file_url').notNull(),
  fileHash: text('file_hash'),
  schemaJson: json('schema_json').$type<{
    columns: Array<{
      name: string;
      type: string;
      sampleValues?: string[];
    }>;
    rowCount: number;
  }>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Samples - Sampling configuration and results
export const samples = pgTable('samples', {
  id: uuid('id').primaryKey().defaultRandom(),
  auditRunId: uuid('audit_run_id').references(() => auditRuns.id, { onDelete: 'cascade' }).notNull(),
  populationFileId: uuid('population_file_id').references(() => populationFiles.id),
  method: samplingMethodEnum('method').notNull(),
  configJson: json('config_json').$type<{
    confidenceLevel?: number;
    marginOfError?: number;
    expectedErrorRate?: number;
    sampleSize?: number;
    seed?: number;
    strataColumn?: string;
    idColumn?: string;
    exclusionFilters?: Array<{
      column: string;
      operator: string;
      value: string;
    }>;
  }>(),
  seed: integer('seed'),
  sampleItemsJson: json('sample_items_json').$type<{
    items: Array<Record<string, unknown>>;
    strata?: Array<{
      name: string;
      populationCount: number;
      sampleCount: number;
    }>;
  }>(),
  lockedAt: timestamp('locked_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Workbooks - Spreadsheet state
export const workbooks = pgTable('workbooks', {
  id: uuid('id').primaryKey().defaultRandom(),
  auditRunId: uuid('audit_run_id').references(() => auditRuns.id, { onDelete: 'cascade' }).notNull(),
  sampleId: uuid('sample_id').references(() => samples.id),
  auditorId: text('auditor_id'),
  auditorName: text('auditor_name'),
  auditorEmail: text('auditor_email'),
  status: workbookStatusEnum('status').default('draft').notNull(),
  templateVersion: text('template_version').default('1.0'),
  handsontableStateJson: json('handsontable_state_json').$type<{
    sheets: Array<{
      name: string;
      data: unknown[][];
      colHeaders?: string[];
      columns?: Array<{
        type?: string;
        source?: string[];
        readOnly?: boolean;
      }>;
    }>;
  }>(),
  // Pivoted workbook structure (rows=attributes, columns=customers)
  pivotedDataJson: json('pivoted_data_json').$type<{
    assignedCustomers: Array<{
      customerId: string;
      customerName: string;
      jurisdiction: string;
      irr: string;
      drr: string;
      partyType: string;
      kycDate: string;
      primaryFlu: string;
      samplingIndex: number;
    }>;
    rows: Array<{
      id: string;
      attributeId: string;
      attributeCategory: string;
      questionText: string;
      attributeName?: string;
      sourceFile?: string;
      source?: string;
      sourcePage?: string;
      group?: string;
      customerResults: Record<string, {
        customerId: string;
        customerName: string;
        result: string;
        observation: string;
      }>;
    }>;
    attributes: Array<{
      attributeId: string;
      attributeName: string;
      attributeCategory: string;
      questionText: string;
    }>;
  }>(),
  exportXlsxUrl: text('export_xlsx_url'),
  // Publishing fields
  publishedAt: timestamp('published_at'),
  publishedBy: text('published_by'),
  completionPercentage: integer('completion_percentage').default(0),
  lastActivityAt: timestamp('last_activity_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  submittedAt: timestamp('submitted_at'),
});

// Workbook Rows - Normalized row data for analytics (optional)
export const workbookRows = pgTable('workbook_rows', {
  id: uuid('id').primaryKey().defaultRandom(),
  workbookId: uuid('workbook_id').references(() => workbooks.id, { onDelete: 'cascade' }).notNull(),
  sampleItemId: text('sample_item_id'),
  attributeId: text('attribute_id'),
  fieldsJson: json('fields_json').$type<{
    result?: 'pass' | 'fail' | 'n/a';
    observation?: string;
    evidenceReference?: string;
    auditorNotes?: string;
  }>(),
  status: text('status').default('pending').$type<'pending' | 'completed'>(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Consolidations - Aggregated results
export const consolidations = pgTable('consolidations', {
  id: uuid('id').primaryKey().defaultRandom(),
  auditRunId: uuid('audit_run_id').references(() => auditRuns.id, { onDelete: 'cascade' }).notNull(),
  resultsJson: json('results_json').$type<{
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
    exceptions: Array<{
      sampleItemId: string;
      attributeId: string;
      observation: string;
      evidenceReference: string;
    }>;
  }>(),
  metricsJson: json('metrics_json').$type<{
    totalTested: number;
    passCount: number;
    failCount: number;
    naCount: number;
    overallPassRate: number;
    exceptionCount: number;
    completionRate: number;
  }>(),
  generatedAt: timestamp('generated_at').defaultNow().notNull(),
});

// Reports - Generated artifacts
export const reports = pgTable('reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  auditRunId: uuid('audit_run_id').references(() => auditRuns.id, { onDelete: 'cascade' }).notNull(),
  consolidationId: uuid('consolidation_id').references(() => consolidations.id),
  reportPdfUrl: text('report_pdf_url'),
  supportingXlsxUrl: text('supporting_xlsx_url'),
  title: text('title'),
  generatedBy: text('generated_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Type exports for use in the application
export type AuditRun = typeof auditRuns.$inferSelect;
export type NewAuditRun = typeof auditRuns.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
export type Stage1Result = typeof stage1Results.$inferSelect;
export type NewStage1Result = typeof stage1Results.$inferInsert;
export type PopulationFile = typeof populationFiles.$inferSelect;
export type NewPopulationFile = typeof populationFiles.$inferInsert;
export type Sample = typeof samples.$inferSelect;
export type NewSample = typeof samples.$inferInsert;
export type Workbook = typeof workbooks.$inferSelect;
export type NewWorkbook = typeof workbooks.$inferInsert;
export type WorkbookRow = typeof workbookRows.$inferSelect;
export type NewWorkbookRow = typeof workbookRows.$inferInsert;
export type Consolidation = typeof consolidations.$inferSelect;
export type NewConsolidation = typeof consolidations.$inferInsert;
export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;
