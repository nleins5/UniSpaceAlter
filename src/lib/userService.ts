/**
 * User Service — Supabase (with in-memory fallback)
 *
 * If NEXT_PUBLIC_SUPABASE_URL is set → uses Supabase DB (users table)
 * Otherwise → falls back to in-memory store (demo mode)
 *
 * Supabase table: users
 *   id (uuid, PK), email (text, unique), password_hash (text),
 *   first_name (text), last_name (text), admin (boolean),
 *   created_at (timestamptz), last_active (timestamptz),
 *   orders_count (int), total_spent (bigint)
 */

import crypto from "crypto";
import { isSupabaseConfigured, supabase } from "./supabase";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  admin: boolean;
  createdAt: string;
  lastActive?: string;
  ordersCount?: number;
  totalSpent?: number;
}

interface UserWithPassword extends User {
  passwordHash: string;
}

// ── Password hashing ─────────────────────────────────────────
const SALT = "_unispace_salt_2026";

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + SALT).digest("hex");
}

// ── In-memory store (fallback) ───────────────────────────────
const memoryUsers = new Map<string, UserWithPassword>();

function seedDemoUsers() {
  if (memoryUsers.size > 0) return;
  const demos: UserWithPassword[] = [
    {
      id: "usr_001",
      email: "admin@unispace.vn",
      passwordHash: hashPassword("admin123"),
      firstName: "Admin",
      lastName: "UniSpace",
      admin: true,
      createdAt: "2025-01-15T08:00:00Z",
      lastActive: new Date().toISOString(),
      ordersCount: 0,
      totalSpent: 0,
    },
    {
      id: "usr_002",
      email: "staff@unispace.vn",
      passwordHash: hashPassword("staff123"),
      firstName: "Nhân viên",
      lastName: "UniSpace",
      admin: false,
      createdAt: "2025-03-01T10:00:00Z",
      lastActive: new Date(Date.now() - 3600000).toISOString(),
      ordersCount: 0,
      totalSpent: 0,
    },
  ];
  for (const u of demos) memoryUsers.set(u.id, u);
}
seedDemoUsers();

// ── Helper: map Supabase row → User ──────────────────────────
function rowToUser(row: Record<string, unknown>): User {
  return {
    id: row.id as string,
    email: row.email as string,
    firstName: (row.first_name as string) || "",
    lastName: (row.last_name as string) || "",
    admin: Boolean(row.admin),
    createdAt: row.created_at as string,
    lastActive: (row.last_active as string) || undefined,
    ordersCount: (row.orders_count as number) || 0,
    totalSpent: (row.total_spent as number) || 0,
  };
}

function rowToUserWithPassword(row: Record<string, unknown>): UserWithPassword {
  return {
    ...rowToUser(row),
    passwordHash: row.password_hash as string,
  };
}

// ── AUTH: find user by email + password ───────────────────────
export async function authenticateUser(email: string, password: string): Promise<User | null> {
  const inputHash = hashPassword(password);

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .eq("password_hash", inputHash)
      .single();

    if (error || !data) return null;

    // Update last_active
    await supabase
      .from("users")
      .update({ last_active: new Date().toISOString() })
      .eq("id", data.id);

    return rowToUser(data);
  }

  // In-memory fallback
  for (const u of memoryUsers.values()) {
    if (u.email === email && u.passwordHash === inputHash) {
      u.lastActive = new Date().toISOString();
      return {
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        admin: u.admin,
        createdAt: u.createdAt,
        lastActive: u.lastActive,
        ordersCount: u.ordersCount,
        totalSpent: u.totalSpent,
      };
    }
  }
  return null;
}

// ── READ all users (admin only) ──────────────────────────────
export async function getAllUsers(): Promise<User[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("users")
      .select("id, email, first_name, last_name, admin, created_at, last_active, orders_count, total_spent")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase getAllUsers:", error.message);
      return [];
    }
    return (data || []).map(rowToUser);
  }

  // In-memory fallback
  return Array.from(memoryUsers.values()).map(u => ({
    id: u.id,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    admin: u.admin,
    createdAt: u.createdAt,
    lastActive: u.lastActive,
    ordersCount: u.ordersCount,
    totalSpent: u.totalSpent,
  }));
}

// ── READ single user ─────────────────────────────────────────
export async function getUser(id: string): Promise<User | null> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("users")
      .select("id, email, first_name, last_name, admin, created_at, last_active, orders_count, total_spent")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return rowToUser(data);
  }

  const u = memoryUsers.get(id);
  if (!u) return null;
  return {
    id: u.id, email: u.email, firstName: u.firstName, lastName: u.lastName,
    admin: u.admin, createdAt: u.createdAt, lastActive: u.lastActive,
    ordersCount: u.ordersCount, totalSpent: u.totalSpent,
  };
}

// ── CREATE user (registration / admin create) ────────────────
export async function createUser(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  admin = false,
): Promise<User | null> {
  const passwordHash = hashPassword(password);

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("users")
      .insert({
        email,
        password_hash: passwordHash,
        first_name: firstName,
        last_name: lastName,
        admin,
        orders_count: 0,
        total_spent: 0,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase createUser:", error.message);
      return null;
    }
    return rowToUser(data);
  }

  // In-memory fallback
  const id = `usr_${String(memoryUsers.size + 1).padStart(3, "0")}`;
  const user: UserWithPassword = {
    id,
    email,
    passwordHash,
    firstName,
    lastName,
    admin,
    createdAt: new Date().toISOString(),
    ordersCount: 0,
    totalSpent: 0,
  };
  memoryUsers.set(id, user);
  return { id, email, firstName, lastName, admin, createdAt: user.createdAt, ordersCount: 0, totalSpent: 0 };
}

// ── UPDATE user last active ──────────────────────────────────
export async function updateLastActive(userId: string): Promise<void> {
  const now = new Date().toISOString();
  if (isSupabaseConfigured && supabase) {
    await supabase.from("users").update({ last_active: now }).eq("id", userId);
    return;
  }
  const u = memoryUsers.get(userId);
  if (u) u.lastActive = now;
}

// ── INCREMENT order stats ────────────────────────────────────
export async function incrementUserOrderStats(userId: string, amount: number): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    // Use RPC or manual increment
    const { data } = await supabase
      .from("users")
      .select("orders_count, total_spent")
      .eq("id", userId)
      .single();

    if (data) {
      await supabase
        .from("users")
        .update({
          orders_count: ((data.orders_count as number) || 0) + 1,
          total_spent: ((data.total_spent as number) || 0) + amount,
        })
        .eq("id", userId);
    }
    return;
  }

  const u = memoryUsers.get(userId);
  if (u) {
    u.ordersCount = (u.ordersCount || 0) + 1;
    u.totalSpent = (u.totalSpent || 0) + amount;
  }
}

// ── DELETE user ──────────────────────────────────────────────
export async function deleteUser(id: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from("users").delete().eq("id", id);
    if (error) {
      console.error("Supabase deleteUser:", error.message);
      return false;
    }
    return true;
  }
  return memoryUsers.delete(id);
}

// ── SEED: Initialize Supabase users table if empty ───────────
export async function seedUsersIfEmpty(): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;

  const { count } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true });

  if (count && count > 0) return;

  console.log("🌱 Seeding users table...");
  const defaultUsers = [
    {
      email: "admin@unispace.vn",
      password_hash: hashPassword("admin123"),
      first_name: "Admin",
      last_name: "UniSpace",
      admin: true,
      orders_count: 0,
      total_spent: 0,
    },
    {
      email: "staff@unispace.vn",
      password_hash: hashPassword("staff123"),
      first_name: "Nhân viên",
      last_name: "UniSpace",
      admin: false,
      orders_count: 0,
      total_spent: 0,
    },
  ];

  const { error } = await supabase.from("users").insert(defaultUsers);
  if (error) console.error("Seed users error:", error.message);
  else console.log("✅ Users seeded successfully");
}
