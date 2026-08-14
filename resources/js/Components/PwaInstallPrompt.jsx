import { useEffect, useState, useRef } from 'react';

export default function PwaInstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [browserType, setBrowserType] = useState('');
  const [showChromeHelp, setShowChromeHelp] = useState(false);
  const deferredPromptRef = useRef(null);

  const getLastShownDate = () => {
    try {
      const lastShown = localStorage.getItem('pwa_install_last_shown');
      return lastShown ? new Date(lastShown) : null;
    } catch (error) {
      console.error('Error reading PWA install date from localStorage:', error);
      return null;
    }
  };

  const setLastShownDate = () => {
    try {
      localStorage.setItem('pwa_install_last_shown', new Date().toISOString());
    } catch (error) {
      console.error('Error saving PWA install date to localStorage:', error);
    }
  };

  /**
   * ⚠️ A first-time visitor is NEVER prompted. Measured on the live homepage: the
   * prompt is a full-screen `bg-black/40` scrim at z-[9999999999] centred over the
   * `<h1>`, and it lands while the cookie bar still covers the trust points — so a
   * first-time visitor met three overlays at once and could not read the pitch. It
   * also asks someone to install an app for a product they have not been told about.
   *
   * The marker IS the gate: visit 1 records and shows nothing, visit 2 onward is
   * eligible. Cookie consent is dealt with on visit 1, so the two never stack.
   * Deliberately not `sessionStorage` — a reload is not a return visit.
   */
  const RETURN_VISIT_KEY = 'pwa_install_seen_site';

  // ⚠️ Resolved ONCE per mount, into a ref. `shouldShowPrompt` is called from two
  // places (the 3s timer and `beforeinstallprompt`), and the read below also WRITES
  // the marker — so evaluating it per call would answer "first visit" the first time
  // and "returning" the second, showing the prompt on the very visit it must not.
  const isReturningRef = useRef(null);
  if (isReturningRef.current === null) {
    try {
      isReturningRef.current = Boolean(localStorage.getItem(RETURN_VISIT_KEY));
      if (!isReturningRef.current) {
        localStorage.setItem(RETURN_VISIT_KEY, new Date().toISOString());
      }
    } catch (error) {
      // Storage blocked (Safari private mode, hardened profiles) throws
      // SecurityError. Fail closed: with no marker we cannot prove this is a
      // return visit, and a wrongly-suppressed prompt costs far less than a
      // modal over the headline.
      isReturningRef.current = false;
    }
  }

  const shouldShowPrompt = () => {
    if (!isReturningRef.current) return false;

    const lastShown = getLastShownDate();
    if (!lastShown) return true; // Returning, never prompted before

    const now = new Date();
    const daysSinceShown = (now - lastShown) / (1000 * 60 * 60 * 24);
    return daysSinceShown >= 30; // Show if 30+ days have passed
  };

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

    // Show popup after 3 seconds, but only if enough time has passed
    const timer = setTimeout(() => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
      if (!isStandalone && shouldShowPrompt()) {
        setVisible(true);
      }
    }, 3000);

    // Listen for beforeinstallprompt (Chrome/Edge)
    const onBeforeInstallPrompt = (e) => {
      e.preventDefault();
      deferredPromptRef.current = e;
      
      // Show the custom PWA prompt immediately when the event fires
      // instead of waiting for the 3-second timer
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
      if (!isStandalone && shouldShowPrompt()) {
        setVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    
    // Debug utilities for development/testing
    window.PwaPromptDebug = {
      getLastShownDate: () => {
        const date = getLastShownDate();
        return date ? date.toISOString() : null;
      },
      getDaysSinceShown: () => {
        const lastShown = getLastShownDate();
        if (!lastShown) return 'Never shown';
        const now = new Date();
        const daysSinceShown = (now - lastShown) / (1000 * 60 * 60 * 24);
        return Math.round(daysSinceShown * 100) / 100; // Round to 2 decimal places
      },
      shouldShow: () => shouldShowPrompt(),
      resetTimer: () => {
        try {
          localStorage.removeItem('pwa_install_last_shown');
        } catch (error) {
          console.error('Error resetting PWA timer:', error);
        }
      },
      forceShow: () => {
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
        if (!isStandalone) {
          setVisible(true);
        } else {
          console.log('❌ Cannot show prompt - app is already installed');
        }
      },
      checkInstallCapability: () => {
        if (deferredPromptRef.current) {
          console.warn('✅ Native installation should work!');
        } else {
          console.warn('⚠️ No native install prompt - will show instructions');
        }
      },
      testInstall: async () => {
        if (deferredPromptRef.current) {
          try {
            await deferredPromptRef.current.prompt();
            const { outcome } = await deferredPromptRef.current.userChoice;
          } catch (error) {
            console.error('Test install failed:', error);
          }
        } else {
          console.log('❌ No deferred prompt available for testing');
        }
      }
    };

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      delete window.PwaPromptDebug;
    };
  }, []);

  // Also hide the prompt if the app gets installed via any means
  useEffect(() => {
    const onAppInstalled = () => {
      setLastShownDate();
      setVisible(false);
      setShowChromeHelp(false);
    };

    window.addEventListener('appinstalled', onAppInstalled);
    return () => window.removeEventListener('appinstalled', onAppInstalled);
  }, []);

  const handleInstall = async () => {
    if (browserType === 'chrome' || browserType === 'edge') {
      const dp = deferredPromptRef.current;
      
      if (dp) {
        try {
          await dp.prompt();
          const { outcome } = await dp.userChoice;
          setLastShownDate();
          setVisible(false);
          deferredPromptRef.current = null;
          return;
        } catch (err) {
          console.error('Native PWA install failed:', err);
        }
      }
      
      setLastShownDate(); // Track that we showed instructions
      setShowChromeHelp(true);
      return;
    }
    
    // For Safari, show instructions immediately
    if (browserType === 'safari') {
      setLastShownDate(); 
      setVisible(false);
      return;
    }
    
    // For other browsers, just close
    setLastShownDate();
    setVisible(false);
  };
  

  const handleDismiss = () => {
    setLastShownDate(); // Track interaction - don't show again for 30 days
    setVisible(false);
    setShowChromeHelp(false);
  };

  if (!visible && !showChromeHelp) return null;

  const isSafari = browserType === 'safari';
  const isChromium = browserType === 'chrome' || browserType === 'edge';

  // Chrome Help Instructions
  if (showChromeHelp) {
    return (
      <div className="fixed inset-0 z-[9999999999] flex items-end sm:items-center justify-center bg-black/40">
        <div className="w-full sm:max-w-md sm:rounded-[30px]    sm:shadow-xl sm:mx-auto bg-white  border-t sm:border border-neutral-200 ">
          <div className="p-4 sm:p-6">
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">💻</div>
              <h3 className="text-lg font-semibold text-neutral-900 ">
                Install Spenny Piggy 🐷💖
              </h3>
            </div>
            
            <div className="space-y-3 text-sm text-neutral-700 ">
              <div className="p-3 rounded-box-sm bg-green-50 border border-green-200">
                <p className="font-medium mb-2">Chrome Install Steps:</p>
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                    <div>
                      <p className="font-medium">Look for install icon in address bar</p>
                      <p className="text-xs text-neutral-500">Click the <span className="font-mono bg-neutral-200  px-1 rounded-[20px]">⊕</span> or <span className="font-mono bg-neutral-200   px-1 rounded-[20px]">Install</span> button</p>
                    </div>
                  </div>
                  
                  <div className="text-center text-xs text-neutral-500">OR</div>
                  
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                    <div>
                      <p className="font-medium">Use Chrome menu</p>
                      <p className="text-xs text-neutral-500">Click <span className="font-mono bg-neutral-200   px-1 rounded-[20px]">⋮</span> → "Install Spenny Piggy..."</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={handleDismiss}
                className="px-6 py-2 rounded-[20px]   bg-pink-600 hover:bg-pink-700 text-white font-medium"
              >
                Got it! 🐷
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main PWA Install Prompt
  return (
    <div className="fixed inset-0 z-[9999999999] flex items-end sm:items-center justify-center bg-black/40">
      <div className="w-full sm:max-w-md sm:rounded-[30px]   sm:shadow-xl sm:mx-auto bg-white  border-t sm:border border-neutral-200  ">
        <div className="p-4 sm:p-6">
          <h3 className="text-2xl font-gulfs uppercase text-neutral-900  ">
            Add Spenny Piggy to Your Home Screen 🐷💖
          </h3>
          {/* 🚨 Content-first copy. This wording was "Never miss a tribute, task,
              or juicy update… (or request payment 👀)" — the exact transfer/gifting
              vocabulary the whole platform was cleaned of (see the content-compliance
              rules in CLAUDE.md), plus a suggestive emoji on a product whose headline
              claim is "Strictly SFW". This modal is the FIRST thing a visitor — or a
              Stripe reviewer — sees on the homepage, so it is a Stripe-facing surface
              and the ban list applies to it in full. No gift/tip/donation/tribute. */}
          <p className="mt-2 text-sm text-neutral-700  ">
            Get told the moment something sells.
            <br />
            📲 Install the app for push notifications when someone buys your content, orders a paid request, or messages you.
          </p>

          {isSafari ? (
            <div className="mt-4 space-y-2 text-sm text-neutral-700  ">
              <div className="p-3 rounded-[20px] bg-blue-50  border border-blue-200  ">
                <p className="font-medium">Safari Install Steps</p>
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
              className="px-4 py-2 rounded-[20px]   border border-neutral-300   text-neutral-700  bg-white   hover:bg-neutral-50  "
            >
              Not now
            </button>

            {isChromium ? (
              <button
                type="button"
                onClick={handleInstall}
                className="px-4 py-2 rounded-[20px]   bg-pink-600 hover:bg-pink-700 text-white font-medium"
              >
                Install
              </button>
            ) : (
              <button
                type="button"
                onClick={handleDismiss}
                className="px-4 py-2 rounded-[20px]   bg-pink-600 hover:bg-pink-700 text-white font-medium"
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

