-- Day-by-day itinerary blocks per stop (run once in Supabase SQL Editor)

create table if not exists public.trip_itinerary_days (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  stop_id text not null,
  day_index integer not null check (day_index >= 1),
  date date,
  blocks jsonb not null default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (trip_id, stop_id, day_index)
);

create index if not exists trip_itinerary_days_trip_id_idx
  on public.trip_itinerary_days(trip_id, stop_id, day_index);

alter table public.trip_itinerary_days enable row level security;

drop policy if exists "itinerary_days_select_own" on public.trip_itinerary_days;
create policy "itinerary_days_select_own" on public.trip_itinerary_days
  for select using (
    exists (
      select 1 from public.trips t
      where t.id = trip_itinerary_days.trip_id and t.user_id = auth.uid()
    )
  );

drop policy if exists "itinerary_days_insert_own" on public.trip_itinerary_days;
create policy "itinerary_days_insert_own" on public.trip_itinerary_days
  for insert with check (
    exists (
      select 1 from public.trips t
      where t.id = trip_itinerary_days.trip_id and t.user_id = auth.uid()
    )
  );

drop policy if exists "itinerary_days_update_own" on public.trip_itinerary_days;
create policy "itinerary_days_update_own" on public.trip_itinerary_days
  for update using (
    exists (
      select 1 from public.trips t
      where t.id = trip_itinerary_days.trip_id and t.user_id = auth.uid()
    )
  );

drop policy if exists "itinerary_days_delete_own" on public.trip_itinerary_days;
create policy "itinerary_days_delete_own" on public.trip_itinerary_days
  for delete using (
    exists (
      select 1 from public.trips t
      where t.id = trip_itinerary_days.trip_id and t.user_id = auth.uid()
    )
  );

comment on table public.trip_itinerary_days is
  'Light day-by-day starting-point plans per stop; blocks edited client-side or via chat tools';
