import { PRICE_FORMATTED, TOTAL_FORMATTED } from "@/constants/creatorSubscription";
import { Link, usePage } from "@inertiajs/react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

/**
 * TEMPORARY — one-time announcement that the subscription is no longer charged
 * before a creator earns.
 *
 * It exists because the announcement email only reaches people who open it. This
 * catches the rest on the one page every creator visits. Once the change is old
 * news, DELETE THIS FILE and the single line that mounts it in Dashboard.jsx —
 * that is the whole removal.
 *
 * Self-gating on purpose: everything it needs is already in the shared Inertia
 * auth payload, so nothing else in the codebase had to change to add it, and
 * nothing else has to change to take it away.
 */

/** Bump the suffix to show it again to everyone who already dismissed it. */
const SEEN_KEY = "spenny_subscription_news_v1";

/**
 * Long enough that it lands after the reader has settled into the page rather
 * than fighting it for attention on arrival.
 */
const DELAY_MS = 30_000;

export default function SubscriptionNewsPopup({ isOwnProfile = false }) {
    const { auth } = usePage().props;
    const reduceMotion = useReducedMotion();
    const [open, setOpen] = useState(false);

    const user = auth?.user;

    // Creators only, on their OWN profile, and only those without an active
    // subscription — the people this change actually unblocks.
    //
    // `is_site_subscription_active` is the platform's own definition (true for
    // both billing and a live free period), so someone already on the new terms
    // is not told about them. To a creator who is already billing, "you're no
    // longer charged before you earn" is simply false.
    //
    // ⚠️ The own-profile check is not optional: this page doubles as every
    // creator's PUBLIC profile, so without it the card fired while a creator was
    // reading someone else's page — a billing notice with no relationship to
    // what they were looking at.
    //
    // ⚠️ And the copy is written FOR a creator ("set up my card", a struck-out
    // monthly price). Shown to a fan on a page where they may be about to buy,
    // it reads as though THEY are being signed up for a monthly charge.
    const eligible =
        isOwnProfile &&
        !!user &&
        Number(user.role) === 1 &&
        !user.is_site_subscription_active;

    useEffect(() => {
        if (!eligible) return;

        let seen = false;
        try {
            seen = window.localStorage.getItem(SEEN_KEY) === "1";
        } catch {
            // Private mode or storage disabled. Failing closed means the popup
            // never appears rather than appearing on every single page load.
            seen = true;
        }

        if (seen) return;

        const timer = window.setTimeout(() => setOpen(true), DELAY_MS);

        return () => window.clearTimeout(timer);
    }, [eligible]);

    const dismiss = () => {
        setOpen(false);
        try {
            window.localStorage.setItem(SEEN_KEY, "1");
        } catch {
            // Nothing to do — it will simply appear again next visit.
        }
    };

    // Escape closes it. The card is deliberately non-modal — it never traps focus
    // or blocks the page — but a dismissible overlay that ignores Escape is the
    // one keyboard convention people expect without being told.
    useEffect(() => {
        if (!open) return;

        const onKey = (e) => {
            if (e.key === "Escape") dismiss();
        };

        window.addEventListener("keydown", onKey);

        return () => window.removeEventListener("keydown", onKey);
    }, [open]);

    if (!eligible) return null;

    return (
        <AnimatePresence>
            {open && (
                <motion.aside
                    role="status"
                    aria-label="Subscription update"
                    initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
                    transition={{ type: "spring", stiffness: 260, damping: 24 }}
                    /* Corner card on desktop, bar above the fixed bottom nav on
                       mobile. Not a full-screen modal: this is news the creator
                       did not ask for, and blocking the page to deliver it earns
                       a reflex dismissal rather than a read.

                       ⚠️ Bottom-LEFT on desktop, not right. The Intercom launcher
                       owns the bottom-right corner and is injected from outside
                       this codebase, so its position cannot be changed from here —
                       it sat directly on top of the "Not now" button. On mobile the
                       card is full width and cannot dodge sideways, so it is lifted
                       clear of both the bottom nav and the launcher instead. */
                    className="fixed z-[60] left-3 right-3 bottom-[calc(11rem+env(safe-area-inset-bottom))]
                               sm:right-auto sm:left-6 sm:bottom-6 sm:w-[380px]"
                >
                    <div className="rounded-box border-[3px] border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                        <div className="flex items-start justify-between gap-3 px-5 pt-4">
                            <span className="rounded-full border-[3px] border-black bg-[#E6EA7B] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.16em] text-black">
                                New
                            </span>
                            <button
                                type="button"
                                onClick={dismiss}
                                aria-label="Dismiss"
                                className="-mr-1 -mt-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-black/40 transition-colors hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                            >
                                <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="px-5 pb-5 pt-2">
                            <h2 className="font-gulfs text-[19px] leading-[1.15] uppercase tracking-wide text-black">
                                You&rsquo;re no longer charged before you earn
                            </h2>

                            {/* The whole change on one line: the old price struck
                                out, the new one standing. Same shape as the
                                announcement email, so a creator who saw both
                                recognises it. */}
                            <div className="mt-4 flex items-center gap-3 rounded-box-sm border-[3px] border-black bg-[#A2E4B8]/30 px-3.5 py-3">
                                <span className="text-[14px] font-bold tabular-nums text-black/35 line-through">
                                    {TOTAL_FORMATTED}
                                </span>
                                <svg aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0 text-black/40" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M4 12h15" />
                                </svg>
                                <span className="font-gulfs text-[26px] leading-none tabular-nums text-black">
                                    £0.00
                                </span>
                                <span className="ml-auto text-[10px] font-black uppercase leading-tight tracking-wider text-black/50">
                                    Today
                                </span>
                            </div>

                            <p className="mt-3 text-[13px] font-medium leading-relaxed text-black/70">
                                Nothing is charged until you make your first sale. After that it&rsquo;s{" "}
                                {PRICE_FORMATTED} + VAT a month. If you never sell, you never pay.
                            </p>

                            {/* Stacked on mobile: a launcher overlapping the card's
                                right edge must not be able to cover a control. */}
                            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                                <Link
                                    href="/activate-subscription"
                                    onClick={dismiss}
                                    className="w-full sm:flex-1 rounded-box-sm border-[3px] border-black bg-[#FF007F] px-4 py-3 text-center text-[13px] font-black uppercase tracking-widest text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                                >
                                    Set up my card
                                </Link>
                                <button
                                    type="button"
                                    onClick={dismiss}
                                    className="w-full py-1.5 text-center sm:w-auto sm:flex-shrink-0 sm:px-1 sm:py-0 text-[12px] font-bold uppercase tracking-wider text-black/45 underline underline-offset-4 transition-colors hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                                >
                                    Not now
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.aside>
            )}
        </AnimatePresence>
    );
}
