/**
 * Database Actions for AIC/Auditor Portal
 * CRUD operations for workbooks with publishing support
 */

import { db } from './index';
import { workbooks, type Workbook, type NewWorkbook } from './schema';
import { eq, and, isNotNull, sql } from 'drizzle-orm';
import type { PivotedAuditorWorkbook } from '@/lib/stage-data/store';

// ============================================
// WORKBOOK CRUD OPERATIONS
// ============================================

/**
 * Save a workbook to the database (insert or update)
 */
export async function saveWorkbookToDb(
  workbookData: Omit<NewWorkbook, 'id'> & { id?: string }
): Promise<Workbook> {
  if (workbookData.id) {
    // Update existing
    const [updated] = await db
      .update(workbooks)
      .set({
        ...workbookData,
        lastActivityAt: new Date(),
      })
      .where(eq(workbooks.id, workbookData.id))
      .returning();
    return updated;
  } else {
    // Insert new
    const [created] = await db
      .insert(workbooks)
      .values({
        ...workbookData,
        lastActivityAt: new Date(),
      })
      .returning();
    return created;
  }
}

/**
 * Get a single workbook by ID
 */
export async function getWorkbookById(id: string): Promise<Workbook | null> {
  const [workbook] = await db
    .select()
    .from(workbooks)
    .where(eq(workbooks.id, id))
    .limit(1);
  return workbook || null;
}

/**
 * Get all workbooks for an audit run (AIC view)
 */
export async function getWorkbooksForAuditRun(auditRunId: string): Promise<Workbook[]> {
  return db
    .select()
    .from(workbooks)
    .where(eq(workbooks.auditRunId, auditRunId));
}

/**
 * Get published workbooks for a specific auditor
 */
export async function getPublishedWorkbooksForAuditor(
  auditorId: string
): Promise<Workbook[]> {
  return db
    .select()
    .from(workbooks)
    .where(
      and(
        eq(workbooks.auditorId, auditorId),
        isNotNull(workbooks.publishedAt)
      )
    );
}

/**
 * Get all published workbooks (regardless of auditor)
 */
export async function getAllPublishedWorkbooks(): Promise<Workbook[]> {
  return db
    .select()
    .from(workbooks)
    .where(isNotNull(workbooks.publishedAt));
}

// ============================================
// PUBLISH OPERATIONS
// ============================================

/**
 * Publish workbooks to auditors
 * Sets publishedAt timestamp and changes status to 'in_progress'
 */
export async function publishWorkbooks(
  workbookIds: string[],
  publishedBy: string
): Promise<Workbook[]> {
  const now = new Date();
  const published: Workbook[] = [];

  for (const id of workbookIds) {
    const [updated] = await db
      .update(workbooks)
      .set({
        publishedAt: now,
        publishedBy,
        status: 'in_progress',
        lastActivityAt: now,
      })
      .where(eq(workbooks.id, id))
      .returning();

    if (updated) {
      published.push(updated);
    }
  }

  return published;
}

/**
 * Publish all workbooks for an audit run
 */
export async function publishAllWorkbooksForAuditRun(
  auditRunId: string,
  publishedBy: string
): Promise<Workbook[]> {
  const now = new Date();

  return db
    .update(workbooks)
    .set({
      publishedAt: now,
      publishedBy,
      status: 'in_progress',
      lastActivityAt: now,
    })
    .where(eq(workbooks.auditRunId, auditRunId))
    .returning();
}

// ============================================
// SUBMISSION OPERATIONS
// ============================================

/**
 * Submit a workbook (auditor completes testing)
 * Requires >= 95% completion
 */
export async function submitWorkbook(
  workbookId: string
): Promise<{ success: boolean; workbook?: Workbook; error?: string }> {
  // Get current workbook
  const workbook = await getWorkbookById(workbookId);

  if (!workbook) {
    return { success: false, error: 'Workbook not found' };
  }

  if (workbook.status === 'submitted') {
    return { success: false, error: 'Workbook already submitted' };
  }

  const completion = workbook.completionPercentage || 0;
  if (completion < 95) {
    return {
      success: false,
      error: `Completion must be at least 95% (currently ${completion}%)`
    };
  }

  const [submitted] = await db
    .update(workbooks)
    .set({
      status: 'submitted',
      submittedAt: new Date(),
      lastActivityAt: new Date(),
    })
    .where(eq(workbooks.id, workbookId))
    .returning();

  return { success: true, workbook: submitted };
}

// ============================================
// PROGRESS TRACKING
// ============================================

/**
 * Update workbook completion percentage
 */
export async function updateWorkbookProgress(
  workbookId: string,
  completionPercentage: number
): Promise<Workbook | null> {
  const [updated] = await db
    .update(workbooks)
    .set({
      completionPercentage: Math.round(completionPercentage),
      lastActivityAt: new Date(),
    })
    .where(eq(workbooks.id, workbookId))
    .returning();

  return updated || null;
}

/**
 * Get completion progress for all workbooks in an audit run
 * Used by AIC live monitoring
 */
export async function getCompletionProgress(
  auditRunId: string
): Promise<Array<{
  workbookId: string;
  auditorId: string | null;
  auditorName: string | null;
  status: string;
  completionPercentage: number;
  lastActivityAt: Date | null;
  submittedAt: Date | null;
}>> {
  const results = await db
    .select({
      workbookId: workbooks.id,
      auditorId: workbooks.auditorId,
      auditorName: workbooks.auditorName,
      status: workbooks.status,
      completionPercentage: workbooks.completionPercentage,
      lastActivityAt: workbooks.lastActivityAt,
      submittedAt: workbooks.submittedAt,
    })
    .from(workbooks)
    .where(eq(workbooks.auditRunId, auditRunId));

  return results.map(r => ({
    ...r,
    completionPercentage: r.completionPercentage || 0,
  }));
}

// ============================================
// PIVOTED WORKBOOK OPERATIONS
// ============================================

/**
 * Save pivoted workbook data
 */
export async function savePivotedWorkbookData(
  workbookId: string,
  pivotedData: PivotedAuditorWorkbook
): Promise<Workbook | null> {
  const [updated] = await db
    .update(workbooks)
    .set({
      pivotedDataJson: {
        assignedCustomers: pivotedData.assignedCustomers,
        rows: pivotedData.rows,
        attributes: pivotedData.attributes,
      },
      lastActivityAt: new Date(),
    })
    .where(eq(workbooks.id, workbookId))
    .returning();

  return updated || null;
}

/**
 * Bulk create workbooks from pivoted workbook data
 */
export async function createWorkbooksFromPivoted(
  auditRunId: string,
  pivotedWorkbooks: PivotedAuditorWorkbook[]
): Promise<Workbook[]> {
  const created: Workbook[] = [];

  for (const wb of pivotedWorkbooks) {
    const [workbook] = await db
      .insert(workbooks)
      .values({
        auditRunId,
        auditorId: wb.auditorId,
        auditorName: wb.auditorName,
        auditorEmail: wb.auditorEmail,
        status: 'draft',
        completionPercentage: 0,
        pivotedDataJson: {
          assignedCustomers: wb.assignedCustomers,
          rows: wb.rows,
          attributes: wb.attributes,
        },
        lastActivityAt: new Date(),
      })
      .returning();

    if (workbook) {
      created.push(workbook);
    }
  }

  return created;
}

// ============================================
// DELETE OPERATIONS
// ============================================

/**
 * Delete a workbook (only if draft status)
 */
export async function deleteWorkbook(
  workbookId: string
): Promise<{ success: boolean; error?: string }> {
  const workbook = await getWorkbookById(workbookId);

  if (!workbook) {
    return { success: false, error: 'Workbook not found' };
  }

  if (workbook.status === 'submitted') {
    return { success: false, error: 'Cannot delete submitted workbook' };
  }

  await db
    .delete(workbooks)
    .where(eq(workbooks.id, workbookId));

  return { success: true };
}

/**
 * Delete all workbooks for an audit run
 */
export async function deleteWorkbooksForAuditRun(
  auditRunId: string
): Promise<void> {
  await db
    .delete(workbooks)
    .where(eq(workbooks.auditRunId, auditRunId));
}
