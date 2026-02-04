import OpenAI from "openai";

// Lazy-initialized OpenAI client (only created when needed)
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

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
    const openai = getOpenAIClient();
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

// Mock response for Standards Comparison (Old GFC vs New GFC)
export function getMockStandardsComparisonResult() {
  return {
    workbook: {
      title: "Standards Comparison — Old GFC vs Current GFC",
      generated_at: new Date().toISOString().split("T")[0],
      sheets: [
        {
          name: "Summary",
          rows: [
            { Metric: "Total Requirements Analyzed", Value: 30 },
            { Metric: "Unchanged", Value: 18 },
            { Metric: "Modified", Value: 7 },
            { Metric: "Removed", Value: 2 },
            { Metric: "New", Value: 3 },
            { Metric: "Relaxed", Value: 0 },
          ],
        },
        {
          name: "Gap_Details",
          rows: [
            {
              Change_ID: "CHG-0001",
              Change_Type: "MODIFIED",
              Impact: "High",
              Old_Requirement_ID: "OLD-STD-005",
              Old_Requirement_Text: "Beneficial ownership must be collected for legal entity customers with 25% or more ownership",
              Current_Requirement_ID: "CUR-STD-005",
              Current_Requirement_Text: "Beneficial ownership must be collected AND VERIFIED for legal entity customers with 25% or more ownership using documentary or non-documentary methods",
              Change_Description: "Added explicit verification requirement for beneficial ownership information",
              Impact_Assessment: "Significant procedural impact - requires updated verification procedures and training",
              Testing_Implication: "Must test for BO verification evidence, not just collection",
              Old_Citation: "Old GFC > Section 3.2 > Beneficial Ownership",
              Current_Citation: "Current GFC > Section 3.2 > Beneficial Ownership > Verification",
              Confidence: "High",
              Notes: "Key regulatory alignment update",
            },
            {
              Change_ID: "CHG-0002",
              Change_Type: "NEW",
              Impact: "High",
              Old_Requirement_ID: "N/A",
              Old_Requirement_Text: "",
              Current_Requirement_ID: "CUR-STD-012",
              Current_Requirement_Text: "Enhanced due diligence must be applied to customers from high-risk jurisdictions as defined in the firm's risk assessment",
              Change_Description: "New requirement for jurisdiction-based EDD",
              Impact_Assessment: "Requires new EDD procedures and country risk classification",
              Testing_Implication: "New testing attribute for jurisdiction-based risk assessment",
              Old_Citation: "NOT FOUND",
              Current_Citation: "Current GFC > Section 4.1 > Enhanced Due Diligence",
              Confidence: "High",
              Notes: "Addresses regulatory expectations for geographic risk",
            },
            {
              Change_ID: "CHG-0003",
              Change_Type: "MODIFIED",
              Impact: "Medium",
              Old_Requirement_ID: "OLD-STD-008",
              Old_Requirement_Text: "Customer identification information must be collected at account opening",
              Current_Requirement_ID: "CUR-STD-008",
              Current_Requirement_Text: "Customer identification information must be collected at or before account opening, or within a reasonable timeframe if immediate collection is not feasible",
              Change_Description: "Added flexibility for timing of CIP information collection",
              Impact_Assessment: "Allows reasonable delay in information collection with documentation",
              Testing_Implication: "Test for timeliness and documentation of delayed collection rationale",
              Old_Citation: "Old GFC > Section 2.1 > CIP Timing",
              Current_Citation: "Current GFC > Section 2.1 > CIP Timing",
              Confidence: "High",
              Notes: "Aligns with regulatory guidance on reasonable timeframes",
            },
            {
              Change_ID: "CHG-0004",
              Change_Type: "REMOVED",
              Impact: "Low",
              Old_Requirement_ID: "OLD-STD-022",
              Old_Requirement_Text: "Physical address verification must be performed via site visit for high-value commercial accounts",
              Current_Requirement_ID: "N/A",
              Current_Requirement_Text: "",
              Change_Description: "Removed mandatory site visit requirement for address verification",
              Impact_Assessment: "Allows alternative address verification methods",
              Testing_Implication: "Site visit no longer required - test for acceptable alternative methods",
              Old_Citation: "Old GFC > Section 2.4 > Address Verification",
              Current_Citation: "REMOVED",
              Confidence: "High",
              Notes: "Recognizes technology alternatives for address verification",
            },
            {
              Change_ID: "CHG-0005",
              Change_Type: "NEW",
              Impact: "Medium",
              Old_Requirement_ID: "N/A",
              Old_Requirement_Text: "",
              Current_Requirement_ID: "CUR-STD-025",
              Current_Requirement_Text: "Ongoing monitoring of customer risk must be performed at minimum annually for all relationship customers",
              Change_Description: "New requirement for periodic customer risk review",
              Impact_Assessment: "Requires implementation of annual risk review process",
              Testing_Implication: "Test for evidence of annual risk reviews",
              Old_Citation: "NOT FOUND",
              Current_Citation: "Current GFC > Section 5.2 > Ongoing Monitoring",
              Confidence: "High",
              Notes: "Ensures continued risk management throughout relationship",
            },
            {
              Change_ID: "CHG-0006",
              Change_Type: "MODIFIED",
              Impact: "Medium",
              Old_Requirement_ID: "OLD-STD-015",
              Old_Requirement_Text: "OFAC screening must be performed at account opening",
              Current_Requirement_ID: "CUR-STD-015",
              Current_Requirement_Text: "OFAC and comprehensive sanctions screening must be performed at account opening and upon list updates using automated screening systems",
              Change_Description: "Expanded sanctions screening scope and added automation requirement",
              Impact_Assessment: "Requires automated screening system with update capabilities",
              Testing_Implication: "Test for automated screening and update monitoring",
              Old_Citation: "Old GFC > Section 4.3 > Sanctions",
              Current_Citation: "Current GFC > Section 4.3 > Sanctions Screening",
              Confidence: "High",
              Notes: "Enhanced sanctions compliance requirements",
            },
          ],
        },
      ],
    },
  };
}
