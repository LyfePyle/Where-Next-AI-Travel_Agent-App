-- Migration: 004_sample_data.sql
-- Description: Sample data for development and testing
-- Created: 2024-12-30

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
('transport_rideshare', 'transport', 'Rideshare Credit Pack', 'Prepaid credits for convenient rides around {city}', 3000, '{"urban"}', '{"cost_of_living_multiplier": true}')

ON CONFLICT (template_id) DO NOTHING;

-- Seed Sample City Profiles
INSERT INTO city_profiles (city_name, country, city_type, population_size, currency, cost_of_living_index, transportation_types, cuisine_types, top_attractions, climate_zone) VALUES

('Austin', 'USA', '{"urban", "cultural", "music"}', 'large', 'USD', 1.0, '{"bus", "rideshare", "bike"}', '{"bbq", "tex_mex", "food_trucks"}', '{"South by Southwest", "Austin City Limits", "Zilker Park", "State Capitol"}', 'subtropical'),

('Bangkok', 'Thailand', '{"urban", "cultural", "historic"}', 'mega', 'THB', 0.3, '{"metro", "bus", "taxi", "tuk_tuk"}', '{"street_food", "thai", "international"}', '{"Grand Palace", "Wat Pho", "Chatuchak Market", "Khao San Road"}', 'tropical'),

('Paris', 'France', '{"urban", "historic", "cultural"}', 'mega', 'EUR', 1.4, '{"metro", "bus", "bike"}', '{"french", "fine_dining", "cafe"}', '{"Eiffel Tower", "Louvre", "Notre Dame", "Champs-Élysées"}', 'temperate'),

('Tokyo', 'Japan', '{"urban", "cultural", "modern"}', 'mega', 'JPY', 1.2, '{"metro", "train", "bus"}', '{"japanese", "sushi", "ramen"}', '{"Shibuya Crossing", "Senso-ji Temple", "Tokyo Skytree", "Harajuku"}', 'temperate'),

('Bali', 'Indonesia', '{"coastal", "cultural", "nature"}', 'medium', 'IDR', 0.4, '{"scooter", "taxi", "bike"}', '{"indonesian", "balinese", "international"}', '{"Uluwatu Temple", "Rice Terraces", "Mount Batur", "Ubud"}', 'tropical')

ON CONFLICT (city_name, country) DO NOTHING;

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
('TRANSIT-ATX-PASS', 'transport', 'Austin Transit Day Pass', 'Unlimited rides on CapMetro buses and MetroRail', 1200, 'USD', 'Austin', 'USA', true, 7.5, '{"duration_days": 1, "includes": ["bus", "rail"]}')

ON CONFLICT (sku) DO NOTHING;
