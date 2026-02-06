"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, FileText, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AcceptableDoc } from "@/lib/attribute-library/types";

interface AcceptableDocsSheetProps {
  acceptableDocs: AcceptableDoc[];
}

type SortField = "Attribute_ID" | "Document_Name" | "Evidence_Source_Document" | "Jurisdiction_ID";
type SortDirection = "asc" | "desc";

export function AcceptableDocsSheet({ acceptableDocs }: AcceptableDocsSheetProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [jurisdictionFilter, setJurisdictionFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("Attribute_ID");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Get unique filter values
  const jurisdictions = useMemo(
    () => [...new Set(acceptableDocs.map((d) => d.Jurisdiction_ID))],
    [acceptableDocs]
  );
  const sources = useMemo(
    () => [...new Set(acceptableDocs.map((d) => d.Evidence_Source_Document))],
    [acceptableDocs]
  );

  // Filter and sort documents
  const filteredDocs = useMemo(() => {
    let result = acceptableDocs.filter((doc) => {
      const matchesSearch =
        doc.Document_Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.Attribute_ID.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.Evidence_Source_Document.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesJurisdiction =
        jurisdictionFilter === "all" || doc.Jurisdiction_ID === jurisdictionFilter;

      const matchesSource =
        sourceFilter === "all" || doc.Evidence_Source_Document === sourceFilter;

      return matchesSearch && matchesJurisdiction && matchesSource;
    });

    // Sort
    result.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      const comparison = aVal.localeCompare(bVal);
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [acceptableDocs, searchTerm, jurisdictionFilter, sourceFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 -ml-3 font-medium"
      onClick={() => handleSort(field)}
    >
      {children}
      <ArrowUpDown className="ml-2 h-3 w-3" />
    </Button>
  );

  // Group documents by attribute for summary
  const docsByAttribute = useMemo(() => {
    const groups = new Map<string, number>();
    acceptableDocs.forEach((doc) => {
      groups.set(doc.Attribute_ID, (groups.get(doc.Attribute_ID) || 0) + 1);
    });
    return groups;
  }, [acceptableDocs]);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{acceptableDocs.length}</div>
            <p className="text-xs text-white/60">Total Documents</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{docsByAttribute.size}</div>
            <p className="text-xs text-white/60">Attributes Covered</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{sources.length}</div>
            <p className="text-xs text-white/60">Evidence Sources</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{jurisdictions.length}</div>
            <p className="text-xs text-white/60">Jurisdictions</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Acceptable Documents
          </CardTitle>
          <CardDescription>
            {filteredDocs.length} of {acceptableDocs.length} documents shown
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                <Input
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={jurisdictionFilter} onValueChange={setJurisdictionFilter}>
              <SelectTrigger className="w-[150px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Jurisdiction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Jurisdictions</SelectItem>
                {jurisdictions.map((j) => (
                  <SelectItem key={j} value={j}>
                    {j}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Evidence Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {sources.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">
                    <SortableHeader field="Attribute_ID">Attribute ID</SortableHeader>
                  </TableHead>
                  <TableHead className="min-w-[200px]">
                    <SortableHeader field="Document_Name">Document Name</SortableHeader>
                  </TableHead>
                  <TableHead className="w-[160px]">
                    <SortableHeader field="Evidence_Source_Document">Evidence Source</SortableHeader>
                  </TableHead>
                  <TableHead className="w-[100px]">
                    <SortableHeader field="Jurisdiction_ID">Jurisdiction</SortableHeader>
                  </TableHead>
                  <TableHead className="w-[150px]">Source File</TableHead>
                  <TableHead className="min-w-[200px]">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-white/60">
                      No documents found matching your filters
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDocs.map((doc, idx) => (
                    <TableRow key={`${doc.Attribute_ID}-${doc.Document_Name}-${idx}`}>
                      <TableCell className="font-mono text-sm">{doc.Attribute_ID}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-white/50" />
                          <span className="font-medium">{doc.Document_Name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{doc.Evidence_Source_Document}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{doc.Jurisdiction_ID}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-white/60 truncate max-w-[150px]" title={doc.Source_File}>
                        {doc.Source_File}
                      </TableCell>
                      <TableCell className="text-sm text-white/60">
                        {doc.Notes || "-"}
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
