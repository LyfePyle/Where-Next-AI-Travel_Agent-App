# 🗄️ Complete Supabase Setup Checklist

## ✅ What's Already Done (if you have a Supabase project)
- ✅ Supabase project created (or you need to create one)
- ✅ Environment variables configured (`.env.local`)

## 🔴 What's LEFT to Set Up

### **Step 1: Create/Verify Supabase Project**

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. **Create a new project** OR select your existing project
3. Wait for project to finish provisioning (~2 minutes)

### **Step 2: Get Your Supabase Credentials**

1. In your Supabase project dashboard, go to **Settings → API**
2. Copy these values to your `.env.local`:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ (Keep secret!)

### **Step 3: Run Database Schema** ⚠️ **REQUIRED**

You need to create all the database tables. Use the **unified schema** which includes everything:

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **"New Query"**
3. Copy the **ENTIRE** contents of: `supabase/migrations/20250102_unified_schema.sql`
4. Paste into SQL Editor
5. Click **"Run"** (or press Ctrl+Enter)
6. Wait for success message ✅

**This creates:**
- ✅ `profiles` - User profiles
- ✅ `user_preferences` - User settings
- ✅ `saved_trips` - User trip storage
- ✅ `carts` - Shopping carts
- ✅ `cart_items` - Cart contents
- ✅ `orders` - Orders
- ✅ `order_items` - Order items
- ✅ `payments` - Payment records
- ✅ `trip_bookings` - Trip bookings
- ✅ `payment_sessions` - Stripe sessions
- ✅ `booking_confirmations` - Booking confirmations
- ✅ `budgets` - Budget tracking
- ✅ `budget_categories` - Budget categories
- ✅ `expenses` - Expense tracking
- ✅ `city_profiles` - City data
- ✅ `addons` - Travel add-ons
- ✅ `addon_templates` - AI-generated add-ons

**Also includes:**
- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Security policies (users can only access their own data)
- ✅ Indexes for performance
- ✅ Triggers for automatic updates

### **Step 4: Run Additional Cart/Checkout Schema** (if needed)

If the unified schema doesn't have all cart tables, also run:
- `supabase/migrations/20250102_cart_checkout.sql`

### **Step 5: Run Add-Ons Schema** (if needed)

For add-ons functionality, also run:
- `supabase/migrations/20250102_addons_global.sql`

This includes:
- Sample city profiles
- Sample add-on templates
- Sample add-ons for Austin

### **Step 6: Verify Tables Created**

1. In Supabase Dashboard, go to **Database → Tables**
2. You should see all the tables listed above
3. If any are missing, check the SQL Editor for errors

### **Step 7: Verify RLS is Enabled**

1. Go to **Database → Tables**
2. Click on any table (e.g., `profiles`)
3. Go to **"Policies"** tab
4. You should see policies like "Users can view own profile"
5. If missing, the RLS policies didn't run - check the SQL output

### **Step 8: Test Authentication**

1. Restart your dev server: `npm run dev`
2. Try signing up at: `http://localhost:3000/auth/register`
3. If it works, you're set! ✅

### **Step 9: Test Database Connection**

Run this command:
```bash
npm run test:database
```

Or visit: `http://localhost:3000/api/db-health`

## 📋 Quick Setup Commands

```bash
# 1. Make sure you have .env.local with Supabase credentials
# 2. Restart dev server
npm run dev

# 3. Test database connection
npm run test:database

# 4. If you want to seed sample data (optional)
npm run db:seed
```

## 🐛 Troubleshooting

### **"Failed to fetch" Error**
- ✅ **Fixed by:** Adding Supabase credentials to `.env.local`
- ✅ **Verify:** Restart dev server after adding env vars

### **"Unauthorized" Error**
- ✅ **Fixed by:** Running the database schema (Step 3)
- ✅ **Verify:** Tables exist in Supabase Dashboard

### **"Table doesn't exist" Error**
- ✅ **Fixed by:** Running the unified schema SQL
- ✅ **Verify:** Check Database → Tables in Supabase

### **"Policy violation" Error**
- ✅ **Fixed by:** Ensuring RLS policies were created
- ✅ **Verify:** Check table policies in Supabase Dashboard

## 📊 What Each Schema File Does

| File | Purpose | When to Run |
|------|---------|-------------|
| `20250102_unified_schema.sql` | **Complete schema** - All tables, RLS, policies | **Run this first** ✅ |
| `20250102_cart_checkout.sql` | Cart & checkout tables (if not in unified) | If cart tables missing |
| `20250102_addons_global.sql` | Add-ons + sample data | If add-ons missing |
| `2025-setup.sql` | Alternative simpler schema | If unified doesn't work |

## ✅ Success Checklist

After setup, verify:
- [ ] Supabase project is active (not paused)
- [ ] Environment variables in `.env.local` are correct
- [ ] All tables exist in Database → Tables
- [ ] RLS is enabled on all tables (see Policies tab)
- [ ] Can sign up new user without errors
- [ ] Can log in successfully
- [ ] Can access dashboard

## 🎯 Next Steps After Setup

1. **Test Sign Up** - Create a test account
2. **Test Cart** - Try adding items to cart
3. **Test Budget** - Create a test budget
4. **Test Trips** - Save a test trip

---

**Your current error is fixed by:**
1. ✅ Adding Supabase credentials to `.env.local`
2. ✅ Running the database schema (Step 3 above)
3. ✅ Restarting your dev server

The "Failed to fetch" error happens because Supabase can't connect - either the project doesn't exist, is paused, or the credentials are wrong.







