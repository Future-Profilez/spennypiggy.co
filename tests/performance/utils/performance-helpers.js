// tests/performance/utils/performance-helpers.js

/**
 * Collect Web Vitals metrics from the page
 * @param {Page} page - Playwright page object
 * @returns {Promise<Object>} Web Vitals metrics
 */
export async function collectWebVitals(page) {
  return await page.evaluate(() => {
    return new Promise((resolve) => {
      const vitals = {};
      let metricsCollected = 0;
      const totalMetrics = 5; // LCP, FCP, CLS, FID, TTFB

      function checkComplete() {
        metricsCollected++;
        if (metricsCollected >= totalMetrics) {
          resolve(vitals);
        }
      }

      // Largest Contentful Paint
      try {
        new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          if (entries.length > 0) {
            vitals.lcp = Math.round(entries[entries.length - 1].startTime);
          }
          checkComplete();
        }).observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        vitals.lcp = 0;
        checkComplete();
      }

      // First Contentful Paint
      try {
        const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0];
        vitals.fcp = fcpEntry ? Math.round(fcpEntry.startTime) : 0;
        checkComplete();
      } catch (e) {
        vitals.fcp = 0;
        checkComplete();
      }

      // Cumulative Layout Shift
      try {
        new PerformanceObserver((entryList) => {
          let clsValue = 0;
          for (const entry of entryList.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          vitals.cls = Math.round(clsValue * 10000) / 10000;
          checkComplete();
        }).observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        vitals.cls = 0;
        checkComplete();
      }

      // First Input Delay (approximated)
      try {
        new PerformanceObserver((entryList) => {
          const firstInput = entryList.getEntries()[0];
          if (firstInput) {
            vitals.fid = Math.round(firstInput.processingStart - firstInput.startTime);
          }
          checkComplete();
        }).observe({ entryTypes: ['first-input'] });
      } catch (e) {
        vitals.fid = 0;
        checkComplete();
      }

      // Time to First Byte
      try {
        const navEntry = performance.getEntriesByType('navigation')[0];
        if (navEntry) {
          vitals.ttfb = Math.round(navEntry.responseStart - navEntry.fetchStart);
        }
        checkComplete();
      } catch (e) {
        vitals.ttfb = 0;
        checkComplete();
      }

      // Fallback timeout
      setTimeout(() => {
        resolve(vitals);
      }, 5000);
    });
  });
}

/**
 * Analyze network requests and resource sizes
 * @param {Page} page - Playwright page object
 * @returns {Promise<Object>} Network analysis results
 */
export async function analyzeNetworkRequests(page) {
  const networkData = await page.evaluate(() => {
    const resources = performance.getEntriesByType('resource');
    
    let totalJSSize = 0;
    let totalCSSSize = 0;
    let totalImageSize = 0;
    let totalRequests = resources.length;
    
    const requestsByType = {
      script: 0,
      stylesheet: 0,
      image: 0,
      document: 0,
      xmlhttprequest: 0,
      fetch: 0,
      other: 0
    };
    
    const slowRequests = [];
    const largeRequests = [];
    
    resources.forEach(resource => {
      const duration = resource.responseEnd - resource.startTime;
      const size = resource.transferSize || resource.encodedBodySize || 0;
      
      // Categorize by type
      if (resource.initiatorType in requestsByType) {
        requestsByType[resource.initiatorType]++;
      } else {
        requestsByType.other++;
      }
      
      // Calculate sizes
      if (resource.name.includes('.js') || resource.initiatorType === 'script') {
        totalJSSize += size;
      } else if (resource.name.includes('.css') || resource.initiatorType === 'stylesheet') {
        totalCSSSize += size;
      } else if (resource.initiatorType === 'image' || 
                 resource.name.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)$/i)) {
        totalImageSize += size;
      }
      
      // Identify slow requests (>1000ms)
      if (duration > 1000) {
        slowRequests.push({
          name: resource.name,
          duration: Math.round(duration),
          size
        });
      }
      
      // Identify large requests (>100KB)
      if (size > 100 * 1024) {
        largeRequests.push({
          name: resource.name,
          size,
          duration: Math.round(duration)
        });
      }
    });
    
    return {
      totalJSSize,
      totalCSSSize,
      totalImageSize,
      totalRequests,
      requestsByType,
      slowRequests,
      largeRequests
    };
  });

  return networkData;
}

/**
 * Measure detailed page load metrics
 * @param {Page} page - Playwright page object
 * @returns {Promise<Object>} Detailed load metrics
 */
export async function measurePageLoad(page) {
  const loadMetrics = await page.evaluate(() => {
    const perfData = performance.getEntriesByType('navigation')[0];
    if (!perfData) return {};
    
    return {
      // DNS lookup time
      dnsTime: Math.round(perfData.domainLookupEnd - perfData.domainLookupStart),
      
      // Connection time
      connectTime: Math.round(perfData.connectEnd - perfData.connectStart),
      
      // SSL handshake time
      tlsTime: perfData.secureConnectionStart > 0 ? 
        Math.round(perfData.connectEnd - perfData.secureConnectionStart) : 0,
      
      // Time to first byte
      ttfb: Math.round(perfData.responseStart - perfData.fetchStart),
      
      // Response time
      responseTime: Math.round(perfData.responseEnd - perfData.responseStart),
      
      // DOM processing time
      domProcessingTime: Math.round(perfData.domInteractive - perfData.responseEnd),
      
      // DOM content loaded time
      domContentLoadedTime: Math.round(perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart),
      
      // Load event time
      loadEventTime: Math.round(perfData.loadEventEnd - perfData.loadEventStart),
      
      // Total load time
      totalLoadTime: Math.round(perfData.loadEventEnd - perfData.fetchStart)
    };
  });

  return loadMetrics;
}

/**
 * Monitor Core Web Vitals in real-time
 * @param {Page} page - Playwright page object
 * @returns {Promise<void>}
 */
export async function monitorWebVitalsRealTime(page) {
  await page.addInitScript(() => {
    window.webVitalsData = [];
    
    // Create observers for real-time monitoring
    try {
      // LCP Observer
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          window.webVitalsData.push({
            name: 'LCP',
            value: entry.startTime,
            timestamp: Date.now()
          });
        }
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // CLS Observer
      let clsValue = 0;
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            window.webVitalsData.push({
              name: 'CLS',
              value: clsValue,
              timestamp: Date.now()
            });
          }
        }
      }).observe({ entryTypes: ['layout-shift'] });

      // Long Task Observer (for TBT calculation)
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          const blockingTime = Math.max(0, entry.duration - 50);
          if (blockingTime > 0) {
            window.webVitalsData.push({
              name: 'TBT',
              value: blockingTime,
              timestamp: Date.now()
            });
          }
        }
      }).observe({ entryTypes: ['longtask'] });

    } catch (error) {
      console.warn('Web Vitals monitoring setup failed:', error);
    }
  });
}

/**
 * Simulate different network conditions
 * @param {Page} page - Playwright page object
 * @param {string} condition - Network condition (slow3g, fast3g, wifi)
 * @returns {Promise<void>}
 */
export async function simulateNetworkCondition(page, condition) {
  const conditions = {
    slow3g: {
      offline: false,
      downloadThroughput: 400 * 1024 / 8, // 400 Kbps
      uploadThroughput: 400 * 1024 / 8,
      latency: 2000
    },
    fast3g: {
      offline: false,
      downloadThroughput: 1.5 * 1024 * 1024 / 8, // 1.5 Mbps
      uploadThroughput: 750 * 1024 / 8,
      latency: 562.5
    },
    wifi: {
      offline: false,
      downloadThroughput: 30 * 1024 * 1024 / 8, // 30 Mbps
      uploadThroughput: 15 * 1024 * 1024 / 8,
      latency: 28
    }
  };

  if (condition in conditions) {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Network.emulateNetworkConditions', conditions[condition]);
  }
}

/**
 * Generate performance report
 * @param {Object} metrics - Performance metrics to report
 * @param {string} testName - Name of the test
 * @returns {Object} Formatted performance report
 */
export function generatePerformanceReport(metrics, testName) {
  const report = {
    testName,
    timestamp: new Date().toISOString(),
    metrics,
    score: calculatePerformanceScore(metrics),
    recommendations: generateRecommendations(metrics)
  };

  return report;
}

/**
 * Calculate performance score based on metrics
 * @param {Object} metrics - Performance metrics
 * @returns {number} Performance score (0-100)
 */
function calculatePerformanceScore(metrics) {
  let score = 100;
  
  // Deduct points based on metric thresholds
  if (metrics.lcp > 2500) score -= 20;
  if (metrics.fcp > 1800) score -= 15;
  if (metrics.cls > 0.1) score -= 15;
  if (metrics.totalJSSize > 170 * 1024) score -= 10;
  if (metrics.totalCSSSize > 50 * 1024) score -= 10;
  if (metrics.loadTime > 3000) score -= 20;
  if (metrics.ttfb > 600) score -= 10;

  return Math.max(0, score);
}

/**
 * Generate performance recommendations
 * @param {Object} metrics - Performance metrics
 * @returns {Array} Array of recommendations
 */
function generateRecommendations(metrics) {
  const recommendations = [];
  
  if (metrics.lcp > 2500) {
    recommendations.push('Optimize Largest Contentful Paint by reducing server response times and optimizing critical resources');
  }
  
  if (metrics.fcp > 1800) {
    recommendations.push('Improve First Contentful Paint by minimizing render-blocking resources');
  }
  
  if (metrics.cls > 0.1) {
    recommendations.push('Reduce Cumulative Layout Shift by defining image dimensions and avoiding dynamic content insertion');
  }
  
  if (metrics.totalJSSize > 170 * 1024) {
    recommendations.push('Reduce JavaScript bundle size through code splitting and tree shaking');
  }
  
  if (metrics.totalCSSSize > 50 * 1024) {
    recommendations.push('Optimize CSS by removing unused styles and using critical CSS inlining');
  }
  
  if (metrics.slowRequests && metrics.slowRequests.length > 0) {
    recommendations.push('Optimize slow-loading resources or consider lazy loading');
  }

  return recommendations;
}
