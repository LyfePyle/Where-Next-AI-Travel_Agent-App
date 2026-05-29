# 🔐 Social Authentication (OAuth) Setup Guide

## ✅ **What's Been Added**

Social login buttons have been added to both login and register pages:
- ✅ **Google** sign-in button
- ✅ **Facebook** sign-in button  
- ✅ **Apple** sign-in button

The buttons are functional and will work once OAuth providers are configured in Supabase.

---

## 🚨 **QUICK FIX: Enable Provider (No Credentials Needed for Testing)**

**If you see**: `"Unsupported provider: provider is not enabled"`

**Quick Fix** (for local testing):
1. Go to **Supabase Dashboard** → **Authentication** → **Providers**
2. Find **Google** (or Facebook/Apple)
3. **Toggle it ON** (you don't need credentials for local testing)
4. Click **Save**
5. Try logging in again - it should work!

**For production**, you'll need full OAuth credentials (see below).

---

## 🚀 **Step-by-Step Setup**

### **Step 1: Configure OAuth Providers in Supabase**

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Authentication** → **Providers** (left sidebar)
4. Enable and configure each provider:

---

### **Step 2: Google OAuth Setup**

1. **In Supabase Dashboard**:
   - Go to Authentication → Providers
   - Find **Google** and toggle it **ON**
   - Click **Configure**

2. **Get Google OAuth Credentials**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project (or select existing)
   - Go to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **OAuth client ID**
   - Application type: **Web application**
   - Name: "Where Next Travel App"
   - **Authorized redirect URIs**: 
     ```
     https://your-project-ref.supabase.co/auth/v1/callback
     ```
     Replace `your-project-ref` with your actual Supabase project reference
   - Click **Create**
   - Copy the **Client ID** and **Client Secret**

3. **Add to Supabase**:
   - Paste **Client ID** into Supabase Google provider settings
   - Paste **Client Secret** into Supabase Google provider settings
   - Click **Save**

---

### **Step 3: Facebook OAuth Setup**

1. **In Supabase Dashboard**:
   - Go to Authentication → Providers
   - Find **Facebook** and toggle it **ON**
   - Click **Configure**

2. **Get Facebook App Credentials**:
   - Go to [Facebook Developers](https://developers.facebook.com/)
   - Click **My Apps** → **Create App**
   - Choose **Consumer** app type
   - Fill in app details
   - Go to **Settings** → **Basic**
   - Copy **App ID** and **App Secret**
   - Add **Valid OAuth Redirect URIs**:
     ```
     https://your-project-ref.supabase.co/auth/v1/callback
     ```

3. **Add to Supabase**:
   - Paste **App ID** into Supabase Facebook provider settings
   - Paste **App Secret** into Supabase Facebook provider settings
   - Click **Save**

---

### **Step 4: Apple OAuth Setup**

1. **In Supabase Dashboard**:
   - Go to Authentication → Providers
   - Find **Apple** and toggle it **ON**
   - Click **Configure**

2. **Get Apple Credentials**:
   - Go to [Apple Developer Portal](https://developer.apple.com/)
   - Navigate to **Certificates, Identifiers & Profiles**
   - Create a **Services ID**
   - Enable **Sign in with Apple**
   - Configure **Return URLs**:
     ```
     https://your-project-ref.supabase.co/auth/v1/callback
     ```
   - Create a **Key** for Sign in with Apple
   - Download the key file (`.p8` file)
   - Note the **Key ID** and **Team ID**

3. **Add to Supabase**:
   - Paste **Services ID** (Client ID)
   - Paste **Team ID**
   - Paste **Key ID**
   - Upload the **Key file** (`.p8`)
   - Click **Save**

---

## 🔧 **Important Configuration**

### **Redirect URLs**

For **local development**, add:
```
http://localhost:3000/auth/callback
```

For **production**, add:
```
https://your-domain.vercel.app/auth/callback
https://your-project-ref.supabase.co/auth/v1/callback
```

**Note**: Supabase automatically handles the redirect, but you need to add your app's callback URL to each provider.

---

## ✅ **Verification**

After configuring:

1. **Test Google Login**:
   - Go to `/auth/login`
   - Click the Google button
   - Should redirect to Google sign-in
   - After signing in, should redirect back to your app

2. **Test Facebook Login**:
   - Click the Facebook button
   - Should redirect to Facebook sign-in
   - After signing in, should redirect back to your app

3. **Test Apple Login**:
   - Click the Apple button
   - Should redirect to Apple sign-in
   - After signing in, should redirect back to your app

---

## 🐛 **Troubleshooting**

### **Error: "redirect_uri_mismatch"**
- **Fix**: Make sure the redirect URI in your OAuth provider matches exactly:
  - `https://your-project-ref.supabase.co/auth/v1/callback`
- Check for typos, trailing slashes, or http vs https

### **Error: "Invalid client"**
- **Fix**: Verify Client ID and Client Secret are correct
- Make sure you copied the entire secret (no spaces)

### **Error: "Provider not enabled"**
- **Fix**: Make sure the provider is toggled ON in Supabase
- Refresh the page and try again

### **Apple Sign-In Not Working**
- **Fix**: Apple requires HTTPS in production
- Make sure your domain is verified
- Check that the Services ID is correctly configured

---

## 📝 **Quick Reference**

### **Supabase Redirect URL Format**
```
https://[your-project-ref].supabase.co/auth/v1/callback
```

### **Your App Callback URL**
```
http://localhost:3000/auth/callback  (development)
https://your-domain.vercel.app/auth/callback  (production)
```

### **Where to Find Your Project Ref**
- Supabase Dashboard → Settings → API
- Look for "Project URL" - the part before `.supabase.co`

---

## 🎯 **Current Status**

- ✅ **UI Buttons**: Added to login and register pages
- ✅ **OAuth Function**: Implemented in AppContext
- ✅ **Callback Route**: Already exists at `/auth/callback`
- ⚠️ **Provider Configuration**: Needs to be done in Supabase Dashboard

**Once you configure the providers in Supabase, the buttons will work!**

---

## 💡 **Tips**

1. **Start with Google** - It's the easiest to set up
2. **Test locally first** - Use `http://localhost:3000/auth/callback`
3. **Add production URLs later** - When deploying to Vercel
4. **One provider at a time** - Configure and test each one separately

---

**The social login buttons are ready! Just need to configure the OAuth providers in Supabase.** 🚀

