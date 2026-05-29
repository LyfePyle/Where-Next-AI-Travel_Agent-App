-- =============================================================================
-- Migration: bookings webhook support
-- Run once in the Supabase SQL Editor.
-- =============================================================================

-- Store the payment intent ID so payment_failed events can look up the booking
alter table public.bookings
  add column if not exists stripe_payment_intent_id text default null;

-- Document valid status values
comment on column public.bookings.status is
  'pending | confirmed | expired | payment_failed | cancelled | refunded';

-- Index for webhook lookups by payment intent ID
create index if not exists bookings_stripe_payment_intent_idx
  on public.bookings (stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;
