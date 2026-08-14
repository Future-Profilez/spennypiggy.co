import { useEffect, useRef, useState } from "react";
import { router } from "@inertiajs/react";
import { isStandalone } from "@/utils/pwaInstall";

/**
 * Route-change feedback, everywhere.
 *
 * 🚨 Three separate things make a tap feel dead in the INSTALLED app, and they
 * are why this component was born standalone-only:
 *
 *  1. `app.blade.php` sets `-webkit-tap-highlight-color: transparent` on
 *     `a, button, [role=button], nav` inside `@media (display-mode: standalone)`.
 *     That is the flash the OS draws on touch, removed across the whole
 *     interactive surface with nothing replacing it. (Cured in the same block —
 *     the cause and the cure live together on purpose.)
 *  2. Inertia's own progress bar IS configured, but it is NProgress's 2–3px
 *     line at `top: 0`, and the app declares `black-translucent`, so in
 *     standalone the top ~59px is UNDER the status bar. The bar renders behind
 *     the clock.
 *  3. Nothing else acknowledged the visit at all.
 *
 * It now runs in the browser too (client direction, 15 Aug 2026). A browser tab
 * keeps the OS tap highlight and shows the NProgress bar in a place you can
 * actually see, so it already has fast feedback — which is why the two contexts
 * WAIT DIFFERENT AMOUNTS before this appears.
 *
 * ⚠️ `SHOW_AFTER_MS` is the load-bearing number in both. A veil that appears on
 * a 40ms navigation and vanishes again reads as a flicker — worse than no
 * feedback — so the press state (instant, CSS) and the top bar cover the fast
 * case and this covers only the genuinely slow one. Do not drop either to 0 to
 * "make it more responsive"; that is how a fast app is made to look busy.
 */
const SHOW_AFTER_MS = { standalone: 160, browser: 280 };

export default function NavigationProgress() {
    const [visible, setVisible] = useState(false);
    const timer = useRef(null);

    useEffect(() => {
        const delay = isStandalone()
            ? SHOW_AFTER_MS.standalone
            : SHOW_AFTER_MS.browser;

        const clear = () => {
            if (timer.current) {
                clearTimeout(timer.current);
                timer.current = null;
            }
        };

        const offStart = router.on("start", () => {
            clear();
            timer.current = setTimeout(() => setVisible(true), delay);
        });

        // ⚠️ `finish` fires for a cancelled or interrupted visit too, which is
        // exactly what we want — a visit the user abandoned must not leave the
        // app behind a veil it can never dismiss.
        const offFinish = router.on("finish", () => {
            clear();
            setVisible(false);
        });

        return () => {
            clear();
            offStart();
            offFinish();
        };
    }, []);

    if (!visible) return null;

    return (
        <div
            role="status"
            aria-live="polite"
            aria-busy="true"
            aria-label="Loading"
            /* Above the bottom bar (999999) AND the drawer (1000002): the tap
               that started this often came from one of them, so a veil under
               either would leave the control that was just pressed looking live.

               ⚠️ The veil is the house ink at 70%, and it carries NO
               `backdrop-blur`. A blur on a full-viewport element is the most
               expensive thing the compositor can be asked for, on the exact
               frame the app is trying to paint a new page — it makes the wait it
               is describing measurably longer on a mid-range Android. It also
               borrows the vocabulary of a modal, and a navigation is not
               something you can dismiss. */
            className="sp-nav-veil fixed inset-0 z-[1000003] flex items-center justify-center bg-[#0B0B0C]/70 px-6"
        >
            {/* The house device, at its smallest: two cells that ABUT, the
                hairline between them being the black parent showing through a
                1px gap. It is the same shape as `StatStrip` and the landing
                page's "ways to get paid" — which is what makes this read as
                THIS app pausing, rather than as a generic spinner.

                No shadow (banned sitewide) and no spinner ring: the frame is a
                line, and the state is carried by the violet — `tokens.js`
                assigns each accent a meaning, and VIOLET IS PENDING. Pink would
                sit between the pink header and the pink bottom bar and read as
                chrome rather than as a state. */}
            {/* ⚠️ `border-[#000]`, NOT `border-black`. `resources/css/index.css`
                redefines `.border-black` as the full shorthand
                `border: 2px solid var(--black)`, which overwrites the width — so
                `border-[3px] border-black` renders at 2px and the 3px is
                discarded silently. Measured in a browser on this exact plate.
                The arbitrary colour class carries no width, so the 3px holds. */}
            <div className="grid grid-cols-[48px_1fr] gap-px overflow-hidden rounded-box border-[3px] border-[#000] bg-black">
                {/* The one solid block. Black on #8C52FF measures 4.76:1 and
                    clears AA; white would be 4.41:1 and does not — the same
                    filled-brand-block rule the whole platform follows. */}
                <div className="flex items-center justify-center bg-[#8C52FF] py-4">
                    <span
                        className="sp-nav-pulse block h-3.5 w-3.5 rounded-full bg-black"
                        aria-hidden="true"
                    />
                </div>

                <div className="bg-white px-4 py-3">
                    <p className="font-gulfs uppercase tracking-[0.18em] text-[11px] leading-none text-black">
                        Loading
                    </p>
                    <div className="sp-nav-track mt-2 h-[8px] w-[120px] overflow-hidden rounded-full bg-black/10 md:w-[148px]">
                        <div
                            className="sp-nav-sweep h-full w-1/2 rounded-full bg-[#8C52FF]"
                            style={{
                                animation: "sp-nav-sweep 0.9s ease-in-out infinite",
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
