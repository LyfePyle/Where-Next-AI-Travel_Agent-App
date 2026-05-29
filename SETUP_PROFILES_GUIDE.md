# 📋 Profiles Table Setup Guide

## ✅ **Updated SQL Script**

The `supabase/setup-profiles.sql` file now includes:
- ✅ **Idempotent policies** - Safe to re-run without errors
- ✅ **Auto-update `updated_at`** - Automatically updates timestamp on profile changes
- ✅ **Better error handling** - Won't fail if policies/triggers already exist

---

## 🚀 **Step-by-Step Setup**

### **Step 1: Run SQL Script**

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy the entire contents of `supabase/setup-profiles.sql`
6. Paste into the SQL Editor
7. Click **Run** (or press `Ctrl+Enter`)

**Expected Result**: ✅ Success message with no errors

---

### **Step 2: Create Demo User**

1. In Supabase Dashboard, go to **Authentication** → **Users**
2. Click **Add user** (or **Create new user**)
3. Fill in:
   - **Email**: `demo@example.com`
   - **Password**: `password123`
   - ✅ **Check "Confirm user"** (important!)
4. Click **Create user**

**Expected Result**: 
- ✅ User created
- ✅ Profile automatically created (via trigger)

---

### **Step 3: Verify Profile Was Created**

In SQL Editor, run:

```sql
SELECT * FROM public.profiles;
```

**Expected Result**: You should see a row with the demo user's ID

---

### **Step 4: Test Login in Your App**

1. Go to: `http://localhost:3000/auth/login`
2. Enter:
   - **Email**: `demo@example.com`
   - **Password**: `password123`
3. Click **Sign in**

**Expected Result**: 
- ✅ Login successful
- ✅ Redirects to home page
- ✅ No "profiles does not exist" error

---

### **Step 5: Test Protected Endpoint**

1. After logging in, test a protected endpoint:
   - Go to: `http://localhost:3000/api/trips?scope=my-trips`
   - Or use the browser console:
     ```javascript
     fetch('/api/trips?scope=my-trips')
       .then(r => r.json())
       .then(console.log)
     ```

**Expected Result**: 
- ✅ Returns `200 OK`
- ✅ Returns trips array (may be empty, which is fine)
- ✅ No authentication errors

---

## 🔍 **Troubleshooting**

### **Error: "policy already exists"**
- ✅ **Fixed!** The script now uses `drop policy if exists` before creating
- Just re-run the script - it's idempotent now

### **Error: "profiles does not exist"**
- Make sure you ran the SQL script completely
- Check that the table exists: `SELECT * FROM information_schema.tables WHERE table_name = 'profiles';`

### **Error: "trigger already exists"**
- ✅ **Fixed!** The script checks and drops existing triggers first
- Safe to re-run

### **Login works but API returns 401**
- Make sure you're logged in (check browser cookies)
- Try logging out and back in
- Check browser console for errors

### **Profile not created automatically**
- Check if trigger exists:
  ```sql
  SELECT trigger_name 
  FROM information_schema.triggers 
  WHERE event_object_schema = 'auth' 
  AND event_object_table = 'users';
  ```
- If missing, re-run the SQL script

---

## ✅ **Verification Checklist**

After setup, verify:

- [ ] SQL script ran without errors
- [ ] `profiles` table exists
- [ ] RLS policies exist (3 policies)
- [ ] Trigger `on_auth_user_created` exists
- [ ] Demo user created in Auth → Users
- [ ] Profile created automatically for demo user
- [ ] Can login at `/auth/login`
- [ ] Protected endpoint `/api/trips?scope=my-trips` returns 200

---

## 🎯 **What This Fixes**

- ✅ **"profiles does not exist" error** - Table is now created
- ✅ **Profile creation** - Automatic via trigger
- ✅ **RLS policies** - Users can only access their own profile
- ✅ **Auto-update timestamps** - `updated_at` updates automatically
- ✅ **Idempotent** - Safe to re-run the script

---

## 📝 **Optional: Lock Down Inserts**

If you want to prevent clients from inserting profiles directly (only allow server-side via trigger):

1. Remove the insert policy from the SQL script:
   ```sql
   -- Remove or comment out this policy:
   -- drop policy if exists "profiles_insert_own" on public.profiles;
   -- create policy "profiles_insert_own" ...
   ```

2. Profiles will only be created via the trigger when users sign up

**Note**: This is optional - the current setup allows both trigger and client-side inserts.

---

## 🎉 **Next Steps**

Once profiles are working:

1. ✅ Test the booking flow
2. ✅ Test protected API endpoints
3. ✅ Continue with booking flow fixes
4. ✅ Test end-to-end user flows

---

**You're all set!** The profiles table is now properly configured and ready to use.





