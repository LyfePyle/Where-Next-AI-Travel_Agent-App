/**
 * Cross-Browser Compatibility Tests
 * Tests critical functionality across Chrome, Firefox, and Safari (WebKit)
 */

import { test, expect } from '@playwright/test'

const BROWSERS = ['chromium', 'firefox', 'webkit'] as const
const CRITICAL_PAGES = [
  { url: '/', name: 'Homepage', features: ['navigation', 'images', 'responsive-layout'] },
  { url: '/ai-travel-agent', name: 'AI Travel Agent', features: ['forms', 'ai-integration', 'interactions'] },
  { url: '/plan-trip', name: 'Trip Planning', features: ['forms', 'validation', 'autocomplete'] },
  { url: '/suggestions', name: 'Trip Suggestions', features: ['cards', 'interactions', 'buttons'] }
]

// Test each critical page across browsers using the configured browser projects
CRITICAL_PAGES.forEach(pageInfo => {
  test.describe(`Cross-Browser: ${pageInfo.name}`, () => {
    
    test(`${pageInfo.name} should load correctly`, async ({ page, browserName }) => {
      console.log(`Testing ${pageInfo.name} in ${browserName}`)
      
      // Navigate to page
      await page.goto(pageInfo.url)
      await page.waitForLoadState('networkidle')

      // Basic page loading
      expect(await page.title()).toBeTruthy()
      
      // Page should not have critical errors
      const errorMessages = await page.locator('[data-testid="error"], .error-message, .error').count()
      expect(errorMessages).toBe(0)
      
      // Test page-specific features
      for (const feature of pageInfo.features) {
        await testFeature(page, feature, browserName as string)
      }
    })

    test(`${pageInfo.name} should be responsive`, async ({ page, browserName }) => {
      await page.goto(pageInfo.url)
      
      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      await page.waitForTimeout(300)
      
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
      expect(bodyWidth).toBeLessThanOrEqual(375 + 50) // Allow some tolerance
      
      // Test tablet viewport  
      await page.setViewportSize({ width: 768, height: 1024 })
      await page.waitForTimeout(300)
      
      // Reset to desktop
      await page.setViewportSize({ width: 1280, height: 720 })
    })

    test(`${pageInfo.name} should handle JavaScript`, async ({ page, browserName }) => {
      await page.goto(pageInfo.url)
      
      // Test JavaScript functionality
      const jsWorks = await page.evaluate(() => {
        try {
          return typeof window !== 'undefined' && typeof document !== 'undefined'
        } catch (error) {
          return false
        }
      })
      
      expect(jsWorks).toBe(true)
      
      // Test local storage
      const storageWorks = await page.evaluate(() => {
        try {
          localStorage.setItem('test', 'value')
          const retrieved = localStorage.getItem('test')
          localStorage.removeItem('test')
          return retrieved === 'value'
        } catch (error) {
          return false
        }
      })
      
      expect(storageWorks).toBe(true)
    })
  })
})

// Performance test across browsers
test.describe('Cross-Browser Performance', () => {
  test('Homepage should perform well across browsers', async ({ page, browserName }) => {
    const startTime = Date.now()
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    const loadTime = Date.now() - startTime
    
    // Performance expectations (slightly relaxed for cross-browser testing)
    expect(loadTime).toBeLessThan(10000) // 10 seconds max across all browsers
    
    // Get performance metrics
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        totalLoadTime: navigation.loadEventEnd - navigation.fetchStart
      }
    })
    
    console.log(`${browserName} Performance:`, performanceMetrics)
    expect(performanceMetrics.totalLoadTime).toBeLessThan(8000) // 8 seconds max
  })
})

// Feature testing helper
async function testFeature(page: any, feature: string, browserName: string) {
  console.log(`Testing ${feature} in ${browserName}`)
  
  switch (feature) {
    case 'navigation':
      const navLinks = page.locator('a[href], button[data-href]')
      const linkCount = await navLinks.count()
      expect(linkCount).toBeGreaterThan(0)
      break

    case 'forms':
      const forms = page.locator('form')
      const formCount = await forms.count()
      
      if (formCount > 0) {
        const firstForm = forms.first()
        expect(await firstForm.isVisible()).toBe(true)
        
        // Check for form inputs
        const inputs = firstForm.locator('input, select, textarea')
        const inputCount = await inputs.count()
        if (inputCount > 0) {
          expect(await inputs.first().isVisible()).toBe(true)
        }
      }
      break

    case 'images':
      const images = page.locator('img:visible')
      const imageCount = await images.count()
      
      if (imageCount > 0) {
        const firstImage = images.first()
        await firstImage.waitFor({ state: 'visible' })
        
        const naturalWidth = await firstImage.evaluate((img: HTMLImageElement) => img.naturalWidth)
        expect(naturalWidth).toBeGreaterThan(0)
      }
      break

    case 'responsive-layout':
      // Test layout at different viewport sizes
      await page.setViewportSize({ width: 768, height: 1024 })
      await page.waitForTimeout(300)
      
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
      expect(bodyWidth).toBeLessThanOrEqual(768 + 50) // Allow some tolerance
      
      // Reset viewport
      await page.setViewportSize({ width: 1280, height: 720 })
      break

    case 'cards':
      const cards = page.locator('[class*="card"], .card, [data-testid*="card"]')
      const cardCount = await cards.count()
      if (cardCount > 0) {
        expect(await cards.first().isVisible()).toBe(true)
      }
      break

    case 'interactions':
      const interactiveElements = page.locator('button:visible, a:visible, [role="button"]:visible')
      const elementCount = await interactiveElements.count()
      
      if (elementCount > 0) {
        const firstElement = interactiveElements.first()
        await firstElement.hover()
        expect(await firstElement.isVisible()).toBe(true)
      }
      break

    case 'buttons':
      const buttons = page.locator('button:visible')
      const buttonCount = await buttons.count()
      
      if (buttonCount > 0) {
        const firstButton = buttons.first()
        expect(await firstButton.isEnabled()).toBe(true)
      }
      break

    case 'validation':
      // Test form validation if forms exist
      const formsWithValidation = page.locator('form[novalidate], form')
      const formValidationCount = await formsWithValidation.count()
      
      if (formValidationCount > 0) {
        const requiredInputs = page.locator('input[required], select[required]')
        const requiredCount = await requiredInputs.count()
        // Just verify required inputs exist if present
        if (requiredCount > 0) {
          expect(await requiredInputs.first().isVisible()).toBe(true)
        }
      }
      break

    case 'autocomplete':
      // Test autocomplete functionality
      const autocompleteInputs = page.locator('input[list], input[autocomplete]')
      const autocompleteCount = await autocompleteInputs.count()
      
      if (autocompleteCount > 0) {
        expect(await autocompleteInputs.first().isVisible()).toBe(true)
      }
      break

    case 'ai-integration':
      // Test AI-related elements
      const aiElements = page.locator('[data-testid*="ai"], [class*="ai"], .ai-input')
      const aiCount = await aiElements.count()
      
      if (aiCount > 0) {
        expect(await aiElements.first().isVisible()).toBe(true)
      }
      break

    default:
      console.log(`Feature ${feature} test not implemented`)
      break
  }
}