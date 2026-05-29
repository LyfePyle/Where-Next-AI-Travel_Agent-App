-- ============================================
-- CART ITEMS TABLE SETUP
-- ============================================
-- Run this in your Supabase SQL Editor
-- This creates the cart_items table with RLS policies
-- ============================================

-- Step 1: Create cart_items table
create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trip_id uuid null,
  item_type text not null,
  title text not null,
  quantity int not null default 1,
  currency text not null default 'USD',
  unit_amount_cents int not null default 0,
  provider text,
  provider_ref text,
  item_payload jsonb,
  created_at timestamptz not null default now()
);

-- Step 2: Enable Row Level Security
alter table public.cart_items enable row level security;

-- Step 3: Create RLS policies
drop policy if exists "cart_select_own" on public.cart_items;
create policy "cart_select_own"
  on public.cart_items for select
  using (auth.uid() = user_id);

drop policy if exists "cart_insert_own" on public.cart_items;
create policy "cart_insert_own"
  on public.cart_items for insert
  with check (auth.uid() = user_id);

drop policy if exists "cart_update_own" on public.cart_items;
create policy "cart_update_own"
  on public.cart_items for update
  using (auth.uid() = user_id);

drop policy if exists "cart_delete_own" on public.cart_items;
create policy "cart_delete_own"
  on public.cart_items for delete
  using (auth.uid() = user_id);

-- Step 4: Create index for better performance
create index if not exists cart_items_user_id_idx on public.cart_items(user_id);
create index if not exists cart_items_trip_id_idx on public.cart_items(trip_id);

-- Step 5: Add helpful comments
comment on table public.cart_items is 'Shopping cart items for users';
comment on column public.cart_items.user_id is 'References auth.users(id)';
comment on column public.cart_items.trip_id is 'Optional reference to trip';
comment on column public.cart_items.item_type is 'Type of item: flight, hotel, tour, activity, etc.';
comment on column public.cart_items.unit_amount_cents is 'Price in cents (e.g., 1000 = $10.00)';



