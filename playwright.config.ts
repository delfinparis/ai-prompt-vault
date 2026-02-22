import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 30000,
  use: {
    baseURL: process.env.BASE_URL || 'https://listing.joinkale.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'iPhone 14',
      use: { ...devices['iPhone 14'] },
    },
    {
      name: 'iPhone SE',
      use: { ...devices['iPhone SE'] },
    },
    {
      name: 'iPad Mini',
      use: { ...devices['iPad Mini'] },
    },
    {
      name: 'Pixel 7',
      use: { ...devices['Pixel 7'] },
    },
  ],
});
