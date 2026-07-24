const PROMPT_STORAGE_KEY = 'spenny_pwa_install_prompt_last_shown';
const MONTHLY_INTERVAL = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

// Versioned so a future feature refresh can re-onboard installed users without code hacks.
const ONBOARDING_STORAGE_KEY = 'spenny_onboarding_seen_v1';

/**
 * Whether the app is running as an installed PWA (standalone display mode).
 * Covers standards-based browsers (display-mode: standalone) and iOS Safari
 * (navigator.standalone). SSR-safe.
 * @returns {boolean}
 */
export function isStandalone() {
  try {
    if (typeof window === 'undefined') {
      return false;
    }
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      return true;
    }
    if (window.navigator && window.navigator.standalone) {
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

/**
 * First-launch onboarding gate: show only in the installed PWA and only until
 * the user finishes or skips it once.
 * @returns {boolean}
 */
export function shouldShowOnboarding() {
  try {
    if (typeof localStorage === 'undefined') {
      return false;
    }
    if (!isStandalone()) {
      return false;
    }
    return !localStorage.getItem(ONBOARDING_STORAGE_KEY);
  } catch (error) {
    return false;
  }
}

/**
 * Mark onboarding as completed/skipped so it never shows again for this install.
 */
export function markOnboardingSeen() {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, Date.now().toString());
    }
  } catch (error) {
    console.warn('Error saving onboarding state:', error);
  }
}

/**
 * Reset onboarding (testing / manual re-show).
 */
export function resetOnboarding() {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    }
  } catch (error) {
    console.warn('Error resetting onboarding state:', error);
  }
}

/**
 * Check if we should show the PWA install prompt based on monthly frequency
 * @returns {boolean} true if prompt should be shown
 */
export function shouldShowPrompt() {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return false;
    }

    // Check if the app is already installed (standalone mode)
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      return false;
    }

    // Check if running as PWA (iOS Safari)
    if (window.navigator && window.navigator.standalone) {
      return false;
    }

    // Get the last time we showed the prompt
    const lastShown = localStorage.getItem(PROMPT_STORAGE_KEY);
    
    if (!lastShown) {
      // Never shown before, so we should show it
      return true;
    }

    const lastShownTime = parseInt(lastShown, 10);
    const currentTime = Date.now();
    
    // Check if a month has passed since last shown
    return (currentTime - lastShownTime) >= MONTHLY_INTERVAL;
  } catch (error) {
    // If there's any error with localStorage or other checks, default to not showing
    console.warn('Error checking PWA install prompt timing:', error);
    return false;
  }
}

/**
 * Mark the prompt as shown for this month
 */
export function markPromptShown() {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(PROMPT_STORAGE_KEY, Date.now().toString());
    }
  } catch (error) {
    console.warn('Error saving PWA install prompt timing:', error);
  }
}

/**
 * Reset the prompt timing (useful for testing or manual reset)
 */
export function resetPromptTiming() {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(PROMPT_STORAGE_KEY);
    }
  } catch (error) {
    console.warn('Error resetting PWA install prompt timing:', error);
  }
}

/**
 * Get the number of days until the next prompt will be shown
 * @returns {number} days until next prompt (0 if ready to show now)
 */
export function getDaysUntilNextPrompt() {
  try {
    if (typeof localStorage === 'undefined') {
      return 0;
    }

    const lastShown = localStorage.getItem(PROMPT_STORAGE_KEY);
    
    if (!lastShown) {
      return 0; // Can show now
    }

    const lastShownTime = parseInt(lastShown, 10);
    const currentTime = Date.now();
    const timeDiff = MONTHLY_INTERVAL - (currentTime - lastShownTime);
    
    if (timeDiff <= 0) {
      return 0; // Can show now
    }
    
    return Math.ceil(timeDiff / (24 * 60 * 60 * 1000)); // Convert to days
  } catch (error) {
    console.warn('Error calculating days until next prompt:', error);
    return 0;
  }
}
