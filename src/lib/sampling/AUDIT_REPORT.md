# Sampling Calculator Audit Report

**Generated**: 2026-02-04
**Auditor**: AGENT-1
**Reference Tool**: `Statistical Sampling Tool (with ReadMe).html`
**Current Implementation**: `src/lib/sampling/engine.ts` and Stage-2 components

---

## Executive Summary

This audit compares the current React/TypeScript sampling implementation against the reference HTML-based Statistical Sampling Tool. The analysis reveals several significant gaps in algorithm parity, UI features, and functionality that need to be addressed for a 1:1 replica.

**Overall Assessment**: The current implementation covers ~60% of the reference tool's functionality.

---

## 1. Algorithm Parity Analysis

### 1.1 Z-Score Lookup

| Confidence Level | Reference HTML Tool | Current Implementation | Status |
|-----------------|---------------------|------------------------|--------|
| 90% | 1.645 (via jStat fallback) | 1.645 | MATCH |
| 95% | 1.96 (via jStat) | 1.96 | MATCH |
| 99% | 2.58 (hardcoded special case) | 2.576 | MISMATCH |
| Other values | Uses `jStat.normal.inv()` | Returns 2.576 as default | GAP |

**Findings**:
- The reference tool uses jStat library for precise normal quantile calculation
- Current implementation uses hardcoded values with a fallback of 2.576 for unlisted confidence levels
- Reference tool specifically hardcodes 99% confidence as 2.58 per spec (not 2.576)

**Reference Code** (lines 24506-24510):
```javascript
function zScore(conf) {
  const alpha = 1 - conf;
  if (Math.abs(conf - 0.99) < 1e-9) return 2.58; // per spec
  // fall back to precise normal quantile (two-sided)
  if (typeof jStat !== 'undefined' && jStat.normal && jStat.normal.inv) {
    return jStat.normal.inv(1 - alpha / 2, 0, 1);
  }
```

**Current Code** (lines 76-86):
```typescript
function zScore(confidence: number): number {
  const c = Math.max(0.001, Math.min(0.999, confidence));
  if (Math.abs(c - 0.95) < 0.001) return 1.96;
  if (Math.abs(c - 0.99) < 0.001) return 2.576;  // Should be 2.58
  if (Math.abs(c - 0.90) < 0.001) return 1.645;
  if (Math.abs(c - 0.85) < 0.001) return 1.44;
  if (Math.abs(c - 0.80) < 0.001) return 1.28;
  return 2.576;  // Should use jStat for arbitrary values
}
```

### 1.2 Sample Size Formula

| Aspect | Reference Tool | Current Implementation | Status |
|--------|---------------|------------------------|--------|
| Base Formula | Wald CI + FPC | Cochran's formula + FPC | MINOR DIFFERENCE |
| Parameters | N, conf, TER, EER | populationSize, confidence, margin, expectedErrorRate | MATCH |
| Precision calculation | E = TER - EER | e = margin | SEMANTIC DIFFERENCE |

**Key Difference**: The reference tool calculates precision `E` as `TER - EER` (Tolerable Error Rate minus Expected Error Rate), while the current implementation uses `margin` directly as the precision value.

**Reference Code** (lines 24567-24576):
```javascript
const p = EER;
const E = TER - EER;
if (!(E > 0)) throw new Error('Tolerable error rate must exceed expected error rate.');

const z = zScore(conf);
const n0 = (z * z * p * (1 - p)) / (E * E);
const nCalc = Math.ceil((N * n0) / (N + n0 - 1));
return Math.max(1, Math.min(N, nCalc));
```

**Current Code** (lines 89-106):
```typescript
const z = zScore(confidence);
const p = expectedErrorRate;
const e = margin;

// Cochran's formula with finite population correction
const n0 = (z * z * p * (1 - p)) / (e * e);
const n = n0 / (1 + (n0 - 1) / populationSize);

return Math.min(populationSize, Math.max(1, Math.ceil(n)));
```

### 1.3 Proportional Allocation

| Feature | Reference | Current | Status |
|---------|-----------|---------|--------|
| Base allocation | Floor of proportional | Floor of proportional | MATCH |
| Remainder distribution | Largest fractional first | Largest fractional first | MATCH |
| Cap by stratum size | Yes | Yes | MATCH |

**Status**: Proportional allocation logic is functionally equivalent.

### 1.4 Sampling Methods

| Method | Reference | Current | Status |
|--------|-----------|---------|--------|
| Statistical | Yes | Yes | MATCH |
| Simple Random | Yes (`simple_random`) | Yes (`random`) | NAME MISMATCH |
| Systematic | Yes | Yes | MATCH |
| Percentage | Yes | Yes | MATCH |

**Note**: The reference tool uses `simple_random` as the method name, current uses `random`.

### 1.5 Random Number Generator

| Feature | Reference | Current | Status |
|---------|-----------|---------|--------|
| Algorithm | Mulberry32 | Mulberry32 | MATCH |
| Seed support | Yes | Yes | MATCH |
| Fisher-Yates shuffle | Yes | Yes | MATCH |

---

## 2. UI Feature Gaps

### 2.1 Missing UI Features

| Feature | Reference Tool | Current Implementation | Priority |
|---------|---------------|------------------------|----------|
| Theme Toggle (Dark/Light) | Yes - with localStorage persistence | No | Medium |
| Override Justification Modal | Yes - warning modal with confirmation | No | HIGH |
| Justification Text Field | Yes - required for overrides | No | HIGH |
| Population Size Override | Yes - separate input field | No | HIGH |
| Sample Percentage Input | Yes - dedicated field | Partial (in percentage method) | Medium |
| Systematic Step Override | Yes - dedicated field | No | Medium |
| Recent Uploads List | Yes - persisted with localStorage | No | Low |
| File Metadata Display | Yes - size, modified date | Partial | Low |
| Edit Randomizer Toggle | Yes - collapsible section | No | Low |
| Copy Prompt Button | Yes - copies AI prompt | No | Low |
| Toast Notifications | Yes - custom toast system | Yes (via sonner) | MATCH |
| Floating Particles Animation | Yes - decorative | No | Very Low |
| Collapsible Methodology Section | Yes - with localStorage | No | Low |

### 2.2 Export Functionality Comparison

| Export Type | Reference Tool | Current Implementation | Status |
|-------------|---------------|------------------------|--------|
| CSV Download | Yes (`downloadCsv`) | Yes (`exportToCSV`) | MATCH |
| JSON Summary Download | Yes (`downloadJson`) | Yes (`exportSummaryToJSON`) | MATCH |
| Excel Export | No | No | N/A |
| AI Prompt Export | Yes - for audit narrative | No | GAP |

### 2.3 Input Fields Comparison

| Field | Reference | Current | Status |
|-------|-----------|---------|--------|
| Confidence Level | Number input (50-99.9) | Number input (80-99) | RANGE DIFFERENCE |
| Tolerable Error Rate | Number input (0.01-100) | Number input (1-20) | RANGE DIFFERENCE |
| Expected Error Rate | Number input (0-100) | Number input (0-50) | RANGE DIFFERENCE |
| Sample Size Override | Optional number | Optional number | MATCH |
| Sample Percentage | Optional number | Conditional (percentage method) | GAP |
| Systematic Step | Optional number | No | GAP |
| ID Column | Typeahead input | Select dropdown | MINOR |
| Stratify Fields | Typeahead with chips | Select with badges | MATCH |

### 2.4 Configuration Form Differences

**Reference Tool** has these additional fields not in current implementation:
1. **Population Size Override** - Allows testing sample sizing with different population assumptions
2. **Sample Percentage** - Available for all methods, not just percentage-based
3. **Systematic Step** - Explicit interval control for systematic sampling
4. **Override Justification** - Required text field when any override is used

---

## 3. Missing Features Analysis

### 3.1 Override Justification System - HIGH PRIORITY

**Reference Implementation**:
- Displays justification field when any override is detected
- Shows warning modal before proceeding with overrides
- Includes justification in JSON summary output
- Tracks multiple types of overrides:
  - Population size override
  - Sample size override
  - Sample percentage override
  - Systematic step override
  - Coverage overrides (+1 to zero strata)
  - Allocation adjustments

**Current Implementation**: None

**Required Changes**:
- Add `overrideJustification` field to `SamplingConfig` interface
- Add UI components for justification input
- Add validation to require justification when overrides detected
- Add override confirmation modal

### 3.2 Coverage Override (+1 to Zero Strata) - HIGH PRIORITY

**Reference Implementation** (lines 27120-27131):
```javascript
state.plan.allocations.forEach(alloc => {
  if (alloc.sample_count === 0 && alloc.population_count > 0) {
    overrides.push({
      stratum: { ...alloc.stratum },
      original_sample_count: 0,
      adjusted_to: 1,
      justification: 'Override made to allow for sampling coverage across all observed strata in the population',
    });
    alloc.sample_count = 1;
  }
});
```

**Current Implementation**: None

**Required Changes**:
- Add "Add +1 to zero strata" button in plan view
- Track coverage overrides in plan object
- Include in summary output

### 3.3 Sample Source Description - MEDIUM PRIORITY

**Reference Implementation** includes a hardcoded description for audit documentation:
```javascript
sample_source: {
  description: "Corporate Audit independently pulled the population derived from the Audit developed Tableau Dashboard...",
  file_name: state.fileName,
  sheet_name: state.sheetName,
}
```

**Current Implementation**: Only includes `rowCount`, no `description` field.

### 3.4 AI Summary Prompt - MEDIUM PRIORITY

**Reference Tool** includes:
- Pre-written prompt for AI-assisted audit narrative generation
- Copy-to-clipboard functionality
- Structured sections matching audit workpaper requirements

**Current Implementation**: None

### 3.5 MUS (Monetary Unit Sampling) - NOT PRESENT IN EITHER

Neither the reference tool nor the current implementation includes MUS sampling. This appears to be out of scope for this comparison.

### 3.6 Population Size Override - HIGH PRIORITY

**Reference Feature**: Allows overriding the detected population size for testing sample calculations with different assumptions.

**Current Status**: Not implemented

---

## 4. Data Structure Differences

### 4.1 Summary Object Comparison

**Reference Tool Summary Structure**:
```javascript
{
  generated_at_utc: string,
  sample_source: {
    description: string,
    file_name: string,
    sheet_name: string
  },
  define_population: {
    total_population_size: number,
    stratify_fields: string[],
    strata_details: [...]
  },
  sampling_rationale: {
    method: string,
    confidence_level: number,
    tolerable_error_rate: number,
    expected_error_rate: number,
    rationale_notes: {...}
  },
  sample_selection_method: {
    method: string,
    seed: number,
    systematic_random_start: boolean,
    original_calculated_sample_size: number,
    final_sample_size: number,
    allocations_by_stratum: [...],
    allocation_deviations: [...]
  },
  overrides: {
    has_overrides: boolean,
    justification: string,
    parameter_overrides: {...},
    coverage_overrides: [...],
    allocation_adjustments: [...]
  }
}
```

**Current Implementation Summary Structure**:
```typescript
{
  generatedAt: string,
  sampleSource: {
    fileName?: string,
    sheetName?: string,
    rowCount: number
  },
  definePopulation: {...},
  samplingRationale: {...},
  sampleSelectionMethod: {...},
  sampleIds?: string[]
}
```

**Key Missing Fields**:
- `sample_source.description`
- `overrides` section (entire)
- `allocation_deviations`
- `rationale_notes`

---

## 5. Recommendations

### 5.1 Critical (Must Fix)

1. **Fix Z-Score for 99% Confidence**
   - Change line 80 in `engine.ts` from `2.576` to `2.58`
   - Location: `src/lib/sampling/engine.ts:80`

2. **Add Override Justification System**
   - Add `overrideJustification: string` to `SamplingConfig` interface
   - Add UI input in `sampling-config.tsx`
   - Add validation logic to require justification

3. **Add Population Override Support**
   - Add `populationOverride?: number` to config
   - Modify `resolveSampleSize()` to use override when present
   - Add UI input field

4. **Add Coverage Override Feature**
   - Add button to add +1 to strata with 0 allocations
   - Track overrides in plan object
   - Include in summary

### 5.2 High Priority

5. **Align Method Names**
   - Change `random` to `simple_random` for consistency

6. **Add Override Confirmation Modal**
   - Create modal component warning about overrides
   - Require confirmation before proceeding

7. **Integrate jStat Library**
   - Add jStat for accurate z-score calculation at arbitrary confidence levels
   - Or implement inverse normal CDF approximation

8. **Add Systematic Step Override**
   - Add optional `systematicStep` parameter
   - Use in systematic sampling when provided

### 5.3 Medium Priority

9. **Add Theme Toggle**
   - Implement dark/light mode toggle
   - Persist preference to localStorage

10. **Add Sample Source Description**
    - Add editable description field for audit documentation

11. **Add AI Summary Prompt**
    - Implement prompt display/copy feature
    - Match reference tool's prompt structure

12. **Expand Input Ranges**
    - Confidence: 50-99.9 (not 80-99)
    - Tolerable Error: 0.01-100 (not 1-20)
    - Expected Error: 0-100 (not 0-50)

### 5.4 Low Priority

13. **Add Recent Uploads List**
14. **Add Edit Randomizer Toggle Section**
15. **Add Collapsible Methodology Section**

---

## 6. Code Change Summary

### Files Requiring Modifications:

| File | Changes Required |
|------|-----------------|
| `src/lib/sampling/engine.ts` | Z-score fix, add override tracking, method name alignment |
| `src/components/stage-2/sampling-config.tsx` | Add override fields, justification input, population override |
| `src/components/stage-2/sample-preview.tsx` | Add override display, coverage override button |
| New: `src/components/ui/override-modal.tsx` | Override confirmation modal |

### Estimated Effort:
- Critical fixes: 4-6 hours
- High priority: 8-12 hours
- Medium priority: 6-8 hours
- Low priority: 4-6 hours
- **Total**: 22-32 hours

---

## 7. Appendix: Reference File Locations

- **Reference HTML Tool**: `Statistical Sampling Tool (with ReadMe).html`
  - Sampling algorithms: Lines 24500-24600
  - UI configuration: Lines 26040-26120
  - Proportional allocation: Lines 26797-26815
  - Stratified sampling: Lines 27155-27195
  - Summary builder: Lines 27198-27300
  - Override tracking: Lines 27220-27250

- **Current Implementation**:
  - Engine: `src/lib/sampling/engine.ts`
  - Population Uploader: `src/components/stage-2/population-uploader.tsx`
  - Sampling Config: `src/components/stage-2/sampling-config.tsx`
  - Sample Preview: `src/components/stage-2/sample-preview.tsx`

---

*End of Audit Report*
