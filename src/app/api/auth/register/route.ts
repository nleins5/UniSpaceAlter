import { NextResponse } from "next/server";
import { createUser } from "../../../../lib/userService";
import { createSession } from "../../../../lib/authService";

/**
 * POST /api/auth/register
 * Body: { email, password, phone, firstName, lastName }
 * Creates a new user account and returns a session token.
 * Generates a 6-digit email verification code stored in memory.
 */

// In-memory OTP store: email → { code, expiresAt }
const otpStore = new Map<string, { code: string; expiresAt: number }>();

export function generateOTP(email: string): string {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  otpStore.set(email, { code, expiresAt: Date.now() + 10 * 60 * 1000 }); // 10 min
  console.log(`📧 OTP for ${email}: ${code}`); // In production, send via email service
  return code;
}

export function verifyOTP(email: string, code: string): boolean {
  const entry = otpStore.get(email);
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) { otpStore.delete(email); return false; }
  if (entry.code !== code) return false;
  otpStore.delete(email);
  return true;
}

// Rate limiter for registration
const registerAttempts = new Map<string, { count: number; resetAt: number }>();

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const now = Date.now();
    const entry = registerAttempts.get(ip);
    if (entry && now < entry.resetAt && entry.count >= 5) {
      return NextResponse.json(
        { error: "RATE_LIMIT_EXCEEDED // Vui lòng đợi 15 phút" },
        { status: 429 }
      );
    }
    if (!entry || now > (entry?.resetAt || 0)) {
      registerAttempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
    } else {
      entry.count++;
    }

    const { email, password, phone, firstName, lastName } = await request.json();

    // Validate required fields
    if (!email || !password || typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json({ error: "Email và mật khẩu là bắt buộc" }, { status: 400 });
    }
    if (!phone || typeof phone !== "string") {
      return NextResponse.json({ error: "Số điện thoại là bắt buộc" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Mật khẩu tối thiểu 6 ký tự" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase().slice(0, 100);
    const cleanPhone = phone.trim().slice(0, 15);
    const cleanFirstName = (firstName || "").trim().slice(0, 50) || "User";
    const cleanLastName = (lastName || "").trim().slice(0, 50) || cleanPhone.slice(-4);

    // Create user (createUser handles duplicate email check via DB constraint)
    const user = await createUser(cleanEmail, password, cleanFirstName, cleanLastName, false, cleanPhone);

    if (!user) {
      return NextResponse.json(
        { error: "Email đã tồn tại hoặc có lỗi xảy ra" },
        { status: 409 }
      );
    }

    // Generate OTP for email verification
    const otp = generateOTP(cleanEmail);

    // Create session immediately (user can use app but some features gated by verification)
    const token = createSession(user.id, user.email, user.admin);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        admin: user.admin,
        phone: cleanPhone,
        emailVerified: false,
        token,
      },
      otpSent: true,
      // In dev/demo mode, expose OTP so user can test
      _devOtp: process.env.NODE_ENV !== "production" ? otp : undefined,
    });
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "SYSTEM_ERROR // Đăng ký thất bại" }, { status: 500 });
  }
}
