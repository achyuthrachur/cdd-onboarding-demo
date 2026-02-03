import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Upload, FileText, Sparkles, CheckCircle2 } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Stage1Page({ params }: PageProps) {
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
              <Badge className="bg-blue-100 text-blue-700">Stage 1</Badge>
              <h1 className="text-3xl font-bold tracking-tight">Gap Assessment & Attribute Extraction</h1>
            </div>
            <p className="text-muted-foreground mt-2">
              Upload documents, run AI analysis, and review extracted attributes
            </p>
          </div>
        </div>
      </div>

      {/* Workflow Steps */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                <Upload className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base">Step 1</CardTitle>
                <CardDescription>Upload Documents</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Upload Global Standards and FLU procedure documents for comparison.
            </p>
            <Badge variant="outline">0 documents</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base">Step 2</CardTitle>
                <CardDescription>Run AI Analysis</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Run gap assessment and attribute extraction using AI.
            </p>
            <Badge variant="outline">Not started</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base">Step 3</CardTitle>
                <CardDescription>Review & Approve</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Review results and approve to proceed to sampling.
            </p>
            <Badge variant="outline">Pending</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Document Upload Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documents
          </CardTitle>
          <CardDescription>
            Upload the required documents for gap assessment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">Upload Documents</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Drag and drop files here, or click to browse
            </p>
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Select Files
            </Button>
            <p className="text-xs text-muted-foreground mt-4">
              Supported formats: PDF, DOCX, DOC, TXT
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Link href={`/audit-runs/${id}`}>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Overview
          </Button>
        </Link>
        <Link href={`/audit-runs/${id}/stage-2`}>
          <Button disabled>
            Continue to Sampling
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
