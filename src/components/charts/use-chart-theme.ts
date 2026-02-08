"use client";

import { useState, useEffect, useRef } from "react";
import { getChartTheme, type ChartThemeStyles } from "./chart-colors";

/**
 * React hook that returns theme-aware chart styles.
 * Listens for class changes on <html> to detect dark/light mode toggles.
 * Caches by isDark boolean to avoid creating new objects on every call.
 */

// Module-level cache: one object per theme, reused across all hook instances
let cachedDark: ChartThemeStyles | null = null;
let cachedLight: ChartThemeStyles | null = null;

function getCachedChartTheme(): ChartThemeStyles {
  const fresh = getChartTheme();
  if (fresh.isDark) {
    if (!cachedDark) cachedDark = fresh;
    return cachedDark;
  } else {
    if (!cachedLight) cachedLight = fresh;
    return cachedLight;
  }
}

export function useChartTheme(): ChartThemeStyles {
  const [theme, setTheme] = useState<ChartThemeStyles>(() => getCachedChartTheme());
  const prevIsDarkRef = useRef(theme.isDark);

  useEffect(() => {
    // Re-compute on mount (client may differ from SSR default)
    const currentTheme = getCachedChartTheme();
    if (currentTheme.isDark !== prevIsDarkRef.current) {
      prevIsDarkRef.current = currentTheme.isDark;
      setTheme(currentTheme);
    }

    // Watch for class changes on <html> (next-themes toggles "dark" class)
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains("dark");
      if (isDark !== prevIsDarkRef.current) {
        prevIsDarkRef.current = isDark;
        // Invalidate cache for the new theme
        if (isDark) cachedDark = null;
        else cachedLight = null;
        setTheme(getCachedChartTheme());
      }
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return theme;
}
