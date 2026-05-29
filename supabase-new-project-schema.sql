-- ============================================================================
-- Where Next AI Travel Agent - Complete Database Schema
-- For New Supabase Project Setup
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- USER MANAGEMENT & PROFILES
-- ============================================================================

-- Profiles table (extends Supabase auth)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email text,
  full_name text,
  avatar_url text,
  default_currency char(3) DEFAULT 'USD',
  home_city text,
  home_airport text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) UNIQUE,
  travel_style text[],
  preferred_airlines text[],
  preferred_hotels text[],
  budget_range text,
  notification_preferences jsonb,
  privacy_settings jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- TRIP MANAGEMENT
-- ============================================================================

-- Main trips table
CREATE TABLE IF NOT EXISTS trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  destination text NOT NULL,
  start_date date,
  end_date date,
  budget_cents bigint DEFAULT 0,
  currency char(3) DEFAULT 'USD',
  status text DEFAULT 'planning' CHECK (status IN ('planning', 'booked', 'completed', 'cancelled')),
  preferences jsonb,
  itinerary jsonb,
  is_favorite boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Trip items (flights, hotels, activities, etc.)
CREATE TABLE IF NOT EXISTS trip_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES trips(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('flight', 'hotel', 'activity', 'transport', 'note')),
  title text NOT NULL,
  description text,
  data jsonb NOT NULL DEFAULT '{}',
  price_cents bigint DEFAULT 0,
  currency char(3) DEFAULT 'USD',
  booked boolean DEFAULT false,
  booking_reference text,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- BOOKING & PAYMENT SYSTEM
-- ============================================================================

-- Shopping cart
CREATE TABLE IF NOT EXISTS carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  status text DEFAULT 'open' CHECK (status IN ('open', 'converted')),
  created_at timestamptz DEFAULT now()
);

-- Cart items
CREATE TABLE IF NOT EXISTS cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id uuid REFERENCES carts(id) ON DELETE CASCADE,
  item_type text NOT NULL CHECK (item_type IN ('flight', 'hotel', 'tour', 'activity')),
  external_id text NOT NULL,
  name text NOT NULL,
  price_cents int NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  quantity int DEFAULT 1,
  meta jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Trip bookings (final source of truth)
CREATE TABLE IF NOT EXISTS trip_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_id uuid REFERENCES trips(id) ON DELETE CASCADE,
  booking_type text NOT NULL CHECK (booking_type IN ('flight', 'hotel', 'bundle')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'canceled', 'failed')),
  total_amount_cents bigint NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  payment_intent_id text,
  confirmation_code text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Payment sessions (Stripe integration)
CREATE TABLE IF NOT EXISTS payment_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_checkout_session_id text UNIQUE,
  status text DEFAULT 'created' CHECK (status IN ('created', 'paid', 'expired')),
  cart_snapshot jsonb,
  created_at timestamptz DEFAULT now()
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  total_cents int NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
  created_at timestamptz DEFAULT now()
);

-- Order items
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  item_type text NOT NULL,
  external_id text NOT NULL,
  name text NOT NULL,
  price_cents int NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  quantity int NOT NULL,
  meta jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  stripe_payment_intent text,
  status text DEFAULT 'init' CHECK (status IN ('init', 'succeeded', 'failed')),
  amount_cents int NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  created_at timestamptz DEFAULT now()
);

-- Webhook events (for Stripe webhook deduplication)
CREATE TABLE IF NOT EXISTS webhook_events (
  id text PRIMARY KEY,
  processed_at timestamptz DEFAULT now()
);

-- ============================================================================
-- BUDGET & EXPENSE TRACKING
-- ============================================================================

-- Expense categories
CREATE TABLE IF NOT EXISTS categories (
  id serial PRIMARY KEY,
  name text UNIQUE NOT NULL
);

-- Insert default categories
INSERT INTO categories (name) VALUES 
  ('Flights'), ('Accommodation'), ('Food'), ('Transport'), 
  ('Activities'), ('Shopping'), ('Misc')
ON CONFLICT (name) DO NOTHING;

-- Expenses
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES trips(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id int REFERENCES categories(id),
  description text,
  amount_cents integer NOT NULL,
  currency char(3) DEFAULT 'USD',
  spent_at date DEFAULT current_date,
  created_at timestamptz DEFAULT now()
);

-- Budgets
CREATE TABLE IF NOT EXISTS budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES trips(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id int REFERENCES categories(id),
  budget_cents integer NOT NULL,
  currency char(3) DEFAULT 'USD',
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- ADD-ONS & GLOBAL CONTENT
-- ============================================================================

-- City profiles for global intelligence
CREATE TABLE IF NOT EXISTS city_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_name text NOT NULL,
  country text NOT NULL,
  city_type text[] DEFAULT '{}',
  population_size text,
  primary_language text DEFAULT 'en',
  currency text DEFAULT 'USD',
  cost_of_living_index decimal DEFAULT 1.0,
  transportation_types text[] DEFAULT '{}',
  cuisine_types text[] DEFAULT '{}',
  top_attractions text[] DEFAULT '{}',
  climate_zone text,
  latitude decimal,
  longitude decimal,
  airport_codes text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add-ons with global template support
CREATE TABLE IF NOT EXISTS addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text UNIQUE NOT NULL,
  item_type text NOT NULL CHECK (item_type IN ('meal', 'activity', 'transport')),
  title text NOT NULL,
  description text NOT NULL,
  price_cents int NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  city text NOT NULL,
  country text,
  provider text DEFAULT 'internal',
  template_id text,
  is_curated boolean DEFAULT false,
  popularity_score decimal DEFAULT 0,
  rating decimal DEFAULT 0,
  meta jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add-on templates (for AI generation)
CREATE TABLE IF NOT EXISTS addon_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id text UNIQUE NOT NULL,
  item_type text NOT NULL,
  title_template text NOT NULL,
  description_template text NOT NULL,
  base_price_cents int NOT NULL,
  applicable_city_types text[] DEFAULT '{}',
  pricing_factors jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- WALKING TOURS
-- ============================================================================

-- Tours
CREATE TABLE IF NOT EXISTS tours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_id uuid REFERENCES trips(id) ON DELETE CASCADE,
  city text NOT NULL,
  title text NOT NULL,
  pace text DEFAULT 'normal',
  distance_km numeric,
  source text DEFAULT 'ai',
  created_at timestamptz DEFAULT now()
);

-- Tour stops
CREATE TABLE IF NOT EXISTS tour_stops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id uuid REFERENCES tours(id) ON DELETE CASCADE,
  ord int NOT NULL,
  name text NOT NULL,
  blurb text,
  lat double precision,
  lng double precision,
  duration_min int,
  image_url text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(tour_id, ord)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Trip indexes
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trip_items_trip_id ON trip_items(trip_id);

-- Booking indexes
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_trip_bookings_user_id ON trip_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_sessions_user_id ON payment_sessions(user_id);

-- Expense indexes
CREATE INDEX IF NOT EXISTS idx_expenses_trip_id ON expenses(trip_id, spent_at DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);

-- Add-on indexes
CREATE INDEX IF NOT EXISTS idx_addons_city_type ON addons(city, item_type);
CREATE INDEX IF NOT EXISTS idx_addons_popularity ON addons(popularity_score DESC);
CREATE INDEX IF NOT EXISTS idx_city_profiles_name ON city_profiles(city_name, country);

-- Tour indexes
CREATE INDEX IF NOT EXISTS idx_tours_user_id ON tours(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tour_stops_tour_id ON tour_stops(tour_id, ord);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE tour_stops ENABLE ROW LEVEL SECURITY;

-- Public read access for global content
ALTER TABLE city_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE addon_templates ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Profiles policies
CREATE POLICY "profiles_read_own" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (id = auth.uid());

-- User preferences policies
CREATE POLICY "preferences_read_own" ON user_preferences FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "preferences_update_own" ON user_preferences FOR ALL USING (user_id = auth.uid());

-- Trips policies
CREATE POLICY "trips_read_own" ON trips FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "trips_crud_own" ON trips FOR ALL USING (user_id = auth.uid());

-- Trip items policies
CREATE POLICY "trip_items_read_own" ON trip_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM trips t WHERE t.id = trip_id AND t.user_id = auth.uid())
);
CREATE POLICY "trip_items_crud_own" ON trip_items FOR ALL USING (
  EXISTS (SELECT 1 FROM trips t WHERE t.id = trip_id AND t.user_id = auth.uid())
);

-- Cart policies
CREATE POLICY "carts_read_own" ON carts FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "carts_crud_own" ON carts FOR ALL USING (user_id = auth.uid());

CREATE POLICY "cart_items_read_own" ON cart_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM carts c WHERE c.id = cart_id AND c.user_id = auth.uid())
);
CREATE POLICY "cart_items_crud_own" ON cart_items FOR ALL USING (
  EXISTS (SELECT 1 FROM carts c WHERE c.id = cart_id AND c.user_id = auth.uid())
);

-- Booking policies
CREATE POLICY "bookings_read_own" ON trip_bookings FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "bookings_crud_own" ON trip_bookings FOR ALL USING (user_id = auth.uid());

CREATE POLICY "payment_sessions_read_own" ON payment_sessions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "payment_sessions_crud_own" ON payment_sessions FOR ALL USING (user_id = auth.uid());

-- Order policies
CREATE POLICY "orders_read_own" ON orders FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "orders_crud_own" ON orders FOR ALL USING (user_id = auth.uid());

CREATE POLICY "order_items_read_own" ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND o.user_id = auth.uid())
);
CREATE POLICY "order_items_crud_own" ON order_items FOR ALL USING (
  EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND o.user_id = auth.uid())
);

CREATE POLICY "payments_read_own" ON payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND o.user_id = auth.uid())
);
CREATE POLICY "payments_crud_own" ON payments FOR ALL USING (
  EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND o.user_id = auth.uid())
);

-- Expense policies
CREATE POLICY "expenses_read_own" ON expenses FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "expenses_crud_own" ON expenses FOR ALL USING (user_id = auth.uid());

CREATE POLICY "budgets_read_own" ON budgets FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "budgets_crud_own" ON budgets FOR ALL USING (user_id = auth.uid());

-- Tour policies
CREATE POLICY "tours_read_own" ON tours FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "tours_crud_own" ON tours FOR ALL USING (user_id = auth.uid());

CREATE POLICY "tour_stops_read_own" ON tour_stops FOR SELECT USING (
  EXISTS (SELECT 1 FROM tours t WHERE t.id = tour_id AND t.user_id = auth.uid())
);
CREATE POLICY "tour_stops_crud_own" ON tour_stops FOR ALL USING (
  EXISTS (SELECT 1 FROM tours t WHERE t.id = tour_id AND t.user_id = auth.uid())
);

-- Global content policies (public read, service role write)
CREATE POLICY "city_profiles_public_read" ON city_profiles FOR SELECT USING (true);
CREATE POLICY "city_profiles_service_write" ON city_profiles FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "addons_public_read" ON addons FOR SELECT USING (true);
CREATE POLICY "addons_service_write" ON addons FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "addon_templates_public_read" ON addon_templates FOR SELECT USING (true);
CREATE POLICY "addon_templates_service_write" ON addon_templates FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_trips_updated_at
  BEFORE UPDATE ON trips
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_city_profiles_updated_at
  BEFORE UPDATE ON city_profiles
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_addons_updated_at
  BEFORE UPDATE ON addons
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Seed Add-On Templates
INSERT INTO addon_templates (template_id, item_type, title_template, description_template, base_price_cents, applicable_city_types, pricing_factors) VALUES

-- Meal Templates
('meal_budget_daily', 'meal', 'Daily Meal Plan (Budget)', 'Simple, filling meals at local spots near your stay in {city}', 2500, '{}', '{"cost_of_living_multiplier": true}'),
('meal_street_food', 'meal', 'Street Food Explorer', 'Curated local street food spots and market vendors in {city}', 3500, '{}', '{"cost_of_living_multiplier": true}'),
('meal_foodie', 'meal', 'Foodie Experience', 'Signature dishes and top-rated restaurants in {city}', 6000, '{}', '{"cost_of_living_multiplier": true, "tourism_multiplier": 1.2}'),

-- Activity Templates  
('activity_highlights', 'activity', 'City Highlights Tour', 'Must-see landmarks and neighborhoods in {city} in one comprehensive tour', 4500, '{"urban", "historic", "cultural"}', '{"cost_of_living_multiplier": true}'),
('activity_food_tour', 'activity', 'Local Food Tour', 'Taste authentic local cuisine with a knowledgeable guide in {city}', 5500, '{}', '{"cost_of_living_multiplier": true}'),
('activity_outdoor', 'activity', 'Outdoor Adventure', 'Hiking, biking, or water activities near {city}', 6500, '{"coastal", "mountain", "nature"}', '{"cost_of_living_multiplier": true}'),
('activity_cultural', 'activity', 'Cultural Experience', 'Museums, galleries, and cultural sites in {city}', 4000, '{"historic", "cultural", "urban"}', '{"cost_of_living_multiplier": true}'),
('activity_nightlife', 'activity', 'Nightlife Tour', 'Experience {city}''s vibrant nightlife and entertainment scene', 5000, '{"urban", "cultural"}', '{"cost_of_living_multiplier": true}'),

-- Transport Templates
('transport_airport', 'transport', 'Airport Transfer', 'Private pickup from airport to your accommodation in {city}', 4500, '{}', '{"distance_multiplier": true}'),
('transport_transit', 'transport', 'Public Transit Pass', 'Unlimited rides on buses, metro, and local transport in {city}', 1500, '{"urban"}', '{"cost_of_living_multiplier": true}'),
('transport_bike', 'transport', 'Bike Day Pass', 'Explore {city} on two wheels with helmet and lock included', 2000, '{"urban", "coastal"}', '{"cost_of_living_multiplier": true}'),
('transport_rideshare', 'transport', 'Rideshare Credit Pack', 'Prepaid credits for convenient rides around {city}', 3000, '{"urban"}', '{"cost_of_living_multiplier": true}')
ON CONFLICT (template_id) DO NOTHING;

-- Seed Sample City Profiles
INSERT INTO city_profiles (city_name, country, city_type, population_size, currency, cost_of_living_index, transportation_types, cuisine_types, top_attractions, climate_zone) VALUES

('Austin', 'USA', '{"urban", "cultural", "music"}', 'large', 'USD', 1.0, '{"bus", "rideshare", "bike"}', '{"bbq", "tex_mex", "food_trucks"}', '{"South by Southwest", "Austin City Limits", "Zilker Park", "State Capitol"}', 'subtropical'),
('Paris', 'France', '{"urban", "historic", "cultural"}', 'mega', 'EUR', 1.2, '{"metro", "bus", "bike", "taxi"}', '{"french", "international", "pastry"}', '{"Eiffel Tower", "Louvre", "Notre-Dame", "Champs-Élysées"}', 'oceanic'),
('Tokyo', 'Japan', '{"urban", "cultural", "modern"}', 'mega', 'JPY', 1.1, '{"metro", "bus", "taxi", "walking"}', '{"japanese", "sushi", "ramen", "street_food"}', '{"Tokyo Skytree", "Senso-ji", "Shibuya Crossing", "Tsukiji Market"}', 'humid_subtropical'),
('Barcelona', 'Spain', '{"urban", "coastal", "cultural"}', 'large', 'EUR', 0.9, '{"metro", "bus", "bike", "walking"}', '{"spanish", "tapas", "seafood", "mediterranean"}', '{"Sagrada Familia", "Park Güell", "Las Ramblas", "Gothic Quarter"}', 'mediterranean'),
('Sydney', 'Australia', '{"urban", "coastal", "modern"}', 'large', 'AUD', 1.3, '{"bus", "ferry", "train", "rideshare"}', '{"australian", "seafood", "international"}', '{"Sydney Opera House", "Harbour Bridge", "Bondi Beach", "Royal Botanic Gardens"}', 'oceanic')
ON CONFLICT (city_name, country) DO NOTHING;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

-- This schema is now ready for your new Supabase project!
-- All tables, policies, indexes, and seed data have been created.










