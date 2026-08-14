import { useCallback, useMemo } from "react";
import { toast } from "react-hot-toast";
import { variantClass } from "@/Components/Toast/toastVariants";

/**
 * 🚨 EVERY HELPER RETURNED HERE MUST KEEP A STABLE IDENTITY.
 *
 * This used to be a plain factory: each call built five fresh closures in a new
 * object, so every consumer got new identities on every render. Anything that
 * listed `errorAlert` in a `useCallback`/`useEffect` dependency array — the
 * ordinary way to write a fetch-on-select screen — re-ran its effect on every
 * render, which set state, which rendered, which re-ran the effect. An infinite
 * request loop whose only symptom is a wall of "Too many requests" toasts once
 * the endpoint's throttle catches up. The admin app hit exactly this.
 *
 * Do not simplify these back to bare functions — the identity IS the contract.
 *
 * The rendering lives in `Components/Toast/BrandToast.jsx`; this file only
 * decides WHICH variant a message is and how repeats are handled.
 */

/*
 * ⚠️ Deliberately NOT `toast.dismiss()` on every call.
 *
 * The old helpers cleared every visible toast before showing a new one, so two
 * things that both failed left the reader with only the second message and no
 * sign the first had ever happened — worst on `errorsHandling`, whose whole job
 * is reporting several validation failures at once.
 *
 * Instead each message gets a deterministic id, so the SAME message re-fired
 * (a double-submit, a retried request) replaces its own toast in place rather
 * than stacking, while genuinely different messages queue up.
 */
const toastId = (variant, message) => {
    const text = typeof message === "string" ? message : String(message ?? "");
    let hash = 5381;
    for (let i = 0; i < text.length; i += 1) {
        hash = ((hash << 5) + hash + text.charCodeAt(i)) | 0;
    }
    return `sp-${variant}-${(hash >>> 0).toString(36)}`;
};

/*
 * A form can legitimately fail every field at once. Ten stacked cards is a wall
 * nobody reads and it buries the page underneath, so the rest are summarised.
 */
const MAX_VALIDATION_TOASTS = 3;

export const useAlerts = () => {
    /*
     * ⚠️ `position` defaults to undefined ON PURPOSE — a per-toast position
     * OVERRIDES the Toaster's own, so a default here would silently win over
     * `BrandToaster`'s `position="top-right"` and there would be two places
     * deciding where a toast appears. No call site passes one; the argument is
     * kept only so an existing signature cannot break.
     */
    const show = useCallback(
        (variant, message, position = undefined, duration = 4500) => {
            if (!message) return;

            const options = {
                id: toastId(variant, message),
                duration,
                className: variantClass(variant),
                ...(position ? { position } : {}),
            };

            /*
             * ⚠️ `toast.success` / `toast.error` (never `toast.custom`) — the
             * Toaster draws a `custom` toast's message directly and skips the
             * branded renderer, so a custom toast comes out unstyled.
             */
            if (variant === "success") return toast.success(message, options);
            if (variant === "error") return toast.error(message, options);
            return toast(message, options);
        },
        []
    );

    const successAlert = useCallback(
        (message, position, duration) => show("success", message, position, duration),
        [show]
    );

    const errorAlert = useCallback(
        (message, position, duration) => show("error", message, position, duration),
        [show]
    );

    const warningAlert = useCallback(
        (message, position, duration) => show("warning", message, position, duration),
        [show]
    );

    const infoAlert = useCallback(
        (message, position, duration) => show("info", message, position, duration),
        [show]
    );

    const clearToasts = useCallback(() => toast.dismiss(), []);

    const errorsHandling = useCallback(
        (error, position, duration) => {
            const bag = error?.response?.data?.errors;

            /*
             * A caller reaching for `errorsHandling` has already decided this
             * failed. Falling through silently when the response carries no
             * validation bag (a 500, a network drop) left the reader with a
             * dead button and nothing on screen.
             */
            if (!bag) {
                const fallback =
                    error?.response?.data?.message ||
                    error?.message ||
                    "Something went wrong. Please try again.";
                return show("error", fallback, position, duration);
            }

            const messages = Object.values(bag)
                .flat()
                .filter(Boolean);

            messages
                .slice(0, MAX_VALIDATION_TOASTS)
                .forEach((message) => show("error", message, position, duration));

            const hidden = messages.length - MAX_VALIDATION_TOASTS;
            if (hidden > 0) {
                show(
                    "error",
                    `And ${hidden} more ${hidden === 1 ? "field" : "fields"} to fix.`,
                    position,
                    duration
                );
            }
        },
        [show]
    );

    return useMemo(
        () => ({
            successAlert,
            errorAlert,
            warningAlert,
            infoAlert,
            errorsHandling,
            clearToasts,
        }),
        [successAlert, errorAlert, warningAlert, infoAlert, errorsHandling, clearToasts]
    );
};
