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
  "Entity Profile": "bg-blue-100 text-blue-700",
  "Individual Profile": "bg-purple-100 text-purple-700",
  "Ownership": "bg-green-100 text-green-700",
  "Documentation": "bg-yellow-100 text-yellow-700",
  "AML": "bg-red-100 text-red-700",
  "EDD": "bg-orange-100 text-orange-700",
  "Compliance": "bg-indigo-100 text-indigo-700",
  "Registration": "bg-pink-100 text-pink-700",
};

const GROUP_COLORS: Record<string, string> = {
  "Individuals": "bg-cyan-100 text-cyan-700",
  "Entity": "bg-emerald-100 text-emerald-700",
  "Beneficial Owner": "bg-violet-100 text-violet-700",
  "Screening": "bg-amber-100 text-amber-700",
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
            <div className="text-2xl font-bold">{acceptableDocs.length}</div>
            <p className="text-xs text-muted-foreground">Acceptable Documents</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{categories.length}</div>
            <p className="text-xs text-muted-foreground">Categories</p>
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
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                  <TableHead className="w-[80px]">ID</TableHead>
                  <TableHead className="w-[180px]">Attribute</TableHead>
                  <TableHead className="w-[130px]">Category</TableHead>
                  <TableHead className="w-[120px]">Group</TableHead>
                  <TableHead>Question</TableHead>
                  <TableHead className="w-[80px]">Required</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAttributes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
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
                      <TableCell className="max-w-[250px] truncate text-sm">
                        {attr.Question_Text}
                      </TableCell>
                      <TableCell>
                        {attr.IsRequired === "Y" ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
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
                                  <Badge className="bg-green-100 text-green-700">Required</Badge>
                                )}
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
                                  <p className="text-sm text-muted-foreground">{attr.Source_Page}</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-4">
                                <div>
                                  <h4 className="font-semibold text-sm mb-1">Risk Scope</h4>
                                  <p className="text-sm text-muted-foreground">{attr.RiskScope}</p>
                                </div>
                                <div>
                                  <h4 className="font-semibold text-sm mb-1">Jurisdiction</h4>
                                  <p className="text-sm text-muted-foreground">{attr.Jurisdiction_ID}</p>
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
                                  Acceptable Documents
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
                                          {doc.Notes && (
                                            <p className="text-xs text-muted-foreground">{doc.Notes}</p>
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
