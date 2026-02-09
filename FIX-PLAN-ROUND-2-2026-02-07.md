# CDD Onboarding Demo - Fix Plan Round 2 (2026-02-07)

## CRITICAL INSTRUCTION FOR CLAUDE CODE

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   DO NOT ATTEMPT TO FIX ALL ISSUES AT ONCE                                  ║
║                                                                              ║
║   FIXES MUST BE DONE SEQUENTIALLY - ONE AT A TIME                           ║
║                                                                              ║
║   1. Fix ONE issue                                                           ║
║   2. Verify it works                                                         ║
║   3. Commit (if requested)                                                   ║
║   4. THEN move to the next issue                                            ║
║                                                                              ║
║   Parallel fixes cause merge conflicts, regressions, and debugging hell.    ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## Issue Summary

| # | Issue | Type | Component |
|---|-------|------|-----------|
| 1 | Auditor Completion Progress chart text invisible in light mode | Visual/CSS | Live Monitoring |
| 2 | Simulate Progress only works for one auditor (Sarah) | Functional | Live Monitoring |
| 3 | Published workbooks don't show in AIC current audit runs | Functional/Persistence | AIC Portal |
| 4 | Progress bar area UI elements stacked/overlapping | Layout | Stage 4 Results |
| 5 | Auditor "Load Demo Data" should populate AIC-published workbook | Functional | Auditor Portal |

---

## Fix Sequence

### Fix 1: Auditor Completion Progress Chart - Light Mode Visibility

**DO THIS FIRST. DO NOT SKIP TO OTHER FIXES.**

**Problem:**
- Chart title "Auditor Completion Progress" invisible in light mode
- Subtitle "Individual completion percentage for each assigned auditor" invisible
- Auditor names (Sarah, John, Michael, Emily) invisible
- Percentage axis labels (0%, 25%, 50%, 75%, 100%) invisible
- Grid lines invisible

**Location:** Live Monitoring page (likely `src/app/aic/live-monitoring/` or similar)

**Fix Approach:**
1. Find the chart component
2. Add dual-theme text colors to ALL text elements:
   - Title: `text-gray-900 dark:text-white`
   - Subtitle: `text-gray-600 dark:text-white/70`
   - Axis labels: `text-gray-700 dark:text-gray-300`
   - Auditor names: `text-gray-800 dark:text-gray-200`
3. Grid lines: `stroke-gray-300 dark:stroke-white/20` (if SVG) or `border-gray-300 dark:border-white/20`

**Verification:**
- [ ] All text visible in light mode
- [ ] All text visible in dark mode
- [ ] No regression

**STOP. Verify this fix works before proceeding to Fix 2.**

---

### Fix 2: Simulate Progress for All Auditors

**DO NOT START UNTIL FIX 1 IS VERIFIED.**

**Problem:**
- "Simulate Progress" only populates progress for Sarah (100%)
- John, Michael, Emily remain at 0%
- Should simulate progress for ALL auditors

**Location:** Live Monitoring page - simulate progress handler

**Fix Approach:**
1. Find the "Simulate Progress" button handler
2. Locate where it sets auditor progress data
3. Modify to iterate over ALL auditors and set progress for each
4. Example structure:
   ```typescript
   const simulateProgress = () => {
     const auditors = ['Sarah', 'John', 'Michael', 'Emily'];
     const updatedProgress = auditors.map(auditor => ({
       name: auditor,
       progress: Math.floor(Math.random() * 100) // or fixed demo values
     }));
     setAuditorProgress(updatedProgress);
   };
   ```

**Verification:**
- [ ] Click "Simulate Progress"
- [ ] ALL auditors show progress bars (not just Sarah)
- [ ] Progress values are reasonable

**STOP. Verify this fix works before proceeding to Fix 3.**

---

### Fix 3: Published Workbooks Show in AIC Current Audit Runs

**DO NOT START UNTIL FIX 2 IS VERIFIED.**

**Problem:**
- After AIC publishes workbooks, they don't appear in "current audit runs" section
- Published state not persisting or not being read for display

**Location:**
- AIC dashboard/home page
- Stage data store (`src/lib/stage-data/store.ts`)

**Fix Approach:**
1. Identify where "current audit runs" is rendered in AIC portal
2. Check if it reads from the store's published workbooks
3. Ensure publish action:
   - Saves to store
   - Persists to localStorage
4. Ensure AIC dashboard:
   - Loads published workbooks on mount
   - Displays them in current audit runs section
5. May need to add a `getPublishedWorkbooks()` selector to the store

**Verification:**
- [ ] Publish workbooks from AIC Stage 3
- [ ] Navigate to AIC dashboard/home
- [ ] Published workbooks appear in current audit runs
- [ ] Reload page - still visible

**STOP. Verify this fix works before proceeding to Fix 4.**

---

### Fix 4: Progress Bar Area Layout Fix

**DO NOT START UNTIL FIX 3 IS VERIFIED.**

**Problem:**
- "Completion Progress" label
- "Back to Stage 3" button
- "X of X rows completed" text
- All stacking/overlapping in the same space

**Location:** Stage 4 Results page

**Fix Approach:**
1. Find the progress bar section in the results page
2. Restructure layout with proper flex containers:
   ```tsx
   <div className="flex flex-col gap-2">
     {/* Row 1: Progress label and percentage */}
     <div className="flex justify-between items-center">
       <span>Completion Progress</span>
       <span>100%</span>
     </div>

     {/* Row 2: Progress bar */}
     <div className="h-2 bg-gray-200 rounded">
       <div className="h-full bg-amber-500 rounded" style={{width: '100%'}} />
     </div>

     {/* Row 3: Navigation and row count */}
     <div className="flex justify-between items-center">
       <button>← Back to Stage 3</button>
       <span>221 of 221 rows completed</span>
     </div>
   </div>
   ```
3. Ensure each element has dedicated space
4. Add `z-index` to navigation buttons if needed

**Verification:**
- [ ] No overlapping text
- [ ] Layout works in both themes
- [ ] "Continue to Live Monitoring" button is clickable
- [ ] "Back to Stage 3" is clickable

**STOP. Verify this fix works before proceeding to Fix 5.**

---

### Fix 5: Auditor "Load Demo Data" Populates AIC-Published Workbook

**DO NOT START UNTIL FIX 4 IS VERIFIED.**

**Problem:**
- AIC publishes workbooks to auditors
- Auditor sees published workbook
- Auditor clicks "Load Demo Data"
- Currently: Creates new workbook or loads different data
- Expected: Populates the SAME workbook that AIC published

**Location:**
- Auditor workbook page
- Stage data store

**Fix Approach:**
1. Find "Load Demo Data" handler in auditor workbook page
2. Get the currently loaded workbook (the one published by AIC)
3. Instead of replacing the workbook, UPDATE it:
   ```typescript
   const loadDemoData = () => {
     const currentWorkbook = getCurrentWorkbook(); // AIC-published one

     if (!currentWorkbook) {
       // No published workbook - maybe show error or create new
       return;
     }

     // Populate the existing workbook with demo testing data
     const populatedWorkbook = {
       ...currentWorkbook, // Keep ID, metadata, AIC assignments
       testingResults: generateDemoTestingResults(),
       status: 'in_progress'
     };

     updateWorkbook(populatedWorkbook);
   };
   ```
4. Preserve workbook identity (ID, assignment info, auditor assignment)
5. Only add demo TESTING data, not replace the whole workbook

**Verification:**
- [ ] AIC publishes workbook to auditor
- [ ] Auditor opens workbook
- [ ] Auditor clicks "Load Demo Data"
- [ ] Same workbook now has testing data populated
- [ ] Workbook ID and metadata unchanged
- [ ] AIC can see the progress in their view

**DONE.**

---

## Execution Checklist

```
[ ] Fix 1 implemented
[ ] Fix 1 verified in light mode
[ ] Fix 1 verified in dark mode
    ↓
[ ] Fix 2 implemented
[ ] Fix 2 verified - all auditors have progress
    ↓
[ ] Fix 3 implemented
[ ] Fix 3 verified - published workbooks in current runs
[ ] Fix 3 verified - persists after reload
    ↓
[ ] Fix 4 implemented
[ ] Fix 4 verified - no overlapping elements
[ ] Fix 4 verified - buttons clickable
    ↓
[ ] Fix 5 implemented
[ ] Fix 5 verified - demo data populates published workbook
[ ] Fix 5 verified - end-to-end flow AIC→Auditor works
```

---

## Remember

1. **ONE fix at a time**
2. **Verify before moving on**
3. **If a fix breaks something else, stop and fix the regression first**
4. **Do not batch fixes together**
5. **Ask user to verify if unsure**
