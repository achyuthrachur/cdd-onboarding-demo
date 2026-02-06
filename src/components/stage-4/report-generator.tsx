"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  FileBarChart,
  Download,
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
  FileText,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { ConsolidationResult } from "@/lib/consolidation/engine";
import { downloadConsolidationExcel } from "@/lib/consolidation/export";
import {
  motion,
  AnimatePresence,
  Presence,
  useReducedMotion,
  staggerContainer,
  staggerItem,
} from "@/lib/animations";

interface ReportGeneratorProps {
  consolidation: ConsolidationResult | null;
  auditRunId: string;
}

interface ReportOptions {
  includeExecutiveSummary: boolean;
  includeFindingsDetail: boolean;
  includeExceptionsList: boolean;
  includeMetricsCharts: boolean;
  includeSupportingData: boolean;
}

export function ReportGenerator({
  consolidation,
  auditRunId,
}: ReportGeneratorProps) {
  const shouldReduceMotion = useReducedMotion();
  const [isGenerating, setIsGenerating] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [reportOptions, setReportOptions] = useState<ReportOptions>({
    includeExecutiveSummary: true,
    includeFindingsDetail: true,
    includeExceptionsList: true,
    includeMetricsCharts: true,
    includeSupportingData: false,
  });

  const canGenerate = consolidation !== null;

  const showExportSuccess = (type: string) => {
    setExportSuccess(type);
    setTimeout(() => setExportSuccess(null), 2000);
  };

  const handleGenerateReport = async () => {
    if (!consolidation) return;

    setIsGenerating(true);
    try {
      // Generate the report content
      const reportContent = generateReportHTML(consolidation, reportOptions);

      // Create a blob and download
      const blob = new Blob([reportContent], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-report-${auditRunId}-${new Date().toISOString().split("T")[0]}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Report generated successfully");
      showExportSuccess("html");
    } catch {
      toast.error("Failed to generate report");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportData = async () => {
    if (!consolidation) return;

    try {
      // Export as JSON
      const dataExport = {
        exportedAt: new Date().toISOString(),
        auditRunId: consolidation.auditRunId,
        metrics: consolidation.metrics,
        findingsByCategory: consolidation.findingsByCategory,
        findingsByAttribute: consolidation.findingsByAttribute,
        exceptions: consolidation.exceptions,
      };

      const blob = new Blob([JSON.stringify(dataExport, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-data-${auditRunId}-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Data exported successfully");
      showExportSuccess("json");
    } catch {
      toast.error("Failed to export data");
    }
  };

  const handleExportCSV = async () => {
    if (!consolidation) return;

    try {
      // Export exceptions as CSV
      const headers = [
        "Entity",
        "Sample ID",
        "Attribute",
        "Category",
        "Observation",
        "Evidence Reference",
        "Auditor Notes",
      ];

      const rows = consolidation.exceptions.map((exc) => [
        exc.entityName,
        exc.sampleItemId,
        exc.attributeName,
        exc.category,
        `"${exc.observation.replace(/"/g, '""')}"`,
        exc.evidenceReference,
        `"${exc.auditorNotes.replace(/"/g, '""')}"`,
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.join(",")),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-exceptions-${auditRunId}-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("CSV exported successfully");
      showExportSuccess("csv");
    } catch {
      toast.error("Failed to export CSV");
    }
  };

  const handleExportExcel = async () => {
    if (!consolidation) return;

    try {
      const filename = `consolidation-report-${auditRunId}-${new Date().toISOString().split("T")[0]}.xlsx`;
      await downloadConsolidationExcel(consolidation, filename);
      toast.success("Excel report exported successfully");
      showExportSuccess("excel");
    } catch {
      toast.error("Failed to export Excel report");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileBarChart className="h-5 w-5" />
          Report Generation
        </CardTitle>
        <CardDescription>
          Generate the final audit report and export data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Report Status */}
        <AnimatePresence>
          {consolidation && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-3 p-4 bg-crowe-teal/10 rounded-lg"
            >
              <motion.div
                initial={shouldReduceMotion ? undefined : { scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}
              >
                <CheckCircle2 className="h-5 w-5 text-crowe-teal-bright" />
              </motion.div>
              <div>
                <p className="font-medium text-crowe-teal-bright">
                  Consolidation Complete
                </p>
                <p className="text-sm text-crowe-teal">
                  Generated at {new Date(consolidation.generatedAt).toLocaleString()}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Report Options */}
        <motion.div
          className="space-y-4"
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h4 className="font-medium">Report Sections</h4>
          <motion.div
            className="space-y-3"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {[
              { id: "executiveSummary", label: "Executive Summary", key: "includeExecutiveSummary", badge: "Recommended", badgeVariant: "secondary" as const },
              { id: "findingsDetail", label: "Findings by Category", key: "includeFindingsDetail" },
              { id: "exceptionsList", label: "Exceptions List", key: "includeExceptionsList" },
              { id: "metricsCharts", label: "Metrics Summary", key: "includeMetricsCharts" },
              { id: "supportingData", label: "Supporting Raw Data", key: "includeSupportingData", badge: "Large file", badgeVariant: "outline" as const },
            ].map((option) => (
              <motion.div
                key={option.id}
                variants={staggerItem}
                className="flex items-center space-x-2"
              >
                <Checkbox
                  id={option.id}
                  checked={reportOptions[option.key as keyof ReportOptions]}
                  onCheckedChange={(checked) =>
                    setReportOptions((prev) => ({
                      ...prev,
                      [option.key]: !!checked,
                    }))
                  }
                />
                <Label htmlFor={option.id} className="flex items-center gap-2">
                  {option.label}
                  {option.badge && (
                    <Badge variant={option.badgeVariant}>{option.badge}</Badge>
                  )}
                </Label>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Generate Buttons */}
        <motion.div
          className="space-y-3"
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div
            whileHover={shouldReduceMotion || !canGenerate || isGenerating ? undefined : { scale: 1.01 }}
            whileTap={shouldReduceMotion || !canGenerate || isGenerating ? undefined : { scale: 0.99 }}
          >
            <Button
              onClick={handleGenerateReport}
              disabled={!canGenerate || isGenerating}
              className="w-full"
            >
              <AnimatePresence mode="wait">
                {isGenerating ? (
                  <motion.span
                    key="generating"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center"
                  >
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Report...
                  </motion.span>
                ) : exportSuccess === "html" ? (
                  <motion.span
                    key="success"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center text-green-100"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Report Generated!
                  </motion.span>
                ) : (
                  <motion.span
                    key="default"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center"
                  >
                    <FileBarChart className="mr-2 h-4 w-4" />
                    Generate HTML Report
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          </motion.div>

          <motion.div
            className="grid grid-cols-3 gap-3"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={staggerItem}>
              <Button
                variant="outline"
                onClick={handleExportExcel}
                disabled={!canGenerate}
                className="w-full"
              >
                <AnimatePresence mode="wait">
                  {exportSuccess === "excel" ? (
                    <motion.span
                      key="success"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center text-crowe-teal-bright"
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Done!
                    </motion.span>
                  ) : (
                    <motion.span
                      key="default"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center"
                    >
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Export Excel
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
            </motion.div>
            <motion.div variants={staggerItem}>
              <Button
                variant="outline"
                onClick={handleExportData}
                disabled={!canGenerate}
                className="w-full"
              >
                <AnimatePresence mode="wait">
                  {exportSuccess === "json" ? (
                    <motion.span
                      key="success"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center text-crowe-teal-bright"
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Done!
                    </motion.span>
                  ) : (
                    <motion.span
                      key="default"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Export JSON
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
            </motion.div>
            <motion.div variants={staggerItem}>
              <Button
                variant="outline"
                onClick={handleExportCSV}
                disabled={!canGenerate}
                className="w-full"
              >
                <AnimatePresence mode="wait">
                  {exportSuccess === "csv" ? (
                    <motion.span
                      key="success"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center text-crowe-teal-bright"
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Done!
                    </motion.span>
                  ) : (
                    <motion.span
                      key="default"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export CSV
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>

        <Presence isVisible={!canGenerate}>
          <p className="text-sm text-white/70 text-center">
            Generate a consolidation first to create reports
          </p>
        </Presence>
      </CardContent>
    </Card>
  );
}

function generateReportHTML(
  consolidation: ConsolidationResult,
  options: ReportOptions
): string {
  const { metrics, findingsByCategory, exceptions } = consolidation;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Audit Report - ${consolidation.auditRunId}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 900px; margin: 0 auto; padding: 40px 20px; }
    h1 { font-size: 28px; margin-bottom: 10px; color: #1a1a1a; }
    h2 { font-size: 20px; margin: 30px 0 15px; padding-bottom: 8px; border-bottom: 2px solid #e5e5e5; }
    h3 { font-size: 16px; margin: 20px 0 10px; color: #666; }
    .header { border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
    .header p { color: #666; }
    .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
    .metric { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
    .metric .value { font-size: 32px; font-weight: bold; }
    .metric .label { font-size: 12px; color: #666; text-transform: uppercase; }
    .metric.pass .value { color: #16a34a; }
    .metric.fail .value { color: #dc2626; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e5e5; }
    th { background: #f8f9fa; font-weight: 600; font-size: 12px; text-transform: uppercase; color: #666; }
    tr:hover { background: #f8f9fa; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; }
    .badge-red { background: #fee2e2; color: #dc2626; }
    .badge-green { background: #dcfce7; color: #16a34a; }
    .badge-gray { background: #f3f4f6; color: #6b7280; }
    .progress-bar { height: 8px; background: #e5e5e5; border-radius: 4px; overflow: hidden; margin: 8px 0; }
    .progress-bar .fill { height: 100%; }
    .progress-bar .pass { background: #16a34a; }
    .progress-bar .fail { background: #dc2626; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e5e5; font-size: 12px; color: #666; }
    @media print { body { max-width: none; padding: 20px; } .metrics { grid-template-columns: repeat(2, 1fr); } }
  </style>
</head>
<body>
  <div class="header">
    <h1>CDD Audit Report</h1>
    <p>Audit Run: ${consolidation.auditRunId}</p>
    <p>Generated: ${new Date(consolidation.generatedAt).toLocaleString()}</p>
  </div>

  ${options.includeExecutiveSummary ? `
  <h2>Executive Summary</h2>
  <p>This report summarizes the results of CDD testing conducted across ${metrics.workbooksSubmitted} workbook(s), covering ${metrics.totalTests} individual tests on ${metrics.uniqueEntitiesTested} unique entities against ${metrics.uniqueAttributesTested} testing attributes.</p>

  <h3>Key Findings</h3>
  <ul style="margin: 10px 0 20px 20px;">
    <li>Overall pass rate: <strong>${metrics.passRate.toFixed(1)}%</strong></li>
    <li>Total exceptions identified: <strong>${metrics.exceptionsCount}</strong></li>
    <li>Highest failure rate category: <strong>${findingsByCategory[0]?.category || 'N/A'}</strong> (${findingsByCategory[0]?.failRate.toFixed(1) || 0}%)</li>
  </ul>
  ` : ''}

  ${options.includeMetricsCharts ? `
  <h2>Metrics Summary</h2>
  <div class="metrics">
    <div class="metric">
      <div class="value">${metrics.totalTests}</div>
      <div class="label">Total Tests</div>
    </div>
    <div class="metric pass">
      <div class="value">${metrics.passRate.toFixed(1)}%</div>
      <div class="label">Pass Rate</div>
    </div>
    <div class="metric fail">
      <div class="value">${metrics.exceptionsCount}</div>
      <div class="label">Exceptions</div>
    </div>
    <div class="metric">
      <div class="value">${metrics.workbooksSubmitted}</div>
      <div class="label">Workbooks</div>
    </div>
  </div>

  <h3>Results Breakdown</h3>
  <table>
    <tr>
      <td>Passed</td>
      <td>${metrics.passCount}</td>
      <td><span class="badge badge-green">${((metrics.passCount / metrics.totalTests) * 100).toFixed(1)}%</span></td>
    </tr>
    <tr>
      <td>Failed</td>
      <td>${metrics.failCount}</td>
      <td><span class="badge badge-red">${((metrics.failCount / metrics.totalTests) * 100).toFixed(1)}%</span></td>
    </tr>
    <tr>
      <td>Not Applicable</td>
      <td>${metrics.naCount}</td>
      <td><span class="badge badge-gray">${((metrics.naCount / metrics.totalTests) * 100).toFixed(1)}%</span></td>
    </tr>
  </table>
  ` : ''}

  ${options.includeFindingsDetail ? `
  <h2>Findings by Category</h2>
  <table>
    <thead>
      <tr>
        <th>Category</th>
        <th>Tests</th>
        <th>Pass</th>
        <th>Fail</th>
        <th>N/A</th>
        <th>Fail Rate</th>
      </tr>
    </thead>
    <tbody>
      ${findingsByCategory.map(cat => `
        <tr>
          <td>${cat.category}</td>
          <td>${cat.totalTests}</td>
          <td>${cat.passCount}</td>
          <td>${cat.failCount}</td>
          <td>${cat.naCount}</td>
          <td><span class="badge ${cat.failRate > 10 ? 'badge-red' : 'badge-gray'}">${cat.failRate.toFixed(1)}%</span></td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  ` : ''}

  ${options.includeExceptionsList ? `
  <h2>Exceptions List</h2>
  ${exceptions.length === 0 ? '<p>No exceptions were identified during testing.</p>' : `
  <table>
    <thead>
      <tr>
        <th>Entity</th>
        <th>Attribute</th>
        <th>Category</th>
        <th>Observation</th>
        <th>Evidence</th>
      </tr>
    </thead>
    <tbody>
      ${exceptions.map(exc => `
        <tr>
          <td>${exc.entityName}</td>
          <td>${exc.attributeName}</td>
          <td>${exc.category}</td>
          <td>${exc.observation}</td>
          <td>${exc.evidenceReference}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  `}
  ` : ''}

  <div class="footer">
    <p>Report ID: ${consolidation.id}</p>
    <p>Generated by CDD Onboarding Demo</p>
  </div>
</body>
</html>
  `.trim();
}
