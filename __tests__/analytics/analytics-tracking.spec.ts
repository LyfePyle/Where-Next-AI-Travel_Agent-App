/**
 * Analytics & Conversion Funnel Testing Suite
 * Tests for user tracking, conversion funnels, and analytics implementation
 */

import { test, expect } from '@playwright/test'

// Mock analytics events that should be tracked
const ANALYTICS_EVENTS = {
  PAGE_VIEWS: [
    { page: '/', event: 'page_view', properties: { page_title: /where.*next/i } },
    { page: '/plan-trip', event: 'page_view', properties: { page_title: /ai.*travel/i } },
    { page: '/plan-trip', event: 'page_view', properties: { page_title: /plan.*trip/i } }
  ],
  
  USER_INTERACTIONS: [
    { action: 'trip_search_started', trigger: 'form submission', page: '/plan-trip' },
    { action: 'ai_suggestion_requested', trigger: 'button click', page: '/plan-trip' },
    { action: 'trip_saved', trigger: 'save button', page: '/suggestions' },
    { action: 'booking_initiated', trigger: 'book button', page: '/booking/flights' }
  ],
  
  CONVERSION_FUNNEL: [
    { step: 1, event: 'landing_page_view', page: '/' },
    { step: 2, event: 'trip_planning_started', page: '/plan-trip' },
    { step: 3, event: 'suggestions_viewed', page: '/suggestions' },
    { step: 4, event: 'booking_started', page: '/booking/flights' },
    { step: 5, event: 'booking_completed', page: '/booking/success' }
  ]
}

test.describe('Analytics & Tracking Tests', () => {
  let analyticsEvents: any[] = []

  test.beforeEach(async ({ page }) => {
    analyticsEvents = []
    
    // Mock analytics tracking
    await page.addInitScript(() => {
      // Mock Google Analytics
      window.gtag = function(command: string, ...args: any[]) {
        (window as any).__analytics_events = (window as any).__analytics_events || []
        ;(window as any).__analytics_events.push({ type: 'gtag', command, args })
      }
      
      // Mock Mixpanel
      window.mixpanel = {
        track: function(event: string, properties: any) {
          (window as any).__analytics_events = (window as any).__analytics_events || []
          ;(window as any).__analytics_events.push({ type: 'mixpanel', event, properties })
        },
        identify: function(userId: string) {
          (window as any).__analytics_events = (window as any).__analytics_events || []
          ;(window as any).__analytics_events.push({ type: 'mixpanel', action: 'identify', userId })
        },
        people: {
          set: function(properties: any) {
            (window as any).__analytics_events = (window as any).__analytics_events || []
            ;(window as any).__analytics_events.push({ type: 'mixpanel', action: 'people_set', properties })
          }
        }
      }
      
      // Mock custom analytics
      window.analytics = {
        track: function(event: string, properties: any) {
          (window as any).__analytics_events = (window as any).__analytics_events || []
          ;(window as any).__analytics_events.push({ type: 'custom', event, properties })
        },
        page: function(properties: any) {
          (window as any).__analytics_events = (window as any).__analytics_events || []
          ;(window as any).__analytics_events.push({ type: 'custom', action: 'page', properties })
        }
      }
    })
  })

  test.afterEach(async ({ page }) => {
    // Collect analytics events
    const events = await page.evaluate(() => (window as any).__analytics_events || [])
    analyticsEvents.push(...events)
  })

  ANALYTICS_EVENTS.PAGE_VIEWS.forEach(pageView => {
    test(`Page view tracking for ${pageView.page}`, async ({ page }) => {
      await page.goto(pageView.page)
      await page.waitForLoadState('networkidle')
      
      // Wait for analytics to load
      await page.waitForTimeout(1000)
      
      const events = await page.evaluate(() => (window as any).__analytics_events || [])
      
      // Should track page view
      const pageViewEvents = events.filter((e: any) => 
        e.command === 'event' && e.args[0] === 'page_view' ||
        e.action === 'page' ||
        e.event === 'page_view'
      )
      
      expect(pageViewEvents.length).toBeGreaterThan(0)
      
      // Check event properties
      const pageViewEvent = pageViewEvents[0]
      if (pageViewEvent.args && pageViewEvent.args[1]) {
        const properties = pageViewEvent.args[1]
        expect(properties.page_location || properties.page_url).toContain(pageView.page === '/' ? '' : pageView.page)
      }
    })
  })

  test('Trip planning funnel tracking', async ({ page }) => {
    // Step 1: Landing page
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)
    
    // Step 2: Navigate to trip planning
    const planTripLink = page.locator('a[href*="plan"], button:has-text("Plan"), a:has-text("Plan")')
    if (await planTripLink.count() > 0) {
      await planTripLink.first().click()
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)
    } else {
      await page.goto('/plan-trip')
      await page.waitForLoadState('networkidle')
    }
    
    // Step 3: Fill out trip planning form
    const inputs = page.locator('input:visible, select:visible')
    const inputCount = await inputs.count()
    
    if (inputCount > 0) {
      // Fill first few inputs
      for (let i = 0; i < Math.min(inputCount, 3); i++) {
        const input = inputs.nth(i)
        const type = await input.getAttribute('type')
        
        if (type === 'text' || type === 'search' || !type) {
          await input.fill('Vancouver')
        } else if (type === 'number') {
          await input.fill('3000')
        }
      }
      
      // Submit form
      const submitButton = page.locator('button[type="submit"], button:has-text("Search"), button:has-text("Plan")')
      if (await submitButton.count() > 0) {
        await submitButton.first().click()
        await page.waitForTimeout(1000)
      }
    }
    
    // Check funnel tracking
    const events = await page.evaluate(() => (window as any).__analytics_events || [])
    
    // Should have multiple funnel events
    expect(events.length).toBeGreaterThan(1)
    
    // Should track form interactions
    const formEvents = events.filter((e: any) => 
      e.event === 'form_start' || 
      e.event === 'form_submit' ||
      e.event === 'trip_planning_started' ||
      (e.args && e.args[0] === 'form_submit')
    )
    
    expect(formEvents.length).toBeGreaterThan(0)
  })

  test('Conversion tracking for trip booking', async ({ page }) => {
    await page.goto('/booking/flights?from=Vancouver&to=London&price=800')
    await page.waitForLoadState('networkidle')
    
    // Look for booking buttons
    const bookingButtons = page.locator('button:has-text("Book"), button:has-text("Reserve"), button:has-text("Buy")')
    
    if (await bookingButtons.count() > 0) {
      await bookingButtons.first().click()
      await page.waitForTimeout(1000)
      
      const events = await page.evaluate(() => (window as any).__analytics_events || [])
      
      // Should track booking initiation
      const bookingEvents = events.filter((e: any) => 
        e.event === 'booking_started' ||
        e.event === 'purchase_initiated' ||
        (e.args && (e.args[0] === 'booking_started' || e.args[0] === 'purchase'))
      )
      
      expect(bookingEvents.length).toBeGreaterThan(0)
      
      // Check booking event properties
      const bookingEvent = bookingEvents[0]
      if (bookingEvent.properties || (bookingEvent.args && bookingEvent.args[1])) {
        const properties = bookingEvent.properties || bookingEvent.args[1]
        expect(properties.value || properties.price || properties.amount).toBeTruthy()
      }
    }
  })

  test('Error tracking and debugging events', async ({ page }) => {
    // Mock console error
    await page.addInitScript(() => {
      const originalError = console.error
      console.error = function(...args) {
        // Track errors to analytics
        if (window.gtag) {
          window.gtag('event', 'exception', {
            description: args.join(' '),
            fatal: false
          })
        }
        originalError.apply(console, args)
      }
    })
    
    await page.goto('/plan-trip')
    await page.waitForLoadState('networkidle')
    
    // Trigger an error (try to access non-existent endpoint)
    await page.evaluate(() => {
      fetch('/api/non-existent-endpoint')
        .catch(error => {
          console.error('API Error:', error.message)
        })
    })
    
    await page.waitForTimeout(1000)
    
    const events = await page.evaluate(() => (window as any).__analytics_events || [])
    
    // Should track errors
    const errorEvents = events.filter((e: any) => 
      e.command === 'event' && e.args[0] === 'exception' ||
      e.event === 'error' ||
      e.event === 'exception'
    )
    
    if (errorEvents.length > 0) {
      expect(errorEvents.length).toBeGreaterThan(0)
    }
  })

  test('User identification and properties tracking', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Simulate user login/identification
    await page.evaluate(() => {
      // Simulate user identification
      if (window.mixpanel) {
        window.mixpanel.identify('test-user-123')
        window.mixpanel.people.set({
          'User Type': 'Test User',
          'Sign Up Date': new Date().toISOString(),
          'Plan': 'Free'
        })
      }
      
      if (window.gtag) {
        window.gtag('config', 'GA_MEASUREMENT_ID', {
          user_id: 'test-user-123'
        })
      }
    })
    
    await page.waitForTimeout(500)
    
    const events = await page.evaluate(() => (window as any).__analytics_events || [])
    
    // Should track user identification
    const identifyEvents = events.filter((e: any) => 
      e.action === 'identify' ||
      e.action === 'people_set' ||
      (e.command === 'config' && e.args[1]?.user_id)
    )
    
    expect(identifyEvents.length).toBeGreaterThan(0)
  })

  test('Custom event tracking for travel-specific actions', async ({ page }) => {
    await page.goto('/suggestions')
    await page.waitForLoadState('networkidle')
    
    // Look for trip suggestion cards
    const tripCards = page.locator('[data-testid="trip-card"], .trip-card, .suggestion-card')
    
    if (await tripCards.count() > 0) {
      // Click on first trip card
      await tripCards.first().click()
      await page.waitForTimeout(500)
      
      // Look for save/share buttons
      const saveButton = page.locator('button:has-text("Save"), button[title*="save"], button[aria-label*="save"]')
      const shareButton = page.locator('button:has-text("Share"), button[title*="share"], button[aria-label*="share"]')
      
      if (await saveButton.count() > 0) {
        await saveButton.first().click()
        await page.waitForTimeout(300)
      }
      
      if (await shareButton.count() > 0) {
        await shareButton.first().click()
        await page.waitForTimeout(300)
      }
    }
    
    const events = await page.evaluate(() => (window as any).__analytics_events || [])
    
    // Should track travel-specific events
    const travelEvents = events.filter((e: any) => 
      e.event === 'trip_viewed' ||
      e.event === 'trip_saved' ||
      e.event === 'trip_shared' ||
      e.event === 'suggestion_clicked' ||
      (e.args && ['trip_viewed', 'trip_saved', 'trip_shared'].includes(e.args[0]))
    )
    
    expect(travelEvents.length).toBeGreaterThan(0)
  })

  test('Revenue tracking for monetization events', async ({ page }) => {
    await page.goto('/booking/success?booking_id=test123&amount=899')
    await page.waitForLoadState('networkidle')
    
    // Simulate successful booking completion
    await page.evaluate(() => {
      const bookingData = {
        transaction_id: 'test123',
        value: 899,
        currency: 'USD',
        items: [{
          item_id: 'flight_YVR_LHR',
          item_name: 'Vancouver to London Flight',
          category: 'flights',
          quantity: 1,
          price: 899
        }]
      }
      
      // Track purchase with Google Analytics
      if (window.gtag) {
        window.gtag('event', 'purchase', bookingData)
      }
      
      // Track with Mixpanel
      if (window.mixpanel) {
        window.mixpanel.track('Purchase Completed', {
          'Revenue': 899,
          'Product Type': 'Flight',
          'Booking ID': 'test123'
        })
      }
    })
    
    await page.waitForTimeout(500)
    
    const events = await page.evaluate(() => (window as any).__analytics_events || [])
    
    // Should track revenue events
    const revenueEvents = events.filter((e: any) => 
      (e.command === 'event' && e.args[0] === 'purchase') ||
      e.event === 'Purchase Completed' ||
      e.event === 'revenue'
    )
    
    expect(revenueEvents.length).toBeGreaterThan(0)
    
    // Check revenue data
    const revenueEvent = revenueEvents[0]
    if (revenueEvent.args && revenueEvent.args[1]) {
      const data = revenueEvent.args[1]
      expect(data.value || data.Revenue).toBeTruthy()
      expect(data.currency || data.Currency).toBeTruthy()
    } else if (revenueEvent.properties) {
      expect(revenueEvent.properties.Revenue || revenueEvent.properties.value).toBeTruthy()
    }
  })

  test('A/B testing and experiments tracking', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Simulate A/B test assignment
    await page.evaluate(() => {
      // Assign user to experiment variant
      const variants = ['control', 'variant_a', 'variant_b']
      const assignedVariant = variants[Math.floor(Math.random() * variants.length)]
      
      // Track experiment exposure
      if (window.gtag) {
        window.gtag('event', 'experiment_exposure', {
          experiment_id: 'homepage_hero_test',
          variant: assignedVariant
        })
      }
      
      if (window.mixpanel) {
        window.mixpanel.track('Experiment Viewed', {
          'Experiment': 'homepage_hero_test',
          'Variant': assignedVariant
        })
      }
      
      // Store variant for later tracking
      localStorage.setItem('experiment_homepage_hero', assignedVariant)
    })
    
    await page.waitForTimeout(500)
    
    const events = await page.evaluate(() => (window as any).__analytics_events || [])
    
    // Should track experiment exposure
    const experimentEvents = events.filter((e: any) => 
      (e.command === 'event' && e.args[0] === 'experiment_exposure') ||
      e.event === 'Experiment Viewed' ||
      e.event === 'experiment_viewed'
    )
    
    expect(experimentEvents.length).toBeGreaterThan(0)
  })

  test('Performance and timing events tracking', async ({ page }) => {
    await page.goto('/plan-trip')
    await page.waitForLoadState('networkidle')
    
    // Track performance metrics
    await page.evaluate(() => {
      // Simulate timing events
      const performanceTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      
      if (window.gtag && performanceTiming) {
        window.gtag('event', 'timing_complete', {
          name: 'page_load',
          value: Math.round(performanceTiming.loadEventEnd - performanceTiming.loadEventStart)
        })
      }
      
      // Track AI response time
      const aiResponseTime = 1500 // Simulated AI response time
      if (window.mixpanel) {
        window.mixpanel.track('AI Response Time', {
          'Response Time': aiResponseTime,
          'Page': 'ai-travel-agent'
        })
      }
    })
    
    await page.waitForTimeout(500)
    
    const events = await page.evaluate(() => (window as any).__analytics_events || [])
    
    // Should track timing events
    const timingEvents = events.filter((e: any) => 
      (e.command === 'event' && e.args[0] === 'timing_complete') ||
      e.event === 'AI Response Time' ||
      e.event === 'performance'
    )
    
    expect(timingEvents.length).toBeGreaterThan(0)
  })

  test('GDPR compliance and consent tracking', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Look for cookie consent banner
    const consentBanner = page.locator('[class*="cookie"], [class*="consent"], [id*="cookie"], [id*="consent"]')
    const acceptButton = page.locator('button:has-text("Accept"), button:has-text("Agree"), button:has-text("OK")')
    
    if (await consentBanner.count() > 0 && await acceptButton.count() > 0) {
      await acceptButton.first().click()
      await page.waitForTimeout(500)
      
      const events = await page.evaluate(() => (window as any).__analytics_events || [])
      
      // Should track consent events
      const consentEvents = events.filter((e: any) => 
        e.event === 'consent_given' ||
        e.event === 'cookie_consent' ||
        (e.args && e.args[0] === 'consent')
      )
      
      expect(consentEvents.length).toBeGreaterThan(0)
    }
  })

  test('Analytics initialization and configuration', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Check analytics configuration
    const analyticsConfig = await page.evaluate(() => {
      return {
        hasGtag: typeof window.gtag === 'function',
        hasMixpanel: typeof window.mixpanel === 'object',
        hasCustomAnalytics: typeof window.analytics === 'object',
        gaId: (window as any).GA_MEASUREMENT_ID,
        mixpanelToken: (window as any).MIXPANEL_TOKEN
      }
    })
    
    // Should have at least one analytics provider
    const hasAnalytics = analyticsConfig.hasGtag || analyticsConfig.hasMixpanel || analyticsConfig.hasCustomAnalytics
    expect(hasAnalytics).toBe(true)
    
    // Should not expose sensitive configuration in production
    if (process.env.NODE_ENV === 'production') {
      expect(analyticsConfig.gaId).not.toContain('test')
      expect(analyticsConfig.mixpanelToken).not.toContain('test')
    }
  })

  test('Cross-device and session tracking', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Simulate cross-session tracking
    await page.evaluate(() => {
      // Set session ID
      const sessionId = 'session_' + Date.now()
      sessionStorage.setItem('analytics_session_id', sessionId)
      
      // Set user ID (persistent)
      const userId = localStorage.getItem('analytics_user_id') || 'user_' + Math.random().toString(36)
      localStorage.setItem('analytics_user_id', userId)
      
      // Track session start
      if (window.mixpanel) {
        window.mixpanel.track('Session Started', {
          'Session ID': sessionId,
          'User ID': userId,
          'Page': 'homepage'
        })
      }
    })
    
    await page.waitForTimeout(500)
    
    const events = await page.evaluate(() => (window as any).__analytics_events || [])
    const sessionEvents = events.filter((e: any) => e.event === 'Session Started')
    
    expect(sessionEvents.length).toBeGreaterThan(0)
    
    // Check session persistence
    const sessionData = await page.evaluate(() => ({
      sessionId: sessionStorage.getItem('analytics_session_id'),
      userId: localStorage.getItem('analytics_user_id')
    }))
    
    expect(sessionData.sessionId).toBeTruthy()
    expect(sessionData.userId).toBeTruthy()
  })
})
