/**
 * Original Sampling Engine
 *
 * This module contains the EXACT algorithms lifted from the
 * Statistical Sampling Tool (with ReadMe).html reference implementation.
 *
 * DO NOT MODIFY these algorithms - they are intentionally kept identical
 * to the original HTML tool for 1:1 parity.
 */

// ============================================================================
// CONSTANTS (from line 26345)
// ============================================================================
const MISSING_VALUE = "<MISSING>";

// ============================================================================
// TYPES
// ============================================================================
export interface SamplingConfig {
  method: "statistical" | "simple_random" | "systematic" | "percentage";
  confidence: number; // 0-1 (e.g., 0.95 for 95%)
  margin: number; // Tolerable Error Rate as decimal (e.g., 0.05 for 5%)
  expectedErrorRate: number; // 0-1 (e.g., 0.01 for 1%)
  sampleSize?: number | null; // Override
  samplePercentage?: number | null; // For percentage method
  systematicStep?: number | null; // For systematic method
  systematicRandomStart?: boolean;
  seed: number;
  stratifyFields: string[];
  idColumn?: string;
  overrideJustification?: string;
  populationOverride?: number | null;
}

export interface StratumAllocation {
  key: string;
  stratum: Record<string, unknown>;
  population_count: number;
  sample_count: number;
  original_sample_count: number;
  share_of_population?: number;
  share_of_sample?: number;
  proportional_allocation?: number;
  allocation_difference?: number;
}

export interface CoverageOverride {
  stratum: Record<string, unknown>;
  original_sample_count: number;
  adjusted_to: number;
  justification: string;
}

export interface SamplingPlan {
  allocations: StratumAllocation[];
  plannedSize: number;
  desiredSize: number;
  stratifyFields: string[];
  populationSize?: number;
  signature?: string;
  coverageOverrides: CoverageOverride[];
}

export interface OverridesSection {
  has_overrides: boolean;
  justification: string | null;
  parameter_overrides: {
    population_size: { applied: boolean; value?: number; original?: number };
    sample_size: { applied: boolean; value?: number };
    sample_percentage: { applied: boolean; value?: number };
    systematic_step: { applied: boolean; value?: number };
  };
  coverage_overrides: CoverageOverride[];
  allocation_adjustments: Array<{
    stratum: Record<string, unknown>;
    proportional_allocation: number;
    actual_allocation: number;
    difference: number;
  }>;
}

export interface SamplingSummary {
  generated_at_utc: string;
  sample_source: {
    description: string;
    file_name?: string;
    sheet_name?: string;
  };
  define_population: {
    total_population_size: number;
    stratify_fields: string[];
    population_distribution: Array<{
      stratum: Record<string, unknown>;
      count: number;
      share: number;
    }>;
    strata_details: Array<{
      stratum: Record<string, unknown>;
      population_count: number;
      share_of_population: number;
    }>;
  };
  sampling_rationale: {
    sampling_method: string;
    confidence_level: number;
    tolerable_error_rate: number;
    expected_error_rate: number;
    rationale_notes: {
      confidence_level: string;
      tolerable_error_rate: string;
      expected_error_rate: string;
      stratification: string;
    };
  };
  sample_selection_method: {
    method: string;
    seed: number;
    systematic_random_start?: boolean;
    original_calculated_sample_size: number;
    final_sample_size: number;
    sample_distribution: Array<{
      stratum: Record<string, unknown>;
      count: number;
      share: number;
    }>;
    allocations_by_stratum: StratumAllocation[];
  };
  overrides: OverridesSection;
  sample_ids?: unknown[];
}

export interface SamplingResult {
  sample: Record<string, unknown>[];
  summary: SamplingSummary;
  plan: SamplingPlan;
}

// ============================================================================
// Z-SCORE CALCULATION (from lines 24506-24553)
// Wald CI with special-case override for 99% confidence
// Falls back to Abramowitz-Stegun approximation if jStat not available
// ============================================================================
export function zScore(conf: number): number {
  const alpha = 1 - conf;

  // Per spec: 99% confidence uses exactly 2.58
  if (Math.abs(conf - 0.99) < 1e-9) return 2.58;

  // Abramowitz-Stegun approximation for inverse normal CDF
  // This is the fallback when jStat is not available
  const p = 1 - alpha / 2;
  const a1 = -39.6968302866538,
    a2 = 220.946098424521,
    a3 = -275.928510446969;
  const a4 = 138.357751867269,
    a5 = -30.6647980661472,
    a6 = 2.50662827745924;
  const b1 = -54.4760987982241,
    b2 = 161.585836858041,
    b3 = -155.698979859887;
  const b4 = 66.8013118877197,
    b5 = -13.2806815528857;
  const c1 = -0.00778489400243029,
    c2 = -0.322396458041136,
    c3 = -2.40075827716184;
  const c4 = -2.54973253934373,
    c5 = 4.37466414146497,
    c6 = 2.93816398269878;
  const d1 = 0.00778469570904146,
    d2 = 0.32246712907004,
    d3 = 2.445134137143,
    d4 = 3.75440866190742;
  const plow = 0.02425;
  const phigh = 1 - plow;

  let q: number, r: number;
  if (p < plow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
      ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
  } else if (p > phigh) {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
      ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
  }
  q = p - 0.5;
  r = q * q;
  return (((((a1 * r + a2) * r + a3) * r + a4) * r + a5) * r + a6) * q /
    (((((b1 * r + b2) * r + b3) * r + b4) * r + b5) * r + 1);
}

// ============================================================================
// SAMPLE SIZE CALCULATION (from lines 24563-24576)
// Wald CI + Finite Population Correction
// ============================================================================
export function sampleSize(N: number, conf: number, TER: number, EER: number): number {
  if (!(N >= 1)) throw new Error('Population must be >= 1');
  if (!(conf > 0 && conf < 1)) throw new Error('Confidence must be in (0,1)');
  if (!(TER > 0 && TER < 1)) throw new Error('Tolerable error rate must be in (0,1)');
  if (!(EER >= 0 && EER < 1)) throw new Error('Expected error rate must be in [0,1)');

  const p = EER;
  const E = TER - EER;
  if (!(E > 0)) throw new Error('Tolerable error rate must exceed expected error rate.');

  const z = zScore(conf);
  const n0 = (z * z * p * (1 - p)) / (E * E);
  const nCalc = Math.ceil((N * n0) / (N + n0 - 1));
  return Math.max(1, Math.min(N, nCalc));
}

// ============================================================================
// SEEDED RNG - Mulberry32 (from lines 26713-26721)
// ============================================================================
export function rngFactory(seed: number = 42): () => number {
  let t = seed >>> 0;
  return function() {
    t += 0x6D2B79F5;
    let r = t;
    r = Math.imul(r ^ r >>> 15, r | 1);
    r ^= r + Math.imul(r ^ r >>> 7, r | 61);
    return ((r ^ r >>> 14) >>> 0) / 4294967296;
  };
}

// ============================================================================
// FISHER-YATES SHUFFLE (from lines 26724-26731)
// ============================================================================
export function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ============================================================================
// RANDOM SAMPLING (from lines 26733-26737)
// ============================================================================
export function randomSample<T>(arr: T[], size: number, rng: () => number): T[] {
  if (size <= 0) return [];
  const take = Math.min(arr.length, size);
  return shuffle(arr, rng).slice(0, take);
}

// ============================================================================
// SYSTEMATIC SAMPLING (from lines 26739-26749)
// ============================================================================
export function systematicSample<T>(
  arr: T[],
  size: number,
  randomStart: boolean,
  rng: () => number
): T[] {
  const n = arr.length;
  if (size <= 0) return [];
  if (size >= n) return arr.slice();
  const offset = randomStart ? Math.floor(rng() * Math.ceil(n / size)) : 0;
  const indices: number[] = [];
  for (let k = 0; k < size; k++) {
    const base = Math.floor((k * n) / size);
    indices.push((base + offset) % n);
  }
  return indices.map(i => arr[i]);
}

// ============================================================================
// VALUE NORMALIZATION (from lines 26416-26421)
// ============================================================================
function normalizeValue(value: unknown): unknown {
  if (value === null || value === undefined || (typeof value === 'number' && Number.isNaN(value))) {
    return MISSING_VALUE;
  }
  return value;
}

// ============================================================================
// KEY NORMALIZATION FOR STRATIFICATION (from line 26793-26795)
// ============================================================================
function normalizeKey(values: unknown[]): string {
  return JSON.stringify(values.map(v => normalizeValue(v)));
}

// ============================================================================
// RESOLVE SAMPLE SIZE (from lines 26765-26791)
// ============================================================================
export function resolveSampleSize(N: number, cfg: SamplingConfig): number {
  if (N <= 0) return 0;
  const method = cfg.method;
  let size = 0;

  const overrideSize = cfg.sampleSize != null && Number.isFinite(cfg.sampleSize)
    ? Math.max(0, Math.min(N, Math.floor(cfg.sampleSize)))
    : null;
  if (overrideSize !== null) return overrideSize;

  if (method === 'statistical') {
    size = sampleSize(N, cfg.confidence, cfg.margin, cfg.expectedErrorRate);
  } else if (method === 'percentage') {
    if (cfg.samplePercentage == null) throw new Error('samplePercentage is required for percentage sampling.');
    size = Math.ceil(N * (cfg.samplePercentage / 100));
  } else if (method === 'simple_random') {
    if (cfg.sampleSize == null && cfg.samplePercentage == null) {
      throw new Error('Provide sampleSize or samplePercentage for simple_random.');
    }
    size = cfg.sampleSize != null ? cfg.sampleSize : Math.ceil(N * ((cfg.samplePercentage ?? 0) / 100));
  } else if (method === 'systematic') {
    if (cfg.sampleSize != null) {
      size = cfg.sampleSize;
    } else if (cfg.samplePercentage != null) {
      size = Math.ceil(N * (cfg.samplePercentage / 100));
    } else {
      size = sampleSize(N, cfg.confidence, cfg.margin, cfg.expectedErrorRate);
    }
  } else {
    throw new Error(`Unsupported method ${method}`);
  }
  return Math.max(0, Math.min(N, Math.floor(size)));
}

// ============================================================================
// PROPORTIONAL ALLOCATION (from lines 26797-26843)
// ============================================================================
export function proportionalAllocation(
  countsMap: Record<string, number>,
  totalSize: number
): Record<string, number> {
  const entries = Object.entries(countsMap);
  if (!entries.length || totalSize <= 0) {
    return Object.fromEntries(entries.map(([k]) => [k, 0]));
  }

  const total = entries.reduce((s, [, c]) => s + c, 0);
  const raw = entries.map(([k, c]) => [k, (c / total) * totalSize] as [string, number]);
  const base = new Map<string, number>(raw.map(([k, v]) => [k, Math.floor(v)]));

  let remainder = totalSize - Array.from(base.values()).reduce((s, v) => s + v, 0);

  if (remainder > 0) {
    const fractional = raw
      .map(([k, v]) => [k, v - Math.floor(v)] as [string, number])
      .sort((a, b) => b[1] - a[1]);
    for (let i = 0; i < fractional.length && remainder > 0; i++, remainder--) {
      const key = fractional[i][0];
      base.set(key, (base.get(key) || 0) + 1);
    }
  }

  // Cap by stratum size
  for (const [k, c] of entries) {
    if ((base.get(k) || 0) > c) base.set(k, c);
  }

  // Adjust downward if over
  let current = Array.from(base.values()).reduce((s, v) => s + v, 0);
  while (current > totalSize) {
    const sorted = Array.from(base.entries()).sort((a, b) => b[1] - a[1]);
    for (const [k, v] of sorted) {
      if (current <= totalSize) break;
      if (v > 0) {
        base.set(k, v - 1);
        current -= 1;
      }
    }
  }

  // Redistribute if under and capacity exists
  const target = Math.min(totalSize, total);
  while (current < target) {
    let increased = false;
    for (const [k, c] of entries.sort((a, b) => b[1] - a[1])) {
      if (current >= target) break;
      const have = base.get(k) || 0;
      if (have < c) {
        base.set(k, have + 1);
        current += 1;
        increased = true;
      }
    }
    if (!increased) break;
  }

  return Object.fromEntries(base.entries());
}

// ============================================================================
// DISTRIBUTION CALCULATION (from lines 26845-26859)
// ============================================================================
function distribution(
  rows: Record<string, unknown>[],
  fields: string[]
): Array<{ stratum: Record<string, unknown>; count: number; share: number }> {
  if (!fields.length || !rows.length) return [];
  const counts: Record<string, number> = {};
  for (const row of rows) {
    const key = normalizeKey(fields.map(f => row[f]));
    counts[key] = (counts[key] || 0) + 1;
  }
  const total = rows.length;
  return Object.entries(counts).map(([key, count]) => {
    const values = JSON.parse(key).map((v: unknown) => v === MISSING_VALUE ? null : v);
    const stratum: Record<string, unknown> = {};
    fields.forEach((f, i) => stratum[f] = values[i]);
    return { stratum, count, share: count / total };
  });
}

// ============================================================================
// CONFIG SIGNATURE (from lines 26998-27009)
// ============================================================================
function configSignature(cfg: SamplingConfig): string {
  return JSON.stringify({
    method: cfg.method,
    confidence: cfg.confidence,
    margin: cfg.margin,
    expectedErrorRate: cfg.expectedErrorRate,
    sampleSize: cfg.sampleSize,
    samplePercentage: cfg.samplePercentage,
    systematicStep: cfg.systematicStep,
    stratifyFields: cfg.stratifyFields,
  });
}

// ============================================================================
// COMPUTE PLAN (from lines 27011-27068)
// ============================================================================
export function computePlan(
  population: Record<string, unknown>[],
  cfg: SamplingConfig
): SamplingPlan {
  const popSize = population.length;
  const effectivePop = cfg.populationOverride != null && cfg.populationOverride > 0
    ? cfg.populationOverride
    : popSize;
  const desiredSize = resolveSampleSize(effectivePop, cfg);

  if (desiredSize <= 0) throw new Error('Calculated sample size is 0. Adjust parameters.');

  if (!cfg.stratifyFields.length) {
    const sampleCount = Math.min(effectivePop, desiredSize);
    return {
      allocations: [
        {
          key: '__all__',
          stratum: {},
          population_count: effectivePop,
          sample_count: sampleCount,
          original_sample_count: sampleCount,
        },
      ],
      plannedSize: sampleCount,
      desiredSize,
      stratifyFields: [],
      coverageOverrides: [],
    };
  }

  const groups: Record<string, Record<string, unknown>[]> = {};
  for (const row of population) {
    const key = normalizeKey(cfg.stratifyFields.map(f => row[f]));
    if (!groups[key]) groups[key] = [];
    groups[key].push(row);
  }

  const counts = Object.fromEntries(
    Object.entries(groups).map(([k, arr]) => [k, arr.length])
  );
  const allocationsMap = proportionalAllocation(counts, desiredSize);

  const allocations: StratumAllocation[] = Object.entries(groups).map(([k, arr]) => {
    const values = JSON.parse(k).map((v: unknown) => v === MISSING_VALUE ? null : v);
    const stratum: Record<string, unknown> = {};
    cfg.stratifyFields.forEach((f, i) => stratum[f] = values[i]);
    const sampleCount = allocationsMap[k] || 0;
    return {
      key: k,
      stratum,
      population_count: arr.length,
      sample_count: sampleCount,
      original_sample_count: sampleCount,
    };
  });

  const plannedSize = allocations.reduce((s, a) => s + a.sample_count, 0);

  return {
    allocations,
    plannedSize,
    desiredSize,
    stratifyFields: cfg.stratifyFields.slice(),
    populationSize: population.length,
    signature: configSignature(cfg),
    coverageOverrides: [],
  };
}

// ============================================================================
// ADD COVERAGE OVERRIDE (+1 to zero strata) (from lines 27122-27137)
// ============================================================================
export function addCoverageOverrides(plan: SamplingPlan): SamplingPlan {
  const overrides: CoverageOverride[] = [];
  for (const alloc of plan.allocations) {
    if (alloc.sample_count === 0 && alloc.population_count > 0) {
      overrides.push({
        stratum: { ...alloc.stratum },
        original_sample_count: 0,
        adjusted_to: 1,
        justification: 'Override made to allow for sampling coverage across all observed strata in the population',
      });
      alloc.sample_count = 1;
    }
  }
  plan.coverageOverrides = (plan.coverageOverrides || []).concat(overrides);
  plan.plannedSize = plan.allocations.reduce((s, a) => s + a.sample_count, 0);
  return plan;
}

// ============================================================================
// STRATIFIED SAMPLE (from lines 27155-27196)
// ============================================================================
function stratifiedSample(
  rows: Record<string, unknown>[],
  cfg: SamplingConfig,
  rng: () => number,
  desiredSize: number,
  allocationOverrides: Record<string, number> | null = null
): { sample: Record<string, unknown>[]; allocations: StratumAllocation[] } {
  const fields = cfg.stratifyFields;
  const effectivePop = cfg.populationOverride != null && cfg.populationOverride > 0
    ? cfg.populationOverride
    : rows.length;
  const totalSize = desiredSize ?? resolveSampleSize(effectivePop, cfg);

  if (totalSize <= 0) return { sample: [], allocations: [] };

  const groups: Record<string, Record<string, unknown>[]> = {};
  for (const row of rows) {
    const key = normalizeKey(fields.map(f => row[f]));
    if (!groups[key]) groups[key] = [];
    groups[key].push(row);
  }

  const counts = Object.fromEntries(
    Object.entries(groups).map(([k, arr]) => [k, arr.length])
  );
  const allocations = allocationOverrides || proportionalAllocation(counts, totalSize);
  const actualTotal = Object.values(allocations).reduce((s, v) => s + v, 0);

  const samples: Record<string, unknown>[] = [];
  const allocationSummary: StratumAllocation[] = [];

  for (const [key, groupRows] of Object.entries(groups)) {
    const alloc = allocations[key] || 0;
    if (alloc <= 0) {
      // Still add to summary with 0 count
      const values = JSON.parse(key).map((v: unknown) => v === MISSING_VALUE ? null : v);
      const stratum: Record<string, unknown> = {};
      fields.forEach((f, i) => stratum[f] = values[i]);
      allocationSummary.push({
        key,
        stratum,
        population_count: groupRows.length,
        sample_count: 0,
        original_sample_count: 0,
        share_of_population: groupRows.length / rows.length,
        share_of_sample: 0,
      });
      continue;
    }

    let chosen: Record<string, unknown>[];
    if (cfg.method === 'systematic') {
      chosen = systematicSample(groupRows, alloc, cfg.systematicRandomStart ?? true, rng);
    } else {
      chosen = randomSample(groupRows, alloc, rng);
    }

    const values = JSON.parse(key).map((v: unknown) => v === MISSING_VALUE ? null : v);
    const stratum: Record<string, unknown> = {};
    fields.forEach((f, i) => stratum[f] = values[i]);

    allocationSummary.push({
      key,
      stratum,
      population_count: groupRows.length,
      sample_count: chosen.length,
      original_sample_count: alloc,
      share_of_population: groupRows.length / rows.length,
      share_of_sample: chosen.length / (actualTotal || 1),
    });
    samples.push(...chosen);
  }

  return { sample: samples, allocations: allocationSummary };
}

// ============================================================================
// BUILD SUMMARY (from lines 27198-27305)
// ============================================================================
function buildSummary(
  population: Record<string, unknown>[],
  sample: Record<string, unknown>[],
  allocations: StratumAllocation[],
  cfg: SamplingConfig,
  plannedSize: number,
  plan: SamplingPlan | null,
  fileName?: string,
  sheetName?: string
): SamplingSummary {
  const coverageOverrides = plan?.coverageOverrides || [];
  const planAllocations = plan?.allocations || [];

  // Build allocations with difference tracking
  const allocationsWithDiff = allocations.map(alloc => {
    const planAlloc = planAllocations.find(
      p => JSON.stringify(p.stratum) === JSON.stringify(alloc.stratum)
    );
    const proportionalAlloc = planAlloc ? planAlloc.original_sample_count : alloc.sample_count;
    const allocationDifference = alloc.sample_count - proportionalAlloc;

    return {
      ...alloc,
      proportional_allocation: proportionalAlloc,
      allocation_difference: allocationDifference,
    };
  });

  // Calculate original planned size
  const originalPlannedSize = plan?.allocations
    ? plan.allocations.reduce((s, a) => s + (a.original_sample_count ?? a.sample_count), 0)
    : plannedSize;

  // Build consolidated overrides section
  const hasPopulationOverride = cfg.populationOverride != null && cfg.populationOverride > 0;
  const hasSampleSizeOverride = cfg.sampleSize != null;
  const hasSamplePercentageOverride = cfg.samplePercentage != null;
  const hasSystematicStepOverride = cfg.systematicStep != null;

  // Calculate allocation adjustments
  const allocationAdjustments = allocationsWithDiff
    .filter(a => a.allocation_difference !== 0)
    .map(a => ({
      stratum: a.stratum,
      proportional_allocation: a.proportional_allocation!,
      actual_allocation: a.sample_count,
      difference: a.allocation_difference!,
    }));

  const hasAnyOverride = hasPopulationOverride ||
    hasSampleSizeOverride ||
    hasSamplePercentageOverride ||
    hasSystematicStepOverride ||
    coverageOverrides.length > 0 ||
    allocationAdjustments.length > 0;

  const overridesSection: OverridesSection = {
    has_overrides: hasAnyOverride,
    justification: cfg.overrideJustification || null,
    parameter_overrides: {
      population_size: hasPopulationOverride
        ? { applied: true, value: cfg.populationOverride!, original: population.length }
        : { applied: false },
      sample_size: hasSampleSizeOverride
        ? { applied: true, value: cfg.sampleSize! }
        : { applied: false },
      sample_percentage: hasSamplePercentageOverride
        ? { applied: true, value: cfg.samplePercentage! }
        : { applied: false },
      systematic_step: hasSystematicStepOverride
        ? { applied: true, value: cfg.systematicStep! }
        : { applied: false },
    },
    coverage_overrides: coverageOverrides,
    allocation_adjustments: allocationAdjustments,
  };

  return {
    generated_at_utc: new Date().toISOString(),

    sample_source: {
      description: "Corporate Audit independently pulled the population derived from the Audit developed Tableau Dashboard, sourced from the Global Banking and Global Markets (GBGM) ALM System of Record (SOR) - AWARE (AIT #70743)",
      file_name: fileName,
      sheet_name: sheetName,
    },

    define_population: {
      total_population_size: population.length,
      stratify_fields: cfg.stratifyFields,
      population_distribution: distribution(population, cfg.stratifyFields),
      strata_details: allocationsWithDiff.map(a => ({
        stratum: a.stratum,
        population_count: a.population_count,
        share_of_population: a.share_of_population || 0,
      })),
    },

    sampling_rationale: {
      sampling_method: cfg.method,
      confidence_level: cfg.confidence,
      tolerable_error_rate: cfg.margin,
      expected_error_rate: cfg.expectedErrorRate,
      rationale_notes: {
        confidence_level: `A ${(cfg.confidence * 100).toFixed(0)}% confidence level means we are ${(cfg.confidence * 100).toFixed(0)}% confident that the sample results reflect the population within the specified tolerable error rate.`,
        tolerable_error_rate: `The tolerable error rate of ${(cfg.margin * 100).toFixed(1)}% represents the maximum acceptable deviation from the expected error rate.`,
        expected_error_rate: `The expected error rate of ${(cfg.expectedErrorRate * 100).toFixed(1)}% is based on historical performance or professional judgment.`,
        stratification: cfg.stratifyFields.length > 0
          ? `Stratification by ${cfg.stratifyFields.join(', ')} ensures proportional representation across risk-relevant categories.`
          : 'No stratification applied - population treated as homogeneous.',
      },
    },

    sample_selection_method: {
      method: cfg.method,
      seed: cfg.seed,
      systematic_random_start: cfg.systematicRandomStart,
      original_calculated_sample_size: originalPlannedSize,
      final_sample_size: sample.length,
      sample_distribution: distribution(sample, cfg.stratifyFields),
      allocations_by_stratum: allocationsWithDiff,
    },

    overrides: overridesSection,

    sample_ids: cfg.idColumn ? sample.map(r => r[cfg.idColumn!]) : undefined,
  };
}

// ============================================================================
// MAIN SAMPLING FUNCTION (from lines 27307-27336)
// ============================================================================
export function sampleData(
  population: Record<string, unknown>[],
  cfg: SamplingConfig,
  plan: SamplingPlan | null = null,
  fileName?: string,
  sheetName?: string
): SamplingResult {
  const desiredSize = plan
    ? plan.allocations.reduce((s, a) => s + a.sample_count, 0)
    : resolveSampleSize(population.length, cfg);

  if (desiredSize <= 0 && population.length > 0) {
    throw new Error('Calculated sample size is 0. Adjust parameters.');
  }

  const rng = rngFactory(cfg.seed ?? 42);
  let sample: Record<string, unknown>[] = [];
  let allocations: StratumAllocation[] = [];

  if (cfg.stratifyFields.length) {
    const overrideMap = plan
      ? Object.fromEntries(plan.allocations.map(a => [a.key, a.sample_count]))
      : null;
    ({ sample, allocations } = stratifiedSample(population, cfg, rng, desiredSize, overrideMap));
  } else {
    const take = plan ? Math.min(desiredSize, population.length) : desiredSize;
    if (cfg.method === 'systematic') {
      sample = systematicSample(population, take, cfg.systematicRandomStart ?? true, rng);
    } else {
      sample = randomSample(population, take, rng);
    }
    allocations = [{
      key: '__all__',
      stratum: {},
      population_count: population.length,
      sample_count: sample.length,
      original_sample_count: sample.length,
      share_of_population: 1,
      share_of_sample: 1,
    }];
  }

  const summary = buildSummary(
    population,
    sample,
    allocations,
    cfg,
    desiredSize,
    plan,
    fileName,
    sheetName
  );

  return {
    sample,
    summary,
    plan: plan || {
      allocations,
      plannedSize: sample.length,
      desiredSize,
      stratifyFields: cfg.stratifyFields,
      populationSize: population.length,
      coverageOverrides: [],
    },
  };
}

// ============================================================================
// HELPER: Check if config has overrides (from lines 26992-26997)
// Modified to be method-aware: for simple_random and percentage methods,
// sampleSize/samplePercentage are required inputs, not overrides.
// ============================================================================
export function hasOverrides(cfg: SamplingConfig): boolean {
  // Population override is always an override
  if (cfg.populationOverride != null && cfg.populationOverride > 0) {
    return true;
  }

  // Systematic step is always an override when provided
  if (cfg.systematicStep != null) {
    return true;
  }

  // For simple_random method: sampleSize or samplePercentage are REQUIRED, not overrides
  if (cfg.method === 'simple_random') {
    // These are required for simple_random, so don't count them as overrides
    return false;
  }

  // For percentage method: samplePercentage is REQUIRED, not an override
  if (cfg.method === 'percentage') {
    // samplePercentage is required for percentage method, so only sampleSize is an override
    return cfg.sampleSize != null;
  }

  // For statistical and systematic methods: sampleSize/samplePercentage are overrides
  return cfg.sampleSize != null || cfg.samplePercentage != null;
}

// ============================================================================
// BACKWARD COMPATIBILITY: Convert old config format to new
// ============================================================================
export function convertLegacyConfig(oldConfig: {
  method: "statistical" | "random" | "systematic" | "percentage";
  confidence: number;
  margin: number;
  expectedErrorRate: number;
  sampleSize?: number;
  samplePercentage?: number;
  seed: number;
  stratifyFields: string[];
  idColumn?: string;
  systematicRandomStart?: boolean;
}): SamplingConfig {
  return {
    method: oldConfig.method === "random" ? "simple_random" : oldConfig.method,
    confidence: oldConfig.confidence,
    margin: oldConfig.margin,
    expectedErrorRate: oldConfig.expectedErrorRate,
    sampleSize: oldConfig.sampleSize ?? null,
    samplePercentage: oldConfig.samplePercentage ?? null,
    systematicStep: null,
    systematicRandomStart: oldConfig.systematicRandomStart ?? true,
    seed: oldConfig.seed,
    stratifyFields: oldConfig.stratifyFields,
    idColumn: oldConfig.idColumn,
    overrideJustification: undefined,
    populationOverride: null,
  };
}

// ============================================================================
// CALCULATE SAMPLE SIZE (public wrapper for UI)
// ============================================================================
export function calculateSampleSize(
  populationSize: number,
  confidence: number,
  tolerableErrorRate: number,
  expectedErrorRate: number
): number {
  return sampleSize(populationSize, confidence, tolerableErrorRate, expectedErrorRate);
}
