-- Migration: 003_triggers_indexes.sql
-- Description: Triggers, functions, and indexes for performance
-- Created: 2024-12-30

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
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_saved_trips_updated_at ON saved_trips;
CREATE TRIGGER update_saved_trips_updated_at
  BEFORE UPDATE ON saved_trips
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_budgets_updated_at ON budgets;
CREATE TRIGGER update_budgets_updated_at
  BEFORE UPDATE ON budgets
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_city_profiles_updated_at ON city_profiles;
CREATE TRIGGER update_city_profiles_updated_at 
  BEFORE UPDATE ON city_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_addons_updated_at ON addons;
CREATE TRIGGER update_addons_updated_at 
  BEFORE UPDATE ON addons 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================
-- INDEXES FOR PERFORMANCE
-- ================================

-- User data indexes
CREATE INDEX IF NOT EXISTS idx_saved_trips_user_id ON saved_trips(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_trips_destination ON saved_trips(destination);
CREATE INDEX IF NOT EXISTS idx_saved_trips_created_at ON saved_trips(created_at DESC);

-- Cart and order indexes
CREATE INDEX IF NOT EXISTS idx_carts_user_id ON carts(user_id);
CREATE INDEX IF NOT EXISTS idx_carts_status ON carts(status);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_intent ON payments(stripe_payment_intent);

-- Booking indexes
CREATE INDEX IF NOT EXISTS idx_trip_bookings_user_id ON trip_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_bookings_status ON trip_bookings(status);
CREATE INDEX IF NOT EXISTS idx_trip_bookings_trip_id ON trip_bookings(trip_id);
CREATE INDEX IF NOT EXISTS idx_payment_sessions_user_id ON payment_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_sessions_stripe_id ON payment_sessions(stripe_checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_booking_confirmations_booking_id ON booking_confirmations(booking_id);

-- Budget indexes
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_status ON budgets(status);
CREATE INDEX IF NOT EXISTS idx_budget_categories_budget_id ON budget_categories(budget_id);
CREATE INDEX IF NOT EXISTS idx_expenses_budget_id ON expenses(budget_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_paid_at ON expenses(paid_at);

-- Add-on indexes
CREATE INDEX IF NOT EXISTS idx_addons_city_type ON addons(city, item_type);
CREATE INDEX IF NOT EXISTS idx_addons_popularity ON addons(popularity_score DESC);
CREATE INDEX IF NOT EXISTS idx_addons_sku ON addons(sku);
CREATE INDEX IF NOT EXISTS idx_city_profiles_name ON city_profiles(city_name, country);
CREATE INDEX IF NOT EXISTS idx_city_profiles_type ON city_profiles(city_type);
CREATE INDEX IF NOT EXISTS idx_addon_templates_type ON addon_templates(item_type);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_saved_trips_user_favorite ON saved_trips(user_id, is_favorite) WHERE is_favorite = true;
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_trip_bookings_user_status ON trip_bookings(user_id, status);
