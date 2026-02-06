/**
 * AI-Generated Sampling Rationale
 * Generates audit documentation for sampling methodology
 */

import OpenAI from 'openai';

// Prompt for generating sampling rationale narrative
export const SAMPLING_RATIONALE_PROMPT = `You are an AML Audit documentation assistant. Using ONLY the information provided below (do not assume anything not explicitly present), write a narrative sampling summary suitable for inclusion in an AML audit workpaper.

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

// Interface for sampling configuration input
export interface SamplingRationaleConfig {
  populationSize: number;
  dateRange?: { start: string; end: string };
  fileName?: string;
  stratification?: {
    enabled: boolean;
    fields: string[];
    strata: Array<{
      name: string;
      stratum: Record<string, unknown>;
      population: number;
      sampleSize: number;
    }>;
  };
  confidenceLevel: number;
  marginOfError: number;
  expectedErrorRate: number;
  calculatedSampleSize: number;
  finalSampleSize: number;
  method: string;
  seed: number;
  allocation?: string;
  overrides?: {
    hasOverrides: boolean;
    justification?: string;
    populationOverride?: { original: number; value: number };
    sampleSizeOverride?: { calculated: number; value: number };
    coverageOverrides?: Array<{
      stratum: Record<string, unknown>;
      added: number;
    }>;
  };
}

// Result interface
export interface SamplingRationaleResult {
  success: boolean;
  rationale?: string;
  error?: string;
  demoMode?: boolean;
}

/**
 * Build context data for the AI prompt from sampling configuration
 */
function buildContextData(config: SamplingRationaleConfig): Record<string, unknown> {
  const contextData: Record<string, unknown> = {
    sample_source: {
      description: "Audit independently sourced the population from the client's system of record.",
      population_size: config.populationSize,
      file_name: config.fileName || "Not specified",
      date_range: config.dateRange || null,
    },
    stratification: config.stratification?.enabled
      ? {
          enabled: true,
          fields: config.stratification.fields,
          stratum_count: config.stratification.strata.length,
          strata: config.stratification.strata.map((s) => ({
            name: s.name || Object.entries(s.stratum).map(([k, v]) => `${k}: ${v ?? 'NULL'}`).join(', '),
            stratum_values: s.stratum,
            population_count: s.population,
            sample_count: s.sampleSize,
            share_of_population: config.populationSize > 0
              ? ((s.population / config.populationSize) * 100).toFixed(2) + '%'
              : '0%',
          })),
        }
      : {
          enabled: false,
          note: "No stratification was applied to the population.",
        },
    sample_size_calculation: {
      method: config.method,
      confidence_level: `${(config.confidenceLevel * 100).toFixed(0)}%`,
      tolerable_error_rate: `${(config.marginOfError * 100).toFixed(1)}%`,
      expected_error_rate: `${(config.expectedErrorRate * 100).toFixed(1)}%`,
      calculated_sample_size: config.calculatedSampleSize,
      final_sample_size: config.finalSampleSize,
      random_seed: config.seed,
      formula_used: "Cochran's formula with finite population correction",
    },
    allocation: {
      method: config.stratification?.enabled ? "Proportional allocation across strata" : "Simple random selection",
      description: config.allocation || "Samples were allocated proportionally based on stratum population sizes.",
    },
    overrides: config.overrides?.hasOverrides
      ? {
          has_overrides: true,
          justification: config.overrides.justification || "No justification provided",
          population_override: config.overrides.populationOverride
            ? {
                original_value: config.overrides.populationOverride.original,
                override_value: config.overrides.populationOverride.value,
              }
            : null,
          sample_size_override: config.overrides.sampleSizeOverride
            ? {
                calculated_value: config.overrides.sampleSizeOverride.calculated,
                override_value: config.overrides.sampleSizeOverride.value,
              }
            : null,
          coverage_overrides: config.overrides.coverageOverrides || [],
        }
      : {
          has_overrides: false,
          note: "No manual overrides were applied to the statistical calculation.",
        },
  };

  return contextData;
}

/**
 * Generate sampling rationale using AI
 */
export async function generateSamplingRationale(
  config: SamplingRationaleConfig
): Promise<SamplingRationaleResult> {
  const contextData = buildContextData(config);

  // Check for API key
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.log('[AI] No OPENAI_API_KEY found, using demo mode');
    return {
      success: true,
      demoMode: true,
      rationale: getDemoSamplingRationale(config),
    };
  }

  try {
    const client = new OpenAI({ apiKey });
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: `${SAMPLING_RATIONALE_PROMPT}\n\n---\n\nSAMPLING DATA:\n${JSON.stringify(contextData, null, 2)}`,
        },
      ],
      max_tokens: 2000,
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content in AI response");
    }

    return {
      success: true,
      rationale: content,
    };
  } catch (error) {
    console.error('[AI] Sampling rationale generation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      demoMode: true,
      rationale: getDemoSamplingRationale(config),
    };
  }
}

/**
 * Generate demo sampling rationale when AI is not available
 */
function getDemoSamplingRationale(config: SamplingRationaleConfig): string {
  const hasStrata = config.stratification?.enabled && config.stratification.strata.length > 0;
  const hasOverrides = config.overrides?.hasOverrides;

  const strataDescription = hasStrata
    ? `The population was stratified into ${config.stratification!.strata.length} categories based on the following field(s): ${config.stratification!.fields.join(', ')}.\n\n` +
      config.stratification!.strata.map((s, idx) => {
        const name = Object.entries(s.stratum).map(([k, v]) => `${k}: ${v ?? 'NULL'}`).join(', ') || '(All)';
        return `- **Stratum ${idx + 1}** (${name}): Population of ${s.population.toLocaleString()}, sample size of ${s.sampleSize.toLocaleString()}`;
      }).join('\n')
    : 'No stratification was applied to the population. The sample was selected from the entire population as a single group.';

  const overridesDescription = hasOverrides
    ? `\n### Manual Overrides Applied\n\n${config.overrides!.justification ? `**Justification:** ${config.overrides!.justification}\n\n` : ''}` +
      (config.overrides!.populationOverride
        ? `- **Population Override:** Changed from ${config.overrides!.populationOverride.original.toLocaleString()} to ${config.overrides!.populationOverride.value.toLocaleString()}\n`
        : '') +
      (config.overrides!.sampleSizeOverride
        ? `- **Sample Size Override:** Changed from calculated ${config.overrides!.sampleSizeOverride.calculated.toLocaleString()} to ${config.overrides!.sampleSizeOverride.value.toLocaleString()}\n`
        : '') +
      (config.overrides!.coverageOverrides?.length
        ? `- **Coverage Overrides:** Added +1 sample to ${config.overrides!.coverageOverrides.length} stratum/strata for complete coverage\n`
        : '')
    : 'No manual overrides were applied to the statistical calculation.';

  return `## SAMPLE SOURCE

Audit independently sourced the population from the client's system of record. The total population consists of **${config.populationSize.toLocaleString()}** entities${config.fileName ? ` from file "${config.fileName}"` : ''}.${config.dateRange ? ` The data covers the period from ${config.dateRange.start} to ${config.dateRange.end}.` : ''}

## STRATIFICATION

${strataDescription}

## SAMPLE SIZE CALCULATION

The sample size was calculated using standard statistical sampling methodology based on Cochran's formula with finite population correction:

| Parameter | Value |
|-----------|-------|
| **Sampling Method** | ${config.method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} |
| **Confidence Level** | ${(config.confidenceLevel * 100).toFixed(0)}% |
| **Tolerable Error Rate (Margin of Error)** | ${(config.marginOfError * 100).toFixed(1)}% |
| **Expected Error Rate** | ${(config.expectedErrorRate * 100).toFixed(1)}% |
| **Calculated Sample Size** | ${config.calculatedSampleSize.toLocaleString()} |
| **Final Sample Size** | ${config.finalSampleSize.toLocaleString()} |
| **Random Seed** | ${config.seed} |

The sample size calculation ensures that the audit can achieve the specified confidence level while maintaining the tolerable error rate threshold. The finite population correction was applied as the sample represents a significant portion of the population.

## SAMPLE ALLOCATION

${config.allocation || (hasStrata
  ? 'Proportional allocation was used to distribute samples across strata. Each stratum received a sample size proportional to its share of the total population, ensuring representative coverage.'
  : 'Simple random selection was applied to the entire population using a seeded random number generator (Mulberry32 PRNG) for reproducibility.')}

## OVERRIDES

${overridesDescription}

---

*This sampling rationale was generated for audit documentation purposes. ${hasOverrides ? 'All overrides have been documented with justification as required by audit standards.' : 'The sampling methodology follows standard statistical principles.'}*`;
}

/**
 * Export context builder for testing
 */
export { buildContextData };
