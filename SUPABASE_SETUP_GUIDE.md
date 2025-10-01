# 🗄️ Supabase Database Setup Guide

## 📋 Prerequisites
- Supabase project created and configured
- Environment variables set in `.env.local`:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 🚀 Quick Setup (5 minutes)

### Step 1: Access Supabase Dashboard
1. Go to [supabase.com](https://supabase.com)
2. Sign in to your account
3. Open your project: `brumjujpccoftqqosyek` (from your env vars)

### Step 2: Run Database Schema
1. In Supabase Dashboard, go to **SQL Editor**
2. Click **"New Query"**
3. Copy the entire contents of `supabase/sql/2025-setup.sql`
4. Paste into the SQL editor
5. Click **"Run"** to execute

### Step 3: Verify Setup
After running the SQL, you should see these tables in **Database > Tables**:
- ✅ `trips` - Main trip records
- ✅ `trip_items` - Flight/hotel/activity details  
- ✅ `itineraries` - Day-by-day plans
- ✅ `budgets` - Budget tracking
- ✅ `categories` - Budget categories
- ✅ `expenses` - Expense records
- ✅ `ai_conversations` - AI chat history
- ✅ `cached_prompts` - AI response cache
- ✅ `webhooks_events` - Stripe/external events
- ✅ `audit_logs` - User action logs
- ✅ `user_preferences` - User settings

### Step 4: Test Database Connection
Run this command to test the connection:
```bash
npm run test:database
```

## 🔧 What the Schema Includes

### Core Features
- **Trip Management**: Full trip lifecycle from planning to completion
- **Budget Tracking**: Detailed expense tracking with categories
- **AI Integration**: Conversation history and response caching
- **User Preferences**: Settings and travel preferences
- **Audit Trail**: Complete action logging for debugging

### Security Features
- **Row Level Security (RLS)**: Users can only access their own data
- **Proper Policies**: Secure access patterns for all tables
- **Data Integrity**: Foreign key constraints and check constraints

### Performance Features
- **Optimized Indexes**: Fast queries for common operations
- **Automatic Cleanup**: Functions to clean expired cache and old logs
- **Efficient Relationships**: Proper table relationships and cascading

## 🎯 Next Steps After Setup

1. **Test Authentication**: Try signing up/logging in
2. **Create Sample Data**: Use the seed script to add demo data
3. **Test API Routes**: Verify CRUD operations work
4. **Enable Real-time**: Configure real-time subscriptions if needed

## 🐛 Troubleshooting

### Common Issues:
- **Permission Denied**: Make sure you're the project owner
- **Table Already Exists**: The script uses `if not exists` so it's safe to re-run
- **RLS Errors**: Check that policies are created correctly

### Getting Help:
- Check Supabase logs in Dashboard > Logs
- Test individual queries in SQL Editor
- Verify environment variables are correct

## 📊 Database Stats
- **Tables**: 11 core tables
- **Indexes**: 15 performance indexes  
- **Policies**: 12 RLS security policies
- **Functions**: 4 utility functions
- **Triggers**: 4 automated triggers

Ready to set up? Follow the steps above! 🚀

