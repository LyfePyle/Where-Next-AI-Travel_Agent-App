-- Optional travel blurbs on first/last itinerary days (run in Supabase SQL Editor).
-- Checkout morning of a stop shares a date with the next stop's arrival and has
-- no itinerary row; onward notes live on the last generated day of the departing stop.

alter table public.trip_itinerary_days
  add column if not exists travel_note text,
  add column if not exists travel_note_kind text;

comment on column public.trip_itinerary_days.travel_note is
  'Short Getting there / Heading out / Next morning blurb; not live directions';
