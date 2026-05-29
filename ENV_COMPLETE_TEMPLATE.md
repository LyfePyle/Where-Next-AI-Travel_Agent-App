# Complete Environment Variables Template

**Copy this entire file to `.env.local` and fill in your actual values:**

```bash
# ============================================
# REQUIRED - Core Functionality
# ============================================

# Supabase (Required for Authentication & Database)
# Get from: https://supabase.com/dashboard → Your Project → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# OpenAI (Required for AI Features)
# Get from: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-your_openai_api_key_here

# Amadeus (Required for Flight/Hotel Data)
# Get from: https://developers.amadeus.com/ → My Self-Service Workspace
# Note: Some files use AMADEUS_CLIENT_ID/AMADEUS_CLIENT_SECRET
# Others use AMADEUS_API_KEY/AMADEUS_API_SECRET - use CLIENT_ID/SECRET for consistency
AMADEUS_CLIENT_ID=your_amadeus_client_id
AMADEUS_CLIENT_SECRET=your_amadeus_client_secret
AMADEUS_ENVIRONMENT=test
# Alternative (if your code uses these):
AMADEUS_API_KEY=your_amadeus_client_id
AMADEUS_API_SECRET=your_amadeus_client_secret

# Stripe (Required for Payments)
# Get from: https://dashboard.stripe.com/apikeys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# ============================================
# OPTIONAL - Nice to Have
# ============================================

# Weather API (Optional - for weather features)
# Get from: https://openweathermap.org/api
OPENWEATHER_API_KEY=your_openweather_api_key

# Currency Exchange API (Optional - for currency conversion)
# Get from: https://exchangerate-api.com/ or similar service
EXCHANGE_RATE_API_KEY=your_exchange_rate_api_key

# ============================================
# APP CONFIGURATION
# ============================================

# Application URL
NEXT_PUBLIC_URL=http://localhost:3000

# Demo Mode (set to false for production)
NEXT_PUBLIC_DEMO_MODE=false

# Preview Hint (for Vercel preview deployments)
NEXT_PUBLIC_PREVIEW_HINT=true

# Guest Preview Login (for local development)
PREVIEW_GUEST_ENABLED=true

# ============================================
# OPTIONAL - NextAuth (if using)
# ============================================

# NextAuth Configuration (only if you're using NextAuth)
NEXTAUTH_SECRET=your_nextauth_secret_at_least_32_chars
NEXTAUTH_URL=http://localhost:3000
```

## Priority Order for Setup

### 🔴 CRITICAL (Required for basic functionality)
1. **Supabase** - Authentication won't work without this (this is your current error!)
2. **OpenAI** - AI features won't work
3. **Amadeus** - Flight/hotel search won't work

### 🟡 IMPORTANT (Required for full features)
4. **Stripe** - Payments won't work

### 🟢 OPTIONAL (Can add later)
5. **Weather API** - Weather features use mock data without this
6. **Currency API** - Currency conversion uses mock data without this

## Quick Fix for Your Current Error

The "Failed to fetch" error is because **Supabase is not properly configured**. Add these to your `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**To get your Supabase keys:**
1. Go to https://supabase.com/dashboard
2. Select your project (or create one if you don't have one)
3. Go to Settings → API
4. Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep this secret!)

## Missing APIs Summary

Based on the codebase analysis, here are the APIs that are referenced:

### ✅ **Currently Used APIs:**
- ✅ Supabase (Auth + Database)
- ✅ OpenAI (AI features)
- ✅ Amadeus (Flight/Hotel data)
- ✅ Stripe (Payments)

### ⚠️ **Optional APIs (with fallbacks):**
- ⚠️ OpenWeather (Weather data - has mock fallback)
- ⚠️ ExchangeRate API (Currency - has mock fallback)

## Testing Your Setup

After adding your keys, test with:
```bash
npm run test:api
```

Or visit: `http://localhost:3000/api/status` to see which APIs are configured.


