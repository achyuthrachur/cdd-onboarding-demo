"use client";

import { useState, useEffect } from "react";
import { getChartTheme, type ChartThemeStyles } from "./chart-colors";

/**
 * React hook that returns theme-aware chart styles.
 * Listens for class changes on <html> to detect dark/light mode toggles.
 */
export function useChartTheme(): ChartThemeStyles {
  // Always start with dark theme (matches SSR where document is undefined)
  const [theme, setTheme] = useState<ChartThemeStyles>(() => getChartTheme());

  useEffect(() => {
    // Re-compute on mount (client may differ from SSR default)
    const currentTheme = getChartTheme();
    setTheme(currentTheme);

    // Watch for class changes on <html> (next-themes toggles "dark" class)
    const observer = new MutationObserver(() => {
      setTheme(getChartTheme());
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return theme;
}
