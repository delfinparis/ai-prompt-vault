import { test, expect } from '@playwright/test';

test.describe('Listing Rewriter - Mobile Responsiveness', () => {

  test('logo should scale down and not overflow on mobile', async ({ page }) => {
    await page.goto('/');

    const logo = page.locator('img[alt*="Listing Rewriter"]');
    await expect(logo).toBeVisible();

    const logoBox = await logo.boundingBox();
    const viewport = page.viewportSize()!;
    expect(logoBox).not.toBeNull();
    if (logoBox) {
      // Logo should never be wider than the viewport
      expect(logoBox.width).toBeLessThanOrEqual(viewport.width);
      // Logo should be reasonably sized (at least 50% of viewport)
      expect(logoBox.width).toBeGreaterThan(viewport.width * 0.5);
    }
  });

  test('hero headline and subtitle should be readable on mobile', async ({ page }) => {
    await page.goto('/');

    const headline = page.locator('text=Tired of Crummy AI Listing Descriptions?');
    await expect(headline).toBeVisible();

    const headlineBox = await headline.boundingBox();
    const viewport = page.viewportSize()!;
    expect(headlineBox).not.toBeNull();
    if (headlineBox) {
      expect(headlineBox.x).toBeGreaterThanOrEqual(0);
      expect(headlineBox.x + headlineBox.width).toBeLessThanOrEqual(viewport.width + 5);
    }

    const subtitle = page.locator('text=Most AI tools hallucinate features and sound robotic');
    await expect(subtitle).toBeVisible();

    const subtitleBox = await subtitle.boundingBox();
    expect(subtitleBox).not.toBeNull();
    if (subtitleBox) {
      expect(subtitleBox.x).toBeGreaterThanOrEqual(0);
      expect(subtitleBox.x + subtitleBox.width).toBeLessThanOrEqual(viewport.width + 5);
    }
  });

  test('form card should not overflow viewport', async ({ page }) => {
    await page.goto('/');

    const formCard = page.locator('section').nth(1).locator('div').first();
    await expect(formCard).toBeVisible();

    const cardBox = await formCard.boundingBox();
    const viewport = page.viewportSize()!;
    expect(cardBox).not.toBeNull();
    if (cardBox) {
      expect(cardBox.x).toBeGreaterThanOrEqual(0);
      expect(cardBox.x + cardBox.width).toBeLessThanOrEqual(viewport.width + 2);
    }
  });

  test('form inputs should be full width and tappable on mobile', async ({ page }) => {
    await page.goto('/');

    const viewport = page.viewportSize()!;
    const emailInput = page.locator('input[placeholder="you@email.com"]');
    const addressInput = page.locator('input[placeholder="123 Main St, Chicago, IL 60601"]');
    const textarea = page.locator('textarea');

    for (const input of [emailInput, addressInput, textarea]) {
      await expect(input).toBeVisible();
      const box = await input.boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        // Inputs should be reasonably wide (at least 200px on any screen)
        expect(box.width).toBeGreaterThan(200);
        // On mobile, inputs should fill most of the viewport
        if (viewport.width < 600) {
          expect(box.width).toBeGreaterThan(viewport.width * 0.55);
        }
        // Inputs should be tappable (at least 40px tall for touch targets)
        expect(box.height).toBeGreaterThanOrEqual(40);
      }
    }
  });

  test('property details grid should be usable on mobile', async ({ page }) => {
    await page.goto('/');

    const priceInput = page.locator('input[placeholder="$450,000"]');
    const bedsInput = page.locator('input[placeholder="3"]');
    const bathsInput = page.locator('input[placeholder="2"]');
    const sqftInput = page.locator('input[placeholder="1,500"]');

    for (const input of [priceInput, bedsInput, bathsInput, sqftInput]) {
      await expect(input).toBeVisible();
      const box = await input.boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        // Grid inputs should be at least 70px wide to be usable
        expect(box.width).toBeGreaterThan(70);
        // Should be tappable
        expect(box.height).toBeGreaterThanOrEqual(36);
      }
    }
  });

  test('submit button should be full width and tappable', async ({ page }) => {
    await page.goto('/');

    const viewport = page.viewportSize()!;
    const submitBtn = page.getByRole('button', { name: 'Generate AI-Enhanced Description' });
    await expect(submitBtn).toBeVisible();

    const btnBox = await submitBtn.boundingBox();
    expect(btnBox).not.toBeNull();
    if (btnBox) {
      // Button should be reasonably wide (at least 200px on any screen)
      expect(btnBox.width).toBeGreaterThan(200);
      // On mobile, button should fill most of the viewport
      if (viewport.width < 600) {
        expect(btnBox.width).toBeGreaterThan(viewport.width * 0.55);
      }
      // Button should be tall enough to tap comfortably
      expect(btnBox.height).toBeGreaterThanOrEqual(44);
    }
  });

  test('How It Works cards should be visible and readable', async ({ page }) => {
    await page.goto('/');

    const howItWorks = page.locator('h2:has-text("How It Works")');
    await howItWorks.scrollIntoViewIfNeeded();
    await expect(howItWorks).toBeVisible();

    // All 3 steps should be visible
    await expect(page.locator('text=STEP 1')).toBeVisible();
    await expect(page.locator('text=STEP 2')).toBeVisible();
    await expect(page.locator('text=STEP 3')).toBeVisible();

    // Step headings should be visible
    await expect(page.locator('h3:has-text("Paste Your Listing")')).toBeVisible();
    await expect(page.locator('h3:has-text("AI Rewrites It")')).toBeVisible();
    await expect(page.locator('h3:has-text("Copy & Go")')).toBeVisible();

    const viewport = page.viewportSize()!;

    // On mobile (< 600px), verify cards don't overflow
    if (viewport.width < 600) {
      const step1 = page.locator('h3:has-text("Paste Your Listing")');
      const step1Box = await step1.boundingBox();
      if (step1Box) {
        expect(step1Box.x + step1Box.width).toBeLessThanOrEqual(viewport.width + 5);
      }
    }
  });

  test('Before/After section should be visible and not overflow', async ({ page }) => {
    await page.goto('/');

    const seeTheDifference = page.locator('h2:has-text("See the Difference")');
    await seeTheDifference.scrollIntoViewIfNeeded();
    await expect(seeTheDifference).toBeVisible();

    const beforeBadge = page.getByText('BEFORE', { exact: true });
    const afterBadge = page.getByText('AFTER', { exact: true });
    await expect(beforeBadge).toBeVisible();
    await expect(afterBadge).toBeVisible();

    // On small screens, Before and After should stack vertically
    const viewport = page.viewportSize()!;
    if (viewport.width < 580) {
      const beforeBox = await beforeBadge.boundingBox();
      const afterBox = await afterBadge.boundingBox();

      if (beforeBox && afterBox) {
        expect(afterBox.y).toBeGreaterThan(beforeBox.y + 50);
      }
    }
  });

  test('no horizontal scroll on mobile', async ({ page }) => {
    await page.goto('/');

    // Wait for page to fully render
    await page.waitForLoadState('networkidle');

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    expect(hasHorizontalScroll).toBe(false);
  });

  test('footer should be visible and text readable', async ({ page }) => {
    await page.goto('/');

    const footer = page.locator('text=2026 DJP3 Consulting Inc');
    await footer.scrollIntoViewIfNeeded();
    await expect(footer).toBeVisible();

    const footerBox = await footer.boundingBox();
    const viewport = page.viewportSize()!;
    expect(footerBox).not.toBeNull();
    if (footerBox) {
      expect(footerBox.x + footerBox.width).toBeLessThanOrEqual(viewport.width + 5);
    }
  });

  test('can fill and interact with form on mobile', async ({ page, browserName }) => {
    await page.goto('/');

    // Fill email
    await page.locator('input[placeholder="you@email.com"]').click();
    await page.fill('input[placeholder="you@email.com"]', 'mobile@test.com');

    // Fill address
    await page.locator('input[placeholder="123 Main St, Chicago, IL 60601"]').click();
    await page.fill('input[placeholder="123 Main St, Chicago, IL 60601"]', '100 Mobile St');

    // Fill description
    await page.locator('textarea').click();
    await page.fill('textarea', 'Test description for mobile.');

    // Verify
    await expect(page.locator('input[placeholder="you@email.com"]')).toHaveValue('mobile@test.com');
    await expect(page.locator('textarea')).toHaveValue('Test description for mobile.');

    // Checkbox should be togglable
    const checkbox = page.locator('input[type="checkbox"]');
    await expect(checkbox).toBeChecked();
    await checkbox.click();
    await expect(checkbox).not.toBeChecked();
  });

  test('Get Started Free button should be tappable on mobile', async ({ page }) => {
    await page.goto('/');

    const ctaBtn = page.getByRole('button', { name: 'Get Started Free' });
    await ctaBtn.scrollIntoViewIfNeeded();
    await expect(ctaBtn).toBeVisible();

    const btnBox = await ctaBtn.boundingBox();
    expect(btnBox).not.toBeNull();
    if (btnBox) {
      expect(btnBox.height).toBeGreaterThanOrEqual(44);
    }
  });
});
