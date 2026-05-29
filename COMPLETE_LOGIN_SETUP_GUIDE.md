# 🔐 Complete Login Setup Guide - Step by Step

## ⚡ **QUICK START - Fix Login Issues Now**

**Run this command first:**
```bash
npm run login:diagnose
```

This will tell you exactly what's wrong. Then follow the fixes below.

---

## 📍 **WHERE WE ARE WITH LOGIN**

### **✅ What's Already Done**
- ✅ Login page UI (`src/app/auth/login/page.tsx`)
- ✅ Register page UI (`src/app/auth/register/page.tsx`)
- ✅ Authentication context (`src/contexts/AppContext.tsx`)
- ✅ Supabase client configured (`src/utils/supabase/client.ts`)
- ✅ OAuth callback route (`src/app/auth/callback/route.ts`)
- ✅ Middleware for protected routes (`middleware.ts`)
- ✅ Profiles table SQL ready (`supabase/setup-profiles.sql`)
- ✅ Debug page created (`src/app/auth/login-debug/page.tsx`)

### **⚠️ What's Not Working**
- ❌ Login fails (need to see exact error)
- ❌ Need to verify user exists in Supabase
- ❌ Need to verify profile is created
- ❌ Need to test end-to-end flow

---

## 🚀 **QUICK FIX - Run These Commands**

### **Option 1: Automated Diagnostic (Recommended)**
```bash
node scripts/diagnose-login.js
```
This will check everything and tell you exactly what's wrong.

### **Option 2: Automated Fix Attempt**
```bash
node scripts/fix-login-issues.js
```
This will try to fix issues automatically and guide you through manual steps.

### **Option 3: End-to-End Test**
```bash
node scripts/test-login-e2e.js
```
This tests the complete login flow and shows what's working/not working.

**Or use npm scripts:**
```bash
npm run login:diagnose    # Check what's wrong
npm run login:fix         # Try to fix automatically
npm run login:test        # Test the complete flow
```

---

## 🔧 **HOW TO FIX EACH PROBLEM**

### **Problem 1: Login Fails (Need to See Exact Error)**

**Solution:**
1. **Use the debug page** (easiest):
   - Go to: `http://localhost:3001/auth/login-debug`
   - Enter your email and password
   - Click "Test Login"
   - **Copy the exact error message** shown in red

2. **Or run diagnostic script**:
   ```bash
   npm run login:diagnose
   ```
   This will attempt login and show you the exact error.

3. **Common errors and fixes**:
   - **"Invalid login credentials"** → User doesn't exist or wrong password (see Problem 2)
   - **"Email not confirmed"** → User exists but needs confirmation (see Problem 2)
   - **"profiles does not exist"** → Profiles table not set up (see Problem 3)
   - **"Network error"** → Check `.env.local` has correct Supabase URL/key

---

### **Problem 2: Need to Verify User Exists in Supabase**

**Solution:**

**Option A: Check via Supabase Dashboard** (Visual)
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Click: **Authentication** → **Users**
4. Look for your test email: `test@wherenext.app`
5. If not found → Create it (see below)
6. If found → Check "Confirmed" column is **true**

**Option B: Check via SQL Editor** (Technical)
1. Go to: Supabase Dashboard → **SQL Editor**
2. Run this query:
   ```sql
   SELECT id, email, email_confirmed_at, created_at
   FROM auth.users
   WHERE email = 'test@wherenext.app';
   ```
3. If **0 rows** → User doesn't exist (create it)
4. If **1 row** but `email_confirmed_at` is NULL → User needs confirmation

**Create Test User:**
1. Go to: Supabase Dashboard → **Authentication** → **Users**
2. Click: **Add user** (or **Create new user**)
3. Fill in:
   - **Email**: `test@wherenext.app`
   - **Password**: `TestPassword2024!`
   - ✅ **IMPORTANT: Check "Auto Confirm User"** checkbox
4. Click: **Create user**

**Confirm Existing User:**
1. Find the user in Authentication → Users
2. Click on the user
3. Click: **"Confirm Email"** button (or toggle "Confirmed" to true)

---

### **Problem 3: Need to Verify Profile is Created**

**Solution:**

**Option A: Check via SQL Editor** (Recommended)
1. Go to: Supabase Dashboard → **SQL Editor**
2. Run this query:
   ```sql
   SELECT p.*, u.email, u.email_confirmed_at
   FROM public.profiles p
   JOIN auth.users u ON p.id = u.id
   WHERE u.email = 'test@wherenext.app';
   ```
3. **Expected**: Should return **1 row** with profile data
4. **If 0 rows** → Profile doesn't exist (see fixes below)

**Option B: Check via Diagnostic Script**
```bash
npm run login:diagnose
```
This will check if profile exists after attempting login.

**Fix: Profile Not Created**

**Step 1: Verify Profiles Table Exists**
Run in SQL Editor:
```sql
SELECT * FROM information_schema.tables 
WHERE table_name = 'profiles' AND table_schema = 'public';
```
If **0 rows** → Table doesn't exist (see Step 2)

**Step 2: Create Profiles Table**
1. Open file: `supabase/setup-profiles.sql`
2. Copy **ALL** contents
3. Go to: Supabase Dashboard → **SQL Editor**
4. Paste and click **Run**
5. Should see: "Success. No rows returned"

**Step 3: Verify Trigger Exists**
Run in SQL Editor:
```sql
SELECT trigger_name, action_timing, event_manipulation
FROM information_schema.triggers
WHERE event_object_schema = 'auth' 
AND event_object_table = 'users'
AND trigger_name = 'on_auth_user_created';
```
If **0 rows** → Trigger doesn't exist (re-run `setup-profiles.sql`)

**Step 4: Manually Create Profile (if trigger doesn't work)**
Run in SQL Editor (replace `USER_ID` with actual user ID):
```sql
-- First, get the user ID
SELECT id FROM auth.users WHERE email = 'test@wherenext.app';

-- Then create profile (replace USER_ID with the ID from above)
INSERT INTO public.profiles (id)
VALUES ('USER_ID')
ON CONFLICT (id) DO NOTHING;
```

---

### **Problem 4: Need to Test End-to-End Flow**

**Solution:**

**Option A: Automated Test Script** (Recommended)
```bash
npm run login:test
```
This tests:
- ✅ Environment variables
- ✅ Supabase connection
- ✅ User login
- ✅ Session creation
- ✅ Profile access
- ✅ Session persistence

**Option B: Manual Browser Test**
1. **Start dev server**:
   ```bash
   npm run dev
   ```

2. **Test login page**:
   - Go to: `http://localhost:3001/auth/login`
   - Enter: `test@wherenext.app` / `TestPassword2024!`
   - Click: **Sign in**
   - **Expected**: Redirects to `/dashboard`

3. **Test protected routes**:
   - Try accessing: `http://localhost:3001/dashboard`
   - **Expected**: Should work (not redirect to login)
   - Try: `http://localhost:3001/profile`
   - **Expected**: Should work

4. **Test session persistence**:
   - Login successfully
   - Close browser tab
   - Open new tab, go to: `http://localhost:3001/dashboard`
   - **Expected**: Should still be logged in

**Option C: Use Debug Page**
1. Go to: `http://localhost:3001/auth/login-debug`
2. Enter credentials
3. Click: **Test Login**
4. **Green box** = Success ✅
5. **Red box** = Error (see error message)

---

## 🚀 **COMPLETE SETUP STEPS**

### **Step 1: Verify Supabase Setup** (5 minutes)

#### **1.1 Check Environment Variables**
1. Open `.env.local` file
2. Verify these exist:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
3. If missing, get them from:
   - Supabase Dashboard → Settings → API
   - Copy "Project URL" and "anon public" key

#### **1.2 Verify Supabase Connection**
1. Run diagnostic:
   ```bash
   node verify-profiles-setup.js
   ```
2. Should show: "✅ Profiles table exists!"

---

### **Step 2: Set Up Profiles Table** (5 minutes)

#### **2.1 Run Profiles SQL**
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Click: **SQL Editor** (left sidebar)
4. Click: **New Query**
5. Open file: `supabase/setup-profiles.sql`
6. Copy **ALL** the contents
7. Paste into SQL Editor
8. Click: **Run** (or press Ctrl+Enter)
9. Should see: "Success. No rows returned"

#### **2.2 Verify Profiles Table**
In SQL Editor, run:
```sql
SELECT * FROM public.profiles;
```
Should return: Empty result (or existing profiles) - no errors!

---

### **Step 3: Create Test User** (3 minutes)

#### **3.1 Create User in Supabase**
1. Go to: Supabase Dashboard → **Authentication** → **Users**
2. Click: **Add user** (or **Create new user**)
3. Fill in:
   - **Email**: `test@wherenext.app`
   - **Password**: `TestPassword2024!`
   - ✅ **IMPORTANT: Check "Auto Confirm User"** (or "Confirm user")
4. Click: **Create user**

#### **3.2 Verify User Created**
1. You should see the user in the list
2. Click on the user
3. Check:
   - **Email**: `test@wherenext.app`
   - **Confirmed**: Should say `true` or `Yes`
   - **User ID**: Copy this (UUID format)

#### **3.3 Verify Profile Auto-Created**
In SQL Editor, run:
```sql
SELECT p.*, u.email, u.email_confirmed_at
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email = 'test@wherenext.app';
```

**Expected Result:**
- Should return **1 row**
- Should show profile with matching user ID
- If **0 rows**: Profile wasn't created (see troubleshooting)

---

### **Step 4: Test Login** (5 minutes)

#### **4.1 Use Debug Page (Easiest)**
1. Go to: `http://localhost:3001/auth/login-debug`
2. Enter:
   - Email: `test@wherenext.app`
   - Password: `TestPassword2024!`
3. Click: **Test Login**
4. **Check the result:**
   - ✅ **Success**: Shows green box with session info
   - ❌ **Error**: Shows red box with error message

#### **4.2 Use Regular Login Page**
1. Go to: `http://localhost:3001/auth/login`
2. Enter credentials
3. Click: **Sign in**
4. **Expected**: Redirects to `/dashboard`
5. **If fails**: Check error message on page

#### **4.3 Check Browser Console**
1. Press **F12** → **Console** tab
2. Try to log in
3. Look for error messages
4. Copy any red error text

---

### **Step 5: Verify Login Worked** (2 minutes)

#### **5.1 Check Redirect**
- After login, should be at: `http://localhost:3001/dashboard`
- Should NOT redirect back to login

#### **5.2 Check Protected Routes**
Try accessing:
- `/dashboard` → Should work
- `/saved` → Should work
- `/profile` → Should work

If any redirect to login → Session not being saved

#### **5.3 Check Navigation**
- Should see profile icon in top nav
- Should NOT see "Sign In" button (you're logged in)

---

## 🐛 **TROUBLESHOOTING**

### **Error: "Invalid email or password"**

**Possible Causes:**
1. User doesn't exist
2. Wrong password
3. User not confirmed

**Fix:**
1. Check user exists in Supabase Dashboard
2. Verify password is correct
3. Make sure "Auto Confirm User" was checked
4. If user not confirmed, click "Confirm Email" in Supabase

---

### **Error: "profiles does not exist"**

**Fix:**
1. Run `supabase/setup-profiles.sql` in SQL Editor
2. Verify table exists:
   ```sql
   SELECT * FROM information_schema.tables 
   WHERE table_name = 'profiles';
   ```

---

### **Error: "Profile RLS violation"**

**Fix:**
1. Make sure RLS policies exist:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'profiles';
   ```
2. Should show 3 policies (read, insert, update)
3. If missing, re-run `setup-profiles.sql`

---

### **Login Works But Redirects Back to Login**

**Possible Causes:**
1. Session not being saved
2. Cookies blocked
3. Middleware not recognizing session

**Fix:**
1. Clear browser cookies (F12 → Application → Cookies → Clear)
2. Restart dev server: `npm run dev`
3. Check `.env.local` has correct Supabase URL and key
4. Try incognito/private window

---

### **Profile Not Created Automatically**

**Fix:**
1. Check trigger exists:
   ```sql
   SELECT trigger_name 
   FROM information_schema.triggers 
   WHERE event_object_schema = 'auth' 
   AND trigger_name = 'on_auth_user_created';
   ```
2. If missing, re-run `setup-profiles.sql`
3. Or manually create profile:
   ```sql
   INSERT INTO public.profiles (id)
   SELECT id FROM auth.users WHERE email = 'test@wherenext.app'
   ON CONFLICT (id) DO NOTHING;
   ```

---

## ✅ **SUCCESS CHECKLIST**

Mark these off as you complete:

- [ ] Environment variables set in `.env.local`
- [ ] Profiles table created (SQL run successfully)
- [ ] Test user created in Supabase
- [ ] User is confirmed (Confirmed: true)
- [ ] Profile exists for user (SQL query returns 1 row)
- [ ] Login test shows success (debug page)
- [ ] Can access `/dashboard` after login
- [ ] Protected routes work (don't redirect to login)
- [ ] Navigation shows logged-in state

---

## 🎯 **QUICK REFERENCE**

### **Test Credentials**
- Email: `test@wherenext.app`
- Password: `TestPassword2024!`

### **Key URLs**
- Login: `http://localhost:3001/auth/login`
- Debug: `http://localhost:3001/auth/login-debug`
- Dashboard: `http://localhost:3001/dashboard`

### **Key Files**
- Login page: `src/app/auth/login/page.tsx`
- Auth context: `src/contexts/AppContext.tsx`
- Profiles SQL: `supabase/setup-profiles.sql`
- Middleware: `middleware.ts`

### **Supabase Dashboard**
- Users: Authentication → Users
- SQL Editor: SQL Editor (left sidebar)
- Providers: Authentication → Providers

---

## 📋 **COMPLETE SETUP ORDER**

Do these in order:

1. ✅ Verify `.env.local` has Supabase credentials
2. ✅ Run `supabase/setup-profiles.sql` in Supabase SQL Editor
3. ✅ Create test user in Supabase Dashboard
4. ✅ Verify profile was created (SQL query)
5. ✅ Test login on debug page
6. ✅ Test login on regular page
7. ✅ Verify can access protected routes
8. ✅ Done! 🎉

---

**Follow these steps in order, and login should work!** 🚀




