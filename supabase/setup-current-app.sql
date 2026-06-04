-- =============================================================================
-- Where Next — one-shot setup for a fresh Supabase project
-- Run this ENTIRE file once in the Supabase SQL Editor (new project).
-- Idempotent: safe to re-run. Creates profiles, trips, bookings + RLS + the
-- auth trigger that auto-creates a profile row for every new user.
-- Matches exactly the columns the current app reads/writes.
-- =============================================================================

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────────────────────
-- PROFILES
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_read_own" on public.profiles;
create policy "profiles_read_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Auto-create a profile when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────────────────
-- TRIPS  (every column the current app reads/writes)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text,
  destination text,
  start_date date,
  end_date date,
  budget_amount numeric,
  budget_cents bigint,
  adults integer default 1,
  kids integer default 0,
  travelers integer,
  vibe text,
  stops jsonb,
  preferences jsonb,
  status text default 'saved',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- In case the table already existed without these columns:
alter table public.trips add column if not exists title text;
alter table public.trips add column if not exists destination text;
alter table public.trips add column if not exists start_date date;
alter table public.trips add column if not exists end_date date;
alter table public.trips add column if not exists budget_amount numeric;
alter table public.trips add column if not exists budget_cents bigint;
alter table public.trips add column if not exists adults integer default 1;
alter table public.trips add column if not exists kids integer default 0;
alter table public.trips add column if not exists travelers integer;
alter table public.trips add column if not exists vibe text;
alter table public.trips add column if not exists stops jsonb;
alter table public.trips add column if not exists preferences jsonb;
alter table public.trips add column if not exists status text default 'saved';

alter table public.trips enable row level security;

drop policy if exists "trips_select_own" on public.trips;
create policy "trips_select_own" on public.trips
  for select using (auth.uid() = user_id);

drop policy if exists "trips_insert_own" on public.trips;
create policy "trips_insert_own" on public.trips
  for insert with check (auth.uid() = user_id);

drop policy if exists "trips_update_own" on public.trips;
create policy "trips_update_own" on public.trips
  for update using (auth.uid() = user_id);

drop policy if exists "trips_delete_own" on public.trips;
create policy "trips_delete_own" on public.trips
  for delete using (auth.uid() = user_id);

create index if not exists trips_user_id_idx on public.trips(user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- BOOKINGS  (Trip Hub reads the latest booking per trip; optional at launch)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  trip_id uuid references public.trips(id) on delete set null,
  status text default 'pending',
  total_amount numeric,
  total_amount_cents bigint,
  currency char(3) default 'USD',
  confirmed_at timestamptz,
  stripe_session_id text,
  stripe_payment_intent_id text,
  traveler_name text,
  traveler_email text,
  created_at timestamptz default now()
);

alter table public.bookings enable row level security;

drop policy if exists "bookings_select_own" on public.bookings;
create policy "bookings_select_own" on public.bookings
  for select using (auth.uid() = user_id);

drop policy if exists "bookings_insert_own" on public.bookings;
create policy "bookings_insert_own" on public.bookings
  for insert with check (auth.uid() = user_id);

drop policy if exists "bookings_update_own" on public.bookings;
create policy "bookings_update_own" on public.bookings
  for update using (auth.uid() = user_id);

create index if not exists bookings_trip_id_idx on public.bookings(trip_id);
create index if not exists bookings_user_id_idx on public.bookings(user_id);

-- =============================================================================
-- VERIFY (optional): should list bookings, profiles, trips
-- select table_name from information_schema.tables
-- where table_schema = 'public' order by table_name;
-- =============================================================================
