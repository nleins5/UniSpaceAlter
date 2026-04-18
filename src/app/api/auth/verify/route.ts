import { NextRequest, NextResponse } from "next/server";
import { verifySession, extractToken, revokeSession } from "../../../../lib/authService";

/**
 * GET /api/auth/verify — Check if current session token is valid
 * Used by dashboard to verify login on page load
 */
export async function GET(request: NextRequest) {
  const token = extractToken(request);
  if (!token) {
    return NextResponse.json({ valid: false, error: "No token provided" }, { status: 401 });
  }

  const session = verifySession(token);
  if (!session) {
    return NextResponse.json({ valid: false, error: "Invalid or expired session" }, { status: 401 });
  }

  return NextResponse.json({
    valid: true,
    user: {
      userId: session.userId,
      email: session.email,
      admin: session.admin,
    },
  });
}

/**
 * DELETE /api/auth/verify — Logout (revoke session)
 */
export async function DELETE(request: NextRequest) {
  const token = extractToken(request);
  if (token) {
    revokeSession(token);
  }
  return NextResponse.json({ success: true });
}
