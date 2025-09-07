# Database Setup for Where Next AI Travel Agent

## 🗄️ **Database Schemas**

This directory contains all the database schemas, types, and utilities needed for the complete AI travel agent application.

## 📁 **File Structure**

```
src/lib/database/
├── schemas.sql          # Complete SQL schema for Supabase
├── types.ts            # TypeScript type definitions
├── client.ts           # Supabase client and database operations
├── index.ts            # Export file
└── README.md           # This file
```

## 🚀 **Quick Setup**

### **1. Run the Schema in Supabase**

1. **Go to your Supabase Dashboard**
2. **Navigate to SQL Editor**
3. **Copy the contents of `schemas.sql`**
4. **Paste and run the SQL**

### **2. Verify Tables Created**

After running the schema, you should see these tables:
- ✅ `profiles` - User profile information
- ✅ `trips` - Core trip data
- ✅ `trip_suggestions` - AI-generated recommendations
- ✅ `itineraries` - Daily trip planning
- ✅ `user_preferences` - Personalization settings
- ✅ `bookings` - Flight/hotel bookings
- ✅ `payment_transactions` - Stripe payment tracking

## 🔧 **Usage in Your App**

### **Import Database Functions**

```typescript
import { 
  createTrip, 
  getTrip, 
  getUserTrips,
  createTripSuggestion,
  createBooking 
} from '@/lib/database';
```

### **Create a New Trip**

```typescript
const newTrip = await createTrip({
  user_id: userId,
  destination: 'Paris, France',
  country: 'France',
  city: 'Paris',
  start_date: '2024-06-01',
  end_date: '2024-06-07',
  trip_duration: 7,
  budget_amount: 2500,
  budget_style: 'comfortable',
  adults: 2,
  kids: 0,
  vibes: ['culture', 'food', 'romance'],
  additional_details: 'First time visiting Paris'
});
```

### **Get User's Trips**

```typescript
const userTrips = await getUserTrips(userId);
console.log('User has', userTrips.length, 'trips');
```

### **Create AI Trip Suggestions**

```typescript
const suggestion = await createTripSuggestion({
  trip_id: tripId,
  destination: 'Paris, France',
  country: 'France',
  city: 'Paris',
  fit_score: 95,
  description: 'Perfect for culture lovers',
  weather_temp: 22,
  weather_condition: 'Sunny',
  crowd_level: 'Medium',
  estimated_total: 2500,
  flight_band_min: 600,
  flight_band_max: 800,
  hotel_band_min: 150,
  hotel_band_max: 250,
  highlights: ['Eiffel Tower', 'Louvre Museum', 'Notre-Dame']
});
```

## 🔐 **Row Level Security (RLS)**

All tables have RLS enabled with policies that ensure:
- Users can only see their own data
- Users can only modify their own data
- Proper relationships between tables are maintained

## 📊 **Database Relationships**

```
users (auth.users)
├── profiles (1:1)
├── trips (1:many)
│   ├── trip_suggestions (1:many)
│   ├── itineraries (1:many)
│   └── bookings (1:many)
│       └── payment_transactions (1:many)
└── user_preferences (1:1)
```

## 🧪 **Testing the Database**

### **Test Connection**

```typescript
import { supabase } from '@/lib/database';

// Test if connection works
const { data, error } = await supabase.from('profiles').select('count');
if (error) {
  console.error('Database connection failed:', error);
} else {
  console.log('Database connection successful!');
}
```

### **Create Test Data**

```typescript
// Create a test profile
const testProfile = await upsertProfile({
  id: 'test-user-id',
  email: 'test@example.com',
  full_name: 'Test User'
});

// Create a test trip
const testTrip = await createTrip({
  user_id: 'test-user-id',
  destination: 'Tokyo, Japan',
  country: 'Japan',
  city: 'Tokyo',
  trip_duration: 5,
  budget_amount: 3000
});
```

## 🚨 **Important Notes**

1. **Environment Variables**: Make sure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
2. **RLS Policies**: All tables have security policies - users can only access their own data
3. **UUIDs**: All IDs use UUIDs for security and scalability
4. **Timestamps**: All tables include `created_at` and `updated_at` fields
5. **Foreign Keys**: Proper relationships are maintained with cascade deletes

## 🔄 **Next Steps**

After setting up the database:

1. **Test the connection** with a simple query
2. **Create test data** to verify everything works
3. **Update your API endpoints** to use these database functions
4. **Test the full user flow** from trip creation to booking

## 📞 **Need Help?**

If you encounter any issues:
1. Check the Supabase dashboard for error messages
2. Verify your environment variables are correct
3. Test the database connection with a simple query
4. Check the browser console for any JavaScript errors

Your database is now ready to power a production-ready AI travel agent! 🚀
