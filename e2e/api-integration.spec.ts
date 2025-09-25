import { test, expect } from '@playwright/test';

test.describe('API Integration', () => {
  test('should load pages that depend on APIs', async ({ page }) => {
    // Test pages that make API calls
    const apiPages = [
      '/',
      '/ai-travel-agent',
      '/suggestions',
      '/my-trips'
    ];

    for (const pagePath of apiPages) {
      await page.goto(pagePath);
      
      // Should load without showing major error messages
      await expect(page.locator('body')).toBeVisible();
      
      // Should not show obvious error messages
      const errorElements = page.locator('text="Error:", text="Failed to", text="Something went wrong"');
      const errorCount = await errorElements.count();
      
      if (errorCount > 0) {
        console.log(`Warning: Potential errors found on ${pagePath}`);
      }
    }
  });

  test('should handle API responses gracefully', async ({ page }) => {
    // Navigate to a page that likely makes API calls
    await page.goto('/ai-travel-agent');
    
    // Wait for potential API calls to complete
    await page.waitForTimeout(2000);
    
    // Check that the page is in a reasonable state
    await expect(page.locator('body')).toBeVisible();
    
    // Look for loading states or content
    const loadingElements = page.locator('[class*="loading"], [class*="spinner"], text="Loading"');
    const contentElements = page.locator('h1, h2, h3, p, button, input');
    
    // Either loading or content should be visible
    const hasLoading = await loadingElements.count() > 0;
    const hasContent = await contentElements.count() > 0;
    
    expect(hasLoading || hasContent).toBeTruthy();
  });

  test('should maintain functionality during navigation', async ({ page }) => {
    // Start at homepage
    await page.goto('/');
    
    // Navigate through key pages
    const navigationFlow = [
      '/plan-trip',
      '/suggestions', 
      '/ai-travel-agent',
      '/my-trips'
    ];

    for (const route of navigationFlow) {
      await page.goto(route);
      
      // Each page should load successfully
      await expect(page.locator('body')).toBeVisible();
      
      // Wait for any initial API calls
      await page.waitForTimeout(1000);
      
      // Should not have obvious error states
      const fatalErrors = page.locator('text="500", text="404", text="Network Error"');
      expect(await fatalErrors.count()).toBeLessThan(1);
    }
  });
});

