"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  Search,
  FileText,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import { ExceptionDetail, FindingsByAttribute } from "@/lib/consolidation/engine";

interface FindingsTableProps {
  exceptions: ExceptionDetail[];
  findingsByAttribute: FindingsByAttribute[];
}

export function FindingsTable({
  exceptions,
  findingsByAttribute,
}: FindingsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedFinding, setSelectedFinding] = useState<ExceptionDetail | null>(null);
  const [expandedAttributes, setExpandedAttributes] = useState<Set<string>>(new Set());

  // Get unique categories
  const categories = [...new Set(exceptions.map((e) => e.category))];

  // Filter exceptions
  const filteredExceptions = exceptions.filter((exception) => {
    const matchesSearch =
      exception.entityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exception.attributeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exception.observation.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      categoryFilter === "all" || exception.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const toggleAttributeExpand = (attributeId: string) => {
    const newExpanded = new Set(expandedAttributes);
    if (newExpanded.has(attributeId)) {
      newExpanded.delete(attributeId);
    } else {
      newExpanded.add(attributeId);
    }
    setExpandedAttributes(newExpanded);
  };

  return (
    <div className="space-y-6">
      {/* Findings by Attribute Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Findings by Attribute
          </CardTitle>
          <CardDescription>
            Summary of test results grouped by attribute (sorted by fail rate)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {findingsByAttribute.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No attribute findings available</p>
            </div>
          ) : (
            <div className="space-y-2">
              {findingsByAttribute.map((attr) => (
                <div
                  key={attr.attributeId}
                  className="border rounded-lg overflow-hidden"
                >
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50"
                    onClick={() => toggleAttributeExpand(attr.attributeId)}
                  >
                    <div className="flex items-center gap-3">
                      {expandedAttributes.has(attr.attributeId) ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                      <div>
                        <p className="font-medium">{attr.attributeName}</p>
                        <p className="text-sm text-muted-foreground">
                          {attr.category}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="flex gap-2">
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700"
                          >
                            {attr.passCount} pass
                          </Badge>
                          <Badge
                            variant="outline"
                            className={
                              attr.failCount > 0
                                ? "bg-red-50 text-red-700"
                                : ""
                            }
                          >
                            {attr.failCount} fail
                          </Badge>
                          {attr.naCount > 0 && (
                            <Badge variant="outline">
                              {attr.naCount} N/A
                            </Badge>
                          )}
                        </div>
                      </div>
                      {attr.failRate > 0 && (
                        <Badge
                          className={
                            attr.failRate >= 15
                              ? "bg-red-500"
                              : attr.failRate >= 10
                              ? "bg-yellow-500"
                              : "bg-gray-500"
                          }
                        >
                          {attr.failRate.toFixed(1)}%
                        </Badge>
                      )}
                    </div>
                  </div>
                  {expandedAttributes.has(attr.attributeId) &&
                    attr.observations.length > 0 && (
                      <div className="px-4 pb-4 pt-0">
                        <div className="pl-8 border-l-2 border-muted ml-2">
                          <p className="text-sm font-medium mb-2 text-muted-foreground">
                            Observations:
                          </p>
                          <ul className="space-y-1">
                            {attr.observations.map((obs, idx) => (
                              <li
                                key={idx}
                                className="text-sm text-muted-foreground flex items-start gap-2"
                              >
                                <span className="text-red-500">•</span>
                                {obs}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Exceptions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Exceptions & Findings
          </CardTitle>
          <CardDescription>
            All exceptions logged during testing ({exceptions.length} total)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search exceptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filteredExceptions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="font-medium mb-2">
                {exceptions.length === 0
                  ? "No exceptions found"
                  : "No matching exceptions"}
              </h3>
              <p className="text-sm">
                {exceptions.length === 0
                  ? "Exceptions will appear here after workbook testing is complete"
                  : "Try adjusting your search or filter criteria"}
              </p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entity</TableHead>
                    <TableHead>Attribute</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="max-w-[300px]">Observation</TableHead>
                    <TableHead>Evidence</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExceptions.map((exception) => (
                    <TableRow key={exception.id}>
                      <TableCell className="font-medium">
                        {exception.entityName}
                      </TableCell>
                      <TableCell>{exception.attributeName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{exception.category}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[300px]">
                        <p className="truncate" title={exception.observation}>
                          {exception.observation}
                        </p>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {exception.evidenceReference}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedFinding(exception)}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Exception Detail Dialog */}
      <Dialog
        open={!!selectedFinding}
        onOpenChange={(open) => !open && setSelectedFinding(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Exception Detail</DialogTitle>
            <DialogDescription>
              Full details of the logged exception
            </DialogDescription>
          </DialogHeader>
          {selectedFinding && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Entity
                  </p>
                  <p className="font-medium">{selectedFinding.entityName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Sample Item ID
                  </p>
                  <p className="font-mono text-sm">
                    {selectedFinding.sampleItemId}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Attribute
                  </p>
                  <p>{selectedFinding.attributeName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Category
                  </p>
                  <Badge variant="outline">{selectedFinding.category}</Badge>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Observation
                </p>
                <p className="p-3 bg-red-50 dark:bg-red-950 rounded-lg text-sm">
                  {selectedFinding.observation}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Evidence Reference
                  </p>
                  <p className="font-mono text-sm">
                    {selectedFinding.evidenceReference}
                  </p>
                </div>
              </div>

              {selectedFinding.auditorNotes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Auditor Notes
                  </p>
                  <p className="p-3 bg-muted rounded-lg text-sm">
                    {selectedFinding.auditorNotes}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
