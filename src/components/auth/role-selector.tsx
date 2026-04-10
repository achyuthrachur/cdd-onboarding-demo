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
import {
  ScrollReveal,
  ScrollScale,
  ScrollStagger,
  ScrollStaggerItem,
  ParallaxLayer,
} from "@/lib/animations";
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
    <div className="min-h-screen flex flex-col bg-cool-gradient bg-noise bg-dot-grid">
      {/* Top accent bar - Crowe Amber */}
      <div className="h-1 bg-gradient-to-r from-crowe-amber via-crowe-amber-bright to-crowe-amber" />

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-4xl">
          {/* Header */}
          <ScrollReveal direction="up" className="text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tight text-tint-900 dark:text-[#f6f7fa] mb-2">
              CDD Onboarding Demo
            </h1>
            <p className="text-lg text-tint-700 dark:text-[#c8cbd6] max-w-2xl mx-auto">
              Audit testing workflow for CIP/CDD/EDD compliance. Select your role to continue.
            </p>
          </ScrollReveal>

        {/* Role Cards */}
        <ScrollStagger className="grid gap-6 md:grid-cols-2 items-stretch">
          {/* AIC Card */}
          <ScrollStaggerItem className="h-full">
            <ScrollScale className="h-full">
            <Card
              className={`h-full flex flex-col cursor-pointer transition-all duration-300 ${
                selectedRole === "aic"
                  ? "ring-2 ring-crowe-amber shadow-[0_4px_16px_rgba(245,168,0,0.25)]"
                  : "hover:-translate-y-1"
              }`}
              onClick={() => setSelectedRole("aic")}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-crowe-amber text-crowe-indigo-dark shadow-amber-glow">
                    <Crown className="h-6 w-6" />
                  </div>
                  <Badge className="bg-crowe-amber/20 text-crowe-amber border-0 hover:bg-crowe-amber/20">Full Access</Badge>
                </div>
                <CardTitle className="text-xl">Auditor in Charge (AIC)</CardTitle>
                <CardDescription>
                  Lead the audit engagement, manage workbooks, and monitor progress
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <FileSpreadsheet className="h-4 w-4 text-tint-500 dark:text-tint-300" />
                    <span>Gap analysis & attribute extraction</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <BarChart3 className="h-4 w-4 text-tint-500 dark:text-tint-300" />
                    <span>Sampling configuration</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Users className="h-4 w-4 text-tint-500 dark:text-tint-300" />
                    <span>Workbook generation & assignment</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Eye className="h-4 w-4 text-tint-500 dark:text-tint-300" />
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
            </ScrollScale>
          </ScrollStaggerItem>

          {/* Auditor Card */}
          <ScrollStaggerItem className="h-full">
            <ScrollScale className="h-full">
            <Card
              className={`cursor-pointer transition-all duration-300 ${
                selectedRole === "auditor"
                  ? "ring-2 ring-crowe-cyan shadow-[0_4px_16px_rgba(84,192,232,0.25)]"
                  : "hover:-translate-y-1"
              }`}
              onClick={() => setSelectedRole("auditor")}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-crowe-indigo text-white shadow-crowe-md">
                    <ClipboardCheck className="h-6 w-6" />
                  </div>
                  <Badge className="bg-crowe-cyan/20 text-crowe-cyan border-0 hover:bg-crowe-cyan/20">Testing</Badge>
                </div>
                <CardTitle className="text-xl">Auditor</CardTitle>
                <CardDescription>
                  Complete assigned testing workbooks and submit results
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <FileSpreadsheet className="h-4 w-4 text-tint-500 dark:text-tint-300" />
                    <span>View assigned workbooks</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <ClipboardCheck className="h-4 w-4 text-tint-500 dark:text-tint-300" />
                    <span>Complete CDD testing</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <ArrowRight className="h-4 w-4 text-tint-500 dark:text-tint-300" />
                    <span>Submit completed workbooks</span>
                  </div>
                </div>

                {/* Auditor Selection */}
                <div className="pt-2 border-t border-tint-200 dark:border-white/10">
                  <label className="text-sm font-medium mb-2 block text-tint-700 dark:text-tint-300">
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
            </ScrollScale>
          </ScrollStaggerItem>
        </ScrollStagger>

          {/* Footer */}
          <ScrollReveal className="text-center mt-12 text-sm text-tint-500 dark:text-[#8b90a0]">
            <p>CDD Onboarding Demo v1.4 | Dual-Portal Architecture | Deploy: 2026-02-07-D</p>
          </ScrollReveal>
        </div>
      </div>
    </div>
  );
}
