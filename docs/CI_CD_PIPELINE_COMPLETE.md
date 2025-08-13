# Complete CI/CD Pipeline with Performance Monitoring

## 🚀 Overview

This comprehensive CI/CD pipeline integrates automated testing, Lighthouse CI performance budgets, cross-device testing with Playwright, deployment automation, and real-user monitoring for the SpennyPiggy application.

## 📋 Pipeline Components

### 1. **Build & Test Stage**
- **PHP 8.2** with all required extensions
- **Node.js 18** for modern JavaScript tooling
- **MySQL 8.0** service for database testing
- **Composer** dependency management with optimization
- **NPM** build process with asset compilation
- **PHPUnit** testing with coverage reporting
- **ESLint** for JavaScript code quality

### 2. **Lighthouse CI Performance Testing**
- **Automated performance budgets** enforcement
- **Critical path resources** < 170KB JavaScript, < 50KB CSS
- **Core Web Vitals** strict thresholds (LCP < 2.5s, FID < 100ms, CLS < 0.1)
- **Performance score** > 85/100 requirement
- **Accessibility, SEO, Best Practices** monitoring
- **Resource optimization** checks (modern images, minification)

### 3. **Cross-Device Performance Testing**
- **Playwright** testing across Chrome, Firefox, Safari
- **Mobile device** simulation (Pixel 5, iPhone 12)
- **Tablet testing** (iPad Pro)
- **Network throttling** (3G, WiFi conditions)
- **Performance consistency** validation
- **Real-world scenarios** with user interactions

### 4. **Deployment Automation**
- **Staging deployment** (develop branch → staging.spennypiggy.co)
- **Production deployment** (main branch → spennypiggy.co)
- **Health check validation** post-deployment
- **Rollback capability** on failure
- **Environment-specific** configurations

### 5. **Real-User Monitoring (RUM)**
- **Web Vitals collection** from actual users
- **Performance regression detection** (20% threshold)
- **Database storage** for metrics analysis
- **API endpoints** for dashboards and alerts
- **Integration points** for external monitoring services

## 🔧 Setup Instructions

### Prerequisites

1. **GitHub Repository Secrets**:
   ```bash
   VAPOR_API_TOKEN=your_vapor_token
   LHCI_GITHUB_APP_TOKEN=your_lighthouse_token  # Optional
   SLACK_WEBHOOK_URL=your_slack_webhook          # Optional
   ```

2. **Local Environment**:
   ```bash
   # Install dependencies
   composer install
   npm install
   
   # Install testing tools
   npm install -g @lhci/cli@0.12.x
   npx playwright install
   ```

### Configuration Files

1. **Lighthouse CI Configuration** (`lighthouserc.cjs`):
   ```javascript
   module.exports = {
     ci: {
       collect: {
         url: ['http://localhost:8000', 'http://localhost:8000/register'],
         numberOfRuns: 3,
         settings: {
           chromeFlags: '--no-sandbox --disable-dev-shm-usage'
         }
       },
       assert: {
         assertions: {
           'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
           'categories:performance': ['error', { minScore: 0.85 }],
           // ... other assertions
         }
       }
     }
   };
   ```

2. **Playwright Configuration** (`tests/performance/playwright.config.js`):
   ```javascript
   export default defineConfig({
     projects: [
       { name: 'chromium-desktop', use: devices['Desktop Chrome'] },
       { name: 'mobile-chrome', use: devices['Pixel 5'] },
       // ... other device configurations
     ],
     use: {
       baseURL: process.env.BASE_URL || 'http://localhost:8000',
       trace: 'on-first-retry'
     }
   });
   ```

## 📊 Performance Budgets

### Critical Resource Limits
| Resource Type | Budget | Purpose |
|---------------|--------|---------|
| JavaScript | < 170KB | Fast parsing and execution |
| CSS | < 50KB | Quick render-blocking resource load |
| Images | < 500KB total | Optimized visual content |
| Total Size | < 2MB | Overall page weight |

### Core Web Vitals Thresholds
| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| **LCP** | < 2.5s | 2.5s - 4.0s | > 4.0s |
| **FID** | < 100ms | 100ms - 300ms | > 300ms |
| **CLS** | < 0.1 | 0.1 - 0.25 | > 0.25 |
| **FCP** | < 1.8s | 1.8s - 3.0s | > 3.0s |
| **TBT** | < 200ms | 200ms - 600ms | > 600ms |

## 🔄 Workflow Triggers

### Pull Request Workflow
```yaml
on:
  pull_request:
    branches: [main, develop]
```
**Executes**: Build → Test → Lighthouse CI → PR Comment with results

### Staging Deployment
```yaml
on:
  push:
    branches: [develop]
```
**Executes**: Build → Test → Lighthouse CI → Deploy Staging → Health Check

### Production Deployment
```yaml
on:
  push:
    branches: [main]
```
**Executes**: All previous → Deploy Production → Performance Audit → Monitoring

## 📈 Monitoring & Alerts

### Real-User Monitoring

The system collects Web Vitals from 10% of production users:

```javascript
// Automatic Web Vitals collection
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

### API Endpoints
- `GET /health` - Application health check
- `GET /api/analytics/web-vitals` - Performance metrics dashboard
- `GET /api/analytics/web-vitals/trends` - Performance trends
- `POST /api/analytics/web-vitals` - Metric submission endpoint

### Performance Regression Detection

Automatic alerts trigger when:
- LCP increases by > 20%
- FCP increases by > 20%
- Performance score drops below 85
- Resource sizes exceed budgets

## 🧪 Testing Commands

### Local Development
```bash
# Run Lighthouse CI locally
npm run lhci:autorun

# Run Playwright performance tests
npx playwright test --project=performance-fast

# Run specific test suites
npx playwright test critical-pages.performance.spec.js

# Generate performance report
npm run test:performance:report
```

### CI Environment
```bash
# Health check
curl -f https://spennypiggy.co/health

# Performance test
lhci autorun --collect.url=https://spennypiggy.co

# Cross-device testing
npx playwright test --project=mobile-chrome --project=desktop-chrome
```

## 📝 Reports & Artifacts

### Generated Reports
1. **Lighthouse HTML Reports** - Detailed performance analysis
2. **Playwright Test Results** - Cross-device compatibility
3. **Performance Metrics JSON** - Machine-readable data
4. **Coverage Reports** - Code coverage analysis
5. **Web Vitals Trends** - Historical performance data

### Artifact Storage
- **GitHub Actions**: 30-day retention for all test results
- **Database**: Permanent storage for user metrics
- **CDN**: Optimized assets with performance headers

## 🔧 Troubleshooting

### Common Issues

1. **Lighthouse CI Fails**
   ```bash
   # Check server is running
   curl -I http://localhost:8000
   
   # Verify Lighthouse config
   lhci healthcheck
   ```

2. **Playwright Tests Timeout**
   ```bash
   # Increase timeout in config
   timeout: 60000
   
   # Run with debug
   DEBUG=pw:api npx playwright test
   ```

3. **Performance Budget Failures**
   - Check bundle analyzer output
   - Review resource loading waterfall
   - Analyze Web Vitals breakdown

### Performance Optimization Checklist

- [ ] Critical CSS inlined
- [ ] JavaScript bundles split and lazy-loaded
- [ ] Images optimized (WebP/AVIF formats)
- [ ] Service Worker caching implemented
- [ ] CDN configured with proper headers
- [ ] Database queries optimized and cached
- [ ] Third-party scripts loaded asynchronously

## 🚀 Deployment Process

### Staging Flow
1. **Code Push** to `develop` branch
2. **Automated Testing** (unit, integration, performance)
3. **Staging Deployment** via Vapor CLI
4. **Health Check** validation
5. **Performance Audit** on staging URL
6. **Slack Notification** with results

### Production Flow
1. **Merge** to `main` branch
2. **Complete Test Suite** execution
3. **Production Deployment** with blue-green strategy
4. **Extended Health Checks** (60s stabilization)
5. **Comprehensive Performance Audit** (5 runs)
6. **RUM Activation** for ongoing monitoring
7. **Success/Failure Notifications**

## 📊 Success Metrics

### Performance KPIs
- **Lighthouse Performance Score**: > 85
- **Core Web Vitals Pass Rate**: > 75%
- **Page Load Time**: < 3 seconds
- **Time to Interactive**: < 4 seconds
- **Bundle Size Growth**: < 10% per release

### CI/CD Efficiency
- **Pipeline Success Rate**: > 95%
- **Average Build Time**: < 10 minutes
- **Deployment Frequency**: Daily for staging
- **Mean Time to Recovery**: < 30 minutes

## 🔗 Integration Points

### External Services
- **Laravel Vapor** - Serverless hosting platform
- **GitHub Actions** - CI/CD orchestration
- **Lighthouse CI** - Performance testing
- **Playwright** - Cross-browser testing
- **Slack** - Deployment notifications
- **Sentry** - Error monitoring (optional)
- **Datadog** - Performance monitoring (optional)

### Monitoring Stack
- **Web Vitals API** - Real user metrics
- **Laravel Telescope** - Application monitoring
- **MySQL** - Metrics data storage
- **Redis** - Caching layer
- **CloudWatch** - Infrastructure monitoring

---

This comprehensive CI/CD pipeline ensures high-performance, reliable deployments with comprehensive monitoring and testing across all critical user journeys and device types.
