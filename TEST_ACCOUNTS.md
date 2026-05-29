# 🧪 Test Accounts

## **Recommended Test Account**

### **Account 1: Primary Test User**
- **Email**: `test@wherenext.app`
- **Password**: `TestPassword2024!`
- **Purpose**: Main testing account

### **Account 2: Alternative Test User**
- **Email**: `traveler@wherenext.app`
- **Password**: `TravelTest2024!`
- **Purpose**: Secondary testing account

### **Account 3: Demo Account (Legacy)**
- **Email**: `demo@example.com`
- **Password**: `password123`
- **Purpose**: Legacy demo mode (still works)

---

## 📋 **How to Create Test Accounts in Supabase**

### **Step 1: Go to Supabase Dashboard**
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Click **Authentication** → **Users** in the left sidebar

### **Step 2: Create New User**
1. Click **"Add user"** or **"Create new user"** button
2. Fill in:
   - **Email**: `test@wherenext.app`
   - **Password**: `TestPassword2024!`
   - ✅ **IMPORTANT: Check "Auto Confirm User"** (or "Confirm user")
3. Click **"Create user"**

### **Step 3: Verify Profile Created**
The profile should be created automatically via the trigger. To verify:

1. Go to **SQL Editor** in Supabase Dashboard
2. Run this query:
   ```sql
   SELECT * FROM public.profiles WHERE id IN (
     SELECT id FROM auth.users WHERE email = 'test@wherenext.app'
   );
   ```
3. You should see a row with the user's ID

---

## 🔐 **Login Instructions**

### **Using the Login Page**
1. Go to: `http://localhost:3000/auth/login`
2. Enter:
   - **Email**: `test@wherenext.app`
   - **Password**: `TestPassword2024!`
3. Click **"Sign in"**

### **Expected Result**
- ✅ Login successful
- ✅ Redirects to homepage or dashboard
- ✅ No "profiles does not exist" error
- ✅ Can access protected pages

---

## 🎯 **Why These Passwords?**

The new passwords (`TestPassword2024!`) are:
- ✅ Strong enough to avoid Google Password Manager warnings
- ✅ Easy to remember
- ✅ Follow best practices (uppercase, lowercase, numbers, special chars)
- ✅ Won't trigger security alerts

---

## 🔄 **Updating Code (Optional)**

If you want to update the demo login button to use the new account, you can modify:
- `src/app/auth/login/page.tsx` - Update the `handleDemoLogin` function
- `src/contexts/AppContext.tsx` - Update the demo mode check

But you can also just use the login form directly with the new credentials!

---

## 📝 **Quick Reference**

| Account | Email | Password | Status |
|---------|-------|----------|--------|
| Test User 1 | `test@wherenext.app` | `TestPassword2024!` | ✅ Recommended |
| Test User 2 | `traveler@wherenext.app` | `TravelTest2024!` | ✅ Alternative |
| Demo (Legacy) | `demo@example.com` | `password123` | ⚠️ May trigger warnings |

---

**Note**: The new accounts need to be created in Supabase Dashboard. The old `demo@example.com` account will still work if it exists, but the new accounts are recommended to avoid browser security warnings.




