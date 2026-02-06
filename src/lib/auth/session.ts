/**
 * Session Management for CDD Onboarding Demo
 * Manages portal sessions and data isolation between AIC and Auditor
 */

import type { PortalType } from '@/lib/stage-data/store';

export type UserRole = PortalType;

export interface UserSession {
  id: string;
  role: UserRole;
  auditorId?: string;
  auditorName?: string;
  selectedAt: string;
  lastActivityAt: string;
}

const SESSION_KEY = 'cdd_demo_session';
const SESSION_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `session-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Get current session from localStorage
 * Returns null if session is expired
 */
export function getSession(): UserSession | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored) return null;

    const session = JSON.parse(stored) as UserSession;

    // Check if session is expired
    const sessionAge = Date.now() - new Date(session.selectedAt).getTime();
    if (sessionAge > SESSION_MAX_AGE) {
      clearSession();
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

/**
 * Set session in localStorage
 */
export function setSession(session: UserSession): void {
  if (typeof window === 'undefined') return;

  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

/**
 * Clear session from localStorage
 */
export function clearSession(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(SESSION_KEY);
}

/**
 * Set role as AIC
 */
export function setAicRole(): void {
  const now = new Date().toISOString();
  setSession({
    id: generateSessionId(),
    role: 'aic',
    selectedAt: now,
    lastActivityAt: now,
  });
}

/**
 * Set role as Auditor with specific auditor info
 */
export function setAuditorRole(auditorId: string, auditorName: string): void {
  const now = new Date().toISOString();
  setSession({
    id: generateSessionId(),
    role: 'auditor',
    auditorId,
    auditorName,
    selectedAt: now,
    lastActivityAt: now,
  });
}

/**
 * Update session activity timestamp
 */
export function updateSessionActivity(): void {
  const session = getSession();
  if (!session) return;

  session.lastActivityAt = new Date().toISOString();
  setSession(session);
}

/**
 * Check if user is AIC
 */
export function isAic(): boolean {
  const session = getSession();
  return session?.role === 'aic';
}

/**
 * Check if user is Auditor
 */
export function isAuditor(): boolean {
  const session = getSession();
  return session?.role === 'auditor';
}

/**
 * Get current auditor ID (if auditor role)
 */
export function getCurrentAuditorId(): string | null {
  const session = getSession();
  return session?.auditorId || null;
}

/**
 * Get current auditor name (if auditor role)
 */
export function getCurrentAuditorName(): string | null {
  const session = getSession();
  return session?.auditorName || null;
}

/**
 * Get current portal type
 */
export function getCurrentPortal(): PortalType | null {
  const session = getSession();
  return session?.role || null;
}

/**
 * Get session ID
 */
export function getSessionId(): string | null {
  const session = getSession();
  return session?.id || null;
}

/**
 * Check if session is valid and not expired
 */
export function isSessionValid(): boolean {
  return getSession() !== null;
}
