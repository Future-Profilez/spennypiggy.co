import { usePage, router } from "@inertiajs/react";

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
 */
export default function ListingProgressStrip({ className = "" }) {
    const { auth } = usePage().props;
    const celebration = auth?.setup_celebration ?? null;

    // ⚠️ Renders on the PRESENCE of the flag. The payload is null for a visitor, a fan, a
    // suspended account and a creator still mid-setup, and it drops `show_progress` the
    // moment the target is met — so there is no state in here deciding who deserves this.
    if (!celebration || celebration.show_progress !== true) return null;

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
                {/* The count carries the state, so it is the one thing set in the accent.
                    Black type on brand pink at 5.56:1 — white on this fill fails AA. */}
                <span className="shrink-0 rounded-box-xs border-2 border-black bg-[#FF007F] px-2.5 py-1 text-xs font-black uppercase tracking-wider text-black">
                    {listed} / {target}
                </span>
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
