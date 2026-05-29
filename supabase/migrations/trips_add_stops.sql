-- =============================================================================
-- Migration: add stops column to trips table
-- Run once in the Supabase SQL Editor.
-- =============================================================================

-- Add the stops column (JSONB array of TripStop objects).
alter table public.trips
  add column if not exists stops jsonb default null;

-- Optional columns for backward compat
alter table public.trips
  add column if not exists adults integer default 1;

alter table public.trips
  add column if not exists kids integer default 0;

alter table public.trips
  add column if not exists vibe text default null;

-- Optional index for querying by stops
create index if not exists trips_stops_gin
  on public.trips using gin (stops);

comment on column public.trips.stops is
  'Array of TripStop objects: [{id, destination, startDate, endDate}]. Null for legacy single-destination trips.';
