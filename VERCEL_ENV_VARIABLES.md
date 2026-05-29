# Vercel Environment Variables Checklist

## 🔴 **REQUIRED - Core Functionality**

These are **essential** for your app to work. Add all of these to Vercel:

### **Supabase (Database & Authentication)**
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### **OpenAI (AI Features)**
```
OPENAI_API_KEY=sk-proj-your-openai-api-key
```

### **Amadeus (Flight/Hotel Data)**
```
AMADEUS_CLIENT_ID=your_amadeus_client_id
AMADEUS_CLIENT_SECRET=your_amadeus_client_secret
AMADEUS_ENVIRONMENT=production
```
*Note: Set to `production` for live deployment, `test` for staging*

### **Stripe (Payments)**
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```
*Note: Use `pk_live_` and `sk_live_` for production, `pk_test_` and `sk_test_` for staging*

### **NextAuth (Authentication)**
```
NEXTAUTH_SECRET=your_nextauth_secret_at_least_32_characters
NEXTAUTH_URL=https://your-domain.vercel.app
```
*Note: Generate a secure random string for NEXTAUTH_SECRET (at least 32 characters)*

---

## 🟡 **IMPORTANT - App Configuration**

### **App URLs & Settings**
```
NEXT_PUBLIC_URL=https://your-domain.vercel.app
NEXT_PUBLIC_DEMO_MODE=false
NEXT_PUBLIC_PREVIEW_HINT=false
PREVIEW_GUEST_ENABLED=false
```
*Note: Set `NEXT_PUBLIC_URL` to your production domain*

---

## 🟢 **OPTIONAL - Enhanced Features**

These are optional but recommended for full functionality:

### **Weather API**
```
OPENWEATHER_API_KEY=your_openweather_api_key
```

### **Currency Exchange API**
```
EXCHANGE_RATE_API_KEY=your_exchange_rate_api_key
```

---

## 📋 **Quick Setup Instructions**

### **Step 1: Go to Vercel Dashboard**
1. Navigate to your project: https://vercel.com/dashboard
2. Click on your project
3. Go to **Settings** → **Environment Variables**

### **Step 2: Add Variables**
Add each variable above. For each variable:
- **Key**: The variable name (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
- **Value**: Your actual API key/URL
- **Environment**: Select which environments to apply to:
  - ✅ **Production** (for production deployments)
  - ✅ **Preview** (for pull request previews)
  - ✅ **Development** (optional, for local development)

### **Step 3: Important Notes**

#### **Public vs Private Variables**
- Variables starting with `NEXT_PUBLIC_` are **exposed to the browser** (safe for public keys)
- Variables **without** `NEXT_PUBLIC_` are **server-only** (keep secret!)

#### **Production vs Test Keys**
- **Production**: Use live/production API keys (e.g., `pk_live_`, `sk_live_`)
- **Preview/Staging**: Use test keys (e.g., `pk_test_`, `sk_test_`)

#### **Environment-Specific Values**
You can set different values for different environments:
- **Production**: Use production API keys
- **Preview**: Use test/staging API keys
- **Development**: Use local development keys

---

## 🔐 **Security Best Practices**

1. **Never commit** `.env.local` to Git
2. **Use different keys** for production vs preview environments
3. **Rotate keys** if they're ever exposed
4. **Use Vercel's environment variable encryption** (automatic)
5. **Limit access** to who can view/edit environment variables

---

## ✅ **Verification Checklist**

After adding all variables, verify:
- [ ] All required variables are set
- [ ] Production environment has production keys
- [ ] Preview environment has test keys
- [ ] `NEXT_PUBLIC_URL` matches your Vercel domain
- [ ] `NEXTAUTH_URL` matches your Vercel domain
- [ ] `AMADEUS_ENVIRONMENT=production` for production
- [ ] `NEXT_PUBLIC_DEMO_MODE=false` for production
- [ ] All Stripe keys are from the same account (test or live)

---

## 🚨 **Common Issues**

### **"Failed to fetch" errors**
- Check that `NEXT_PUBLIC_SUPABASE_URL` is correct
- Verify Supabase keys are valid

### **Authentication not working**
- Ensure `NEXTAUTH_SECRET` is at least 32 characters
- Verify `NEXTAUTH_URL` matches your domain exactly

---

## 🔑 **How to Create NEXTAUTH_SECRET and NEXTAUTH_URL**

### **Step 1: Generate NEXTAUTH_SECRET**

You need a secure random string that's at least 32 characters long. Here are several ways to generate one:

#### **Option A: Using Node.js (Recommended)**
Run this command in your terminal:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Example output:**
```
xBF3ccdvev5z1TIr6bgZwGgPS3anmSS6438idFOYUtE=
```

#### **Option B: Using OpenSSL**
```bash
openssl rand -base64 32
```

#### **Option C: Using PowerShell (Windows)**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

#### **Option D: Online Generator**
Visit: https://generate-secret.vercel.app/32
- Click "Generate" to create a 32-character secret
- Copy the generated value

**✅ Use this generated value for `NEXTAUTH_SECRET` in Vercel**

---

### **Step 2: Set NEXTAUTH_URL**

The `NEXTAUTH_URL` should match your Vercel deployment domain exactly:

#### **For Production:**
```
NEXTAUTH_URL=https://your-project-name.vercel.app
```
Or if you have a custom domain:
```
NEXTAUTH_URL=https://your-custom-domain.com
```

#### **For Preview Deployments:**
Vercel automatically provides preview URLs. You can either:
- Leave it as your production URL (NextAuth will work with both)
- Or use a wildcard: `NEXTAUTH_URL=https://*.vercel.app` (not recommended)

#### **For Local Development:**
```
NEXTAUTH_URL=http://localhost:3000
```

**📝 Important Notes:**
- The URL must include the protocol (`https://` or `http://`)
- No trailing slash at the end
- Must match exactly (case-sensitive for the domain part)
- For production, always use `https://`

---

### **Step 3: Add to Vercel**

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Click **Add New**
4. Add `NEXTAUTH_SECRET`:
   - **Key**: `NEXTAUTH_SECRET`
   - **Value**: Paste the generated secret (e.g., `xBF3ccdvev5z1TIr6bgZwGgPS3anmSS6438idFOYUtE=`)
   - **Environment**: Select ✅ Production, ✅ Preview, ✅ Development
5. Click **Add**
6. Add `NEXTAUTH_URL`:
   - **Key**: `NEXTAUTH_URL`
   - **Value**: Your Vercel domain (e.g., `https://your-project.vercel.app`)
   - **Environment**: 
     - ✅ Production: `https://your-project.vercel.app`
     - ✅ Preview: `https://your-project.vercel.app` (or leave same)
     - ✅ Development: `http://localhost:3000`
7. Click **Save**

---

### **Quick Example**

If your Vercel project URL is `https://where-next-app.vercel.app`, your values would be:

```
NEXTAUTH_SECRET=xBF3ccdvev5z1TIr6bgZwGgPS3anmSS6438idFOYUtE=
NEXTAUTH_URL=https://where-next-app.vercel.app
```

**⚠️ Security Warning:**
- Never commit `NEXTAUTH_SECRET` to Git
- Use different secrets for production vs development
- Keep the secret secure - if exposed, regenerate it immediately

### **Payments not working**
- Make sure Stripe keys are from the same account (test or live)
- Verify webhook secret is set correctly

### **API errors**
- Check that all required API keys are set
- Verify keys are valid and not expired

---

## 📝 **Quick Copy-Paste Template**

Set these in Vercel for **Production**:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=sk-proj-your-key
AMADEUS_CLIENT_ID=your_client_id
AMADEUS_CLIENT_SECRET=your_client_secret
AMADEUS_ENVIRONMENT=production
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_key
STRIPE_SECRET_KEY=sk_live_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret
NEXTAUTH_SECRET=your_32_char_secret
NEXTAUTH_URL=https://your-domain.vercel.app
NEXT_PUBLIC_URL=https://your-domain.vercel.app
NEXT_PUBLIC_DEMO_MODE=false
NEXT_PUBLIC_PREVIEW_HINT=false
PREVIEW_GUEST_ENABLED=false
```

Optional:
```
OPENWEATHER_API_KEY=your_key
EXCHANGE_RATE_API_KEY=your_key
```

