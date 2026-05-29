# 🗄️ New Supabase Project Setup Guide

## 📋 **Complete Database Schema Created**

I've created a comprehensive database schema file: `supabase-new-project-schema.sql` that consolidates all the best features from your existing schemas.

## 🚀 **Step-by-Step Setup Instructions**

### **1. Create New Supabase Project**

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Click "New Project"**
3. **Choose your organization**
4. **Fill in project details**:
   - Project name: `where-next-travel-app`
   - Database password: (generate a strong password)
   - Region: Choose closest to your users
5. **Click "Create new project"**
6. **Wait for setup to complete** (2-3 minutes)

### **2. Get Your Supabase Credentials**

Once your project is ready:

1. **Go to Settings > API**
2. **Copy these values**:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

### **3. Run the Database Schema**

1. **Go to SQL Editor** in your Supabase dashboard
2. **Click "New Query"**
3. **Copy the entire contents** of `supabase-new-project-schema.sql`
4. **Paste into the SQL Editor**
5. **Click "Run"** (or Ctrl+Enter)
6. **Wait for completion** (should take 30-60 seconds)

### **4. Verify Schema Creation**

After running the schema, verify these tables were created:

**Core Tables:**
- ✅ `profiles`
- ✅ `user_preferences`
- ✅ `trips`
- ✅ `trip_items`

**Booking System:**
- ✅ `carts`
- ✅ `cart_items`
- ✅ `trip_bookings`
- ✅ `payment_sessions`
- ✅ `orders`
- ✅ `order_items`
- ✅ `payments`

**Budget Tracking:**
- ✅ `expenses`
- ✅ `budgets`
- ✅ `categories`

**Global Content:**
- ✅ `city_profiles`
- ✅ `addons`
- ✅ `addon_templates`

**Tours:**
- ✅ `tours`
- ✅ `tour_stops`

**System:**
- ✅ `webhook_events`

### **5. Update Your .env.local**

Add your new Supabase credentials to your `.env.local`:

```bash
# Supabase (NEW PROJECT)
NEXT_PUBLIC_SUPABASE_URL=https://your-new-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_new_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_new_service_role_key
```

### **6. Test Your Setup**

Run the API test to verify everything works:

```bash
npm run test:api
```

You should see:
- ✅ Supabase connection working
- ✅ Database tables accessible
- ✅ RLS policies active

## 🎯 **What's Included in the New Schema**

### **✅ Complete Feature Set:**

1. **User Management**
   - Profiles with extended user data
   - User preferences and settings
   - Automatic profile creation on signup

2. **Trip Management**
   - Full trip lifecycle (planning → booked → completed)
   - Trip items (flights, hotels, activities)
   - Budget tracking and expense management

3. **Booking & Payment System**
   - Shopping cart functionality
   - Stripe payment integration
   - Order management
   - Webhook event deduplication

4. **Global Content System**
   - City profiles for AI intelligence
   - Add-on templates for dynamic content
   - Curated add-ons with pricing

5. **Walking Tours**
   - AI-generated tour creation
   - Tour stops with GPS coordinates
   - Distance and duration tracking

6. **Security & Performance**
   - Row Level Security (RLS) on all tables
   - Proper indexes for performance
   - Automatic timestamp updates

### **✅ Seed Data Included:**

- **12 Add-on Templates** (meals, activities, transport)
- **5 Sample City Profiles** (Austin, Paris, Tokyo, Barcelona, Sydney)
- **7 Expense Categories** (Flights, Accommodation, Food, etc.)

## 🔧 **Next Steps After Setup**

1. **Test User Registration** - Create a test account
2. **Test Trip Creation** - Create a sample trip
3. **Test API Endpoints** - Verify all APIs work
4. **Configure Stripe** - Set up payment processing
5. **Add Real City Data** - Populate more city profiles

## ⚠️ **Important Notes**

- **Never share your service role key** - it bypasses RLS
- **Test with anon key first** - verify RLS is working
- **Backup your database** - before making major changes
- **Monitor usage** - Supabase has free tier limits

## 🆘 **Troubleshooting**

**If schema fails to run:**
- Check for syntax errors in SQL
- Ensure you have proper permissions
- Try running in smaller chunks

**If RLS policies don't work:**
- Verify user is authenticated
- Check policy conditions
- Test with service role key temporarily

**If performance is slow:**
- Check if indexes were created
- Monitor query performance in dashboard
- Consider adding more specific indexes

---

Your new Supabase project is now ready with a complete, production-ready database schema! 🎉










