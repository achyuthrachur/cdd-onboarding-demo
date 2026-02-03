"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BarChart3,
  CheckCircle2,
  XCircle,
  MinusCircle,
  TrendingUp,
  TrendingDown,
  Users,
  ClipboardList,
} from "lucide-react";
import { ConsolidationResult } from "@/lib/consolidation/engine";

interface ConsolidationDashboardProps {
  consolidation: ConsolidationResult | null;
  isLoading?: boolean;
}

export function ConsolidationDashboard({
  consolidation,
  isLoading,
}: ConsolidationDashboardProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Loading Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2" />
                <div className="h-3 w-20 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!consolidation) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <h3 className="font-medium mb-2">No consolidation data</h3>
        <p className="text-sm">
          Generate a consolidation to view metrics and results
        </p>
      </div>
    );
  }

  const { metrics, findingsByCategory } = consolidation;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Total Tests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalTests}</div>
            <p className="text-xs text-muted-foreground">
              across {metrics.uniqueEntitiesTested} entities
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Pass Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metrics.passRate >= 80 ? 'text-green-600' : metrics.passRate >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
              {metrics.passRate.toFixed(1)}%
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Progress value={metrics.passRate} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Exceptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {metrics.exceptionsCount}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.failRate.toFixed(1)}% fail rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Workbooks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.workbooksSubmitted}
            </div>
            <p className="text-xs text-muted-foreground">
              submitted for consolidation
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Test Results Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Test Results Summary</CardTitle>
          <CardDescription>
            Breakdown of all test results across submitted workbooks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-4 p-4 bg-green-50 dark:bg-green-950 rounded-lg">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {metrics.passCount}
                </div>
                <p className="text-sm text-muted-foreground">Passed</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-red-50 dark:bg-red-950 rounded-lg">
              <XCircle className="h-10 w-10 text-red-600" />
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {metrics.failCount}
                </div>
                <p className="text-sm text-muted-foreground">Failed</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <MinusCircle className="h-10 w-10 text-gray-500" />
              <div>
                <div className="text-2xl font-bold text-gray-500">
                  {metrics.naCount}
                </div>
                <p className="text-sm text-muted-foreground">Not Applicable</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results by Category */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Results by Category
          </CardTitle>
          <CardDescription>
            Pass/Fail breakdown by testing category (sorted by fail rate)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {findingsByCategory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No category data available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {findingsByCategory.map((category) => {
                const total = category.passCount + category.failCount + category.naCount;
                const passPercent = total > 0 ? (category.passCount / total) * 100 : 0;
                const failPercent = total > 0 ? (category.failCount / total) * 100 : 0;

                return (
                  <div key={category.category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{category.category}</span>
                        <Badge variant="outline" className="text-xs">
                          {category.totalTests} tests
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-green-600">
                          {category.passCount} pass
                        </span>
                        <span className="text-red-600">
                          {category.failCount} fail
                        </span>
                        {category.naCount > 0 && (
                          <span className="text-gray-500">
                            {category.naCount} N/A
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="h-3 rounded-full bg-muted overflow-hidden flex">
                      <div
                        className="bg-green-500 h-full transition-all"
                        style={{ width: `${passPercent}%` }}
                      />
                      <div
                        className="bg-red-500 h-full transition-all"
                        style={{ width: `${failPercent}%` }}
                      />
                    </div>
                    {category.failRate > 10 && (
                      <p className="text-xs text-red-600">
                        {category.failRate.toFixed(1)}% failure rate - requires attention
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
