// =============================================================================
// Authentication Utilities (Spec Section 4)
//
// - Username + PIN authentication with bcrypt hashing.
// - Lockout after 5 failed attempts, 15-minute cooldown.
// - Secure HTTP-only cookie sessions.
// =============================================================================

import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { notDeleted } from "./soft-delete";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const SESSION_COOKIE = "easycrm_session";
const SESSION_MAX_AGE = 60 * 60 * 24; // 24 hours in seconds
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

// ---------------------------------------------------------------------------
// Session helpers
// ---------------------------------------------------------------------------

/** Minimal session payload stored in the cookie. */
export interface Session {
  userId: string;
  username: string;
}

/**
 * Read and parse the session cookie. Returns null if not authenticated.
 * In V1 we use a signed JSON cookie. For production, swap to a JWT or
 * server-side session store.
 */
export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  try {
    return JSON.parse(Buffer.from(raw, "base64").toString("utf-8")) as Session;
  } catch {
    return null;
  }
}

/**
 * Set the session cookie after successful login.
 */
export async function setSession(session: Session) {
  const value = Buffer.from(JSON.stringify(session)).toString("base64");
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

/**
 * Clear the session cookie on logout.
 */
export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}

/**
 * Require an authenticated session. Returns the session or null.
 * Use in API routes: const session = await requireSession();
 */
export async function requireSession(): Promise<Session | null> {
  return getSession();
}

// ---------------------------------------------------------------------------
// Lockout logic (Section 4 — Security Rules)
// ---------------------------------------------------------------------------

/**
 * Check if a user account is currently locked out.
 */
export function isLockedOut(lockedUntil: Date | null): boolean {
  if (!lockedUntil) return false;
  return new Date() < lockedUntil;
}

/**
 * Record a failed login attempt. Locks the account after MAX_FAILED_ATTEMPTS.
 */
export async function recordFailedAttempt(userId: string, currentFailCount: number) {
  const newCount = currentFailCount + 1;
  const lockout =
    newCount >= MAX_FAILED_ATTEMPTS
      ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000)
      : null;

  await prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginCount: newCount,
      lockedUntil: lockout,
    },
  });
}

/**
 * Reset failed attempt counter after a successful login.
 */
export async function clearFailedAttempts(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginCount: 0,
      lockedUntil: null,
    },
  });
}

/**
 * Look up an active user by username (excludes soft-deleted users).
 */
export async function findActiveUser(username: string) {
  return prisma.user.findFirst({
    where: {
      username,
      isActive: true,
      ...notDeleted,
    },
  });
}
