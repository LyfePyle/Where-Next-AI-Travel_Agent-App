# Where Next – Setup & Manual Tasks (Step-by-Step)

This document explains **everything you must do manually** outside the codebase to run Where Next locally and (optionally) deploy it.

---

## 1. Prerequisites on Your Computer

### 1.1 Install Node.js and npm

1. Go to the [Node.js website](https://nodejs.org/).
2. Download the **LTS** version (recommended).
3. Run the installer and follow the steps (Next → Next → Finish).
4. After install, open a terminal and run:

   ```bash
   node -v
   npm -v
   ```

   You should see version numbers, not errors.

### 1.2 Clone the Repository

1. Go to your GitHub repo in the browser.
2. Click the green "Code" button.
3. Copy the HTTPS URL.
4. Open a terminal and run:

   ```bash
   git clone <PASTE_REPO_URL_HERE>
   cd <repo-folder-name>
   ```

5. Install dependencies:

   ```bash
   npm install
   ```

---

## 2. Supabase Setup (Required)

### 2.1 Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in (or create an account).
2. Click **"New Project"**.
3. Fill in:
   - **Name**: `where-next` (or your choice)
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to you
4. Click **"Create new project"**.
5. Wait 2-3 minutes for the project to initialize.

### 2.2 Get Your Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**.
2. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)
3. Save them somewhere safe (you'll need them in step 3).

### 2.3 Set Up the Database Schema

1. In Supabase dashboard, go to **SQL Editor**.
2. Create the `profiles` table and RLS policies:
   - You can use the SQL from `supabase/setup-profiles.sql` in the repo, or
   - Run this basic setup:

   ```sql
   -- Create profiles table
   CREATE TABLE public.profiles (
     id UUID REFERENCES auth.users(id) PRIMARY KEY,
     display_name TEXT,
     avatar_url TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Enable RLS
   ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

   -- Policy: Users can read their own profile
   CREATE POLICY "Users can view own profile"
     ON public.profiles FOR SELECT
     USING (auth.uid() = id);

   -- Policy: Users can update their own profile
   CREATE POLICY "Users can update own profile"
     ON public.profiles FOR UPDATE
     USING (auth.uid() = id);

   -- Policy: Users can insert their own profile
   CREATE POLICY "Users can insert own profile"
     ON public.profiles FOR INSERT
     WITH CHECK (auth.uid() = id);

   -- Trigger: Auto-create profile on user signup
   CREATE OR REPLACE FUNCTION public.handle_new_user()
   RETURNS TRIGGER AS $$
   BEGIN
     INSERT INTO public.profiles (id, display_name)
     VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', 'User'));
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;

   CREATE TRIGGER on_auth_user_created
     AFTER INSERT ON auth.users
     FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
   ```

3. Click **"Run"** to execute the SQL.

### 2.4 Configure Email Auth (Optional but Recommended)

1. In Supabase dashboard, go to **Authentication** → **Providers**.
2. Ensure **Email** is enabled.
3. (Optional) Configure email templates or SMTP settings if you want custom emails.

### 2.5 Create a Test User (Optional)

1. Go to **Authentication** → **Users**.
2. Click **"Add user"** → **"Create new user"**.
3. Enter:
   - **Email**: `test@example.com` (or your test email)
   - **Password**: Choose a password (save it!)
4. Click **"Create user"**.
5. You can use this to test login locally.

---

## 3. Environment Variables Setup

### 3.1 Create `.env.local` File

1. In your project root, create a file named `.env.local`.
2. Add the following (replace with your actual values):

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   OPENAI_API_KEY=sk-...  # Optional, if using AI features
   ```

3. **Important**: Never commit `.env.local` to Git (it should be in `.gitignore`).

### 3.2 Where to Get Each Value

- **NEXT_PUBLIC_SUPABASE_URL**: From Supabase Settings → API → Project URL
- **NEXT_PUBLIC_SUPABASE_ANON_KEY**: From Supabase Settings → API → anon/public key
- **OPENAI_API_KEY**: From [OpenAI Platform](https://platform.openai.com/api-keys) (if using AI features)

---

## 4. Run the App Locally

### 4.1 Start the Development Server

1. Open a terminal in your project root.
2. Run:

   ```bash
   npm run dev
   ```

3. The app should start at `http://localhost:3000` (or the port shown in the terminal).

### 4.2 Test the Setup

1. Open your browser to `http://localhost:3000`.
2. Try to:
   - Visit `/auth/login`
   - Log in with your test user (or create a new account)
   - Access `/dashboard` (should work if logged in)
3. If you see errors, check:
   - Your `.env.local` file has correct values
   - Supabase project is active
   - Database schema was created correctly

---

## 5. Deployment to Vercel (Optional)

### 5.1 Connect Repository to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in (or create an account).
2. Click **"Add New Project"**.
3. Import your GitHub repository.
4. Vercel will detect it's a Next.js app automatically.

### 5.2 Configure Environment Variables in Vercel

1. In your Vercel project settings, go to **Environment Variables**.
2. Add each variable:
   - `NEXT_PUBLIC_SUPABASE_URL` = (your Supabase URL)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (your Supabase anon key)
   - `OPENAI_API_KEY` = (your OpenAI key, if using)
3. Select **"Production"**, **"Preview"**, and **"Development"** for each variable.
4. Click **"Save"**.

### 5.3 Deploy

1. Click **"Deploy"** in Vercel.
2. Wait for the build to complete (usually 1-2 minutes).
3. Your app will be live at `https://your-project.vercel.app`.

### 5.4 Update Supabase Allowed URLs (Important)

1. In Supabase dashboard, go to **Authentication** → **URL Configuration**.
2. Add your Vercel URL to **"Redirect URLs"**:
   - `https://your-project.vercel.app/**`
   - `https://your-project.vercel.app/auth/callback`
3. Add to **"Site URL"**:
   - `https://your-project.vercel.app`
4. Click **"Save"**.

---

## 6. Troubleshooting Common Issues

### 6.1 "Invalid API key" or Supabase Connection Errors

- **Check**: Your `.env.local` file has the correct `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- **Verify**: The Supabase project is active (not paused).
- **Test**: Visit your Supabase project URL in a browser to confirm it's accessible.

### 6.2 "Profile not found" or RLS Policy Errors

- **Check**: You ran the SQL schema setup (step 2.3).
- **Verify**: The `profiles` table exists in Supabase (SQL Editor → check tables).
- **Test**: Try creating a new user and see if a profile is auto-created.

### 6.3 Login Redirects Not Working

- **Check**: Supabase redirect URLs include your localhost (for dev) and Vercel URL (for prod).
- **Verify**: Middleware is correctly configured in `middleware.ts`.
- **Test**: Check browser console for errors.

### 6.4 Build Errors on Vercel

- **Check**: All environment variables are set in Vercel (step 5.2).
- **Verify**: Your `package.json` has correct build scripts.
- **Review**: Vercel build logs for specific error messages.

---

## 7. Next Steps After Setup

Once your app is running:

1. **Test Authentication**:
   - Create a new account
   - Log in and out
   - Verify profile is created

2. **Explore the Dashboard**:
   - Check if saved trips load (if you have any)
   - Test creating a new trip

3. **Review Documentation**:
   - See `docs/APP_OVERVIEW_AND_ARCHITECTURE.md` for architecture details
   - Check `COMPLETE_LOGIN_SETUP_GUIDE.md` for auth-specific help

4. **Set Up Additional Features** (if needed):
   - OpenAI API for AI features
   - Stripe for payments (future)
   - Travel APIs for real data (future)

---

## 8. Summary Checklist

Before you can run the app, you need:

- [ ] Node.js and npm installed
- [ ] Repository cloned locally
- [ ] Dependencies installed (`npm install`)
- [ ] Supabase project created
- [ ] Database schema set up (profiles table + RLS)
- [ ] `.env.local` file created with Supabase credentials
- [ ] Development server running (`npm run dev`)
- [ ] Test login working

For deployment:

- [ ] Vercel account and project connected
- [ ] Environment variables set in Vercel
- [ ] Supabase redirect URLs updated with Vercel URL
- [ ] First deployment successful

---

*This guide covers the essential manual setup steps. For code-level changes and feature development, see the main documentation in `docs/` and the root-level guides.*













