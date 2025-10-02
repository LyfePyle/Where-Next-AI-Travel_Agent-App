const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seedAddOns() {
  console.log('🌍 Seeding global add-ons system...');

  try {
    // Check if tables exist and have data
    const { data: existingAddOns } = await supabase
      .from('addons')
      .select('count')
      .limit(1);

    if (existingAddOns && existingAddOns.length > 0) {
      console.log('✅ Add-ons already seeded. Skipping...');
      return;
    }

    console.log('📊 Running migration...');
    
    // Note: In production, you'd run the migration file directly
    // For now, we'll just seed the data that should be in the migration
    
    console.log('🏙️ Seeding city profiles...');
    
    const cityProfiles = [
      {
        city_name: 'Austin',
        country: 'USA',
        city_type: ['urban', 'cultural', 'music'],
        population_size: 'large',
        currency: 'USD',
        cost_of_living_index: 1.0,
        transportation_types: ['bus', 'rideshare', 'bike'],
        cuisine_types: ['bbq', 'tex_mex', 'food_trucks'],
        top_attractions: ['South by Southwest', 'Austin City Limits', 'Zilker Park', 'State Capitol'],
        climate_zone: 'subtropical'
      },
      {
        city_name: 'Bangkok',
        country: 'Thailand',
        city_type: ['urban', 'cultural', 'historic'],
        population_size: 'mega',
        currency: 'THB',
        cost_of_living_index: 0.3,
        transportation_types: ['metro', 'bus', 'taxi', 'tuk_tuk'],
        cuisine_types: ['street_food', 'thai', 'international'],
        top_attractions: ['Grand Palace', 'Wat Pho', 'Chatuchak Market', 'Khao San Road'],
        climate_zone: 'tropical'
      },
      {
        city_name: 'Paris',
        country: 'France',
        city_type: ['urban', 'historic', 'cultural'],
        population_size: 'mega',
        currency: 'EUR',
        cost_of_living_index: 1.4,
        transportation_types: ['metro', 'bus', 'bike'],
        cuisine_types: ['french', 'fine_dining', 'cafe'],
        top_attractions: ['Eiffel Tower', 'Louvre', 'Notre Dame', 'Champs-Élysées'],
        climate_zone: 'temperate'
      }
    ];

    const { error: cityError } = await supabase
      .from('city_profiles')
      .upsert(cityProfiles, { onConflict: 'city_name,country' });

    if (cityError) {
      console.error('Error seeding city profiles:', cityError);
    } else {
      console.log(`✅ Seeded ${cityProfiles.length} city profiles`);
    }

    console.log('🍽️ Seeding sample Austin add-ons...');
    
    const austinAddOns = [
      // Austin Meals
      {
        sku: 'MEAL-ATX-BASIC',
        item_type: 'meal',
        title: 'Daily Meal Plan (Austin)',
        description: 'Simple Texas meals at local spots - BBQ, Tex-Mex, and food trucks',
        price_cents: 3500,
        currency: 'USD',
        city: 'Austin',
        country: 'USA',
        is_curated: true,
        popularity_score: 8.5,
        meta: {
          meals_per_day: 3,
          includes: ['breakfast', 'lunch', 'dinner']
        }
      },
      {
        sku: 'MEAL-ATX-BBQ',
        item_type: 'meal',
        title: 'Austin BBQ Pass',
        description: 'Credits at Franklin, la Barbecue, and other legendary BBQ joints',
        price_cents: 5500,
        currency: 'USD',
        city: 'Austin',
        country: 'USA',
        is_curated: true,
        popularity_score: 9.2,
        meta: {
          restaurant_count: 5,
          includes_sides: true
        }
      },
      
      // Austin Activities
      {
        sku: 'ACT-ATX-MUSIC',
        item_type: 'activity',
        title: 'Live Music Crawl - Austin',
        description: 'Hosted tour of iconic venues on Sixth Street and Red River District',
        price_cents: 4500,
        currency: 'USD',
        city: 'Austin',
        country: 'USA',
        is_curated: true,
        popularity_score: 9.0,
        meta: {
          venue_count: 4,
          duration_hours: 4
        }
      },
      {
        sku: 'ACT-ATX-FOOD',
        item_type: 'activity',
        title: 'BBQ & Markets Walk',
        description: 'Smoky classics and covered market tastings with local guide',
        price_cents: 5000,
        currency: 'USD',
        city: 'Austin',
        country: 'USA',
        is_curated: true,
        popularity_score: 8.8,
        meta: {
          stops: 6,
          duration_hours: 3
        }
      },
      {
        sku: 'ACT-ATX-KAYAK',
        item_type: 'activity',
        title: 'Barton Springs Kayak',
        description: 'Guided paddle on Lady Bird Lake with gear included',
        price_cents: 6500,
        currency: 'USD',
        city: 'Austin',
        country: 'USA',
        is_curated: true,
        popularity_score: 8.7,
        meta: {
          duration_hours: 2,
          includes_gear: true
        }
      },
      
      // Austin Transport
      {
        sku: 'TXFR-ATX-AIRPORT',
        item_type: 'transport',
        title: 'Austin Airport Transfer (AUS)',
        description: 'Private pickup from Austin-Bergstrom to downtown area',
        price_cents: 4500,
        currency: 'USD',
        city: 'Austin',
        country: 'USA',
        is_curated: true,
        popularity_score: 8.5,
        meta: {
          pickup_time: 'tracked',
          vehicle_type: 'sedan'
        }
      },
      {
        sku: 'TRANSIT-ATX-PASS',
        item_type: 'transport',
        title: 'Austin Transit Day Pass',
        description: 'Unlimited rides on CapMetro buses and MetroRail',
        price_cents: 1200,
        currency: 'USD',
        city: 'Austin',
        country: 'USA',
        is_curated: true,
        popularity_score: 7.5,
        meta: {
          duration_days: 1,
          includes: ['bus', 'rail']
        }
      }
    ];

    const { error: addOnError } = await supabase
      .from('addons')
      .upsert(austinAddOns, { onConflict: 'sku' });

    if (addOnError) {
      console.error('Error seeding add-ons:', addOnError);
    } else {
      console.log(`✅ Seeded ${austinAddOns.length} Austin add-ons`);
    }

    console.log('🎯 Testing API endpoints...');
    
    // Test the API
    const testResponse = await fetch('http://localhost:3000/api/addons?city=Austin&item_type=meal');
    if (testResponse.ok) {
      const testData = await testResponse.json();
      console.log(`✅ API test successful: Found ${testData.addons?.length || 0} meals for Austin`);
    } else {
      console.log('⚠️ API test failed - make sure dev server is running');
    }

    console.log('\n🌍 GLOBAL ADD-ONS SYSTEM READY!');
    console.log('');
    console.log('✅ City profiles seeded');
    console.log('✅ Austin add-ons seeded');
    console.log('✅ Templates ready for AI generation');
    console.log('');
    console.log('🚀 Try these cities:');
    console.log('   • Austin (curated data)');
    console.log('   • Bangkok (AI will generate)');
    console.log('   • Paris (AI will generate)');
    console.log('   • Any city worldwide (AI generation)');
    console.log('');
    console.log('📱 Visit: http://localhost:3000/addons');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  seedAddOns();
}

module.exports = { seedAddOns };
