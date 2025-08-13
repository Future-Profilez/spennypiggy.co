import { onCLS, onFID, onFCP, onLCP, onTTFB, onINP } from 'web-vitals';

/**
 * Real User Monitoring (RUM) for Web Vitals
 * Sends performance metrics to analytics and monitoring services
 */

// Performance thresholds for alerting
const PERFORMANCE_THRESHOLDS = {
  LCP: 2500,    // Largest Contentful Paint < 2.5s
  FID: 100,     // First Input Delay < 100ms
  CLS: 0.1,     // Cumulative Layout Shift < 0.1
  FCP: 1800,    // First Contentful Paint < 1.8s
  TTFB: 600,    // Time to First Byte < 600ms
  INP: 200      // Interaction to Next Paint < 200ms
};

// Analytics configuration
const ANALYTICS_CONFIG = {
  endpoint: '/api/analytics/web-vitals',
  debug: process.env.NODE_ENV === 'development',
  sampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0 // 10% sampling in production
};

/**
 * Send metric to analytics endpoint
 */
async function sendToAnalytics(metric) {
  // Sample based on configuration
  if (Math.random() > ANALYTICS_CONFIG.sampleRate) {
    return;
  }

  const data = {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
    timestamp: Date.now(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    connection: navigator.connection ? {
      effectiveType: navigator.connection.effectiveType,
      downlink: navigator.connection.downlink,
      rtt: navigator.connection.rtt
    } : null,
    // Additional context
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight
    },
    deviceMemory: navigator.deviceMemory || null,
    hardwareConcurrency: navigator.hardwareConcurrency || null
  };

  try {
    // Send via navigator.sendBeacon for reliability
    if (navigator.sendBeacon) {
      navigator.sendBeacon(ANALYTICS_CONFIG.endpoint, JSON.stringify(data));
    } else {
      // Fallback to fetch
      await fetch(ANALYTICS_CONFIG.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        keepalive: true
      });
    }

    if (ANALYTICS_CONFIG.debug) {
      console.log(`📊 Web Vital ${metric.name}:`, data);
    }
  } catch (error) {
    console.warn('Failed to send web vital metric:', error);
  }
}

/**
 * Send critical performance issues to monitoring service
 */
async function sendAlert(metric) {
  const threshold = PERFORMANCE_THRESHOLDS[metric.name];
  if (!threshold || metric.value <= threshold) {
    return;
  }

  const alertData = {
    type: 'performance_regression',
    metric: metric.name,
    value: metric.value,
    threshold: threshold,
    severity: metric.value > (threshold * 2) ? 'critical' : 'warning',
    url: window.location.href,
    timestamp: Date.now(),
    userAgent: navigator.userAgent
  };

  try {
    // Send to alerting service (could be Sentry, Datadog, etc.)
    await fetch('/api/alerts/performance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(alertData),
      keepalive: true
    });

    if (ANALYTICS_CONFIG.debug) {
      console.warn(`⚠️  Performance Alert - ${metric.name}: ${metric.value}ms exceeds threshold ${threshold}ms`);
    }
  } catch (error) {
    console.warn('Failed to send performance alert:', error);
  }
}

/**
 * Send metrics to Cloudflare RUM (if available)
 */
function sendToCloudflareRUM(metric) {
  if (typeof __cfRum !== 'undefined' && __cfRum) {
    __cfRum('track', {
      name: `web-vital-${metric.name.toLowerCase()}`,
      value: metric.value,
      labels: {
        rating: metric.rating,
        url: window.location.pathname
      }
    });
  }
}

/**
 * Enhanced metric handler
 */
function handleMetric(metric) {
  // Send to all monitoring services
  sendToAnalytics(metric);
  sendToCloudflareRUM(metric);
  sendAlert(metric);

  // Send to Google Analytics 4 if available
  if (typeof gtag !== 'undefined') {
    gtag('event', metric.name, {
      event_category: 'Web Vitals',
      event_label: metric.id,
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      non_interaction: true,
      custom_parameters: {
        rating: metric.rating
      }
    });
  }

  // Log performance insights in development
  if (ANALYTICS_CONFIG.debug) {
    const emoji = metric.rating === 'good' ? '✅' : metric.rating === 'needs-improvement' ? '⚠️' : '❌';
    console.log(`${emoji} ${metric.name}: ${metric.value} (${metric.rating})`);
    
    // Provide optimization hints
    if (metric.rating !== 'good') {
      const hints = getOptimizationHints(metric);
      if (hints.length > 0) {
        console.log(`💡 Optimization hints for ${metric.name}:`, hints);
      }
    }
  }
}

/**
 * Get optimization hints based on metric
 */
function getOptimizationHints(metric) {
  const hints = [];
  
  switch (metric.name) {
    case 'LCP':
      hints.push('Consider lazy loading non-critical images');
      hints.push('Optimize server response time');
      hints.push('Use resource hints (preload, preconnect)');
      break;
    case 'FID':
      hints.push('Reduce JavaScript execution time');
      hints.push('Use code splitting and lazy loading');
      hints.push('Optimize third-party scripts');
      break;
    case 'CLS':
      hints.push('Set size attributes on images and videos');
      hints.push('Reserve space for dynamic content');
      hints.push('Avoid inserting content above existing content');
      break;
    case 'FCP':
      hints.push('Reduce render-blocking resources');
      hints.push('Eliminate unused CSS');
      hints.push('Optimize font loading');
      break;
    case 'TTFB':
      hints.push('Optimize server processing time');
      hints.push('Use CDN for static assets');
      hints.push('Implement caching strategies');
      break;
  }
  
  return hints;
}

/**
 * Initialize Web Vitals monitoring
 */
export function initWebVitalsMonitoring() {
  // Track Core Web Vitals
  onLCP(handleMetric);
  onFID(handleMetric);
  onCLS(handleMetric);
  
  // Track additional metrics
  onFCP(handleMetric);
  onTTFB(handleMetric);
  
  // Track Interaction to Next Paint (newer metric)
  if (typeof onINP === 'function') {
    onINP(handleMetric);
  }

  // Track custom business metrics
  trackCustomMetrics();
  
  if (ANALYTICS_CONFIG.debug) {
    console.log('🚀 Web Vitals monitoring initialized');
  }
}

/**
 * Track custom business-specific metrics
 */
function trackCustomMetrics() {
  // Track time to interactive for key user flows
  const trackUserFlow = (flowName, startTime) => {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    sendToAnalytics({
      name: `custom_${flowName}`,
      value: duration,
      rating: duration < 1000 ? 'good' : duration < 2500 ? 'needs-improvement' : 'poor',
      id: `${flowName}-${Date.now()}`,
      delta: duration
    });
  };

  // Track page load completion
  window.addEventListener('load', () => {
    const navigationStart = performance.getEntriesByType('navigation')[0]?.startTime || 0;
    trackUserFlow('page_load_complete', navigationStart);
  });

  // Track form submissions
  document.addEventListener('submit', (event) => {
    const form = event.target;
    const startTime = performance.now();
    
    form.addEventListener('submit', () => {
      trackUserFlow(`form_${form.id || 'unknown'}`, startTime);
    }, { once: true });
  });

  // Track image loading performance
  const images = document.querySelectorAll('img[data-track-loading]');
  images.forEach((img, index) => {
    const startTime = performance.now();
    img.addEventListener('load', () => {
      trackUserFlow(`image_load_${index}`, startTime);
    }, { once: true });
  });
}

/**
 * Performance regression detection
 */
export function detectPerformanceRegression() {
  const STORAGE_KEY = 'webVitalsBaseline';
  
  // Get baseline metrics from localStorage
  const baseline = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  
  // Update baseline with current metrics
  const updateBaseline = (metric) => {
    baseline[metric.name] = {
      value: metric.value,
      timestamp: Date.now(),
      url: window.location.pathname
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(baseline));
  };

  // Check for regression
  const checkRegression = (metric) => {
    const baselineValue = baseline[metric.name]?.value;
    if (baselineValue && metric.value > baselineValue * 1.2) {
      console.warn(`📉 Performance regression detected for ${metric.name}:`, {
        current: metric.value,
        baseline: baselineValue,
        increase: `${((metric.value / baselineValue - 1) * 100).toFixed(1)}%`
      });
      
      // Send regression alert
      sendAlert({
        ...metric,
        type: 'regression',
        baselineValue
      });
    }
    
    updateBaseline(metric);
  };

  // Apply regression detection to all metrics
  const originalHandleMetric = handleMetric;
  window.handleMetric = (metric) => {
    originalHandleMetric(metric);
    checkRegression(metric);
  };
}
