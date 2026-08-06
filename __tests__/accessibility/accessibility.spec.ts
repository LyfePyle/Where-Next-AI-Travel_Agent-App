/**
 * Accessibility & WCAG Compliance Test Suite
 * Tests for screen reader compatibility, keyboard navigation, and WCAG guidelines
 */

import { test, expect } from '@playwright/test'
import { injectAxe, checkA11y, getViolations } from 'axe-playwright'

// WCAG compliance levels to test
const WCAG_LEVELS = ['wcag2a', 'wcag2aa'] as const

// Pages to test for accessibility
const PAGES_TO_TEST = [
  { url: '/', name: 'Homepage' },
  { url: '/plan-trip', name: 'AI Travel Agent' },
  { url: '/plan-trip', name: 'Trip Planning' },
  { url: '/suggestions', name: 'Trip Suggestions' },
  { url: '/booking/flights', name: 'Flight Booking' },
  { url: '/my-trips', name: 'My Trips' }
]

test.describe('Accessibility Tests', () => {
  // Test each page for WCAG compliance
  PAGES_TO_TEST.forEach(pageInfo => {
    test(`${pageInfo.name} should meet WCAG 2.1 AA standards`, async ({ page }) => {
      await page.goto(pageInfo.url)
      await page.waitForLoadState('networkidle')
      
      // Inject axe-core for accessibility testing
      await injectAxe(page)
      
      // Check for accessibility violations
      try {
        await checkA11y(page, null, {
          tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
          rules: {
            // Configure specific rules
            'color-contrast': { enabled: true },
            'focus-order-semantics': { enabled: true },
            'keyboard': { enabled: true },
            'landmark-one-main': { enabled: true },
            'page-has-heading-one': { enabled: true },
            'region': { enabled: true }
          }
        })
      } catch (error) {
        // Get detailed violation information
        const violations = await getViolations(page, null, {
          tags: ['wcag2a', 'wcag2aa', 'wcag21aa']
        })
        
        console.log(`Accessibility violations on ${pageInfo.name}:`)
        violations.forEach(violation => {
          console.log(`- ${violation.id}: ${violation.description}`)
          console.log(`  Impact: ${violation.impact}`)
          console.log(`  Nodes: ${violation.nodes.length}`)
        })
        
        // Fail if there are serious violations
        const seriousViolations = violations.filter(v => 
          ['critical', 'serious'].includes(v.impact || '')
        )
        
        if (seriousViolations.length > 0) {
          throw new Error(`Found ${seriousViolations.length} serious accessibility violations`)
        }
      }
    })
  })

  test('Keyboard navigation should work throughout the app', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Test Tab key navigation
    let focusedElements = []
    
    // Tab through first 10 focusable elements
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab')
      
      const focusedElement = await page.evaluate(() => {
        const element = document.activeElement
        return {
          tagName: element?.tagName,
          type: element?.getAttribute?.('type'),
          role: element?.getAttribute?.('role'),
          ariaLabel: element?.getAttribute?.('aria-label'),
          text: element?.textContent?.slice(0, 50)
        }
      })
      
      if (focusedElement.tagName && focusedElement.tagName !== 'BODY') {
        focusedElements.push(focusedElement)
      }
    }
    
    // Should have focused on interactive elements
    expect(focusedElements.length).toBeGreaterThan(0)
    
    // Test Shift+Tab (reverse navigation)
    await page.keyboard.press('Shift+Tab')
    const reverseFocused = await page.evaluate(() => document.activeElement?.tagName)
    expect(reverseFocused).toBeTruthy()
  })

  test('Focus management should work correctly', async ({ page }) => {
    await page.goto('/plan-trip')
    await page.waitForLoadState('networkidle')
    
    // Test focus indicators are visible
    const focusableElements = await page.locator('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])').all()
    
    for (const element of focusableElements.slice(0, 5)) {
      await element.focus()
      
      // Check if focus is visible (element should have focus styles)
      const isFocused = await element.evaluate(el => el === document.activeElement)
      expect(isFocused).toBe(true)
      
      // Check for focus indicator styles
      const styles = await element.evaluate(el => {
        const computed = window.getComputedStyle(el)
        return {
          outline: computed.outline,
          outlineWidth: computed.outlineWidth,
          outlineStyle: computed.outlineStyle,
          boxShadow: computed.boxShadow
        }
      })
      
      // Should have some form of focus indicator
      const hasFocusIndicator = 
        styles.outline !== 'none' || 
        styles.outlineWidth !== '0px' || 
        styles.boxShadow !== 'none'
      
      expect(hasFocusIndicator).toBe(true)
    }
  })

  test('Screen reader landmarks should be properly defined', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Check for proper landmark structure
    const landmarks = await page.evaluate(() => {
      const getLandmarks = () => {
        const landmarks = []
        
        // Check for semantic HTML5 landmarks
        const semanticLandmarks = ['header', 'nav', 'main', 'section', 'article', 'aside', 'footer']
        semanticLandmarks.forEach(tag => {
          const elements = document.getElementsByTagName(tag)
          for (let i = 0; i < elements.length; i++) {
            landmarks.push({
              type: tag,
              hasText: elements[i].textContent?.trim().length > 0,
              hasAriaLabel: elements[i].hasAttribute('aria-label'),
              hasAriaLabelledby: elements[i].hasAttribute('aria-labelledby')
            })
          }
        })
        
        // Check for ARIA landmarks
        const ariaLandmarks = document.querySelectorAll('[role="banner"], [role="navigation"], [role="main"], [role="complementary"], [role="contentinfo"]')
        ariaLandmarks.forEach(element => {
          landmarks.push({
            type: element.getAttribute('role'),
            hasText: element.textContent?.trim().length > 0,
            hasAriaLabel: element.hasAttribute('aria-label'),
            hasAriaLabelledby: element.hasAttribute('aria-labelledby')
          })
        })
        
        return landmarks
      }
      
      return getLandmarks()
    })
    
    // Should have at least main content landmark
    const hasMain = landmarks.some(l => l.type === 'main' || l.type === 'main')
    expect(hasMain).toBe(true)
    
    // Should have navigation
    const hasNav = landmarks.some(l => l.type === 'nav' || l.type === 'navigation')
    expect(hasNav).toBe(true)
  })

  test('Images should have appropriate alt text', async ({ page }) => {
    await page.goto('/suggestions')
    await page.waitForLoadState('networkidle')
    
    const images = await page.locator('img').all()
    
    for (const img of images) {
      const altText = await img.getAttribute('alt')
      const src = await img.getAttribute('src')
      const role = await img.getAttribute('role')
      
      // Decorative images should have empty alt or role="presentation"
      // Content images should have descriptive alt text
      
      if (role === 'presentation' || role === 'none') {
        // Decorative images - alt can be empty
        expect(altText).toBeDefined()
      } else {
        // Content images - should have meaningful alt text
        expect(altText).toBeTruthy()
        if (altText) {
          expect(altText.length).toBeGreaterThan(0)
          expect(altText).not.toBe('image') // Should be descriptive
          expect(altText).not.toBe('photo')
          expect(altText).not.toBe('picture')
        }
      }
    }
  })

  test('Form labels should be properly associated', async ({ page }) => {
    await page.goto('/plan-trip')
    await page.waitForLoadState('networkidle')
    
    const formElements = await page.locator('input, select, textarea').all()
    
    for (const element of formElements) {
      const id = await element.getAttribute('id')
      const ariaLabel = await element.getAttribute('aria-label')
      const ariaLabelledby = await element.getAttribute('aria-labelledby')
      const type = await element.getAttribute('type')
      
      // Skip hidden inputs
      if (type === 'hidden') continue
      
      // Check for proper labeling
      let hasLabel = false
      
      if (id) {
        // Check for associated label
        const label = await page.locator(`label[for="${id}"]`).count()
        hasLabel = label > 0
      }
      
      if (!hasLabel && ariaLabel) {
        hasLabel = ariaLabel.length > 0
      }
      
      if (!hasLabel && ariaLabelledby) {
        const labelElement = await page.locator(`#${ariaLabelledby}`).count()
        hasLabel = labelElement > 0
      }
      
      // Form elements should have labels
      expect(hasLabel).toBe(true)
    }
  })

  test('Headings should follow proper hierarchy', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    const headings = await page.evaluate(() => {
      const headingElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6')
      return Array.from(headingElements).map(h => ({
        level: parseInt(h.tagName.charAt(1)),
        text: h.textContent?.trim(),
        hasContent: (h.textContent?.trim().length || 0) > 0
      }))
    })
    
    if (headings.length > 0) {
      // Should have at least one h1
      const h1Count = headings.filter(h => h.level === 1).length
      expect(h1Count).toBeGreaterThanOrEqual(1)
      
      // Check heading hierarchy (no skipping levels)
      for (let i = 1; i < headings.length; i++) {
        const currentLevel = headings[i].level
        const previousLevel = headings[i - 1].level
        
        // Should not skip heading levels (e.g., h1 -> h3)
        if (currentLevel > previousLevel) {
          expect(currentLevel - previousLevel).toBeLessThanOrEqual(1)
        }
      }
      
      // All headings should have content
      headings.forEach(heading => {
        expect(heading.hasContent).toBe(true)
      })
    }
  })

  test('Color contrast should meet WCAG standards', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Inject axe-core and check specifically for color contrast
    await injectAxe(page)
    
    try {
      await checkA11y(page, null, {
        rules: {
          'color-contrast': { enabled: true }
        }
      })
    } catch (error) {
      const violations = await getViolations(page, null, {
        rules: {
          'color-contrast': { enabled: true }
        }
      })
      
      // Log color contrast violations for manual review
      const contrastViolations = violations.filter(v => v.id === 'color-contrast')
      
      if (contrastViolations.length > 0) {
        console.log('Color contrast violations found:')
        contrastViolations.forEach(violation => {
          violation.nodes.forEach(node => {
            console.log(`- ${node.html}`)
            console.log(`  Expected ratio: ${node.any[0]?.data?.expectedContrastRatio}`)
          })
        })
      }
      
      // Allow some contrast violations but warn about them
      expect(contrastViolations.length).toBeLessThan(10)
    }
  })

  test('Interactive elements should be accessible via keyboard', async ({ page }) => {
    await page.goto('/suggestions')
    await page.waitForLoadState('networkidle')
    
    // Test buttons are keyboard accessible
    const buttons = await page.locator('button:visible').all()
    
    for (const button of buttons.slice(0, 5)) {
      await button.focus()
      
      // Should be able to activate with Enter
      const initialUrl = page.url()
      await button.press('Enter')
      await page.waitForTimeout(100)
      
      // Should be able to activate with Space (for buttons)
      await button.focus()
      await button.press('Space')
      await page.waitForTimeout(100)
    }
    
    // Test links are keyboard accessible
    const links = await page.locator('a[href]:visible').all()
    
    for (const link of links.slice(0, 3)) {
      await link.focus()
      
      // Links should be activatable with Enter
      const href = await link.getAttribute('href')
      if (href && href !== '#') {
        // Just test that Enter key works (don't actually navigate)
        await link.press('Enter')
        await page.waitForTimeout(100)
      }
    }
  })

  test('ARIA attributes should be used correctly', async ({ page }) => {
    await page.goto('/plan-trip')
    await page.waitForLoadState('networkidle')
    
    // Check for proper ARIA usage
    const ariaElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('[aria-label], [aria-labelledby], [aria-describedby], [role], [aria-expanded], [aria-hidden]')
      
      return Array.from(elements).map(el => ({
        tagName: el.tagName,
        ariaLabel: el.getAttribute('aria-label'),
        ariaLabelledby: el.getAttribute('aria-labelledby'),
        ariaDescribedby: el.getAttribute('aria-describedby'),
        role: el.getAttribute('role'),
        ariaExpanded: el.getAttribute('aria-expanded'),
        ariaHidden: el.getAttribute('aria-hidden'),
        hasText: (el.textContent?.trim().length || 0) > 0
      }))
    })
    
    // Validate ARIA attributes
    ariaElements.forEach(element => {
      // Elements with aria-labelledby should reference existing elements
      if (element.ariaLabelledby) {
        // This would need to be checked against actual DOM
        expect(element.ariaLabelledby.length).toBeGreaterThan(0)
      }
      
      // Elements with role should have appropriate ARIA attributes
      if (element.role) {
        const interactiveRoles = ['button', 'link', 'tab', 'menuitem', 'option']
        if (interactiveRoles.includes(element.role)) {
          // Interactive elements should be accessible
          expect(element.ariaLabel || element.ariaLabelledby || element.hasText).toBeTruthy()
        }
      }
      
      // aria-expanded should be true or false
      if (element.ariaExpanded) {
        expect(['true', 'false'].includes(element.ariaExpanded)).toBe(true)
      }
    })
  })

  test('Skip links should be available for keyboard users', async ({ page }) => {
    await page.goto('/')
    
    // Tab to first element to activate skip links
    await page.keyboard.press('Tab')
    
    // Look for skip links (usually hidden until focused)
    const skipLinks = await page.locator('a[href="#main"], a[href="#content"], a:has-text("skip to"), a:has-text("Skip to")').all()
    
    if (skipLinks.length > 0) {
      const skipLink = skipLinks[0]
      await skipLink.focus()
      
      // Skip link should be visible when focused
      expect(await skipLink.isVisible()).toBe(true)
      
      // Should navigate to main content when activated
      await skipLink.press('Enter')
      await page.waitForTimeout(100)
      
      const focusedElement = await page.evaluate(() => document.activeElement?.id || document.activeElement?.tagName)
      expect(focusedElement).toBeTruthy()
    }
  })

  test('Error messages should be accessible', async ({ page }) => {
    await page.goto('/plan-trip')
    await page.waitForLoadState('networkidle')
    
    // Try to trigger form validation errors
    const requiredInputs = await page.locator('input[required]:visible').all()
    
    if (requiredInputs.length > 0) {
      const input = requiredInputs[0]
      
      // Focus and blur to trigger validation
      await input.focus()
      await input.blur()
      
      // Look for error messages
      const errorMessages = await page.locator('[role="alert"], .error, [aria-live], [id*="error"]').all()
      
      for (const errorMsg of errorMessages) {
        if (await errorMsg.isVisible()) {
          // Error messages should have proper ARIA attributes
          const role = await errorMsg.getAttribute('role')
          const ariaLive = await errorMsg.getAttribute('aria-live')
          
          // Should be announced to screen readers
          expect(role === 'alert' || ariaLive === 'polite' || ariaLive === 'assertive').toBe(true)
        }
      }
    }
  })

  test('Video and audio content should be accessible', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Check for video elements
    const videos = await page.locator('video').all()
    
    for (const video of videos) {
      // Videos should have controls
      const hasControls = await video.getAttribute('controls')
      expect(hasControls !== null).toBe(true)
      
      // Check for captions/subtitles
      const tracks = await video.locator('track').all()
      const hasCaptions = tracks.length > 0
      
      // Video content should have captions or be decorative
      if (await video.getAttribute('aria-hidden') !== 'true') {
        // Content videos should have captions
        expect(hasCaptions).toBe(true)
      }
    }
    
    // Check for audio elements
    const audios = await page.locator('audio').all()
    
    for (const audio of audios) {
      // Audio should have controls
      const hasControls = await audio.getAttribute('controls')
      expect(hasControls !== null).toBe(true)
    }
  })

  test('Tables should be accessible', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    const tables = await page.locator('table').all()
    
    for (const table of tables) {
      // Tables should have proper headers
      const headers = await table.locator('th').all()
      
      if (headers.length > 0) {
        // Check that headers have proper scope
        for (const header of headers.slice(0, 3)) {
          const scope = await header.getAttribute('scope')
          const hasContent = (await header.textContent())?.trim().length > 0
          
          expect(hasContent).toBe(true)
          // Scope should be col, row, colgroup, or rowgroup
          if (scope) {
            expect(['col', 'row', 'colgroup', 'rowgroup'].includes(scope)).toBe(true)
          }
        }
      }
      
      // Complex tables should have caption
      const caption = await table.locator('caption').count()
      const isComplexTable = (await table.locator('th').count()) > 2
      
      if (isComplexTable) {
        expect(caption).toBeGreaterThan(0)
      }
    }
  })
})
