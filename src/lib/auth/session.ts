/**
 * Simple session management for demo purposes
 * Uses localStorage to persist role selection
 */

export type UserRole = 'aic' | 'auditor';

export interface UserSession {
  role: UserRole;
  auditorId?: string;
  auditorName?: string;
  selectedAt: string;
}

const SESSION_KEY = 'cdd_demo_session';

/**
 * Get current session from localStorage
 */
export function getSession(): UserSession | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as UserSession;
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
  setSession({
    role: 'aic',
    selectedAt: new Date().toISOString(),
  });
}

/**
 * Set role as Auditor with specific auditor info
 */
export function setAuditorRole(auditorId: string, auditorName: string): void {
  setSession({
    role: 'auditor',
    auditorId,
    auditorName,
    selectedAt: new Date().toISOString(),
  });
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
