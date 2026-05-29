-- Optional: run in Supabase SQL editor if you want tours saved to the DB.
-- RLS: users can only see their own tours.

create table if not exists public.walking_tours (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trip_id uuid references public.trips(id) on delete set null,
  city text not null,
  country text not null,
  title text,
  stops jsonb not null default '[]',
  raw_response jsonb,
  created_at timestamptz not null default now()
);

create index if not exists walking_tours_user_id_idx on public.walking_tours(user_id);
create index if not exists walking_tours_trip_id_idx on public.walking_tours(trip_id);
create index if not exists walking_tours_created_at_idx on public.walking_tours(created_at desc);

alter table public.walking_tours enable row level security;

create policy "Users can view own walking tours"
  on public.walking_tours for select
  using (auth.uid() = user_id);

create policy "Users can insert own walking tours"
  on public.walking_tours for insert
  with check (auth.uid() = user_id);

create policy "Users can update own walking tours"
  on public.walking_tours for update
  using (auth.uid() = user_id);

create policy "Users can delete own walking tours"
  on public.walking_tours for delete
  using (auth.uid() = user_id);
