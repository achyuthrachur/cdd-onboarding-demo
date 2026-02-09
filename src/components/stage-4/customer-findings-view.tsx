"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Users,
  Search,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Eye,
  FileText,
  Building2,
  MapPin,
  Shield,
} from "lucide-react";
import { ConsolidatedCustomer } from "@/lib/consolidation/engine";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  staggerContainer,
  staggerItem,
} from "@/lib/animations";

interface CustomerFindingsViewProps {
  customerFindings: ConsolidatedCustomer[];
}

/**
 * Get the badge variant and styling based on overall result
 */
function getResultBadgeConfig(result: ConsolidatedCustomer['overallResult']) {
  switch (result) {
    case 'Pass':
      return {
        className: "bg-crowe-teal/20 text-crowe-teal-bright border-crowe-teal/30",
        icon: CheckCircle2,
      };
    case 'Pass w/Observation':
      return {
        className: "bg-crowe-amber/20 text-crowe-amber-bright border-crowe-amber/30",
        icon: Eye,
      };
    case 'Fail':
      return {
        className: "bg-crowe-coral/20 text-crowe-coral-bright border-crowe-coral/30",
        icon: XCircle,
      };
    case 'Question':
      return {
        className: "bg-crowe-blue/20 text-crowe-blue-light border-crowe-blue/30",
        icon: HelpCircle,
      };
    default:
      return {
        className: "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/80 border-gray-300 dark:border-white/20",
        icon: FileText,
      };
  }
}

/**
 * Get risk tier badge styling
 */
function getRiskTierConfig(tier: string) {
  switch (tier) {
    case 'Critical':
      return "bg-crowe-coral/20 text-crowe-coral-bright";
    case 'High':
      return "bg-crowe-amber-dark/20 text-crowe-amber";
    case 'Medium':
      return "bg-crowe-amber/20 text-crowe-amber-bright";
    case 'Low':
      return "bg-crowe-teal/20 text-crowe-teal-bright";
    default:
      return "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/80";
  }
}

export function CustomerFindingsView({ customerFindings }: CustomerFindingsViewProps) {
  const shouldReduceMotion = useReducedMotion();
  const [searchTerm, setSearchTerm] = useState("");
  const [resultFilter, setResultFilter] = useState<string>("all");
  const [expandedCustomers, setExpandedCustomers] = useState<Set<string>>(new Set());

  // Filter customers
  const filteredCustomers = customerFindings.filter((customer) => {
    const matchesSearch =
      customer.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.customerId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesResult =
      resultFilter === "all" || customer.overallResult === resultFilter;

    return matchesSearch && matchesResult;
  });

  // Calculate summary stats
  const customersWithObservations = customerFindings.filter(
    c => c.observations.length > 0
  ).length;
  const totalObservations = customerFindings.reduce(
    (sum, c) => sum + c.observations.length, 0
  );
  const totalQuestions = customerFindings.reduce(
    (sum, c) => sum + c.questionsToLOB.length, 0
  );
  const totalFailures = customerFindings.reduce(
    (sum, c) => sum + c.failures.length, 0
  );

  const toggleCustomerExpand = (customerId: string) => {
    const newExpanded = new Set(expandedCustomers);
    if (newExpanded.has(customerId)) {
      newExpanded.delete(customerId);
    } else {
      newExpanded.add(customerId);
    }
    setExpandedCustomers(newExpanded);
  };

  const expandAll = () => {
    setExpandedCustomers(new Set(filteredCustomers.map(c => c.customerId)));
  };

  const collapseAll = () => {
    setExpandedCustomers(new Set());
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <motion.div
        className="grid gap-4 md:grid-cols-4"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={staggerItem}>
          <Card className="bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-white/80">Customers with Observations</p>
                  <p className="text-2xl font-bold text-crowe-amber-bright">
                    {customersWithObservations}
                  </p>
                </div>
                <Eye className="h-8 w-8 text-crowe-amber/50 dark:text-crowe-amber/30" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card className="bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-white/80">Total Observations</p>
                  <p className="text-2xl font-bold text-crowe-amber-bright">
                    {totalObservations}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-crowe-amber/50 dark:text-crowe-amber/30" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card className="bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-white/80">Questions to LOB</p>
                  <p className="text-2xl font-bold text-crowe-blue-light">
                    {totalQuestions}
                  </p>
                </div>
                <HelpCircle className="h-8 w-8 text-crowe-blue/50 dark:text-crowe-blue/30" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card className="bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-white/80">Total Failures</p>
                  <p className="text-2xl font-bold text-crowe-coral-bright">
                    {totalFailures}
                  </p>
                </div>
                <XCircle className="h-8 w-8 text-crowe-coral/50 dark:text-crowe-coral/30" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Customer Findings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Customer-Level Findings
          </CardTitle>
          <CardDescription>
            All observations, questions, and failures grouped by customer ({customerFindings.length} customers)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <motion.div
            className="flex flex-wrap gap-4 mb-6"
            initial={shouldReduceMotion ? undefined : { opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-white/80" />
              <Input
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={resultFilter} onValueChange={setResultFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by result" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Results</SelectItem>
                <SelectItem value="Fail">Fail</SelectItem>
                <SelectItem value="Question">Question to LOB</SelectItem>
                <SelectItem value="Pass w/Observation">Pass with Observation</SelectItem>
                <SelectItem value="Pass">Pass</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={expandAll}>
                Expand All
              </Button>
              <Button variant="outline" size="sm" onClick={collapseAll}>
                Collapse All
              </Button>
            </div>
          </motion.div>

          {/* Customer Cards */}
          <AnimatePresence mode="wait">
            {filteredCustomers.length === 0 ? (
              <motion.div
                key="empty"
                className="text-center py-12 text-gray-600 dark:text-white/80"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="font-medium mb-2">No matching customers</h3>
                <p className="text-sm">Try adjusting your search or filter criteria</p>
              </motion.div>
            ) : (
              <motion.div
                key="customers"
                className="space-y-4"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                {filteredCustomers.map((customer) => {
                  const isExpanded = expandedCustomers.has(customer.customerId);
                  const resultConfig = getResultBadgeConfig(customer.overallResult);
                  const ResultIcon = resultConfig.icon;
                  const hasFindingsToShow =
                    customer.observations.length > 0 ||
                    customer.questionsToLOB.length > 0 ||
                    customer.failures.length > 0;

                  return (
                    <motion.div
                      key={customer.customerId}
                      variants={staggerItem}
                      className="border border-gray-200 dark:border-white/10 rounded-lg overflow-hidden bg-gray-50 dark:bg-white/5"
                    >
                      <Collapsible
                        open={isExpanded}
                        onOpenChange={() => toggleCustomerExpand(customer.customerId)}
                      >
                        <CollapsibleTrigger className="w-full">
                          <div className="p-4 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
                            <div className="flex items-center gap-4">
                              <motion.div
                                animate={{ rotate: isExpanded ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <ChevronDown className="h-5 w-5 text-gray-500 dark:text-white/80" />
                              </motion.div>
                              <div className="text-left">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold text-gray-900 dark:text-white">
                                    {customer.customerName}
                                  </h4>
                                  <Badge
                                    variant="outline"
                                    className={`${resultConfig.className} px-2 py-0.5 text-xs font-medium`}
                                  >
                                    <ResultIcon className="h-3 w-3 mr-1" />
                                    {customer.overallResult}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 dark:text-white/80">
                                  <span className="flex items-center gap-1">
                                    <Building2 className="h-3 w-3" />
                                    {customer.partyType}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {customer.jurisdictionId}
                                  </span>
                                  <Badge className={`${getRiskTierConfig(customer.riskTier)} px-2 py-0.5 text-xs`}>
                                    <Shield className="h-3 w-3 mr-1" />
                                    {customer.riskTier} Risk
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                              {customer.observations.length > 0 && (
                                <Badge variant="outline" className="bg-crowe-amber/10 text-crowe-amber-bright border-crowe-amber/30">
                                  {customer.observations.length} obs
                                </Badge>
                              )}
                              {customer.questionsToLOB.length > 0 && (
                                <Badge variant="outline" className="bg-crowe-blue/10 text-crowe-blue-light border-crowe-blue/30">
                                  {customer.questionsToLOB.length} Q
                                </Badge>
                              )}
                              {customer.failures.length > 0 && (
                                <Badge variant="outline" className="bg-crowe-coral/10 text-crowe-coral-bright border-crowe-coral/30">
                                  {customer.failures.length} fail
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                          <AnimatePresence>
                            {isExpanded && hasFindingsToShow && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25 }}
                                className="border-t border-gray-200 dark:border-white/10 p-4 space-y-4"
                              >
                                {/* Observations Section */}
                                {customer.observations.length > 0 && (
                                  <div>
                                    <h4 className="text-gray-900 dark:text-white font-medium mb-3 flex items-center gap-2">
                                      <Eye className="h-4 w-4 text-crowe-amber-bright" />
                                      Observations ({customer.observations.length})
                                    </h4>
                                    <ul className="space-y-2">
                                      {customer.observations.map((obs, idx) => (
                                        <motion.li
                                          key={idx}
                                          className="p-3 bg-crowe-amber/10 dark:bg-crowe-amber/5 border border-crowe-amber/40 dark:border-crowe-amber/20 rounded-lg"
                                          initial={shouldReduceMotion ? undefined : { opacity: 0, x: -10 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          transition={{ delay: idx * 0.05 }}
                                        >
                                          <div className="flex items-start justify-between mb-1">
                                            <span className="text-gray-900 dark:text-white font-medium text-sm">
                                              {obs.attributeName}
                                            </span>
                                            <Badge variant="outline" className="text-xs px-2 py-0.5">
                                              {obs.attributeCategory}
                                            </Badge>
                                          </div>
                                          <p className="text-gray-700 dark:text-white/80 text-sm">
                                            {obs.observationText}
                                          </p>
                                          <p className="text-gray-500 dark:text-white/80 text-xs mt-2">
                                            Auditor: {obs.auditorName}
                                          </p>
                                        </motion.li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {/* Questions to LOB Section */}
                                {customer.questionsToLOB.length > 0 && (
                                  <div>
                                    <h4 className="text-gray-900 dark:text-white font-medium mb-3 flex items-center gap-2">
                                      <HelpCircle className="h-4 w-4 text-crowe-blue-light" />
                                      Questions to LOB ({customer.questionsToLOB.length})
                                    </h4>
                                    <ul className="space-y-2">
                                      {customer.questionsToLOB.map((q, idx) => (
                                        <motion.li
                                          key={idx}
                                          className="p-3 bg-crowe-blue/10 dark:bg-crowe-blue/5 border border-crowe-blue/40 dark:border-crowe-blue/20 rounded-lg"
                                          initial={shouldReduceMotion ? undefined : { opacity: 0, x: -10 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          transition={{ delay: idx * 0.05 }}
                                        >
                                          <div className="flex items-start justify-between mb-1">
                                            <span className="text-gray-900 dark:text-white font-medium text-sm">
                                              {q.attributeName}
                                            </span>
                                            <Badge variant="outline" className="text-xs px-2 py-0.5">
                                              {q.attributeCategory}
                                            </Badge>
                                          </div>
                                          <p className="text-gray-700 dark:text-white/80 text-sm">
                                            {q.questionText}
                                          </p>
                                          <p className="text-gray-500 dark:text-white/80 text-xs mt-2">
                                            Auditor: {q.auditorName}
                                          </p>
                                        </motion.li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {/* Failures Section */}
                                {customer.failures.length > 0 && (
                                  <div>
                                    <h4 className="text-gray-900 dark:text-white font-medium mb-3 flex items-center gap-2">
                                      <XCircle className="h-4 w-4 text-crowe-coral-bright" />
                                      Failures ({customer.failures.length})
                                    </h4>
                                    <ul className="space-y-2">
                                      {customer.failures.map((fail, idx) => (
                                        <motion.li
                                          key={idx}
                                          className="p-3 bg-crowe-coral/10 dark:bg-crowe-coral/5 border border-crowe-coral/40 dark:border-crowe-coral/20 rounded-lg"
                                          initial={shouldReduceMotion ? undefined : { opacity: 0, x: -10 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          transition={{ delay: idx * 0.05 }}
                                        >
                                          <div className="flex items-start justify-between mb-1">
                                            <span className="text-gray-900 dark:text-white font-medium text-sm">
                                              {fail.attributeName}
                                            </span>
                                            <div className="flex items-center gap-2">
                                              <Badge
                                                variant="outline"
                                                className={`text-xs px-2 py-0.5 ${
                                                  fail.failureType === 'Regulatory'
                                                    ? 'bg-crowe-coral/20 text-crowe-coral-bright border-crowe-coral/30'
                                                    : 'bg-crowe-amber-dark/20 text-crowe-amber border-crowe-amber-dark/30'
                                                }`}
                                              >
                                                {fail.failureType}
                                              </Badge>
                                              <Badge variant="outline" className="text-xs px-2 py-0.5">
                                                {fail.attributeCategory}
                                              </Badge>
                                            </div>
                                          </div>
                                          <p className="text-gray-700 dark:text-white/80 text-sm">
                                            {fail.failureReason}
                                          </p>
                                          <p className="text-gray-500 dark:text-white/80 text-xs mt-2">
                                            Auditor: {fail.auditorName}
                                          </p>
                                        </motion.li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {/* Test Summary */}
                                <div className="pt-3 border-t border-gray-200 dark:border-white/10">
                                  <p className="text-gray-600 dark:text-white/80 text-sm">
                                    Test Summary: {customer.passCount} pass, {customer.passWithObservationCount} pass w/obs, {customer.failCount} fail, {customer.questionCount} questions, {customer.naCount} N/A
                                  </p>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </CollapsibleContent>
                      </Collapsible>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
