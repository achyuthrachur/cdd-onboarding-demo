# Fix Plan: React Error #310 - Too Many Re-renders (2026-02-08)

## Error Details

```
Error: Minified React error #310
Visit https://react.dev/errors/310 for the full message
```

**Full message:** "Too many re-renders. React limits the number of renders to prevent an infinite loop."

## When It Occurs

- **When:** Navigating TO the consolidation page
- **Route:** `/aic/audit-runs/[id]/consolidation`
- **Environment:** Production build (minified error)

## Timeline

This error started appearing AFTER the Dialog component was updated for light mode support.

## Files Changed Recently

**`src/components/ui/dialog.tsx`** - Light mode changes:
- Line 89: `bg-white/10` → `bg-white dark:bg-white/10`
- Line 90: `border-white/20` → `border-gray-200 dark:border-white/20`
- Line 91: Shadow changes
- Line 92: `text-white` → `text-gray-900 dark:text-white`
- Line 100: Close button styling changes

## Suspected Root Causes

### 1. Dialog Component Changes (Most Likely)
The Dialog is used in `FindingsTable` which renders on the consolidation page.
Even though Dialog should only open on user interaction, something in the changes might be triggering re-renders.

### 2. useCountUp Hook (12 instances)
`ConsolidationDashboard` uses `useCountUp` 12 times:
```tsx
const animatedTotalTests = useCountUp(consolidation?.metrics.totalTests || 0, ...);
const animatedPassRate = useCountUp(consolidation?.metrics.passRate || 0, ...);
// ... 10 more
```

The hook has a potential SSR issue at line 41 of `src/lib/animations/hooks.ts`:
```tsx
const [displayValue, setDisplayValue] = useState(shouldReduceMotion ? targetValue : 0);
```

`shouldReduceMotion` can differ between server and client, causing hydration mismatches.

### 3. useChartTheme Hook
Uses `document.documentElement.classList.contains('dark')` which doesn't exist during SSR.

---

## Debugging Approach

### Step 1: Run in Development Mode

Run the app in dev mode to get the full, unminified error:
```bash
npm run dev
```

Navigate to `/aic/audit-runs/[id]/consolidation` and check the console for the detailed error.

### Step 2: Add Console Logs

Add these logs to identify which component is re-rendering infinitely:

**In `src/app/aic/audit-runs/[id]/consolidation/page.tsx`:**
```typescript
console.log('[Consolidation Page] Rendering');
```

**In `src/components/stage-4/consolidation-dashboard.tsx`:**
```typescript
console.log('[ConsolidationDashboard] Rendering');
```

**In `src/components/stage-4/findings-table.tsx`:**
```typescript
console.log('[FindingsTable] Rendering');
```

### Step 3: Isolate the Issue

Comment out components one by one to find the culprit:

```tsx
// In consolidation/page.tsx, comment out these one at a time:

{/* <ConsolidationDashboard ... /> */}
{/* <FindingsTable ... /> */}
{/* <ReportGenerator ... /> */}
```

### Step 4: Check Dialog Rendering

If FindingsTable is the issue, the Dialog might be causing it. Check if the Dialog's `open` state is being set incorrectly:

```tsx
// In FindingsTable
<Dialog
  open={!!selectedFinding}  // This should be false initially
  onOpenChange={(open) => !open && setSelectedFinding(null)}
>
```

---

## Potential Fixes

### Fix A: Guard useCountUp for SSR

In `src/lib/animations/hooks.ts`:

```tsx
export function useCountUp(targetValue: number, options = {}) {
  // ...

  // Use 0 as initial value regardless of shouldReduceMotion to avoid SSR mismatch
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    // Set initial value after mount
    if (shouldReduceMotion) {
      setDisplayValue(targetValue);
      return;
    }
    // ... rest of animation logic
  }, [targetValue, shouldReduceMotion, ...]);

  return displayValue;
}
```

### Fix B: Guard useChartTheme for SSR

In `src/components/charts/use-chart-theme.ts`:

```tsx
export function useChartTheme(): ChartThemeStyles {
  // Start with dark theme as default (matches SSR)
  const [theme, setTheme] = useState<ChartThemeStyles>(() => getChartTheme());

  useEffect(() => {
    // Only check actual theme after mount (client-side)
    setTheme(getChartTheme());
    // ... observer setup
  }, []);

  return theme;
}
```

### Fix C: Check Dialog for State Issues

Ensure Dialog doesn't cause re-renders by verifying the `open` prop:

```tsx
// Make sure selectedFinding starts as null
const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);

// The open prop should be stable
<Dialog open={!!selectedFinding} ...>
```

---

## Verification

After applying fixes:

1. [ ] Run `npm run dev` - no errors in console
2. [ ] Navigate to consolidation page - no infinite loop error
3. [ ] Run `npm run build` - builds successfully
4. [ ] Test production build - no #310 error
5. [ ] Test in both light and dark mode

---

## Notes

- The error is #310 specifically (too many re-renders), not a hydration error (#418/#425)
- This means something is calling `setState` during render
- The issue is triggered when navigating TO the page, so it's initial render
- Development mode will show the exact component causing the issue
