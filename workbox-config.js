module.exports = {
  globDirectory: 'public/',
  globPatterns: [
    '**/*.{css,js,woff,woff2,ttf,otf,eot,svg,png,jpg,jpeg,gif,webp,avif,ico}'
  ],
  swSrc: 'public/sw.js',
  swDest: 'public/service-worker.js',
  maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
  mode: 'production',
  
  // Don't cache these files/patterns
  globIgnores: [
    '**/node_modules/**/*',
    '**/.git/**/*',
    '**/build/**/*',
    '**/coverage/**/*',
    '**/.nyc_output/**/*',
    '**/.cache/**/*',
    '**/sw.js',
    '**/service-worker.js'
  ],

  // Manifest transformations
  manifestTransforms: [{
    transform(manifestEntries) {
      const manifest = manifestEntries.map(entry => {
        // Add revision information for cache busting
        if (entry.url.includes('/js/') || entry.url.includes('/css/')) {
          entry.revision = null; // Let Workbox handle revision for hashed files
        }
        return entry;
      });
      return { manifest };
    }
  }],

  // Skip waiting and clients claim
  skipWaiting: true,
  clientsClaim: true,

  // Inlined runtime caching rules
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'google-fonts-stylesheets',
        expiration: {
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    {
      urlPattern: /^https:\/\/fonts\.gstatic\.com/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-webfonts',
        expiration: {
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
          maxEntries: 30,
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    {
      urlPattern: /\.(?:png|gif|jpg|jpeg|svg|webp|avif)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
  ],
};
