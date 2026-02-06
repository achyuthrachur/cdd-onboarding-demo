"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AnimatedProgress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  Save,
  Download,
  Send,
  AlertCircle,
  Loader2,
  FileText,
  Search,
  Filter,
  XCircle,
  MinusCircle,
  HelpCircle,
  AlertTriangle,
  Eye,
} from "lucide-react";
import {
  motion,
  AnimatePresence,
  FadeInUp,
  useCountUp,
  useReducedMotion,
  staggerContainer,
  staggerItem,
} from "@/lib/animations";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import {
  getStageData,
  setStageData,
  PivotedAuditorWorkbook,
  PivotedWorkbookRow,
  AcceptableDocOption,
  CustomerTestResult,
} from "@/lib/stage-data";
import { STANDARD_OBSERVATIONS } from "@/lib/workbook/builder";
import { getCurrentAuditorId } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

// Helper to get result from selected document
function getResultFromSelection(
  selectedValue: string,
  acceptableDocs: AcceptableDocOption[]
): CustomerTestResult['result'] {
  if (!selectedValue) return '';
  const option = acceptableDocs.find(doc => doc.value === selectedValue);
  return option?.resultMapping || '';
}

// Helper to check if selection requires observation modal
function selectionRequiresObservation(selectedValue: string): boolean {
  return selectedValue === 'other-issue';
}

// Get badge color based on result
function getResultBadgeClass(result: string): string {
  switch (result) {
    case 'Pass':
      return 'bg-crowe-teal/20 text-crowe-teal-bright border-crowe-teal/40';
    case 'Pass w/Observation':
      return 'bg-crowe-amber/20 text-crowe-amber-bright border-crowe-amber/40';
    case 'Fail 1 - Regulatory':
      return 'bg-crowe-coral/20 text-crowe-coral-bright border-crowe-coral/40';
    case 'Fail 2 - Procedure':
      return 'bg-crowe-amber-dark/20 text-crowe-amber border-crowe-amber-dark/40';
    case 'Question to LOB':
      return 'bg-crowe-blue/20 text-crowe-blue-light border-crowe-blue/40';
    case 'N/A':
      return 'bg-white/10 text-white/60 border-white/20';
    default:
      return 'bg-white/5 text-white/60 border-white/10';
  }
}

// Get result icon
function getResultIcon(result: string) {
  switch (result) {
    case 'Pass':
      return <CheckCircle2 className="h-3 w-3" />;
    case 'Pass w/Observation':
      return <CheckCircle2 className="h-3 w-3" />;
    case 'Fail 1 - Regulatory':
      return <XCircle className="h-3 w-3" />;
    case 'Fail 2 - Procedure':
      return <AlertTriangle className="h-3 w-3" />;
    case 'Question to LOB':
      return <HelpCircle className="h-3 w-3" />;
    case 'N/A':
      return <MinusCircle className="h-3 w-3" />;
    default:
      return null;
  }
}

// Document Selection Cell Component
interface DocumentSelectionCellProps {
  row: PivotedWorkbookRow;
  customerId: string;
  customerResult: CustomerTestResult | undefined;
  isSubmitted: boolean;
  onSelectionChange: (rowId: string, customerId: string, selectedDoc: string, result: CustomerTestResult['result']) => void;
  onObservationRequired: (rowId: string, customerId: string, selectedDoc: string) => void;
}

function DocumentSelectionCell({
  row,
  customerId,
  customerResult,
  isSubmitted,
  onSelectionChange,
  onObservationRequired,
}: DocumentSelectionCellProps) {
  const selectedDoc = customerResult?.selectedDocument || '';
  const result = customerResult?.result || '';
  const acceptableDocs = row.acceptableDocs || [];

  // Separate document options from system options
  const documentOptions = acceptableDocs.filter(doc => !doc.isSystemOption);
  const systemOptions = acceptableDocs.filter(doc => doc.isSystemOption);

  const handleChange = (value: string) => {
    if (selectionRequiresObservation(value)) {
      // Open observation modal
      onObservationRequired(row.id, customerId, value);
    } else {
      // Direct selection - derive result from doc
      const newResult = getResultFromSelection(value, acceptableDocs);
      onSelectionChange(row.id, customerId, value, newResult);
    }
  };

  // Get display label for current selection
  const getDisplayLabel = () => {
    if (!selectedDoc) return 'Select...';
    const option = acceptableDocs.find(doc => doc.value === selectedDoc);
    return option?.label || selectedDoc;
  };

  return (
    <div className="flex flex-col gap-1">
      <Select
        value={selectedDoc || undefined}
        onValueChange={handleChange}
        disabled={isSubmitted}
      >
        <SelectTrigger className={cn(
          "w-full h-8 text-xs bg-white/10 border-white/20 text-white",
          result && getResultBadgeClass(result)
        )}>
          <div className="flex items-center gap-1.5 truncate">
            {result && getResultIcon(result)}
            <SelectValue placeholder="Select document...">
              <span className="truncate">{getDisplayLabel()}</span>
            </SelectValue>
          </div>
        </SelectTrigger>
        <SelectContent className="max-h-[300px] bg-crowe-indigo-dark/95 backdrop-blur-xl border-white/20">
          {/* Acceptable Documents Section */}
          {documentOptions.length > 0 && (
            <>
              <div className="px-2 py-1.5 text-xs font-semibold text-crowe-amber-bright bg-crowe-amber/10 sticky top-0">
                <FileText className="h-3 w-3 inline mr-1.5" />
                Acceptable Documents (Pass)
              </div>
              {documentOptions.map((doc) => (
                <SelectItem
                  key={doc.value}
                  value={doc.value}
                  className="text-xs text-white hover:bg-crowe-teal/20"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3 text-crowe-teal-bright" />
                    <span>{doc.label}</span>
                  </div>
                </SelectItem>
              ))}
            </>
          )}

          <SelectSeparator className="bg-white/20" />

          {/* System Options Section */}
          <div className="px-2 py-1.5 text-xs font-semibold text-white/60 bg-white/5 sticky top-0">
            Other Options
          </div>
          {systemOptions.map((doc) => (
            <SelectItem
              key={doc.value}
              value={doc.value}
              className={cn(
                "text-xs hover:bg-white/10",
                doc.resultMapping.includes('Fail') && "text-crowe-coral-bright",
                doc.resultMapping === 'Question to LOB' && "text-crowe-blue-light",
                doc.resultMapping === 'N/A' && "text-white/60",
                doc.resultMapping === 'Pass w/Observation' && "text-crowe-amber-bright"
              )}
            >
              <div className="flex items-center gap-2">
                {getResultIcon(doc.resultMapping)}
                <span>{doc.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Show observation if exists */}
      {customerResult?.observation && (
        <div className="text-[10px] text-white/70 truncate" title={customerResult.observation}>
          Obs: {customerResult.observation.substring(0, 30)}...
        </div>
      )}
    </div>
  );
}

export default function AuditorWorkbookPage() {
  const params = useParams();
  const router = useRouter();
  const workbookId = params.id as string;

  const [workbook, setWorkbook] = useState<PivotedAuditorWorkbook | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Observation modal state
  const [observationModal, setObservationModal] = useState<{
    isOpen: boolean;
    rowId: string;
    customerId: string;
    selectedDoc: string;
    observation: string;
  }>({
    isOpen: false,
    rowId: '',
    customerId: '',
    selectedDoc: '',
    observation: '',
  });

  const [testingProgress, setTestingProgress] = useState({
    totalTests: 0,
    completedTests: 0,
    passCount: 0,
    passWithObsCount: 0,
    fail1RegulatoryCount: 0,
    fail2ProcedureCount: 0,
    questionToLOBCount: 0,
    naCount: 0,
  });

  const shouldReduceMotion = useReducedMotion();

  // Load workbook on mount
  useEffect(() => {
    const currentAuditorId = getCurrentAuditorId();
    const pivotedWorkbooks = getStageData("pivotedWorkbooks") as PivotedAuditorWorkbook[] | null;
    const auditorProgress = getStageData("auditorProgress") as Record<string, {
      completionPercentage: number;
      status: 'draft' | 'in_progress' | 'submitted';
      lastActivityAt: string;
      submittedAt: string | null;
    }> | null;

    if (pivotedWorkbooks) {
      // Find this auditor's workbook
      const myWorkbook = pivotedWorkbooks.find(wb => wb.auditorId === workbookId);
      if (myWorkbook) {
        // Verify this workbook belongs to the current auditor
        if (currentAuditorId && myWorkbook.auditorId !== currentAuditorId) {
          toast.error("You don't have access to this workbook");
          router.push("/auditor/workbooks");
          return;
        }

        setWorkbook(myWorkbook);
        updateProgressFromWorkbook(myWorkbook);

        // Check if submitted
        const progress = auditorProgress?.[myWorkbook.auditorId];
        if (progress?.status === 'submitted') {
          setIsSubmitted(true);
        }
      }
    }

    setIsLoading(false);
  }, [workbookId, router]);

  // Get unique categories
  const categories = useMemo(() => {
    if (!workbook) return [];
    const cats = new Set(workbook.rows.map(r => r.attributeCategory));
    return Array.from(cats);
  }, [workbook]);

  // Filter rows
  const filteredRows = useMemo(() => {
    if (!workbook) return [];
    return workbook.rows.filter(row => {
      const matchesSearch =
        row.attributeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.questionText.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (row.attributeName?.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = categoryFilter === 'all' || row.attributeCategory === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [workbook, searchTerm, categoryFilter]);

  // Calculate progress
  const updateProgressFromWorkbook = (wb: PivotedAuditorWorkbook) => {
    let totalTests = 0;
    let passCount = 0;
    let passWithObsCount = 0;
    let fail1RegulatoryCount = 0;
    let fail2ProcedureCount = 0;
    let questionToLOBCount = 0;
    let naCount = 0;

    wb.rows.forEach(row => {
      Object.values(row.customerResults).forEach(result => {
        totalTests++;
        switch (result.result) {
          case 'Pass':
            passCount++;
            break;
          case 'Pass w/Observation':
            passWithObsCount++;
            break;
          case 'Fail 1 - Regulatory':
            fail1RegulatoryCount++;
            break;
          case 'Fail 2 - Procedure':
            fail2ProcedureCount++;
            break;
          case 'Question to LOB':
            questionToLOBCount++;
            break;
          case 'N/A':
            naCount++;
            break;
        }
      });
    });

    const completedTests = passCount + passWithObsCount + fail1RegulatoryCount +
                          fail2ProcedureCount + questionToLOBCount + naCount;

    setTestingProgress({
      totalTests,
      completedTests,
      passCount,
      passWithObsCount,
      fail1RegulatoryCount,
      fail2ProcedureCount,
      questionToLOBCount,
      naCount,
    });
  };

  // Handle document selection change
  const handleSelectionChange = useCallback((
    rowId: string,
    customerId: string,
    selectedDoc: string,
    result: CustomerTestResult['result']
  ) => {
    if (!workbook || isSubmitted) return;

    const updatedWorkbook = { ...workbook };
    const updatedRows = [...updatedWorkbook.rows];
    const rowIndex = updatedRows.findIndex(r => r.id === rowId);

    if (rowIndex === -1) return;

    const row = { ...updatedRows[rowIndex] };
    const customerResults = { ...row.customerResults };
    const existingResult = customerResults[customerId];

    customerResults[customerId] = {
      customerId: existingResult?.customerId || customerId,
      customerName: existingResult?.customerName || '',
      selectedDocument: selectedDoc,
      result: result,
      observation: existingResult?.observation || '',
    };

    row.customerResults = customerResults;
    updatedRows[rowIndex] = row;
    updatedWorkbook.rows = updatedRows;

    setWorkbook(updatedWorkbook);
    updateProgressFromWorkbook(updatedWorkbook);

    // Auto-save to storage
    const pivotedWorkbooks = getStageData("pivotedWorkbooks") as PivotedAuditorWorkbook[] | null;
    if (pivotedWorkbooks) {
      const idx = pivotedWorkbooks.findIndex(wb => wb.auditorId === workbook.auditorId);
      if (idx !== -1) {
        pivotedWorkbooks[idx] = updatedWorkbook;
        setStageData("pivotedWorkbooks", pivotedWorkbooks);
      }
    }
  }, [workbook, isSubmitted]);

  // Handle observation required (opens modal)
  const handleObservationRequired = useCallback((rowId: string, customerId: string, selectedDoc: string) => {
    setObservationModal({
      isOpen: true,
      rowId,
      customerId,
      selectedDoc,
      observation: '',
    });
  }, []);

  // Handle observation submit
  const handleObservationSubmit = useCallback(() => {
    const { rowId, customerId, selectedDoc, observation } = observationModal;
    if (!workbook || isSubmitted) return;

    const row = workbook.rows.find(r => r.id === rowId);
    if (!row) return;

    const result = getResultFromSelection(selectedDoc, row.acceptableDocs || []);

    const updatedWorkbook = { ...workbook };
    const updatedRows = [...updatedWorkbook.rows];
    const rowIndex = updatedRows.findIndex(r => r.id === rowId);

    if (rowIndex === -1) return;

    const updatedRow = { ...updatedRows[rowIndex] };
    const customerResults = { ...updatedRow.customerResults };
    const existingResult = customerResults[customerId];

    customerResults[customerId] = {
      customerId: existingResult?.customerId || customerId,
      customerName: existingResult?.customerName || '',
      selectedDocument: selectedDoc,
      result: result,
      observation: observation,
    };

    updatedRow.customerResults = customerResults;
    updatedRows[rowIndex] = updatedRow;
    updatedWorkbook.rows = updatedRows;

    setWorkbook(updatedWorkbook);
    updateProgressFromWorkbook(updatedWorkbook);

    // Auto-save to storage
    const pivotedWorkbooks = getStageData("pivotedWorkbooks") as PivotedAuditorWorkbook[] | null;
    if (pivotedWorkbooks) {
      const idx = pivotedWorkbooks.findIndex(wb => wb.auditorId === workbook.auditorId);
      if (idx !== -1) {
        pivotedWorkbooks[idx] = updatedWorkbook;
        setStageData("pivotedWorkbooks", pivotedWorkbooks);
      }
    }

    setObservationModal({ isOpen: false, rowId: '', customerId: '', selectedDoc: '', observation: '' });
  }, [workbook, isSubmitted, observationModal]);

  // Save progress
  const handleSave = async () => {
    if (!workbook) return;

    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      // Update auditor progress
      const auditorProgress = getStageData("auditorProgress") || {};
      const updatedProgress = {
        ...auditorProgress,
        [workbook.auditorId]: {
          completionPercentage: completionPercentage,
          status: 'in_progress' as const,
          lastActivityAt: new Date().toISOString(),
          submittedAt: null,
        },
      };
      setStageData("auditorProgress", updatedProgress);

      toast.success("Progress saved");
    } catch (error) {
      console.error("Save failed:", error);
      toast.error("Failed to save progress");
    } finally {
      setIsSaving(false);
    }
  };

  // Submit workbook
  const handleSubmit = async () => {
    if (!workbook || completionPercentage < 95) return;

    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update auditor progress
      const auditorProgress = getStageData("auditorProgress") || {};
      const updatedProgress = {
        ...auditorProgress,
        [workbook.auditorId]: {
          completionPercentage: completionPercentage,
          status: 'submitted' as const,
          lastActivityAt: new Date().toISOString(),
          submittedAt: new Date().toISOString(),
        },
      };
      setStageData("auditorProgress", updatedProgress);

      setIsSubmitted(true);
      setShowSubmitDialog(false);
      toast.success("Workbook submitted successfully!", {
        description: "Your testing results have been submitted to the AIC.",
      });
    } catch (error) {
      console.error("Submit failed:", error);
      toast.error("Failed to submit workbook");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Export to Excel
  const handleExportToExcel = () => {
    if (!workbook) return;

    const wb = XLSX.utils.book_new();

    const headers = ['Attribute ID', 'Category', 'Question Text'];
    workbook.assignedCustomers.forEach(customer => {
      headers.push(`${customer.customerName} - Document`);
      headers.push(`${customer.customerName} - Result`);
      headers.push(`${customer.customerName} - Observation`);
    });

    const data = [headers];
    workbook.rows.forEach(row => {
      const rowData: string[] = [row.attributeId, row.attributeCategory, row.questionText];
      workbook.assignedCustomers.forEach(customer => {
        const result = row.customerResults[customer.customerId];
        const selectedDocLabel = row.acceptableDocs?.find(d => d.value === result?.selectedDocument)?.label || '';
        rowData.push(selectedDocLabel);
        rowData.push(result?.result || '');
        rowData.push(result?.observation || '');
      });
      data.push(rowData);
    });

    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Testing Workbook');
    XLSX.writeFile(wb, `Testing_Workbook_${workbook.auditorName}.xlsx`);
    toast.success("Exported to Excel");
  };

  // Calculate completion
  const completionPercentage = testingProgress.totalTests > 0
    ? Math.round((testingProgress.completedTests / testingProgress.totalTests) * 100)
    : 0;

  const canSubmit = completionPercentage >= 95 && !isSubmitted;

  // Animated counts
  const animatedPassCount = useCountUp(testingProgress.passCount + testingProgress.passWithObsCount, { duration: 0.8, delay: 0.2 });
  const animatedFailCount = useCountUp(testingProgress.fail1RegulatoryCount + testingProgress.fail2ProcedureCount, { duration: 0.8, delay: 0.3 });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white/70" />
      </div>
    );
  }

  if (!workbook) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-white/30" />
          <h2 className="text-lg font-medium mb-2 text-white">Workbook Not Found</h2>
          <p className="text-white/70 mb-4">
            This workbook doesn&apos;t exist or you don&apos;t have access to it.
          </p>
          <Link href="/auditor/workbooks">
            <Button className="bg-crowe-amber text-crowe-indigo-dark hover:bg-crowe-amber-bright">Back to Workbooks</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <FadeInUp className="mb-8">
        <Link
          href="/auditor/workbooks"
          className="inline-flex items-center text-sm text-white/70 hover:text-white mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Workbooks
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-white">Testing Workbook</h1>
              {isSubmitted && (
                <Badge className="bg-green-600">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Submitted
                </Badge>
              )}
            </div>
            <p className="text-white/70 mt-2">
              {workbook.assignedCustomers.length} customers | {workbook.attributes.length} attributes
            </p>
          </div>
          <motion.div
            className="flex gap-2"
            initial={shouldReduceMotion ? undefined : { opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Button variant="outline" onClick={handleExportToExcel} className="border-white/20 text-white hover:bg-white/10">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            {!isSubmitted && (
              <>
                <Button variant="outline" onClick={handleSave} disabled={isSaving} className="border-white/20 text-white hover:bg-white/10">
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save
                </Button>
                <Button
                  onClick={() => setShowSubmitDialog(true)}
                  disabled={!canSubmit}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Submit
                </Button>
              </>
            )}
          </motion.div>
        </div>
      </FadeInUp>

      {/* Submitted Banner */}
      {isSubmitted && (
        <motion.div
          className="mb-6 p-4 bg-crowe-teal/20 border border-crowe-teal/40 rounded-lg backdrop-blur-xl"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-crowe-teal-bright" />
            <div>
              <p className="font-medium text-crowe-teal-bright">
                Workbook Submitted
              </p>
              <p className="text-sm text-crowe-teal">
                Your testing results have been submitted. The workbook is now read-only.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Progress Summary */}
      <motion.div
        className="grid gap-6 md:grid-cols-4 mb-8"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={staggerItem}>
          <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white/70">
                Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{completionPercentage}%</div>
              <AnimatedProgress
                value={completionPercentage}
                className={`mt-2 ${completionPercentage >= 95 ? '[&>div]:bg-crowe-teal' : ''}`}
              />
              <p className="text-xs text-white/70 mt-1">
                {testingProgress.completedTests} / {testingProgress.totalTests} tests
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card className={`bg-white/10 backdrop-blur-xl border shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] ${testingProgress.passCount > 0 ? "border-crowe-teal/50" : "border-white/20"}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-crowe-teal-bright">Pass</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-crowe-teal-bright tabular-nums">
                {animatedPassCount}
              </div>
              <p className="text-xs text-white/70 mt-1">
                {testingProgress.totalTests > 0
                  ? (((testingProgress.passCount + testingProgress.passWithObsCount) / testingProgress.totalTests) * 100).toFixed(1)
                  : 0}% pass rate
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card className={`bg-white/10 backdrop-blur-xl border shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] ${testingProgress.fail1RegulatoryCount > 0 ? "border-crowe-coral/50" : "border-white/20"}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-crowe-coral-bright">Fail</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-crowe-coral-bright tabular-nums">
                {animatedFailCount}
              </div>
              <p className="text-xs text-white/70 mt-1">
                {testingProgress.fail1RegulatoryCount + testingProgress.fail2ProcedureCount} exception(s)
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white/70">N/A</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums text-white">{testingProgress.naCount}</div>
              <p className="text-xs text-white/70 mt-1">Not applicable</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Testing Workbook */}
      <motion.div
        initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="mb-6 bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-white">
                  <ClipboardCheck className="h-5 w-5 text-crowe-amber" />
                  Testing Grid
                </CardTitle>
                <CardDescription className="text-white/60">
                  Select the acceptable document found for each test
                </CardDescription>
              </div>
              <AnimatePresence>
                {canSubmit && !isSubmitted && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, x: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.8, x: 20 }}
                  >
                    <Badge className="bg-green-500/20 text-green-400">
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Ready to Submit
                    </Badge>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex gap-3 mb-4">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
                <Input
                  placeholder="Search attributes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-white/60"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40 bg-white/10 border-white/20 text-white">
                  <Filter className="h-4 w-4 mr-2 text-white/60" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="bg-crowe-indigo-dark/95 backdrop-blur-xl border-white/20">
                  <SelectItem value="all" className="text-white">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat} className="text-white">{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Customer Legend */}
            <div className="mb-4 p-3 bg-white/5 rounded-lg border border-white/10">
              <div className="text-xs font-medium text-white/70 mb-2">Assigned Customers:</div>
              <div className="flex flex-wrap gap-2">
                {workbook.assignedCustomers.map((customer, idx) => (
                  <Badge key={customer.customerId} variant="outline" className="text-xs border-white/20 text-white/70">
                    {idx + 1}. {customer.customerName} ({customer.customerId})
                  </Badge>
                ))}
              </div>
            </div>

            {/* Testing Table */}
            <div className="border border-white/20 rounded-lg overflow-hidden bg-white/5">
              <div className="overflow-x-auto max-h-[500px]">
                <Table>
                  <TableHeader className="sticky top-0 bg-crowe-indigo-dark z-10">
                    <TableRow className="border-white/20 hover:bg-transparent">
                      <TableHead className="w-24 text-white/70 bg-crowe-indigo-dark">Attr ID</TableHead>
                      <TableHead className="w-20 text-white/70 bg-crowe-indigo-dark">Category</TableHead>
                      <TableHead className="min-w-[200px] text-white/70 bg-crowe-indigo-dark">Question</TableHead>
                      {workbook.assignedCustomers.map((customer, idx) => (
                        <TableHead
                          key={customer.customerId}
                          className="min-w-[180px] text-white/70 bg-crowe-indigo-dark"
                        >
                          <div className="flex flex-col">
                            <span className="truncate" title={customer.customerName}>
                              {idx + 1}. {customer.customerName.substring(0, 12)}...
                            </span>
                            <span className="text-[10px] text-white/60 font-normal">
                              {customer.customerId}
                            </span>
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRows.map((row) => (
                      <TableRow key={row.id} className="border-white/10 hover:bg-white/5">
                        <TableCell className="font-mono text-xs text-white/70">
                          {row.attributeId}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] border-white/20 text-white/60">
                            {row.attributeCategory}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-white/80" title={row.questionText}>
                          <div className="line-clamp-2">{row.questionText}</div>
                        </TableCell>
                        {workbook.assignedCustomers.map((customer) => (
                          <TableCell key={`${row.id}-${customer.customerId}`} className="p-2">
                            <DocumentSelectionCell
                              row={row}
                              customerId={customer.customerId}
                              customerResult={row.customerResults[customer.customerId]}
                              isSubmitted={isSubmitted}
                              onSelectionChange={handleSelectionChange}
                              onObservationRequired={handleObservationRequired}
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                    {filteredRows.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={3 + workbook.assignedCustomers.length}
                          className="text-center py-8 text-white/70"
                        >
                          No rows match your filter criteria
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="mt-3 text-xs text-white/60">
              Showing {filteredRows.length} of {workbook.rows.length} attributes
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Completion Requirements */}
      <AnimatePresence>
        {!canSubmit && !isSubmitted && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="mb-6 bg-crowe-amber/20 border border-crowe-amber/40 backdrop-blur-xl">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-crowe-amber" />
                  <CardTitle className="text-crowe-amber-bright">Completion Required</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-crowe-amber">
                  At least 95% of tests must be completed to submit.
                  Currently at {completionPercentage}%.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Observation Modal */}
      <Dialog open={observationModal.isOpen} onOpenChange={(open) => {
        if (!open) {
          setObservationModal({ isOpen: false, rowId: '', customerId: '', selectedDoc: '', observation: '' });
        }
      }}>
        <DialogContent className="bg-crowe-indigo-dark/95 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <DialogHeader>
            <DialogTitle className="text-white">Add Observation</DialogTitle>
            <DialogDescription className="text-white/60">
              Please provide an observation for this test result.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-white/70 mb-2 block">
                  Select Observation Type
                </label>
                <Select
                  value={observationModal.observation}
                  onValueChange={(value) => setObservationModal(prev => ({ ...prev, observation: value }))}
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Select a standard observation..." />
                  </SelectTrigger>
                  <SelectContent className="bg-crowe-indigo-dark/95 backdrop-blur-xl border-white/20 max-h-[300px]">
                    {STANDARD_OBSERVATIONS.map((obs) => (
                      <SelectItem key={obs.id} value={obs.text} className="text-white text-xs">
                        {obs.text}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-white/70 mb-2 block">
                  Or enter custom observation
                </label>
                <Textarea
                  value={observationModal.observation}
                  onChange={(e) => setObservationModal(prev => ({ ...prev, observation: e.target.value }))}
                  placeholder="Enter custom observation..."
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                  rows={3}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setObservationModal({ isOpen: false, rowId: '', customerId: '', selectedDoc: '', observation: '' })}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleObservationSubmit}
              disabled={!observationModal.observation}
              className="bg-crowe-amber text-crowe-indigo-dark hover:bg-crowe-amber-bright"
            >
              Save Observation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submit Confirmation Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent className="bg-crowe-indigo-dark/95 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <DialogHeader>
            <DialogTitle className="text-white">Submit Workbook</DialogTitle>
            <DialogDescription className="text-white/60">
              Are you sure you want to submit this workbook? Once submitted,
              you will not be able to make further changes.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg border border-white/10">
                <span className="text-sm text-white/70">Completion:</span>
                <Badge className="bg-crowe-teal">{completionPercentage}%</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg border border-white/10">
                <span className="text-sm text-white/70">Tests Completed:</span>
                <Badge className="bg-crowe-indigo">{testingProgress.completedTests} / {testingProgress.totalTests}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg border border-white/10">
                <span className="text-sm text-white/70">Pass Rate:</span>
                <Badge variant="outline" className="border-white/20 text-white">
                  {testingProgress.totalTests > 0
                    ? (((testingProgress.passCount + testingProgress.passWithObsCount) / testingProgress.totalTests) * 100).toFixed(1)
                    : 0}%
                </Badge>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)} className="border-white/20 text-white hover:bg-white/10">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Workbook
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
