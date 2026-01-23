import { generateSW, injectManifest } from 'workbox-build';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function buildServiceWorker() {
  try {
    
    // Use injectManifest to work with our custom service worker
    const { count, size, warnings } = await injectManifest({
      swSrc: 'public/sw.js',
      swDest: 'public/service-worker.js',
      globDirectory: 'public/',
      globPatterns: [
        '**/*.{css,js,woff,woff2,ttf,otf,eot,svg,png,jpg,jpeg,gif,webp,avif,ico}',
        // Include built assets
        'build/**/*.{css,js,woff,woff2,ttf,otf,eot,svg,png,jpg,jpeg,gif,webp,avif,ico}',
      ],
      maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
      
      globIgnores: [
        '**/node_modules/**/*',
        '**/.git/**/*',
        '**/coverage/**/*',
        '**/.nyc_output/**/*',
        '**/.cache/**/*',
        '**/sw.js', // Don't cache the source file
        '**/serviceworker.js', // Don't cache old SW
      ],

      // Manifest transformations for better caching
      manifestTransforms: [function(manifestEntries) {
        const manifest = manifestEntries.map(entry => {
          // Remove query strings for cleaner URLs
          entry.url = entry.url.split('?')[0];
          
          // For hashed assets, set revision to null (Workbox will use hash)
          if (entry.url.match(/\.[a-f0-9]{8,}\.(css|js|woff|woff2)$/)) {
            entry.revision = null;
          }
          
          return entry;
        });
        
        return { manifest };
      }],
    });
    
    if (warnings.length > 0) {
      console.warn('⚠️  Warnings:', warnings);
    }

    // Generate a simple registration script
    const registrationScript = `
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/',
        updateViaCache: 'none' // Always check for updates
      });


      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // Auto-refresh when new SW is ready
            setTimeout(() => window.location.reload(), 1000);
          }
        });
      });

      // Listen for messages from SW
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'CACHE_UPDATED') {
        }
      });

    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
    }
  });
}

// Optional: Add to window for debugging
window.swRegistration = null;
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistration().then(reg => {
    window.swRegistration = reg;
  });
}
`;

    fs.writeFileSync('public/sw-register.js', registrationScript);

    return { count, size };
  } catch (error) {
    console.error('❌ Service Worker build failed:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  buildServiceWorker()
    .then(() => console.log('🎉 Service Worker build completed!'))
    .catch(error => {
      console.error('💥 Build failed:', error);
      process.exit(1);
    });
}

export { buildServiceWorker };
