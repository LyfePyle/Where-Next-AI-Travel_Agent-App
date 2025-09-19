// Analytics tracking system for user events and conversions

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  userId?: string;
  timestamp?: string;
}

export interface UserProperties {
  userId?: string;
  email?: string;
  signupDate?: string;
  totalTripsPlanned?: number;
  totalBookingClicks?: number;
  preferredDestinations?: string[];
  lastActiveDate?: string;
}

// Event names - consistent naming for tracking
export const ANALYTICS_EVENTS = {
  // Core user flow
  TRIP_PLANNED: 'trip_planned',
  SUGGESTIONS_VIEWED: 'suggestions_viewed',
  TRIP_DETAILS_VIEWED: 'trip_details_viewed',
  TRIP_SAVED: 'trip_saved',
  BUDGET_SET: 'budget_set',
  
  // Travel hacks and intelligence
  HACK_VIEWED: 'hack_viewed',
  HACK_EXPANDED: 'hack_expanded',
  PRICE_WATCH_CREATED: 'price_watch_created',
  PRICE_ALERT_RECEIVED: 'price_alert_received',
  
  // Monetization events
  AFFILIATE_CLICK: 'affiliate_click',
  BOOKING_INITIATED: 'booking_initiated',
  CONVERSION_TRACKED: 'conversion_tracked',
  
  // Engagement events
  PAGE_VIEWED: 'page_viewed',
  SESSION_STARTED: 'session_started',
  FEATURE_USED: 'feature_used',
  ERROR_ENCOUNTERED: 'error_encountered'
} as const;

// Check if analytics is enabled
const ANALYTICS_ENABLED = process.env.NEXT_PUBLIC_ANALYTICS_ENABLED !== 'false';
const MIXPANEL_TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

// Initialize analytics services
export function initializeAnalytics(): void {
  if (!ANALYTICS_ENABLED) {
    console.log('📊 Analytics disabled in environment');
    return;
  }

  // Initialize Mixpanel
  if (MIXPANEL_TOKEN && typeof window !== 'undefined') {
    try {
      // Load Mixpanel script
      const script = document.createElement('script');
      script.src = 'https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js';
      script.onload = () => {
        (window as any).mixpanel.init(MIXPANEL_TOKEN, {
          debug: process.env.NODE_ENV === 'development',
          track_pageview: true,
          persistence: 'localStorage'
        });
        
        console.log('📊 Mixpanel initialized');
        
        // Track session start
        trackEvent(ANALYTICS_EVENTS.SESSION_STARTED, {
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent,
          referrer: document.referrer
        });
      };
      document.head.appendChild(script);
    } catch (error) {
      console.error('Error initializing Mixpanel:', error);
    }
  }

  // Initialize Google Analytics 4
  if (GA_MEASUREMENT_ID && typeof window !== 'undefined') {
    try {
      // Load GA4 script
      const gtagScript = document.createElement('script');
      gtagScript.async = true;
      gtagScript.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
      document.head.appendChild(gtagScript);

      // Initialize gtag
      (window as any).dataLayer = (window as any).dataLayer || [];
      const gtag = (...args: any[]) => (window as any).dataLayer.push(args);
      (window as any).gtag = gtag;
      
      gtag('js', new Date());
      gtag('config', GA_MEASUREMENT_ID, {
        page_title: document.title,
        page_location: window.location.href
      });
      
      console.log('📊 Google Analytics initialized');
    } catch (error) {
      console.error('Error initializing Google Analytics:', error);
    }
  }
}

// Main event tracking function
export function trackEvent(eventName: string, properties: Record<string, any> = {}): void {
  if (!ANALYTICS_ENABLED) return;

  const eventData: AnalyticsEvent = {
    name: eventName,
    properties: {
      ...properties,
      timestamp: new Date().toISOString(),
      session_id: getSessionId(),
      page_url: typeof window !== 'undefined' ? window.location.href : '',
      page_title: typeof window !== 'undefined' ? document.title : ''
    }
  };

  try {
    // Send to Mixpanel
    if (typeof window !== 'undefined' && (window as any).mixpanel) {
      (window as any).mixpanel.track(eventName, eventData.properties);
    }

    // Send to Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', eventName, {
        custom_parameter: JSON.stringify(eventData.properties)
      });
    }

    // Store locally for debugging and offline analysis
    storeEventLocally(eventData);

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Analytics Event:', eventName, eventData.properties);
    }

  } catch (error) {
    console.error('Error tracking event:', error);
  }
}

// Track page views
export function trackPageView(pageName: string, additionalProps: Record<string, any> = {}): void {
  trackEvent(ANALYTICS_EVENTS.PAGE_VIEWED, {
    page_name: pageName,
    ...additionalProps
  });
}

// Track user properties
export function setUserProperties(properties: UserProperties): void {
  if (!ANALYTICS_ENABLED) return;

  try {
    // Update Mixpanel user profile
    if (typeof window !== 'undefined' && (window as any).mixpanel) {
      if (properties.userId) {
        (window as any).mixpanel.identify(properties.userId);
      }
      (window as any).mixpanel.people.set(properties);
    }

    // Update GA4 user properties
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('config', GA_MEASUREMENT_ID, {
        user_id: properties.userId,
        custom_map: properties
      });
    }

    // Store locally
    if (typeof window !== 'undefined') {
      localStorage.setItem('userProperties', JSON.stringify(properties));
    }

  } catch (error) {
    console.error('Error setting user properties:', error);
  }
}

// Funnel tracking for conversion analysis
export function trackFunnelStep(funnelName: string, step: string, stepIndex: number, additionalProps: Record<string, any> = {}): void {
  trackEvent('funnel_step', {
    funnel_name: funnelName,
    step_name: step,
    step_index: stepIndex,
    ...additionalProps
  });
}

// Revenue tracking for affiliate conversions
export function trackRevenue(provider: string, amount: number, currency: string = 'USD', additionalProps: Record<string, any> = {}): void {
  trackEvent('revenue_generated', {
    provider,
    amount,
    currency,
    ...additionalProps
  });

  // GA4 enhanced ecommerce
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'purchase', {
      transaction_id: `txn_${Date.now()}`,
      value: amount,
      currency: currency,
      items: [{
        item_id: provider,
        item_name: `Booking via ${provider}`,
        category: 'Travel',
        price: amount,
        quantity: 1
      }]
    });
  }
}

// Error tracking
export function trackError(error: Error | string, context?: Record<string, any>): void {
  const errorData = {
    error_message: typeof error === 'string' ? error : error.message,
    error_stack: typeof error === 'object' ? error.stack : undefined,
    ...context
  };

  trackEvent(ANALYTICS_EVENTS.ERROR_ENCOUNTERED, errorData);
}

// Utility functions
function getSessionId(): string {
  if (typeof window === 'undefined') return 'server_session';
  
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
}

function storeEventLocally(event: AnalyticsEvent): void {
  if (typeof window === 'undefined') return;
  
  try {
    const events = JSON.parse(localStorage.getItem('analytics_events') || '[]');
    events.push(event);
    
    // Keep only last 100 events
    if (events.length > 100) {
      events.splice(0, events.length - 100);
    }
    
    localStorage.setItem('analytics_events', JSON.stringify(events));
  } catch (error) {
    console.error('Error storing event locally:', error);
  }
}

// Analytics hooks for React components
export function useAnalytics() {
  return {
    track: trackEvent,
    trackPage: trackPageView,
    setUser: setUserProperties,
    trackFunnel: trackFunnelStep,
    trackRevenue,
    trackError
  };
}

// Predefined tracking functions for common events
export const analytics = {
  // Trip planning flow
  tripPlanned: (destination: string, dates: { departure: string; return?: string }, travelers: number) => {
    trackEvent(ANALYTICS_EVENTS.TRIP_PLANNED, {
      destination,
      departure_date: dates.departure,
      return_date: dates.return,
      travelers_count: travelers,
      trip_duration: dates.return ? 
        Math.ceil((new Date(dates.return).getTime() - new Date(dates.departure).getTime()) / (1000 * 60 * 60 * 24)) : 
        null
    });
  },

  suggestionsViewed: (count: number, budget?: number) => {
    trackEvent(ANALYTICS_EVENTS.SUGGESTIONS_VIEWED, {
      suggestions_count: count,
      budget_range: budget
    });
  },

  tripSaved: (tripId: string, totalCost: number, destination: string) => {
    trackEvent(ANALYTICS_EVENTS.TRIP_SAVED, {
      trip_id: tripId,
      total_cost: totalCost,
      destination
    });
  },

  // Monetization events
  affiliateClick: (provider: string, productType: string, estimatedValue?: number) => {
    trackEvent(ANALYTICS_EVENTS.AFFILIATE_CLICK, {
      provider,
      product_type: productType,
      estimated_value: estimatedValue
    });
  },

  // Travel hacks
  hackViewed: (hackType: string, savings: number, difficulty: string) => {
    trackEvent(ANALYTICS_EVENTS.HACK_VIEWED, {
      hack_type: hackType,
      potential_savings: savings,
      difficulty_level: difficulty
    });
  },

  priceWatchCreated: (route: string, targetPrice: number, currentPrice: number) => {
    trackEvent(ANALYTICS_EVENTS.PRICE_WATCH_CREATED, {
      route,
      target_price: targetPrice,
      current_price: currentPrice,
      savings_target: currentPrice - targetPrice
    });
  }
};

// Export analytics metrics for dashboard
export function getAnalyticsMetrics(): Promise<any> {
  // In a real app, this would fetch from your analytics API
  return Promise.resolve({
    totalUsers: 1250,
    totalTripsPlanned: 3400,
    conversionRate: 0.034,
    affiliateClicks: 580,
    revenue: 2340.50
  });
}
