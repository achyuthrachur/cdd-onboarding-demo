import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileBarChart, Download, BarChart3, PieChart, AlertTriangle } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Stage4Page({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/audit-runs/${id}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Audit Run
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Badge className="bg-orange-100 text-orange-700">Stage 4</Badge>
              <h1 className="text-3xl font-bold tracking-tight">Consolidation & Reporting</h1>
            </div>
            <p className="text-muted-foreground mt-2">
              Consolidate results, view metrics, and generate final report
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" disabled>
              <Download className="mr-2 h-4 w-4" />
              Export Data
            </Button>
            <Button disabled>
              <FileBarChart className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Tested</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">sample items</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pass Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">--</div>
            <p className="text-xs text-muted-foreground">of completed tests</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Exceptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">0</div>
            <p className="text-xs text-muted-foreground">findings logged</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0%</div>
            <p className="text-xs text-muted-foreground">of workbooks</p>
          </CardContent>
        </Card>
      </div>

      {/* Dashboard Sections */}
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        {/* Results by Attribute */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Results by Attribute
            </CardTitle>
            <CardDescription>
              Pass/Fail breakdown by testing attribute
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No data available</p>
              <p className="text-xs">Complete Stage 3 to view results</p>
            </div>
          </CardContent>
        </Card>

        {/* Results by Jurisdiction */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Results by Jurisdiction
            </CardTitle>
            <CardDescription>
              Distribution of results across jurisdictions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No data available</p>
              <p className="text-xs">Complete Stage 3 to view results</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Exceptions Table */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Exceptions & Findings
          </CardTitle>
          <CardDescription>
            All exceptions logged during testing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="font-medium mb-2">No exceptions found</h3>
            <p className="text-sm">
              Exceptions will appear here after workbook testing is complete
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Report Generation */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileBarChart className="h-5 w-5" />
            Report Generation
          </CardTitle>
          <CardDescription>
            Generate the final audit report
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <h4 className="font-medium">Consolidated Audit Report</h4>
              <p className="text-sm text-muted-foreground">
                PDF report with executive summary, findings, and supporting data
              </p>
            </div>
            <Button disabled>
              <FileBarChart className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Link href={`/audit-runs/${id}/stage-3`}>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Stage 3
          </Button>
        </Link>
        <Link href={`/audit-runs/${id}`}>
          <Button variant="outline">
            Back to Overview
          </Button>
        </Link>
      </div>
    </div>
  );
}
