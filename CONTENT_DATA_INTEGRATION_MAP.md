# 🏠📊 Homepage + Dashboard Data Integration Map

## 🎯 **OVERVIEW**

This document maps every piece of content to its **real data source**, showing exactly where to replace static content with dynamic APIs, database queries, and live integrations.

---

## 🏠 **HOMEPAGE DATA INTEGRATION**

### 🔝 **Hero Section**

#### **Static Content (Keep As-Is)**
```jsx
// These stay static for marketing consistency
const heroContent = {
  headline: "Your AI Travel Agent — Smarter Trips, Less Stress.",
  subheadline: "Plan unforgettable adventures, manage your budget, and book everything in one place."
}
```

#### **Dynamic CTAs**
```jsx
// Authentication integration
<Link href="/auth/signup">
  Start Planning Free
</Link>
// → Integrates with: Supabase Auth

<Link href="/dashboard?demo=true">
  Try Demo Mode  
</Link>
// → Integrates with: Demo user seeded data
```

#### **Dynamic Trust Signal**
```jsx
// Replace static "5,000+ travelers"
const [userCount, setUserCount] = useState(0);

useEffect(() => {
  const fetchUserCount = async () => {
    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    setUserCount(count);
  };
  fetchUserCount();
}, []);

// Display: "Join {userCount}+ travelers planning smarter ✈️"
// → Data Source: Supabase users table
```

### 💡 **Feature Highlights - Dynamic Integration**

#### **AI Travel Planning**
```jsx
const aiFeature = {
  title: "Plan with AI",
  description: "Tell us your travel style and budget, get instant itineraries made just for you.",
  // → Data Source: OpenAI GPT-4 API
  apiEndpoint: "/api/ai/suggestions",
  integration: `
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{
        role: "user", 
        content: "Create a 5-day itinerary for ${destination} with ${budget} budget"
      }]
    });
  `
}
```

#### **Budget Management**
```jsx
const budgetFeature = {
  title: "Stay on Budget", 
  description: "Track every expense across multiple currencies with real-time insights.",
  // → Data Sources: Supabase expenses + Currency API
  integration: `
    // Get user expenses
    const { data: expenses } = await supabase
      .from('expenses')
      .select('amount, currency, category')
      .eq('user_id', userId);
    
    // Convert currencies
    const rates = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    const convertedAmounts = expenses.map(expense => 
      convertCurrency(expense.amount, expense.currency, 'USD', rates)
    );
  `
}
```

#### **Booking Integration**
```jsx
const bookingFeature = {
  title: "Book Confidently",
  description: "Flights, hotels, and tours from trusted partners like Expedia and Amadeus.",
  // → Data Sources: Amadeus API, Affiliate APIs
  integration: `
    // Flight search
    const flights = await amadeus.shopping.flightOffersSearch.get({
      originLocationCode: 'NYC',
      destinationLocationCode: 'PAR',
      departureDate: '2024-03-15',
      adults: '1'
    });
    
    // Hotel search  
    const hotels = await amadeus.shopping.hotelOffers.get({
      cityCode: 'PAR',
      checkInDate: '2024-03-15',
      checkOutDate: '2024-03-18'
    });
  `
}
```

#### **Utilities Integration**
```jsx
const utilitiesFeature = {
  title: "All-in-One Tools",
  description: "Check the weather, convert currencies, and learn local phrases instantly.",
  // → Data Sources: OpenWeatherMap, Currency API, Phrases DB
  integration: `
    // Weather
    const weather = await fetch(
      'https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}'
    );
    
    // Currency
    const currency = await fetch(
      'https://api.exchangerate-api.com/v4/latest/${baseCurrency}'
    );
    
    // Phrases
    const { data: phrases } = await supabase
      .from('travel_phrases')
      .select('phrase, translation, pronunciation')
      .eq('language', targetLanguage)
      .limit(1);
  `
}
```

### ⭐ **Social Proof - Dynamic Integration**

#### **Dynamic Testimonials**
```jsx
const [testimonials, setTestimonials] = useState([]);

useEffect(() => {
  const fetchTestimonials = async () => {
    const { data } = await supabase
      .from('testimonials')
      .select('name, location, quote, rating, trip_saved')
      .eq('featured', true)
      .order('created_at', { ascending: false })
      .limit(3);
    setTestimonials(data);
  };
  fetchTestimonials();
}, []);

// Display testimonials dynamically
// → Data Source: Supabase testimonials table
```

#### **Partner Logos (Dynamic)**
```jsx
const [partners, setPartners] = useState([]);

// For scaling - pull partner list dynamically
const fetchPartners = async () => {
  const { data } = await supabase
    .from('partners')
    .select('name, logo_url, active')
    .eq('active', true);
  setPartners(data);
};
// → Data Source: Supabase partners table (optional)
```

### 📈 **Secondary CTA - Demo Integration**

```jsx
// Demo mode with seeded data
<Link href="/dashboard?demo=true&user=demo_user">
  Explore Demo Mode
</Link>

// Demo data seeding
const demoUser = {
  id: 'demo_user',
  name: 'Demo User',
  trips: [
    {
      destination: 'Thailand',
      budget: 2500,
      spent: 1750,
      start_date: '2024-03-15'
    }
  ]
};
// → Data Source: Seeded demo data in Supabase
```

### 📚 **Footer - CMS Integration**

```jsx
// Blog integration
const [blogPosts, setBlogPosts] = useState([]);

const fetchBlogPosts = async () => {
  // Option 1: Notion API
  const notion = new Client({ auth: process.env.NOTION_TOKEN });
  const response = await notion.databases.query({
    database_id: process.env.NOTION_DATABASE_ID,
    filter: { property: 'Published', checkbox: { equals: true } }
  });
  
  // Option 2: Ghost CMS API
  const posts = await fetch(`${process.env.GHOST_URL}/ghost/api/v3/content/posts/?key=${process.env.GHOST_KEY}`);
  
  setBlogPosts(response.results);
};
// → Data Source: Notion API, Ghost CMS, or custom blog API
```

```jsx
// Newsletter signup
const handleNewsletterSignup = async (email) => {
  // MailerLite integration
  const response = await fetch('https://api.mailerlite.com/api/v2/subscribers', {
    method: 'POST',
    headers: {
      'X-MailerLite-ApiKey': process.env.MAILERLITE_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email,
      groups: [process.env.MAILERLITE_GROUP_ID]
    })
  });
};
// → Data Source: MailerLite API
```

---

## 📊 **DASHBOARD DATA INTEGRATION**

### 🔝 **Trip Countdown Header - Dynamic**

```jsx
const [currentTrip, setCurrentTrip] = useState(null);
const [user, setUser] = useState(null);

useEffect(() => {
  const fetchUserAndTrip = async () => {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    // Get user's next trip
    const { data: trip } = await supabase
      .from('trips')
      .select('destination, start_date, end_date, country_emoji, planning_progress')
      .eq('user_id', user.id)
      .gte('start_date', new Date().toISOString())
      .order('start_date', { ascending: true })
      .limit(1)
      .single();
    
    setUser(user);
    setCurrentTrip(trip);
  };
  fetchUserAndTrip();
}, []);

// Calculate days until trip
const daysUntil = currentTrip ? 
  Math.ceil((new Date(currentTrip.start_date) - new Date()) / (1000 * 60 * 60 * 24)) : 0;

// Display: "12 days until Thailand Adventure 🏯"
// → Data Source: Supabase users + trips tables
```

### 💵 **Budget Snapshot - Real-time Data**

```jsx
const [budgetData, setBudgetData] = useState(null);

useEffect(() => {
  const fetchBudgetData = async () => {
    // Get trip budget
    const { data: budget } = await supabase
      .from('budgets')
      .select('planned_amount, currency')
      .eq('trip_id', currentTrip.id)
      .single();
    
    // Get expenses for this trip
    const { data: expenses } = await supabase
      .from('expenses')
      .select('amount, currency, category, created_at')
      .eq('trip_id', currentTrip.id);
    
    // Convert all to base currency
    const rates = await fetch(`https://api.exchangerate-api.com/v4/latest/${budget.currency}`);
    const rateData = await rates.json();
    
    const totalSpent = expenses.reduce((sum, expense) => {
      const convertedAmount = expense.currency === budget.currency ? 
        expense.amount : 
        expense.amount / rateData.rates[expense.currency];
      return sum + convertedAmount;
    }, 0);
    
    // Group by category
    const categoryTotals = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {});
    
    setBudgetData({
      planned: budget.planned_amount,
      spent: totalSpent,
      percentage: (totalSpent / budget.planned_amount) * 100,
      categories: categoryTotals
    });
  };
  
  fetchBudgetData();
}, [currentTrip]);

// Display: "$1,750 of $2,500 spent (70%)"
// → Data Source: Supabase budgets + expenses tables + Currency API
```

### 🧾 **Recent Expenses - Live Data**

```jsx
const [recentExpenses, setRecentExpenses] = useState([]);

useEffect(() => {
  const fetchRecentExpenses = async () => {
    const { data } = await supabase
      .from('expenses')
      .select('description, amount, currency, category, created_at')
      .eq('trip_id', currentTrip.id)
      .order('created_at', { ascending: false })
      .limit(5);
    
    setRecentExpenses(data);
  };
  
  fetchRecentExpenses();
  
  // Real-time subscription
  const subscription = supabase
    .channel('expenses')
    .on('postgres_changes', 
      { event: 'INSERT', schema: 'public', table: 'expenses' },
      (payload) => {
        setRecentExpenses(prev => [payload.new, ...prev.slice(0, 4)]);
      }
    )
    .subscribe();
    
  return () => subscription.unsubscribe();
}, [currentTrip]);

// Display: "Dinner $35 • 2 hours ago"
// → Data Source: Supabase expenses table with real-time subscriptions
```

### 🛫 **Upcoming Bookings - Live Status**

```jsx
const [bookings, setBookings] = useState([]);

useEffect(() => {
  const fetchBookings = async () => {
    // Get bookings from database
    const { data: dbBookings } = await supabase
      .from('bookings')
      .select('type, reference_id, status, booking_date, details')
      .eq('trip_id', currentTrip.id)
      .gte('booking_date', new Date().toISOString());
    
    // Enrich with live data from Amadeus
    const enrichedBookings = await Promise.all(
      dbBookings.map(async (booking) => {
        if (booking.type === 'flight') {
          try {
            const flightDetails = await amadeus.travel.analytics.airTraffic.booked.get({
              originCityCode: booking.details.origin,
              period: booking.booking_date.substring(0, 7)
            });
            return { ...booking, liveDetails: flightDetails.data };
          } catch (error) {
            return booking;
          }
        }
        return booking;
      })
    );
    
    setBookings(enrichedBookings);
  };
  
  fetchBookings();
}, [currentTrip]);

// Display: "Flight AC1234 • YVR → BKK • Confirmed"
// → Data Source: Supabase bookings + Amadeus API for live status
```

### 🤖 **AI Suggestions - Dynamic Insights**

```jsx
const [aiSuggestions, setAiSuggestions] = useState([]);

useEffect(() => {
  const generateAiSuggestions = async () => {
    // Gather context data
    const context = {
      destination: currentTrip.destination,
      budget: budgetData,
      weather: await fetchWeather(currentTrip.destination),
      expenses: recentExpenses,
      flightPrices: await checkFlightPrices(currentTrip.destination)
    };
    
    // Generate AI suggestions
    const response = await fetch('/api/ai/suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        context,
        suggestionsType: ['budget', 'weather', 'activities', 'deals']
      })
    });
    
    const suggestions = await response.json();
    setAiSuggestions(suggestions);
  };
  
  generateAiSuggestions();
  
  // Refresh suggestions every hour
  const interval = setInterval(generateAiSuggestions, 3600000);
  return () => clearInterval(interval);
}, [currentTrip, budgetData]);

// Example AI endpoint
// /api/ai/suggestions
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const completion = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [{
    role: "system",
    content: "You are a travel assistant. Provide personalized suggestions based on the user's trip data."
  }, {
    role: "user", 
    content: `Based on this trip data: ${JSON.stringify(context)}, provide 3 actionable travel tips.`
  }]
});

// Display rotating suggestions every 10 seconds
// → Data Source: OpenAI API + Amadeus + Weather API + Supabase
```

### 🔧 **Utilities - Live Data**

```jsx
const [utilities, setUtilities] = useState({});

useEffect(() => {
  const fetchUtilities = async () => {
    // Weather
    const weather = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${currentTrip.destination}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`
    );
    const weatherData = await weather.json();
    
    // Currency
    const currency = await fetch(
      `https://api.exchangerate-api.com/v4/latest/${user.home_currency}`
    );
    const currencyData = await currency.json();
    
    // Daily phrase
    const { data: phrase } = await supabase
      .from('travel_phrases')
      .select('phrase, translation, pronunciation')
      .eq('language', currentTrip.language)
      .eq('date', new Date().toDateString())
      .single();
    
    setUtilities({
      weather: {
        temp: Math.round(weatherData.main.temp),
        condition: weatherData.weather[0].description,
        humidity: weatherData.main.humidity
      },
      currency: {
        rate: currencyData.rates[currentTrip.currency],
        lastUpdated: new Date(currencyData.date).toLocaleTimeString()
      },
      phrase: phrase || { phrase: 'Hello', translation: 'Sawasdee', pronunciation: 'sa-was-dee' }
    });
  };
  
  fetchUtilities();
  
  // Update every 5 minutes
  const interval = setInterval(fetchUtilities, 300000);
  return () => clearInterval(interval);
}, [currentTrip, user]);

// Display: "Bangkok • 32°C • Partly cloudy"
// → Data Sources: OpenWeatherMap API + ExchangeRate API + Supabase phrases
```

### 🔔 **Notifications - Smart Alerts**

```jsx
const [notifications, setNotifications] = useState([]);

useEffect(() => {
  const generateNotifications = async () => {
    const alerts = [];
    
    // Budget alerts
    if (budgetData.percentage > 70) {
      alerts.push({
        type: 'budget_warning',
        message: `Budget ${budgetData.percentage.toFixed(0)}% used`,
        details: `$${budgetData.spent} of $${budgetData.planned} spent`,
        timestamp: new Date(),
        priority: 'medium'
      });
    }
    
    // Booking confirmations
    const recentBookings = await supabase
      .from('bookings')
      .select('*')
      .eq('trip_id', currentTrip.id)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
    
    recentBookings.data?.forEach(booking => {
      if (booking.status === 'confirmed') {
        alerts.push({
          type: 'booking_confirmed',
          message: `${booking.type} booking confirmed`,
          details: booking.details.name,
          timestamp: new Date(booking.updated_at),
          priority: 'high'
        });
      }
    });
    
    // AI-generated deals
    const deals = await fetch('/api/ai/deals', {
      method: 'POST',
      body: JSON.stringify({ destination: currentTrip.destination })
    });
    const dealData = await deals.json();
    
    if (dealData.deals?.length > 0) {
      alerts.push({
        type: 'deals_found',
        message: `AI found ${dealData.deals.length} new deals`,
        details: dealData.deals[0].description,
        timestamp: new Date(),
        priority: 'low'
      });
    }
    
    setNotifications(alerts.slice(0, 5));
  };
  
  generateNotifications();
  
  // Check for new notifications every 10 minutes
  const interval = setInterval(generateNotifications, 600000);
  return () => clearInterval(interval);
}, [currentTrip, budgetData]);

// Display smart, contextual notifications
// → Data Sources: Supabase (budgets, bookings) + OpenAI API for deal insights
```

---

## 🔑 **INTEGRATION ARCHITECTURE**

### **API Endpoints to Create**

```javascript
// /api/ai/suggestions - OpenAI integration
// /api/ai/deals - AI-powered deal finding
// /api/weather/[city] - Weather data caching
// /api/currency/convert - Currency conversion
// /api/bookings/status - Live booking status
// /api/analytics/user-stats - User count for homepage
```

### **Database Schema (Supabase)**

```sql
-- Users with travel preferences
CREATE TABLE users (
  id UUID PRIMARY KEY,
  name TEXT,
  email TEXT,
  home_currency TEXT DEFAULT 'USD',
  travel_style TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Trips with planning progress
CREATE TABLE trips (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  destination TEXT,
  start_date DATE,
  end_date DATE,
  country_emoji TEXT,
  language TEXT,
  planning_progress INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Budget tracking
CREATE TABLE budgets (
  id UUID PRIMARY KEY,
  trip_id UUID REFERENCES trips(id),
  planned_amount DECIMAL,
  currency TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Real-time expenses
CREATE TABLE expenses (
  id UUID PRIMARY KEY,
  trip_id UUID REFERENCES trips(id),
  description TEXT,
  amount DECIMAL,
  currency TEXT,
  category TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Booking management
CREATE TABLE bookings (
  id UUID PRIMARY KEY,
  trip_id UUID REFERENCES trips(id),
  type TEXT, -- 'flight', 'hotel', 'activity'
  reference_id TEXT,
  status TEXT, -- 'confirmed', 'pending', 'cancelled'
  booking_date TIMESTAMP,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Dynamic testimonials
CREATE TABLE testimonials (
  id UUID PRIMARY KEY,
  name TEXT,
  location TEXT,
  quote TEXT,
  rating INTEGER,
  trip_saved DECIMAL,
  featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Travel phrases
CREATE TABLE travel_phrases (
  id UUID PRIMARY KEY,
  language TEXT,
  phrase TEXT,
  translation TEXT,
  pronunciation TEXT,
  date TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **Environment Variables Needed**

```bash
# Database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Services
OPENAI_API_KEY=your_openai_key

# Travel APIs
AMADEUS_CLIENT_ID=your_amadeus_client_id
AMADEUS_CLIENT_SECRET=your_amadeus_client_secret
OPENWEATHER_API_KEY=your_openweather_key

# Currency & Utilities
EXCHANGERATE_API_KEY=your_exchangerate_key

# Marketing
MAILERLITE_API_KEY=your_mailerlite_key
MAILERLITE_GROUP_ID=your_group_id

# CMS (Optional)
NOTION_TOKEN=your_notion_token
NOTION_DATABASE_ID=your_database_id
GHOST_URL=your_ghost_url
GHOST_KEY=your_ghost_key
```

This comprehensive map shows exactly where every piece of content connects to real data sources, making your app truly dynamic and personalized! 🚀
