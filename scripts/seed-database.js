#!/usr/bin/env node

/**
 * Database Seed Script
 * Adds demo data for development and testing
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Demo data
const demoData = {
  // Demo user preferences (will be created automatically via trigger)
  trips: [
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      title: 'Tokyo Adventure',
      city: 'Tokyo',
      country: 'Japan',
      start_date: '2024-03-15',
      end_date: '2024-03-22',
      status: 'planned',
      budget_total: 3500,
      currency: 'USD'
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      title: 'Barcelona Getaway',
      city: 'Barcelona',
      country: 'Spain',
      start_date: '2024-05-10',
      end_date: '2024-05-17',
      status: 'draft',
      budget_total: 2800,
      currency: 'USD'
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440003',
      title: 'Iceland Road Trip',
      city: 'Reykjavik',
      country: 'Iceland',
      start_date: '2024-08-05',
      end_date: '2024-08-12',
      status: 'draft',
      budget_total: 2200,
      currency: 'USD'
    }
  ],

  budgets: [
    {
      id: '660e8400-e29b-41d4-a716-446655440001',
      trip_id: '550e8400-e29b-41d4-a716-446655440001',
      name: 'Tokyo Trip Budget',
      description: 'Complete budget for Tokyo adventure',
      planned_amount: 3500,
      currency: 'USD',
      status: 'active'
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440002',
      trip_id: '550e8400-e29b-41d4-a716-446655440002',
      name: 'Barcelona Budget',
      description: 'Budget for Barcelona getaway',
      planned_amount: 2800,
      currency: 'USD',
      status: 'active'
    }
  ],

  categories: [
    {
      budget_id: '660e8400-e29b-41d4-a716-446655440001',
      name: 'Flights',
      planned_amount: 1200,
      color: '#3B82F6'
    },
    {
      budget_id: '660e8400-e29b-41d4-a716-446655440001',
      name: 'Accommodation',
      planned_amount: 1000,
      color: '#10B981'
    },
    {
      budget_id: '660e8400-e29b-41d4-a716-446655440001',
      name: 'Food & Dining',
      planned_amount: 800,
      color: '#F59E0B'
    },
    {
      budget_id: '660e8400-e29b-41d4-a716-446655440001',
      name: 'Activities',
      planned_amount: 500,
      color: '#8B5CF6'
    }
  ],

  cached_prompts: [
    {
      key: 'popular_destinations_2024',
      prompt_hash: 'hash_popular_dest',
      value: {
        destinations: ['Tokyo', 'Barcelona', 'Iceland', 'Paris', 'Bali'],
        updated: '2024-01-01'
      },
      expires_at: '2024-12-31T23:59:59Z'
    },
    {
      key: 'budget_tips_general',
      prompt_hash: 'hash_budget_tips',
      value: {
        tips: [
          'Book flights on Tuesday or Wednesday',
          'Use public transport in cities',
          'Eat at local markets for authentic food',
          'Book accommodations in advance'
        ]
      },
      expires_at: '2024-12-31T23:59:59Z'
    }
  ]
};

async function seedDatabase() {
  console.log('🌱 Seeding Supabase Database...\n');

  try {
    // Note: We can't create auth users via the client, so we'll skip user-dependent data
    // In a real scenario, you'd need to sign up users first or use the service role key

    console.log('1️⃣ Seeding cached prompts...');
    for (const prompt of demoData.cached_prompts) {
      const { error } = await supabase
        .from('cached_prompts')
        .upsert(prompt, { onConflict: 'key' });
      
      if (error) {
        console.log(`❌ Error seeding cached prompt '${prompt.key}':`, error.message);
      } else {
        console.log(`✅ Cached prompt '${prompt.key}' seeded`);
      }
    }

    console.log('\n2️⃣ Testing user authentication...');
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('⚠️ No authenticated user found');
      console.log('To seed user-specific data (trips, budgets), you need to:');
      console.log('1. Sign up/login to create a user');
      console.log('2. Run this script while authenticated');
      console.log('3. Or use the Supabase service role key');
    } else {
      console.log('✅ Authenticated user found:', user.email);
      
      // Seed user-specific data
      console.log('\n3️⃣ Seeding trips...');
      for (const trip of demoData.trips) {
        const tripWithUser = { ...trip, user_id: user.id };
        const { error } = await supabase
          .from('trips')
          .upsert(tripWithUser, { onConflict: 'id' });
        
        if (error) {
          console.log(`❌ Error seeding trip '${trip.title}':`, error.message);
        } else {
          console.log(`✅ Trip '${trip.title}' seeded`);
        }
      }

      console.log('\n4️⃣ Seeding budgets...');
      for (const budget of demoData.budgets) {
        const budgetWithUser = { ...budget, user_id: user.id };
        const { error } = await supabase
          .from('budgets')
          .upsert(budgetWithUser, { onConflict: 'id' });
        
        if (error) {
          console.log(`❌ Error seeding budget '${budget.name}':`, error.message);
        } else {
          console.log(`✅ Budget '${budget.name}' seeded`);
        }
      }

      console.log('\n5️⃣ Seeding budget categories...');
      for (const category of demoData.categories) {
        const { error } = await supabase
          .from('categories')
          .insert(category);
        
        if (error && !error.message.includes('duplicate')) {
          console.log(`❌ Error seeding category '${category.name}':`, error.message);
        } else {
          console.log(`✅ Category '${category.name}' seeded`);
        }
      }
    }

    console.log('\n🎉 Database seeding completed!');
    console.log('\n📊 Seeded data:');
    console.log('- Cached prompts: 2 items');
    console.log('- Trips: 3 items (if authenticated)');
    console.log('- Budgets: 2 items (if authenticated)');
    console.log('- Categories: 4 items (if authenticated)');

    return true;

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    return false;
  }
}

// Run the seeding
seedDatabase()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('💥 Seed script failed:', error);
    process.exit(1);
  });








