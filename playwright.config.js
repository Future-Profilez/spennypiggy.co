// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './tests/performance',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html'],
    ['json', { outputFile: 'playwright-report.json' }],
    ['junit', { outputFile: 'playwright-results.xml' }]
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.TEST_URL || 'https://dev.spennypiggy.co',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Video recording */
    video: 'retain-on-failure',
  },

  /* Configure projects for major browsers and devices */
  projects: [
    // Desktop browsers
    {
      name: 'Desktop Chrome',
      use: { 
        ...devices['Desktop Chrome'],
        // Simulate typical desktop connection
        contextOptions: {
          // Simulate fast 3G connection
          offline: false,
        }
      },
    },

    {
      name: 'Desktop Firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'Desktop Safari',
      use: { ...devices['Desktop Safari'] },
    },

    // Mobile devices with performance focus
    {
      name: 'mobile',
      use: { 
        ...devices['Pixel 5'],
        // Simulate slow 3G for performance testing
        contextOptions: {
          // This will be configured per test for network conditions
        }
      },
    },

    {
      name: 'iPhone',
      use: { 
        ...devices['iPhone 12'],
        contextOptions: {
          // Simulate mobile network conditions
        }
      },
    },

    // Tablet testing
    {
      name: 'tablet',
      use: { 
        ...devices['iPad Pro'],
      },
    },

    // Performance-focused configurations
    {
      name: 'mobile-slow-3g',
      use: { 
        ...devices['Pixel 5'],
        // Configure for slow network testing
        launchOptions: {
          args: [
            '--disable-dev-shm-usage',
            '--disable-extensions',
            '--disable-gpu',
            '--no-sandbox',
          ]
        }
      },
    },

    {
      name: 'desktop-throttled',
      use: { 
        ...devices['Desktop Chrome'],
        // CPU throttling simulation
        launchOptions: {
          args: [
            '--disable-dev-shm-usage',
            '--disable-extensions',
          ]
        }
      },
    },
  ],

  /* Global setup and teardown */
  globalSetup: require.resolve('./tests/performance/global-setup.js'),
  globalTeardown: require.resolve('./tests/performance/global-teardown.js'),

  /* Run your local dev server before starting the tests */
  webServer: process.env.CI ? undefined : {
    command: 'php artisan serve --port=8000',
    url: 'http://localhost:8000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
