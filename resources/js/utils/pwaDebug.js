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
  },

  /**
   * Mark prompt as shown (simulate user interaction)
   */
  markShown() {
    markPromptShown();
  },

  /**
   * Test beforeinstallprompt event simulation
   */
  simulateEvent() {
    const event = new Event('beforeinstallprompt');
    event.preventDefault = () => console.log('preventDefault called');
    window.dispatchEvent(event);
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
}
