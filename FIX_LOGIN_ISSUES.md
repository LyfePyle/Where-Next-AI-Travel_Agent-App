# 🔧 Fix Login Issues - Step by Step Guide

## 🔍 **Diagnosing the Problem**

First, let's figure out what's wrong:

### **Step 1: Check Browser Console**
1. Open `http://localhost:3000/auth/login`
2. Press `F12` to open Developer Tools
3. Click the **Console** tab
4. Try to login
5. **Look for error messages** - copy them down

### **Step 2: Check for Error Messages on Page**
- Look for a **red error box** above the login form
- What does it say? (Copy the exact message)

### **Step 3: Check Network Tab**
1. In Developer Tools, click **Network** tab
2. Try to login
3. Look for requests to `/auth/v1/token` or similar
4. Check if they return errors (red status codes)

---

## 🐛 **Common Issues & Fixes**

### **Issue 1: "Invalid email or password"**

**Possible Causes:**
- User doesn't exist in Supabase
- Wrong password
- User not confirmed

**Solution:**
1. Go to Supabase Dashboard → Authentication → Users
2. Check if your user exists
3. If not, create it:
   - Email: `test@wherenext.app`
   - Password: `TestPassword2024!`
   - ✅ **Check "Auto Confirm User"**
4. If user exists, try resetting password or creating a new one

---

### **Issue 2: "profiles does not exist"**

**Solution:**
1. Go to Supabase Dashboard → SQL Editor
2. Run the SQL from `supabase/setup-profiles.sql`
3. Verify it worked:
   ```sql
   SELECT * FROM public.profiles;
   ```
4. If the user already exists, manually create their profile:
   ```sql
   INSERT INTO public.profiles (id)
   SELECT id FROM auth.users WHERE email = 'test@wherenext.app'
   ON CONFLICT (id) DO NOTHING;
   ```

---

### **Issue 3: Login succeeds but redirects back to login**

**This means:**
- Login worked, but session isn't being recognized
- Middleware thinks you're not authenticated

**Solution:**
1. **Clear browser cookies:**
   - Press `F12` → Application tab → Cookies → Delete all for `localhost:3000`
2. **Check environment variables:**
   - Make sure `.env.local` has:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
     ```
3. **Restart dev server:**
   - Stop the server (Ctrl+C)
   - Run `npm run dev` again
4. **Try login again**

---

### **Issue 4: "Network error" or "Failed to fetch"**

**Solution:**
1. Check Supabase project is active (not paused)
2. Verify environment variables are correct
3. Check internet connection
4. Try accessing Supabase Dashboard to confirm it's working

---

## ✅ **Quick Fix Checklist**

Run through these in order:

- [ ] **User exists in Supabase?**
  - Go to Supabase Dashboard → Authentication → Users
  - If not, create it with "Auto Confirm User" checked

- [ ] **Profiles table exists?**
  - Run `node verify-profiles-setup.js`
  - Or check in Supabase Dashboard → Database → Tables

- [ ] **Environment variables set?**
  - Check `.env.local` file exists
  - Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set

- [ ] **Dev server restarted?**
  - Stop server (Ctrl+C)
  - Run `npm run dev` again

- [ ] **Browser cookies cleared?**
  - F12 → Application → Cookies → Clear all for localhost:3000

- [ ] **Try "Continue as Guest" button**
  - This creates a temporary user and logs you in
  - If this works, the issue is with user creation/authentication

---

## 🧪 **Test Login Flow**

### **Test 1: Guest Preview (Easiest)**
1. Go to `/auth/login`
2. Click **"Continue as Guest (Preview)"**
3. Should redirect to `/dashboard`
4. If this works → Authentication system is fine, issue is with user accounts

### **Test 2: Demo Account**
1. Go to `/auth/login`
2. Click **"Try Demo Mode"**
3. Should redirect to `/dashboard`
4. If this works → Demo mode works, real auth might have issues

### **Test 3: Real Account**
1. Create user in Supabase Dashboard
2. Login with credentials
3. Check browser console for errors
4. Check if redirected properly

---

## 📋 **What to Share for Help**

If login still doesn't work, share:

1. **Error message** from the login page (red box)
2. **Console errors** (F12 → Console tab)
3. **Network errors** (F12 → Network tab, look for failed requests)
4. **What happens:**
   - Stays on login page?
   - Redirects but then back to login?
   - Shows error message?
5. **Which login method you tried:**
   - Manual login form?
   - Demo button?
   - Guest preview?

---

## 🎯 **Expected Behavior**

When login works correctly:

1. ✅ You enter email/password
2. ✅ Click "Sign in"
3. ✅ Page redirects to `/dashboard` (or homepage)
4. ✅ You can access protected pages
5. ✅ Profile icon appears in navigation
6. ✅ No error messages

If any of these don't happen, use the troubleshooting steps above!




