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
                  <TableHead className="px-4 py-3 text-left text-sm font-medium w-[120px]">Jurisdiction ID</TableHead>
                  <TableHead className="px-4 py-3 text-left text-sm font-medium">Jurisdiction Name</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jurisdictions.map((j) => (
                  <TableRow key={j.Jurisdiction_ID}>
                    <TableCell className="px-4 py-2 text-sm">
                      <Badge variant="outline" className="font-mono">
                        {j.Jurisdiction_ID}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-2 text-sm font-medium">{j.Jurisdiction_Name}</TableCell>
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
                  <TableHead className="px-4 py-3 text-left text-sm font-medium w-[100px]">Auditor ID</TableHead>
                  <TableHead className="px-4 py-3 text-left text-sm font-medium">Auditor Name</TableHead>
                  <TableHead className="px-4 py-3 text-left text-sm font-medium">Email</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditors.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="px-4 py-2 text-sm">
                      <Badge variant="outline" className="font-mono">
                        {a.id}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-2 text-sm font-medium">{a.name}</TableCell>
                    <TableCell className="px-4 py-2 text-sm text-white/80">{a.email}</TableCell>
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
  Low: "bg-green-500/20 text-green-300",
  Medium: "bg-yellow-500/20 text-yellow-300",
  High: "bg-orange-500/20 text-orange-300",
  Critical: "bg-red-500/20 text-red-300",
};

export function ClientTypeRiskTable({ clientTypeRisks }: ClientTypeRiskTableProps) {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {clientTypeRisks.filter((c) => c.RiskTier === "Low").length}
            </div>
            <p className="text-xs text-white/80">Low Risk Types</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {clientTypeRisks.filter((c) => c.RiskTier === "Medium").length}
            </div>
            <p className="text-xs text-white/80">Medium Risk Types</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {clientTypeRisks.filter((c) => c.RiskTier === "High" || c.RiskTier === "Critical").length}
            </div>
            <p className="text-xs text-white/80">High/Critical Types</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {clientTypeRisks.filter((c) => c.IsEDD).length}
            </div>
            <p className="text-xs text-white/80">EDD Required</p>
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
                  <TableHead className="px-4 py-3 text-left text-sm font-medium">Client Type</TableHead>
                  <TableHead className="px-4 py-3 text-left text-sm font-medium w-[120px]">Risk Tier</TableHead>
                  <TableHead className="px-4 py-3 text-left text-sm font-medium w-[100px]">EDD Required</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientTypeRisks.map((ctr) => (
                  <TableRow key={ctr.ClientType}>
                    <TableCell className="px-4 py-2 text-sm font-medium">{ctr.ClientType}</TableCell>
                    <TableCell className="px-4 py-2 text-sm">
                      <Badge className={RISK_TIER_COLORS[ctr.RiskTier] || "bg-white/10 text-white/80"}>
                        {ctr.RiskTier}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-2 text-sm">
                      {ctr.IsEDD ? (
                        <div className="flex items-center gap-1 text-red-600">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm">Yes</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-white/80">
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
  Draft: "bg-white/10 text-white/80",
  Locked: "bg-blue-500/20 text-blue-300",
  Completed: "bg-green-500/20 text-green-300",
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{samplingConfig.SampleSize}</div>
            <p className="text-xs text-white/80">Sample Size</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{samplingConfig.PopulationSize.toLocaleString()}</div>
            <p className="text-xs text-white/80">Population Size</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{samplingConfig.ConfidenceLevel}%</div>
            <p className="text-xs text-white/80">Confidence Level</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{samplingConfig.MarginOfError}%</div>
            <p className="text-xs text-white/80">Margin of Error</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Sampling Configuration
            <Badge className={SAMPLING_STATUS_COLORS[samplingConfig.Status] || "bg-white/10 text-white/80"}>
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
                  <TableHead className="px-4 py-3 text-left text-sm font-medium">Parameter</TableHead>
                  <TableHead className="px-4 py-3 text-left text-sm font-medium">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="px-4 py-2 text-sm font-medium">Batch ID</TableCell>
                  <TableCell className="px-4 py-2 text-sm">
                    <Badge variant="outline" className="font-mono">
                      {samplingConfig.BatchID}
                    </Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="px-4 py-2 text-sm font-medium">Sampling Method</TableCell>
                  <TableCell className="px-4 py-2 text-sm">
                    <Badge variant="secondary">{samplingConfig.SamplingMethod}</Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="px-4 py-2 text-sm font-medium">Confidence Level</TableCell>
                  <TableCell className="px-4 py-2 text-sm">{samplingConfig.ConfidenceLevel}%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="px-4 py-2 text-sm font-medium">Margin of Error</TableCell>
                  <TableCell className="px-4 py-2 text-sm">{samplingConfig.MarginOfError}%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="px-4 py-2 text-sm font-medium">Sample Size</TableCell>
                  <TableCell className="px-4 py-2 text-sm font-mono">{samplingConfig.SampleSize}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="px-4 py-2 text-sm font-medium">Population Size</TableCell>
                  <TableCell className="px-4 py-2 text-sm font-mono">{samplingConfig.PopulationSize.toLocaleString()}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="px-4 py-2 text-sm font-medium">Locked Date</TableCell>
                  <TableCell className="px-4 py-2 text-sm">{formatDate(samplingConfig.LockedDate)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="px-4 py-2 text-sm font-medium">Status</TableCell>
                  <TableCell className="px-4 py-2 text-sm">
                    <Badge className={SAMPLING_STATUS_COLORS[samplingConfig.Status] || "bg-white/10 text-white/80"}>
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
