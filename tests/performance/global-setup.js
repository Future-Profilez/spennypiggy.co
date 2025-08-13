// tests/performance/global-setup.js
const { chromium } = require('@playwright/test');

async function globalSetup(config) {
  console.log('🚀 Setting up performance testing environment...');
  
  // Create a browser instance for pre-test setup
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Verify the application is running
    const baseURL = config.projects[0].use.baseURL || process.env.TEST_URL || 'http://localhost:8000';
    console.log(`🌐 Testing against: ${baseURL}`);
    
    // Health check
    const response = await page.goto(`${baseURL}/health`);
    if (!response.ok()) {
      throw new Error(`Health check failed: ${response.status()}`);
    }
    
    const healthData = await response.json();
    console.log('✅ Application health check passed:', healthData.status);
    
    // Warm up critical pages
    const criticalPages = ['/', '/register', '/giftstore'];
    for (const pagePath of criticalPages) {
      try {
        await page.goto(`${baseURL}${pagePath}`, { waitUntil: 'networkidle' });
        console.log(`🔥 Warmed up: ${pagePath}`);
      } catch (error) {
        console.warn(`⚠️  Failed to warm up ${pagePath}:`, error.message);
      }
    }
    
    // Clear any cached data that might affect tests
    await page.evaluate(() => {
      // Clear localStorage
      localStorage.clear();
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      // Clear any performance observers
      if (window.PerformanceObserver) {
        const observer = new PerformanceObserver(() => {});
        observer.disconnect();
      }
    });
    
    console.log('🧹 Browser cache and storage cleared');
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
  
  console.log('✅ Performance testing environment ready');
}

module.exports = globalSetup;
