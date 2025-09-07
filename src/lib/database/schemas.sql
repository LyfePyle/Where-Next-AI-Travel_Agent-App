-- Where Next AI Travel Agent - Complete Database Schema
-- Run this in Supabase Dashboard > SQL Editor
-- This creates all necessary tables for the complete travel app

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase auth)
CREATE TABLE IF NOT EXISTS profiles (
    id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email text,
    full_name text,
    avatar_url text,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
);

-- Trips table (core trip management)
CREATE TABLE IF NOT EXISTS trips (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    destination text NOT NULL,
    country text,
    city text,
    start_date date,
    end_date date,
    trip_duration integer,
    budget_amount decimal(10,2),
    budget_style text CHECK (budget_style IN ('budget', 'comfortable', 'luxury')),
    adults integer DEFAULT 1,
    kids integer DEFAULT 0,
    vibes text[],
    additional_details text,
    fit_score integer CHECK (fit_score >= 0 AND fit_score <= 100),
    estimated_total decimal(10,2),
    status text DEFAULT 'planning' CHECK (status IN ('planning', 'booked', 'completed', 'cancelled')),
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
);

-- Trip suggestions table (AI recommendations)
CREATE TABLE IF NOT EXISTS trip_suggestions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id uuid REFERENCES trips(id) ON DELETE CASCADE,
    destination text NOT NULL,
    country text,
    city text,
    fit_score integer CHECK (fit_score >= 0 AND fit_score <= 100),
    description text,
    weather_temp integer,
    weather_condition text,
    crowd_level text CHECK (crowd_level IN ('Low', 'Medium', 'High')),
    seasonality text,
    estimated_total decimal(10,2),
    flight_band_min decimal(10,2),
    flight_band_max decimal(10,2),
    hotel_band_min decimal(10,2),
    hotel_band_max decimal(10,2),
    hotel_style text,
    hotel_area text,
    highlights text[],
    why_it_fits text,
    created_at timestamp DEFAULT now()
);

-- Itineraries table (daily planning)
CREATE TABLE IF NOT EXISTS itineraries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id uuid REFERENCES trips(id) ON DELETE CASCADE,
    day_number integer NOT NULL,
    title text NOT NULL,
    activities text[],
    tips text,
    estimated_cost decimal(10,2),
    created_at timestamp DEFAULT now()
);

-- User preferences table (personalization)
CREATE TABLE IF NOT EXISTS user_preferences (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    preferred_airlines text[],
    preferred_hotel_chains text[],
    preferred_seat_class text DEFAULT 'economy',
    preferred_hotel_style text DEFAULT 'comfortable',
    max_flight_duration_hours integer DEFAULT 24,
    visa_requirements_important boolean DEFAULT false,
    accessibility_needs text[],
    dietary_restrictions text[],
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
);

-- Bookings table (payment tracking)
CREATE TABLE IF NOT EXISTS bookings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    trip_id uuid REFERENCES trips(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN ('flight', 'hotel', 'package')),
    booking_data jsonb NOT NULL,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    amount decimal(10,2) NOT NULL,
    currency text DEFAULT 'USD',
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
);

-- Payment transactions table (Stripe integration)
CREATE TABLE IF NOT EXISTS payment_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
    stripe_payment_intent_id text UNIQUE,
    amount decimal(10,2) NOT NULL,
    currency text DEFAULT 'USD',
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'cancelled')),
    payment_method text,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for trips
CREATE POLICY "Users can view own trips" ON trips FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own trips" ON trips FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own trips" ON trips FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own trips" ON trips FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for trip_suggestions
CREATE POLICY "Users can view own trip suggestions" ON trip_suggestions FOR SELECT USING (
    EXISTS (SELECT 1 FROM trips WHERE trips.id = trip_suggestions.trip_id AND trips.user_id = auth.uid())
);
CREATE POLICY "Users can insert own trip suggestions" ON trip_suggestions FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM trips WHERE trips.id = trip_suggestions.trip_id AND trips.user_id = auth.uid())
);

-- RLS Policies for itineraries
CREATE POLICY "Users can view own itineraries" ON itineraries FOR SELECT USING (
    EXISTS (SELECT 1 FROM trips WHERE trips.id = itineraries.trip_id AND trips.user_id = auth.uid())
);
CREATE POLICY "Users can insert own itineraries" ON itineraries FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM trips WHERE trips.id = itineraries.trip_id AND trips.user_id = auth.uid())
);

-- RLS Policies for user_preferences
CREATE POLICY "Users can view own preferences" ON user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own preferences" ON user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON user_preferences FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for bookings
CREATE POLICY "Users can view own bookings" ON bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own bookings" ON bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bookings" ON bookings FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for payment_transactions
CREATE POLICY "Users can view own transactions" ON payment_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON payment_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions" ON payment_transactions FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_destination ON trips(destination);
CREATE INDEX IF NOT EXISTS idx_trip_suggestions_trip_id ON trip_suggestions(trip_id);
CREATE INDEX IF NOT EXISTS idx_itineraries_trip_id ON itineraries(trip_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_trip_id ON bookings(trip_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_booking_id ON payment_transactions(booking_id);

-- Insert sample data for testing (optional)
-- INSERT INTO profiles (id, email, full_name) VALUES (auth.uid(), 'test@example.com', 'Test User');
