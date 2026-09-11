import { useCallback, useEffect, useRef, useState } from "react";
import { usePage, router } from "@inertiajs/react";
import axios from "axios";
import Popup from "@/Components/Popup";

/**
 * "You're all set" — the one full-screen moment in creator onboarding.
 *
 * Setup used to end on a silence: the ID check passes, the last card on the journey rail
 * quietly disappears, and the creator is left on a page identical to the one they were
 * already looking at. Nothing said the waiting was over, and nothing said what to do with
 * the account they had just spent a week getting approved.
 *
 * 🚨 SHOWN EXACTLY ONCE PER ACCOUNT, AND THE RECORD IS IN THE DATABASE, NOT THE BROWSER.
 * `auth.setup_celebration.celebrate` is computed server-side from `users.setup_celebrated_at`;
 * this component never decides for itself whether it has run before. localStorage would be
 * per-device — finish the passport check on a phone, open the laptop, get it again — and
 * reading it can throw outright in a browser that refuses site data, which is the documented
 * fault that once stopped the whole SPA from booting.
 *
 * ⚠️ IT IS MARKED SEEN ON OPEN, NOT ON CLOSE. A creator who reads it and closes the tab
 * rather than pressing a button has still been told, and re-running the confetti at them
 * tomorrow reads as the platform having forgotten. The endpoint is idempotent for the same
 * reason — two tabs open, one message.
 *
 * ⚠️ Dismissable by design, and dismissing is final. It is a celebration, not a task: the
 * work it points at survives in the listings progress strip, which comes back on every load
 * until the target is met, so closing this loses the confetti and none of the instruction.
 */

/**
 * The confetti.
 *
 * ⚠️ `canvas-confetti` is imported DYNAMICALLY. It is already a dependency (the leaderboard
 * and the Piggy Pot widget use it) but this component mounts on the creator dashboard, which
 * every creator loads on every visit — pulling the library into that bundle to serve a
 * one-time popup would cost every page load for ever to pay for a single moment.
 *
 * 🚨 SKIPPED ENTIRELY UNDER `prefers-reduced-motion`. A burst of flying pieces is precisely
 * what that setting is asking us not to draw, and the message reads perfectly without it —
 * so the motion is removed rather than shortened. Same rule GrowthBonusTracker's celebration
 * follows.
 */
/**
 * Above `Popup`'s Dialog (`z-[9995]`), and deliberately a named constant: the two numbers
 * live in different files and a burst painted under the sheet looks exactly like a burst
 * that never fired.
 */
const CONFETTI_Z_INDEX = 10000;

const fireConfetti = async () => {
    try {
        if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) return;

        const confetti = (await import("canvas-confetti")).default;
        if (typeof confetti !== "function") return;

        // Brand colours, black included: on this platform black is a colour rather than an
        // absence of one, and a burst of pure pastel reads as somebody else's product.
        const colors = ["#FF007F", "#05EFB8", "#E6EA7B", "#000000", "#FFFFFF"];

        // Two side cannons rather than one centre burst: the panel's own content sits in the
        // middle of the screen, and a centre burst spends its densest moment on top of the
        // sentence the creator is meant to read.
        const shots = [
            { angle: 60, origin: { x: 0, y: 0.65 } },
            { angle: 120, origin: { x: 1, y: 0.65 } },
        ];

        shots.forEach((shot, index) => {
            window.setTimeout(() => {
                confetti({
                    particleCount: 70,
                    spread: 70,
                    startVelocity: 45,
                    ticks: 220,
                    scalar: 0.9,
                    colors,
                    disableForReducedMotion: true,
                    // 🚨 THE LIBRARY'S DEFAULT z-index IS 100 AND THIS PANEL IS `z-[9995]`,
                    // SO THE DEFAULT PUTS EVERY PIECE BEHIND AN OPAQUE FULL-SCREEN SHEET.
                    // The confetti fires, the canvas exists, nothing errors — it is simply
                    // painted underneath the one thing covering the whole viewport, which
                    // reads as "the confetti did not work". The two existing call sites
                    // (`PiggyPotWidget`, `leaderboard/Board`) fire onto an ordinary page and
                    // are right to leave it alone; a burst over a MODAL never can.
                    // ⚠️ The canvas is `pointer-events: none`, so raising it cannot swallow a
                    // click on the buttons underneath.
                    zIndex: CONFETTI_Z_INDEX,
                    ...shot,
                });
            }, index * 140);
        });
    } catch {
        // A celebration is decoration. A failed chunk load must cost the confetti and never
        // the message underneath it.
    }
};

export default function SetupCompleteCelebration() {
    // 🚨 A PAGE PROP, NOT `auth.setup_celebration`. `AuthenticatedSessionController`
    // returns it in the profile's own top-level props array beside `profile_self_check`
    // and `growth_bonus_panel` — there is no `auth` key in that array at all. The first
    // version read one level up, which is permanently undefined, so NOTHING RENDERED and
    // nothing errored: exactly the `SuspendedBanner` fault (`auth.user.suspension`) this
    // codebase has already been bitten by once. Pinned by a two-language test, because
    // neither the build nor any scanner can see that the two halves agree.
    const { setup_celebration: celebration = null } = usePage().props;
    const shouldCelebrate = celebration?.celebrate === true;

    const [open, setOpen] = useState(false);
    // ⚠️ A ref, not state: this guards a side effect and must not itself cause a render.
    // Without it a re-render between the POST and the server's next payload fires both the
    // confetti and the write a second time.
    const marked = useRef(false);

    const markSeen = useCallback(() => {
        if (marked.current) return;
        marked.current = true;

        // 🚨 `axios`, NOT `router.post`. The endpoint answers with JSON, and Inertia's
        // visitor treats any non-Inertia response as an error — it would tear the panel down
        // at the moment it opened. The push heartbeat posts to its JSON endpoint the same
        // way, and axios already carries the CSRF token and the session cookie.
        //
        // ⚠️ Fire and forget. Nothing on screen depends on the answer: a failed write costs
        // the creator one repeat of a celebration, and blocking the confetti on a round trip
        // would make the good case wait for the bad one.
        try {
            axios.post(route("creator.setup-celebration.seen")).catch(() => {});
        } catch {
            // `route()` throws for a name ziggy.js has not been regenerated with — the
            // documented local-only trap. Losing the write means the creator sees this once
            // more; throwing here would take down the page it is celebrating.
        }
    }, []);

    useEffect(() => {
        if (!shouldCelebrate) return;

        setOpen(true);
        markSeen();
        fireConfetti();
    }, [shouldCelebrate, markSeen]);

    if (!celebration || !shouldCelebrate) return null;

    const target = celebration.target ?? 3;
    const listed = celebration.listings ?? 0;
    const remaining = celebration.remaining ?? target;

    const go = (name, params) => {
        setOpen(false);
        try {
            router.visit(route(name, params));
        } catch {
            /* An unresolvable route closes the panel and leaves them where they are. */
        }
    };

    const options = [
        {
            emoji: "📁",
            title: "Sell a file",
            body: "A photo set, audio track, PDF or video. Fastest to set up.",
            go: () => go("dashboard", { add: "digital" }),
        },
        {
            emoji: "📝",
            title: "Take an order",
            body: "A custom video, shoutout or service. Paid up front, delivered by you.",
            go: () => go("shop", { type: "orders" }),
        },
        {
            emoji: "📦",
            title: "Sell physical",
            body: "A print, merch or anything you post. Shipping is collected for you.",
            go: () => go("dashboard", { add: "physical" }),
        },
    ];

    return (
        <Popup
            action={open}
            fullscreen
            hidecontrols
            onHide={() => setOpen(false)}
            modalclass="bg-[#FFF6EC]"
        >
            <div className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto customScrollbar">
                {/* ⚠️ The bottom padding is deliberately generous on a phone. `Popup` hides
                    the tab bar while it is open (`body.sheet-open`), so nothing sits UNDER
                    this — but the last control is a text button and at 24px it landed hard
                    against the home indicator, which reads as the sheet being cut off. The
                    inset is added TO the padding rather than max()'d against it, so a device
                    with an indicator gets clearance on top of the breathing room, not
                    instead of it. */}
                <div className="mx-auto flex w-full max-w-2xl flex-col px-5 pb-[calc(env(safe-area-inset-bottom)+2.5rem)] pt-8 md:px-8 md:pb-10 md:pt-16">
                    {/* The eyebrow is the state, the headline is the news. Black on brand
                        pink at 5.56:1 — white on this fill is 3.78:1 and fails AA at label
                        size, which is the house rule everywhere a pink fill carries text. */}
                    <span className="mb-4 inline-block -rotate-1 self-start rounded-box-sm border-[3px] border-black bg-[#FF007F] px-4 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-black">
                        Setup complete
                    </span>

                    <h2 className="font-gulfs text-[34px] uppercase leading-[1.05] text-black md:text-[52px]">
                        You&rsquo;re all set
                    </h2>

                    <p className="mt-4 text-base font-bold leading-[1.55] text-black md:text-lg">
                        Your page is live, your payouts are connected and your card is on
                        file. Everything we needed from you is done.
                    </p>

                    {/* 🚨 The one instruction, and it is deliberately the only bold claim on
                        the screen. A creator who reads nothing else must still leave knowing
                        what the next move is. */}
                    <p className="mt-3 text-base font-bold leading-[1.55] text-black md:text-lg">
                        From here it is your page to fill. Put up{" "}
                        <span className="bg-[#E6EA7B] px-1">
                            at least {target} listings
                        </span>{" "}
                        so there is something worth arriving to, then share your link.
                    </p>

                    {/* The state table, drawn as hairlines on a black parent rather than
                        three separately bordered cells — the house StatStrip device. Depth
                        is border weight, then colour, then space; nothing here casts a
                        shadow. */}
                    <div className="mt-7 grid grid-cols-3 gap-px overflow-hidden rounded-box border-[3px] border-black bg-black">
                        {[
                            // ⚠️ The four SETUP_STEPS, nothing else: identity is a payout
                            // gate and is not what this celebrates (11 Sep 2026).
                            { label: "Profile", value: "Live" },
                            { label: "Payouts", value: "Connected" },
                            { label: "Card", value: "On file" },
                        ].map((cell) => (
                            <div
                                key={cell.label}
                                className="min-w-0 bg-white px-1.5 py-3.5 text-center sm:px-3 sm:py-4"
                            >
                                <div className="text-[10px] font-black uppercase tracking-[0.1em] text-neutral-500 sm:text-[11px] sm:tracking-[0.14em]">
                                    {cell.label}
                                </div>
                                {/* 🚨 SMALLER AND UNTRACKED ON A PHONE, OR THE LONGEST WORD IS
                                    CUT IN HALF. At 390px each of the three cells is ~116px
                                    wide, and "CONNECTED" set at 14px black-weight with
                                    `tracking-wider` measures ~91px against ~92px of content
                                    box — so it clipped mid-word, on the one cell that says
                                    the creator can be paid. Letter-spacing is what tips it
                                    over, and it buys nothing at this size. */}
                                <div className="mt-1 text-[11px] font-black uppercase leading-[1.2] text-black sm:text-sm sm:tracking-wider">
                                    {cell.value}
                                </div>
                            </div>
                        ))}
                    </div>

                    <p className="mt-7 text-sm font-black uppercase tracking-wider text-black">
                        {listed > 0
                            ? `${listed} of ${target} listed — ${remaining} to go`
                            : `Start with one — ${target} is the target`}
                    </p>

                    {/* Three doors rather than one button: what a creator sells decides which
                        form they need, and choosing for them is how somebody abandons a form
                        that did not fit. Same three destinations the journey card offers, so
                        the two surfaces cannot send a creator to different places. */}
                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                        {options.map((option) => (
                            /* ⚠️ A ROW ON A PHONE, A COLUMN FROM `sm` UP. Stacked three-deep,
                               the column layout ran the sheet far past the fold — the creator
                               scrolled through the whole message and then three tall cards
                               before reaching anything tappable. Laid out as rows the same
                               three choices read at a glance, and the column layout is kept
                               where there is width for them side by side. */
                            <button
                                key={option.title}
                                type="button"
                                onClick={option.go}
                                className="group flex flex-row items-start gap-3 rounded-box-sm border-[3px] border-black bg-white p-4 text-left transition-colors duration-200 hover:bg-black/[0.04] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FF007F]/50 motion-reduce:transition-none sm:flex-col sm:gap-0"
                            >
                                <span
                                    aria-hidden="true"
                                    className="shrink-0 text-2xl leading-none sm:mb-2.5 sm:text-3xl"
                                >
                                    {option.emoji}
                                </span>
                                <span className="min-w-0">
                                    <span className="block text-sm font-black uppercase tracking-wider text-black transition-colors group-hover:text-[#FF007F]">
                                        {option.title}
                                    </span>
                                    <span className="mt-1 block text-xs font-bold leading-normal text-neutral-600">
                                        {option.body}
                                    </span>
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* ⚠️ In the flow, never `fixed` — a control pinned to the foot of a
                        phone screen sits under the bottom bar. Popup already hides that bar
                        while it is open, and this stays in the scroll for the same reason
                        the house rule gives: a page's own action belongs in its content. */}
                    <button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="mt-6 min-h-[44px] self-start text-sm font-black uppercase tracking-wider text-black underline underline-offset-4 transition-opacity duration-200 hover:opacity-70 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FF007F]/50 motion-reduce:transition-none"
                    >
                        I&rsquo;ll do it later
                    </button>
                </div>
            </div>
        </Popup>
    );
}
