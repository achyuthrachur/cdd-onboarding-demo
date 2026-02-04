"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Users, Shield, BarChart3, CheckCircle, XCircle, Clock } from "lucide-react";
import type { Jurisdiction, Auditor, ClientTypeRisk, SamplingConfig } from "@/lib/attribute-library/types";

// Jurisdictions Table
interface JurisdictionsTableProps {
  jurisdictions: Jurisdiction[];
}

export function JurisdictionsTable({ jurisdictions }: JurisdictionsTableProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Jurisdictions
          </CardTitle>
          <CardDescription>
            {jurisdictions.length} jurisdictions configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Jurisdiction ID</TableHead>
                  <TableHead>Jurisdiction Name</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jurisdictions.map((j) => (
                  <TableRow key={j.Jurisdiction_ID}>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {j.Jurisdiction_ID}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{j.Jurisdiction_Name}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Auditors Table
interface AuditorsTableProps {
  auditors: Auditor[];
}

export function AuditorsTable({ auditors }: AuditorsTableProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Auditors
          </CardTitle>
          <CardDescription>
            {auditors.length} auditors available for assignment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Auditor ID</TableHead>
                  <TableHead>Auditor Name</TableHead>
                  <TableHead>Email</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditors.map((a) => (
                  <TableRow key={a.AuditorID}>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {a.AuditorID}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{a.AuditorName}</TableCell>
                    <TableCell className="text-muted-foreground">{a.Email}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Client Type Risk Table
interface ClientTypeRiskTableProps {
  clientTypeRisks: ClientTypeRisk[];
}

const RISK_TIER_COLORS: Record<string, string> = {
  Low: "bg-green-100 text-green-700",
  Medium: "bg-yellow-100 text-yellow-700",
  High: "bg-orange-100 text-orange-700",
  Critical: "bg-red-100 text-red-700",
};

export function ClientTypeRiskTable({ clientTypeRisks }: ClientTypeRiskTableProps) {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">
              {clientTypeRisks.filter((c) => c.RiskTier === "Low").length}
            </div>
            <p className="text-xs text-muted-foreground">Low Risk Types</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">
              {clientTypeRisks.filter((c) => c.RiskTier === "Medium").length}
            </div>
            <p className="text-xs text-muted-foreground">Medium Risk Types</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">
              {clientTypeRisks.filter((c) => c.RiskTier === "High" || c.RiskTier === "Critical").length}
            </div>
            <p className="text-xs text-muted-foreground">High/Critical Types</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">
              {clientTypeRisks.filter((c) => c.IsEDD).length}
            </div>
            <p className="text-xs text-muted-foreground">EDD Required</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Client Type Risk Mappings
          </CardTitle>
          <CardDescription>
            {clientTypeRisks.length} client type configurations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client Type</TableHead>
                  <TableHead className="w-[120px]">Risk Tier</TableHead>
                  <TableHead className="w-[100px]">EDD Required</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientTypeRisks.map((ctr) => (
                  <TableRow key={ctr.ClientType}>
                    <TableCell className="font-medium">{ctr.ClientType}</TableCell>
                    <TableCell>
                      <Badge className={RISK_TIER_COLORS[ctr.RiskTier] || "bg-gray-100"}>
                        {ctr.RiskTier}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {ctr.IsEDD ? (
                        <div className="flex items-center gap-1 text-red-600">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm">Yes</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <XCircle className="h-4 w-4" />
                          <span className="text-sm">No</span>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Sampling Configuration Table
interface SamplingTableProps {
  samplingConfig: SamplingConfig;
}

const SAMPLING_STATUS_COLORS: Record<string, string> = {
  Draft: "bg-gray-100 text-gray-700",
  Locked: "bg-blue-100 text-blue-700",
  Completed: "bg-green-100 text-green-700",
};

export function SamplingTable({ samplingConfig }: SamplingTableProps) {
  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{samplingConfig.SampleSize}</div>
            <p className="text-xs text-muted-foreground">Sample Size</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{samplingConfig.PopulationSize.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Population Size</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{samplingConfig.ConfidenceLevel}%</div>
            <p className="text-xs text-muted-foreground">Confidence Level</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{samplingConfig.MarginOfError}%</div>
            <p className="text-xs text-muted-foreground">Margin of Error</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Sampling Configuration
            <Badge className={SAMPLING_STATUS_COLORS[samplingConfig.Status] || "bg-gray-100"}>
              {samplingConfig.Status === "Locked" && <Clock className="mr-1 h-3 w-3" />}
              {samplingConfig.Status === "Completed" && <CheckCircle className="mr-1 h-3 w-3" />}
              {samplingConfig.Status}
            </Badge>
          </CardTitle>
          <CardDescription>
            Batch ID: {samplingConfig.BatchID}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parameter</TableHead>
                  <TableHead>Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Batch ID</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      {samplingConfig.BatchID}
                    </Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Sampling Method</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{samplingConfig.SamplingMethod}</Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Confidence Level</TableCell>
                  <TableCell>{samplingConfig.ConfidenceLevel}%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Margin of Error</TableCell>
                  <TableCell>{samplingConfig.MarginOfError}%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Sample Size</TableCell>
                  <TableCell className="font-mono">{samplingConfig.SampleSize}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Population Size</TableCell>
                  <TableCell className="font-mono">{samplingConfig.PopulationSize.toLocaleString()}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Locked Date</TableCell>
                  <TableCell>{formatDate(samplingConfig.LockedDate)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Status</TableCell>
                  <TableCell>
                    <Badge className={SAMPLING_STATUS_COLORS[samplingConfig.Status] || "bg-gray-100"}>
                      {samplingConfig.Status}
                    </Badge>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
