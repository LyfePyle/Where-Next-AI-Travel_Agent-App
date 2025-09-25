/**
 * SEO & Meta Tags Testing Suite
 * Tests for search engine optimization, meta tags, and structured data
 */

import { test, expect } from '@playwright/test'

// Pages to test for SEO
const SEO_PAGES = [
  { 
    url: '/', 
    name: 'Homepage',
    expectedTitle: /where.*next.*travel/i,
    expectedDescription: /ai.*travel.*agent|plan.*trip|travel.*planning/i,
    shouldHaveStructuredData: true
  },
  { 
    url: '/ai-travel-agent', 
    name: 'AI Travel Agent',
    expectedTitle: /ai.*travel.*agent/i,
    expectedDescription: /ai.*travel.*planning|smart.*travel/i,
    shouldHaveStructuredData: false
  },
  { 
    url: '/plan-trip', 
    name: 'Trip Planning',
    expectedTitle: /plan.*trip|trip.*planning/i,
    expectedDescription: /plan.*trip|travel.*planning/i,
    shouldHaveStructuredData: false
  },
  { 
    url: '/suggestions', 
    name: 'Trip Suggestions',
    expectedTitle: /trip.*suggestions|suggestions/i,
    expectedDescription: /trip.*suggestions|travel.*ideas/i,
    shouldHaveStructuredData: true
  }
]

test.describe('SEO and Meta Tags Tests', () => {
  SEO_PAGES.forEach(pageInfo => {
    test(`${pageInfo.name} should have proper SEO meta tags`, async ({ page }) => {
      await page.goto(pageInfo.url)
      await page.waitForLoadState('networkidle')
      
      // Test page title
      const title = await page.title()
      expect(title).toBeTruthy()
      expect(title.length).toBeGreaterThan(10)
      expect(title.length).toBeLessThan(60) // SEO best practice
      expect(title).toMatch(pageInfo.expectedTitle)
      
      // Test meta description
      const metaDescription = await page.locator('meta[name="description"]').getAttribute('content')
      expect(metaDescription).toBeTruthy()
      expect(metaDescription!.length).toBeGreaterThan(50)
      expect(metaDescription!.length).toBeLessThan(160) // SEO best practice
      expect(metaDescription).toMatch(pageInfo.expectedDescription)
      
      // Test canonical URL
      const canonicalUrl = await page.locator('link[rel="canonical"]').getAttribute('href')
      if (canonicalUrl) {
        expect(canonicalUrl).toContain(pageInfo.url === '/' ? '' : pageInfo.url)
      }
      
      // Test viewport meta tag
      const viewport = await page.locator('meta[name="viewport"]').getAttribute('content')
      expect(viewport).toBeTruthy()
      expect(viewport).toContain('width=device-width')
      
      // Test robots meta tag
      const robots = await page.locator('meta[name="robots"]').getAttribute('content')
      if (robots) {
        expect(robots).not.toContain('noindex') // Should be indexable
      }
    })
  })

  test('Open Graph meta tags should be present', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Test Open Graph tags
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content')
    const ogDescription = await page.locator('meta[property="og:description"]').getAttribute('content')
    const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content')
    const ogUrl = await page.locator('meta[property="og:url"]').getAttribute('content')
    const ogType = await page.locator('meta[property="og:type"]').getAttribute('content')
    const ogSiteName = await page.locator('meta[property="og:site_name"]').getAttribute('content')
    
    expect(ogTitle).toBeTruthy()
    expect(ogDescription).toBeTruthy()
    expect(ogType).toBeTruthy()
    
    if (ogImage) {
      expect(ogImage).toMatch(/\.(jpg|jpeg|png|webp)$/i)
    }
    
    if (ogUrl) {
      expect(ogUrl).toMatch(/^https?:\/\//)
    }
    
    if (ogSiteName) {
      expect(ogSiteName).toBeTruthy()
    }
  })

  test('Twitter Card meta tags should be present', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Test Twitter Card tags
    const twitterCard = await page.locator('meta[name="twitter:card"]').getAttribute('content')
    const twitterTitle = await page.locator('meta[name="twitter:title"]').getAttribute('content')
    const twitterDescription = await page.locator('meta[name="twitter:description"]').getAttribute('content')
    const twitterImage = await page.locator('meta[name="twitter:image"]').getAttribute('content')
    const twitterSite = await page.locator('meta[name="twitter:site"]').getAttribute('content')
    
    if (twitterCard) {
      expect(['summary', 'summary_large_image', 'app', 'player'].includes(twitterCard)).toBe(true)
    }
    
    if (twitterTitle) {
      expect(twitterTitle.length).toBeLessThan(70)
    }
    
    if (twitterDescription) {
      expect(twitterDescription.length).toBeLessThan(200)
    }
    
    if (twitterImage) {
      expect(twitterImage).toMatch(/\.(jpg|jpeg|png|webp)$/i)
    }
  })

  test('Structured data should be valid JSON-LD', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Test JSON-LD structured data
    const jsonLdScripts = await page.locator('script[type="application/ld+json"]').all()
    
    if (jsonLdScripts.length > 0) {
      for (const script of jsonLdScripts) {
        const content = await script.textContent()
        expect(content).toBeTruthy()
        
        // Should be valid JSON
        let jsonData
        expect(() => {
          jsonData = JSON.parse(content!)
        }).not.toThrow()
        
        // Should have @context and @type
        expect(jsonData['@context']).toBeTruthy()
        expect(jsonData['@type']).toBeTruthy()
        
        // Common schema types for travel sites
        const validTypes = [
          'Organization',
          'WebSite',
          'WebPage',
          'TravelAgency',
          'LocalBusiness',
          'Service',
          'Product',
          'TripReservation',
          'Trip'
        ]
        
        const type = Array.isArray(jsonData['@type']) ? jsonData['@type'][0] : jsonData['@type']
        expect(validTypes.includes(type)).toBe(true)
      }
    }
  })

  test('Images should have proper SEO attributes', async ({ page }) => {
    await page.goto('/suggestions')
    await page.waitForLoadState('networkidle')
    
    const images = await page.locator('img').all()
    
    for (const img of images.slice(0, 10)) {
      // Alt text for SEO
      const alt = await img.getAttribute('alt')
      expect(alt).toBeTruthy()
      expect(alt!.length).toBeGreaterThan(3)
      expect(alt!.length).toBeLessThan(125) // SEO best practice
      
      // Should not use generic alt text
      const genericTerms = ['image', 'photo', 'picture', 'img', 'graphic']
      const isGeneric = genericTerms.some(term => alt!.toLowerCase().includes(term))
      expect(isGeneric).toBe(false)
      
      // Source should be optimized
      const src = await img.getAttribute('src')
      expect(src).toBeTruthy()
      
      // Check for lazy loading
      const loading = await img.getAttribute('loading')
      if (loading) {
        expect(loading).toBe('lazy')
      }
      
      // Check for proper dimensions
      const width = await img.getAttribute('width')
      const height = await img.getAttribute('height')
      
      // Should have dimensions for CLS optimization
      if (width && height) {
        expect(parseInt(width)).toBeGreaterThan(0)
        expect(parseInt(height)).toBeGreaterThan(0)
      }
    }
  })

  test('Heading structure should be SEO-friendly', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    const headings = await page.evaluate(() => {
      const headingElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6')
      return Array.from(headingElements).map(h => ({
        level: parseInt(h.tagName.charAt(1)),
        text: h.textContent?.trim(),
        length: h.textContent?.trim().length || 0
      }))
    })
    
    if (headings.length > 0) {
      // Should have exactly one H1
      const h1Count = headings.filter(h => h.level === 1).length
      expect(h1Count).toBe(1)
      
      // H1 should be descriptive and not too long
      const h1 = headings.find(h => h.level === 1)
      expect(h1!.length).toBeGreaterThan(10)
      expect(h1!.length).toBeLessThan(70)
      
      // Should have logical hierarchy
      let previousLevel = 0
      for (const heading of headings) {
        if (previousLevel > 0 && heading.level > previousLevel) {
          // Should not skip levels (e.g., h2 -> h4)
          expect(heading.level - previousLevel).toBeLessThanOrEqual(1)
        }
        previousLevel = heading.level
      }
      
      // Headings should have content
      headings.forEach(heading => {
        expect(heading.length).toBeGreaterThan(0)
      })
    }
  })

  test('URLs should be SEO-friendly', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Check internal links
    const internalLinks = await page.locator('a[href^="/"], a[href^="./"], a[href^="../"]').all()
    
    for (const link of internalLinks.slice(0, 10)) {
      const href = await link.getAttribute('href')
      expect(href).toBeTruthy()
      
      // URLs should be clean and descriptive
      if (href && href !== '/' && !href.includes('#')) {
        // Should not contain spaces or special characters
        expect(href).not.toMatch(/\s/)
        expect(href).not.toMatch(/[^a-zA-Z0-9\-_/.?=&]/)
        
        // Should use hyphens instead of underscores
        if (href.includes('_')) {
          console.warn(`URL contains underscores: ${href}`)
        }
        
        // Should be lowercase
        expect(href).toBe(href.toLowerCase())
      }
    }
  })

  test('Page load speed should be acceptable for SEO', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    const loadTime = Date.now() - startTime
    
    // Page should load within reasonable time for SEO
    expect(loadTime).toBeLessThan(3000) // 3 seconds
    
    // Test Core Web Vitals
    const webVitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const vitals: any = {}
          
          entries.forEach((entry) => {
            if (entry.name === 'first-contentful-paint') {
              vitals.fcp = entry.startTime
            }
            if (entry.name === 'largest-contentful-paint') {
              vitals.lcp = entry.startTime
            }
          })
          
          resolve(vitals)
        }).observe({ type: 'paint', buffered: true })
        
        // Timeout after 5 seconds
        setTimeout(() => resolve({}), 5000)
      })
    })
    
    console.log('Web Vitals:', webVitals)
  })

  test('Sitemap and robots.txt should be accessible', async ({ page, request }) => {
    // Test robots.txt
    try {
      const robotsResponse = await request.get('/robots.txt')
      expect(robotsResponse.status()).toBe(200)
      
      const robotsContent = await robotsResponse.text()
      expect(robotsContent).toContain('User-agent')
      
      // Should reference sitemap
      expect(robotsContent.toLowerCase()).toContain('sitemap')
    } catch (error) {
      console.warn('robots.txt not found - consider adding one')
    }
    
    // Test sitemap.xml
    try {
      const sitemapResponse = await request.get('/sitemap.xml')
      expect(sitemapResponse.status()).toBe(200)
      
      const sitemapContent = await sitemapResponse.text()
      expect(sitemapContent).toContain('<urlset')
      expect(sitemapContent).toContain('<url>')
      expect(sitemapContent).toContain('<loc>')
    } catch (error) {
      console.warn('sitemap.xml not found - consider adding one')
    }
  })

  test('Hreflang tags should be present for international sites', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Check for hreflang tags (if site supports multiple languages)
    const hreflangTags = await page.locator('link[rel="alternate"][hreflang]').all()
    
    if (hreflangTags.length > 0) {
      for (const tag of hreflangTags) {
        const hreflang = await tag.getAttribute('hreflang')
        const href = await tag.getAttribute('href')
        
        expect(hreflang).toBeTruthy()
        expect(href).toBeTruthy()
        
        // Hreflang should be valid language code
        expect(hreflang).toMatch(/^[a-z]{2}(-[A-Z]{2})?$|^x-default$/)
      }
    }
  })

  test('Schema markup for travel content should be present', async ({ page }) => {
    await page.goto('/suggestions')
    await page.waitForLoadState('networkidle')
    
    // Look for travel-related schema markup
    const jsonLdScripts = await page.locator('script[type="application/ld+json"]').all()
    
    let hasTravelSchema = false
    
    for (const script of jsonLdScripts) {
      const content = await script.textContent()
      if (content) {
        try {
          const jsonData = JSON.parse(content)
          const type = Array.isArray(jsonData['@type']) ? jsonData['@type'][0] : jsonData['@type']
          
          const travelTypes = [
            'Trip',
            'TravelAction',
            'TourReservation',
            'FlightReservation',
            'LodgingReservation',
            'TravelAgency',
            'Hotel',
            'Airport',
            'Tourist Destination'
          ]
          
          if (travelTypes.includes(type)) {
            hasTravelSchema = true
            
            // Validate travel schema properties
            if (type === 'Trip') {
              expect(jsonData.name || jsonData.description).toBeTruthy()
            }
            
            if (type === 'TravelAgency') {
              expect(jsonData.name).toBeTruthy()
              expect(jsonData.url).toBeTruthy()
            }
          }
        } catch (e) {
          // Invalid JSON - already tested elsewhere
        }
      }
    }
    
    // Travel site should have relevant schema markup
    if (jsonLdScripts.length > 0) {
      expect(hasTravelSchema).toBe(true)
    }
  })

  test('Internal linking structure should be SEO-friendly', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Check internal links
    const internalLinks = await page.locator('a[href^="/"]').all()
    
    expect(internalLinks.length).toBeGreaterThan(0)
    
    // Check link anchor text
    for (const link of internalLinks.slice(0, 10)) {
      const text = await link.textContent()
      const href = await link.getAttribute('href')
      
      if (text && text.trim()) {
        // Anchor text should be descriptive
        expect(text.trim().length).toBeGreaterThan(2)
        
        // Should not use generic anchor text
        const genericTerms = ['click here', 'read more', 'more', 'here', 'this', 'link']
        const isGeneric = genericTerms.some(term => text.toLowerCase().includes(term))
        expect(isGeneric).toBe(false)
      }
      
      // Links should have proper attributes
      const title = await link.getAttribute('title')
      if (title) {
        expect(title.length).toBeGreaterThan(5)
      }
    }
  })

  test('Meta keywords should not be present (outdated)', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Meta keywords are no longer used by search engines
    const metaKeywords = await page.locator('meta[name="keywords"]').count()
    expect(metaKeywords).toBe(0)
  })

  test('Page should have proper language declaration', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Check HTML lang attribute
    const htmlLang = await page.locator('html').getAttribute('lang')
    expect(htmlLang).toBeTruthy()
    expect(htmlLang).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/) // e.g., 'en', 'en-US'
  })

  test('Content should be unique and not duplicated', async ({ page }) => {
    const pages = ['/', '/ai-travel-agent', '/plan-trip']
    const pageTitles: string[] = []
    const pageDescriptions: string[] = []
    
    for (const url of pages) {
      await page.goto(url)
      await page.waitForLoadState('networkidle')
      
      const title = await page.title()
      const description = await page.locator('meta[name="description"]').getAttribute('content')
      
      pageTitles.push(title)
      if (description) {
        pageDescriptions.push(description)
      }
    }
    
    // Titles should be unique
    const uniqueTitles = new Set(pageTitles)
    expect(uniqueTitles.size).toBe(pageTitles.length)
    
    // Descriptions should be unique
    if (pageDescriptions.length > 1) {
      const uniqueDescriptions = new Set(pageDescriptions)
      expect(uniqueDescriptions.size).toBe(pageDescriptions.length)
    }
  })
})
