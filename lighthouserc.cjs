module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:8000',
        'http://localhost:8000/register',
        'http://localhost:8000/dashboard'
      ],
      startServerCommand: 'php artisan serve --port=8000',
      startServerReadyPattern: 'Development Server.*started',
      startServerReadyTimeout: 20000,
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--no-sandbox --disable-dev-shm-usage --disable-gpu'
      }
    },
    assert: {
      assertions: {
        // Performance Budget: Critical Path < 170 KB
        'resource-summary:script:size': ['error', { maxNumericValue: 174080 }], // 170KB in bytes
        'resource-summary:stylesheet:size': ['error', { maxNumericValue: 51200 }], // 50KB CSS budget
        'resource-summary:image:size': ['error', { maxNumericValue: 512000 }], // 500KB image budget
        'resource-summary:total:size': ['error', { maxNumericValue: 2097152 }], // 2MB total budget
        
        // Core Web Vitals Budgets
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }], // LCP < 2.5s
        'first-contentful-paint': ['error', { maxNumericValue: 1800 }], // FCP < 1.8s
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }], // CLS < 0.1
        'max-potential-fid': ['error', { maxNumericValue: 100 }], // FID < 100ms
        'total-blocking-time': ['error', { maxNumericValue: 200 }], // TBT < 200ms
        
        // Performance Score
        'categories:performance': ['error', { minScore: 0.85 }], // Performance score > 85
        
        // Accessibility
        'categories:accessibility': ['warn', { minScore: 0.95 }],
        
        // Best Practices
        'categories:best-practices': ['warn', { minScore: 0.90 }],
        
        // SEO
        'categories:seo': ['warn', { minScore: 0.90 }],
        
        // Critical resource hints
        'uses-rel-preload': 'warn',
        'uses-rel-preconnect': 'warn',
        'render-blocking-resources': 'warn',
        'unused-css-rules': 'warn',
        'unused-javascript': 'warn',
        
        // Image optimization
        'modern-image-formats': 'warn',
        'efficient-animated-content': 'warn',
        'properly-size-images': 'warn',
        
        // JavaScript optimization
        'unminified-javascript': 'error',
        'unminified-css': 'error',
        'legacy-javascript': 'warn'
      }
    },
    upload: {
      target: 'temporary-public-storage'
    },
    server: {
      port: 9001,
      storage: {
        storageMethod: 'sql',
        sqlDialect: 'sqlite',
        sqlDatabasePath: './lhci.db'
      }
    }
  }
};
