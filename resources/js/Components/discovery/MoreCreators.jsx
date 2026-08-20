import { Link } from "@inertiajs/react";
import discoveryLink, { DISCOVERY_SOURCE } from "@/lib/discoveryLink";

/**
 * Discovery Phase 3 — "More creators to support".
 *
 * Four cards at the foot of every public creator profile: one Similar, one
 * Emerging, one Popular, one rotating Discovery Pick. Reference: Developer
 * Master Plan, 19 Aug 2026, §C Phase 3.
 *
 * 🚨 CREATOR EARNINGS ARE NEVER SHOWN. A card carries an image, a display name,
 * an @username, one short line and "View profile" — the five things the brief
 * names. The server never sends a figure (see CreatorRecommendationService), so
 * there is nothing here to render even by accident, and nothing money-shaped may
 * be added to this component.
 *
 * 🚨 EVERY CARD IS DISCOVERY-TAGGED. `discoveryLink(username, 'more-creators',
 * slot)` puts the source in `sp_d` and THE SLOT in `sp_c` — the campaign — so a
 * click is attributed to Spenny Piggy and the slot that produced it is
 * recoverable. An untagged link here is a placement that never appears in any
 * creator's numbers, and there is no backfill for it.
 *
 * ⚠️ House rules this file follows deliberately: no shadow anywhere (the build
 * fails on one), no scale/rotate on hover or tap, radius only through
 * `rounded-box` / `-sm` / `-xs`, and `border-2 border-[#000]` rather than
 * `border-black` — the project redefines `.border-black` as a full
 * `border: 2px solid` shorthand, so pairing it with a width class silently
 * discards the width.
 */

/**
 * The four slot labels.
 *
 * ⚠️ THE INTERNAL BAND IS NEVER HERE. Exposure balancing sorts these cards and
 * the brief is explicit that its bands stay internal; a label may say what the
 * slot IS, never how the creator scored.
 *
 * ⚠️ Black type on the pink fill (house rule, both apps): white on `#FF007F` is
 * 3.78:1 and fails AA, black is 5.56:1. The Discovery Pick badge is black with
 * white type rather than brand violet, which is mid-dark and would need its own
 * contrast measurement to be safe at badge size.
 */
const SLOTS = {
    similar: { label: "Similar creator", className: "bg-[#05EFB8] text-black" },
    emerging: { label: "Just getting started", className: "bg-[#E6EA7B] text-black" },
    popular: { label: "Popular right now", className: "bg-[#FF007F] text-black" },
    pick: { label: "Discovery pick", className: "bg-black text-white" },
};

function CreatorCard({ creator }) {
    const slot = SLOTS[creator.slot] || SLOTS.pick;

    return (
        <Link
            href={discoveryLink(
                creator.username,
                DISCOVERY_SOURCE.MORE_CREATORS,
                creator.slot,
            )}
            aria-label={`View ${creator.name}'s profile`}
            /* Hover is a background change only — no lift, no scale. */
            className="group flex h-full flex-col overflow-hidden rounded-box-sm border-2 border-[#000] bg-white transition-colors duration-200 hover:bg-black/[0.04] motion-reduce:transition-none"
        >
            <div className="relative h-[104px] w-full overflow-hidden border-b-2 border-[#000] bg-[#A2E4B8]">
                {creator.cover_url ? (
                    <img
                        src={creator.cover_url}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition-[filter] duration-500 ease-out group-hover:brightness-[1.08] motion-reduce:transition-none"
                    />
                ) : (
                    /* No cover is a designed state, not a broken one — the page's
                       own mint carries the band and the avatar does the work. */
                    <div className="h-full w-full bg-gradient-to-br from-[#A2E4B8] to-[#E6EA7B]" />
                )}

                <span
                    className={`absolute left-3 top-3 max-w-[calc(100%-1.5rem)] truncate rounded-full border-2 border-[#000] px-3 py-1 font-poppins text-[11px] font-semibold uppercase tracking-[0.12em] ${slot.className}`}
                >
                    {slot.label}
                </span>
            </div>

            <div className="flex flex-1 flex-col p-4">
                <div className="-mt-10 mb-3">
                    {/* Plain img, not the shared Avatar component: Avatar pins
                        itself to 60px through an injected stylesheet and nests
                        height-less wrappers, which collapses inside a card this
                        size. The server only ever sends an APPROVED avatar. */}
                    <img
                        src={creator.avatar_url}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="h-14 w-14 rounded-full border-2 border-[#000] bg-white object-cover"
                    />
                </div>

                {/* `truncate` must keep the value recoverable — a name cut at the
                    card edge with no `title` is simply lost. */}
                <h3
                    title={creator.name}
                    className="truncate font-gulfs text-[17px] uppercase leading-[1.15] tracking-wide text-black"
                >
                    {creator.name}
                </h3>
                <p
                    title={`@${creator.username}`}
                    className="mt-0.5 truncate font-poppins text-xs text-black/60"
                >
                    @{creator.username}
                </p>

                {creator.line ? (
                    /* ⚠️ `leading-N` is PIXELS in this project — `leading-5` on
                       13px text renders the lines on top of each other. Ratios
                       only. */
                    <p className="mt-2 line-clamp-2 font-poppins text-[13px] leading-[1.5] text-black/70">
                        {creator.line}
                    </p>
                ) : null}

                <span className="mt-auto flex items-center gap-1.5 pt-4 font-poppins text-[13px] font-semibold uppercase tracking-[0.08em] text-black">
                    View profile
                    <span
                        aria-hidden
                        className="transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transform-none motion-reduce:transition-none"
                    >
                        →
                    </span>
                </span>
            </div>
        </Link>
    );
}

/**
 * @param {{creators?: Array<{slot: string, name: string, username: string, avatar_url: string, cover_url: ?string, line: string}>}} props
 *
 * ⚠️ FEWER THAN FOUR IS A CORRECT ANSWER and renders as fewer cards — the server
 * never pads the row with an ineligible creator, and never with the profile
 * being viewed. An empty list renders nothing at all: a "no recommendations"
 * placeholder is a dead end wearing a heading, which is the thing this row exists
 * to remove.
 */
export default function MoreCreators({ creators }) {
    if (!Array.isArray(creators) || creators.length === 0) return null;

    return (
        <section
            aria-labelledby="more-creators-heading"
            className="mb-6 mt-6 sm:mb-8 sm:mt-8"
        >
            <div className="rounded-box border-2 border-[#000] bg-white p-5 md:p-7">
                <div className="mb-5 md:mb-6">
                    <h2
                        id="more-creators-heading"
                        className="font-gulfs text-2xl uppercase leading-[1.05] tracking-tight text-black md:text-3xl"
                    >
                        More creators to support
                    </h2>
                    <p className="mt-2 font-poppins text-sm leading-[1.55] text-black/60">
                        Picked for you — have a look at what they have on offer.
                    </p>
                </div>

                {/* One column on a phone, so four cards stack cleanly; two on a
                    tablet; the full row from lg up. */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {creators.map((c) => (
                        <CreatorCard key={`${c.slot}-${c.username}`} creator={c} />
                    ))}
                </div>
            </div>
        </section>
    );
}
