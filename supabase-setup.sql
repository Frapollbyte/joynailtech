-- Run this in Supabase: Dashboard > SQL Editor > New Query

-- ─────────────────────────────────────────
-- 1. Bookings table
-- ─────────────────────────────────────────
create table if not exists bookings (
  id          uuid default gen_random_uuid() primary key,
  name        text not null,
  phone       text not null,
  email       text,
  service     text not null,
  date        date not null,
  time        text not null,
  status      text not null default 'pending'
                check (status in ('pending','confirmed','cancelled','completed')),
  notes       text,
  created_at  timestamptz default now()
);

-- Index for fast filtering by date and status
create index if not exists bookings_date_idx   on bookings (date);
create index if not exists bookings_status_idx on bookings (status);

-- ─────────────────────────────────────────
-- 2. Admins table
-- ─────────────────────────────────────────
create table if not exists admins (
  id            uuid default gen_random_uuid() primary key,
  email         text unique not null,
  password_hash text not null,
  created_at    timestamptz default now()
);

-- ─────────────────────────────────────────
-- 3. Row Level Security
-- Block all direct client access — your Node.js server
-- uses the service role key which bypasses RLS.
-- ─────────────────────────────────────────
alter table bookings enable row level security;
alter table admins   enable row level security;

-- No public policies — only service role can read/write
-- This means the tables are locked down; only your backend can touch them.

-- ─────────────────────────────────────────
-- 4. Gallery bucket (Storage)
-- Run this in Supabase Dashboard:
--   Storage > New Bucket > Name: "gallery" > Public: YES
-- Or run the SQL below:
-- ─────────────────────────────────────────
-- insert into storage.buckets (id, name, public)
-- values ('gallery', 'gallery', true)
-- on conflict (id) do nothing;
