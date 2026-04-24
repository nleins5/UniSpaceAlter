import { NextResponse } from "next/server";
import { verifyOTP } from "../register/route";

/**
 * POST /api/auth/verify-email
 * Body: { email, code }
 * Verifies the 6-digit OTP sent to the user's email.
 */
export async function POST(request: Request) {
  try {
    const { email, code } = await request.json();

    if (!email || !code || typeof email !== "string" || typeof code !== "string") {
      return NextResponse.json({ error: "Email và mã OTP là bắt buộc" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    if (verifyOTP(cleanEmail, cleanCode)) {
      return NextResponse.json({ verified: true, message: "EMAIL_VERIFIED // Tài khoản đã xác minh" });
    } else {
      return NextResponse.json(
        { error: "INVALID_OTP // Mã xác minh không đúng hoặc đã hết hạn" },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json({ error: "SYSTEM_ERROR" }, { status: 500 });
  }
}
