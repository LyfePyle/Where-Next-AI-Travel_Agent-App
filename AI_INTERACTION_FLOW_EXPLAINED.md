# AI Interaction Flow - Complete Explanation

## Overview
This document explains how the AI-powered features work in the Where Next Travel App, including the complete flow from user input to AI-generated recommendations.

---

## 🔄 Complete AI Interaction Flow

### 1. **AI Trip Suggestions** ✅ COMPLETE

#### How It Works:

**Step 1: User Input** (`/plan-trip` page)
- User fills out trip preferences:
  - Origin city (e.g., "Vancouver")
  - Dates or duration
  - Budget (total, daily, flights, hotels)
  - Travelers (adults + kids)
  - Vibes/interests (e.g., "beach", "culture", "adventure")
  - Additional details

**Step 2: API Call** (`/api/ai/suggestions`)
```
POST /api/ai/suggestions
Body: {
  from: "Vancouver",
  startDate: "2024-06-01",
  endDate: "2024-06-08",
  tripDuration: 7,
  budgetAmount: 2000,
  budgetDaily: 100,
  budgetFlights: 600,
  budgetHotels: 120,
  budgetStyle: "comfortable",
  vibes: ["beach", "culture"],
  additionalDetails: "Looking for authentic experiences",
  adults: 2,
  kids: 0,
  maxFlightTime: 12
}
```

**Step 3: Cache Check**
- First checks in-memory cache for similar requests
- Cache key based on: origin, budget, vibes, travelers
- If cached → returns immediately (source: "cache")
- If not cached → proceeds to AI generation

**Step 4: AI Generation** (OpenAI GPT-4o-mini)
- **System Prompt**: Expert travel planner instructions
- **User Prompt**: Formatted travel details including:
  - Origin and dates
  - Budget breakdown (daily, flights, hotels)
  - Traveler count
  - Preferences and vibes
  - Special requirements

**Step 5: OpenAI Response**
- Uses **JSON Schema** mode for structured output
- Model: `gpt-4o-mini`
- Temperature: 0.7 (balanced creativity/consistency)
- Max tokens: 2000
- Returns exactly 4 destination suggestions

**Step 6: Response Format**
```json
{
  "source": "openai" | "cache" | "fallback",
  "suggestions": [
    {
      "id": "1",
      "destination": "Lisbon, Portugal",
      "country": "Portugal",
      "city": "Lisbon",
      "fitScore": 92,
      "description": "Historic charm meets modern culture...",
      "weather": {
        "temp": 22,
        "condition": "Sunny",
        "icon": "☀️"
      },
      "crowdLevel": "Medium",
      "seasonality": "Perfect weather, moderate crowds",
      "estimatedTotal": 2700,  // TOTAL for all travelers
      "flightBand": {
        "min": 650,  // per person round-trip
        "max": 780
      },
      "hotelBand": {
        "min": 90,   // per night
        "max": 130,
        "style": "Boutique",
        "area": "Alfama/Baixa"
      },
      "highlights": ["Historic tram rides", "Pasteis de Belém", ...],
      "whyItFits": "Perfect for food lovers..."
    }
  ],
  "cacheStats": { "hits": 5, "misses": 10 }
}
```

**Step 7: Fallback System**
If AI fails:
1. Try fallback prompt (without JSON schema)
2. If that fails → Use seeded suggestions from `data/seed/suggestions.json`
3. If that fails → Use hardcoded default suggestions

**Step 8: Display** (`/suggestions` page)
- Shows 4 destination cards
- Each card displays:
  - Fit score (0-100)
  - Estimated total cost
  - Weather and crowd levels
  - Price bands (flights, hotels)
  - Highlights
  - "Why it fits" explanation
- User can:
  - Click "See Details" → Navigate to trip details
  - Click "Save Trip" → Save to saved trips
  - Click "Load More" → Get additional suggestions

---

### 2. **Smart Itinerary Builder** ⚠️ PARTIALLY COMPLETE

#### Current Status:
- **Frontend**: ✅ Complete (`/itinerary-builder/[id]`)
- **Backend API**: ✅ Exists (`/api/ai/itinerary-builder`)
- **AI Integration**: ⚠️ Currently using fallback (AI disabled for reliability)

#### How It Should Work:

**Step 1: User Selects Destination**
- From suggestions page, user clicks "See Details"
- Navigates to `/itinerary-builder/[tripId]`

**Step 2: API Call**
```
POST /api/ai/itinerary-builder
Body: {
  tripId: "trip_123",
  destination: "Lisbon, Portugal",
  startDate: "2024-06-01",
  endDate: "2024-06-08",
  tripDuration: 7,
  travelers: 2,
  budget: 2000,
  preferences: ["beach", "culture"]
}
```

**Step 3: AI Generation** (Currently Disabled)
- Model: `gpt-4` (more powerful for detailed planning)
- Creates day-by-day itinerary:
  - 4-6 activities per day
  - Specific times (8 AM - 8 PM)
  - Exact locations and addresses
  - Costs per activity
  - Walking tours
  - Weather forecasts
  - Practical tips

**Step 4: Response Format**
```json
{
  "itinerary": [
    {
      "day": 1,
      "title": "Historic Alfama & Fado",
      "theme": "Cultural Exploration",
      "estimatedCost": 80,
      "totalDuration": 480,
      "activities": [
        {
          "id": "activity_1_1",
          "name": "Tram 28 Historic Ride",
          "type": "attraction",
          "duration": 120,
          "cost": 3,
          "location": {
            "name": "Praça Martim Moniz",
            "address": "Praça Martim Moniz, 1100-341 Lisboa",
            "coordinates": {"lat": 38.7167, "lng": -9.1333}
          },
          "description": "Iconic yellow tram through historic neighborhoods",
          "rating": 4.5,
          "tips": ["Board early to avoid crowds", "Buy tickets in advance"],
          "timeSlot": {
            "start": "09:00",
            "end": "11:00"
          },
          "bookingUrl": "https://..."
        }
      ],
      "notes": "Start early to beat crowds...",
      "weather": {"temp": 22, "condition": "Sunny", "icon": "☀️"},
      "walkingTour": {
        "name": "Alfama Walking Tour",
        "duration": 180,
        "stops": 6,
        "difficulty": "moderate"
      }
    }
  ]
}
```

**Step 5: Display**
- Day-by-day view with expandable activities
- Interactive timeline
- Cost tracking
- Weather integration
- Edit capabilities

**Current Issue**: AI generation is disabled, using fallback mock data for reliability.

---

### 3. **Trip Details Management** ✅ COMPLETE

#### How It Works:

**Step 1: Create Trip**
- User clicks "See Details" from suggestions
- Creates trip via `/api/trips` POST
- Stores in Supabase `trips` table

**Step 2: Trip Details Page** (`/trip-details/[id]`)
- Displays:
  - Destination information
  - Budget breakdown
  - Accommodation options
  - Activity suggestions
  - Booking links

**Step 3: Database Structure**
```sql
trips (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  destination TEXT,
  start_date DATE,
  end_date DATE,
  budget_cents INTEGER,
  preferences JSONB,
  itinerary JSONB,
  created_at TIMESTAMP
)
```

**Step 4: Management Features**
- View trip details
- Edit preferences
- Add/remove activities
- Track bookings
- Share trip

---

### 4. **Saved Trips** ✅ COMPLETE

#### How It Works:

**Step 1: Save Trip**
- User clicks "Save Trip" from suggestions page
- API call: `POST /api/trips/saved`
- Validates:
  - User authentication (required)
  - Free plan limit (max 3 saved trips)
  - Duplicate check

**Step 2: Database Storage**
```sql
saved_trips (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  destination TEXT,
  estimated_cost INTEGER,
  reason TEXT,
  fit_score INTEGER,
  best_time TEXT,
  source TEXT,
  trip_duration INTEGER,
  travelers INTEGER,
  created_at TIMESTAMP
)
```

**Step 3: Retrieve Saved Trips**
- API: `GET /api/trips/saved`
- Returns all trips for authenticated user
- Ordered by creation date (newest first)

**Step 4: Display** (`/saved` or `/my-trips`)
- Grid/list view of saved destinations
- Shows:
  - Destination name
  - Fit score
  - Estimated cost
  - Why it fits
  - Best time to visit
- Actions:
  - View details
  - Remove from saved
  - Plan trip from saved destination

**Step 5: Free Plan Limits**
- Free users: Max 3 saved trips
- Pro users: Unlimited (when implemented)

---

## 🔧 Technical Details

### OpenAI Integration

**Models Used:**
- **Suggestions**: `gpt-4o-mini` (faster, cheaper, good for structured data)
- **Itinerary**: `gpt-4` (more powerful, better for detailed planning)
- **Assistant**: `gpt-3.5-turbo` (quick responses, conversational)

**API Configuration:**
```typescript
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// JSON Schema for structured responses
const completion = await openai.chat.completions.create({
  model: "gpt-4o-mini",
  temperature: 0.7,
  response_format: {
    type: "json_schema",
    json_schema: openAISuggestionSchema
  },
  messages: [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt }
  ],
  max_tokens: 2000
});
```

### Caching System

**In-Memory Cache:**
- Stores successful AI responses
- Cache key based on: origin, budget, vibes, travelers
- Reduces API calls and costs
- Metrics tracked: hits, misses

**Cache Implementation:**
```typescript
const cacheKey = generateCacheKey.suggestions({
  from: prefs.from,
  budget: prefs.budgetAmount,
  vibes: prefs.vibes,
  adults: prefs.adults,
  kids: prefs.kids
});

const cached = suggestionCache.get(cacheKey);
if (cached) {
  return { source: "cache", suggestions: cached };
}
```

### Error Handling & Fallbacks

**Multi-Layer Fallback:**
1. **Primary**: AI generation with JSON schema
2. **Secondary**: AI generation without schema (more flexible)
3. **Tertiary**: Seeded suggestions from JSON file
4. **Final**: Hardcoded default suggestions

**Error Response Format:**
```json
{
  "error": "Error message",
  "errorDetails": { ... },
  "suggestions": [...],  // Always includes fallback
  "source": "error_fallback"
}
```

---

## 📊 Feature Completion Status

| Feature | Frontend | Backend | AI Integration | Database | Status |
|---------|----------|---------|----------------|----------|--------|
| **AI Trip Suggestions** | ✅ | ✅ | ✅ | ✅ | **COMPLETE** |
| **Smart Itinerary Builder** | ✅ | ✅ | ⚠️ (Fallback) | ✅ | **PARTIAL** |
| **Trip Details Management** | ✅ | ✅ | N/A | ✅ | **COMPLETE** |
| **Saved Trips** | ✅ | ✅ | N/A | ✅ | **COMPLETE** |

---

## 🐛 Known Issues & Fixes Applied

### TypeScript Errors (FIXED ✅)

1. **dataSource type mismatch**
   - **Issue**: Type only allowed 'ai' | 'mock', but code used 'cache' | 'fallback'
   - **Fix**: Extended type to `'ai' | 'mock' | 'cache' | 'fallback'`

2. **localExperiences property**
   - **Issue**: Property doesn't exist in TripSuggestion interface
   - **Fix**: Removed from fallback suggestions (not in schema)

3. **vibes.split() error**
   - **Issue**: vibes might already be an array
   - **Fix**: Added type check before calling split()

---

## 🚀 How to Test AI Features

### 1. Test AI Suggestions
```bash
# Start dev server
npm run dev

# Navigate to: http://localhost:3000/plan-trip
# Fill out form and submit
# Should see AI-generated suggestions
```

### 2. Test Caching
```bash
# Make same request twice
# Second request should be instant (cached)
# Check console for cache hit
```

### 3. Test Fallbacks
```bash
# Temporarily remove OPENAI_API_KEY from .env
# Make request
# Should see fallback suggestions
```

### 4. Test Saved Trips
```bash
# Login required
# Click "Save Trip" on any suggestion
# Navigate to /saved
# Should see saved trip
```

---

## 📝 Next Steps

1. **Re-enable Itinerary AI**: Fix JSON parsing issues, re-enable AI generation
2. **Improve Error Messages**: Better user-facing error messages
3. **Add Analytics**: Track AI usage, cache performance
4. **Optimize Costs**: Better caching, request batching
5. **Add Streaming**: Real-time AI response streaming for better UX

---

## 🔗 Related Files

- **API Routes**:
  - `/src/app/api/ai/suggestions/route.ts` - AI suggestions endpoint
  - `/src/app/api/ai/itinerary-builder/route.ts` - Itinerary generation
  - `/src/app/api/trips/route.ts` - Trip management
  - `/src/app/api/trips/saved/route.ts` - Saved trips

- **Frontend Pages**:
  - `/src/app/suggestions/page.tsx` - Suggestions display
  - `/src/app/itinerary-builder/[id]/page.tsx` - Itinerary builder
  - `/src/app/trip-details/[id]/page.tsx` - Trip details
  - `/src/app/saved/page.tsx` - Saved trips

- **Schemas & Types**:
  - `/src/lib/trip-prefs.ts` - Preference validation
  - `/src/lib/trip-suggestion-schema.ts` - OpenAI JSON schema
  - `/src/lib/cache.ts` - Caching utilities

---

**Last Updated**: 2025-01-02
**Status**: All core features implemented, itinerary AI temporarily using fallback


