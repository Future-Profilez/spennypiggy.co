import { useEffect, useRef, useState } from "react";
import { STEPS, detectPlatform, isInstalled } from "@/lib/pwaInstall";

/**
 * The install offer, as a BANNER at the top of the page — never a modal.
 *
 * 🚨 What this replaced was a full-screen `bg-black/40` scrim at
 * `z-[9999999999]` centred over the homepage `<h1>`, plus a SECOND modal for
 * the Chrome instructions. It interrupted a visitor to ask them to install an
 * app for a product they were still reading about, and on the homepage it
 * landed while the cookie bar was also up. A banner asks the same question and
 * costs nothing to ignore, which is the whole reason to prefer it (client
 * direction, 16 Aug 2026).
 *
 * ⚠️ Both modals are gone, including the instruction one. A "banner instead of
 * a popup" that opens a popup the moment you press its only button has not
 * changed anything — so the steps EXPAND INSIDE the banner.
 *
 * ⚠️ It renders IN FLOW, immediately, as the first thing under the fixed
 * header. Two consequences, both deliberate:
 *   · it scrolls away with the page rather than following the reader, so it
 *     cannot cover a control the way a fixed strip can;
 *   · it is decided synchronously on first render rather than on a timer, so
 *     it paints with the page instead of pushing the content down 3s later —
 *     a banner that arrives late is a layout shift under the reader's thumb.
 */

/**
 * ⚠️ A first-time visitor is NEVER offered the app. They have not been told
 * what the product is yet, and visit 1 is also when the cookie bar is dealt
 * with. The marker IS the gate: visit 1 records and shows nothing, visit 2
 * onward is eligible. Deliberately not `sessionStorage` — a reload is not a
 * return visit.
 */
const RETURN_VISIT_KEY = "pwa_install_seen_site";
const LAST_SHOWN_KEY = "pwa_install_last_shown";
const SHOW_AGAIN_DAYS = 30;

function readLastShown() {
    try {
        const raw = localStorage.getItem(LAST_SHOWN_KEY);
        return raw ? new Date(raw) : null;
    } catch {
        return null;
    }
}

function recordShown() {
    try {
        localStorage.setItem(LAST_SHOWN_KEY, new Date().toISOString());
    } catch {
        /* storage blocked — the banner simply reappears next visit */
    }
}

/*
 * ⚠️ `isInstalled`, `detectPlatform` and `STEPS` moved to `@/lib/pwaInstall` when the
 * profile promo deck grew an install card. Two copies of these strings would drift the
 * day a browser renames a menu item, and a step that mis-describes the button it points
 * at is worse than no step at all.
 */

export default function PwaInstallPrompt() {
    const platform = useRef(null);
    if (platform.current === null) platform.current = detectPlatform();

    /*
     * ⚠️ Resolved ONCE, into a ref, because the read below also WRITES the
     * marker — evaluating it twice would answer "first visit" the first time
     * and "returning" the second, showing the banner on the very visit it must
     * not.
     */
    const eligible = useRef(null);
    if (eligible.current === null) {
        let ok = false;
        try {
            const returning = Boolean(localStorage.getItem(RETURN_VISIT_KEY));
            if (!returning) {
                localStorage.setItem(RETURN_VISIT_KEY, new Date().toISOString());
            } else {
                const last = readLastShown();
                ok =
                    !last ||
                    (Date.now() - last.getTime()) / 86400000 >= SHOW_AGAIN_DAYS;
            }
        } catch {
            // Storage blocked (Safari private mode, hardened profiles) throws.
            // Fail closed: with no marker we cannot prove this is a return
            // visit, and a banner wrongly withheld costs far less than one
            // shown to someone who has never seen the product.
            ok = false;
        }
        eligible.current = ok && !isInstalled();
    }

    const [visible, setVisible] = useState(eligible.current);
    const [showSteps, setShowSteps] = useState(false);
    // Chromium hands us the install event; until it arrives we can only teach.
    const [canInstallNatively, setCanInstallNatively] = useState(false);
    const deferred = useRef(null);

    useEffect(() => {
        const onBeforeInstallPrompt = (e) => {
            e.preventDefault();
            deferred.current = e;
            setCanInstallNatively(true);
        };
        const onInstalled = () => {
            recordShown();
            setVisible(false);
        };

        window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
        window.addEventListener("appinstalled", onInstalled);

        // Kept because `Pages/PwaTest.jsx` and `utils/pwaDebug.js` drive it.
        window.PwaPromptDebug = {
            shouldShow: () => eligible.current,
            forceShow: () => setVisible(true),
            resetTimer: () => {
                try {
                    localStorage.removeItem(LAST_SHOWN_KEY);
                    localStorage.removeItem(RETURN_VISIT_KEY);
                } catch {
                    /* nothing to reset */
                }
            },
            canInstallNatively: () => Boolean(deferred.current),
        };

        return () => {
            window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
            window.removeEventListener("appinstalled", onInstalled);
            delete window.PwaPromptDebug;
        };
    }, []);

    /*
     * 🚨 THE BAR PUBLISHES ITS OWN HEIGHT, and the header reads it. This is a
     * fixed bar ABOVE a fixed header, so something has to move the header down
     * — and the height is not a constant: it grows when the steps expand and
     * changes with the viewport. A typed number here would be the silent drift
     * the variable exists to prevent, exactly like `--sp-bottombar-h`.
     *
     * ⚠️ Cleared on unmount AND on dismiss, or the header keeps a gap above it
     * for a bar that is no longer there.
     */
    const barRef = useRef(null);
    useEffect(() => {
        const el = barRef.current;
        const root = document.documentElement;
        if (!el) {
            root.style.removeProperty("--sp-topbanner-h");
            return undefined;
        }

        const publish = () =>
            root.style.setProperty(
                "--sp-topbanner-h",
                `${Math.round(el.getBoundingClientRect().height)}px`,
            );

        publish();
        const observer = new ResizeObserver(publish);
        observer.observe(el);

        return () => {
            observer.disconnect();
            root.style.removeProperty("--sp-topbanner-h");
        };
    }, [visible]);

    if (!visible) return null;

    const dismiss = () => {
        recordShown();
        setVisible(false);
    };

    const install = async () => {
        const prompt = deferred.current;
        if (!prompt) {
            setShowSteps((open) => !open);
            return;
        }
        try {
            await prompt.prompt();
            await prompt.userChoice;
            recordShown();
            deferred.current = null;
            setVisible(false);
        } catch {
            // The browser refused to show its own dialog. Teach instead of
            // failing silently — the button must always do something.
            setShowSteps(true);
        }
    };

    const steps = STEPS[platform.current] || STEPS.other;

    return (
        /*
         * FULL-BLEED, ABOVE THE HEADER (client direction, 16 Aug 2026).
         *
         * 🚨 THE BAND IS WALLPAPER AND THE ICON IS THE TILE. Two earlier
         * versions were rejected and both failed the same way: they imitated
         * something else. A centred white card below the header was an orphan
         * floating in a black gap, and the ink bar that replaced it was the App
         * Store / Smart App Banner template with the colours swapped — icon,
         * name, pill, dismiss — a shape that belongs to no product in
         * particular. Neither used a single thing from this app's own language.
         *
         * So the bar stops describing the offer and SHOWS it: the app's icon is
         * a black tile, and a MINT ground turns the strip into a piece of home
         * screen with the app already sitting on it. Mint is also this app's
         * action colour (the bottom bar's one button), and black on it measures
         * 14.05:1 — the strongest pairing in the palette, which is what lets
         * the type be full-strength display caps instead of a muted grey.
         *
         * ⚠️ MINT above the pink header, deliberately. Pink would blob into the
         * header with no edge between them; ink read as borrowed chrome. Mint
         * is a hard, brand-owned edge, and the 3px black rule underneath is the
         * house frame doing the separating.
         *
         * ⚠️ NO top safe-area padding: the banner never renders in the
         * installed app (`isInstalled()` hides it), so its only context is a
         * browser tab, where the browser's own UI owns that inset and the
         * header's existing handling is untouched.
         */
        <div
            ref={barRef}
            className="fixed inset-x-0 top-0 z-[101] border-b-[3px] border-[#000] bg-[#05EFB8]"
        >
            <div className="mx-auto flex max-w-6xl items-center gap-3 px-3 py-2 sm:gap-4 sm:px-4">
                {/* 🚨 THE REAL APP ICON, at home-screen size — the bar SHOWS
                    what you get instead of describing it. It replaced an
                    invented "SP" monogram, a mark this brand uses nowhere else
                    that said nothing about the outcome.

                    ⚠️ `/android-chrome-192x192.png` is a ROUTE, not a bare
                    `public/` path — a file under `public/` is not reliably
                    served on the app domain (the documented `/siteicon.png`
                    404), and this is the only image on the bar.
                    ⚠️ Width and height are set so it cannot resize the bar as
                    it loads — and the bar's height is what moves the header.
                    ⚠️ `alt=""`: the title beside it already names the thing, so
                    an alt string would be read out twice.
                    ⚠️ The mint ring is what makes a black icon legible on an
                    ink bar. Without it the tile disappears into the ground. */}
                {/* 🚨 THE REAL APP ICON, as the tile it will become. It carries
                    the identity, which is why the app's name is not typed out
                    beside it — the mark IS the name, and the headline is free
                    to carry the offer instead.

                    ⚠️ No ring here, unlike the ink version: a black tile on
                    mint is maximum contrast already, and a ring would only add
                    a second edge inside a bar that has one.
                    ⚠️ `rounded-[20px]` is a KNOWING exception to the radius
                    tokens (client direction, 16 Aug 2026), not drift.
                    `rounded-box-sm` is 16px on a phone and 20px from `md:`, and
                    the responsive tokens exist because a corner is read against
                    the size of the element it sits on — but this tile is 44px
                    at EVERY width, so a corner that changes with the viewport
                    would be answering a question this element never asks. Same
                    reasoning as the toast's fixed 20px.
                    ⚠️ `/android-chrome-192x192.png` is a ROUTE, not a bare
                    `public/` path — a file under `public/` is not reliably
                    served on the app domain (the documented `/siteicon.png`
                    404), and this is the only image on the bar.
                    ⚠️ Width and height are set so it cannot resize the bar as
                    it loads — and the bar's height is what moves the header. */}
                <img
                    src="/android-chrome-192x192.png"
                    alt=""
                    width="44"
                    height="44"
                    className="h-11 w-11 shrink-0 rounded-[20px]"
                />

                <div className="min-w-0 flex-1">
                    {/* The headline carries the OFFER because the icon already
                        carries the identity. Three plain words, active, and
                        short enough to hold one line on a 390px phone — which
                        it must, since the bar's height is what the header and
                        the whole page below it move down by. */}
                    <p className="font-gulfs uppercase tracking-[0.08em] text-[13px] leading-none text-black sm:text-[15px]">
                        Get the app
                    </p>
                    {/* Content-first copy: a Stripe-facing surface like every
                        other public string, so no gift / tip / donation
                        wording — and no bare "Free" either, which on this
                        platform is the unqualified free claim the landing page
                        had to have removed.
                        ⚠️ Two strings, not one truncated: the full line cut to
                        "Get told the moment s…" at 390px, and an ellipsis
                        mid-word says nothing where a shorter sentence written
                        for that width says the whole thing. `truncate` stays as
                        the guard that keeps the bar one line whatever the copy
                        becomes.
                        ⚠️ `text-black/70` on mint is 9.9:1 — the opacity is
                        hierarchy, not a contrast compromise. */}
                    <p className="mt-1 truncate text-[12px] leading-[1.4] text-black/70 sm:text-[13px]">
                        <span className="sm:hidden">Sale alerts on your phone</span>
                        <span className="hidden sm:inline">
                            Get told the moment something sells.
                        </span>
                    </p>
                </div>

                <InstallButton
                    onClick={install}
                    native={canInstallNatively}
                    open={showSteps}
                />
                <DismissButton onClick={dismiss} />
            </div>

            {showSteps ? (
                <div className="mx-auto max-w-6xl px-3 pb-3 sm:px-4">
                    <ol className="space-y-1.5 border-t-2 border-black/15 pt-3 text-[13px] leading-[1.45] text-black/75">
                        {steps.map((step, i) => (
                            <li key={step} className="flex gap-2.5">
                                {/* The steps ARE a sequence — you cannot add to
                                    the home screen before opening the share
                                    menu — so the numbering carries information
                                    rather than decorating the list. */}
                                <span className="font-gulfs shrink-0 text-[12px] leading-[1.45] text-black">
                                    {i + 1}
                                </span>
                                <span>{step}</span>
                            </li>
                        ))}
                    </ol>
                </div>
            ) : null}
        </div>
    );
}

/*
 * ⚠️ The label states what pressing it does. On Chromium with the install
 * event in hand that is "Install"; everywhere else the browser will not let a
 * page install anything, so promising "Install" and then showing a list of
 * manual steps would be the button lying about its own outcome.
 */
function InstallButton({ onClick, native, open }) {
    return (
        /* BLACK on the mint band. The bar is one saturated colour, so a second
           brand hue on it would be a third thing competing for the eye — black
           is 14.05:1 against mint and is the only fill on this bar, which is
           what makes it read as the one thing to press.
           ⚠️ `rounded-box-sm` (16/20px), inside the 25px ceiling.

           🚨 THE PILL IS 36px TALL AND THE TAP TARGET IS STILL 44px. It was a
           44px block, which on a bar this slim read as a slab rather than a
           control (client direction, 16 Aug 2026: make it smaller). The size
           came off the padding and the type — never off the target — and the
           missing 8px is given back as an invisible `before:` hit area, the
           same device the account page's switches use. A button small enough
           to look tidy and small enough to miss is worse than no button. */
        <button
            type="button"
            onClick={onClick}
            aria-expanded={native ? undefined : open}
            className="relative inline-flex h-9 shrink-0 items-center justify-center rounded-box-sm bg-black px-3.5 font-gulfs uppercase tracking-[0.12em] text-[11px] leading-none text-white transition-[filter,opacity] duration-200 before:absolute before:inset-x-0 before:-inset-y-1 before:content-[''] hover:brightness-150 active:opacity-90"
        >
            {/* ⚠️ Two words max — this sits in a bar whose height the whole
                page is pushed down by, so the label may never wrap. */}
            {native ? "Install" : open ? "Hide" : "How"}
        </button>
    );
}

function DismissButton({ onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label="Dismiss"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-box-sm text-black/60 transition-opacity duration-200 hover:opacity-100"
        >
            <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
            >
                <path
                    d="M2 2l12 12M14 2L2 14"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                />
            </svg>
        </button>
    );
}
