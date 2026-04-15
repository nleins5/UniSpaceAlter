import { NextResponse } from "next/server";
import crypto from "crypto";

// Hash password with SHA-256 + salt
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "_unispace_salt_2026").digest("hex");
}

// Users with hashed passwords
const USERS = [
  {
    id: "1",
    email: "admin@unispace.vn",
    passwordHash: hashPassword("admin123"),
    firstName: "Admin",
    lastName: "UniSpace",
    admin: true,
  },
  {
    id: "2",
    email: "staff@unispace.vn",
    passwordHash: hashPassword("staff123"),
    firstName: "Nhân viên",
    lastName: "UniSpace",
    admin: false,
  },
];

// Simple rate limiter: max 5 login attempts per IP per 15 minutes
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return true;
  }
  if (entry.count >= 5) return false;
  entry.count++;
  return true;
}

export async function POST(request: Request) {
  try {
    // Rate limiting
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Quá nhiều lần thử. Vui lòng đợi 15 phút." },
        { status: 429 }
      );
    }

    const { email, password } = await request.json();

    if (!email || !password || typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Sanitize input
    const cleanEmail = email.trim().toLowerCase().slice(0, 100);
    const cleanPassword = password.slice(0, 100);
    const inputHash = hashPassword(cleanPassword);

    const user = USERS.find(
      (u) => u.email === cleanEmail && u.passwordHash === inputHash
    );

    if (user) {
      // Generate a simple session token
      const token = crypto.randomBytes(32).toString("hex");
      
      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          admin: user.admin,
          token,
        },
      });
    } else {
      // Generic error message — don't reveal if email exists
      return NextResponse.json(
        { error: "Email hoặc mật khẩu không đúng" },
        { status: 401 }
      );
    }
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
