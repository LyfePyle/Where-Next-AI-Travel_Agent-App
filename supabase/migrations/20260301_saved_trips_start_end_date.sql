-- Align remote DB with API: POST /api/trips/saved inserts start_date, end_date.
-- Run in Supabase SQL Editor if migrations are not applied yet.

alter table public.saved_trips add column if not exists start_date date;
alter table public.saved_trips add column if not exists end_date date;
