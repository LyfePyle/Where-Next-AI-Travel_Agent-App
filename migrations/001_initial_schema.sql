-- Migration: 001_initial_schema.sql
-- Description: Initial database schema with all tables, RLS policies, and sample data
-- Created: 2024-12-30

-- Enable UUID extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ================================
-- USER MANAGEMENT
-- ================================

-- Profiles table (extends Supabase auth)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
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
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- ================================
-- TRIP MANAGEMENT
-- ================================

-- Saved trips table for user trip storage
CREATE TABLE IF NOT EXISTS saved_trips (
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
CREATE TABLE IF NOT EXISTS carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'open', -- open | converted
  created_at timestamptz DEFAULT now()
);

-- Cart Items
CREATE TABLE IF NOT EXISTS cart_items (
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
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_cents int NOT NULL,
  currency text NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending | paid | failed
  created_at timestamptz DEFAULT now()
);

-- Order Items
CREATE TABLE IF NOT EXISTS order_items (
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
CREATE TABLE IF NOT EXISTS payments (
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

-- ================================
-- ADD-ONS SYSTEM
-- ================================

-- City Profiles for Global Intelligence
CREATE TABLE IF NOT EXISTS city_profiles (
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
CREATE TABLE IF NOT EXISTS addons (
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
CREATE TABLE IF NOT EXISTS addon_templates (
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
CREATE TABLE IF NOT EXISTS budgets (
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
CREATE TABLE IF NOT EXISTS budget_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid REFERENCES budgets(id) ON DELETE CASCADE,
  name text NOT NULL,
  planned_amount numeric NOT NULL,
  color text DEFAULT '#3B82F6',
  created_at timestamptz DEFAULT now()
);

-- Expenses
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid REFERENCES budgets(id) ON DELETE CASCADE,
  category_id uuid REFERENCES budget_categories(id),
  amount numeric NOT NULL,
  description text,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now()
);
