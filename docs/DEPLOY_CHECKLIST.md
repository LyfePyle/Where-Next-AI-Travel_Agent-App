# Where Next — Deploy Prep Checklist

Complete every item before going live. Items are ordered: DB → env vars → Stripe → test → deploy.

---

## 1. Supabase — run all migrations

Open the Supabase SQL Editor and run each file in order. Each is idempotent (`if not exists`) so re-running is safe.

| Order | File | What it adds |
|-------|------|-------------|
| 1 | `supabase/setup-profiles.sql` | `profiles` table (required for auth) |
| 2 | `supabase/setup-bookings.sql` | `bookings` table + RLS |
| 3 | `supabase/migrations/traveler_profiles.sql` | `traveler_profiles` table + RLS (if present) |
| 4 | `supabase/migrations/trips_add_stops.sql` | `stops`, `adults`, `kids`, `vibe` columns on `trips` |
| 5 | `supabase/migrations/bookings_add_confirmed_at.sql` | `confirmed_at` on `bookings` |
| 6 | `supabase/migrations/bookings_webhook_support.sql` | `stripe_payment_intent_id` + index |

**Verify the FK exists:**
```sql
-- bookings.trip_id must reference trips.id for the dashboard join to work
select conname, contype
from pg_constraint
where conrelid = 'public.bookings'::regclass
  and contype = 'f';
```
If the FK is missing:
```sql
alter table public.bookings
  add constraint bookings_trip_id_fkey
  foreign key (trip_id) references public.trips(id) on delete set null;
```

---

## 2. Environment variables

### Local (`.env.local`)
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...         # server-side only, never expose client-side

# Stripe — use TEST keys until you're ready to go live
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...          # from `stripe listen` (dev) or dashboard (prod)

# Duffel
DUFFEL_API_KEY=duffel_test_...           # swap to duffel_live_... for production

# OpenAI
OPENAI_API_KEY=sk-...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000  # swap to https://yourdomain.com for prod
```

### Production (Vercel → Settings → Environment Variables)
Copy all of the above, then change:
- `NEXT_PUBLIC_APP_URL` → `https://yourdomain.com`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` → `pk_live_...`
- `STRIPE_SECRET_KEY` → `sk_live_...`
- `STRIPE_WEBHOOK_SECRET` → the live webhook secret (see Step 4)
- `DUFFEL_API_KEY` → `duffel_live_...`

> **Never** commit `.env.local` to git. Confirm `.gitignore` includes it.

---

## 3. Stripe — test keys checklist

Before swapping to live keys, verify the full test flow:

- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` starts with `pk_test_`
- [ ] `STRIPE_SECRET_KEY` starts with `sk_test_`
- [ ] Complete a payment using test card `4242 4242 4242 4242`, any future date, any CVC
- [ ] Confirm booking appears in Supabase `bookings` table with `status = confirmed`
- [ ] Confirm `confirmed_at` is populated (webhook or confirm-on-view)
- [ ] Confirmation page shows booking ref, amount, receipt link
- [ ] Dashboard shows the booking under Upcoming

---

## 4. Stripe webhook — register the endpoint

### Local development
```bash
# Install Stripe CLI if not already: https://stripe.com/docs/stripe-cli
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# Copy the whsec_... value printed and set it as STRIPE_WEBHOOK_SECRET in .env.local
```

### Production
1. Go to [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **Add endpoint**
3. URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select events to listen for:
   - `checkout.session.completed` ✅ (required)
   - `checkout.session.expired` ✅ (recommended)
   - `payment_intent.payment_failed` ✅ (recommended)
5. Click **Add endpoint**
6. Copy the **Signing secret** (`whsec_...`) → add as `STRIPE_WEBHOOK_SECRET` in Vercel env vars
7. Redeploy so the new env var takes effect

### Verify webhook is working
```bash
# Trigger a test event from the Stripe dashboard or CLI:
stripe trigger checkout.session.completed
# Check Vercel function logs for: [webhook] Booking confirmed: <id>
```

---

## 5. Duffel — swap to live key

1. Get your live API key from [Duffel Dashboard → API Keys](https://app.duffel.com/developers/api-tokens)
2. Update `DUFFEL_API_KEY` in Vercel env vars to `duffel_live_...`
3. Note: live Duffel calls create real bookings and charge real money — only enable when fully tested

---

## 6. Vercel deployment

```bash
# Install Vercel CLI if needed
npm i -g vercel

# Deploy from repo root
vercel --prod
```

Or connect the GitHub repo in the Vercel dashboard for automatic deploys on push to `main`.

**Build settings** (Vercel auto-detects Next.js, but verify):
- Framework: Next.js
- Build command: `npm run build`
- Output directory: `.next`
- Node version: 18.x or 20.x

**After first deploy:**
- [ ] Visit `https://yourdomain.com` — site loads
- [ ] Visit `https://yourdomain.com/auth/login` — login works
- [ ] Run the full booking flow end-to-end with test card
- [ ] Check Vercel function logs for any errors
- [ ] Confirm webhook fires (Stripe dashboard → webhook → recent deliveries)

---

## 7. Pre-launch final checks

### Security
- [ ] `.env.local` is in `.gitignore`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is **only** used server-side (API routes) — never in client components
- [ ] Passport data never appears in URLs (confirmed by the HttpOnly cookie approach)
- [ ] Stripe webhook signature verification is active (the `constructEvent` call in the webhook route)
- [ ] Supabase RLS is enabled on `bookings`, `trips`, `traveler_profiles` tables

### UX
- [ ] Remove the test card hint from checkout page before going live (if present)
- [ ] Update `NEXT_PUBLIC_APP_URL` — Stripe success/cancel URLs will be wrong if this is still `localhost`
- [ ] Check all nav links resolve correctly in production
- [ ] Confirm `/explore` → `/search` redirect works on the live domain

### Stripe live key swap
Only do this when fully tested on test keys:
1. Replace `pk_test_` → `pk_live_` in Vercel env vars
2. Replace `sk_test_` → `sk_live_` in Vercel env vars
3. Update webhook signing secret to the live endpoint's `whsec_`
4. Redeploy

---

## 8. Post-deploy monitoring

- **Vercel logs**: Functions tab → filter by `/api/webhooks/stripe` to monitor webhook events
- **Stripe dashboard**: Developers → Webhooks → your endpoint → Recent deliveries
- **Supabase**: Table Editor → `bookings` — spot-check that `status` is updating correctly
- **Error tracking**: Consider adding [Sentry](https://sentry.io) (`npm i @sentry/nextjs`) for production error visibility

---

## Quick reference — all migrations in order

```sql
-- Run these in the Supabase SQL Editor, one at a time:
-- 1. supabase/setup-profiles.sql
-- 2. supabase/setup-bookings.sql
-- 3. supabase/migrations/traveler_profiles.sql (if present)
-- 4. supabase/migrations/trips_add_stops.sql
-- 5. supabase/migrations/bookings_add_confirmed_at.sql
-- 6. supabase/migrations/bookings_webhook_support.sql
```
