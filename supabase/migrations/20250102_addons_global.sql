-- City Profiles for Global Intelligence
CREATE TABLE IF NOT EXISTS public.city_profiles (
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
CREATE TABLE IF NOT EXISTS public.addons (
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
CREATE TABLE IF NOT EXISTS public.addon_templates (
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

-- RLS Policies
ALTER TABLE public.city_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addon_templates ENABLE ROW LEVEL SECURITY;

-- Public read access for city profiles and add-ons
CREATE POLICY "city_profiles_public_read" ON public.city_profiles FOR SELECT USING (true);
CREATE POLICY "addons_public_read" ON public.addons FOR SELECT USING (true);
CREATE POLICY "addon_templates_public_read" ON public.addon_templates FOR SELECT USING (true);

-- Only service role can write
CREATE POLICY "city_profiles_service_write" ON public.city_profiles FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "addons_service_write" ON public.addons FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "addon_templates_service_write" ON public.addon_templates FOR ALL USING (auth.role() = 'service_role');

-- Indexes for performance
CREATE INDEX idx_addons_city_type ON public.addons(city, item_type);
CREATE INDEX idx_addons_popularity ON public.addons(popularity_score DESC);
CREATE INDEX idx_city_profiles_name ON public.city_profiles(city_name, country);

-- Seed Add-On Templates (Universal patterns)
INSERT INTO public.addon_templates (template_id, item_type, title_template, description_template, base_price_cents, applicable_city_types, pricing_factors) VALUES

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
INSERT INTO public.city_profiles (city_name, country, city_type, population_size, currency, cost_of_living_index, transportation_types, cuisine_types, top_attractions, climate_zone) VALUES

('Austin', 'USA', '{"urban", "cultural", "music"}', 'large', 'USD', 1.0, '{"bus", "rideshare", "bike"}', '{"bbq", "tex_mex", "food_trucks"}', '{"South by Southwest", "Austin City Limits", "Zilker Park", "State Capitol"}', 'subtropical'),

('Bangkok', 'Thailand', '{"urban", "cultural", "historic"}', 'mega', 'THB', 0.3, '{"metro", "bus", "taxi", "tuk_tuk"}', '{"street_food", "thai", "international"}', '{"Grand Palace", "Wat Pho", "Chatuchak Market", "Khao San Road"}', 'tropical'),

('Paris', 'France', '{"urban", "historic", "cultural"}', 'mega', 'EUR', 1.4, '{"metro", "bus", "bike"}', '{"french", "fine_dining", "cafe"}', '{"Eiffel Tower", "Louvre", "Notre Dame", "Champs-Élysées"}', 'temperate'),

('Tokyo', 'Japan', '{"urban", "cultural", "modern"}', 'mega', 'JPY', 1.2, '{"metro", "train", "bus"}', '{"japanese", "sushi", "ramen"}', '{"Shibuya Crossing", "Senso-ji Temple", "Tokyo Skytree", "Harajuku"}', 'temperate'),

('Bali', 'Indonesia', '{"coastal", "cultural", "nature"}', 'medium', 'IDR', 0.4, '{"scooter", "taxi", "bike"}', '{"indonesian", "balinese", "international"}', '{"Uluwatu Temple", "Rice Terraces", "Mount Batur", "Ubud"}', 'tropical');

-- Seed Sample Add-Ons for Austin (curated examples)
INSERT INTO public.addons (sku, item_type, title, description, price_cents, currency, city, country, is_curated, popularity_score, meta) VALUES

-- Austin Meals
('MEAL-ATX-BASIC', 'meal', 'Daily Meal Plan (Austin)', 'Simple Texas meals at local spots - BBQ, Tex-Mex, and food trucks', 3500, 'USD', 'Austin', 'USA', true, 8.5, '{"meals_per_day": 3, "includes": ["breakfast", "lunch", "dinner"]}'),
('MEAL-ATX-BBQ', 'meal', 'Austin BBQ Pass', 'Credits at Franklin, la Barbecue, and other legendary BBQ joints', 5500, 'USD', 'Austin', 'USA', true, 9.2, '{"restaurant_count": 5, "includes_sides": true}'),

-- Austin Activities  
('ACT-ATX-MUSIC', 'activity', 'Live Music Crawl - Austin', 'Hosted tour of iconic venues on Sixth Street and Red River District', 4500, 'USD', 'Austin', 'USA', true, 9.0, '{"venue_count": 4, "duration_hours": 4}'),
('ACT-ATX-FOOD', 'activity', 'BBQ & Markets Walk', 'Smoky classics and covered market tastings with local guide', 5000, 'USD', 'Austin', 'USA', true, 8.8, '{"stops": 6, "duration_hours": 3}'),
('ACT-ATX-KAYAK', 'activity', 'Barton Springs Kayak', 'Guided paddle on Lady Bird Lake with gear included', 6500, 'USD', 'Austin', 'USA', true, 8.7, '{"duration_hours": 2, "includes_gear": true}'),

-- Austin Transport
('TXFR-ATX-AIRPORT', 'transport', 'Austin Airport Transfer (AUS)', 'Private pickup from Austin-Bergstrom to downtown area', 4500, 'USD', 'Austin', 'USA', true, 8.5, '{"pickup_time": "tracked", "vehicle_type": "sedan"}'),
('TRANSIT-ATX-PASS', 'transport', 'Austin Transit Day Pass', 'Unlimited rides on CapMetro buses and MetroRail', 1200, 'USD', 'Austin', 'USA', true, 7.5, '{"duration_days": 1, "includes": ["bus", "rail"]});

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_city_profiles_updated_at BEFORE UPDATE ON public.city_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_addons_updated_at BEFORE UPDATE ON public.addons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
