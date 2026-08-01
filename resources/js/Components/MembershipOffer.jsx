/**
 * "You've bought once — here's how to keep getting it."
 *
 * Shown to a buyer immediately after they have paid a creator, which is the likeliest
 * moment they will pay them again: the card is out, the creator is chosen, the trust
 * already exists. Both surfaces that occupy that moment used to be empty.
 *
 * The server decides WHETHER this appears (MembershipUpsellService) — it stays silent for
 * someone already subscribed, for a creator with nothing published, and after a membership
 * purchase. This component only renders what it is handed.
 */
import { useState } from "react";
import axios from "axios";

export default function MembershipOffer({ offer, creatorName, creatorUsername }) {
    const [dismissed, setDismissed] = useState(false);

    if (!offer || dismissed) return null;

    const price = formatPrice(offer.price, offer.currency, offer.symbol);
    const name = creatorName || "this creator";

    // Hidden immediately, recorded in the background. A refusal that waits on a round trip
    // feels broken, and the record only has to survive until the NEXT purchase.
    const dismiss = () => {
        setDismissed(true);

        if (!creatorUsername) return;

        axios
            .post(route("membership-offer.dismiss"), { creator_username: creatorUsername })
            .catch(() => {
                // A refusal that fails to record costs one repeat prompt later. Telling the
                // buyer about it would be worse than the repeat.
            });
    };

    return (
        <div className="mt-8 w-full max-w-[550px]">
            <div className="relative overflow-hidden rounded-box border-[3px] border-black bg-[#FFF6EC] p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="mb-3 inline-block -rotate-1 rounded-box-sm border-[3px] border-black bg-gradient-to-r from-[#FF007F] to-[#FF8E25] px-3 py-1">
                    <span className="text-[11px] font-black uppercase tracking-wide text-white">
                        Keep it coming
                    </span>
                </div>

                <h3 className="mb-1 text-lg font-black leading-tight text-black md:text-xl">
                    Become a member of {name}
                </h3>

                {/* The reward line, when the creator wrote one — it says what arrives every
                    month, which is the only thing that makes a recurring price make sense. */}
                <p className="mb-4 text-sm font-bold leading-snug text-neutral-600">
                    {offer.description ||
                        offer.title ||
                        "Get their members-only content every month."}
                </p>

                <div className="flex flex-wrap items-center gap-3">
                    <a
                        href={offer.checkout_url}
                        className="inline-flex min-h-[44px] items-center rounded-box-sm border-[3px] border-black bg-[#FF007F] px-5 py-2.5 text-sm font-black uppercase tracking-wider text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FF007F]/50 motion-reduce:transition-none motion-reduce:hover:translate-x-0 motion-reduce:hover:translate-y-0"
                    >
                        Join for {price}/mo
                    </a>

                    {/* Said plainly and up front. A recurring charge that a buyer feels they
                        were eased into is a chargeback, not a member. */}
                    <span className="text-xs font-bold text-neutral-500">
                        Cancel any time
                    </span>

                    {/* ⚠️ Memberships are one of the four checkouts that force login, so a guest
                        pressing Join is bounced to a login page. Saying so here turns a surprise
                        into an expected step — guest checkout IS allowed on Piggy Pot and Wishes,
                        which is exactly how a guest reaches this offer. */}
                    {offer.requires_account && (
                        <span className="w-full text-xs font-bold text-neutral-500">
                            You'll create an account first — a membership needs one so it can be
                            renewed and cancelled.
                        </span>
                    )}

                    {/* Says "not now" without shouting it. Recorded per creator, so refusing
                        one does not silence another. */}
                    <button
                        type="button"
                        onClick={dismiss}
                        className="ml-auto min-h-[44px] px-2 text-xs font-bold text-neutral-500 underline underline-offset-2 transition-colors hover:text-neutral-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FF007F]/40"
                    >
                        No thanks
                    </button>
                </div>
            </div>
        </div>
    );
}

function formatPrice(amount, currency, symbol) {
    const value = Number(amount) || 0;
    const code = String(currency || "GBP").toUpperCase();
    const decimals = Number.isInteger(value) ? 0 : 2;

    // The server resolves the symbol from the `currencies` table the rest of the platform
    // formats from. Prefer it over guessing from a locale.
    if (symbol) {
        return `${symbol}${value.toFixed(decimals)}`;
    }

    try {
        return new Intl.NumberFormat("en-GB", {
            style: "currency",
            currency: code,
            // A membership price is almost always whole; trailing ".00" reads as clutter on
            // a button, but a genuine 8.99 must not be rounded away.
            minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
            maximumFractionDigits: 2,
        }).format(value);
    } catch {
        // An unknown or malformed currency code must not take the offer down with it.
        return `${code} ${value}`;
    }
}
