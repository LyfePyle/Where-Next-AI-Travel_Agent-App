-- ============================================
-- PROFILES TABLE SETUP
-- ============================================
-- Run this in your Supabase SQL Editor
-- This creates the profiles table with RLS policies
-- and a trigger to auto-create profiles for new users
-- ============================================

-- Step 1: Create profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  full_name text,
  avatar_url text
);

-- Step 2: Enable Row Level Security
alter table public.profiles enable row level security;

-- Step 3: Create RLS policies (idempotent - safe to re-run)
-- Policy: Users can read their own profile
drop policy if exists "profiles_read_own" on public.profiles;
create policy "profiles_read_own"
  on public.profiles for select
  using (auth.uid() = id);

-- Policy: Users can insert their own profile
-- Note: You can remove this if you only want server-side inserts via trigger
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Policy: Users can update their own profile
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- Step 4: Create function to handle new user creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Step 5: Check for existing trigger and drop if needed
do $$
declare
  trigger_exists boolean;
begin
  select exists (
    select 1
    from information_schema.triggers
    where trigger_schema = 'auth'
    and trigger_name = 'on_auth_user_created'
    and event_object_table = 'users'
  ) into trigger_exists;
  
  if trigger_exists then
    drop trigger if exists on_auth_user_created on auth.users;
  end if;
end $$;

-- Step 6: Create trigger for new user creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Step 7: Create function to auto-update updated_at timestamp
create or replace function public.set_updated_at()
returns trigger 
language plpgsql 
as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- Step 8: Create trigger to auto-update updated_at on profile updates
drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row 
  execute function public.set_updated_at();

-- Step 9: Create index for better performance
create index if not exists profiles_id_idx on public.profiles(id);

-- Step 10: Add helpful comments
comment on table public.profiles is 'User profile information linked to auth.users';
comment on column public.profiles.id is 'References auth.users(id)';
comment on column public.profiles.full_name is 'User full name';
comment on column public.profiles.avatar_url is 'URL to user avatar image';
comment on function public.set_updated_at() is 'Automatically updates updated_at timestamp on profile updates';

-- ============================================
-- VERIFICATION QUERIES (Optional - run to verify)
-- ============================================

-- Check if table was created
-- select * from information_schema.tables where table_name = 'profiles';

-- Check if policies exist
-- select * from pg_policies where tablename = 'profiles';

-- Check if trigger exists
-- select trigger_name, action_timing, event_manipulation
-- from information_schema.triggers
-- where event_object_schema = 'auth' 
-- and event_object_table = 'users'
-- and trigger_name = 'on_auth_user_created';

