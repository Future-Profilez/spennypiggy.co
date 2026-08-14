import toast, { resolveValue } from 'react-hot-toast';
import { TOAST_VARIANTS, resolveVariant } from './toastVariants';

/**
 * The house toast.
 *
 * Light brand fill, black text, 20px radius, NO border (client direction,
 * 14 Aug 2026).
 *
 * 🚨 THE TEXT IS BLACK BECAUSE THE FILL IS LIGHT. See the measured table in
 * `toastVariants.js` — white on mint is 1.49:1 and on brand yellow 1.28:1, so
 * the two move together or this component stops being readable. Do not lighten
 * a fill without checking the text, and do not switch the text back to white.
 *
 * ⚠️ NOTHING HERE CASTS A SHADOW, and `scripts/checks/check-no-shadows.mjs`
 * fails the build if that changes. With the border gone the card is separated
 * from the page by its own saturation alone — which is why every fill is a
 * full-strength brand hue and none of them is tinted or translucent.
 *
 * ⚠️ The fill colour is an inline `style`, never a className. Tailwind's JIT
 * only sees literal class strings in the source, so a template like
 * `bg-[${bg}]` emits NO CSS AT ALL and the card renders transparent — the same
 * silent-absence trap as an opacity modifier on a `var()` colour. Only static
 * structure is in classes.
 */

const ICONS = {
    success: <path d="M20 6 9 17l-5-5" />,
    error: (
        <>
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
        </>
    ),
    warning: (
        <>
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
        </>
    ),
    info: (
        <>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
        </>
    ),
    loading: <path d="M21 12a9 9 0 1 1-6.219-8.56" />,
};

export default function BrandToast({ toast: t }) {
    const variant = resolveVariant(t);
    const { label, bg, role } = TOAST_VARIANTS[variant];

    const message = resolveValue(t.message, t);

    /*
     * A `loading` toast has no end, so it gets no countdown bar — an empty
     * track that never moves reads as a stalled progress bar rather than as
     * "this one waits for you".
     */
    const duration = t.duration;
    const hasCountdown =
        variant !== 'loading' &&
        typeof duration === 'number' &&
        Number.isFinite(duration) &&
        duration > 0;

    return (
        <div
            className={[
                // ⚠️ Never `w-96` — at 390px that overflows. Cap against the
                // viewport first, then against a comfortable reading measure.
                'pointer-events-auto w-[min(calc(100vw-2rem),26rem)]',
                'transition-all duration-300 ease-out motion-reduce:transition-none',
                t.visible
                    ? 'translate-x-0 scale-100 opacity-100'
                    : 'translate-x-2 scale-95 opacity-0',
            ].join(' ')}
        >
            {/*
              * ⚠️ `rounded-[20px]`, deliberately NOT `rounded-box-sm`.
              *
              * That token is 16px on mobile and 20px from `md:`, and this is a
              * fixed 20px at every width (client instruction, 14 Aug 2026) —
              * which is right here because the toast is the same size at every
              * breakpoint, the exact condition the responsive tokens exist to
              * handle. A knowing exception to the never-hardcode-a-radius rule,
              * not drift.
              *
              * ⚠️ NO BORDER (client direction). Do not add `border-black` back:
              * `resources/css/index.css:90` redefines that class as the full
              * shorthand `border: 2px solid var(--black)`, so it would also
              * silently reset any width set beside it.
              */}
            <div
                className="group relative flex items-start gap-3 overflow-hidden rounded-[20px] py-4 pl-5 pr-12"
                style={{ backgroundColor: bg }}
            >
                <span
                    aria-hidden="true"
                    className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-black/20 bg-black/10"
                >
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#000000"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`h-[18px] w-[18px] ${
                            variant === 'loading'
                                ? 'animate-spin motion-reduce:animate-none'
                                : ''
                        }`}
                    >
                        {ICONS[variant]}
                    </svg>
                </span>

                <div className="min-w-0 flex-1">
                    {/*
                      * ⚠️ The label is FULL black, not `text-black/70`.
                      *
                      * Violet is the tightest fill at 4.76:1 and has no
                      * headroom, so any opacity on the type drops it under AA
                      * at this size. The label is separated from the message by
                      * size, weight and tracking instead — which costs no
                      * contrast.
                      *
                      * It also means the variant is never carried by colour
                      * alone, which is what makes these usable to someone who
                      * cannot tell the mint card from the red one.
                      */}
                    <p className="font-gulfs text-[12px] uppercase leading-[1.2] tracking-[0.18em] text-black">
                        {label}
                    </p>
                    {/*
                      * ⚠️ `leading-[1.45]`, never `leading-6`. This project maps
                      * numeric lineHeight keys to PIXELS in tailwind.config.js,
                      * so `leading-6` is a 6px line box and 15px text renders on
                      * top of itself.
                      */}
                    <p
                        {...t.ariaProps}
                        role={t.ariaProps?.role || role}
                        className="mt-1 break-words text-[15px] leading-[1.45] text-black"
                    >
                        {message}
                    </p>
                </div>

                {/* 44px hit area, small visual target — PWA touch rule. */}
                <button
                    type="button"
                    onClick={() => toast.dismiss(t.id)}
                    aria-label="Dismiss notification"
                    className="absolute right-1 top-1 flex h-11 w-11 items-center justify-center rounded-full text-black/60 transition-colors hover:text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-black/40"
                >
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        className="h-4 w-4"
                        aria-hidden="true"
                    >
                        <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                </button>

                {hasCountdown && (
                    /*
                     * Hovering the toast pauses the library's dismiss timer
                     * (the Toaster container binds startPause/endPause), so the
                     * bar has to pause with it or it would empty while the
                     * toast stays put.
                     *
                     * ⚠️ Black at 25%, not a solid colour — on a light fill a
                     * full-strength bar reads as a second element rather than
                     * as the card's own countdown.
                     */
                    <span
                        aria-hidden="true"
                        className="absolute inset-x-0 bottom-0 h-[3px] origin-left animate-toast-progress bg-black/25 group-hover:[animation-play-state:paused]"
                        style={{ animationDuration: `${duration}ms` }}
                    />
                )}
            </div>
        </div>
    );
}
