"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Filter, Eye, AlertTriangle, CheckCircle2, AlertCircle, MinusCircle } from "lucide-react";

interface Gap {
  Gap_ID: string;
  Disposition: string;
  Severity: string;
  Standard_Requirement_ID: string;
  Standard_Requirement_Text: string;
  Procedure_Reference_ID: string;
  Procedure_Text_Summary: string;
  Gap_Description: string;
  Impact_Rationale: string;
  Testing_Implication: string;
  Recommended_Remediation: string;
  Evidence_Expected: string;
  Standard_Citation: string;
  Procedure_Citation: string;
  Source_Quote_A: string;
  Source_Quote_B: string;
  Confidence: string;
  Notes: string;
}

interface GapsTableProps {
  gaps: Gap[];
  summary?: Array<{ Metric: string; Value: number }>;
}

const DISPOSITION_COLORS: Record<string, string> = {
  "Meets": "bg-crowe-teal/20 text-crowe-teal-bright",
  "Partially Meets": "bg-crowe-amber/20 text-crowe-amber-bright",
  "Does Not Meet": "bg-crowe-coral/20 text-crowe-coral-bright",
  "Conflict": "bg-crowe-violet/20 text-crowe-violet-bright",
  "Exceeds": "bg-crowe-blue/20 text-crowe-blue-light",
  "N/A": "bg-white/10 text-white/70",
};

const SEVERITY_COLORS: Record<string, string> = {
  "Critical": "bg-red-500 text-white",
  "High": "bg-orange-500 text-white",
  "Medium": "bg-yellow-500 text-black",
  "Low": "bg-green-500 text-white",
};

export function GapsTable({ gaps, summary }: GapsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [dispositionFilter, setDispositionFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [selectedGap, setSelectedGap] = useState<Gap | null>(null);

  const filteredGaps = gaps.filter((gap) => {
    const matchesSearch =
      gap.Gap_ID.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gap.Gap_Description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gap.Standard_Requirement_Text.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDisposition =
      dispositionFilter === "all" || gap.Disposition === dispositionFilter;

    const matchesSeverity =
      severityFilter === "all" || gap.Severity === severityFilter;

    return matchesSearch && matchesDisposition && matchesSeverity;
  });

  const getDispositionIcon = (disposition: string) => {
    switch (disposition) {
      case "Meets":
        return <CheckCircle2 className="h-4 w-4" />;
      case "Does Not Meet":
      case "Conflict":
        return <AlertTriangle className="h-4 w-4" />;
      case "Partially Meets":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <MinusCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-7">
          {summary.map((item) => (
            <Card key={item.Metric}>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">{item.Value}</div>
                <p className="text-xs text-white/60">{item.Metric}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Gap Analysis Results</CardTitle>
          <CardDescription>
            {filteredGaps.length} of {gaps.length} gaps shown
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                <Input
                  placeholder="Search gaps..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={dispositionFilter} onValueChange={setDispositionFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Disposition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dispositions</SelectItem>
                <SelectItem value="Does Not Meet">Does Not Meet</SelectItem>
                <SelectItem value="Partially Meets">Partially Meets</SelectItem>
                <SelectItem value="Meets">Meets</SelectItem>
                <SelectItem value="Conflict">Conflict</SelectItem>
                <SelectItem value="Exceeds">Exceeds</SelectItem>
                <SelectItem value="N/A">N/A</SelectItem>
              </SelectContent>
            </Select>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[150px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Gap ID</TableHead>
                  <TableHead className="w-[130px]">Disposition</TableHead>
                  <TableHead className="w-[100px]">Severity</TableHead>
                  <TableHead>Gap Description</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGaps.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-white/60">
                      No gaps found matching your filters
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredGaps.map((gap) => (
                    <TableRow key={gap.Gap_ID}>
                      <TableCell className="font-mono text-sm">{gap.Gap_ID}</TableCell>
                      <TableCell>
                        <Badge className={DISPOSITION_COLORS[gap.Disposition] || ""}>
                          {getDispositionIcon(gap.Disposition)}
                          <span className="ml-1">{gap.Disposition}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={SEVERITY_COLORS[gap.Severity] || ""}>
                          {gap.Severity}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate">
                        {gap.Gap_Description}
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedGap(gap)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                {gap.Gap_ID}
                                <Badge className={DISPOSITION_COLORS[gap.Disposition] || ""}>
                                  {gap.Disposition}
                                </Badge>
                                <Badge className={SEVERITY_COLORS[gap.Severity] || ""}>
                                  {gap.Severity}
                                </Badge>
                              </DialogTitle>
                              <DialogDescription>
                                {gap.Standard_Requirement_ID}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 mt-4">
                              <div>
                                <h4 className="font-semibold text-sm mb-1">Standard Requirement</h4>
                                <p className="text-sm text-white/70">{gap.Standard_Requirement_Text}</p>
                              </div>
                              <div>
                                <h4 className="font-semibold text-sm mb-1">Procedure Reference</h4>
                                <p className="text-sm text-white/70">
                                  {gap.Procedure_Reference_ID}: {gap.Procedure_Text_Summary}
                                </p>
                              </div>
                              <div>
                                <h4 className="font-semibold text-sm mb-1">Gap Description</h4>
                                <p className="text-sm">{gap.Gap_Description}</p>
                              </div>
                              <div>
                                <h4 className="font-semibold text-sm mb-1">Impact Rationale</h4>
                                <p className="text-sm text-white/70">{gap.Impact_Rationale}</p>
                              </div>
                              <div>
                                <h4 className="font-semibold text-sm mb-1">Testing Implication</h4>
                                <p className="text-sm text-white/70">{gap.Testing_Implication}</p>
                              </div>
                              <div>
                                <h4 className="font-semibold text-sm mb-1">Recommended Remediation</h4>
                                <p className="text-sm">{gap.Recommended_Remediation}</p>
                              </div>
                              <div>
                                <h4 className="font-semibold text-sm mb-1">Evidence Expected</h4>
                                <p className="text-sm text-white/70">{gap.Evidence_Expected}</p>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-semibold text-sm mb-1">Standard Citation</h4>
                                  <p className="text-xs text-white/60">{gap.Standard_Citation}</p>
                                </div>
                                <div>
                                  <h4 className="font-semibold text-sm mb-1">Procedure Citation</h4>
                                  <p className="text-xs text-white/60">{gap.Procedure_Citation}</p>
                                </div>
                              </div>
                              {gap.Notes && (
                                <div>
                                  <h4 className="font-semibold text-sm mb-1">Notes</h4>
                                  <p className="text-sm text-white/70">{gap.Notes}</p>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
