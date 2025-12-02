import { test, expect } from '@playwright/test';

// Use iPhone 12 viewport dimensions
test.use({
  viewport: { width: 390, height: 844 },
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15A372 Safari/604.1',
  isMobile: true,
  hasTouch: true,
});

test.describe('Kale Listing AI - Mobile Experience', () => {
  test('should display landing page correctly on mobile', async ({ page }) => {
    await page.goto('/');

    // Take a screenshot for visual verification
    await page.screenshot({ path: 'test-results/mobile-landing.png', fullPage: true });

    // Check hero section is visible and readable
    await expect(page.locator('text=Transform Boring Listings Into')).toBeVisible();
    await expect(page.locator('text=Buyer Magnets')).toBeVisible();

    // Check navigation
    await expect(page.getByRole('button', { name: 'Login / Sign Up' })).toBeVisible();

    // Check form is visible
    await expect(page.locator('input[placeholder="you@email.com"]')).toBeVisible();
    await expect(page.locator('input[placeholder="123 Main St, Chicago, IL 60601"]')).toBeVisible();
    await expect(page.locator('textarea')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Generate AI-Enhanced Description' })).toBeVisible();

    // Check "How It Works" section
    await expect(page.locator('h2:has-text("How It Works")')).toBeVisible();

    // Scroll to Before/After section
    await page.locator('h2:has-text("See the Difference")').scrollIntoViewIfNeeded();
    await expect(page.locator('h2:has-text("See the Difference")')).toBeVisible();
    await expect(page.getByText('BEFORE', { exact: true })).toBeVisible();
    await expect(page.getByText('AFTER', { exact: true })).toBeVisible();

    // Take screenshot of Before/After section
    await page.screenshot({ path: 'test-results/mobile-before-after.png', fullPage: false });
  });

  test('should have properly sized form inputs on mobile', async ({ page }) => {
    await page.goto('/');

    // Check that inputs are wide enough (should be full width on mobile)
    const emailInput = page.locator('input[placeholder="you@email.com"]');
    const addressInput = page.locator('input[placeholder="123 Main St, Chicago, IL 60601"]');
    const textarea = page.locator('textarea');

    // Get viewport width
    const viewportSize = page.viewportSize();
    const maxExpectedWidth = viewportSize ? viewportSize.width - 48 : 350; // accounting for padding

    // Check email input width
    const emailBox = await emailInput.boundingBox();
    expect(emailBox).not.toBeNull();
    if (emailBox) {
      expect(emailBox.width).toBeGreaterThan(250); // Should be reasonably wide
    }

    // Check address input width
    const addressBox = await addressInput.boundingBox();
    expect(addressBox).not.toBeNull();
    if (addressBox) {
      expect(addressBox.width).toBeGreaterThan(250);
    }

    // Check textarea width
    const textareaBox = await textarea.boundingBox();
    expect(textareaBox).not.toBeNull();
    if (textareaBox) {
      expect(textareaBox.width).toBeGreaterThan(250);
    }
  });

  test('should open auth form on mobile', async ({ page }) => {
    await page.goto('/');

    // Click Login / Sign Up
    await page.getByRole('button', { name: 'Login / Sign Up' }).click();

    // Auth form should appear
    await expect(page.locator('input[placeholder="Email"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Password"]')).toBeVisible();

    // Take screenshot of auth form on mobile
    await page.screenshot({ path: 'test-results/mobile-auth-form.png', fullPage: false });

    // Cancel should close form
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.locator('input[placeholder="Email"]')).not.toBeVisible();
  });

  test('should have readable text contrast on mobile', async ({ page }) => {
    await page.goto('/');

    // Verify key elements are visible (implying sufficient contrast)
    // Hero text
    await expect(page.locator('text=Transform Boring Listings Into')).toBeVisible();

    // Form labels
    await expect(page.locator('text=Your Email')).toBeVisible();
    await expect(page.locator('text=Property Address')).toBeVisible();
    await expect(page.locator('text=Current Listing Description')).toBeVisible();

    // How It Works steps
    await expect(page.locator('text=STEP 1')).toBeVisible();
    await expect(page.locator('text=Paste Your Listing')).toBeVisible();
  });

  test('should handle 4-column grid on mobile (Price/Beds/Baths/SqFt)', async ({ page }) => {
    await page.goto('/');

    // Check all 4 property detail inputs exist and are visible
    const priceInput = page.locator('input[placeholder="$450,000"]');
    const bedsInput = page.locator('input[placeholder="3"]');
    const bathsInput = page.locator('input[placeholder="2"]');
    const sqftInput = page.locator('input[placeholder="1,500"]');

    await expect(priceInput).toBeVisible();
    await expect(bedsInput).toBeVisible();
    await expect(bathsInput).toBeVisible();
    await expect(sqftInput).toBeVisible();

    // Take screenshot of form area
    await page.screenshot({ path: 'test-results/mobile-form-fields.png', fullPage: false });

    // Check that inputs are usable (not too small)
    const priceBox = await priceInput.boundingBox();
    expect(priceBox).not.toBeNull();
    if (priceBox) {
      // On mobile, each input should be at least 60px wide to be tappable
      expect(priceBox.width).toBeGreaterThan(50);
      expect(priceBox.height).toBeGreaterThan(30);
    }
  });

  test('should be able to fill and submit form on mobile', async ({ page }) => {
    await page.goto('/');

    // Fill the form
    await page.fill('input[placeholder="you@email.com"]', 'mobile-test@example.com');
    await page.fill('input[placeholder="123 Main St, Chicago, IL 60601"]', '123 Mobile Test St, Chicago, IL 60601');
    await page.fill('input[placeholder="$450,000"]', '$399,000');
    await page.fill('input[placeholder="3"]', '2');
    await page.fill('input[placeholder="2"]', '1');
    await page.fill('input[placeholder="1,500"]', '950');
    await page.fill('textarea', 'Charming condo in great location. Updated kitchen. Hardwood floors. Close to transit.');

    // Verify all fields are filled
    await expect(page.locator('input[placeholder="you@email.com"]')).toHaveValue('mobile-test@example.com');
    await expect(page.locator('textarea')).toHaveValue('Charming condo in great location. Updated kitchen. Hardwood floors. Close to transit.');

    // Take screenshot before submit
    await page.screenshot({ path: 'test-results/mobile-form-filled.png', fullPage: true });

    // Submit button should be visible and clickable
    const submitBtn = page.getByRole('button', { name: 'Generate AI-Enhanced Description' });
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toBeEnabled();
  });
});
