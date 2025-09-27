# Where Next — Big Picture Map (Mermaid)

```mermaid
flowchart LR
  %% CLUSTERS
  subgraph PUB[Public Website]
    PUB_H[Home]
    PUB_Dest[Destinations]
    PUB_Deals[Deals]
    PUB_Blog[Blog]
    PUB_About[About / Contact]
    PUB_SEO[SEO Landing Pages]
    PUB_Ideas[Trip Ideas - AI]
    PUB_Legal[Affiliate Disclosure / Privacy / Terms]
    PUB_Ads[Ad Slots]
    PUB_CTA[CTA: Sign Up → App]
  end

  subgraph APP[App - Authenticated User]
    direction TB
    subgraph NAV[Navigation Tabs]
      APP_Dash[Home / Dashboard]
      APP_Trips[Trips]
      APP_Budget[Budget]
      APP_Utils[Utilities]
      APP_Profile[Profile / Settings]
    end

    subgraph FLOWS[Key Flows]
      F_Onboard[Onboarding - budget/destination/current]
      F_Plan[Plan Trip → AI → Flights → Hotels → Tours → Save Trip]
      F_Detail[Trip Detail → Itinerary + Budget/Expenses → Checkout]
      F_Budget[Budget Calc → Categories → Add Expense → Reports]
      F_Utils[Utilities → Weather / Currency / Phrases / Tours]
    end

    subgraph UX[States & UX]
      S_Load[Loading skeletons: AI/Flights/Hotels]
      S_Error[Error boundaries + retry toasts]
      S_Offline[Offline - cached trips & budgets]
      S_Mobile[Mobile-first + safe-area]
      S_Stream[Streaming AI + cached prompts]
    end

    subgraph MON[Monetization]
      M_Aff[Affiliate deep links - Flights/Hotels/Tours]
      M_Stripe[Stripe Checkout - premium]
      M_Ads[Optional ads - light]
    end
  end

  subgraph ADM[Admin Console]
    ADM_CMS[CMS: blog + landing]
    ADM_AffMgr[Affiliate link manager]
    ADM_Support[Support tools: flags/refunds/bans]
    ADM_Flags[Feature flags / A-B]
  end

  subgraph DB[Data & Storage - Supabase]
    DB_users[users, profiles]
    DB_trips[trips, trip_items, itineraries]
    DB_budget[budgets, categories, expenses]
    DB_ai[ai_conversations, cached_prompts]
    DB_hooks[webhooks_events]
    DB_audit[audit_logs]
    DB_store[storage: uploads/statements, exports/itineraries]
    DB_policies[Policies: RLS, rate limit, PII scrub, Zod]
  end

  subgraph INT[Integrations / APIs]
    INT_OAI[OpenAI]
    INT_AMD[Amadeus - flights]
    INT_HOT[Hotels provider]
    INT_STR[Stripe]
    INT_WEA[Weather]
    INT_CUR[Currency]
    INT_MAP[Places / Maps]
  end

  subgraph TEL[Telemetry & Analytics]
    TEL_Sentry[Sentry - errors]
    TEL_GA[PostHog / GA4 - funnels]
    TEL_Uptime[Uptime pings]
    TEL_LHC[Lighthouse CI - perf budgets]
  end

  subgraph DEP[Deployment & Env - Vercel]
    DEP_Env[Preview/Prod + Env var validation]
    DEP_QG[Quality Gates: lint/unit/e2e/mobile/a11y/SEO]
    DEP_Rel[Release: keys ok, webhooks live, monitoring]
  end

  subgraph MSG[Messaging / Email]
    MSG_Tx[Transactional: sign-in, trip saved, receipts]
    MSG_Mkt[Marketing: newsletters, onboarding, reactivation]
  end

  %% CONNECTIONS - Marketing to App
  PUB_CTA --> F_Onboard
  PUB_H --> F_Onboard
  PUB_Dest --> F_Onboard
  PUB_Deals --> F_Onboard
  PUB_SEO --> F_Onboard
  PUB_Ideas --> F_Onboard

  %% App → DB
  APP_Trips <---> DB_trips
  APP_Budget <---> DB_budget
  APP_Profile <---> DB_users
  APP_Utils <---> DB_ai
  F_Budget --> DB_budget
  F_Plan --> DB_trips
  F_Detail --> DB_trips
  F_Detail --> DB_budget
  M_Stripe --> DB_hooks
  DB_audit -.log actions.- APP

  %% App → Integrations
  F_Plan --> INT_OAI
  F_Plan --> INT_AMD
  F_Plan --> INT_HOT
  F_Plan --> INT_MAP
  F_Utils --> INT_WEA
  F_Utils --> INT_CUR
  M_Stripe --> INT_STR

  %% App → Messaging
  F_Plan --> MSG_Tx
  F_Detail --> MSG_Tx
  M_Stripe --> MSG_Tx

  %% App → Telemetry
  APP --> TEL_Sentry
  APP --> TEL_GA
  APP --> TEL_LHC
  TEL_Uptime --> APP

  %% Admin ↔ DB
  ADM_CMS --> DB_store
  ADM_AffMgr --> DB
  ADM_Support --> DB
  ADM_Flags --> DB

  %% Integrations → DB (webhooks/caching)
  INT_STR --> DB_hooks
  INT_OAI --> DB_ai

  %% Deployment connects to Website & App
  DEP_Env --> APP
  DEP_Env --> PUB
  DEP_QG --> DEP_Rel

  %% Messaging → Users (Website/App)
  MSG_Mkt --> PUB
  MSG_Tx --> APP
```

## Current Status

### ✅ **What We Have Built**
- **Core Trip Planning Flow**: `/plan-trip` → `/suggestions` → `/trip/[id]`
- **AI Integration**: OpenAI GPT-4o-mini with realistic suggestions
- **Booking Flow**: Checkout → Payment → Confirmation
- **API Routes**: AI suggestions, Amadeus flights/hotels, payment processing
- **Authentication**: Supabase setup
- **Testing**: Comprehensive test suite (750+ scenarios)

### 🔧 **What We Need to Add**
- **Marketing Website**: Public pages for SEO and conversion
- **App Shell**: Authenticated app with proper navigation
- **Budget Management**: Expense tracking and categories
- **Utilities**: Weather, currency, travel tools
- **Database Schema**: Proper tables and relationships
- **Analytics**: Event tracking and monitoring

### 🎯 **Next Steps**
1. Create missing page structure
2. Wire page-to-page navigation
3. Set up proper database schema
4. Add missing API routes
5. Implement analytics and monitoring
