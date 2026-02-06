/**
 * Crowe Brand Colors for Charts
 * Based on Crowe Digital Brand Guidelines
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

// Dark theme tooltip style
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

// Common axis styling for dark theme
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

// Grid styling for dark theme
export const DARK_GRID_STYLE = {
  strokeDasharray: '3 3',
  stroke: 'rgba(255, 255, 255, 0.1)',
};
