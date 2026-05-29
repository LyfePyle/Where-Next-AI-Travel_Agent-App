# Trip Details Page — Redesign Brief (for Claude or design pass)

**Goal:** Improve look, flow, and conversion so more users complete checkout.  
**Route:** `/trip-details/[id]?destination=...&startDate=...&endDate=...&adults=...&kids=...`

---

## Current issues

1. **Empty destination in URL**  
   Visiting `/trip-details/4?destination=` shows a blank or fallback destination. The page should handle missing `destination` (e.g. show "Your trip" or fetch trip title from API when `tripId` is present).

2. **No emotional hook**  
   The page jumps straight into "Choose Your Flight" and a dense grid. There’s no hero or one-line “why book this trip” to build intent before choices.

3. **Too many competing CTAs**  
   Sidebar has: "Buy Complete Trip", "Save Trip", "Book Now", "Set Budget". Multiple similar actions (Buy vs Book Now) and equal visual weight make the primary action unclear.

4. **Loading state is misleading**  
   Copy says "Live pricing requires provider keys" and "Connect Amadeus…" even when the app is just loading. This should be a neutral loading state (e.g. "Loading your trip…") and provider messaging only when relevant.

5. **Dense, utilitarian layout**  
   Flights and hotels are long horizontal scrolls; budget sidebar is text-heavy. Hard to scan and doesn’t feel like a focused “decide and book” experience.

6. **Primary path is unclear**  
   We want: **See trip → Pick flight/hotel (optional) → Book Now / Buy Complete Trip → Checkout.** The page doesn’t clearly lead users down that path.

---

## Suggested direction (for Claude / implementation)

### 1. Hero block (above the fold)

- **Destination name** (from URL or API), large and clear. If missing, use “Your trip” or trip ID fallback.
- **One-line summary:** e.g. “7 days · 2 travelers · [Start] – [End]”.
- **Estimated total** in a clear pill or badge (e.g. “From $2,400” or “Est. $2,400”).
- **Single primary CTA:** “Reserve this trip” or “Continue to booking” (links to `/booking?tripId=...&destination=...` with all params). Make it one button, one color, prominent.
- Optional secondary: “Save for later” (current Save Trip).

### 2. Clear hierarchy of actions

- **Primary:** One main button that goes to **booking** (either “Book now” with current trip summary, or “Buy complete trip” if they’ve picked flight+hotel). Not two equal “buy” options.
- **Secondary:** Save trip, Set budget, Back to suggestions.
- Avoid 3–4 buttons of similar importance in one row.

### 3. Simplify the main content flow

- **Option A:**  
  - Hero + primary CTA.  
  - Short “Trip summary” (dates, travelers, estimated total).  
  - Then “Choose your flight” and “Choose your hotel” as **optional** refinements, with a note: “Or continue to booking and we’ll help you choose there.”
- **Option B:**  
  Keep flight/hotel selection but put the **sticky CTA** (Book now / Reserve) in the sidebar and at the top on mobile, so the next step is always visible.

### 4. Handle missing or empty `destination`

- If `destination=` is empty in the URL:
  - When `tripId` exists: try `GET /api/trips/[id]` and use `trip.destination` or `trip.title` for the heading.
  - Fallback: “Your trip” or “Trip details” so the page never shows a blank title.
- Ensure “Book now” still passes `destination` when we have it (from API or URL); if we only have a title, use that for display and pass through to booking where possible.

### 5. Loading and errors

- **Loading:** “Loading your trip…” (or “Loading options…”) with a simple spinner. No mention of “provider keys” or Amadeus unless the context is clearly “setup” or “admin”.
- **Error / no data:** Short message + “Back to suggestions” or “Plan a new trip” so the user always has a next step.

### 6. Visual and UX polish

- Use a **single accent color** for the main CTA (e.g. purple or green) and avoid multiple strong colors for multiple primary actions.
- Add a **back link** (e.g. “← Back to suggestions”) so the journey is reversible.
- On mobile: ensure the primary CTA is sticky or repeated so it’s visible without scrolling past long flight/hotel lists.
- Consider a **compact trip summary card** at the top (destination, dates, travelers, est. total) that stays visible or is easy to find.

---

## Technical touchpoints

- **Page:** `src/app/trip-details/[id]/page.tsx` — reads `searchParams` and passes props to `TripDetailsEnhanced`. Add fallback for empty `destination`; optionally fetch trip by `tripId` for title/destination.
- **Component:** `src/components/TripDetailsEnhanced.tsx` — header, flight/hotel sections, sidebar with budget and CTAs. Adjust layout and copy for hero, single primary CTA, and loading state.
- **Booking link:** Already passes `tripId`, `destination`, `startDate`, `endDate`, `adults`, `kids`, `budgetAmount`. Keep this; ensure `destination` is set from URL or API when available.

---

## Success criteria

- No blank or confusing title when `destination=` is empty.
- One obvious “next step” (Reserve / Book now) that leads to checkout.
- Loading state is neutral and accurate.
- Page feels focused on “see trip → book” rather than “configure everything first.”

Use this brief to drive a design pass or to instruct Claude to implement the layout and copy changes in `TripDetailsEnhanced` and the trip-details page.
