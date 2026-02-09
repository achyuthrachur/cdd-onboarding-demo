# CDD Onboarding Demo - Critical Fix Plan (2026-02-08)

## CRITICAL INSTRUCTION FOR CLAUDE CODE

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   ⛔ DO NOT FIX BOTH ISSUES AT ONCE ⛔                                       ║
║                                                                              ║
║   1. Fix Issue 1                                                             ║
║   2. Test it                                                                 ║
║   3. Get user confirmation                                                   ║
║   4. THEN fix Issue 2                                                        ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## Issue Summary (2 Issues)

| # | Issue | Type | Severity |
|---|-------|------|----------|
| 1 | "Generate Workbooks" button not clickable - behind other UI elements | Layout/Z-index | CRITICAL BLOCKER |
| 2 | Publish to Auditors shows success but says "0 workbooks available" | Functional | CRITICAL |

---

## Fix 1: "Generate Workbooks" Button Not Clickable

**THIS IS A BLOCKER - FIX FIRST**

**Problem:**
- On the Select Auditors page, UI elements are stacked on top of each other
- The "Generate Workbooks" button is behind other elements
- Cannot click the button to continue the AIC workflow
- Blocks all further testing

**Location:** Select Auditors page (likely `src/app/aic/stage-3/` or similar)

**Root Cause (investigate):**
- [ ] Navigation buttons have lower z-index than content
- [ ] Buttons positioned inside a container that's being overlapped
- [ ] Flex/grid layout not properly separating navigation from content
- [ ] Absolute/fixed positioning without proper stacking context

**Fix Approach:**

1. Find the Select Auditors page component
2. Identify the navigation footer containing "Back to Stage 3" and "Generate Workbooks" buttons
3. Ensure navigation is in a separate container from scrollable content:

```tsx
<div className="flex flex-col h-full">
  {/* Page header */}
  <div className="flex-shrink-0 p-6 border-b">
    <h1>Select Auditors</h1>
    <p>Choose auditors to assign samples to</p>
  </div>

  {/* Scrollable content - auditor cards */}
  <div className="flex-1 overflow-y-auto p-6">
    {/* Auditor selection cards */}
  </div>

  {/* Navigation footer - MUST be outside scrollable area */}
  <div className="flex-shrink-0 p-6 border-t bg-white dark:bg-slate-900 relative z-20">
    <div className="flex justify-between items-center">
      <button className="...">← Back to Stage 3</button>
      <button className="...">Generate Workbooks →</button>
    </div>
  </div>
</div>
```

4. Key CSS properties for the navigation footer:
   - `position: relative` (creates stacking context)
   - `z-index: 20` (above content)
   - `background-color` (solid, not transparent - prevents content showing through)

5. If using a shared layout component, check that the footer slot isn't being overlapped

**Verification:**
- [ ] Navigate to Select Auditors page
- [ ] Scroll through auditor list
- [ ] "Generate Workbooks" button is always visible
- [ ] Button is CLICKABLE (not just visible)
- [ ] Clicking button proceeds to next step
- [ ] Works in both light and dark mode

**⚠️ STOP. Verify this fix works and get user confirmation before proceeding to Fix 2.**

---

## Fix 2: Publish Shows "0 Workbooks Available"

**DO NOT START UNTIL FIX 1 IS CONFIRMED WORKING**

**Problem:**
- Demo data is populated (stats show 133 Pass, 17 Pass w/Obs, etc.)
- User clicks "Publish to Auditors"
- Success banner appears: "Workbooks Published Successfully"
- But message says: "0 workbooks are now available to auditors"
- Contradiction: Success claimed but 0 workbooks published

**Location:**
- Publish modal/handler (likely in Stage 4 or a shared component)
- `src/lib/stage-data/store.ts`

**Root Cause (investigate):**
- [ ] Workbooks not being generated/stored before publish
- [ ] Publish handler not reading workbooks from correct location
- [ ] Workbook count calculated incorrectly
- [ ] Store state not containing generated workbooks

**Fix Approach:**

1. Find the publish handler and trace the data flow:

```typescript
// Debug: Log what's happening
const handlePublish = () => {
  const workbooks = getGeneratedWorkbooks();
  console.log('Workbooks to publish:', workbooks);
  console.log('Workbook count:', workbooks?.length);

  // If this logs 0 or undefined, the problem is BEFORE publish
  // Workbooks were never generated or stored
};
```

2. If workbooks array is empty, trace back to workbook generation:
   - Find where "Generate Workbooks" creates workbooks
   - Ensure they're saved to the store
   - Ensure store persists to localStorage

3. If workbooks exist but publish doesn't use them:
```typescript
const handlePublish = () => {
  const workbooks = getGeneratedWorkbooks();

  if (!workbooks || workbooks.length === 0) {
    // Show error - cannot publish without workbooks
    showError('No workbooks to publish. Generate workbooks first.');
    return;
  }

  // Mark each workbook as published
  const publishedWorkbooks = workbooks.map(wb => ({
    ...wb,
    status: 'published',
    publishedAt: new Date().toISOString(),
    availableToAuditors: true
  }));

  // Save to store
  setPublishedWorkbooks(publishedWorkbooks);

  // Persist to localStorage
  persistToLocalStorage();

  // Show success with ACTUAL count
  showSuccess(`${publishedWorkbooks.length} workbooks are now available to auditors.`);
};
```

4. Fix the success message to use actual count:
```typescript
// WRONG
showSuccess('Workbooks Published Successfully', '0 workbooks are now available');

// RIGHT
showSuccess('Workbooks Published Successfully', `${workbooks.length} workbooks are now available`);
```

**Verification:**
- [ ] Generate workbooks (after Fix 1 allows clicking the button)
- [ ] Click "Publish to Auditors"
- [ ] Success message shows CORRECT count (e.g., "4 workbooks")
- [ ] NOT "0 workbooks"
- [ ] Workbooks actually accessible to auditors
- [ ] Data persists after page reload

**✅ DONE**

---

## Execution Checklist

```
[ ] Fix 1: Generate Workbooks button clickable
    [ ] Button visible
    [ ] Button clickable
    [ ] Proceeds to next step
    [ ] User confirmed working

[ ] Fix 2: Publish shows correct workbook count
    [ ] Workbooks generated and stored
    [ ] Publish uses correct workbook data
    [ ] Success message shows actual count
    [ ] User confirmed working
```

---

## REMEMBER

- Fix 1 FIRST (it's a blocker)
- Test thoroughly before moving to Fix 2
- Get user confirmation between fixes
- Do NOT combine the fixes into one change
