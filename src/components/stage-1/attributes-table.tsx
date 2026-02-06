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
import { Search, Filter, Eye, FileText, CheckCircle } from "lucide-react";

interface Attribute {
  Source_File: string;
  Attribute_ID: string;
  Attribute_Name: string;
  Category: string;
  Source: string;
  Source_Page: string;
  Question_Text: string;
  Notes: string;
  Jurisdiction_ID: string;
  RiskScope: string;
  IsRequired: string;
  DocumentationAgeRule: string;
  Group: string;
}

interface AcceptableDoc {
  Source_File: string;
  Attribute_ID: string;
  Document_Name: string;
  Evidence_Source_Document: string;
  Jurisdiction_ID: string;
  Notes: string;
}

interface AttributesTableProps {
  attributes: Attribute[];
  acceptableDocs: AcceptableDoc[];
}

const CATEGORY_COLORS: Record<string, string> = {
  "Entity Profile": "bg-crowe-blue/20 text-crowe-blue-light",
  "Individual Profile": "bg-crowe-violet/20 text-crowe-violet-bright",
  "Ownership": "bg-crowe-teal/20 text-crowe-teal-bright",
  "Documentation": "bg-crowe-amber/20 text-crowe-amber-bright",
  "AML": "bg-crowe-coral/20 text-crowe-coral-bright",
  "EDD": "bg-crowe-amber-dark/20 text-crowe-amber",
  "Compliance": "bg-crowe-indigo-bright/20 text-crowe-cyan-light",
  "Registration": "bg-crowe-coral/20 text-crowe-coral-bright",
};

const GROUP_COLORS: Record<string, string> = {
  "Individuals": "bg-crowe-cyan/20 text-crowe-cyan-light",
  "Entity": "bg-crowe-teal/20 text-crowe-teal-bright",
  "Beneficial Owner": "bg-crowe-violet/20 text-crowe-violet-bright",
  "Screening": "bg-crowe-amber/20 text-crowe-amber-bright",
};

export function AttributesTable({ attributes, acceptableDocs }: AttributesTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [selectedAttribute, setSelectedAttribute] = useState<Attribute | null>(null);

  const filteredAttributes = attributes.filter((attr) => {
    const matchesSearch =
      attr.Attribute_ID.toLowerCase().includes(searchTerm.toLowerCase()) ||
      attr.Attribute_Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      attr.Question_Text.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      categoryFilter === "all" || attr.Category === categoryFilter;

    const matchesGroup =
      groupFilter === "all" || attr.Group === groupFilter;

    return matchesSearch && matchesCategory && matchesGroup;
  });

  const getDocsForAttribute = (attributeId: string) => {
    return acceptableDocs.filter((doc) => doc.Attribute_ID === attributeId);
  };

  const categories = [...new Set(attributes.map((a) => a.Category))];
  const groups = [...new Set(attributes.map((a) => a.Group))];

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-3 text-center flex flex-col items-center justify-center min-h-[80px]">
            <div className="text-2xl font-bold">{attributes.length}</div>
            <p className="text-xs text-white/60">Total Attributes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center flex flex-col items-center justify-center min-h-[80px]">
            <div className="text-2xl font-bold">
              {attributes.filter((a) => a.IsRequired === "Y").length}
            </div>
            <p className="text-xs text-white/60">Required</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center flex flex-col items-center justify-center min-h-[80px]">
            <div className="text-2xl font-bold">{acceptableDocs.length}</div>
            <p className="text-xs text-white/60">Acceptable Documents</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center flex flex-col items-center justify-center min-h-[80px]">
            <div className="text-2xl font-bold">{categories.length}</div>
            <p className="text-xs text-white/60">Categories</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Extracted Attributes</CardTitle>
          <CardDescription>
            {filteredAttributes.length} of {attributes.length} attributes shown
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                <Input
                  placeholder="Search attributes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
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
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px] px-4 py-3">ID</TableHead>
                  <TableHead className="w-[180px] px-4 py-3">Attribute</TableHead>
                  <TableHead className="w-[130px] px-4 py-3">Category</TableHead>
                  <TableHead className="w-[120px] px-4 py-3">Group</TableHead>
                  <TableHead className="px-4 py-3">Question</TableHead>
                  <TableHead className="w-[80px] px-4 py-3">Required</TableHead>
                  <TableHead className="w-[80px] px-4 py-3">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAttributes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-white/60">
                      No attributes found matching your filters
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAttributes.map((attr) => (
                    <TableRow key={attr.Attribute_ID}>
                      <TableCell className="px-4 py-2 font-mono text-sm">{attr.Attribute_ID}</TableCell>
                      <TableCell className="px-4 py-2 font-medium">{attr.Attribute_Name}</TableCell>
                      <TableCell className="px-4 py-2">
                        <Badge className={`px-2.5 py-0.5 text-xs font-medium ${CATEGORY_COLORS[attr.Category] || "bg-white/10 text-white/70"}`}>
                          {attr.Category}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-2">
                        <Badge variant="outline" className={`px-2.5 py-0.5 text-xs font-medium ${GROUP_COLORS[attr.Group] || ""}`}>
                          {attr.Group}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-2 max-w-[250px] truncate text-sm">
                        {attr.Question_Text}
                      </TableCell>
                      <TableCell className="px-4 py-2">
                        {attr.IsRequired === "Y" ? (
                          <CheckCircle className="h-4 w-4 text-crowe-teal-bright" />
                        ) : (
                          <span className="text-white/50">-</span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedAttribute(attr)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                {attr.Attribute_ID}: {attr.Attribute_Name}
                              </DialogTitle>
                              <DialogDescription className="flex items-center gap-2">
                                <Badge className={CATEGORY_COLORS[attr.Category] || ""}>
                                  {attr.Category}
                                </Badge>
                                <Badge variant="outline" className={GROUP_COLORS[attr.Group] || ""}>
                                  {attr.Group}
                                </Badge>
                                {attr.IsRequired === "Y" && (
                                  <Badge className="bg-crowe-teal/20 text-crowe-teal-bright">Required</Badge>
                                )}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 mt-4">
                              <div>
                                <h4 className="font-semibold text-sm mb-1">Testing Question</h4>
                                <p className="text-sm bg-white/10 p-3 rounded">{attr.Question_Text}</p>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-semibold text-sm mb-1">Source</h4>
                                  <p className="text-sm text-white/70">{attr.Source}</p>
                                </div>
                                <div>
                                  <h4 className="font-semibold text-sm mb-1">Source Page</h4>
                                  <p className="text-sm text-white/70">{attr.Source_Page}</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-4">
                                <div>
                                  <h4 className="font-semibold text-sm mb-1">Risk Scope</h4>
                                  <p className="text-sm text-white/70">{attr.RiskScope}</p>
                                </div>
                                <div>
                                  <h4 className="font-semibold text-sm mb-1">Jurisdiction</h4>
                                  <p className="text-sm text-white/70">{attr.Jurisdiction_ID}</p>
                                </div>
                                <div>
                                  <h4 className="font-semibold text-sm mb-1">Doc Age Rule</h4>
                                  <p className="text-sm text-white/70">
                                    {attr.DocumentationAgeRule ? `${attr.DocumentationAgeRule} days` : "-"}
                                  </p>
                                </div>
                              </div>
                              {attr.Notes && (
                                <div>
                                  <h4 className="font-semibold text-sm mb-1">Notes</h4>
                                  <p className="text-sm text-white/70">{attr.Notes}</p>
                                </div>
                              )}

                              {/* Acceptable Documents */}
                              <div>
                                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                  <FileText className="h-4 w-4" />
                                  Acceptable Documents
                                </h4>
                                <div className="space-y-2">
                                  {getDocsForAttribute(attr.Attribute_ID).length === 0 ? (
                                    <p className="text-sm text-white/60">No documents specified</p>
                                  ) : (
                                    getDocsForAttribute(attr.Attribute_ID).map((doc, idx) => (
                                      <div
                                        key={idx}
                                        className="flex items-start gap-3 p-2 bg-white/10 rounded text-sm"
                                      >
                                        <FileText className="h-4 w-4 mt-0.5 text-white/50" />
                                        <div>
                                          <p className="font-medium">{doc.Document_Name}</p>
                                          {doc.Notes && (
                                            <p className="text-xs text-white/60">{doc.Notes}</p>
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
