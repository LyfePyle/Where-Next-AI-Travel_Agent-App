# Where Next — Context Bundle

This file is a curated context pack for Claude: core routes, key components, and app overview.  
Large files are included as excerpts (top sections) to keep size manageable.

## Project Overview

```
README.md
```
```
L1: # Where Next - AI-Powered Travel Planning App
L2:
L3: A comprehensive, mobile-first travel planning application with a complete backend built on Next.js, Supabase, and OpenAI.
L4:
L5: ## 🚀 Features
L6:
L7: ### 🧳 **Trip Planning & Management**
L8: - **AI Trip Suggestions**: Get personalized destination recommendations
L9: - **Smart Itinerary Builder**: Create detailed day-by-day travel plans
L10: - **Trip Details Management**: Organize accommodations, activities, and bookings
L11: - **Saved Trips**: Access your travel history and favorite destinations
L12:
L13: ### 💰 **Advanced Budget Management**
L14: - **Smart Budget Tracking**: Monitor expenses across 6+ categories
L15: - **Real-time Analytics**: Visual spending insights with charts and progress indicators
L16: - **Multi-Currency Support**: Handle expenses in different currencies
L17: - **AI Budget Insights**: Get personalized spending recommendations
L18: - **Expense Splitting**: Share costs with travel companions
L19:
L20: ### 🗺️ **AI-Powered Walking Tours**
L21: - **Custom Tour Generation**: AI creates personalized walking routes
L22: - **6 Tour Themes**: Cultural, Food, Nature, Shopping, Photography, Nightlife
L23: - **Interactive Navigation**: Step-by-step tour guidance
L24: - **Local Tips & Insights**: Discover hidden gems and local secrets
L25:
L26: ### 🤖 **AI Travel Assistant**
L27: - **Intelligent Chat**: Get instant travel advice and recommendations
L28: - **Quick Questions**: Pre-built queries for common travel needs
L29: - **Contextual Help**: AI assistance throughout the app experience
L30:
L31: ### 🛠️ **Travel Utilities**
L32: - **Weather Forecasts**: 5-day weather predictions for destinations
L33: - **Currency Converter**: Real-time exchange rates
L34: - **Travel Phrases**: Essential phrases in local languages
L35: - **Offline Support**: Access key features without internet
L36:
L37: ## 🛠️ Tech Stack
L38:
L39: - **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
L40: - **Backend**: Next.js API Routes + Supabase
L41: - **Database**: PostgreSQL (via Supabase)
L42: - **Authentication**: Supabase Auth
L43: - **AI**: OpenAI GPT-4
```

## Dependencies

```
package.json
```
```
L1: {
L2:   "name": "where-next",
L3:   "version": "0.1.0",
L4:   "private": true,
L5:   "scripts": {
L6:     "dev": "next dev --turbopack",
L7:     "build": "next build",
L8:     "start": "next start",
L9:     "lint": "next lint",
L10:     "test": "jest",
L11:     "test:watch": "jest --watch",
L12:     "test:coverage": "jest --coverage",
L13:     "test:ci": "jest --ci --coverage --watchAll=false",
L14:     "test:api": "node test-comprehensive-apis.js",
L15:     "test:booking": "node test-booking-flow.js",
L16:     "test:performance": "node test-performance.js",
L17:     "test:openai": "node test-openai-api.js",
L18:     "seed:addons": "node scripts/seed-addons.js",
L19:     "test:amadeus": "node test-amadeus-simple.js",
L20:     "test:database": "node scripts/test-database.js",
L21:     "test:e2e": "playwright test",
L22:     "test:e2e:ui": "playwright test --ui",
L23:     "test:e2e:headed": "playwright test --headed",
L24:     "test:critical": "node test-critical-systems.js",
L25:     "test:ai-integration": "jest __tests__/api/ai-integration.test.ts",
L26:     "test:payment-flow": "jest __tests__/api/payment-flow.test.ts",
L27:     "test:amadeus-integration": "jest __tests__/api/amadeus-integration.test.ts",
L28:     "test:database-ops": "jest __tests__/api/database-operations.test.ts",
L29:     "test:performance-benchmarks": "jest __tests__/performance/performance-benchmarks.test.ts --testTimeout=60000",
L30:     "test:mobile-responsive": "playwright test __tests__/e2e/mobile-responsive.spec.ts",
L31:     "test:error-handling": "jest __tests__/resilience/error-handling.test.ts --testTimeout=30000",
L32:     "test:security": "jest __tests__/security/security-validation.test.ts --testTimeout=30000",
L33:     "test:cross-browser": "playwright test __tests__/e2e/cross-browser.spec.ts",
L34:     "test:accessibility": "playwright test __tests__/accessibility/accessibility.spec.ts",
L35:     "test:seo": "playwright test __tests__/seo/seo-testing.spec.ts",
L36:     "test:analytics": "playwright test __tests__/analytics/analytics-tracking.spec.ts",
L37:     "test:comprehensive": "node test-comprehensive-suite.js",
L38:     "test:all": "npm run test && npm run test:api && npm run test:performance && npm run test:database",
L39:     "test:all-critical": "npm run test:critical && npm run test:e2e",
L40:     "test:full-suite": "npm run test:comprehensive && npm run test:critical",
L41:     "setup:database": "echo 'Please run the SQL from supabase/sql/2025-setup.sql in your Supabase dashboard'",
L42:     "seed:database": "node scripts/seed-database.js",
L43:     "db:migrate": "tsx scripts/reset-db.ts --run",
L44:     "db:reset": "tsx scripts/reset-db.ts",
L45:     "db:seed": "tsx scripts/seed.ts",
L46:     "env:validate": "tsx -e \"import('./lib/env.mjs')\"",
L47:     "setup:env": "node setup-new-supabase.js",
L48:     "login:diagnose": "node scripts/diagnose-login.js",
L49:     "login:fix": "node scripts/fix-login-issues.js",
L50:     "login:test": "node scripts/test-login-e2e.js",
L51:     "test:ai-gateway": "tsx scripts/test-ai-gateway.ts"
L52:   },
L53:   "dependencies": {
L54:     "@ai-sdk/openai": "^3.0.2",
L55:     "@axe-core/playwright": "^4.10.2",
L56:     "@hookform/resolvers": "^5.2.2",
L57:     "@radix-ui/react-avatar": "^1.1.10",
L58:     "@radix-ui/react-dialog": "^1.1.15",
L59:     "@radix-ui/react-dropdown-menu": "^2.1.16",
L60:     "@radix-ui/react-label": "^2.1.7",
L61:     "@radix-ui/react-select": "^2.2.6",
L62:     "@radix-ui/react-slot": "^1.2.3",
L63:     "@radix-ui/react-tabs": "^1.1.13",
L64:     "@stripe/react-stripe-js": "^2.9.0",
L65:     "@stripe/stripe-js": "^3.0.10",
L66:     "@supabase/auth-helpers-nextjs": "^0.10.0",
L67:     "@supabase/ssr": "^0.6.1",
L68:     "@supabase/supabase-js": "^2.79.0",
L69:     "@tailwindcss/postcss": "^4.1.13",
L70:     "@types/uuid": "^10.0.0",
L71:     "ai": "^6.0.6",
L72:     "amadeus": "^11.0.0",
L73:     "class-variance-authority": "^0.7.1",
L74:     "dotenv": "^17.2.1",
L75:     "lucide-react": "^0.540.0",
L76:     "next": "15.4.10",
L77:     "node-fetch": "^3.3.2",
L78:     "openai": "^5.15.0",
L79:     "react": "^18.3.1",
L80:     "react-dom": "^18.3.1",
L81:     "react-hook-form": "^7.62.0",
L82:     "sonner": "^2.0.3",
L83:     "stripe": "^17.7.0",
L84:     "tailwind-merge": "^3.3.1",
L85:     "uuid": "^11.1.0",
L86:     "zod": "^3.25.76"
L87:   }
```

## Core Pages (excerpts)

```
src/app/page.tsx
```
```
L1: 'use client';
L2:
L3: import { useState, useEffect } from 'react';
L4: import Link from 'next/link';
L5: import { 
L6:   Plane, 
L7:   DollarSign, 
L8:   MapPin, 
L9:   Calendar,
L10:   Star,
L11:   ArrowRight,
L12:   CheckCircle,
L13:   Globe,
L14:   Compass,
L15:   TrendingUp,
L16:   BarChart3,
L17:   MessageCircle,
L18:   CreditCard
L19: } from 'lucide-react';
L20: import TravelImageCarousel from '@/components/marketing/TravelImageCarousel';
L21:
L22: export default function NewHomePage() {
L23:   const [isLoading, setIsLoading] = useState(false);
L24:   const [prompt, setPrompt] = useState('');
L25:   const [aiResponse, setAiResponse] = useState<string | null>(null);
L26:   const [aiError, setAiError] = useState<string | null>(null);
L27:   const [isGenerating, setIsGenerating] = useState(false);
L28:   const [weatherData, setWeatherData] = useState<any>(null);
L29:   const [currencyData, setCurrencyData] = useState<any>(null);
L30:   const [currentDestination, setCurrentDestination] = useState(0);
```

```
src/app/suggestions/page.tsx
```
```
L1: 'use client';
L2:
L3: import { useState, useEffect, Suspense } from 'react';
L4: import { useSearchParams } from 'next/navigation';
L5: import Link from 'next/link';
L6:
L7: interface TripSuggestion {
L8:   id: string;
L9:   destination: string;
L10:   country: string;
L11:   city: string;
L12:   fitScore: number;
L13:   description: string;
L14:   weather: {
L15:     temp: number;
L16:     condition: string;
L17:     icon: string;
L18:   };
L19:   crowdLevel: 'Low' | 'Medium' | 'High';
L20:   seasonality: string;
L21:   estimatedTotal: number;
L22:   flightBand: {
L23:     min: number;
L24:     max: number;
L25:   };
L26:   hotelBand: {
L27:     min: number;
L28:     max: number;
L29:     style: string;
L30:     area: string;
L31:   };
L32:   highlights: string[];
L33:   whyItFits: string;
L34: }
```

```
src/app/trip/[id]/page.tsx
```
```
L1: 'use client';
L2:
L3: import { useState, useEffect, Suspense } from 'react';
L4: import { useSearchParams, useParams } from 'next/navigation';
L5: import Link from 'next/link';
L6: import FlightPickerModal from '@/components/FlightPickerModal';
L7: import BookingPanel from '@/components/booking/BookingPanel';
L8:
L9: interface TripDetail {
L10:   id: string;
L11:   destination: string;
L12:   country: string;
L13:   city: string;
L14:   fitScore: number;
L15:   description: string;
L16:   weather: {
L17:     temp: number;
L18:     condition: string;
L19:     icon: string;
L20:   };
```

## Core API Routes

```
src/app/api/ai/suggestions/route.ts
```
```
L1: import { NextResponse } from "next/server";
L2: import OpenAI from "openai";
L3: import { TripPrefsSchema, normalizePrefs } from "@/lib/trip-prefs";
L4: import { openAISuggestionSchema } from "@/lib/trip-suggestion-schema";
L5: import { suggestionCache, generateCacheKey, cacheMetrics } from "@/lib/cache";
L6: import seedSuggestions from "@/data/seed/suggestions.json";
L7:
L8: export const runtime = "nodejs"; // OpenAI SDK prefers Node runtime
L9:
L10: // Initialize OpenAI client
L11: const openai = process.env.OPENAI_API_KEY
L12:   ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
L13:   : null;
L14:
L15: /**
L16:  * Generate AI suggestions using OpenAI with structured JSON response
L17:  */
L18: async function generateAISuggestions(prefs: ReturnType<typeof normalizePrefs>) {
L19:   if (!openai) {
L20:     throw new Error("OpenAI API key not configured");
L21:   }
```

```
src/app/api/trips/saved/route.ts
```
```
L1: import { NextRequest, NextResponse } from 'next/server';
L2: import { createServerClient } from '@supabase/ssr';
L3: import { cookies } from 'next/headers';
L4:
L5: interface SavedTrip {
L6:   id: string;
L7:   destination: string;
L8:   estimatedCost: number;
L9:   reason?: string;
L10:   fitScore?: number;
L11:   bestTime?: string;
L12:   source: string;
L13:   savedAt: string;
L14:   tripDuration?: number;
L15:   travelers?: number;
L16: }
```

```
src/app/api/trips/[id]/route.ts
```
```
L1: import { NextResponse } from "next/server";
L2: import { cookies } from "next/headers";
L3: import { createServerClient } from "@supabase/ssr";
L4:
L5: function supabaseServer() {
L6:   const cookieStore = cookies();
L7:   return createServerClient(
L8:     process.env.NEXT_PUBLIC_SUPABASE_URL!,
L9:     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
L10:     {
L11:       cookies: {
L12:         get: (n) => cookieStore.get(n)?.value,
L13:         set: (n, v, o) => cookieStore.set({ name: n, value: v, ...o }),
L14:         remove: (n, o) => cookieStore.set({ name: n, value: "", ...o }),
L15:       },
L16:     }
L17:   );
L18: }
```

```
src/app/api/booking/flights/search/route.ts
```
```
L1: import { NextResponse } from 'next/server';
L2: import { z } from 'zod';
L3: import { stubFlightsProvider } from '@/lib/booking/providers/stubFlights';
```

```
src/app/api/booking/hotels/search/route.ts
```
```
L1: import { NextResponse } from 'next/server';
L2: import { z } from 'zod';
L3: import { stubHotelsProvider } from '@/lib/booking/providers/stubHotels';
```

```
src/app/api/booking/intent/route.ts
```
```
L1: import { NextResponse } from 'next/server';
L2: import { z } from 'zod';
```

## Key Components

```
src/components/booking/BookingPanel.tsx
```
```
L1: 'use client';
L2:
L3: import { useState } from 'react';
L4: import { HotelOffer, FlightOffer } from '@/lib/booking/types';
L5:
L6: type BookingPanelProps = {
L7:   tripId: string;
L8:   destination: string;
L9:   startDate: string;
L10:   endDate: string;
L11:   travelers: number;
L12:   originIata?: string;
L13:   destinationIata?: string;
L14:   showFlights?: boolean;
L15:   showHotels?: boolean;
L16: };
```

```
src/components/TripDetailsEnhanced.tsx
```
```
L1: 'use client';
L2:
L3: import { useState, useEffect } from 'react';
L4: import { useRouter } from 'next/navigation';
L5: import { Calendar, MapPin, Users, DollarSign, Plane, Hotel, Star, Clock, Wifi, Car, Compass } from 'lucide-react';
L6: import Link from 'next/link';
L7: import { useTripBudget, type TripSelection } from '@/hooks/useTripBudget';
L8: import TravelHacksPanel from './TravelHacksPanel';
L9: import PriceTrackingPanel from './PriceTrackingPanel';
L10: import BookingOptionsPanel from './BookingOptionsPanel';
L11: import { analytics } from '@/lib/analytics';
L12:
L13: // Helper function to get destination-appropriate names
L14: const getHotelName = (destination: string, tier: string) => {
L15:   const city = destination.split(',')[0].trim();
```

```
src/components/forms/TripPlannerForm.tsx
```
```
L1: 'use client';
L2:
L3: import { useState } from 'react';
L4: import { useForm, Controller } from 'react-hook-form';
L5: import { zodResolver } from '@hookform/resolvers/zod';
L6: import { useRouter } from 'next/navigation';
L7: import { Calendar, Users, DollarSign, MapPin, Plane, Clock } from 'lucide-react';
L8: import { tripPlannerSchema, type TripPlannerFormData, vibeOptions } from '@/lib/validations/trip';
L9: import AirportAutocomplete from '@/components/AirportAutocomplete';
L10: import PillSlider from '@/components/ui/PillSlider';
```

## Supabase Client

```
src/lib/supabase.ts
```
```
L1: import { createBrowserClient } from '@supabase/ssr'
L2: import { createClient } from '@supabase/supabase-js'
L3:
L4: // Debug environment variables (only on client side)
L5: if (typeof window !== 'undefined') {
L6:   console.log('Environment variables check:')
L7:   console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
L8:   console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'EXISTS' : 'MISSING')
L9: }
```

## Booking Types + Stub Providers

```
src/lib/booking/types.ts
```
```
L1: export type BookingCurrency = 'USD' | 'CAD' | 'EUR' | 'GBP' | string;
L2:
L3: export type FlightSearchParams = {
L4:   origin: string;
L5:   destination: string;
L6:   departDate: string;
L7:   returnDate?: string;
L8:   adults: number;
L9:   currency?: BookingCurrency;
L10: };
```

```
src/lib/booking/providers/stubFlights.ts
```
```
L1: import { FlightOffer, FlightSearchParams } from '../types';
L2: import { FlightsProvider } from './flights';
L3:
L4: export const stubFlightsProvider: FlightsProvider = {
L5:   name: 'stub',
L6:   async search(params: FlightSearchParams): Promise<FlightOffer[]> {
L7:     const currency = params.currency ?? 'USD';
L8:     return [
L9:       {
L10:         id: 'stub_f1',
L11:         summary: `${params.origin} → ${params.destination} (1 stop) • 9h 40m`,
L12:         price: 412,
L13:         currency,
L14:         partnerUrl: `https://example.com/book/flight?o=${params.origin}&d=${params.destination}&dd=${params.departDate}`,
L15:       },
L16:       {
L17:         id: 'stub_f2',
L18:         summary: `${params.origin} → ${params.destination} (nonstop) • 3h 10m`,
L19:         price: 589,
L20:         currency,
L21:         partnerUrl: `https://example.com/book/flight?o=${params.origin}&d=${params.destination}&dd=${params.departDate}&fast=1`,
L22:       },
L23:     ];
L24:   },
L25: };
```

```
src/lib/booking/providers/stubHotels.ts
```
```
L1: import { HotelOffer, HotelSearchParams } from '../types';
L2: import { HotelsProvider } from './hotels';
L3:
L4: export const stubHotelsProvider: HotelsProvider = {
L5:   name: 'stub',
L6:   async search(params: HotelSearchParams): Promise<HotelOffer[]> {
L7:     const currency = params.currency ?? 'USD';
L8:     return [
L9:       {
L10:         id: 'stub_h1',
L11:         name: 'Central Boutique Hotel',
L12:         area: 'Downtown',
L13:         nightly: 168,
L14:         currency,
L15:         partnerUrl: `https://example.com/book/hotel?dest=${encodeURIComponent(params.destination)}&in=${params.checkIn}&out=${params.checkOut}`,
L16:       },
L17:       {
L18:         id: 'stub_h2',
L19:         name: 'Beachside Stay',
L20:         area: 'Waterfront',
L21:         nightly: 219,
L22:         currency,
L23:         partnerUrl: `https://example.com/book/hotel?dest=${encodeURIComponent(params.destination)}&in=${params.checkIn}&out=${params.checkOut}&beach=1`,
L24:       },
L25:     ];
L26:   },
L27: };
```

---

**Notes / Known Issues**
- `saved_trips` schema uses `budget_cents` not `estimated_cost`. API adjusted to write to schema-safe columns.
- Flights/hotels providers are stubs for now; replace with Amadeus or other suppliers later.
