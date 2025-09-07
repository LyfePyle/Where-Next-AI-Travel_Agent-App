# Database Setup Guide

## 🗄️ Setting Up Your Supabase Database

### Step 1: Access Supabase SQL Editor
1. Go to: https://supabase.com/dashboard/project/brumjujpccoftqqosyek/sql
2. Click on "New Query" or the SQL Editor tab

### Step 2: Copy the Database Schema
1. Open the `database-setup.sql` file in your project
2. Select all content (Ctrl+A)
3. Copy it (Ctrl+C)

### Step 3: Execute the Schema
1. Paste the SQL into the Supabase SQL Editor
2. Click "Run" or press Ctrl+Enter
3. Wait for all statements to execute successfully

### Step 4: Verify Setup
After running the schema, you should see:
- ✅ All tables created in the `app` schema
- ✅ Row Level Security (RLS) enabled
- ✅ Policies created for data access control

### Step 5: Test Connection
Run the test script to verify everything is working:
```bash
node test-db-connection.js
```

## 📋 What the Schema Creates

The database schema will create:

### Tables:
- `app.profiles` - User profiles
- `app.trips` - Travel trips
- `app.itineraries` - Daily itineraries
- `app.itinerary_items` - Individual activities
- `app.expenses` - Expense tracking
- `app.categories` - Expense categories
- `app.savings_goals` - Savings goals
- `app.savings_contributions` - Savings contributions
- `app.tours` - Walking tours
- `app.tour_stops` - Tour stops

### Security:
- Row Level Security (RLS) policies
- User-specific data access
- Proper authentication integration

### Functions:
- `app.handle_new_user()` - Auto-create profiles
- `app.get_or_create_itinerary()` - Helper function

## 🔗 Quick Links
- **Supabase Dashboard**: https://supabase.com/dashboard/project/brumjujpccoftqqosyek
- **SQL Editor**: https://supabase.com/dashboard/project/brumjujpccoftqqosyek/sql
- **Table Editor**: https://supabase.com/dashboard/project/brumjujpccoftqqosyek/editor

## 🚨 Troubleshooting

If you encounter errors:
1. Make sure you're in the correct Supabase project
2. Check that the SQL syntax is valid
3. Ensure you have the necessary permissions
4. Try running statements one by one if needed
