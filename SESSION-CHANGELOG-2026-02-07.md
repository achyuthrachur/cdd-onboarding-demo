# Session Changelog — 2026-02-07

> **Session Duration:** Full day
> **Commits:** 6 commits (`f108489` → `f211bce`)
> **Production URL:** https://cdd-onboarding-demo.vercel.app
> **Final Deploy:** v1.4 | Deploy: 2026-02-07-D | Build ID: `h3qfg4cn`

---

## Commit 1: `f108489` — Move ALL custom CSS into @layer base

**Problem:** Tailwind CSS v4 silently strips any CSS outside `@layer` blocks from production builds. ~520 lines of custom utilities were missing in production.

**Changes to `src/app/globals.css`:**
- Deleted duplicate standalone `:root` block (was outside `@layer base`)
- Deleted duplicate standalone `.dark` block (was outside `@layer base`)
- Merged unique variables (`--crowe-*`, `--tint-*`, `--space-*`, `--z-*`, `--duration-*`, `--ease-*`) into `@layer base :root`
- Moved all custom utility classes (backgrounds, gradients, layout, cards, animations, scrollbars) into `@layer base`
- File structure: `@theme inline {}` + `@layer base {}` only

**Result:** All 59 CSS classes/variables now present in production CSS (verified via WebFetch audit).

---

## Commit 2: `72b642c` — Add deployment canary

**Problem:** No way to verify deployments were actually going through. User reported changes weren't visible despite deploys.

**New file: `src/app/api/build-info/route.ts`**
- Returns `buildTimestamp`, `buildId`, `commit`, `commitMessage`, `deploymentUrl`
- Values baked in at BUILD TIME so each deployment has a unique fingerprint

**Modified: `src/components/auth/role-selector.tsx`**
- Footer updated to show version + deploy tag (e.g., "v1.4 | Deploy: 2026-02-07-D")

**Result:** Can now verify deployments via `/api/build-info` JSON or footer text.

---

## Commit 3: `d989082` — Complete CSS remediation (correct layer, remove overrides, prune dead CSS)

**Root causes found by 4 parallel investigation agents:**

1. **Wrong CSS layer:** Custom component classes were in `@layer base` (lowest priority). Tailwind utilities always won.
2. **Dark mode overrides:** Every component using `bg-soft-gradient` also had `dark:bg-crowe-indigo-dark` which overrode the gradient.
3. **Dead CSS:** 51 of 56 custom classes were never referenced by any component.

**Changes to `src/app/globals.css`:**
- Split into `@layer base` (variables/resets ONLY) + `@layer components` (custom classes)
- Removed 51 unused custom classes (91% dead code)
- Kept only 5 active classes: `bg-soft-gradient`, `bg-cool-gradient`, `scrollbar-thin`, `scroll-always`, keyframes
- File reduced from 867 → 442 lines (49% reduction)

**Changes to `src/app/aic/layout.tsx`:**
- Removed `dark:bg-crowe-indigo-dark` from 3 places so dark gradient variants render

**Changes to `src/app/auditor/layout.tsx`:**
- Removed `dark:bg-crowe-indigo-dark` from 3 places

**Changes to `src/components/auth/role-selector.tsx`:**
- Removed `dark:bg-crowe-indigo-dark` from landing page background

**Result:** Dark mode now shows navy gradients instead of flat solid color. CSS file hash changed confirming different output.

---

## Commit 4: `4259e3c` — Table light mode support + hardcoded teal buttons

**Problem:** `table.tsx` was hardcoded for dark-only (`text-white`, `bg-white/5`, `border-white/10` with zero light mode classes). All table content invisible on white backgrounds.

**Changes to `src/components/ui/table.tsx` (fixes UI-FIXES Issues 1, 3, 10):**

| Component | Before (dark-only) | After (light + dark) |
|-----------|--------------------|-----------------------|
| TableHeader | `bg-white/5 border-white/10` | `bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10` |
| TableBody | `text-white` | `text-gray-900 dark:text-white` |
| TableFooter | `text-white bg-white/5` | `text-gray-900 dark:text-white bg-gray-50 dark:bg-white/5` |
| TableRow | `hover:bg-white/5 border-white/10` | `hover:bg-gray-50 dark:hover:bg-white/5 border-gray-200 dark:border-white/10` |
| TableHead | `text-white` | `text-gray-700 dark:text-gray-200` |
| TableCell | (no text color) | `text-gray-900 dark:text-white` |
| TableCaption | `text-white/80` | `text-gray-500 dark:text-white/80` |

**Changes to `src/app/auditor/workbooks/[id]/page.tsx` (fixes UI-FIXES Issue 2):**
- Line 725: `bg-teal-600 hover:bg-teal-700` → `bg-crowe-teal hover:bg-crowe-teal-dark text-white`
- Line 1170: Same fix

**Result:** Tables visible in light mode. Auditor submit buttons use Crowe brand colors.

---

## Commit 5: `f211bce` — App-level data init, Clear Demo Data buttons, layout utilities

**Closes remaining gaps from PROJECT-PLAN-FIXES.md Issues 1 & 7.**

**New file: `src/components/stage-data-initializer.tsx`**
- Client component that calls `loadStageInputsFromStorage()` on mount via `useEffect`
- Loads only INPUT data (population, procedures) — NOT outputs
- Renders `null` (invisible component)

**Modified: `src/app/layout.tsx`**
- Imports and renders `<StageDataInitializer />` inside ThemeProvider

**Modified: `src/app/aic/audit-runs/[id]/stage-1/page.tsx`**
- Added `clearStageOutputs` import
- Added `handleClearDemoData()` — calls `clearStageOutputs(1)`, resets assessment state
- Added "Clear Demo Data" ghost button (shows only when results exist)

**Modified: `src/app/aic/audit-runs/[id]/stage-2/page.tsx`**
- Same pattern: `clearStageOutputs(2)`, resets sample/plan/config/lock state

**Modified: `src/app/aic/audit-runs/[id]/stage-3/page.tsx`**
- Same pattern: `clearStageOutputs(3)`, resets extraction result, switches to chat view

**Modified: `src/app/aic/audit-runs/[id]/stage-4/page.tsx`**
- Same pattern: `clearStageOutputs(4)`, resets sampling/attributes/docs state

**Modified: `src/app/globals.css`**
- Added `.page-container`, `.card-grid`, `.stat-grid`, `.form-grid` to `@layer components`
- Plain CSS with responsive media queries (no `@apply` to avoid layer issues)

---

## Files Created This Session

| File | Purpose |
|------|---------|
| `src/app/api/build-info/route.ts` | Deployment canary endpoint |
| `src/components/stage-data-initializer.tsx` | App-level INPUT data loader |
| `CSS-REMEDIATION-PLAN.md` | Investigation findings and remediation plan |

## Files Modified This Session

| File | Changes |
|------|---------|
| `src/app/globals.css` | Restructured 3 times: all-in-base → base+components split → added layout utilities |
| `src/app/layout.tsx` | Added StageDataInitializer |
| `src/app/aic/layout.tsx` | Removed `dark:bg-crowe-indigo-dark` overrides |
| `src/app/auditor/layout.tsx` | Removed `dark:bg-crowe-indigo-dark` overrides |
| `src/components/auth/role-selector.tsx` | Removed dark override, updated version canary 4 times |
| `src/components/ui/table.tsx` | Added light mode support to all 7 sub-components |
| `src/app/auditor/workbooks/[id]/page.tsx` | Fixed 2 hardcoded teal buttons |
| `src/app/aic/audit-runs/[id]/stage-1/page.tsx` | Added clear demo data |
| `src/app/aic/audit-runs/[id]/stage-2/page.tsx` | Added clear demo data |
| `src/app/aic/audit-runs/[id]/stage-3/page.tsx` | Added clear demo data |
| `src/app/aic/audit-runs/[id]/stage-4/page.tsx` | Added clear demo data |

## Issues Addressed

### From CSS-REMEDIATION-PLAN.md
- [x] Wrong CSS layer (`@layer base` → `@layer components`)
- [x] Dark mode gradient overrides removed from 7 places
- [x] 51 dead CSS classes pruned

### From UI-FIXES-DETAILED.md
- [x] Issue 1: White text on light backgrounds (table.tsx fix)
- [x] Issue 2: Transparent/invisible buttons (button.tsx already done + teal fix)
- [x] Issue 3: Missing content in light mode (table.tsx fix)
- [x] Issue 8: Horizontal scroll (ScrollableTable already existed)
- [x] Issue 9: Dynamic resizing (ResponsiveGrid already existed)
- [x] Issue 10: Attribute table visibility (tabs.tsx already done + table fix)

### From PROJECT-PLAN-FIXES.md
- [x] Issue 1: Stage Data Loading Architecture (app init + clear buttons)
- [x] Issue 2: Contrast & Visibility (CSS variables + table fix)
- [x] Issue 3: Button Transparency (already done)
- [x] Issue 4: OpenAI API Key Integration (already done)
- [x] Issue 5: Auditor Entity Selection (already done)
- [x] Issue 6: Cross-Portal Data Persistence (already done)
- [x] Issue 7: UI Sizing & Layout (layout utility classes restored)

---

*Session completed: 2026-02-07*
*Total commits: 6*
*Total files changed: 14 (2 new, 12 modified)*
