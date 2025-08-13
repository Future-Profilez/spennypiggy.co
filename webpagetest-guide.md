# WebPageTest Setup & Chrome DevTools Performance Panel Guide

## WebPageTest Integration

### For Real-World Performance Testing

**WebPageTest URL:** https://www.webpagetest.org/

### Recommended Test Configuration:
1. **Test Location:** London, UK (closest to your target audience)
2. **Browser:** Chrome (Desktop & Mobile)
3. **Connection:** 3G Fast, Cable, or 4G LTE
4. **Number of Tests:** 3 runs (for median results)
5. **Repeat View:** Yes (to test cached performance)

### Key WebPageTest Metrics to Track:
- **First View vs Repeat View** - Cache effectiveness
- **Start Render Time** - When pixels first appear
- **Speed Index** - Visual completeness over time
- **Largest Contentful Paint** - LCP timing
- **Total Blocking Time** - JavaScript impact
- **Core Web Vitals** - Real user experience metrics

### WebPageTest API Integration
```bash
# Example API call (requires API key)
curl -X POST "https://www.webpagetest.org/runtest.php" \
  -d "url=https://your-production-domain.com" \
  -d "k=YOUR_API_KEY" \
  -d "location=London_Chrome" \
  -d "runs=3" \
  -d "fvonly=0" \
  -d "f=json"
```

## Chrome DevTools Performance Panel

### Manual Performance Recording Steps:

1. **Open Chrome DevTools**
   - Press F12 or Ctrl+Shift+I (Windows/Linux)
   - Press Cmd+Option+I (macOS)

2. **Navigate to Performance Tab**
   - Click "Performance" tab in DevTools
   - Click the record button (circle icon)

3. **Configure Recording Settings**
   - Enable "Screenshots" for visual timeline
   - Enable "Web Vitals" for Core Web Vitals tracking
   - Set CPU throttling (4x slowdown for mobile simulation)
   - Set Network throttling (Fast 3G or Slow 3G)

4. **Record Performance**
   - Start recording
   - Reload the page (Ctrl+R)
   - Let page fully load (wait for network idle)
   - Stop recording

5. **Analyze Results**
   - Review Main thread activity
   - Identify long tasks (red bars)
   - Check for layout shifts
   - Analyze network waterfall

### Programmatic Chrome DevTools (Puppeteer)

```javascript
// Example Puppeteer script for automated performance testing
const puppeteer = require('puppeteer');

async function performanceAudit() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Enable performance metrics
  await page.coverage.startJSCoverage();
  await page.coverage.startCSSCoverage();
  
  // Start tracing
  await page.tracing.start({
    path: 'performance-trace.json',
    categories: ['devtools.timeline']
  });
  
  // Navigate to page
  await page.goto('http://localhost:8000', {
    waitUntil: 'networkidle0'
  });
  
  // Get performance metrics
  const metrics = await page.metrics();
  
  // Stop tracing
  await page.tracing.stop();
  
  // Get coverage
  const jsCoverage = await page.coverage.stopJSCoverage();
  const cssCoverage = await page.coverage.stopCSSCoverage();
  
  console.log('Performance Metrics:', metrics);
  
  await browser.close();
}

performanceAudit();
```

## Setting Up Continuous Performance Monitoring

### 1. Lighthouse CI
```yaml
# .lighthouserc.js
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:8000'],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['error', {minScore: 0.9}],
        'largest-contentful-paint': ['error', {maxNumericValue: 2500}],
        'first-contentful-paint': ['error', {maxNumericValue: 1800}],
        'total-blocking-time': ['error', {maxNumericValue: 200}]
      }
    }
  }
};
```

### 2. GitHub Actions Workflow
```yaml
# .github/workflows/performance.yml
name: Performance Audit
on: [push, pull_request]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm install
      - name: Build application
        run: npm run build
      - name: Start server
        run: npm run serve &
      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli
          lhci autorun
```

## Performance Budget Configuration

### Recommended Performance Budgets:
```json
{
  "performanceBudget": {
    "firstContentfulPaint": 1800,
    "largestContentfulPaint": 2500,
    "totalBlockingTime": 200,
    "cumulativeLayoutShift": 0.1,
    "speedIndex": 3400
  },
  "resourceBudget": {
    "javascript": {
      "budget": 200000,
      "unit": "byte"
    },
    "css": {
      "budget": 50000,
      "unit": "byte"
    },
    "image": {
      "budget": 500000,
      "unit": "byte"
    }
  }
}
```

## Real User Monitoring (RUM) Setup

### Core Web Vitals Tracking
```javascript
// Add to your application
import {getLCP, getFID, getCLS} from 'web-vitals';

function sendToAnalytics(metric) {
  // Send to your analytics platform
  gtag('event', metric.name, {
    value: Math.round(metric.value),
    metric_id: metric.id,
    custom_parameter: metric.value
  });
}

getLCP(sendToAnalytics);
getFID(sendToAnalytics);
getCLS(sendToAnalytics);
```

## Performance Testing Checklist

### Pre-Testing Setup:
- [ ] Clear browser cache
- [ ] Disable browser extensions
- [ ] Use incognito/private mode
- [ ] Test on actual devices when possible
- [ ] Test under different network conditions

### Metrics to Capture:
- [ ] First Contentful Paint (FCP)
- [ ] Largest Contentful Paint (LCP)
- [ ] First Input Delay (FID)
- [ ] Cumulative Layout Shift (CLS)
- [ ] Total Blocking Time (TBT)
- [ ] Speed Index
- [ ] Time to Interactive (TTI)

### Regular Testing Schedule:
- **Daily:** Automated Lighthouse CI on commits
- **Weekly:** Full WebPageTest audit
- **Monthly:** Manual DevTools performance review
- **Quarterly:** Comprehensive performance optimization review

---
*This guide provides comprehensive setup for performance testing tools mentioned in the baseline audit*
