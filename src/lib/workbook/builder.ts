/**
 * Workbook Builder
 * Generates testing workbooks from attributes and sample data
 */

export interface Attribute {
  Attribute_ID: string;
  Attribute_Name: string;
  Category: string;
  Question_Text: string;
  IsRequired: string;
  Group: string;
}

export interface SampleItem {
  RecordID: string;
  EntityName: string;
  [key: string]: unknown;
}

export interface WorkbookRow {
  id: string;
  sampleItemId: string;
  entityName: string;
  attributeId: string;
  attributeName: string;
  questionText: string;
  result: "Pass" | "Fail" | "N/A" | "";
  observation: string;
  evidenceReference: string;
  auditorNotes: string;
  category: string;
  isRequired: boolean;
}

export interface WorkbookState {
  id: string;
  auditRunId: string;
  auditorId?: string;
  status: "draft" | "in_progress" | "completed" | "submitted";
  rows: WorkbookRow[];
  summary: WorkbookSummary;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
}

export interface WorkbookSummary {
  totalRows: number;
  completedRows: number;
  passCount: number;
  failCount: number;
  naCount: number;
  incompleteCount: number;
  exceptionsCount: number;
  completionPercentage: number;
}

// Standard observation types from VBA forms
export const STANDARD_OBSERVATIONS = [
  { id: "OBS001", text: "Documentation appears incomplete. Additional verification required." },
  { id: "OBS002", text: "Discrepancy noted between reported values and supporting documents." },
  { id: "OBS003", text: "Unable to verify information with provided documentation. Follow-up needed." },
  { id: "OBS004", text: "Additional clarification required from entity management." },
  { id: "OBS005", text: "Supporting evidence provided does not fully address the requirement." },
  { id: "OBS006", text: "Documentation quality is poor. Clearer evidence requested." },
  { id: "OBS007", text: "Information conflicts with prior period records. Needs reconciliation." },
  { id: "OBS008", text: "Third-party verification pending. Awaiting confirmation." },
  { id: "OBS009", text: "Entity provided partial information. Complete details required." },
  { id: "OBS010", text: "Documentation dated outside acceptable period. Updated records needed." },
];

export const RESULT_OPTIONS = ["Pass", "Fail", "N/A", ""];

// Generate workbook rows from attributes and sample
export function generateWorkbookRows(
  attributes: Attribute[],
  sample: SampleItem[],
  idColumn: string = "RecordID",
  nameColumn: string = "EntityName"
): WorkbookRow[] {
  const rows: WorkbookRow[] = [];
  let rowId = 1;

  for (const item of sample) {
    for (const attr of attributes) {
      rows.push({
        id: `ROW-${String(rowId++).padStart(5, "0")}`,
        sampleItemId: String(item[idColumn] || item.RecordID || `ITEM-${rowId}`),
        entityName: String(item[nameColumn] || item.EntityName || "Unknown"),
        attributeId: attr.Attribute_ID,
        attributeName: attr.Attribute_Name,
        questionText: attr.Question_Text,
        result: "",
        observation: "",
        evidenceReference: "",
        auditorNotes: "",
        category: attr.Category,
        isRequired: attr.IsRequired === "Y",
      });
    }
  }

  return rows;
}

// Calculate workbook summary
export function calculateWorkbookSummary(rows: WorkbookRow[]): WorkbookSummary {
  const totalRows = rows.length;
  const passCount = rows.filter((r) => r.result === "Pass").length;
  const failCount = rows.filter((r) => r.result === "Fail").length;
  const naCount = rows.filter((r) => r.result === "N/A").length;
  const completedRows = passCount + failCount + naCount;
  const incompleteCount = totalRows - completedRows;
  const exceptionsCount = failCount;
  const completionPercentage = totalRows > 0 ? (completedRows / totalRows) * 100 : 0;

  return {
    totalRows,
    completedRows,
    passCount,
    failCount,
    naCount,
    incompleteCount,
    exceptionsCount,
    completionPercentage,
  };
}

// Create initial workbook state
export function createWorkbookState(
  auditRunId: string,
  attributes: Attribute[],
  sample: SampleItem[],
  idColumn?: string,
  nameColumn?: string
): WorkbookState {
  const rows = generateWorkbookRows(
    attributes,
    sample,
    idColumn,
    nameColumn
  );

  return {
    id: `WB-${Date.now()}`,
    auditRunId,
    status: "draft",
    rows,
    summary: calculateWorkbookSummary(rows),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// Update workbook row
export function updateWorkbookRow(
  state: WorkbookState,
  rowId: string,
  updates: Partial<WorkbookRow>
): WorkbookState {
  const rows = state.rows.map((row) =>
    row.id === rowId ? { ...row, ...updates } : row
  );

  return {
    ...state,
    rows,
    summary: calculateWorkbookSummary(rows),
    status: state.status === "draft" ? "in_progress" : state.status,
    updatedAt: new Date().toISOString(),
  };
}

// Validate workbook for submission
export function validateWorkbook(state: WorkbookState): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check all required rows have results
  const requiredIncomplete = state.rows.filter(
    (r) => r.isRequired && r.result === ""
  );
  if (requiredIncomplete.length > 0) {
    errors.push(
      `${requiredIncomplete.length} required attribute(s) not tested`
    );
  }

  // Check all failures have observations
  const failsWithoutObs = state.rows.filter(
    (r) => r.result === "Fail" && !r.observation
  );
  if (failsWithoutObs.length > 0) {
    errors.push(
      `${failsWithoutObs.length} failure(s) missing observations`
    );
  }

  // Check completion threshold (e.g., 95%)
  if (state.summary.completionPercentage < 95) {
    errors.push(
      `Completion is ${state.summary.completionPercentage.toFixed(1)}% (minimum 95% required)`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Get mock attributes for demo
export function getMockAttributes(): Attribute[] {
  return [
    {
      Attribute_ID: "ATTR001",
      Attribute_Name: "Legal Name Verification",
      Category: "Entity Profile",
      Question_Text: "Is the legal name of the entity verified against official documentation?",
      IsRequired: "Y",
      Group: "Entity",
    },
    {
      Attribute_ID: "ATTR002",
      Attribute_Name: "Registration Number",
      Category: "Registration",
      Question_Text: "Is the business registration number documented and verified?",
      IsRequired: "Y",
      Group: "Entity",
    },
    {
      Attribute_ID: "ATTR003",
      Attribute_Name: "Principal Place of Business",
      Category: "Entity Profile",
      Question_Text: "Is the principal place of business address documented?",
      IsRequired: "Y",
      Group: "Entity",
    },
    {
      Attribute_ID: "ATTR004",
      Attribute_Name: "Beneficial Owner Identification",
      Category: "Ownership",
      Question_Text: "Have all beneficial owners with 25%+ ownership been identified?",
      IsRequired: "Y",
      Group: "Beneficial Owner",
    },
    {
      Attribute_ID: "ATTR005",
      Attribute_Name: "Beneficial Owner Verification",
      Category: "Ownership",
      Question_Text: "Have beneficial owner identities been verified against acceptable documents?",
      IsRequired: "Y",
      Group: "Beneficial Owner",
    },
    {
      Attribute_ID: "ATTR006",
      Attribute_Name: "PEP Screening",
      Category: "AML",
      Question_Text: "Has screening been performed for Politically Exposed Persons?",
      IsRequired: "Y",
      Group: "Screening",
    },
    {
      Attribute_ID: "ATTR007",
      Attribute_Name: "Sanctions Screening",
      Category: "AML",
      Question_Text: "Has sanctions screening been completed against OFAC and other lists?",
      IsRequired: "Y",
      Group: "Screening",
    },
    {
      Attribute_ID: "ATTR008",
      Attribute_Name: "Risk Assessment",
      Category: "Compliance",
      Question_Text: "Has an initial risk assessment been completed for the entity?",
      IsRequired: "Y",
      Group: "Entity",
    },
    {
      Attribute_ID: "ATTR009",
      Attribute_Name: "Source of Funds",
      Category: "EDD",
      Question_Text: "Is the source of funds for the relationship documented?",
      IsRequired: "N",
      Group: "Entity",
    },
    {
      Attribute_ID: "ATTR010",
      Attribute_Name: "Purpose of Account",
      Category: "Entity Profile",
      Question_Text: "Is the purpose of the account/relationship documented?",
      IsRequired: "Y",
      Group: "Entity",
    },
  ];
}

// Convert workbook to Handsontable data format
export function toHandsontableData(rows: WorkbookRow[]): (string | number | boolean)[][] {
  return rows.map((row) => [
    row.sampleItemId,
    row.entityName,
    row.attributeId,
    row.attributeName,
    row.questionText,
    row.result,
    row.observation,
    row.evidenceReference,
    row.auditorNotes,
  ]);
}

// Handsontable column configuration
export const HANDSONTABLE_COLUMNS = [
  { data: 0, title: "Sample ID", readOnly: true, width: 100 },
  { data: 1, title: "Entity Name", readOnly: true, width: 150 },
  { data: 2, title: "Attr ID", readOnly: true, width: 80 },
  { data: 3, title: "Attribute", readOnly: true, width: 180 },
  { data: 4, title: "Test Question", readOnly: true, width: 300 },
  {
    data: 5,
    title: "Result",
    type: "dropdown",
    source: RESULT_OPTIONS,
    width: 80,
  },
  {
    data: 6,
    title: "Observation",
    type: "dropdown",
    source: ["", ...STANDARD_OBSERVATIONS.map((o) => o.text)],
    width: 200,
  },
  { data: 7, title: "Evidence Ref", width: 120 },
  { data: 8, title: "Notes", width: 200 },
];
