# CSS Remediation Plan — CDD Onboarding Demo

> Generated: 2026-02-07 | Based on 4 parallel agent investigations

---

## Executive Summary

The CSS restructuring (commit `f108489`) successfully moved all custom CSS into `@layer base`, and the production CSS now contains all 59 classes/variables (verified). **However, the site looks unchanged because of three deeper issues:**

1. **91% of custom CSS classes are dead code** — never referenced by any component
2. **Wrong CSS layer** — component-style classes are in `@layer base` (lowest priority) instead of `@layer components`
3. **Components explicitly override gradient dark mode** — layouts set `dark:bg-crowe-indigo-dark` which beats the dark gradient variants via Tailwind utility specificity

---

## Issue 1: Dead CSS — 51 of 56 Custom Classes Are Unused

### Only 5 classes are actually referenced in the codebase:

| Class | Used In | Context |
|-------|---------|---------|
| `bg-soft-gradient` | `aic/layout.tsx`, `auditor/layout.tsx` | Portal background (3 instances) |
| `bg-cool-gradient` | `role-selector.tsx` | Landing page background (1 instance) |
| `scrollbar-thin` | `ui/scrollable-table.tsx` | Table scrollbar styling (1 instance) |
| `scroll-always` | `ui/scrollable-table.tsx` | Force-show scrollbars (1 instance) |
| `stat-card` | `charts/index.ts` | Module export only (not CSS class usage) |

### Completely unused (51 classes):

**Background utilities:** `bg-page`, `bg-section-light`, `bg-section-warm`, `bg-section-indigo-wash`, `bg-section-amber-wash`, `bg-crowe-clean`, `bg-crowe-subtle`, `bg-crowe-brand`, `bg-warm-gradient`, `bg-sidebar-gradient`, `bg-grid-pattern`, `bg-grid`, `bg-paper`, `bg-glass`, `bg-dots`

**Theme-aware utilities:** `bg-card-glass`, `border-card-glass`, `text-heading`, `text-body`, `text-secondary`, `text-muted`

**Layout:** `page-container`, `card-grid`, `stat-grid`, `form-grid`, `scroll-container`, `scrollbar-hide`, `container-narrow`, `container-wide`, `container-full`

**Cards/badges:** `card-sm`, `card-md`, `card-lg`, `card-glass`, `card-glass-elevated`, `badge-sm`, `badge-md`, `badge-lg`, `stat-value`, `stat-label`, `stat-description`

**Spacing:** `touch-target`, `space-section`, `space-card`

**Grids:** `grid-cards-2`, `grid-cards-3`, `grid-cards-4`

**Animations:** `animate-fade-in-up`, `animate-amber-pulse`, `stagger-children`, `card-hover-lift`, `card-hover-subtle`

### Remediation

**Option A (Recommended):** Remove all 51 unused classes. They bloat the CSS and create confusion about what's actually styling the app. Keep only the 5 that are used.

**Option B:** Keep them as a design system library and start migrating components to use them instead of inline Tailwind classes.

---

## Issue 2: Wrong CSS Layer — `@layer base` vs `@layer components`

### The Problem

All custom utility/component classes are inside `@layer base`. In Tailwind CSS v4's cascade layer system:

```
@layer base       ← LOWEST priority (element resets, :root variables)
@layer components ← MEDIUM priority (reusable component classes)
@layer utilities  ← HIGHEST priority (Tailwind's utility classes)
```

When a component has:
```html
<div class="bg-soft-gradient dark:bg-crowe-indigo-dark">
```

The `dark:bg-crowe-indigo-dark` is a Tailwind utility (`@layer utilities`), which **always beats** `@layer base`. So even though `globals.css` defines:
```css
@layer base {
  .dark .bg-soft-gradient {
    background: linear-gradient(135deg, #020c1a, #011E41, #0c2d5a, ...);
  }
}
```

...it's overridden by the utility class.

### Investigation Detail

Agent 2 examined the compiled dev CSS (`.next/dev/static/chunks/src_app_globals_*.css`) and found that Tailwind v4 is extracting custom class definitions from `@layer base` and placing them **outside all layers** in the compiled output (starting around line 6275). Unlayered styles beat layered styles in the CSS cascade, but Tailwind's utilities still win due to source order and specificity.

### Remediation

**Step 1:** Split `globals.css` into three sections:
```css
@layer base {
  /* ONLY :root variables, .dark variables, and element resets (*, body) */
}

@layer components {
  /* ALL custom reusable classes: .bg-soft-gradient, .card-glass, etc. */
}

/* @layer utilities is managed by Tailwind automatically */
```

**Step 2:** This gives custom classes proper specificity:
- They'll beat base styles (good)
- Tailwind utilities can still override them with `dark:` variants (expected)
- The cascade order becomes predictable

---

## Issue 3: Components Override Dark Gradient Variants

### The Problem

The custom CSS defines beautiful dark mode gradients:
```css
.dark .bg-soft-gradient {
  background: linear-gradient(135deg, #020c1a 0%, #011E41 25%, #0c2d5a 50%, ...);
}
```

But the components **never use them** because they explicitly set a solid dark override:
```tsx
// aic/layout.tsx
<div className="bg-soft-gradient dark:bg-crowe-indigo-dark">
//                                ^^^^^^^^^^^^^^^^^^^^^^^^
//                                This Tailwind utility WINS over
//                                the .dark .bg-soft-gradient rule
```

The same pattern appears in:
- `src/app/aic/layout.tsx` (3 instances)
- `src/app/auditor/layout.tsx` (3 instances)
- `src/components/auth/role-selector.tsx` (1 instance — `bg-cool-gradient dark:bg-crowe-indigo-dark`)

### What the user sees

- **Default theme = dark** (set in `layout.tsx` ThemeProvider)
- Every page shows solid `#011E41` (Crowe Indigo Dark)
- The subtle dark gradients defined in CSS are never rendered
- Switching to light mode would show the light gradients, but dark is the default

### Remediation

**Option A (Use the gradients):** Remove the `dark:bg-crowe-indigo-dark` overrides from layouts. The `.dark .bg-soft-gradient` and `.dark .bg-cool-gradient` rules will then apply, showing the dark navy gradients instead of a flat solid color.

```tsx
// BEFORE:
<div className="bg-soft-gradient dark:bg-crowe-indigo-dark">

// AFTER (let CSS handle dark mode):
<div className="bg-soft-gradient">
```

**Option B (Keep solid dark):** If the flat Crowe Indigo Dark look is intentional, remove the unused dark gradient definitions from CSS to reduce confusion.

---

## Issue 4: CSS Variables — Potential Duplication with @theme inline

### The Problem

Some CSS variables are defined in BOTH `@theme inline` and `@layer base :root`:

- `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-xl`, `--shadow-hover` — defined in both
- `--radius-sm`, `--radius-md`, etc. — defined in both (via @theme inline only, but the `:root` has `--radius`)

The `@theme inline` values are used by Tailwind's utility class generator (e.g., `shadow-sm` maps to `--shadow-sm`). The `:root` values are used by `var(--shadow-sm)` references in custom CSS. If they diverge, behavior becomes unpredictable.

### Remediation

Audit and consolidate: ensure `@theme inline` shadow/radius values match `:root` values, or remove duplicates and reference consistently.

---

## Recommended Remediation Steps (Priority Order)

### Step 1: Fix the layer structure (HIGH IMPACT)
Move custom component classes from `@layer base` to `@layer components`.

```
globals.css structure:
  @import "tailwindcss";
  @import "tw-animate-css";
  @custom-variant dark (...);
  @theme inline { ... }          ← Tailwind tokens (unchanged)
  @layer base { :root, .dark, *, body }  ← Variables & resets ONLY
  @layer components { ... }      ← All custom classes (.bg-soft-gradient, etc.)
```

### Step 2: Fix dark mode gradient overrides (HIGH IMPACT)
Remove `dark:bg-crowe-indigo-dark` from layout components so the dark gradient variants actually render. Files:
- `src/app/aic/layout.tsx`
- `src/app/auditor/layout.tsx`
- `src/components/auth/role-selector.tsx`

### Step 3: Remove dead CSS (MEDIUM IMPACT)
Delete the 51 unused custom classes to reduce bloat and confusion. Keep only:
- `bg-soft-gradient` (+ dark variant)
- `bg-cool-gradient` (+ dark variant)
- `scrollbar-thin`
- `scroll-always`

Or: begin adopting them in components if they're intended for use.

### Step 4: Consolidate shadow/radius tokens (LOW IMPACT)
Remove duplicate definitions between `@theme inline` and `:root` block.

### Step 5: Add visual verification infrastructure (DONE)
- `/api/build-info` endpoint ✅
- Footer version stamp ✅

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/app/globals.css` | Split `@layer base` → `@layer base` + `@layer components`; optionally remove dead CSS |
| `src/app/aic/layout.tsx` | Remove `dark:bg-crowe-indigo-dark` overrides (3 places) |
| `src/app/auditor/layout.tsx` | Remove `dark:bg-crowe-indigo-dark` overrides (3 places) |
| `src/components/auth/role-selector.tsx` | Remove `dark:bg-crowe-indigo-dark` override (1 place) |

---

## Verification Checklist

After remediation, verify:

- [ ] `npm run build` passes
- [ ] `/api/build-info` shows new build timestamp
- [ ] Production CSS contains `.bg-soft-gradient` inside `@layer components` (not `@layer base`)
- [ ] Landing page (`/`) shows gradient background in both light AND dark modes
- [ ] AIC dashboard (`/aic`) shows gradient background in dark mode (not flat solid color)
- [ ] Auditor dashboard (`/auditor`) shows gradient background in dark mode
- [ ] Sidebar glassmorphism renders correctly
- [ ] Light mode toggle shows warm off-white gradients
- [ ] Hard refresh (Ctrl+Shift+R) shows changes immediately
- [ ] CSS file hash in `<link>` tag differs from previous deployment

---

## Root Cause Summary

The CSS restructuring was technically correct (all classes now survive production builds), but **no visual change occurred** because:

1. The default theme is dark mode
2. Every component that uses a gradient class also has `dark:bg-crowe-indigo-dark` which overrides it
3. Most custom CSS classes (91%) are defined but never referenced by any component
4. The `@layer base` placement gives custom classes the lowest priority in the cascade

The fix requires both CSS-level changes (correct layer) AND component-level changes (remove overrides).
