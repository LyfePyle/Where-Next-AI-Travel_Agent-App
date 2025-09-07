# Stripe Payment Setup Guide

## 🎯 **What We've Built**

✅ **Checkout Session API** - `/api/payments/create-checkout-session`  
✅ **Success Page** - `/booking/success`  
✅ **Cancel Page** - `/booking/cancel`  
✅ **Test Payment Page** - `/test-payment`  
✅ **Checkout Session Page** - `/booking/checkout-session`

## 🚀 **Step-by-Step Setup**

### **1. Create Stripe Price ID**

1. **Go to [Stripe Dashboard](https://dashboard.stripe.com)**
2. **Navigate to Products** (in the left sidebar)
3. **Click "Add Product"**
4. **Fill in the details:**
   - **Name:** "Travel Booking"
   - **Description:** "AI Travel Agent Booking"
   - **Pricing:** One-time payment
   - **Price:** $25.00 USD (or your preferred amount)
5. **Click "Save product"**
6. **Copy the Price ID** (starts with `price_`)

### **2. Update Environment Variables**

Add this to your `.env.local` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_PRICE_ID=price_your_price_id_here

# Base URL for redirects
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### **3. Set Up Webhook Endpoint**

1. **Go to Stripe Dashboard > Developers > Webhooks**
2. **Click "Add endpoint"**
3. **Set URL to:** `http://localhost:3000/api/payments/webhook`
4. **Select events:**
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. **Click "Add endpoint"**
6. **Copy the webhook secret** (starts with `whsec_`)

### **4. Test the Payment System**

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Go to:** `http://localhost:3000/test-payment`

3. **Click "Start Test Payment"**

4. **Use test card:** `4242 4242 4242 4242`

5. **Complete the payment on Stripe's checkout page**

6. **Check your Stripe Dashboard > Payments** to see the test payment

## 🧪 **Testing Instructions**

### **Test Card Details:**
- **Card Number:** `4242 4242 4242 4242`
- **Expiry:** Any future date (e.g., 12/25)
- **CVC:** Any 3 digits (e.g., 123)
- **ZIP:** Any 5 digits (e.g., 12345)

### **What to Test:**
1. ✅ **Checkout Session Creation** - Should redirect to Stripe
2. ✅ **Payment Processing** - Should complete successfully
3. ✅ **Success Redirect** - Should return to success page
4. ✅ **Cancel Handling** - Should return to cancel page
5. ✅ **Webhook Processing** - Should update booking status

## 📁 **Files Created/Updated**

### **New API Routes:**
- `src/app/api/payments/create-checkout-session/route.ts`
- `src/app/api/payments/webhook/route.ts` (updated)

### **New Pages:**
- `src/app/booking/success/page.tsx`
- `src/app/booking/cancel/page.tsx`
- `src/app/booking/checkout-session/page.tsx`
- `src/app/test-payment/page.tsx`

### **Configuration:**
- Updated environment variables
- Stripe Price ID integration

## 🔧 **How It Works**

1. **User clicks "Start Test Payment"**
2. **App calls `/api/payments/create-checkout-session`**
3. **API creates Stripe Checkout Session with Price ID**
4. **User is redirected to Stripe's hosted checkout page**
5. **User enters payment details and completes payment**
6. **Stripe redirects to success/cancel page**
7. **Webhook processes the payment event**
8. **Booking status is updated in database**

## 🚨 **Troubleshooting**

### **Common Issues:**

**"Price ID is required" error:**
- Make sure `STRIPE_PRICE_ID` is set in `.env.local`
- Verify the Price ID exists in your Stripe dashboard

**"Failed to create checkout session" error:**
- Check that `STRIPE_SECRET_KEY` is correct
- Ensure the Price ID is valid

**Webhook not working:**
- Verify webhook URL is correct
- Check that webhook secret is set
- Ensure webhook events are selected

**Payment not showing in Stripe:**
- Check that you're in test mode
- Verify the test card number is correct
- Look in Stripe Dashboard > Payments

## 🎉 **Next Steps**

Once testing is successful:

1. **Deploy to production**
2. **Update webhook URL to production domain**
3. **Switch to live Stripe keys**
4. **Test with real payment methods**

## 📞 **Support**

If you encounter issues:
1. Check Stripe Dashboard logs
2. Verify all environment variables
3. Test with the provided test page
4. Check browser console for errors

**Ready to test? Go to `http://localhost:3000/test-payment`!** 🚀
