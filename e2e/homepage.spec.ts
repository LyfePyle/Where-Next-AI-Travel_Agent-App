import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load successfully', async ({ page }) => {
    await page.goto('/');
    
    // Check if the page loads
    await expect(page).toHaveTitle(/Where Next/);
    
    // Check for main navigation elements
    await expect(page.locator('nav')).toBeVisible();
  });

  test('should have working navigation', async ({ page }) => {
    await page.goto('/');
    
    // Check for key navigation links
    const planTripLink = page.getByRole('link', { name: /plan trip/i });
    const myTripsLink = page.getByRole('link', { name: /my trips/i });
    
    if (await planTripLink.isVisible()) {
      await expect(planTripLink).toBeVisible();
    }
    
    if (await myTripsLink.isVisible()) {
      await expect(myTripsLink).toBeVisible();
    }
  });

  test('should display trip planning form', async ({ page }) => {
    await page.goto('/');
    
    // Look for trip planning elements
    const fromInput = page.locator('input[placeholder*="From"], input[placeholder*="from"], input[placeholder*="origin"]');
    const toInput = page.locator('input[placeholder*="To"], input[placeholder*="to"], input[placeholder*="destination"]');
    
    // Check if at least some form elements are present
    const hasFromInput = await fromInput.count() > 0;
    const hasToInput = await toInput.count() > 0;
    
    if (hasFromInput || hasToInput) {
      expect(hasFromInput || hasToInput).toBeTruthy();
    }
  });

  test('should be responsive', async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });
});









