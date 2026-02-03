import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface AIAnalysisResult {
  success: boolean;
  data?: unknown;
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export async function runAIAnalysis(
  systemPrompt: string,
  userPrompt: string,
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
): Promise<AIAnalysisResult> {
  const model = options?.model || "gpt-4-turbo-preview";
  const temperature = options?.temperature ?? 0.1;
  const maxTokens = options?.maxTokens || 4096;

  try {
    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature,
      max_tokens: maxTokens,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      return {
        success: false,
        error: "No response content from AI",
      };
    }

    // Parse the JSON response
    const data = JSON.parse(content);

    return {
      success: true,
      data,
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      },
    };
  } catch (error) {
    console.error("AI analysis error:", error);

    if (error instanceof SyntaxError) {
      return {
        success: false,
        error: "Failed to parse AI response as JSON",
      };
    }

    if (error instanceof OpenAI.APIError) {
      return {
        success: false,
        error: `OpenAI API error: ${error.message}`,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Mock response for demo when API key is not available
export function getMockGapAssessmentResult() {
  return {
    workbook: {
      title: "Gap Assessment — Global Financial Crime Standards vs CIP/CDD Procedures",
      generated_at: new Date().toISOString().split("T")[0],
      sheets: [
        {
          name: "Summary",
          rows: [
            { Metric: "Total Standard Requirements", Value: 25 },
            { Metric: "Meets", Value: 15 },
            { Metric: "Partially Meets", Value: 5 },
            { Metric: "Does Not Meet (Gaps)", Value: 3 },
            { Metric: "Conflicts", Value: 1 },
            { Metric: "Exceeds", Value: 1 },
            { Metric: "Out of Scope / N/A", Value: 0 },
          ],
        },
        {
          name: "Gap_Details",
          rows: [
            {
              Gap_ID: "GAP-0001",
              Disposition: "Does Not Meet",
              Severity: "High",
              Standard_Requirement_ID: "STD-CIPCDD-0012",
              Standard_Requirement_Text: "Beneficial ownership must be verified for all legal entity customers with 25% or more ownership",
              Procedure_Reference_ID: "CIPCDD-0005",
              Procedure_Text_Summary: "Procedures require BO collection but do not specify verification requirements",
              Gap_Description: "Procedures lack specific verification steps for beneficial ownership information",
              Impact_Rationale: "Without verification, BO information may be inaccurate, increasing BSA/AML risk",
              Testing_Implication: "Auditor cannot verify BO compliance without documented verification procedures",
              Recommended_Remediation: "Add explicit BO verification procedures including acceptable methods",
              Evidence_Expected: "BO verification checklist, supporting documentation, verification logs",
              Standard_Citation: "Global Standards > 3.CDD > B.Beneficial Ownership > Verification (para 2)",
              Procedure_Citation: "CIP/CDD Procedures > CIPCDD-0005 > BO Collection (para 1)",
              Source_Quote_A: "All beneficial owners must be verified using reliable methods",
              Source_Quote_B: "Collect beneficial ownership information for entities",
              Confidence: "High",
              Notes: "Critical gap requiring immediate remediation",
            },
            {
              Gap_ID: "GAP-0002",
              Disposition: "Partially Meets",
              Severity: "Medium",
              Standard_Requirement_ID: "STD-CIPCDD-0008",
              Standard_Requirement_Text: "Documentary verification must include government-issued ID with photo",
              Procedure_Reference_ID: "CIPCDD-0003",
              Procedure_Text_Summary: "Procedures allow various ID types but do not mandate photo requirement",
              Gap_Description: "Photo requirement for ID verification is not explicitly stated",
              Impact_Rationale: "May lead to acceptance of non-photo IDs for verification",
              Testing_Implication: "Sample testing may reveal inconsistent ID acceptance practices",
              Recommended_Remediation: "Update procedures to explicitly require photo ID for documentary verification",
              Evidence_Expected: "ID copies with photos, verification checklists",
              Standard_Citation: "Global Standards > 2.CIP > A.Verification > Documentary (para 3)",
              Procedure_Citation: "CIP/CDD Procedures > CIPCDD-0003 > ID Requirements (para 2)",
              Source_Quote_A: "Documentary verification requires government-issued photo ID",
              Source_Quote_B: "Accept valid government-issued identification documents",
              Confidence: "High",
              Notes: "Partial gap - procedures address ID but lack photo specification",
            },
            {
              Gap_ID: "GAP-0003",
              Disposition: "Does Not Meet",
              Severity: "Medium",
              Standard_Requirement_ID: "STD-CIPCDD-0015",
              Standard_Requirement_Text: "EDD procedures must include enhanced monitoring for high-risk customers",
              Procedure_Reference_ID: "N/A",
              Procedure_Text_Summary: "No EDD-specific monitoring procedures found",
              Gap_Description: "Procedures do not address enhanced monitoring requirements for EDD customers",
              Impact_Rationale: "High-risk customers may not receive appropriate ongoing oversight",
              Testing_Implication: "Cannot test EDD monitoring compliance without documented procedures",
              Recommended_Remediation: "Develop and document EDD monitoring procedures",
              Evidence_Expected: "EDD monitoring protocols, review frequency documentation",
              Standard_Citation: "Global Standards > 4.EDD > C.Monitoring > Enhanced Review (para 1)",
              Procedure_Citation: "NOT FOUND",
              Source_Quote_A: "High-risk customers require enhanced ongoing monitoring",
              Source_Quote_B: "",
              Confidence: "High",
              Notes: "Complete gap - no EDD monitoring procedures exist",
            },
          ],
        },
      ],
    },
  };
}

export function getMockAttributeExtractionResult() {
  return {
    workbook: {
      title: "CIP/CDD Onboarding — Attributes and Acceptable Documents",
      generated_at: new Date().toISOString().split("T")[0],
      sheets: [
        {
          name: "Attributes",
          rows: [
            {
              Source_File: "CIP_CDD_Procedures.docx",
              Attribute_ID: "A001",
              Attribute_Name: "Legal Entity Name",
              Category: "Entity Profile",
              Source: "CIP > Required Information > Entity Name",
              Source_Page: "para 5",
              Question_Text: "Verify that the legal entity name matches the formation documents and is correctly recorded in the system.",
              Notes: "Must match exactly as registered",
              Jurisdiction_ID: "ENT",
              RiskScope: "Base",
              IsRequired: "Y",
              DocumentationAgeRule: "",
              Group: "Entity",
            },
            {
              Source_File: "CIP_CDD_Procedures.docx",
              Attribute_ID: "A002",
              Attribute_Name: "Tax Identification Number",
              Category: "Entity Profile",
              Source: "CIP > Required Information > TIN",
              Source_Page: "para 7",
              Question_Text: "Confirm that a valid Tax Identification Number (EIN/TIN) has been obtained and verified.",
              Notes: "Required for US entities",
              Jurisdiction_ID: "ENT",
              RiskScope: "Base",
              IsRequired: "Y",
              DocumentationAgeRule: "",
              Group: "Entity",
            },
            {
              Source_File: "CIP_CDD_Procedures.docx",
              Attribute_ID: "A003",
              Attribute_Name: "Registered Address",
              Category: "Entity Profile",
              Source: "CIP > Required Information > Address",
              Source_Page: "para 8",
              Question_Text: "Verify that the registered business address is documented and matches official records.",
              Notes: "PO Box not acceptable as primary address",
              Jurisdiction_ID: "ENT",
              RiskScope: "Base",
              IsRequired: "Y",
              DocumentationAgeRule: "365",
              Group: "Entity",
            },
            {
              Source_File: "CIP_CDD_Procedures.docx",
              Attribute_ID: "A004",
              Attribute_Name: "Formation Documents",
              Category: "Documentation",
              Source: "CIP > Documentary Verification > Formation",
              Source_Page: "para 12",
              Question_Text: "Obtain and verify formation documents (Articles of Incorporation, Certificate of Formation, or equivalent).",
              Notes: "Must be certified or apostilled for foreign entities",
              Jurisdiction_ID: "ENT",
              RiskScope: "Base",
              IsRequired: "Y",
              DocumentationAgeRule: "",
              Group: "Entity",
            },
            {
              Source_File: "CIP_CDD_Procedures.docx",
              Attribute_ID: "A005",
              Attribute_Name: "Beneficial Owners (≥25%)",
              Category: "Ownership",
              Source: "CDD > Beneficial Ownership > Collection",
              Source_Page: "para 18",
              Question_Text: "Verify that all beneficial owners with 25% or greater ownership interest have been identified and documented.",
              Notes: "Include indirect ownership through intermediaries",
              Jurisdiction_ID: "ENT",
              RiskScope: "Base",
              IsRequired: "Y",
              DocumentationAgeRule: "",
              Group: "Beneficial Owner",
            },
            {
              Source_File: "CIP_CDD_Procedures.docx",
              Attribute_ID: "A006",
              Attribute_Name: "BO Identity Verification",
              Category: "Ownership",
              Source: "CDD > Beneficial Ownership > Verification",
              Source_Page: "para 20",
              Question_Text: "Confirm that identity verification has been completed for each beneficial owner using acceptable methods.",
              Notes: "Documentary or non-documentary methods acceptable",
              Jurisdiction_ID: "ENT",
              RiskScope: "Base",
              IsRequired: "Y",
              DocumentationAgeRule: "",
              Group: "Beneficial Owner",
            },
            {
              Source_File: "CIP_CDD_Procedures.docx",
              Attribute_ID: "A007",
              Attribute_Name: "Controlling Person",
              Category: "Ownership",
              Source: "CDD > Control Prong > Identification",
              Source_Page: "para 22",
              Question_Text: "Verify that the individual with significant control (control prong) has been identified if no 25% owner exists.",
              Notes: "Required when no individual meets 25% threshold",
              Jurisdiction_ID: "ENT",
              RiskScope: "Base",
              IsRequired: "Y",
              DocumentationAgeRule: "",
              Group: "Beneficial Owner",
            },
            {
              Source_File: "CIP_CDD_Procedures.docx",
              Attribute_ID: "A008",
              Attribute_Name: "Sanctions Screening",
              Category: "AML",
              Source: "AML > Screening > OFAC",
              Source_Page: "para 30",
              Question_Text: "Confirm that sanctions screening (OFAC) was performed at onboarding for the entity and all related parties.",
              Notes: "Must screen entity, BOs, and authorized signers",
              Jurisdiction_ID: "ENT",
              RiskScope: "Base",
              IsRequired: "Y",
              DocumentationAgeRule: "",
              Group: "Screening",
            },
            {
              Source_File: "CIP_CDD_Procedures.docx",
              Attribute_ID: "A009",
              Attribute_Name: "PEP Screening",
              Category: "AML",
              Source: "AML > Screening > PEP",
              Source_Page: "para 32",
              Question_Text: "Verify that Politically Exposed Person (PEP) screening was completed for beneficial owners and controlling persons.",
              Notes: "Include domestic and foreign PEPs",
              Jurisdiction_ID: "ENT",
              RiskScope: "Base",
              IsRequired: "Y",
              DocumentationAgeRule: "",
              Group: "Screening",
            },
            {
              Source_File: "CIP_CDD_Procedures.docx",
              Attribute_ID: "A010",
              Attribute_Name: "Adverse Media Screening",
              Category: "AML",
              Source: "AML > Screening > Adverse Media",
              Source_Page: "para 34",
              Question_Text: "Confirm that adverse media screening was performed at onboarding.",
              Notes: "EDD triggers may require enhanced screening",
              Jurisdiction_ID: "ENT",
              RiskScope: "Both",
              IsRequired: "Y",
              DocumentationAgeRule: "",
              Group: "Screening",
            },
          ],
        },
        {
          name: "Acceptable_Docs",
          rows: [
            {
              Source_File: "CIP_CDD_Procedures.docx",
              Attribute_ID: "A001",
              Document_Name: "Certificate of Incorporation",
              Evidence_Source_Document: "Certificate of Incorporation",
              Jurisdiction_ID: "ENT",
              Notes: "Certified copy required",
            },
            {
              Source_File: "CIP_CDD_Procedures.docx",
              Attribute_ID: "A001",
              Document_Name: "Articles of Organization",
              Evidence_Source_Document: "Articles of Organization",
              Jurisdiction_ID: "ENT",
              Notes: "For LLCs",
            },
            {
              Source_File: "CIP_CDD_Procedures.docx",
              Attribute_ID: "A002",
              Document_Name: "IRS Letter 147C",
              Evidence_Source_Document: "IRS Confirmation Letter",
              Jurisdiction_ID: "ENT",
              Notes: "Confirms EIN assignment",
            },
            {
              Source_File: "CIP_CDD_Procedures.docx",
              Attribute_ID: "A002",
              Document_Name: "W-9 Form",
              Evidence_Source_Document: "W-9",
              Jurisdiction_ID: "ENT",
              Notes: "Signed and dated",
            },
            {
              Source_File: "CIP_CDD_Procedures.docx",
              Attribute_ID: "A003",
              Document_Name: "Utility Bill",
              Evidence_Source_Document: "Utility Bill",
              Jurisdiction_ID: "ENT",
              Notes: "Within 90 days",
            },
            {
              Source_File: "CIP_CDD_Procedures.docx",
              Attribute_ID: "A003",
              Document_Name: "Bank Statement",
              Evidence_Source_Document: "Bank Statement",
              Jurisdiction_ID: "ENT",
              Notes: "Within 90 days, shows address",
            },
            {
              Source_File: "CIP_CDD_Procedures.docx",
              Attribute_ID: "A006",
              Document_Name: "Passport Copy",
              Evidence_Source_Document: "Passport",
              Jurisdiction_ID: "ENT",
              Notes: "Unexpired, government-issued photo ID",
            },
            {
              Source_File: "CIP_CDD_Procedures.docx",
              Attribute_ID: "A006",
              Document_Name: "Driver's License",
              Evidence_Source_Document: "Driver's License",
              Jurisdiction_ID: "ENT",
              Notes: "Unexpired, state-issued",
            },
          ],
        },
      ],
    },
  };
}
