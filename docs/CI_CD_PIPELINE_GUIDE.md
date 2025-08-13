# CI/CD Pipeline with Performance Testing & Real User Monitoring

This guide documents the complete CI/CD pipeline setup with Lighthouse CI, performance budgets, deployment validation, and real-user monitoring.

## 🚀 Overview

The pipeline includes:
- **Lighthouse CI** on pull requests with strict performance budgets
- **Multi-environment deployment** (staging → production)
- **Real device validation** using Playwright
- **Real User Monitoring** (RUM) with Web Vitals tracking
- **Performance regression alerts**

## 📊 Performance Budgets Enforced

### Critical Path Resources
- **JavaScript**: < 170 KB total
- **CSS**: < 50 KB total  
- **Images**: < 500 KB total
- **Total page size**: < 2 MB

### Core Web Vitals Thresholds
- **LCP (Largest Contentful Paint)**: < 2.5 seconds
- **FID (First Input Delay)**: < 100 milliseconds  
- **CLS (Cumulative Layout Shift)**: < 0.1
- **FCP (First Contentful Paint)**: < 1.8 seconds
- **TTFB (Time to First Byte)**: < 600 milliseconds

### Quality Gates
- **Performance Score**: > 85/100
- **Accessibility Score**: > 95/100  
- **Best Practices**: > 90/100
- **SEO Score**: > 90/100

## 🔧 Setup Instructions

### 1. Install Dependencies

```bash
# Install Lighthouse CI and testing tools
npm install --save-dev @lhci/cli @playwright/test

# Install Web Vitals for RUM
npm install web-vitals

# Install dependencies
npm install
```

### 2. Configure GitHub Secrets

Add these secrets to your GitHub repository:

```bash
# Required for deployment
VAPOR_API_TOKEN=your_vapor_api_token

# Optional: Lighthouse CI GitHub App token for enhanced PR comments
LHCI_GITHUB_APP_TOKEN=your_lhci_token
```

### 3. Run Database Migrations

```bash
# Create Web Vitals metrics table
php artisan migrate
```

### 4. Configure Lighthouse CI

The `lighthouserc.js` file contains performance budgets and test configuration:

```javascript
// Performance Budget: Critical Path < 170 KB
'resource-summary:script:size': ['error', { maxNumericValue: 174080 }],
'largest-contentful-paint': ['error', { maxNumericValue: 2500 }], // LCP < 2.5s
'categories:performance': ['error', { minScore: 0.85 }], // Performance > 85
```

## 🏗️ CI/CD Workflow

### Pull Request Flow

1. **Code push** to feature branch
2. **Build & Test** - PHP tests, JS tests, asset compilation
3. **Lighthouse CI** - Performance testing against budgets
4. **PR Comment** - Automatic performance results posted
5. **Merge** - Only if all checks pass

### Deployment Flow

#### Staging (develop branch)
1. **Build** production assets
2. **Deploy** to `dev.spennypiggy.co` via Vapor
3. **Health check** validation
4. **Real device testing** with Playwright
5. **Post-deployment** Lighthouse audit

#### Production (main branch)  
1. **Build** production assets
2. **Deploy** to `spennypiggy.co` via Vapor
3. **Health check** validation
4. **Production** Lighthouse audit
5. **RUM monitoring** activation

## 📱 Real Device Testing

Cross-device performance validation using Playwright:

### Devices Tested
- **Desktop**: Chrome, Firefox, Safari
- **Mobile**: Pixel 5, iPhone 12 (with network throttling)  
- **Tablet**: iPad Pro

### Network Conditions
- **Fast 3G**: Desktop simulation
- **Slow 3G**: Mobile simulation
- **Throttled CPU**: Performance under load

### Run Locally
```bash
# Run all device tests
npx playwright test --project=mobile

# Run specific device
npx playwright test --project=mobile-slow-3g

# Run with UI
npx playwright test --ui
```

## 📊 Real User Monitoring (RUM)

### Web Vitals Tracking

Automatic collection of Core Web Vitals from real users:

```javascript
// Initialized automatically in app.jsx
import { initWebVitalsMonitoring } from './monitoring/web-vitals.js';
initWebVitalsMonitoring();
```

### Data Collection

- **Metrics**: LCP, FID, CLS, FCP, TTFB, INP
- **Context**: Device, connection, viewport, user agent
- **Sampling**: 10% in production, 100% in development
- **Storage**: Database table `web_vitals_metrics`

### Performance Alerts

Automatic alerts when thresholds are exceeded:

```php
// Thresholds defined in WebVitalsController
'LCP' => 2500,  // 2.5 seconds
'FID' => 100,   // 100 milliseconds  
'CLS' => 0.1,   // 0.1 layout shift
```

### Dashboards & APIs

- **View metrics**: `GET /api/analytics/web-vitals`
- **Trends**: `GET /api/analytics/web-vitals/trends`
- **Health check**: `GET /health`

## 🚨 Monitoring & Alerts

### Performance Regression Detection

Client-side regression detection:
- **Baseline comparison**: 20% degradation threshold
- **Local storage**: Baseline metrics storage
- **Automatic alerts**: Console warnings + API alerts

### External Monitoring Integration

Ready for integration with:
- **Cloudflare RUM**: Auto-detection and tracking
- **Google Analytics 4**: Web Vitals events
- **Sentry**: Error and performance monitoring
- **Custom webhooks**: Performance alert endpoints

### Log Files

- **Performance logs**: `storage/logs/performance.log`
- **Application logs**: `storage/logs/laravel.log`
- **Lighthouse reports**: `.lighthouseci/` directory

## 🔍 Debugging Performance Issues

### Lighthouse CI Failures

1. **Check budget limits** in `lighthouserc.js`
2. **Review artifacts** in GitHub Actions
3. **Local testing**:
   ```bash
   # Start local server
   php artisan serve --port=8000
   
   # Run Lighthouse CI
   npm run lhci:autorun
   ```

### Web Vitals Degradation

1. **Check RUM dashboard**: Visit `/api/analytics/web-vitals`
2. **Review performance logs**: `tail -f storage/logs/performance.log`
3. **Browser DevTools**: Core Web Vitals extension

### Deployment Failures

1. **Health check status**: `curl https://spennypiggy.co/health`
2. **Vapor logs**: Check Vapor dashboard
3. **GitHub Actions**: Review deployment step logs

## 📈 Performance Optimization Tips

### JavaScript Optimizations
- **Code splitting**: Routes automatically split
- **Lazy loading**: Non-critical imports deferred  
- **Bundle analysis**: `npm run build:analyze`

### CSS Optimizations  
- **Critical CSS**: Inline above-the-fold styles
- **Unused CSS**: Removed via PurgeCSS
- **Font optimization**: Preload and subset

### Image Optimizations
- **Next-gen formats**: WebP/AVIF with fallbacks
- **Lazy loading**: `loading="lazy"` attribute
- **Responsive images**: Multiple size variants

### Network Optimizations
- **Resource hints**: Preload, preconnect, dns-prefetch
- **Service worker**: Asset caching strategy
- **CDN**: Cloudflare for static assets

## 🔧 Maintenance

### Regular Tasks

1. **Monitor performance trends** weekly
2. **Review budget limits** monthly  
3. **Update dependencies** quarterly
4. **Audit unused code** quarterly

### Budget Updates

When performance improves, tighten budgets in `lighthouserc.js`:

```javascript
// Gradually reduce limits
'resource-summary:script:size': ['error', { maxNumericValue: 160000 }], // 170KB -> 160KB
'largest-contentful-paint': ['error', { maxNumericValue: 2300 }], // 2.5s -> 2.3s
```

### Scaling Considerations

- **Database optimization**: Index `web_vitals_metrics` queries
- **Log rotation**: Performance logs auto-rotate (30 days)
- **Sample rate adjustment**: Reduce RUM sampling if needed

## 🆘 Support & Troubleshooting

### Common Issues

**Lighthouse CI timeout**
- Increase `startServerReadyTimeout` in `lighthouserc.js`
- Check server startup logs

**Performance budget failures**
- Review bundle analysis: `npm run build:analyze`
- Check network conditions during test

**RUM data not appearing**  
- Verify API endpoints: `/api/analytics/web-vitals`
- Check browser console for errors
- Confirm database migration ran

### Getting Help

1. **Check logs**: Performance and application logs
2. **GitHub Issues**: Repository issue tracker  
3. **Documentation**: Lighthouse CI and Playwright docs
4. **Health check**: Use `/health/detailed` for system status

---

## 📚 References

- [Lighthouse CI Documentation](https://github.com/GoogleChrome/lighthouse-ci)
- [Core Web Vitals](https://web.dev/vitals/)
- [Playwright Testing](https://playwright.dev/)
- [Laravel Vapor Deployment](https://vapor.laravel.com/)

---

*Last updated: August 13, 2025*
