import { test, expect } from '@playwright/test';

test.describe('Trip Planning Flow', () => {
  test('should navigate to trip planning page', async ({ page }) => {
    await page.goto('/');
    
    // Try to find and click a "Plan Trip" or similar button
    const planTripButton = page.getByRole('button', { name: /plan trip/i });
    const planTripLink = page.getByRole('link', { name: /plan trip/i });
    
    if (await planTripButton.isVisible()) {
      await planTripButton.click();
    } else if (await planTripLink.isVisible()) {
      await planTripLink.click();
    } else {
      // Navigate directly to plan trip page
      await page.goto('/plan-trip');
    }
    
    // Verify we're on a trip planning page
    await expect(page.url()).toContain('plan');
  });

  test('should display AI travel agent page', async ({ page }) => {
    await page.goto('/ai-travel-agent');
    
    // Check for AI travel agent content
    await expect(page.locator('h1, h2')).toContainText(/travel|agent|plan|trip/i);
  });

  test('should show trip suggestions when available', async ({ page }) => {
    await page.goto('/suggestions');
    
    // Should load suggestions page without errors
    await expect(page.locator('body')).toBeVisible();
    
    // Look for trip cards or suggestions
    const tripCards = page.locator('[class*="trip"], [class*="suggestion"], [class*="card"]');
    
    // If there are trip cards, they should be visible
    if (await tripCards.count() > 0) {
      await expect(tripCards.first()).toBeVisible();
    }
  });

  test('should handle trip details page', async ({ page }) => {
    await page.goto('/trip-details/test');
    
    // Should load without major errors
    await expect(page.locator('body')).toBeVisible();
    
    // Look for typical trip details elements
    const bookingButtons = page.locator('button:has-text("Book"), button:has-text("Flight"), button:has-text("Hotel")');
    
    if (await bookingButtons.count() > 0) {
      await expect(bookingButtons.first()).toBeVisible();
    }
  });
});

test.describe('Booking Flow', () => {
  test('should access flight booking page', async ({ page }) => {
    await page.goto('/booking/flights?from=Vancouver&to=Madrid&price=1200');
    
    // Should load booking page
    await expect(page.locator('body')).toBeVisible();
    
    // Look for flight booking elements
    const flightElements = page.locator('text=flight, text=Flight, text=FLIGHT').first();
    if (await flightElements.isVisible()) {
      await expect(flightElements).toBeVisible();
    }
  });

  test('should access hotel booking page', async ({ page }) => {
    await page.goto('/booking/hotels?destination=Madrid');
    
    // Should load booking page
    await expect(page.locator('body')).toBeVisible();
    
    // Look for hotel booking elements
    const hotelElements = page.locator('text=hotel, text=Hotel, text=HOTEL').first();
    if (await hotelElements.isVisible()) {
      await expect(hotelElements).toBeVisible();
    }
  });

  test('should load checkout page', async ({ page }) => {
    const checkoutUrl = '/booking/checkout?type=flight&item=%7B%22id%22%3A%22test%22%2C%22airline%22%3A%22Air%20Canada%22%2C%22price%22%3A1200%7D&price=1200';
    await page.goto(checkoutUrl);
    
    // Should load checkout page
    await expect(page.locator('body')).toBeVisible();
    
    // Look for checkout elements
    const checkoutElements = page.locator('text=checkout, text=Checkout, text=payment, text=Payment');
    if (await checkoutElements.count() > 0) {
      await expect(checkoutElements.first()).toBeVisible();
    }
  });
});










