# Where Next – App Overview & Architecture

## 1. Product Summary

**Where Next** is an AI-powered travel planning and budgeting web app.

It helps users:

- Decide **where to go next** based on their budget, travel style, and timing
- Generate **AI itineraries** (day-by-day or themed plans)
- Track **budgets and expected costs** for trips
- **Save and manage trips** over time
- (Future) Follow **self-guided tours**, discover cafés/activities, and book via affiliate links

The app is currently in early MVP stage with:

- Working UI for auth, dashboard, and trip saving
- Supabase-backed authentication and profiles
- Basic "save trip" functionality
- Login flow still being debugged/finalized

---

## 2. Core User Flows (High-Level)

### 2.1 Onboarding & Auth

1. User visits the site
2. They can:
   - Sign up with email/password
   - Log in with existing credentials
   - (Future) Use social OAuth (Google, etc.)
3. After login they are redirected to their **Dashboard**

### 2.2 Dashboard & Trips

From the dashboard, user can:

- See a list of **saved trips**
- Create a new **trip plan** (destination, dates, budget, vibe)
- Open a trip to view:
  - Itinerary suggestions (AI-generated)
  - Budget breakdowns
  - Saved places / notes

### 2.3 AI Travel Planning (Planned/Partial)

- User provides:
  - Destination (e.g., Bali, Lisbon)
  - Dates
  - Budget range and travel style
- App uses **OpenAI** and travel data to:
  - Suggest an itinerary (what to do each day)
  - Estimate spending by category
  - Surface recommended places (restaurants, sights, cafes)

### 2.4 Self-Guided Tours (Planned)

- Users select a **city / area**
- App shows:
  - A map with pinned points of interest
  - A suggested route / walking tour
- Content can be monetized via affiliate links (tickets, tours, etc.)

---

## 3. Tech Stack

### 3.1 Frontend

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI**: React + Tailwind CSS
- **State Management**:
  - React context (`AppContext.tsx`) for auth + global app state
- **Routing**:
  - App Router (`src/app/...`) with nested routes for auth and dashboard

### 3.2 Backend / Data

- **Supabase**
  - Auth: email/password via `supabase.auth.signInWithPassword`
  - Database: Postgres with **RLS** (Row Level Security)
  - Tables:
    - `auth.users` (managed by Supabase)
    - `public.profiles` (app-specific user profile data)
    - (Planned) `trips`, `trip_days`, `saved_places`, `budgets`, etc.

### 3.3 External Services (Current/Planned)

- **OpenAI**
  - For itinerary generation and travel suggestions
- **Travel APIs** (e.g., Amadeus / Skyscanner / others)
  - For real flight, hotel, and activities data (future integration)
- **Stripe or similar** (future)
  - For subscriptions or paid upgrades
- **Vercel**
  - For deployment and hosting

---

## 4. Frontend Architecture

### 4.1 App Router Structure

Typical structure (simplified):

- `src/app/layout.tsx`
  - Root layout, global styles, context providers
- `src/app/page.tsx`
  - Landing / marketing / home page
- `src/app/auth/login/page.tsx`
  - Login form, email/password auth
- `src/app/auth/register/page.tsx`
  - Registration form
- `src/app/auth/callback/route.ts`
  - OAuth callback handler
- `src/app/auth/login-debug/page.tsx`
  - Debug page for showing auth errors and test login
- `src/app/dashboard/page.tsx`
  - Main logged-in dashboard
- `src/app/saved/page.tsx`
  - Saved trips
- `src/app/profile/page.tsx`
  - Profile settings

### 4.2 Contexts

- `src/contexts/AppContext.tsx`
  - Holds:
    - `user`: current authenticated Supabase user (or `null`)
    - `loading`: global loading state
    - `handleSignIn(email, password)`: email/password login
    - (Future) `handleSignOut`, `handleRegister`, etc.
  - Provides auth state to any component via React Context

### 4.3 Components (Examples)

- `components/layout/Navbar.tsx`
  - Shows login button or user profile depending on auth state
- `components/trips/TripCard.tsx`
  - Summary card for a saved trip on the dashboard
- `components/common/Button.tsx`, `Input.tsx`, etc.
  - Reusable UI primitives styled with Tailwind

---

## 5. Backend & Database Architecture

### 5.1 Supabase Auth

- **auth.users** is managed by Supabase
  - Each row = one user
  - Uses email/password by default
- When a user is created (email/password or OAuth), a **trigger** creates a matching row in `public.profiles`

### 5.2 Profiles Table

`supabase/setup-profiles.sql` defines:

- `public.profiles` table:
  - `id UUID PRIMARY KEY` (same as `auth.users.id`)
  - Other profile fields as needed (e.g., display name, avatar URL, preferences)
- RLS policies:
  - Users can **select / insert / update** only their own profile
- Trigger on `auth.users`:
  - On new user creation, insert row into `public.profiles`

**Usage:**

- The app reads/writes `public.profiles` to store user-specific data that is not part of auth (e.g., travel style preferences).

### 5.3 App Data Tables (Planned)

Examples of future tables:

- `public.trips`
  - `id`, `user_id`, `destination`, `start_date`, `end_date`, `budget`, etc.
- `public.trip_days`
  - `trip_id`, `day_number`, `plan`, `notes`
- `public.saved_places`
  - `trip_id`, `name`, `lat`, `lng`, `type`, `notes`
- `public.budgets`
  - `trip_id`, `category`, `planned_amount`, `actual_amount`

All with RLS policies:

- Each row is accessible only to its owner (`user_id = auth.uid()`).

---

## 6. Authentication Flow

### 6.1 Email/Password Login (Current)

1. User visits `/auth/login`
2. Enters email and password, submits form
3. `handleSubmit` calls `handleSignIn(email, password)` from `AppContext`
4. In `AppContext`, `handleSignIn`:
   - Calls `supabase.auth.signInWithPassword({ email, password })`
   - If error:
     - Throws error (surfaced to UI or debug page)
   - If success:
     - Receives `user` + `session`
     - Stores `user` in context
     - Supabase stores session via browser storage + cookies
5. Frontend redirects to `/dashboard`
6. Middleware enforces auth when accessing protected routes

### 6.2 Middleware

- Defined in `middleware.ts`
- Runs on specific routes (e.g., `/dashboard`, `/saved`, `/profile`)
- Checks for a valid session (via Supabase helper or cookies)
- If no session:
  - Redirect to `/auth/login?redirectTo=/requested/path`
- If session:
  - Allow access

---

## 7. Environment & Configuration

### 7.1 Required Environment Variables (Current)

In `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
OPENAI_API_KEY=<your-openai-key>       # if AI features are wired
# etc...
```

**Note:**

- `NEXT_PUBLIC_*` variables are accessible in the browser
- Secrets like `OPENAI_API_KEY` should NOT be prefixed with `NEXT_PUBLIC_` and should only be used server-side (API routes, server components, or edge functions)

---

## 8. Deployment Overview (Planned)

### 8.1 Local Development

Install dependencies:

```bash
npm install
# or
pnpm install
```

Run dev server:

```bash
npm run dev
```

App runs at:

- `http://localhost:3001` (if configured) or default `3000`

### 8.2 Production (Vercel, Recommended)

1. Connect GitHub repository to Vercel
2. Vercel automatically:
   - Builds the Next.js app
   - Deploys to a production URL
3. Set production environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `OPENAI_API_KEY` (and others as needed)

---

## 9. Key Docs & Debugging Aids

- **COMPLETE_LOGIN_SETUP_GUIDE.md**
  - Step-by-step login setup for Supabase and test user
- **FIX_LOGIN_ISSUES.md**
  - Common login errors and how to fix them
- **QUICK_LOGIN_DEBUG.md**
  - Fast checklist for debugging auth
- **OPENAI_LOGIN_HANDOFF.md**
  - Handoff for AI/dev to debug current login issues

Use this **APP_OVERVIEW_AND_ARCHITECTURE.md** as:

- A high-level reference for what the app is
- A quick onboarding document for new devs or tools
- A map for where new features (trips, tours, etc.) fit into the architecture

---













