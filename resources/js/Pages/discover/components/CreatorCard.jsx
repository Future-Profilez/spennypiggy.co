import { memo, useState } from 'react';
import discoveryLink, { DISCOVERY_SOURCE } from "@/lib/discoveryLink";
import { Link } from '@inertiajs/react';
import wishlistbannerimg from "../../../../assets/img/wishlistbannerimg.png";
import Avatar from '../../../includes/Avatar';
import PriceFormat from "@/includes/PriceFormat";
import { trackSearchClick } from "@/includes/Analytics";
import { trackClientEvent } from '@/lib/analytics';
import { RiFireLine } from 'react-icons/ri';
import VerifiedBadge from '@/Components/VerifiedBadge';
import CreatorQuickView from './CreatorQuickView';
import { rememberCreator } from './RecentlyViewed';

/**
 * CreatorCard — a Discover listing tile.
 *
 * 🚨 A card that only carries a face and a handle asks the visitor to click
 * through to find out whether there is anything here they can afford. This one
 * answers the three questions a supporter actually has before they click:
 * what does it cost to buy in, what shape is the purchase, and has anyone
 * bought before.
 *
 * 🚨 THE PRICE PLATE IS FEE-INCLUSIVE FOR A LOGGED-OUT VISITOR, exactly like
 * the wish card (`wishlist/Wishlistbox.jsx`). `price_from` off the wire is the
 * LISTED price; showing it raw would advertise a lower number on Discover than
 * the checkout charges, on the one surface whose whole job is the first
 * purchase. Both branches go through PriceFormat — never format it inline.
 *
 * @param {string} [discoverySource] which SP surface put this creator here.
 *   Defaults to `search-recs` — the reserved key for Discover's search and
 *   result grid. A curated rail passes its own key so the report can tell the
 *   collections apart.
 */

const UNLOCK_LABELS = {
    instant: 'Instant unlock',
    monthly: 'Monthly',
    custom: 'Made for you',
};

function CreatorCard({ auth, item, discoverySource = DISCOVERY_SOURCE.SEARCH_RECS }) {
    const { formatMultiPrice, calculateTotalSupporterPays } = PriceFormat();
    const cover = item.cover_url || wishlistbannerimg;
    const tiles = (item.top_wish_images || []).filter(Boolean).slice(0, 3);

    const listed = parseFloat(item.price_from ?? 0) || 0;
    const currency = item.price_from_currency || 'GBP';
    const supporterPays = listed
        ? (calculateTotalSupporterPays(
              listed * (1 + (item.vat_amount_percentage || 0) / 100),
              currency,
              0,
              item.id,
          )?.total_supporter_pays ?? listed)
        : 0;
    /* 🚨 ALWAYS the fee-inclusive price, signed in or not. Discover is a
       buyer's surface — the only person who should see a bare listed price is
       the creator on their own listing, and that view does not exist here. A
       cheaper number than the checkout charges is the one price bug that costs
       trust. */
    const priceFrom = listed ? formatMultiPrice(supporterPays, currency) : null;

    const [quickView, setQuickView] = useState(undefined);
    /* Popup only reacts to a literal true, so the flag is cleared back to
       undefined a moment later — the same contract the wish card's basket uses,
       or a second click on an already-closed modal would do nothing. */
    const openQuickView = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setQuickView(true);
        // No username, no item name — the funnel needs the ACTION, not the person.
        try { trackClientEvent('discover_quick_view', {}); } catch (err) { /* never break a click */ }
        setTimeout(() => setQuickView(undefined), 1000);
    };

    const unlocks = Array.isArray(item.unlock_types) ? item.unlock_types : [];
    const itemsCount = Number(item.items_count) || 0;
    const supporters = Number(item.supporter_count) || 0;

    return (
        <>
        <Link
            /* Discovery-tagged: a creator card on Discover is Spenny Piggy
               putting this creator in front of someone, so the visit is
               SP-generated. The key names WHICH surface — the caller's, or
               `search-recs` for the search and result grid. */
            href={discoveryLink(item.username, discoverySource)}
            onClick={() => {
                trackSearchClick(item.id, item.username);
                // Device-local only — see RecentlyViewed.
                rememberCreator(item);
            }}
            className="group flex h-full flex-col overflow-hidden rounded-box border-black bg-white transition-colors duration-200 hover:border-[#FF007F]"
        >
            {/* 🚨 THE CARD SHOWS THE GOODS, NOT THE SHOPFRONT. A cover photo
                tells a visitor nothing about what is for sale, and this is a
                shop: when the creator has listings, their own card thumbnails
                are the image. The cover is the fallback for a creator whose
                listings carry no picture yet.

                ⚠️ `top_wish_images` is `perma_link` — the PUBLIC card thumbnail.
                Never the reward/content file: that is the paid content itself
                and is signed for a buyer. */}
            <div className="relative aspect-[21/9] overflow-hidden bg-[#0E0E12]">
                {tiles.length >= 2 ? (
                    <div className={`grid h-full w-full gap-px ${tiles.length >= 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                        {tiles.map((src, i) => (
                            <img
                                key={`${src}-${i}`}
                                src={src}
                                alt=""
                                loading="lazy"
                                decoding="async"
                                className="h-full w-full object-cover transition-[filter,opacity] duration-500 group-hover:brightness-[1.08]"
                            />
                        ))}
                    </div>
                ) : (
                    <img
                        src={tiles[0] || cover}
                        alt={item.name}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition-[filter,opacity] duration-500 group-hover:brightness-[1.08]"
                    />
                )}
                {/* ⚠️ Real now. This badge could never appear before — every
                    creator payload left the service with `clicks_24h => 0`
                    hardcoded. It reads the clicks Discover itself records. */}
                {item.clicks_24h > 0 && (
                    <div className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-full border border-black/15 bg-white/90 px-2 py-0.5 text-[12px] font-semibold text-black backdrop-blur">
                        <RiFireLine size={12} className="text-[#FF007F]" /> {item.clicks_24h}
                    </div>
                )}
            </div>

            <div className="flex flex-1 flex-col p-3">
                <div className="flex items-center">
                    <div className="overflow-hidden rounded-box-sm max-w-[56px] border-black">
                        <Avatar
                            auth={auth}
                            user={item}
                            role={item.role}
                            hidename={true}
                            profile_status_lock={item.profile_status_lock == 2 ? true : false}
                            src={item.avatar_url}
                            username={item.username || ""}
                            nolink={true}
                            imgclass="!w-full !h-12 object-cover !border-0" />
                    </div>
                    <div className="ps-3 min-w-0">
                        <h3 className="flex items-center gap-1 truncate text-[16px] font-bold leading-tight text-black">
                            <span className="truncate">{item.name}</span>
                            <VerifiedBadge user={item} size="sm" />
                        </h3>
                        <p className="truncate text-sm font-medium text-black/50">@{item.username}</p>
                    </div>
                </div>

                {/* The buy-in. A creator with nothing listed says so plainly
                    rather than showing an empty plate — "nothing yet" is a fact
                    a supporter can act on, a blank is not. */}
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {priceFrom ? (
                        /* 🚨 The shortest route to a purchase on this page. The
                           card links to the profile; the plate opens the shelf
                           in place, because a visitor who is ready to buy should
                           not have to load a profile to find out what for. */
                        <button
                            type="button"
                            onClick={openQuickView}
                            aria-label={`See what ${item.name} sells`}
                            className="inline-flex items-center gap-1 rounded-box-xs bg-[#E6EA7B] px-2 py-1 text-[13px] font-bold text-black transition-all hover:brightness-105 active:brightness-95"
                        >
                            From {priceFrom}
                            <span className="text-[11px] font-black">▸</span>
                        </button>
                    ) : (
                        <span className="rounded-box-xs bg-black/[0.06] px-2 py-1 text-[12px] font-semibold text-black/50">
                            Nothing listed yet
                        </span>
                    )}
                    {unlocks.slice(0, 2).map((u) => (
                        <span key={u} className="rounded-box-xs border border-black/15 px-2 py-1 text-[12px] font-semibold text-black/70">
                            {UNLOCK_LABELS[u] || u}
                        </span>
                    ))}
                </div>

                {(itemsCount > 0 || supporters > 0) && (
                    <p className="mt-2 text-[12px] font-medium text-black/50">
                        {itemsCount > 0 && `${itemsCount} ${itemsCount === 1 ? 'listing' : 'listings'}`}
                        {itemsCount > 0 && supporters > 0 && ' · '}
                        {supporters > 0 && `${supporters} ${supporters === 1 ? 'supporter' : 'supporters'}`}
                    </p>
                )}

                {/* Fee disclosure, same rule as the wish card: the price a
                    logged-out visitor sees IS the grossed-up one, so it says so. */}
                {priceFrom && (
                    <p className="mt-1 text-[11px] font-normal leading-tight text-black/40">*Fees included</p>
                )}
            </div>
        </Link>

        {/* ⚠️ Outside the Link on purpose: nested inside it, every click in the
            modal would also follow the card's href. */}
        <CreatorQuickView username={item.username} open={quickView} onClose={() => setQuickView(false)} />
        </>
    );
}

export default memo(CreatorCard);
