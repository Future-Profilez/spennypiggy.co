import { Link } from "@inertiajs/react";
import { Compass } from "lucide-react";
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
 * `rounded-box` / `-sm` / `-xs`, and `border border-[#000]` rather than
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
    emerging: {
        label: "Just getting started",
        className: "bg-[#E6EA7B] text-black",
    },
    popular: {
        label: "Popular right now",
        className: "bg-[#FF007F] text-black",
    },
    pick: { label: "Discovery pick", className: "bg-black text-white" },
};

/*
 * 🚨 THE HOVER IS AN OPAQUE COLOUR, NEVER `hover:bg-black/[0.04]`.
 *
 * That class does not TINT a white card — it REPLACES the background with a 96%
 * transparent black, so whatever is behind the card shows through. On a white
 * page that reads as a faint darkening and looks correct; on the homepage's dark
 * field the card went BLACK on hover. Reported 21 Aug 2026 against exactly this
 * component.
 *
 * A reusable row is drawn on cream, white and dark grounds, so its hover cannot
 * depend on what is behind it. An opaque near-white darkens the same amount
 * everywhere.
 */
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
            className="group flex h-full w-full min-h-[240px] flex-col overflow-hidden rounded-box-sm border border-[#000] bg-white transition-colors duration-200 hover:bg-[#F4F4F5] motion-reduce:transition-none"
        >
            <div className="relative h-[112px] w-full shrink-0 overflow-hidden border-b border-[#000] bg-[#A2E4B8]">
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
                    className={`absolute left-3 top-3 max-w-[calc(100%-1.5rem)] truncate rounded-full border border-[#000] px-3 py-1 font-poppins text-[11px] font-semibold uppercase tracking-[0.12em] ${slot.className}`}
                >
                    {slot.label}
                </span>
            </div>

            <div className="flex flex-1 flex-col p-4">
                {/* 🚨 `relative z-10`, OR THE COVER PAINTS OVER THE AVATAR.
                    The cover band above is `relative`, and a positioned element
                    paints above a non-positioned one WHATEVER the DOM order —
                    so the avatar's top 40px, the part the negative margin lifts
                    into the cover, was being covered by it and the face came out
                    sliced along the band's edge. Nothing about the markup order
                    suggests that; it is purely the paint order. Same fault the
                    tab strip's edge fades had. */}
                <div className="relative z-10 -mt-10 mb-3">
                    {/* Plain img, not the shared Avatar component: Avatar pins
                        itself to 60px through an injected stylesheet and nests
                        height-less wrappers, which collapses inside a card this
                        size. The server only ever sends an APPROVED avatar. */}
                    <img
                        src={creator.avatar_url}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="h-14 w-14 rounded-full border border-[#000] bg-white object-cover"
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

                {/* ⚠️ A DIVIDER, NOT A GAP. Four tiles side by side only read as
                    a set if the same line falls in the same place on each of
                    them, and `mt-auto` alone put the CTA wherever that card's
                    text happened to end. */}
                <span className="mt-auto flex items-center justify-between gap-2 border-t border-black/10 pt-3 font-poppins text-[12.5px] font-semibold uppercase tracking-[0.08em] text-black">
                    View profile
                    <span
                        aria-hidden
                        /* No movement on hover — the card's own background
                           change is the whole feedback. */
                        className="flex h-7 w-7 items-center justify-center rounded-box-xs border border-[#000] bg-[#FF007F] text-black"
                    >
                        →
                    </span>
                </span>
            </div>
        </Link>
    );
}

/**
 * The tile that fills the row when the server had less than a row to give.
 *
 * 🚨 DEAD SPACE IS A DESIGN DECISION NOBODY TOOK. One recommendation used to
 * render as a single card against the left edge of a full-width white panel
 * with three empty column-widths beside it — which reads as "three cards failed
 * to load", not as "we found one good match". Centring the lone card only moved
 * the problem: the heading is left-aligned, so a centred card sits under
 * nothing.
 *
 * So the row is completed with the one thing a visitor who liked this section
 * would want next. It is deliberately NOT a creator card: dashed edge, no
 * avatar, no badge — the house "this is not an item" language, so it can never
 * be mistaken for a recommendation the platform is making.
 *
 * ⚠️ LITERAL PATH, NOT `route()`. A named route is invisible to the frontend
 * until `ziggy:generate` runs and `route()` THROWS for a name it does not carry
 * — which surfaces as whatever the nearest error boundary says rather than as
 * the missing route it is. Vapor regenerates on deploy, so this only bites local
 * and dev, which is exactly where it wastes the time.
 */
function BrowseAllTile() {
    return (
        <Link
            href="/creators/discovery"
            /* ⚠️ SOLID, NOT DASHED. A dashed edge is this codebase's signal
               for "announced, not built" — it is what the stablecoin Tip block
               wears while its flag is off. This link works today, so a dashed
               frame told the visitor the opposite of the truth. It stays
               visually secondary through its FILL (the page's own mint) and the
               absence of an avatar and a badge, which is what keeps it from
               reading as a creator the platform is recommending. */
            className="group flex h-full min-h-[240px] flex-col items-center justify-center gap-2 rounded-box-sm border border-[#000] bg-[#A2E4B8]/40 p-5 text-center transition-colors duration-200 hover:bg-[#A2E4B8]/60 motion-reduce:transition-none"
        >
            <span
                aria-hidden
                className="flex h-11 w-11 items-center justify-center rounded-box-xs border border-[#000] bg-white text-black"
            >
                <Compass size={20} strokeWidth={2.25} />
            </span>

            <span className="mt-1 font-gulfs text-[15px] uppercase leading-[1.15] tracking-wide text-black">
                Browse all creators
            </span>

            <span className="max-w-[26ch] font-poppins text-[12.5px] leading-[1.5] text-black/60">
                Find someone new to support.
            </span>
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
/*
 * 🚨 A FIXED FIVE-COLUMN TRACK, NOT ONE SIZED TO THE NUMBER OF CARDS
 * (client direction, 24 Aug 2026).
 *
 * These are the same breakpoints the discover grids use
 * (`Pages/discover/components/ResultsGrid.jsx`), so a card here is the same
 * width as a card there. That is the point of the change: the row previously
 * set its columns from how many cards it happened to have, so three
 * recommendations became three wide thirds and the tile stopped matching the
 * component it is meant to be.
 *
 * ⚠️ THE ROW IS OFTEN NOT FULL, AND THAT IS ACCEPTED. There are only four slots
 * (see CreatorRecommendationService::SLOTS) and any of them can come back empty
 * on a small pool, so the last one or two columns are frequently blank. The
 * trade was made deliberately: a correctly-sized card with space beside it,
 * rather than an oversized card that fills the width.
 *
 * This replaces an earlier pair of maps that capped the grid width per count.
 * Do not reinstate them — they are what made the tiles grow.
 */
const GRID_COLUMNS =
    "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";

export default function MoreCreators({ creators }) {
    if (!Array.isArray(creators) || creators.length === 0) return null;

    // One card alone cannot make a row; two or more already read as a set.
    const needsFiller = creators.length === 1;

    return (
        <section
            aria-labelledby="more-creators-heading"
            className="mb-6 mt-8 border-t border-black/15 pt-6 sm:mb-8 sm:mt-10 sm:pt-8"
        >
            {/* 🚨 NO OUTER PANEL. This was a full-width white card with a black
                frame, holding white cards with black frames — a box inside a box
                in the same colour, and a short row left a visible third of that
                box empty, which reads as "the rest failed to load" rather than
                as "we found one good match".

                That matters more now, not less: the grid above is a fixed
                five-column track, so the row is routinely short by a column or
                two. With no panel drawn around it, unused columns are just page
                — there is no box for them to look like a hole in. The cards
                already carry their own frames, so the container was drawing a
                second one and then having to be filled. A hairline above seats
                the section — the house order is border weight, then colour,
                then space. Do not put the panel back. */}
            <div>
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

                {/*
                    ⚠️ The class string is LITERAL. Tailwind scans source text, so
                    a template-built `xl:grid-cols-${n}` is never compiled and the
                    row silently falls back to one column — which is why the
                    columns are a single constant rather than assembled at render.
                */}
                <div className={`grid gap-4 ${GRID_COLUMNS}`}>
                    {creators.map((c) => (
                        <CreatorCard
                            key={`${c.slot}-${c.username}`}
                            creator={c}
                        />
                    ))}

                    {needsFiller ? <BrowseAllTile /> : null}
                </div>
            </div>
        </section>
    );
}
