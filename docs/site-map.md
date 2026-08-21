# Where Next — full site map

Living reference of every App Router page under `src/app/`. Route groups `(app)` and `(marketing)` do **not** appear in URLs.

**Status:** mapping only — no product fixes in this pass.  
**Last audited:** 2026-08-19 against `main` (`src/app/**/page.tsx`, `middleware.ts`, `next.config.ts`, `GlobalNav`, `Footer`, `BottomTabs`, Trip Hub).

**Related:** trip-creation *promise vs pass* detail lives in [`docs/entry-points-map.md`](entry-points-map.md). That file’s **Receiver** table and several mismatch IDs are stale after 2026-08-19 ships (Plan Trip param read-back, SEA region guess, hero chip copy, Suggestions Back query). Current truth for those hops is **§B** below.

How to use: find the page, then check **How you get there** vs **Where it sends you** vs **State**. Gaps are flagged on the page and collected in the **Findings register**.

---

## Chrome (what wraps what)

```
Root layout (src/app/layout.tsx) — ALL routes
├── GlobalNav (fixed)
├── TripCartDrawer
└── children
    ├── (marketing) layout → Footer
    ├── (app) layout → auth gate + BottomTabs (mobile) + demo banner
    └── auth layout → extra AppProvider wrap only
```

| Chrome | File | Appears on |
|---|---|---|
| **GlobalNav** | `src/components/GlobalNav.tsx` | Every page |
| **Footer** | `src/components/marketing/Footer.tsx` | `(marketing)/*` only |
| **Homepage footer** | inline in `src/app/page.tsx` | `/` only (same link set as Footer, slightly different Product URLs) |
| **BottomTabs** | `src/components/app/BottomTabs.tsx` | `(app)/*` when authenticated |
| **`(app)` auth gate** | `src/app/(app)/layout.tsx` | Unauthed users on `(app)/*` see “Sign in to continue” + `/auth/login` (no return param) |

**GlobalNav links:** Home `/` · Plan Trip `/plan-trip` · Saved Trips `/saved` (auth) · Walking Tour `/walking-tour` · Dashboard `/dashboard` (auth) · Account `/profile` (auth). Signed-out: Sign in `/auth/login`, Sign up `/auth/register`. Sign out → `/`.

**Footer links:** Product → `/product/trip-planning`, `/budget`, `/plan-trip`. Company → `/about`, `/careers`, `/press`, `/blog`. Support → `/help`, `/contact`, `/privacy`, `/terms`. Resources → `/tools`, `/tours`, `/saved`.

**BottomTabs:** Home `/dashboard` · Trips `/trips` · Budget `/budget` · Add-Ons `/addons` · Profile `/profile`.

**Not wired:** `AppShell` and `BottomNavigation` (SPA `setCurrentScreen`) are unused by App Router pages.

**404:** `src/app/not-found.tsx` offers `/plan-trip`, `/tours`, `/budget`.

---

## Auth, middleware, redirects

### Middleware (`middleware.ts`)

Protected **page prefixes** (unauthenticated → `/auth/login?redirectTo=<path>` unless demo/dev bypass): `/dashboard`, `/saved`, `/tours`, `/plan-trip`, `/trip-details`, `/budgets`, `/profile`, `/settings`.

Protected **API prefixes:** `/api/trips`, `/api/budgets`, `/api/bookings`, `/api/cart`, `/api/orders`.

**Demo bypass:** `NEXT_PUBLIC_DEMO_MODE=true`, or `NODE_ENV=development`, or missing `NEXT_PUBLIC_SUPABASE_URL`. Locally, Plan Trip / Saved / Dashboard do **not** require login.

**Already logged in on** `/auth/login`, `/auth/register`, `/auth/reset-password` → `redirectTo` then `redirect` then `next`, else `/dashboard`.

**Logged-in users hitting `/`** → `/dashboard`. They never see the marketing homepage / hero chips. GlobalNav “Home” bounces them too.

**Gaps:** `/settings` and `/budgets` are protected but have **no `page.tsx`**. `/my-trip/[id]` is **not** middleware-protected (page-level redirect if the trip belongs to someone else). `/walking-tour` is public; `/tours` is protected.

### Login return-URL names (three of them)

| Name | Who sets it | Login page reads it? |
|---|---|---|
| `redirectTo` | Middleware; `/saved`; `/dashboard`; `pending-trip-save.ts` | Yes (first) |
| `redirect` | `/booking/checkout` 401 | Yes (second) |
| `next` | Homepage; `/budget`; `/my-trip` ownership redirect | Yes (third) |

OAuth callback (`/auth/callback`) prefers **`next` first**, then `redirectTo`. Default after OAuth is `/`, not `/dashboard`.

### `next.config.ts` redirects (no rewrites)

| From | To | Permanent | Notes |
|---|---|---|---|
| `/explore`, `/search`, `/ai-travel-agent`, `/pricing` (+ `/:path*`) | `/plan-trip` | yes | Query string is kept |
| `/tour` | *(removed 2026-08-19)* | — | Was a drive-by alias in the `/pricing` redirect commit. It shadowed `(app)/tour`. Trip Hub / Dashboard now reach `/tour` directly. |

---

## Canonical journeys (what exists today)

```
Unauthed homepage
  → /plan-trip → /suggestions?… → /trip-details/{id|new}?… → save → /my-trip/{uuid}
                                         ↘ /saved

Logged-in user typing /
  → /dashboard → /my-trip/{uuid}

Trip Hub tools
  → /utilities/weather?destination&tripId
  → /utilities/currency?destination&tripId
  → /tour?city&country&trip_id   (trip-aware page; Back to trip when trip_id is set)
```

---

## A. Marketing / homepage

### `/` — `src/app/page.tsx`

**Purpose:** Public marketing homepage: chat-first hero, curated destination carousel, feature CTAs, inline footer.

**How you get there:** Direct URL; GlobalNav logo/Home; many “back to home” links. **Not reachable while logged in** (middleware → `/dashboard`).

**Where it sends you:**

| Control | Target | Passes |
|---|---|---|
| Empty hero **Plan my trip** | `/plan-trip` | none |
| Filled hero **Plan my trip** | stays on `/` | POST `/api/ai/assistant` `{ message }` |
| Hero chips (4) | no navigation | `setPrompt(chipText)` only |
| **Suggested Route Map** (after AI) | `/plan-trip?…` via `buildPlanTripHrefFromHints` | `destination`, `tripType`, `tripDuration`, `budgetAmount`, `numberOfStops`, `additionalDetails` |
| **Save this trip** | `/trip-details/{id}?budgetAmount=` or `/dashboard` on 409 | POST `/api/trips/saved`; destination guessed from AI text |
| **Book flights** (after AI) | `/plan-trip` | **none** |
| **View dashboard** | `/dashboard` | none |
| Sign up / Sign in | `/auth/register`, `/auth/login` | optional `next=/`, `next=/saved`, `next=/dashboard` |
| Carousel cards | `/plan-trip?destination=&vibes=` | `planTripHref()` in `src/data/curated-destinations.ts` |
| Feature cards | `/auth/login?next=/saved`, `/plan-trip`, `/budget`, `/tools` | |
| Inline footer | short URLs: `/plan-trip`, `/budget`, `/about`, `/careers`, `/press`, `/blog`, `/help`, `/contact`, `/privacy`, `/terms`, `/tools`, `/tours`, `/saved` | |

**State:** Standalone. Optional prompt + AI snapshot in client state.

**Gaps:** Chips still do not deep-link Plan Trip (user must submit AI, then Suggested Route Map). Book flights after AI wipes the snapshot. Homepage save still regex-guesses a single destination. Logged-in users never see this page.

Chip copy today: *I don't know where to go yet…* · *6 countries in Southeast Asia, ~6 weeks, mid budget* · *A week in Tokyo for food, mid budget* · *Italy for two weeks — romantic, not rushed*.

### Marketing landings (`(marketing)` + Footer)

These get **Footer**. Most Footer company/support links hit **stubs** (§J), not these fuller pages.

| Route | File | Purpose | Inbound | Outbound | State | Gaps |
|---|---|---|---|---|---|---|
| `/blog` | `(marketing)/blog/page.tsx` | Sample blog index | Footer, homepage footer | **`/blog/{slug}` (no `[slug]` page)** | Standalone | Every “Read article” is a 404; search TODO |
| `/company/about` | `(marketing)/company/about/page.tsx` | Full about/team | `/company/careers` | `/company/careers` | Standalone | Footer uses stub `/about` instead |
| `/company/careers` | `(marketing)/company/careers/page.tsx` | Jobs from sample JSON | `/company/about` | `/company/about#team`, mailto apply | Standalone | Footer uses stub `/careers` |
| `/company/press-kit` | `(marketing)/company/press-kit/page.tsx` | Press assets | almost none | mailto, `#download-all` | Standalone | Footer uses stub `/press` |
| `/product/trip-planning` | `(marketing)/product/trip-planning/page.tsx` | Product marketing | Footer “Trip Planning” | **`/auth/signup`**, **`/demo`** | Standalone | Both CTAs 404 |
| `/product/budget-tracker` | `(marketing)/product/budget-tracker/page.tsx` | Budget marketing | **none** (Footer → `/budget`) | **`/auth/signup`**, **`/demo`** | Standalone | Orphan + broken CTAs |
| `/product/flight-booking` | `(marketing)/product/flight-booking/page.tsx` | Flights marketing | **none** | **`/trips/search?type=flights`** | Standalone | 404; real UI is `/booking/flights` |
| `/product/ai-agent` | `(marketing)/product/ai-agent/page.tsx` | AI marketing | **none** (Footer → `/plan-trip`) | **`/auth/signup`**, **`/demo`** | Standalone | Broken CTAs |
| `/support` | `(marketing)/support/page.tsx` | Help center index | stub `/help`; checkout success | `/support/contact`, mailto | Standalone | Search TODO |
| `/support/contact` | `(marketing)/support/contact/page.tsx` | Contact form | `/support`, stubs | mailto | Standalone | Form is simulated |
| `/support/terms` | `(marketing)/support/terms/page.tsx` | Full terms | stub `/terms` | `/support/privacy-policy` | Standalone | Footer users hit stub first |
| `/support/privacy-policy` | `(marketing)/support/privacy-policy/page.tsx` | Full privacy | stub `/privacy` | mailto | Standalone | Footer users hit stub first |

---

## B. Trip creation (Plan Trip → Suggestions → trip-details)

Detail of *what copy promises vs what params pass* is in [`docs/entry-points-map.md`](entry-points-map.md). **Do not copy that Receiver table** — it predates the 2026-08-19 read-back work. Current wiring:

### `/plan-trip` — `src/app/plan-trip/page.tsx`

**Purpose:** Canonical planner: origin, trip style, destination/stops, dates, party, budget, vibes → Suggestions.

**How you get there:** GlobalNav; Footer “AI Agent”; homepage empty Plan my trip / carousel / Suggested Route Map; `/saved` and `/dashboard` “Plan a trip”; `(app)/trips`; `/budget` (no trip); `/about`; `/tools`; `/not-found`; 308s from `/explore` `/search` `/ai-travel-agent` `/pricing`; Suggestions **Back** (full query).

**Inbound** (`parsePlanTripSearchParams`, once on mount): `destination`, `from`, `adults`, `kids`, `tripType`/`mode`, `budgetAmount`/`budget`, `vibes`, `additionalDetails`, `numberOfStops`, `stops` (JSON, applied only if **≥2 named stops**), `startDate`/`endDate`, `tripDuration` (derives dates if needed).

**Where it sends you:** `router.push('/suggestions?…')` with `from`, `tripType` (`single` \| `multi-city`; surprise submits as `single` with no destination), `destination` and/or `stops` JSON, dates, `tripDuration`, `vibes`, `additionalDetails`, `adults`, `kids`, `budgetAmount`, `numberOfStops` (multi).

**State:** Standalone form. Origin required on submit. Middleware-protected in production (not local/dev).

**Gaps:** No in-page back. Single `stop-main` region row is intentionally **not** dumped into StopsBuilder (empty slots from `numberOfStops` instead). Hero chips still do not land here directly.

### `/suggestions` — `src/app/suggestions/page.tsx`

**Purpose:** Streaming AI destination cards; optional multi-city drill-down; save or open trip-details.

**How you get there:** Plan Trip submit (canonical). Direct URL with query. **Not** from Trip Details back (that link is bare `/suggestions`).

**Inbound:** `destination`, `stops`, `from`, `startDate`, `endDate`, `tripDuration`, `budgetAmount`, `budgetStyle`, split budget fields, `vibe`/`vibes`, `additionalDetails`, `adults`, `kids`, `tripType`, `numberOfStops`, `maxFlightTime`. Missing fields invent defaults (`from=Vancouver`, `budgetAmount=2000`, 2 adults, ~7 nights).

**Where it sends you:**

| Control | Target | Passes |
|---|---|---|
| **Back** | `/plan-trip?{current query}` | full search string |
| Incomplete-params **Plan Trip** underline | same | full search string |
| Empty-state **Plan a New Trip** | `/plan-trip` | **none** (intentional wipe) |
| **See Details** | `/trip-details/new?…` or `/trip-details/{uuid}?…` | rich preview params; POST `/api/trips` when authed |
| **Save Trip** | `/saved` or login | POST `/api/trips/saved`; 401 → `/auth/login?redirectTo=` + pending save |

**State:** Query-driven. Auth optional until save.

**Gaps:** Empty `/suggestions` still “works” with invented Vancouver/2000 defaults — different product from empty Plan Trip. Trip-details → here still drops query (known, not in the Back ship).

### `/trip-details/[id]` — `src/app/trip-details/[id]/page.tsx`

**Purpose:** Pre-hub trip preview. `stops.length > 1` → multi-stop UI; else `TripDetailsEnhanced`.

**How you get there:** Suggestions See Details (`new` or UUID); homepage AI save (`{id}?budgetAmount=`); `/budget` **View Trip Details** uses fake id `budget-preview`; `/my-trips`, `/tours`, legacy `/trips/itinerary`.

**Where it sends you:**

| From | Target | Passes |
|---|---|---|
| Enhanced **← Back to suggestions** | `/suggestions` | **none** |
| Save / Open hub | `/my-trip/{uuid}` or `/saved` | UUID after POST `/api/trips/saved` |
| Book flights/hotels (enhanced) | `/my-trip/{uuid}?tab=book` | tab only |
| Multi-stop **Book this trip** | `/my-trip/{id}` (affiliate) or `/booking?…` | trip + dates + party + budget |
| Multi-stop not found | `/plan-trip` | none |

**State:** UUID **or** `new` + rich query **or** DB row. Middleware-protected in production.

**Gaps:** Back wipes Suggestions search. `budget-preview` is not a real trip. Multi-stop has no back-to-suggestions.

### `/trip/[id]` — `src/app/trip/[id]/page.tsx` (legacy overview)

**Purpose:** Older tabbed preview (overview / itinerary / flights / hotels).

**How you get there:** `(app)/trips` **View Details** only.

**Where it sends you:** Back → `/suggestions` (no params). **Build Itinerary** → `/itinerary/{id}?…` (**no such page**). Book = in-page modals.

**State:** URL params + trip id. Not the canonical hub.

**Gaps:** Orphan relative to `/my-trip/[id]`. Dead itinerary link.

---

## C. Trip Hub

### `/my-trip/[id]` — `src/app/my-trip/[id]/page.tsx` + `src/components/trip-hub/TripHub.tsx`

**Purpose:** Saved-trip command center.

**How you get there:** Save from trip-details; `/saved` cards; `/dashboard` cards; `/budget?tripId=` back; `(app)/tour` back (if that page were reachable). Wrong owner → `/auth/login?next=/my-trip/{id}`.

**Tabs** (client state; **`?tab=` is read on load only**, clicks do not update the URL):

| Tab | `?tab=` | Content | Leaves the hub |
|---|---|---|---|
| Overview | `overview` or omit | Stops, route map, checklist, quick tools | Weather, currency, walking-tour links |
| Book | `book` | Per-stop affiliate cards | External partner URLs |
| Documents | `documents` | Upload slots | **Alert stub** — no storage |
| Itinerary | `itinerary` | Day cards + chat (`/api/trips/[id]/chat`); walking-tour **suggest** on free days | Stays in tab; chat can PATCH itinerary |
| Budget | `budget` | `TripBudgetTab` | **Open full tracker** → `/budget?tripId=` |

**Quick tools (Overview):**

| Label | href | Params |
|---|---|---|
| Budget | in-tab `setActiveTab('budget')` | — |
| Weather | `/utilities/weather` | `destination`, `tripId` |
| Currency | `/utilities/currency` | `destination`, `tripId` |
| Walking tour | `/tour` | `city`, `country`, `trip_id` |

Header **My trips** → `/saved`.

**State:** Valid trip UUID in Supabase. Auth via page (not middleware). Optional `?tab=`.

**Gaps:** Tab deep-links break after the first click. Documents are cosmetic. Walking-tour Overview tool now lands on `/tour` (trip-aware). Generated-tour view on that page does not keep “Back to trip” — only the pre-generate form does.

---

## D. Walking Tour

Three implementations. Nav, Footer, and Trip Hub each pick a different one.

| Route | File | Who links here | Reads URL? | Auth |
|---|---|---|---|---|
| `/walking-tour` | `src/app/walking-tour/page.tsx` | **GlobalNav** | **No** | Public |
| `/tours` | `src/app/tours/page.tsx` | Footer, homepage footer, `/tools`, `(app)/utilities`, 404 | **No** (`destination`/`budget` sent by some cards, ignored) | Middleware-protected |
| `/tour` | `src/app/(app)/tour/page.tsx` | Trip Hub, dashboard `?load=` | Yes: `city`, `country`, `destination`, `trip_id`, `load` | `(app)` gate — unauth sees Sign in, not `/walking-tour` |

**`/walking-tour` purpose:** Curated city cards, generate via `/api/tour/generate`, map, chat panel, affiliate stop links. Outbound is external Maps / affiliates only.

**`/tours` purpose:** Older generator UI; “COMING SOON” map. Can `router.push('/trip-details/{generatedTour.id}')` with a likely-invalid id. Share URL `/tours/shared/{id}` has **no page**.

**`(app)/tour` purpose:** Slim generator tied to a trip; **← Back to trip** → `/my-trip/{trip_id}`; dashboard saved tours → `?load={tourId}`.

**Note:** GlobalNav `/walking-tour` is the public standalone generator. `/tour` is the logged-in, trip-context page. Do not alias them together.

---

## E. Auth

| Route | File | Purpose | Inbound | Outbound | State | Gaps |
|---|---|---|---|---|---|---|
| `/auth/login` | `auth/login/page.tsx` | Email/password, demo, preview-guest | Middleware `redirectTo`; nav; homepage `next`; saved/dashboard; checkout `redirect`; my-trip `next` | Post-login path or pending-save dest or `/dashboard`; `/auth/register`; `/` | Query return URL; pending save in localStorage | Guest preview only if `PREVIEW_GUEST_ENABLED` + Vercel preview; Terms/Privacy mentioned, not linked |
| `/auth/register` | `auth/register/page.tsx` | Sign up | Nav, homepage, login | **Hardcoded `/dashboard`** (ignores return URL); `/auth/login` | Form + Supabase | No return-url |
| `/auth/callback` | `auth/callback/route.ts` | OAuth PKCE | Supabase `?code=` | `next` → `redirectTo` → `redirect` → **`/`**; fail → `/auth/auth-code-error` | Sets cookies | Default `/` vs login default `/dashboard` |
| `/auth/auth-code-error` | `auth/auth-code-error/page.tsx` | OAuth failure | Callback | `/auth/login` (no return); `/` | none | Drops original next |
| `/auth/login-debug` | `auth/login-debug/page.tsx` | Dev debugger | **none** | none | local | Orphan |
| `/login-help` | `login-help/page.tsx` | Dev troubleshooting prose | **none** | `/` | none | Orphan |
| `/auth/reset-password` | — | Listed in middleware AUTH_ROUTES | — | — | — | **No page** |

---

## F. Utilities (Weather / Currency / tools)

| Route | File | Purpose | Inbound | Outbound | State | Gaps |
|---|---|---|---|---|---|---|
| `/tools` | `tools/page.tsx` | 3-card index | Footer, homepage | `/budget`, `/tours`, `/plan-trip` | Standalone | Does not link weather/currency |
| `/utilities` | `(app)/utilities/page.tsx` | Tools grid | **No inbound href in repo** | `/utilities/weather`, `/utilities/currency`, **`/utilities/phrases` (404)**, `/tours`; feedback **`/app/profile` (404)** | `(app)` auth | Undiscoverable; most cards “Coming Soon” with no pages |
| `/utilities/weather` | `utilities/weather/page.tsx` | Forecast | Trip Hub; utilities index | Back → `/my-trip/{tripId}` or `/saved` | Query `destination`, `tripId` | Error/empty without destination; public page (not `(app)`) |
| `/utilities/currency` | `utilities/currency/page.tsx` | USD converter | Trip Hub; utilities index | Same back pattern | Query `destination`, `tripId` | Same |
| `/budget` | `budget/page.tsx` | Public estimator + trip-scoped expenses | Footer; BottomTabs; homepage; Trip Hub budget tab `?tripId=` | With trip → `/my-trip/{id}?tab=budget`; **View Trip Details** → `/trip-details/budget-preview?…`; no trip → `/plan-trip`, `/tools`, `/auth/login?next=/budget` | Optional `tripId` | Fake trip-details id; not middleware-protected |
| `/budget-calculator` | `budget-calculator/page.tsx` | Alternate calculator (savings / tracker tabs) | **almost none** | `/my-trips` | Standalone | Parallel to `/budget`; tracker tab “Coming Soon” |

---

## G. Dashboard / Saved Trips / lists

Four list surfaces, three different detail routes.

| Route | File | Data | Opens trip at | Plan CTA | Auth |
|---|---|---|---|---|---|
| `/saved` | `saved/page.tsx` | `/api/trips/save` (Supabase) | `/my-trip/{id}`, `?tab=book` | `/plan-trip` | Middleware; 401 → `redirectTo=/saved` |
| `/dashboard` | `(app)/dashboard/page.tsx` | Planned trips + affiliate stats + saved walking tours | `/my-trip/{id}`; tours → **`/tour?load=`** | `/plan-trip` | Middleware + `(app)` gate |
| `/my-trips` | `my-trips/page.tsx` | `/api/trips/my-trips` or localStorage sample | **`/trip-details/{id}?destination=…`** | `/plan-trip` | Not middleware |
| `/trips` | `(app)/trips/page.tsx` | Supabase grid in app shell | **`/trip/{id}`** (legacy) | `/plan-trip` | `(app)` gate |

**Dashboard extras:** `RecentBookings` links `/trips` and **`/bookings` (no page)**. Saved walking tours use `/tour?load=` (loads via `(app)/tour`).

**`/profile`** — `(app)/profile/page.tsx`. Account + `user_preferences`. Inbound: BottomTabs, GlobalNav Account. Outbound: sign out → `/`. No `/settings` route (settings live here).

**`/onboarding`** — `(app)/onboarding/page.tsx`. 3-step preference wizard. **No inbound links.** Completes to **`/app/dashboard` (404)** — should be `/dashboard`.

---

## H. Booking / cart / add-ons

Affiliate-first is the live product; Stripe paths exist but are split.

| Route | File | Purpose | Inbound | Outbound | State | Gaps |
|---|---|---|---|---|---|---|
| `/booking` | `booking/page.tsx` | Pre-checkout review + traveler form | Multi-stop / alacarte “Book”; legacy itinerary; Stripe cancel `?tripId=` | Affiliate → `/my-trip/{id}`; payments → `/booking/checkout?…`; back → `/trip-details/{id}?…`; missing params → `/plan-trip` | Query `tripId`, destination, dates, party, budget | Not middleware-protected |
| `/booking/flights` | `booking/flights/page.tsx` | Flight search | Some affiliate URLs (`from`,`to`,`price`); budget cards send `destination` (**ignored**) | Checkout or localStorage cart | Query `from`,`to`,`price` (defaults Vancouver/Madrid/1200) | Param mismatch; second cart |
| `/booking/hotels` | `booking/hotels/page.tsx` | Hotel search | `destination`,`checkin`,`checkout` | Checkout; `/plan-trip`; `/saved`; back **`/trip-details` (no id — broken)** | Query destination + dates | Broken back |
| `/booking/checkout` | `booking/checkout/page.tsx` | Stripe or affiliate pay | `/booking`, flights/hotels | Stripe URL; 401 → `/auth/login?redirect=`; affiliate → `/my-trip/{id}` | Rich query + `item` JSON | Two checkout APIs |
| `/booking/checkout-session` | `booking/checkout-session/page.tsx` | Alternate Stripe for one booking object | **none in nav** | Stripe | Required `bookingId`,`amount`,`type`,`title` | Orphan |
| `/booking/confirmation` | `booking/confirmation/page.tsx` | Trip summary + affiliate links (**not** a Stripe receipt) | `itinerary-builder`; Stripe `success_url` with `session_id`/`sid` (**not read**) | `/my-trip/{id}?tab=book`, `/dashboard`, `/plan-trip` | `trip_id`/`tripId` **or** inline destination/dates | Stripe success often “Trip not found” |
| `/booking/success` | `booking/success/page.tsx` | Generic paid card | tests/docs only | `/profile`, `/` | Displays `session_id` | Unused by live Stripe URLs |
| `/booking/cancel` | `booking/cancel/page.tsx` | Cancelled payment | tests/docs only | **`/booking/checkout` (no params)**; `/` | none | Live cancel URLs go to `/cart` or `/booking?tripId=` |
| `/cart` | `cart/page.tsx` | API cart + Stripe | `AppHeader`; `/addons`; Stripe cancel_url | Login (no return); Stripe → `/booking/confirmation?sid=`; affiliate → `/saved` | Auth + `/api/cart` | Dual cart vs flights localStorage |
| `/addons` | `(app)/addons/page.tsx` | Extra SKUs by city | BottomTabs | `/cart` | `(app)` auth | |
| `/checkout/success` | `(app)/checkout/success/page.tsx` | **Mock** confirmation | **none** | `/dashboard`, `/support` | Fake order | Not a Stripe callback |
| `/flight-booking` | `flight-booking/page.tsx` | Dev Amadeus sandbox | **none** | in-page only | none | Orphan |
| `/test-payment` | `test-payment/page.tsx` | Stripe harness | **none** | checkout API | none | Orphan |

---

## I. Other product pages

| Route | File | Purpose | Inbound | Outbound | State | Gaps |
|---|---|---|---|---|---|---|
| `/assistant` | `assistant/page.tsx` | Standalone `/api/ai/assistant` chat | **none** (homepage inlines the API) | `/` | Client chat history | Orphan |
| `/arrival` | `arrival/page.tsx` | Smart arrival timeline demo | **none** (manual `?tripId=`) | `router.back()` | Optional `tripId`; hardcoded demo fallback | Orphan |
| `/itinerary-builder/[id]` | `itinerary-builder/[id]/page.tsx` | Legacy day editor | `/my-trips` edit (`destination`,`startDate`,`endDate`,`edit=true`) | `/my-trips`; `/booking/confirmation?destination&dates&travelers&budget` | Query + id | Parallel to Hub itinerary tab |
| `/trips/plan` | `trips/plan/page.tsx` | Legacy wizard step 1 | **none from nav** | `/trips/select?departureCity&budget&travelers&interests&…` | Own param names | Orphan; incompatible with `/plan-trip` |
| `/trips/select` | `trips/select/page.tsx` | Legacy wizard step 2 | `/trips/plan` | `/trips/itinerary?tripId&…`; back `/` | Legacy query | Orphan |
| `/trips/itinerary` | `trips/itinerary/page.tsx` | Legacy wizard step 3 | `/trips/select` | `/trip-details/{id}?…` or `/booking?tripId&…`; back `/trips/plan` | Legacy query | Orphan |

`TripPlannerForm` (`src/components/forms/TripPlannerForm.tsx`) still builds `/suggestions?…` with `details` (not `additionalDetails`). **Not mounted** on `/plan-trip`.

---

## J. Stub aliases (Footer / homepage footer)

Short URLs are what most users hit. Fuller marketing lives under `/company/*` and `/support/*`.

| Route | File | Sends you |
|---|---|---|
| `/about` | `about/page.tsx` | `/plan-trip` (does **not** link `/company/about`) |
| `/careers` | `careers/page.tsx` | `/support/contact` |
| `/press` | `press/page.tsx` | `/support/contact` |
| `/contact` | `contact/page.tsx` | `/support/contact` |
| `/help` | `help/page.tsx` | `/support` |
| `/privacy` | `privacy/page.tsx` | `/support/privacy-policy` |
| `/terms` | `terms/page.tsx` | `/support/terms` |

---

## K. Pages / routes that exist in code but are missing or shadowed

| Path | Status |
|---|---|
| `/tour` | Reachable at `(app)/tour` after the `/walking-tour` alias was removed |
| `/settings` | Middleware-protected; **no page** |
| `/budgets` | Middleware-protected; **no page** (real UI is `/budget`) |
| `/auth/reset-password` | Middleware AUTH_ROUTE; **no page** |
| `/demo`, `/auth/signup`, `/trips/search`, `/blog/[slug]`, `/utilities/phrases`, `/tours/shared/[id]`, `/itinerary/[id]`, `/bookings`, `/app/dashboard`, `/app/profile` | Linked from UI; **no page** |

API handlers under `src/app/api/` are out of scope except where they drive navigation (checkout success URLs, OAuth callback, trip save).

---

## Findings register (triage later — not fixed in this pass)

Match the entry-points style: symptom, not a prescribed patch.

| Pri | ID | Symptom |
|---|---|---|
| P0 | **T1** | ~~Trip Hub `/tour` shadowed by redirect.~~ **Fixed 2026-08-19:** removed `/tour` → `/walking-tour` alias. Remaining: generated-tour view on `/tour` drops “Back to trip”; unauth `/tour` hits `(app)` sign-in gate instead of the public generator. |
| P0 | **T2** | Logged-in users never see `/` (middleware → `/dashboard`). Hero chips / carousel are a logged-out-only funnel. |
| P1 | **L1** | Four trip lists, three detail routes: `/saved`+`/dashboard` → `/my-trip`; `/my-trips` → `/trip-details`; `(app)/trips` → `/trip`. |
| P1 | **L2** | `/tours` (protected, Footer) vs `/walking-tour` (public, GlobalNav) vs `/tour` (app-shell, trip-aware). Three UIs remain; they are no longer aliased together. |
| P1 | **B1** | Stripe success lands on `/booking/confirmation` which ignores `session_id`/`sid`. `/booking/success` unused. |
| P1 | **M1** | Marketing CTAs 404: `/auth/signup`, `/demo`, `/trips/search`. |
| P1 | **F1** | Footer/homepage use stubs (`/about`, `/careers`, …) instead of `/company/*` and `/support/*`. |
| P2 | **A1** | Hero chips still `setPrompt` only; **Book flights** after AI is bare `/plan-trip`. See entry-points A6/A8. |
| P2 | **A2** | Trip-details **← Back to suggestions** still drops query (entry-points F, remaining hop). |
| P2 | **U1** | `/utilities` index has no inbound links; links to missing `/utilities/phrases` and `/app/profile`. |
| P2 | **O1** | `/onboarding` unlinked; finish URL `/app/dashboard` 404. |
| P2 | **H1** | Hub `?tab=` not synced after click; Documents tab is an alert stub. |
| P3 | **X1** | Orphans: `/assistant`, `/arrival`, `/login-help`, `/auth/login-debug`, `/flight-booking`, `/test-payment`, `/checkout/success`, `/booking/checkout-session`, `/trips/plan|select|itinerary`, `/budget-calculator`, `/itinerary-builder/[id]`, unused `TripPlannerForm`. |
| P3 | **X2** | Dead hrefs: `/itinerary/[id]`, `/bookings`, `/trip-details` (no id), `/blog/{slug}`. |
| P3 | **X3** | Return-URL param trio (`redirectTo` / `redirect` / `next`); OAuth default `/` vs login `/dashboard`. |
| P3 | **X4** | Middleware protects `/settings` and `/budgets` with no pages. `/plan-trip` and `/tours` require auth in production. |

**Shipped since entry-points-map was written (do not re-open as new bugs):** Plan Trip reads `tripType` / dates / budget / `from` / party / named stops; SEA region + mid budget on Suggested Route Map; hero chip copy no longer describes Hub chat; Suggestions Back keeps the query.

---

## Re-audit grep

```text
src/app/**/page.tsx
href="/
router.push(`
redirect(
next.config.ts redirects()
PROTECTED_ROUTES
NAV_LINKS
footerSections
```

Primary chrome files: `src/app/layout.tsx`, `src/app/(app)/layout.tsx`, `src/app/(marketing)/layout.tsx`, `src/components/GlobalNav.tsx`, `src/components/marketing/Footer.tsx`, `src/components/app/BottomTabs.tsx`, `middleware.ts`, `next.config.ts`.
