"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, FileStack, ArrowRight } from "lucide-react";
import { getStageData } from "@/lib/stage-data/store";

interface AuditRun {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  stage: number;
  publishedCount: number;
  submittedCount: number;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "draft":
      return <Badge variant="secondary">Draft</Badge>;
    case "in_progress":
      return <Badge variant="default">In Progress</Badge>;
    case "completed":
      return <Badge className="bg-green-500">Completed</Badge>;
    case "archived":
      return <Badge variant="outline">Archived</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export default function AicAuditRunsPage() {
  const [auditRuns, setAuditRuns] = useState<AuditRun[]>([]);

  useEffect(() => {
    const published = getStageData("workbooksPublished") as {
      publishedAt: string;
      workbookCount: number;
      auditorCount: number;
    } | null;

    if (published) {
      const progress = getStageData("auditorProgress") as Record<string, {
        completionPercentage: number;
        status: string;
      }> | null;

      const submittedCount = progress
        ? Object.values(progress).filter(p => p.status === 'submitted').length
        : 0;

      const allSubmitted = progress
        ? Object.values(progress).every(p => p.status === 'submitted')
        : false;

      setAuditRuns([{
        id: "demo-run-001",
        name: "CDD Annual Review 2025",
        status: allSubmitted ? "completed" : "in_progress",
        createdAt: new Date(published.publishedAt).toLocaleDateString(),
        stage: 4,
        publishedCount: published.workbookCount || 0,
        submittedCount,
      }]);
    }
  }, []);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Audit Runs</h1>
          <p className="text-muted-foreground mt-2">
            Manage and track your CDD audit engagements
          </p>
        </div>
        <Link href="/aic/audit-runs/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Audit Run
          </Button>
        </Link>
      </div>

      {auditRuns.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileStack className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-foreground">No audit runs yet</h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Create your first audit run to start the AIC workflow: gap analysis, sampling, attribute extraction, workbook generation, and monitoring.
            </p>
            <Link href="/aic/audit-runs/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Audit Run
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Audit Runs</CardTitle>
            <CardDescription>
              Click on an audit run to view details and continue working
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Current Stage</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditRuns.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell className="font-medium">{run.name}</TableCell>
                    <TableCell>{getStatusBadge(run.status)}</TableCell>
                    <TableCell className="text-muted-foreground">Stage {run.stage}</TableCell>
                    <TableCell className="text-muted-foreground">{run.publishedCount} workbooks</TableCell>
                    <TableCell className="text-muted-foreground">{run.submittedCount} submitted</TableCell>
                    <TableCell className="text-muted-foreground">{run.createdAt}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/aic/audit-runs/${run.id}`}>
                        <Button variant="ghost" size="sm">
                          View
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
