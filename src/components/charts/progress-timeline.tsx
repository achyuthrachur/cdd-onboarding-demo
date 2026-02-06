"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";
import {
  CHART_COLORS,
  DARK_TOOLTIP_STYLE,
  DARK_AXIS_STYLE,
  DARK_GRID_STYLE,
} from "./chart-colors";

interface TimelineDataPoint {
  time: string;
  timestamp?: number;
  completion: number;
  submitted?: number;
}

interface ProgressTimelineProps {
  data: TimelineDataPoint[];
  height?: number;
  showArea?: boolean;
  showSubmitted?: boolean;
}

/**
 * Progress Timeline Chart
 * Shows completion rate over time with optional area fill
 */
export function ProgressTimeline({
  data,
  height = 300,
  showArea = true,
  showSubmitted = false,
}: ProgressTimelineProps) {
  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-white/70"
        style={{ height }}
      >
        No timeline data available
      </div>
    );
  }

  const ChartComponent = showArea ? AreaChart : LineChart;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ChartComponent
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <defs>
          <linearGradient id="completionGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS.pass} stopOpacity={0.3} />
            <stop offset="95%" stopColor={CHART_COLORS.pass} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="submittedGradient" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor={CHART_COLORS.completed}
              stopOpacity={0.3}
            />
            <stop
              offset="95%"
              stopColor={CHART_COLORS.completed}
              stopOpacity={0}
            />
          </linearGradient>
        </defs>
        <CartesianGrid {...DARK_GRID_STYLE} />
        <XAxis
          dataKey="time"
          tick={{ fill: "rgba(255, 255, 255, 0.6)", fontSize: 11 }}
          axisLine={DARK_AXIS_STYLE.axisLine}
          tickLine={DARK_AXIS_STYLE.tickLine}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fill: "rgba(255, 255, 255, 0.6)", fontSize: 12 }}
          axisLine={DARK_AXIS_STYLE.axisLine}
          tickLine={DARK_AXIS_STYLE.tickLine}
          tickFormatter={(value) => `${value}%`}
        />
        <Tooltip
          contentStyle={DARK_TOOLTIP_STYLE.contentStyle}
          itemStyle={DARK_TOOLTIP_STYLE.itemStyle}
          labelStyle={DARK_TOOLTIP_STYLE.labelStyle}
          formatter={(value, name) => {
            const numValue = typeof value === 'number' ? value : 0;
            return [
              `${numValue.toFixed(1)}%`,
              name === "completion" ? "Avg Completion" : "Submitted",
            ];
          }}
        />
        {showArea ? (
          <>
            <Area
              type="monotone"
              dataKey="completion"
              name="completion"
              stroke={CHART_COLORS.pass}
              strokeWidth={2}
              fill="url(#completionGradient)"
              dot={{ fill: CHART_COLORS.pass, strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5, strokeWidth: 0 }}
            />
            {showSubmitted && (
              <Area
                type="monotone"
                dataKey="submitted"
                name="submitted"
                stroke={CHART_COLORS.completed}
                strokeWidth={2}
                fill="url(#submittedGradient)"
                dot={{ fill: CHART_COLORS.completed, strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
            )}
          </>
        ) : (
          <>
            <Line
              type="monotone"
              dataKey="completion"
              name="completion"
              stroke={CHART_COLORS.pass}
              strokeWidth={2}
              dot={{ fill: CHART_COLORS.pass, strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5, strokeWidth: 0 }}
            />
            {showSubmitted && (
              <Line
                type="monotone"
                dataKey="submitted"
                name="submitted"
                stroke={CHART_COLORS.completed}
                strokeWidth={2}
                dot={{ fill: CHART_COLORS.completed, strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
            )}
          </>
        )}
      </ChartComponent>
    </ResponsiveContainer>
  );
}

/**
 * Generate mock timeline data for demo purposes
 */
export function generateMockTimelineData(
  totalPoints: number = 10,
  currentCompletion: number = 60
): TimelineDataPoint[] {
  const data: TimelineDataPoint[] = [];
  const now = Date.now();
  const interval = 5 * 60 * 1000; // 5 minutes

  for (let i = 0; i < totalPoints; i++) {
    const progress = (i / (totalPoints - 1)) * currentCompletion;
    const submittedRatio = Math.max(0, (progress - 50) / 50);

    data.push({
      time: new Date(now - (totalPoints - 1 - i) * interval).toLocaleTimeString(
        [],
        { hour: "2-digit", minute: "2-digit" }
      ),
      timestamp: now - (totalPoints - 1 - i) * interval,
      completion: Math.min(100, progress + Math.random() * 5),
      submitted: Math.min(100, submittedRatio * 100),
    });
  }

  return data;
}
