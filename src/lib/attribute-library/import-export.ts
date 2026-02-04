/**
 * Import/Export Utilities for Attribute Library
 * Handles parsing and exporting of Excel/CSV files for attributes, docs, and sampling
 */

import * as XLSX from "xlsx";
import type {
  Attribute,
  AcceptableDoc,
  GenerationReviewRow,
  SamplingConfig,
} from "./types";

/**
 * Parse an attributes file (Excel or CSV)
 * Expects columns matching the Attribute interface
 */
export async function parseAttributesFile(file: File): Promise<Attribute[]> {
  const data = await readFileAsArrayBuffer(file);
  const workbook = XLSX.read(data, { type: "array" });

  // Try to find Attributes sheet, or use first sheet
  const sheetName =
    workbook.SheetNames.find(
      (name) => name.toLowerCase().includes("attribute") && !name.toLowerCase().includes("acceptable")
    ) || workbook.SheetNames[0];

  const sheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

  return jsonData.map((row) => normalizeAttribute(row));
}

/**
 * Parse acceptable docs file (Excel or CSV)
 * Expects columns matching the AcceptableDoc interface
 */
export async function parseAcceptableDocsFile(file: File): Promise<AcceptableDoc[]> {
  const data = await readFileAsArrayBuffer(file);
  const workbook = XLSX.read(data, { type: "array" });

  // Try to find Acceptable Docs sheet, or use first sheet
  const sheetName =
    workbook.SheetNames.find(
      (name) => name.toLowerCase().includes("acceptable") || name.toLowerCase().includes("doc")
    ) || workbook.SheetNames[0];

  const sheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

  return jsonData.map((row) => normalizeAcceptableDoc(row));
}

/**
 * Parse a combined attributes and docs file
 * Supports workbooks with multiple sheets
 */
export async function parseAttributesAndDocsFile(
  file: File
): Promise<{ attributes: Attribute[]; acceptableDocs: AcceptableDoc[] }> {
  const data = await readFileAsArrayBuffer(file);
  const workbook = XLSX.read(data, { type: "array" });

  let attributes: Attribute[] = [];
  let acceptableDocs: AcceptableDoc[] = [];

  // Look for Attributes sheet
  const attributesSheetName = workbook.SheetNames.find(
    (name) =>
      name.toLowerCase() === "attributes" ||
      (name.toLowerCase().includes("attribute") && !name.toLowerCase().includes("acceptable"))
  );

  if (attributesSheetName) {
    const sheet = workbook.Sheets[attributesSheetName];
    const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
    attributes = jsonData.map((row) => normalizeAttribute(row));
  }

  // Look for Acceptable Docs sheet
  const docsSheetName = workbook.SheetNames.find(
    (name) =>
      name.toLowerCase() === "acceptable docs" ||
      name.toLowerCase().includes("acceptable") ||
      name.toLowerCase() === "docs"
  );

  if (docsSheetName) {
    const sheet = workbook.Sheets[docsSheetName];
    const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
    acceptableDocs = jsonData.map((row) => normalizeAcceptableDoc(row));
  }

  // If no specific sheets found, try to parse first sheet as attributes
  if (attributes.length === 0 && workbook.SheetNames.length > 0) {
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
    attributes = jsonData.map((row) => normalizeAttribute(row));
  }

  return { attributes, acceptableDocs };
}

/**
 * Parse sampling results file
 * Returns raw records that can be used to populate generation review
 */
export async function parseSamplingFile(file: File): Promise<SamplingRecord[]> {
  const data = await readFileAsArrayBuffer(file);
  const workbook = XLSX.read(data, { type: "array" });

  // Try to find Sampling or Sample sheet
  const sheetName =
    workbook.SheetNames.find(
      (name) =>
        name.toLowerCase().includes("sampling") ||
        name.toLowerCase().includes("sample") ||
        name.toLowerCase().includes("population")
    ) || workbook.SheetNames[0];

  const sheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

  return jsonData.map((row, index) => normalizeSamplingRecord(row, index + 1));
}

/**
 * Export data to Excel workbook
 */
export function exportToExcel(
  data: Record<string, unknown>[],
  sheetName: string,
  filename?: string
): Blob {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Auto-size columns
  const colWidths = calculateColumnWidths(data);
  worksheet["!cols"] = colWidths;

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  return new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

/**
 * Export multiple sheets to Excel workbook
 */
export function exportMultiSheetExcel(
  sheets: { name: string; data: Record<string, unknown>[] }[]
): Blob {
  const workbook = XLSX.utils.book_new();

  for (const sheet of sheets) {
    const worksheet = XLSX.utils.json_to_sheet(sheet.data);
    const colWidths = calculateColumnWidths(sheet.data);
    worksheet["!cols"] = colWidths;
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
  }

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  return new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

/**
 * Download blob as file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Types

export interface SamplingRecord {
  Sampling_Index: number;
  GCI: string;
  Legal_Name: string;
  Jurisdiction_ID: string;
  Jurisdiction?: string;
  Party_Type: string;
  IRR: number;
  DRR: number;
  KYC_Date: string;
  Primary_FLU: string;
  [key: string]: unknown;
}

// Helper functions

async function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result instanceof ArrayBuffer) {
        resolve(e.target.result);
      } else {
        reject(new Error("Failed to read file as ArrayBuffer"));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

function normalizeAttribute(row: Record<string, unknown>): Attribute {
  return {
    Source_File: String(row.Source_File || row.SourceFile || row.source_file || ""),
    Attribute_ID: String(row.Attribute_ID || row.AttributeID || row.attribute_id || row.ID || ""),
    Attribute_Name: String(
      row.Attribute_Name || row.AttributeName || row.attribute_name || row.Name || ""
    ),
    Category: String(row.Category || row.category || ""),
    Source: String(row.Source || row.source || ""),
    Source_Page: String(row.Source_Page || row.SourcePage || row.source_page || ""),
    Question_Text: String(
      row.Question_Text || row.QuestionText || row.question_text || row.Question || ""
    ),
    Notes: String(row.Notes || row.notes || ""),
    Jurisdiction_ID: String(
      row.Jurisdiction_ID || row.JurisdictionID || row.jurisdiction_id || row.Jurisdiction || "ENT"
    ),
    RiskScope: normalizeRiskScope(row.RiskScope || row.Risk_Scope || row.risk_scope),
    IsRequired: normalizeYesNo(row.IsRequired || row.Is_Required || row.is_required || row.Required),
    DocumentationAgeRule: String(
      row.DocumentationAgeRule || row.Documentation_Age_Rule || row.documentation_age_rule || ""
    ),
    Group: String(row.Group || row.group || ""),
  };
}

function normalizeAcceptableDoc(row: Record<string, unknown>): AcceptableDoc {
  return {
    Source_File: String(row.Source_File || row.SourceFile || row.source_file || ""),
    Attribute_ID: String(row.Attribute_ID || row.AttributeID || row.attribute_id || ""),
    Document_Name: String(
      row.Document_Name || row.DocumentName || row.document_name || row.Name || ""
    ),
    Evidence_Source_Document: String(
      row.Evidence_Source_Document ||
        row.EvidenceSourceDocument ||
        row.evidence_source_document ||
        row.Source ||
        ""
    ),
    Jurisdiction_ID: String(
      row.Jurisdiction_ID || row.JurisdictionID || row.jurisdiction_id || "ENT"
    ),
    Notes: String(row.Notes || row.notes || ""),
  };
}

function normalizeSamplingRecord(
  row: Record<string, unknown>,
  defaultIndex: number
): SamplingRecord {
  return {
    Sampling_Index: Number(row.Sampling_Index || row.SamplingIndex || row.Index || defaultIndex),
    GCI: String(row.GCI || row.gci || row.RecordID || row.Record_ID || row.ID || ""),
    Legal_Name: String(
      row.Legal_Name || row.LegalName || row.legal_name || row.EntityName || row.Name || ""
    ),
    Jurisdiction_ID: String(
      row.Jurisdiction_ID || row.JurisdictionID || row.jurisdiction_id || row.Jurisdiction || ""
    ),
    Jurisdiction: String(row.Jurisdiction || row.jurisdiction || ""),
    Party_Type: String(row.Party_Type || row.PartyType || row.party_type || row.Type || ""),
    IRR: Number(row.IRR || row.irr || row.InherentRiskRating || 0),
    DRR: Number(row.DRR || row.drr || row.DynamicRiskRating || 0),
    KYC_Date: normalizeDate(row.KYC_Date || row.KYCDate || row.kyc_date || row.Date),
    Primary_FLU: String(row.Primary_FLU || row.PrimaryFLU || row.primary_flu || row.FLU || ""),
    ...row, // Preserve any additional fields
  };
}

function normalizeRiskScope(value: unknown): "Base" | "EDD" | "Both" {
  const str = String(value || "Base").toLowerCase();
  if (str === "edd") return "EDD";
  if (str === "both") return "Both";
  return "Base";
}

function normalizeYesNo(value: unknown): "Y" | "N" {
  const str = String(value || "N").toLowerCase();
  if (str === "y" || str === "yes" || str === "true" || str === "1") return "Y";
  return "N";
}

function normalizeDate(value: unknown): string {
  if (!value) return "";

  // If it's a number (Excel serial date), convert it
  if (typeof value === "number") {
    const date = XLSX.SSF.parse_date_code(value);
    return `${date.y}-${String(date.m).padStart(2, "0")}-${String(date.d).padStart(2, "0")}`;
  }

  // If it's already a string, try to parse and format it
  const str = String(value);
  try {
    const date = new Date(str);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split("T")[0];
    }
  } catch {
    // Return as-is if parsing fails
  }

  return str;
}

function calculateColumnWidths(
  data: Record<string, unknown>[]
): { wch: number }[] {
  if (data.length === 0) return [];

  const keys = Object.keys(data[0]);
  return keys.map((key) => {
    const maxLength = Math.max(
      key.length,
      ...data.map((row) => String(row[key] || "").length)
    );
    return { wch: Math.min(Math.max(maxLength + 2, 10), 50) };
  });
}
