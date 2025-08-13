import { defineConfig, devices } from '@playwright/test';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [
    ['html', { open: 'never', outputFolder: 'test-results/html' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }]
  ] : 'html',
  
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:8000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },

  projects: [
    {
      name: 'chromium-desktop',
      use: { 
        ...devices['Desktop Chrome'],
        // Simulate typical desktop connection
        contextOptions: {
          geolocation: { longitude: -0.1276, latitude: 51.5074 }, // London
          permissions: ['geolocation']
        }
      },
    },

    {
      name: 'firefox-desktop',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit-desktop',
      use: { ...devices['Desktop Safari'] },
    },

    // Mobile testing
    {
      name: 'mobile-chrome',
      use: { 
        ...devices['Pixel 5'],
        // Simulate 3G connection for mobile
        contextOptions: {
          offline: false
        }
      },
    },

    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },

    // Tablet testing
    {
      name: 'tablet-chrome',
      use: { ...devices['iPad Pro'] },
    },

    // Performance-focused testing with throttling
    {
      name: 'performance-slow-3g',
      use: {
        ...devices['Desktop Chrome'],
        // Custom viewport for performance testing
        viewport: { width: 1280, height: 720 },
        // Simulate slow connection
        contextOptions: {
          offline: false
        }
      },
      testMatch: /.*\.performance\.spec\.js/
    },

    // High-end performance testing
    {
      name: 'performance-fast',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      },
      testMatch: /.*\.performance\.spec\.js/
    }
  ],

  // Global setup and teardown
  globalSetup: require.resolve('./global-setup'),
  globalTeardown: require.resolve('./global-teardown'),

  webServer: process.env.CI ? undefined : {
    command: 'php artisan serve --port=8000',
    port: 8000,
    reuseExistingServer: !process.env.CI,
    timeout: 30000
  },

  expect: {
    timeout: 30000,
    // Custom matchers for performance testing
    toHaveLoadTime: async (page, maxTime) => {
      const navigationTiming = await page.evaluate(() => {
        const perfData = performance.getEntriesByType('navigation')[0];
        return perfData.loadEventEnd - perfData.fetchStart;
      });
      
      const pass = navigationTiming <= maxTime;
      return {
        message: () => `Expected load time to be <= ${maxTime}ms, but was ${navigationTiming}ms`,
        pass
      };
    }
  },

  // Test timeout
  timeout: process.env.CI ? 60000 : 30000
});
