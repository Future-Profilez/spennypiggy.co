/**
 * Native Haptic Feedback Helper for Mobile PWA
 * Uses the Web Vibration API when supported.
 */

export function triggerHaptic(type = 'light') {
    if (typeof window === 'undefined' || !('vibrate' in navigator)) {
        return;
    }

    try {
        switch (type) {
            case 'light':
                navigator.vibrate(10);
                break;
            case 'medium':
                navigator.vibrate(25);
                break;
            case 'heavy':
                navigator.vibrate(50);
                break;
            case 'success':
                navigator.vibrate([15, 30, 15]);
                break;
            case 'error':
                navigator.vibrate([40, 50, 40]);
                break;
            default:
                navigator.vibrate(10);
        }
    } catch (e) {
        // Silently fail if vibration is disabled or blocked by browser settings
    }
}
