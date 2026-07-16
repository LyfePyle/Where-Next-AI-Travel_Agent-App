-- Persist AI-generated trip preview content (description, whyItFits, highlights,
-- cost bands, crowd/weather/seasonality) so trip-details pages render fully when
-- reopened by ID without URL query params.
alter table public.trips add column if not exists suggestions jsonb default '{}'::jsonb;

comment on column public.trips.suggestions is
  'AI preview blob: description, whyItFits, highlights, flightBand, hotelBand, etc.';
