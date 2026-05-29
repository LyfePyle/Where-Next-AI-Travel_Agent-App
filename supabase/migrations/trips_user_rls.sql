-- Ensure `trips` table exists with columns used by /api/trips/save and Trip Hub
alter table public.trips add column if not exists destination text;
alter table public.trips add column if not exists title text;
alter table public.trips add column if not exists budget_amount numeric;
alter table public.trips add column if not exists travelers integer;
alter table public.trips add column if not exists status text default 'saved';

-- user_id nullable for legacy rows; new saves require auth
alter table public.trips alter column user_id drop not null;

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
