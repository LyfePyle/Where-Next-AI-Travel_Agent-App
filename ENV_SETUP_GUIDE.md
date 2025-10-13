# 🔧 Environment Setup Guide

## Required API Keys

Your app needs these API keys to function properly. Copy `.env.example` to `.env.local` and fill in the values:

### 1. OpenAI API (Required for AI features)
```bash
OPENAI_API_KEY=your_openai_api_key_here
```
- Get your key from: https://platform.openai.com/api-keys
- Used for: Trip suggestions, AI travel agent, itinerary generation

### 2. Amadeus API (Required for flight/hotel data)
```bash
AMADEUS_CLIENT_ID=your_amadeus_client_id_here
AMADEUS_CLIENT_SECRET=your_amadeus_client_secret_here
```
- Get your keys from: https://developers.amadeus.com/
- Used for: Real flight prices, hotel search, airport data

### 3. Supabase (Required for database and auth)
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```
- Get your keys from: https://supabase.com/dashboard
- Used for: User authentication, trip storage, budget tracking

### 4. Stripe (Required for payments)
```bash
STRIPE_SECRET_KEY=your_stripe_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here
```
- Get your keys from: https://dashboard.stripe.com/apikeys
- Used for: Payment processing, booking confirmations

### 5. Optional APIs
```bash
# Weather API (for weather features)
WEATHER_API_KEY=your_weather_api_key_here

# Currency API (for currency conversion)
CURRENCY_API_KEY=your_currency_api_key_here
```

## Quick Setup Commands

1. Copy the environment template:
```bash
cp .env.example .env.local
```

2. Edit the file with your API keys:
```bash
# Use your preferred editor
nano .env.local
# or
code .env.local
```

3. Test your setup:
```bash
npm run test:api
```

## Current API Test Results

Based on the last test run:
- ✅ **9 APIs working** (53% success rate)
- ❌ **8 APIs failing** due to missing environment variables
- 🔧 **Setup needed** for full functionality

## Priority Order

1. **OpenAI** - Core AI features
2. **Supabase** - Database and auth
3. **Amadeus** - Real travel data
4. **Stripe** - Payment processing
5. **Weather/Currency** - Nice-to-have features

## Troubleshooting

If you're still getting API errors after setup:

1. Check your `.env.local` file exists in the project root
2. Restart your development server: `npm run dev`
3. Verify API keys are valid and have proper permissions
4. Check the console for specific error messages

## Demo Mode

The app works in demo mode without API keys, but with limited functionality:
- Mock data for trips and suggestions
- No real flight/hotel prices
- No payment processing
- No AI-generated content







