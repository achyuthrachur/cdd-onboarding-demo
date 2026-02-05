"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Crown,
  ClipboardCheck,
  ArrowRight,
  Users,
  FileSpreadsheet,
  BarChart3,
  Eye,
} from "lucide-react";
import { motion } from "@/lib/animations";
import { setAicRole, setAuditorRole } from "@/lib/auth/session";
import { mockAuditors } from "@/lib/attribute-library/mock-data";

export function RoleSelector() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<"aic" | "auditor" | null>(null);
  const [selectedAuditor, setSelectedAuditor] = useState<string>("");

  const handleAicSelect = () => {
    setAicRole();
    router.push("/aic");
  };

  const handleAuditorSelect = () => {
    if (!selectedAuditor) return;
    const auditor = mockAuditors.find((a) => a.id === selectedAuditor);
    if (!auditor) return;
    setAuditorRole(auditor.id, auditor.name);
    router.push("/auditor");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-8">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-xl">
              C
            </div>
            <h1 className="text-4xl font-bold tracking-tight">CDD Onboarding Demo</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Audit testing workflow for CIP/CDD/EDD compliance. Select your role to continue.
          </p>
        </motion.div>

        {/* Role Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* AIC Card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedRole === "aic"
                  ? "ring-2 ring-primary border-primary"
                  : "hover:border-primary/50"
              }`}
              onClick={() => setSelectedRole("aic")}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                    <Crown className="h-6 w-6" />
                  </div>
                  <Badge variant="secondary">Full Access</Badge>
                </div>
                <CardTitle className="text-xl">Auditor in Charge (AIC)</CardTitle>
                <CardDescription>
                  Lead the audit engagement, manage workbooks, and monitor progress
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                    <span>Gap analysis & attribute extraction</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    <span>Sampling configuration</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>Workbook generation & assignment</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <span>Live progress monitoring</span>
                  </div>
                </div>

                <Button
                  className="w-full mt-4"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAicSelect();
                  }}
                >
                  Continue as AIC
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Auditor Card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedRole === "auditor"
                  ? "ring-2 ring-primary border-primary"
                  : "hover:border-primary/50"
              }`}
              onClick={() => setSelectedRole("auditor")}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    <ClipboardCheck className="h-6 w-6" />
                  </div>
                  <Badge variant="outline">Testing</Badge>
                </div>
                <CardTitle className="text-xl">Auditor</CardTitle>
                <CardDescription>
                  Complete assigned testing workbooks and submit results
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                    <span>View assigned workbooks</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                    <span>Complete CDD testing</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <span>Submit completed workbooks</span>
                  </div>
                </div>

                {/* Auditor Selection */}
                <div className="pt-2 border-t">
                  <label className="text-sm font-medium mb-2 block">
                    Select your identity:
                  </label>
                  <Select value={selectedAuditor} onValueChange={setSelectedAuditor}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose auditor..." />
                    </SelectTrigger>
                    <SelectContent>
                      {mockAuditors.map((auditor) => (
                        <SelectItem key={auditor.id} value={auditor.id}>
                          {auditor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  className="w-full mt-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAuditorSelect();
                  }}
                  disabled={!selectedAuditor}
                >
                  Continue as Auditor
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.div
          className="text-center mt-12 text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p>CDD Onboarding Demo v1.0 | Dual-Portal Architecture</p>
        </motion.div>
      </div>
    </div>
  );
}
