# Where Next — Manual Test Checklist

Run after `npm run dev`. Tick each step; if something fails, paste the step number + error + console output.

**Prerequisite:** `.env.local` with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and (for AI) `OPENAI_API_KEY`.

### Run this in Supabase first (most important)

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project → **SQL Editor**
2. Open `supabase/RUN_BEFORE_SAVED_TRIPS_TEST.sql` in this repo, copy **all** of it, paste, click **Run**
3. Scroll to the bottom result — you should see **4 rows** on `trips` policies:

| policyname | cmd |
|------------|-----|
| Users can view own trips | SELECT |
| Users can insert own trips | INSERT |
| Users can update own trips | UPDATE |
| Users can delete own trips | DELETE |

If you get `relation "public.trips" does not exist`, run `supabase/sql/2025-setup.sql` (or your project’s trips table migration) first, then run this script again.

---

## 0. Server starts clean

```bash
npm install
npm run dev
```

- [ ] Opens http://localhost:3000 (or 3001 if 3000 is busy)
- [ ] No red compile errors in terminal

| Error | Fix |
|-------|-----|
| Missing env | Copy `ENV_TEMPLATE.md` → `.env.local` |
| Module not found `@/lib/affiliate-partners` | Pull latest; file is `src/lib/affiliate-partners.ts` |

---

## 1. Auth

http://localhost:3000/auth/login

- [ ] Login page loads
- [ ] Login succeeds → redirect or dashboard

**Fails?** → http://localhost:3000/auth/login-debug → Test Login

| Error | Fix |
|-------|-----|
| Invalid credentials | Supabase → Auth → Users → create/reset user |
| Email not confirmed | Confirm user in Supabase dashboard |
| Failed to fetch | Check `NEXT_PUBLIC_SUPABASE_URL` in `.env.local` |

Run SQL: `supabase/setup-profiles.sql` if profile errors after login.

---

## 2. Plan a trip

http://localhost:3000/plan-trip (logged in)

- [ ] Form loads → submit → `/suggestions`
- [ ] Suggestions appear (`OPENAI_API_KEY` required)

---

## 3. Save a trip

On `/suggestions`, click **Save Trip** on a card.

- [ ] Button shows Saving → Saved
- [ ] Redirects to `/saved` after ~1s

**Supabase → Table Editor → `trips`:**

- [ ] New row with **your** `user_id` (not NULL)
- [ ] `destination`, `start_date`, `end_date` filled when you had dates on plan form

**Still no row?** Terminal log for `[trips/save]` or `Supabase error saving trip`.

---

## 4. Saved list

http://localhost:3000/saved

- [ ] Trip card visible
- [ ] **Open trip hub** + **Book →** buttons

**Empty but row in `trips`?** RLS issue — run `supabase/migrations/trips_user_rls.sql`.

```sql
select policyname, cmd from pg_policies where tablename = 'trips';
```

---

## 5. Trip Hub

Click **Open trip hub**.

- [ ] URL: `/my-trip/[uuid]` (not 404)
- [ ] Hero + tabs (Overview, Book, Documents, Itinerary)
- [ ] Countdown if start date is in the future

**404?** Confirm folder: `src/app/my-trip/[id]/page.tsx` (brackets in folder name).

---

## 6. Book tab

- [ ] Five link types per stop (hotels, flights, tours, experiences, cars)
- [ ] Click opens partner site in new tab

Optional: `NEXT_PUBLIC_BOOKING_AFFILIATE_ID` in `.env.local` after [Booking affiliate signup](https://join.booking.com/affiliateprogram).

---

## 7–9. Other tabs

- [ ] **Documents** — 6 slots, + Add shows placeholder alert
- [ ] **Itinerary** — links to trip details / suggestions
- [ ] **Book →** from `/saved` opens `?tab=book`

---

## Paste back if stuck

1. Step number  
2. What you see  
3. Browser console (F12) errors  
4. Terminal errors  

---

## Quick Supabase SQL

```sql
select id, user_id, destination, start_date, status, created_at
from trips order by created_at desc limit 10;

select count(*) filter (where user_id is null) as null_user_ids,
       count(*) filter (where user_id is not null) as has_user_ids
from trips;

select policyname, cmd, qual from pg_policies where tablename = 'trips';
```
