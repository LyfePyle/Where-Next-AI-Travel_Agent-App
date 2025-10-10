-- Where Next AI Travel Agent - Fresh Complete Schema
-- This creates everything from scratch

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================
-- USER MANAGEMENT
-- ================================

-- Profiles table (extends Supabase auth)
CREATE TABLE profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- User preferences table
CREATE TABLE user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) UNIQUE,
  travel_style text[],
  preferred_airlines text[],
  preferred_hotels text[],
  budget_range text,
  notification_preferences jsonb,
  privacy_settings jsonb,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- ================================
-- TRIP MANAGEMENT
-- ================================

-- Saved trips table for user trip storage
CREATE TABLE saved_trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  title text NOT NULL,
  destination text NOT NULL,
  start_date date,
  end_date date,
  budget_cents bigint,
  currency text DEFAULT 'usd',
  preferences jsonb,
  itinerary jsonb,
  is_favorite boolean DEFAULT false,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- ================================
-- CART & ORDER SYSTEM
-- ================================

-- Carts
CREATE TABLE carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'open', -- open | converted
  created_at timestamptz DEFAULT now()
);

-- Cart Items
CREATE TABLE cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id uuid NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  item_type text NOT NULL,          -- 'flight' | 'hotel' | 'tour'
  external_id text NOT NULL,        -- provider offer id
  name text NOT NULL,
  price_cents int NOT NULL,
  currency text NOT NULL,
  quantity int NOT NULL DEFAULT 1,
  meta jsonb DEFAULT '{}'
);

-- Orders
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_cents int NOT NULL,
  currency text NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending | paid | failed
  created_at timestamptz DEFAULT now()
);

-- Order Items
CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_type text NOT NULL,
  external_id text NOT NULL,
  name text NOT NULL,
  price_cents int NOT NULL,
  currency text NOT NULL,
  quantity int NOT NULL,
  meta jsonb DEFAULT '{}'
);

-- Payments
CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  stripe_payment_intent text,
  status text NOT NULL DEFAULT 'init', -- init | succeeded | failed
  created_at timestamptz DEFAULT now()
);

-- ================================
-- BOOKING SYSTEM
-- ================================

-- Trip bookings (final source of truth)
CREATE TABLE trip_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  trip_id uuid REFERENCES saved_trips(id),
  booking_type text NOT NULL,          -- flight | hotel | bundle
  status text NOT NULL DEFAULT 'pending', -- pending | paid | canceled | failed
  total_amount_cents bigint NOT NULL,
  currency text NOT NULL DEFAULT 'usd',
  payment_intent_id text,
  confirmation_code text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Keep Stripe sessions we create
CREATE TABLE payment_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  stripe_checkout_session_id text UNIQUE,
  status text DEFAULT 'created',       -- created | paid | expired
  cart_snapshot jsonb,
  created_at timestamptz DEFAULT now()
);

-- Optional: a compact confirmation table
CREATE TABLE booking_confirmations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES trip_bookings(id),
  user_id uuid REFERENCES auth.users(id),
  confirmation_payload jsonb,
  created_at timestamptz DEFAULT now()
);

-- ================================
-- ADD-ONS SYSTEM
-- ================================

-- City Profiles for Global Intelligence
CREATE TABLE city_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_name TEXT NOT NULL,
  country TEXT NOT NULL,
  city_type TEXT[] DEFAULT '{}', -- ['coastal', 'historic', 'urban', 'mountain', 'cultural']
  population_size TEXT, -- 'small', 'medium', 'large', 'mega'
  primary_language TEXT DEFAULT 'en',
  currency TEXT DEFAULT 'USD',
  cost_of_living_index DECIMAL DEFAULT 1.0, -- multiplier vs baseline
  transportation_types TEXT[] DEFAULT '{}', -- ['metro', 'bus', 'bike', 'taxi', 'rideshare']
  cuisine_types TEXT[] DEFAULT '{}', -- ['local', 'international', 'street_food', 'fine_dining']
  top_attractions TEXT[] DEFAULT '{}',
  climate_zone TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  airport_codes TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add-Ons with Global Template Support
CREATE TABLE addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT UNIQUE NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('meal', 'activity', 'transport')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price_cents INT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  city TEXT NOT NULL,
  country TEXT,
  provider TEXT DEFAULT 'internal', -- 'internal', 'getyourguide', 'viator', 'uber', etc.
  template_id TEXT, -- for AI-generated content
  is_curated BOOLEAN DEFAULT FALSE, -- hand-crafted vs generated
  popularity_score DECIMAL DEFAULT 0,
  rating DECIMAL DEFAULT 0,
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add-On Templates (for AI generation)
CREATE TABLE addon_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id TEXT UNIQUE NOT NULL,
  item_type TEXT NOT NULL,
  title_template TEXT NOT NULL, -- "Daily Meal Plan ({city_type})"
  description_template TEXT NOT NULL,
  base_price_cents INT NOT NULL,
  applicable_city_types TEXT[] DEFAULT '{}',
  pricing_factors JSONB DEFAULT '{}', -- cost_of_living_multiplier, etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================
-- BUDGET SYSTEM
-- ================================

-- Budgets table
CREATE TABLE budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  name text NOT NULL,
  description text,
  planned_amount numeric NOT NULL,
  currency text DEFAULT 'USD',
  trip_id uuid REFERENCES saved_trips(id),
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Budget categories
CREATE TABLE budget_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid REFERENCES budgets(id) ON DELETE CASCADE,
  name text NOT NULL,
  planned_amount numeric NOT NULL,
  color text DEFAULT '#3B82F6',
  created_at timestamptz DEFAULT now()
);

-- Expenses
CREATE TABLE expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid REFERENCES budgets(id) ON DELETE CASCADE,
  category_id uuid REFERENCES budget_categories(id),
  amount numeric NOT NULL,
  description text,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- ================================
-- ROW LEVEL SECURITY
-- ================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE city_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE addon_templates ENABLE ROW LEVEL SECURITY;

-- ================================
-- RLS POLICIES
-- ================================

-- User data policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Trip policies
CREATE POLICY "Users can view own saved trips" ON saved_trips
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved trips" ON saved_trips
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved trips" ON saved_trips
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved trips" ON saved_trips
  FOR DELETE USING (auth.uid() = user_id);

-- Cart and order policies
CREATE POLICY "carts_owner" ON carts
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "cart_items_owner" ON cart_items
FOR ALL USING (auth.uid() = (select user_id from carts c where c.id = cart_id))
WITH CHECK (auth.uid() = (select user_id from carts c where c.id = cart_id));

CREATE POLICY "orders_owner" ON orders
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "order_items_owner" ON order_items
FOR ALL USING (auth.uid() = (select user_id from orders o where o.id = order_id))
WITH CHECK (auth.uid() = (select user_id from orders o where o.id = order_id));

CREATE POLICY "payments_owner" ON payments
FOR ALL USING (auth.uid() = (select user_id from orders o where o.id = order_id));

-- Booking policies
CREATE POLICY "Users can view own trip bookings" ON trip_bookings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trip bookings" ON trip_bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trip bookings" ON trip_bookings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own payment sessions" ON payment_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payment sessions" ON payment_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payment sessions" ON payment_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own booking confirmations" ON booking_confirmations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own booking confirmations" ON booking_confirmations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Budget policies
CREATE POLICY "Users can view own budgets" ON budgets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own budgets" ON budgets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budgets" ON budgets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own budgets" ON budgets
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own budget categories" ON budget_categories
  FOR SELECT USING (auth.uid() = (select user_id from budgets b where b.id = budget_id));

CREATE POLICY "Users can insert own budget categories" ON budget_categories
  FOR INSERT WITH CHECK (auth.uid() = (select user_id from budgets b where b.id = budget_id));

CREATE POLICY "Users can update own budget categories" ON budget_categories
  FOR UPDATE USING (auth.uid() = (select user_id from budgets b where b.id = budget_id));

CREATE POLICY "Users can delete own budget categories" ON budget_categories
  FOR DELETE USING (auth.uid() = (select user_id from budgets b where b.id = budget_id));

CREATE POLICY "Users can view own expenses" ON expenses
  FOR SELECT USING (auth.uid() = (select user_id from budgets b where b.id = budget_id));

CREATE POLICY "Users can insert own expenses" ON expenses
  FOR INSERT WITH CHECK (auth.uid() = (select user_id from budgets b where b.id = budget_id));

CREATE POLICY "Users can update own expenses" ON expenses
  FOR UPDATE USING (auth.uid() = (select user_id from budgets b where b.id = budget_id));

CREATE POLICY "Users can delete own expenses" ON expenses
  FOR DELETE USING (auth.uid() = (select user_id from budgets b where b.id = budget_id));

-- Public read access for city profiles and add-ons
CREATE POLICY "city_profiles_public_read" ON city_profiles FOR SELECT USING (true);
CREATE POLICY "addons_public_read" ON addons FOR SELECT USING (true);
CREATE POLICY "addon_templates_public_read" ON addon_templates FOR SELECT USING (true);

-- Only service role can write to public data
CREATE POLICY "city_profiles_service_write" ON city_profiles FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "addons_service_write" ON addons FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "addon_templates_service_write" ON addon_templates FOR ALL USING (auth.role() = 'service_role');

-- ================================
-- FUNCTIONS & TRIGGERS
-- ================================

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
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

CREATE TRIGGER update_saved_trips_updated_at
  BEFORE UPDATE ON saved_trips
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at
  BEFORE UPDATE ON budgets
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_city_profiles_updated_at 
  BEFORE UPDATE ON city_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_addons_updated_at 
  BEFORE UPDATE ON addons 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================
-- INDEXES FOR PERFORMANCE
-- ================================

-- User data indexes
CREATE INDEX idx_saved_trips_user_id ON saved_trips(user_id);
CREATE INDEX idx_saved_trips_destination ON saved_trips(destination);

-- Cart and order indexes
CREATE INDEX idx_carts_user_id ON carts(user_id);
CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_payments_order_id ON payments(order_id);

-- Booking indexes
CREATE INDEX idx_trip_bookings_user_id ON trip_bookings(user_id);
CREATE INDEX idx_trip_bookings_status ON trip_bookings(status);
CREATE INDEX idx_payment_sessions_user_id ON payment_sessions(user_id);
CREATE INDEX idx_payment_sessions_stripe_id ON payment_sessions(stripe_checkout_session_id);
CREATE INDEX idx_booking_confirmations_booking_id ON booking_confirmations(booking_id);

-- Budget indexes
CREATE INDEX idx_budgets_user_id ON budgets(user_id);
CREATE INDEX idx_budget_categories_budget_id ON budget_categories(budget_id);
CREATE INDEX idx_expenses_budget_id ON expenses(budget_id);
CREATE INDEX idx_expenses_category_id ON expenses(category_id);

-- Add-on indexes
CREATE INDEX idx_addons_city_type ON addons(city, item_type);
CREATE INDEX idx_addons_popularity ON addons(popularity_score DESC);
CREATE INDEX idx_city_profiles_name ON city_profiles(city_name, country);

-- ================================
-- SAMPLE DATA
-- ================================

-- Seed Add-On Templates (Universal patterns)
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
('transport_rideshare', 'transport', 'Rideshare Credit Pack', 'Prepaid credits for convenient rides around {city}', 3000, '{"urban"}', '{"cost_of_living_multiplier": true}');

-- Seed Sample City Profiles
INSERT INTO city_profiles (city_name, country, city_type, population_size, currency, cost_of_living_index, transportation_types, cuisine_types, top_attractions, climate_zone) VALUES

('Austin', 'USA', '{"urban", "cultural", "music"}', 'large', 'USD', 1.0, '{"bus", "rideshare", "bike"}', '{"bbq", "tex_mex", "food_trucks"}', '{"South by Southwest", "Austin City Limits", "Zilker Park", "State Capitol"}', 'subtropical'),

('Bangkok', 'Thailand', '{"urban", "cultural", "historic"}', 'mega', 'THB', 0.3, '{"metro", "bus", "taxi", "tuk_tuk"}', '{"street_food", "thai", "international"}', '{"Grand Palace", "Wat Pho", "Chatuchak Market", "Khao San Road"}', 'tropical'),

('Paris', 'France', '{"urban", "historic", "cultural"}', 'mega', 'EUR', 1.4, '{"metro", "bus", "bike"}', '{"french", "fine_dining", "cafe"}', '{"Eiffel Tower", "Louvre", "Notre Dame", "Champs-Élysées"}', 'temperate'),

('Tokyo', 'Japan', '{"urban", "cultural", "modern"}', 'mega', 'JPY', 1.2, '{"metro", "train", "bus"}', '{"japanese", "sushi", "ramen"}', '{"Shibuya Crossing", "Senso-ji Temple", "Tokyo Skytree", "Harajuku"}', 'temperate'),

('Bali', 'Indonesia', '{"coastal", "cultural", "nature"}', 'medium', 'IDR', 0.4, '{"scooter", "taxi", "bike"}', '{"indonesian", "balinese", "international"}', '{"Uluwatu Temple", "Rice Terraces", "Mount Batur", "Ubud"}', 'tropical');

-- Seed Sample Add-Ons for Austin (curated examples)
INSERT INTO addons (sku, item_type, title, description, price_cents, currency, city, country, is_curated, popularity_score, meta) VALUES

-- Austin Meals
('MEAL-ATX-BASIC', 'meal', 'Daily Meal Plan (Austin)', 'Simple Texas meals at local spots - BBQ, Tex-Mex, and food trucks', 3500, 'USD', 'Austin', 'USA', true, 8.5, '{"meals_per_day": 3, "includes": ["breakfast", "lunch", "dinner"]}'),
('MEAL-ATX-BBQ', 'meal', 'Austin BBQ Pass', 'Credits at Franklin, la Barbecue, and other legendary BBQ joints', 5500, 'USD', 'Austin', 'USA', true, 9.2, '{"restaurant_count": 5, "includes_sides": true}'),

-- Austin Activities  
('ACT-ATX-MUSIC', 'activity', 'Live Music Crawl - Austin', 'Hosted tour of iconic venues on Sixth Street and Red River District', 4500, 'USD', 'Austin', 'USA', true, 9.0, '{"venue_count": 4, "duration_hours": 4}'),
('ACT-ATX-FOOD', 'activity', 'BBQ & Markets Walk', 'Smoky classics and covered market tastings with local guide', 5000, 'USD', 'Austin', 'USA', true, 8.8, '{"stops": 6, "duration_hours": 3}'),
('ACT-ATX-KAYAK', 'activity', 'Barton Springs Kayak', 'Guided paddle on Lady Bird Lake with gear included', 6500, 'USD', 'Austin', 'USA', true, 8.7, '{"duration_hours": 2, "includes_gear": true}'),

-- Austin Transport
('TXFR-ATX-AIRPORT', 'transport', 'Austin Airport Transfer (AUS)', 'Private pickup from Austin-Bergstrom to downtown area', 4500, 'USD', 'Austin', 'USA', true, 8.5, '{"pickup_time": "tracked", "vehicle_type": "sedan"}'),
('TRANSIT-ATX-PASS', 'transport', 'Austin Transit Day Pass', 'Unlimited rides on CapMetro buses and MetroRail', 1200, 'USD', 'Austin', 'USA', true, 7.5, '{"duration_days": 1, "includes": ["bus", "rail"]}');
