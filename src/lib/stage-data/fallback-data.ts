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
  FLUExtractionResult,
  AuditorWorkbook,
} from "./store";
import type { AcceptableDoc, Auditor } from "@/lib/attribute-library/types";
import { getMockGapAssessmentResult, getMockStandardsComparisonResult, getMockAttributeExtractionResult, getMockFLUExtractionResult } from "@/lib/ai/client";
import { getMockAttributes } from "@/lib/workbook/builder";
import { getMockConsolidation } from "@/lib/consolidation/engine";
import { mockAttributes, mockGenerationReviewRows, mockAuditors } from "@/lib/attribute-library/mock-data";
import { generateAuditorWorkbooks } from "@/lib/workbook/auditor-assignment";
import { populateAllWorkbooksWithDemoData } from "@/lib/workbook/demo-data-populator";
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
 * Get fallback population data (10,000 records based on actual synthetic_onboarding_data.xlsx structure)
 * Schema: GCI, Family GCI, Family Name, Legal Name, KYC date, Jurisdiction, Bk. Entity,
 * Primary FLU, IRR, Juris. Status, Restriction Level, Oper. Status, Party Type, KYC Status,
 * DRR, DRR Reason, Client Type, Refresh LOB, Country of Incorp., Restriction Comment
 */
export function getFallbackPopulation(): Record<string, unknown>[] {
  const population: Record<string, unknown>[] = [];

  const jurisdictions = ["USA", "UK", "Canada", "Germany", "France", "Australia", "Japan", "Singapore", "Hong Kong", "Switzerland"];
  const bkEntities = ["MLT", "BRSCOT", "HSBCUK", "USBANK", "HKSB", "CHSB"];
  const primaryFLUs = ["Retail Banking", "Global Corporate & Investment Banking", "Global Commercial Banking", "Wealth Management", "Private Banking"];
  const irrValues = ["Enhanced Program", "Pre-2016 Program", "Standard Program"];
  const jurisStatuses = ["Green", "Amber", "Red"];
  const operStatuses = ["Active", "Inactive", ""];
  const partyTypes = ["ORG", "IND"];
  const kycStatuses = ["Green", "Amber", "Red"];
  const drrValues = ["Standard", "Elevated", "High"];
  const drrReasons = ["Low complexity / low risk profile", "Standard Due Diligence", "Complex ownership structure", "High-risk jurisdiction", "PEP relationship"];
  const clientTypes = ["Financial Institution", "Non-Profit Organization", "Government Entity or Agency", "Corporation", "Trust", "Partnership"];
  const refreshLOBs = ["FICC – SRM", "Corporate Banking (CBK)", "Global Markets – Sales", "Wealth Management – Advisory", "Retail Banking"];
  const countries = ["United States", "United Kingdom", "Canada", "Germany", "France", "Australia", "Japan", "Singapore", "Hong Kong", "Switzerland"];

  for (let i = 0; i < 10000; i++) {
    const gci = 600000000 + i;
    const familyGci = Math.floor(Math.random() * 900000000) + 100000000;
    const familyNum = Math.floor(Math.random() * 2000) + 1;
    const jurisdiction = jurisdictions[i % jurisdictions.length];
    const countryIdx = jurisdictions.indexOf(jurisdiction);
    const country = countries[countryIdx >= 0 && countryIdx < countries.length ? countryIdx : 0];

    // Generate KYC date between 2018 and 2024
    const year = 2018 + Math.floor(Math.random() * 7);
    const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    const kycDate = `${year}-${month}`;

    // Risk distribution: 60% Green, 25% Amber, 15% Red
    const riskRandom = Math.random() * 100;
    const jurisStatus = riskRandom < 60 ? "Green" : riskRandom < 85 ? "Amber" : "Red";
    const kycStatus = jurisStatuses[Math.floor(Math.random() * jurisStatuses.length)];

    population.push({
      GCI: gci,
      "Family GCI": familyGci,
      "Family Name": `Family ${familyNum}`,
      "Legal Name": `Entity ${i + 1} ${jurisdiction}`,
      "KYC date": kycDate,
      Jurisdiction: jurisdiction,
      "Bk. Entity": bkEntities[i % bkEntities.length],
      "Primary FLU": primaryFLUs[i % primaryFLUs.length],
      IRR: irrValues[i % irrValues.length],
      "Juris. Status": jurisStatus,
      "Restriction Level": i % 20 === 0 ? "Restricted" : "",
      "Oper. Status": operStatuses[i % 3],
      "Party Type": partyTypes[i % partyTypes.length],
      "KYC Status": kycStatus,
      DRR: drrValues[Math.floor(Math.random() * drrValues.length)],
      "DRR Reason": drrReasons[Math.floor(Math.random() * drrReasons.length)],
      "Client Type": clientTypes[i % clientTypes.length],
      "Refresh LOB": refreshLOBs[i % refreshLOBs.length],
      "Country of Incorp.": country,
      "Restriction Comment": i % 50 === 0 ? "Subject to internal review" : "",
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

  // Stratified sampling by Juris. Status (Green/Amber/Red)
  const riskGroups = {
    Green: population.filter(p => p["Juris. Status"] === 'Green'),
    Amber: population.filter(p => p["Juris. Status"] === 'Amber'),
    Red: population.filter(p => p["Juris. Status"] === 'Red'),
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
    Green: finalSample.filter(s => s["Juris. Status"] === 'Green').length,
    Amber: finalSample.filter(s => s["Juris. Status"] === 'Amber').length,
    Red: finalSample.filter(s => s["Juris. Status"] === 'Red').length,
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
        sheet_name: 'Sheet1',
      },
      define_population: {
        total_population_size: population.length,
        stratify_fields: ['Juris. Status'],
        population_distribution: Object.entries(riskGroups).map(([key, group]) => ({
          stratum: { "Juris. Status": key },
          count: group.length,
          share: group.length / population.length,
        })),
        strata_details: Object.entries(riskGroups).map(([key, group]) => ({
          stratum: { "Juris. Status": key },
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
          stratification: 'Stratified by Jurisdiction Status for better coverage across risk levels',
        },
      },
      sample_selection_method: {
        method: 'stratified_random',
        seed: 42,
        systematic_random_start: false,
        original_calculated_sample_size: sampleSize,
        final_sample_size: finalSample.length,
        sample_distribution: Object.entries(riskDistribution).map(([key, count]) => ({
          stratum: { "Juris. Status": key },
          count,
          share: count / finalSample.length,
        })),
        allocations_by_stratum: Object.entries(riskDistribution).map(([key, count]) => ({
          key,
          stratum: { "Juris. Status": key },
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
        stratum: { "Juris. Status": key },
        population_count: riskGroups[key as keyof typeof riskGroups].length,
        sample_count: count,
        original_sample_count: count,
      })),
      plannedSize: sampleSize,
      desiredSize: sampleSize,
      stratifyFields: ['Juris. Status'],
      populationSize: population.length,
      coverageOverrides: [],
    },
    config: {
      method: 'statistical' as const,
      confidence: 0.95,
      margin: 0.05,
      expectedErrorRate: 0.01,
      seed: 42,
      stratifyFields: ['Juris. Status'],
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
      extractedFrom: 'flu_procedures' as const,
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
 * Get fallback FLU extraction result (Stage 3)
 * Uses the mock FLU extraction result with CIP/CDD/EDD attributes
 */
export function getFallbackFLUExtractionResult(): FLUExtractionResult {
  const result = getMockFLUExtractionResult();
  return {
    id: `FLU-${Date.now()}`,
    workbook: result.workbook as FLUExtractionResult['workbook'],
    tokensUsed: 0,
  };
}

/**
 * Get fallback extracted attributes from FLU extraction (Stage 3)
 */
export function getFallbackFLUAttributes(): ExtractedAttribute[] {
  const fluResult = getMockFLUExtractionResult();
  const attributesSheet = fluResult.workbook.sheets.find(s => s.name === 'Attributes');

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
      extractedFrom: 'flu_procedures' as const,
    };
  });
}

/**
 * Get fallback acceptable documents from FLU extraction (Stage 3)
 */
export function getFallbackAcceptableDocs(): AcceptableDoc[] {
  const fluResult = getMockFLUExtractionResult();
  const docsSheet = fluResult.workbook.sheets.find(s => s.name === 'Acceptable_Docs');

  if (!docsSheet?.rows) {
    return [];
  }

  return docsSheet.rows.map(r => {
    const row = r as Record<string, unknown>;
    return {
      Source_File: String(row.Source_File || ''),
      Attribute_ID: String(row.Attribute_ID || ''),
      Document_Name: String(row.Document_Name || ''),
      Evidence_Source_Document: String(row.Evidence_Source_Document || ''),
      Jurisdiction_ID: String(row.Jurisdiction_ID || 'ENT'),
      Notes: String(row.Notes || ''),
    };
  });
}

/**
 * Get fallback auditors for Stage 4
 */
export function getFallbackAuditors(): Auditor[] {
  return mockAuditors;
}

/**
 * Get fallback auditor workbooks for Stage 4
 * Generates per-auditor workbooks with demo data populated
 */
export function getFallbackAuditorWorkbooks(): AuditorWorkbook[] {
  const samplingResult = getFallbackSamplingResult();
  const attributes = getFallbackFLUAttributes();
  const auditors = getFallbackAuditors();

  // Generate workbooks using round-robin distribution
  const workbooks = generateAuditorWorkbooks(
    samplingResult.sample,
    attributes,
    auditors,
    { strategy: 'round-robin' }
  );

  // Populate with demo data
  const populatedWorkbooks = populateAllWorkbooksWithDemoData(workbooks);

  return populatedWorkbooks;
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
      columns: ['GCI', 'Family GCI', 'Family Name', 'Legal Name', 'KYC date', 'Jurisdiction', 'Bk. Entity', 'Primary FLU', 'IRR', 'Juris. Status', 'Restriction Level', 'Oper. Status', 'Party Type', 'KYC Status', 'DRR', 'DRR Reason', 'Client Type', 'Refresh LOB', 'Country of Incorp.', 'Restriction Comment'],
      rowCount: population.length,
      uploadedAt: new Date().toISOString(),
    });
    setStageData('samplingResult', getFallbackSamplingResult());
  }

  // Stage 3: FLU Attribute Extraction
  if (stageNumber >= 3) {
    const fluResult = getFallbackFLUExtractionResult();
    const fluAttributes = getFallbackFLUAttributes();
    const acceptableDocs = getFallbackAcceptableDocs();

    // Set FLU procedures for preloading in Stage 3
    const fluProcedures = [{
      id: 'demo-flu-procedures',
      fileName: 'FLU_CIP_CDD_Procedures.docx',
      docType: 'flu_procedure' as const,
      jurisdiction: 'ENT',
      uploadedAt: new Date().toISOString(),
      content: '[Document: FLU_CIP_CDD_Procedures.docx - Enterprise CIP/CDD/EDD Procedures]',
    }];
    setStageData('fluProcedures', fluProcedures);

    setStageData('fluExtractionResult', fluResult);
    setStageData('extractedAttributes', fluAttributes);
    setStageData('acceptableDocs', acceptableDocs);
    setStageData('attributeExtractionComplete', true);
  }

  // Stage 4: Auditor Workbook Generation
  if (stageNumber >= 4) {
    const auditors = getFallbackAuditors();
    const auditorWorkbooks = getFallbackAuditorWorkbooks();

    setStageData('selectedAuditors', auditors);
    setStageData('auditorWorkbooks', auditorWorkbooks);
    setStageData('activeAuditorId', auditors[0]?.id);
    setStageData('workbookGenerationComplete', true);

    // Legacy support
    const workbook = getFallbackWorkbook();
    setStageData('workbookState', workbook);
    setStageData('generatedWorkbooks', [workbook]);
  }

  // Stage 5: Testing
  if (stageNumber >= 5) {
    const testResults = getFallbackTestResults();
    const auditorWorkbooks = getFallbackAuditorWorkbooks();

    // Calculate aggregated stats from auditor workbooks
    let totalRows = 0;
    let passCount = 0;
    let passWithObsCount = 0;
    let fail1RegulatoryCount = 0;
    let fail2ProcedureCount = 0;
    let questionToLOBCount = 0;
    let naCount = 0;

    auditorWorkbooks.forEach(wb => {
      totalRows += wb.summary.totalRows;
      passCount += wb.summary.passCount;
      passWithObsCount += wb.summary.passWithObsCount;
      fail1RegulatoryCount += wb.summary.fail1RegulatoryCount;
      fail2ProcedureCount += wb.summary.fail2ProcedureCount;
      questionToLOBCount += wb.summary.questionToLOBCount;
      naCount += wb.summary.naCount;
    });

    setStageData('testResults', testResults);
    setStageData('testingProgress', {
      totalTests: totalRows,
      completedTests: totalRows,
      passCount,
      passWithObsCount,
      fail1RegulatoryCount,
      fail2ProcedureCount,
      questionToLOBCount,
      naCount,
    });
  }

  // Stage 6: Consolidation
  if (stageNumber >= 6) {
    setStageData('consolidatedReport', getFallbackConsolidation('demo'));
  }
}

/**
 * Load ONLY the OUTPUT (results) data for a specific stage - for "Load Demo Data" button
 * This does NOT load inputs or prerequisite data - just the results/outputs
 */
export function loadDemoOutputsForStage(stageNumber: 1 | 2 | 3 | 4 | 5 | 6): void {
  switch (stageNumber) {
    case 1:
      // Stage 1 outputs: gap assessment results
      setStageData('gapAssessment1', getFallbackGapAssessment1());
      setStageData('gapAssessment2', getFallbackGapAssessment2());
      setStageData('combinedGaps', getFallbackCombinedGaps());
      break;

    case 2:
      // Stage 2 outputs: sampling result (but NOT population - that's an input)
      setStageData('samplingResult', getFallbackSamplingResult());
      break;

    case 3:
      // Stage 3 outputs: extraction results
      setStageData('fluExtractionResult', getFallbackFLUExtractionResult());
      setStageData('extractedAttributes', getFallbackFLUAttributes());
      setStageData('acceptableDocs', getFallbackAcceptableDocs());
      setStageData('attributeExtractionComplete', true);
      break;

    case 4:
      // Stage 4 outputs: workbook generation
      const auditors = getFallbackAuditors();
      const auditorWorkbooks = getFallbackAuditorWorkbooks();
      setStageData('selectedAuditors', auditors);
      setStageData('auditorWorkbooks', auditorWorkbooks);
      setStageData('activeAuditorId', auditors[0]?.id);
      setStageData('workbookGenerationComplete', true);
      // Legacy support
      const workbook = getFallbackWorkbook();
      setStageData('workbookState', workbook);
      setStageData('generatedWorkbooks', [workbook]);
      break;

    case 5:
      // Stage 5 outputs: test results
      const testResults = getFallbackTestResults();
      const auditorWorkbooks5 = getFallbackAuditorWorkbooks();
      let totalRows = 0;
      let passCount = 0;
      let passWithObsCount = 0;
      let fail1RegulatoryCount = 0;
      let fail2ProcedureCount = 0;
      let questionToLOBCount = 0;
      let naCount = 0;
      auditorWorkbooks5.forEach(wb => {
        totalRows += wb.summary.totalRows;
        passCount += wb.summary.passCount;
        passWithObsCount += wb.summary.passWithObsCount;
        fail1RegulatoryCount += wb.summary.fail1RegulatoryCount;
        fail2ProcedureCount += wb.summary.fail2ProcedureCount;
        questionToLOBCount += wb.summary.questionToLOBCount;
        naCount += wb.summary.naCount;
      });
      setStageData('testResults', testResults);
      setStageData('testingProgress', {
        totalTests: totalRows,
        completedTests: totalRows,
        passCount,
        passWithObsCount,
        fail1RegulatoryCount,
        fail2ProcedureCount,
        questionToLOBCount,
        naCount,
      });
      break;

    case 6:
      // Stage 6 outputs: consolidation report
      setStageData('consolidatedReport', getFallbackConsolidation('demo'));
      break;
  }
}

/**
 * Load only the fallback data for a specific stage (no prerequisites)
 * @deprecated Use loadDemoOutputsForStage instead for clearer naming
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
        columns: ['GCI', 'Family GCI', 'Family Name', 'Legal Name', 'KYC date', 'Jurisdiction', 'Bk. Entity', 'Primary FLU', 'IRR', 'Juris. Status', 'Restriction Level', 'Oper. Status', 'Party Type', 'KYC Status', 'DRR', 'DRR Reason', 'Client Type', 'Refresh LOB', 'Country of Incorp.', 'Restriction Comment'],
        rowCount: population.length,
        uploadedAt: new Date().toISOString(),
      });
      setStageData('samplingResult', getFallbackSamplingResult());
      break;

    case 3:
      const fluResult = getFallbackFLUExtractionResult();
      const fluAttributes = getFallbackFLUAttributes();
      const acceptableDocs = getFallbackAcceptableDocs();

      setStageData('fluExtractionResult', fluResult);
      setStageData('extractedAttributes', fluAttributes);
      setStageData('acceptableDocs', acceptableDocs);
      setStageData('attributeExtractionComplete', true);
      break;

    case 4:
      const auditors = getFallbackAuditors();
      const auditorWorkbooks = getFallbackAuditorWorkbooks();

      setStageData('selectedAuditors', auditors);
      setStageData('auditorWorkbooks', auditorWorkbooks);
      setStageData('activeAuditorId', auditors[0]?.id);
      setStageData('workbookGenerationComplete', true);

      // Legacy support
      const workbook = getFallbackWorkbook();
      setStageData('workbookState', workbook);
      setStageData('generatedWorkbooks', [workbook]);
      break;

    case 5:
      const testResults5 = getFallbackTestResults();
      const auditorWorkbooks5 = getFallbackAuditorWorkbooks();

      // Calculate aggregated stats from auditor workbooks
      let totalRows5 = 0;
      let passCount5 = 0;
      let passWithObsCount5 = 0;
      let fail1RegulatoryCount5 = 0;
      let fail2ProcedureCount5 = 0;
      let questionToLOBCount5 = 0;
      let naCount5 = 0;

      auditorWorkbooks5.forEach(wb => {
        totalRows5 += wb.summary.totalRows;
        passCount5 += wb.summary.passCount;
        passWithObsCount5 += wb.summary.passWithObsCount;
        fail1RegulatoryCount5 += wb.summary.fail1RegulatoryCount;
        fail2ProcedureCount5 += wb.summary.fail2ProcedureCount;
        questionToLOBCount5 += wb.summary.questionToLOBCount;
        naCount5 += wb.summary.naCount;
      });

      setStageData('testResults', testResults5);
      setStageData('testingProgress', {
        totalTests: totalRows5,
        completedTests: totalRows5,
        passCount: passCount5,
        passWithObsCount: passWithObsCount5,
        fail1RegulatoryCount: fail1RegulatoryCount5,
        fail2ProcedureCount: fail2ProcedureCount5,
        questionToLOBCount: questionToLOBCount5,
        naCount: naCount5,
      });
      break;

    case 6:
      setStageData('consolidatedReport', getFallbackConsolidation('demo'));
      break;
  }
}
