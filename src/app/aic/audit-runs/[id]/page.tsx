import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, FileText, BarChart3, Sparkles, Grid3X3, Eye, FileBarChart } from "lucide-react";
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
    publishedWorkbooks: 0,
    submittedWorkbooks: 0,
  };
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AicAuditRunDetailPage({ params }: PageProps) {
  const { id } = await params;
  const auditRun = await getAuditRun(id);

  // AIC-specific stages (no Stage 5 - Testing)
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
      description: "Upload documents and run AI gap analysis",
      icon: FileText,
      href: `/aic/audit-runs/${id}/stage-1`,
      status: auditRun.currentStage >= 1 ? "active" : "pending",
    },
    {
      number: 2,
      name: "Sampling",
      description: "Configure and generate sample set",
      icon: BarChart3,
      href: `/aic/audit-runs/${id}/stage-2`,
      status: auditRun.currentStage >= 2 ? "active" : "pending",
    },
    {
      number: 3,
      name: "Attribute Extraction",
      description: "Extract testing attributes from gaps",
      icon: Sparkles,
      href: `/aic/audit-runs/${id}/stage-3`,
      status: auditRun.currentStage >= 3 ? "active" : "pending",
    },
    {
      number: 4,
      name: "Workbook Generation",
      description: "Generate workbooks & publish to auditors",
      icon: Grid3X3,
      href: `/aic/audit-runs/${id}/stage-4`,
      status: auditRun.currentStage >= 4 ? "active" : "pending",
    },
    {
      number: 5,
      name: "Live Monitoring",
      description: "Track auditor progress in real-time",
      icon: Eye,
      href: `/aic/audit-runs/${id}/monitor`,
      status: auditRun.publishedWorkbooks > 0 ? "active" : "pending",
    },
    {
      number: 6,
      name: "Consolidation",
      description: "Aggregate results and generate report",
      icon: FileBarChart,
      href: `/aic/audit-runs/${id}/consolidation`,
      status: auditRun.submittedWorkbooks > 0 ? "active" : "pending",
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link
          href="/aic/audit-runs"
          className="inline-flex items-center text-sm text-white/80 hover:text-white mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Audit Runs
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">{auditRun.name}</h1>
            <p className="text-white/80 mt-2">
              {auditRun.scope?.description || "CDD Onboarding Audit"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={auditRun.status === "completed" ? "default" : "secondary"}
              className="text-sm"
            >
              {auditRun.status === "in_progress" ? "In Progress" : auditRun.status}
            </Badge>
            <Badge variant="outline" className="text-sm">
              AIC View
            </Badge>
          </div>
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-6">
        {stages.map((stage) => {
          const isActive = stage.status === "active";
          const isCurrent = auditRun.currentStage === stage.number && stage.number <= 4;
          const isMonitor = stage.number === 5;
          const isConsolidation = stage.number === 6;

          return (
            <Card
              key={stage.number}
              className={`transition-all bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] hover:bg-white/15 hover:border-white/30 ${
                isCurrent ? "border-crowe-amber shadow-md" : ""
              } ${!isActive ? "opacity-60" : ""} ${
                isMonitor && auditRun.publishedWorkbooks > 0 ? "border-teal-500" : ""
              }`}
            >
              <CardHeader className="p-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      isCurrent
                        ? "bg-crowe-amber text-crowe-indigo-dark"
                        : isMonitor && auditRun.publishedWorkbooks > 0
                        ? "bg-crowe-teal/15 text-crowe-teal"
                        : isActive
                        ? "bg-green-500/20 text-green-400"
                        : "bg-white/10 text-white/80"
                    }`}
                  >
                    <stage.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="flex items-center gap-2 text-white">
                      {stage.name}
                      {isCurrent && (
                        <Badge variant="default" className="text-xs">
                          Current
                        </Badge>
                      )}
                      {isMonitor && auditRun.publishedWorkbooks > 0 && (
                        <Badge className="text-xs bg-crowe-teal/15 text-crowe-teal">
                          Live
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-white/80">{stage.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0">
                <Link href={stage.href}>
                  <Button
                    className={`w-full ${
                      isCurrent || (isMonitor && auditRun.publishedWorkbooks > 0)
                        ? ""
                        : "border-white/20 text-white hover:bg-white/10 hover:border-white/30"
                    }`}
                    variant={isCurrent || (isMonitor && auditRun.publishedWorkbooks > 0) ? "default" : "outline"}
                    disabled={!isActive && !isCurrent}
                  >
                    {isCurrent ? "Continue" : isActive ? "View" : "Start"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* AIC Workflow Summary */}
      <Card className="mt-6 bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]">
        <CardHeader>
          <CardTitle className="text-white">AIC Workflow Summary</CardTitle>
          <CardDescription className="text-white/80">
            Your responsibilities in the audit lifecycle
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-32 font-medium text-white">Stages 1-4</div>
              <div className="flex-1 text-sm text-white/80">
                Setup: Gap analysis, sampling, attribute extraction, workbook generation
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-32 font-medium text-white">Stage 4</div>
              <div className="flex-1 text-sm text-white/80">
                <span className="font-medium text-crowe-amber">Publish</span> workbooks to assigned auditors
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-32 font-medium text-white">Monitor</div>
              <div className="flex-1 text-sm text-white/80">
                <span className="font-medium text-crowe-teal">Live tracking</span> of auditor completion (5-second refresh)
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-32 font-medium text-white">Consolidation</div>
              <div className="flex-1 text-sm text-white/80">
                Aggregate submitted results and generate final report
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
