# Trip Hub — Setup Guide

**Route:** `/my-trip/[id]` (not `/trip/[id]` — that page is the older AI trip overview)  
**Saved list:** `/saved` reads from **`trips`** (same table as `POST /api/trips/save`)

---

## Bugs fixed (May 2026)

| Issue | Fix |
|-------|-----|
| Route mismatch | Everything uses **`/my-trip/[id]`** |
| Empty saved list | `/saved` now queries **`trips`**, not `saved_trips` |
| Saves without user | `/api/trips/save` reads auth **cookies** and sets `user_id` |
| Hub 404 | Server page at `src/app/my-trip/[id]/page.tsx` loads `trips` row |

---

## Files in repo

```
src/lib/affiliate-partners.ts          # Booking, Skyscanner, Viator links
src/components/trip-hub/TripHub.tsx
src/app/my-trip/[id]/page.tsx
src/app/saved/page.tsx
src/app/api/affiliate/redirect/route.ts
src/app/api/trips/save/route.ts        # writes trips + requires login
supabase/migrations/trips_user_rls.sql
supabase/migrations/migrate_saved_trips_to_trips.sql  # optional one-time
supabase/migrations/affiliate_clicks.sql              # optional analytics
```

Legacy `src/lib/affiliates.ts` remains for older booking UI (`buildAffiliateLink`).

---

## Supabase (run in SQL Editor, in order)

1. `supabase/migrations/trips_add_stops.sql` (if not done)
2. `supabase/migrations/trips_user_rls.sql`
3. If you had data in `saved_trips`: `migrate_saved_trips_to_trips.sql`
4. Optional: `affiliate_clicks.sql`

---

## Environment

```env
NEXT_PUBLIC_BOOKING_AFFILIATE_ID=
NEXT_PUBLIC_SKYSCANNER_AFFILIATE_ID=
NEXT_PUBLIC_VIATOR_AFFILIATE_ID=
NEXT_PUBLIC_GYG_AFFILIATE_ID=
NEXT_PUBLIC_RENTALCARS_AFFILIATE_ID=
```

Start with [Booking.com Affiliate](https://join.booking.com/affiliateprogram) (often instant approval).

---

## Test locally

Use **`docs/MANUAL_TEST_CHECKLIST.md`** for step-by-step verification.

```bash
npm run dev
```

1. Log in → `/auth/login-debug` if needed  
2. Plan trip → save (must be logged in)  
3. `/saved` → **Open trip hub** → `/my-trip/[id]`  
4. **Book** tab → links open partner sites  
5. `/my-trip/[id]?tab=book` opens Book tab directly  

---

## Route map

| URL | Purpose |
|-----|---------|
| `/saved` | List your trips (`trips` table) |
| `/my-trip/[id]` | Trip Hub (command center) |
| `/trip/[id]` | Legacy AI trip overview (unchanged) |
| `/trip-details/[id]` | Planning / budget UI |

---

## Next AI session prompt

```
Trip Hub at /my-trip/[id]. Saved page reads `trips` table.
Read TRIP_HUB_SETUP.md. Extend TripHub.tsx — do not recreate.
Next: [document upload | auth | deploy].
```
