-- Trip bookings (final source of truth)
CREATE TABLE IF NOT EXISTS trip_bookings (
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
CREATE TABLE IF NOT EXISTS payment_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  stripe_checkout_session_id text UNIQUE,
  status text DEFAULT 'created',       -- created | paid | expired
  cart_snapshot jsonb,
  created_at timestamptz DEFAULT now()
);

-- Optional: a compact confirmation table
CREATE TABLE IF NOT EXISTS booking_confirmations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES trip_bookings(id),
  user_id uuid REFERENCES auth.users(id),
  confirmation_payload jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE trip_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_confirmations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for trip_bookings
CREATE POLICY "Users can view own trip bookings" ON trip_bookings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trip bookings" ON trip_bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trip bookings" ON trip_bookings
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for payment_sessions
CREATE POLICY "Users can view own payment sessions" ON payment_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payment sessions" ON payment_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payment sessions" ON payment_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for booking_confirmations
CREATE POLICY "Users can view own booking confirmations" ON booking_confirmations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own booking confirmations" ON booking_confirmations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add indexes for hot paths
CREATE INDEX IF NOT EXISTS idx_trip_bookings_user_id ON trip_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_bookings_status ON trip_bookings(status);
CREATE INDEX IF NOT EXISTS idx_payment_sessions_user_id ON payment_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_sessions_stripe_id ON payment_sessions(stripe_checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_booking_confirmations_booking_id ON booking_confirmations(booking_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);
