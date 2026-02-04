/**
 * Fallback Data Module
 * Provides realistic fallback/demo data for each stage
 */

import {
  setStageData,
  GapAssessmentResult,
  GapItem,
  SamplingResult,
  ExtractedAttribute,
  TestResult,
} from "./store";
import { getMockGapAssessmentResult, getMockStandardsComparisonResult, getMockAttributeExtractionResult } from "@/lib/ai/client";
import { getMockAttributes } from "@/lib/workbook/builder";
import { getMockConsolidation } from "@/lib/consolidation/engine";
import { mockAttributes, mockGenerationReviewRows } from "@/lib/attribute-library/mock-data";
import type { WorkbookState } from "@/lib/workbook/builder";

/**
 * Get fallback Gap Assessment 1 result (Old GFC vs New GFC)
 */
export function getFallbackGapAssessment1(): GapAssessmentResult {
  return getMockStandardsComparisonResult();
}

/**
 * Get fallback Gap Assessment 2 result (New GFC vs FLU Procedures)
 */
export function getFallbackGapAssessment2(): GapAssessmentResult {
  return getMockGapAssessmentResult();
}

/**
 * Get fallback combined gaps from both assessments
 */
export function getFallbackCombinedGaps(): GapItem[] {
  const gaps: GapItem[] = [];

  // From assessment 1 (standards comparison)
  const assessment1 = getFallbackGapAssessment1();
  const gapSheet1 = assessment1.workbook.sheets.find(s => s.name === 'Gap_Details');
  if (gapSheet1?.rows) {
    gapSheet1.rows.forEach(row => {
      gaps.push({
        Gap_ID: String(row.Change_ID || ''),
        Disposition: String(row.Change_Type || ''),
        Severity: String(row.Impact || ''),
        Standard_Requirement_ID: String(row.Old_Requirement_ID || ''),
        Standard_Requirement_Text: String(row.Change_Description || ''),
        Procedure_Reference_ID: String(row.Current_Requirement_ID || ''),
        Gap_Description: String(row.Change_Description || ''),
        Recommended_Remediation: '',
        Confidence: String(row.Confidence || ''),
      });
    });
  }

  // From assessment 2 (gap assessment)
  const assessment2 = getFallbackGapAssessment2();
  const gapSheet2 = assessment2.workbook.sheets.find(s => s.name === 'Gap_Details');
  if (gapSheet2?.rows) {
    gapSheet2.rows.forEach(row => {
      gaps.push({
        Gap_ID: String(row.Gap_ID || ''),
        Disposition: String(row.Disposition || ''),
        Severity: String(row.Severity || ''),
        Standard_Requirement_ID: String(row.Standard_Requirement_ID || ''),
        Standard_Requirement_Text: String(row.Standard_Requirement_Text || ''),
        Procedure_Reference_ID: String(row.Procedure_Reference_ID || ''),
        Gap_Description: String(row.Gap_Description || ''),
        Recommended_Remediation: String(row.Recommended_Remediation || ''),
        Confidence: String(row.Confidence || ''),
      });
    });
  }

  return gaps;
}

/**
 * Get fallback population data (10,000 records based on synthetic_onboarding_data structure)
 */
export function getFallbackPopulation(): Record<string, unknown>[] {
  // Generate 10,000 synthetic records
  const population: Record<string, unknown>[] = [];
  const entityTypes = ['Corporation', 'LLC', 'Partnership', 'Trust', 'Individual'];
  const jurisdictions = ['US', 'UK', 'SG', 'HK', 'CA', 'AU'];
  const riskRatings = ['Low', 'Medium', 'High', 'Critical'];
  const industries = ['Financial Services', 'Manufacturing', 'Technology', 'Healthcare', 'Retail', 'Real Estate', 'Energy'];

  for (let i = 1; i <= 10000; i++) {
    const entityType = entityTypes[Math.floor(Math.random() * entityTypes.length)];
    const jurisdiction = jurisdictions[Math.floor(Math.random() * jurisdictions.length)];
    const riskRating = riskRatings[Math.floor(Math.random() * riskRatings.length)];
    const industry = industries[Math.floor(Math.random() * industries.length)];

    // Generate random date in 2023-2024
    const year = 2023 + Math.floor(Math.random() * 2);
    const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
    const onboardingDate = `${year}-${month}-${day}`;

    population.push({
      RecordID: `REC-${String(i).padStart(5, '0')}`,
      EntityName: `Entity ${i}`,
      EntityType: entityType,
      Jurisdiction: jurisdiction,
      RiskRating: riskRating,
      Industry: industry,
      OnboardingDate: onboardingDate,
      IRR: (Math.random() * 5 + 1).toFixed(2),
      DRR: (Math.random() * 5 + 1).toFixed(2),
      AnnualRevenue: Math.floor(Math.random() * 10000000) + 100000,
      EmployeeCount: Math.floor(Math.random() * 5000) + 10,
      LastReviewDate: onboardingDate,
      ReviewStatus: 'Pending',
    });
  }

  return population;
}

/**
 * Get fallback sampling result
 */
export function getFallbackSamplingResult(): SamplingResult {
  const population = getFallbackPopulation();
  // Statistical sample of ~50 items (sample size based on 95% confidence, 5% margin)
  const sampleSize = 50;
  const sample: Record<string, unknown>[] = [];

  // Stratified sampling by risk rating
  const riskGroups = {
    Low: population.filter(p => p.RiskRating === 'Low'),
    Medium: population.filter(p => p.RiskRating === 'Medium'),
    High: population.filter(p => p.RiskRating === 'High'),
    Critical: population.filter(p => p.RiskRating === 'Critical'),
  };

  // Sample proportionally from each group
  Object.values(riskGroups).forEach(group => {
    const groupSampleSize = Math.ceil((group.length / population.length) * sampleSize);
    for (let i = 0; i < groupSampleSize && i < group.length; i++) {
      const randomIndex = Math.floor(Math.random() * group.length);
      const item = group[randomIndex];
      if (!sample.includes(item)) {
        sample.push({ ...item, SamplingIndex: sample.length + 1 });
      }
    }
  });

  const finalSample = sample.slice(0, sampleSize);
  const riskDistribution = {
    Low: finalSample.filter(s => s.RiskRating === 'Low').length,
    Medium: finalSample.filter(s => s.RiskRating === 'Medium').length,
    High: finalSample.filter(s => s.RiskRating === 'High').length,
    Critical: finalSample.filter(s => s.RiskRating === 'Critical').length,
  };

  return {
    id: `SAMPLE-DEMO-${Date.now()}`,
    sampleId: `SAMPLE-DEMO-${Date.now()}`,
    sample: finalSample,
    summary: {
      generated_at_utc: new Date().toISOString(),
      sample_source: {
        description: 'CDD Onboarding Population - Demo Data',
        file_name: 'synthetic_onboarding_data.xlsx',
        sheet_name: 'Population',
      },
      define_population: {
        total_population_size: population.length,
        stratify_fields: ['RiskRating'],
        population_distribution: Object.entries(riskGroups).map(([key, group]) => ({
          stratum: { RiskRating: key },
          count: group.length,
          share: group.length / population.length,
        })),
        strata_details: Object.entries(riskGroups).map(([key, group]) => ({
          stratum: { RiskRating: key },
          population_count: group.length,
          share_of_population: group.length / population.length,
        })),
      },
      sampling_rationale: {
        sampling_method: 'statistical',
        confidence_level: 0.95,
        tolerable_error_rate: 0.05,
        expected_error_rate: 0.01,
        rationale_notes: {
          confidence_level: '95% confidence level selected for audit sampling',
          tolerable_error_rate: '5% tolerable error rate per AICPA guidance',
          expected_error_rate: '1% expected based on prior audits',
          stratification: 'Stratified by Risk Rating for better coverage',
        },
      },
      sample_selection_method: {
        method: 'stratified_random',
        seed: 42,
        systematic_random_start: false,
        original_calculated_sample_size: sampleSize,
        final_sample_size: finalSample.length,
        sample_distribution: Object.entries(riskDistribution).map(([key, count]) => ({
          stratum: { RiskRating: key },
          count,
          share: count / finalSample.length,
        })),
        allocations_by_stratum: Object.entries(riskDistribution).map(([key, count]) => ({
          key,
          stratum: { RiskRating: key },
          population_count: riskGroups[key as keyof typeof riskGroups].length,
          sample_count: count,
          original_sample_count: count,
        })),
      },
      overrides: {
        has_overrides: false,
        justification: null,
        parameter_overrides: {
          population_size: { applied: false },
          sample_size: { applied: false },
          sample_percentage: { applied: false },
          systematic_step: { applied: false },
        },
        coverage_overrides: [],
        allocation_adjustments: [],
      },
    },
    plan: {
      allocations: Object.entries(riskDistribution).map(([key, count]) => ({
        key,
        stratum: { RiskRating: key },
        population_count: riskGroups[key as keyof typeof riskGroups].length,
        sample_count: count,
        original_sample_count: count,
      })),
      plannedSize: sampleSize,
      desiredSize: sampleSize,
      stratifyFields: ['RiskRating'],
      populationSize: population.length,
      coverageOverrides: [],
    },
    config: {
      method: 'statistical' as const,
      confidence: 0.95,
      margin: 0.05,
      expectedErrorRate: 0.01,
      seed: 42,
      stratifyFields: ['RiskRating'],
    },
    lockedAt: new Date().toISOString(),
    isLocked: true,
  };
}

/**
 * Get fallback extracted attributes
 */
export function getFallbackAttributes(): ExtractedAttribute[] {
  // Use mock attributes from the attribute library
  return mockAttributes.map(attr => ({
    ...attr,
    extractedFrom: 'library' as const,
  }));
}

/**
 * Get fallback extracted attributes from AI extraction result
 */
export function getFallbackAIExtractedAttributes(): ExtractedAttribute[] {
  const aiResult = getMockAttributeExtractionResult();
  const attributesSheet = aiResult.workbook.sheets.find(s => s.name === 'Attributes');

  if (!attributesSheet?.rows) {
    return getFallbackAttributes();
  }

  return attributesSheet.rows.map(r => {
    const row = r as Record<string, unknown>;
    return {
      Source_File: String(row.Source_File || ''),
      Attribute_ID: String(row.Attribute_ID || ''),
      Attribute_Name: String(row.Attribute_Name || ''),
      Category: String(row.Category || ''),
      Source: String(row.Source || ''),
      Source_Page: String(row.Source_Page || ''),
      Question_Text: String(row.Question_Text || ''),
      Notes: String(row.Notes || ''),
      Jurisdiction_ID: String(row.Jurisdiction_ID || 'ENT'),
      RiskScope: (row.RiskScope as 'Base' | 'EDD' | 'Both') || 'Base',
      IsRequired: (row.IsRequired as 'Y' | 'N') || 'Y',
      DocumentationAgeRule: String(row.DocumentationAgeRule || ''),
      Group: String(row.Group || ''),
      extractedFrom: 'gap_assessment' as const,
    };
  });
}

/**
 * Get fallback workbook state
 */
export function getFallbackWorkbook(): WorkbookState {
  const attributes = getMockAttributes();
  const samplingResult = getFallbackSamplingResult();
  const sample = samplingResult.sample.slice(0, 25); // Use subset for workbook

  const rows = sample.flatMap((item, sampleIndex) =>
    attributes.map((attr, attrIndex) => ({
      id: `ROW-${String(sampleIndex * attributes.length + attrIndex + 1).padStart(5, '0')}`,
      sampleItemId: String(item.RecordID || `ITEM-${sampleIndex + 1}`),
      entityName: String(item.EntityName || 'Unknown'),
      attributeId: attr.Attribute_ID,
      attributeName: attr.Attribute_Name,
      questionText: attr.Question_Text,
      result: '' as "Pass" | "Fail" | "N/A" | "",
      observation: '',
      evidenceReference: '',
      auditorNotes: '',
      category: attr.Category,
      isRequired: attr.IsRequired === 'Y',
    }))
  );

  return {
    id: `WB-DEMO-${Date.now()}`,
    auditRunId: 'demo',
    status: 'draft',
    rows,
    summary: {
      totalRows: rows.length,
      completedRows: 0,
      passCount: 0,
      failCount: 0,
      naCount: 0,
      incompleteCount: rows.length,
      exceptionsCount: 0,
      completionPercentage: 0,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Get fallback test results with realistic pass/fail distribution (85% pass rate)
 */
export function getFallbackTestResults(): TestResult[] {
  const workbook = getFallbackWorkbook();
  const passRate = 0.85;
  const naRate = 0.05;

  return workbook.rows.map((row, index) => {
    const random = Math.random();
    let result: "Pass" | "Fail" | "N/A";
    let observation = '';

    if (random < passRate) {
      result = 'Pass';
    } else if (random < passRate + naRate) {
      result = 'N/A';
      observation = 'Not applicable to this entity type';
    } else {
      result = 'Fail';
      const observations = [
        'Documentation appears incomplete. Additional verification required.',
        'Discrepancy noted between reported values and supporting documents.',
        'Unable to verify information with provided documentation. Follow-up needed.',
        'Additional clarification required from entity management.',
        'Supporting evidence provided does not fully address the requirement.',
        'Documentation dated outside acceptable period. Updated records needed.',
      ];
      observation = observations[Math.floor(Math.random() * observations.length)];
    }

    return {
      id: `TEST-${String(index + 1).padStart(5, '0')}`,
      sampleItemId: row.sampleItemId,
      attributeId: row.attributeId,
      result,
      observation,
      evidenceReference: result === 'Fail' ? `DOC-${String(index + 1).padStart(3, '0')}` : '',
      auditorNotes: '',
      testedAt: new Date().toISOString(),
      testedBy: 'Demo Auditor',
    };
  });
}

/**
 * Get fallback consolidation report
 */
export function getFallbackConsolidation(auditRunId: string) {
  return getMockConsolidation(auditRunId);
}

/**
 * Master loader: Load fallback data for a specific stage
 * This also loads prerequisite data for earlier stages
 */
export function loadFallbackDataForStage(stageNumber: 1 | 2 | 3 | 4 | 5 | 6): void {
  // Stage 1: Gap Assessment
  if (stageNumber >= 1) {
    setStageData('gapAssessment1', getFallbackGapAssessment1());
    setStageData('gapAssessment2', getFallbackGapAssessment2());
    setStageData('combinedGaps', getFallbackCombinedGaps());
  }

  // Stage 2: Sampling
  if (stageNumber >= 2) {
    const population = getFallbackPopulation();
    setStageData('population', population);
    setStageData('populationMetadata', {
      id: `POP-DEMO-${Date.now()}`,
      fileName: 'synthetic_onboarding_data.xlsx',
      columns: ['RecordID', 'EntityName', 'EntityType', 'Jurisdiction', 'RiskRating', 'Industry', 'OnboardingDate', 'IRR', 'DRR', 'AnnualRevenue', 'EmployeeCount', 'LastReviewDate', 'ReviewStatus'],
      rowCount: population.length,
      uploadedAt: new Date().toISOString(),
    });
    setStageData('samplingResult', getFallbackSamplingResult());
  }

  // Stage 3: Attribute Extraction
  if (stageNumber >= 3) {
    setStageData('extractedAttributes', getFallbackAttributes());
    setStageData('attributeExtractionComplete', true);
  }

  // Stage 4: Workbook Generation
  if (stageNumber >= 4) {
    const workbook = getFallbackWorkbook();
    setStageData('workbookState', workbook);
    setStageData('generatedWorkbooks', [workbook]);
  }

  // Stage 5: Testing
  if (stageNumber >= 5) {
    const testResults = getFallbackTestResults();
    setStageData('testResults', testResults);
    setStageData('testingProgress', {
      totalTests: testResults.length,
      completedTests: testResults.length,
      passCount: testResults.filter(t => t.result === 'Pass').length,
      failCount: testResults.filter(t => t.result === 'Fail').length,
      naCount: testResults.filter(t => t.result === 'N/A').length,
    });
  }

  // Stage 6: Consolidation
  if (stageNumber >= 6) {
    setStageData('consolidatedReport', getFallbackConsolidation('demo'));
  }
}

/**
 * Load only the fallback data for a specific stage (no prerequisites)
 */
export function loadFallbackDataForStageOnly(stageNumber: 1 | 2 | 3 | 4 | 5 | 6): void {
  switch (stageNumber) {
    case 1:
      setStageData('gapAssessment1', getFallbackGapAssessment1());
      setStageData('gapAssessment2', getFallbackGapAssessment2());
      setStageData('combinedGaps', getFallbackCombinedGaps());
      break;

    case 2:
      const population = getFallbackPopulation();
      setStageData('population', population);
      setStageData('populationMetadata', {
        id: `POP-DEMO-${Date.now()}`,
        fileName: 'synthetic_onboarding_data.xlsx',
        columns: ['RecordID', 'EntityName', 'EntityType', 'Jurisdiction', 'RiskRating', 'Industry', 'OnboardingDate', 'IRR', 'DRR', 'AnnualRevenue', 'EmployeeCount', 'LastReviewDate', 'ReviewStatus'],
        rowCount: population.length,
        uploadedAt: new Date().toISOString(),
      });
      setStageData('samplingResult', getFallbackSamplingResult());
      break;

    case 3:
      setStageData('extractedAttributes', getFallbackAttributes());
      setStageData('attributeExtractionComplete', true);
      break;

    case 4:
      const workbook = getFallbackWorkbook();
      setStageData('workbookState', workbook);
      setStageData('generatedWorkbooks', [workbook]);
      break;

    case 5:
      const testResults = getFallbackTestResults();
      setStageData('testResults', testResults);
      setStageData('testingProgress', {
        totalTests: testResults.length,
        completedTests: testResults.length,
        passCount: testResults.filter(t => t.result === 'Pass').length,
        failCount: testResults.filter(t => t.result === 'Fail').length,
        naCount: testResults.filter(t => t.result === 'N/A').length,
      });
      break;

    case 6:
      setStageData('consolidatedReport', getFallbackConsolidation('demo'));
      break;
  }
}
