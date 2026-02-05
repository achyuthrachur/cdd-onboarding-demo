"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Filter,
  RefreshCw,
  FolderOpen,
  Play,
  FileDown,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Upload,
  FileText,
  Merge,
  Wand2,
  FileSpreadsheet,
  Import,
} from "lucide-react";
import { toast } from "sonner";
import type {
  GenerationReviewRow,
  BatchConfig,
  Attribute,
  AcceptableDoc,
  Auditor,
  Jurisdiction,
} from "@/lib/attribute-library/types";
import {
  importAttributesAndDocs,
  importSampling,
  generateTestGrids,
  consolidateTestGrids,
  generateNarrativePrompt,
  populateGenerationReview,
  autoAssignAuditors,
  exportGenerationReview,
  validateGenerationReview,
  type GenerationProgress,
  type GeneratedWorkbook,
} from "@/lib/attribute-library/actions";
import type { SamplingRecord } from "@/lib/attribute-library/import-export";
import { NarrativePrompt, ProgressDialog } from "@/components/modals";
import type { WorkbookState } from "@/lib/workbook/builder";

interface GenerationReviewProps {
  rows: GenerationReviewRow[];
  batchConfig: BatchConfig;
  attributes?: Attribute[];
  acceptableDocs?: AcceptableDoc[];
  auditors?: Auditor[];
  jurisdictions?: Jurisdiction[];
  workbooks?: WorkbookState[];
  onRowsChange?: (rows: GenerationReviewRow[]) => void;
  onAttributesChange?: (attributes: Attribute[], docs: AcceptableDoc[]) => void;
  onRefresh?: () => void;
  onGenerate?: () => void;
  onExport?: () => void;
  onAssign?: () => void;
  onValidate?: () => void;
  onOpenFolder?: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  Ready: "bg-green-100 text-green-700",
  "In Progress": "bg-blue-100 text-blue-700",
  Completed: "bg-purple-100 text-purple-700",
  Error: "bg-red-100 text-red-700",
};

const PARTY_TYPE_COLORS: Record<string, string> = {
  "Individual - Domestic": "bg-blue-100 text-blue-700",
  "Individual - Foreign": "bg-indigo-100 text-indigo-700",
  "Corporate - Domestic": "bg-green-100 text-green-700",
  "Corporate - Foreign": "bg-emerald-100 text-emerald-700",
  PEP: "bg-red-100 text-red-700",
  Trust: "bg-purple-100 text-purple-700",
  Fund: "bg-orange-100 text-orange-700",
  "Correspondent Bank": "bg-pink-100 text-pink-700",
};

export function GenerationReview({
  rows,
  batchConfig,
  attributes = [],
  acceptableDocs = [],
  auditors = [],
  jurisdictions = [],
  workbooks = [],
  onRowsChange,
  onAttributesChange,
  onRefresh,
  onGenerate,
  onExport,
  onAssign,
  onValidate,
  onOpenFolder,
}: GenerationReviewProps) {
  // Local state for internal data management
  const [localRows, setLocalRows] = useState<GenerationReviewRow[]>(rows);
  const [localAttributes, setLocalAttributes] = useState<Attribute[]>(attributes);
  const [localAcceptableDocs, setLocalAcceptableDocs] = useState<AcceptableDoc[]>(acceptableDocs);
  const [samplingRecords, setSamplingRecords] = useState<SamplingRecord[]>([]);
  const [generatedWorkbooks, setGeneratedWorkbooks] = useState<GeneratedWorkbook[]>([]);

  // UI state
  const [searchTerm, setSearchTerm] = useState("");
  const [jurisdictionFilter, setJurisdictionFilter] = useState<string>("all");
  const [auditorFilter, setAuditorFilter] = useState<string>("all");
  const [partyTypeFilter, setPartyTypeFilter] = useState<string>("all");

  // Modal state
  const [narrativeModalOpen, setNarrativeModalOpen] = useState(false);
  const [narrativePromptText, setNarrativePromptText] = useState("");
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress>({
    current: 0,
    total: 0,
    status: "idle",
    message: "",
  });

  // Loading states
  const [isImporting, setIsImporting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // File input refs
  const attributesFileInputRef = useRef<HTMLInputElement>(null);
  const samplingFileInputRef = useRef<HTMLInputElement>(null);

  // Use provided rows or local rows
  const displayRows = onRowsChange ? rows : localRows;
  const displayAttributes = onAttributesChange ? attributes : localAttributes;
  const displayAcceptableDocs = onAttributesChange ? acceptableDocs : localAcceptableDocs;

  // Update rows helper
  const updateRows = useCallback((newRows: GenerationReviewRow[]) => {
    if (onRowsChange) {
      onRowsChange(newRows);
    } else {
      setLocalRows(newRows);
    }
  }, [onRowsChange]);

  // Update attributes helper
  const updateAttributes = useCallback((newAttrs: Attribute[], newDocs: AcceptableDoc[]) => {
    if (onAttributesChange) {
      onAttributesChange(newAttrs, newDocs);
    } else {
      setLocalAttributes(newAttrs);
      setLocalAcceptableDocs(newDocs);
    }
  }, [onAttributesChange]);

  // Get unique filter values
  const uniqueJurisdictions = useMemo(
    () => [...new Set(displayRows.map((r) => r.Jurisdiction_ID))],
    [displayRows]
  );
  const uniqueAuditors = useMemo(
    () => [...new Set(displayRows.map((r) => r.Auditor_Name))],
    [displayRows]
  );
  const partyTypes = useMemo(
    () => [...new Set(displayRows.map((r) => r.Party_Type))],
    [displayRows]
  );

  // Filter rows
  const filteredRows = useMemo(() => {
    return displayRows.filter((row) => {
      const matchesSearch =
        row.GCI.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.Legal_Name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesJurisdiction =
        jurisdictionFilter === "all" || row.Jurisdiction_ID === jurisdictionFilter;

      const matchesAuditor =
        auditorFilter === "all" || row.Auditor_Name === auditorFilter;

      const matchesPartyType =
        partyTypeFilter === "all" || row.Party_Type === partyTypeFilter;

      return matchesSearch && matchesJurisdiction && matchesAuditor && matchesPartyType;
    });
  }, [displayRows, searchTerm, jurisdictionFilter, auditorFilter, partyTypeFilter]);

  // Summary statistics
  const stats = useMemo(() => {
    const byJurisdiction = displayRows.reduce((acc, row) => {
      acc[row.Jurisdiction_ID] = (acc[row.Jurisdiction_ID] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byAuditor = displayRows.reduce((acc, row) => {
      acc[row.Auditor_Name] = (acc[row.Auditor_Name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const avgIRR = displayRows.length > 0
      ? displayRows.reduce((sum, r) => sum + r.IRR, 0) / displayRows.length
      : 0;
    const avgDRR = displayRows.length > 0
      ? displayRows.reduce((sum, r) => sum + r.DRR, 0) / displayRows.length
      : 0;

    return { byJurisdiction, byAuditor, avgIRR, avgDRR };
  }, [displayRows]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  // ============================================================================
  // Button 1: Import Attributes and Acceptable Docs
  // ============================================================================
  const handleImportAttributesClick = () => {
    attributesFileInputRef.current?.click();
  };

  const handleAttributesFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const result = await importAttributesAndDocs(file);

      if (result.success) {
        updateAttributes(result.attributes, result.acceptableDocs);
        toast.success(
          `Imported ${result.attributes.length} attributes and ${result.acceptableDocs.length} acceptable documents`
        );
      } else {
        toast.error(result.error || "Failed to import file");
      }
    } catch (error) {
      toast.error("An error occurred while importing the file");
      console.error(error);
    } finally {
      setIsImporting(false);
      // Reset file input
      if (attributesFileInputRef.current) {
        attributesFileInputRef.current.value = "";
      }
    }
  };

  // ============================================================================
  // Button 2: Generate Test Grids
  // ============================================================================
  const handleGenerateTestGrids = async () => {
    // Validate first
    const validation = validateGenerationReview(displayRows);

    if (!validation.valid) {
      toast.error(validation.errors.join("\n"));
      return;
    }

    if (validation.warnings.length > 0) {
      validation.warnings.forEach((w) => toast.warning(w));
    }

    if (displayAttributes.length === 0) {
      toast.error("No attributes loaded. Please import attributes first.");
      return;
    }

    setIsGenerating(true);
    setProgressDialogOpen(true);

    try {
      const results = await generateTestGrids(
        displayRows,
        displayAttributes,
        (progress) => setGenerationProgress(progress)
      );

      setGeneratedWorkbooks(results);

      const successCount = results.filter((r) => r.status === "generated").length;
      const errorCount = results.filter((r) => r.status === "error").length;

      if (errorCount === 0) {
        toast.success(`Successfully generated ${successCount} test grid workbooks`);
      } else {
        toast.warning(
          `Generated ${successCount} workbooks with ${errorCount} errors`
        );
      }

      // Call the external handler if provided
      if (onGenerate) {
        onGenerate();
      }
    } catch (error) {
      toast.error("Failed to generate test grids");
      console.error(error);
      setGenerationProgress({
        current: 0,
        total: 0,
        status: "error",
        message: "Generation failed",
      });
    } finally {
      setIsGenerating(false);
      // Keep dialog open briefly to show completion
      setTimeout(() => {
        setProgressDialogOpen(false);
      }, 1500);
    }
  };

  // ============================================================================
  // Button 3: Consolidate Test Grids
  // ============================================================================
  const handleConsolidateTestGrids = async () => {
    const submittedCount = workbooks.filter((wb) => wb.status === "submitted").length;

    if (submittedCount === 0) {
      toast.warning("No submitted workbooks to consolidate");
      return;
    }

    try {
      const result = await consolidateTestGrids(workbooks);

      toast.success(
        `Consolidated ${result.metrics.workbooksSubmitted} workbooks: ` +
          `${result.metrics.passCount} pass, ${result.metrics.failCount} fail ` +
          `(${result.metrics.passRate.toFixed(1)}% pass rate)`
      );

      // Could open a results dialog here or export directly
    } catch (error) {
      toast.error("Failed to consolidate workbooks");
      console.error(error);
    }
  };

  // ============================================================================
  // Button 4: Generate CoPilot Narrative Prompt
  // ============================================================================
  const handleGenerateNarrativePrompt = () => {
    if (displayRows.length === 0) {
      toast.warning("No data available for narrative generation");
      return;
    }

    const prompt = generateNarrativePrompt(
      displayRows,
      displayAttributes,
      batchConfig.BatchID
    );

    setNarrativePromptText(prompt);
    setNarrativeModalOpen(true);
  };

  const handleRefreshNarrativePrompt = () => {
    const prompt = generateNarrativePrompt(
      displayRows,
      displayAttributes,
      batchConfig.BatchID
    );
    setNarrativePromptText(prompt);
  };

  // ============================================================================
  // Button 5: Populate Generation Review
  // ============================================================================
  const handlePopulateGenerationReview = () => {
    if (samplingRecords.length === 0) {
      toast.warning("No sampling records loaded. Please import sampling first.");
      return;
    }

    const newRows = populateGenerationReview(
      samplingRecords,
      auditors.length > 0 ? auditors : [
        { id: "AUD001", name: "Auditor 1", email: "" },
        { id: "AUD002", name: "Auditor 2", email: "" },
      ],
      jurisdictions
    );

    updateRows(newRows);
    toast.success(`Populated ${newRows.length} sample assignments`);
  };

  // ============================================================================
  // Button 6: Import Sampling
  // ============================================================================
  const handleImportSamplingClick = () => {
    samplingFileInputRef.current?.click();
  };

  const handleSamplingFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const result = await importSampling(file);

      if (result.success) {
        setSamplingRecords(result.records);
        toast.success(`Imported ${result.records.length} sampling records`);
      } else {
        toast.error(result.error || "Failed to import sampling file");
      }
    } catch (error) {
      toast.error("An error occurred while importing the sampling file");
      console.error(error);
    } finally {
      setIsImporting(false);
      if (samplingFileInputRef.current) {
        samplingFileInputRef.current.value = "";
      }
    }
  };

  // ============================================================================
  // Additional Action Handlers
  // ============================================================================
  const handleRefreshData = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      toast.info("Refreshing data...");
      // Simulate refresh
      setTimeout(() => {
        toast.success("Data refreshed successfully");
      }, 500);
    }
  };

  const handleAutoAssign = () => {
    if (onAssign) {
      onAssign();
    } else {
      if (auditors.length === 0) {
        toast.warning("No auditors available for assignment");
        return;
      }

      const updatedRows = autoAssignAuditors(displayRows, auditors, "balance-workload");
      updateRows(updatedRows);
      toast.success("Auditors auto-assigned based on balanced workload");
    }
  };

  const handleValidate = () => {
    if (onValidate) {
      onValidate();
    } else {
      const validation = validateGenerationReview(displayRows);

      if (validation.valid) {
        toast.success("Validation passed. Ready for generation.");
        validation.warnings.forEach((w) => toast.warning(w));
      } else {
        validation.errors.forEach((e) => toast.error(e));
        validation.warnings.forEach((w) => toast.warning(w));
      }
    }
  };

  const handleExport = () => {
    if (onExport) {
      onExport();
    } else {
      exportGenerationReview(displayRows, batchConfig);
      toast.success("Generation review exported to Excel");
    }
  };

  const handleOpenFolder = () => {
    if (onOpenFolder) {
      onOpenFolder();
    } else {
      toast.info(`Output folder: ${batchConfig.OutputFolder}`);
    }
  };

  const handleCancelGeneration = () => {
    setGenerationProgress((prev) => ({
      ...prev,
      status: "cancelled",
      message: "Generation cancelled by user",
    }));
    setProgressDialogOpen(false);
    setIsGenerating(false);
  };

  return (
    <div className="space-y-6">
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={attributesFileInputRef}
        onChange={handleAttributesFileChange}
        accept=".xlsx,.xls,.csv"
        className="hidden"
      />
      <input
        type="file"
        ref={samplingFileInputRef}
        onChange={handleSamplingFileChange}
        accept=".xlsx,.xls,.csv"
        className="hidden"
      />

      {/* Narrative Prompt Modal */}
      <NarrativePrompt
        open={narrativeModalOpen}
        onOpenChange={setNarrativeModalOpen}
        promptText={narrativePromptText}
        onRefresh={handleRefreshNarrativePrompt}
      />

      {/* Progress Dialog */}
      <ProgressDialog
        open={progressDialogOpen}
        title="Generating Test Grids"
        progress={
          generationProgress.total > 0
            ? (generationProgress.current / generationProgress.total) * 100
            : 0
        }
        status={generationProgress.message}
        onCancel={isGenerating ? handleCancelGeneration : undefined}
      />

      {/* Batch Configuration Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Batch Configuration
                <Badge className={STATUS_COLORS[batchConfig.Status] || "bg-gray-100"}>
                  {batchConfig.Status === "Ready" && <CheckCircle2 className="mr-1 h-3 w-3" />}
                  {batchConfig.Status === "In Progress" && <Clock className="mr-1 h-3 w-3" />}
                  {batchConfig.Status === "Error" && <AlertCircle className="mr-1 h-3 w-3" />}
                  {batchConfig.Status}
                </Badge>
              </CardTitle>
              <CardDescription>
                Batch ID: {batchConfig.BatchID}
              </CardDescription>
            </div>
            {/* Data indicators */}
            <div className="flex gap-2">
              {displayAttributes.length > 0 && (
                <Badge variant="outline" className="text-green-600 border-green-300">
                  {displayAttributes.length} Attributes
                </Badge>
              )}
              {displayAcceptableDocs.length > 0 && (
                <Badge variant="outline" className="text-blue-600 border-blue-300">
                  {displayAcceptableDocs.length} Docs
                </Badge>
              )}
              {samplingRecords.length > 0 && (
                <Badge variant="outline" className="text-purple-600 border-purple-300">
                  {samplingRecords.length} Samples
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Last Refresh</p>
              <p className="font-medium">{formatDate(batchConfig.LastRefresh)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Output Folder</p>
              <p className="font-medium text-sm truncate" title={batchConfig.OutputFolder}>
                {batchConfig.OutputFolder}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Samples</p>
              <p className="font-medium">{batchConfig.TotalSamples}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Assignment Status</p>
              <p className="font-medium">
                {batchConfig.AssignedCount}/{batchConfig.TotalSamples} Assigned
              </p>
            </div>
          </div>

          {/* Primary Action Buttons - 6 Main Actions */}
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm font-medium text-muted-foreground mb-3">Primary Actions</p>
            <div className="flex flex-wrap gap-2">
              {/* Button 1: Import Attributes and Acceptable Docs */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleImportAttributesClick}
                disabled={isImporting}
              >
                <Upload className="mr-2 h-4 w-4" />
                Import Attributes
              </Button>

              {/* Button 6: Import Sampling */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleImportSamplingClick}
                disabled={isImporting}
              >
                <Import className="mr-2 h-4 w-4" />
                Import Sampling
              </Button>

              {/* Button 5: Populate Generation Review */}
              <Button
                variant="outline"
                size="sm"
                onClick={handlePopulateGenerationReview}
                disabled={samplingRecords.length === 0}
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Populate Review
              </Button>

              {/* Button 2: Generate Test Grids */}
              <Button
                size="sm"
                onClick={handleGenerateTestGrids}
                disabled={isGenerating || displayRows.length === 0}
              >
                <Play className="mr-2 h-4 w-4" />
                Generate Test Grids
              </Button>

              {/* Button 3: Consolidate Test Grids */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleConsolidateTestGrids}
                disabled={workbooks.filter((wb) => wb.status === "submitted").length === 0}
              >
                <Merge className="mr-2 h-4 w-4" />
                Consolidate
              </Button>

              {/* Button 4: Generate CoPilot Narrative Prompt */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateNarrativePrompt}
                disabled={displayRows.length === 0}
              >
                <Wand2 className="mr-2 h-4 w-4" />
                Generate Prompt
              </Button>
            </div>
          </div>

          {/* Secondary Action Buttons */}
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-dashed">
            <Button variant="ghost" size="sm" onClick={handleRefreshData}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button variant="ghost" size="sm" onClick={handleOpenFolder}>
              <FolderOpen className="mr-2 h-4 w-4" />
              Open Folder
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAutoAssign}
              disabled={displayRows.length === 0}
            >
              <Users className="mr-2 h-4 w-4" />
              Auto-Assign
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleValidate}
              disabled={displayRows.length === 0}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Validate
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExport}
              disabled={displayRows.length === 0}
            >
              <FileDown className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{displayRows.length}</div>
            <p className="text-xs text-muted-foreground">Total Samples</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{Object.keys(stats.byJurisdiction).length}</div>
            <p className="text-xs text-muted-foreground">Jurisdictions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.avgIRR.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Avg IRR</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.avgDRR.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Avg DRR</p>
          </CardContent>
        </Card>
      </div>

      {/* Assignment Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sample Assignments</CardTitle>
          <CardDescription>
            {filteredRows.length} of {displayRows.length} samples shown
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by GCI or Legal Name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={jurisdictionFilter} onValueChange={setJurisdictionFilter}>
              <SelectTrigger className="w-[150px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Jurisdiction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Jurisdictions</SelectItem>
                {uniqueJurisdictions.map((j) => (
                  <SelectItem key={j} value={j}>
                    {j}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={auditorFilter} onValueChange={setAuditorFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Auditor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Auditors</SelectItem>
                {uniqueAuditors.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={partyTypeFilter} onValueChange={setPartyTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Party Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Party Types</SelectItem>
                {partyTypes.map((pt) => (
                  <SelectItem key={pt} value={pt}>
                    {pt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">#</TableHead>
                  <TableHead className="w-[100px]">GCI</TableHead>
                  <TableHead className="min-w-[180px]">Legal Name</TableHead>
                  <TableHead className="w-[80px]">Jurisdiction</TableHead>
                  <TableHead className="w-[120px]">Auditor</TableHead>
                  <TableHead className="w-[60px]">IRR</TableHead>
                  <TableHead className="w-[60px]">DRR</TableHead>
                  <TableHead className="min-w-[150px]">Party Type</TableHead>
                  <TableHead className="w-[100px]">KYC Date</TableHead>
                  <TableHead className="w-[120px]">Primary FLU</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      {displayRows.length === 0
                        ? "No samples loaded. Import sampling data or populate from existing records."
                        : "No samples found matching your filters"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRows.map((row) => (
                    <TableRow key={row.Sampling_Index}>
                      <TableCell className="font-mono text-sm">{row.Sampling_Index}</TableCell>
                      <TableCell className="font-mono text-sm">{row.GCI}</TableCell>
                      <TableCell className="font-medium">{row.Legal_Name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{row.Jurisdiction_ID}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{row.Auditor_Name}</TableCell>
                      <TableCell className="font-mono text-sm">{row.IRR.toFixed(1)}</TableCell>
                      <TableCell className="font-mono text-sm">{row.DRR.toFixed(1)}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={PARTY_TYPE_COLORS[row.Party_Type] || ""}
                        >
                          {row.Party_Type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{formatDate(row.KYC_Date)}</TableCell>
                      <TableCell className="text-sm">{row.Primary_FLU}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
