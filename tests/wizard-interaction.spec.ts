import { test, expect } from '@playwright/test';

test.describe('Wizard Interactive Testing', () => {
  test.beforeEach(async ({ page }) => {
    // Start at the app
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
  });

  test('can type in wizard fields without losing focus', async ({ page }) => {
    // Open wizard
    const wizardButton = page.locator('button:has-text("AI Wizard")').first();
    await wizardButton.click();
    
    // Wait for wizard modal
    await page.waitForSelector('text=From blank page to ready-to-use');
    
    // Select a challenge category
    await page.locator('button:has-text("Lead Generation")').first().click();
    
    // Wait for Step 2
    await page.waitForSelector('input[type="text"]');
    
    // Take screenshot of Step 2
    await page.screenshot({ path: 'tests/screenshots/step2-initial.png', fullPage: true });
    
    // Find first text input and type continuously
    const firstInput = page.locator('input[type="text"]').first();
    await firstInput.click();
    
    // Type a full sentence
    const testText = 'I want to generate 10 qualified leads per month in the luxury condo market';
    await firstInput.fill(testText);
    
    // Take screenshot after typing
    await page.screenshot({ path: 'tests/screenshots/step2-after-typing.png', fullPage: true });
    
    // Verify the text was entered
    const inputValue = await firstInput.inputValue();
    expect(inputValue).toBe(testText);
    
    // Check if focus is still on the input
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    console.log('Focused element after typing:', focusedElement);
    
    // Take final screenshot
    await page.screenshot({ path: 'tests/screenshots/step2-final.png', fullPage: true });
  });

  test('explore wizard UI', async ({ page }) => {
    // Take homepage screenshot
    await page.screenshot({ path: 'tests/screenshots/homepage.png', fullPage: true });
    
    // Open wizard
    await page.locator('button:has-text("AI Wizard")').first().click();
    await page.waitForSelector('text=From blank page to ready-to-use');
    await page.screenshot({ path: 'tests/screenshots/wizard-step1.png', fullPage: true });
    
    // Get all challenge categories
    const categories = await page.locator('button:has-text("Lead Generation"), button:has-text("Marketing"), button:has-text("Client Communication")').all();
    console.log(`Found ${categories.length} challenge categories`);
    
    // Click first category
    if (categories.length > 0) {
      await categories[0].click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'tests/screenshots/wizard-step2-form.png', fullPage: true });
    }
  });
});
