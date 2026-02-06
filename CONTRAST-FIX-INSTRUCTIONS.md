# Contrast & Dark Mode Fix Instructions

> **Issue:** Text is nearly invisible and UI elements lack proper contrast in both light and dark modes throughout the CDD Onboarding Demo application.

---

## Table of Contents

1. [Problem Analysis](#problem-analysis)
2. [Root Causes](#root-causes)
3. [Fix 1: CSS Variables](#fix-1-css-variables-in-globalscss)
4. [Fix 2: Gradient Classes](#fix-2-dark-mode-gradient-classes)
5. [Fix 3: Component Standards](#fix-3-component-text-color-standards)
6. [Fix 4: Card & Surface Patterns](#fix-4-card--surface-styling-patterns)
7. [Fix 5: Search & Replace Guide](#fix-5-search--replace-guide)
8. [Fix 6: File-by-File Checklist](#fix-6-file-by-file-checklist)
9. [WCAG Contrast Requirements](#wcag-contrast-requirements)
10. [Testing Checklist](#testing-checklist)

---

## Problem Analysis

### Current State
- Text appears washed out or invisible against backgrounds
- Stat cards blend into page background
- Muted/secondary text fails accessibility standards
- Custom gradient backgrounds lack dark mode definitions
- Inconsistent color application across components

### Affected Areas
- AIC Dashboard (`/aic`)
- Auditor Dashboard (`/auditor`)
- All stat cards and metrics displays
- Sidebar navigation
- Form inputs and labels
- Tables and data displays
- Workflow stage indicators

---

## Root Causes

### 1. Low Contrast CSS Variables
The CSS variables defined in `globals.css` have insufficient contrast ratios:

| Variable | Current Value | Contrast Ratio | Status |
|----------|---------------|----------------|--------|
| `--text-primary` (dark) | `#E7E5E4` | 4.2:1 | ⚠️ Barely AA |
| `--text-secondary` (dark) | `#A8A29E` | 3.8:1 | ❌ Fails AA |
| `--text-muted` (dark) | `#78716C` | 2.5:1 | ❌ Fails all |
| `--text-muted` (light) | `#868fa3` | 3.2:1 | ❌ Fails AA |

### 2. Missing Dark Mode Gradients
Custom utility classes only define light mode:
- `.bg-soft-gradient` - No dark mode
- `.bg-cool-gradient` - No dark mode
- `.bg-warm-gradient` - No dark mode
- `.bg-sidebar-gradient` - No dark mode

### 3. Inconsistent Class Usage
Components mix CSS variable classes with Tailwind classes inconsistently:
```tsx
// Some components use CSS vars (broken)
<p className="text-text-primary">...</p>

// Others use Tailwind (working)
<p className="text-gray-900 dark:text-white">...</p>
```

---

## Fix 1: CSS Variables in globals.css

**File:** `src/app/globals.css`

### Light Mode Variables (`:root` selector, ~line 158)

Find the `:root` section and update these text color variables:

```css
:root {
  /* ============================================
     TEXT COLORS - HIGH CONTRAST (Light Mode)
     ============================================ */
  --text-primary: #111827;        /* gray-900 - Maximum contrast */
  --text-secondary: #374151;      /* gray-700 - High contrast */
  --text-muted: #4b5563;          /* gray-600 - Meets AA standard */
  --text-disabled: #9ca3af;       /* gray-400 - Intentionally low for disabled */

  /* ============================================
     SURFACE COLORS (Light Mode)
     ============================================ */
  --surface-primary: #ffffff;     /* Pure white */
  --surface-secondary: #f9fafb;   /* gray-50 */
  --surface-elevated: #ffffff;    /* Pure white for modals/popovers */
  --surface-sunken: #f3f4f6;      /* gray-100 for inset areas */

  /* ============================================
     BORDER COLORS (Light Mode)
     ============================================ */
  --border-default: #e5e7eb;      /* gray-200 - Visible but subtle */
  --border-strong: #d1d5db;       /* gray-300 - More prominent */
  --border-focus: #002E62;        /* Crowe Indigo Core for focus rings */

  /* ============================================
     SHADOWS (Light Mode)
     ============================================ */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
}
```

### Dark Mode Variables (`.dark` selector, ~line 323)

Find the `.dark` section and replace entirely:

```css
.dark {
  /* ============================================
     TEXT COLORS - HIGH CONTRAST (Dark Mode)
     Tested against Crowe Indigo backgrounds
     ============================================ */
  --text-primary: #ffffff;        /* Pure white - 15.3:1 on #011E41 */
  --text-secondary: #e2e8f0;      /* slate-200 - 11.2:1 contrast */
  --text-muted: #cbd5e1;          /* slate-300 - 8.1:1 contrast */
  --text-disabled: #64748b;       /* slate-500 - 4.6:1 (AA for large text) */

  /* ============================================
     SURFACE COLORS (Dark Mode)
     Using Crowe Indigo family
     ============================================ */
  --surface-primary: #020c1a;     /* Deeper than Crowe Indigo for base */
  --surface-secondary: #011E41;   /* Crowe Indigo Dark */
  --surface-elevated: #0c2d5a;    /* Lighter indigo for cards/modals */
  --surface-sunken: #010814;      /* Darkest for inset areas */

  /* ============================================
     BORDER COLORS (Dark Mode)
     White with opacity for consistency
     ============================================ */
  --border-default: rgba(255, 255, 255, 0.12);
  --border-strong: rgba(255, 255, 255, 0.20);
  --border-focus: #F5A800;        /* Crowe Amber for focus (high visibility) */

  /* ============================================
     SHADOWS (Dark Mode)
     Darker, more dramatic shadows
     ============================================ */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.3);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -4px rgba(0, 0, 0, 0.4);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 8px 10px -6px rgba(0, 0, 0, 0.5);

  /* ============================================
     SHADCN/UI OVERRIDES (Dark Mode)
     ============================================ */
  --background: 216 100% 6%;      /* #020c1a */
  --foreground: 0 0% 100%;        /* Pure white */

  --card: 215 97% 13%;            /* #011E41 - Crowe Indigo Dark */
  --card-foreground: 0 0% 100%;

  --popover: 215 80% 16%;         /* Slightly lighter for elevation */
  --popover-foreground: 0 0% 100%;

  --primary: 39 100% 48%;         /* Crowe Amber #F5A800 */
  --primary-foreground: 215 97% 13%;

  --secondary: 215 50% 25%;       /* Muted indigo */
  --secondary-foreground: 0 0% 100%;

  --muted: 215 50% 20%;
  --muted-foreground: 214 32% 75%; /* slate-300 equivalent */

  --accent: 39 100% 48%;          /* Crowe Amber */
  --accent-foreground: 215 97% 13%;

  --destructive: 0 84% 60%;       /* red-500 */
  --destructive-foreground: 0 0% 100%;

  --border: 215 50% 20%;
  --input: 215 50% 20%;
  --ring: 39 100% 48%;            /* Crowe Amber focus ring */
}
```

---

## Fix 2: Dark Mode Gradient Classes

**File:** `src/app/globals.css`
**Location:** Find the gradient utility classes (~line 509-536) and update:

```css
/* ============================================
   GRADIENT UTILITIES
   Light mode + Dark mode definitions
   ============================================ */

/* Page background gradient */
.bg-soft-gradient {
  background: linear-gradient(
    135deg,
    #ffffff 0%,
    #f8f5f2 25%,
    #faf8f6 50%,
    #f5f3f0 75%,
    #fefefe 100%
  );
}

.dark .bg-soft-gradient,
.dark.bg-soft-gradient {
  background: linear-gradient(
    135deg,
    #020c1a 0%,
    #011E41 25%,
    #0c2d5a 50%,
    #011E41 75%,
    #020c1a 100%
  );
}

/* Cool gradient - headers, role selector */
.bg-cool-gradient {
  background: linear-gradient(
    135deg,
    #f8fafc 0%,
    #f1f5f9 50%,
    #e2e8f0 100%
  );
}

.dark .bg-cool-gradient,
.dark.bg-cool-gradient {
  background: linear-gradient(
    135deg,
    #020c1a 0%,
    #0c2d5a 50%,
    #011E41 100%
  );
}

/* Warm gradient - accent areas */
.bg-warm-gradient {
  background: linear-gradient(
    135deg,
    #fffbf5 0%,
    #fff8ed 50%,
    #fff5e6 100%
  );
}

.dark .bg-warm-gradient,
.dark.bg-warm-gradient {
  background: linear-gradient(
    135deg,
    #0d0906 0%,
    #1a1006 50%,
    #261809 100%
  );
}

/* Sidebar gradient */
.bg-sidebar-gradient {
  background: linear-gradient(
    180deg,
    #ffffff 0%,
    #fafbfc 50%,
    #f5f6f8 100%
  );
}

.dark .bg-sidebar-gradient,
.dark.bg-sidebar-gradient {
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.08) 0%,
    rgba(255, 255, 255, 0.04) 50%,
    rgba(255, 255, 255, 0.02) 100%
  );
}

/* Grid pattern overlay */
.bg-grid-pattern {
  background-image:
    linear-gradient(to right, rgba(0, 0, 0, 0.03) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(0, 0, 0, 0.03) 1px, transparent 1px);
  background-size: 24px 24px;
}

.dark .bg-grid-pattern,
.dark.bg-grid-pattern {
  background-image:
    linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 24px 24px;
}
```

---

## Fix 3: Component Text Color Standards

### The Golden Rule
**NEVER** rely solely on CSS variables for text color. **ALWAYS** use explicit Tailwind classes with `dark:` variants.

### Standard Text Classes

| Purpose | Light Mode | Dark Mode | Combined Class |
|---------|------------|-----------|----------------|
| **Primary text** (headings, important) | `text-gray-900` | `dark:text-white` | `text-gray-900 dark:text-white` |
| **Secondary text** (descriptions) | `text-gray-700` | `dark:text-gray-200` | `text-gray-700 dark:text-gray-200` |
| **Muted text** (hints, metadata) | `text-gray-600` | `dark:text-gray-300` | `text-gray-600 dark:text-gray-300` |
| **Subtle text** (timestamps, less important) | `text-gray-500` | `dark:text-gray-400` | `text-gray-500 dark:text-gray-400` |
| **Disabled text** | `text-gray-400` | `dark:text-gray-500` | `text-gray-400 dark:text-gray-500` |
| **Links** | `text-crowe-indigo` | `dark:text-crowe-amber` | `text-crowe-indigo dark:text-crowe-amber` |

### Alternative: White with Opacity (Dark Mode)

For dark mode specifically, you can use white with opacity for a softer look:

| Purpose | Class |
|---------|-------|
| Primary | `text-gray-900 dark:text-white` |
| Secondary | `text-gray-700 dark:text-white/90` |
| Muted | `text-gray-600 dark:text-white/80` |
| Subtle | `text-gray-500 dark:text-white/70` |
| Disabled | `text-gray-400 dark:text-white/50` |

### Code Examples

```tsx
// Page heading
<h1 className="text-3xl font-bold text-gray-900 dark:text-white">
  AIC Dashboard
</h1>

// Subheading
<h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
  Recent Audit Runs
</h2>

// Body text
<p className="text-gray-700 dark:text-gray-200">
  Manage your engagements and track audit progress.
</p>

// Description/secondary text
<p className="text-gray-600 dark:text-gray-300">
  Your most recent audit runs will appear here.
</p>

// Muted/helper text
<span className="text-sm text-gray-500 dark:text-gray-400">
  Last updated 5 minutes ago
</span>

// Label
<label className="text-sm font-medium text-gray-700 dark:text-gray-200">
  Client Name
</label>

// Placeholder styling (via CSS or inline)
<input
  className="placeholder:text-gray-400 dark:placeholder:text-gray-500"
  placeholder="Enter client name"
/>
```

---

## Fix 4: Card & Surface Styling Patterns

### Standard Card

```tsx
<div className="
  bg-white dark:bg-white/[0.08]
  border border-gray-200 dark:border-white/[0.12]
  rounded-xl
  shadow-sm dark:shadow-lg dark:shadow-black/20
  p-6
">
  {/* Card header */}
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
      Card Title
    </h3>
    <span className="text-sm text-gray-500 dark:text-gray-400">
      Optional meta
    </span>
  </div>

  {/* Card content */}
  <p className="text-gray-600 dark:text-gray-300">
    Card description or content goes here.
  </p>
</div>
```

### Stat Card

```tsx
<div className="
  bg-white dark:bg-gradient-to-br dark:from-white/[0.10] dark:to-white/[0.05]
  border border-gray-200/80 dark:border-white/[0.15]
  rounded-xl
  shadow-md dark:shadow-xl dark:shadow-black/30
  p-6
  transition-all duration-200
  hover:shadow-lg dark:hover:shadow-2xl dark:hover:border-white/[0.20]
">
  {/* Icon or indicator */}
  <div className="w-10 h-10 rounded-lg bg-crowe-indigo/10 dark:bg-crowe-amber/20
                  flex items-center justify-center mb-4">
    <IconComponent className="w-5 h-5 text-crowe-indigo dark:text-crowe-amber" />
  </div>

  {/* Stat label */}
  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
    Total Audit Runs
  </p>

  {/* Stat value */}
  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
    24
  </p>

  {/* Stat change/description */}
  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
    <span className="text-green-600 dark:text-green-400">+12%</span> from last month
  </p>
</div>
```

### Elevated Surface (Modals, Popovers)

```tsx
<div className="
  bg-white dark:bg-[#0c2d5a]
  border border-gray-200 dark:border-white/[0.15]
  rounded-xl
  shadow-xl dark:shadow-2xl dark:shadow-black/40
">
  {/* Content */}
</div>
```

### Sidebar

```tsx
<aside className="
  w-64 h-screen
  bg-white/90 dark:bg-white/[0.05]
  backdrop-blur-xl
  border-r border-gray-200/80 dark:border-white/[0.10]
">
  {/* Nav items */}
  <nav className="p-4 space-y-1">
    {/* Active nav item */}
    <a className="
      flex items-center gap-3 px-3 py-2 rounded-lg
      bg-gray-100 dark:bg-white/[0.12]
      text-gray-900 dark:text-white
      font-medium
    ">
      <Icon className="w-5 h-5" />
      Dashboard
    </a>

    {/* Inactive nav item */}
    <a className="
      flex items-center gap-3 px-3 py-2 rounded-lg
      text-gray-600 dark:text-gray-300
      hover:bg-gray-50 dark:hover:bg-white/[0.08]
      hover:text-gray-900 dark:hover:text-white
      transition-colors
    ">
      <Icon className="w-5 h-5" />
      Settings
    </a>
  </nav>
</aside>
```

### Table

```tsx
<table className="w-full">
  <thead>
    <tr className="border-b border-gray-200 dark:border-white/[0.12]">
      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
        Column Header
      </th>
    </tr>
  </thead>
  <tbody>
    <tr className="border-b border-gray-100 dark:border-white/[0.08]
                   hover:bg-gray-50 dark:hover:bg-white/[0.04]">
      <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-200">
        Cell content
      </td>
    </tr>
  </tbody>
</table>
```

---

## Fix 5: Search & Replace Guide

Run these find-and-replace operations across the codebase:

### Text Color Classes

| Find | Replace With |
|------|--------------|
| `text-text-primary` | `text-gray-900 dark:text-white` |
| `text-text-secondary` | `text-gray-700 dark:text-gray-200` |
| `text-text-muted` | `text-gray-500 dark:text-gray-400` |
| `className="text-gray-900"` (without dark) | `className="text-gray-900 dark:text-white"` |
| `className="text-gray-700"` (without dark) | `className="text-gray-700 dark:text-gray-200"` |
| `className="text-gray-600"` (without dark) | `className="text-gray-600 dark:text-gray-300"` |
| `className="text-gray-500"` (without dark) | `className="text-gray-500 dark:text-gray-400"` |

### Surface/Background Classes

| Find | Replace With |
|------|--------------|
| `bg-surface-primary` | `bg-white dark:bg-white/[0.08]` |
| `bg-surface-secondary` | `bg-gray-50 dark:bg-white/[0.05]` |
| `bg-surface-elevated` | `bg-white dark:bg-[#0c2d5a]` |
| `className="bg-white"` (without dark) | `className="bg-white dark:bg-white/[0.08]"` |
| `className="bg-gray-50"` (without dark) | `className="bg-gray-50 dark:bg-white/[0.05]"` |

### Border Classes

| Find | Replace With |
|------|--------------|
| `border-border-default` | `border-gray-200 dark:border-white/[0.12]` |
| `border-border-strong` | `border-gray-300 dark:border-white/[0.20]` |
| `className="border-gray-200"` (without dark) | `className="border-gray-200 dark:border-white/[0.12]"` |

### Common Patterns

| Find | Replace With |
|------|--------------|
| `dark:text-white/60` | `dark:text-gray-400` (better readability) |
| `dark:text-white/70` | `dark:text-gray-300` (better readability) |
| `dark:bg-white/5` | `dark:bg-white/[0.08]` (more visible) |
| `dark:border-white/10` | `dark:border-white/[0.12]` (more visible) |

---

## Fix 6: File-by-File Checklist

### Priority 1: Core Styles
- [ ] `src/app/globals.css` - CSS variables (light mode)
- [ ] `src/app/globals.css` - CSS variables (dark mode)
- [ ] `src/app/globals.css` - Gradient utility classes

### Priority 2: Layouts
- [ ] `src/app/layout.tsx` - Root layout
- [ ] `src/app/aic/layout.tsx` - AIC portal layout
- [ ] `src/app/auditor/layout.tsx` - Auditor portal layout

### Priority 3: Sidebars
- [ ] `src/components/layout/aic-sidebar.tsx`
- [ ] `src/components/layout/auditor-sidebar.tsx`

### Priority 4: Dashboard Pages
- [ ] `src/app/aic/page.tsx` - AIC dashboard
- [ ] `src/app/auditor/page.tsx` - Auditor dashboard
- [ ] `src/app/page.tsx` - Role selector / landing

### Priority 5: UI Components
- [ ] `src/components/ui/card.tsx`
- [ ] `src/components/ui/button.tsx`
- [ ] `src/components/ui/input.tsx`
- [ ] `src/components/ui/table.tsx`
- [ ] `src/components/ui/dialog.tsx`
- [ ] `src/components/ui/dropdown-menu.tsx`
- [ ] `src/components/ui/select.tsx`
- [ ] `src/components/ui/badge.tsx`

### Priority 6: Feature Components
- [ ] All files in `src/components/features/`
- [ ] Any stat card components
- [ ] Any data table components
- [ ] Form components

### Priority 7: Remaining Pages
- [ ] All files in `src/app/aic/` subdirectories
- [ ] All files in `src/app/auditor/` subdirectories

---

## WCAG Contrast Requirements

### Minimum Ratios (WCAG 2.1 AA)

| Text Type | Minimum Ratio | Example Pass | Example Fail |
|-----------|---------------|--------------|--------------|
| Normal text (< 18px) | 4.5:1 | `#374151` on `#ffffff` (7.5:1) | `#9ca3af` on `#ffffff` (2.9:1) |
| Large text (≥ 18px bold or ≥ 24px) | 3:1 | `#6b7280` on `#ffffff` (5.0:1) | `#d1d5db` on `#ffffff` (1.8:1) |
| UI components & graphics | 3:1 | Border `#9ca3af` on `#ffffff` | Border `#e5e7eb` on `#ffffff` |

### Recommended Ratios (WCAG 2.1 AAA)

| Text Type | Recommended |
|-----------|-------------|
| Normal text | 7:1 |
| Large text | 4.5:1 |

### Testing Tools

- **Browser DevTools:** Chrome/Edge DevTools > Elements > Styles > Color contrast indicator
- **WebAIM Contrast Checker:** https://webaim.org/resources/contrastchecker/
- **Stark (Figma/Sketch):** Browser extension for design tools
- **axe DevTools:** Browser extension for accessibility auditing

---

## Testing Checklist

### Visual Testing

- [ ] Toggle between light and dark mode on every page
- [ ] Verify all text is clearly readable
- [ ] Verify all cards are distinguishable from background
- [ ] Verify all borders are visible
- [ ] Verify all icons have sufficient contrast
- [ ] Verify all buttons are clearly visible
- [ ] Verify all form inputs are clearly visible
- [ ] Verify all hover/focus states are visible

### Automated Testing

```bash
# Install axe-core for automated accessibility testing
npm install -D @axe-core/react

# Or use axe DevTools browser extension
```

### Manual Contrast Checks

For each text/background combination, verify:

| Page | Element | Light Mode | Dark Mode |
|------|---------|------------|-----------|
| AIC Dashboard | Page title | ✓ / ✗ | ✓ / ✗ |
| AIC Dashboard | Stat card labels | ✓ / ✗ | ✓ / ✗ |
| AIC Dashboard | Stat card values | ✓ / ✗ | ✓ / ✗ |
| AIC Dashboard | Sidebar nav items | ✓ / ✗ | ✓ / ✗ |
| AIC Dashboard | Card descriptions | ✓ / ✗ | ✓ / ✗ |
| Auditor Dashboard | (same checks) | ✓ / ✗ | ✓ / ✗ |

---

## Quick Reference Card

### Text Classes

```
Primary:   text-gray-900 dark:text-white
Secondary: text-gray-700 dark:text-gray-200
Muted:     text-gray-600 dark:text-gray-300
Subtle:    text-gray-500 dark:text-gray-400
```

### Surface Classes

```
Card:      bg-white dark:bg-white/[0.08] border border-gray-200 dark:border-white/[0.12]
Elevated:  bg-white dark:bg-[#0c2d5a] shadow-xl dark:shadow-2xl
Sidebar:   bg-white/90 dark:bg-white/[0.05] backdrop-blur-xl
```

### Shadow Classes

```
Subtle:    shadow-sm dark:shadow-md dark:shadow-black/20
Normal:    shadow-md dark:shadow-lg dark:shadow-black/25
Prominent: shadow-lg dark:shadow-xl dark:shadow-black/30
```

---

## Notes

- Always test changes in both light AND dark mode
- Use browser DevTools to check contrast ratios
- The Crowe brand colors (Indigo #011E41, Amber #F5A800) should remain consistent
- When in doubt, increase contrast - readability > aesthetics
- Document any intentional low-contrast elements (e.g., disabled states)

---

*Last updated: 2026-02-06*
*Issue: Contrast problems in light and dark modes*
