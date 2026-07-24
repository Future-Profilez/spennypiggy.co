import { triggerHaptic } from "./haptics";
import { isStandalone } from "./pwaInstall";

/**
 * App-wide tap haptics for the installed PWA.
 *
 * Adds a single passive, capture-phase pointerdown listener that fires a light
 * vibration when the user taps a button / role=button / [data-haptic] element.
 * Purely additive: no markup changes, fully feature-detected, wrapped in
 * try/catch, and gated to standalone so browser visitors are never buzzed.
 *
 * Opt out on a specific control with a `data-no-haptic` attribute.
 */
export function initGlobalHaptics() {
    try {
        if (typeof window === "undefined" || typeof document === "undefined") return;
        if (!("vibrate" in navigator)) return;
        if (!isStandalone()) return;

        document.addEventListener(
            "pointerdown",
            (e) => {
                try {
                    const el =
                        e.target &&
                        e.target.closest &&
                        e.target.closest('button, [role="button"], a[data-haptic], [data-haptic]');
                    if (!el) return;
                    if (el.disabled) return;
                    if (el.dataset && el.dataset.noHaptic !== undefined) return;
                    triggerHaptic("light");
                } catch (_) {
                    /* never let feedback break a tap */
                }
            },
            { passive: true, capture: true }
        );
    } catch (_) {
        /* silent — haptics are a nice-to-have */
    }
}
