"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import { CHART_COLORS } from "./chart-colors";
import { useChartTheme } from "./use-chart-theme";

interface AuditorData {
  name: string;
  completed: number;
  total?: number;
  passCount?: number;
  failCount?: number;
}

interface AuditorBarChartProps {
  data: AuditorData[];
  height?: number;
  showLegend?: boolean;
  variant?: "completion" | "results";
  barSize?: number;
}

/**
 * Auditor Performance Bar Chart
 * Displays completion or pass/fail breakdown per auditor
 */
export function AuditorBarChart({
  data,
  height = 300,
  showLegend = true,
  variant = "completion",
  barSize = 40,
}: AuditorBarChartProps) {
  const t = useChartTheme();

  if (data.length === 0) {
    return (
      <div
        className={`flex items-center justify-center ${t.emptyTextClass}`}
        style={{ height }}
      >
        No auditor data available
      </div>
    );
  }

  // Sort data by completion (descending)
  const sortedData = [...data].sort((a, b) => b.completed - a.completed);

  if (variant === "results") {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={sortedData}
          layout="vertical"
          margin={{ top: 20, right: 30, left: 80, bottom: 5 }}
        >
          <CartesianGrid {...t.gridStyle} horizontal />
          <XAxis
            type="number"
            tick={{ fill: t.tickFill, fontSize: 12 }}
            axisLine={t.axisStyle.axisLine}
            tickLine={t.axisStyle.tickLine}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: t.tickFillMuted, fontSize: 12 }}
            axisLine={t.axisStyle.axisLine}
            tickLine={t.axisStyle.tickLine}
            width={75}
          />
          <Tooltip
            contentStyle={t.tooltipStyle.contentStyle}
            itemStyle={t.tooltipStyle.itemStyle}
            cursor={{ fill: t.cursorFill }}
          />
          {showLegend && (
            <Legend
              wrapperStyle={{ color: t.legendColor }}
              formatter={(value) => (
                <span style={{ color: t.legendColor }}>
                  {value}
                </span>
              )}
            />
          )}
          <Bar
            dataKey="passCount"
            name="Pass"
            stackId="a"
            fill={CHART_COLORS.pass}
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="failCount"
            name="Fail"
            stackId="a"
            fill={CHART_COLORS.fail1}
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  // Completion variant
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={sortedData}
        layout="vertical"
        margin={{ top: 20, right: 30, left: 80, bottom: 5 }}
      >
        <CartesianGrid {...t.gridStyle} horizontal />
        <XAxis
          type="number"
          domain={[0, 100]}
          tick={{ fill: t.tickFill, fontSize: 12 }}
          axisLine={t.axisStyle.axisLine}
          tickLine={t.axisStyle.tickLine}
          tickFormatter={(value) => `${value}%`}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fill: t.tickFillMuted, fontSize: 12 }}
          axisLine={t.axisStyle.axisLine}
          tickLine={t.axisStyle.tickLine}
          width={75}
        />
        <Tooltip
          contentStyle={t.tooltipStyle.contentStyle}
          itemStyle={t.tooltipStyle.itemStyle}
          cursor={{ fill: t.cursorFill }}
          formatter={(value) => [`${(typeof value === 'number' ? value : 0).toFixed(1)}%`, "Completion"]}
        />
        <Bar dataKey="completed" name="Completion" barSize={barSize} radius={[0, 4, 4, 0]}>
          {sortedData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={
                entry.completed >= 95
                  ? CHART_COLORS.completed
                  : entry.completed >= 50
                  ? CHART_COLORS.inProgress
                  : CHART_COLORS.draft
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
