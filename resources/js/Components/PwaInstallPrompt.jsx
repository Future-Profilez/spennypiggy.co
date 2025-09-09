import { useEffect, useState, useRef } from 'react';

export default function PwaInstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [browserType, setBrowserType] = useState('');
  const deferredPromptRef = useRef(null);

  useEffect(() => {
    // Detect browser type
    const userAgent = navigator.userAgent.toLowerCase();
    const isChrome = userAgent.includes('chrome') && !userAgent.includes('edge');
    const isEdge = userAgent.includes('edge');
    const isSafari = userAgent.includes('safari') && !userAgent.includes('chrome');
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    
    if (isChrome) setBrowserType('chrome');
    else if (isEdge) setBrowserType('edge');
    else if (isSafari || isIOS) setBrowserType('safari');
    else setBrowserType('other');

    // Show popup after 3 seconds for all users
    const timer = setTimeout(() => {
      // Check if already installed
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
      if (!isStandalone) {
        setVisible(true);
      }
    }, 3000);

    // Listen for beforeinstallprompt (Chrome/Edge)
    const onBeforeInstallPrompt = (e) => {
      e.preventDefault();
      deferredPromptRef.current = e;
      console.log('💾 PWA install prompt available');
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    };
  }, []);

  // Also hide the prompt if the app gets installed via any means
  useEffect(() => {
    const onAppInstalled = () => {
      setVisible(false);
    };

    window.addEventListener('appinstalled', onAppInstalled);
    return () => window.removeEventListener('appinstalled', onAppInstalled);
  }, []);

  const handleInstall = async () => {
    // Chrome/Edge: Try to show native install prompt
    if (browserType === 'chrome' || browserType === 'edge') {
      const dp = deferredPromptRef.current;
      if (dp) {
        try {
          await dp.prompt(); // Shows browser's native install dialog
          const { outcome } = await dp.userChoice;
          
          if (outcome === 'accepted') {
            console.log('✅ PWA installed successfully!');
          } else {
            console.log('❌ User dismissed install');
          }
          
          setVisible(false);
          deferredPromptRef.current = null;
          return;
        } catch (err) {
          console.error('Error with PWA install:', err);
        }
      } else {
        // Chrome/Edge but no prompt available
        console.log('💻 Chrome/Edge: No install prompt available yet');
        setVisible(false);
        return;
      }
    }
    
    // Safari: This will be handled by the render logic below
    setVisible(false);
  };

  const handleDismiss = () => {
    setVisible(false);
  };

  if (!visible) return null;

  const isSafari = browserType === 'safari';
  const isChromium = browserType === 'chrome' || browserType === 'edge';

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/40">
      <div className="rounded-[30px] w-full sm:max-w-md shadow-xl sm:mx-auto bg-white dark:bg-neutral-900 border-t sm:border border-neutral-200 dark:border-neutral-800">
        <div className="p-4 sm:p-6">
          <h3 className="text-2xl  font-gulfs uppercase text-neutral-900 dark:text-neutral-100">
            Add Spenny Piggy to Your Home Screen 🐷💖
          </h3>
          <p className="mt-2 text-normal text-neutral-700 dark:text-neutral-300">
            Never miss a tribute, task, or juicy update again.
            <br />
            <br />
            📲 Install the app to get push notifications — including when your favourite creators message you (or demand payment 👀).
          </p>

          {isSafari ? (
            <div className="mt-4 space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
                <p className="font-medium font-bold text-black">Safari Install Steps</p>
                <ol className="list-decimal ml-5 mt-2 space-y-1 text-xs">
                  <li>Tap the Share button (□↑) at the bottom</li>
                  <li>Scroll down and tap "Add to Home Screen"</li>
                  <li>Tap "Add" to finish</li>
                </ol>
              </div>
              <p className="text-xs text-neutral-500">Safari doesn't allow automatic installs. These steps are required by the browser.</p>
            </div>
          ) : null}

          <div className="mt-4 flex gap-3 justify-center">
            <button
              type="button"
              onClick={handleDismiss}
              className="px-4 py-2 rounded-[30px] border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700"
            >
              Not now
            </button>

            {isChromium ? (
              <button
                type="button"
                onClick={handleInstall}
                className="px-4 py-2 !rounded-[30px] bg-pink-600 hover:bg-pink-700 text-white font-medium"
              >
                Install
              </button>
            ) : (
              <button
                type="button"
                onClick={handleDismiss}
                className="px-4 py-2 rounded-[30px] bg-pink-600 hover:bg-pink-700 text-white font-medium"
              >
                Got it
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

