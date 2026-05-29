-- =============================================================================
-- Migration: add confirmed_at to bookings
-- Run once in the Supabase SQL Editor.
-- =============================================================================

alter table public.bookings
  add column if not exists confirmed_at timestamptz default null;

comment on column public.bookings.confirmed_at is
  'Timestamp when the booking was marked confirmed. '
  'Set by the confirmation page (on-view) or the Stripe webhook (reliable path).';
