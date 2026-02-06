# CDD Onboarding Demo - Detailed UI Fixes

> **Created:** 2026-02-06
> **Status:** Critical - Multiple UI issues blocking usability
> **Screenshots Reviewed:** 8 screens across light/dark modes

---

## Critical Issues Summary

| # | Issue | Severity | Affected Areas |
|---|-------|----------|----------------|
| 1 | White text on light backgrounds | **P0** | Multiple pages |
| 2 | Transparent/invisible buttons | **P0** | All pages |
| 3 | Missing content in light mode | **P0** | Sampling Plan, tables |
| 4 | Button/element stacking/overlap | **P1** | Navigation buttons |
| 5 | "Continue to Live Monitoring" broken | **P1** | Stage 4 |
| 6 | Auditor demo data not loading | **P1** | Auditor workbooks |
| 7 | Text too small | **P1** | Various labels |
| 8 | Horizontal scroll at bottom only | **P2** | Wide tables |
| 9 | No dynamic resizing | **P2** | All containers |
| 10 | Attribute table visibility | **P1** | Extraction results |

---

## Issue 1: White Text on Light Backgrounds

### Problem
Text is white or near-white on light/white backgrounds, making it completely invisible.

### Affected Locations (from screenshots)

| Location | Element | Current | Should Be |
|----------|---------|---------|-----------|
| Sampling Plan card | Stratum table content | Invisible/white | `text-gray-900` |
| Sampling Plan card | Table headers | Invisible | `text-gray-700 font-semibold` |
| Sample Results stats | Stat labels under numbers | Missing in light mode | `text-gray-600` |
| Extraction Results | Tab text | Very light gray | `text-gray-700` |
| Workbooks page | Progress text | Low contrast | `text-gray-600` |

### Root Cause
Components are using `text-white` without `dark:` prefix, or using CSS variables that default to white.

### Fix Pattern

```tsx
// ❌ WRONG - White text always
<span className="text-white">Label</span>

// ❌ WRONG - CSS variable that's white in light mode
<span className="text-text-primary">Label</span>

// ✅ CORRECT - Explicit light and dark colors
<span className="text-gray-900 dark:text-white">Label</span>
```

### Files to Fix

```
src/app/aic/sampling/page.tsx
src/components/sampling/stratum-table.tsx
src/components/sampling/sample-results.tsx
src/components/stage-3/extraction-results-view.tsx
src/app/aic/workbooks/page.tsx
```

### Search Pattern
```bash
# Find all instances of text-white without dark: prefix
grep -rn "text-white" src/ | grep -v "dark:text-white"

# Find CSS variable text colors
grep -rn "text-text-" src/
```

---

## Issue 2: Transparent/Invisible Buttons

### Problem
Buttons appear completely transparent or have no visible background, making them hard to find and click.

### Affected Buttons (from screenshots)

| Button | Location | Current State | Required State |
|--------|----------|---------------|----------------|
| "CSV" | Sample Results | Outline only, hard to see | Solid or visible outline |
| "Summary" | Sample Results | Outline only | Solid or visible outline |
| "Export" | Workbooks page | Ghost/invisible | Visible outline |
| "Back to Stage X" | All stage pages | Ghost text only | Visible with border |
| Dropdown triggers | Auditor testing | Subtle border only | Clear border + background |

### Fix: Update Button Component

```tsx
// src/components/ui/button.tsx

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // Primary - Solid Crowe Indigo
        default:
          "bg-crowe-indigo text-white border border-crowe-indigo " +
          "hover:bg-crowe-indigo-dark " +
          "dark:bg-crowe-indigo dark:hover:bg-crowe-indigo-bright",

        // Secondary - Solid Crowe Amber
        secondary:
          "bg-crowe-amber text-crowe-indigo-dark border border-crowe-amber-dark " +
          "hover:bg-crowe-amber-dark " +
          "dark:bg-crowe-amber dark:text-crowe-indigo-dark",

        // Outline - Visible border, transparent fill
        outline:
          "bg-white text-gray-900 border-2 border-gray-300 " +
          "hover:bg-gray-50 hover:border-gray-400 " +
          "dark:bg-transparent dark:text-white dark:border-gray-500 " +
          "dark:hover:bg-white/10 dark:hover:border-gray-400",

        // Ghost - Subtle but VISIBLE
        ghost:
          "bg-gray-100 text-gray-700 " +
          "hover:bg-gray-200 hover:text-gray-900 " +
          "dark:bg-white/10 dark:text-gray-200 " +
          "dark:hover:bg-white/20 dark:hover:text-white",

        // Destructive
        destructive:
          "bg-red-600 text-white border border-red-700 " +
          "hover:bg-red-700 " +
          "dark:bg-red-600 dark:hover:bg-red-500",

        // Link style
        link:
          "text-crowe-indigo underline-offset-4 hover:underline " +
          "dark:text-crowe-amber",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
```

### Files to Fix

```
src/components/ui/button.tsx - Main variant definitions
src/components/sampling/sample-results.tsx - CSV/Summary buttons
src/app/aic/workbooks/page.tsx - Export button
src/components/ui/select.tsx - Dropdown trigger styling
```

---

## Issue 3: Missing Content in Light Mode

### Problem
The Sampling Plan stratum table and other content areas are completely empty/invisible in light mode but display correctly in dark mode.

### Screenshot Comparison

**Light Mode (BROKEN):**
- Sampling Plan card shows empty white box
- No stratum table visible
- "Sample Locked" button visible but content above missing

**Dark Mode (WORKING):**
- Full stratum table with #, Stratum, Population, Sample Size, Share columns
- All 3 rows visible (Green, Amber, Red)
- Total row visible

### Root Cause
The table and content components are using:
1. `text-white` for table text (invisible on white background)
2. `bg-white/10` or transparent backgrounds that blend with white cards
3. Missing `dark:` prefixes on color classes

### Fix: Stratum Table Component

```tsx
// src/components/sampling/stratum-table.tsx

<table className="w-full">
  <thead>
    <tr className="border-b border-gray-200 dark:border-white/20">
      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-200">
        #
      </th>
      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-200">
        Stratum
      </th>
      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-200">
        Population
      </th>
      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-200">
        Sample Size
      </th>
      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-200">
        Share
      </th>
    </tr>
  </thead>
  <tbody>
    {strata.map((stratum, index) => (
      <tr
        key={stratum.id}
        className="border-b border-gray-100 dark:border-white/10"
      >
        <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
          {index + 1}
        </td>
        <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
          {stratum.name}
        </td>
        <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-200 text-right">
          {stratum.population.toLocaleString()}
        </td>
        <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-200 text-right">
          {stratum.sampleSize}
        </td>
        <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-200 text-right">
          {stratum.share}%
        </td>
      </tr>
    ))}
    {/* Total row */}
    <tr className="bg-gray-50 dark:bg-white/5 font-semibold">
      <td className="py-3 px-4 text-sm text-gray-900 dark:text-white" colSpan={2}>
        Total
      </td>
      <td className="py-3 px-4 text-sm text-gray-900 dark:text-white text-right">
        {total.population.toLocaleString()}
      </td>
      <td className="py-3 px-4 text-sm text-gray-900 dark:text-white text-right">
        {total.sampleSize}
      </td>
      <td className="py-3 px-4 text-sm text-gray-900 dark:text-white text-right">
        100%
      </td>
    </tr>
  </tbody>
</table>
```

### Files to Fix

```
src/components/sampling/stratum-table.tsx
src/components/sampling/sampling-plan-card.tsx
Any component rendering tables
```

---

## Issue 4: Button/Element Stacking & Overlap

### Problem
UI elements are overlapping incorrectly, particularly navigation buttons.

### Screenshot Evidence
- "Continue to Attribute Extraction" button overlaps with "Sampling" breadcrumb
- Text is clipped or running into other elements

### Root Causes
1. Missing `z-index` management
2. Absolute/fixed positioning without proper containers
3. Flexbox/grid not containing children properly

### Fix: Navigation Button Container

```tsx
// Ensure proper stacking context and containment

// Page footer with navigation buttons
<footer className="
  sticky bottom-0
  mt-auto
  py-4 px-6
  bg-white dark:bg-crowe-indigo-dark
  border-t border-gray-200 dark:border-white/10
  z-10
">
  <div className="flex items-center justify-between max-w-7xl mx-auto">
    {/* Back button */}
    <Button variant="ghost" asChild>
      <Link href="/aic/gap-assessment">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Stage 1
      </Link>
    </Button>

    {/* Continue button */}
    <Button asChild>
      <Link href="/aic/extraction">
        Continue to Attribute Extraction
        <ArrowRight className="w-4 h-4 ml-2" />
      </Link>
    </Button>
  </div>
</footer>
```

### Fix: Z-Index Scale

```css
/* globals.css - Add z-index scale */
:root {
  --z-dropdown: 50;
  --z-sticky: 100;
  --z-fixed: 200;
  --z-modal-backdrop: 300;
  --z-modal: 400;
  --z-popover: 500;
  --z-tooltip: 600;
}
```

### Files to Fix

```
src/app/aic/sampling/page.tsx
src/app/aic/extraction/page.tsx
src/app/aic/workbooks/page.tsx
All pages with navigation footers
```

---

## Issue 5: "Continue to Live Monitoring" Button Not Working

### Problem
The "Continue to Live Monitoring" button on the Workbooks page (Stage 4) doesn't navigate when clicked.

### Investigation Needed

```tsx
// Check the button implementation
// Likely issues:
// 1. Missing href or onClick handler
// 2. Button is disabled but not visually indicated
// 3. Link wrapper missing
// 4. Conditional rendering preventing click

// Current (likely broken):
<Button disabled={!workbooksPublished}>
  Continue to Live Monitoring
  <ArrowRight className="w-4 h-4 ml-2" />
</Button>

// Should be:
<Button
  asChild
  disabled={!workbooksPublished}
  className={cn(!workbooksPublished && "opacity-50 cursor-not-allowed")}
>
  <Link href="/aic/monitoring">
    Continue to Live Monitoring
    <ArrowRight className="w-4 h-4 ml-2" />
  </Link>
</Button>
```

### Files to Fix

```
src/app/aic/workbooks/page.tsx - Check button implementation
src/app/aic/monitoring/page.tsx - Ensure route exists
```

### Acceptance Criteria
- [ ] Button navigates to `/aic/monitoring` when clicked
- [ ] Button is visually disabled if workbooks not published
- [ ] Disabled state prevents navigation
- [ ] Hover state provides feedback

---

## Issue 6: Auditor Demo Data Not Loading

### Problem
When clicking "Load Demo Data" on the auditor side, the demo data does not appear.

### Investigation Areas

1. **Function not called:**
```tsx
// Check if onClick is properly wired
<Button onClick={handleLoadDemoData}>Load Demo Data</Button>
```

2. **Data not being set:**
```tsx
// Check if setStageData is called with correct keys
const handleLoadDemoData = () => {
  loadFallbackDataForStage(4); // Auditor stage
  // Need to also trigger re-render
  router.refresh(); // or setState to trigger update
};
```

3. **Component not re-rendering:**
```tsx
// May need to use state to trigger re-render
const [dataLoaded, setDataLoaded] = useState(false);

const handleLoadDemoData = () => {
  loadFallbackDataForStage(4);
  setDataLoaded(true); // Trigger re-render
};
```

4. **Wrong data keys:**
```tsx
// Auditor needs these keys populated:
// - pivotedWorkbooks
// - auditorProgress
// - workbooksPublished (must be true)
```

### Files to Fix

```
src/app/auditor/workbooks/page.tsx
src/lib/stage-data/fallback-data.ts - Ensure auditor data is included
```

### Fix Implementation

```tsx
// src/app/auditor/workbooks/page.tsx

const handleLoadDemoData = async () => {
  // Load all prerequisite data
  loadFallbackDataForStage(4);

  // Ensure workbooks are marked as published
  setStageData('workbooksPublished', true);

  // Force component refresh
  const workbooks = getStageData('pivotedWorkbooks');
  setLocalWorkbooks(workbooks || []);

  toast.success('Demo data loaded successfully');
};
```

---

## Issue 7: Text Too Small

### Problem
Various labels and text elements are too small to read comfortably.

### Affected Areas

| Element | Current Size | Recommended Size |
|---------|--------------|------------------|
| Stat labels under numbers | `text-xs` (12px) | `text-sm` (14px) |
| Table headers | `text-xs` | `text-sm font-medium` |
| Badge text | `text-xs` | `text-sm` |
| Helper/hint text | `text-xs` | `text-sm` |
| Breadcrumb text | Unknown | `text-sm` |

### Minimum Text Sizes

```css
/* globals.css - Minimum readable sizes */

/* Never go below 12px for any readable text */
.text-minimum {
  font-size: max(0.75rem, 12px);
}

/* Labels should be at least 14px */
.label-text {
  @apply text-sm; /* 14px */
}

/* Body text should be at least 16px */
.body-text {
  @apply text-base; /* 16px */
}
```

### Fix: Stat Cards

```tsx
// Sample Results stat cards

<div className="text-center">
  {/* Stat value - large and bold */}
  <p className="text-3xl font-bold text-gray-900 dark:text-white">
    {value}
  </p>
  {/* Stat label - MUST be readable */}
  <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mt-1">
    {label}
  </p>
</div>
```

### Files to Fix

```
src/components/sampling/sample-results.tsx
src/components/ui/badge.tsx
src/components/ui/table.tsx
All stat card components
```

---

## Issue 8: Horizontal Scroll at Bottom Only

### Problem
Wide tables require scrolling to the right, but the horizontal scrollbar only appears at the very bottom of the page, forcing users to scroll down first.

### Current Behavior
- Table extends beyond viewport width
- Scrollbar hidden until user scrolls to bottom
- Poor UX for wide data tables

### Fix: Sticky Horizontal Scroll

```tsx
// Wrapper component for scrollable tables

interface ScrollableTableProps {
  children: React.ReactNode;
  maxHeight?: string;
}

export function ScrollableTable({ children, maxHeight = "70vh" }: ScrollableTableProps) {
  return (
    <div className="relative">
      {/* Scroll container with visible scrollbar */}
      <div
        className="
          overflow-x-auto overflow-y-auto
          scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600
          scrollbar-track-transparent
          border border-gray-200 dark:border-white/10
          rounded-lg
        "
        style={{ maxHeight }}
      >
        {children}
      </div>

      {/* Optional: Scroll hint for wide content */}
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-crowe-indigo-dark to-transparent pointer-events-none" />
    </div>
  );
}
```

### CSS for Custom Scrollbars

```css
/* globals.css */

/* Custom scrollbar styling */
.scrollbar-thin {
  scrollbar-width: thin;
}

.scrollbar-thin::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background-color: #d1d5db;
  border-radius: 4px;
}

.dark .scrollbar-thin::-webkit-scrollbar-thumb {
  background-color: #4b5563;
}

.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background-color: #9ca3af;
}

.dark .scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background-color: #6b7280;
}

/* Always show scrollbar when content overflows */
.scroll-always {
  overflow: auto !important;
}

.scroll-always::-webkit-scrollbar {
  display: block !important;
}
```

### Files to Fix

```
src/components/ui/table.tsx - Add scroll wrapper
src/app/auditor/workbooks/[id]/page.tsx - Apply to testing table
src/components/stage-3/extraction-results-view.tsx - Apply to attribute table
```

---

## Issue 9: Dynamic Sizing & Resizing

### Problem
Elements don't resize responsively when:
- Window is resized
- Content changes
- Sidebar is toggled

### Implementation: Responsive Container System

```tsx
// src/components/layout/responsive-container.tsx

'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  minWidth?: number;
  maxWidth?: number;
}

export function ResponsiveContainer({
  children,
  className,
  minWidth = 320,
  maxWidth = 1920,
}: ResponsiveContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        "w-full transition-all duration-200",
        className
      )}
      style={{
        minWidth: `${minWidth}px`,
        maxWidth: `${maxWidth}px`,
      }}
      data-container-width={containerWidth}
    >
      {children}
    </div>
  );
}
```

### Responsive Grid System

```tsx
// src/components/layout/responsive-grid.tsx

interface ResponsiveGridProps {
  children: React.ReactNode;
  minItemWidth?: number; // Minimum width per item in pixels
  gap?: number;
}

export function ResponsiveGrid({
  children,
  minItemWidth = 280,
  gap = 24,
}: ResponsiveGridProps) {
  return (
    <div
      className="grid w-full"
      style={{
        gridTemplateColumns: `repeat(auto-fit, minmax(${minItemWidth}px, 1fr))`,
        gap: `${gap}px`,
      }}
    >
      {children}
    </div>
  );
}

// Usage for stat cards:
<ResponsiveGrid minItemWidth={200} gap={16}>
  <StatCard label="Sample Size" value={50} />
  <StatCard label="Confidence Level" value="95%" />
  <StatCard label="Tolerable Error Rate" value="5.0%" />
  <StatCard label="Random Seed" value={42} />
</ResponsiveGrid>
```

### Responsive Table Columns

```tsx
// For the auditor testing table with many columns

interface ResponsiveTableProps {
  columns: Column[];
  data: Row[];
  stickyColumns?: number; // Number of columns to keep visible
}

export function ResponsiveTable({
  columns,
  data,
  stickyColumns = 3,
}: ResponsiveTableProps) {
  return (
    <div className="relative overflow-hidden">
      {/* Sticky left columns */}
      <div className="absolute left-0 top-0 z-10 bg-white dark:bg-crowe-indigo-dark shadow-md">
        <table>
          <thead>
            <tr>
              {columns.slice(0, stickyColumns).map(col => (
                <th key={col.id} className="...">{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map(row => (
              <tr key={row.id}>
                {columns.slice(0, stickyColumns).map(col => (
                  <td key={col.id}>{row[col.id]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Scrollable right columns */}
      <div
        className="overflow-x-auto"
        style={{ marginLeft: `${stickyColumns * 150}px` }}
      >
        <table>
          {/* ... remaining columns */}
        </table>
      </div>
    </div>
  );
}
```

### CSS Container Queries

```css
/* globals.css - Container queries for component-level responsiveness */

@container (max-width: 400px) {
  .stat-card {
    @apply p-4;
  }
  .stat-card .stat-value {
    @apply text-2xl;
  }
}

@container (min-width: 401px) {
  .stat-card {
    @apply p-6;
  }
  .stat-card .stat-value {
    @apply text-3xl;
  }
}

/* Enable container queries on parent */
.container-responsive {
  container-type: inline-size;
}
```

### Files to Fix

```
src/components/layout/responsive-container.tsx - Create new
src/components/layout/responsive-grid.tsx - Create new
src/app/aic/sampling/page.tsx - Apply responsive grid to stat cards
src/app/aic/workbooks/page.tsx - Apply responsive grid
src/app/auditor/workbooks/[id]/page.tsx - Apply responsive table
```

---

## Issue 10: Attribute Table Visibility

### Problem
The attributes table in Extraction Results is hard to see or interact with in light mode.

### Screenshot Evidence
- Tab buttons ("Attributes (24)", "Acceptable Docs (37)") are very subtle
- Table content may have contrast issues

### Fix: Tabs Component

```tsx
// src/components/ui/tabs.tsx

const TabsList = React.forwardRef<...>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      // Light mode: visible gray background
      "inline-flex h-11 items-center justify-center rounded-lg p-1",
      "bg-gray-100 text-gray-600",
      // Dark mode: subtle white background
      "dark:bg-white/10 dark:text-gray-300",
      className
    )}
    {...props}
  />
));

const TabsTrigger = React.forwardRef<...>(({ className, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2",
      "text-sm font-medium transition-all",
      // Inactive state - clearly visible
      "text-gray-600 dark:text-gray-300",
      "hover:text-gray-900 dark:hover:text-white",
      "hover:bg-white/50 dark:hover:bg-white/10",
      // Active state - prominent
      "data-[state=active]:bg-white data-[state=active]:text-gray-900",
      "data-[state=active]:shadow-sm",
      "dark:data-[state=active]:bg-white/20 dark:data-[state=active]:text-white",
      // Focus state
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-crowe-indigo",
      className
    )}
    {...props}
  />
));
```

### Fix: Attribute Table

```tsx
// Ensure table has proper contrast

<table className="w-full">
  <thead className="bg-gray-50 dark:bg-white/5 sticky top-0">
    <tr>
      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-white/10">
        Attr ID
      </th>
      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-white/10">
        Category
      </th>
      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-white/10">
        Question
      </th>
    </tr>
  </thead>
  <tbody>
    {attributes.map((attr) => (
      <tr
        key={attr.id}
        className="border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5"
      >
        <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">
          {attr.id}
        </td>
        <td className="py-3 px-4">
          <Badge variant={getCategoryVariant(attr.category)}>
            {attr.category}
          </Badge>
        </td>
        <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-200">
          {attr.question}
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

### Files to Fix

```
src/components/ui/tabs.tsx
src/components/stage-3/extraction-results-view.tsx
src/components/stage-3/attributes-table.tsx
```

---

## Implementation Checklist

### Phase 1: Critical Visibility Fixes (Day 1)

- [ ] **Issue 1:** Fix white text on light backgrounds
  - [ ] Audit all `text-white` usage
  - [ ] Add `dark:` prefixes everywhere needed
  - [ ] Replace CSS variable text colors

- [ ] **Issue 2:** Fix transparent buttons
  - [ ] Update button.tsx variants
  - [ ] Test all button states (default, hover, disabled)

- [ ] **Issue 3:** Fix missing content in light mode
  - [ ] Fix stratum table
  - [ ] Fix sample results stats
  - [ ] Test both themes

### Phase 2: Functionality Fixes (Day 2)

- [ ] **Issue 5:** Fix "Continue to Live Monitoring" button
  - [ ] Add proper Link wrapper
  - [ ] Ensure route exists
  - [ ] Test navigation

- [ ] **Issue 6:** Fix auditor demo data loading
  - [ ] Debug load function
  - [ ] Add re-render trigger
  - [ ] Test data appears after load

### Phase 3: Layout & Sizing Fixes (Day 3)

- [ ] **Issue 4:** Fix button/element stacking
  - [ ] Add proper z-index management
  - [ ] Fix navigation footer containers

- [ ] **Issue 7:** Increase text sizes
  - [ ] Audit all `text-xs` usage
  - [ ] Update to minimum `text-sm` for labels

- [ ] **Issue 8:** Fix horizontal scroll
  - [ ] Add scroll wrapper component
  - [ ] Apply to wide tables

- [ ] **Issue 9:** Add dynamic sizing
  - [ ] Create responsive container components
  - [ ] Apply to stat grids
  - [ ] Test window resizing

- [ ] **Issue 10:** Fix attribute table visibility
  - [ ] Update tabs component
  - [ ] Update table styling
  - [ ] Test in both themes

---

## Testing Matrix

| Page | Light Mode | Dark Mode | Responsive |
|------|------------|-----------|------------|
| AIC Dashboard | [ ] | [ ] | [ ] |
| Gap Assessment | [ ] | [ ] | [ ] |
| Sampling | [ ] | [ ] | [ ] |
| Extraction | [ ] | [ ] | [ ] |
| Workbooks | [ ] | [ ] | [ ] |
| Auditor Dashboard | [ ] | [ ] | [ ] |
| Auditor Workbooks | [ ] | [ ] | [ ] |
| Auditor Testing | [ ] | [ ] | [ ] |

---

## Files Priority Order

1. `src/components/ui/button.tsx` - Fixes Issues 2
2. `src/app/globals.css` - Fixes Issues 1, 7, 8
3. `src/components/sampling/stratum-table.tsx` - Fixes Issue 3
4. `src/components/sampling/sample-results.tsx` - Fixes Issues 1, 3, 7
5. `src/components/ui/tabs.tsx` - Fixes Issue 10
6. `src/app/aic/workbooks/page.tsx` - Fixes Issues 4, 5
7. `src/app/auditor/workbooks/page.tsx` - Fixes Issue 6
8. `src/components/stage-3/extraction-results-view.tsx` - Fixes Issues 8, 10
9. Create responsive components - Fixes Issue 9

---

*Document created: 2026-02-06*
*Total issues: 10*
*Estimated effort: 3 days*
