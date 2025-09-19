'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { initializeAnalytics, trackPageView } from '@/lib/analytics';

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

export default function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const pathname = usePathname();

  useEffect(() => {
    // Initialize analytics services on mount
    initializeAnalytics();
  }, []);

  useEffect(() => {
    // Track page views on route changes
    if (pathname) {
      const pageName = getPageName(pathname);
      trackPageView(pageName, {
        path: pathname,
        url: window.location.href
      });
    }
  }, [pathname]);

  return <>{children}</>;
}

function getPageName(pathname: string): string {
  // Convert pathname to readable page name
  const pageNames: Record<string, string> = {
    '/': 'Home',
    '/plan-trip': 'Plan Trip',
    '/suggestions': 'Trip Suggestions',
    '/saved': 'Saved Trips',
    '/budget': 'Budget Calculator',
    '/budget-calculator': 'Budget Calculator',
    '/profile': 'User Profile',
    '/auth/login': 'Login',
    '/auth/register': 'Register'
  };

  // Handle dynamic routes
  if (pathname.startsWith('/trip-details/')) {
    return 'Trip Details';
  }
  if (pathname.startsWith('/trip/')) {
    return 'Trip Details (Legacy)';
  }
  if (pathname.startsWith('/booking/')) {
    return 'Booking Flow';
  }

  return pageNames[pathname] || 'Unknown Page';
}
