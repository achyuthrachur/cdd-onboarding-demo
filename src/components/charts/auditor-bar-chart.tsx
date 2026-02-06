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
import {
  CHART_COLORS,
  DARK_TOOLTIP_STYLE,
  DARK_AXIS_STYLE,
  DARK_GRID_STYLE,
} from "./chart-colors";

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
  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-white/80"
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
          <CartesianGrid {...DARK_GRID_STYLE} horizontal />
          <XAxis
            type="number"
            tick={{ fill: "rgba(255, 255, 255, 0.6)", fontSize: 12 }}
            axisLine={DARK_AXIS_STYLE.axisLine}
            tickLine={DARK_AXIS_STYLE.tickLine}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: "rgba(255, 255, 255, 0.8)", fontSize: 12 }}
            axisLine={DARK_AXIS_STYLE.axisLine}
            tickLine={DARK_AXIS_STYLE.tickLine}
            width={75}
          />
          <Tooltip
            contentStyle={DARK_TOOLTIP_STYLE.contentStyle}
            itemStyle={DARK_TOOLTIP_STYLE.itemStyle}
            cursor={{ fill: "rgba(255, 255, 255, 0.05)" }}
          />
          {showLegend && (
            <Legend
              wrapperStyle={{ color: "rgba(255, 255, 255, 0.8)" }}
              formatter={(value) => (
                <span style={{ color: "rgba(255, 255, 255, 0.8)" }}>
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
        <CartesianGrid {...DARK_GRID_STYLE} horizontal />
        <XAxis
          type="number"
          domain={[0, 100]}
          tick={{ fill: "rgba(255, 255, 255, 0.6)", fontSize: 12 }}
          axisLine={DARK_AXIS_STYLE.axisLine}
          tickLine={DARK_AXIS_STYLE.tickLine}
          tickFormatter={(value) => `${value}%`}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fill: "rgba(255, 255, 255, 0.8)", fontSize: 12 }}
          axisLine={DARK_AXIS_STYLE.axisLine}
          tickLine={DARK_AXIS_STYLE.tickLine}
          width={75}
        />
        <Tooltip
          contentStyle={DARK_TOOLTIP_STYLE.contentStyle}
          itemStyle={DARK_TOOLTIP_STYLE.itemStyle}
          cursor={{ fill: "rgba(255, 255, 255, 0.05)" }}
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
