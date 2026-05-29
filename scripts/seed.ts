#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';

// Import environment variables directly
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Database Seeding Script
 * 
 * This script populates the database with sample data for development and testing.
 * It creates demo users, trips, and other sample data.
 */

async function seedDatabase() {
  console.log('🌱 Seeding database with sample data...\n');

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Check if we already have data
    const { data: existingTrips } = await supabase
      .from('saved_trips')
      .select('id')
      .limit(1);

    if (existingTrips && existingTrips.length > 0) {
      console.log('⚠️  Database already contains data. Skipping seed.');
      console.log('   To reset and reseed, run: npm run db:reset && npm run db:seed');
      return;
    }

    // Create demo user profile (this will be created automatically when user signs up)
    console.log('👤 Creating demo user profile...');
    
    // Note: In a real scenario, you'd create the user through Supabase Auth
    // For seeding, we'll just ensure the profile table is ready
    
    // Create sample trips
    console.log('✈️  Creating sample trips...');
    
    const sampleTrips = [
      {
        user_id: '00000000-0000-0000-0000-000000000000', // Placeholder - will be replaced with real user ID
        title: 'Weekend in Austin',
        destination: 'Austin, Texas',
        start_date: '2024-12-15',
        end_date: '2024-12-17',
        budget_cents: 150000, // $1,500
        currency: 'usd',
        preferences: {
          travel_style: ['urban', 'cultural'],
          budget_style: 'comfortable',
          interests: ['music', 'food', 'nightlife']
        },
        itinerary: {
          days: [
            {
              date: '2024-12-15',
              activities: [
                { time: '10:00', activity: 'Arrive at Austin-Bergstrom Airport', type: 'transport' },
                { time: '11:00', activity: 'Check into hotel downtown', type: 'accommodation' },
                { time: '12:00', activity: 'Lunch at Franklin Barbecue', type: 'meal' },
                { time: '14:00', activity: 'Explore South by Southwest venues', type: 'activity' },
                { time: '19:00', activity: 'Dinner at Uchi', type: 'meal' },
                { time: '21:00', activity: 'Live music on Sixth Street', type: 'activity' }
              ]
            },
            {
              date: '2024-12-16',
              activities: [
                { time: '09:00', activity: 'Breakfast at Veracruz All Natural', type: 'meal' },
                { time: '10:00', activity: 'Kayaking on Lady Bird Lake', type: 'activity' },
                { time: '13:00', activity: 'Lunch at food truck park', type: 'meal' },
                { time: '15:00', activity: 'Visit Texas State Capitol', type: 'activity' },
                { time: '18:00', activity: 'Dinner at La Barbecue', type: 'meal' },
                { time: '20:00', activity: 'Austin City Limits Music Festival', type: 'activity' }
              ]
            },
            {
              date: '2024-12-17',
              activities: [
                { time: '09:00', activity: 'Breakfast at Torchy\'s Tacos', type: 'meal' },
                { time: '10:00', activity: 'Explore Zilker Park', type: 'activity' },
                { time: '12:00', activity: 'Lunch at Salt Traders Coastal Cooking', type: 'meal' },
                { time: '14:00', activity: 'Depart from Austin-Bergstrom Airport', type: 'transport' }
              ]
            }
          ]
        },
        is_favorite: true
      },
      {
        user_id: '00000000-0000-0000-0000-000000000000',
        title: 'Cultural Tour of Paris',
        destination: 'Paris, France',
        start_date: '2025-03-20',
        end_date: '2025-03-27',
        budget_cents: 350000, // $3,500
        currency: 'usd',
        preferences: {
          travel_style: ['historic', 'cultural'],
          budget_style: 'luxury',
          interests: ['art', 'history', 'cuisine']
        },
        itinerary: {
          days: [
            {
              date: '2025-03-20',
              activities: [
                { time: '08:00', activity: 'Arrive at Charles de Gaulle Airport', type: 'transport' },
                { time: '10:00', activity: 'Check into hotel near Champs-Élysées', type: 'accommodation' },
                { time: '12:00', activity: 'Lunch at Café de Flore', type: 'meal' },
                { time: '14:00', activity: 'Visit the Louvre Museum', type: 'activity' },
                { time: '18:00', activity: 'Dinner at L\'Ambroisie', type: 'meal' },
                { time: '20:00', activity: 'Evening walk along the Seine', type: 'activity' }
              ]
            }
          ]
        },
        is_favorite: false
      }
    ];

    const { error: tripsError } = await supabase
      .from('saved_trips')
      .insert(sampleTrips);

    if (tripsError) {
      console.error('❌ Error creating sample trips:', tripsError);
    } else {
      console.log('   ✅ Sample trips created');
    }

    // Create sample budget
    console.log('💰 Creating sample budget...');
    
    const sampleBudget = {
      user_id: '00000000-0000-0000-0000-000000000000',
      name: 'Austin Weekend Budget',
      description: 'Budget for Austin weekend trip',
      planned_amount: 1500.00,
      currency: 'USD',
      status: 'active'
    };

    const { data: budgetData, error: budgetError } = await supabase
      .from('budgets')
      .insert(sampleBudget)
      .select()
      .single();

    if (budgetError) {
      console.error('❌ Error creating sample budget:', budgetError);
    } else {
      console.log('   ✅ Sample budget created');
      
      // Create budget categories
      const categories = [
        { budget_id: budgetData.id, name: 'Accommodation', planned_amount: 400.00, color: '#3B82F6' },
        { budget_id: budgetData.id, name: 'Food & Dining', planned_amount: 300.00, color: '#10B981' },
        { budget_id: budgetData.id, name: 'Activities', planned_amount: 200.00, color: '#F59E0B' },
        { budget_id: budgetData.id, name: 'Transportation', planned_amount: 150.00, color: '#8B5CF6' },
        { budget_id: budgetData.id, name: 'Miscellaneous', planned_amount: 50.00, color: '#6B7280' }
      ];

      const { error: categoriesError } = await supabase
        .from('budget_categories')
        .insert(categories);

      if (categoriesError) {
        console.error('❌ Error creating budget categories:', categoriesError);
      } else {
        console.log('   ✅ Budget categories created');
      }
    }

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📋 Sample data includes:');
    console.log('   - 2 sample trips (Austin weekend, Paris cultural tour)');
    console.log('   - 1 sample budget with 5 categories');
    console.log('   - City profiles and add-ons (from migration)');
    console.log('   - Add-on templates for AI generation');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Add package.json script
console.log('📦 Add this to your package.json scripts:');
console.log('   "db:seed": "tsx scripts/seed.ts"');
console.log('');

seedDatabase();