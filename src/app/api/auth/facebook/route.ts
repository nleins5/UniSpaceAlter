import { NextResponse } from "next/server";
import { createSession } from "../../../../lib/authService";
import { hashPassword } from "../../../../lib/userService";
import { isSupabaseConfigured, supabase } from "../../../../lib/supabase";

/**
 * POST /api/auth/facebook
 * Simulates Facebook OAuth login for demo purposes.
 * Handles both Supabase and in-memory modes.
 */

// In-memory Facebook user store
let fbUser: { id: string; email: string; firstName: string; lastName: string } | null = null;

export async function POST() {
  try {
    const fbEmail = "facebook.user@unispace.vn";
    const fbPassword = "fb_oauth_demo_2026";
    const fbFirstName = "Facebook";
    const fbLastName = "User";

    // ── Supabase mode ──
    if (isSupabaseConfigured && supabase) {
      // Try to find existing Facebook user
      const { data: existing } = await supabase
        .from("users")
        .select("id, email, first_name, last_name")
        .eq("email", fbEmail)
        .single();

      if (existing) {
        const token = createSession(
          existing.id as string,
          existing.email as string,
          false
        );
        return NextResponse.json({
          user: {
            id: existing.id,
            email: existing.email,
            firstName: existing.first_name || fbFirstName,
            lastName: existing.last_name || fbLastName,
            admin: false,
            provider: "facebook",
            token,
          },
        });
      }

      // Create new — only use columns that exist in the table
      const passwordHash = hashPassword(fbPassword);
      const { data: created, error } = await supabase
        .from("users")
        .insert({
          email: fbEmail,
          password_hash: passwordHash,
          first_name: fbFirstName,
          last_name: fbLastName,
          orders_count: 0,
          total_spent: 0,
        })
        .select("id, email, first_name, last_name")
        .single();

      if (error) {
        console.error("Facebook Supabase create error:", error.message);
        // Fall through to in-memory
      } else if (created) {
        const token = createSession(
          created.id as string,
          created.email as string,
          false
        );
        return NextResponse.json({
          user: {
            id: created.id,
            email: created.email,
            firstName: created.first_name || fbFirstName,
            lastName: created.last_name || fbLastName,
            admin: false,
            provider: "facebook",
            token,
          },
        });
      }
    }

    // ── In-memory fallback ──
    if (!fbUser) {
      fbUser = {
        id: "usr_fb_001",
        email: fbEmail,
        firstName: fbFirstName,
        lastName: fbLastName,
      };
    }

    const token = createSession(fbUser.id, fbUser.email, false);

    return NextResponse.json({
      user: {
        id: fbUser.id,
        email: fbUser.email,
        firstName: fbUser.firstName,
        lastName: fbUser.lastName,
        admin: false,
        provider: "facebook",
        token,
      },
    });
  } catch (err) {
    console.error("Facebook auth error:", err);
    return NextResponse.json(
      { error: "FACEBOOK_AUTH_ERROR // Lỗi hệ thống" },
      { status: 500 }
    );
  }
}
