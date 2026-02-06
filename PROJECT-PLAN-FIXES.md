# CDD Onboarding Demo - Project Fix Plan

> **Created:** 2026-02-06
> **Status:** Planning
> **Priority:** High - Multiple blocking issues affecting demo functionality

---

## Executive Summary

The CDD Onboarding Demo application has several critical issues affecting both functionality and user experience:

1. **Data Loading Architecture** - Demo data loads automatically instead of on-demand
2. **Contrast/Visibility Issues** - UI elements difficult to see in both light/dark modes
3. **OpenAI Integration** - API key not being recognized despite Vercel configuration
4. **Auditor Entity Selection** - No dropdown to filter by specific entity during testing
5. **Cross-Portal Data Persistence** - Data leaking between AIC and Auditor sessions
6. **UI Sizing/Layout** - Elements improperly sized (buttons, cards, spacing)

---

## Table of Contents

1. [Issue 1: Stage Data Loading Architecture](#issue-1-stage-data-loading-architecture)
2. [Issue 2: Contrast & Visibility Fixes](#issue-2-contrast--visibility-fixes)
3. [Issue 3: Button Transparency Issues](#issue-3-button-transparency-issues)
4. [Issue 4: OpenAI API Key Integration](#issue-4-openai-api-key-integration)
5. [Issue 5: Auditor Entity Selection Dropdown](#issue-5-auditor-entity-selection-dropdown)
6. [Issue 6: Cross-Portal Data Persistence](#issue-6-cross-portal-data-persistence)
7. [Issue 7: UI Sizing & Layout Issues](#issue-7-ui-sizing--layout-issues)
8. [Implementation Order](#implementation-order)
9. [Testing Plan](#testing-plan)

---

## Issue 1: Stage Data Loading Architecture

### Problem
The application auto-loads ALL localStorage data on module import (`store.ts` lines 624-626), causing:
- Previous session data persists automatically
- Demo outputs display immediately instead of waiting for "Load Demo Data" click
- No clean "blank slate" state for fresh demos

### Current Behavior
```typescript
// store.ts lines 624-626 - PROBLEMATIC
if (typeof window !== 'undefined') {
  loadStageDataFromStorage();
}
```

### Required Behavior
1. Application loads with **blank state** (no demo outputs)
2. Demo **documents** (FLU procedures, population data) are preloaded but hidden
3. Demo **outputs** (extraction results, sampling results) only appear on "Load Demo Data" click
4. Each stage starts empty until user either:
   - Runs the AI-powered extraction (with OpenAI key)
   - Clicks "Load Demo Data" for mock results

### Files to Modify

| File | Changes Required |
|------|------------------|
| `src/lib/stage-data/store.ts` | Remove auto-load on import; add explicit load functions |
| `src/lib/stage-data/fallback-data.ts` | Separate "input data" from "output data" loading |
| `src/app/aic/gap-assessment/page.tsx` | Add "Load Demo Data" button pattern |
| `src/app/aic/sampling/page.tsx` | Add "Load Demo Data" button pattern |
| `src/app/aic/extraction/page.tsx` | Add "Load Demo Data" button pattern |
| `src/app/aic/workbooks/page.tsx` | Add "Load Demo Data" button pattern |
| `src/app/auditor/workbooks/page.tsx` | Already has pattern - verify it works |

### Implementation Steps

#### Step 1.1: Modify store.ts - Remove Auto-Load
```typescript
// REMOVE these lines (624-626):
// if (typeof window !== 'undefined') {
//   loadStageDataFromStorage();
// }

// ADD new functions:
export function initializeStageInputs(): void {
  // Load only INPUT data (documents, procedures) - not results
  // Called on app mount
}

export function loadDemoOutputsForStage(stage: number): void {
  // Load OUTPUT data (extraction results, sampling results)
  // Called on "Load Demo Data" button click
}

export function clearStageOutputs(stage: number): void {
  // Clear outputs for a specific stage
  // Called when user wants to re-run with real AI
}
```

#### Step 1.2: Create Data Separation in fallback-data.ts

```typescript
// Separate INPUT data (always available)
export const STAGE_INPUTS = {
  stage1: {
    fluProcedures: '...', // FLU procedures document content
    oldStandards: '...',   // Previous compliance standards
    newStandards: '...',   // New compliance standards
  },
  stage2: {
    population: [...],     // 10,000 customer records
  },
  stage3: {
    // Inputs from stage 1 & 2 outputs
  },
  stage4: {
    selectedAuditors: [...], // Auditor list
  },
};

// Separate OUTPUT data (only on "Load Demo Data")
export const STAGE_OUTPUTS = {
  stage1: {
    gapAssessment1: {...},
    gapAssessment2: {...},
    fluExtractionResult: {...},
  },
  stage2: {
    samplingResult: {...},
  },
  stage3: {
    attributeExtractionResult: {...},
  },
  stage4: {
    pivotedWorkbooks: [...],
    auditorProgress: {...},
  },
};
```

#### Step 1.3: Add "Load Demo Data" Button to Each Stage Page

```tsx
// Pattern for each stage page
const [hasLoadedDemo, setHasLoadedDemo] = useState(false);

const handleLoadDemoData = () => {
  loadDemoOutputsForStage(CURRENT_STAGE_NUMBER);
  setHasLoadedDemo(true);
  // Trigger re-render/refresh
};

// In JSX:
{!hasResults && !hasLoadedDemo && (
  <div className="flex gap-4">
    <Button onClick={handleRunAI} disabled={!hasApiKey}>
      Run AI Analysis
    </Button>
    <Button variant="outline" onClick={handleLoadDemoData}>
      <Sparkles className="w-4 h-4 mr-2" />
      Load Demo Data
    </Button>
  </div>
)}
```

#### Step 1.4: Add Clear/Reset Functionality

```tsx
// Allow users to clear demo data and try with real AI
const handleClearAndRetry = () => {
  clearStageOutputs(CURRENT_STAGE_NUMBER);
  setHasLoadedDemo(false);
  // Clear results state
};
```

### Acceptance Criteria
- [ ] Fresh app load shows empty states (no results)
- [ ] Demo documents/inputs are available for AI processing
- [ ] "Load Demo Data" button populates mock results
- [ ] User can clear demo data and run real AI extraction
- [ ] Each stage maintains independent load state

---

## Issue 2: Contrast & Visibility Fixes

### Problem
Text and UI elements have insufficient contrast in both light and dark modes, making the application difficult to use.

### Reference Document
See [CONTRAST-FIX-INSTRUCTIONS.md](./CONTRAST-FIX-INSTRUCTIONS.md) for complete details.

### Files to Modify

| File | Priority | Changes |
|------|----------|---------|
| `src/app/globals.css` | P0 | Update CSS variables for both modes |
| `src/components/ui/card.tsx` | P0 | Add proper dark mode classes |
| `src/components/ui/button.tsx` | P0 | Fix button visibility |
| `src/components/ui/input.tsx` | P1 | Fix input contrast |
| `src/components/ui/badge.tsx` | P1 | Fix badge contrast |
| `src/components/ui/table.tsx` | P1 | Fix table contrast |
| `src/app/aic/page.tsx` | P1 | Fix dashboard cards |
| `src/app/auditor/page.tsx` | P1 | Fix dashboard cards |
| All sidebar components | P1 | Verify contrast |

### Implementation Steps

#### Step 2.1: Update globals.css CSS Variables
Follow the exact replacements in CONTRAST-FIX-INSTRUCTIONS.md sections:
- Light mode `:root` variables
- Dark mode `.dark` variables
- Gradient utility classes with dark mode variants

#### Step 2.2: Audit All Components
Search codebase for these patterns and replace:

```bash
# Find all instances needing update
grep -r "text-text-primary" src/
grep -r "text-text-secondary" src/
grep -r "text-text-muted" src/
grep -r "bg-surface-" src/
grep -r "border-border-" src/
```

#### Step 2.3: Apply Standard Patterns

**Text Classes:**
```
Primary:   text-gray-900 dark:text-white
Secondary: text-gray-700 dark:text-gray-200
Muted:     text-gray-600 dark:text-gray-300
Subtle:    text-gray-500 dark:text-gray-400
```

**Surface Classes:**
```
Card:      bg-white dark:bg-white/[0.08]
Elevated:  bg-white dark:bg-[#0c2d5a]
Sidebar:   bg-white/90 dark:bg-white/[0.05]
```

### Acceptance Criteria
- [ ] All text meets WCAG AA contrast ratio (4.5:1 minimum)
- [ ] Cards visually distinct from background in both modes
- [ ] Borders visible in both modes
- [ ] No "washed out" or invisible text anywhere

---

## Issue 3: Button Transparency Issues

### Problem
Buttons appear transparent or invisible across the application, especially in dark mode.

### Current State (button.tsx)
```typescript
// Current variants
default: "bg-gray-100 dark:bg-white/10"  // Too subtle in dark mode
ghost: "text-gray-500 dark:text-white/80" // No background at all
```

### Required Changes

#### Step 3.1: Update Button Variants

```typescript
// src/components/ui/button.tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 ...",
  {
    variants: {
      variant: {
        default:
          "bg-crowe-indigo dark:bg-crowe-indigo " +
          "text-white " +
          "hover:bg-crowe-indigo-dark dark:hover:bg-crowe-indigo-bright " +
          "border border-crowe-indigo dark:border-crowe-indigo-bright",

        secondary:
          "bg-crowe-amber dark:bg-crowe-amber " +
          "text-crowe-indigo-dark " +
          "hover:bg-crowe-amber-dark dark:hover:bg-crowe-amber-bright " +
          "border border-crowe-amber-dark",

        outline:
          "bg-transparent " +
          "text-gray-900 dark:text-white " +
          "border-2 border-gray-300 dark:border-white/30 " +
          "hover:bg-gray-100 dark:hover:bg-white/10",

        ghost:
          "bg-transparent " +
          "text-gray-700 dark:text-gray-200 " +
          "hover:bg-gray-100 dark:hover:bg-white/10 " +
          "hover:text-gray-900 dark:hover:text-white",

        destructive:
          "bg-red-600 dark:bg-red-600 " +
          "text-white " +
          "hover:bg-red-700 dark:hover:bg-red-500 " +
          "border border-red-700",

        link:
          "text-crowe-indigo dark:text-crowe-amber " +
          "underline-offset-4 hover:underline",
      },
    },
  }
);
```

#### Step 3.2: Add Demo Data Button Variant

```typescript
// Add a special variant for "Load Demo Data" buttons
demoData:
  "bg-gradient-to-r from-amber-500 to-orange-500 " +
  "dark:from-amber-400 dark:to-orange-400 " +
  "text-white dark:text-crowe-indigo-dark " +
  "font-semibold " +
  "border border-amber-600 dark:border-amber-300 " +
  "shadow-md hover:shadow-lg " +
  "hover:from-amber-600 hover:to-orange-600",
```

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/ui/button.tsx` | Update all variants |
| Any custom button styles in pages | Ensure using proper variants |

### Acceptance Criteria
- [ ] All buttons clearly visible in light mode
- [ ] All buttons clearly visible in dark mode
- [ ] Hover states provide visual feedback
- [ ] Focus states meet accessibility standards
- [ ] "Load Demo Data" button is prominent and inviting

---

## Issue 4: OpenAI API Key Integration

### Problem
OpenAI API key is configured in Vercel but not being recognized by the application.

### Current Implementation
```typescript
// src/lib/ai/client.ts
const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.warn('[AI Client] No OpenAI API key found');
  return { demoMode: true, ... };
}
```

### Potential Causes

1. **Environment Variable Naming**
   - Vercel: `OPENAI_API_KEY`
   - Code expects: `OPENAI_API_KEY`
   - Next.js client-side requires: `NEXT_PUBLIC_OPENAI_API_KEY`

2. **Server vs Client Context**
   - API routes (server-side): Can access `process.env.OPENAI_API_KEY`
   - Client components: Cannot access non-prefixed env vars

3. **Vercel Environment Scope**
   - Check if key is set for correct environment (Production/Preview/Development)

### Implementation Steps

#### Step 4.1: Verify Vercel Configuration

```bash
# Check Vercel environment variables
vercel env ls

# Expected output should include:
# OPENAI_API_KEY  Production, Preview, Development
```

#### Step 4.2: Ensure API Routes Use Server-Side Access

```typescript
// src/app/api/ai/flu-extraction/route.ts
export async function POST(request: Request) {
  // This runs server-side - should have access to env vars
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error('[FLU Extraction] OPENAI_API_KEY not found in environment');
    return NextResponse.json(
      { error: 'API key not configured', demoMode: true },
      { status: 503 }
    );
  }

  // Continue with extraction...
}
```

#### Step 4.3: Add API Key Status Endpoint

```typescript
// src/app/api/ai/status/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;

  return NextResponse.json({
    openai: hasOpenAI,
    anthropic: hasAnthropic,
    activeProvider: hasOpenAI ? 'openai' : hasAnthropic ? 'anthropic' : 'none',
  });
}
```

#### Step 4.4: Add Client-Side API Key Check Hook

```typescript
// src/hooks/use-ai-status.ts
import { useState, useEffect } from 'react';

interface AIStatus {
  openai: boolean;
  anthropic: boolean;
  activeProvider: 'openai' | 'anthropic' | 'none';
  loading: boolean;
}

export function useAIStatus(): AIStatus {
  const [status, setStatus] = useState<AIStatus>({
    openai: false,
    anthropic: false,
    activeProvider: 'none',
    loading: true,
  });

  useEffect(() => {
    fetch('/api/ai/status')
      .then(res => res.json())
      .then(data => setStatus({ ...data, loading: false }))
      .catch(() => setStatus(prev => ({ ...prev, loading: false })));
  }, []);

  return status;
}
```

#### Step 4.5: Update UI to Show API Status

```tsx
// In extraction page components
const { activeProvider, loading } = useAIStatus();

{loading ? (
  <Skeleton className="w-32 h-6" />
) : activeProvider === 'none' ? (
  <Badge variant="outline" className="text-amber-600 border-amber-300">
    Demo Mode - No API Key
  </Badge>
) : (
  <Badge variant="outline" className="text-green-600 border-green-300">
    AI Ready ({activeProvider})
  </Badge>
)}
```

#### Step 4.6: Add Debug Logging

```typescript
// src/lib/ai/client.ts - Add startup logging
console.log('[AI Client] Initializing...');
console.log('[AI Client] OPENAI_API_KEY present:', !!process.env.OPENAI_API_KEY);
console.log('[AI Client] Key prefix:', process.env.OPENAI_API_KEY?.substring(0, 7) + '...');
```

### Files to Modify

| File | Changes |
|------|---------|
| `src/lib/ai/client.ts` | Add debug logging, improve error handling |
| `src/app/api/ai/status/route.ts` | Create new endpoint |
| `src/hooks/use-ai-status.ts` | Create new hook |
| `src/app/api/ai/*/route.ts` | Verify env var access in all AI routes |
| All extraction pages | Add API status indicator |

### Acceptance Criteria
- [ ] API key loads correctly from Vercel environment
- [ ] UI shows clear indication of API availability
- [ ] Error messages are helpful when API fails
- [ ] Demo mode automatically activates when no key
- [ ] Debug logs help diagnose issues

---

## Issue 5: Auditor Entity Selection Dropdown

### Problem
Auditor cannot select/filter by specific entity during testing. The current implementation shows all assigned customers as table columns but lacks a dropdown to focus on one entity.

### Current Implementation
- Customers displayed as columns in pivoted workbook table
- No filtering mechanism
- Auditor must scroll horizontally to find specific customer

### Required Implementation

#### Step 5.1: Add Entity Filter Component

```tsx
// src/components/auditor/entity-filter.tsx
'use client';

import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface EntityFilterProps {
  entities: Array<{ id: string; name: string }>;
  selectedEntity: string | null;
  onEntityChange: (entityId: string | null) => void;
}

export function EntityFilter({
  entities,
  selectedEntity,
  onEntityChange
}: EntityFilterProps) {
  return (
    <div className="flex items-center gap-4">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
        Filter by Entity:
      </label>
      <Select
        value={selectedEntity || 'all'}
        onValueChange={(value) => onEntityChange(value === 'all' ? null : value)}
      >
        <SelectTrigger className="w-[280px]">
          <SelectValue placeholder="All Entities" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Entities ({entities.length})</SelectItem>
          {entities.map((entity) => (
            <SelectItem key={entity.id} value={entity.id}>
              {entity.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
```

#### Step 5.2: Update Workbook Page to Use Filter

```tsx
// src/app/auditor/workbooks/[id]/page.tsx
import { EntityFilter } from '@/components/auditor/entity-filter';

export default function WorkbookPage({ params }: { params: { id: string } }) {
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);

  // Get workbook data
  const workbook = getWorkbook(params.id);

  // Extract entities from workbook
  const entities = workbook.assignedCustomers.map(c => ({
    id: c.customerId,
    name: c.customerName,
  }));

  // Filter customers based on selection
  const displayedCustomers = selectedEntityId
    ? workbook.assignedCustomers.filter(c => c.customerId === selectedEntityId)
    : workbook.assignedCustomers;

  return (
    <div className="space-y-6">
      {/* Header with filter */}
      <div className="flex items-center justify-between">
        <h1>Workbook Testing</h1>
        <EntityFilter
          entities={entities}
          selectedEntity={selectedEntityId}
          onEntityChange={setSelectedEntityId}
        />
      </div>

      {/* Table showing only filtered customers */}
      <WorkbookTable
        attributes={workbook.attributes}
        customers={displayedCustomers}
      />
    </div>
  );
}
```

#### Step 5.3: Add Quick Entity Navigation

```tsx
// Add entity quick-jump chips above table
<div className="flex flex-wrap gap-2 mb-4">
  {entities.map((entity) => (
    <button
      key={entity.id}
      onClick={() => setSelectedEntityId(entity.id)}
      className={cn(
        "px-3 py-1 rounded-full text-sm transition-colors",
        selectedEntityId === entity.id
          ? "bg-crowe-indigo text-white"
          : "bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-white/20"
      )}
    >
      {entity.name}
    </button>
  ))}
  {selectedEntityId && (
    <button
      onClick={() => setSelectedEntityId(null)}
      className="px-3 py-1 rounded-full text-sm bg-gray-200 dark:bg-white/20 text-gray-600 dark:text-gray-300"
    >
      Show All
    </button>
  )}
</div>
```

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/auditor/entity-filter.tsx` | Create new component |
| `src/app/auditor/workbooks/[id]/page.tsx` | Add filter state and UI |
| `src/components/ui/select.tsx` | Verify dark mode styling |

### Acceptance Criteria
- [ ] Dropdown shows all assigned entities
- [ ] Selecting entity filters table to show only that entity
- [ ] "All Entities" option shows complete table
- [ ] Filter state persists during testing session
- [ ] Quick-jump chips for fast entity selection

---

## Issue 6: Cross-Portal Data Persistence

### Problem
Data persists incorrectly between AIC and Auditor portals, causing:
- Auditor seeing data they shouldn't have access to yet
- AIC data overwriting Auditor progress
- Stale data from previous sessions appearing

### Root Cause
Both portals share the same localStorage keys and in-memory store without proper session isolation.

### Required Changes

#### Step 6.1: Add Portal-Specific Data Scoping

```typescript
// src/lib/stage-data/store.ts

// Add portal context
type PortalType = 'aic' | 'auditor';

function getStorageKey(key: string, portal?: PortalType): string {
  const prefix = portal ? `${portal}_` : '';
  return `stageData_${prefix}${key}`;
}

// Update setStageData to accept portal context
export function setStageData<K extends StageDataKey>(
  key: K,
  value: StageDataStore[K],
  portal?: PortalType
): void {
  stageData[key] = value;

  if (typeof window !== 'undefined') {
    const storageKey = getStorageKey(key, portal);
    localStorage.setItem(storageKey, JSON.stringify(value));
  }
}
```

#### Step 6.2: Define Data Ownership

```typescript
// Data ownership mapping
const DATA_OWNERSHIP: Record<StageDataKey, PortalType | 'shared'> = {
  // AIC-owned data (Stages 1-4 setup)
  fluProcedures: 'aic',
  oldStandards: 'aic',
  newStandards: 'aic',
  gapAssessment1: 'aic',
  gapAssessment2: 'aic',
  fluExtractionResult: 'aic',
  population: 'aic',
  samplingResult: 'aic',
  selectedAuditors: 'aic',

  // Shared data (published by AIC, consumed by Auditor)
  pivotedWorkbooks: 'shared',
  workbooksPublished: 'shared',

  // Auditor-owned data (Testing phase)
  auditorProgress: 'auditor',
  testResults: 'auditor',
  auditorNotes: 'auditor',
};
```

#### Step 6.3: Add Publication Flow

```typescript
// AIC publishes workbooks - makes them available to Auditor
export function publishWorkbooksToAuditor(): void {
  const workbooks = getStageData('pivotedWorkbooks');
  const auditors = getStageData('selectedAuditors');

  if (!workbooks || !auditors) {
    throw new Error('Cannot publish: missing workbooks or auditors');
  }

  // Copy to shared storage
  setStageData('pivotedWorkbooks', workbooks, 'shared');
  setStageData('selectedAuditors', auditors, 'shared');
  setStageData('workbooksPublished', true, 'shared');

  // Initialize auditor progress
  const initialProgress: Record<string, AuditorProgress> = {};
  auditors.forEach(auditor => {
    initialProgress[auditor.id] = {
      status: 'not_started',
      completedAttributes: 0,
      totalAttributes: 0,
    };
  });
  setStageData('auditorProgress', initialProgress, 'shared');
}
```

#### Step 6.4: Add Session Isolation

```typescript
// src/lib/auth/session.ts

interface Session {
  id: string;
  portal: 'aic' | 'auditor';
  userId: string;
  auditorId?: string; // Only for auditor sessions
  startedAt: number;
}

export function createSession(portal: 'aic' | 'auditor', auditorId?: string): Session {
  const session: Session = {
    id: crypto.randomUUID(),
    portal,
    userId: portal === 'aic' ? 'aic-user' : `auditor-${auditorId}`,
    auditorId,
    startedAt: Date.now(),
  };

  localStorage.setItem('cdd_session', JSON.stringify(session));
  return session;
}

export function getCurrentSession(): Session | null {
  const data = localStorage.getItem('cdd_session');
  return data ? JSON.parse(data) : null;
}

export function clearSession(): void {
  localStorage.removeItem('cdd_session');
}
```

#### Step 6.5: Add Data Visibility Rules

```typescript
// Auditor can only see:
// 1. Shared published workbooks (read-only)
// 2. Their own assigned customers
// 3. Their own test results (read-write)

export function getAuditorVisibleData(auditorId: string) {
  const session = getCurrentSession();
  if (session?.portal !== 'auditor') {
    throw new Error('Not in auditor portal');
  }

  const workbooks = getStageData('pivotedWorkbooks') || [];
  const auditorWorkbook = workbooks.find(w => w.auditorId === auditorId);

  return {
    workbook: auditorWorkbook,
    progress: getStageData('auditorProgress')?.[auditorId],
    canEdit: !auditorWorkbook?.submitted,
  };
}
```

### Files to Modify

| File | Changes |
|------|---------|
| `src/lib/stage-data/store.ts` | Add portal scoping, ownership rules |
| `src/lib/auth/session.ts` | Add proper session management |
| `src/app/aic/workbooks/page.tsx` | Use publish flow |
| `src/app/auditor/workbooks/page.tsx` | Use visibility rules |
| `src/app/layout.tsx` | Add session provider |

### Acceptance Criteria
- [ ] AIC and Auditor data clearly separated
- [ ] Auditor only sees published workbooks
- [ ] Auditor only sees their assigned customers
- [ ] AIC changes don't overwrite Auditor progress
- [ ] Clear session start/end boundaries

---

## Issue 7: UI Sizing & Layout Issues

### Problem
Elements are improperly sized, causing:
- Buttons too small or too large
- Cards with inconsistent padding
- Text overflowing containers
- Poor mobile responsiveness

### Reference Screenshot
The "Extraction Results" card shows:
- Badge sizing inconsistent (CIP: 7, CDD: 10, EDD: 7)
- Tab buttons may be too subtle
- Card padding appears inconsistent

### Implementation Steps

#### Step 7.1: Standardize Card Sizing

```tsx
// src/components/ui/card.tsx - Add consistent sizing

const cardVariants = cva(
  "rounded-xl border transition-all",
  {
    variants: {
      size: {
        sm: "p-4",
        default: "p-6",
        lg: "p-8",
      },
      padding: {
        none: "p-0",
        tight: "p-3",
        normal: "p-6",
        relaxed: "p-8",
      }
    },
    defaultVariants: {
      size: "default",
    }
  }
);
```

#### Step 7.2: Standardize Badge Sizing

```tsx
// src/components/ui/badge.tsx

const badgeVariants = cva(
  "inline-flex items-center justify-center font-medium transition-colors",
  {
    variants: {
      size: {
        sm: "px-2 py-0.5 text-xs rounded",
        default: "px-2.5 py-1 text-sm rounded-md",
        lg: "px-3 py-1.5 text-sm rounded-md",
      },
    },
    defaultVariants: {
      size: "default",
    }
  }
);
```

#### Step 7.3: Fix Extraction Results Layout

```tsx
// src/components/stage-3/extraction-results-view.tsx

// Ensure consistent badge sizing in summary
<div className="flex items-center gap-3">
  <Badge size="default" variant="outline">
    CIP: {cipCount}
  </Badge>
  <Badge size="default" variant="secondary">
    CDD: {cddCount}
  </Badge>
  <Badge size="default" variant="destructive">
    EDD: {eddCount}
  </Badge>
</div>

// Ensure tabs have proper sizing
<Tabs defaultValue="attributes" className="w-full">
  <TabsList className="h-11 p-1 bg-gray-100 dark:bg-white/10">
    <TabsTrigger
      value="attributes"
      className="px-6 py-2 text-sm font-medium"
    >
      Attributes ({attributeCount})
    </TabsTrigger>
    <TabsTrigger
      value="docs"
      className="px-6 py-2 text-sm font-medium"
    >
      Acceptable Docs ({docCount})
    </TabsTrigger>
  </TabsList>
</Tabs>
```

#### Step 7.4: Add Responsive Container Utilities

```css
/* globals.css */

/* Standard page container */
.page-container {
  @apply w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8;
}

/* Card grid layouts */
.card-grid {
  @apply grid gap-6;
  @apply grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4;
}

/* Stat card grid */
.stat-grid {
  @apply grid gap-4;
  @apply grid-cols-2 lg:grid-cols-4;
}

/* Form layout */
.form-grid {
  @apply grid gap-4;
  @apply grid-cols-1 md:grid-cols-2;
}
```

#### Step 7.5: Audit All Page Layouts

Review each page for:
- Consistent use of `page-container` wrapper
- Proper heading hierarchy (h1, h2, h3)
- Consistent spacing between sections
- Mobile-friendly touch targets (min 44x44px)

### Files to Modify

| File | Changes |
|------|---------|
| `src/app/globals.css` | Add layout utilities |
| `src/components/ui/card.tsx` | Add size variants |
| `src/components/ui/badge.tsx` | Add size variants |
| `src/components/ui/tabs.tsx` | Ensure proper sizing |
| `src/components/stage-3/extraction-results-view.tsx` | Fix layout |
| All page.tsx files | Apply consistent containers |

### Acceptance Criteria
- [ ] All cards have consistent padding
- [ ] All badges same size within a context
- [ ] Tabs clearly clickable with proper sizing
- [ ] Pages use consistent max-width containers
- [ ] Touch targets meet 44x44px minimum
- [ ] No text overflow issues

---

## Implementation Order

### Phase 1: Critical Fixes (Day 1-2)
1. **Issue 4: OpenAI API Key** - Unblock AI functionality
2. **Issue 1: Data Loading** - Fix demo data architecture
3. **Issue 2: Contrast Fixes** - Apply CSS variable updates

### Phase 2: Core Functionality (Day 3-4)
4. **Issue 5: Entity Dropdown** - Add auditor filtering
5. **Issue 6: Data Persistence** - Fix cross-portal issues
6. **Issue 3: Button Visibility** - Update button variants

### Phase 3: Polish (Day 5)
7. **Issue 7: UI Sizing** - Standardize layouts
8. Full application testing
9. Documentation updates

---

## Testing Plan

### Unit Tests
- [ ] Stage data store functions
- [ ] Session management functions
- [ ] Entity filtering logic
- [ ] API key detection

### Integration Tests
- [ ] AIC workflow stages 1-4
- [ ] Auditor workflow stages 4-5
- [ ] Data publication flow
- [ ] Demo data loading

### Manual Testing Checklist

#### Fresh Install Test
1. Clear all localStorage
2. Open AIC dashboard - should be blank
3. Navigate to Stage 1 - should show empty state
4. Click "Load Demo Data" - should populate results
5. Verify data persists on refresh

#### Cross-Portal Test
1. Complete AIC workflow through Stage 4
2. Publish workbooks
3. Switch to Auditor portal
4. Verify only assigned workbooks visible
5. Complete testing as Auditor
6. Verify AIC can see consolidated results

#### Contrast Test
1. Test in light mode - all text readable
2. Test in dark mode - all text readable
3. Check all buttons visible in both modes
4. Verify WCAG AA compliance

#### Entity Selection Test
1. Open Auditor workbook
2. Use dropdown to select specific entity
3. Verify table filters correctly
4. Select "All Entities" - verify shows all
5. Test quick-jump chips

---

## Success Metrics

| Metric | Target |
|--------|--------|
| WCAG AA Compliance | 100% of text |
| Demo Load Time | < 2 seconds |
| API Key Detection | 100% accurate |
| Entity Filter Accuracy | 100% |
| Data Isolation | Zero cross-portal leaks |
| Touch Target Size | 100% ≥ 44x44px |

---

## Notes

- All changes should follow existing code patterns
- Use Crowe brand colors consistently
- Test in both Chrome and Safari
- Mobile testing on iOS Safari
- Keep bundle size impact minimal

---

*Plan created: 2026-02-06*
*Estimated effort: 5 days*
*Priority: High*
