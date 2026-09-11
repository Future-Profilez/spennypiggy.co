import { useCallback, useEffect, useRef } from "react";

/**
 * "Are you sure you want to discard this?" for a form that lives in a sheet.
 *
 * 🚨 Six of the seven add-item flows threw away a part-filled form without
 * asking — a three-step wish plus an Uploadcare upload evaporated on a mis-tap
 * of the backdrop, and both shells already ship the veto (`Sheet`'s and
 * `Popup`'s `onClose`/`onHide` return `false` to cancel the dismissal). Only
 * the shop form remembered to use it, with its own inline `window.confirm`.
 * This is that one behaviour, in one place, with one sentence of copy.
 *
 * The snapshot is taken when the sheet OPENS, not on mount: these forms are
 * mounted for the whole page and reset between items, so a mount-time baseline
 * would compare an edited item against an empty form and always read dirty.
 *
 * ⚠️ `window.confirm` is deliberate rather than a styled dialog. A confirm
 * inside a dismissing dialog is a second dialog over a closing one, and the
 * native sheet is the one thing that cannot be missed or mis-stacked. Match
 * whatever the product later adopts for destructive confirmations.
 *
 * @param {boolean} open      whether the sheet is currently open
 * @param {any} data          the form state to watch
 * @param {string} [message]
 * @returns {() => boolean}   call from onClose/onHide; `false` means "stay open"
 */
export default function useDirtyGuard(open, data, message) {
    const baseline = useRef(null);

    useEffect(() => {
        // ⚠️ Re-snapshot when the sheet OPENS, and never clear on close. A
        // caller may drive `open` with a pulse flag it clears back to null a
        // tick later (the documented `openPop` pattern) — clearing the baseline
        // there would silently disarm the guard while the sheet was still on
        // screen, which is exactly the case it exists for.
        if (open === false) return;
        try {
            baseline.current = JSON.stringify(data);
        } catch {
            // An unserialisable value (a File, a circular ref) must not break
            // closing the sheet — with no baseline the guard stays quiet.
            baseline.current = null;
        }
        // Intentionally only on open: this is the baseline, not a subscription.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    return useCallback(() => {
        if (baseline.current === null) return true;
        let current;
        try {
            current = JSON.stringify(data);
        } catch {
            return true;
        }
        if (current === baseline.current) return true;
        return window.confirm(
            message || "Discard this? Anything you have filled in will be lost.",
        );
    }, [data, message]);
}
