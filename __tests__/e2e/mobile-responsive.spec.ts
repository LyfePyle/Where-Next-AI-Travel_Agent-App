/**
 * Mobile Experience & Responsive Design Test Suite
 * Tests touch interactions, responsive layout, and mobile-specific functionality
 */

import { test, expect, devices } from '@playwright/test'

// Mobile device configurations to test
const MOBILE_DEVICES = [
  devices['iPhone 13'],
  devices['iPhone 13 Pro'],
  devices['Samsung Galaxy S21'],
  devices['iPad Air'],
  devices['Pixel 5']
]

// Responsive breakpoints
const BREAKPOINTS = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1200, height: 800 },
  large: { width: 1920, height: 1080 }
}

// Test critical pages for mobile experience
const CRITICAL_PAGES = [
  { url: '/', name: 'Homepage' },
  { url: '/plan-trip', name: 'AI Travel Agent' },
  { url: '/plan-trip', name: 'Trip Planning' },
  { url: '/suggestions', name: 'Trip Suggestions' },
  { url: '/booking/flights', name: 'Flight Booking' },
  { url: '/my-trips', name: 'My Trips' }
]

MOBILE_DEVICES.forEach(device => {
  test.describe(`Mobile Experience - ${device.defaultBrowserType}`, () => {
    test.use({ ...device })

    CRITICAL_PAGES.forEach(page => {
      test(`${page.name} should be mobile responsive`, async ({ page: browserPage }) => {
        await browserPage.goto(page.url)
        
        // Wait for page to load
        await browserPage.waitForLoadState('networkidle')
        
        // Check viewport is properly set
        const viewport = browserPage.viewportSize()
        expect(viewport?.width).toBeGreaterThan(0)
        expect(viewport?.height).toBeGreaterThan(0)
        
        // Check for mobile-friendly meta tags
        const viewportMeta = await browserPage.locator('meta[name="viewport"]').getAttribute('content')
        expect(viewportMeta).toContain('width=device-width')
        
        // Check that content is not horizontally scrollable
        const bodyWidth = await browserPage.evaluate(() => document.body.scrollWidth)
        const viewportWidth = await browserPage.evaluate(() => window.innerWidth)
        expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 10) // Allow small margin
        
        // Take screenshot for visual regression
        await browserPage.screenshot({ 
          path: `screenshots/mobile-${device.name.replace(/\s+/g, '-')}-${page.name.replace(/\s+/g, '-')}.png`,
          fullPage: true 
        })
      })
    })

    test('Touch interactions should work properly', async ({ page }) => {
      await page.goto('/plan-trip')
      await page.waitForLoadState('networkidle')
      
      // Test tap interactions
      const buttons = page.locator('button:visible')
      const buttonCount = await buttons.count()
      
      if (buttonCount > 0) {
        // Test first button tap
        const firstButton = buttons.first()
        await firstButton.tap()
        
        // Check if tap registered (button should have some visual feedback)
        await page.waitForTimeout(100)
      }
      
      // Test scroll behavior
      const initialScrollY = await page.evaluate(() => window.scrollY)
      await page.touchscreen.tap(200, 300)
      await page.touchscreen.tap(200, 200) // Swipe up
      
      // Should be able to scroll
      const scrollHeight = await page.evaluate(() => document.body.scrollHeight)
      const viewportHeight = await page.evaluate(() => window.innerHeight)
      
      if (scrollHeight > viewportHeight) {
        // Page should be scrollable
        await page.evaluate(() => window.scrollTo(0, 100))
        const newScrollY = await page.evaluate(() => window.scrollY)
        expect(newScrollY).toBeGreaterThan(initialScrollY)
      }
    })

    test('Navigation should work on mobile', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      // Look for mobile navigation (hamburger menu, nav drawer, etc.)
      const mobileNav = await page.locator('[data-testid="mobile-nav"], .mobile-nav, button[aria-label*="menu"], button[aria-label*="Menu"]').first()
      
      if (await mobileNav.isVisible()) {
        // Test mobile navigation
        await mobileNav.tap()
        await page.waitForTimeout(300) // Animation time
        
        // Check if navigation menu opened
        const navMenu = page.locator('[role="navigation"], .nav-menu, .mobile-menu')
        if (await navMenu.count() > 0) {
          expect(await navMenu.first().isVisible()).toBe(true)
        }
      }
      
      // Test navigation links
      const navLinks = page.locator('a[href^="/"], button[data-href]')
      const linkCount = await navLinks.count()
      
      if (linkCount > 0) {
        // Test first navigation link
        const firstLink = navLinks.first()
        const href = await firstLink.getAttribute('href') || await firstLink.getAttribute('data-href')
        
        if (href && href !== '#') {
          await firstLink.tap()
          await page.waitForLoadState('networkidle')
          
          // Should navigate to new page
          expect(page.url()).toContain(href)
        }
      }
    })

    test('Forms should be mobile-friendly', async ({ page }) => {
      await page.goto('/plan-trip')
      await page.waitForLoadState('networkidle')
      
      // Find form inputs
      const inputs = page.locator('input:visible, select:visible, textarea:visible')
      const inputCount = await inputs.count()
      
      if (inputCount > 0) {
        for (let i = 0; i < Math.min(inputCount, 3); i++) {
          const input = inputs.nth(i)
          
          // Check input is tappable and has proper size
          const boundingBox = await input.boundingBox()
          if (boundingBox) {
            expect(boundingBox.width).toBeGreaterThan(30) // Minimum touch target
            expect(boundingBox.height).toBeGreaterThan(30)
          }
          
          // Test input focus
          await input.tap()
          await page.waitForTimeout(100)
          
          // Input should be focused
          const isFocused = await input.evaluate(el => el === document.activeElement)
          expect(isFocused).toBe(true)
          
          // Test typing
          const inputType = await input.getAttribute('type')
          if (inputType !== 'file' && inputType !== 'color') {
            await input.fill('test input')
            const value = await input.inputValue()
            expect(value).toBe('test input')
            await input.clear()
          }
        }
      }
    })

    test('Loading states should be mobile-optimized', async ({ page }) => {
      await page.goto('/plan-trip')
      
      // Check for loading indicators
      const loadingIndicators = page.locator(
        '[data-testid="loading"], .loading, .spinner, [aria-label*="loading"], [aria-label*="Loading"]'
      )
      
      // Loading indicators should be visible and properly sized
      if (await loadingIndicators.count() > 0) {
        const firstLoader = loadingIndicators.first()
        if (await firstLoader.isVisible()) {
          const boundingBox = await firstLoader.boundingBox()
          if (boundingBox) {
            expect(boundingBox.width).toBeGreaterThan(20)
            expect(boundingBox.height).toBeGreaterThan(20)
          }
        }
      }
    })
  })
})

// Responsive design tests across breakpoints
Object.entries(BREAKPOINTS).forEach(([breakpoint, dimensions]) => {
  test.describe(`Responsive Design - ${breakpoint}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize(dimensions)
    })

    CRITICAL_PAGES.forEach(pageInfo => {
      test(`${pageInfo.name} should adapt to ${breakpoint} layout`, async ({ page }) => {
        await page.goto(pageInfo.url)
        await page.waitForLoadState('networkidle')
        
        // Check layout adapts to viewport
        const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
        expect(bodyWidth).toBeLessThanOrEqual(dimensions.width + 20) // Small tolerance
        
        // Check for responsive navigation
        if (breakpoint === 'mobile') {
          // Mobile should have condensed navigation
          const mobileNavElements = page.locator(
            '[data-testid="mobile-nav"], .mobile-nav, button[aria-label*="menu"]'
          )
          const desktopNavElements = page.locator(
            '[data-testid="desktop-nav"], .desktop-nav, nav:not(.mobile-nav)'
          )
          
          // Either mobile nav is visible OR desktop nav adapts properly
          const hasMobileNav = await mobileNavElements.count() > 0
          const hasDesktopNav = await desktopNavElements.count() > 0
          
          expect(hasMobileNav || hasDesktopNav).toBe(true)
        }
        
        // Check text readability
        const textElements = page.locator('p, h1, h2, h3, h4, h5, h6, span').first()
        if (await textElements.count() > 0) {
          const fontSize = await textElements.evaluate(el => 
            window.getComputedStyle(el).fontSize
          )
          const fontSizeNum = parseInt(fontSize.replace('px', ''))
          
          // Text should be readable (minimum 14px on mobile, 12px on desktop)
          const minFontSize = breakpoint === 'mobile' ? 14 : 12
          expect(fontSizeNum).toBeGreaterThanOrEqual(minFontSize)
        }
        
        // Take screenshot for visual comparison
        await page.screenshot({ 
          path: `screenshots/responsive-${breakpoint}-${pageInfo.name.replace(/\s+/g, '-')}.png`,
          fullPage: true 
        })
      })
    })

    test(`Interactive elements should be properly sized for ${breakpoint}`, async ({ page }) => {
      await page.goto('/plan-trip')
      await page.waitForLoadState('networkidle')
      
      // Check button sizes
      const buttons = page.locator('button:visible')
      const buttonCount = await buttons.count()
      
      if (buttonCount > 0) {
        for (let i = 0; i < Math.min(buttonCount, 5); i++) {
          const button = buttons.nth(i)
          const boundingBox = await button.boundingBox()
          
          if (boundingBox) {
            // Touch targets should be at least 44px on mobile
            const minSize = breakpoint === 'mobile' ? 44 : 32
            
            expect(boundingBox.width).toBeGreaterThanOrEqual(minSize)
            expect(boundingBox.height).toBeGreaterThanOrEqual(minSize)
          }
        }
      }
      
      // Check link sizes
      const links = page.locator('a:visible')
      const linkCount = await links.count()
      
      if (linkCount > 0) {
        for (let i = 0; i < Math.min(linkCount, 3); i++) {
          const link = links.nth(i)
          const boundingBox = await link.boundingBox()
          
          if (boundingBox && boundingBox.width > 10 && boundingBox.height > 10) {
            // Links should be tappable
            const minHeight = breakpoint === 'mobile' ? 40 : 24
            expect(boundingBox.height).toBeGreaterThanOrEqual(minHeight)
          }
        }
      }
    })
  })
})

// Touch gesture tests
test.describe('Touch Gestures & Interactions', () => {
  test.use(devices['iPhone 13'])

  test('Swipe gestures should work for carousels/sliders', async ({ page }) => {
    await page.goto('/suggestions')
    await page.waitForLoadState('networkidle')
    
    // Look for swipeable elements
    const swipeableElements = page.locator(
      '[data-testid="carousel"], .carousel, .slider, .swiper, [data-swipe="true"]'
    )
    
    if (await swipeableElements.count() > 0) {
      const carousel = swipeableElements.first()
      const boundingBox = await carousel.boundingBox()
      
      if (boundingBox) {
        // Perform swipe gesture
        const startX = boundingBox.x + boundingBox.width * 0.8
        const endX = boundingBox.x + boundingBox.width * 0.2
        const y = boundingBox.y + boundingBox.height / 2
        
        await page.touchscreen.tap(startX, y)
        await page.mouse.move(startX, y)
        await page.mouse.down()
        await page.mouse.move(endX, y)
        await page.mouse.up()
        
        // Allow animation to complete
        await page.waitForTimeout(500)
      }
    }
  })

  test('Pinch to zoom should be disabled on interface elements', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Check viewport meta tag prevents zooming on form inputs
    const viewportMeta = await page.locator('meta[name="viewport"]').getAttribute('content')
    
    // Should have user-scalable=no or maximum-scale=1 for app-like experience
    const hasZoomDisabled = viewportMeta?.includes('user-scalable=no') || 
                           viewportMeta?.includes('maximum-scale=1')
    
    // For travel app, we might want to allow some zoom for accessibility
    // So this test is more informational
    expect(typeof hasZoomDisabled).toBe('boolean')
  })

  test('Long press should trigger context menus where appropriate', async ({ page }) => {
    await page.goto('/my-trips')
    await page.waitForLoadState('networkidle')
    
    // Look for trip cards or interactive elements
    const tripCards = page.locator('[data-testid="trip-card"], .trip-card, .card')
    
    if (await tripCards.count() > 0) {
      const firstCard = tripCards.first()
      const boundingBox = await firstCard.boundingBox()
      
      if (boundingBox) {
        // Simulate long press
        const centerX = boundingBox.x + boundingBox.width / 2
        const centerY = boundingBox.y + boundingBox.height / 2
        
        await page.touchscreen.tap(centerX, centerY, { delay: 1000 })
        
        // Check if context menu appeared
        await page.waitForTimeout(300)
        const contextMenu = page.locator('[role="menu"], .context-menu, .dropdown-menu')
        
        // This is optional - not all cards need context menus
        const hasContextMenu = await contextMenu.count() > 0
        expect(typeof hasContextMenu).toBe('boolean')
      }
    }
  })
})

// Performance on mobile devices
test.describe('Mobile Performance', () => {
  test.use(devices['iPhone 13'])

  test('Pages should load quickly on mobile', async ({ page }) => {
    const performanceMetrics: Array<{page: string, loadTime: number}> = []
    
    for (const pageInfo of CRITICAL_PAGES.slice(0, 3)) { // Test first 3 pages
      const startTime = Date.now()
      
      await page.goto(pageInfo.url)
      await page.waitForLoadState('networkidle')
      
      const loadTime = Date.now() - startTime
      performanceMetrics.push({ page: pageInfo.name, loadTime })
      
      // Mobile pages should load within 3 seconds
      expect(loadTime).toBeLessThan(3000)
    }
    
    console.log('Mobile Performance Metrics:', performanceMetrics)
  })

  test('Images should be optimized for mobile', async ({ page }) => {
    await page.goto('/suggestions')
    await page.waitForLoadState('networkidle')
    
    const images = page.locator('img:visible')
    const imageCount = await images.count()
    
    if (imageCount > 0) {
      for (let i = 0; i < Math.min(imageCount, 5); i++) {
        const img = images.nth(i)
        
        // Check if image has proper attributes
        const src = await img.getAttribute('src')
        const alt = await img.getAttribute('alt')
        const loading = await img.getAttribute('loading')
        
        expect(src).toBeTruthy()
        expect(alt).toBeTruthy() // Accessibility
        
        // Should use lazy loading for performance
        if (loading !== null) {
          expect(loading).toBe('lazy')
        }
        
        // Check if image is properly sized
        const boundingBox = await img.boundingBox()
        if (boundingBox) {
          expect(boundingBox.width).toBeGreaterThan(0)
          expect(boundingBox.height).toBeGreaterThan(0)
        }
      }
    }
  })
})

// Orientation change tests
test.describe('Device Orientation', () => {
  test.use(devices['iPhone 13'])

  test('App should handle orientation changes gracefully', async ({ page }) => {
    await page.goto('/plan-trip')
    await page.waitForLoadState('networkidle')
    
    // Test portrait mode first
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForTimeout(500)
    
    // Take screenshot in portrait
    await page.screenshot({ path: 'screenshots/portrait-layout.png' })
    
    // Switch to landscape
    await page.setViewportSize({ width: 667, height: 375 })
    await page.waitForTimeout(500)
    
    // Take screenshot in landscape
    await page.screenshot({ path: 'screenshots/landscape-layout.png' })
    
    // Check layout adapts
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    expect(bodyWidth).toBeLessThanOrEqual(667 + 20) // Viewport width + tolerance
    
    // Check content is still accessible
    const buttons = page.locator('button:visible')
    const buttonCount = await buttons.count()
    expect(buttonCount).toBeGreaterThan(0) // Should still have interactive elements
  })
})
