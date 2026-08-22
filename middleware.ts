import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/dashboard',
  '/saved',
  '/plan-trip',
  '/trip-details',
  '/budgets',
  '/profile',
  '/settings'
];

// API routes that require authentication
const PROTECTED_API_ROUTES = [
  '/api/trips',
  '/api/budgets',
  '/api/bookings',
  '/api/cart',
  '/api/orders'
];

// Routes that should redirect authenticated users
const AUTH_ROUTES = [
  '/auth/login',
  '/auth/register',
  '/auth/reset-password'
];

function redirectWithSessionCookies(url: URL, sessionResponse: NextResponse) {
  const redirectResponse = NextResponse.redirect(url);
  sessionResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });
  return redirectResponse;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files and API routes that don't need auth
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/stripe/webhook') ||
    pathname.startsWith('/api/utils') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check if demo mode is enabled (allow dashboard access in development)
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true' || 
                     process.env.NODE_ENV === 'development' ||
                     !process.env.NEXT_PUBLIC_SUPABASE_URL;

  // Create Supabase client with cookie handling for session refresh
  let sessionResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
          });
          sessionResponse = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            sessionResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    const isAuthenticated = !!user && !error;

    // Handle protected routes
    if (PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
      // Allow dashboard access in demo/development mode even without auth
      if (!isAuthenticated && !isDemoMode) {
        // Redirect to login with return URL
        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('redirectTo', pathname);
        return redirectWithSessionCookies(loginUrl, sessionResponse);
      }
    }

    // Handle protected API routes
    if (PROTECTED_API_ROUTES.some(route => pathname.startsWith(route))) {
      // Allow cart API in demo mode
      if (!isAuthenticated && !isDemoMode && pathname.startsWith('/api/cart')) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      } else if (!isAuthenticated && !pathname.startsWith('/api/cart')) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
    }

    // Handle auth routes (redirect if already authenticated)
    if (AUTH_ROUTES.some(route => pathname.startsWith(route))) {
      if (isAuthenticated) {
        const redirectTo =
          request.nextUrl.searchParams.get('redirectTo') ||
          request.nextUrl.searchParams.get('redirect') ||
          request.nextUrl.searchParams.get('next');
        const destination =
          redirectTo && redirectTo.startsWith('/') ? redirectTo : '/dashboard';
        return redirectWithSessionCookies(new URL(destination, request.url), sessionResponse);
      }
    }

    // Handle root redirect
    if (pathname === '/') {
      if (isAuthenticated) {
        return redirectWithSessionCookies(new URL('/dashboard', request.url), sessionResponse);
      }
      // Let the homepage handle the unauthenticated state
    }

    return sessionResponse;

  } catch (error) {
    console.error('Middleware error:', error);
    
    // For API routes, return 500
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
    
    // For page routes, redirect to error page or homepage
    return NextResponse.redirect(new URL('/', request.url));
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
