import { test, expect } from '@playwright/test';

test.describe('Listing Rewriter - Landing Page', () => {
  test('should load landing page with all sections', async ({ page }) => {
    await page.goto('/');

    // Check hero section — logo, headline, and subtitle
    await expect(page.locator('img[alt*="Listing Rewriter"]')).toBeVisible();
    await expect(page.locator('text=Tired of Crummy AI Listing Descriptions?')).toBeVisible();
    await expect(page.locator('text=Most AI tools hallucinate features and sound robotic')).toBeVisible();

    // Check form exists with correct fields
    await expect(page.locator('text=Your Email')).toBeVisible();
    await expect(page.locator('text=Property Address')).toBeVisible();
    await expect(page.locator('text=Current Listing Description')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Generate AI-Enhanced Description' })).toBeVisible();

    // Check opt-in checkbox
    await expect(page.locator('text=Send me weekly listing tips and market insights')).toBeVisible();

    // Check How It Works section
    await expect(page.locator('h2:has-text("How It Works")')).toBeVisible();
    await expect(page.locator('h3:has-text("Paste Your Listing")')).toBeVisible();
    await expect(page.locator('h3:has-text("AI Rewrites It")')).toBeVisible();
    await expect(page.locator('h3:has-text("Copy & Go")')).toBeVisible();

    // Check Before/After section
    await expect(page.locator('h2:has-text("See the Difference")')).toBeVisible();
    await expect(page.getByText('BEFORE', { exact: true })).toBeVisible();
    await expect(page.getByText('AFTER', { exact: true })).toBeVisible();

    // Check Footer CTA
    await expect(page.locator('text=Ready to Try It?')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Get Started Free' })).toBeVisible();

    // Check footer copyright
    await expect(page.locator('text=2026 DJP3 Consulting Inc')).toBeVisible();
  });

  test('should show validation error for empty email', async ({ page }) => {
    await page.goto('/');

    await page.fill('input[placeholder="123 Main St, Chicago, IL 60601"]', '123 Test St, Chicago, IL 60601');
    await page.fill('textarea', 'Test listing description for a beautiful home.');

    await page.getByRole('button', { name: 'Generate AI-Enhanced Description' }).click();

    await expect(page.locator('text=Please enter a valid email address')).toBeVisible();
  });

  test('should show validation error for empty address', async ({ page }) => {
    await page.goto('/');

    await page.fill('input[placeholder="you@email.com"]', 'test@example.com');
    await page.fill('textarea', 'Test listing description.');

    await page.getByRole('button', { name: 'Generate AI-Enhanced Description' }).click();

    await expect(page.locator('text=Please enter the property address')).toBeVisible();
  });

  test('should show validation error for empty description', async ({ page }) => {
    await page.goto('/');

    await page.fill('input[placeholder="you@email.com"]', 'test@example.com');
    await page.fill('input[placeholder="123 Main St, Chicago, IL 60601"]', '123 Test St');

    await page.getByRole('button', { name: 'Generate AI-Enhanced Description' }).click();

    await expect(page.locator('text=Please enter the current listing description')).toBeVisible();
  });

  test('should scroll to top when clicking Get Started Free', async ({ page }) => {
    await page.goto('/');

    // Scroll to bottom and click Get Started Free
    await page.getByRole('button', { name: 'Get Started Free' }).scrollIntoViewIfNeeded();
    await page.getByRole('button', { name: 'Get Started Free' }).click();

    // Form should be in view
    await expect(page.locator('text=Property Address').first()).toBeInViewport();
  });

  test('should be able to fill all form fields', async ({ page }) => {
    await page.goto('/');

    await page.fill('input[placeholder="you@email.com"]', 'test@example.com');
    await page.fill('input[placeholder="123 Main St, Chicago, IL 60601"]', '456 Oak Ave, Evanston, IL 60201');
    await page.fill('input[placeholder="2B"]', '3A');
    await page.fill('input[placeholder="$450,000"]', '$525,000');
    await page.fill('input[placeholder="3"]', '3');
    await page.fill('input[placeholder="2"]', '2');
    await page.fill('input[placeholder="1,500"]', '1,800');
    await page.fill('textarea', 'Spacious 3 bedroom home with updated kitchen.');

    // Verify all fields are filled
    await expect(page.locator('input[placeholder="you@email.com"]')).toHaveValue('test@example.com');
    await expect(page.locator('input[placeholder="123 Main St, Chicago, IL 60601"]')).toHaveValue('456 Oak Ave, Evanston, IL 60201');
    await expect(page.locator('input[placeholder="2B"]')).toHaveValue('3A');
    await expect(page.locator('textarea')).toHaveValue('Spacious 3 bedroom home with updated kitchen.');

    // Submit button should be enabled
    await expect(page.getByRole('button', { name: 'Generate AI-Enhanced Description' })).toBeEnabled();
  });

  test('should toggle opt-in checkbox', async ({ page }) => {
    await page.goto('/');

    const checkbox = page.locator('input[type="checkbox"]');

    // Should be checked by default
    await expect(checkbox).toBeChecked();

    // Uncheck
    await checkbox.uncheck();
    await expect(checkbox).not.toBeChecked();

    // Recheck
    await checkbox.check();
    await expect(checkbox).toBeChecked();
  });
});
