# 🎯 **WHERE NEXT AI TRAVEL AGENT - MVP SCOPE**

## 🔒 **FEATURE FREEZE - MVP ONLY**

**No new features until launch!** Everything below = MVP. Everything else = deferred to post-launch.

---

## ✅ **MVP CORE FEATURES (MUST HAVE)**

### **1. Core Flow: Plan → Suggestions → Details → Save**
- [ ] **Trip Planner Form** (`/plan-trip`)
  - originAirport (autocomplete)
  - dateRange (start/end dates)
  - budgetTotal (slider + input)
  - vibe[] (mood/theme chips)
  - advancedOptions (maxFlightTime, visaRequired)
  - **Files**: `src/app/plan-trip/page.tsx`, `src/components/PlanTripForm.tsx`

- [ ] **AI Suggestions Page** (`/suggestions`)
  - 10-20 destination cards with fitScore/weather/crowd/prices
  - "See details", "Swap flight", "Swap hotel" buttons
  - Pagination ("load more")
  - **Files**: `src/app/suggestions/page.tsx`, `src/components/SuggestionCard.tsx`

- [ ] **Trip Details Page** (`/trip/[id]`)
  - 3 flight options + 3 hotel options (selectable)
  - Real-time total cost updates
  - "Save this trip" CTA
  - **Files**: `src/app/trip/[id]/page.tsx`, `src/components/TripDetails.tsx`

- [ ] **Save Trip Functionality**
  - Persist to Supabase with user association
  - Show in "Saved Trips" list
  - **Files**: `src/app/saved/page.tsx`, `src/lib/database/trips.ts`

### **2. Budget Calculator Integration**
- [ ] **Budget Wiring** (`/budget`)
  - Base cost = selected flight + hotel
  - 15% buffer + daily spend × trip length
  - "Use as my trip budget" from Trip Details
  - **Files**: `src/hooks/useTripBudget.ts`, `src/components/BudgetCalculator.tsx`

### **3. Basic Authentication**
- [ ] **Auth System** (`/auth`)
  - Email + Google OAuth (Supabase)
  - User profiles and preferences
  - **Files**: `src/app/auth/login/page.tsx`, `src/app/auth/register/page.tsx`

### **4. Saved Trips Management**
- [ ] **Saved Trips List** (`/saved`)
  - View all user's saved trips
  - Delete/edit functionality
  - **Files**: `src/app/saved/page.tsx`, `src/components/SavedTripCard.tsx`

### **5. Landing Page + Waitlist**
- [ ] **Landing Page** (`/landing`)
  - Hero section with clear value prop
  - How it works (3 steps)
  - Email capture for waitlist
  - **Files**: `src/app/landing/page.tsx`, `src/components/EmailCapture.tsx`

### **6. Basic Analytics**
- [ ] **Event Tracking**
  - trip_planned, suggestions_viewed, trip_saved, budget_set
  - Plausible (pageviews) + Mixpanel (events)
  - **Files**: `src/lib/analytics.ts`, `ANALYTICS.md`

---

## 🚫 **DEFERRED FEATURES (POST-LAUNCH)**

### **Advanced Features (V2)**
- ❌ Push notifications
- ❌ Complex price tracking UI
- ❌ Multi-currency reports
- ❌ In-app chat support
- ❌ Advanced AI personalization
- ❌ Social features (sharing, reviews)
- ❌ Mobile app (React Native)

### **Complex Integrations (V2)**
- ❌ Advanced booking flows
- ❌ Real-time chat with AI
- ❌ Detailed itinerary management
- ❌ Group trip planning
- ❌ Travel document management

---

## 📋 **MVP ROUTES & COMPONENTS**

### **Routes (Pages)**
```
/                     - Home dashboard
/plan-trip           - Trip planning form
/suggestions         - AI suggestions results
/trip/[id]           - Trip details with options
/saved               - Saved trips list
/budget              - Budget calculator
/auth/login          - Authentication
/auth/register       - User registration
/landing             - Landing page + waitlist
```

### **Core Components**
```
src/components/
├── PlanTripForm.tsx         - Main trip planning form
├── SuggestionCard.tsx       - Destination suggestion cards
├── TripDetails.tsx          - Trip details with flight/hotel options
├── SavedTripCard.tsx        - Saved trip display
├── BudgetCalculator.tsx     - Budget management
├── EmailCapture.tsx         - Waitlist signup
└── Navigation.tsx           - App navigation
```

### **API Endpoints**
```
/api/suggestions     - Generate AI trip suggestions
/api/trip           - Get trip details by ID
/api/trips          - CRUD for saved trips
/api/budget         - Budget calculations
/api/waitlist       - Email capture
/api/analytics      - Event tracking
```

---

## 🎯 **ACCEPTANCE CRITERIA**

### **Phase 0: MVP Scope (DONE)**
- [x] MVP_SCOPE.md exists with complete checklist
- [x] Feature freeze agreed upon

### **Phase 1: Core Flow**
- [ ] Plan Trip form validates inputs (zod validation)
- [ ] Submitting planner reliably renders suggestions
- [ ] 10-20 cards display from API results
- [ ] "See details" navigates to /trip/[id]
- [ ] Toggling flight/hotel options updates total cost
- [ ] "Save trip" persists to Supabase and shows in saved list

### **Phase 2: Budget & Fallbacks**
- [ ] Budget calculator computes from selected trip options
- [ ] "Use as my trip budget" creates budget entry
- [ ] App works when live APIs fail (cached/seeded results)
- [ ] Fallback data covers 10+ common routes

### **Phase 3: Analytics & Monetization Prep**
- [ ] All core events track to Mixpanel
- [ ] External links include UTM parameters
- [ ] Basic affiliate link structure in place

### **Phase 4: Launch Prep**
- [ ] Landing page captures emails to Supabase
- [ ] Lighthouse Performance/SEO ≥90
- [ ] Core flow tested with 10+ beta users

---

## 📊 **DATABASE SCHEMA (SUPABASE)**

### **Required Tables**
```sql
-- Users (handled by Supabase Auth)
users: id, email, created_at

-- Core trip data
trips: id, user_id, name, destination, dates, total_cost, status
trip_flights: id, trip_id, flight_data, selected, price
trip_hotels: id, trip_id, hotel_data, selected, price

-- Budget management
budgets: id, user_id, trip_id, total_budget, categories
expenses: id, budget_id, category, amount, description, date

-- Waitlist
waitlist_signups: id, email, created_at, utm_source
```

---

## 🔧 **IMPLEMENTATION ORDER**

### **Week 1: Core Flow**
1. Set up improved trip planner form with validation
2. Fix suggestions → details → save flow
3. Ensure Supabase trip persistence works

### **Week 2: Budget Integration**
1. Wire budget calculator to selected trip costs
2. Add API fallbacks for when services are down
3. Create seeded data for common routes

### **Week 3: Analytics & Polish**
1. Add event tracking (Mixpanel + Plausible)
2. Implement basic affiliate link structure
3. Create landing page with email capture

### **Week 4: Launch Prep**
1. Beta test with 10-20 users
2. Fix critical bugs and UX issues
3. Deploy to production and announce

---

## ⚡ **QUICK WINS (THIS WEEK)**

- [ ] Fix Suspense boundary issues for production build
- [ ] Improve error handling across the app
- [ ] Add proper loading states to all async operations
- [ ] Ensure mobile responsiveness is perfect
- [ ] Set up basic analytics tracking

---

**🎯 GOAL**: Ship a polished, working MVP in 4 weeks that users can actually use to plan and save trips with AI assistance.**
