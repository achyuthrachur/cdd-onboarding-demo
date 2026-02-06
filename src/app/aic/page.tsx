"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileStack,
  FileText,
  BarChart3,
  CheckCircle2,
  Plus,
  ArrowRight,
  Eye,
  Users,
} from "lucide-react";
import { motion, staggerContainer, staggerItem } from "@/lib/animations";

export default function AicDashboardPage() {
  return (
    <div className="p-8 min-h-full">
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">AIC Dashboard</h1>
          <Badge className="bg-crowe-amber/20 text-crowe-amber-dark dark:text-crowe-amber border-0">
            Auditor in Charge
          </Badge>
        </div>
        <p className="text-gray-500 dark:text-white/80 mt-2">
          Manage audit engagements, generate workbooks, and monitor auditor progress.
        </p>
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 mb-8"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={staggerItem}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Audit Runs</CardTitle>
              <FileStack className="h-4 w-4 text-gray-500 dark:text-white/80" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-gray-500 dark:text-white/80">
                Create your first audit run
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Published Workbooks</CardTitle>
              <FileText className="h-4 w-4 text-gray-500 dark:text-white/80" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-gray-500 dark:text-white/80">
                Assigned to auditors
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Auditors</CardTitle>
              <Users className="h-4 w-4 text-gray-500 dark:text-white/80" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4</div>
              <p className="text-xs text-gray-500 dark:text-white/80">
                Available for assignment
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-gray-500 dark:text-white/80" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-gray-500 dark:text-white/80">
                Submitted workbooks
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Getting Started & Workflow */}
      <motion.div
        className="grid gap-4 md:grid-cols-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>
              Create a new audit run to begin the workflow
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/aic/audit-runs/new">
              <Button className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Create Audit Run
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AIC Workflow Stages</CardTitle>
            <CardDescription>
              Your responsibilities in the audit lifecycle
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white text-sm font-medium">
                1
              </div>
              <div>
                <p className="font-medium text-sm text-gray-900 dark:text-white">Gap Assessment</p>
                <p className="text-xs text-gray-500 dark:text-white/80">Upload docs, extract attributes</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-crowe-teal/20 text-crowe-teal-dark dark:text-crowe-teal-bright text-sm font-medium">
                2
              </div>
              <div>
                <p className="font-medium text-sm text-gray-900 dark:text-white">Sampling</p>
                <p className="text-xs text-gray-500 dark:text-white/80">Configure and generate samples</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-crowe-blue/20 text-crowe-blue-dark dark:text-crowe-blue-light text-sm font-medium">
                3
              </div>
              <div>
                <p className="font-medium text-sm text-gray-900 dark:text-white">Attribute Extraction</p>
                <p className="text-xs text-gray-500 dark:text-white/80">AI-powered CDD/EDD extraction</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-crowe-amber/20 text-crowe-amber-dark dark:text-crowe-amber text-sm font-medium">
                4
              </div>
              <div>
                <p className="font-medium text-sm text-gray-900 dark:text-white">Workbook Generation & Publish</p>
                <p className="text-xs text-gray-500 dark:text-white/80">Assign to auditors and publish</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-crowe-cyan/20 text-crowe-cyan-dark dark:text-crowe-cyan text-sm font-medium">
                <Eye className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium text-sm text-gray-900 dark:text-white">Live Monitoring</p>
                <p className="text-xs text-gray-500 dark:text-white/80">Track auditor progress in real-time</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Recent Audit Runs</CardTitle>
            <CardDescription>
              Your most recent audit runs will appear here
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FileStack className="h-12 w-12 text-gray-500 dark:text-white/80 mb-4" />
              <p className="text-gray-500 dark:text-white/80 mb-4">No audit runs yet</p>
              <Link href="/aic/audit-runs/new">
                <Button variant="outline">
                  Create your first audit run
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
