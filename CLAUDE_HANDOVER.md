# Claude handover — Where Next (AI Travel App)

**Last updated:** Session handover for next developer/Claude. Use this to get up to speed quickly.

---

## 1. What this is

**Where Next** is an AI-powered travel planning and budgeting web app (Next.js 15, App Router, Supabase, OpenAI). Users sign in, plan trips, get AI itineraries, track budgets, and save trips. MVP stage: auth and dashboard work; social login and some flows are still being refined.

---

## 2. Tech stack (quick ref)

| Layer | Tech |
|-------|------|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind, React context |
| Auth | Supabase Auth (email/password; **cookie-based** via `@supabase/ssr`) |
| Data | Supabase (PostgreSQL), API routes under `src/app/api/` |
| AI | OpenAI (itinerary, suggestions, assistant) |

Important: **Dev is run without Turbopack** (`next dev` only) to avoid a known `[turbopack]_runtime.js` error. See §6.

---

## 3. Key paths

| What | Where |
|------|--------|
| Homepage | `src/app/page.tsx` |
| Root layout (GlobalNav, providers) | `src/app/layout.tsx` |
| Login | `src/app/auth/login/page.tsx` |
| Auth callback (OAuth code exchange) | `src/app/auth/callback/route.ts` |
| Dashboard | `src/app/(app)/dashboard/page.tsx` |
| Global nav (auth-aware, Sign in/Sign up) | `src/components/GlobalNav.tsx` |
| Supabase browser client (singleton, **cookies**) | `src/utils/supabase/client.ts` |
| App state + auth init | `src/contexts/AppContext.tsx` |
| Middleware (protected routes, cookie session) | `middleware.ts` (project root) |

---

## 4. What was fixed / changed (this session)

- **Auth session after login:** Session is now stored in **cookies** (not localStorage). In `src/utils/supabase/client.ts` the `storage` override was removed so `createBrowserClient` uses default cookie storage; middleware can read the session and the redirect to `/dashboard` sticks.
- **Dashboard Supabase client:** Dashboard no longer creates a new Supabase client on every fetch. It uses a `useRef`-cached client from `@/utils/supabase/client`, created only inside `fetchData` (so no SSR guard throw), avoiding multiple GoTrueClient instances.
- **GlobalNav auth UI:** Nav is gated on `isInitialized` and a `mounted` state so server and client both render the same skeleton first, then show Sign in/Sign up or UserChip. This removed the hydration mismatch.
- **Homepage hero CTA:** Replaced “No signup needed” with explicit “Sign up free” and “Already have an account? Sign in” links in the hero.
- **Login page:** Removed the “Or continue with” divider and the Google/Facebook/Apple buttons; left a comment `{/* Social login coming soon */}` so social can be re-added later.
- **Dev server:** `package.json` script changed from `next dev --turbopack` to `next dev` to avoid the Turbopack runtime chunk error. Use `npm run dev` and, if you see that error again, ensure no `pages/_document.js` (or other Pages Router files) exist and that `.next` is removed before restarting.

---

## 5. Current state and gotchas

- **Auth:** Email/password login with cookie-based session works when the test user exists in Supabase and email is confirmed. If “logged-in nav” appears for a logged-out user, clear `demo_mode` from localStorage (Application → Local Storage → localhost) and hard refresh.
- **Demo mode:** `AppContext` still checks `localStorage.getItem('demo_mode')` and, if set, treats the user as a demo user without hitting Supabase. Remove that key when testing real login.
- **Middleware:** Protects routes like `/dashboard`, `/saved`, etc., and redirects to `/auth/login?redirectTo=...` when there’s no session in cookies. Auth routes are in `middleware.ts`; Stripe webhook path is allowlisted.
- **Stripe:** App has both `/api/stripe/webhook` and `/api/webhooks/stripe`; docs suggest using `/api/webhooks/stripe` for new setup. Middleware allowlists the old path; can be cleaned up when fully on the new one.

---

## 6. If the dev server breaks with Turbopack error

Error: `Cannot find module '../chunks/ssr/[turbopack]_runtime.js'`

- **Cause:** Running with Turbopack (`next dev --turbopack`) or a stale/corrupt build.
- **Fix:**
  1. In `package.json`, ensure `"dev": "next dev"` (no `--turbopack`).
  2. Stop the dev server, then:  
     `rm -rf .next` (or `Remove-Item -Recurse -Force .next` on Windows), then `npm run dev`.
  3. If it persists, check for a `pages/` directory or `pages/_document.js` (App Router doesn’t need it); remove any leftover Pages Router files.
  4. Full nuclear: delete `.next`, `node_modules/.cache`, and `node_modules`, then `npm install` and `npm run dev`.

---

## 7. Suggested next steps

1. **Verify login E2E:** In Supabase Dashboard → Authentication → Users, confirm test user (e.g. `test@wherenext.app`) exists and is confirmed; then test sign-in and redirect to `/dashboard`.
2. **Dashboard load:** After login, confirm the dashboard loads (stats, tabs, no “Couldn’t load dashboard”), and check Network/Console for 401s or failed `/api/bookings`.
3. **Re-enable Turbopack later:** When Next.js fixes the Turbopack runtime chunk issue, you can switch back to `next dev --turbopack` for faster dev if desired.
4. **Social login:** When ready, re-add the social buttons and divider in `src/app/auth/login/page.tsx` and ensure OAuth redirect uses `/auth/callback` with the correct `next` (or `redirectTo`) handling.

---

## 8. One-line summary

Next.js 15 App Router travel app; Supabase auth with **cookie-based sessions**; nav and login cleaned up (social login hidden, hydration fixed); dev runs as `next dev` (no Turbopack) to avoid runtime chunk error; next: confirm test user and run a full login → dashboard check.
