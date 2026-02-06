"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import type { PieLabelRenderProps } from "recharts";
import {
  CHART_COLORS,
  DARK_TOOLTIP_STYLE,
  DARK_AXIS_STYLE,
  DARK_GRID_STYLE,
} from "./chart-colors";

interface FailureData {
  name: string;
  value: number;
  color?: string;
}

interface FailureAnalysisChartProps {
  fail1Count?: number;
  fail2Count?: number;
  questionCount?: number;
  data?: FailureData[];
  height?: number;
  variant?: "pie" | "bar";
  showLegend?: boolean;
}

/**
 * Failure Analysis Chart
 * Breakdown of failure types (Regulatory, Procedure, Questions)
 */
export function FailureAnalysisChart({
  fail1Count = 0,
  fail2Count = 0,
  questionCount = 0,
  data,
  height = 300,
  variant = "pie",
  showLegend = true,
}: FailureAnalysisChartProps) {
  const chartData: FailureData[] = data || [
    { name: "Fail 1 - Regulatory", value: fail1Count, color: CHART_COLORS.fail1 },
    { name: "Fail 2 - Procedure", value: fail2Count, color: CHART_COLORS.fail2 },
    { name: "Question to LOB", value: questionCount, color: CHART_COLORS.questions },
  ].filter((item) => item.value > 0);

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <div
        className="flex items-center justify-center text-white/80"
        style={{ height }}
      >
        <div className="text-center">
          <div className="text-4xl mb-2">0</div>
          <div className="text-sm">No exceptions found</div>
        </div>
      </div>
    );
  }

  if (variant === "bar") {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 20, right: 30, left: 120, bottom: 5 }}
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
            tick={{ fill: "rgba(255, 255, 255, 0.8)", fontSize: 11 }}
            axisLine={DARK_AXIS_STYLE.axisLine}
            tickLine={DARK_AXIS_STYLE.tickLine}
            width={115}
          />
          <Tooltip
            contentStyle={DARK_TOOLTIP_STYLE.contentStyle}
            itemStyle={DARK_TOOLTIP_STYLE.itemStyle}
            cursor={{ fill: "rgba(255, 255, 255, 0.05)" }}
            formatter={(value) => {
              const numValue = typeof value === 'number' ? value : 0;
              return [numValue, "Count"];
            }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || CHART_COLORS.fail1} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  // Pie variant - custom label with proper typing
  const renderPieLabel = (props: PieLabelRenderProps) => {
    const { percent } = props;
    if (typeof percent !== 'number' || percent < 0.05) return null;
    return `${(percent * 100).toFixed(0)}%`;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={3}
          dataKey="value"
          label={renderPieLabel}
          labelLine={false}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color || CHART_COLORS.fail1} strokeWidth={0} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={DARK_TOOLTIP_STYLE.contentStyle}
          itemStyle={DARK_TOOLTIP_STYLE.itemStyle}
          formatter={(value, name) => {
            const numValue = typeof value === 'number' ? value : 0;
            return [
              `${numValue} (${((numValue / total) * 100).toFixed(1)}%)`,
              name,
            ];
          }}
        />
        {showLegend && (
          <Legend
            wrapperStyle={{ color: "rgba(255, 255, 255, 0.8)" }}
            iconType="circle"
            iconSize={10}
            formatter={(value) => (
              <span style={{ color: "rgba(255, 255, 255, 0.8)" }}>{value}</span>
            )}
          />
        )}
      </PieChart>
    </ResponsiveContainer>
  );
}
