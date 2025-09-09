import { shouldShowPrompt, markPromptShown, resetPromptTiming, getDaysUntilNextPrompt } from './pwaInstall';

/**
 * Debug utilities for testing PWA install prompt
 * These functions are only intended for development/testing
 */
export const PwaDebug = {
  /**
   * Check current prompt status
   */
  checkStatus() {
    console.group('🐷 PWA Install Prompt Status');
    console.log('Should show prompt:', shouldShowPrompt());
    console.log('Days until next prompt:', getDaysUntilNextPrompt());
    console.log('Last shown timestamp:', localStorage.getItem('spenny_pwa_install_prompt_last_shown'));
    console.log('Is standalone mode:', window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
    console.log('Is iOS standalone:', window.navigator && window.navigator.standalone);
    console.groupEnd();
  },

  /**
   * Force show the prompt (resets timing)
   */
  forceShow() {
    resetPromptTiming();
    console.log('🔄 PWA prompt timing reset. Refresh the page to potentially see the prompt.');
  },

  /**
   * Mark prompt as shown (simulate user interaction)
   */
  markShown() {
    markPromptShown();
    console.log('✅ PWA prompt marked as shown for this month.');
  },

  /**
   * Test beforeinstallprompt event simulation
   */
  simulateEvent() {
    const event = new Event('beforeinstallprompt');
    event.preventDefault = () => console.log('preventDefault called');
    window.dispatchEvent(event);
    console.log('📱 Simulated beforeinstallprompt event');
  },

  /**
   * Get all debug info at once
   */
  getInfo() {
    return {
      shouldShow: shouldShowPrompt(),
      daysUntilNext: getDaysUntilNextPrompt(),
      lastShown: localStorage.getItem('spenny_pwa_install_prompt_last_shown'),
      isStandalone: window.matchMedia && window.matchMedia('(display-mode: standalone)').matches,
      isIOSStandalone: window.navigator && window.navigator.standalone,
      hasBeforeInstallPrompt: 'onbeforeinstallprompt' in window,
      userAgent: navigator.userAgent
    };
  }
};

// Make debug utilities available globally in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.PwaDebug = PwaDebug;
  console.log('🐷 PWA Debug utilities available via window.PwaDebug');
}
