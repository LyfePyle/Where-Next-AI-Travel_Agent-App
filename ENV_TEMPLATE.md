# Environment Variables Template

Copy this to `.env.local` and fill in your actual values:

```bash
# ================================
# SUPABASE (Database & Auth) - REQUIRED
# ================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# ================================
# OPENAI (AI Features) - REQUIRED
# ================================
OPENAI_API_KEY=sk-proj-your_openai_api_key
ENABLE_AI_SUGGESTIONS=true

# ================================
# STRIPE (Payments) - REQUIRED
# ================================
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# ================================
# AMADEUS (Flight/Hotel Data) - RECOMMENDED
# ================================
# Get free credentials at: https://developers.amadeus.com/
AMADEUS_CLIENT_ID=your_amadeus_client_id
AMADEUS_CLIENT_SECRET=your_amadeus_client_secret
AMADEUS_ENVIRONMENT=test

# ================================
# OPTIONAL APIS
# ================================
# Currency conversion (free tier available)
EXCHANGE_RATE_API_KEY=your_exchangerate_api_key

# Weather data (free tier available)
OPENWEATHER_API_KEY=your_openweather_api_key
```
