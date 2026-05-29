# Claude handover — Where Next: what’s left

**Purpose:** Onboard Claude (or any agent) with accurate remaining work for the whole project. Prefer this file over older status docs when they conflict with the codebase.

---

## Project snapshot

**What it is:** Marketing + trip planning (AI suggestions, itinerary), saved trips, booking/checkout with Stripe, optional flight/hotel paths (Amadeus/Duffel where wired).

**Stack:** Next.js App Router (`src/app`), Supabase (auth + DB), Stripe Checkout + webhooks, APIs under `src/app/api`.

---

## Recently verified / fixed (don’t re-litigate)

- **`src/app/api/bookings/by-session/route.ts`:** Invalid destructuring `data: bookingRow: bookingRowInit` was fixed to `data: bookingRowInit` (TypeScript compile blocker).
- **Stripe CLI → local webhooks:** Forwarding to `http://localhost:3000/api/webhooks/stripe` should return **200** for `checkout.session.completed` and related events when `STRIPE_WEBHOOK_SECRET` matches the `whsec_…` from **`stripe listen`**.
- **Two webhook route files exist:** `src/app/api/webhooks/stripe/route.ts` and `src/app/api/stripe/webhook/route.ts`. Local **`stripe listen`** uses **`/api/webhooks/stripe`**. Pick one canonical implementation and avoid divergent behavior.

---

## Stale documentation warning

These files are **partially outdated** — verify against code:

- **`UNFINISHED_ITEMS_DETAILED.md`** — Claims **`/api/trips` POST may be missing**; **`src/app/api/trips/route.ts` already exports `POST`**. Remaining work is **E2E verification** from the UI, not necessarily creating the route.
- **`WHERE_WE_ARE_NOW.md`** — May over-emphasize login as the only blocker; **booking + production hardening** are major product gaps.
- Older API lists may reference **`/api/payments/webhook`** only; the forward URL in use is **`/api/webhooks/stripe`**.

**Rule:** Trust the code and a fresh smoke test over markdown percentages.

---

## What’s left (prioritized)

### P0 — Money path and data correctness

1. **Booking funnel E2E**  
   Trip details → `booking` → `booking/checkout` (Stripe) → confirmation. Ensure **URL params** (`tripId`, dates, destination) are read and passed consistently.  
   Relevant areas: `TripDetailsEnhanced.tsx`, `src/app/booking/page.tsx`, `src/app/booking/checkout/page.tsx`, `src/app/booking/confirmation/page.tsx`.

2. **Webhook handler behavior**  
   On `checkout.session.completed` (and any other handled events): **update `bookings`** (status, `confirmed_at`, session / payment identifiers as stored in schema). Confirm idempotency and alignment with **`GET /api/bookings/by-session`** fallback logic.

3. **Single webhook implementation**  
   Consolidate **`/api/webhooks/stripe`** vs **`/api/stripe/webhook`**; document the canonical URL; remove or thin-wrapper the duplicate.

4. **Supabase schema vs code**  
   Run/verify migrations per **`docs/DEPLOY_CHECKLIST.md`** (`bookings`, `trips`, `profiles`, `confirmed_at`, webhook-related columns). Fix **column / FK** mismatches between API routes and DB.

### P1 — UX and navigation

1. **Route naming:** `/search` vs **`/explore`** — choose strategy (alias vs rename) and update nav.  
2. **Consistent nav:** `TopNav`, `AppNavigation`, `GlobalNav` — reduce duplication and fix broken deep links.  
3. **Booking flow back links** and **profile → trips / saved** — confirm real routes under `src/app` (e.g. `/trips`, `/saved`).

### P2 — Polish and production

1. **Error boundaries, loading, empty states** (see `UNFINISHED_ITEMS_DETAILED.md` for ideas).  
2. **E2E tests** (`e2e/`) — align with current routes; add CI if desired.  
3. **Deploy:** **`docs/DEPLOY_CHECKLIST.md`** — production Stripe webhook URL, live keys, `NEXT_PUBLIC_APP_URL`, Vercel env parity.

### P3 — Integrations

- **Duffel / Amadeus / AI gateway:** Which flows are demo vs production; env vars per **`ENV_TEMPLATE.md`** / **`docs/SETUP_AND_MANUAL_TASKS.md`** (if used).

---

## Key files / areas

| Area | Location |
|------|----------|
| Bookings API | `src/app/api/bookings/`, `src/app/api/bookings/by-session/route.ts` |
| Stripe webhooks | `src/app/api/webhooks/stripe/route.ts`, `src/app/api/stripe/webhook/route.ts` |
| Trips API | `src/app/api/trips/route.ts`, `src/app/api/trips/[id]/route.ts` |
| Booking UI | `src/app/booking/**`, `src/components/booking/` |
| Trip details | `src/components/TripDetailsEnhanced.tsx`, related trip detail components |
| Supabase | `src/lib/supabase.ts`, `src/utils/supabase/client.ts`, `supabase/migrations/` |
| Deploy / env | `.env.local` (never commit), `docs/DEPLOY_CHECKLIST.md` |

---

## Definition of done — smoke test

1. Sign up / login → profile loads without `profiles` / RLS errors.  
2. Open or create a trip → **Book** → Stripe test card → **confirmation** shows booking (+ receipt when applicable).  
3. `bookings` row **confirmed** with **`confirmed_at`** via webhook or by-session fallback.  
4. Dashboard or trips UI reflects the booking.  
5. Production: webhook endpoint registered + **live** `STRIPE_WEBHOOK_SECRET` on Vercel.

---

## First session checklist for Claude

1. Run **booking E2E** locally with **`stripe listen`**; note every broken link or missing query param.  
2. **Diff** the two Stripe webhook routes and merge behavior into one canonical path.  
3. Update or supersede **`UNFINISHED_ITEMS_DETAILED.md`** checks with verified tasks (optional cleanup).

---

*Last updated from repo review and recent fixes; verify dates and priorities against `git` and production needs.*
