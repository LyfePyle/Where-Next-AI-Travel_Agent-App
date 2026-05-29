# 🔐 Quick Supabase Auth Setup Guide

## 🚨 **Current Issue**

Error: `"Unsupported provider: provider is not enabled"`

This means the OAuth provider (Google) needs to be enabled in your Supabase dashboard.

---

## ✅ **Step 1: Enable Google OAuth (Quick Setup)**

### **Option A: Quick Test (No OAuth Credentials Needed)**

For testing, you can enable Google without full OAuth setup:

1. Go to **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project
3. Go to **Authentication** → **Providers** (left sidebar)
4. Find **Google** in the list
5. Toggle it **ON** (even without credentials, it will work for testing)
6. Click **Save**

**Note**: For production, you'll need actual Google OAuth credentials. But for local testing, just enabling it is enough.

---

### **Option B: Full Google OAuth Setup (For Production)**

If you want full Google OAuth:

1. **Get Google Credentials**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create/select a project
   - Go to **APIs & Services** → **Credentials**
   - Create **OAuth 2.0 Client ID**
   - Add redirect URI: `https://fmvejvxmbdvhqlqtnucx.supabase.co/auth/v1/callback`
   - Copy **Client ID** and **Client Secret**

2. **Add to Supabase**:
   - Supabase Dashboard → Authentication → Providers → Google
   - Paste **Client ID**
   - Paste **Client Secret**
   - Click **Save**

---

## 👥 **Step 2: Manage Users in Supabase**

### **View All Users**

1. Go to **Supabase Dashboard**
2. Click **Authentication** → **Users** (left sidebar)
3. You'll see a list of all users

### **Delete a User**

1. In **Authentication** → **Users**
2. Find the user you want to delete
3. Click the **three dots** (⋯) next to the user
4. Click **Delete user**
5. Confirm deletion

### **Create a Test User**

1. Go to **Authentication** → **Users**
2. Click **Add user** (or **Create new user** button)
3. Fill in:
   - **Email**: `test@example.com` (or any email)
   - **Password**: `password123` (or any password)
   - ✅ **Check "Confirm user"** (important - auto-confirms email)
   - ✅ **Check "Auto Confirm User"** if available
4. Click **Create user**

**The user is now created and can log in immediately!**

---

## 🧪 **Step 3: Test Login**

### **Test Email/Password Login**

1. Go to `http://localhost:3000/auth/login`
2. Enter:
   - **Email**: `test@example.com` (the user you just created)
   - **Password**: `password123`
3. Click **Sign in**
4. Should work! ✅

### **Test Google Login**

1. After enabling Google provider in Supabase
2. Go to `http://localhost:3000/auth/login`
3. Click the **Google** button
4. Should redirect to Google sign-in (or work if enabled)

---

## 📋 **Quick Checklist**

- [ ] Enable Google provider in Supabase (toggle ON)
- [ ] Create a test user in Supabase Auth → Users
- [ ] Test email/password login
- [ ] Test Google login (if enabled)

---

## 🔧 **Common Issues**

### **"Provider is not enabled"**
- **Fix**: Go to Supabase → Authentication → Providers → Toggle Google ON

### **"User not found"**
- **Fix**: Create the user in Supabase Auth → Users first

### **"Invalid password"**
- **Fix**: Make sure you're using the correct password
- Or reset it in Supabase → Users → Reset password

### **"Email not confirmed"**
- **Fix**: When creating user, check "Confirm user" checkbox
- Or go to user details and click "Confirm email"

---

## 💡 **Pro Tips**

1. **For Testing**: Just enable the provider (no credentials needed for local dev)
2. **For Production**: You'll need full OAuth credentials
3. **User Management**: All users are in Authentication → Users
4. **Bulk Delete**: You can select multiple users and delete them

---

**Once you enable Google in Supabase, the login button will work!** 🚀





