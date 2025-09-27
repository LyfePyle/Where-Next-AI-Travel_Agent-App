import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function seed() {
  console.log('🌱 Starting seed process...');

  try {
    // Create a demo user (in a real app, users would sign up)
    console.log('Creating demo user...');
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: 'demo@wherenext.com',
      password: 'demo123456',
      email_confirm: true,
      user_metadata: {
        name: 'Demo User',
        budget_range: 'comfortable',
        travel_preferences: ['culture', 'food', 'nature'],
        travel_status: 'planning',
        home_location: 'Los Angeles, CA',
        onboarding_completed: true
      }
    });

    if (authError && !authError.message.includes('already exists')) {
      throw authError;
    }

    const userId = authUser?.user?.id || 'demo-user-id';
    console.log(`✅ User created/exists: ${userId}`);

    // Create sample budgets
    console.log('Creating sample budgets...');
    const budgets = [
      {
        user_id: userId,
        name: 'European Adventure',
        description: 'Two-week trip through Europe',
        planned_amount: 4500,
        currency: 'USD',
        status: 'active'
      },
      {
        user_id: userId,
        name: 'Weekend Getaway',
        description: 'Quick trip to nearby city',
        planned_amount: 800,
        currency: 'USD',
        status: 'active'
      },
      {
        user_id: userId,
        name: 'Annual Travel Fund',
        description: 'Saving for next year\'s big trip',
        planned_amount: 8000,
        currency: 'USD',
        status: 'active'
      }
    ];

    const { data: budgetData, error: budgetError } = await supabase
      .from('budgets')
      .upsert(budgets, { onConflict: 'user_id,name' })
      .select();

    if (budgetError) {
      console.warn('Budget creation warning:', budgetError);
    } else {
      console.log(`✅ Created ${budgetData?.length} budgets`);
    }

    // Create sample trips
    console.log('Creating sample trips...');
    const trips = [
      {
        user_id: userId,
        title: 'Paris Adventure',
        city: 'Paris',
        country: 'France',
        start_date: '2025-06-15',
        end_date: '2025-06-22',
        status: 'planned',
        budget_total: 2800,
        currency: 'USD',
        meta: {
          ai_generated: true,
          vibes: ['culture', 'food', 'romance'],
          budget_style: 'comfortable'
        }
      },
      {
        user_id: userId,
        title: 'Tokyo Discovery',
        city: 'Tokyo',
        country: 'Japan',
        start_date: '2025-09-10',
        end_date: '2025-09-20',
        status: 'draft',
        budget_total: 4200,
        currency: 'USD',
        meta: {
          ai_generated: true,
          vibes: ['culture', 'food', 'technology'],
          budget_style: 'comfortable'
        }
      },
      {
        user_id: userId,
        title: 'Costa Rica Nature Trip',
        city: 'San José',
        country: 'Costa Rica',
        start_date: '2025-03-05',
        end_date: '2025-03-12',
        status: 'completed',
        budget_total: 1800,
        currency: 'USD',
        meta: {
          ai_generated: true,
          vibes: ['nature', 'adventure', 'wildlife'],
          budget_style: 'budget'
        }
      }
    ];

    const { data: tripData, error: tripError } = await supabase
      .from('trips')
      .upsert(trips, { onConflict: 'user_id,title' })
      .select();

    if (tripError) {
      console.warn('Trip creation warning:', tripError);
    } else {
      console.log(`✅ Created ${tripData?.length} trips`);
    }

    // Create sample trip items for the first trip
    if (tripData && tripData.length > 0) {
      console.log('Creating sample trip items...');
      const parisTrip = tripData.find(t => t.city === 'Paris');
      
      if (parisTrip) {
        const tripItems = [
          {
            trip_id: parisTrip.id,
            type: 'flight',
            title: 'LAX to CDG',
            description: 'Round-trip flight Los Angeles to Paris',
            data: {
              airline: 'Air France',
              departure: '2025-06-15T14:30:00Z',
              arrival: '2025-06-16T09:15:00Z',
              return_departure: '2025-06-22T11:00:00Z',
              return_arrival: '2025-06-22T15:45:00Z',
              class: 'Economy',
              stops: 0
            },
            price: 850,
            currency: 'USD',
            booked: true,
            booking_reference: 'AF123456'
          },
          {
            trip_id: parisTrip.id,
            type: 'hotel',
            title: 'Hotel des Grands Boulevards',
            description: 'Boutique hotel in the 2nd arrondissement',
            data: {
              address: '17 Boulevard Poissonnière, 75002 Paris',
              check_in: '2025-06-16',
              check_out: '2025-06-22',
              room_type: 'Deluxe Double Room',
              amenities: ['Free WiFi', 'Breakfast', 'Gym', 'Restaurant'],
              rating: 4.2
            },
            price: 180,
            currency: 'USD',
            booked: false
          },
          {
            trip_id: parisTrip.id,
            type: 'tour',
            title: 'Louvre Museum Skip-the-Line Tour',
            description: 'Guided tour of the world\'s largest art museum',
            data: {
              duration: '3 hours',
              group_size: 'Small group (12 max)',
              includes: ['Skip-the-line tickets', 'Professional guide', 'Headsets'],
              meeting_point: 'Louvre Museum main entrance',
              date: '2025-06-17',
              time: '10:00'
            },
            price: 65,
            currency: 'USD',
            booked: false
          }
        ];

        const { error: itemError } = await supabase
          .from('trip_items')
          .upsert(tripItems, { onConflict: 'trip_id,title' });

        if (itemError) {
          console.warn('Trip items creation warning:', itemError);
        } else {
          console.log(`✅ Created ${tripItems.length} trip items`);
        }
      }
    }

    // Create sample budget categories and expenses
    if (budgetData && budgetData.length > 0) {
      console.log('Creating sample budget categories...');
      const europeBudget = budgetData.find(b => b.name === 'European Adventure');
      
      if (europeBudget) {
        const categories = [
          {
            budget_id: europeBudget.id,
            name: 'Flights',
            description: 'Airfare and airport transfers',
            planned_amount: 1200,
            color: '#3B82F6'
          },
          {
            budget_id: europeBudget.id,
            name: 'Accommodation',
            description: 'Hotels and lodging',
            planned_amount: 1800,
            color: '#10B981'
          },
          {
            budget_id: europeBudget.id,
            name: 'Food & Dining',
            description: 'Restaurants and local cuisine',
            planned_amount: 800,
            color: '#F59E0B'
          },
          {
            budget_id: europeBudget.id,
            name: 'Activities & Tours',
            description: 'Sightseeing and experiences',
            planned_amount: 500,
            color: '#8B5CF6'
          },
          {
            budget_id: europeBudget.id,
            name: 'Transport',
            description: 'Local transportation',
            planned_amount: 200,
            color: '#EF4444'
          }
        ];

        const { data: categoryData, error: categoryError } = await supabase
          .from('categories')
          .upsert(categories, { onConflict: 'budget_id,name' })
          .select();

        if (categoryError) {
          console.warn('Categories creation warning:', categoryError);
        } else {
          console.log(`✅ Created ${categoryData?.length} categories`);
        }

        // Create sample expenses
        if (categoryData && categoryData.length > 0) {
          console.log('Creating sample expenses...');
          const flightCategory = categoryData.find(c => c.name === 'Flights');
          const foodCategory = categoryData.find(c => c.name === 'Food & Dining');
          
          const expenses = [
            {
              budget_id: europeBudget.id,
              category_id: flightCategory?.id,
              amount: 850,
              currency: 'USD',
              description: 'Round-trip flight to Paris',
              merchant: 'Air France',
              payment_method: 'Credit Card',
              paid_at: new Date().toISOString(),
              tags: ['flight', 'international']
            },
            {
              budget_id: europeBudget.id,
              category_id: foodCategory?.id,
              amount: 45,
              currency: 'USD',
              description: 'Dinner at local bistro',
              merchant: 'Le Petit Bistro',
              location: 'Paris, France',
              payment_method: 'Cash',
              paid_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday
              tags: ['dinner', 'local-cuisine']
            }
          ];

          const { error: expenseError } = await supabase
            .from('expenses')
            .upsert(expenses, { onConflict: 'budget_id,description,paid_at' });

          if (expenseError) {
            console.warn('Expenses creation warning:', expenseError);
          } else {
            console.log(`✅ Created ${expenses.length} expenses`);
          }
        }
      }
    }

    // Create sample cached prompts
    console.log('Creating sample cached prompts...');
    const cachedPrompts = [
      {
        key: 'trip_suggestions_paris_comfortable_culture_food',
        prompt_hash: 'abc123',
        value: {
          suggestions: [
            {
              id: 'cached_1',
              destination: 'Paris, France',
              city: 'Paris',
              country: 'France',
              description: 'City of Light with world-class museums and cuisine',
              estimatedTotal: 2800,
              highlights: ['Eiffel Tower', 'Louvre Museum', 'Notre-Dame', 'Seine River Cruise']
            }
          ],
          generated_at: new Date().toISOString()
        },
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        access_count: 5
      }
    ];

    const { error: cacheError } = await supabase
      .from('cached_prompts')
      .upsert(cachedPrompts, { onConflict: 'key' });

    if (cacheError) {
      console.warn('Cached prompts creation warning:', cacheError);
    } else {
      console.log(`✅ Created ${cachedPrompts.length} cached prompts`);
    }

    console.log('🎉 Seed process completed successfully!');
    console.log('');
    console.log('Demo user credentials:');
    console.log('Email: demo@wherenext.com');
    console.log('Password: demo123456');
    console.log('');
    console.log('You can now log in and see sample data in the app.');

  } catch (error) {
    console.error('❌ Seed process failed:', error);
    process.exit(1);
  }
}

// Run the seed function
seed();
