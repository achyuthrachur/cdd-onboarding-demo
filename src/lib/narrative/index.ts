/**
 * Narrative Module
 * Exports all narrative prompt building functions and types
 */

export {
  buildNarrativePrompt,
  buildQuickSummaryPrompt,
  buildNarrativeFromConsolidation,
} from "./prompt-builder";

export type {
  TestResults,
  ExceptionSummary,
  NarrativeContext,
} from "./prompt-builder";
