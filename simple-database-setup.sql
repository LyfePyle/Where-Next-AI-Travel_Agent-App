-- Drop tables if they already exist (for a clean start)
drop table if exists tours cascade;
drop table if exists expenses cascade;
drop table if exists trips cascade;
drop table if exists profiles cascade;

-- ========================
-- 1. PROFILES
-- ========================
create table profiles (
    id uuid primary key references auth.users on delete cascade,
    name text,
    email text,
    avatar_url text,
    created_at timestamp with time zone default now()
);

-- ========================
-- 2. TRIPS
-- ========================
create table trips (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references profiles(id) on delete cascade,
    destination text not null,
    start_date date not null,
    end_date date not null,
    budget numeric,
    created_at timestamp with time zone default now()
);

-- ========================
-- 3. EXPENSES
-- ========================
create table expenses (
    id uuid primary key default gen_random_uuid(),
    trip_id uuid references trips(id) on delete cascade,
    category text not null,
    description text,
    amount numeric not null,
    currency text default 'USD',
    spent_at timestamp with time zone default now()
);

-- ========================
-- 4. TOURS
-- ========================
create table tours (
    id uuid primary key default gen_random_uuid(),
    trip_id uuid references trips(id) on delete cascade,
    title text not null,
    description text,
    location text,
    created_at timestamp with time zone default now()
);

-- ========================
-- Row Level Security
-- ========================
alter table profiles enable row level security;
alter table trips enable row level security;
alter table expenses enable row level security;
alter table tours enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Users can view their own profile" on profiles;
drop policy if exists "Users can update their own profile" on profiles;
drop policy if exists "Users can manage their own trips" on trips;
drop policy if exists "Users can manage their own expenses" on expenses;
drop policy if exists "Users can manage their own tours" on tours;

-- PROFILES policies
create policy "Users can view their own profile"
on profiles for select
using (auth.uid() = id);

create policy "Users can update their own profile"
on profiles for update
using (auth.uid() = id);

-- TRIPS policies
create policy "Users can manage their own trips"
on trips for all
using (auth.uid() = user_id);

-- EXPENSES policies
create policy "Users can manage their own expenses"
on expenses for all
using (
    auth.uid() in (
        select user_id from trips where trips.id = expenses.trip_id
    )
);

-- TOURS policies
create policy "Users can manage their own tours"
on tours for all
using (
    auth.uid() in (
        select user_id from trips where trips.id = tours.trip_id
    )
);

-- ========================
-- Helper function: auto-create profile on signup
-- ========================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, new.raw_user_meta_data->>'name');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
