-- Smart Arrival Timeline Database Schema (Fixed Version)

-- Add planning mode to existing trips table
ALTER TABLE trips 
ADD COLUMN IF NOT EXISTS planning_mode text 
  CHECK (planning_mode IN ('cheapest','fastest','easiest'))
  DEFAULT 'cheapest';

-- Airport profiles (editable catalog)
CREATE TABLE IF NOT EXISTS airports (
  iata text PRIMARY KEY,
  name text NOT NULL,
  city text NOT NULL,
  country text NOT NULL,
  lat double precision,
  lng double precision,
  timezone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Airport transport options
CREATE TABLE IF NOT EXISTS airport_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  iata text REFERENCES airports(iata) ON DELETE CASCADE,
  mode text CHECK (mode IN ('train','metro','bus','shuttle','taxi','rideshare','private')),
  name text NOT NULL,
  operator text,
  price_min numeric,
  price_max numeric,
  currency text DEFAULT 'USD',
  duration_min int,
  duration_max int,
  frequency_min int, -- minutes between services
  first_service time,
  last_service time,
  pickup_lat double precision,
  pickup_lng double precision,
  pickup_location text, -- e.g., "Terminal 1, Level 2"
  drop_hint text, -- e.g., "City Center, Central Station"
  ticket_hint text, -- e.g., "Buy at kiosk, QR code required"
  booking_url text,
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User's chosen transfer (logs to budget)
CREATE TABLE IF NOT EXISTS trip_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES trips(id) ON DELETE CASCADE,
  transfer_id uuid REFERENCES airport_transfers(id),
  choice_ts timestamptz DEFAULT now(),
  price numeric,
  currency text DEFAULT 'USD',
  memo text,
  created_at timestamptz DEFAULT now()
);

-- Travel Wallet (QR & docs)
CREATE TABLE IF NOT EXISTS travel_wallet_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES trips(id) ON DELETE CASCADE,
  title text NOT NULL,
  category text CHECK (category IN ('boarding_pass','train_ticket','hotel_qr','attraction','insurance','other')),
  start_ts timestamptz,
  end_ts timestamptz,
  file_url text,
  thumbnail_url text,
  qr_text text,
  barcode_text text,
  notes text,
  is_sensitive boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Trip itineraries (for storing generated plans)
CREATE TABLE IF NOT EXISTS trip_itineraries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES trips(id) ON DELETE CASCADE,
  title text NOT NULL,
  total_cost numeric,
  total_travel_minutes int,
  transfers_count int DEFAULT 0,
  overnight_count int DEFAULT 0,
  visa_flag boolean DEFAULT false,
  walking_load int CHECK (walking_load IN (0,1,2)) DEFAULT 1, -- 0=low,1=med,2=high
  language_help boolean DEFAULT false,
  planning_mode text CHECK (planning_mode IN ('cheapest','fastest','easiest')),
  raw jsonb,
  created_at timestamptz DEFAULT now()
);

-- RLS Policies (with IF NOT EXISTS handling)
ALTER TABLE airports ENABLE ROW LEVEL SECURITY;
ALTER TABLE airport_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE travel_wallet_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_itineraries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then recreate
DROP POLICY IF EXISTS "Public read access for airports" ON airports;
DROP POLICY IF EXISTS "Public read access for airport transfers" ON airport_transfers;
DROP POLICY IF EXISTS "Users can view their own trip transfers" ON trip_transfers;
DROP POLICY IF EXISTS "Users can view their own wallet items" ON travel_wallet_items;
DROP POLICY IF EXISTS "Users can view their own itineraries" ON trip_itineraries;

-- Public read access for airports and transfers (no auth required)
CREATE POLICY "Public read access for airports" ON airports
  FOR SELECT USING (true);

CREATE POLICY "Public read access for airport transfers" ON airport_transfers
  FOR SELECT USING (is_active = true);

-- User-specific access for trip data
CREATE POLICY "Users can view their own trip transfers" ON trip_transfers
  FOR ALL USING (
    trip_id IN (
      SELECT id FROM trips WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own wallet items" ON travel_wallet_items
  FOR ALL USING (
    trip_id IN (
      SELECT id FROM trips WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own itineraries" ON trip_itineraries
  FOR ALL USING (
    trip_id IN (
      SELECT id FROM trips WHERE user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_airport_transfers_iata ON airport_transfers(iata);
CREATE INDEX IF NOT EXISTS idx_trip_transfers_trip_id ON trip_transfers(trip_id);
CREATE INDEX IF NOT EXISTS idx_wallet_items_trip_id ON travel_wallet_items(trip_id);
CREATE INDEX IF NOT EXISTS idx_wallet_items_category ON travel_wallet_items(category);
CREATE INDEX IF NOT EXISTS idx_trip_itineraries_trip_id ON trip_itineraries(trip_id);

-- Sample data for Vancouver International Airport (YVR)
INSERT INTO airports (iata, name, city, country, lat, lng, timezone) VALUES
('YVR', 'Vancouver International Airport', 'Vancouver', 'Canada', 49.1967, -123.1815, 'America/Vancouver')
ON CONFLICT (iata) DO NOTHING;

INSERT INTO airport_transfers (iata, mode, name, operator, price_min, price_max, currency, duration_min, duration_max, frequency_min, first_service, last_service, pickup_location, drop_hint, ticket_hint, booking_url, notes) VALUES
('YVR', 'train', 'Canada Line SkyTrain', 'TransLink', 4.25, 4.25, 'CAD', 25, 35, 6, '05:00', '01:00', 'Terminal 1 & 2, Level 2', 'Waterfront Station (downtown)', 'Buy at kiosk or use Compass Card', 'https://www.translink.ca', 'Fastest option to downtown, runs every 6-7 minutes'),
('YVR', 'bus', 'Airport Express Bus', 'TransLink', 3.10, 3.10, 'CAD', 35, 50, 15, '05:00', '01:00', 'Terminal 1 & 2, Level 1', 'Various downtown stops', 'Buy at kiosk or use Compass Card', 'https://www.translink.ca', 'Cheaper but slower than SkyTrain'),
('YVR', 'taxi', 'Yellow Cab', 'Yellow Cab', 35, 45, 'CAD', 25, 40, 1, '00:00', '23:59', 'Terminal 1 & 2, Level 1', 'Downtown Vancouver', 'Pay driver, tip 15-20%', NULL, 'Convenient but most expensive option'),
('YVR', 'rideshare', 'Uber/Lyft', 'Uber/Lyft', 30, 40, 'CAD', 25, 40, 1, '00:00', '23:59', 'Terminal 1 & 2, Level 1', 'Downtown Vancouver', 'Book via app', 'https://uber.com', 'Convenient, surge pricing during peak hours'),
('YVR', 'shuttle', 'Airport Shuttle', 'Vancouver Airport Shuttle', 18, 25, 'CAD', 30, 45, 30, '06:00', '23:00', 'Terminal 1 & 2, Level 1', 'Downtown hotels', 'Pre-book online or pay driver', 'https://vancouverairportshuttle.com', 'Shared ride, good for hotels')
ON CONFLICT DO NOTHING;
