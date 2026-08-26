import { memo } from 'react';
import PriceFormat from '@/includes/PriceFormat';
import SaveButton from '@/Components/SaveButton';
import discoveryLink, { DISCOVERY_SOURCE } from '@/lib/discoveryLink';
import { Link } from '@inertiajs/react';
import { tierTheme } from '@/constants/membershipTiers';

/**
 * One card for every listing on the mixed board.
 *
 * 🚨 FIVE CARD DESIGNS IN ONE GRID IS NOT VARIETY, IT IS NOISE. The wish, shop,
 * bill, membership and task cards were each drawn for their own page — different
 * heights, different headers, different CTA shapes, one of them a full-width row
 * — and the board drew all five side by side. It read as a broken grid rather
 * than as a shop. The modules KEEP their own cards on their own pages, where a
 * rich, specific card is the right answer; the board speaks one language.
 *
 * ⚠️ THE ONLY THINGS THAT VARY ARE A CHIP AND A VERB. Geometry, type scale and
 * spacing are identical for every module, which is what makes a row of five
 * different products read as one shelf.
 *
 * 🚨 The colour encodes WHAT SHAPE THE PURCHASE IS, it does not decorate:
 * yellow = unlocks now · mint = recurring · violet = made for you. Black type on
 * all three (they are the house accents already measured for black).
 *
 * 🚨 The price is fee-inclusive, through the same PriceFormat helper as every
 * other buyer-facing price. `price` off the wire is the LISTED price; rendering
 * it raw would advertise less than the checkout charges.
 */

const SHAPE = {
    instant: { dot: '#E6EA7B', tint: 'bg-[#E6EA7B]' },
    monthly: { dot: '#05EFB8', tint: 'bg-[#05EFB8]' },
    custom: { dot: '#8C52FF', tint: 'bg-[#8C52FF]' },
};

function BoardCard({ card, auth }) {
    const { formatMultiPrice, calculateTotalSupporterPays } = PriceFormat();
    const shape = SHAPE[card.unlock] || SHAPE.instant;

    /*
     * ⚠️ A MEMBERSHIP'S TIER IS ITS IDENTITY, so a pictureless membership shows
     * the LEVEL in the tier's own colour — the generic label is already on the
     * chip below, and printing it twice on one card said nothing either time.
     * Colours come from constants/membershipTiers.js, the same definition the
     * membership card itself reads.
     */
    const tier = card.mode === 'membership' ? tierTheme(card.level) : null;

    const listed = parseFloat(card.price ?? 0) || 0;
    const supporterPays = listed
        ? (calculateTotalSupporterPays(
              listed * (1 + (card.vat_amount_percentage || 0) / 100),
              card.currency || 'GBP',
              0,
              card.creator_id,
          )?.total_supporter_pays ?? listed)
        : 0;
    const price = listed ? formatMultiPrice(supporterPays, card.currency || 'GBP') : null;

    return (
        <article className="relative flex h-full flex-col overflow-hidden rounded-box border-black bg-white transition-colors duration-200 hover:border-[#FF007F]">
            <a href={card.href} className="group block">
                <div
                    className={`relative aspect-[4/3] overflow-hidden ${card.image ? 'bg-[#0E0E12]' : tier ? tier.bg : shape.tint}`}
                >
                    {card.image ? (
                        <img
                            src={card.image}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-cover transition-[filter] duration-500 group-hover:brightness-[1.06]"
                        />
                    ) : (
                        /* No stock photography and no invented imagery: a listing
                           with no picture says what it IS, on its own colour. */
                        <span className={`flex h-full w-full flex-col items-center justify-center gap-1 px-4 text-center ${tier ? tier.text : 'text-black/70'}`}>
                            {tier ? (
                                <>
                                    <span className={`text-[11px] font-bold uppercase tracking-[0.22em] ${tier.ink}`}>
                                        Tier
                                    </span>
                                    <span className="font-anton text-[26px] uppercase leading-none tracking-wide">
                                        {card.level || card.title}
                                    </span>
                                </>
                            ) : (
                                <span className="font-anton text-[13px] uppercase tracking-[0.18em]">{card.label}</span>
                            )}
                        </span>
                    )}
                </div>
            </a>

            {auth?.user && card.item_id && (
                <div className="absolute right-2 top-2 z-10">
                    <SaveButton productType={card.mode} itemId={card.item_id} />
                </div>
            )}

            <div className="flex flex-1 flex-col p-3">
                <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-black/55">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: shape.dot }} />
                    {card.label}
                </span>

                {/* Two lines, always — a one-line title next to a two-line one is
                    what made the old board's rows end at different heights. */}
                <a href={card.href} className="mt-1.5 block">
                    <h3 className="line-clamp-2 min-h-[42px] text-[15px] font-bold leading-[1.35] text-black hover:opacity-70">
                        {card.title}
                    </h3>
                </a>

                <Link
                    href={discoveryLink(card.username, DISCOVERY_SOURCE.SEARCH_RECS)}
                    className="mt-0.5 truncate text-[12px] font-medium text-black/50 hover:text-black"
                >
                    @{card.username}
                </Link>

                {card.benefit && (
                    <p className="mt-2 line-clamp-1 text-[12px] text-black/60">
                        You get: <span className="font-semibold text-black/75">{card.benefit}</span>
                    </p>
                )}

                <div className="mt-auto flex items-center justify-between gap-2 border-t border-black/10 pt-3">
                    {price ? (
                        <span className="min-w-0">
                            <span className="block truncate text-[15px] font-black leading-none text-black">
                                {price}
                                {card.unlock === 'monthly' && <span className="text-[12px] font-bold text-black/55">/mo</span>}
                            </span>
                            <span className="mt-0.5 block text-[10px] font-medium text-black/40">Fees included</span>
                        </span>
                    ) : (
                        <span className="text-[12px] font-semibold text-black/40">Price on request</span>
                    )}

                    <a
                        href={card.href}
                        className="shrink-0 rounded-box-sm bg-[#FF007F] border-black px-4 py-2 text-[12px] font-black uppercase text-black transition-colors duration-200 hover:brightness-110 active:brightness-95"
                    >
                        {card.cta}
                    </a>
                </div>
            </div>
        </article>
    );
}

export default memo(BoardCard);
