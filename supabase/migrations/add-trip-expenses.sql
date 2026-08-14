-- Manual trip expenses for traveling-mode budget tracking.
-- This project typically applies SQL in the Supabase dashboard (SQL Editor),
-- not via `supabase db push`. Run this file once in the SQL Editor.
-- Do not reuse leftover `expenses` / `budgets` tables.

create table if not exists public.trip_expenses (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric not null check (amount > 0),
  currency char(3) not null default 'USD',
  category text not null check (category in ('flights', 'hotel', 'food', 'activities', 'other')),
  note text,
  spent_on date not null default current_date,
  source text not null default 'manual' check (source in ('manual', 'bank_sync', 'import')),
  external_id text,
  merchant text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists trip_expenses_source_external_id_uidx
  on public.trip_expenses (source, external_id)
  where external_id is not null;

create index if not exists trip_expenses_trip_spent_idx
  on public.trip_expenses (trip_id, spent_on desc, created_at desc);

alter table public.trip_expenses enable row level security;

drop policy if exists "trip_expenses_select_own" on public.trip_expenses;
create policy "trip_expenses_select_own" on public.trip_expenses
  for select using (
    exists (
      select 1 from public.trips t
      where t.id = trip_expenses.trip_id and t.user_id = auth.uid()
    )
  );

drop policy if exists "trip_expenses_insert_own" on public.trip_expenses;
create policy "trip_expenses_insert_own" on public.trip_expenses
  for insert with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.trips t
      where t.id = trip_expenses.trip_id and t.user_id = auth.uid()
    )
  );

drop policy if exists "trip_expenses_update_own" on public.trip_expenses;
create policy "trip_expenses_update_own" on public.trip_expenses
  for update using (
    exists (
      select 1 from public.trips t
      where t.id = trip_expenses.trip_id and t.user_id = auth.uid()
    )
  );

drop policy if exists "trip_expenses_delete_own" on public.trip_expenses;
create policy "trip_expenses_delete_own" on public.trip_expenses
  for delete using (
    exists (
      select 1 from public.trips t
      where t.id = trip_expenses.trip_id and t.user_id = auth.uid()
    )
  );

create or replace function public.trip_expenses_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trip_expenses_set_updated_at on public.trip_expenses;
create trigger trip_expenses_set_updated_at
  before update on public.trip_expenses
  for each row
  execute function public.trip_expenses_set_updated_at();

comment on table public.trip_expenses is
  'Manual (and future import) expenses logged against a saved trip; RLS via trip ownership';
