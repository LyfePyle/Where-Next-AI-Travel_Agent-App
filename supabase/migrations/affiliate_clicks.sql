-- Affiliate click tracking (Prompt 3)
-- Run once in Supabase SQL Editor (project fmvejvxmbdvhqlqtnucx).
-- Idempotent: drops the legacy schema if present and recreates with the spec columns.

drop table if exists public.affiliate_clicks cascade;

create table public.affiliate_clicks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  trip_id uuid references public.trips(id) on delete set null,
  item_type text not null check (item_type in ('flight', 'hotel', 'tour', 'car')),
  partner text not null,
  url text not null,
  clicked_at timestamptz not null default now()
);

alter table public.affiliate_clicks enable row level security;

-- Guests (user_id null) and authenticated users may insert their own row
create policy "affiliate_clicks_insert"
  on public.affiliate_clicks for insert
  with check (user_id is null or auth.uid() = user_id);

-- Users can read only their own clicks (guest clicks are not readable via anon key)
create policy "affiliate_clicks_read_own"
  on public.affiliate_clicks for select
  using (auth.uid() = user_id);

create index if not exists affiliate_clicks_user_id_idx on public.affiliate_clicks(user_id);
create index if not exists affiliate_clicks_trip_id_idx on public.affiliate_clicks(trip_id);
create index if not exists affiliate_clicks_clicked_at_idx on public.affiliate_clicks(clicked_at desc);

comment on table public.affiliate_clicks is
  'Logs affiliate partner link clicks from Trip Hub, suggestions, and booking flows.';
