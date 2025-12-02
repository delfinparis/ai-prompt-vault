import { test, expect } from '@playwright/test';

// Test account for E2E testing
const TEST_EMAIL = `test-${Date.now()}@playwright-test.com`;
const TEST_PASSWORD = 'TestPassword123!';

test.describe('Kale Listing AI - Landing Page', () => {
  test('should load landing page with all sections', async ({ page }) => {
    await page.goto('/');

    // Check hero section
    await expect(page.locator('text=Transform Boring Listings Into')).toBeVisible();
    await expect(page.locator('text=Buyer Magnets')).toBeVisible();
    await expect(page.locator('text=Beta Testing - 5 Free Credits on Signup')).toBeVisible();

    // Check navigation - use more specific selector
    await expect(page.locator('nav >> text=Kale')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Login / Sign Up' })).toBeVisible();

    // Check form exists
    await expect(page.locator('text=Property Address')).toBeVisible();
    await expect(page.locator('text=Current Listing Description')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Generate AI-Enhanced Description' })).toBeVisible();

    // Check How It Works section
    await expect(page.locator('h2:has-text("How It Works")')).toBeVisible();
    await expect(page.locator('text=Paste Your Listing')).toBeVisible();
    await expect(page.locator('text=AI Works Its Magic')).toBeVisible();
    await expect(page.locator('text=Get Your New Description')).toBeVisible();

    // Check Before/After section
    await expect(page.locator('h2:has-text("See the Difference")')).toBeVisible();
    await expect(page.getByText('BEFORE', { exact: true })).toBeVisible();
    await expect(page.getByText('AFTER', { exact: true })).toBeVisible();

    // Check Footer CTA
    await expect(page.locator('text=Ready to Transform Your Listings?')).toBeVisible();
  });

  test('should show auth form when clicking Login / Sign Up', async ({ page }) => {
    await page.goto('/');

    // Click login button
    await page.getByRole('button', { name: 'Login / Sign Up' }).click();

    // Auth form should appear
    await expect(page.locator('input[placeholder="Email"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Password"]')).toBeVisible();

    // Check for the Login tab button inside the auth form
    await expect(page.getByRole('button', { name: 'Login', exact: true }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign Up', exact: true })).toBeVisible();
  });

  test('should toggle between Login and Sign Up modes', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Login / Sign Up' }).click();

    // Click Sign Up tab
    await page.getByRole('button', { name: 'Sign Up', exact: true }).click();

    // Should show sign up button text
    await expect(page.getByRole('button', { name: 'Create Account (5 Free Credits)' })).toBeVisible();

    // Click Login tab
    await page.getByRole('button', { name: 'Login', exact: true }).first().click();

    // The submit button should now just say Login (not Create Account)
    await expect(page.getByRole('button', { name: 'Create Account (5 Free Credits)' })).not.toBeVisible();
  });

  test('should show validation error for empty email', async ({ page }) => {
    await page.goto('/');

    // Try to submit without email
    await page.fill('input[placeholder="123 Main St, Chicago, IL 60601"]', '123 Test St, Chicago, IL 60601');
    await page.fill('textarea', 'Test listing description for a beautiful home.');

    await page.getByRole('button', { name: 'Generate AI-Enhanced Description' }).click();

    // Should show error
    await expect(page.locator('text=Please enter a valid email address')).toBeVisible();
  });

  test('should show validation error for empty address', async ({ page }) => {
    await page.goto('/');

    // Fill email but not address
    await page.fill('input[placeholder="you@email.com"]', 'test@example.com');
    await page.fill('textarea', 'Test listing description.');

    await page.getByRole('button', { name: 'Generate AI-Enhanced Description' }).click();

    // Should show error
    await expect(page.locator('text=Please enter the property address')).toBeVisible();
  });

  test('should show validation error for empty description', async ({ page }) => {
    await page.goto('/');

    // Fill email and address but not description
    await page.fill('input[placeholder="you@email.com"]', 'test@example.com');
    await page.fill('input[placeholder="123 Main St, Chicago, IL 60601"]', '123 Test St');

    await page.getByRole('button', { name: 'Generate AI-Enhanced Description' }).click();

    // Should show error
    await expect(page.locator('text=Please enter the current listing description')).toBeVisible();
  });

  test('should close auth form when clicking Cancel', async ({ page }) => {
    await page.goto('/');

    // Open auth form
    await page.getByRole('button', { name: 'Login / Sign Up' }).click();
    await expect(page.locator('input[placeholder="Email"]')).toBeVisible();

    // Click cancel
    await page.getByRole('button', { name: 'Cancel' }).click();

    // Auth form should be hidden, email field in main form should show
    await expect(page.locator('input[placeholder="you@email.com"]')).toBeVisible();
  });

  test('should show auth error for empty credentials', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Login / Sign Up' }).click();

    // Try to login without filling anything
    // Find the submit button (last button in auth form that says Login when in login mode)
    const submitButton = page.locator('button:has-text("Login")').last();
    await submitButton.click();

    // Wait for error message
    await expect(page.locator('text=Email and password are required')).toBeVisible({ timeout: 5000 });
  });

  test('should show auth error for invalid credentials', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Login / Sign Up' }).click();

    // Fill invalid credentials
    await page.fill('input[placeholder="Email"]', 'nonexistent@test.com');
    await page.fill('input[placeholder="Password"]', 'wrongpassword');

    // Submit - get the last Login button (the submit button)
    const submitButton = page.locator('button:has-text("Login")').last();
    await submitButton.click();

    // Wait for error message (API call)
    await expect(page.locator('text=Invalid email or password')).toBeVisible({ timeout: 15000 });
  });

  test('should scroll to form when clicking Get Started Free', async ({ page }) => {
    await page.goto('/');

    // Scroll to bottom and click Get Started Free
    await page.getByRole('button', { name: 'Get Started Free' }).click();

    // Should scroll to top (form should be in view)
    await expect(page.locator('text=Property Address').first()).toBeInViewport();
  });
});

test.describe('Kale Listing AI - Mobile Responsiveness', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

  test('should display correctly on mobile', async ({ page }) => {
    await page.goto('/');

    // Hero should be visible
    await expect(page.locator('text=Transform Boring Listings Into')).toBeVisible();

    // Form should be visible
    await expect(page.getByRole('button', { name: 'Generate AI-Enhanced Description' })).toBeVisible();

    // Navigation should work
    await expect(page.getByRole('button', { name: 'Login / Sign Up' })).toBeVisible();
  });
});

test.describe('Kale Listing AI - Full User Flow', () => {
  // Use unique email for each test run to avoid conflicts
  const uniqueEmail = `test-${Date.now()}@playwright-test.com`;

  test('should register a new account and get 5 credits', async ({ page }) => {
    await page.goto('/');

    // Open auth form
    await page.getByRole('button', { name: 'Login / Sign Up' }).click();

    // Switch to Sign Up
    await page.getByRole('button', { name: 'Sign Up', exact: true }).click();

    // Fill registration form
    await page.fill('input[placeholder="Email"]', uniqueEmail);
    await page.fill('input[placeholder="Password"]', TEST_PASSWORD);

    // Submit
    await page.getByRole('button', { name: 'Create Account (5 Free Credits)' }).click();

    // Wait for loading to complete (button changes from "Please wait..." back)
    await expect(page.getByRole('button', { name: 'Please wait...' })).not.toBeVisible({ timeout: 15000 });

    // Wait for successful registration - should show logged in state with 5 credits
    await expect(page.getByText('5 Credits', { exact: true })).toBeVisible({ timeout: 10000 });

    // Auth form should be hidden
    await expect(page.locator('input[placeholder="Email"]')).not.toBeVisible();
  });

  test('should submit listing and receive AI-enhanced description (guest user)', async ({ page }) => {
    await page.goto('/');

    // Fill the form as guest
    await page.fill('input[placeholder="you@email.com"]', 'guest-test@example.com');
    await page.fill('input[placeholder="123 Main St, Chicago, IL 60601"]', '456 Oak Avenue, Evanston, IL 60201');
    await page.fill('input[placeholder="$450,000"]', '$525,000');
    await page.fill('input[placeholder="3"]', '3');
    await page.fill('input[placeholder="2"]', '2');
    await page.fill('input[placeholder="1,500"]', '1,800');
    await page.fill('textarea', `Spacious 3 bedroom home with updated kitchen. Hardwood floors throughout. Large backyard. Near schools and shopping. Two car garage. Central air. Move in ready.`);

    // Submit
    await page.getByRole('button', { name: 'Generate AI-Enhanced Description' }).click();

    // Should show loading state with processing stages
    await expect(page.locator('text=Researching Your Property')).toBeVisible({ timeout: 5000 });

    // Wait for result (this can take 30-60 seconds for AI processing)
    await expect(page.locator('text=Your AI-Enhanced Description is Ready!')).toBeVisible({ timeout: 90000 });

    // Should show the result
    await expect(page.locator('text=Your New Listing Description')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Copy to Clipboard' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Rewrite Another Listing' })).toBeVisible();

    // Should show character count
    await expect(page.locator('text=/\\d+ characters/')).toBeVisible();
  });

  test('should copy description to clipboard', async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await page.goto('/');

    // Fill and submit form
    await page.fill('input[placeholder="you@email.com"]', 'clipboard-test@example.com');
    await page.fill('input[placeholder="123 Main St, Chicago, IL 60601"]', '789 Pine St, Chicago, IL 60614');
    await page.fill('textarea', `2 bed 1 bath condo in prime location. Updated appliances. In-unit laundry. Balcony with city views. Walk to train.`);

    await page.getByRole('button', { name: 'Generate AI-Enhanced Description' }).click();

    // Wait for result
    await expect(page.locator('text=Your AI-Enhanced Description is Ready!')).toBeVisible({ timeout: 90000 });

    // Click copy button
    await page.getByRole('button', { name: 'Copy to Clipboard' }).click();

    // Button should change to "Copied!"
    await expect(page.getByRole('button', { name: 'Copied!' })).toBeVisible();

    // Verify clipboard contains text (should have some content)
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText.length).toBeGreaterThan(100);
  });

  test('should allow rewriting another listing after completion', async ({ page }) => {
    await page.goto('/');

    // Fill and submit first listing
    await page.fill('input[placeholder="you@email.com"]', 'rewrite-test@example.com');
    await page.fill('input[placeholder="123 Main St, Chicago, IL 60601"]', '100 First St, Chicago, IL 60601');
    await page.fill('textarea', `Cozy studio apartment. Great location. Laundry in building.`);

    await page.getByRole('button', { name: 'Generate AI-Enhanced Description' }).click();

    // Wait for result
    await expect(page.locator('text=Your AI-Enhanced Description is Ready!')).toBeVisible({ timeout: 90000 });

    // Click "Rewrite Another Listing"
    await page.getByRole('button', { name: 'Rewrite Another Listing' }).click();

    // Should be back to form view with empty fields
    await expect(page.getByRole('button', { name: 'Generate AI-Enhanced Description' })).toBeVisible();
    await expect(page.locator('input[placeholder="123 Main St, Chicago, IL 60601"]')).toHaveValue('');
    await expect(page.locator('textarea')).toHaveValue('');
  });

  test('should show processing stages during AI generation', async ({ page }) => {
    await page.goto('/');

    // Fill form
    await page.fill('input[placeholder="you@email.com"]', 'stages-test@example.com');
    await page.fill('input[placeholder="123 Main St, Chicago, IL 60601"]', '200 Second St, Chicago, IL 60602');
    await page.fill('textarea', `Beautiful home with modern updates. Open floor plan.`);

    await page.getByRole('button', { name: 'Generate AI-Enhanced Description' }).click();

    // Check that at least some processing stages appear
    // The stages cycle, so we just need to see at least one
    const possibleStages = [
      'Researching Your Property',
      'Mapping the Neighborhood',
      'Analyzing Comparables',
      'AI Copywriter at Work',
      'Final Polish'
    ];

    let foundStage = false;
    for (const stage of possibleStages) {
      try {
        await expect(page.locator(`text=${stage}`)).toBeVisible({ timeout: 3000 });
        foundStage = true;
        break;
      } catch {
        // Try next stage
      }
    }

    expect(foundStage).toBe(true);

    // Wait for completion
    await expect(page.locator('text=Your AI-Enhanced Description is Ready!')).toBeVisible({ timeout: 90000 });
  });
});

test.describe('Kale Listing AI - Logged In User Flow', () => {
  const loggedInEmail = `logged-in-${Date.now()}@playwright-test.com`;

  test('should register, submit listing, and see credits decrease', async ({ page }) => {
    await page.goto('/');

    // Register
    await page.getByRole('button', { name: 'Login / Sign Up' }).click();
    await page.getByRole('button', { name: 'Sign Up', exact: true }).click();
    await page.fill('input[placeholder="Email"]', loggedInEmail);
    await page.fill('input[placeholder="Password"]', TEST_PASSWORD);
    await page.getByRole('button', { name: 'Create Account (5 Free Credits)' }).click();

    // Wait for login
    await expect(page.getByText('5 Credits', { exact: true })).toBeVisible({ timeout: 10000 });

    // Should show logged in info in form
    await expect(page.locator(`text=Logged in as`)).toBeVisible();
    await expect(page.locator('text=5 credits remaining')).toBeVisible();

    // Fill and submit listing
    await page.fill('input[placeholder="123 Main St, Chicago, IL 60601"]', '300 Third St, Chicago, IL 60603');
    await page.fill('textarea', `Renovated townhouse with 3 levels. Rooftop deck. Attached garage.`);

    await page.getByRole('button', { name: 'Generate AI-Enhanced Description' }).click();

    // Wait for result
    await expect(page.locator('text=Your AI-Enhanced Description is Ready!')).toBeVisible({ timeout: 90000 });

    // Credits should decrease to 4
    await expect(page.locator('text=Credits: 4')).toBeVisible();
  });
});
