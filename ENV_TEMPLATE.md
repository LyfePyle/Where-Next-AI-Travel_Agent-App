# Environment Variables Template

Copy this to `.env.local` and fill in your actual values:

```bash
# URLs & flags
NEXT_PUBLIC_URL=http://localhost:3000
NEXT_PUBLIC_DEMO_MODE=false
NEXT_PUBLIC_PREVIEW_HINT=true

# Supabase (project-specific)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe (test mode for local/preview)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
# Local webhook secret: obtain via `stripe listen --forward-to localhost:3000/api/stripe/webhook`
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# AI Gateway (Optional - for unified API with budgets, monitoring, load-balancing)
# Get your key from: https://vercel.com/ai-gateway
AI_GATEWAY_API_KEY=your_ai_gateway_api_key

# Amadeus
AMADEUS_CLIENT_ID=your_amadeus_client_id
AMADEUS_CLIENT_SECRET=your_amadeus_client_secret
AMADEUS_ENVIRONMENT=test  # set to 'production' for prod

# Optional: Weather & currency APIs
OPENWEATHER_API_KEY=your_openweather_api_key
EXCHANGE_RATE_API_KEY=your_exchangerate_api_key

# Enable guest preview login locally
PREVIEW_GUEST_ENABLED=true

# Affiliate partners (Trip Hub — earn commission, no Stripe needed at launch)
AFFILIATES_ENABLED=true
# Expedia Travel Creator Program: your one tracked link (all categories fall
# back to this until a partner below is approved). Generate in the Expedia
# Creator dashboard; paste the full URL here.
NEXT_PUBLIC_EXPEDIA_AFFILIATE_URL=https://expedia.com/affiliates/expedia-home.oTHKuON
# Add real IDs only when approved — a placeholder would build a broken link.
NEXT_PUBLIC_BOOKING_AFFILIATE_ID=
NEXT_PUBLIC_SKYSCANNER_AFFILIATE_ID=
NEXT_PUBLIC_VIATOR_AFFILIATE_ID=
NEXT_PUBLIC_GYG_AFFILIATE_ID=
NEXT_PUBLIC_RENTALCARS_AFFILIATE_ID=
NEXT_PUBLIC_WORLDNOMADS_AFFILIATE_ID=
EXPEDIA_AFFILIATE_ID=
AGODA_AFFILIATE_ID=
RENTALCARS_AFFILIATE_ID=
NEXT_PUBLIC_VIATOR_AFFILIATE_ID=
NEXT_PUBLIC_GYG_AFFILIATE_ID=

# Flight search API (optional — Duffel preferred over Amadeus for new work)
DUFFEL_API_KEY=duffel_test_...
```
