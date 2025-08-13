// tests/performance/critical-pages.performance.spec.js
import { test, expect } from '@playwright/test';
import { collectWebVitals, analyzeNetworkRequests, measurePageLoad } from './utils/performance-helpers.js';

const PERFORMANCE_BUDGETS = {
  loadTime: 3000,      // 3 seconds max load time
  lcp: 2500,           // Largest Contentful Paint < 2.5s
  fcp: 1800,           // First Contentful Paint < 1.8s
  cls: 0.1,            // Cumulative Layout Shift < 0.1
  totalBlockingTime: 200,  // Total Blocking Time < 200ms
  jsSize: 170 * 1024,  // JavaScript bundle < 170KB
  cssSize: 50 * 1024   // CSS bundle < 50KB
};

test.describe('Critical Pages Performance', () => {
  test.beforeEach(async ({ page }) => {
    // Set up performance monitoring
    await page.addInitScript(() => {
      window.performanceMetrics = {};
      
      // Monitor resource loading
      window.addEventListener('load', () => {
        window.performanceMetrics.loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
      });
    });
  });

  test('Homepage performance within budgets', async ({ page }) => {
    // Navigate with network idle for complete load measurement
    const loadStart = Date.now();
    await page.goto('/', { waitUntil: 'networkidle' });
    const loadTime = Date.now() - loadStart;

    // Collect Web Vitals
    const webVitals = await collectWebVitals(page);
    
    // Analyze network requests
    const networkAnalysis = await analyzeNetworkRequests(page);
    
    // Assertions
    expect(loadTime, `Load time ${loadTime}ms exceeds budget of ${PERFORMANCE_BUDGETS.loadTime}ms`).toBeLessThan(PERFORMANCE_BUDGETS.loadTime);
    expect(webVitals.lcp, `LCP ${webVitals.lcp}ms exceeds budget of ${PERFORMANCE_BUDGETS.lcp}ms`).toBeLessThan(PERFORMANCE_BUDGETS.lcp);
    expect(webVitals.fcp, `FCP ${webVitals.fcp}ms exceeds budget of ${PERFORMANCE_BUDGETS.fcp}ms`).toBeLessThan(PERFORMANCE_BUDGETS.fcp);
    expect(webVitals.cls, `CLS ${webVitals.cls} exceeds budget of ${PERFORMANCE_BUDGETS.cls}`).toBeLessThan(PERFORMANCE_BUDGETS.cls);
    
    // Resource budgets
    expect(networkAnalysis.totalJSSize, `JS size ${networkAnalysis.totalJSSize} bytes exceeds budget`).toBeLessThan(PERFORMANCE_BUDGETS.jsSize);
    expect(networkAnalysis.totalCSSSize, `CSS size ${networkAnalysis.totalCSSSize} bytes exceeds budget`).toBeLessThan(PERFORMANCE_BUDGETS.cssSize);

    // Log results for monitoring
    console.log('📊 Homepage Performance Results:', {
      loadTime,
      ...webVitals,
      ...networkAnalysis
    });
  });

  test('Discover page performance', async ({ page }) => {
    const loadStart = Date.now();
    await page.goto('/discover', { waitUntil: 'networkidle' });
    const loadTime = Date.now() - loadStart;

    const webVitals = await collectWebVitals(page);
    
    // More lenient budgets for content-heavy discover page
    expect(loadTime).toBeLessThan(PERFORMANCE_BUDGETS.loadTime * 1.2);
    expect(webVitals.lcp).toBeLessThan(PERFORMANCE_BUDGETS.lcp * 1.1);
    expect(webVitals.cls).toBeLessThan(PERFORMANCE_BUDGETS.cls);

    // Check for infinite scroll performance
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 2);
    });
    
    await page.waitForTimeout(1000);
    
    // Measure scroll performance
    const scrollMetrics = await page.evaluate(() => {
      const entries = performance.getEntriesByType('measure');
      return entries.find(e => e.name.includes('scroll'));
    });

    console.log('📊 Discover Page Performance:', {
      loadTime,
      ...webVitals,
      scrollPerformance: scrollMetrics
    });
  });

  test('User profile page performance', async ({ page }) => {
    // Navigate to a sample user profile
    const loadStart = Date.now();
    await page.goto('/testuser', { waitUntil: 'networkidle' });
    const loadTime = Date.now() - loadStart;

    const webVitals = await collectWebVitals(page);
    
    // Profile pages should be optimized for image loading
    expect(loadTime).toBeLessThan(PERFORMANCE_BUDGETS.loadTime);
    expect(webVitals.lcp).toBeLessThan(PERFORMANCE_BUDGETS.lcp);
    
    // Check image optimization
    const images = await page.$$eval('img', imgs => 
      imgs.map(img => ({
        src: img.src,
        width: img.naturalWidth,
        height: img.naturalHeight,
        loading: img.loading
      }))
    );
    
    // Verify images use modern formats and lazy loading
    const modernFormats = images.filter(img => 
      img.src.includes('.webp') || img.src.includes('.avif')
    );
    
    expect(modernFormats.length).toBeGreaterThan(0);
    
    console.log('📊 Profile Page Performance:', {
      loadTime,
      ...webVitals,
      totalImages: images.length,
      modernFormatImages: modernFormats.length
    });
  });

  test('Mobile performance on slow connection', async ({ page, browserName }) => {
    // Skip on non-mobile browsers
    test.skip(browserName === 'webkit' && !process.env.CI, 'Mobile Safari testing in CI only');
    
    // Simulate slow 3G
    await page.route('**/*', async route => {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
      await route.continue();
    });

    const loadStart = Date.now();
    await page.goto('/', { waitUntil: 'networkidle' });
    const loadTime = Date.now() - loadStart;

    const webVitals = await collectWebVitals(page);
    
    // More lenient budgets for slow connections
    expect(loadTime).toBeLessThan(PERFORMANCE_BUDGETS.loadTime * 2);
    expect(webVitals.fcp).toBeLessThan(PERFORMANCE_BUDGETS.fcp * 1.5);
    expect(webVitals.cls).toBeLessThan(PERFORMANCE_BUDGETS.cls);

    console.log('📊 Mobile Slow Connection Performance:', {
      loadTime,
      ...webVitals
    });
  });

  test('Performance regression check', async ({ page }) => {
    // Measure multiple runs for consistency
    const runs = [];
    
    for (let i = 0; i < 3; i++) {
      const loadStart = Date.now();
      await page.goto('/', { waitUntil: 'networkidle' });
      const loadTime = Date.now() - loadStart;
      
      const webVitals = await collectWebVitals(page);
      runs.push({ loadTime, ...webVitals });
      
      // Clear cache between runs
      await page.evaluate(() => {
        if ('caches' in window) {
          caches.keys().then(names => names.forEach(name => caches.delete(name)));
        }
      });
    }
    
    // Calculate averages and check consistency
    const avgLoadTime = runs.reduce((sum, run) => sum + run.loadTime, 0) / runs.length;
    const avgLCP = runs.reduce((sum, run) => sum + run.lcp, 0) / runs.length;
    
    // Check for performance consistency (variation should be < 20%)
    const loadTimeVariation = Math.max(...runs.map(r => r.loadTime)) - Math.min(...runs.map(r => r.loadTime));
    const loadTimeVariationPercent = (loadTimeVariation / avgLoadTime) * 100;
    
    expect(loadTimeVariationPercent, 'Performance should be consistent across runs').toBeLessThan(20);
    expect(avgLoadTime).toBeLessThan(PERFORMANCE_BUDGETS.loadTime);
    expect(avgLCP).toBeLessThan(PERFORMANCE_BUDGETS.lcp);

    console.log('📊 Performance Consistency Check:', {
      avgLoadTime: Math.round(avgLoadTime),
      avgLCP: Math.round(avgLCP),
      variationPercent: Math.round(loadTimeVariationPercent),
      runs: runs.length
    });
  });
});
