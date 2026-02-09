# CDD Onboarding Demo - Fix Plan Round 2 Final (2026-02-08)

## CRITICAL INSTRUCTION FOR CLAUDE CODE

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   ⛔ DO NOT ATTEMPT TO FIX ALL ISSUES AT ONCE ⛔                             ║
║                                                                              ║
║   FIXES MUST BE DONE SEQUENTIALLY - ONE AT A TIME                           ║
║                                                                              ║
║   1. Fix ONE issue                                                           ║
║   2. Test it thoroughly                                                      ║
║   3. Get user confirmation                                                   ║
║   4. ONLY THEN move to the next issue                                       ║
║                                                                              ║
║   WHY: Parallel fixes cause regressions, conflicts, and debugging chaos.    ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## Issue Summary (9 Issues)

| # | Issue | Type | Severity | Blocks |
|---|-------|------|----------|--------|
| 1 | Auditor Completion Progress chart text invisible in light mode | Visual/CSS | Medium | - |
| 2 | Simulate Progress only works for one auditor (Sarah) | Functional | Medium | - |
| 3 | Published workbooks don't show in AIC current audit runs | Functional | High | - |
| 4 | Progress bar area UI elements stacked/overlapping | Layout | High | Issue 10 (prev) |
| 5 | Auditor "Load Demo Data" should populate AIC-published workbook | Functional | High | - |
| 6 | Select Auditors page - UI elements stacked/overlapping | Layout | CRITICAL | Issue 8 |
| 7 | AI attribute extraction doesn't work on pre-loaded FLU document | Functional | High | - |
| 8 | "Generate Workbooks" button not clickable (z-index) | Interaction | CRITICAL | Full AIC flow |
| 9 | Publish to Auditors shows success but publishes 0 workbooks | Functional | CRITICAL | Auditor flow |

---

## Recommended Fix Order

**Priority: Fix blockers first, then visual issues**

1. **Issue 6 & 8** (combined) - Select Auditors layout + Generate Workbooks button
2. **Issue 9** - Publish actually publishes workbooks
3. **Issue 4** - Progress bar area layout
4. **Issue 5** - Auditor Load Demo Data behavior
5. **Issue 3** - Published workbooks in current audit runs
6. **Issue 7** - AI attribute extraction on FLU document
7. **Issue 1** - Chart light mode visibility
8. **Issue 2** - Simulate Progress for all auditors

---

## Fix 1: Select Auditors Page Layout + Generate Workbooks Button (Issues 6 & 8)

**CRITICAL BLOCKER - FIX THIS FIRST**

**Problem:**
- "Back to Stage 3" button overlaps with auditor cards
- "Continue to Generation" / "Generate Workbooks" button overlaps with content
- Button is behind other elements, cannot be clicked
- Blocks entire AIC workflow

**Location:** `src/app/aic/stage-3/` or auditor selection page

**Root Cause (likely):**
- Navigation buttons positioned absolute/fixed without proper z-index
- Or buttons inside scrollable container being overlapped
- Or flex/grid layout not properly separating content from navigation

**Fix Approach:**
1. Find the page component for auditor selection
2. Restructure to have clear separation:
   ```tsx
   <div className="flex flex-col h-full">
     {/* Header */}
     <header className="flex-shrink-0 p-4">
       <h1>Select Auditors</h1>
     </header>

     {/* Scrollable content area */}
     <main className="flex-1 overflow-y-auto p-4">
       {/* Auditor cards go here */}
     </main>

     {/* Fixed footer with navigation - ABOVE content */}
     <footer className="flex-shrink-0 p-4 border-t bg-white dark:bg-slate-900 relative z-10">
       <div className="flex justify-between">
         <button>← Back to Stage 3</button>
         <button>Generate Workbooks →</button>
       </div>
     </footer>
   </div>
   ```
3. Ensure footer has:
   - `position: relative` or `sticky`
   - `z-index: 10` or higher
   - Solid background color (not transparent)
4. Test button is clickable

**Verification:**
- [ ] Auditor cards do not overlap navigation buttons
- [ ] "Generate Workbooks" button is clickable
- [ ] Can proceed through full AIC flow
- [ ] Works in both light and dark mode

**⚠️ STOP. Get user confirmation before proceeding to Fix 2.**

---

## Fix 2: Publish Actually Publishes Workbooks (Issue 9)

**DO NOT START UNTIL FIX 1 IS CONFIRMED WORKING**

**Problem:**
- Success banner: "Workbooks Published Successfully"
- But says: "0 workbooks are now available to auditors"
- Publish action not actually saving/publishing workbooks

**Location:**
- Publish modal/handler
- `src/lib/stage-data/store.ts`

**Root Cause (likely):**
- Publish handler not getting the generated workbooks
- Or not saving them to store/localStorage
- Or workbook count calculation is wrong

**Fix Approach:**
1. Find the publish handler (likely in Stage 4 or publish modal)
2. Debug what workbooks are being passed to publish
3. Ensure:
   ```typescript
   const publishWorkbooks = () => {
     const workbooks = getGeneratedWorkbooks(); // Should have 4 workbooks

     console.log('Publishing workbooks:', workbooks.length); // Debug

     if (workbooks.length === 0) {
       // Find why no workbooks exist
       return;
     }

     // Mark as published
     workbooks.forEach(wb => {
       wb.status = 'published';
       wb.publishedAt = new Date().toISOString();
     });

     // Save to store
     setPublishedWorkbooks(workbooks);

     // Persist to localStorage
     persistToLocalStorage();

     // Show success with ACTUAL count
     showSuccess(`${workbooks.length} workbooks published`);
   };
   ```
4. Verify workbooks exist before publish step
5. Fix the count in success message to reflect actual published count

**Verification:**
- [ ] Generate workbooks shows correct count
- [ ] Publish shows correct count (not 0)
- [ ] Workbooks actually saved to store
- [ ] Workbooks persist after page reload

**⚠️ STOP. Get user confirmation before proceeding to Fix 3.**

---

## Fix 3: Progress Bar Area Layout (Issue 4)

**DO NOT START UNTIL FIX 2 IS CONFIRMED WORKING**

**Problem:**
- "Completion Progress" label
- "Back to Stage 3" button
- "X of X rows completed" text
- All overlapping in same space

**Location:** Stage 4 Results page

**Fix Approach:**
1. Find the progress section component
2. Restructure with clear rows:
   ```tsx
   <div className="space-y-3">
     {/* Row 1: Label and percentage */}
     <div className="flex justify-between items-center">
       <span className="text-sm text-gray-600 dark:text-gray-400">
         Completion Progress
       </span>
       <span className="text-sm font-medium">100%</span>
     </div>

     {/* Row 2: Progress bar */}
     <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
       <div
         className="h-full bg-amber-500 rounded-full transition-all"
         style={{ width: '100%' }}
       />
     </div>

     {/* Row 3: Row count (separate from navigation) */}
     <div className="text-sm text-gray-500 dark:text-gray-400">
       221 of 221 rows completed
     </div>
   </div>

   {/* Navigation - completely separate section */}
   <div className="flex justify-between items-center mt-6 pt-4 border-t">
     <button>← Back to Stage 3</button>
     <button>Continue to Live Monitoring →</button>
   </div>
   ```
3. Ensure navigation buttons have proper z-index
4. "Continue to Live Monitoring" must be clickable

**Verification:**
- [ ] No text overlap
- [ ] Clear visual separation between sections
- [ ] Both navigation buttons clickable
- [ ] Works in light and dark mode

**⚠️ STOP. Get user confirmation before proceeding to Fix 4.**

---

## Fix 4: Auditor "Load Demo Data" Populates Published Workbook (Issue 5)

**DO NOT START UNTIL FIX 3 IS CONFIRMED WORKING**

**Problem:**
- AIC publishes workbooks
- Auditor receives workbook
- Auditor clicks "Load Demo Data"
- Currently: Creates new workbook OR loads unrelated data
- Expected: Populates the SAME workbook from AIC with testing results

**Location:**
- `src/app/auditor/workbook/page.tsx` (or similar)
- Store functions for auditor data

**Fix Approach:**
1. Find "Load Demo Data" handler in auditor portal
2. Get the currently assigned/published workbook:
   ```typescript
   const loadDemoData = () => {
     // Get the workbook that was published to this auditor
     const publishedWorkbook = getAuditorAssignedWorkbook();

     if (!publishedWorkbook) {
       console.error('No published workbook found');
       return;
     }

     // Generate demo testing results
     const demoResults = generateDemoTestingResults(publishedWorkbook.samples);

     // Update the SAME workbook with results
     const updatedWorkbook = {
       ...publishedWorkbook,
       testingResults: demoResults,
       status: 'in_progress',
       lastModified: new Date().toISOString()
     };

     // Save back to store (same ID, updated data)
     updateAuditorWorkbook(updatedWorkbook);
   };
   ```
3. Key: Preserve workbook ID and metadata, only add testing data

**Verification:**
- [ ] AIC publishes workbook
- [ ] Auditor sees the published workbook
- [ ] Click "Load Demo Data"
- [ ] Same workbook now has testing results
- [ ] Workbook ID unchanged
- [ ] AIC can see auditor's progress

**⚠️ STOP. Get user confirmation before proceeding to Fix 5.**

---

## Fix 5: Published Workbooks Show in AIC Current Audit Runs (Issue 3)

**DO NOT START UNTIL FIX 4 IS CONFIRMED WORKING**

**Problem:**
- After publishing, workbooks should appear in AIC dashboard "current audit runs"
- Currently not showing

**Location:**
- AIC dashboard/home page
- Store selectors

**Fix Approach:**
1. Find where "current audit runs" section is rendered
2. Add selector to get published workbooks:
   ```typescript
   const getPublishedAuditRuns = () => {
     const store = getStageDataStore();
     return store.workbooks.filter(wb => wb.status === 'published');
   };
   ```
3. Render published workbooks in the dashboard
4. Ensure data loads from localStorage on page mount

**Verification:**
- [ ] Publish workbooks
- [ ] Go to AIC dashboard
- [ ] Published workbooks visible in current audit runs
- [ ] Reload page - still visible

**⚠️ STOP. Get user confirmation before proceeding to Fix 6.**

---

## Fix 6: AI Attribute Extraction on Pre-loaded FLU Document (Issue 7)

**DO NOT START UNTIL FIX 5 IS CONFIRMED WORKING**

**Problem:**
- Pre-loaded FLU document exists
- AI extraction should work on it
- Currently falls back to demo mode or fails

**Location:**
- Extraction API route (`src/app/api/ai/extract/`)
- FLU document handling
- `src/lib/ai/client.ts`

**Root Cause Investigation:**
- [ ] Check if API key is being read correctly in extraction route
- [ ] Check if pre-loaded document content is being passed to API
- [ ] Check for errors in API call

**Fix Approach:**
1. Verify extraction route checks for API key:
   ```typescript
   // In API route
   const apiKey = process.env.OPENAI_API_KEY;
   if (!apiKey) {
     return NextResponse.json({ demoMode: true, ... });
   }
   ```
2. Ensure document content is extracted and passed:
   ```typescript
   const extractAttributes = async (documentContent: string) => {
     const client = getOpenAIClient();

     const response = await client.chat.completions.create({
       model: 'gpt-4',
       messages: [
         { role: 'system', content: 'Extract CDD attributes from this document...' },
         { role: 'user', content: documentContent }
       ]
     });

     return parseAttributes(response.choices[0].message.content);
   };
   ```
3. Handle pre-loaded documents specifically if needed

**Verification:**
- [ ] Load pre-loaded FLU document
- [ ] Click "Extract Attributes"
- [ ] No "Demo Mode" banner
- [ ] Results come from AI API
- [ ] Attributes are relevant to document content

**⚠️ STOP. Get user confirmation before proceeding to Fix 7.**

---

## Fix 7: Auditor Completion Progress Chart Light Mode (Issue 1)

**DO NOT START UNTIL FIX 6 IS CONFIRMED WORKING**

**Problem:**
- Chart title invisible in light mode
- Subtitle invisible
- Auditor names invisible
- Axis labels invisible
- Grid lines invisible

**Location:** Live Monitoring page chart component

**Fix Approach:**
1. Find the chart component
2. Add light mode colors to all text:
   ```tsx
   // Title
   <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
     Auditor Completion Progress
   </h3>

   // Subtitle
   <p className="text-sm text-gray-600 dark:text-gray-400">
     Individual completion percentage for each assigned auditor
   </p>

   // Auditor names (Y-axis)
   <span className="text-sm text-gray-700 dark:text-gray-300">
     {auditorName}
   </span>

   // Percentage labels (X-axis)
   <span className="text-xs text-gray-500 dark:text-gray-400">
     {percentage}%
   </span>
   ```
3. Grid lines:
   ```tsx
   <div className="border-l border-gray-300 dark:border-gray-600" />
   ```

**Verification:**
- [ ] Switch to light mode
- [ ] All chart text visible
- [ ] Grid lines visible
- [ ] Switch to dark mode - still works

**⚠️ STOP. Get user confirmation before proceeding to Fix 8.**

---

## Fix 8: Simulate Progress for All Auditors (Issue 2)

**DO NOT START UNTIL FIX 7 IS CONFIRMED WORKING**

**Problem:**
- "Simulate Progress" only sets progress for Sarah
- John, Michael, Emily stay at 0%
- Should simulate for ALL auditors

**Location:** Live Monitoring page - simulate handler

**Fix Approach:**
1. Find simulate progress handler
2. Update to iterate all auditors:
   ```typescript
   const simulateProgress = () => {
     const auditors = getAssignedAuditors(); // ['Sarah', 'John', 'Michael', 'Emily']

     const simulatedProgress = auditors.map((auditor, index) => ({
       name: auditor.name,
       completed: Math.floor(Math.random() * auditor.totalSamples),
       total: auditor.totalSamples,
       percentage: Math.floor(Math.random() * 100)
     }));

     setAuditorProgress(simulatedProgress);
   };
   ```
3. Ensure state update triggers re-render for all bars

**Verification:**
- [ ] Click "Simulate Progress"
- [ ] ALL auditors show progress (not just Sarah)
- [ ] Each auditor has different progress value
- [ ] Progress bars render correctly

**✅ DONE with all fixes.**

---

## Execution Checklist

```
[ ] Fix 1: Select Auditors layout + Generate Workbooks clickable
    [ ] Verified by user

[ ] Fix 2: Publish actually publishes workbooks (not 0)
    [ ] Verified by user

[ ] Fix 3: Progress bar area layout fixed
    [ ] Verified by user

[ ] Fix 4: Auditor Load Demo Data populates published workbook
    [ ] Verified by user

[ ] Fix 5: Published workbooks in AIC current audit runs
    [ ] Verified by user

[ ] Fix 6: AI extraction works on pre-loaded FLU document
    [ ] Verified by user

[ ] Fix 7: Chart light mode visibility
    [ ] Verified by user

[ ] Fix 8: Simulate Progress for all auditors
    [ ] Verified by user
```

---

## REMEMBER

1. **ONE fix at a time** - No exceptions
2. **Test after each fix** - Don't assume it works
3. **Get user confirmation** - Before moving to next fix
4. **If something breaks** - Fix the regression before continuing
5. **Don't batch fixes** - Even if they seem related
