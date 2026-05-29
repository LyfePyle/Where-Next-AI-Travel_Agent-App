'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function LoginDebugPage() {
  const [email, setEmail] = useState('test@wherenext.app');
  const [password, setPassword] = useState('TestPassword2024!');
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testLogin = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const supabase = createClient();
      
      console.log('🔍 Starting login test...');
      console.log('Email:', email);
      console.log('Password:', password ? '***' : 'MISSING');

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('📊 Supabase Response:');
      console.log('Data:', data);
      console.log('Error:', error);

      if (error) {
        setResult({
          success: false,
          error: {
            message: error.message,
            status: error.status,
            name: error.name,
            fullError: error,
          },
        });
      } else if (data?.session) {
        setResult({
          success: true,
          session: {
            user: data.session.user,
            expiresAt: data.session.expires_at,
            accessToken: data.session.access_token ? 'Present' : 'Missing',
          },
        });
      } else {
        setResult({
          success: false,
          error: {
            message: 'No session returned, but no error either',
            data: data,
          },
        });
      }
    } catch (err: any) {
      console.error('❌ Unexpected error:', err);
      setResult({
        success: false,
        error: {
          message: err.message || 'Unknown error',
          stack: err.stack,
          fullError: err,
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkUser = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const supabase = createClient();
      const { data: { user }, error } = await supabase.auth.getUser();
      
      setResult({
        check: 'current_user',
        user: user ? {
          id: user.id,
          email: user.email,
          confirmed: user.email_confirmed_at ? 'Yes' : 'No',
        } : null,
        error: error ? {
          message: error.message,
          status: error.status,
        } : null,
      });
    } catch (err: any) {
      setResult({
        check: 'current_user',
        error: {
          message: err.message,
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🔍 Login Debug Tool</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Login</h2>
          
          <div className="space-y-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={testLogin}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Testing...' : 'Test Login'}
            </button>
            
            <button
              onClick={checkUser}
              disabled={isLoading}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
            >
              Check Current User
            </button>
          </div>
        </div>

        {result && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Result</h2>
            
            {result.success ? (
              <div className="bg-green-50 border border-green-200 rounded p-4">
                <h3 className="font-semibold text-green-800 mb-2">✅ Login Successful!</h3>
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(result.session, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded p-4">
                <h3 className="font-semibold text-red-800 mb-2">❌ Login Failed</h3>
                <div className="space-y-2">
                  <p><strong>Error Message:</strong> {result.error?.message}</p>
                  {result.error?.status && (
                    <p><strong>Status:</strong> {result.error.status}</p>
                  )}
                  {result.error?.name && (
                    <p><strong>Error Type:</strong> {result.error.name}</p>
                  )}
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-medium">Full Error Details</summary>
                    <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                      {JSON.stringify(result.error, null, 2)}
                    </pre>
                  </details>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">📋 What to Check in Supabase</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Go to Supabase Dashboard → Authentication → Users</li>
            <li>Find user: <code className="bg-gray-200 px-1 rounded">{email}</code></li>
            <li>Check: Does the user exist?</li>
            <li>Check: Is "Confirmed" = <strong>true</strong>?</li>
            <li>In SQL Editor, run:
              <pre className="bg-gray-100 p-2 rounded mt-2 text-xs">
{`SELECT p.*, u.email, u.email_confirmed_at
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email = '${email}';`}
              </pre>
            </li>
            <li>Should return 1 row with profile data</li>
          </ol>
        </div>
      </div>
    </div>
  );
}













