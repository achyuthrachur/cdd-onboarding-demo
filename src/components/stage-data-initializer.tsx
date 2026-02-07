"use client";

import { useEffect } from "react";
import { loadStageInputsFromStorage, loadSharedDataFromStorage } from "@/lib/stage-data";

/**
 * StageDataInitializer — Client component that loads stage INPUT data
 * (population, procedures, configs) and SHARED data (publication state,
 * auditor progress, pivoted workbooks) from localStorage on app mount.
 *
 * Does NOT load stage outputs (extraction results, sampling results, etc.)
 * Those are only loaded on explicit "Load Demo Data" button clicks.
 */
export function StageDataInitializer() {
  useEffect(() => {
    loadStageInputsFromStorage();
    loadSharedDataFromStorage();
  }, []);

  return null;
}
