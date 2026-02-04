/**
 * Sampling Engine
 * Statistical sampling algorithms for audit testing
 */

// Types
export interface SamplingConfig {
  method: "statistical" | "random" | "systematic" | "percentage";
  confidence: number; // 0-1 (e.g., 0.95 for 95%)
  margin: number; // 0-1 (e.g., 0.05 for 5%)
  expectedErrorRate: number; // 0-1 (e.g., 0.01 for 1%)
  sampleSize?: number; // Override
  samplePercentage?: number; // For percentage method
  seed: number;
  stratifyFields: string[];
  idColumn?: string;
  systematicRandomStart?: boolean;
}

export interface StratumAllocation {
  key: string;
  stratum: Record<string, unknown>;
  populationCount: number;
  sampleCount: number;
  shareOfPopulation: number;
  shareOfSample: number;
}

export interface SamplingPlan {
  allocations: StratumAllocation[];
  plannedSize: number;
  desiredSize: number;
  stratifyFields: string[];
  populationSize: number;
}

export interface SamplingSummary {
  generatedAt: string;
  sampleSource: {
    fileName?: string;
    sheetName?: string;
    rowCount: number;
  };
  definePopulation: {
    totalPopulationSize: number;
    stratifyFields: string[];
    strataDetails: Array<{
      stratum: Record<string, unknown>;
      populationCount: number;
      shareOfPopulation: number;
    }>;
  };
  samplingRationale: {
    method: string;
    confidenceLevel: number;
    tolerableErrorRate: number;
    expectedErrorRate: number;
  };
  sampleSelectionMethod: {
    method: string;
    seed: number;
    originalCalculatedSampleSize: number;
    finalSampleSize: number;
    allocationsByStratum: StratumAllocation[];
  };
  sampleIds?: string[];
}

export interface SamplingResult {
  sample: Record<string, unknown>[];
  summary: SamplingSummary;
  plan: SamplingPlan;
}

// Z-score lookup for common confidence levels
function zScore(confidence: number): number {
  const c = Math.max(0.001, Math.min(0.999, confidence));
  // Using approximation - for full accuracy, would use statistical library
  if (Math.abs(c - 0.95) < 0.001) return 1.96;
  if (Math.abs(c - 0.99) < 0.001) return 2.576;
  if (Math.abs(c - 0.90) < 0.001) return 1.645;
  if (Math.abs(c - 0.85) < 0.001) return 1.44;
  if (Math.abs(c - 0.80) < 0.001) return 1.28;
  // Default for other values
  return 2.576;
}

// Calculate sample size using standard statistical formula
export function calculateSampleSize(
  populationSize: number,
  confidence: number,
  margin: number,
  expectedErrorRate: number
): number {
  if (populationSize <= 0) return 0;

  const z = zScore(confidence);
  const p = expectedErrorRate;
  const e = margin;

  // Cochran's formula with finite population correction
  const n0 = (z * z * p * (1 - p)) / (e * e);
  const n = n0 / (1 + (n0 - 1) / populationSize);

  return Math.min(populationSize, Math.max(1, Math.ceil(n)));
}

// Seeded random number generator (Mulberry32)
function createRng(seed: number): () => number {
  let t = seed >>> 0;
  return function () {
    t += 0x6d2b79f5;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

// Fisher-Yates shuffle with seeded RNG
function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Random sampling
function randomSample<T>(arr: T[], size: number, rng: () => number): T[] {
  if (size <= 0) return [];
  const take = Math.min(arr.length, size);
  return shuffle(arr, rng).slice(0, take);
}

// Systematic sampling
function systematicSample<T>(
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

  return indices.map((i) => arr[i]);
}

// Normalize value for grouping (handle nulls consistently)
const MISSING_VALUE = "__NULL__";
function normalizeValue(v: unknown): string {
  if (v === null || v === undefined || v === "") return MISSING_VALUE;
  return String(v);
}

// Create consistent key for stratification
function normalizeKey(values: unknown[]): string {
  return JSON.stringify(values.map((v) => normalizeValue(v)));
}

// Proportional allocation across strata
function proportionalAllocation(
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

  return Object.fromEntries(base.entries());
}

// Resolve sample size based on method and config
export function resolveSampleSize(
  populationSize: number,
  config: SamplingConfig
): number {
  if (populationSize <= 0) return 0;

  // Override takes precedence
  if (config.sampleSize != null && config.sampleSize > 0) {
    return Math.min(populationSize, Math.floor(config.sampleSize));
  }

  let size = 0;

  switch (config.method) {
    case "statistical":
      size = calculateSampleSize(
        populationSize,
        config.confidence,
        config.margin,
        config.expectedErrorRate
      );
      break;
    case "percentage":
      if (config.samplePercentage == null) {
        throw new Error("samplePercentage is required for percentage method");
      }
      size = Math.ceil(populationSize * (config.samplePercentage / 100));
      break;
    case "random":
      if (config.samplePercentage != null) {
        size = Math.ceil(populationSize * (config.samplePercentage / 100));
      } else {
        size = calculateSampleSize(
          populationSize,
          config.confidence,
          config.margin,
          config.expectedErrorRate
        );
      }
      break;
    case "systematic":
      if (config.samplePercentage != null) {
        size = Math.ceil(populationSize * (config.samplePercentage / 100));
      } else {
        size = calculateSampleSize(
          populationSize,
          config.confidence,
          config.margin,
          config.expectedErrorRate
        );
      }
      break;
    default:
      throw new Error(`Unsupported method: ${config.method}`);
  }

  return Math.max(0, Math.min(populationSize, Math.floor(size)));
}

// Compute sampling plan (allocation per stratum)
export function computePlan(
  population: Record<string, unknown>[],
  config: SamplingConfig
): SamplingPlan {
  const popSize = population.length;
  const desiredSize = resolveSampleSize(popSize, config);

  if (desiredSize <= 0) {
    throw new Error("Calculated sample size is 0. Adjust parameters.");
  }

  // No stratification - single allocation
  if (!config.stratifyFields.length) {
    const sampleCount = Math.min(popSize, desiredSize);
    return {
      allocations: [
        {
          key: "__all__",
          stratum: {},
          populationCount: popSize,
          sampleCount,
          shareOfPopulation: 1,
          shareOfSample: 1,
        },
      ],
      plannedSize: sampleCount,
      desiredSize,
      stratifyFields: [],
      populationSize: popSize,
    };
  }

  // Build groups by stratification fields
  const groups: Record<string, Record<string, unknown>[]> = {};
  for (const row of population) {
    const key = normalizeKey(config.stratifyFields.map((f) => row[f]));
    if (!groups[key]) groups[key] = [];
    groups[key].push(row);
  }

  const counts = Object.fromEntries(
    Object.entries(groups).map(([k, arr]) => [k, arr.length])
  );

  const allocationsMap = proportionalAllocation(counts, desiredSize);

  const allocations: StratumAllocation[] = Object.entries(groups).map(
    ([k, arr]) => {
      const values = JSON.parse(k).map((v: string) =>
        v === MISSING_VALUE ? null : v
      );
      const stratum: Record<string, unknown> = {};
      config.stratifyFields.forEach((f, i) => (stratum[f] = values[i]));

      const sampleCount = allocationsMap[k] || 0;
      const totalAllocated = Object.values(allocationsMap).reduce(
        (s, v) => s + v,
        0
      );

      return {
        key: k,
        stratum,
        populationCount: arr.length,
        sampleCount,
        shareOfPopulation: arr.length / popSize,
        shareOfSample: totalAllocated > 0 ? sampleCount / totalAllocated : 0,
      };
    }
  );

  const plannedSize = allocations.reduce((s, a) => s + a.sampleCount, 0);

  return {
    allocations,
    plannedSize,
    desiredSize,
    stratifyFields: config.stratifyFields.slice(),
    populationSize: popSize,
  };
}

// Execute sampling
export function executeSampling(
  population: Record<string, unknown>[],
  config: SamplingConfig,
  plan?: SamplingPlan
): SamplingResult {
  const samplingPlan = plan || computePlan(population, config);
  const rng = createRng(config.seed);

  let sample: Record<string, unknown>[] = [];
  const updatedAllocations: StratumAllocation[] = [];

  if (!config.stratifyFields.length) {
    // No stratification
    const take = samplingPlan.plannedSize;
    if (config.method === "systematic") {
      sample = systematicSample(
        population,
        take,
        config.systematicRandomStart ?? true,
        rng
      );
    } else {
      sample = randomSample(population, take, rng);
    }

    updatedAllocations.push({
      key: "__all__",
      stratum: {},
      populationCount: population.length,
      sampleCount: sample.length,
      shareOfPopulation: 1,
      shareOfSample: 1,
    });
  } else {
    // Stratified sampling
    const groups: Record<string, Record<string, unknown>[]> = {};
    for (const row of population) {
      const key = normalizeKey(config.stratifyFields.map((f) => row[f]));
      if (!groups[key]) groups[key] = [];
      groups[key].push(row);
    }

    for (const allocation of samplingPlan.allocations) {
      const groupRows = groups[allocation.key] || [];
      const allocCount = allocation.sampleCount;

      if (allocCount <= 0) {
        updatedAllocations.push({
          ...allocation,
          sampleCount: 0,
          shareOfSample: 0,
        });
        continue;
      }

      let chosen: Record<string, unknown>[];
      if (config.method === "systematic") {
        chosen = systematicSample(
          groupRows,
          allocCount,
          config.systematicRandomStart ?? true,
          rng
        );
      } else {
        chosen = randomSample(groupRows, allocCount, rng);
      }

      sample.push(...chosen);

      updatedAllocations.push({
        ...allocation,
        sampleCount: chosen.length,
        shareOfSample:
          samplingPlan.plannedSize > 0
            ? chosen.length / samplingPlan.plannedSize
            : 0,
      });
    }
  }

  // Build summary
  const summary: SamplingSummary = {
    generatedAt: new Date().toISOString(),
    sampleSource: {
      rowCount: population.length,
    },
    definePopulation: {
      totalPopulationSize: population.length,
      stratifyFields: config.stratifyFields,
      strataDetails: updatedAllocations.map((a) => ({
        stratum: a.stratum,
        populationCount: a.populationCount,
        shareOfPopulation: a.shareOfPopulation,
      })),
    },
    samplingRationale: {
      method: config.method,
      confidenceLevel: config.confidence,
      tolerableErrorRate: config.margin,
      expectedErrorRate: config.expectedErrorRate,
    },
    sampleSelectionMethod: {
      method: config.method,
      seed: config.seed,
      originalCalculatedSampleSize: samplingPlan.desiredSize,
      finalSampleSize: sample.length,
      allocationsByStratum: updatedAllocations,
    },
  };

  // Add sample IDs if ID column specified
  if (config.idColumn) {
    summary.sampleIds = sample.map((r) => String(r[config.idColumn!] || ""));
  }

  return {
    sample,
    summary,
    plan: {
      ...samplingPlan,
      allocations: updatedAllocations,
      plannedSize: sample.length,
    },
  };
}

// Get mock population data for demo - generates 10,000 records
export function getMockPopulationData(): Record<string, unknown>[] {
  const jurisdictions = ["US", "UK", "CA", "DE", "FR", "JP", "AU", "SG", "HK", "CH"];
  const riskLevels = ["Low", "Medium", "High"];
  const entityTypes = ["Individual", "Corporation", "Partnership", "Trust", "LLC", "Foundation"];
  const segments = ["Retail", "SMB", "Mid-Market", "Enterprise", "Institutional"];
  const industries = ["Financial Services", "Technology", "Healthcare", "Manufacturing", "Retail", "Energy", "Real Estate"];

  const data: Record<string, unknown>[] = [];

  // Use seeded random for consistent demo data
  const seededRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  for (let i = 1; i <= 10000; i++) {
    const seed = i * 12345;
    data.push({
      RecordID: `REC-${String(i).padStart(5, "0")}`,
      EntityName: `Entity ${i}`,
      Jurisdiction: jurisdictions[i % jurisdictions.length],
      RiskLevel: riskLevels[Math.floor(seededRandom(seed) * riskLevels.length)],
      EntityType: entityTypes[i % entityTypes.length],
      Segment: segments[Math.floor(seededRandom(seed + 1) * segments.length)],
      Industry: industries[Math.floor(seededRandom(seed + 2) * industries.length)],
      AccountValue: Math.round(seededRandom(seed + 3) * 1000000) / 100,
      OnboardingDate: new Date(
        2023,
        Math.floor(seededRandom(seed + 4) * 12),
        Math.floor(seededRandom(seed + 5) * 28) + 1
      )
        .toISOString()
        .split("T")[0],
      LastReviewDate: new Date(
        2024,
        Math.floor(seededRandom(seed + 6) * 12),
        Math.floor(seededRandom(seed + 7) * 28) + 1
      )
        .toISOString()
        .split("T")[0],
      Status: seededRandom(seed + 8) > 0.1 ? "Active" : "Inactive",
      ReviewCycle: seededRandom(seed + 9) > 0.7 ? "Annual" : seededRandom(seed + 10) > 0.4 ? "Semi-Annual" : "Quarterly",
    });
  }

  return data;
}
