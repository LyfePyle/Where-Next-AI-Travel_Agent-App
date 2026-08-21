# Trip-creation entry points map

Living audit of every path that starts (or claims to start) a new trip via `/plan-trip` or `/suggestions`.

**See also:** full-app map in [`docs/site-map.md`](site-map.md) (§B for current Plan Trip / Suggestions / trip-details wiring).

**Status:** mapping only — no product fixes in this pass.  
**Last audited:** 2026-08-19 against `main` (`src/app/page.tsx`, `src/app/plan-trip/page.tsx`, `src/app/suggestions/page.tsx`, `src/data/curated-destinations.ts`).

**Stale vs later 2026-08-19 ships:** the **Receiver** table below still describes Plan Trip as reading only `destination` + `vibes`. It now also reads `from`, `adults`, `kids`, `tripType`/`mode`, budget, dates, `tripDuration`, `numberOfStops`, and named `stops` (≥2). Hero chips A3/A4 were replaced. Suggestions Back (F) now keeps the query. Use `site-map.md` §B as the current receiver; keep the tables below as the original promise-vs-pass audit.

How to use this: when something “doesn’t feel like the copy,” find the row, then check **Passes today** vs **Should pass**. Re-audit by grepping `plan-trip` / `suggestions?` (commands at the bottom).

---

## Receiver: what each page actually reads

### `/plan-trip` (`src/app/plan-trip/page.tsx`)

Reads from the URL **once on mount**:

| Param | Applied to form? | Notes |
|---|---|---|
| `destination` | Yes | Fills the single “Where do you want to go?” field. Does **not** switch trip style to Multi-city. |
| `vibes` | Yes | Comma-separated; keep only known vibe values; cap 3. |

**Not read** (even if present on the URL): `tripType`, `mode`, `style`, `budgetAmount`, `budget`, `tripDuration`, `duration`, `startDate`, `endDate`, `from`, `stops`, `numberOfStops`, `additionalDetails`, `adults`, `kids`.

Defaults if those are missing: trip style **One destination**, budget **$3,000**, 2 adults, 0 kids, empty dates, 3 empty multi-stop slots (only visible after the user clicks Multi-city).

Submit from this page builds a **rich** `/suggestions?...` URL (`from`, `tripType`, `destination` / `stops`, dates, vibes, `budgetAmount`, party size). That outbound set is much larger than the inbound set.

### `/suggestions` (`src/app/suggestions/page.tsx`)

Reads a wide set: `destination`, `stops` (JSON), `from`, `startDate`, `endDate`, `tripDuration`, `budgetAmount`, `budgetStyle`, `vibe` / `vibes`, `additionalDetails`, `adults`, `kids`, `tripType`, `numberOfStops`, plus optional budget-split fields.

Landing on `/suggestions` with no params still “works,” but it invents defaults (e.g. `from=Vancouver`, `budgetAmount=2000`). That is a different product than an empty `/plan-trip`.

---

## Proposed param names (for a later fix — not wired yet)

Keep extending the existing `/plan-trip` pattern rather than inventing a second scheme:

| Intent | Param | Example |
|---|---|---|
| Destination / region | `destination` | `Southeast Asia` (not `Bali`) |
| Trip style | `tripType` | `single` \| `multi-city` \| `surprise` |
| Stop count (multi) | `numberOfStops` | `6` |
| Named stops (optional) | `stops` | JSON array of `{ destination, startDate, endDate }` |
| Duration in nights | `tripDuration` | `42` |
| Dates (optional) | `startDate`, `endDate` | ISO dates derived from duration |
| Budget USD total | `budgetAmount` | `4500` |
| Vibes | `vibes` | `nature,foodie` |
| Extra story text | `additionalDetails` | Preset copy, for the notes field |
| Origin | `from` | Only if we actually know it |

Plan Trip must **read** these the same way it already **writes** them to Suggestions.

Suggested budget-tier mapping (2 adults, product decision still open):

| Copy | `budgetAmount` |
|---|---|
| budget / cheap | `2000` |
| mid | `4500` |
| luxury / splurge | `8000` |

---

## Entry points

Match = current behavior matches what the UI copy / control promises.  
Mismatch = user can reasonably expect more than we pass.

### A. Homepage — hero prompt (`src/app/page.tsx`)

Empty “Plan my trip” is a **Link** to bare `/plan-trip`.  
If the box has text, **Plan my trip does not open Plan Trip** — it POSTs `/api/ai/assistant` and stays on `/`.

| # | Control | Lives | Passes today | Should pass (from copy) | Match? |
|---|---|---|---|---|---|
| A1 | Chip: *I don't know where to go yet — help me narrow it down* | Hero chips | `setPrompt` only. Next click: homepage AI if they hit Plan my trip; otherwise nothing. | `/plan-trip?tripType=surprise` (or Surprise me selected) + `additionalDetails` = chip text. | **Mismatch** — never reaches Plan Trip; Surprise me is never selected. |
| A2 | Chip: *6 countries in Southeast Asia, ~6 weeks, mid budget* | Hero chips | `setPrompt` only. Homepage AI if submitted. Snapshot guesses length (`42+ days`) from “6 weeks”. Budget guess **ignores “mid”** and defaults to **$2,000**. Destination guess scans a hardcoded city list in **list order**; if the AI reply mentions Bali (very likely), **`Bali` wins over Bangkok** because `Bali` is earlier in `known`. *Suggested Route Map* then goes to `/plan-trip?destination=Bali` (single-destination field, default One destination, default $3,000, no dates). | `tripType=multi-city`, `destination=Southeast Asia` (or 6 stop names), `numberOfStops=6`, `tripDuration=42`, `budgetAmount` ≈ mid tier, `additionalDetails` = chip text. Form should open in **Multi-city**, not One destination + Bali. | **Mismatch — highest priority.** This is the SEA → Bali bug. Two hops (chip → homepage AI → Suggested Route Map) silently rewrite a 6-country trip into one city. |
| A3 | Chip: *Swap one stop and keep the rest of the trip intact* | Hero chips | `setPrompt` → homepage AI. | This is a **Trip Hub chat** promise, not trip creation. Should not start a blank planner. Better: copy that says “after you save a trip” or deep-link a demo saved trip. | **Mismatch** — wrong surface. |
| A4 | Chip: *Add a yoga day in Denpasar on day 3* | Hero chips | `setPrompt` → homepage AI. | **Itinerary chat** on an existing trip, not `/plan-trip`. | **Mismatch** — wrong surface. |
| A5 | Empty hero **Plan my trip** | Hero | `/plan-trip` (no params). | Bare planner is OK when they have not typed anything. | Match |
| A6 | Filled hero **Plan my trip** | Hero | Homepage AI only. No URL params. | Either (1) keep AI on `/` **and** a clear “Continue in planner” that passes mode/region/duration/budget, or (2) skip homepage AI and open `/plan-trip` with those params. Today the snapshot shows length/budget then **Suggested Route Map** drops all of it except a guessed city. | **Mismatch** |
| A7 | **Suggested Route Map** (after AI) | Hero AI panel | `/plan-trip?destination={guessDestinationFromText}` only. | Everything in the snapshot: destination **or region**, mode, duration, budget. Multi-stop prompts must not collapse to the first city in `known`. | **Mismatch** |
| A8 | **Book flights** (after AI) | Hero AI panel | `/plan-trip` (no params). | At least the same as A7; “Book flights” on a generated plan should not wipe it. | **Mismatch** |
| A9 | **Save this trip** | Hero AI panel | POST `/api/trips/saved` with a regex-guessed destination + `$` budget or `2000`. Then `/trip-details/{id}?budgetAmount=…`. | Saving a multi-country essay as a single destination is a weaker version of A2. | **Mismatch** (save path, not Plan Trip) |

Hero helper functions (why A2 becomes Bali):

- `guessDestinationFromText` — first hit in a **fixed city list**, not first city in the user’s text. List includes `Bali` before `Bangkok`. “Southeast Asia” is **not** in the list.
- `guessBudgetUsdFromText` — only `$…`, `…k`, or `under $…`. The word **mid** is ignored → 2000.
- `guessTripLengthFromText` — **does** parse “6 weeks” → `42+ days` for the snapshot UI, then that value is **never put on the Plan Trip URL**.

### B. Homepage — “Need a starting point?” carousel

Section title is “Need a starting point?”; body says *Pick a destination — we'll pre-fill the planner with highlights, sample days, and vibe tags.* Cards are **single cities/countries**, not the hero chips. Easy to conflate with A2.

Built by `planTripHref()` in `src/data/curated-destinations.ts` → `/plan-trip?destination=…&vibes=…`.

| Card | Passes today | Should pass | Match? |
|---|---|---|---|
| Swiss Alps | `destination=Swiss Alps`, `vibes=nature,adventure,hiking` | Same, plus `tripType=single`. Optional: duration from 3-day teaser (weak). | **Partial** — destination + vibes OK; still One destination (OK for this card). Dates/budget not promised by copy. |
| Bali, Indonesia | `destination=Bali, Indonesia`, `vibes=relaxing,spiritual,beach` | Single-destination Bali is what the **card** promises. | **Match for the card.** Not a substitute for the SEA hero chip. |
| Tokyo, Japan | `destination=Tokyo, Japan`, `vibes=city,foodie,cultural` | `tripType=single` + destination + vibes. | Partial (same as Swiss Alps) |
| Santorini, Greece | destination + `romantic,beach,photography` | single | Partial |
| Iceland | destination + `nature,adventure,photography` | single | Partial |
| Morocco | destination + `cultural,adventure,foodie` | Copy is one country; teaser jumps Marrakech → Atlas → Chefchaouen (could be multi-city later). Today single field is acceptable. | Partial |
| Paris, France | destination + `romantic,cultural,foodie` | single | Partial |
| Section **Start planning** | `/plan-trip` no params | Bare planner OK. | Match |

Carousel cards never pass duration, budget, or `tripType`. Copy does not claim weeks/budget, so that is a smaller gap than A2.

### C. Homepage — other CTAs

| Control | Passes | Should pass | Match? |
|---|---|---|---|
| Nav **Plan Trip** (`GlobalNav`) | `/plan-trip` | Bare planner. | Match |
| Footer **Trip Planning** / **AI Agent** | `/plan-trip` | Bare. | Match |
| Feature card **Plan a trip** (booking) | `/plan-trip` | Bare. | Match |
| **Ready to Experience… → Plan a Trip** | `/plan-trip` | Bare. | Match |
| **Sign up / Sign in** | auth URLs | Not trip creation. | n/a |

### D. Direct Plan Trip and redirects

| Entry | Passes | Match? |
|---|---|---|
| Typed `/plan-trip` | none | Match |
| `/explore`, `/search`, `/ai-travel-agent`, `/pricing` → 308 `/plan-trip` (`next.config.ts`) | Path dropped; query **may** survive. Plan Trip still only applies `destination` + `vibes`. | Redirects themselves OK; extra query keys still ignored. |

### E. Plan Trip → Suggestions (canonical happy path)

| Entry | Passes | Match? |
|---|---|---|
| `/plan-trip` submit | `from`, `tripType` (`single` \| `multi-city`), `destination` and/or `stops` JSON, dates, `vibes`, `additionalDetails`, `adults`, `kids`, `budgetAmount`; multi with empty stop names uses the region field as one stop. | **Match** — this is the only path that currently carries a full planner payload. |

`src/components/forms/TripPlannerForm.tsx` also builds a `/suggestions?…` URL (`from`, dates, budget split, `tripType`, `numberOfStops`, `details` not `additionalDetails`). **It is not mounted on `/plan-trip`.** Dead / legacy form. Suggestions uses `additionalDetails`; this form sends `details` — would be a mismatch if remounted.

### F. Suggestions and details — “start over”

| Control | Passes | Should pass | Match? |
|---|---|---|---|
| Suggestions back / “plan again” links | `/plan-trip` **with no query** | Either keep current trip params so the form is pre-filled, or label the link “Start over”. | **Mismatch** — looks like “edit this search,” acts like wipe. |
| `TripDetailsEnhanced` / `TripDetailsAlacarte` → `/suggestions` | no params | Should carry the trip’s destination/dates/budget. | **Mismatch** |
| `/trip/[id]` → `/suggestions` | no params | Same. | **Mismatch** |

### G. Saved trips / dashboard / budget / booking (create-new, not continue)

These mean “start a new plan,” so empty `/plan-trip` is acceptable **if** the button says Plan a trip / Plan Trip. Mismatch only if copy implies continuing the current trip.

| Entry | URL | Notes |
|---|---|---|
| `/saved` Plan a trip | `/plan-trip` | OK as new trip. |
| Dashboard / `(app)/trips` / `my-trips` | `/plan-trip` | OK as new trip. |
| `/budget` (no `tripId`) Plan Trip | `/plan-trip` | Budget page is a separate tool; OK. |
| Booking / cart / confirmation / FlightSearch | `/plan-trip` | New trip. OK. |
| `not-found`, `/about`, `/tools` | `/plan-trip` | OK. |
| `BudgetDashboard` | `/plan-trip` | OK. |

### H. Parallel products (not `/plan-trip`, but feel like “starting a trip”)

Do not funnel these through Plan Trip unless we decide that on purpose.

| Entry | Goes to | Data carried | Trip-creation overlap |
|---|---|---|---|
| Nav **Walking Tour** | `/walking-tour` | Optional `city`, `country`, `destination`, `trip_id` on `/tour` | Standalone walk. Trip Hub itinerary can later **suggest** a walk; does not pre-fill Plan Trip. |
| Trip Hub itinerary chat | `/api/trips/[id]/chat` | Saved trip + focused day | Edits an existing trip. Hero chips A3/A4 describe this but do not open it. |
| Trip Hub walking-tour card | itinerary PATCH | Free-time middle days only | Not a creation entry. |
| `/trips/plan` (legacy) | `/trips/select?departureCity&budget&…` | Own param names (`departureCity`, `budget`, not `from` / `budgetAmount`) | **Orphan wizard** — not the current Plan Trip. Flag if still linked from anywhere. |

---

## Mismatch register (prioritize from this list)

Work top-down. Do not “fix all greps”; these are the ones that break the promise on the button.

| Pri | ID | Symptom | Likely fix (later) |
|---|---|---|---|
| P0 | A2 + A7 | SEA chip / homepage AI → Plan Trip as **Bali, One destination**, no 6 weeks, no mid budget. | (1) Teach Plan Trip to read `tripType`, `tripDuration`, `budgetAmount`, `additionalDetails`, `numberOfStops`. (2) Hero chips that mean “start this trip” should **link** with those params, not only `setPrompt`. (3) `guessDestinationFromText` must prefer region phrases (“Southeast Asia”) over the first city in a hardcoded list. (4) Map “mid budget”. |
| P0 | A3, A4 | Chips describe Hub/itinerary chat, run homepage AI. | Relabel chips **or** don’t treat them as trip-creation presets. |
| P1 | A6, A8, A9 | Homepage AI snapshot shows length/budget then the next CTA drops them. | One “Continue in planner” CTA that serializes snapshot → Plan Trip params. |
| P1 | F | Suggestions / trip-details “back to plan” wipes the form. | Pass the current search string through, or say Start over. |
| P2 | B | Carousel omits `tripType=single` (harmless) and never sends dates. | Optional `tripType=single` on `planTripHref`. Do **not** reuse Bali as a stand-in for SEA. |
| P2 | E leftover | `TripPlannerForm` unused; param name `details` vs `additionalDetails`. | Delete or wire with the same names as `/plan-trip`. |
| P3 | H `/trips/plan` | Second planner with different param names. | Confirm it is unlinked; archive or redirect to `/plan-trip`. |

**Not a bug:** clicking the **Bali carousel card** and landing on `/plan-trip?destination=Bali%2C+Indonesia` — that card’s copy is Bali. The bug is using Bali for the **Southeast Asia** story.

---

## Suggested click-through (slow-day QA)

1. Homepage, no text → Plan my trip → empty One destination form.  
2. Chip A2 → confirm URL **or** planner state: Multi-city, region Southeast Asia, ~6 weeks, mid budget — **not** Bali.  
3. Chip A1 → Surprise me (once wired).  
4. Carousel Bali → single Bali + vibes. Carousel Tokyo → Tokyo + vibes.  
5. Nav Plan Trip → empty form.  
6. Fill Plan Trip fully (multi, 3 named cities, dates, budget) → Suggestions shows the same facts.  
7. From Suggestions, use the back/plan-again link → form should still have those facts (after F is fixed).  
8. Walking Tour generate → does **not** change Plan Trip.  
9. Saved trip → itinerary chat “swap a stop” (A3’s real home).

---

## Re-audit grep

```text
/plan-trip
planTripHref
router.push(`/plan-trip
href="/plan-trip
href={`/plan-trip
/suggestions?
router.push(`/suggestions
```

Primary files: `src/app/page.tsx`, `src/data/curated-destinations.ts`, `src/app/plan-trip/page.tsx`, `src/app/suggestions/page.tsx`, `src/components/GlobalNav.tsx`, `src/components/marketing/Footer.tsx`, `src/components/marketing/TravelImageCarousel.tsx`.
