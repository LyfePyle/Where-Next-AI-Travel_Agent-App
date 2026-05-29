-- ============================================
-- BOOKINGS TABLE SETUP
-- ============================================
-- Run this in your Supabase SQL Editor
-- This creates the bookings table with RLS policies
-- ============================================

-- Step 1: Create bookings table
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trip_id uuid null,
  status text not null default 'pending',
  currency text not null default 'USD',
  total_amount_cents int not null default 0,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  booking_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Step 2: Enable Row Level Security
alter table public.bookings enable row level security;

-- Step 3: Create RLS policies
drop policy if exists "bookings_select_own" on public.bookings;
create policy "bookings_select_own"
  on public.bookings for select
  using (auth.uid() = user_id);

drop policy if exists "bookings_insert_own" on public.bookings;
create policy "bookings_insert_own"
  on public.bookings for insert
  with check (auth.uid() = user_id);

drop policy if exists "bookings_update_own" on public.bookings;
create policy "bookings_update_own"
  on public.bookings for update
  using (auth.uid() = user_id);

-- Step 4: Create index for better performance
create index if not exists bookings_user_id_idx on public.bookings(user_id);
create index if not exists bookings_trip_id_idx on public.bookings(trip_id);
create index if not exists bookings_stripe_session_idx on public.bookings(stripe_checkout_session_id);
create index if not exists bookings_status_idx on public.bookings(status);

-- Step 5: Create function to auto-update updated_at timestamp
create or replace function public.set_booking_updated_at()
returns trigger 
language plpgsql 
as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- Step 6: Create trigger to auto-update updated_at on booking updates
drop trigger if exists bookings_set_updated_at on public.bookings;
create trigger bookings_set_updated_at
  before update on public.bookings
  for each row 
  execute function public.set_booking_updated_at();

-- Step 7: Add helpful comments
comment on table public.bookings is 'User bookings for trips and services';
comment on column public.bookings.user_id is 'References auth.users(id)';
comment on column public.bookings.trip_id is 'Optional reference to trip';
comment on column public.bookings.status is 'Booking status: pending, paid, cancelled, refunded';
comment on column public.bookings.stripe_checkout_session_id is 'Stripe checkout session ID';
comment on column public.bookings.total_amount_cents is 'Total price in cents (e.g., 10000 = $100.00)';



