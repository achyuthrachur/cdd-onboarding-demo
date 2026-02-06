"use client";

import { useState, useCallback } from "react";
import { SheetTabs } from "./sheet-tabs";
import { GenerationReview } from "./generation-review";
import { AttributesSheet } from "./attributes-sheet";
import { AcceptableDocsSheet } from "./acceptable-docs-sheet";
import {
  JurisdictionsTable,
  AuditorsTable,
  ClientTypeRiskTable,
  SamplingTable,
} from "./reference-tables";
import {
  mockAttributes,
  mockAcceptableDocs,
  mockGenerationReviewRows,
  mockJurisdictions,
  mockAuditors,
  mockClientTypeRisk,
  mockSamplingConfig,
  mockBatchConfig,
  getAttributeLibrarySummary,
} from "@/lib/attribute-library/mock-data";
import type {
  AttributeLibrarySheet,
  Attribute,
  AcceptableDoc,
  GenerationReviewRow,
  BatchConfig,
} from "@/lib/attribute-library/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { WorkbookState } from "@/lib/workbook/builder";

interface AttributeLibraryUIProps {
  auditRunId?: string;
  onWorkbookGenerate?: () => void;
}

export function AttributeLibraryUI({ auditRunId, onWorkbookGenerate }: AttributeLibraryUIProps) {
  const [activeSheet, setActiveSheet] = useState<AttributeLibrarySheet>("Generation Review");

  // State management for Generation Review data
  const [generationReviewRows, setGenerationReviewRows] = useState<GenerationReviewRow[]>(
    mockGenerationReviewRows
  );
  const [attributes, setAttributes] = useState<Attribute[]>(mockAttributes);
  const [acceptableDocs, setAcceptableDocs] = useState<AcceptableDoc[]>(mockAcceptableDocs);
  const [batchConfig, setBatchConfig] = useState<BatchConfig>(mockBatchConfig);
  const [workbooks, setWorkbooks] = useState<WorkbookState[]>([]);

  // Calculate summary based on current state
  const summary = getAttributeLibrarySummary();
  const currentSummary = {
    ...summary,
    totalAttributes: attributes.length,
    totalAcceptableDocs: acceptableDocs.length,
    totalSamples: generationReviewRows.length,
  };

  // Handlers for state updates from Generation Review
  const handleRowsChange = useCallback((newRows: GenerationReviewRow[]) => {
    setGenerationReviewRows(newRows);
    // Update batch config to reflect changes
    setBatchConfig((prev) => ({
      ...prev,
      TotalSamples: newRows.length,
      AssignedCount: newRows.filter((r) => r.AuditorID && r.AuditorID !== "UNASSIGNED").length,
      UnassignedCount: newRows.filter((r) => !r.AuditorID || r.AuditorID === "UNASSIGNED").length,
      LastRefresh: new Date().toISOString(),
    }));
  }, []);

  const handleAttributesChange = useCallback((newAttrs: Attribute[], newDocs: AcceptableDoc[]) => {
    setAttributes(newAttrs);
    setAcceptableDocs(newDocs);
  }, []);

  // Legacy placeholder handlers (for backwards compatibility)
  const handleRefresh = useCallback(() => {
    setBatchConfig((prev) => ({
      ...prev,
      LastRefresh: new Date().toISOString(),
    }));
    toast.success("Data refreshed successfully");
  }, []);

  const handleOpenFolder = useCallback(() => {
    toast.info(`Output folder: ${batchConfig.OutputFolder}`);
  }, [batchConfig.OutputFolder]);

  const handleAssign = useCallback(() => {
    // This is now handled internally by GenerationReview
    toast.info("Use the Auto-Assign button in the Generation Review");
  }, []);

  const handleValidate = useCallback(() => {
    // This is now handled internally by GenerationReview
    toast.info("Use the Validate button in the Generation Review");
  }, []);

  const handleExport = useCallback(() => {
    // This is now handled internally by GenerationReview
    toast.info("Use the Export button in the Generation Review");
  }, []);

  const handleGenerate = useCallback(() => {
    if (onWorkbookGenerate) {
      onWorkbookGenerate();
    }
  }, [onWorkbookGenerate]);

  const renderSheetContent = () => {
    switch (activeSheet) {
      case "Generation Review":
        return (
          <GenerationReview
            rows={generationReviewRows}
            batchConfig={batchConfig}
            attributes={attributes}
            acceptableDocs={acceptableDocs}
            auditors={mockAuditors}
            jurisdictions={mockJurisdictions}
            workbooks={workbooks}
            onRowsChange={handleRowsChange}
            onAttributesChange={handleAttributesChange}
            onRefresh={handleRefresh}
            onOpenFolder={handleOpenFolder}
            onAssign={handleAssign}
            onValidate={handleValidate}
            onExport={handleExport}
            onGenerate={handleGenerate}
          />
        );
      case "Attributes":
        return (
          <AttributesSheet
            attributes={attributes}
            acceptableDocs={acceptableDocs}
          />
        );
      case "Acceptable Docs":
        return <AcceptableDocsSheet acceptableDocs={acceptableDocs} />;
      case "Jurisdictions":
        return <JurisdictionsTable jurisdictions={mockJurisdictions} />;
      case "Auditors":
        return <AuditorsTable auditors={mockAuditors} />;
      case "ClientTypeRisk":
        return <ClientTypeRiskTable clientTypeRisks={mockClientTypeRisk} />;
      case "Sampling":
        return <SamplingTable samplingConfig={mockSamplingConfig} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Summary */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-white/70">Attribute Library</span>
              <Badge variant="outline">{currentSummary.totalAttributes} Attributes</Badge>
              <Badge variant="outline">{currentSummary.totalAcceptableDocs} Documents</Badge>
              <Badge variant="outline">{currentSummary.totalJurisdictions} Jurisdictions</Badge>
              <Badge variant="outline">{currentSummary.totalSamples} Samples</Badge>
            </div>
            {auditRunId && (
              <Badge variant="secondary" className="ml-auto">
                Audit Run: {auditRunId}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Sheet Interface */}
      <Card className="overflow-hidden">
        <SheetTabs activeSheet={activeSheet} onSheetChange={setActiveSheet}>
          {renderSheetContent()}
        </SheetTabs>
      </Card>
    </div>
  );
}
