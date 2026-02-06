# Bug Fixes & Theme Implementation Guide

> **Purpose:** Fix console errors, improve text contrast, and implement light/dark mode toggle.

---

## 1. Console Errors - Root Causes & Fixes

### Error 1: `/api/documents` - 500 Error
**Cause:** The API is being called without proper error handling or the auditRunId is missing.

**Files to Check:**
- `src/app/api/documents/route.ts` - The API route itself
- Components calling `/api/documents`

**Fix:** Add try-catch and validate parameters before processing.

### Error 2: `/api/sampling` - 404 Error
**Cause:** The endpoint exists but may be called with wrong HTTP method or missing route.

**Files to Check:**
- `src/app/api/sampling/route.ts` ✓ (exists)
- Check if the call is using GET with required `auditRunId` param

**Fix:** Ensure all calls include required parameters.

### Error 3: `/api/workbooks` - 400 Error
**Cause:** The API expects `auditRunId` parameter but it's not being sent.

**Location:** Line 36-41 in `src/app/api/workbooks/route.ts`:
```typescript
if (!auditRunId) {
  return NextResponse.json(
    { error: "auditRunId is required" },
    { status: 400 }
  );
}
```

**Fix:** Ensure components calling this API include the auditRunId.

### Error 4: `Select.Item` Empty Value Error
**Cause:** Line 196 in `src/app/auditor/workbooks/[id]/page.tsx`:
```tsx
<SelectItem value="" className="text-white/50 text-xs">
  Select...
</SelectItem>
```

Radix UI Select does not allow empty string values for SelectItem.

**Fix:** Change to a non-empty placeholder value:
```tsx
// BEFORE
<SelectItem value="" className="text-white/50 text-xs">
  Select...
</SelectItem>

// AFTER - Option 1: Remove the empty option entirely (use placeholder instead)
// Just remove lines 195-198

// AFTER - Option 2: Use a special placeholder value
<SelectItem value="__placeholder__" className="text-white/50 text-xs" disabled>
  Select...
</SelectItem>

// AND update the Select to treat this as unselected:
<Select
  value={selectedDoc || undefined}  // Use undefined instead of empty string
  onValueChange={(value) => value !== '__placeholder__' && handleChange(value)}
  disabled={isSubmitted}
>
```

**Best Fix:** Remove the empty SelectItem entirely and rely on the `placeholder` prop:
```tsx
<Select
  value={selectedDoc || undefined}
  onValueChange={handleChange}
  disabled={isSubmitted}
>
  <SelectTrigger>
    <SelectValue placeholder="Select document..." />
  </SelectTrigger>
  {/* Remove the empty SelectItem - the placeholder handles this */}
</Select>
```

---

## 2. Text Contrast Audit & Fixes

### Problem Areas Identified

Many components use low-contrast text classes:
- `text-white/40` - Too faint (only 40% opacity)
- `text-white/50` - Still difficult to read
- `text-muted-foreground` - Often too dark on dark backgrounds

### Minimum Contrast Requirements (WCAG AA)

| Text Type | Minimum Ratio | Recommendation |
|-----------|---------------|----------------|
| Body text | 4.5:1 | Use `text-white/80` or higher |
| Large text (18px+) | 3:1 | Use `text-white/70` or higher |
| UI components | 3:1 | Use `text-white/70` or higher |
| Decorative | N/A | Can use lower opacity |

### Global Find & Replace Patterns

Run these replacements across all `.tsx` files in `src/`:

```
SEARCH: text-white/40
REPLACE: text-white/60

SEARCH: text-white/50
REPLACE: text-white/70

SEARCH: text-muted-foreground
REPLACE: text-gray-400 dark:text-white/70
```

### Files Requiring Manual Review

1. **`src/app/auditor/workbooks/[id]/page.tsx`**
   - Line 251: `text-white/50` → `text-white/70`
   - Line 745: `text-white/50` → `text-white/70`
   - Line 793: `text-white/50` → `text-white/70`
   - Line 940: `text-white/40` → `text-white/60`

2. **All Card components** - Check `CardDescription` text colors

3. **Badge components** - Ensure sufficient contrast

4. **Table headers** - `text-white/70` should be `text-white/80`

---

## 3. Light/Dark Mode Toggle Implementation

### Step 1: Install next-themes

```bash
npm install next-themes
```

### Step 2: Create Theme Provider

**Create `src/components/theme-provider.tsx`:**
```tsx
"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
```

### Step 3: Create Theme Toggle Component

**Create `src/components/theme-toggle.tsx`:**
```tsx
"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-white dark:bg-crowe-indigo-dark border-gray-200 dark:border-white/20">
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className="text-gray-900 dark:text-white"
        >
          <Sun className="mr-2 h-4 w-4" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className="text-gray-900 dark:text-white"
        >
          <Moon className="mr-2 h-4 w-4" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className="text-gray-900 dark:text-white"
        >
          <span className="mr-2">💻</span>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### Step 4: Update Root Layout

**Modify `src/app/layout.tsx`:**
```tsx
import { ThemeProvider } from "@/components/theme-provider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(/* existing classes */)}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### Step 5: Update globals.css with Light Theme

**Add to `src/app/globals.css`:**
```css
@layer base {
  /* ═══════════════════════════════════════════════════════════════
     LIGHT THEME
     ═══════════════════════════════════════════════════════════════ */
  :root {
    --background: 0 0% 100%;
    --foreground: 215 100% 13%;

    --card: 0 0% 100%;
    --card-foreground: 215 100% 13%;

    --popover: 0 0% 100%;
    --popover-foreground: 215 100% 13%;

    --primary: 215 100% 13%;
    --primary-foreground: 0 0% 100%;

    --secondary: 39 100% 48%;
    --secondary-foreground: 215 100% 13%;

    --muted: 0 0% 96%;
    --muted-foreground: 0 0% 40%;

    --accent: 39 100% 48%;
    --accent-foreground: 215 100% 13%;

    --destructive: 341 79% 56%;
    --destructive-foreground: 0 0% 100%;

    --border: 0 0% 88%;
    --input: 0 0% 88%;
    --ring: 215 100% 19%;
  }

  /* ═══════════════════════════════════════════════════════════════
     DARK THEME
     ═══════════════════════════════════════════════════════════════ */
  .dark {
    --background: 215 100% 13%;
    --foreground: 0 0% 100%;

    --card: 215 97% 10%;
    --card-foreground: 0 0% 100%;

    --popover: 215 97% 10%;
    --popover-foreground: 0 0% 100%;

    --primary: 39 100% 48%;
    --primary-foreground: 215 100% 13%;

    --secondary: 215 100% 19%;
    --secondary-foreground: 0 0% 100%;

    --muted: 215 50% 20%;
    --muted-foreground: 0 0% 70%;

    --accent: 39 100% 48%;
    --accent-foreground: 215 100% 13%;

    --destructive: 341 79% 56%;
    --destructive-foreground: 0 0% 100%;

    --border: 0 0% 100% / 0.1;
    --input: 0 0% 100% / 0.1;
    --ring: 39 100% 48%;
  }
}

/* Light mode body background */
body {
  @apply bg-white text-crowe-indigo-dark;
}

.dark body {
  @apply bg-crowe-indigo-dark text-white;
}
```

### Step 6: Update Component Classes for Dual Theme Support

**Pattern to follow for all components:**

```tsx
// BEFORE (dark mode only)
<Card className="bg-white/10 border-white/20 text-white">

// AFTER (supports both themes)
<Card className="bg-white dark:bg-white/10 border-gray-200 dark:border-white/20 text-gray-900 dark:text-white">
```

**Common class conversions:**

| Dark Only | Light + Dark |
|-----------|--------------|
| `bg-white/10` | `bg-gray-50 dark:bg-white/10` |
| `bg-white/5` | `bg-gray-100 dark:bg-white/5` |
| `border-white/20` | `border-gray-200 dark:border-white/20` |
| `text-white` | `text-gray-900 dark:text-white` |
| `text-white/70` | `text-gray-600 dark:text-white/70` |
| `text-white/50` | `text-gray-500 dark:text-white/50` |
| `bg-crowe-indigo-dark` | `bg-white dark:bg-crowe-indigo-dark` |

### Step 7: Add Theme Toggle to Sidebar/Header

**In `src/components/layout/aic-sidebar.tsx` and `auditor-sidebar.tsx`:**
```tsx
import { ThemeToggle } from "@/components/theme-toggle";

// Add near the bottom of the sidebar, before user info:
<div className="flex items-center justify-between px-3 py-2">
  <span className="text-sm text-gray-500 dark:text-white/50">Theme</span>
  <ThemeToggle />
</div>
```

---

## 4. Implementation Priority

### Phase 1: Critical Bug Fixes (Do First)
1. ✅ Fix SelectItem empty value error (line 196)
2. ✅ Add error handling to API routes
3. ✅ Fix API call parameters

### Phase 2: Text Contrast (High Priority)
1. Run global find/replace for opacity values
2. Manually review each page for contrast issues
3. Test with contrast checker tools

### Phase 3: Theme Toggle (Medium Priority)
1. Install next-themes
2. Create provider and toggle components
3. Update root layout
4. Update globals.css
5. Add toggle to sidebars

### Phase 4: Component Updates (Lower Priority)
1. Update all Card components for dual theme
2. Update all Button variants
3. Update all Badge variants
4. Update all Table styles

---

## 5. Testing Checklist

After implementing fixes:

- [ ] No console errors on page load
- [ ] No console errors when opening auditor workbook
- [ ] Select dropdowns work without errors
- [ ] All text is readable (use browser accessibility tools)
- [ ] Theme toggle switches between light/dark
- [ ] Theme persists after page refresh
- [ ] All components look correct in light mode
- [ ] All components look correct in dark mode

---

## 6. Quick Fix Script

Run this to find all low-contrast text instances:

```bash
# Find all instances of low opacity text
grep -rn "text-white/[0-4]0" src/
grep -rn "text-muted-foreground" src/

# Find all Select components that might have empty values
grep -rn 'SelectItem.*value=""' src/
grep -rn "value=\"\"" src/
```

---

*Document Version: 1.0*
*Created: 2026-02-06*
