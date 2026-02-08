"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { PieLabelRenderProps } from "recharts";
import { CHART_COLORS } from "./chart-colors";
import { useChartTheme } from "./use-chart-theme";

interface ResultData {
  name: string;
  value: number;
  color: string;
}

interface ResultPieChartProps {
  data?: ResultData[];
  passCount?: number;
  passObsCount?: number;
  fail1Count?: number;
  fail2Count?: number;
  questionCount?: number;
  naCount?: number;
  height?: number;
  showLegend?: boolean;
  innerRadius?: number;
  outerRadius?: number;
}

/**
 * Result Distribution Pie Chart
 * Displays pass/fail breakdown with Crowe brand colors
 * Can accept either pre-formatted data array or individual counts
 */
export function ResultPieChart({
  data,
  passCount = 0,
  passObsCount = 0,
  fail1Count = 0,
  fail2Count = 0,
  questionCount = 0,
  naCount = 0,
  height = 300,
  showLegend = true,
  innerRadius = 60,
  outerRadius = 100,
}: ResultPieChartProps) {
  const t = useChartTheme();

  // Build data from counts if not provided
  const chartData: ResultData[] = data || [
    { name: "Pass", value: passCount, color: CHART_COLORS.pass },
    { name: "Pass w/Obs", value: passObsCount, color: CHART_COLORS.passObs },
    { name: "Fail 1 - Reg", value: fail1Count, color: CHART_COLORS.fail1 },
    { name: "Fail 2 - Proc", value: fail2Count, color: CHART_COLORS.fail2 },
    { name: "Questions", value: questionCount, color: CHART_COLORS.questions },
    { name: "N/A", value: naCount, color: CHART_COLORS.na },
  ].filter((item) => item.value > 0);

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <div
        className={`flex items-center justify-center ${t.emptyTextClass}`}
        style={{ height }}
      >
        No data available
      </div>
    );
  }

  // Custom label renderer with proper typing for recharts
  const renderLabel = (props: PieLabelRenderProps) => {
    const { cx, cy, midAngle, innerRadius: ir, outerRadius: or, percent } = props;

    // Type guards for optional values
    if (
      typeof cx !== 'number' ||
      typeof cy !== 'number' ||
      typeof midAngle !== 'number' ||
      typeof ir !== 'number' ||
      typeof or !== 'number' ||
      typeof percent !== 'number'
    ) {
      return null;
    }

    if (percent < 0.05) return null; // Don't show labels for tiny slices

    const RADIAN = Math.PI / 180;
    const radius = ir + (or - ir) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill={t.pieLabelFill}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
        fontWeight={600}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={2}
          dataKey="value"
          label={renderLabel}
          labelLine={false}
        >
          {chartData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color}
              strokeWidth={0}
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={t.tooltipStyle.contentStyle}
          itemStyle={t.tooltipStyle.itemStyle}
          labelStyle={t.tooltipStyle.labelStyle}
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
