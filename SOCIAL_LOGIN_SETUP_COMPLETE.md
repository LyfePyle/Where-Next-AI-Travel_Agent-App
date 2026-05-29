# 🔐 Social Login Setup - Complete Guide

## ✅ **Good News: Your Code is Ready!**

Your app already has social login buttons for:
- ✅ **Google** sign-in
- ✅ **Facebook** sign-in  
- ✅ **Apple** sign-in

The buttons are on your login and register pages. Now you just need to configure them in Supabase!

---

## 🚨 **Current Status (From Your Screenshot)**

You have:
- ✅ Google provider **enabled** in Supabase
- ❌ **Missing Client ID** (that's why you see the error)

**The error message is correct** - you need to add OAuth credentials for each provider to work.

---

## 🎯 **Quick Decision: Enable All Three?**

**Yes, you should enable all three!** Here's why:

1. **Google** - Most popular, easy setup
2. **Facebook** - Second most popular
3. **Apple** - Required for iOS apps, growing in popularity

**Users love choice** - let them sign in with whatever they prefer!

---

## 🚀 **Step-by-Step Setup**

### **Step 1: Google OAuth Setup**

#### **A. Get Google OAuth Credentials**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. **Create or select a project**
   - Click project dropdown at top
   - Click "New Project" or select existing
   - Name it: "Where Next Travel App"

3. **Enable Google+ API**
   - Go to **APIs & Services** → **Library**
   - Search for "Google+ API"
   - Click **Enable**

4. **Create OAuth Credentials**
   - Go to **APIs & Services** → **Credentials**
   - Click **+ CREATE CREDENTIALS** → **OAuth client ID**
   - If prompted, configure OAuth consent screen first:
     - User Type: **External** (unless you have Google Workspace)
     - App name: "Where Next"
     - User support email: Your email
     - Developer contact: Your email
     - Click **Save and Continue**
     - Scopes: Just click **Save and Continue** (default is fine)
     - Test users: Add your email, click **Save and Continue**
   
5. **Create OAuth Client ID**
   - Application type: **Web application**
   - Name: "Where Next Web"
   - **Authorized redirect URIs**: Click **+ ADD URI**
     - Add: `https://fmvejvxmbdvhqlqtnucx.supabase.co/auth/v1/callback`
     - (This is your callback URL from Supabase - you can copy it from the Supabase page)
   - Click **Create**
   - **Copy the Client ID and Client Secret** (you'll need these!)

#### **B. Add to Supabase**

1. Go back to Supabase Dashboard → **Authentication** → **Providers** → **Google**
2. Paste the **Client ID** into the "Client IDs" field
3. Paste the **Client Secret** into the "Client Secret (for OAuth)" field
4. Click **Save**

**✅ Google is now ready!**

---

### **Step 2: Facebook OAuth Setup**

#### **A. Get Facebook App Credentials**

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click **My Apps** → **Create App**
3. Choose app type: **Consumer**
4. Fill in:
   - App name: "Where Next Travel"
   - App contact email: Your email
   - Click **Create App**

5. **Configure OAuth Settings**
   - In the left sidebar, go to **Settings** → **Basic**
   - Copy your **App ID** and **App Secret** (click "Show" to reveal secret)
   - Scroll down to **Add Platform** → Select **Website**
   - **Site URL**: `https://fmvejvxmbdvhqlqtnucx.supabase.co`
   - **Valid OAuth Redirect URIs**: 
     ```
     https://fmvejvxmbdvhqlqtnucx.supabase.co/auth/v1/callback
     ```
   - Click **Save Changes**

6. **Enable Facebook Login**
   - In left sidebar, find **Products** → **Facebook Login**
   - Click **Set Up**
   - Go to **Settings**
   - **Valid OAuth Redirect URIs**: Add the same callback URL
   - Click **Save Changes**

#### **B. Add to Supabase**

1. Go to Supabase Dashboard → **Authentication** → **Providers** → **Facebook**
2. Toggle **Enable Sign in with Facebook** to **ON**
3. Paste **App ID** into the "App ID" field
4. Paste **App Secret** into the "App Secret" field
5. Click **Save**

**✅ Facebook is now ready!**

---

### **Step 3: Apple OAuth Setup**

#### **A. Get Apple Credentials**

1. Go to [Apple Developer Portal](https://developer.apple.com/account/)
2. Sign in with your Apple Developer account
   - **Note**: You need a paid Apple Developer account ($99/year)
   - If you don't have one, you can skip Apple for now

3. **Create Services ID**
   - Go to **Certificates, Identifiers & Profiles**
   - Click **Identifiers** → **+** button
   - Select **Services IDs** → **Continue**
   - Description: "Where Next Travel"
   - Identifier: `com.wherenext.travel` (or your domain)
   - Click **Continue** → **Register**

4. **Configure Sign in with Apple**
   - Click on your new Services ID
   - Check **Sign in with Apple**
   - Click **Configure**
   - **Primary App ID**: Select your app (or create one)
   - **Website URLs**:
     - Domains: `fmvejvxmbdvhqlqtnucx.supabase.co`
     - Return URLs: `https://fmvejvxmbdvhqlqtnucx.supabase.co/auth/v1/callback`
   - Click **Save** → **Continue** → **Register**

5. **Create Key for Sign in with Apple**
   - Go to **Keys** → **+** button
   - Key Name: "Where Next Sign in with Apple"
   - Check **Sign in with Apple**
   - Click **Configure** → Select your Primary App ID → **Save**
   - Click **Continue** → **Register**
   - **Download the key file** (`.p8` file) - **You can only download this once!**
   - Note your **Key ID** and **Team ID** (shown on the page)

#### **B. Add to Supabase**

1. Go to Supabase Dashboard → **Authentication** → **Providers** → **Apple**
2. Toggle **Enable Sign in with Apple** to **ON**
3. Fill in:
   - **Services ID (Client ID)**: The identifier you created (e.g., `com.wherenext.travel`)
   - **Team ID**: Your Apple Team ID
   - **Key ID**: The Key ID from step 5
   - **Private Key**: Upload the `.p8` file you downloaded
4. Click **Save**

**✅ Apple is now ready!**

---

## 🧪 **Testing Social Login**

### **Test Each Provider**

1. Go to: `http://localhost:3000/auth/login`
2. Click each social login button:
   - **Google** → Should redirect to Google sign-in
   - **Facebook** → Should redirect to Facebook sign-in
   - **Apple** → Should redirect to Apple sign-in

3. **After signing in**, you should be redirected back to your app and logged in!

---

## ⚠️ **Important Notes**

### **For Local Development**

Add this redirect URL to each provider:
```
http://localhost:3000/auth/callback
```

### **For Production**

When you deploy, add your production URL:
```
https://your-domain.vercel.app/auth/callback
```

### **Callback URL Format**

Supabase callback URL is always:
```
https://your-project-ref.supabase.co/auth/v1/callback
```

You can find this in Supabase Dashboard → Authentication → Providers → (any provider) → "Callback URL"

---

## 🎯 **Priority Order**

If you want to set them up one at a time:

1. **Google** (Easiest, most popular) ⭐ Start here
2. **Facebook** (Second easiest)
3. **Apple** (Requires paid Apple Developer account)

---

## ✅ **Checklist**

- [ ] Google OAuth credentials created
- [ ] Google Client ID added to Supabase
- [ ] Google Client Secret added to Supabase
- [ ] Facebook App created
- [ ] Facebook App ID and Secret added to Supabase
- [ ] Apple Services ID created (if using Apple)
- [ ] Apple credentials added to Supabase (if using Apple)
- [ ] All providers tested on login page
- [ ] Redirect URLs configured for localhost and production

---

## 🐛 **Common Issues**

### **"Unsupported provider: provider is not enabled"**
- **Fix**: Make sure the provider is toggled **ON** in Supabase Dashboard

### **"Invalid redirect URI"**
- **Fix**: Make sure you added the callback URL to the provider's authorized redirect URIs

### **"Client ID is required"**
- **Fix**: Add the Client ID/App ID to Supabase provider settings

### **OAuth works but user isn't logged in**
- **Fix**: Check that `/auth/callback` route is working (it should be - we already have it!)

---

## 🎉 **You're All Set!**

Once you've added the credentials to Supabase:
- ✅ Users can sign in with Google
- ✅ Users can sign in with Facebook  
- ✅ Users can sign in with Apple (if configured)
- ✅ All social logins will create profiles automatically
- ✅ Users will be redirected back to your app after signing in

**The code is already there - you just need to add the credentials!** 🚀






