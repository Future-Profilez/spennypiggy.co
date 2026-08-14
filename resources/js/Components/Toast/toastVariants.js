/**
 * The ONE definition of what a toast looks like per variant.
 *
 * `BrandToast` renders from this and nothing else, so a variant added here is a
 * variant every surface gets. Do not hardcode a colour in the renderer.
 *
 * 🚨 LIGHT BRAND FILL + BLACK TEXT (14 Aug 2026, client direction). Success is
 * the brand mint, warning the brand yellow, info the brand violet; only error
 * reaches outside the palette, because this brand has no red and red is what a
 * failure has to read as before it reads as Spenny Piggy.
 *
 * 🚨 THE TEXT IS BLACK BECAUSE THE FILL IS LIGHT — that is a contrast rule, not
 * a style choice, and it is the same rule every filled brand surface on this
 * platform already follows ("a filled brand block takes BLACK text, never
 * white"). White text needs 4.5:1 at body size and does not come close on any of
 * these. Measured:
 *
 *                          on WHITE text      on BLACK text
 *   #05EFB8 mint             1.49:1 ✗           14.05:1 ✓
 *   #E6EA7B brand yellow     1.28:1 ✗           16.42:1 ✓
 *   #8C52FF brand violet     4.41:1 ✗            4.76:1 ✓
 *   #EF4444 red-500          3.76:1 ✗            5.58:1 ✓
 *
 * ⚠️ The two are not independent: lightening a fill and keeping white text is
 * how this component stops being readable. A fill and its text colour move
 * TOGETHER or not at all.
 *
 * ⚠️ Violet is the tightest at 4.76:1 — it clears AA for the 15px message and
 * the 12px label, and there is no headroom left in it. Do not darken the fill
 * toward the brand's deeper purples without re-measuring.
 */

export const TOAST_VARIANTS = {
    success: {
        label: 'Success',
        bg: '#05EFB8',
        role: 'status',
    },
    error: {
        label: 'Something went wrong',
        bg: '#EF4444',
        role: 'alert',
    },
    warning: {
        label: 'Heads up',
        bg: '#E6EA7B',
        role: 'status',
    },
    info: {
        label: 'Info',
        bg: '#8C52FF',
        role: 'status',
    },
    loading: {
        label: 'Working',
        bg: '#8C52FF',
        role: 'status',
    },
};

/**
 * ⚠️ The variant travels in the toast's `className`, not in a custom option.
 *
 * `ToastOptions` is `Partial<Pick<Toast, 'id'|'icon'|'duration'|'ariaProps'|
 * 'className'|'style'|'position'|'iconTheme'|'toasterId'|'removeDelay'>>` — an
 * arbitrary `variant:` key is not part of that contract and only survives today
 * because the library happens to spread its options. `className` IS a declared
 * field on `Toast`, so reading the variant back out of it cannot break on a
 * library update.
 */
export const VARIANT_CLASS_PREFIX = 'sp-toast-';

export const variantClass = (variant) => `${VARIANT_CLASS_PREFIX}${variant}`;

/**
 * Resolve a variant from a raw react-hot-toast object.
 *
 * ⚠️ There are 122 raw `toast.success(...)` / `toast.error(...)` call sites in
 * this app that know nothing about `variantClass()`. They must still render
 * branded, so `t.type` is the fallback and a bare `toast('…')` lands on `info`
 * rather than on nothing.
 */
export const resolveVariant = (t) => {
    const tagged = (t?.className || '')
        .split(/\s+/)
        .find((c) => c.startsWith(VARIANT_CLASS_PREFIX));

    if (tagged) {
        const key = tagged.slice(VARIANT_CLASS_PREFIX.length);
        if (TOAST_VARIANTS[key]) return key;
    }

    if (t?.type === 'success') return 'success';
    if (t?.type === 'error') return 'error';
    if (t?.type === 'loading') return 'loading';

    return 'info';
};
