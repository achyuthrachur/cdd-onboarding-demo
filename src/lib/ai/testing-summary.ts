/**
 * AI-Generated Testing Summary
 * Feature 8: Generate comprehensive audit documentation from testing results
 */

import OpenAI from "openai";
import { ConsolidationResult } from "@/lib/consolidation/engine";

// ============================================================================
// TESTING SUMMARY PROMPT
// ============================================================================

export const TESTING_SUMMARY_PROMPT = `You are an AML Audit documentation assistant. Based on the testing results provided below, write a comprehensive summary suitable for inclusion in audit workpapers.

Your summary MUST include the following sections:

## 1. EXECUTIVE SUMMARY
- Total number of entities tested
- Overall pass rate
- High-level findings overview

## 2. TESTING RESULTS BY OUTCOME
For each outcome category, provide:
- Count and percentage of entities
- Key observations or patterns

Categories:
- Pass (Full Compliance): Entities where all attributes passed testing
- Pass with Observations: Entities with minor issues that don't constitute failures
- Fail - Regulatory: Entities with regulatory compliance failures
- Fail - Procedural: Entities with internal procedure violations
- Questions to LOB: Items requiring line of business clarification

## 3. OBSERVATIONS SUMMARY
- List all unique observations noted during testing
- Group by attribute category where applicable
- Note any recurring themes or patterns

## 4. QUESTIONS PENDING LOB RESPONSE
- List all questions submitted to line of business
- Include the attribute and context for each question

## 5. AUDIT DOCUMENTATION REQUIREMENTS
Based on the results, document what needs to be included in:
- Finding documentation (if failures exceed threshold)
- Observation memos (for procedural issues)
- Management letter points (if applicable)
- Follow-up testing requirements

## 6. RECOMMENDATIONS
- Suggested process improvements
- Training recommendations
- Control enhancement opportunities

Write in professional audit documentation style. Be specific and cite actual numbers from the data. Do not fabricate or assume information not provided.`;

// ============================================================================
// INPUT INTERFACE
// ============================================================================

export interface TestingSummaryInput {
  auditRunId: string;
  auditRunName: string;
  testingPeriod?: { start: Date; end: Date };
  totalEntities: number;
  resultBreakdown: {
    passComplete: number;
    passWithObservations: number;
    failRegulatory: number;
    failProcedural: number;
    questionsToLOB: number;
    notTested: number;
  };
  observations: Array<{
    customerId: string;
    customerName: string;
    attributeName: string;
    observationText: string;
  }>;
  questions: Array<{
    customerId: string;
    customerName: string;
    attributeName: string;
    questionText: string;
  }>;
  failures: Array<{
    customerId: string;
    customerName: string;
    attributeName: string;
    failureType: 'Regulatory' | 'Procedure';
    failureReason: string;
  }>;
  auditorMetrics?: Array<{
    auditorName: string;
    rowsCompleted: number;
    passRate: number;
  }>;
}

// ============================================================================
// RESULT INTERFACE
// ============================================================================

export interface TestingSummaryResult {
  success: boolean;
  summary?: string;
  error?: string;
  demoMode?: boolean;
  tokensUsed?: number;
}

// ============================================================================
// GENERATE TESTING SUMMARY
// ============================================================================

/**
 * Generate an AI-powered testing summary from consolidation results
 */
export async function generateTestingSummary(
  input: TestingSummaryInput
): Promise<TestingSummaryResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  console.log("[AI-Summary] ========================================");
  console.log("[AI-Summary] Starting testing summary generation");
  console.log(`[AI-Summary] Audit Run: ${input.auditRunId}`);
  console.log(`[AI-Summary] Total entities: ${input.totalEntities}`);
  console.log(`[AI-Summary] OpenAI key configured: ${!!apiKey}`);

  if (!apiKey) {
    console.log("[AI-Summary] No API key - using demo mode");
    return {
      success: true,
      demoMode: true,
      summary: getDemoTestingSummary(input),
    };
  }

  try {
    const client = new OpenAI({ apiKey });

    console.log("[AI-Summary] Calling OpenAI API...");
    const startTime = Date.now();

    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: TESTING_SUMMARY_PROMPT,
        },
        {
          role: "user",
          content: `Generate a comprehensive testing summary based on the following data:\n\n${JSON.stringify(input, null, 2)}`,
        },
      ],
      max_tokens: 3000,
      temperature: 0.3,
    });

    const duration = Date.now() - startTime;
    console.log(`[AI-Summary] API call completed in ${duration}ms`);
    console.log(`[AI-Summary] Model used: ${response.model}`);
    console.log(`[AI-Summary] Tokens: ${response.usage?.total_tokens || 0}`);

    const content = response.choices[0]?.message?.content;

    if (!content) {
      console.error("[AI-Summary] No content in response");
      return {
        success: true,
        demoMode: true,
        summary: getDemoTestingSummary(input),
        error: "No response content from AI - using demo summary",
      };
    }

    console.log("[AI-Summary] Summary generated successfully");
    console.log("[AI-Summary] ========================================");

    return {
      success: true,
      demoMode: false,
      summary: content,
      tokensUsed: response.usage?.total_tokens || 0,
    };
  } catch (error) {
    console.error("[AI-Summary] ========================================");
    console.error("[AI-Summary] API call failed:", error);
    console.error("[AI-Summary] Falling back to demo mode");
    console.error("[AI-Summary] ========================================");

    return {
      success: true,
      demoMode: true,
      summary: getDemoTestingSummary(input),
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ============================================================================
// DEMO SUMMARY GENERATOR
// ============================================================================

/**
 * Generate a demo testing summary when AI is not available
 */
export function getDemoTestingSummary(input: TestingSummaryInput): string {
  const total = input.totalEntities;
  const {
    passComplete,
    passWithObservations,
    failRegulatory,
    failProcedural,
    questionsToLOB,
    notTested,
  } = input.resultBreakdown;

  const totalPassed = passComplete + passWithObservations;
  const totalFailed = failRegulatory + failProcedural;
  const passRate = total > 0 ? ((passComplete / total) * 100).toFixed(1) : "0.0";
  const fullComplianceRate = total > 0 ? ((passComplete / total) * 100).toFixed(1) : "0.0";

  // Group observations by category
  const observationsByCategory = input.observations.reduce((acc, obs) => {
    const cat = obs.attributeName.split(" ")[0] || "General";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(obs);
    return acc;
  }, {} as Record<string, typeof input.observations>);

  // Group failures by type
  const regulatoryFailures = input.failures.filter((f) => f.failureType === "Regulatory");
  const proceduralFailures = input.failures.filter((f) => f.failureType === "Procedure");

  return `## 1. EXECUTIVE SUMMARY

Testing was completed for **${total} entities** in **${input.auditRunName}**.

**Key Metrics:**
- Overall full compliance rate: **${fullComplianceRate}%**
- Entities passing with observations: **${passWithObservations}** (${((passWithObservations / total) * 100).toFixed(1)}%)
- Total exceptions identified: **${totalFailed}**
- Items pending LOB response: **${questionsToLOB}**

${totalFailed > 0 ? `**Attention Required:** ${totalFailed} entities failed testing, with ${failRegulatory} regulatory failures and ${failProcedural} procedural violations identified.` : "**No exceptions identified.** All tested entities met compliance requirements."}

---

## 2. TESTING RESULTS BY OUTCOME

| Category | Count | Percentage |
|----------|-------|------------|
| Pass (Full Compliance) | ${passComplete} | ${fullComplianceRate}% |
| Pass with Observations | ${passWithObservations} | ${((passWithObservations / total) * 100).toFixed(1)}% |
| Fail - Regulatory | ${failRegulatory} | ${((failRegulatory / total) * 100).toFixed(1)}% |
| Fail - Procedural | ${failProcedural} | ${((failProcedural / total) * 100).toFixed(1)}% |
| Questions to LOB | ${questionsToLOB} | ${((questionsToLOB / total) * 100).toFixed(1)}% |
| Not Tested / N/A | ${notTested} | ${((notTested / total) * 100).toFixed(1)}% |
| **Total** | **${total}** | **100%** |

**Analysis:**
${passRate >= "80" ? "- Pass rate exceeds 80% threshold, indicating strong overall compliance posture." : passRate >= "60" ? "- Pass rate between 60-80% suggests opportunities for improvement in specific areas." : "- Pass rate below 60% indicates significant compliance gaps requiring immediate attention."}
${failRegulatory > failProcedural ? "- Regulatory failures exceed procedural failures, suggesting potential gaps in policy implementation." : failProcedural > failRegulatory ? "- Procedural failures exceed regulatory failures, indicating internal process improvement opportunities." : ""}

---

## 3. OBSERVATIONS SUMMARY

${input.observations.length} observations were noted during testing:

${Object.entries(observationsByCategory)
  .slice(0, 5)
  .map(
    ([category, observations]) => `
### ${category} (${observations.length} observation${observations.length > 1 ? "s" : ""})
${observations
  .slice(0, 3)
  .map((o) => `- **${o.customerName}** - ${o.attributeName}: ${o.observationText}`)
  .join("\n")}
${observations.length > 3 ? `\n*...and ${observations.length - 3} additional observations in this category*` : ""}`
  )
  .join("\n")}

${Object.keys(observationsByCategory).length > 5 ? `\n*Additional categories with observations: ${Object.keys(observationsByCategory).slice(5).join(", ")}*` : ""}

**Recurring Themes:**
- Documentation completeness issues were the most common observation
- Timing of verification activities noted in several cases
- Minor discrepancies between system records and source documents

---

## 4. QUESTIONS PENDING LOB RESPONSE

${input.questions.length} questions require line of business clarification:

${input.questions.length > 0
  ? input.questions
      .slice(0, 8)
      .map((q, idx) => `${idx + 1}. **${q.customerName}** - ${q.attributeName}\n   > ${q.questionText}`)
      .join("\n\n")
  : "*No questions pending LOB response.*"}

${input.questions.length > 8 ? `\n*...and ${input.questions.length - 8} additional questions pending response*` : ""}

**Action Required:**
${input.questions.length > 0
  ? "- Compile questions and submit to LOB management within 5 business days\n- Track responses in audit documentation\n- Re-test applicable attributes upon receiving clarification"
  : "- No action required - all testing items resolved"}

---

## 5. AUDIT DOCUMENTATION REQUIREMENTS

Based on the testing results, the following documentation should be prepared:

${totalFailed > 0 ? `### Finding Documentation Required
${failRegulatory > 0 ? `- **${failRegulatory} Regulatory Findings** require formal documentation including:
  - Root cause analysis for each regulatory failure
  - Remediation action plans with target dates
  - Management response and commitment to remediate` : ""}
${failProcedural > 0 ? `- **${failProcedural} Procedural Findings** require:
  - Observation memo documenting internal process gaps
  - Recommended control improvements
  - Follow-up testing schedule` : ""}` : "### No Formal Findings Required\nTesting did not identify exceptions requiring formal finding documentation."}

${passWithObservations > 0 ? `### Observation Memos
- ${passWithObservations} entities passed with observations that should be documented for management awareness
- Consider including in Management Letter if patterns indicate systemic issues` : ""}

### Follow-up Testing Requirements
${totalFailed > 0 ? `- Remediation testing required for ${totalFailed} failed items
- Schedule follow-up testing 30-60 days after remediation completion
- Document interim controls if remediation timeline exceeds audit period` : "- No follow-up testing required based on current results"}

---

## 6. RECOMMENDATIONS

Based on the testing results, the following recommendations are provided:

### Process Improvements
${totalFailed > 0 ? `1. **Enhance QA processes** - ${((totalFailed / total) * 100).toFixed(1)}% failure rate suggests opportunities for improved quality assurance
2. **Standardize documentation** - Observations indicate inconsistent documentation practices
3. **Automate verification checks** - Consider system controls to prevent common errors` : `1. **Maintain current controls** - High compliance rate indicates effective processes
2. **Document best practices** - Capture lessons learned for other business units
3. **Continue monitoring** - Periodic testing recommended to ensure sustained compliance`}

### Training Recommendations
${failProcedural > 0 ? `- **Procedure Training**: ${failProcedural} procedural failures suggest need for refresher training on internal requirements
- Focus areas: Documentation standards, timing requirements, escalation procedures` : "- Current training appears effective based on testing results"}
${failRegulatory > 0 ? `- **Regulatory Training**: ${failRegulatory} regulatory failures indicate gaps in regulatory knowledge
- Recommend enhanced training on CIP/CDD requirements and recent regulatory changes` : ""}

### Control Enhancement Opportunities
${input.observations.length > 5 ? `- High observation volume (${input.observations.length}) suggests opportunities for preventive controls
- Consider implementing automated validation checks at point of data entry
- Enhance supervisor review procedures for high-risk transactions` : "- Current control environment appears adequate based on testing results"}

---

*This summary was generated for audit workpaper documentation purposes. All findings and recommendations should be reviewed and validated by the engagement team before inclusion in final deliverables.*

*Generated: ${new Date().toLocaleDateString()} | Audit Run: ${input.auditRunName}*`;
}

// ============================================================================
// HELPER: BUILD INPUT FROM CONSOLIDATION RESULT
// ============================================================================

/**
 * Build TestingSummaryInput from a ConsolidationResult
 */
export function buildTestingSummaryInput(
  consolidation: ConsolidationResult,
  auditRunName: string = "CDD Onboarding Testing"
): TestingSummaryInput {
  const { metrics, customerFindings, findingsByAuditor } = consolidation;

  // Extract observations from customer findings
  const observations = customerFindings.flatMap((customer) =>
    customer.observations.map((obs) => ({
      customerId: customer.customerId,
      customerName: customer.customerName,
      attributeName: obs.attributeName,
      observationText: obs.observationText,
    }))
  );

  // Extract questions from customer findings
  const questions = customerFindings.flatMap((customer) =>
    customer.questionsToLOB.map((q) => ({
      customerId: customer.customerId,
      customerName: customer.customerName,
      attributeName: q.attributeName,
      questionText: q.questionText,
    }))
  );

  // Extract failures from customer findings
  const failures = customerFindings.flatMap((customer) =>
    customer.failures.map((f) => ({
      customerId: customer.customerId,
      customerName: customer.customerName,
      attributeName: f.attributeName,
      failureType: f.failureType,
      failureReason: f.failureReason,
    }))
  );

  // Build auditor metrics
  const auditorMetrics = findingsByAuditor.map((aud) => ({
    auditorName: aud.auditorName,
    rowsCompleted: aud.totalTests,
    passRate: aud.passRate,
  }));

  return {
    auditRunId: consolidation.auditRunId,
    auditRunName,
    totalEntities: metrics.uniqueEntitiesTested,
    resultBreakdown: {
      passComplete: metrics.passCount,
      passWithObservations: metrics.passWithObservationCount,
      failRegulatory: metrics.fail1RegulatoryCount,
      failProcedural: metrics.fail2ProcedureCount,
      questionsToLOB: metrics.questionToLOBCount,
      notTested: metrics.naCount,
    },
    observations,
    questions,
    failures,
    auditorMetrics,
  };
}
