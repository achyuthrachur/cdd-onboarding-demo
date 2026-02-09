# CDD Onboarding Demo - Multi-Stage Remediation Plan

> **Created:** 2026-02-07
> **Status:** Ready for Implementation
> **Priority:** CRITICAL
> **Estimated Effort:** 4-6 hours across multiple agents

---

## Executive Summary

This document outlines a systematic remediation plan for the CDD Onboarding Demo application. Issues are categorized into **3 major areas**:

1. **UI/Visibility Issues** - Light mode text contrast failures across multiple components
2. **Data Persistence Issues** - Cross-portal data loss and audit run disappearance
3. **Functional Issues** - Broken navigation, API failures, and incorrect portal behavior

Each stage is designed to be completed by a separate agent, in sequence, with clear acceptance criteria.

---

## Issue Inventory (From Screenshots)

### UI/Visibility Issues (Light Mode Contrast Failures)

| # | Location | Issue | Severity |
|---|----------|-------|----------|
| V1 | Demo Mode Banner (Stage Cards) | Stage 1-4 card text nearly invisible | HIGH |
| V2 | Gap Assessment Drop Zone | Hint text low contrast | MEDIUM |
| V3 | AI-Generated Sampling Rationale | Header, description nearly invisible | HIGH |
| V4 | Select Auditors Panel | Names, emails, sample counts invisible | HIGH |
| V5 | Testing Results Cards | Pass/Fail/Questions card labels invisible | HIGH |
| V6 | Auditor Selector Component | Distribution info, email text uses `text-white/80` | HIGH |
| V7 | Navigation Buttons | "Back to Stage X" buttons washed out | MEDIUM |
| V8 | Extraction Results Demo Banner | Orange text on light bg may have issues | LOW |

### Data Persistence Issues

| # | Location | Issue | Severity |
|---|----------|-------|----------|
| D1 | Cross-Portal Navigation | Audit runs disappear when switching AIC <-> Auditor | CRITICAL |
| D2 | Workbook Publication State | `workbooksPublished` flag not persisting correctly | HIGH |
| D3 | Auditor Progress | Progress data lost on portal switch | HIGH |

### Functional Issues

| # | Location | Issue | Severity |
|---|----------|-------|----------|
| F1 | Stage 4 -> Monitor Navigation | "Continue to Live Monitoring" button disabled even after publish | CRITICAL |
| F2 | Attribute Extraction API | `/api/ai/attribute-extraction` not working (other AI APIs work) | HIGH |
| F3 | Auditor Portal Workbooks | "Load Demo Data" creates new workbooks instead of using published | HIGH |
| F4 | Auditor Workbook Page | Should auto-load assigned workbook, not require separate loading | MEDIUM |

---

## Stage 1: Critical UI Visibility Fixes

**Agent Type:** Frontend Subagent
**Priority:** HIGH
**Estimated Time:** 1.5 hours

### 1.1 Auditor Selector Component
**File:** `src/components/stage-4/auditor-selector.tsx`

**Issues:**
- Line 125-127: `text-white/80` used for distribution info (no light mode variant)
- Line 166-168: `text-white/80` used for auditor email
- Line 262: `text-white/80` used for "Selected Auditors" label

**Fix Pattern:**
```tsx
// BEFORE
<span className="text-white/80">

// AFTER
<span className="text-gray-600 dark:text-white/80">
```

### 1.2 Demo Mode Banner Component
**File:** `src/app/aic/audit-runs/[id]/page.tsx` (or wherever Demo Mode banner lives)

**Issues:**
- Stage cards (1-4) text invisible in light mode
- Description text uses dark-only styling

**Fix Pattern:**
All text inside Demo Mode panel needs `text-gray-700 dark:text-white` or similar.

### 1.3 AI-Generated Sampling Rationale Section
**File:** `src/app/aic/audit-runs/[id]/stage-2/page.tsx`

**Issues:**
- Section header nearly invisible
- Description text nearly invisible
- Warning banner text may have issues

**Fix:** Add light mode text colors to all elements.

### 1.4 Testing Results Cards
**File:** `src/app/aic/audit-runs/[id]/stage-4/page.tsx` (View & Publish tab)

**Issues:**
- Pass/Fail/Questions card labels invisible in light mode
- Card backgrounds may need adjustment

### 1.5 Navigation Buttons
**Files:** All stage pages

**Issue:** "Back to Stage X" outline buttons have poor contrast in light mode.

**Fix:** Ensure outline buttons have proper light mode text color:
```tsx
// Pattern to apply
className="border-gray-200 dark:border-white/20 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10"
```

### Acceptance Criteria - Stage 1
- [ ] All text visible in both light AND dark mode
- [ ] Contrast ratio meets WCAG AA (4.5:1 minimum)
- [ ] No `text-white` or `text-white/XX` without corresponding `dark:` prefix
- [ ] Build passes without errors
- [ ] Visual verification on deployed site

---

## Stage 2: Data Persistence Architecture Fix

**Agent Type:** Backend/Architecture Subagent
**Priority:** CRITICAL
**Estimated Time:** 1.5 hours

### 2.1 Root Cause Analysis

The current `store.ts` uses a simple key pattern:
```ts
localStorage.setItem(`stageData_${key}`, JSON.stringify(value));
```

The `DATA_OWNERSHIP` mapping exists but `getStorageKey()` function uses it incorrectly. It should use portal-prefixed keys for portal-owned data, but the actual `setStageData()` and `getStageData()` functions don't use `getStorageKey()` at all.

### 2.2 Required Changes to `src/lib/stage-data/store.ts`

**Issue A:** `setStageData()` ignores portal ownership
```ts
// Current (broken)
localStorage.setItem(`stageData_${key}`, JSON.stringify(value));

// Should be using portal-aware keys for portal-owned data
```

**Fix A:** Modify `setStageData()` to NOT require portal param (breaks API), but ensure shared data uses consistent keys. The real fix is ensuring data persists across portal switches.

**Issue B:** `loadStageDataFromStorage()` and `loadPortalData()` duplication

The app initializer calls `loadStageInputsFromStorage()` but this only loads INPUT_KEYS, not OUTPUT_KEYS like `pivotedWorkbooks` and `workbooksPublished`.

**Fix B:** Create a new function `loadAllSharedData()` that loads ALL shared keys:
```ts
export function loadAllSharedData(): void {
  const sharedKeys = Object.entries(DATA_OWNERSHIP)
    .filter(([_, ownership]) => ownership === 'shared')
    .map(([key]) => key as keyof StageDataStore);

  // Load each shared key from localStorage
}
```

### 2.3 Required Changes to App Initialization

**File:** `src/components/stage-data-initializer.tsx`

Currently calls `loadStageInputsFromStorage()`. Should also call a new function that loads shared data (published workbooks, auditor progress).

### 2.4 Required Changes to Portal Entry Points

**File:** `src/app/aic/layout.tsx`
**File:** `src/app/auditor/layout.tsx`

Each portal layout should call `loadPortalData(portalType)` on mount to ensure all accessible data is loaded.

### Acceptance Criteria - Stage 2
- [ ] Audit runs persist when switching from AIC to Auditor and back
- [ ] `workbooksPublished` flag persists across portal switches
- [ ] `auditorProgress` persists across portal switches
- [ ] `pivotedWorkbooks` accessible in Auditor portal after AIC publishes
- [ ] Console shows proper data loading logs

---

## Stage 3: Navigation and Button Functionality

**Agent Type:** Frontend Subagent
**Priority:** CRITICAL
**Estimated Time:** 45 minutes

### 3.1 "Continue to Live Monitoring" Button Fix

**File:** `src/app/aic/audit-runs/[id]/stage-4/page.tsx`

**Issue:** Lines 948-960 show the button logic:
```tsx
{currentStep === "view" && (
  canProceed ? (
    <Button asChild>
      <Link href={`/aic/audit-runs/${id}/monitor`}>
        Continue to Live Monitoring
```

`canProceed` is defined as `const canProceed = isPublished;` (line 366).

The `isPublished` state is set from:
```tsx
const published = getStageData("workbooksPublished");
if (published) {
  setIsPublished(true);
}
```

**Root Cause:** After publishing, the user may need to wait for state update or the data may not be loading correctly on page refresh.

**Fix Options:**
1. Add a `useEffect` that re-checks publication status after `handlePublishWorkbooks` completes
2. Ensure `isPublished` is set immediately after successful publish AND persists on reload
3. Add fallback: enable button if `pivotedWorkbooks.length > 0`

**Recommended Fix:**
```tsx
// After handlePublishWorkbooks succeeds:
setStageData("workbooksPublished", {...});
setIsPublished(true);  // Already done
// Add: Force re-render or navigation
```

Also verify the `useEffect` on mount properly loads the published state.

### 3.2 Verify Monitor Page Access

**File:** `src/app/aic/audit-runs/[id]/monitor/page.tsx`

Ensure the monitor page doesn't have additional gates that block access.

### Acceptance Criteria - Stage 3
- [ ] "Continue to Live Monitoring" button enables after clicking "Publish Workbooks"
- [ ] Button remains enabled on page refresh after publishing
- [ ] Navigation to `/monitor` works correctly
- [ ] Monitor page loads and shows published workbooks

---

## Stage 4: Attribute Extraction API Fix

**Agent Type:** Backend Subagent
**Priority:** HIGH
**Estimated Time:** 45 minutes

### 4.1 Investigation Required

**File:** `src/app/api/ai/attribute-extraction/route.ts`

The API code looks correct. Need to investigate:

1. **Frontend calling code** - Where does Stage 3 call this API?
2. **Request payload** - Is `proceduresContent` being sent?
3. **Error handling** - Are errors being swallowed silently?

**File to check:** `src/components/stage-3/flu-procedure-chat.tsx`

### 4.2 Comparison with Working APIs

User says Gap Assessment and Sampling Rationale APIs work. Compare:
- `/api/ai/gap-assessment/route.ts`
- `/api/ai/sampling-rationale/route.ts`
- `/api/ai/attribute-extraction/route.ts`

Check for differences in:
- Request body parsing
- AI client initialization
- Error handling
- Mock data fallback

### 4.3 Potential Issues

1. **Model name:** Uses `gpt-4-turbo-preview` which may be deprecated
2. **Missing proceduresContent:** The FLU document content may not be getting passed
3. **Silent fallback to demo:** May be falling back to demo mode without user awareness

**Fix:** Add better logging and ensure the component passes document content correctly.

### Acceptance Criteria - Stage 4
- [ ] API responds with real AI data when OPENAI_API_KEY is configured
- [ ] Console logs show request/response flow
- [ ] Clear error messages if AI fails
- [ ] Demo mode indicator shows when using mock data

---

## Stage 5: Auditor Portal Workbook Behavior

**Agent Type:** Frontend Subagent
**Priority:** HIGH
**Estimated Time:** 45 minutes

### 5.1 Remove "Load Demo Data" Ability to Create New Workbooks

**File:** `src/app/auditor/workbooks/page.tsx`

**Issue:** Lines 88-132 show `handleLoadDemoData()` which:
- Calls `loadFallbackDataForStage(2, 3, 4)`
- Sets `workbooksPublished`
- Creates new auditor progress

This should NOT be allowed in Auditor portal. The Auditor should only see workbooks that were ACTUALLY published by AIC.

**Fix Options:**
1. **Remove** the "Load Demo Data" button entirely from Auditor portal
2. **Change** it to only load demo data IF no published workbooks exist
3. **Restrict** it to only simulate progress on EXISTING published workbooks

**Recommended Fix:** Option 2 or 3

```tsx
const handleLoadDemoData = () => {
  // Check if workbooks are already published
  const existingPublished = getStageData("workbooksPublished");
  if (existingPublished) {
    // Only simulate progress, don't create new workbooks
    toast.info("Using existing published workbooks");
    loadWorkbooks();
    return;
  }

  // If no published workbooks, show message directing to AIC
  toast.error("No workbooks published. Ask AIC to publish workbooks first.");
};
```

### 5.2 Auto-Load Assigned Workbook

**File:** `src/app/auditor/workbooks/[id]/page.tsx`

**Issue:** User has to click "Load Demo Data" to see their workbook.

**Expected Behavior:** If workbooks are published and auditor has an assigned workbook, it should load automatically.

**Fix:** The `useEffect` on lines 334-368 already does this, but may fail if:
1. `pivotedWorkbooks` isn't loaded from localStorage
2. `currentAuditorId` doesn't match any workbook

**Debug Steps:**
1. Add console.log to trace data loading
2. Verify `getCurrentAuditorId()` returns correct value
3. Verify workbook auditorId matches

### Acceptance Criteria - Stage 5
- [ ] Auditor sees published workbooks without clicking "Load Demo Data"
- [ ] "Load Demo Data" button either removed or only simulates progress
- [ ] Auditor cannot create new/different workbooks
- [ ] Workbook testing grid populates with actual published data

---

## Stage 6: Integration Testing & Verification

**Agent Type:** QA Subagent
**Priority:** HIGH
**Estimated Time:** 30 minutes

### 6.1 End-to-End Test Flow

1. **Start fresh** - Clear localStorage
2. **AIC Portal:**
   - Create new audit run
   - Complete Stage 1 (Gap Assessment with demo data)
   - Complete Stage 2 (Sampling with demo data)
   - Complete Stage 3 (Attribute Extraction with demo data)
   - Complete Stage 4 (Generate and Publish workbooks)
   - Click "Continue to Live Monitoring"

3. **Switch to Auditor Portal:**
   - Verify published workbook appears automatically
   - Click into workbook
   - Verify testing grid has data
   - Complete some tests
   - Save progress

4. **Switch back to AIC Portal:**
   - Verify audit run still exists
   - Verify monitor page shows auditor progress

5. **Light/Dark Mode:**
   - Toggle theme in each portal
   - Verify all text visible in both modes

### 6.2 Checklist

- [ ] All stages complete without errors
- [ ] Data persists across portal switches (3+ switches)
- [ ] Light mode visibility passes visual inspection
- [ ] Dark mode visibility passes visual inspection
- [ ] No console errors
- [ ] No TypeScript errors in build

---

## Implementation Order

```
Stage 1 (UI Visibility)     ──┐
                              ├──► Can be parallel
Stage 2 (Data Persistence)  ──┘

Stage 3 (Navigation)        ──► Depends on Stage 2

Stage 4 (API Fix)           ──► Independent

Stage 5 (Auditor Portal)    ──► Depends on Stage 2

Stage 6 (Testing)           ──► Depends on all above
```

**Recommended Parallel Execution:**
- Agent A: Stage 1 (UI) + Stage 4 (API)
- Agent B: Stage 2 (Persistence)
- Then: Stage 3 + Stage 5 (both need Stage 2)
- Finally: Stage 6 (Testing)

---

## Files to Modify (Summary)

| File | Stages |
|------|--------|
| `src/components/stage-4/auditor-selector.tsx` | 1 |
| `src/app/aic/audit-runs/[id]/page.tsx` | 1 |
| `src/app/aic/audit-runs/[id]/stage-2/page.tsx` | 1 |
| `src/app/aic/audit-runs/[id]/stage-4/page.tsx` | 1, 3 |
| `src/lib/stage-data/store.ts` | 2 |
| `src/components/stage-data-initializer.tsx` | 2 |
| `src/app/aic/layout.tsx` | 2 |
| `src/app/auditor/layout.tsx` | 2 |
| `src/app/aic/audit-runs/[id]/monitor/page.tsx` | 3 |
| `src/app/api/ai/attribute-extraction/route.ts` | 4 |
| `src/components/stage-3/flu-procedure-chat.tsx` | 4 |
| `src/app/auditor/workbooks/page.tsx` | 5 |
| `src/app/auditor/workbooks/[id]/page.tsx` | 5 |

---

## Success Metrics

1. **UI Visibility:** 0 instances of white-only text without dark mode variant
2. **Data Persistence:** 100% data retention across 5 consecutive portal switches
3. **Navigation:** All "Continue to X" buttons function correctly
4. **API:** Attribute extraction returns data (real or demo) without error
5. **Auditor Portal:** Workbook loads automatically without manual intervention

---

*Document created by Claude Code analysis on 2026-02-07*
*Ready for agent implementation*
