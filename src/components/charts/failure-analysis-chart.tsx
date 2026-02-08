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
import { CHART_COLORS } from "./chart-colors";
import { useChartTheme } from "./use-chart-theme";

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
  const t = useChartTheme();

  const chartData: FailureData[] = data || [
    { name: "Fail 1 - Regulatory", value: fail1Count, color: CHART_COLORS.fail1 },
    { name: "Fail 2 - Procedure", value: fail2Count, color: CHART_COLORS.fail2 },
    { name: "Question to LOB", value: questionCount, color: CHART_COLORS.questions },
  ].filter((item) => item.value > 0);

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <div
        className={`flex items-center justify-center ${t.emptyTextClass}`}
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
            tick={{ fill: t.tickFillMuted, fontSize: 11 }}
            axisLine={t.axisStyle.axisLine}
            tickLine={t.axisStyle.tickLine}
            width={115}
          />
          <Tooltip
            contentStyle={t.tooltipStyle.contentStyle}
            itemStyle={t.tooltipStyle.itemStyle}
            cursor={{ fill: t.cursorFill }}
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
          contentStyle={t.tooltipStyle.contentStyle}
          itemStyle={t.tooltipStyle.itemStyle}
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
            wrapperStyle={{ color: t.legendColor }}
            iconType="circle"
            iconSize={10}
            formatter={(value) => (
              <span style={{ color: t.legendColor }}>{value}</span>
            )}
          />
        )}
      </PieChart>
    </ResponsiveContainer>
  );
}
