# 📡 Where Next - API Documentation

## 📋 Overview

Complete API documentation for the Where Next AI Travel Agent platform, including all endpoints, request/response formats, and integration patterns.

---

## 🔐 Authentication

All protected endpoints require authentication via Supabase JWT tokens.

### Headers
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Demo Mode
When Supabase is not configured, the app runs in demo mode with mock authentication.

---

## 🤖 AI Services

### Trip Suggestions
Generate AI-powered travel recommendations based on user preferences.

```http
POST /api/ai/suggestions
```

**Request Body:**
```json
{
  "origin": "New York",
  "budget": 3000,
  "vibes": ["beach", "culture"],
  "travelers": 2,
  "duration": 7
}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "suggestions": [
      {
        "destination": "Barcelona, Spain",
        "description": "Perfect blend of beach and culture...",
        "estimated_cost": 2800,
        "highlights": ["Sagrada Familia", "Park Güell", "Beaches"],
        "best_time": "April-June, September-October"
      }
    ],
    "cached": false,
    "response_time_ms": 32087
  }
}
```

### AI Assistant Chat
Interactive travel assistance and recommendations.

```http
POST /api/ai/assistant
```

**Request Body:**
```json
{
  "message": "What should I pack for Barcelona in May?",
  "context": {
    "destination": "Barcelona",
    "month": "May",
    "trip_type": "culture_beach"
  }
}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "response": "For Barcelona in May, pack light layers...",
    "suggestions": [
      "Light jacket for evenings",
      "Comfortable walking shoes",
      "Sunscreen and sunglasses"
    ]
  }
}
```

---

## ✈️ Trip Management

### Create Trip
Save a new trip to the user's account.

```http
POST /api/trips
```

**Request Body:**
```json
{
  "name": "Barcelona Adventure",
  "destination": "Barcelona, Spain",
  "start_date": "2024-05-15",
  "end_date": "2024-05-22",
  "base_currency": "USD",
  "party_size": 2,
  "departure_city": "New York",
  "notes": "Anniversary trip"
}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "id": "trip_123",
    "name": "Barcelona Adventure",
    "created_at": "2024-01-15T10:30:00Z",
    "user_id": "user_456"
  }
}
```

### Get User Trips
Retrieve all trips for the authenticated user.

```http
GET /api/trips
```

**Response:**
```json
{
  "ok": true,
  "data": [
    {
      "id": "trip_123",
      "name": "Barcelona Adventure",
      "destination": "Barcelona, Spain",
      "start_date": "2024-05-15",
      "end_date": "2024-05-22",
      "status": "planning"
    }
  ]
}
```

### Get Trip Details
Retrieve detailed information for a specific trip.

```http
GET /api/trips/[id]
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "id": "trip_123",
    "name": "Barcelona Adventure",
    "destination": "Barcelona, Spain",
    "itinerary": [...],
    "bookings": [...],
    "budget": {...}
  }
}
```

---

## 💰 Budget Management

### Create Budget
Create a new budget for a trip.

```http
POST /api/budgets
```

**Request Body:**
```json
{
  "trip_id": "trip_123",
  "total_budget_cents": 300000,
  "currency": "USD",
  "categories": [
    {
      "name": "Flights",
      "budget_cents": 120000,
      "color": "#3B82F6"
    },
    {
      "name": "Hotels",
      "budget_cents": 100000,
      "color": "#10B981"
    }
  ]
}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "id": "budget_789",
    "trip_id": "trip_123",
    "total_budget_cents": 300000,
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

### Get Budget
Retrieve budget details with spending analytics.

```http
GET /api/budgets/[id]
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "id": "budget_789",
    "total_budget_cents": 300000,
    "spent_cents": 150000,
    "remaining_cents": 150000,
    "categories": [...],
    "spending_trend": "on_track"
  }
}
```

---

## 💳 Expense Tracking

### Add Expense
Record a new expense against a budget.

```http
POST /api/expenses
```

**Request Body:**
```json
{
  "trip_id": "trip_123",
  "category_id": "cat_456",
  "amount_cents": 5000,
  "currency": "EUR",
  "spent_at": "2024-05-16",
  "note": "Lunch at La Boqueria",
  "location": {
    "lat": 41.3851,
    "lng": 2.1734,
    "place_name": "La Boqueria, Barcelona"
  }
}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "id": "expense_101",
    "amount_base_cents": 5400,
    "fx_rate": 1.08,
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

### Get Expenses
Retrieve expenses for a trip or budget.

```http
GET /api/expenses?trip_id=trip_123
```

**Response:**
```json
{
  "ok": true,
  "data": [
    {
      "id": "expense_101",
      "amount_cents": 5000,
      "currency": "EUR",
      "category": "Food",
      "note": "Lunch at La Boqueria",
      "spent_at": "2024-05-16"
    }
  ]
}
```

---

## 🏨 Booking Services

### Flight Search
Search for flights using Amadeus API.

```http
POST /api/bookings/flights/search
```

**Request Body:**
```json
{
  "origin": "NYC",
  "destination": "BCN",
  "departure_date": "2024-05-15",
  "return_date": "2024-05-22",
  "passengers": 2,
  "class": "ECONOMY"
}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "flights": [
      {
        "id": "flight_abc123",
        "airline": "Delta",
        "price": {
          "total": "1200.00",
          "currency": "USD"
        },
        "duration": "8h 30m",
        "stops": 0,
        "departure": "2024-05-15T14:30:00Z",
        "arrival": "2024-05-16T06:00:00Z"
      }
    ],
    "search_id": "search_xyz789"
  }
}
```

### Hotel Search
Search for hotels using Amadeus API.

```http
POST /api/bookings/hotels/search
```

**Request Body:**
```json
{
  "city_code": "BCN",
  "check_in": "2024-05-16",
  "check_out": "2024-05-22",
  "guests": 2,
  "rooms": 1
}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "hotels": [
      {
        "id": "hotel_def456",
        "name": "Hotel Barcelona Center",
        "rating": 4.2,
        "price": {
          "total": "150.00",
          "currency": "EUR",
          "per_night": true
        },
        "location": {
          "address": "Carrer de Pelai, 22",
          "distance_to_center": "0.5 km"
        },
        "amenities": ["WiFi", "Breakfast", "Gym"]
      }
    ]
  }
}
```

### Create Booking
Initiate a booking with payment processing.

```http
POST /api/bookings
```

**Request Body:**
```json
{
  "type": "flight",
  "item_id": "flight_abc123",
  "trip_id": "trip_123",
  "passengers": [
    {
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com",
      "phone": "+1234567890"
    }
  ],
  "payment_method": "stripe"
}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "booking_id": "booking_ghi789",
    "payment_intent": "pi_stripe123",
    "client_secret": "pi_stripe123_secret_abc",
    "total_amount": 1200.00,
    "currency": "USD"
  }
}
```

---

## 🛠️ Utility Services

### Weather Information
Get weather data for destinations.

```http
GET /api/utils/weather?city=Barcelona&country=Spain
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "current": {
      "temperature": 22,
      "description": "Partly cloudy",
      "feels_like": 24,
      "humidity": 65,
      "wind_speed": 12
    },
    "forecast": [
      {
        "date": "2024-05-16",
        "high": 25,
        "low": 18,
        "description": "Sunny"
      }
    ]
  }
}
```

### Currency Conversion
Convert between currencies with real-time rates.

```http
POST /api/utils/currency
```

**Request Body:**
```json
{
  "from": "USD",
  "to": "EUR",
  "amount": 100
}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "from": "USD",
    "to": "EUR",
    "amount": 100,
    "converted_amount": 92.50,
    "exchange_rate": 0.925,
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

### Travel Phrases
Get essential phrases for destinations.

```http
GET /api/utils/phrases?language=spanish
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "language": "Spanish",
    "phrases": [
      {
        "english": "Hello",
        "translation": "Hola",
        "pronunciation": "OH-lah"
      },
      {
        "english": "Thank you",
        "translation": "Gracias",
        "pronunciation": "GRAH-see-ahs"
      }
    ]
  }
}
```

---

## 🚶 Walking Tours

### Generate Walking Tour
Create AI-powered walking tours with themes.

```http
POST /api/walking-tour/generate
```

**Request Body:**
```json
{
  "city": "Barcelona",
  "theme": "cultural",
  "duration_hours": 4,
  "starting_point": "Plaça de Catalunya",
  "preferences": ["museums", "architecture", "local_food"]
}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "tour_id": "tour_jkl012",
    "title": "Barcelona Cultural Discovery",
    "total_distance_m": 3200,
    "total_time_min": 240,
    "stops": [
      {
        "order": 1,
        "name": "Plaça de Catalunya",
        "lat": 41.3870,
        "lng": 2.1700,
        "description": "The heart of Barcelona...",
        "dwell_time_min": 15
      }
    ]
  }
}
```

---

## 💳 Payment Processing

### Create Payment Intent
Initialize Stripe payment for bookings.

```http
POST /api/payments/create-intent
```

**Request Body:**
```json
{
  "amount": 120000,
  "currency": "usd",
  "booking_id": "booking_ghi789",
  "metadata": {
    "trip_id": "trip_123",
    "user_id": "user_456"
  }
}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "client_secret": "pi_stripe123_secret_abc",
    "payment_intent_id": "pi_stripe123"
  }
}
```

### Webhook Handler
Process Stripe webhook events.

```http
POST /api/payments/webhook
```

**Headers:**
```http
Stripe-Signature: t=1234567890,v1=signature_hash
```

**Response:**
```json
{
  "received": true
}
```

---

## 🔍 Error Handling

### Standard Error Response
```json
{
  "ok": false,
  "error": "Authentication required",
  "code": "AUTH_REQUIRED",
  "details": {
    "message": "Please log in to access this resource"
  }
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

---

## 🚀 Rate Limiting

### Limits by Endpoint Type
- **AI Services**: 10 requests/minute per user
- **Search APIs**: 30 requests/minute per user
- **CRUD Operations**: 100 requests/minute per user
- **Utility APIs**: 60 requests/minute per user

### Rate Limit Headers
```http
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1642694400
```

---

## 🧪 Testing

### Test Environment
Base URL: `https://where-next-ai-travel-staging.vercel.app/api`

### Test Credentials
```json
{
  "demo_user": {
    "email": "demo@wherenext.com",
    "password": "demo123"
  }
}
```

### Stripe Test Cards
```json
{
  "success": "4242424242424242",
  "decline": "4000000000000002",
  "insufficient_funds": "4000000000009995"
}
```

---

*This API documentation covers all endpoints and integration patterns for the Where Next AI Travel Agent platform. For additional support, refer to the implementation examples in the codebase.*
