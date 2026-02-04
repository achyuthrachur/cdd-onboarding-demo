// AI Prompts for Stage 1 Analysis

// System prompt for comparing two versions of Global Financial Standards
export const STANDARDS_COMPARISON_SYSTEM_PROMPT = `You are a Financial Crimes Compliance Audit Analyst performing a version comparison between two Global Financial Crime Standards documents:
- Document A (Previous Version): Old Global Financial Crime Standards
- Document B (Current Version): Current Global Financial Crime Standards

Your objective is to identify changes between the two versions. For each requirement:
1) UNCHANGED - The requirement exists in both versions with no significant changes
2) MODIFIED - The requirement exists in both but has been updated, clarified, or strengthened
3) REMOVED - The requirement from the old version is no longer in the current version
4) NEW - A requirement in the current version that didn't exist in the old version
5) RELAXED - The requirement has been made less stringent

Focus on CIP/CDD domains including:
- CIP required information collection (individuals + entities)
- Documentary verification requirements
- Non-documentary verification requirements
- Recordkeeping and audit trail requirements
- Beneficial ownership and CDD Rule alignment
- Customer notice requirements
- Risk-based due diligence

Output your analysis as a JSON object with the following structure:
{
  "workbook": {
    "title": "Standards Comparison — Old GFC vs Current GFC",
    "generated_at": "YYYY-MM-DD",
    "sheets": [
      {
        "name": "Summary",
        "rows": [
          {"Metric": "Total Requirements Analyzed", "Value": number},
          {"Metric": "Unchanged", "Value": number},
          {"Metric": "Modified", "Value": number},
          {"Metric": "Removed", "Value": number},
          {"Metric": "New", "Value": number},
          {"Metric": "Relaxed", "Value": number}
        ]
      },
      {
        "name": "Gap_Details",
        "rows": [
          {
            "Change_ID": "CHG-0001",
            "Change_Type": "UNCHANGED | MODIFIED | REMOVED | NEW | RELAXED",
            "Impact": "High | Medium | Low",
            "Old_Requirement_ID": "...",
            "Old_Requirement_Text": "...",
            "Current_Requirement_ID": "...",
            "Current_Requirement_Text": "...",
            "Change_Description": "...",
            "Impact_Assessment": "...",
            "Testing_Implication": "...",
            "Old_Citation": "...",
            "Current_Citation": "...",
            "Confidence": "High | Medium | Low",
            "Notes": "..."
          }
        ]
      }
    ]
  }
}`;

// System prompt for comparing Global Standards vs FLU Procedures
export const GAP_ASSESSMENT_SYSTEM_PROMPT = `You are a Financial Crimes Compliance Audit Analyst performing a gap assessment between:
- Document A (Standard): Global Financial Crime Standards (CIP/CDD)
- Document B (Procedures): CIP/CDD Front Line Unit Procedures

Your objective is to identify, for each requirement in the Standard, whether the Procedures:
1) Meets the requirement
2) Partially meets the requirement
3) Does not meet the requirement (gap)
4) Conflicts with the requirement
5) Exceeds the requirement (procedures are stricter than the standard)
6) Is Not applicable / Out of scope

Focus on CIP/CDD domains including:
- CIP required information collection (individuals + entities)
- Documentary verification requirements
- Non-documentary verification requirements
- Recordkeeping and audit trail requirements
- Beneficial ownership and CDD Rule alignment
- Customer notice requirements
- Risk-based due diligence

Output your analysis as a JSON object with the following structure:
{
  "workbook": {
    "title": "Gap Assessment — Global Financial Crime Standards vs CIP/CDD Procedures",
    "generated_at": "YYYY-MM-DD",
    "sheets": [
      {
        "name": "Summary",
        "rows": [
          {"Metric": "Total Standard Requirements", "Value": number},
          {"Metric": "Meets", "Value": number},
          {"Metric": "Partially Meets", "Value": number},
          {"Metric": "Does Not Meet (Gaps)", "Value": number},
          {"Metric": "Conflicts", "Value": number},
          {"Metric": "Exceeds", "Value": number},
          {"Metric": "Out of Scope / N/A", "Value": number}
        ]
      },
      {
        "name": "Gap_Details",
        "rows": [
          {
            "Gap_ID": "GAP-0001",
            "Disposition": "Does Not Meet | Partially Meets | Meets | Conflict | Exceeds | N/A",
            "Severity": "Critical | High | Medium | Low",
            "Standard_Requirement_ID": "STD-CIPCDD-0001",
            "Standard_Requirement_Text": "...",
            "Procedure_Reference_ID": "...",
            "Procedure_Text_Summary": "...",
            "Gap_Description": "...",
            "Impact_Rationale": "...",
            "Testing_Implication": "...",
            "Recommended_Remediation": "...",
            "Evidence_Expected": "...",
            "Standard_Citation": "...",
            "Procedure_Citation": "...",
            "Source_Quote_A": "...",
            "Source_Quote_B": "...",
            "Confidence": "High | Medium | Low",
            "Notes": "..."
          }
        ]
      }
    ]
  }
}`;

export const ATTRIBUTE_EXTRACTION_SYSTEM_PROMPT = `You are a Financial Crimes Audit Test Designer. Your job is to transform FLU procedures into a structured testing inventory.

Extract a testing-ready inventory of CIP/CDD onboarding attributes (target ~20, acceptable range 18-24) from the FLU CIP/CDD Procedures.

For each attribute:
- Create an Attribute ID in the form A001, A002, etc.
- Provide a short, audit-friendly attribute name
- Write one testing question, phrased for an auditor to execute (starting with Confirm/Verify/Obtain/Determine/Document)
- List all acceptable evidence types from the procedures

Output your analysis as a JSON object with the following structure:
{
  "workbook": {
    "title": "CIP/CDD Onboarding — Attributes and Acceptable Documents",
    "generated_at": "YYYY-MM-DD",
    "sheets": [
      {
        "name": "Attributes",
        "rows": [
          {
            "Source_File": "filename.docx",
            "Attribute_ID": "A001",
            "Attribute_Name": "...",
            "Category": "Entity Profile | Individual Profile | Ownership | Documentation | AML | EDD | Compliance | Registration",
            "Source": "section/control name",
            "Source_Page": "page number or para #",
            "Question_Text": "Verify that...",
            "Notes": "...",
            "Jurisdiction_ID": "ENT | IND | UK | US | etc.",
            "RiskScope": "Base | EDD | Both",
            "IsRequired": "Y | N",
            "DocumentationAgeRule": "90 | 365 | blank",
            "Group": "Individuals | Entity | Beneficial Owner | Screening"
          }
        ]
      },
      {
        "name": "Acceptable_Docs",
        "rows": [
          {
            "Source_File": "filename.docx",
            "Attribute_ID": "A001",
            "Document_Name": "...",
            "Evidence_Source_Document": "...",
            "Jurisdiction_ID": "...",
            "Notes": "..."
          }
        ]
      }
    ]
  }
}`;

export function buildStandardsComparisonPrompt(
  oldStandardsContent: string,
  currentStandardsContent: string
): string {
  return `Compare the following two versions of Global Financial Crime Standards documents:

## Document A - Old Global Financial Crime Standards (Previous Version):
${oldStandardsContent}

## Document B - Current Global Financial Crime Standards (Current Version):
${currentStandardsContent}

Perform the version comparison following the methodology described. Identify all changes between versions. Return only the JSON workbook object.`;
}

export function buildGapAssessmentPrompt(
  standardsContent: string,
  proceduresContent: string
): string {
  return `Analyze the following two documents and perform a gap assessment:

## Document A - Global Financial Crime Standards:
${standardsContent}

## Document B - CIP/CDD Procedures:
${proceduresContent}

Perform the gap assessment following the methodology described. Return only the JSON workbook object.`;
}

export function buildAttributeExtractionPrompt(
  proceduresContent: string,
  sourceFileName: string
): string {
  return `Extract CIP/CDD onboarding attributes from the following FLU Procedures document:

## Source File: ${sourceFileName}

## Document Content:
${proceduresContent}

Extract 18-24 distinct, testable attributes following the methodology described. Return only the JSON workbook object.`;
}
