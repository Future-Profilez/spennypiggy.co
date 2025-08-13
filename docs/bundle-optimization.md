# JavaScript Bundle Optimization Guide

This document explains the JavaScript bundle splitting and loading optimizations implemented for the Spenny Piggy application.

## Bundle Analysis

### Running Bundle Analysis
To analyze your JavaScript bundles and identify optimization opportunities:

```bash
# Analyze current bundle composition
npm run build:analyze
```

This will:
- Generate a production build with bundle analysis
- Open an interactive HTML report showing:
  - Bundle sizes (parsed, stat, gzip, brotli)
  - Chunk composition
  - Dependency relationships
  - Optimization opportunities

### Understanding the Analysis Report

**Key Metrics to Monitor:**
- **Parsed Size**: Actual JavaScript code size
- **Stat Size**: Size on disk before compression
- **Gzip Size**: Compressed size over HTTP/2
- **Brotli Size**: Modern compression (better than gzip)

**Chunk Types:**
- `react-vendor`: React and React-DOM
- `redux-vendor`: Redux and RTK
- `apollo-vendor`: GraphQL client
- `bootstrap-vendor`: Bootstrap UI components
- `sentry-vendor`: Error tracking
- `charts-vendor`: Chart.js and Recharts
- `stripe-vendor`: Payment processing
- `vendor`: Other third-party libraries
- `inertia-framework`: Inertia.js framework code
- `app-store`: Redux store configuration

## Code Splitting Strategy

### 1. Vendor Splitting
Large third-party libraries are split into separate chunks:
- Improves caching (vendor code changes less frequently)
- Enables parallel downloads
- Reduces main bundle size

### 2. Route-Level Splitting  
Pages are loaded dynamically using `import()`:
```javascript
// Automatic with Inertia.js
import.meta.glob("./Pages/**/*.jsx", { eager: false })
```

### 3. Feature-Based Splitting
Heavy features are loaded on-demand:
```javascript
// Example: Load charts only when needed
const Charts = lazy(() => import('./components/Charts'));
```

## Loading Strategy

### 1. Critical Path Optimization
**Immediately Loaded:**
- React core
- Inertia.js framework
- Redux store
- Critical CSS

**Deferred Loading:**
- Bootstrap CSS
- Sentry monitoring
- Additional stylesheets
- Non-critical vendor chunks

### 2. Module Preloading
Critical chunks are preloaded with `<link rel="modulepreload">`:
```html
<!-- Preload critical vendor chunks -->
<link rel="modulepreload" href="/build/react-vendor-[hash].js" crossorigin>
<link rel="modulepreload" href="/build/app-[hash].js" crossorigin>
```

### 3. Intelligent Chunk Preloading
The `ChunkPreloader` utility provides:
- **Hover-based preloading**: Loads chunks when user hovers over links
- **Viewport-based preloading**: Loads chunks for visible links
- **Route-based preloading**: Preloads likely next pages based on current page

## Script Loading Attributes

### Production Loading
```html
<!-- Main app bundle -->
<script type="module" src="/build/app-[hash].js" async></script>

<!-- Non-critical vendor chunks (deferred) -->
<script type="module">
  setTimeout(() => {
    import('/build/vendor-[hash].js').catch(() => {});
  }, 100);
</script>
```

### Benefits of `type="module"`:
- Modern ES2020+ syntax
- Built-in dependency resolution
- Smaller bundle sizes
- Better browser caching
- Automatic `defer` behavior

## Performance Monitoring

### Key Performance Indicators
1. **First Contentful Paint (FCP)**: < 1.8s
2. **Largest Contentful Paint (LCP)**: < 2.5s  
3. **Time to Interactive (TTI)**: < 3.8s
4. **Total Blocking Time (TBT)**: < 300ms

### Bundle Size Targets
- **Initial JS bundle**: < 200KB gzipped
- **Critical vendor chunks**: < 100KB gzipped each
- **Page-level chunks**: < 50KB gzipped each

## Development vs Production

### Development Mode
- All chunks loaded immediately for faster development
- No compression or minification
- Source maps enabled

### Production Mode
- Aggressive code splitting
- Tree shaking enabled
- Minification with Terser
- Console/debugger statements removed
- Source maps for debugging

## Optimization Commands

```bash
# Standard build
npm run build

# Build with bundle analysis
npm run build:analyze

# Build with critical CSS generation
npm run build:critical

# Development server
npm run dev
```

## Monitoring Bundle Performance

### 1. Bundle Size Tracking
Monitor bundle sizes over time to prevent regression:
```bash
# Add to CI/CD pipeline
npm run build:analyze > bundle-report.json
```

### 2. Runtime Performance
Use browser DevTools to monitor:
- Network waterfall charts
- Performance profiling
- Coverage analysis (unused code)

### 3. Real User Monitoring
Sentry integration provides:
- Core Web Vitals tracking
- Error reporting
- Performance insights

## Best Practices

### 1. Import Optimization
```javascript
// ✅ Good: Import only what you need
import { useState } from 'react';

// ❌ Bad: Import entire library
import * as React from 'react';
```

### 2. Dynamic Imports
```javascript
// ✅ Good: Load heavy components on demand
const HeavyComponent = lazy(() => import('./HeavyComponent'));

// ✅ Good: Load utilities when needed
const loadUtils = () => import('./utils/heavyUtils');
```

### 3. Third-Party Library Management
- Use tree-shakable libraries
- Consider lighter alternatives
- Load analytics/tracking scripts asynchronously
- Use CDN for common libraries when beneficial

## Troubleshooting

### Bundle Too Large
1. Check bundle analyzer for large dependencies
2. Consider code splitting or lazy loading
3. Look for duplicate dependencies
4. Use tree shaking for unused exports

### Slow Loading
1. Check network waterfall for blocking resources
2. Ensure critical chunks are preloaded
3. Optimize chunk priorities
4. Consider service worker caching

### Memory Issues
1. Check for memory leaks in chunk preloader
2. Limit concurrent chunk loading
3. Use `unload` events to clean up

## Future Optimizations

### Potential Improvements
1. **Service Worker**: Cache chunks for offline use
2. **Compression**: Enable Brotli compression on server
3. **CDN**: Use CDN for vendor chunks
4. **Bundle Splitting**: Further split large vendor chunks
5. **Prefetch**: Add `<link rel="prefetch">` for likely routes
