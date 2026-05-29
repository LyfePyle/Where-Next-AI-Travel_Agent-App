-- Migration: 002_rls_policies.sql
-- Description: Row Level Security policies for all tables
-- Created: 2024-12-30

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
