import { useEffect, useMemo, useRef } from 'react';
import Wishlistbox from '../../../wishlist/Wishlistbox';
import CreatorCard from './CreatorCard';
import Bill from '../../bills/Bill';
import Membership from '../../membership/Membership';
import ProfileProduct from '../../shop/ProfileProduct';
import TaskItem from '@/Components/TaskItem';
import { DISCOVERY_SOURCE } from '@/lib/discoveryLink';
import BoardCard from './BoardCard';
import SectionShelf from './SectionShelf';

/**
 * 🚨 Every card in this grid is a Discovery result, so every creator link in it
 * is SP-generated traffic and carries `search-recs` — the reserved key for a
 * creator surfaced by Discover's search and result grid. A surface that is not
 * tagged is invisible for ever; there is no backfill.
 *
 * ⚠️ Membership and Task cards render no creator-profile link (they go to
 * checkout and to /task/{uuid}), so there is nothing on them to tag.
 *
 * 🚨 THE COUNT IN THE HEADING IS THE REAL TOTAL, not the length of this page.
 * The heading used to read "Showing 24 results" on page one of forty, and again
 * on page two — a number a supporter cannot use to decide whether to keep
 * looking.
 */
export default function ResultsGrid({
    auth,
    global_currency,
    results,
    mode,
    heading,
    total = 0,
    hasMore = false,
    loading = false,
    onLoadMore,
    onClearFilters,
}) {
    const renderedItems = useMemo(() => {
        return (results || []).map((row, index) => {
            /*
             * 🚨 A MIXED ROW CARRIES ITS OWN MODE. The board is one feed of things
             * to buy across five modules, so the grid reads the mode off the row
             * rather than off the grid — every card keeps the exact payload it
             * already expected, and nothing here re-describes a listing.
             */
            const isMixed = mode === 'mixed';
            const itemMode = isMixed ? row.mode : mode;
            const item = isMixed ? row.item : row;

            /* 🚨 The mixed board speaks ONE language — see BoardCard. A
               chip-filtered view (Bills, Memberships…) still gets that module's
               own rich card, which is right when every card on screen is the
               same kind of thing. */
            if (isMixed) {
                return (
                    <div key={row.card.id} className="h-full">
                        <BoardCard card={row.card} auth={auth} />
                    </div>
                );
            }

            let card;
            switch (itemMode) {
                case 'creator':
                    card = <CreatorCard item={item} auth={auth} discoverySource={DISCOVERY_SOURCE.SEARCH_RECS} />;
                    break;
                case 'wish':
                    card = (
                        <Wishlistbox
                            classes=""
                            imagesize="max-h-[150px]"
                            currency={global_currency}
                            /* 🚨 `IsloggedIn` ON THESE CARDS MEANS "THE CREATOR IS
                               LOOKING AT THEIR OWN LISTING", NOT "a user is signed
                               in". Truthy swaps the buyer's Unlock button for the
                               owner's Share/Edit one and shows the pre-fee price.
                               Discover is never the owner's view — it is always
                               false here. */
                            IsloggedIn={false}
                            auth={auth?.user}
                            itemid={item?.id}
                            itm={item}
                            trackClick={true}
                            discoverySource={DISCOVERY_SOURCE.SEARCH_RECS}
                        />
                    );
                    break;
                case 'bill':
                    card = <Bill classes="" itm={item} discoverySource={DISCOVERY_SOURCE.SEARCH_RECS} />;
                    break;
                case 'membership':
                    card = <Membership item={item} />;
                    break;
                case 'shop':
                    card = <ProfileProduct item={item} discoverySource={DISCOVERY_SOURCE.SEARCH_RECS} />;
                    break;
                case 'task':
                    // Same rule as the wish card above: false = the buyer's view.
                    card = <TaskItem task={item} IsloggedIn={false} profileUser={item.user} />;
                    break;
                default:
                    card = null;
            }

            /* 🚨 NO SAVE BUTTON HERE ANY MORE. This grid used to overlay its own
               heart on every card, which double-rendered the moment a card carried
               one of its own — `wish` already did, via Wishlistbox, and every other
               mode does now (`Bill` wraps BillItem, `Membership` wraps
               MembershipItem, `ProfileProduct` wraps ShopCard, `task` is TaskItem
               directly). The heart belongs to the card, so it appears wherever that
               card is rendered — Discover, the carousel, and a creator's profile —
               instead of only on the one grid that remembered to add it. */
            return (
                /* ⚠️ `[&>*]:h-full` — the CELL was already full height and the
                   card inside it was not, so a mixed board of five different card
                   components came out ragged: every row ended at a different
                   place and the grid read as broken rather than as varied. */
                <div
                    key={`${itemMode}-${item.id || index}`}
                    className={`relative h-full [&>*]:h-full ${itemMode === 'task' ? 'col-span-full [&>*]:h-auto' : ''}`}
                >
                    {card}
                </div>
            );
        });
    }, [results, mode, auth, global_currency]);

    const shown = results?.length || 0;

    /*
     * Infinite scroll, with the button kept.
     *
     * ⚠️ The observer fires ONCE PER PAGE: `armedFor` records the count it last
     * loaded at, so a sentinel that stays on screen (a short page, a fast
     * connection) cannot spend the whole result set in one scroll. The button
     * stays visible because a sentinel is invisible to a keyboard.
     */
    const sentinel = useRef(null);
    const armedFor = useRef(0);

    useEffect(() => {
        const el = sentinel.current;
        if (!el || !hasMore || loading) return undefined;

        const io = new IntersectionObserver((entries) => {
            if (!entries[0]?.isIntersecting) return;
            if (armedFor.current === shown) return;
            armedFor.current = shown;
            onLoadMore?.();
        }, { rootMargin: '400px' });

        io.observe(el);
        return () => io.disconnect();
    }, [hasMore, loading, shown, onLoadMore]);

    if (!shown) {
        return (
            <div className="flex flex-col items-center justify-center rounded-box border border-dashed border-black/15 bg-white py-16 text-center">
                <h3 className="font-anton text-xl uppercase text-black">Nothing here yet</h3>
                <p className="mt-2 max-w-md text-black/60">Nothing matches these filters. Clear them to see everyone.</p>
                {/* ⚠️ This button used to call window.location.reload(), which
                    reloaded the page WITH the filters still applied — it looked
                    like a clear and cleared nothing. */}
                <button
                    onClick={onClearFilters}
                    className="mt-6 inline-flex min-h-[44px] items-center rounded-box-sm bg-[#FF007F] px-6 font-bold text-black transition-all hover:brightness-110 active:brightness-95"
                >
                    Clear filters
                </button>
            </div>
        );
    }

    return (
        <div className="mt-0">
            {heading && (
                <SectionShelf
                    title={heading}
                    /* The tag reads "12 of 57" — how much of the shelf you have
                       seen, which is also what decides whether Load more shows. */
                    count={total > 0 ? `${shown} of ${total}` : shown}
                />
            )}

            {/* 5-up on a wide screen: at 1536px a 4-column grid leaves cards
                the width of a poster with nothing beside them. */}
            <div className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {renderedItems}
            </div>

            {hasMore && (
                <div ref={sentinel} className="mt-8 flex justify-center">
                    <button
                        onClick={onLoadMore}
                        disabled={loading}
                        className="inline-flex min-h-[48px] items-center rounded-box-sm border-black bg-white px-8 font-bold text-black transition-all hover:brightness-110 active:brightness-95 disabled:opacity-50"
                    >
                        {loading ? 'Loading…' : 'Load more'}
                    </button>
                </div>
            )}
        </div>
    );
}
