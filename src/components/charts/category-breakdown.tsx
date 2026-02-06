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

interface CategoryData {
  category: string;
  passCount: number;
  failCount: number;
  naCount?: number;
  passRate?: number;
  failRate?: number;
  totalTests?: number;
}

interface CategoryBreakdownProps {
  data: CategoryData[];
  height?: number;
  showLegend?: boolean;
  variant?: "stacked" | "passRate" | "failRate";
  layout?: "horizontal" | "vertical";
}

/**
 * Category Breakdown Chart
 * Displays pass/fail breakdown by attribute category
 */
export function CategoryBreakdown({
  data,
  height = 300,
  showLegend = true,
  variant = "stacked",
  layout = "vertical",
}: CategoryBreakdownProps) {
  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-white/80"
        style={{ height }}
      >
        No category data available
      </div>
    );
  }

  // Sort by fail rate for better visualization
  const sortedData = [...data].sort((a, b) => {
    const aFailRate = a.failRate ?? (a.totalTests ? (a.failCount / a.totalTests) * 100 : 0);
    const bFailRate = b.failRate ?? (b.totalTests ? (b.failCount / b.totalTests) * 100 : 0);
    return bFailRate - aFailRate;
  });

  if (variant === "passRate" || variant === "failRate") {
    const dataKey = variant === "passRate" ? "passRate" : "failRate";

    // Calculate rates if not provided
    const chartData = sortedData.map((item) => ({
      ...item,
      passRate:
        item.passRate ??
        (item.totalTests ? (item.passCount / item.totalTests) * 100 : 0),
      failRate:
        item.failRate ??
        (item.totalTests ? (item.failCount / item.totalTests) * 100 : 0),
    }));

    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={chartData}
          layout={layout}
          margin={{ top: 20, right: 30, left: layout === "vertical" ? 100 : 20, bottom: 5 }}
        >
          <CartesianGrid {...DARK_GRID_STYLE} horizontal={layout === "vertical"} vertical={layout === "horizontal"} />
          {layout === "vertical" ? (
            <>
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
                dataKey="category"
                tick={{ fill: "rgba(255, 255, 255, 0.8)", fontSize: 11 }}
                axisLine={DARK_AXIS_STYLE.axisLine}
                tickLine={DARK_AXIS_STYLE.tickLine}
                width={95}
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey="category"
                tick={{ fill: "rgba(255, 255, 255, 0.6)", fontSize: 10 }}
                axisLine={DARK_AXIS_STYLE.axisLine}
                tickLine={DARK_AXIS_STYLE.tickLine}
                height={80}
                interval={0}
              />
              <YAxis
                type="number"
                domain={[0, 100]}
                tick={{ fill: "rgba(255, 255, 255, 0.6)", fontSize: 12 }}
                axisLine={DARK_AXIS_STYLE.axisLine}
                tickLine={DARK_AXIS_STYLE.tickLine}
                tickFormatter={(value) => `${value}%`}
              />
            </>
          )}
          <Tooltip
            contentStyle={DARK_TOOLTIP_STYLE.contentStyle}
            itemStyle={DARK_TOOLTIP_STYLE.itemStyle}
            cursor={{ fill: "rgba(255, 255, 255, 0.05)" }}
            formatter={(value) => [`${(typeof value === 'number' ? value : 0).toFixed(1)}%`, variant === "passRate" ? "Pass Rate" : "Fail Rate"]}
          />
          <Bar dataKey={dataKey} name={variant === "passRate" ? "Pass Rate" : "Fail Rate"} radius={[0, 4, 4, 0]} barSize={20}>
            {chartData.map((entry, index) => {
              const rate = variant === "passRate" ? entry.passRate : entry.failRate;
              // Assign color based on variant and severity
              const fillColor = variant === "failRate"
                ? (rate > 15 ? CHART_COLORS.fail1 : rate > 10 ? CHART_COLORS.fail2 : CHART_COLORS.passObs)
                : CHART_COLORS.pass;
              return <Cell key={`cell-${index}`} fill={fillColor} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  // Stacked variant
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={sortedData}
        layout={layout}
        margin={{ top: 20, right: 30, left: layout === "vertical" ? 100 : 20, bottom: 5 }}
      >
        <CartesianGrid {...DARK_GRID_STYLE} horizontal={layout === "vertical"} vertical={layout === "horizontal"} />
        {layout === "vertical" ? (
          <>
            <XAxis
              type="number"
              tick={{ fill: "rgba(255, 255, 255, 0.6)", fontSize: 12 }}
              axisLine={DARK_AXIS_STYLE.axisLine}
              tickLine={DARK_AXIS_STYLE.tickLine}
            />
            <YAxis
              type="category"
              dataKey="category"
              tick={{ fill: "rgba(255, 255, 255, 0.8)", fontSize: 11 }}
              axisLine={DARK_AXIS_STYLE.axisLine}
              tickLine={DARK_AXIS_STYLE.tickLine}
              width={95}
            />
          </>
        ) : (
          <>
            <XAxis
              dataKey="category"
              tick={{ fill: "rgba(255, 255, 255, 0.6)", fontSize: 10 }}
              axisLine={DARK_AXIS_STYLE.axisLine}
              tickLine={DARK_AXIS_STYLE.tickLine}
              height={80}
              interval={0}
            />
            <YAxis
              type="number"
              tick={{ fill: "rgba(255, 255, 255, 0.6)", fontSize: 12 }}
              axisLine={DARK_AXIS_STYLE.axisLine}
              tickLine={DARK_AXIS_STYLE.tickLine}
            />
          </>
        )}
        <Tooltip
          contentStyle={DARK_TOOLTIP_STYLE.contentStyle}
          itemStyle={DARK_TOOLTIP_STYLE.itemStyle}
          cursor={{ fill: "rgba(255, 255, 255, 0.05)" }}
        />
        {showLegend && (
          <Legend
            wrapperStyle={{ color: "rgba(255, 255, 255, 0.8)" }}
            formatter={(value) => (
              <span style={{ color: "rgba(255, 255, 255, 0.8)" }}>{value}</span>
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
