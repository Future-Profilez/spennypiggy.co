
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
          console.log('💾 Cache updated:', event.data.payload);
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
