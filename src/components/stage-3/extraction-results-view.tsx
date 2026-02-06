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
  Info,
  Sparkles,
  Bot,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  demoMode?: boolean;
}

export function ExtractionResultsView({
  result,
  onExportExcel,
  demoMode = false,
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
    <Card className="h-full !gap-0 overflow-hidden">
      <CardHeader className="border-b flex-shrink-0 !pb-4">
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
          <div className="flex items-center gap-3">
            {/* AI/Demo Mode Indicator */}
            <Badge
              variant={demoMode ? "outline" : "default"}
              className={cn(
                "gap-1.5 px-2.5 py-1",
                demoMode
                  ? "border-crowe-amber text-crowe-amber"
                  : "bg-crowe-teal text-white"
              )}
            >
              {demoMode ? (
                <>
                  <Info className="h-3 w-3" />
                  Demo Data
                </>
              ) : (
                <>
                  <Sparkles className="h-3 w-3" />
                  AI Extracted
                </>
              )}
            </Badge>
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
        </div>

        {/* Demo Mode Alert */}
        {demoMode && (
          <motion.div
            initial={shouldReduceMotion ? undefined : { opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3"
          >
            <Alert variant="default" className="border-crowe-amber/30 bg-crowe-amber/5">
              <Bot className="h-4 w-4 text-crowe-amber" />
              <AlertTitle className="text-sm text-crowe-amber">Demo Mode Active</AlertTitle>
              <AlertDescription className="text-xs text-white/70">
                These results are demonstration data. To enable AI-powered extraction, configure your{" "}
                <code className="px-1 py-0.5 bg-white/10 rounded text-crowe-amber-bright">
                  OPENAI_API_KEY
                </code>{" "}
                environment variable.
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Summary Badges - Staggered entrance */}
        <motion.div
          className="flex gap-3 mt-4"
          initial={shouldReduceMotion ? undefined : "hidden"}
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div variants={staggerItem}>
            <Badge variant="default" className="gap-1 px-2.5 py-0.5 text-xs font-medium">
              <ShieldCheck className="h-3 w-3" />
              CIP: {categoryCounts.CIP}
            </Badge>
          </motion.div>
          <motion.div variants={staggerItem}>
            <Badge variant="secondary" className="gap-1 px-2.5 py-0.5 text-xs font-medium">
              <FileText className="h-3 w-3" />
              CDD: {categoryCounts.CDD}
            </Badge>
          </motion.div>
          <motion.div variants={staggerItem}>
            <Badge variant="destructive" className="gap-1 px-2.5 py-0.5 text-xs font-medium">
              <AlertTriangle className="h-3 w-3" />
              EDD: {categoryCounts.EDD}
            </Badge>
          </motion.div>
        </motion.div>
      </CardHeader>

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden px-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <div className="pt-4 flex-shrink-0">
            <TabsList className="grid w-full grid-cols-2 mb-4 h-11 bg-white/5 border border-white/10">
              <TabsTrigger value="attributes" className="gap-2 data-[state=active]:bg-white/15 data-[state=active]:text-white text-white/70">
                <FileText className="h-4 w-4" />
                Attributes ({filteredAttributes.length})
              </TabsTrigger>
              <TabsTrigger value="documents" className="gap-2 data-[state=active]:bg-white/15 data-[state=active]:text-white text-white/70">
                <FileSpreadsheet className="h-4 w-4" />
                Acceptable Docs ({filteredDocs.length})
              </TabsTrigger>
            </TabsList>

            {/* Filters */}
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70" />
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
                className="flex-1 overflow-auto pb-4 mt-4"
                initial={shouldReduceMotion ? undefined : "hidden"}
                animate="visible"
                exit="exit"
                variants={tabContent}
              >
                <TabsContent value="attributes" className="m-0">
                  <div className="border border-white/20 rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-white/5 border-b border-white/10">
                          <TableHead className="w-24 px-4 py-3 text-white/80">ID</TableHead>
                          <TableHead className="w-20 px-4 py-3 text-white/80">Category</TableHead>
                          <TableHead className="w-48 px-4 py-3 text-white/80">Attribute Name</TableHead>
                          <TableHead className="px-4 py-3 text-white/80">Question Text</TableHead>
                          <TableHead className="w-20 px-4 py-3 text-white/80">Scope</TableHead>
                          <TableHead className="w-20 px-4 py-3 text-white/80">Docs</TableHead>
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
                              <TableCell className="px-4 py-2 font-mono text-xs">
                                {attr.Attribute_ID}
                              </TableCell>
                              <TableCell className="px-4 py-2">
                                <Badge
                                  variant={getCategoryBadgeVariant(attr.Category)}
                                  className="gap-1 px-2.5 py-0.5 text-xs font-medium"
                                >
                                  {getCategoryIcon(attr.Category)}
                                  {attr.Category}
                                </Badge>
                              </TableCell>
                              <TableCell className="px-4 py-2 font-medium">
                                {attr.Attribute_Name}
                              </TableCell>
                              <TableCell className="px-4 py-2 text-sm text-white/70">
                                {attr.Question_Text}
                              </TableCell>
                              <TableCell className="px-4 py-2">
                                <Badge variant="outline" className="px-2.5 py-0.5 text-xs font-medium">
                                  {attr.RiskScope}
                                </Badge>
                              </TableCell>
                              <TableCell className="px-4 py-2">
                                <Badge variant="secondary" className="px-2.5 py-0.5 text-xs font-medium">
                                  {docs.length}
                                </Badge>
                              </TableCell>
                            </motion.tr>
                          );
                        })}
                        {filteredAttributes.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-white/70">
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
                className="flex-1 overflow-auto pb-4 mt-4"
                initial={shouldReduceMotion ? undefined : "hidden"}
                animate="visible"
                exit="exit"
                variants={tabContent}
              >
                <TabsContent value="documents" className="m-0">
                  <div className="border border-white/20 rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-white/5 border-b border-white/10">
                          <TableHead className="w-24 px-4 py-3 text-white/80">Attribute ID</TableHead>
                          <TableHead className="w-48 px-4 py-3 text-white/80">Document Name</TableHead>
                          <TableHead className="px-4 py-3 text-white/80">Evidence Source</TableHead>
                          <TableHead className="w-32 px-4 py-3 text-white/80">Jurisdiction</TableHead>
                          <TableHead className="px-4 py-3 text-white/80">Notes</TableHead>
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
                              <TableCell className="px-4 py-2 font-mono text-xs">
                                <div className="flex items-center gap-2">
                                  {doc.Attribute_ID}
                                  {attr && (
                                    <Badge
                                      variant={getCategoryBadgeVariant(attr.Category)}
                                      className="px-1.5 py-0 text-[10px] font-medium"
                                    >
                                      {attr.Category}
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="px-4 py-2 font-medium">
                                {doc.Document_Name}
                              </TableCell>
                              <TableCell className="px-4 py-2 text-sm text-white/70">
                                {doc.Evidence_Source_Document}
                              </TableCell>
                              <TableCell className="px-4 py-2">
                                <Badge variant="outline" className="px-2.5 py-0.5 text-xs font-medium">
                                  {doc.Jurisdiction_ID}
                                </Badge>
                              </TableCell>
                              <TableCell className="px-4 py-2 text-xs text-white/70">
                                {doc.Notes}
                              </TableCell>
                            </motion.tr>
                          );
                        })}
                        {filteredDocs.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-white/70">
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
