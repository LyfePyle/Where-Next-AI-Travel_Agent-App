# 🎯 Where Next - Plan of Attack

**Status**: ~75% Complete | **Time to Completion**: 12-18 hours

---

## 🚨 IMMEDIATE ACTIONS (Do These First)

### 1. Fix Authentication (5 minutes) 🔴 CRITICAL
**Problem**: "profiles does not exist" error blocking all logins

**Action**:
```bash
# 1. Open Supabase Dashboard → SQL Editor
# 2. Copy entire contents of: supabase/setup-profiles.sql
# 3. Paste and run in SQL Editor
# 4. Verify: SELECT * FROM public.profiles;
# 5. Test login at: http://localhost:3000/auth/login
```

**Files**: `supabase/setup-profiles.sql`

---

### 2. Verify Current Status (2 minutes)
**Action**:
```bash
node verify-profiles-setup.js
```

This shows what's actually set up vs. what's missing.

---

## 📋 PHASE 1: CRITICAL FIXES (6-8 hours)

### ✅ Step 1.1: Authentication (5 min) - DO FIRST
- [ ] Run `supabase/setup-profiles.sql` in Supabase
- [ ] Verify table created
- [ ] Test login works

### ✅ Step 1.2: Booking Flow (4-6 hours)
**Goal**: Complete booking funnel from trip selection to confirmation

**Tasks**:
- [ ] Fix "Book Now" button routing in `TripDetailsEnhanced.tsx`
- [ ] Make booking page read `tripId` from URL params
- [ ] Connect booking → checkout with data passing
- [ ] Verify checkout → payment flow
- [ ] Test payment → confirmation redirect
- [ ] Test complete flow end-to-end

**Files**:
- `src/components/TripDetailsEnhanced.tsx`
- `src/app/booking/page.tsx`
- `src/app/booking/checkout/page.tsx`
- `src/app/booking/confirmation/page.tsx`

### ✅ Step 1.3: Cart System (2-3 hours)
**Goal**: Cart persists between sessions

**Tasks**:
- [ ] Create `cart_items` table in Supabase (if missing)
- [ ] Update `/api/cart` to use database
- [ ] Update `/api/cart/items` to persist to database
- [ ] Remove demo mode blocks
- [ ] Test cart persistence

**Files**:
- `src/app/api/cart/route.ts`
- `src/app/api/cart/items/route.ts`
- `src/components/TripCartDrawer.tsx`

### ✅ Step 1.4: Payment Processing (3-4 hours)
**Goal**: Real Stripe payments work

**Tasks**:
- [ ] Remove demo mode from payment endpoints
- [ ] Configure Stripe webhook endpoint
- [ ] Implement webhook handler
- [ ] Create `bookings` table (if missing)
- [ ] Save booking data after payment
- [ ] Test with Stripe test cards

**Files**:
- `src/app/api/payments/create-checkout-session/route.ts`
- `src/app/api/stripe/webhook/route.ts`
- `src/app/api/checkout/session/route.ts`

---

## 📋 PHASE 2: MEDIUM PRIORITY (6-8 hours)

### ✅ Step 2.1: Navigation (2-3 hours)
- [ ] Create consistent global navigation component
- [ ] Add to all pages
- [ ] Fix route naming (`/explore` → `/search`)
- [ ] Add missing links (Account, My Trips, Saved Trips)
- [ ] Add back buttons to booking flow

### ✅ Step 2.2: Missing APIs (2-4 hours)
- [ ] Verify/create `/api/trips` POST endpoint
- [ ] Verify `/api/trips/[id]` GET endpoint
- [ ] Verify `/api/trips/my-trips` GET endpoint
- [ ] Test all booking-related APIs
- [ ] Document all endpoints

### ✅ Step 2.3: Error Handling (2-3 hours)
- [ ] Create 404 page
- [ ] Add error boundaries
- [ ] Improve error messages
- [ ] Add loading states
- [ ] Add empty states

---

## 📋 PHASE 3: POLISH (4-6 hours)

### ✅ Step 3.1: Database Verification (1-2 hours)
- [ ] Verify all tables exist
- [ ] Check schema alignment
- [ ] Verify RLS policies
- [ ] Create missing tables

### ✅ Step 3.2: Testing (2-3 hours)
- [ ] Test all user flows end-to-end
- [ ] Test on mobile
- [ ] Test error scenarios
- [ ] Performance testing

### ✅ Step 3.3: Documentation (1 hour)
- [ ] Update API documentation
- [ ] Update README
- [ ] Document deployment

---

## 🎯 QUICK REFERENCE

### Key Routes
- Home: `/`
- Plan Trip: `/plan-trip`
- Suggestions: `/suggestions`
- Trip Details: `/trip-details/[id]`
- Saved Trips: `/saved`
- Booking: `/booking`
- Checkout: `/booking/checkout`
- Dashboard: `/(app)/dashboard`

### Key APIs
- Save Trip: `POST /api/trips/save` ✅
- AI Suggestions: `POST /api/ai/suggestions` ✅
- Flight Search: `POST /api/flights/search` ✅
- Hotel Search: `POST /api/hotels/search` ✅
- Cart: `GET/POST /api/cart` ⚠️
- Checkout: `POST /api/checkout/session` ⚠️

### Critical Files
- `supabase/setup-profiles.sql` - **RUN THIS FIRST**
- `src/components/TripDetailsEnhanced.tsx` - Booking button
- `src/app/booking/page.tsx` - Booking page
- `src/app/api/cart/route.ts` - Cart API
- `src/app/api/payments/*` - Payment APIs

---

## ✅ SUCCESS CRITERIA

### Phase 1 Complete When:
- ✅ Users can log in
- ✅ Complete booking flow works
- ✅ Cart persists
- ✅ Real payments work

### Phase 2 Complete When:
- ✅ Consistent navigation
- ✅ All APIs work
- ✅ Better error handling

### Phase 3 Complete When:
- ✅ All tables verified
- ✅ All flows tested
- ✅ Documentation updated

---

## 🚀 START HERE

1. **Run**: `node verify-profiles-setup.js`
2. **Fix**: Authentication (5 min)
3. **Test**: Booking flow (30 min)
4. **Fix**: Cart system (2-3 hours)
5. **Fix**: Payment processing (3-4 hours)

**Total Time**: 6-8 hours for critical fixes

---

**See `COMPREHENSIVE_PROJECT_BREAKDOWN.md` for full details.**



