-- ============================================
-- TRAVELER PROFILES (for "save my details for next time")
-- ============================================
-- Run in Supabase SQL Editor if you want to support saving lead traveler details.
-- ============================================

create table if not exists public.traveler_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- Personal
  given_name text not null,
  family_name text not null,
  email text not null,
  phone text,
  title text,           -- Mr, Mrs, Ms, etc.
  date_of_birth date,
  gender text,          -- male, female, unspecified
  -- Travel docs (sensitive – only store if user opts in)
  passport_number text,
  passport_expiry date,
  passport_issuing_country_code text,  -- ISO 3166-1 alpha-2
  nationality_country_code text,       -- ISO 3166-1 alpha-2
  --
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)  -- one saved profile per user (lead traveler)
);

alter table public.traveler_profiles enable row level security;

drop policy if exists "traveler_profiles_select_own" on public.traveler_profiles;
create policy "traveler_profiles_select_own"
  on public.traveler_profiles for select
  using (auth.uid() = user_id);

drop policy if exists "traveler_profiles_insert_own" on public.traveler_profiles;
create policy "traveler_profiles_insert_own"
  on public.traveler_profiles for insert
  with check (auth.uid() = user_id);

drop policy if exists "traveler_profiles_update_own" on public.traveler_profiles;
create policy "traveler_profiles_update_own"
  on public.traveler_profiles for update
  using (auth.uid() = user_id);

create index if not exists traveler_profiles_user_id_idx on public.traveler_profiles(user_id);

comment on table public.traveler_profiles is 'Saved lead traveler details (opt-in) for returning users';
