"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Download,
  FileSpreadsheet,
  Search,
  Filter,
  CheckCircle2,
  FileText,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { FLUExtractionResult } from "@/lib/stage-data/store";
import type { Attribute, AcceptableDoc } from "@/lib/attribute-library/types";
import {
  motion,
  AnimatePresence,
  staggerContainer,
  staggerItem,
  tabContent,
  useReducedMotion,
} from "@/lib/animations";

interface ExtractionResultsViewProps {
  result: FLUExtractionResult;
  onExportExcel: () => void;
}

export function ExtractionResultsView({
  result,
  onExportExcel,
}: ExtractionResultsViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("attributes");
  const shouldReduceMotion = useReducedMotion();

  // Extract attributes and docs from result
  const attributes = useMemo(() => {
    const sheet = result.workbook.sheets.find(s => s.name === "Attributes");
    return (sheet?.rows || []) as unknown as Attribute[];
  }, [result]);

  const acceptableDocs = useMemo(() => {
    const sheet = result.workbook.sheets.find(s => s.name === "Acceptable_Docs");
    return (sheet?.rows || []) as unknown as AcceptableDoc[];
  }, [result]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts = { CIP: 0, CDD: 0, EDD: 0 };
    attributes.forEach(attr => {
      if (attr.Category === "CIP") counts.CIP++;
      else if (attr.Category === "CDD") counts.CDD++;
      else if (attr.Category === "EDD") counts.EDD++;
    });
    return counts;
  }, [attributes]);

  // Filtered attributes
  const filteredAttributes = useMemo(() => {
    return attributes.filter(attr => {
      const matchesSearch = !searchTerm ||
        attr.Attribute_Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        attr.Attribute_ID?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        attr.Question_Text?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = categoryFilter === "all" ||
        attr.Category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [attributes, searchTerm, categoryFilter]);

  // Filtered acceptable docs
  const filteredDocs = useMemo(() => {
    return acceptableDocs.filter(doc => {
      const matchesSearch = !searchTerm ||
        doc.Document_Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.Attribute_ID?.toLowerCase().includes(searchTerm.toLowerCase());

      // If category filter is set, only show docs for attributes in that category
      if (categoryFilter !== "all") {
        const attrCategory = attributes.find(a => a.Attribute_ID === doc.Attribute_ID)?.Category;
        if (attrCategory !== categoryFilter) return false;
      }

      return matchesSearch;
    });
  }, [acceptableDocs, searchTerm, categoryFilter, attributes]);

  // Get acceptable docs for a specific attribute
  const getDocsForAttribute = (attributeId: string) => {
    return acceptableDocs.filter(doc => doc.Attribute_ID === attributeId);
  };

  const getCategoryBadgeVariant = (category: string): "default" | "secondary" | "outline" | "destructive" => {
    switch (category) {
      case "CIP":
        return "default";
      case "CDD":
        return "secondary";
      case "EDD":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "CIP":
        return <ShieldCheck className="h-3 w-3" />;
      case "CDD":
        return <FileText className="h-3 w-3" />;
      case "EDD":
        return <AlertTriangle className="h-3 w-3" />;
      default:
        return null;
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileSpreadsheet className="h-5 w-5" />
              Extraction Results
            </CardTitle>
            <CardDescription>
              {attributes.length} attributes extracted with {acceptableDocs.length} acceptable documents
            </CardDescription>
          </div>
          <motion.div
            whileHover={shouldReduceMotion ? undefined : { scale: 1.02 }}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
          >
            <Button onClick={onExportExcel} className="gap-2">
              <Download className="h-4 w-4" />
              Export to Excel
            </Button>
          </motion.div>
        </div>

        {/* Summary Badges - Staggered entrance */}
        <motion.div
          className="flex gap-3 mt-4"
          initial={shouldReduceMotion ? undefined : "hidden"}
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div variants={staggerItem}>
            <Badge variant="default" className="gap-1 px-3 py-1">
              <ShieldCheck className="h-3 w-3" />
              CIP: {categoryCounts.CIP}
            </Badge>
          </motion.div>
          <motion.div variants={staggerItem}>
            <Badge variant="secondary" className="gap-1 px-3 py-1">
              <FileText className="h-3 w-3" />
              CDD: {categoryCounts.CDD}
            </Badge>
          </motion.div>
          <motion.div variants={staggerItem}>
            <Badge variant="destructive" className="gap-1 px-3 py-1">
              <AlertTriangle className="h-3 w-3" />
              EDD: {categoryCounts.EDD}
            </Badge>
          </motion.div>
        </motion.div>
      </CardHeader>

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <div className="px-4 pt-4 flex-shrink-0">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="attributes" className="gap-2">
                <FileText className="h-4 w-4" />
                Attributes ({filteredAttributes.length})
              </TabsTrigger>
              <TabsTrigger value="documents" className="gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                Acceptable Docs ({filteredDocs.length})
              </TabsTrigger>
            </TabsList>

            {/* Filters */}
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                <Input
                  placeholder="Search attributes or documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="CIP">CIP ({categoryCounts.CIP})</SelectItem>
                  <SelectItem value="CDD">CDD ({categoryCounts.CDD})</SelectItem>
                  <SelectItem value="EDD">EDD ({categoryCounts.EDD})</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tab Content with Animations */}
          <AnimatePresence mode="wait">
            {activeTab === "attributes" && (
              <motion.div
                key="attributes"
                className="flex-1 overflow-auto px-4 pb-4"
                initial={shouldReduceMotion ? undefined : "hidden"}
                animate="visible"
                exit="exit"
                variants={tabContent}
              >
                <TabsContent value="attributes" className="m-0">
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-24">ID</TableHead>
                          <TableHead className="w-20">Category</TableHead>
                          <TableHead className="w-48">Attribute Name</TableHead>
                          <TableHead>Question Text</TableHead>
                          <TableHead className="w-20">Scope</TableHead>
                          <TableHead className="w-20">Docs</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAttributes.map((attr, index) => {
                          const docs = getDocsForAttribute(attr.Attribute_ID);
                          return (
                            <motion.tr
                              key={attr.Attribute_ID}
                              className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                              initial={shouldReduceMotion ? undefined : { opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: Math.min(index * 0.02, 0.3) }}
                            >
                              <TableCell className="font-mono text-xs">
                                {attr.Attribute_ID}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={getCategoryBadgeVariant(attr.Category)}
                                  className="gap-1"
                                >
                                  {getCategoryIcon(attr.Category)}
                                  {attr.Category}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-medium">
                                {attr.Attribute_Name}
                              </TableCell>
                              <TableCell className="text-sm text-white/60">
                                {attr.Question_Text}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  {attr.RiskScope}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="text-xs">
                                  {docs.length}
                                </Badge>
                              </TableCell>
                            </motion.tr>
                          );
                        })}
                        {filteredAttributes.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-white/60">
                              No attributes match your search criteria
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </motion.div>
            )}

            {activeTab === "documents" && (
              <motion.div
                key="documents"
                className="flex-1 overflow-auto px-4 pb-4"
                initial={shouldReduceMotion ? undefined : "hidden"}
                animate="visible"
                exit="exit"
                variants={tabContent}
              >
                <TabsContent value="documents" className="m-0">
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-24">Attribute ID</TableHead>
                          <TableHead className="w-48">Document Name</TableHead>
                          <TableHead>Evidence Source</TableHead>
                          <TableHead className="w-32">Jurisdiction</TableHead>
                          <TableHead>Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredDocs.map((doc, index) => {
                          const attr = attributes.find(a => a.Attribute_ID === doc.Attribute_ID);
                          return (
                            <motion.tr
                              key={`${doc.Attribute_ID}-${index}`}
                              className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                              initial={shouldReduceMotion ? undefined : { opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: Math.min(index * 0.02, 0.3) }}
                            >
                              <TableCell className="font-mono text-xs">
                                <div className="flex items-center gap-2">
                                  {doc.Attribute_ID}
                                  {attr && (
                                    <Badge
                                      variant={getCategoryBadgeVariant(attr.Category)}
                                      className="text-[10px] px-1"
                                    >
                                      {attr.Category}
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="font-medium">
                                {doc.Document_Name}
                              </TableCell>
                              <TableCell className="text-sm text-white/60">
                                {doc.Evidence_Source_Document}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  {doc.Jurisdiction_ID}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs text-white/60">
                                {doc.Notes}
                              </TableCell>
                            </motion.tr>
                          );
                        })}
                        {filteredDocs.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-white/60">
                              No documents match your search criteria
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Tabs>
      </div>
    </Card>
  );
}
