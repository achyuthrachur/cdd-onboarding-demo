# Fix Plan: Dialog/Modal Light Mode Visibility (2026-02-08)

## CRITICAL INSTRUCTION FOR CLAUDE CODE

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  FIX THIS SINGLE FILE. TEST IN BOTH LIGHT AND DARK MODE.                    ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## Issue

The "Publish Workbooks to Auditors" modal (and all dialogs) appear with:
- Grayish/murky background in light mode (should be clean white)
- Text barely visible in light mode (uses white text)
- Overall "dirty" appearance instead of crisp, professional look

---

## Root Cause

**File:** `src/components/ui/dialog.tsx`

The DialogContent component (lines 86-93) uses dark-mode-only styling:

```tsx
className={cn(
  "fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 p-6 outline-none sm:max-w-lg",
  "bg-white/10 backdrop-blur-2xl rounded-2xl",     // ← 10% white = grayish
  "border border-white/20",                         // ← white border invisible
  "shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]",
  "text-white",                                     // ← white text invisible in light mode
  className
)}
```

Also DialogDescription (line 170):
```tsx
className={cn("text-white/80 text-sm", className)}  // ← white text
```

---

## The Fix

### Change 1: DialogContent (lines 86-93)

**FROM:**
```tsx
className={cn(
  // Liquid glass dialog
  "fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 p-6 outline-none sm:max-w-lg",
  "bg-white/10 backdrop-blur-2xl rounded-2xl",
  "border border-white/20",
  "shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]",
  "text-white",
  className
)}
```

**TO:**
```tsx
className={cn(
  // Dialog with light/dark mode support
  "fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 p-6 outline-none sm:max-w-lg",
  "bg-white dark:bg-white/10 backdrop-blur-2xl rounded-2xl",
  "border border-gray-200 dark:border-white/20",
  "shadow-lg dark:shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]",
  "text-gray-900 dark:text-white",
  className
)}
```

### Change 2: DialogClose button (line 100)

**FROM:**
```tsx
className="absolute top-4 right-4 rounded-lg p-1 text-white/80 transition-all hover:text-white hover:bg-white/10 focus:ring-2 focus:ring-white/30 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
```

**TO:**
```tsx
className="absolute top-4 right-4 rounded-lg p-1 text-gray-500 dark:text-white/80 transition-all hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 focus:ring-2 focus:ring-gray-300 dark:focus:ring-white/30 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
```

### Change 3: DialogDescription (line 170)

**FROM:**
```tsx
className={cn("text-white/80 text-sm", className)}
```

**TO:**
```tsx
className={cn("text-gray-600 dark:text-white/80 text-sm", className)}
```

---

## Summary of Changes

| Line | Element | Change |
|------|---------|--------|
| 89 | Background | `bg-white/10` → `bg-white dark:bg-white/10` |
| 90 | Border | `border-white/20` → `border-gray-200 dark:border-white/20` |
| 91 | Shadow | Add `shadow-lg` for light mode |
| 92 | Text | `text-white` → `text-gray-900 dark:text-white` |
| 100 | Close button | Add light mode text/hover colors |
| 170 | Description | `text-white/80` → `text-gray-600 dark:text-white/80` |

---

## Verification

After making changes:

- [ ] Open any dialog in **light mode**
  - [ ] Background is clean white (not grayish)
  - [ ] All text is readable (dark text on white)
  - [ ] Border is visible but subtle
  - [ ] Close (X) button visible and works

- [ ] Open any dialog in **dark mode**
  - [ ] Background has glass effect (slightly transparent)
  - [ ] All text is white and readable
  - [ ] Border is subtle white
  - [ ] Close (X) button visible and works

- [ ] Test specifically with "Publish Workbooks to Auditors" modal
  - [ ] Title readable in both modes
  - [ ] Subtitle readable in both modes
  - [ ] Stats cards visible in both modes
  - [ ] Warning banner visible in both modes
  - [ ] Buttons work in both modes

---

## File Reference

**Single file to modify:** `src/components/ui/dialog.tsx`

| Line | Current | Fix |
|------|---------|-----|
| 89 | `bg-white/10` | Add `bg-white dark:` prefix |
| 90 | `border-white/20` | Add `border-gray-200 dark:` prefix |
| 91 | Complex shadow | Add `shadow-lg dark:` prefix |
| 92 | `text-white` | Change to `text-gray-900 dark:text-white` |
| 100 | Close button styles | Add light mode variants |
| 170 | `text-white/80` | Change to `text-gray-600 dark:text-white/80` |
