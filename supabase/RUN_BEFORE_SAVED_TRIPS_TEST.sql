-- =============================================================================
-- RUN THIS ONCE in Supabase → SQL Editor → Run
-- Before testing save /saved /my-trip flow
-- =============================================================================

-- 1) Columns Trip Hub + save API need
alter table public.trips add column if not exists destination text;
alter table public.trips add column if not exists title text;
alter table public.trips add column if not exists budget_amount numeric;
alter table public.trips add column if not exists travelers integer;
alter table public.trips add column if not exists status text default 'saved';
alter table public.trips add column if not exists stops jsonb default null;
alter table public.trips add column if not exists adults integer default 1;
alter table public.trips add column if not exists kids integer default 0;
alter table public.trips add column if not exists vibe text default null;

-- Legacy rows may have null user_id
alter table public.trips alter column user_id drop not null;

-- 2) RLS — required or /saved stays empty even when rows exist
alter table public.trips enable row level security;

drop policy if exists "Users can view own trips" on public.trips;
create policy "Users can view own trips"
  on public.trips for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own trips" on public.trips;
create policy "Users can insert own trips"
  on public.trips for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own trips" on public.trips;
create policy "Users can update own trips"
  on public.trips for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own trips" on public.trips;
create policy "Users can delete own trips"
  on public.trips for delete
  using (auth.uid() = user_id);

-- =============================================================================
-- 3) VERIFY — should return 4 rows (SELECT, INSERT, UPDATE, DELETE)
-- =============================================================================
select policyname, cmd, qual
from pg_policies
where schemaname = 'public' and tablename = 'trips'
order by cmd;
