# Supabase "Failed to fetch" Error Troubleshooting

If you're seeing `TypeError: Failed to fetch` errors in the console, this usually means:

## Common Causes:

1. **Missing or Invalid Supabase URL/Key**
   - Check your `.env.local` file has:
     - `NEXT_PUBLIC_SUPABASE_URL` (should start with `https://`)
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (should be a long string)

2. **Invalid Supabase URL Format**
   - URL should be: `https://xxxxx.supabase.co`
   - Make sure it doesn't have trailing slashes

3. **Network Connectivity**
   - Check your internet connection
   - Check if Supabase is accessible from your network

4. **Expired/Invalid Session**
   - Clear your browser localStorage and cookies
   - Sign out and sign back in

## Quick Fixes:

1. **Verify Environment Variables:**
   ```bash
   # Check if variables are set
   echo $NEXT_PUBLIC_SUPABASE_URL
   echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```

2. **Clear Browser Storage:**
   - Open DevTools (F12)
   - Go to Application/Storage tab
   - Clear Local Storage and Cookies
   - Refresh the page

3. **Check Supabase Dashboard:**
   - Go to your Supabase project dashboard
   - Verify the URL and anon key match your `.env.local` file
   - Check if your project is active (not paused)

4. **Restart Dev Server:**
   ```bash
   # Stop the server (Ctrl+C)
   # Restart it
   npm run dev
   ```

## If Error Persists:

The error is non-fatal - the app will still work, but authentication features may not work correctly. The error is logged but won't crash the app.



