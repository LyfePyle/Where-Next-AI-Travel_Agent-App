# Where Next — AI Travel Agent App  
## Project Status Handoff (for Claude, ChatGPT, or any AI assistant)

**Generated:** May 21, 2026  
**Repo:** `Where-Next-AI-Travel_Agent-App`  
**Use this file as the source of truth.** Older docs (`WHERE_WE_ARE_NOW.md`, `PROJECT_STATUS_COMPREHENSIVE.md`, parts of `UNFINISHED_ITEMS_DETAILED.md`) may be outdated — verify against code when in doubt.

---

## 1. Executive summary

| Area | Status |
|------|--------|
| **Overall MVP** | **~70–80% complete** — UI and APIs are largely built; production-ready **auth + booking + deploy** need verification |
| **Marketing & pages** | **Strong** — 60+ routes, marketing site, app shell |
| **Trip planning (AI)** | **Working** — plan → suggestions → trip details → save |
| **Auth (Supabase)** | **Partial** — login/register exist; may need env + migrations + profile trigger; debug at `/auth/login-debug` |
| **Booking + Stripe** | **Built, needs E2E proof** — booking reads `tripId`; checkout + confirmation + webhooks exist |
| **Real flight/hotel booking** | **Mixed** — Amadeus/Duffel wired in places; stub providers also exist |
| **Deploy** | **Not done** — checklist in `docs/DEPLOY_CHECKLIST.md` |

**Bottom line:** This is a feature-rich Next.js travel app, not a greenfield project. **Launch strategy (May 2026):** affiliate-first via **Trip Hub** at `/my-trip/[id]` (see `TRIP_HUB_SETUP.md`). Stripe/Duffel direct sales remain for a later phase. Main gaps: **auth on your Supabase project**, **save → hub flow**, then **deploy**.

---

## 2. What this product is

**Where Next** is an AI-powered travel planning web app that helps users:

- Plan trips (destination, dates, budget, vibe)
- Get **AI trip suggestions** and itineraries
- **Save trips** to Supabase
- **Book / pay** via Stripe Checkout (trip packages, cart, addons)
- Explore flights/hotels (Amadeus, Duffel, or stubs depending on env)
- Use utilities: budget tracker, walking tours, weather, exchange rates, cart

**Target user flow (happy path):**

```
Home → Plan Trip → AI Suggestions → Trip Details → Save (optional)
  → Book Now → Booking form → Checkout (Stripe) → Confirmation
```

---

## 3. Tech stack

| Layer | Technology |
|-------|------------|
| Framework | **Next.js 15** (App Router), TypeScript |
| UI | React 18, Tailwind CSS 4, Radix UI |
| Auth & DB | **Supabase** (email/password, RLS, Postgres) |
| Payments | **Stripe** Checkout + webhooks |
| AI | **OpenAI** (`/api/ai/*`), optional Vercel AI Gateway (`lib/ai-gateway.ts`) |
| Travel APIs | Amadeus, Duffel (`@duffel/api`), stub providers in `src/lib/booking/providers/` |
| Maps | Mapbox (walking tours) |
| Tests | Jest, Playwright (`e2e/`) |
| Deploy target | **Vercel** (documented, not necessarily live) |

---

## 4. Repository layout (high signal)

```
src/app/                    # Pages (App Router)
  page.tsx                  # Marketing home
  plan-trip/                # Trip planner form
  suggestions/              # AI suggestions results
  trip-details/[id]/        # Trip detail view
  saved/                    # Saved trips
  booking/                  # Booking funnel
    page.tsx                # Traveler info + trip summary
    checkout/               # Stripe session creation
    confirmation/           # Post-payment success
  auth/login, register      # Supabase auth
  (app)/dashboard, profile  # Logged-in app shell
  search/ + explore/        # Both exist (naming inconsistency)

src/app/api/                # 77+ API route handlers
  ai/suggestions, itinerary-builder, ...
  trips/, trips/save, trips/[id]
  bookings/, bookings/by-session
  checkout/session, payments/create-checkout-session
  webhooks/stripe + stripe/webhook  # DUPLICATE — consolidate

src/components/             # TripDetailsEnhanced, GlobalNav, BookingPanel, etc.
src/lib/                    # supabase, amadeus, duffel, booking providers
supabase/migrations/        # SQL migrations (run in Supabase dashboard)
middleware.ts               # Auth guards for protected routes
```

---

## 5. What is working (code exists and is wired)

### Core trip flow
- **Home** (`/`), **Plan Trip** (`/plan-trip`), **Suggestions** (`/suggestions`)
- **Trip Details** (`/trip-details/[id]`, `/trip/[id]`)
- **Save trip** — `POST/GET /api/trips/save`, **Saved** page (`/saved`)
- **Trips API** — `POST /api/trips`, `GET/PATCH /api/trips/[id]` (older docs wrongly said POST was missing)

### Booking UI (implemented more than old status docs claim)
- **Booking page** reads `tripId`, `destination`, dates, budget from URL; fetches trip via `/api/trips/[id]`
- **TripDetailsEnhanced** links to `/booking?...` and direct `/booking/checkout?...`
- **Checkout** passes params to Stripe session API
- **Confirmation** (`/booking/confirmation`) loads booking by `booking_id` or `session_id` via `/api/bookings/by-session`

### Payments & cart
- Stripe checkout session routes
- Cart APIs (`/api/cart`, `/api/cart/items`)
- Addons, budgets APIs

### AI
- `/api/ai/suggestions`, itinerary-builder, travel-agent, walking-tour, etc.

### App shell
- Dashboard, profile, onboarding, addons, utilities, tour page
- **GlobalNav**, **AppNavigation**, **TopNav** (some duplication)
- **ErrorBoundary** component exists

### Auth infrastructure
- Login, register, OAuth callback route
- `middleware.ts` protects `/dashboard`, `/saved`, `/profile`, etc.
- Scripts: `npm run login:diagnose`, `login:fix`, `login:test`
- Debug page: `/auth/login-debug`

---

## 6. What is left to do (prioritized)

### P0 — Must work before calling it “done”

1. **End-to-end booking smoke test (local)**
   - Start app: `npm run dev` (often `http://localhost:3000`)
   - Run `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
   - Complete: Trip Details → Book → Checkout → test card `4242...` → Confirmation
   - Verify row in Supabase `bookings` with `status = confirmed` and `confirmed_at` set

2. **Stripe webhooks — single canonical route**
   - Two handlers exist:
     - `src/app/api/webhooks/stripe/route.ts` ← prefer for `stripe listen`
     - `src/app/api/stripe/webhook/route.ts` ← duplicate
   - **Task:** Merge behavior, document one URL, delete or thin-wrapper the other

3. **Supabase schema aligned with code**
   - Run migrations in order per `docs/DEPLOY_CHECKLIST.md`:
     - `supabase/setup-profiles.sql`
     - `supabase/setup-bookings.sql`
     - `bookings_add_confirmed_at.sql`, `bookings_webhook_support.sql`
     - `trips_add_stops.sql`, etc.
   - Confirm `profiles` auto-created on signup (trigger)
   - Confirm `bookings.trip_id` FK to `trips.id`

4. **Auth working in your Supabase project**
   - `.env.local` has correct `NEXT_PUBLIC_SUPABASE_*` and `SUPABASE_SERVICE_ROLE_KEY`
   - Test user exists and is email-confirmed
   - Profile row exists for test user
   - Use `/auth/login-debug` if login fails

### P1 — UX and product consistency

1. **Route naming:** `/search` and `/explore` both exist — pick one canonical route, alias the other, update nav links
2. **Navigation consolidation** — `TopNav`, `AppNavigation`, `GlobalNav` overlap; ensure Saved, Trips, Profile links work everywhere
3. **Booking back-navigation** — verify back links on booking/checkout/confirmation
4. **My Trips vs (app)/trips** — `/my-trips` and `/(app)/trips` both exist; align naming and nav

### P2 — Polish & quality

1. Loading / empty states on saved trips, bookings list, search
2. Marketing TODOs: contact form API, blog search, newsletter (stubs in code)
3. E2E tests in `e2e/` — update routes to match current app
4. Error pages (404) and consistent API error messages

### P3 — Integrations & production

1. **Duffel / Amadeus** — decide live vs stub per env; document in `ENV_TEMPLATE.md`
2. **AI Gateway** — optional; see `AI_GATEWAY_SETUP.md`, `lib/ai-gateway.ts`
3. **OAuth** (Google, etc.) — optional; needs provider credentials
4. **Deploy to Vercel** — `docs/DEPLOY_CHECKLIST.md`, live Stripe webhook, production env vars
5. **Social login** — documented in `OAUTH_SETUP_GUIDE.md` if desired

---

## 7. Environment variables (minimum to run locally)

Copy `ENV_TEMPLATE.md` → `.env.local`. Critical keys:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...    # from stripe listen

OPENAI_API_KEY=sk-...

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Optional: `AMADEUS_*`, `DUFFEL_API_KEY`, `AI_GATEWAY_API_KEY`, `OPENWEATHER_API_KEY`

Validate: `npm run env:validate`

---

## 8. How to run locally (quick start)

```bash
npm install
# Create .env.local from ENV_TEMPLATE.md
npm run dev
```

Helpful commands:

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Next.js |
| `npm run login:diagnose` | Auth troubleshooting |
| `npm run db:migrate` / `db:seed` | DB scripts (needs Supabase configured) |
| `npm run test:e2e` | Playwright tests |
| `npm run test:ai-gateway` | AI gateway smoke test |

Stripe local webhooks:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

---

## 9. Key routes reference

| Route | Purpose |
|-------|---------|
| `/` | Marketing home |
| `/plan-trip` | Start planning |
| `/suggestions` | AI results |
| `/trip-details/[id]` | Trip detail + Book |
| `/saved` | Saved trips (auth) |
| `/booking` | Pre-checkout form |
| `/booking/checkout` | Stripe redirect |
| `/booking/confirmation` | Success page |
| `/auth/login` | Login |
| `/auth/login-debug` | Auth debug |
| `/(app)/dashboard` | User dashboard |
| `/search`, `/explore` | Browse (duplicate concept) |
| `/cart` | Shopping cart |
| `/(app)/tour` | Walking tour generator |

---

## 10. Definition of done (acceptance criteria)

An AI assistant or human can mark the MVP **complete** when all of these pass:

1. ✅ User can **register/login** without profile/RLS errors  
2. ✅ User can **plan a trip** and see **AI suggestions**  
3. ✅ User can **save** a trip and see it on **`/saved`**  
4. ✅ **Book Now** → booking form → **Stripe test payment** → **confirmation** shows correct trip + amount  
5. ✅ **`bookings`** row is **confirmed** in Supabase (webhook or `by-session` fallback)  
6. ✅ **One** Stripe webhook endpoint documented and used in prod  
7. ✅ App **deployed** to Vercel with production env vars and live webhook  

---

## 11. Stale documentation — do not trust blindly

| File | Issue |
|------|-------|
| `WHERE_WE_ARE_NOW.md` | Says ~75%, login-only blocker — understates booking/deploy work |
| `PROJECT_STATUS_COMPREHENSIVE.md` | Says booking page doesn't read `tripId` — **fixed in code** |
| `UNFINISHED_ITEMS_DETAILED.md` | Says `/api/trips` POST missing — **exists** at `src/app/api/trips/route.ts` |
| `ENV_TEMPLATE.md` | Webhook path mentions `/api/stripe/webhook` — deploy checklist uses `/api/webhooks/stripe` |

**Prefer:** this file + `CLAUDE_HANDOVER_PROJECT_REMAINING.md` + live code inspection.

---

## 12. Git / workspace note (May 2026)

The working tree has **many modified and untracked files** (docs, migrations, API routes, booking fixes). Work may be **local and uncommitted**. Before deploy or sharing with collaborators:

```bash
git status
git diff --stat
```

Consider committing stable slices (auth, booking, migrations) once smoke tests pass.

---

## 13. Suggested first session for an AI assistant

Copy this prompt block:

```
I'm continuing work on the Where Next AI Travel Agent (Next.js 15 + Supabase + Stripe).

Read AI_PROJECT_STATUS_HANDOFF.md in the repo root first.

Your goals this session:
1. Run local dev + stripe listen; execute booking E2E and list every broken step.
2. Consolidate duplicate Stripe webhook routes into one canonical handler.
3. Verify Supabase migrations match bookings/trips APIs.
4. Fix any auth issues using /auth/login-debug and npm run login:diagnose.

Do not trust WHERE_WE_ARE_NOW.md or UNFINISHED_ITEMS_DETAILED.md without verifying against code.
Report: what works, what's broken, and a prioritized fix list with file paths.
```

---

## 14. Related docs in repo

| Document | When to use |
|----------|-------------|
| `docs/APP_OVERVIEW_AND_ARCHITECTURE.md` | Architecture deep dive |
| `docs/DEPLOY_CHECKLIST.md` | Pre-launch checklist |
| `docs/SETUP_AND_MANUAL_TASKS.md` | Manual Supabase/Stripe setup |
| `CLAUDE_HANDOVER_PROJECT_REMAINING.md` | Shorter remaining-work list |
| `ENV_TEMPLATE.md` / `ENV_SETUP_GUIDE.md` | Environment setup |
| `TESTING_GUIDE.md` | Test commands |
| `docs/VISUAL_ROUTE_MAP_MERMAID.md` | Route map (if present) |

---

*End of handoff. Update this file when major milestones ship (auth fixed, booking E2E green, production deploy).*
