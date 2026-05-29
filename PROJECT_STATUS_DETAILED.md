# Where Next — Detailed Project Status

**Last updated:** March 1, 2025  
**Overall completion:** ~75%

This document is your single source of truth for where the project stands and what still needs to be done.

---

## 1. What We Are Building

**Where Next** is an AI-powered travel planning and booking app. Users can:

- Get **AI trip suggestions** (destination, budget, vibe)
- View **trip details** and save trips
- **Book** (flights/hotels) and complete **checkout** with Stripe
- Use **dashboard**, **saved trips**, **budget tracking**, **AI assistant**, and **utilities** (weather, currency, phrases)

**Stack:** Next.js 15, TypeScript, Tailwind, Supabase (auth + DB), OpenAI, Amadeus (flights/hotels), Stripe.

---

## 2. What’s Done (Working)

### 2.1 Pages

| Page | Route | Status |
|------|--------|--------|
| Home | `/` | ✅ Working (hero, carousel, features) |
| Plan Trip | `/plan-trip` | ✅ Form submits to suggestions |
| Trip Suggestions | `/suggestions` | ✅ AI suggestions display |
| Trip Details | `/trip-details/[id]` | ✅ Shows trip info, tabs |
| Saved Trips | `/saved` | ✅ Fetches and displays saved trips |
| Booking | `/booking` | ⚠️ UI exists; trip data from URL needs verification |
| Checkout | `/booking/checkout` | ⚠️ Exists; flow needs verification |
| Confirmation | `/booking/confirmation` | ⚠️ Exists; needs verification |
| Profile | `/(app)/profile` | ✅ Functional |
| My Trips | `/(app)/trips` | ✅ Exists |
| Dashboard | `/(app)/dashboard` | ✅ Exists |
| Explore | `/explore` | ✅ Works (wireframe says `/search` — naming mismatch) |
| Auth | `/auth/login`, `/auth/register` | ✅ Pages exist; login may still error (profiles/DB) |

### 2.2 Save Trip Flow — Complete

- Save Trip API: `/api/trips/save` (POST/GET) — working with Supabase
- Save button on Trip Details — working
- Save button on Suggestions — working (purple theme)
- Saved Trips page — fetches and displays correctly
- Saved → Trip Details links — working
- Book Now from saved trips — links to booking page

### 2.3 Navigation Links (Working)

- Home → Plan Trip ✅  
- Plan Trip → Suggestions ✅  
- Suggestions → Trip Details ✅  
- Suggestions → Save Trip → redirect to `/saved` ✅  
- Saved → Trip Details ✅  
- Home footer links ✅  

### 2.4 API Endpoints (Confirmed Working)

- `/api/trips/save` — POST & GET  
- `/api/trips/saved` — GET saved trips  
- `/api/ai/suggestions` — AI trip suggestions  
- `/api/ai/trip-details`, `/api/ai/itinerary-builder`, `/api/ai/walking-tour`, `/api/ai/assistant`  
- `/api/addons`, `/api/addons/[sku]`  
- `/api/cart`, `/api/cart/items`, `/api/cart/items/[id]`  
- `/api/auth/preview-guest` (preview mode)  
- `/api/utils/weather`, `/api/utils/currency`, `/api/utils/phrases`  
- `/api/booking/flights/search`, `/api/booking/hotels/search` (stub providers)  
- `/api/checkout/session`, `/api/payments/create-checkout-session`  
- `/api/stripe/webhook`  
- `/api/trips`, `/api/trips/[id]`, `/api/trips/plan`, `/api/trips/my-trips` (files exist; behavior may need verification)

### 2.5 AI Integration

- OpenAI GPT-4o-mini for suggestions; itinerary builder; walking tour; assistant
- Caching for similar requests
- AI Gateway optional (can fallback to direct OpenAI)

### 2.6 Database

- Supabase connected
- `saved_trips` in use (save flow works)
- Profiles table SQL exists (`supabase/setup-profiles.sql`, `supabase/migrations/create-profiles-table.sql`) — **must be run in Supabase** if login fails

---

## 3. What’s Not Working / Incomplete

### 3.1 Authentication (High Priority)

- **Issue:** Login/register may fail with “profiles does not exist” (or similar) if `profiles` table/triggers are not applied.
- **Action:** Run profiles SQL in Supabase (e.g. `supabase/setup-profiles.sql` or equivalent migration). Confirm user exists and is confirmed; confirm profile row exists for that user.
- **Debug:** Use `/auth/login-debug` and “Test Login” or browser console to capture exact error.

### 3.2 Booking Flow (High Priority)

End-to-end path: **Trip Details → Booking → Checkout → Payment → Confirmation**.

| Step | Issue | File(s) |
|------|--------|---------|
| Trip Details → Booking | Confirm “Book Now” passes `tripId`, `destination`, dates, etc. to `/booking?...` | `src/components/TripDetailsEnhanced.tsx` |
| Booking page | Page must read `tripId` (and related params) from URL and show trip summary | `src/app/booking/page.tsx` |
| Booking → Checkout | “Proceed to Payment” must pass booking data to checkout | `src/app/booking/page.tsx` |
| Checkout → Stripe | Checkout session creation and redirect | `src/app/booking/checkout/page.tsx`, `/api/checkout/session`, `/api/payments/create-checkout-session` |
| After payment → Confirmation | Success redirect and confirmation data | `src/app/booking/checkout/page.tsx`, `src/app/booking/confirmation/page.tsx` |

**Deliverables:** Verify/fix each link and data handoff; test with Stripe test cards.

### 3.3 Cart & Checkout (High Priority)

- Cart may not persist (demo/guest behavior only, or no DB persistence).
- Checkout/payment may be demo-only; enable real Stripe and webhook.
- **Files:** `src/app/api/cart/route.ts`, `src/app/api/cart/items/route.ts`, `src/app/(app)/cart/page.tsx`, cart-related components.

### 3.4 Navigation & Routes (Medium Priority)

- **Route naming:** App uses `/explore`; wireframe uses `/search`. Either rename or add `/search` alias and update links.
- **Global nav:** Same nav (Home, Search/Explore, Plan Trip, Saved, My Trips, Account) on all public and app pages.
- **Missing links:** Profile → My Trips, Profile → Saved Trips; ensure all nav items point to correct routes.
- **Back buttons:** Add on Booking, Checkout, and Confirmation.

**Files:** `src/components/marketing/TopNav.tsx`, `src/components/app/AppNavigation.tsx`, `src/app/(app)/layout.tsx`, any other nav components.

### 3.5 API Verification (Medium Priority)

- Confirm `/api/trips` POST (trip creation from suggestions) and response shape.
- Confirm `/api/trips/[id]` GET and `/api/trips/my-trips` match frontend usage.
- Confirm booking-related endpoints (e.g. `/api/bookings/*`, checkout, webhook) and that they persist bookings after payment.

### 3.6 Database Schema (Medium Priority)

- Ensure `profiles` exists and has trigger for new auth users.
- Align `trips`, `saved_trips`, and any `bookings` / `orders` tables with API and frontend.
- Verify RLS policies for profiles, trips, saved_trips, cart, bookings.

### 3.7 Error Handling & Polish (Lower Priority)

- 404 and error boundaries
- Clear API error messages and client-side display
- Loading and empty states on key pages

---

## 4. Detailed Checklist (What To Work On)

### Phase 1 — Unblock Core Use

- [ ] **Auth:** Run profiles migration in Supabase; verify login/register and profile creation.
- [ ] **Booking flow:**  
  - [ ] Trip Details “Book Now” → `/booking?tripId=...&destination=...` (and dates if needed).  
  - [ ] Booking page reads search params and shows trip summary.  
  - [ ] Booking → Checkout with required data.  
  - [ ] Checkout creates Stripe session and redirects; success → Confirmation with real data.
- [ ] **Cart/checkout:** Persist cart (DB or session) where needed; enable real Stripe and webhook; persist booking after payment.

### Phase 2 — Consistency & Correctness

- [ ] **Routes:** Resolve `/explore` vs `/search`; update all links.
- [ ] **Navigation:** Single global nav; add Profile → My Trips / Saved; add back buttons on booking flow.
- [ ] **APIs:** Verify `/api/trips` POST/GET, my-trips, and booking/checkout/webhook behavior and persistence.

### Phase 3 — Robustness & Launch Prep

- [ ] **DB:** Verify all tables and RLS; add any missing tables (e.g. bookings).
- [ ] **Errors:** 404, error boundaries, friendly messages, loading/empty states.
- [ ] **E2E:** Test full flows: plan → suggest → details → save; details → book → checkout → confirm.
- [ ] **Deploy:** Env vars, Stripe webhook URL, run migrations on production DB.

---

## 5. Key Files Quick Reference

| Purpose | Path |
|--------|------|
| Book Now button | `src/components/TripDetailsEnhanced.tsx` |
| Booking page (trip from URL) | `src/app/booking/page.tsx` |
| Checkout | `src/app/booking/checkout/page.tsx` |
| Confirmation | `src/app/booking/confirmation/page.tsx` |
| Trips API | `src/app/api/trips/route.ts`, `src/app/api/trips/[id]/route.ts`, `src/app/api/trips/save/route.ts` |
| Checkout / Stripe | `src/app/api/checkout/session/route.ts`, `src/app/api/payments/create-checkout-session/route.ts`, `src/app/api/stripe/webhook/route.ts` |
| Cart | `src/app/api/cart/route.ts`, `src/app/api/cart/items/route.ts` |
| Public nav | `src/components/marketing/TopNav.tsx` |
| App nav | `src/components/app/AppNavigation.tsx` |
| Profiles DB | `supabase/setup-profiles.sql`, `supabase/migrations/create-profiles-table.sql` |

---

## 6. Rough Time Estimates

- **Auth fix:** ~5–15 min (run SQL + test).
- **Booking flow (verify + fix):** 2–4 hours.
- **Cart + real payments + webhook:** 2–4 hours.
- **Navigation + routes + APIs verification:** 2–3 hours.
- **Errors + polish + E2E + deploy prep:** 3–5 hours.

**Total to “production-ready” core:** ~12–18 hours of focused work.

---

## 7. Bottom Line

- **Done:** Core pages, save-trip flow, most APIs, AI integration, basic auth UI. Auth fixed. Booking flow wired (Trip Details → Booking → Checkout → Confirmation with URL params + normalized API).
- **Next:** Finish booking (real Stripe, cart persistence), then nav/APIs polish.
- **Then:** Multi-destination with duration split (see §8).

Use **CLAUDE_HANDOFF.md** to bring another AI (e.g. Claude) up to speed on the same status and remaining work.

---

## 8. Future: Multi-destination with duration split (after booking is solid)

**Priority:** Do this *after* the booking flow is complete and Stripe is wired. Multi-destination touches many surfaces; better to have a working end-to-end booking first, then layer this on.

**Planned shape:**

- **Plan Trip form**
  - Trip type: Single / Multiple cities / Multiple countries ✅ (exists)
  - Number of stops: 2–4 ✅ (exists)
  - **NEW:** Duration split: "AI decides" | "Equal" | "Custom" (per-stop nights)

- **AI suggestions**
  - Each suggestion returns **stops with nights**, e.g.:
    - `[ { city: "Paris", country: "France", nights: 4 }, { city: "Amsterdam", country: "Netherlands", nights: 3 }, { city: "Berlin", country: "Germany", nights: 4 } ]`

- **Suggestion card**
  - Show: **Paris (4 nights) → Amsterdam (3) → Berlin (4)**  
  - Subtitle: e.g. *Total: 11 nights • 3 countries*

- **Surfaces to update when we build it**
  - Plan Trip form (duration split UI)
  - AI suggestions prompt + schema (`stops: { city, country, nights }[]`)
  - Suggestion cards UI
  - Trip Details page (multi-stop view)
  - Booking page (multiple stops, not one destination)
  - Checkout (pricing per stop or combined)
