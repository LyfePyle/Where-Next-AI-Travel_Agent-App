# Stripe Checkout + Bookings Table

## 1. Stripe keys (test mode)

- In **dashboard.stripe.com** toggle **Test mode** (top right).
- Go to **Developers → API keys** and copy:
  - **Publishable key** (`pk_test_...`) → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - **Secret key** (`sk_test_...`) → `STRIPE_SECRET_KEY`
- In `.env.local` set those variables (live keys are commented out for safety).

## 2. Bookings table in Supabase

The route **POST /api/checkout/session** creates a row in the `bookings` table and then a Stripe Checkout session. If the table is missing, the API will return a 500.

**Create the table:** run the SQL in **Supabase Dashboard → SQL Editor**:

- **File:** `supabase/setup-bookings.sql`

That script creates `public.bookings` (with `user_id`, `trip_id`, `status`, `currency`, `total_amount_cents`, `stripe_checkout_session_id`, etc.), enables RLS, and adds policies so users can only see and update their own bookings.

## 3. Flow

1. User clicks **Pay now** on `/booking/checkout`.
2. Frontend calls **POST /api/checkout/session** with `{ tripId, amount_cents, currency }`.
3. API creates a `bookings` row (status `pending`), creates a Stripe Checkout session, updates the booking with `stripe_checkout_session_id`, and returns `{ url }`.
4. Frontend redirects to `url` (Stripe hosted checkout).
5. After payment, Stripe redirects to **success_url:** `/booking/confirmation?session_id={CHECKOUT_SESSION_ID}`.
6. Confirmation page shows “Booking confirmed” and can read `session_id` from the URL.

Test card in Stripe test mode: **4242 4242 4242 4242**.
