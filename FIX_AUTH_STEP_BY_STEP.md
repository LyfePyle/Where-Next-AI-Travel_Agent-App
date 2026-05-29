# 🔐 Fix Authentication - Step by Step Guide

**Goal**: Fix the "profiles does not exist" error so users can log in

**Time**: 5 minutes

---

## ✅ Step 1: Run the SQL File in Supabase

### A. Open Supabase Dashboard
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New Query"** button

### B. Copy and Run the SQL
1. Open the file: `supabase/setup-profiles.sql` in your code editor
2. **Select All** (Ctrl+A / Cmd+A)
3. **Copy** (Ctrl+C / Cmd+C)
4. **Paste** into the Supabase SQL Editor
5. Click **"Run"** button (or press Ctrl+Enter / Cmd+Enter)

### C. Check for Success
You should see:
- ✅ **"Success. No rows returned"** or
- ✅ **"Success"** message

**If you see errors:**
- "relation already exists" → ✅ This is OK, table already exists
- "policy already exists" → ✅ This is OK, safe to ignore
- "trigger already exists" → ✅ This is OK, safe to ignore
- Any other error → Copy the error message and check troubleshooting below

---

## ✅ Step 2: Verify It Worked

### A. Run Verification Query
In the same SQL Editor, run:

```sql
select * from public.profiles limit 5;
```

**Expected Result:**
- ✅ Query runs without error
- ✅ Returns empty table `(0 rows)` OR shows existing profiles
- ✅ No "does not exist" error

**If you get an error:**
- ❌ "relation 'profiles' does not exist" → SQL didn't run correctly, go back to Step 1
- ❌ "permission denied" → Check you're using the correct Supabase project

### B. Verify Trigger Exists (Optional)
Run this query to check the trigger:

```sql
select trigger_name, action_timing, event_manipulation
from information_schema.triggers
where event_object_schema = 'auth' 
and event_object_table = 'users'
and trigger_name = 'on_auth_user_created';
```

**Expected Result:**
- ✅ Returns 1 row showing the trigger exists

### C. Verify RLS Policies (Optional)
Run this query:

```sql
select * from pg_policies where tablename = 'profiles';
```

**Expected Result:**
- ✅ Returns 3 rows (profiles_read_own, profiles_insert_own, profiles_update_own)

---

## ✅ Step 3: Test Authentication

### A. Create a Test User (If Needed)
1. Go to Supabase Dashboard → **Authentication** → **Users**
2. Click **"Add user"** or **"Create new user"**
3. Fill in:
   - **Email**: `demo@example.com`
   - **Password**: `password123`
   - ✅ **Check "Auto Confirm User"** (IMPORTANT!)
4. Click **"Create user"**

### B. Verify Profile Was Created
After creating the user, run:

```sql
select * from public.profiles;
```

**Expected Result:**
- ✅ Shows 1 row with the new user's profile
- ✅ Profile was created automatically by the trigger

**If profile wasn't created:**
- The trigger might not be working
- Re-run `supabase/setup-profiles.sql` and make sure Step 6 (trigger creation) ran successfully

### C. Test Login
1. Go to: `http://localhost:3000/auth/login`
2. Enter:
   - **Email**: `demo@example.com`
   - **Password**: `password123`
3. Click **"Sign in"**

**Expected Result:**
- ✅ Login successful
- ✅ Redirects to home page or dashboard
- ✅ No "profiles does not exist" error

**If login still fails:**
- Check browser console (F12) for error messages
- Verify user was created in Supabase Dashboard
- Verify profile exists: `select * from public.profiles;`
- Try logging out and back in

---

## ✅ Step 4: Run Verification Script (Optional)

Run the automated verification:

```bash
node verify-profiles-setup.js
```

This will check:
- ✅ Profiles table exists
- ✅ RLS is configured
- ✅ Number of profiles
- ✅ Authentication connection

---

## 🐛 Troubleshooting

### Error: "relation 'profiles' does not exist"
**Cause**: SQL file didn't run successfully

**Solution**:
1. Check you're in the correct Supabase project
2. Make sure you copied the ENTIRE file (all 123 lines)
3. Try running the SQL in smaller chunks:
   - First: Steps 1-2 (table creation)
   - Then: Steps 3-6 (policies and trigger)

### Error: "permission denied"
**Cause**: Wrong Supabase project or insufficient permissions

**Solution**:
1. Verify you're the project owner or have admin access
2. Check you're in the correct project in Supabase Dashboard

### Error: "trigger already exists"
**Status**: ✅ This is OK! The script is idempotent (safe to re-run)

**Solution**: Ignore this error, it means the trigger already exists

### Profile Not Created After User Signup
**Cause**: Trigger not working

**Solution**:
1. Re-run `supabase/setup-profiles.sql` completely
2. Verify Step 6 (trigger creation) ran without errors
3. Check trigger exists: Run the trigger verification query from Step 2B
4. Manually create profile for existing users:
   ```sql
   INSERT INTO public.profiles (id)
   SELECT id FROM auth.users
   WHERE id NOT IN (SELECT id FROM public.profiles);
   ```

### Login Still Fails After Setup
**Cause**: Multiple possible issues

**Solution**:
1. Check browser console (F12) for specific error
2. Verify user exists: Supabase Dashboard → Authentication → Users
3. Verify user is confirmed: Should say "Confirmed: true"
4. Verify profile exists: `select * from public.profiles;`
5. Clear browser cache and cookies
6. Try incognito/private browsing mode

---

## ✅ Success Checklist

After completing all steps, you should have:

- [ ] ✅ Profiles table exists (`select * from public.profiles;` works)
- [ ] ✅ RLS policies created (3 policies exist)
- [ ] ✅ Trigger exists (`on_auth_user_created` trigger on `auth.users`)
- [ ] ✅ Test user created in Supabase
- [ ] ✅ Profile auto-created for test user
- [ ] ✅ Login works at `/auth/login`
- [ ] ✅ No "profiles does not exist" errors

---

## 🎯 What This Fixes

After running this setup:

✅ **Users can log in** - No more "profiles does not exist" error  
✅ **Users can register** - Profiles auto-created on signup  
✅ **Protected routes work** - Authentication checks pass  
✅ **User data accessible** - Profile queries work  

---

## 📝 Next Steps After Fixing Auth

Once authentication is working:

1. **Test Protected Endpoints**
   - Try: `http://localhost:3000/api/trips?scope=my-trips`
   - Should return trips (may be empty array, which is fine)

2. **Continue with Booking Flow**
   - See: `PLAN_OF_ATTACK.md` → Phase 1.2

3. **Fix Cart System**
   - See: `PLAN_OF_ATTACK.md` → Phase 1.3

---

## 📚 Related Files

- `supabase/setup-profiles.sql` - The SQL file to run
- `verify-profiles-setup.js` - Verification script
- `COMPREHENSIVE_PROJECT_BREAKDOWN.md` - Full project details
- `PLAN_OF_ATTACK.md` - Next steps after fixing auth

---

**Once you complete these steps, authentication should be working!** 🎉



