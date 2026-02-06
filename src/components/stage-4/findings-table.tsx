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
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  staggerContainer,
  staggerItem,
} from "@/lib/animations";

interface FindingsTableProps {
  exceptions: ExceptionDetail[];
  findingsByAttribute: FindingsByAttribute[];
}

export function FindingsTable({
  exceptions,
  findingsByAttribute,
}: FindingsTableProps) {
  const shouldReduceMotion = useReducedMotion();
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
            <motion.div
              className="text-center py-8 text-white/60"
              initial={shouldReduceMotion ? undefined : { opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <p className="text-sm">No attribute findings available</p>
            </motion.div>
          ) : (
            <motion.div
              className="space-y-2"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {findingsByAttribute.map((attr, index) => (
                <motion.div
                  key={attr.attributeId}
                  className="border rounded-lg overflow-hidden"
                  variants={staggerItem}
                  whileHover={shouldReduceMotion ? undefined : { scale: 1.005 }}
                  transition={{ duration: 0.15 }}
                >
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/10/50"
                    onClick={() => toggleAttributeExpand(attr.attributeId)}
                  >
                    <div className="flex items-center gap-3">
                      <motion.div
                        animate={{ rotate: expandedAttributes.has(attr.attributeId) ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </motion.div>
                      <div>
                        <p className="font-medium">{attr.attributeName}</p>
                        <p className="text-sm text-white/60">
                          {attr.category}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="flex gap-2">
                          <Badge
                            variant="outline"
                            className="bg-crowe-teal/20 text-crowe-teal-bright"
                          >
                            {attr.passCount} pass
                          </Badge>
                          <Badge
                            variant="outline"
                            className={
                              attr.failCount > 0
                                ? "bg-crowe-coral/20 text-crowe-coral-bright"
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
                              ? "bg-crowe-coral"
                              : attr.failRate >= 10
                              ? "bg-crowe-amber"
                              : "bg-white/30"
                          }
                        >
                          {attr.failRate.toFixed(1)}%
                        </Badge>
                      )}
                    </div>
                  </div>
                  <AnimatePresence>
                    {expandedAttributes.has(attr.attributeId) &&
                      attr.observations.length > 0 && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 pt-0">
                            <div className="pl-8 border-l-2 border-white/20 ml-2">
                              <p className="text-sm font-medium mb-2 text-white/60">
                                Observations:
                              </p>
                              <ul className="space-y-1">
                                {attr.observations.map((obs, idx) => (
                                  <motion.li
                                    key={idx}
                                    className="text-sm text-white/60 flex items-start gap-2"
                                    initial={shouldReduceMotion ? undefined : { opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                  >
                                    <span className="text-crowe-coral-bright">•</span>
                                    {obs}
                                  </motion.li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </motion.div>
                      )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </motion.div>
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
          <motion.div
            className="flex gap-4 mb-4"
            initial={shouldReduceMotion ? undefined : { opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
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
          </motion.div>

          <AnimatePresence mode="wait">
            {filteredExceptions.length === 0 ? (
              <motion.div
                key="empty"
                className="text-center py-12 text-white/60"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <motion.div
                  initial={shouldReduceMotion ? undefined : { scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                </motion.div>
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
              </motion.div>
            ) : (
              <motion.div
                key="table"
                className="border rounded-lg overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
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
                    {filteredExceptions.map((exception, index) => (
                      <motion.tr
                        key={exception.id}
                        className="border-b transition-colors hover:bg-white/10/50"
                        initial={shouldReduceMotion ? undefined : { opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: Math.min(index * 0.03, 0.5) }}
                        whileHover={shouldReduceMotion ? undefined : { backgroundColor: "rgba(0,0,0,0.02)" }}
                      >
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
                          <span className="text-sm text-white/60">
                            {exception.evidenceReference}
                          </span>
                        </TableCell>
                        <TableCell>
                          <motion.div
                            whileHover={shouldReduceMotion ? undefined : { scale: 1.1 }}
                            whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedFinding(exception)}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </motion.div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </motion.div>
            )}
          </AnimatePresence>
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
                  <p className="text-sm font-medium text-white/60">
                    Entity
                  </p>
                  <p className="font-medium">{selectedFinding.entityName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-white/60">
                    Sample Item ID
                  </p>
                  <p className="font-mono text-sm">
                    {selectedFinding.sampleItemId}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-white/60">
                    Attribute
                  </p>
                  <p>{selectedFinding.attributeName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-white/60">
                    Category
                  </p>
                  <Badge variant="outline">{selectedFinding.category}</Badge>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-white/60 mb-1">
                  Observation
                </p>
                <p className="p-3 bg-crowe-coral/10 rounded-lg text-sm">
                  {selectedFinding.observation}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-white/60">
                    Evidence Reference
                  </p>
                  <p className="font-mono text-sm">
                    {selectedFinding.evidenceReference}
                  </p>
                </div>
              </div>

              {selectedFinding.auditorNotes && (
                <div>
                  <p className="text-sm font-medium text-white/60 mb-1">
                    Auditor Notes
                  </p>
                  <p className="p-3 bg-white/5 rounded-lg text-sm text-white/70">
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
