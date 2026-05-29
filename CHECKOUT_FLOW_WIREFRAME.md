# 🛒 Checkout Flow Wireframe & Page Connections

## 📊 Current Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    ENTRY POINTS                                  │
└─────────────────────────────────────────────────────────────────┘

1. Trip Details Page (/trip-details/[id])
   └─> [Book Now] button
       └─> /booking?tripId=xxx

2. Itinerary Page (/trips/itinerary)
   └─> [Book This Trip Now] button
       └─> /booking?tripId=xxx&destination=...&startDate=...&endDate=...

3. Suggestions Page (/suggestions)
   └─> [Book Now] button
       └─> /booking?tripId=xxx

4. Home Page (/)
   └─> [Book This Trip] button
       └─> /trip-details/[id]
           └─> /booking?tripId=xxx

5. Trip Details Enhanced Component
   └─> [Buy Complete Trip] button
       └─> /booking/checkout?type=complete-trip&item={...}&price=xxx

6. Direct Booking Pages
   └─> /booking/flights (Flight Search & Booking)
   └─> /booking/hotels (Hotel Search & Booking)


┌─────────────────────────────────────────────────────────────────┐
│                    MAIN BOOKING FLOW                             │
└─────────────────────────────────────────────────────────────────┘

STEP 1: BOOKING PAGE
────────────────────
Route: /booking
Purpose: Collect traveler information & review trip details

┌─────────────────────────────────────┐
│  /booking?tripId=xxx                │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ Trip Summary                  │ │
│  │ - Destination                 │ │
│  │ - Dates                       │ │
│  │ - Travelers                   │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ Traveler Information Form     │ │
│  │ - Full Name                   │ │
│  │ - Email                       │ │
│  │ - Phone                       │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ Optional: Search/Select       │ │
│  │ - Flights Tab                 │ │
│  │ - Hotels Tab                  │ │
│  │ - Tours Tab                   │ │
│  │ - Activities Tab              │ │
│  └───────────────────────────────┘ │
│                                     │
│  [← Back]  [Proceed to Checkout →] │
│                ↓                    │
│      /booking/checkout?tripId=xxx   │
└─────────────────────────────────────┘


STEP 2: CHECKOUT PAGE
─────────────────────
Route: /booking/checkout
Purpose: Review complete trip breakdown & payment

┌─────────────────────────────────────┐
│  /booking/checkout?tripId=xxx       │
│      OR                             │
│  /booking/checkout?type=complete-trip│
│        &item={...}&price=xxx        │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ Trip Breakdown                │ │
│  │                               │ │
│  │ ✈️ Flight Details             │ │
│  │    - Airline & Flight #       │ │
│  │    - Departure/Arrival        │ │
│  │    - Duration & Stops         │ │
│  │    - Price                    │ │
│  │                               │ │
│  │ 🏨 Hotel Details              │ │
│  │    - Hotel Name               │ │
│  │    - Location                 │ │
│  │    - Check-in/Check-out       │ │
│  │    - Nights                   │ │
│  │    - Price                    │ │
│  │                               │ │
│  │ 📍 Trip Details               │ │
│  │    - Destination              │ │
│  │    - Travel Dates             │ │
│  │    - Travelers                │ │
│  │                               │ │
│  │ 💰 Cost Breakdown             │ │
│  │    - Flights: $XXX            │ │
│  │    - Accommodation: $XXX      │ │
│  │    - Meals: $XXX              │ │
│  │    - Activities: $XXX         │ │
│  │    - Transport: $XXX          │ │
│  │    - Emergency Buffer: $XXX   │ │
│  │    ──────────────────────     │ │
│  │    TOTAL: $XXX                │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ Payment Method                │ │
│  │ [Demo Payment Screen]         │ │
│  │                               │ │
│  │ (Future: Stripe Integration)  │ │
│  └───────────────────────────────┘ │
│                                     │
│  [← Back]  [Pay now →]             │
│                ↓                    │
│  /booking/confirmation?tripId=xxx   │
│    &destination=...&amount=xxx      │
└─────────────────────────────────────┘


STEP 3: CONFIRMATION PAGE
─────────────────────────
Route: /booking/confirmation
Purpose: Show booking success & next steps

┌─────────────────────────────────────┐
│  /booking/confirmation?tripId=xxx   │
│    &destination=...&amount=xxx      │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ ✅ Booking Confirmed! 🎉      │ │
│  │                               │ │
│  │ Thank you, [Name]!            │ │
│  │ Your trip to [Destination]    │ │
│  │ is confirmed.                 │ │
│  │                               │ │
│  │ Paid: $XXX                    │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ Next Steps:                   │ │
│  │                               │ │
│  │ [View Trip Details]           │ │
│  │    → /trip-details/[id]       │ │
│  │                               │ │
│  │ [Go to My Trips]              │ │
│  │    → /my-trips                │ │
│  │                               │ │
│  │ [Back to Home]                │ │
│  │    → /                        │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│                    ALTERNATIVE FLOWS                             │
└─────────────────────────────────────────────────────────────────┘

FLOW A: Direct Flight Booking
──────────────────────────────
/booking/flights
  └─> Search flights
  └─> Select flight
  └─> /booking/checkout-session?type=flight&bookingId=xxx
      └─> Stripe checkout
      └─> /booking/success OR /booking/cancel

FLOW B: Direct Hotel Booking
─────────────────────────────
/booking/hotels
  └─> Search hotels
  └─> Select hotel
  └─> /booking/checkout-session?type=hotel&bookingId=xxx
      └─> Stripe checkout
      └─> /booking/success OR /booking/cancel

FLOW C: Complete Trip Package
──────────────────────────────
Trip Details Enhanced Component
  └─> [Buy Complete Trip]
  └─> /booking/checkout?type=complete-trip&item={...}&price=xxx
      └─> (Shows flight + hotel + breakdown)
      └─> /booking/confirmation


┌─────────────────────────────────────────────────────────────────┐
│                    DATA FLOW                                      │
└─────────────────────────────────────────────────────────────────┘

URL Parameters Passed:
─────────────────────

/booking?tripId=xxx
  ↓
/booking/checkout?tripId=xxx&destination=...&startDate=...&endDate=...&fullName=...&email=...&amount=xxx
  ↓
/booking/confirmation?tripId=xxx&destination=...&fullName=...&amount=xxx&type=booking

OR

/booking/checkout?type=complete-trip&item={JSON}&price=xxx&destination=...&travelers=xxx
  ↓
/booking/confirmation?tripId=xxx&destination=...&amount=xxx&type=complete-trip


API Calls:
──────────

1. GET /api/trips/[id]
   - Called from /booking page
   - Fetches trip details by tripId

2. POST /api/checkout/session (Future)
   - Creates Stripe checkout session
   - Returns session ID

3. POST /api/stripe/webhook (Future)
   - Handles Stripe payment events
   - Updates booking status

4. GET /api/bookings/by-session?session_id=xxx (Future)
   - Fetches booking by Stripe session ID


┌─────────────────────────────────────────────────────────────────┐
│                    PAGE COMPONENTS BREAKDOWN                     │
└─────────────────────────────────────────────────────────────────┘

/booking/page.tsx
─────────────────
- Reads tripId from URL params
- Fetches trip data via /api/trips/[id]
- Shows trip summary
- Collects traveler info (name, email, phone)
- Has tabs for flights/hotels/tours/activities (legacy)
- "Proceed to Checkout" button → /booking/checkout

/booking/checkout/page.tsx
──────────────────────────
- Reads tripId OR type=complete-trip from URL params
- Shows detailed trip breakdown:
  * Flight details (if available)
  * Hotel details (if available)
  * Trip summary
  * Cost breakdown
- Shows payment form (currently demo)
- "Pay now" button → /booking/confirmation

/booking/confirmation/page.tsx
──────────────────────────────
- Reads tripId, destination, amount from URL params
- Shows success message
- Shows payment amount
- Links to:
  * /trip-details/[id]
  * /my-trips
  * /

/booking/flights/page.tsx
─────────────────────────
- Flight search interface
- Flight selection
- Routes to /booking/checkout-session

/booking/hotels/page.tsx
────────────────────────
- Hotel search interface
- Hotel selection
- Routes to /booking/checkout-session

/booking/checkout-session/page.tsx
───────────────────────────────────
- Creates Stripe checkout session
- Redirects to Stripe payment page
- On success → /booking/success
- On cancel → /booking/cancel

/booking/success/page.tsx
─────────────────────────
- Payment success confirmation

/booking/cancel/page.tsx
────────────────────────
- Payment cancellation message


┌─────────────────────────────────────────────────────────────────┐
│                    CURRENT ISSUES & GAPS                         │
└─────────────────────────────────────────────────────────────────┘

1. ❌ Payment is demo-only (no real Stripe integration in /booking/checkout)
2. ❌ No booking records created in database
3. ❌ Confirmation page doesn't fetch booking data
4. ❌ Missing traveler info validation
5. ❌ No email confirmations
6. ❌ No booking reference numbers
7. ⚠️ Multiple checkout paths (can be confusing)
8. ⚠️ Data passed via URL params (could be lost)
9. ⚠️ No loading states on some pages
10. ⚠️ No error handling for failed payments


