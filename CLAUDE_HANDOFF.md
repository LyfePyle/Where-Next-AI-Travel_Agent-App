# Claude Handoff — Where Next AI Travel Agent

**Purpose:** Give Claude (or any AI) full context: what this project is, what’s done, what’s in progress, and what to do next.  
**Last updated:** March 1, 2025.

---

## 1. What This Project Is

**App name:** Where Next  
**Type:** AI-powered travel planning and booking web app.

**User journey (intended):**
1. **Landing** → Plan Trip (destination, dates, budget, vibe).
2. **AI suggestions** → User picks a suggestion.
3. **Trip details** → À la carte builder (flights, hotels, experiences, transport, insurance); user selects options, total updates; Save or Book.
4. **Booking** → Lead traveler form (name, email, phone; **next: passport details**), then Continue to Checkout.
5. **Checkout** → Stripe Checkout (redirect to Stripe, then back to confirmation).
6. **Confirmation** → Show booking confirmed; optionally show real booking details from session.

**Tech:** Next.js 15 (App Router), TypeScript, Tailwind, Supabase (auth + Postgres), OpenAI (suggestions, itinerary, assistant), **Duffel** (flights + hotels/stays — primary), Stripe (payments). Amadeus is legacy/fallback for flights only.

**Repo:** Single Next.js app: `src/app/` (pages + API routes), `src/components/`, `src/lib/`, `src/contexts/AppContext.tsx`, Supabase in `supabase/`.

---

## 2. User’s Prioritized Roadmap (In Order)

1. **Booking form (passport details, pass-through to Duffel order)** — ✅ **Already built.** Lead traveler form with passport, DOB, gender, title; “Save my details for next time”; data flow via HttpOnly cookie + opaque token. Implementation complete.
2. **Navigation cleanup** — One global nav; fix `/explore` vs `/search`; consolidate TopNav + AppNavigation.
3. **Multi-destination trips** — Paris → Amsterdam → Berlin; schema and AI support it; add UI for stops.
4. **Dashboard** — Show past bookings, trip status.
5. **Confirmation page** — Show real booking details from session/booking record.
6. **Stripe checkout** — **Largely done**; paste test keys, ensure bookings table exists; optional webhook for `checkout.session.completed`.
7. **Deploy prep** — Env vars, production DB, Stripe webhook URL, swap to live keys when ready.

---

## 3. What’s Done (Recent + Existing)

### 3.1 Flights & Hotels — Duffel

- **Flights:** `src/app/api/booking/flights/search/route.ts` — POST, body: `origin`, `destination`, `departDate`, `returnDate?`, `adults`, `currency?`. Calls Duffel v2 `/air/offer_requests` then `/air/offers`. Returns normalized offers (airline, times, price, `rawOfferId` for booking). Uses `DUFFEL_API_KEY` from `.env.local`.
- **Hotels (Stays):** `src/app/api/booking/hotels/search/route.ts` — POST, body: `destination`, `checkIn`, `checkOut`, `adults`, `rooms?`. Geocodes via Duffel places, then `/stays/search`. Returns normalized results with `rawResultId`, `accommodationId`.
- **Legacy:** `src/app/api/flights/search/route.ts` — GET; prefers Duffel (via `src/lib/duffel.ts`) when `DUFFEL_API_KEY` set, else Amadeus, else fallback. Used by trip-details and itinerary.

### 3.2 Trip Details — À la carte

- **Page:** `src/app/trip-details/[id]/page.tsx` — reads `id` + query params; resolves empty `destination` via `GET /api/trips/[id]`.
- **UI:** `src/components/TripDetailsAlacarte.tsx` — hero (destination, dates, travelers, live total), sections: Flights (pick one), Hotels (pick one), Experiences, Transport, Travel Insurance (multi or pick one). Sticky sidebar with line items and “Book My Trip”. **Primary CTA:** “Reserve this trip” / “Continue to booking” → `/booking?tripId=...&destination=...&startDate=...&endDate=...&adults=...&kids=...&budgetAmount=...`. Save trip and Share buttons. Old card-based UI remains in `TripDetailsEnhanced.tsx` (not used by trip-details page currently).

### 3.3 Stripe Checkout (Wired)

- **.env.local:** Stripe keys switched to test placeholders (`pk_test_`, `sk_test_`); user must paste full keys. Live keys commented out.
- **Checkout page:** `src/app/booking/checkout/page.tsx` — “Pay now” calls `POST /api/checkout/session` with `{ tripId, amount_cents, currency: 'USD' }`, then redirects to `data.url` (Stripe Checkout). On 401, redirects to login.
- **Session API:** `src/app/api/checkout/session/route.ts` — Requires Supabase user. Creates row in `bookings` (user_id, trip_id if UUID, status pending, total_amount_cents, currency), creates Stripe Checkout session, updates booking with `stripe_checkout_session_id`, returns `{ sessionId, url, booking_id }`. Success URL: `/booking/confirmation?session_id={CHECKOUT_SESSION_ID}`.
- **Confirmation:** `src/app/booking/confirmation/page.tsx` — Reads `session_id` from URL; shows “Payment completed via Stripe” when present. Still shows tripId/destination/amount from params when available.
- **Bookings table:** `supabase/setup-bookings.sql` — Run in Supabase SQL Editor to create `public.bookings` (id, user_id, trip_id, status, currency, total_amount_cents, stripe_checkout_session_id, etc.) and RLS. Required for checkout session API.
- **Doc:** `docs/STRIPE_CHECKOUT_SETUP.md` — Test keys, bookings table, flow, test card 4242 4242 4242 4242.

### 3.4 Booking Page (#1 — Done)

- **File:** `src/app/booking/page.tsx`. Lead traveler form with passport details, DOB, gender, title; optional “Save my details for next time.” Data flow: HttpOnly cookie + opaque token; no passport in URL. Checkout receives traveler payload for Duffel order. If the form was rebuilt elsewhere, ensure booking page and checkout session/API are still aligned.
- **Context:** `src/contexts/AppContext.tsx` — `user` from Supabase (useApp().user). Traveler profile load/save uses `traveler_profiles` table and GET/POST API when “save for next time” is used.

### 3.5 Traveler Profiles (Save for Next Time)

- **Migration:** `supabase/migrations/traveler_profiles.sql` — Creates `public.traveler_profiles` (user_id, given_name, family_name, email, phone, title, date_of_birth, gender, passport_number, passport_expiry, passport_issuing_country_code, nationality_country_code). One row per user (unique user_id). RLS: select/insert/update own row only. **Not yet run**; run when implementing “Save my details for next time.”

### 3.6 Other (Unchanged)

- Save trip flow: Trip Details / Suggestions → `/api/trips/save` → `/saved`. Book Now from details → `/booking?tripId=...&...`.
- Auth: Login/Register; profiles table must exist in Supabase (run `supabase/setup-profiles.sql` or equivalent if login fails).
- AI: OpenAI for suggestions, itinerary, assistant. APIs under `/api/ai/*`.
- Trips API: `/api/trips/[id]` returns normalized shape (id, title, destination, start_date, end_date, travelers, budget_amount).

---

## 4. Full Roadmap — Plan Per Priority

### Priority #1 — Booking form ✅ Already built

The implementation covers this completely. Lead traveler + passport; HttpOnly cookie + opaque token flow is done.

---

### Priority #2 — Navigation cleanup

**Problem:** Two nav components (TopNav.tsx for marketing, AppNavigation.tsx for the app), inconsistent `/explore` vs `/search` naming, and likely duplicate or broken links.

**Plan:**
- Audit both nav files and all internal links.
- Pick one canonical route (**/search** recommended — more descriptive) and add a redirect from `/explore`.
- Consolidate into one shared nav that works across marketing and app pages.
- **Links:** Home, Search, Plan Trip, Saved Trips, Dashboard, Account.

**Estimated files touched:** `TopNav.tsx`, `AppNavigation.tsx`, possibly a new `GlobalNav.tsx`, `src/app/explore/page.tsx` (redirect), any hardcoded `/explore` links.

---

### Priority #3 — Multi-destination trips

**Problem:** Schema and AI already support it, but the UI only handles single destinations.

**Plan:**
- Add an “Add stop” button to the plan-trip form that appends destination + date range rows.
- Store as an array in trip state: `[{ destination, startDate, endDate }]`.
- Pass the stops array through to TripDetailsAlacarte — each stop gets its own flights/hotels section.
- The AI suggestion prompt already handles multi-destination; just pass the stops array.

**Estimated files touched:** Plan trip page/form, AppContext.tsx, TripDetailsAlacarte.tsx, trips save API.

---

### Priority #4 — Dashboard

**Problem:** No page showing past bookings or trip status.

**Plan:**
- New page at `/dashboard` (or enhance existing if one exists).
- Query `bookings` table for `user_id` = current user; join with trips for destination/dates.
- Show: booking ref, destination, dates, status badge (pending/confirmed/cancelled), amount.
- Link to confirmation page for completed bookings.
- Show saved (not yet booked) trips separately from trips table.

**Estimated files touched:** `src/app/dashboard/page.tsx` (or `(app)/dashboard/page.tsx`), new `src/app/api/bookings/route.ts`, nav update.

---

### Priority #5 — Confirmation page (real data)

**Problem:** Confirmation currently only reads URL params; doesn’t show real booking details.

**Plan:**
- On load, call `GET /api/bookings/by-session?session_id=...` which looks up the booking by `stripe_checkout_session_id`.
- Update booking status to `confirmed` at this point (or via Stripe webhook — see #6).
- Display: booking reference (booking ID), destination, dates, traveler name, amount paid, Stripe receipt link.
- Add a “View in Dashboard” CTA.

**Estimated files touched:** `src/app/booking/confirmation/page.tsx`, new `src/app/api/bookings/by-session/route.ts`.

---

### Priority #6 — Stripe (mostly done)

**What’s left:**
- Paste real test keys into `.env.local` (placeholders are there; need actual `pk_test_...` / `sk_test_...` values).
- Confirm `bookings` table exists (run `supabase/setup-bookings.sql` if not).
- **Optional:** Add a Stripe webhook handler at `POST /api/webhooks/stripe` (or use existing `/api/stripe/webhook`) that listens for `checkout.session.completed` and updates `bookings.status = 'confirmed'` — more reliable than doing it on the confirmation page.

**Estimated files touched:** `.env.local`, optional `src/app/api/webhooks/stripe/route.ts` or existing webhook route.

---

### Priority #7 — Deploy prep

**Checklist:**
- All env vars documented and set in Vercel/hosting dashboard.
- Run all Supabase migrations on the production DB: `setup-bookings.sql`, `traveler_profiles.sql`, `setup-profiles.sql`.
- Set `NEXT_PUBLIC_APP_URL` to the production domain (used in Stripe success/cancel URLs).
- Update Stripe webhook URL in the Stripe dashboard to `https://yourdomain.com/api/webhooks/stripe` (or `/api/stripe/webhook` if that’s the route).
- Swap Duffel test key to live key when ready.
- Swap Stripe test keys to live keys; remove the test card hint from the UI.

---

## 5. Key Files (Where To Edit)

| Area | File(s) |
|------|--------|
| Booking form (passport, lead traveler) | `src/app/booking/page.tsx` |
| Checkout (Stripe redirect) | `src/app/booking/checkout/page.tsx` |
| Checkout session API | `src/app/api/checkout/session/route.ts` |
| Confirmation | `src/app/booking/confirmation/page.tsx` |
| Trip details (à la carte) | `src/components/TripDetailsAlacarte.tsx`, `src/app/trip-details/[id]/page.tsx` |
| Duffel flights search | `src/app/api/booking/flights/search/route.ts` |
| Duffel hotels search | `src/app/api/booking/hotels/search/route.ts` |
| User / session | `src/contexts/AppContext.tsx` (user from useApp()) |
| Bookings table | `supabase/setup-bookings.sql` |
| Traveler profiles table | `supabase/migrations/traveler_profiles.sql` |
| Nav | `src/components/marketing/TopNav.tsx`, `src/components/app/AppNavigation.tsx` (→ consolidate; add GlobalNav if needed) |
| Dashboard (#4) | `src/app/(app)/dashboard/page.tsx` or `src/app/dashboard/page.tsx`, new `src/app/api/bookings/route.ts` |
| Confirmation (#5) | `src/app/booking/confirmation/page.tsx`, new `src/app/api/bookings/by-session/route.ts` |
| Trips API | `src/app/api/trips/[id]/route.ts`, `src/app/api/trips/save/route.ts` |

---

## 6. Env Vars (Relevant)

- **Duffel:** `DUFFEL_API_KEY` (test: `duffel_test_...`; required for booking flights/hotels search).
- **Stripe:** `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY` (use test keys for dev), `STRIPE_WEBHOOK_SECRET` (for webhook).
- **Supabase:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (if used).
- **OpenAI:** `OPENAI_API_KEY`.

---

## 7. Instructions For Claude

1. **Read before changing:** Check the files in Section 5 and any API routes you touch; keep existing API shapes and DB schema unless you document a change.
2. **Roadmap:** Follow Section 4 for the exact plan for each priority. **#1 is done.** Work on #2 (navigation) next, then #3–#7 in order unless the user asks for a different priority.
3. **Auth:** If login fails, remind to run profiles SQL in Supabase and confirm `profiles` exists and is populated for the user.
4. **Stripe:** Checkout is wired; ensure `.env.local` has full test keys and `bookings` table exists. Use test card 4242 4242 4242 4242. Optional: webhook for `checkout.session.completed` to set `bookings.status = 'confirmed'`.
5. **After changes:** Suggest a one-line manual test (e.g. “Nav: click Search → see /search; Dashboard: log in → see past bookings”).

Use **PROJECT_STATUS_DETAILED.md** for a fuller checklist. This file is the canonical handoff for “what we’re doing, what’s done, what’s next” for AI or human takeover.
