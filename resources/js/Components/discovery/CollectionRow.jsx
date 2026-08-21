import { Link } from "@inertiajs/react";

import discoveryLink from "@/lib/discoveryLink";
import ShowcaseCreatorCard from "./ShowcaseCreatorCard";

/**
 * Discovery Phase 5/6 — ONE component that draws any collection.
 *
 * 🚨 THIS IS THE "REUSABLE COMPONENT" THE BRIEF ASKS FOR. The plan does not ask
 * for ten rows; it asks for the collections to work "as reusable components
 * across Discover, homepage, profiles, emails, landing pages". So a surface
 * hands over whatever `CollectionService` returned and gets a row. A page that
 * drew its own would be a second idea of what a Discovery card looks like, and
 * the first one to drift would be the one nobody was looking at.
 *
 * 🚨 EVERY LINK IS TAGGED, AND THE TAG COMES FROM THE PAYLOAD. `source` is the
 * SURFACE's key (a checkout row reports `payment-success`, not the collection's
 * own default) and `key` rides along as the campaign, so a sale can be traced to
 * the collection AND the surface that produced it. An untagged card is a
 * placement that never appears in any creator's numbers, and attribution has no
 * backfill — the visit is either recorded at the moment it happens or lost.
 *
 * ⚠️ Renders NOTHING when there are no cards. An empty titled row is a dead end
 * wearing a heading; `CollectionService::many()` already drops empties, and this
 * guards the single-collection callers too.
 *
 * ⚠️ House rules: 1px frames written as `border border-[#000]` (never
 * `border-black`, which is a 2px shorthand in this project and silently discards
 * a width class), no shadow anywhere, and no scale or movement on hover.
 */
/*
 * ⚠️ THE GROUND CHANGES, SO THE HEADING HAS TO. The brief asks for these rows
 * "across Discover, homepage, profiles, emails, landing pages" — and the
 * homepage is a DARK field while a profile is cream. A single black heading
 * would simply be invisible on half of them. Same arrangement
 * `DiscoveryStatsPanel` already uses.
 *
 * ⚠️ This note used to end "only the heading and blurb take the tone" — that is
 * no longer true, and the reversal is argued in the block directly below.
 */
/*
 * 🚨 THE CARD TAKES THE TONE TOO (22 Aug 2026, client direction). This file used
 * to say the cards stay white on every surface because "a card that restyles
 * itself per page is how two surfaces end up disagreeing about what a creator
 * looks like". The homepage proved the opposite: `CreatorShowcase` draws its
 * trending creators as DARK cards with an accent frame, and these rows sat
 * directly beneath them as small white ones — two ideas of a creator card, one
 * under the other, in a single screenshot.
 *
 * The rule behind the old note still holds — one component, one place to change
 * — so the fix is a TONE MAP, not a per-caller className. `light` is unchanged
 * and is what every cream/white surface (profiles, checkout, e-mail-style pages)
 * still gets; `dark` reuses the exact surface, frame and hover values
 * `CreatorShowcase` uses, so the homepage now has ONE card design rather than
 * two.
 */
const TONE = {
    light: {
        title: "text-black",
        blurb: "text-black/60",
        /* An opaque near-white, never `hover:bg-black/[0.04]` — see the note below. */
        card: "border-[#000] bg-white hover:bg-[#F4F4F5]",
        cover: "border-[#000] bg-[#A2E4B8]",
        coverFallback: "bg-gradient-to-br from-[#A2E4B8] to-[#E6EA7B]",
        avatar: "border-[#000] bg-white",
        name: "text-black",
        meta: "text-black/55",
        line: "text-black/65",
        track: "border-[#000] bg-white",
        price: "text-black",
    },
    dark: {
        /* The accent the shared creator card frames itself with. Pink is what
           `CreatorShowcase` uses directly above these rows on the homepage, and
           the two must read as one set. */
        accent: "#FF007F",
        title: "text-white",
        blurb: "text-white/65",
        card: "border-white/10 bg-[#0d0a16] hover:bg-[#17102a]",
        cover: "border-white/10 bg-[#1a162b]",
        coverFallback: "bg-gradient-to-br from-[#FF007F]/30 to-[#0d0a16]",
        avatar: "border-white/20 bg-[#1a162b]",
        name: "text-white",
        meta: "text-white/60",
        line: "text-white/70",
        track: "border-white/15 bg-white/10",
        price: "text-white",
    },
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
export default function CollectionRow({ collection, className = "", tone = "light" }) {
    if (!collection || !Array.isArray(collection.cards) || collection.cards.length === 0) {
        return null;
    }

    const { key, title, kind, source, blurb, cards } = collection;
    const ink = TONE[tone] ?? TONE.light;
    /* ⚠️ NO CARD BADGE on a collection card. `CreatorShowcase`'s badge answers
       "why is this creator in THIS list" for three tabs that share one grid; a
       collection already says that in its own heading three lines above, and
       repeating it on every card would print "Hidden Gems" six times. */
    const isGrid = tone === "dark";

    return (
        <section className={className} aria-label={title}>
            <div className="mb-3">
                <h2
                    className={`font-gulfs text-[18px] uppercase leading-[1.1] tracking-tight md:text-[22px] ${ink.title}`}
                >
                    {title}
                </h2>
                {blurb ? (
                    <p className={`mt-1 font-poppins text-[13px] leading-[1.55] ${ink.blurb}`}>
                        {blurb}
                    </p>
                ) : null}
            </div>

            {/* ⚠️ A horizontal scroller, not a wrapping grid. These rows appear
                on pages that already own their vertical rhythm (a checkout, a
                profile foot), and a row that wraps to three lines on a phone
                stops being a row. `snap-x` so a thumb lands on a card edge. */}
            {/* 🚨 THE LAYOUT FOLLOWS THE TONE, and that is a real difference, not a
                skin. On DARK (the homepage) these rows sit under
                `CreatorShowcase`'s three-up grid of full creator cards, so they
                are the same grid and the same card — a scroller of little cards
                under a grid of big ones is what made one page look like two.
                On LIGHT (a profile foot, a checkout) the row stays a horizontal
                scroller: those pages already own their vertical rhythm, and a row
                that wraps to three lines on a phone stops being a row. `snap-x`
                so a thumb lands on a card edge. */}
            {isGrid ? (
                <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {cards.map((card) => (
                        <li key={card.id ?? card.uuid} className="h-full">
                            {kind === "item" ? (
                                <ItemCard card={card} source={source} campaign={key} ink={ink} />
                            ) : (
                                <ShowcaseCreatorCard
                                    href={discoveryLink(card.username, source, key)}
                                    name={card.name}
                                    username={card.username}
                                    avatarUrl={card.avatar_url}
                                    coverUrl={card.cover_url}
                                    accent={ink.accent}
                                    role={card.role}
                                    profileStatusLock={card.profile_status_lock}
                                />
                            )}
                        </li>
                    ))}
                </ul>
            ) : (
                <ul className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-1 scrollbar-hide">
                    {cards.map((card) => (
                        <li
                            key={card.id ?? card.uuid}
                            className="w-[200px] shrink-0 snap-start sm:w-[220px]"
                        >
                            {kind === "item" ? (
                                <ItemCard card={card} source={source} campaign={key} ink={ink} />
                            ) : (
                                <CreatorCard card={card} source={source} campaign={key} ink={ink} />
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}

function CreatorCard({ card, source, campaign, ink }) {
    return (
        <Link
            href={discoveryLink(card.username, source, campaign)}
            className={`group flex h-full flex-col overflow-hidden rounded-box-sm border transition-colors duration-200 ${ink.card}`}
        >
            <div className={`h-[84px] w-full shrink-0 overflow-hidden border-b ${ink.cover}`}>
                {card.cover_url ? (
                    <img
                        src={card.cover_url}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div className={`h-full w-full ${ink.coverFallback}`} />
                )}
            </div>

            <div className="flex flex-1 flex-col p-3">
                {/* 🚨 `relative z-10`, or the cover paints over it — the band above
                    is positioned and a positioned element paints above a
                    non-positioned one whatever the DOM order. Same fault the
                    `MoreCreators` avatar had. */}
                <div className="relative z-10 -mt-8 mb-2">
                    <img
                        src={card.avatar_url}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className={`h-11 w-11 rounded-full border object-cover ${ink.avatar}`}
                    />
                </div>

                {/* `truncate` must keep the value recoverable — a name cut with
                    no `title` is simply lost. */}
                <h3
                    title={card.name}
                    className={`truncate font-gulfs text-[14px] uppercase leading-[1.15] ${ink.name}`}
                >
                    {card.name}
                </h3>
                <p className={`mt-0.5 truncate font-poppins text-[12px] ${ink.meta}`}>
                    @{card.username}
                </p>

                {card.line ? (
                    <p className={`mt-1.5 line-clamp-2 font-poppins text-[12px] leading-[1.5] ${ink.line}`}>
                        {card.line}
                    </p>
                ) : null}
            </div>
        </Link>
    );
}

/**
 * ⚠️ An item card links to its CREATOR, tagged, not straight to the item.
 * Attribution is recorded on arrival at a creator's page, and a link that jumped
 * a supporter into a checkout would skip the stamp entirely — the sale would be
 * recorded as the creator's own traffic for ever, with no way to correct it.
 */
function ItemCard({ card, source, campaign, ink }) {
    return (
        <Link
            href={discoveryLink(card.username, source, campaign)}
            className={`group flex h-full flex-col justify-between rounded-box-sm border p-3 transition-colors duration-200 ${ink.card}`}
        >
            <div className="min-w-0">
                <p
                    title={card.title}
                    className={`line-clamp-2 font-poppins text-[13.5px] font-semibold leading-[1.3] ${ink.name}`}
                >
                    {card.title}
                </p>
                <p className={`mt-1 truncate font-poppins text-[12px] ${ink.meta}`}>
                    by {card.creator}
                </p>
            </div>

            {/* A pot shows progress; a wish shows its listed price. Neither is a
                creator's earnings — see CollectionService's note. */}
            {typeof card.percent === "number" ? (
                <div className="mt-3">
                    <div className={`h-2 w-full overflow-hidden rounded-box-xs border ${ink.track}`}>
                        <div
                            className="h-full bg-[#A2E4B8]"
                            style={{ width: `${card.percent}%` }}
                        />
                    </div>
                    <p className={`mt-1 font-poppins text-[11px] tabular-nums ${ink.meta}`}>
                        {card.percent}% there
                    </p>
                </div>
            ) : card.price !== null && card.price !== undefined ? (
                <p className={`mt-3 font-poppins text-[13px] font-bold tabular-nums ${ink.price}`}>
                    {new Intl.NumberFormat("en-GB", {
                        style: "currency",
                        currency: "GBP",
                    }).format(Number(card.price) || 0)}
                </p>
            ) : null}
        </Link>
    );
}
