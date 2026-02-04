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
import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Search, Filter, Eye, FileText, CheckCircle, ArrowUpDown } from "lucide-react";
import type { Attribute, AcceptableDoc } from "@/lib/attribute-library/types";

interface AttributesSheetProps {
  attributes: Attribute[];
  acceptableDocs: AcceptableDoc[];
}

const CATEGORY_COLORS: Record<string, string> = {
  "Entity Profile": "bg-blue-100 text-blue-700",
  "Individual Profile": "bg-purple-100 text-purple-700",
  Ownership: "bg-green-100 text-green-700",
  Documentation: "bg-yellow-100 text-yellow-700",
  AML: "bg-red-100 text-red-700",
  EDD: "bg-orange-100 text-orange-700",
  Compliance: "bg-indigo-100 text-indigo-700",
  Registration: "bg-pink-100 text-pink-700",
};

const GROUP_COLORS: Record<string, string> = {
  Individuals: "bg-cyan-100 text-cyan-700",
  Entity: "bg-emerald-100 text-emerald-700",
  "Beneficial Owner": "bg-violet-100 text-violet-700",
  Screening: "bg-amber-100 text-amber-700",
};

const RISK_SCOPE_COLORS: Record<string, string> = {
  Base: "bg-gray-100 text-gray-700",
  EDD: "bg-red-100 text-red-700",
  Both: "bg-orange-100 text-orange-700",
};

type SortField = "Attribute_ID" | "Attribute_Name" | "Category" | "Group" | "Jurisdiction_ID";
type SortDirection = "asc" | "desc";

export function AttributesSheet({ attributes, acceptableDocs }: AttributesSheetProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [jurisdictionFilter, setJurisdictionFilter] = useState<string>("all");
  const [riskScopeFilter, setRiskScopeFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("Attribute_ID");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Get unique filter values
  const categories = useMemo(() => [...new Set(attributes.map((a) => a.Category))], [attributes]);
  const groups = useMemo(() => [...new Set(attributes.map((a) => a.Group))], [attributes]);
  const jurisdictions = useMemo(
    () => [...new Set(attributes.map((a) => a.Jurisdiction_ID))],
    [attributes]
  );
  const riskScopes = useMemo(() => [...new Set(attributes.map((a) => a.RiskScope))], [attributes]);

  // Filter and sort attributes
  const filteredAttributes = useMemo(() => {
    let result = attributes.filter((attr) => {
      const matchesSearch =
        attr.Attribute_ID.toLowerCase().includes(searchTerm.toLowerCase()) ||
        attr.Attribute_Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        attr.Question_Text.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = categoryFilter === "all" || attr.Category === categoryFilter;
      const matchesGroup = groupFilter === "all" || attr.Group === groupFilter;
      const matchesJurisdiction =
        jurisdictionFilter === "all" || attr.Jurisdiction_ID === jurisdictionFilter;
      const matchesRiskScope = riskScopeFilter === "all" || attr.RiskScope === riskScopeFilter;

      return matchesSearch && matchesCategory && matchesGroup && matchesJurisdiction && matchesRiskScope;
    });

    // Sort
    result.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      const comparison = aVal.localeCompare(bVal);
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [
    attributes,
    searchTerm,
    categoryFilter,
    groupFilter,
    jurisdictionFilter,
    riskScopeFilter,
    sortField,
    sortDirection,
  ]);

  const getDocsForAttribute = (attributeId: string) => {
    return acceptableDocs.filter((doc) => doc.Attribute_ID === attributeId);
  };

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

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{attributes.length}</div>
            <p className="text-xs text-muted-foreground">Total Attributes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">
              {attributes.filter((a) => a.IsRequired === "Y").length}
            </div>
            <p className="text-xs text-muted-foreground">Required</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">
              {attributes.filter((a) => a.RiskScope === "EDD" || a.RiskScope === "Both").length}
            </div>
            <p className="text-xs text-muted-foreground">EDD Attributes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{categories.length}</div>
            <p className="text-xs text-muted-foreground">Categories</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{jurisdictions.length}</div>
            <p className="text-xs text-muted-foreground">Jurisdictions</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Table */}
      <Card>
        <CardHeader>
          <CardTitle>Attributes Library</CardTitle>
          <CardDescription>
            {filteredAttributes.length} of {attributes.length} attributes shown
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search attributes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={jurisdictionFilter} onValueChange={setJurisdictionFilter}>
              <SelectTrigger className="w-[140px]">
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
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={groupFilter} onValueChange={setGroupFilter}>
              <SelectTrigger className="w-[150px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Groups</SelectItem>
                {groups.map((group) => (
                  <SelectItem key={group} value={group}>
                    {group}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={riskScopeFilter} onValueChange={setRiskScopeFilter}>
              <SelectTrigger className="w-[130px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Risk Scope" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Scopes</SelectItem>
                {riskScopes.map((scope) => (
                  <SelectItem key={scope} value={scope}>
                    {scope}
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
                  <TableHead className="w-[90px]">
                    <SortableHeader field="Attribute_ID">ID</SortableHeader>
                  </TableHead>
                  <TableHead className="min-w-[180px]">
                    <SortableHeader field="Attribute_Name">Attribute</SortableHeader>
                  </TableHead>
                  <TableHead className="w-[130px]">
                    <SortableHeader field="Category">Category</SortableHeader>
                  </TableHead>
                  <TableHead className="w-[120px]">
                    <SortableHeader field="Group">Group</SortableHeader>
                  </TableHead>
                  <TableHead className="w-[80px]">
                    <SortableHeader field="Jurisdiction_ID">Jur.</SortableHeader>
                  </TableHead>
                  <TableHead className="w-[80px]">Scope</TableHead>
                  <TableHead className="min-w-[250px]">Question</TableHead>
                  <TableHead className="w-[60px]">Req</TableHead>
                  <TableHead className="w-[80px]">Docs</TableHead>
                  <TableHead className="w-[60px]">View</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAttributes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      No attributes found matching your filters
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAttributes.map((attr) => (
                    <TableRow key={attr.Attribute_ID}>
                      <TableCell className="font-mono text-sm">{attr.Attribute_ID}</TableCell>
                      <TableCell className="font-medium">{attr.Attribute_Name}</TableCell>
                      <TableCell>
                        <Badge className={CATEGORY_COLORS[attr.Category] || "bg-gray-100"}>
                          {attr.Category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={GROUP_COLORS[attr.Group] || ""}>
                          {attr.Group}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{attr.Jurisdiction_ID}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={RISK_SCOPE_COLORS[attr.RiskScope] || ""}
                        >
                          {attr.RiskScope}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate text-sm" title={attr.Question_Text}>
                        {attr.Question_Text}
                      </TableCell>
                      <TableCell>
                        {attr.IsRequired === "Y" ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">
                          {getDocsForAttribute(attr.Attribute_ID).length}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                {attr.Attribute_ID}: {attr.Attribute_Name}
                              </DialogTitle>
                              <DialogDescription className="flex flex-wrap items-center gap-2">
                                <Badge className={CATEGORY_COLORS[attr.Category] || ""}>
                                  {attr.Category}
                                </Badge>
                                <Badge variant="outline" className={GROUP_COLORS[attr.Group] || ""}>
                                  {attr.Group}
                                </Badge>
                                <Badge variant="secondary">{attr.Jurisdiction_ID}</Badge>
                                {attr.IsRequired === "Y" && (
                                  <Badge className="bg-green-100 text-green-700">Required</Badge>
                                )}
                                <Badge
                                  variant="outline"
                                  className={RISK_SCOPE_COLORS[attr.RiskScope] || ""}
                                >
                                  {attr.RiskScope}
                                </Badge>
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 mt-4">
                              <div>
                                <h4 className="font-semibold text-sm mb-1">Testing Question</h4>
                                <p className="text-sm bg-muted p-3 rounded">{attr.Question_Text}</p>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-semibold text-sm mb-1">Source</h4>
                                  <p className="text-sm text-muted-foreground">{attr.Source}</p>
                                </div>
                                <div>
                                  <h4 className="font-semibold text-sm mb-1">Source Page</h4>
                                  <p className="text-sm text-muted-foreground">{attr.Source_Page || "-"}</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-4">
                                <div>
                                  <h4 className="font-semibold text-sm mb-1">Risk Scope</h4>
                                  <p className="text-sm text-muted-foreground">{attr.RiskScope}</p>
                                </div>
                                <div>
                                  <h4 className="font-semibold text-sm mb-1">Source File</h4>
                                  <p className="text-sm text-muted-foreground">{attr.Source_File}</p>
                                </div>
                                <div>
                                  <h4 className="font-semibold text-sm mb-1">Doc Age Rule</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {attr.DocumentationAgeRule ? `${attr.DocumentationAgeRule} days` : "-"}
                                  </p>
                                </div>
                              </div>
                              {attr.Notes && (
                                <div>
                                  <h4 className="font-semibold text-sm mb-1">Notes</h4>
                                  <p className="text-sm text-muted-foreground">{attr.Notes}</p>
                                </div>
                              )}

                              {/* Acceptable Documents */}
                              <div>
                                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                  <FileText className="h-4 w-4" />
                                  Acceptable Documents ({getDocsForAttribute(attr.Attribute_ID).length})
                                </h4>
                                <div className="space-y-2">
                                  {getDocsForAttribute(attr.Attribute_ID).length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No documents specified</p>
                                  ) : (
                                    getDocsForAttribute(attr.Attribute_ID).map((doc, idx) => (
                                      <div
                                        key={idx}
                                        className="flex items-start gap-3 p-2 bg-muted rounded text-sm"
                                      >
                                        <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                        <div>
                                          <p className="font-medium">{doc.Document_Name}</p>
                                          <p className="text-xs text-muted-foreground">
                                            Source: {doc.Evidence_Source_Document}
                                          </p>
                                          {doc.Notes && (
                                            <p className="text-xs text-muted-foreground mt-1">{doc.Notes}</p>
                                          )}
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
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
