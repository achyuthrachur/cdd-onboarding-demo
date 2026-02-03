import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Grid3X3, Users, CheckSquare, FileDown } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Stage3Page({ params }: PageProps) {
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
              <Badge className="bg-purple-100 text-purple-700">Stage 3</Badge>
              <h1 className="text-3xl font-bold tracking-tight">Testing Workbooks</h1>
            </div>
            <p className="text-muted-foreground mt-2">
              Generate workbooks, complete testing, and submit results
            </p>
          </div>
          <Button>
            <Grid3X3 className="mr-2 h-4 w-4" />
            Generate Workbooks
          </Button>
        </div>
      </div>

      {/* Workflow Steps */}
      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                <Grid3X3 className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base">Generate</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Create workbooks from attributes and sample
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base">Assign</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Assign workbooks to auditors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600">
                <CheckSquare className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base">Complete</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Complete testing in spreadsheet UI
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                <FileDown className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base">Submit</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Submit for consolidation
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Workbooks List */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Grid3X3 className="h-5 w-5" />
            Workbooks
          </CardTitle>
          <CardDescription>
            Manage testing workbooks for this audit run
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Grid3X3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="font-medium mb-2">No workbooks generated</h3>
            <p className="text-sm mb-4">
              Complete Stage 2 (Sampling) to generate workbooks
            </p>
            <Button disabled>
              <Grid3X3 className="mr-2 h-4 w-4" />
              Generate Workbooks
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Link href={`/audit-runs/${id}/stage-2`}>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Stage 2
          </Button>
        </Link>
        <Link href={`/audit-runs/${id}/stage-4`}>
          <Button disabled>
            Continue to Reporting
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
