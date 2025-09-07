# Where Next App Setup Guide

## 🚀 Quick Start

Your Next.js app is now running at `http://localhost:3000`! Here's what you need to do to complete the setup:

## 📋 Environment Variables Setup

Create a `.env.local` file in the `where-next` directory with the following content:

```bash
# Supabase Configuration (YOUR ACTUAL CREDENTIALS)
NEXT_PUBLIC_SUPABASE_URL=https://ufyimcilzjctylwfdqsy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmeWltY2lsempjdHlsd2ZkcXN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyNDc5OTAsImV4cCI6MjA2OTgyMzk5MH0.chylCo4ALFZLE-fkLaKvcAgAbNKQ8ruxb4rjX_iED78
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# OpenAI Configuration
OPENAI_API_KEY=sk-...

# External APIs
OPENWEATHER_API_KEY=your_openweather_api_key_here
EXCHANGE_RATE_API_KEY=your_exchange_rate_api_key_here

# App Configuration
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000
```

### 🔑 Getting Your Remaining API Keys

1. **Supabase Service Role Key**: 
   - Go to your Supabase project dashboard: https://supabase.com/dashboard/project/ufyimcilzjctylwfdqsy
   - Navigate to Settings > API
   - Copy the `service_role` secret key

2. **OpenAI API Key**:
   - Visit [OpenAI Platform](https://platform.openai.com/api-keys)
   - Create a new API key
   - Add it to your `.env.local`

3. **OpenWeather API Key**:
   - Sign up at [OpenWeatherMap](https://openweathermap.org/api)
   - Get your free API key
   - Add it to your `.env.local`

4. **Exchange Rate API Key**:
   - Sign up at [ExchangeRate-API](https://exchangerate-api.com/)
   - Get your API key
   - Add it to your `.env.local`

## 🗄️ Database Setup

1. **Run the Database Schema**:
   - Go to your Supabase project: https://supabase.com/dashboard/project/ufyimcilzjctylwfdqsy
   - Click on **SQL Editor** in the left sidebar
   - Copy and paste the contents of `database-setup.sql`
   - Execute the script

2. **Verify Tables Created**:
   - Check that all tables are created in the `app` schema
   - Verify Row Level Security (RLS) is enabled
   - Confirm policies are in place

## 🔧 Updated Supabase Configuration

Your app now uses the latest Supabase SSR approach:

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Client-side Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side Supabase client (for API routes and Server Components)
export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
```

## 🏗️ Project Structure

```
where-next/
├── src/
│   ├── app/
│   │   ├── api/                    # API routes
│   │   │   ├── ai/                 # AI assistant endpoints
│   │   │   ├── budget/             # Budget management
│   │   │   ├── expenses/           # Expense tracking
│   │   │   ├── trips/              # Trip planning
│   │   │   ├── walking-tour/       # Walking tours
│   │   │   └── utils/              # Weather, currency, phrases
│   │   ├── components/             # React components
│   │   ├── lib/                    # Utilities and configs
│   │   └── types/                  # TypeScript definitions
│   ├── database-setup.sql          # Database schema
│   └── SETUP_GUIDE.md             # This file
```

## 🔧 API Endpoints Available

### Trip Planning
- `POST /api/trips/plan` - Generate AI-powered trip plans
- `GET /api/trips/plan` - Fetch saved itineraries

### Budget Management
- `POST /api/budget` - Create new budget
- `GET /api/budget` - Fetch user's trips with budgets
- `PUT /api/budget` - Update existing budget

### Expense Tracking
- `POST /api/expenses` - Add new expense
- `GET /api/expenses` - Fetch expenses
- `PUT /api/expenses` - Update expense
- `DELETE /api/expenses` - Remove expense

### Walking Tours
- `POST /api/walking-tour/generate` - Generate AI walking tour

### AI Assistant
- `POST /api/ai/assistant` - Chat with AI assistant
- `PUT /api/ai/assistant` - Quick questions (weather, currency, etc.)

### Utilities
- `GET /api/utils/weather` - Get weather forecast
- `GET /api/utils/currency` - Get exchange rates
- `POST /api/utils/currency` - Convert currency
- `GET /api/utils/phrases` - Get travel phrases

## 🧪 Testing the Backend

1. **Visit the homepage**: `http://localhost:3000`
2. **Test the demo section** that shows weather and currency APIs
3. **Use the API endpoints** with tools like Postman or curl

## 🔒 Security Features

- **Row Level Security (RLS)** enabled on all tables
- **User-specific data access** through Supabase policies
- **Input validation** using Zod schemas
- **Environment variable protection** for sensitive keys
- **SSR-compatible Supabase client** for better performance

## 🚀 Next Steps

1. **Frontend Integration**: Copy your Figma frontend components to `src/components/`
2. **Authentication**: Set up Supabase Auth in your frontend
3. **Styling**: Ensure Tailwind CSS is properly configured
4. **Testing**: Test all API endpoints with real data
5. **Deployment**: Deploy to Vercel or your preferred platform

## 🐛 Troubleshooting

### Common Issues:

1. **Environment Variables Not Loading**:
   - Restart the development server after adding `.env.local`
   - Ensure variable names match exactly

2. **Database Connection Issues**:
   - Verify Supabase URL and keys are correct
   - Check if RLS policies are properly set up

3. **API Endpoints Returning Errors**:
   - Check browser console for detailed error messages
   - Verify all required environment variables are set

4. **CORS Issues**:
   - Ensure Supabase CORS settings include your domain
   - Check Next.js API route configuration

## 📞 Support

If you encounter any issues:
1. Check the browser console for error messages
2. Verify all environment variables are set correctly
3. Ensure the database schema has been executed successfully
4. Test API endpoints individually to isolate issues

Your "Where Next" travel app backend is now ready! 🎉 