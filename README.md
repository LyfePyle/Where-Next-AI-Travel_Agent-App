# Where Next - AI-Powered Travel Planning App

A comprehensive, mobile-first travel planning application with a complete backend built on Next.js, Supabase, and OpenAI.

## 🚀 Features

### 🧳 **Trip Planning & Management**
- **AI Trip Suggestions**: Get personalized destination recommendations
- **Smart Itinerary Builder**: Create detailed day-by-day travel plans
- **Trip Details Management**: Organize accommodations, activities, and bookings
- **Saved Trips**: Access your travel history and favorite destinations

### 💰 **Advanced Budget Management**
- **Smart Budget Tracking**: Monitor expenses across 6+ categories
- **Real-time Analytics**: Visual spending insights with charts and progress indicators
- **Multi-Currency Support**: Handle expenses in different currencies
- **AI Budget Insights**: Get personalized spending recommendations
- **Expense Splitting**: Share costs with travel companions

### 🗺️ **AI-Powered Walking Tours**
- **Custom Tour Generation**: AI creates personalized walking routes
- **6 Tour Themes**: Cultural, Food, Nature, Shopping, Photography, Nightlife
- **Interactive Navigation**: Step-by-step tour guidance
- **Local Tips & Insights**: Discover hidden gems and local secrets

### 🤖 **AI Travel Assistant**
- **Intelligent Chat**: Get instant travel advice and recommendations
- **Quick Questions**: Pre-built queries for common travel needs
- **Contextual Help**: AI assistance throughout the app experience

### 🛠️ **Travel Utilities**
- **Weather Forecasts**: 5-day weather predictions for destinations
- **Currency Converter**: Real-time exchange rates
- **Travel Phrases**: Essential phrases in local languages
- **Offline Support**: Access key features without internet

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes + Supabase
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **AI**: OpenAI GPT-4
- **State Management**: React Hooks + Context
- **Validation**: Zod
- **Deployment**: Vercel (recommended)

## 📁 Project Structure

```
where-next/
├── src/
│   ├── app/
│   │   ├── api/                    # API Routes
│   │   │   ├── ai/
│   │   │   │   ├── assistant/      # AI Chat & Quick Questions
│   │   │   │   └── plan/           # Trip Planning
│   │   │   ├── budget/             # Budget Management
│   │   │   ├── expenses/           # Expense Tracking
│   │   │   ├── trips/              # Trip Management
│   │   │   ├── utils/
│   │   │   │   ├── weather/        # Weather API
│   │   │   │   ├── currency/       # Currency Conversion
│   │   │   │   └── phrases/        # Travel Phrases
│   │   │   └── walking-tour/       # Walking Tour Generation
│   │   ├── globals.css             # Global Styles
│   │   ├── layout.tsx              # Root Layout
│   │   └── page.tsx                # Homepage
│   ├── components/                 # React Components
│   ├── lib/
│   │   └── supabase.ts             # Supabase Client
│   ├── types/                      # TypeScript Types
│   ├── utils/                      # Utility Functions
│   └── constants/                  # App Constants
├── .env.local                      # Environment Variables
├── package.json
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- OpenAI API key

### Installation

1. **Clone and install dependencies**
   ```bash
   cd where-next
   npm install
   ```

2. **Set up environment variables**
   ```bash
   # Copy the example file
   cp .env.example .env.local
   
   # Add your API keys
   OPENAI_API_KEY=sk-your-openai-key
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   NEXT_PUBLIC_WEATHER_API_KEY=your-weather-api-key
   NEXT_PUBLIC_CURRENCY_API_KEY=your-currency-api-key
   ```

3. **Set up Supabase Database**
   
   Run this SQL in your Supabase SQL Editor:

   ```sql
   -- Enable UUID extension
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

   -- Users table (handled by Supabase auth)
   CREATE TABLE IF NOT EXISTS profiles (
     id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
     email text,
     full_name text,
     created_at timestamp DEFAULT now()
   );

   -- Trips table
   CREATE TABLE trips (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id uuid NOT NULL REFERENCES auth.users(id),
     name text NOT NULL,
     destination text,
     start_date date,
     end_date date,
     base_currency text NOT NULL DEFAULT 'USD',
     party_size int DEFAULT 1,
     departure_city text,
     notes text,
     created_at timestamptz DEFAULT now()
   );

   -- Budgets table
   CREATE TABLE budgets (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
     total_budget_cents bigint NOT NULL DEFAULT 0,
     notes text
   );

   -- Categories table
   CREATE TABLE categories (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id uuid,
     name text NOT NULL,
     icon text,
     color text,
     parent_id uuid REFERENCES categories(id),
     is_default boolean DEFAULT false
   );

   -- Expenses table
   CREATE TABLE expenses (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
     category_id uuid REFERENCES categories(id),
     amount_cents bigint NOT NULL,
     currency text NOT NULL,
     fx_rate numeric NOT NULL,
     amount_base_cents bigint NOT NULL,
     spent_at date NOT NULL DEFAULT current_date,
     lat numeric,
     lng numeric,
     place_name text,
     note text,
     created_by uuid REFERENCES auth.users(id),
     created_at timestamptz DEFAULT now()
   );

   -- Tours table
   CREATE TABLE tours (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id uuid NOT NULL REFERENCES auth.users(id),
     city text NOT NULL,
     path_type text,
     total_distance_m int,
     total_time_min int,
     is_paid boolean DEFAULT false,
     raw_prompt jsonb,
     raw_response jsonb,
     created_at timestamptz DEFAULT now()
   );

   -- Tour stops table
   CREATE TABLE tour_stops (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     tour_id uuid REFERENCES tours(id) ON DELETE CASCADE,
     order_index int,
     name text,
     lat numeric,
     lng numeric,
     blurb_md text,
     dwell_min int
   );

   -- Itineraries table
   CREATE TABLE itineraries (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id uuid REFERENCES auth.users(id),
     raw_prompt jsonb,
     raw_response jsonb,
     summary text,
     total_estimated_cents bigint,
     created_at timestamptz DEFAULT now()
   );

   -- AI conversations table
   CREATE TABLE ai_conversations (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id uuid REFERENCES auth.users(id),
     message text NOT NULL,
     response text NOT NULL,
     context jsonb,
     created_at timestamptz DEFAULT now()
   );

   -- Enable Row Level Security
   ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
   ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
   ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
   ALTER TABLE tours ENABLE ROW LEVEL SECURITY;
   ALTER TABLE itineraries ENABLE ROW LEVEL SECURITY;
   ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

   -- Create RLS policies
   CREATE POLICY "Users can view own trips" ON trips FOR SELECT USING (auth.uid() = user_id);
   CREATE POLICY "Users can insert own trips" ON trips FOR INSERT WITH CHECK (auth.uid() = user_id);
   CREATE POLICY "Users can update own trips" ON trips FOR UPDATE USING (auth.uid() = user_id);
   CREATE POLICY "Users can delete own trips" ON trips FOR DELETE USING (auth.uid() = user_id);

   CREATE POLICY "Users can view own expenses" ON expenses FOR SELECT USING (auth.uid() = created_by);
   CREATE POLICY "Users can insert own expenses" ON expenses FOR INSERT WITH CHECK (auth.uid() = created_by);
   CREATE POLICY "Users can update own expenses" ON expenses FOR UPDATE USING (auth.uid() = created_by);
   CREATE POLICY "Users can delete own expenses" ON expenses FOR DELETE USING (auth.uid() = created_by);

   CREATE POLICY "Users can view own tours" ON tours FOR SELECT USING (auth.uid() = user_id);
   CREATE POLICY "Users can insert own tours" ON tours FOR INSERT WITH CHECK (auth.uid() = user_id);

   CREATE POLICY "Users can view own itineraries" ON itineraries FOR SELECT USING (auth.uid() = user_id);
   CREATE POLICY "Users can insert own itineraries" ON itineraries FOR INSERT WITH CHECK (auth.uid() = user_id);

   CREATE POLICY "Users can view own conversations" ON ai_conversations FOR SELECT USING (auth.uid() = user_id);
   CREATE POLICY "Users can insert own conversations" ON ai_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 📡 API Endpoints

### Trip Planning
- `POST /api/trips/plan` - Generate AI-powered trip plans
- `GET /api/trips/plan` - Get saved itineraries

### Budget Management
- `POST /api/budget` - Create new budget
- `GET /api/budget` - Get user budgets
- `PUT /api/budget` - Update budget

### Expense Tracking
- `POST /api/expenses` - Add new expense
- `GET /api/expenses` - Get expenses (with optional budgetId filter)
- `PUT /api/expenses` - Update expense
- `DELETE /api/expenses?id={id}` - Delete expense

### Walking Tours
- `POST /api/walking-tour/generate` - Generate AI walking tour

### AI Assistant
- `POST /api/ai/assistant` - Chat with AI assistant
- `PUT /api/ai/assistant` - Quick questions

### Travel Utilities
- `GET /api/utils/weather?city={city}` - Get weather data
- `POST /api/utils/weather` - Mock weather data
- `GET /api/utils/currency?base={base}` - Get exchange rates
- `POST /api/utils/currency` - Convert currency
- `PUT /api/utils/currency` - Mock currency conversion
- `GET /api/utils/phrases?language={lang}` - Get travel phrases
- `PUT /api/utils/phrases` - Get available languages

## 🔧 Environment Variables

```env
# OpenAI
OPENAI_API_KEY=sk-your-openai-key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# External APIs (optional)
NEXT_PUBLIC_WEATHER_API_KEY=your-weather-api-key
NEXT_PUBLIC_CURRENCY_API_KEY=your-currency-api-key
NEXT_PUBLIC_MAPBOX_TOKEN=your-mapbox-token

# Payment (optional)
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
```

## 🚀 Deployment

### Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy on Vercel**
   - Connect your GitHub repository to Vercel
   - Add environment variables in Vercel dashboard
   - Deploy automatically on push

### Other Platforms

The app can be deployed on any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🧪 Testing

```bash
# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run e2e tests
npm run test:e2e
```

## 📱 Mobile App

This backend is designed to work with the React Native frontend from the `figma-front-end` folder. The API endpoints are compatible with both web and mobile clients.

## 🔒 Security

- **Authentication**: Supabase Auth with JWT tokens
- **Authorization**: Row Level Security (RLS) policies
- **Input Validation**: Zod schemas for all API endpoints
- **Rate Limiting**: Implemented on API routes
- **CORS**: Configured for cross-origin requests

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Supabase** for the backend infrastructure
- **OpenAI** for AI capabilities
- **Next.js** for the framework
- **Tailwind CSS** for styling
- **Zod** for validation

## 📞 Support

For support, questions, or feature requests:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

**Where Next** - Your AI-powered travel companion for unforgettable journeys! ✈️🌍
