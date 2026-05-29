'use client';

import Link from 'next/link';

export default function LoginIssuesHelpPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        {/* Breadcrumb / Back Link */}
        <div className="mb-6">
          <Link
            href="/"
            className="text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            ← Back to Home
          </Link>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 flex items-center gap-2">
          <span role="img" aria-label="wrench">
            🔧
          </span>
          Fix Login Issues – Step by Step Guide
        </h1>

        <p className="text-gray-600 mb-8">
          Use this checklist to debug login problems in your Where Next dev setup
          (Supabase + Next.js).
        </p>

        {/* Diagnosing the Problem */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span role="img" aria-label="magnifying glass">
              🔍
            </span>
            Diagnosing the Problem
          </h2>

          <p className="text-gray-700 mb-4">
            Start by checking your browser dev tools to see what&apos;s actually
            failing.
          </p>

          <div className="space-y-4">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">
                Step 1: Check Browser Console
              </h3>
              <ol className="list-decimal list-inside space-y-1 text-gray-700 text-sm md:text-base">
                <li>Open <code className="px-1 bg-gray-100 rounded">http://localhost:3000/auth/login</code></li>
                <li>Press <strong>F12</strong> to open Developer Tools</li>
                <li>Click the <strong>Console</strong> tab</li>
                <li>Try to login</li>
                <li>
                  Look for <strong>error messages</strong> and copy them somewhere
                  (you&apos;ll need them if you ask for help).
                </li>
              </ol>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">
                Step 2: Check for Error Messages on the Page
              </h3>
              <p className="text-gray-700 text-sm md:text-base">
                Look for a red error box above the login form. Copy the exact
                message (spelling and capitalization included).
              </p>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">
                Step 3: Check Network Tab
              </h3>
              <ol className="list-decimal list-inside space-y-1 text-gray-700 text-sm md:text-base">
                <li>In Developer Tools, open the <strong>Network</strong> tab</li>
                <li>Try to login again</li>
                <li>Look for requests to <code className="px-1 bg-gray-100 rounded">/auth/v1/token</code> or similar</li>
                <li>
                  Check if they return errors (red status codes like 4xx or 5xx)
                </li>
              </ol>
            </div>
          </div>
        </section>

        {/* Common Issues & Fixes */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            🐛 Common Issues &amp; Fixes
          </h2>

          {/* Issue 1 */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 mb-4">
            <h3 className="font-semibold text-red-600 mb-2">
              Issue 1: &quot;Invalid email or password&quot;
            </h3>
            <p className="text-gray-700 mb-2 font-medium">Possible causes:</p>
            <ul className="list-disc list-inside text-gray-700 text-sm md:text-base mb-3">
              <li>User doesn&apos;t exist in Supabase</li>
              <li>Wrong password</li>
              <li>User not confirmed</li>
            </ul>
            <p className="text-gray-700 font-medium mb-1">Solution:</p>
            <ol className="list-decimal list-inside text-gray-700 text-sm md:text-base space-y-1">
              <li>Go to Supabase Dashboard → Authentication → Users</li>
              <li>Check if your user exists</li>
              <li>
                If not, create it:
                <ul className="list-disc list-inside ml-5 mt-1">
                  <li>Email: <code className="px-1 bg-gray-100 rounded">test@wherenext.app</code></li>
                  <li>Password: <code className="px-1 bg-gray-100 rounded">TestPassword2024!</code></li>
                  <li>Check <strong>&quot;Auto Confirm User&quot;</strong></li>
                </ul>
              </li>
              <li>
                If user exists, try resetting the password or creating a fresh
                test account.
              </li>
            </ol>
          </div>

          {/* Issue 2 */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 mb-4">
            <h3 className="font-semibold text-red-600 mb-2">
              Issue 2: &quot;profiles does not exist&quot;
            </h3>
            <p className="text-gray-700 mb-2">
              This means the <code className="px-1 bg-gray-100 rounded">profiles</code> table hasn&apos;t been set up correctly.
            </p>
            <p className="text-gray-700 font-medium mb-1">Solution:</p>
            <ol className="list-decimal list-inside text-gray-700 text-sm md:text-base space-y-2">
              <li>
                Go to Supabase Dashboard → <strong>SQL Editor</strong> and run
                your <code className="px-1 bg-gray-100 rounded">supabase/setup-profiles.sql</code>
              </li>
              <li>
                Verify:
                <pre className="mt-2 p-2 bg-gray-900 text-gray-100 rounded text-xs overflow-x-auto">
{`SELECT * FROM public.profiles;`}
                </pre>
              </li>
              <li>
                If the user already exists, manually create their profile:
                <pre className="mt-2 p-2 bg-gray-900 text-gray-100 rounded text-xs overflow-x-auto">
{`INSERT INTO public.profiles (id)
SELECT id FROM auth.users WHERE email = 'test@wherenext.app'
ON CONFLICT (id) DO NOTHING;`}
                </pre>
              </li>
            </ol>
          </div>

          {/* Issue 3 */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 mb-4">
            <h3 className="font-semibold text-red-600 mb-2">
              Issue 3: Login succeeds but redirects back to login
            </h3>
            <p className="text-gray-700 mb-2">
              Auth worked, but the session cookie isn&apos;t being recognized by
              your app, so middleware thinks you&apos;re logged out.
            </p>
            <p className="text-gray-700 font-medium mb-1">Solution:</p>
            <ol className="list-decimal list-inside text-gray-700 text-sm md:text-base space-y-1">
              <li>
                Clear browser cookies for <code className="px-1 bg-gray-100 rounded">localhost:3000</code> (DevTools → Application → Cookies).
              </li>
              <li>
                Confirm <code className="px-1 bg-gray-100 rounded">.env.local</code> has:
                <pre className="mt-2 p-2 bg-gray-900 text-gray-100 rounded text-xs overflow-x-auto">
{`NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key`}
                </pre>
              </li>
              <li>Restart dev server: stop it and run <code className="px-1 bg-gray-100 rounded">npm run dev</code> again.</li>
              <li>Try logging in once more.</li>
            </ol>
          </div>

          {/* Issue 4 */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <h3 className="font-semibold text-red-600 mb-2">
              Issue 4: &quot;Network error&quot; or &quot;Failed to fetch&quot;
            </h3>
            <p className="text-gray-700 font-medium mb-1">Solution:</p>
            <ul className="list-disc list-inside text-gray-700 text-sm md:text-base space-y-1">
              <li>Check your Supabase project is active (not paused).</li>
              <li>Verify environment variables are correct.</li>
              <li>Confirm internet connection.</li>
              <li>Open Supabase Dashboard to make sure the project responds.</li>
            </ul>
          </div>
        </section>

        {/* Quick Fix Checklist */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            ✅ Quick Fix Checklist
          </h2>
          <p className="text-gray-700 mb-3">
            Run through these in order. Don&apos;t skip steps:
          </p>
          <ul className="space-y-2 text-gray-700 text-sm md:text-base">
            <li>☐ User exists in Supabase (Authentication → Users)</li>
            <li>☐ Profiles table exists and is populated</li>
            <li>☐ <code className="px-1 bg-gray-100 rounded">.env.local</code> has correct URL &amp; anon key</li>
            <li>☐ Dev server restarted after env changes</li>
            <li>☐ Browser cookies cleared for localhost</li>
            <li>☐ Guest / demo login tested</li>
          </ul>
        </section>

        {/* Expected Behavior */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            🎯 Expected Behavior When Login Works
          </h2>
          <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm md:text-base">
            <li>You enter email/password and click &quot;Sign in&quot;</li>
            <li>You&apos;re redirected to <code className="px-1 bg-gray-100 rounded">/dashboard</code></li>
            <li>Protected pages load without redirecting back to login</li>
            <li>Your profile / avatar appears in navigation</li>
            <li>No red error messages on the login screen</li>
          </ul>
        </section>

        {/* Help prompt */}
        <section className="bg-purple-50 border border-purple-200 rounded-2xl p-5 md:p-6">
          <h2 className="text-xl font-bold text-purple-900 mb-2">
            Still stuck?
          </h2>
          <p className="text-purple-900 mb-2 text-sm md:text-base">
            When you ask for help, include:
          </p>
          <ul className="list-disc list-inside text-purple-900 text-sm md:text-base space-y-1">
            <li>The exact error message from the login page</li>
            <li>Console errors (DevTools → Console → copy text)</li>
            <li>Network errors (failed requests + status codes)</li>
            <li>What actually happens: stays on login, loops, etc.</li>
            <li>Which login method you tried (manual, demo, guest)</li>
          </ul>
        </section>
      </div>
    </div>
  );
}














