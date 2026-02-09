# Fix Plan: Stage 4 Layout & Workbook Generation Issues (2026-02-08)

## CRITICAL INSTRUCTION FOR CLAUDE CODE

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   ⛔ DO NOT FIX BOTH ISSUES AT ONCE ⛔                                       ║
║                                                                              ║
║   1. Fix Issue 1                                                             ║
║   2. Test it thoroughly                                                      ║
║   3. Get user confirmation                                                   ║
║   4. THEN fix Issue 2 (if still needed)                                     ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## Issue Summary

| # | Issue | Root Cause | Severity |
|---|-------|------------|----------|
| 1 | Only 2 of 4 auditors visible + "Generate Workbooks" button missing | `overflow-hidden` on Tabs container (line 525) | CRITICAL BLOCKER |
| 2 | Publish shows "0 workbooks available" | `pivotedWorkbooks` state is empty when banner renders | HIGH |

---

## Critical File

**`src/app/aic/audit-runs/[id]/stage-4/page.tsx`**

---

## Fix 1: Remove overflow-hidden from Tabs Container

**THIS IS THE BLOCKER - FIX THIS FIRST**

### Problem

On line 525 of stage-4/page.tsx:

```tsx
<Tabs
  value={currentStep}
  onValueChange={(v) => setCurrentStep(v as WorkflowStep)}
  className="flex-1 flex flex-col min-h-0 overflow-hidden"  // ← PROBLEM HERE
>
```

The `overflow-hidden` class clips all content that exceeds the container height. This causes:
- **Auditor cards 3 and 4 (Michael Chen, Emily Davis) to be hidden**
- **The "Generate Workbooks" button to be cut off and not visible**

### The Fix

Change line 525 from:
```tsx
className="flex-1 flex flex-col min-h-0 overflow-hidden"
```

To:
```tsx
className="flex-1 flex flex-col min-h-0 overflow-y-auto"
```

This single change allows the tabs content to scroll when it exceeds the container height, making all auditors and the Generate Workbooks button visible.

### Verification Checklist for Fix 1

After making the change:

- [ ] Navigate to Stage 4 page
- [ ] Go to "Auditors" tab
- [ ] **All 4 auditors visible**: John Smith, Sarah Johnson, Michael Chen, Emily Davis
- [ ] Can scroll the auditor list if needed
- [ ] "Continue to Generation" button at bottom is visible and clickable
- [ ] Click "Continue to Generation"
- [ ] Go to "Generate" tab
- [ ] **"Generate Workbooks" button is visible**
- [ ] Click "Generate Workbooks" - workbooks are generated
- [ ] Works in both light and dark mode

**⚠️ STOP. Verify Fix 1 works and get user confirmation before proceeding to Fix 2.**

---

## Fix 2: Publish Shows "0 Workbooks Available"

**DO NOT START UNTIL FIX 1 IS CONFIRMED WORKING**

### Problem

On line 892 of stage-4/page.tsx:

```tsx
<p className="text-sm text-crowe-teal/80">
  {pivotedWorkbooks.length} workbooks are now available to auditors.
</p>
```

If `pivotedWorkbooks` state is empty or undefined, this shows "0 workbooks are now available".

### Likely Resolution

**This issue will likely resolve itself once Fix 1 is applied.** Here's why:

1. User couldn't click "Generate Workbooks" before (button was hidden)
2. Without generating, `pivotedWorkbooks` was never populated
3. When Publish was clicked, `pivotedWorkbooks.length` was 0

After Fix 1:
1. User can click "Generate Workbooks"
2. `handleGenerateWorkbooks()` runs and sets `setPivotedWorkbooks(pivoted)` (line 205)
3. When Publish is clicked, `pivotedWorkbooks.length` shows correct count

### If Still Broken After Fix 1

If publish still shows "0 workbooks" after Fix 1 is applied and workbooks are successfully generated:

1. Add debug logging to `handleGenerateWorkbooks`:
   ```typescript
   console.log('Generated pivoted workbooks:', pivoted.length, pivoted);
   ```

2. Check if `pivoted` array is empty - if so, the generation logic has a bug

3. Verify `setPivotedWorkbooks(pivoted)` is actually being called

### Verification Checklist for Fix 2

- [ ] Generate workbooks successfully (shows success toast)
- [ ] Navigate to "View & Publish" tab
- [ ] Click "Publish to Auditors" button
- [ ] Success banner shows **correct count** (e.g., "4 workbooks are now available")
- [ ] Does NOT show "0 workbooks are now available"

---

## File Line Reference

| Line | Code | Purpose |
|------|------|---------|
| 429 | `h-[calc(100vh-4rem)]` | Fixed height on parent container |
| 525 | `overflow-hidden` | **ROOT CAUSE** - clips content |
| 701 | `TabsContent value="auditors"` | Contains AuditorSelector |
| 722 | `TabsContent value="generate"` | Contains Generate Workbooks button |
| 783-804 | Generate Workbooks Button | Gets clipped by overflow-hidden |
| 892 | `{pivotedWorkbooks.length}` | Shows "0" if state is empty |

---

## Execution Checklist

```
[ ] Fix 1: Change overflow-hidden to overflow-y-auto on line 525
    [ ] All 4 auditors visible
    [ ] Generate Workbooks button visible
    [ ] Button is clickable
    [ ] Workbooks generate successfully
    [ ] User confirmed Fix 1 working

[ ] Fix 2: Verify publish count (likely auto-resolved by Fix 1)
    [ ] Publish shows correct workbook count
    [ ] NOT "0 workbooks"
    [ ] User confirmed Fix 2 working
```

---

## Remember

- **Fix 1 is the blocker** - it must be fixed first
- Fix 2 is likely a downstream effect of Fix 1
- Test thoroughly after each change
- Get user confirmation before marking as complete
