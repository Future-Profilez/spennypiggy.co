import { useEffect, useState } from "react";
import { usePage, router } from "@inertiajs/react";
import { safeGet, safeSet } from "@/lib/safeStorage";

/**
 * "2 of 3 listed" — what is left of the celebration once the confetti has gone.
 *
 * 🚨 THIS IS WHY THE POPUP CAN BE DISMISSED WITHOUT LOSING ANYTHING. The full-screen
 * message fires once and is spent for ever; the instruction it carried would go with it, and
 * a creator who closed it at the wrong moment would be left with an approved account and no
 * idea what the platform had just asked of them. This strip is the standing version of the
 * same ask: it comes back on every load, counts down, and disappears at the target.
 *
 * ⚠️ It is NOT a gate and must never read as one. Nothing on the platform refuses a sale
 * below the target — one listing and a verified identity is the real threshold — so the copy
 * says what a good page looks like, never what is blocked. A creator sitting on two listings
 * can be bought from today, and telling them otherwise would be false.
 *
 * ⚠️ Owner-gated by its CALLER, like every other creator reading on this route: `/{username}`
 * is also the public profile, and this counts one specific account's work.
 *
 * ⚠️ **DISMISSABLE FOR A WEEK, NOT FOR EVER**, and the mechanism is `CreatorJourneyCard`'s
 * exactly — `safeStorage`, a timestamp, the same window. Reported as "the banner keeps coming
 * back": the popup is spent after one showing, so what returned on every load was this, which
 * had no close control at all. "Not now" is what somebody means when they close a reminder;
 * "never tell me again" is not, and this is the only thing left telling a creator with an
 * approved account what to do with it. It disappears on its own at the target regardless.
 *
 * ⚠️ Per-device by design. This is a convenience, not a fact about the account — the one
 * thing that MUST be once-only per person is the celebration, and that is a database column
 * for exactly this reason. A dismissed reminder reappearing on a second device is a smaller
 * fault than the SPA failing to boot where the browser refuses site data, which is what a
 * bare `localStorage` read costs (see `safeStorage`).
 */

const DISMISS_KEY = "spenny_listing_progress_dismissed_v1";
const DISMISS_DAYS = 7;

const isDismissed = () => {
    const at = Number(safeGet(DISMISS_KEY));
    if (!at) return false;

    return Date.now() - at < DISMISS_DAYS * 86400000;
};
export default function ListingProgressStrip({ className = "" }) {
    // 🚨 A PAGE PROP, NOT `auth.setup_celebration`. `AuthenticatedSessionController`
    // returns it in the profile's own top-level props array beside `profile_self_check`
    // and `growth_bonus_panel` — there is no `auth` key in that array at all. The first
    // version read one level up, which is permanently undefined, so NOTHING RENDERED and
    // nothing errored: exactly the `SuspendedBanner` fault (`auth.user.suspension`) this
    // codebase has already been bitten by once. Pinned by a two-language test, because
    // neither the build nor any scanner can see that the two halves agree.
    const { setup_celebration: celebration = null } = usePage().props;

    // Starts hidden and is revealed by the effect, so a dismissed strip never flashes on
    // screen before storage has been read — the same order CreatorJourneyCard uses.
    const [dismissed, setDismissed] = useState(true);

    useEffect(() => {
        setDismissed(isDismissed());
    }, []);

    // ⚠️ Renders on the PRESENCE of the flag. The payload is null for a visitor, a fan, a
    // suspended account and a creator still mid-setup, and it drops `show_progress` the
    // moment the target is met — so there is no state in here deciding who deserves this.
    if (!celebration || celebration.show_progress !== true || dismissed) return null;

    const dismiss = () => {
        setDismissed(true);
        safeSet(DISMISS_KEY, String(Date.now()));
    };

    const target = celebration.target ?? 3;
    const listed = Math.min(celebration.listings ?? 0, target);
    const remaining = Math.max(0, target - listed);

    const go = () => {
        try {
            router.visit(route("dashboard", { add: "digital" }));
        } catch {
            /* An unresolvable route leaves them where they are rather than erroring. */
        }
    };

    return (
        <div
            className={`w-full overflow-hidden rounded-box border-[3px] border-black bg-white p-4 md:p-5 ${className}`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="text-sm font-black uppercase tracking-wider text-black">
                        Fill your page
                    </h3>
                    <p className="mt-1 text-xs font-bold leading-[1.55] text-neutral-600">
                        {remaining === 1
                            ? "One more listing and your page is worth sharing."
                            : `${remaining} more listings and your page is worth sharing.`}
                    </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                    {/* The count carries the state, so it is the one thing set in the accent.
                        Black type on brand pink at 5.56:1 — white on this fill fails AA. */}
                    <span className="rounded-box-xs border-2 border-black bg-[#FF007F] px-2.5 py-1 text-xs font-black uppercase tracking-wider text-black">
                        {listed} / {target}
                    </span>
                    <button
                        type="button"
                        onClick={dismiss}
                        aria-label="Hide this reminder"
                        className="grid h-9 w-9 place-items-center rounded-full border-2 border-black bg-white text-lg font-black leading-none transition-colors duration-200 hover:bg-black/[0.04] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FF007F]/50 motion-reduce:transition-none"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* The bar is a frame with a fill, not a coloured pill on a grey one: depth here
                is border weight and colour, and nothing on this platform casts a shadow.
                `aria-hidden` because the sentence above already says the number — a screen
                reader gets the fact, not a description of the decoration. */}
            <div
                aria-hidden="true"
                className="mt-4 h-3 w-full overflow-hidden rounded-box-xs border-2 border-black bg-white"
            >
                <div
                    className="h-full bg-[#05EFB8] transition-[width] duration-500 motion-reduce:transition-none"
                    style={{ width: `${Math.round((listed / target) * 100)}%` }}
                />
            </div>

            <button
                type="button"
                onClick={go}
                className="mt-4 inline-flex min-h-[44px] items-center rounded-box-sm border-[3px] border-black bg-white px-4 py-2 text-xs font-black uppercase tracking-wider text-black transition-colors duration-200 hover:bg-black/[0.04] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FF007F]/50 motion-reduce:transition-none"
            >
                Add a listing
            </button>
        </div>
    );
}
