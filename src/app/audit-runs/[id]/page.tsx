import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, FileText, BarChart3, Grid3X3, FileBarChart } from "lucide-react";
import { StageNav } from "@/components/audit-run/stage-nav";
import { DemoModeBanner } from "@/components/demo-mode-banner";

// This will be fetched from the database
async function getAuditRun(id: string) {
  // TODO: Fetch from database
  return {
    id,
    name: "Sample Audit Run",
    status: "in_progress" as "draft" | "in_progress" | "completed" | "archived",
    createdAt: new Date().toISOString(),
    currentStage: 1,
    scope: {
      description: "Sample audit run description",
    },
  };
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AuditRunDetailPage({ params }: PageProps) {
  const { id } = await params;
  const auditRun = await getAuditRun(id);

  const stages: Array<{
    number: number;
    name: string;
    description: string;
    icon: typeof FileText;
    href: string;
    status: "pending" | "active" | "completed";
  }> = [
    {
      number: 1,
      name: "Gap Assessment",
      description: "Upload documents and run AI analysis",
      icon: FileText,
      href: `/audit-runs/${id}/stage-1`,
      status: auditRun.currentStage >= 1 ? "active" : "pending",
    },
    {
      number: 2,
      name: "Sampling",
      description: "Configure and generate sample set",
      icon: BarChart3,
      href: `/audit-runs/${id}/stage-2`,
      status: auditRun.currentStage >= 2 ? "active" : "pending",
    },
    {
      number: 3,
      name: "Workbooks",
      description: "Complete testing in spreadsheet UI",
      icon: Grid3X3,
      href: `/audit-runs/${id}/stage-3`,
      status: auditRun.currentStage >= 3 ? "active" : "pending",
    },
    {
      number: 4,
      name: "Reporting",
      description: "Generate consolidated report",
      icon: FileBarChart,
      href: `/audit-runs/${id}/stage-4`,
      status: auditRun.currentStage >= 4 ? "active" : "pending",
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link
          href="/audit-runs"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Audit Runs
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{auditRun.name}</h1>
            <p className="text-muted-foreground mt-2">
              {auditRun.scope?.description || "CDD Onboarding Audit"}
            </p>
          </div>
          <Badge
            variant={auditRun.status === "completed" ? "default" : "secondary"}
            className="text-sm"
          >
            {auditRun.status === "in_progress" ? "In Progress" : auditRun.status}
          </Badge>
        </div>
      </div>

      {/* Demo Mode Banner */}
      <div className="mb-6">
        <DemoModeBanner auditRunId={id} />
      </div>

      {/* Stage Navigation */}
      <StageNav
        stages={stages.map(({ number, name, href }) => ({ number, name, href }))}
        currentStage={auditRun.currentStage}
      />

      {/* Stage Cards */}
      <div className="grid gap-6 md:grid-cols-2 mt-8">
        {stages.map((stage) => {
          const isActive = auditRun.currentStage >= stage.number;
          const isCurrent = auditRun.currentStage === stage.number;

          return (
            <Card
              key={stage.number}
              className={`transition-all ${
                isCurrent ? "border-primary shadow-md" : ""
              } ${!isActive ? "opacity-60" : ""}`}
            >
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                      isCurrent
                        ? "bg-primary text-primary-foreground"
                        : isActive
                        ? "bg-green-100 text-green-600"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <stage.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      Stage {stage.number}: {stage.name}
                      {isCurrent && (
                        <Badge variant="default" className="text-xs">
                          Current
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>{stage.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Link href={stage.href}>
                  <Button
                    className="w-full"
                    variant={isCurrent ? "default" : "outline"}
                    disabled={!isActive}
                  >
                    {isCurrent ? "Continue" : isActive ? "View" : "Locked"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
