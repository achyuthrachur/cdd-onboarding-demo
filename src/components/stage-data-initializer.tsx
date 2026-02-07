"use client";

import { useEffect } from "react";
import { loadStageInputsFromStorage } from "@/lib/stage-data";

/**
 * StageDataInitializer — Client component that loads stage INPUT data
 * (population, procedures, configs) from localStorage on app mount.
 *
 * Does NOT load outputs (extraction results, sampling results, etc.)
 * Those are only loaded on explicit "Load Demo Data" button clicks.
 */
export function StageDataInitializer() {
  useEffect(() => {
    loadStageInputsFromStorage();
  }, []);

  return null;
}
