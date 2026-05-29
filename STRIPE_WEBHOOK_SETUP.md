# 🔔 Stripe Webhook Setup Guide

## 🎯 **What You Need**

The `STRIPE_WEBHOOK_SECRET` is required for your app to verify that webhook events are actually coming from Stripe (security).

## 📍 **Two Ways to Get Your Webhook Secret**

### **Option 1: Local Development (Stripe CLI)** ⚡ **RECOMMENDED FOR LOCAL**

For local development, use Stripe CLI to forward webhooks to your local server:

#### **Step 1: Install Stripe CLI**

**Windows (PowerShell):**
```powershell
# Using Scoop (if installed)
scoop install stripe

# Or download from: https://github.com/stripe/stripe-cli/releases
```

**Mac:**
```bash
brew install stripe/stripe-cli/stripe
```

**Or download:** https://github.com/stripe/stripe-cli/releases

#### **Step 2: Login to Stripe CLI**

```bash
stripe login
```

This will open your browser to authorize the CLI.

#### **Step 3: Forward Webhooks to Local Server**

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

**This will output:**
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx (^C to quit)
```

#### **Step 4: Copy the Webhook Secret**

Copy the `whsec_xxxxxxxxxxxxx` value and add it to your `.env.local`:

```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

**Keep this terminal running** while developing! When you stop it, the secret changes.

---

### **Option 2: Stripe Dashboard (For Production)**

For production/deployed apps, set up webhooks in the Stripe Dashboard:

#### **Step 1: Go to Stripe Dashboard**

1. Go to [dashboard.stripe.com](https://dashboard.stripe.com)
2. Make sure you're in **Test Mode** (toggle in top right)
3. Go to **Developers → Webhooks**

#### **Step 2: Add Webhook Endpoint**

1. Click **"Add endpoint"**
2. **Endpoint URL:** 
   - **Local:** `http://localhost:3000/api/stripe/webhook` (won't work - use CLI instead)
   - **Production:** `https://yourdomain.com/api/stripe/webhook`
3. **Description:** "Where Next Payment Webhooks"
4. **Select events to listen to:**
   - ✅ `checkout.session.completed`
   - ✅ `checkout.session.expired`
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
   - ✅ `payment_intent.canceled`
5. Click **"Add endpoint"**

#### **Step 3: Get Webhook Signing Secret**

1. Click on your newly created webhook endpoint
2. In the **"Signing secret"** section, click **"Reveal"**
3. Copy the secret (starts with `whsec_`)
4. Add to `.env.local`:

```bash
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
```

⚠️ **Important:** 
- **Test mode** has a different secret than **Live mode**
- Make sure you're copying from the correct mode
- Each webhook endpoint has its own unique secret

---

## 🚀 **Quick Setup for Local Development**

**Fastest way to get started:**

1. **Install Stripe CLI:**
   ```bash
   # Windows (if you have Scoop)
   scoop install stripe
   
   # Or download installer from:
   # https://github.com/stripe/stripe-cli/releases
   ```

2. **Login:**
   ```bash
   stripe login
   ```

3. **Start forwarding webhooks:**
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

4. **Copy the secret it shows** (starts with `whsec_`)

5. **Add to `.env.local`:**
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

6. **Keep that terminal open** while developing

---

## 📝 **Complete `.env.local` Stripe Setup**

```bash
# Stripe Test Keys (get from: https://dashboard.stripe.com/apikeys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51...
STRIPE_SECRET_KEY=sk_test_51...

# Webhook Secret (get using method above)
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# For production, use live keys:
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
# STRIPE_SECRET_KEY=sk_live_...
```

---

## ✅ **Verify Webhook is Working**

1. **Make a test payment** on your app
2. **Check the Stripe CLI terminal** (if using Option 1) - you should see events
3. **Or check Stripe Dashboard → Webhooks → Your endpoint → Recent events**

You should see events like:
- `checkout.session.completed`
- `payment_intent.succeeded`

---

## 🐛 **Troubleshooting**

### **"Webhook secret is missing"**
- ✅ Make sure `STRIPE_WEBHOOK_SECRET` is in `.env.local`
- ✅ Restart your dev server after adding it

### **"Webhook signature verification failed"**
- ✅ Wrong webhook secret (test vs live, or different endpoint)
- ✅ Make sure you're using the secret from the correct endpoint
- ✅ If using Stripe CLI, make sure it's still running

### **"Webhooks not reaching my server"**
- ✅ **Local:** Use Stripe CLI (`stripe listen`)
- ✅ **Production:** Make sure webhook URL is publicly accessible
- ✅ Check firewall/network settings

### **"Can't install Stripe CLI"**
- Use Option 2 (Dashboard) instead
- Or use ngrok to expose localhost: `ngrok http 3000`, then use ngrok URL in Stripe Dashboard

---

## 🎯 **Summary**

**For Local Development:**
- ✅ Use **Stripe CLI** (`stripe listen`)
- ✅ Copy the `whsec_` secret it shows
- ✅ Keep CLI running while developing

**For Production:**
- ✅ Create webhook endpoint in Stripe Dashboard
- ✅ Use production URL: `https://yourdomain.com/api/stripe/webhook`
- ✅ Copy signing secret from Dashboard
- ✅ Add to production environment variables

---

**Your webhook endpoint:** `/api/stripe/webhook`  
**Local URL:** `http://localhost:3000/api/stripe/webhook`  
**Production URL:** `https://yourdomain.com/api/stripe/webhook`

