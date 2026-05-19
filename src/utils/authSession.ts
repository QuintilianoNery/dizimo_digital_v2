import type { AuthUser } from '../types';
import { KEYS, storageGetOne, storageSet } from './storage';

export const AUTH_SESSION_DURATION_MS = 60 * 60 * 1000;

export type StoredAuthSession = AuthUser & {
  sessionStartedAt: string;
  sessionExpiresAt: string;
};

export function createAuthSession(user: AuthUser, startedAt = new Date()): StoredAuthSession {
  const sessionStartedAt = startedAt.toISOString();
  const sessionExpiresAt = new Date(startedAt.getTime() + AUTH_SESSION_DURATION_MS).toISOString();

  return {
    ...user,
    sessionStartedAt,
    sessionExpiresAt,
  };
}

export function isAuthSessionActive(session: AuthUser | null | undefined): session is StoredAuthSession {
  if (!session?.sessionExpiresAt) return false;

  const expiresAt = new Date(session.sessionExpiresAt).getTime();
  return Number.isFinite(expiresAt) && expiresAt > Date.now();
}

export function loadAuthSession(): StoredAuthSession | null {
  const session = storageGetOne<StoredAuthSession>(KEYS.AUTH_SESSION);

  if (!isAuthSessionActive(session)) {
    if (session) clearAuthSession();
    return null;
  }

  return session;
}

export function persistAuthSession(user: AuthUser): StoredAuthSession {
  const session = createAuthSession(user);
  storageSet(KEYS.AUTH_SESSION, session);
  return session;
}

export function clearAuthSession(): void {
  localStorage.removeItem('dizimo_digital_' + KEYS.AUTH_SESSION);
}

export function getAuthSessionRemainingMs(session: AuthUser | null | undefined): number {
  if (!session?.sessionExpiresAt) return 0;

  const expiresAt = new Date(session.sessionExpiresAt).getTime();
  if (!Number.isFinite(expiresAt)) return 0;

  return Math.max(0, expiresAt - Date.now());
}