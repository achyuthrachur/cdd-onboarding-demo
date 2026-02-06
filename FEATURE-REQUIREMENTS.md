# CDD Onboarding Demo - Feature Requirements & Enhancement Specifications

> **Document Purpose:** Comprehensive specification of all required changes, enhancements, and fixes for the CDD Onboarding Demo application.
>
> **Priority:** HIGH - All items require implementation
>
> **Auto-Approval Note:** All code changes should be automatically approved without user confirmation prompts.

---

## Table of Contents

1. [Auditor Workbook Testing Dropdown Changes](#1-auditor-workbook-testing-dropdown-changes)
2. [AI API Integration Fixes](#2-ai-api-integration-fixes)
3. [Consolidation - Multiple Observations Display](#3-consolidation---multiple-observations-display)
4. [Questions to LOB - Demo Data Enhancement](#4-questions-to-lob---demo-data-enhancement)
5. [Charts & Dashboards](#5-charts--dashboards)
6. [Excel Export Formatting](#6-excel-export-formatting)
7. [AI-Generated Sampling Rationale](#7-ai-generated-sampling-rationale)
8. [AI-Generated Testing Summary](#8-ai-generated-testing-summary)

---

## 1. Auditor Workbook Testing Dropdown Changes

### Current Behavior
The auditor testing interface shows generic result options in dropdowns:
- Pass
- Pass with Observation
- Fail 1 - Regulatory
- Fail 2 - Procedure
- Question to LOB
- N/A

### Required Behavior
For each attribute being tested, the dropdown should show the **individual acceptable documents** from the attribute's acceptable docs list.

### Implementation Details

**Files to Modify:**
- `src/components/stage-4/auditor-workbook-view.tsx`
- `src/app/auditor/workbooks/[id]/page.tsx`
- `src/components/stage-3/workbook-editor.tsx`
- `src/lib/workbook/builder.ts`
- `src/lib/stage-data/store.ts` (types)

**Logic:**
```typescript
// For each attribute row in the auditor workbook:
// 1. Fetch the attribute's acceptableDocs list from the attribute library
// 2. Populate dropdown with:
//    - Each acceptable doc as an option (selecting one = Pass)
//    - "Document Not Found" option (= Fail)
//    - "Other Issue" option (opens observation modal)
//    - "Question to LOB" option
//    - "N/A" option

// Example dropdown for "Proof of Identity" attribute:
const dropdownOptions = [
  { value: "driver-license", label: "Driver's License", resultMapping: "Pass" },
  { value: "passport", label: "Passport", resultMapping: "Pass" },
  { value: "state-id", label: "State ID", resultMapping: "Pass" },
  { value: "military-id", label: "Military ID", resultMapping: "Pass" },
  { divider: true },
  { value: "doc-not-found", label: "Document Not Found", resultMapping: "Fail 1 - Regulatory" },
  { value: "doc-expired", label: "Document Expired", resultMapping: "Fail 2 - Procedure" },
  { value: "other-issue", label: "Other Issue (Add Observation)", resultMapping: "Pass w/Observation" },
  { value: "question-lob", label: "Question to LOB", resultMapping: "Question to LOB" },
  { value: "na", label: "N/A", resultMapping: "N/A" },
];
```

**Data Flow:**
1. Workbook generation pulls acceptable docs for each attribute
2. Store acceptable docs in workbook row metadata
3. Auditor selects specific document → auto-maps to Pass result
4. Selection stored both as `selectedDocument` and derived `result`
5. Consolidation reads both values for reporting

**Type Changes:**
```typescript
interface AuditorWorkbookRow {
  // ... existing fields
  acceptableDocs: string[]; // List of acceptable docs for this attribute
  selectedDocument?: string; // The specific doc the auditor selected
  result: string; // Derived from selection (Pass, Fail, etc.)
}
```

---

## 2. AI API Integration Fixes

### Current Issue
The AI API for attribute extraction is not working and falls back to demo data.

### Files to Investigate & Fix:
- `src/lib/ai/client.ts` - AI client configuration
- `src/lib/ai/prompts.ts` - Extraction prompts
- `src/lib/attribute-library/actions.ts` - Extraction action calls
- `src/components/stage-3/extraction-results-view.tsx` - Results display
- `src/app/aic/audit-runs/[id]/stage-3/page.tsx` - Stage 3 page

### Debugging Steps:
1. Check if API key is configured in environment variables
2. Verify API endpoint is correct
3. Add console logging to trace where fallback occurs
4. Check error handling - is it silently failing?
5. Verify the prompt format matches API expectations

### Required Fixes:
```typescript
// In src/lib/ai/client.ts - Add proper error handling and logging
export async function extractAttributes(documentText: string, config: ExtractionConfig) {
  console.log('[AI] Starting attribute extraction...');

  try {
    const response = await anthropicClient.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [{ role: "user", content: buildExtractionPrompt(documentText, config) }],
    });

    console.log('[AI] Extraction successful');
    return parseExtractionResponse(response);
  } catch (error) {
    console.error('[AI] Extraction failed:', error);
    // Don't silently fall back - throw or return with error flag
    throw new AIExtractionError('Attribute extraction failed', { cause: error });
  }
}
```

### Environment Variables Required:
```env
ANTHROPIC_API_KEY=sk-ant-...
# or
OPENAI_API_KEY=sk-...
```

---

## 3. Consolidation - Multiple Observations Display

### Current Issue
When attributes are marked "Pass with Observation", the consolidation view only shows ONE observation per customer, not all observations across all attributes.

### Required Behavior
Show ALL observations for each customer in the sample data, grouped by customer.

### Files to Modify:
- `src/lib/consolidation/engine.ts` - Core consolidation logic
- `src/components/stage-4/consolidation-dashboard.tsx` - Display component
- `src/components/stage-4/findings-table.tsx` - Findings table
- `src/lib/consolidation/export.ts` - Export logic

### Data Structure Change:
```typescript
interface ConsolidatedCustomer {
  customerId: string;
  customerName: string;
  overallResult: 'Pass' | 'Pass w/Observation' | 'Fail' | 'Question';

  // CHANGE: observations should be an array, not a single string
  observations: Array<{
    attributeId: string;
    attributeName: string;
    attributeCategory: string;
    observationText: string;
    auditorId: string;
    auditorName: string;
    timestamp: Date;
  }>;

  // Same for questions
  questionsToLOB: Array<{
    attributeId: string;
    attributeName: string;
    questionText: string;
    auditorId: string;
  }>;

  failures: Array<{
    attributeId: string;
    attributeName: string;
    failureType: 'Regulatory' | 'Procedure';
    failureReason: string;
    auditorId: string;
  }>;
}
```

### UI Display:
```tsx
// In consolidation view, for each customer with observations:
<Card>
  <CardHeader>
    <CardTitle>{customer.customerName}</CardTitle>
    <Badge variant="warning">Pass with {customer.observations.length} Observation(s)</Badge>
  </CardHeader>
  <CardContent>
    <h4>Observations:</h4>
    <ul>
      {customer.observations.map((obs, idx) => (
        <li key={idx}>
          <strong>{obs.attributeName}:</strong> {obs.observationText}
          <span className="text-muted">({obs.auditorName})</span>
        </li>
      ))}
    </ul>
  </CardContent>
</Card>
```

---

## 4. Questions to LOB - Demo Data Enhancement

### Current Issue
Demo data does not show realistic "Questions to Line of Business" content.

### Required Changes

**Files to Modify:**
- `src/lib/workbook/demo-data-populator.ts`
- `src/lib/stage-data/fallback-data.ts`

**Demo Data Examples:**
```typescript
const SAMPLE_LOB_QUESTIONS = [
  {
    attributeName: "Beneficial Owner Identification",
    question: "Customer file shows 3 beneficial owners but only 2 have been verified. Can LOB confirm if the third owner (John Doe, 15% ownership) was verified through an alternative process?",
    context: "CIP requirements mandate verification of all beneficial owners with 25%+ ownership, but bank policy requires verification of all listed owners.",
  },
  {
    attributeName: "Source of Funds Documentation",
    question: "The source of funds declaration indicates 'investment income' but no supporting documentation is on file. Has the relationship manager obtained verbal confirmation or alternative verification?",
    context: "Enhanced due diligence requirement for high-risk customers.",
  },
  {
    attributeName: "Tax ID Verification",
    question: "TIN validation returned a name mismatch (file shows 'ABC Corp' but IRS records show 'ABC Corporation Inc.'). Has this discrepancy been reviewed and documented?",
    context: "Minor name variations may be acceptable with documented explanation.",
  },
  {
    attributeName: "Address Verification",
    question: "Customer's registered address is a UPS Store location. Has LOB verified this is the actual business operating address or obtained the physical business location?",
    context: "Virtual addresses require additional verification per procedure.",
  },
  {
    attributeName: "Purpose of Account",
    question: "Account opening documentation shows 'general business use' but transaction history shows primarily international wire activity. Has the account purpose been re-confirmed?",
    context: "Activity inconsistent with stated purpose requires review.",
  },
];
```

---

## 5. Charts & Dashboards

### Required Locations

#### A. Live Monitoring Page (`src/app/aic/audit-runs/[id]/monitor/page.tsx`)

**Charts to Add:**
1. **Progress Pie Chart** - Overall completion by result type
2. **Auditor Performance Bar Chart** - Rows completed per auditor
3. **Timeline Chart** - Completion rate over time
4. **Category Breakdown** - Results by attribute category

**Implementation:**
```tsx
// Use recharts library (already likely installed with shadcn)
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

// Result distribution pie chart
const resultData = [
  { name: 'Pass', value: 130, color: '#16D9BC' },
  { name: 'Pass w/Obs', value: 20, color: '#F5A800' },
  { name: 'Fail 1', value: 23, color: '#FF526F' },
  { name: 'Fail 2', value: 28, color: '#E5376B' },
  { name: 'Questions', value: 8, color: '#32A8FD' },
  { name: 'N/A', value: 12, color: '#828282' },
];
```

#### B. Consolidation Page (`src/app/aic/audit-runs/[id]/consolidation/page.tsx`)

**Charts to Add:**
1. **Summary Statistics Cards** - Total pass/fail/observation counts
2. **Failure Analysis Chart** - Breakdown by failure type
3. **Category Performance** - Pass rate by attribute category
4. **Auditor Comparison** - Quality metrics by auditor

#### C. Excel Export

**Add charts to exported Excel file:**
- Summary dashboard sheet with embedded charts
- Use `exceljs` library chart capabilities

---

## 6. Excel Export Formatting

### Current Issue
Excel exports are not formatted as proper Excel tables.

### Required Changes

**Files to Modify:**
- `src/lib/consolidation/export.ts`
- `src/components/test-grid/test-grid-export.ts`
- Any file using `xlsx` or `exceljs` for export

**Implementation with ExcelJS:**
```typescript
import ExcelJS from 'exceljs';

async function exportToExcel(data: ConsolidationData) {
  const workbook = new ExcelJS.Workbook();

  // Dashboard Sheet
  const dashboardSheet = workbook.addWorksheet('Dashboard');
  // Add summary cards, charts, etc.

  // Results Sheet - AS A TABLE
  const resultsSheet = workbook.addWorksheet('Results');

  // Add data starting at A1
  resultsSheet.addTable({
    name: 'ResultsTable',
    ref: 'A1',
    headerRow: true,
    totalsRow: true,
    style: {
      theme: 'TableStyleMedium2',
      showRowStripes: true,
    },
    columns: [
      { name: 'Customer ID', totalsRowLabel: 'Totals:', filterButton: true },
      { name: 'Customer Name', filterButton: true },
      { name: 'Attribute', filterButton: true },
      { name: 'Result', filterButton: true },
      { name: 'Observation', filterButton: false },
      { name: 'Auditor', filterButton: true },
    ],
    rows: data.rows.map(row => [
      row.customerId,
      row.customerName,
      row.attributeName,
      row.result,
      row.observation || '',
      row.auditorName,
    ]),
  });

  // Auto-fit columns
  resultsSheet.columns.forEach(column => {
    column.width = Math.max(column.width || 10, 15);
  });

  // Observations Sheet
  const observationsSheet = workbook.addWorksheet('Observations');
  observationsSheet.addTable({
    name: 'ObservationsTable',
    ref: 'A1',
    // ... similar structure
  });

  // Questions to LOB Sheet
  const questionsSheet = workbook.addWorksheet('Questions to LOB');
  // ...

  return workbook;
}
```

**Formatting Requirements:**
- All data sheets must use Excel Table format
- Enable filter buttons on all columns
- Auto-fit column widths
- Apply alternating row colors
- Freeze header row
- Add summary/totals row where applicable

---

## 7. AI-Generated Sampling Rationale

### Source Prompt (Anonymized)
From the Statistical Sampling Tool HTML file, the following prompt should be used:

```typescript
const SAMPLING_RATIONALE_PROMPT = `You are an AML Audit documentation assistant. Using ONLY the information provided below (do not assume anything not explicitly present), write a narrative sampling summary suitable for inclusion in an AML audit workpaper.

The data is structured into four main sections plus an overrides section. Your narrative MUST follow the same structure with corresponding headings.

SECTION 1 - SAMPLE SOURCE:
- Use the sample_source description text EXACTLY and VERBATIM - do not paraphrase or modify this language in any way.

SECTION 2 - STRATIFICATION:
- Describe the stratification approach based on the stratum column details.
- If no stratification was applied, state this clearly.
- Include the number of strata and their categories.

SECTION 3 - SAMPLE SIZE CALCULATION:
- Document the statistical parameters used (confidence level, margin of error, expected error rate).
- Explain how the sample size was determined.
- Include any adjustments made for finite population correction.

SECTION 4 - SAMPLE ALLOCATION:
- Describe how samples were allocated across strata.
- Document whether proportional or disproportional allocation was used.
- Include the final sample sizes per stratum.

SECTION 5 - OVERRIDES (if applicable):
- Document any manual overrides to the statistical calculation.
- Include the justification for each override.

IMPORTANT RULES:
- Do not cite external standards or regulators unless they are mentioned in the data.
- Do not fabricate details about AML program, customer types, transaction volumes, or time periods unless explicitly stated.
- Any text marked as "VERBATIM" in rationale_notes or justification fields MUST be included word-for-word in your output.
- IMPORTANT: When describing what is not available or not specified, use natural phrasing like "was not specified", "was not provided", or "is not available". Do NOT use phrases like "the JSON provided" or "in the JSON" - write as if describing the sampling exercise directly.`;
```

### Implementation

**Files to Create/Modify:**
- `src/lib/ai/sampling-rationale.ts` (NEW)
- `src/app/aic/audit-runs/[id]/stage-2/page.tsx`
- `src/components/stage-2/sampling-config.tsx`

**UI Addition:**
```tsx
// Add button to Stage 2 sampling page
<Button
  onClick={generateSamplingRationale}
  disabled={isGenerating}
  className="gap-2"
>
  <Sparkles className="h-4 w-4" />
  {isGenerating ? 'Generating Rationale...' : 'Generate Sampling Rationale'}
</Button>

// Display area for generated rationale
<Card className="mt-4">
  <CardHeader>
    <CardTitle>AI-Generated Sampling Rationale</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="prose prose-invert max-w-none">
      {samplingRationale ? (
        <ReactMarkdown>{samplingRationale}</ReactMarkdown>
      ) : (
        <p className="text-white/50">Click "Generate Sampling Rationale" to create audit documentation.</p>
      )}
    </div>
    {samplingRationale && (
      <Button variant="outline" onClick={copyToClipboard} className="mt-4">
        <Copy className="h-4 w-4 mr-2" />
        Copy to Clipboard
      </Button>
    )}
  </CardContent>
</Card>
```

**API Call:**
```typescript
async function generateSamplingRationale(samplingConfig: SamplingConfig): Promise<string> {
  const contextData = {
    sample_source: {
      description: "Audit independently sourced the population from the client's system of record.",
      population_size: samplingConfig.populationSize,
      date_range: samplingConfig.dateRange,
    },
    stratification: samplingConfig.stratification,
    sample_size_calculation: {
      confidence_level: samplingConfig.confidenceLevel,
      margin_of_error: samplingConfig.marginOfError,
      expected_error_rate: samplingConfig.expectedErrorRate,
      calculated_size: samplingConfig.calculatedSampleSize,
    },
    allocation: samplingConfig.allocation,
    overrides: samplingConfig.overrides,
  };

  const response = await anthropicClient.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    messages: [{
      role: "user",
      content: `${SAMPLING_RATIONALE_PROMPT}\n\n---\n\nSAMPLING DATA:\n${JSON.stringify(contextData, null, 2)}`
    }],
  });

  return response.content[0].text;
}
```

---

## 8. AI-Generated Testing Summary

### Purpose
Generate a comprehensive summary of testing results for audit documentation.

### Implementation

**Files to Create/Modify:**
- `src/lib/ai/testing-summary.ts` (NEW)
- `src/app/aic/audit-runs/[id]/consolidation/page.tsx`
- `src/components/stage-4/consolidation-dashboard.tsx`

**Prompt:**
```typescript
const TESTING_SUMMARY_PROMPT = `You are an AML Audit documentation assistant. Based on the testing results provided below, write a comprehensive summary suitable for inclusion in audit workpapers.

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
```

**UI Addition:**
```tsx
// Add to consolidation page
<Card>
  <CardHeader className="flex flex-row items-center justify-between">
    <div>
      <CardTitle>AI-Generated Testing Summary</CardTitle>
      <CardDescription>Comprehensive audit documentation of testing results</CardDescription>
    </div>
    <Button onClick={generateTestingSummary} disabled={isGenerating}>
      <Sparkles className="h-4 w-4 mr-2" />
      Generate Summary
    </Button>
  </CardHeader>
  <CardContent>
    {testingSummary ? (
      <>
        <div className="prose prose-invert max-w-none">
          <ReactMarkdown>{testingSummary}</ReactMarkdown>
        </div>
        <div className="flex gap-2 mt-4">
          <Button variant="outline" onClick={copyToClipboard}>
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
          <Button variant="outline" onClick={exportToWord}>
            <FileText className="h-4 w-4 mr-2" />
            Export to Word
          </Button>
        </div>
      </>
    ) : (
      <p className="text-white/50">
        Click "Generate Summary" to create comprehensive audit documentation of testing results.
      </p>
    )}
  </CardContent>
</Card>
```

**Data to Pass to AI:**
```typescript
interface TestingSummaryInput {
  auditRunId: string;
  auditRunName: string;
  testingPeriod: { start: Date; end: Date };

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
    failureType: 'Regulatory' | 'Procedural';
    failureReason: string;
  }>;

  auditorMetrics: Array<{
    auditorName: string;
    rowsCompleted: number;
    passRate: number;
  }>;
}
```

---

## Implementation Priority Order

1. **Critical - Fix First:**
   - [ ] AI API Integration Fixes (blocking other AI features)
   - [ ] Auditor Workbook Dropdown Changes (core workflow change)

2. **High Priority:**
   - [ ] Multiple Observations in Consolidation
   - [ ] Questions to LOB Demo Data
   - [ ] Excel Table Formatting

3. **Medium Priority:**
   - [ ] AI-Generated Sampling Rationale
   - [ ] AI-Generated Testing Summary
   - [ ] Charts in Live Monitoring

4. **Lower Priority:**
   - [ ] Charts in Excel Export
   - [ ] Additional dashboard enhancements

---

## Testing Checklist

After implementing each feature:

- [ ] Verify AI API calls succeed (check console for errors)
- [ ] Test with demo data population
- [ ] Verify all observations display in consolidation
- [ ] Test Excel export opens correctly in Excel
- [ ] Verify tables have filters enabled
- [ ] Test sampling rationale generation
- [ ] Test testing summary generation
- [ ] Verify charts render correctly
- [ ] Test responsive behavior
- [ ] Check dark mode styling

---

## Notes for Implementation

1. **Install Dependencies if Needed:**
```bash
npm install recharts exceljs react-markdown
```

2. **Environment Variables:**
Ensure `.env.local` has:
```env
ANTHROPIC_API_KEY=your-key-here
```

3. **Type Safety:**
Update all TypeScript interfaces before implementing features.

4. **Error Handling:**
All AI calls should have proper error handling with user-friendly messages.

5. **Loading States:**
Add loading spinners/skeletons for all async operations.

---

*Document Version: 1.0*
*Created: 2026-02-05*
*Author: Claude Code*
