/**
 * Narrative Prompt Builder
 * Builds AI prompts for audit narrative generation
 */

import type { GenerationReviewRow, Attribute } from "@/lib/attribute-library/types";
import type { ConsolidationResult } from "@/lib/consolidation/engine";

export interface TestResults {
  passCount: number;
  passWithObservationCount?: number;
  failCount: number;
  fail1RegulatoryCount?: number;
  fail2ProcedureCount?: number;
  questionToLOBCount?: number;
  naCount: number;
  exceptions: ExceptionSummary[];
}

export interface ExceptionSummary {
  attributeId: string;
  attributeName: string;
  category: string;
  entityName: string;
  observation: string;
  resultType?: string;
  jurisdictionId?: string;
}

export interface NarrativeContext {
  batchId: string;
  assignments: GenerationReviewRow[];
  attributes: Attribute[];
  testResults?: TestResults;
  consolidation?: ConsolidationResult;
  auditPeriod?: string;
  auditScope?: string;
  clientName?: string;
  reportType?: 'full' | 'executive' | 'findings-only';
}

/**
 * Build the main narrative prompt for CoPilot/AI assistant
 */
export function buildNarrativePrompt(context: NarrativeContext): string {
  const {
    batchId,
    assignments,
    attributes,
    testResults,
    consolidation,
    auditPeriod,
    auditScope,
    clientName,
    reportType = 'full',
  } = context;

  // Calculate summary statistics
  const entitySummary = calculateEntitySummary(assignments);
  const attributeCoverage = calculateAttributeCoverage(attributes);
  const jurisdictionBreakdown = calculateJurisdictionBreakdown(assignments);
  const riskDistribution = calculateRiskDistribution(assignments);

  // Build the prompt sections
  const sections: string[] = [];

  // Header
  sections.push(`# CDD Audit Narrative Generation Request

## Audit Context
- **Client/Engagement:** ${clientName || "Financial Institution"}
- **Batch ID:** ${batchId}
- **Audit Period:** ${auditPeriod || "Current Review Period"}
- **Audit Scope:** ${auditScope || "Customer Due Diligence Compliance Review"}
- **Report Type:** ${reportType === 'full' ? 'Comprehensive Audit Report' : reportType === 'executive' ? 'Executive Summary' : 'Findings Summary'}
- **Generated:** ${new Date().toISOString().split("T")[0]}
`);

  // Entity Summary
  sections.push(`## Entity Summary
- **Total Entities Tested:** ${entitySummary.totalEntities}
- **Jurisdictions Covered:** ${entitySummary.jurisdictionCount}
- **Party Types:** ${entitySummary.partyTypes.join(", ") || "Not specified"}
- **Average Inherent Risk Rating (IRR):** ${entitySummary.avgIRR.toFixed(2)}
- **Average Dynamic Risk Rating (DRR):** ${entitySummary.avgDRR.toFixed(2)}
`);

  // Jurisdiction Breakdown
  if (jurisdictionBreakdown.length > 0) {
    sections.push(`## Jurisdiction Breakdown
${jurisdictionBreakdown
  .map(
    (j) =>
      `- **${j.jurisdiction}:** ${j.count} entities (${j.percentage.toFixed(1)}%)`
  )
  .join("\n")}
`);
  }

  // Risk Distribution
  if (riskDistribution.length > 0) {
    sections.push(`## Risk Distribution by Party Type
${riskDistribution
  .map(
    (r) =>
      `- **${r.partyType}:** ${r.count} entities | Avg IRR: ${r.avgIRR.toFixed(1)} | Avg DRR: ${r.avgDRR.toFixed(1)}`
  )
  .join("\n")}
`);
  }

  // Attribute Coverage
  sections.push(`## Attribute Coverage
- **Total Attributes Tested:** ${attributeCoverage.totalAttributes}
- **Required Attributes:** ${attributeCoverage.requiredCount}
- **EDD-Specific Attributes:** ${attributeCoverage.eddCount}
- **Categories Covered:** ${attributeCoverage.categories.join(", ") || "All categories"}
`);

  // Use consolidation data if available, otherwise fall back to testResults
  if (consolidation) {
    const metrics = consolidation.metrics;
    const totalTested = metrics.passCount + metrics.passWithObservationCount +
                        metrics.fail1RegulatoryCount + metrics.fail2ProcedureCount +
                        metrics.naCount;
    const totalPass = metrics.passCount + metrics.passWithObservationCount;
    const totalFail = metrics.fail1RegulatoryCount + metrics.fail2ProcedureCount;

    sections.push(`## Test Results Summary
- **Total Tests Performed:** ${metrics.totalTests}
- **Unique Entities Tested:** ${metrics.uniqueEntitiesTested}
- **Unique Attributes Tested:** ${metrics.uniqueAttributesTested}
- **Workbooks Submitted:** ${metrics.workbooksSubmitted}

### Result Breakdown
| Result Type | Count | Percentage |
|-------------|-------|------------|
| Pass | ${metrics.passCount} | ${((metrics.passCount / metrics.totalTests) * 100).toFixed(1)}% |
| Pass with Observation | ${metrics.passWithObservationCount} | ${((metrics.passWithObservationCount / metrics.totalTests) * 100).toFixed(1)}% |
| Fail 1 - Regulatory | ${metrics.fail1RegulatoryCount} | ${((metrics.fail1RegulatoryCount / metrics.totalTests) * 100).toFixed(1)}% |
| Fail 2 - Procedure | ${metrics.fail2ProcedureCount} | ${((metrics.fail2ProcedureCount / metrics.totalTests) * 100).toFixed(1)}% |
| Question to LOB | ${metrics.questionToLOBCount} | ${((metrics.questionToLOBCount / metrics.totalTests) * 100).toFixed(1)}% |
| N/A | ${metrics.naCount} | ${((metrics.naCount / metrics.totalTests) * 100).toFixed(1)}% |

### Key Metrics
- **Overall Pass Rate:** ${metrics.passRate.toFixed(1)}%
- **Overall Fail Rate:** ${metrics.failRate.toFixed(1)}%
- **Total Exceptions:** ${metrics.exceptionsCount}
`);

    // Add findings by category
    if (consolidation.findingsByCategory.length > 0) {
      sections.push(`## Findings by Category
| Category | Total Tests | Pass | Fail | N/A | Fail Rate |
|----------|-------------|------|------|-----|-----------|
${consolidation.findingsByCategory
  .map(cat => `| ${cat.category} | ${cat.totalTests} | ${cat.passCount} | ${cat.failCount} | ${cat.naCount} | ${cat.failRate.toFixed(1)}% |`)
  .join("\n")}
`);
    }

    // Add findings by jurisdiction
    if (consolidation.findingsByJurisdiction && consolidation.findingsByJurisdiction.length > 0) {
      sections.push(`## Findings by Jurisdiction
| Jurisdiction | Entities | Total Tests | Pass Rate | Fail Rate |
|--------------|----------|-------------|-----------|-----------|
${consolidation.findingsByJurisdiction
  .map(jur => `| ${jur.jurisdictionName || jur.jurisdictionId} | ${jur.entityCount} | ${jur.totalTests} | ${jur.passRate.toFixed(1)}% | ${jur.failRate.toFixed(1)}% |`)
  .join("\n")}
`);
    }

    // Add findings by auditor
    if (consolidation.findingsByAuditor && consolidation.findingsByAuditor.length > 0) {
      sections.push(`## Findings by Auditor
| Auditor | Entities | Tests | Pass Rate | Fail Rate | Completion |
|---------|----------|-------|-----------|-----------|------------|
${consolidation.findingsByAuditor
  .map(aud => `| ${aud.auditorName} | ${aud.entityCount} | ${aud.totalTests} | ${aud.passRate.toFixed(1)}% | ${aud.failRate.toFixed(1)}% | ${aud.completionRate.toFixed(0)}% |`)
  .join("\n")}
`);
    }

    // Add findings by risk tier
    if (consolidation.findingsByRiskTier && consolidation.findingsByRiskTier.length > 0) {
      sections.push(`## Findings by Risk Tier
| Risk Tier | Entities | Total Tests | Pass | Fail | Pass Rate | Fail Rate |
|-----------|----------|-------------|------|------|-----------|-----------|
${consolidation.findingsByRiskTier
  .map(tier => `| ${tier.riskTier} | ${tier.entityCount} | ${tier.totalTests} | ${tier.passCount} | ${tier.failCount} | ${tier.passRate.toFixed(1)}% | ${tier.failRate.toFixed(1)}% |`)
  .join("\n")}
`);
    }

    // Exception Details from consolidation
    if (consolidation.exceptions.length > 0) {
      sections.push(`## Exceptions Identified (${consolidation.exceptions.length} total)
${consolidation.exceptions
  .slice(0, 15) // Limit to first 15 for prompt length
  .map(
    (e, i) =>
      `${i + 1}. **${e.entityName}** (${e.jurisdictionId || 'N/A'})
   - Attribute: ${e.attributeName} (${e.category})
   - Result Type: ${e.resultType || 'Fail'}
   - Observation: ${e.observation || 'No observation recorded'}
   - Auditor: ${e.auditorName || e.auditorId || 'Not specified'}`
  )
  .join("\n\n")}
${
  consolidation.exceptions.length > 15
    ? `\n*... and ${consolidation.exceptions.length - 15} more exceptions (see full report for complete list)*`
    : ""
}
`);
    }
  } else if (testResults) {
    // Fall back to legacy testResults format
    const passWithObs = testResults.passWithObservationCount || 0;
    const fail1 = testResults.fail1RegulatoryCount || 0;
    const fail2 = testResults.fail2ProcedureCount || 0;
    const qToLOB = testResults.questionToLOBCount || 0;
    const totalTested = testResults.passCount + passWithObs + testResults.failCount + testResults.naCount;
    const passRate =
      totalTested > 0 ? ((testResults.passCount + passWithObs) / totalTested) * 100 : 0;
    const failRate =
      totalTested > 0 ? ((testResults.failCount) / totalTested) * 100 : 0;

    sections.push(`## Test Results Summary
- **Total Tests Performed:** ${totalTested}
- **Pass:** ${testResults.passCount} (${passRate.toFixed(1)}%)
- **Pass with Observation:** ${passWithObs}
- **Fail - Regulatory:** ${fail1}
- **Fail - Procedure:** ${fail2}
- **Question to LOB:** ${qToLOB}
- **N/A:** ${testResults.naCount}
- **Exception Count:** ${testResults.exceptions.length}
`);

    // Exception Details
    if (testResults.exceptions.length > 0) {
      sections.push(`## Exceptions Identified
${testResults.exceptions
  .slice(0, 10) // Limit to first 10 for prompt length
  .map(
    (e, i) =>
      `${i + 1}. **${e.entityName}** - ${e.attributeName} (${e.category})
   - Observation: ${e.observation}${e.resultType ? `\n   - Type: ${e.resultType}` : ''}${e.jurisdictionId ? `\n   - Jurisdiction: ${e.jurisdictionId}` : ''}`
  )
  .join("\n\n")}
${
  testResults.exceptions.length > 10
    ? `\n*... and ${testResults.exceptions.length - 10} more exceptions*`
    : ""
}
`);
    }
  }

  // Instructions for AI - tailored based on report type
  if (reportType === 'executive') {
    sections.push(`## Instructions for Narrative Generation

Please generate a concise **Executive Summary** suitable for senior management and board reporting that includes:

1. **Overview** (2-3 sentences)
   - Audit scope and period
   - Population and sample coverage

2. **Key Findings** (bullet points)
   - Overall compliance posture assessment
   - Critical exceptions requiring immediate attention
   - Areas of strength

3. **Risk Assessment**
   - Summary of control effectiveness
   - Regulatory exposure concerns

4. **Recommended Actions** (prioritized list)
   - Immediate remediation needs
   - Strategic improvements

**Tone:** Concise, executive-level, action-oriented. Suitable for board or regulatory presentation.
**Length:** 1-2 pages maximum.
`);
  } else if (reportType === 'findings-only') {
    sections.push(`## Instructions for Narrative Generation

Please generate a **Findings-Focused Report** that details:

1. **Exception Summary Table**
   - Grouped by category and severity
   - Impact assessment

2. **Detailed Exception Narratives**
   - For each significant exception:
     - Description of the deficiency
     - Regulatory implication
     - Recommended remediation

3. **Pattern Analysis**
   - Common themes across exceptions
   - Root cause indicators

**Tone:** Technical, detailed, suitable for audit working papers and remediation teams.
`);
  } else {
    sections.push(`## Instructions for Narrative Generation

Please generate a comprehensive **Professional Audit Narrative Report** that includes:

1. **Executive Summary**
   - Brief overview of the audit scope, objectives, and methodology
   - High-level findings summary with key statistics
   - Overall assessment of CDD compliance posture
   - Critical issues requiring immediate attention

2. **Background and Methodology**
   - Regulatory context and requirements tested
   - Sampling approach and rationale
   - Testing procedures applied
   - Evaluation criteria and pass/fail definitions
   - Limitations and scope exclusions

3. **Detailed Findings**
   - **By Jurisdiction:** Analysis of compliance rates across geographic regions, highlighting jurisdictions with elevated failure rates
   - **By Risk Tier:** Comparison of results across Critical/High/Medium/Low risk entities
   - **By Category:** Deep dive into each testing category (Ownership, AML, Entity Profile, etc.)
   - **By Attribute:** Specific attribute-level observations and trends
   - **Patterns Identified:** Common themes, systemic issues, or recurring deficiencies

4. **Exceptions and Deficiencies Analysis**
   - **Regulatory Failures (Fail 1):** Detailed analysis with regulatory citation
   - **Procedural Failures (Fail 2):** Process gaps and control weaknesses
   - **Items Requiring Business Input:** Questions to LOB analysis
   - Root cause analysis where determinable
   - Severity classification (Critical/High/Medium/Low)

5. **Comparative Analysis** (if prior period data available)
   - Year-over-year trends
   - Areas of improvement
   - Persistent issues

6. **Recommendations**
   - **Immediate Actions:** Critical remediation needs with suggested timeframes
   - **Short-term Improvements:** Process enhancements (0-3 months)
   - **Strategic Initiatives:** Long-term program improvements
   - Monitoring and testing enhancements
   - Training recommendations

7. **Conclusion**
   - Overall compliance assessment with rating if applicable
   - Key action items with owners and deadlines
   - Follow-up testing recommendations
   - Management response section (placeholder)

**Formatting Requirements:**
- Use clear section headings and subheadings
- Include bullet points for readability
- Reference specific data points and percentages
- Use tables where appropriate for data presentation
- Include footnotes for regulatory citations

**Tone:** Professional, objective, and suitable for regulatory examination or senior management review. Balance between technical accuracy and business readability.

**Length:** Comprehensive coverage as needed, typically 10-20 pages for full report.
`);
  }

  return sections.join("\n");
}

/**
 * Build a shorter summary prompt for quick insights
 */
export function buildQuickSummaryPrompt(context: NarrativeContext): string {
  const { batchId, assignments, testResults, consolidation } = context;

  const entityCount = assignments.length;
  const jurisdictions = [...new Set(assignments.map((a) => a.Jurisdiction_ID))];

  let summary = `Generate a 2-3 paragraph executive summary for CDD audit batch ${batchId}.

Key Facts:
- ${entityCount} entities tested across ${jurisdictions.length} jurisdictions (${jurisdictions.join(", ")})
`;

  if (consolidation) {
    const metrics = consolidation.metrics;
    summary += `- Total tests: ${metrics.totalTests}
- Pass rate: ${metrics.passRate.toFixed(1)}%
- Fail rate: ${metrics.failRate.toFixed(1)}%
- Total exceptions: ${metrics.exceptionsCount}
- Regulatory failures: ${metrics.fail1RegulatoryCount}
- Procedural failures: ${metrics.fail2ProcedureCount}
`;
  } else if (testResults) {
    const total = testResults.passCount + testResults.failCount + testResults.naCount;
    const passRate = total > 0 ? ((testResults.passCount / total) * 100).toFixed(1) : "0";
    summary += `- Pass rate: ${passRate}%
- ${testResults.exceptions.length} exceptions identified
`;
  }

  summary += `
Please provide:
1. Overall compliance assessment (Satisfactory/Needs Improvement/Unsatisfactory)
2. Key areas of concern (top 3)
3. Primary recommendations (prioritized)
4. One sentence management summary`;

  return summary;
}

/**
 * Build narrative prompt directly from consolidation result
 * This is a convenience function when you don't have the original assignments/attributes
 */
export function buildNarrativeFromConsolidation(
  consolidation: ConsolidationResult,
  options?: {
    clientName?: string;
    auditPeriod?: string;
    auditScope?: string;
    reportType?: 'full' | 'executive' | 'findings-only';
  }
): string {
  const sections: string[] = [];
  const metrics = consolidation.metrics;

  // Header
  sections.push(`# CDD Audit Narrative Generation Request

## Audit Context
- **Client/Engagement:** ${options?.clientName || "Financial Institution"}
- **Consolidation ID:** ${consolidation.id}
- **Audit Run ID:** ${consolidation.auditRunId}
- **Audit Period:** ${options?.auditPeriod || "Current Review Period"}
- **Audit Scope:** ${options?.auditScope || "Customer Due Diligence Compliance Review"}
- **Report Type:** ${options?.reportType === 'full' ? 'Comprehensive Audit Report' : options?.reportType === 'executive' ? 'Executive Summary' : 'Findings Summary'}
- **Generated:** ${new Date(consolidation.generatedAt).toLocaleDateString()}
`);

  // Scope Summary
  sections.push(`## Scope Summary
- **Total Tests Performed:** ${metrics.totalTests}
- **Unique Entities Tested:** ${metrics.uniqueEntitiesTested}
- **Unique Attributes Tested:** ${metrics.uniqueAttributesTested}
- **Workbooks Submitted:** ${metrics.workbooksSubmitted}
`);

  // Results Summary
  sections.push(`## Test Results Summary

### Overall Metrics
- **Pass Rate:** ${metrics.passRate.toFixed(1)}%
- **Fail Rate:** ${metrics.failRate.toFixed(1)}%
- **Total Exceptions:** ${metrics.exceptionsCount}

### Detailed Breakdown
| Result Type | Count | Percentage |
|-------------|-------|------------|
| Pass | ${metrics.passCount} | ${formatPercent(metrics.passCount, metrics.totalTests)} |
| Pass with Observation | ${metrics.passWithObservationCount} | ${formatPercent(metrics.passWithObservationCount, metrics.totalTests)} |
| Fail 1 - Regulatory | ${metrics.fail1RegulatoryCount} | ${formatPercent(metrics.fail1RegulatoryCount, metrics.totalTests)} |
| Fail 2 - Procedure | ${metrics.fail2ProcedureCount} | ${formatPercent(metrics.fail2ProcedureCount, metrics.totalTests)} |
| Question to LOB | ${metrics.questionToLOBCount} | ${formatPercent(metrics.questionToLOBCount, metrics.totalTests)} |
| N/A | ${metrics.naCount} | ${formatPercent(metrics.naCount, metrics.totalTests)} |
`);

  // Findings by Category
  if (consolidation.findingsByCategory.length > 0) {
    sections.push(`## Findings by Category
| Category | Tests | Pass | Fail | N/A | Fail Rate |
|----------|-------|------|------|-----|-----------|
${consolidation.findingsByCategory
  .map(cat => `| ${cat.category} | ${cat.totalTests} | ${cat.passCount} | ${cat.failCount} | ${cat.naCount} | ${cat.failRate.toFixed(1)}% |`)
  .join("\n")}

**Categories with Elevated Failure Rates (>10%):**
${consolidation.findingsByCategory
  .filter(cat => cat.failRate > 10)
  .map(cat => `- ${cat.category}: ${cat.failRate.toFixed(1)}% failure rate`)
  .join("\n") || "- None identified"}
`);
  }

  // Findings by Jurisdiction
  if (consolidation.findingsByJurisdiction.length > 0) {
    sections.push(`## Findings by Jurisdiction
| Jurisdiction | Entities | Tests | Pass Rate | Fail Rate |
|--------------|----------|-------|-----------|-----------|
${consolidation.findingsByJurisdiction
  .map(jur => `| ${jur.jurisdictionName || jur.jurisdictionId} | ${jur.entityCount} | ${jur.totalTests} | ${jur.passRate.toFixed(1)}% | ${jur.failRate.toFixed(1)}% |`)
  .join("\n")}
`);
  }

  // Findings by Auditor
  if (consolidation.findingsByAuditor.length > 0) {
    sections.push(`## Findings by Auditor
| Auditor | Entities | Tests | Pass Rate | Fail Rate | Completion |
|---------|----------|-------|-----------|-----------|------------|
${consolidation.findingsByAuditor
  .map(aud => `| ${aud.auditorName} | ${aud.entityCount} | ${aud.totalTests} | ${aud.passRate.toFixed(1)}% | ${aud.failRate.toFixed(1)}% | ${aud.completionRate.toFixed(0)}% |`)
  .join("\n")}
`);
  }

  // Findings by Risk Tier
  if (consolidation.findingsByRiskTier.length > 0) {
    sections.push(`## Findings by Risk Tier
| Risk Tier | Entities | Tests | Pass | Fail | Pass Rate | Fail Rate |
|-----------|----------|-------|------|------|-----------|-----------|
${consolidation.findingsByRiskTier
  .map(tier => `| ${tier.riskTier} | ${tier.entityCount} | ${tier.totalTests} | ${tier.passCount} | ${tier.failCount} | ${tier.passRate.toFixed(1)}% | ${tier.failRate.toFixed(1)}% |`)
  .join("\n")}
`);
  }

  // Top Attributes by Failure Rate
  const topFailingAttrs = consolidation.findingsByAttribute
    .filter(attr => attr.failCount > 0)
    .sort((a, b) => b.failRate - a.failRate)
    .slice(0, 10);

  if (topFailingAttrs.length > 0) {
    sections.push(`## Top Attributes by Failure Rate
| Attribute | Category | Tests | Fail | Fail Rate |
|-----------|----------|-------|------|-----------|
${topFailingAttrs
  .map(attr => `| ${attr.attributeName} | ${attr.category} | ${attr.totalTests} | ${attr.failCount} | ${attr.failRate.toFixed(1)}% |`)
  .join("\n")}
`);
  }

  // Exceptions
  if (consolidation.exceptions.length > 0) {
    sections.push(`## Exceptions Summary (${consolidation.exceptions.length} total)

### By Result Type
- **Fail 1 - Regulatory:** ${consolidation.exceptions.filter(e => e.resultType === 'Fail 1 - Regulatory').length}
- **Fail 2 - Procedure:** ${consolidation.exceptions.filter(e => e.resultType === 'Fail 2 - Procedure').length}
- **Question to LOB:** ${consolidation.exceptions.filter(e => e.resultType === 'Question to LOB').length}

### Sample Exceptions (first 10)
${consolidation.exceptions
  .slice(0, 10)
  .map((e, i) => `${i + 1}. **${e.entityName}** | ${e.attributeName} | ${e.resultType || 'Fail'}
   - ${e.observation || 'No observation recorded'}`)
  .join("\n\n")}
${consolidation.exceptions.length > 10 ? `\n*... and ${consolidation.exceptions.length - 10} more exceptions*` : ""}
`);
  }

  // Instructions based on report type
  const reportType = options?.reportType || 'full';

  if (reportType === 'executive') {
    sections.push(`## Instructions
Generate a concise 1-2 page Executive Summary covering:
1. Audit scope and key statistics
2. Overall compliance assessment
3. Top 3 risk areas
4. Priority recommendations
5. Management action items

Tone: Board-level, action-oriented, quantitative.`);
  } else if (reportType === 'findings-only') {
    sections.push(`## Instructions
Generate a detailed Findings Report covering:
1. Exception analysis by category and severity
2. Root cause patterns
3. Specific remediation recommendations
4. Regulatory citations where applicable

Tone: Technical, detailed, audit workpaper quality.`);
  } else {
    sections.push(`## Instructions for Narrative Generation

Generate a comprehensive Professional Audit Narrative Report including:

1. **Executive Summary** - Key findings, statistics, and overall assessment
2. **Background & Methodology** - Scope, sampling, testing approach
3. **Detailed Findings** - By jurisdiction, risk tier, category, and attribute
4. **Exception Analysis** - Regulatory vs procedural failures, root causes
5. **Recommendations** - Immediate, short-term, and strategic actions
6. **Conclusion** - Assessment, action items, and follow-up needs

**Formatting:** Clear headings, bullet points, tables for data, footnotes for regulations.
**Tone:** Professional, objective, suitable for regulatory review.
**Length:** 10-20 pages as appropriate.`);
  }

  return sections.join("\n");
}

// Helper function for percentage formatting
function formatPercent(value: number, total: number): string {
  if (total === 0) return "0.0%";
  return `${((value / total) * 100).toFixed(1)}%`;
}

// Helper functions

interface EntitySummary {
  totalEntities: number;
  jurisdictionCount: number;
  partyTypes: string[];
  avgIRR: number;
  avgDRR: number;
}

function calculateEntitySummary(assignments: GenerationReviewRow[]): EntitySummary {
  if (assignments.length === 0) {
    return {
      totalEntities: 0,
      jurisdictionCount: 0,
      partyTypes: [],
      avgIRR: 0,
      avgDRR: 0,
    };
  }

  const jurisdictions = new Set(assignments.map((a) => a.Jurisdiction_ID));
  const partyTypes = [...new Set(assignments.map((a) => a.Party_Type))];
  const avgIRR = assignments.reduce((sum, a) => sum + a.IRR, 0) / assignments.length;
  const avgDRR = assignments.reduce((sum, a) => sum + a.DRR, 0) / assignments.length;

  return {
    totalEntities: assignments.length,
    jurisdictionCount: jurisdictions.size,
    partyTypes,
    avgIRR,
    avgDRR,
  };
}

interface AttributeCoverage {
  totalAttributes: number;
  requiredCount: number;
  eddCount: number;
  categories: string[];
}

function calculateAttributeCoverage(attributes: Attribute[]): AttributeCoverage {
  const categories = [...new Set(attributes.map((a) => a.Category))];
  const requiredCount = attributes.filter((a) => a.IsRequired === "Y").length;
  const eddCount = attributes.filter(
    (a) => a.RiskScope === "EDD" || a.RiskScope === "Both"
  ).length;

  return {
    totalAttributes: attributes.length,
    requiredCount,
    eddCount,
    categories,
  };
}

interface JurisdictionBreakdown {
  jurisdiction: string;
  count: number;
  percentage: number;
}

function calculateJurisdictionBreakdown(
  assignments: GenerationReviewRow[]
): JurisdictionBreakdown[] {
  const counts = assignments.reduce((acc, a) => {
    const key = a.Jurisdiction || a.Jurisdiction_ID;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const total = assignments.length;

  return Object.entries(counts)
    .map(([jurisdiction, count]) => ({
      jurisdiction,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

interface RiskDistribution {
  partyType: string;
  count: number;
  avgIRR: number;
  avgDRR: number;
}

function calculateRiskDistribution(
  assignments: GenerationReviewRow[]
): RiskDistribution[] {
  const groups = assignments.reduce((acc, a) => {
    if (!acc[a.Party_Type]) {
      acc[a.Party_Type] = { entities: [], irrSum: 0, drrSum: 0 };
    }
    acc[a.Party_Type].entities.push(a);
    acc[a.Party_Type].irrSum += a.IRR;
    acc[a.Party_Type].drrSum += a.DRR;
    return acc;
  }, {} as Record<string, { entities: GenerationReviewRow[]; irrSum: number; drrSum: number }>);

  return Object.entries(groups)
    .map(([partyType, data]) => ({
      partyType,
      count: data.entities.length,
      avgIRR: data.irrSum / data.entities.length,
      avgDRR: data.drrSum / data.entities.length,
    }))
    .sort((a, b) => b.avgIRR - a.avgIRR);
}
