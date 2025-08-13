
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/',
        updateViaCache: 'none' // Always check for updates
      });

      console.log('✅ Service Worker registered successfully:', registration.scope);

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('🔄 New Service Worker found, updating...');
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('🔄 New Service Worker installed, refreshing page...');
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
