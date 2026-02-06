# UI Spacing & Layout Remediation Guide

> **Purpose:** Systematically audit and fix spacing, alignment, and layout inconsistencies across the entire CDD Onboarding Demo application.

---

## Issues Identified

Based on visual inspection, the following categories of issues need attention:

### 1. **Inconsistent Card/Container Padding**
- Some cards have tight padding while others are spacious
- Status cards (Pass, Fail, etc.) have inconsistent internal spacing
- Badge/chip elements have varying padding

### 2. **Flex Container Alignment Issues**
- Items not properly centered vertically in flex rows
- Inconsistent `gap` values between similar components
- `justify-between` containers with cramped edge items

### 3. **Typography Spacing**
- Inconsistent margins between headings and body text
- Label/value pairs with varying spacing
- Badge text not vertically centered

### 4. **Grid Layout Problems**
- Status cards grid has uneven column widths
- Responsive breakpoints causing layout shifts
- Gap inconsistencies between grid items

### 5. **Navigation/Action Bar Issues**
- Bottom navigation bar elements not properly aligned
- Button groups with inconsistent spacing
- Dropdown triggers misaligned with adjacent elements

---

## Remediation Instructions

### Step 1: Audit All Page Components

Search for and review these file patterns:
```bash
# Find all page and component files
src/app/**/page.tsx
src/components/**/*.tsx
```

For each file, check:
- [ ] Container padding consistency (`p-4`, `p-6`, `px-4 py-3`, etc.)
- [ ] Flex container gaps (`gap-2`, `gap-3`, `gap-4`)
- [ ] Grid gaps and column definitions
- [ ] Margin consistency between sections (`mt-4`, `mb-6`, `space-y-4`)

### Step 2: Apply Standard Spacing Scale

Use this consistent spacing scale (based on 8px grid):

| Token | Value | Use Case |
|-------|-------|----------|
| `gap-1` / `p-1` | 4px | Tight icon spacing, badge padding |
| `gap-2` / `p-2` | 8px | Inline elements, small cards |
| `gap-3` / `p-3` | 12px | Default component spacing |
| `gap-4` / `p-4` | 16px | Card padding, section spacing |
| `gap-6` / `p-6` | 24px | Large card padding, major sections |
| `gap-8` / `p-8` | 32px | Page section margins |

### Step 3: Fix Common Patterns

#### A. Status/Metric Cards Grid
```tsx
// BEFORE (inconsistent)
<div className="grid grid-cols-6 gap-2">
  <div className="p-2 text-center">...</div>
</div>

// AFTER (consistent)
<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
  <div className="p-3 rounded-lg text-center flex flex-col items-center justify-center min-h-[80px]">
    <span className="text-2xl font-bold">{value}</span>
    <span className="text-xs text-white/60 mt-1">{label}</span>
  </div>
</div>
```

#### B. Header/Action Bar Layout
```tsx
// BEFORE (cramped)
<div className="flex items-center justify-between">
  <div className="flex gap-1">...</div>
  <div className="flex gap-1">...</div>
</div>

// AFTER (balanced)
<div className="flex items-center justify-between px-4 py-3">
  <div className="flex items-center gap-3">...</div>
  <div className="flex items-center gap-2">...</div>
</div>
```

#### C. Badge/Chip Containers
```tsx
// BEFORE (inconsistent)
<Badge className="text-xs">{text}</Badge>

// AFTER (consistent)
<Badge className="px-2.5 py-0.5 text-xs font-medium">{text}</Badge>
```

#### D. Tab Navigation
```tsx
// BEFORE (tight)
<div className="flex gap-1">
  {tabs.map(tab => <Tab key={tab.id} />)}
</div>

// AFTER (comfortable)
<div className="flex items-center gap-1 p-1 bg-white/5 rounded-lg">
  {tabs.map(tab => (
    <button className="px-4 py-2 rounded-md text-sm font-medium transition-colors">
      {tab.label}
    </button>
  ))}
</div>
```

#### E. Bottom Navigation Bar
```tsx
// BEFORE (misaligned)
<div className="flex justify-between mt-4">
  <Button>Back</Button>
  <div className="flex">
    <Select />
    <Select />
  </div>
  <Button>Continue</Button>
</div>

// AFTER (properly aligned)
<div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
  <Button variant="ghost" className="gap-2">
    <ArrowLeft className="h-4 w-4" />
    Back to Stage 3
  </Button>

  <div className="flex items-center gap-3">
    <Select className="w-[140px]" />
    <Select className="w-[140px]" />
  </div>

  <Button className="gap-2">
    Continue to Live Monitoring
    <ArrowRight className="h-4 w-4" />
  </Button>
</div>
```

### Step 4: Component-by-Component Checklist

Run through each major component and verify:

#### Cards & Containers
- [ ] Consistent `rounded-lg` or `rounded-xl` (pick one)
- [ ] Consistent padding: `p-4` for small cards, `p-6` for large
- [ ] Consistent border treatment: `border border-white/10` or none
- [ ] Consistent shadow: `shadow-sm` or none

#### Buttons
- [ ] Consistent height: use `h-9` or `h-10` for standard buttons
- [ ] Consistent padding: `px-4` minimum
- [ ] Icon + text buttons: `gap-2` between icon and text
- [ ] Icon-only buttons: `h-9 w-9` square

#### Form Elements
- [ ] Labels have `mb-1.5` or `mb-2` below them
- [ ] Input groups have `gap-3` or `gap-4`
- [ ] Select/dropdown width is consistent or uses `w-full`

#### Tables/Data Grids
- [ ] Header cells: `px-4 py-3` padding
- [ ] Body cells: `px-4 py-3` or `px-4 py-2` padding
- [ ] Consistent text alignment per column type

#### Progress/Status Indicators
- [ ] Progress bars have consistent height: `h-2` or `h-1.5`
- [ ] Status badges have consistent sizing
- [ ] Numeric values have consistent typography

### Step 5: Responsive Breakpoint Audit

Verify layouts at these breakpoints:
- `sm` (640px) - Mobile landscape
- `md` (768px) - Tablet
- `lg` (1024px) - Desktop
- `xl` (1280px) - Large desktop

Common fixes:
```tsx
// Stack on mobile, row on desktop
<div className="flex flex-col sm:flex-row gap-4">

// Adjust grid columns
<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">

// Hide/show elements
<span className="hidden sm:inline">Full Label</span>
<span className="sm:hidden">Short</span>
```

---

## Files to Review (Priority Order)

1. **Layout Components**
   - `src/app/layout.tsx`
   - `src/components/ui/card.tsx`
   - `src/components/ui/button.tsx`

2. **Page Components**
   - `src/app/(aic)/page.tsx` (main dashboard)
   - Stage pages (1-6)
   - Any page showing the issues in screenshots

3. **Feature Components**
   - Status cards / metric displays
   - Tab navigation components
   - Action bars / bottom navigation
   - Data tables

4. **Shared Components**
   - Badge components
   - Progress indicators
   - Filter/dropdown groups

---

## Validation Checklist

After making changes, verify:

- [ ] All similar components have identical spacing
- [ ] No text is cut off or overlapping
- [ ] Touch targets are at least 44x44px on mobile
- [ ] Vertical rhythm is consistent (8px increments)
- [ ] No visual "jitter" when switching tabs/pages
- [ ] Dark mode contrast remains WCAG AA compliant
- [ ] Animations don't cause layout shifts

---

## Example Fix Session Prompt

Use this prompt to fix a specific component:

```
Review [COMPONENT_NAME] and fix spacing/layout issues:

1. Ensure consistent padding (p-4 for cards, p-6 for large containers)
2. Use gap-3 for flex containers with multiple items
3. Ensure all text has proper line-height and margins
4. Verify vertical centering in flex rows (items-center)
5. Check responsive behavior at sm/md/lg breakpoints
6. Maintain the existing dark theme color scheme
7. Keep the liquid glass aesthetic with proper opacity values

Show me the before/after changes with explanations.
```

---

## Quick Reference: Tailwind Spacing Classes

```
Padding:     p-{0,1,2,3,4,5,6,8,10,12,16,20,24}
Margin:      m-{0,1,2,3,4,5,6,8,10,12,16,20,24}
Gap:         gap-{0,1,2,3,4,5,6,8,10,12}
Space:       space-x-{n} / space-y-{n}
Width:       w-{0,1,2,...,96,full,screen,auto}
Height:      h-{0,1,2,...,96,full,screen,auto}
Min/Max:     min-w-{0,full} / max-w-{sm,md,lg,xl,...}
```

---

*Last updated: 2026-02-05*
