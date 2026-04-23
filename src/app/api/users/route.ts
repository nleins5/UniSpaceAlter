import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "../../../lib/authService";
import { getAllUsers, seedUsersIfEmpty } from "../../../lib/userService";

/**
 * GET /api/users — List all users (ADMIN ONLY)
 * Auto-seeds the users table on first call if Supabase is configured.
 */
export async function GET(req: NextRequest) {
  const session = requireAdmin(req);
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized — vui lòng đăng nhập với quyền admin" },
      { status: 401 }
    );
  }

  try {
    // Auto-seed users table if empty (Supabase only)
    await seedUsersIfEmpty();

    const users = await getAllUsers();
    return NextResponse.json({ users });
  } catch (error) {
    console.error("List users error:", error);
    return NextResponse.json({ users: [] });
  }
}
