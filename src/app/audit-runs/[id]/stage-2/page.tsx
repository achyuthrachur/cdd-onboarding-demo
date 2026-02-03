import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Upload, Settings, Lock, BarChart3 } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Stage2Page({ params }: PageProps) {
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
              <Badge className="bg-green-100 text-green-700">Stage 2</Badge>
              <h1 className="text-3xl font-bold tracking-tight">Statistical Sampling</h1>
            </div>
            <p className="text-muted-foreground mt-2">
              Upload population data, configure sampling parameters, and generate your sample set
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
                <CardDescription>Upload Population</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Upload population file (CSV/Excel) for sampling.
            </p>
            <Badge variant="outline">No file uploaded</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                <Settings className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base">Step 2</CardTitle>
                <CardDescription>Configure Sampling</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Set sampling method, confidence level, and parameters.
            </p>
            <Badge variant="outline">Not configured</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base">Step 3</CardTitle>
                <CardDescription>Lock Sample</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Review and lock the sample to proceed to workbooks.
            </p>
            <Badge variant="outline">Pending</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Population Upload */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Population Data
          </CardTitle>
          <CardDescription>
            Upload the population file to generate a sample
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">Upload Population File</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Drag and drop your population file here, or click to browse
            </p>
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Select File
            </Button>
            <p className="text-xs text-muted-foreground mt-4">
              Supported formats: XLSX, XLS, CSV
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Sampling Configuration Placeholder */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Sampling Configuration
          </CardTitle>
          <CardDescription>
            Configure sampling parameters after uploading population data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Upload a population file to configure sampling parameters
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Link href={`/audit-runs/${id}/stage-1`}>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Stage 1
          </Button>
        </Link>
        <Link href={`/audit-runs/${id}/stage-3`}>
          <Button disabled>
            Continue to Workbooks
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
