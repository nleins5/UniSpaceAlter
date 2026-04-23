-- ══════════════════════════════════════════════════════════
-- UniSpace: Users Table Migration
-- Run this in your Supabase SQL Editor (supabase.com → SQL)
-- ══════════════════════════════════════════════════════════

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_active TIMESTAMPTZ,
  orders_count INTEGER DEFAULT 0,
  total_spent BIGINT DEFAULT 0
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policies: allow full access via anon key (server-side only)
CREATE POLICY "anon_select" ON users FOR SELECT USING (true);
CREATE POLICY "anon_insert" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update" ON users FOR UPDATE USING (true);
CREATE POLICY "anon_delete" ON users FOR DELETE USING (true);

-- Index on email for fast auth lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- Note: Default users are seeded automatically by the app
-- on first API call via userService.seedUsersIfEmpty()
