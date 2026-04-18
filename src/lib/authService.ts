/**
 * Auth Service — Server-side token management
 * 
 * Stores valid session tokens in memory (server-side only).
 * Tokens expire after 24 hours.
 * For production, consider using JWTs or a database-backed session store.
 */

import crypto from "crypto";

interface SessionData {
  userId: string;
  email: string;
  admin: boolean;
  createdAt: number;
  expiresAt: number;
}

// In-memory session store (server-side only)
const sessions = new Map<string, SessionData>();

const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

// Cleanup expired sessions periodically
function cleanupExpired() {
  const now = Date.now();
  for (const [token, session] of sessions) {
    if (now > session.expiresAt) {
      sessions.delete(token);
    }
  }
}

// Run cleanup every 10 minutes
if (typeof setInterval !== "undefined") {
  setInterval(cleanupExpired, 10 * 60 * 1000);
}

/**
 * Create a new session token for a user
 */
export function createSession(userId: string, email: string, admin: boolean): string {
  const token = crypto.randomBytes(48).toString("hex");
  const now = Date.now();
  sessions.set(token, {
    userId,
    email,
    admin,
    createdAt: now,
    expiresAt: now + SESSION_DURATION_MS,
  });
  return token;
}

/**
 * Verify a session token and return session data
 * Returns null if token is invalid or expired
 */
export function verifySession(token: string): SessionData | null {
  if (!token || typeof token !== "string") return null;
  
  const session = sessions.get(token);
  if (!session) return null;
  
  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    return null;
  }
  
  return session;
}

/**
 * Revoke (logout) a session
 */
export function revokeSession(token: string): void {
  sessions.delete(token);
}

/**
 * Check if a session belongs to an admin user
 */
export function isAdminSession(token: string): boolean {
  const session = verifySession(token);
  return session?.admin === true;
}

/**
 * Extract Bearer token from Authorization header
 */
export function extractToken(request: Request): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return null;
  
  // Support "Bearer <token>" format
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }
  
  return authHeader.trim();
}

/**
 * Middleware helper: verify request has valid admin session
 * Returns session data or null
 */
export function requireAdmin(request: Request): SessionData | null {
  const token = extractToken(request);
  if (!token) return null;
  
  const session = verifySession(token);
  if (!session || !session.admin) return null;
  
  return session;
}

/**
 * Middleware helper: verify request has any valid session
 * Returns session data or null
 */
export function requireAuth(request: Request): SessionData | null {
  const token = extractToken(request);
  if (!token) return null;
  
  return verifySession(token);
}
