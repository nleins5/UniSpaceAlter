import { NextResponse } from "next/server";

// Simple auth - inspired by angular-app-master security module
// In production, use a real database (MongoDB) and bcrypt
const USERS = [
  {
    id: "1",
    email: "admin@unispace.vn",
    password: "admin123",
    firstName: "Admin",
    lastName: "UniSpace",
    admin: true,
  },
  {
    id: "2",
    email: "staff@unispace.vn",
    password: "staff123",
    firstName: "Nhân viên",
    lastName: "UniSpace",
    admin: false,
  },
];

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    const user = USERS.find(
      (u) => u.email === email && u.password === password
    );

    if (user) {
      // Like angular-app-master's filterUser function
      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          admin: user.admin,
        },
      });
    } else {
      return NextResponse.json({ user: null }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
