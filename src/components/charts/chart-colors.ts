/**
 * Crowe Brand Colors for Charts
 * Based on Crowe Digital Brand Guidelines
 * Supports both light and dark themes
 */

export const CHART_COLORS = {
  // Result Types
  pass: '#16D9BC',           // crowe-teal-bright
  passObs: '#F5A800',        // crowe-amber
  fail1: '#FF526F',          // crowe-coral-bright
  fail2: '#E5376B',          // crowe-coral
  questions: '#32A8FD',      // crowe-blue-light
  na: '#828282',             // gray

  // Status Colors
  completed: '#16D9BC',      // crowe-teal-bright
  inProgress: '#54C0E8',     // crowe-cyan
  draft: '#828282',          // gray

  // Risk Tiers
  critical: '#FF526F',       // crowe-coral-bright
  high: '#D7761D',           // crowe-amber-dark
  medium: '#F5A800',         // crowe-amber
  low: '#16D9BC',            // crowe-teal-bright

  // Category/Generic Colors (for bar charts, etc.)
  primary: '#002E62',        // crowe-indigo
  secondary: '#003F9F',      // crowe-indigo-bright
  accent: '#F5A800',         // crowe-amber

  // Neutral
  neutral100: 'rgba(255, 255, 255, 0.1)',
  neutral200: 'rgba(255, 255, 255, 0.2)',
  neutral300: 'rgba(255, 255, 255, 0.3)',
  neutral500: 'rgba(255, 255, 255, 0.5)',
  neutral700: 'rgba(255, 255, 255, 0.7)',
} as const;

// Result distribution data colors
export const RESULT_COLORS = [
  { name: 'Pass', key: 'pass', color: CHART_COLORS.pass },
  { name: 'Pass w/Obs', key: 'passObs', color: CHART_COLORS.passObs },
  { name: 'Fail 1', key: 'fail1', color: CHART_COLORS.fail1 },
  { name: 'Fail 2', key: 'fail2', color: CHART_COLORS.fail2 },
  { name: 'Questions', key: 'questions', color: CHART_COLORS.questions },
  { name: 'N/A', key: 'na', color: CHART_COLORS.na },
] as const;

// ─── Dark theme styles ───

export const DARK_TOOLTIP_STYLE = {
  contentStyle: {
    background: 'rgba(1, 30, 65, 0.95)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '8px',
    color: 'white',
    padding: '12px 16px',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3)',
  },
  itemStyle: {
    color: 'white',
  },
  labelStyle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: 600,
  },
};

export const DARK_AXIS_STYLE = {
  axisLine: {
    stroke: 'rgba(255, 255, 255, 0.2)',
  },
  tickLine: {
    stroke: 'rgba(255, 255, 255, 0.2)',
  },
  tick: {
    fill: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
  },
};

export const DARK_GRID_STYLE = {
  strokeDasharray: '3 3',
  stroke: 'rgba(255, 255, 255, 0.1)',
};

// ─── Light theme styles ───

export const LIGHT_TOOLTIP_STYLE = {
  contentStyle: {
    background: 'rgba(255, 255, 255, 0.97)',
    border: '1px solid #E0E0E0',
    borderRadius: '8px',
    color: '#333333',
    padding: '12px 16px',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.1)',
  },
  itemStyle: {
    color: '#333333',
  },
  labelStyle: {
    color: '#4F4F4F',
    fontWeight: 600,
  },
};

export const LIGHT_AXIS_STYLE = {
  axisLine: {
    stroke: '#BDBDBD',
  },
  tickLine: {
    stroke: '#BDBDBD',
  },
  tick: {
    fill: '#4F4F4F',
    fontSize: 12,
  },
};

export const LIGHT_GRID_STYLE = {
  strokeDasharray: '3 3',
  stroke: '#E0E0E0',
};

// ─── Theme-aware style set ───

export interface ChartThemeStyles {
  isDark: boolean;
  tooltipStyle: typeof DARK_TOOLTIP_STYLE;
  axisStyle: typeof DARK_AXIS_STYLE;
  gridStyle: typeof DARK_GRID_STYLE;
  tickFill: string;
  tickFillMuted: string;
  legendColor: string;
  cursorFill: string;
  emptyTextClass: string;
  pieLabelFill: string;
}

function getIsDark(): boolean {
  if (typeof document === 'undefined') return true;
  return document.documentElement.classList.contains('dark');
}

/** Returns a complete theme-aware chart style set. Call inside component body (re-renders on mount). */
export function getChartTheme(): ChartThemeStyles {
  const isDark = getIsDark();
  return isDark
    ? {
        isDark: true,
        tooltipStyle: DARK_TOOLTIP_STYLE,
        axisStyle: DARK_AXIS_STYLE,
        gridStyle: DARK_GRID_STYLE,
        tickFill: 'rgba(255, 255, 255, 0.6)',
        tickFillMuted: 'rgba(255, 255, 255, 0.8)',
        legendColor: 'rgba(255, 255, 255, 0.8)',
        cursorFill: 'rgba(255, 255, 255, 0.05)',
        emptyTextClass: 'text-white/80',
        pieLabelFill: 'white',
      }
    : {
        isDark: false,
        tooltipStyle: LIGHT_TOOLTIP_STYLE,
        axisStyle: LIGHT_AXIS_STYLE,
        gridStyle: LIGHT_GRID_STYLE,
        tickFill: '#4F4F4F',
        tickFillMuted: '#333333',
        legendColor: '#333333',
        cursorFill: 'rgba(0, 0, 0, 0.04)',
        emptyTextClass: 'text-gray-500 dark:text-white/80',
        pieLabelFill: '#333333',
      };
}
