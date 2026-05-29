# ✅ Cursor Action Checklist - Wireframe Implementation

This is your concrete, step-by-step guide to implement the wireframe requirements in Cursor. Each phase has specific prompts you can paste directly into Cursor's chat.

---

## 📋 Quick Status Overview

- [ ] **Phase 1**: Verify the 4 flows (baseline testing)
- [ ] **Phase 2**: Fix routing & naming (/explore vs /search)
- [ ] **Phase 3**: Wire the Save Trip flow properly
- [ ] **Phase 4**: Wire the Booking → Payment → Confirmation chain
- [ ] **Phase 5**: Make navigation consistent with the flows

---

## 🎯 Phase 1: Verify the 4 Flows (Baseline Testing)

**Goal**: Create automated tests to verify all 4 user flows work end-to-end.

**Time**: 30-60 minutes

### Action 1.1: Create E2E Test File

**Paste this into Cursor Chat:**

```
Using the docs `CHATGPT_HANDOFF_WIREFRAME_IMPLEMENTATION.md` and `PAGE_INVENTORY_AND_FLOW_ANALYSIS.md`, write Playwright tests for these flows:

1) New user planning trip: / → /plan-trip → /suggestions → /trip-details/[id] → /booking → /booking/checkout → /booking/confirmation
2) Browse and book: / → /explore → /trip-details/[id] → /booking → /booking/checkout → /booking/confirmation
3) Save for later: /trip-details/[id] → [Save] → /saved → /trip-details/[id] → /booking
4) Returning user: / → /(app)/profile → /my-trips OR /saved

Create a file `tests/e2e/flows.spec.ts` and implement one test per flow, assuming routes:
/, /plan-trip, /suggestions, /trip-details/[id], /booking, /booking/checkout, /booking/confirmation, /saved, /my-trips, /(app)/profile.

Use placeholders for payment (mock success). Each test should:
- Navigate through the flow
- Verify each page loads correctly
- Check that buttons/links exist and are clickable
- Verify data is passed between pages (via URL params or state)
```

**Expected Output**: `tests/e2e/flows.spec.ts` with 4 test suites

**Verify**: Run `npm run test:e2e` or `npx playwright test` to see baseline results

---

## 🔧 Phase 2: Fix Routing & Naming (/explore vs /search)

**Goal**: Make route naming consistent with wireframe specification.

**Time**: 15-30 minutes

### Action 2.1: Create /search Route

**Paste this into Cursor Chat:**

```
Rename or alias `/explore` to match the wireframe `/search`.  

Option A (preferred): create a new route `/search` that re-exports or wraps `src/app/explore/page.tsx`.  
Option B: redirect `/search` → `/explore`.  

Implement Option A (create /search that re-exports explore page). This keeps code the same but makes your route match the wireframe.

Create `src/app/search/page.tsx` that re-exports the explore page, then update any navigation components to link to `/search` instead of `/explore`. Show me the diff.
```

**Expected Output**:
- New file: `src/app/search/page.tsx` 
- Updated navigation links pointing to `/search`

### Action 2.2: Update Navigation Links

**Paste this into Cursor Chat:**

```
Find all references to `/explore` in the codebase and update them to `/search`. Search for:
- Navigation components
- Links in page components
- Any hardcoded route references

Files to check:
- src/components/marketing/TopNav.tsx
- src/components/Navigation.tsx
- src/app/page.tsx (home page)
- Any other files that link to /explore

Show me all the files that need updating and the changes.
```

**Expected Output**: List of updated files with navigation links changed to `/search`

**Verify**: 
- [ ] Visit `/search` - should work
- [ ] All navigation links point to `/search`
- [ ] Old `/explore` route can redirect or be removed

---

## 💾 Phase 3: Wire the Save Trip Flow Properly

**Goal**: Ensure save trip functionality works end-to-end from all pages.

**Time**: 30-45 minutes

### Action 3.1: Verify Save Trip API Endpoint

**Paste this into Cursor Chat:**

```
Check if `/api/trips/save` endpoint exists. If it doesn't, create `src/app/api/trips/save/route.ts` that:

1. Accepts POST request with JSON body: { tripDetail, preferences }
2. Gets the current user from Supabase auth
3. Inserts or upserts into a `saved_trips` table (or `trips` table with a `saved` flag)
4. Returns 200 on success with the saved trip data
5. Handles errors gracefully

If the endpoint exists, verify it works correctly. Show me the endpoint code and any database schema needed.
```

**Expected Output**: 
- API endpoint at `src/app/api/trips/save/route.ts`
- Database schema/migration if needed

### Action 3.2: Add Save Button to Trip Details Page

**Paste this into Cursor Chat:**

```
Open `src/app/trip-details/[id]/page.tsx`. 

Ensure that:
1. There's a visible "Save Trip" button on the page
2. The button calls `/api/trips/save` with the trip data
3. On success, it redirects to `/saved` page
4. On error, it shows a user-friendly error message

The file already has a `handleSaveTrip` function (around line 21). Verify it's connected to a button in the UI and works correctly. If the button is missing, add it. Show me the diff.
```

**Expected Output**: Updated Trip Details page with working Save button

### Action 3.3: Add Save Button to Suggestions Page

**Paste this into Cursor Chat:**

```
Open `src/app/suggestions/page.tsx`. 

Add a "Save Trip" button to each suggestion card (similar to the "See Details" button around line 1071). 

The button should:
1. Call `/api/trips/save` with the suggestion data
2. On success, show a success message and optionally redirect to `/saved`
3. Handle errors gracefully

Add the button next to the "See Details" button in each suggestion card. Show me the diff.
```

**Expected Output**: Suggestions page with Save button on each card

### Action 3.4: Make Saved Trips Link to Details

**Paste this into Cursor Chat:**

```
Open `src/app/saved/page.tsx`. 

Ensure that:
1. Saved trips are displayed as clickable cards
2. Each card links to `/trip-details/[id]` when clicked
3. Each card has a "Book Now" button that links to `/booking?tripId=[id]`
4. The page shows a message if no trips are saved with a link to plan a trip

If the page is currently minimal, enhance it to show saved trips with links. Show me the diff.
```

**Expected Output**: Enhanced Saved Trips page with clickable cards and Book Now buttons

**Verify**:
- [ ] Save button works on Trip Details page
- [ ] Save button works on Suggestions page
- [ ] Saved trips appear in `/saved` page
- [ ] Saved trips link back to trip details
- [ ] Book Now works from saved trips

---

## 🛒 Phase 4: Wire the Booking → Payment → Confirmation Chain

**Goal**: Ensure complete booking flow works from trip selection to confirmation.

**Time**: 45-60 minutes

### Action 4.1: Add Book Now Button to Trip Details

**Paste this into Cursor Chat:**

```
Open `src/app/trip-details/[id]/page.tsx`. 

Ensure there's a prominent "Book Now" button that:
1. Routes to `/booking?tripId=[id]&destination=[destination]&startDate=[startDate]&endDate=[endDate]&adults=[adults]&kids=[kids]`
2. Passes all necessary trip data via URL parameters
3. Is clearly visible and accessible

If the button doesn't exist, add it. Show me where it should be placed and the implementation.
```

**Expected Output**: Trip Details page with Book Now button

### Action 4.2: Add Book Now Button to Suggestions Page

**Paste this into Cursor Chat:**

```
Open `src/app/suggestions/page.tsx`. 

Add a "Book Now" button to each suggestion card (next to "See Details" around line 1071).

The button should:
1. Route directly to `/booking` with trip data in URL params
2. Pass: tripId, destination, startDate, endDate, adults, kids, budgetAmount
3. Skip the trip details page for a faster booking flow

Show me the implementation.
```

**Expected Output**: Suggestions page with Book Now button on each card

### Action 4.3: Verify Booking Page Collects Trip Data

**Paste this into Cursor Chat:**

```
Open `src/app/booking/page.tsx`. 

Ensure that:
1. It reads `tripId` (and other trip data) from URL search params
2. It displays the selected trip summary
3. It collects traveler information (name, email, phone, etc.)
4. It has a "Proceed to Payment" button that routes to `/booking/checkout?tripId=[id]&travelers=[data]`
5. It passes all necessary data to the checkout page

If any of this is missing, implement it. Show me the diff.
```

**Expected Output**: Booking page that properly collects and passes trip data

### Action 4.4: Verify Checkout Page Processes Payment

**Paste this into Cursor Chat:**

```
Open `src/app/booking/checkout/page.tsx`. 

Ensure that:
1. It reads trip data and traveler info from URL params or state
2. It creates a Stripe checkout session (or mocks it for development)
3. On payment success, it redirects to `/booking/confirmation?tripId=[id]&bookingId=[bookingId]`
4. It handles payment errors gracefully
5. It has a "Back" button to return to `/booking`

Verify the payment flow works (or is mocked). Show me any needed changes.
```

**Expected Output**: Checkout page that processes payment and redirects on success

### Action 4.5: Verify Confirmation Page Shows Results

**Paste this into Cursor Chat:**

```
Open `src/app/booking/confirmation/page.tsx`. 

Ensure that:
1. It reads `tripId` and `bookingId` from URL params
2. It displays a confirmation message with booking details
3. It has links to:
   - "View Trip" → `/trip-details/[id]`
   - "Go to My Trips" → `/my-trips`
   - "Save for Later" → saves trip and goes to `/saved`
4. It shows a success message

If any of this is missing, implement it. Show me the diff.
```

**Expected Output**: Confirmation page with proper links and messaging

**Verify**:
- [ ] Book Now button works on Trip Details
- [ ] Book Now button works on Suggestions
- [ ] Booking page collects trip data correctly
- [ ] Checkout page processes payment
- [ ] Confirmation page shows results and links

---

## 🧭 Phase 5: Make Navigation Consistent with the Flows

**Goal**: Ensure consistent navigation across all pages with proper links.

**Time**: 30-45 minutes

### Action 5.1: Create/Update Global Navigation Component

**Paste this into Cursor Chat:**

```
Create or update a consistent top navigation component that appears on all public pages (/, /search, /plan-trip, etc.) with links:

- Home → /
- Search → /search
- Plan Trip → /plan-trip
- Saved Trips → /saved
- My Trips → /my-trips
- Account → /(app)/profile

Check `src/components/marketing/TopNav.tsx` and `src/components/Navigation.tsx`. 

If they exist, update them to include all these links. If they don't match, create a unified navigation component or update both to be consistent.

Show me the updated navigation components.
```

**Expected Output**: Updated navigation components with all required links

### Action 5.2: Update Layout Files to Include Navigation

**Paste this into Cursor Chat:**

```
Update layout files to include the correct navigation component:

1. `src/app/layout.tsx` - Should include TopNav for public pages
2. `src/app/(app)/layout.tsx` - Should include Navigation for app pages
3. Ensure navigation is consistent across both

Verify that:
- Public pages (/, /search, /plan-trip) show TopNav
- App pages (/(app)/profile, /(app)/dashboard) show Navigation
- Both nav components have the same menu items

Show me the updated layout files.
```

**Expected Output**: Updated layout files with proper navigation

### Action 5.3: Verify Navigation Links Work

**Paste this into Cursor Chat:**

```
Test all navigation links:

1. Home link → should go to /
2. Search link → should go to /search
3. Plan Trip link → should go to /plan-trip
4. Saved Trips link → should go to /saved
5. My Trips link → should go to /my-trips
6. Account link → should go to /(app)/profile

Create a simple test or verify manually that all links work. If any are broken, fix them. Show me any issues found.
```

**Expected Output**: All navigation links verified and working

**Verify**:
- [ ] Navigation appears on all pages
- [ ] All links work correctly
- [ ] Navigation is consistent across public and app pages
- [ ] Account link is accessible from home page

---

## 📊 Testing Checklist

After completing all phases, verify:

### Flow 1: New User Planning Trip
- [ ] Home → Plan Trip works
- [ ] Plan Trip → Suggestions works
- [ ] Suggestions → Details works
- [ ] Details → Booking works
- [ ] Booking → Payment works
- [ ] Payment → Confirmation works

### Flow 2: Browse and Book
- [ ] Home → Search works
- [ ] Search → Details works
- [ ] Details → Booking works
- [ ] Booking → Payment works
- [ ] Payment → Confirmation works

### Flow 3: Save for Later
- [ ] Save button works on Trip Details
- [ ] Save button works on Suggestions
- [ ] Saved trips page shows saved trips
- [ ] Saved trips link to details
- [ ] Book Now works from saved trips

### Flow 4: Returning User
- [ ] Home → Account works
- [ ] Account → My Trips works
- [ ] Account → Saved Trips works
- [ ] My Trips shows bookings
- [ ] My Trips links to trip details

---

## 🎯 Success Criteria

You'll know you're done when:

1. ✅ All 4 user flows work end-to-end
2. ✅ `/search` route exists and is used consistently
3. ✅ Save trip works from Trip Details and Suggestions
4. ✅ Saved trips link back to trip details
5. ✅ Booking flow works: Details → Booking → Payment → Confirmation
6. ✅ Navigation is consistent across all pages
7. ✅ All navigation links work correctly
8. ✅ E2E tests pass (if created)

---

## 🚀 Next Steps After Completion

1. **Run E2E Tests**: Execute `npm run test:e2e` to verify all flows
2. **Update Figma**: Mark completed flows in your route map diagram
3. **Document Changes**: Update any relevant documentation
4. **User Testing**: Have real users test the flows
5. **Polish**: Add loading states, error handling, and animations

---

## 📝 Notes

- Each phase can be done independently, but they build on each other
- Test after each phase before moving to the next
- If something breaks, fix it before continuing
- Keep the Mermaid diagram updated in Figma as you complete each phase

---

**Related Documentation**:
- `CHATGPT_HANDOFF_WIREFRAME_IMPLEMENTATION.md` - Complete context
- `docs/VISUAL_ROUTE_MAP_MERMAID.md` - Visual route map
- `PAGE_INVENTORY_AND_FLOW_ANALYSIS.md` - Detailed analysis

**Last Updated**: Ready for implementation
**Estimated Total Time**: 3-4 hours for all phases

