import { useEffect, useState } from 'react';
import { Link } from '@inertiajs/react';
import { route } from 'ziggy-js';
import Popup from '@/Components/Popup';
import PriceFormat from '@/includes/PriceFormat';
import discoveryLink, { DISCOVERY_SOURCE } from '@/lib/discoveryLink';

/**
 * Quick view — everything one creator sells, without leaving Discover.
 *
 * 🚨 IT SHOWS THE SHELF; IT DOES NOT TAKE THE MONEY. Every row links to that
 * item's EXISTING checkout (`?item={uuid}` on the profile, `/task/{uuid}` for a
 * task). Nothing here computes a charge, a fee, a tax or a total — a second
 * place that prices a purchase is a second place for the two to disagree.
 *
 * 🚨 Prices are grossed up with the same PriceFormat helper as every other
 * buyer-facing price. `price` off the wire is the LISTED price.
 *
 * ⚠️ Fetched on FIRST OPEN, not on render. A grid of 24 cards must not fire 24
 * requests for modals nobody opened.
 */
export default function CreatorQuickView({ username, open, onClose }) {
    const { formatMultiPrice, calculateTotalSupporterPays } = PriceFormat();
    const [data, setData] = useState(null);
    const [state, setState] = useState('idle');

    useEffect(() => {
        if (!open || state !== 'idle' || !window.axios) return;
        setState('loading');
        window.axios
            .get(route('discover.creator.preview', { username }))
            .then((r) => {
                setData(r.data || null);
                setState('done');
            })
            .catch(() => setState('failed'));
    }, [open, state, username]);

    const items = data?.items || [];
    const creator = data?.creator;

    const priceOf = (item) => {
        const listed = parseFloat(item.price ?? 0) || 0;
        if (!listed) return null;
        const pays = calculateTotalSupporterPays(
            listed * (1 + (creator?.vat_amount_percentage || 0) / 100),
            item.currency || 'GBP',
            0,
            creator?.id,
        )?.total_supporter_pays ?? listed;

        return formatMultiPrice(pays, item.currency || 'GBP');
    };

    return (
        <Popup action={open} onHide={onClose} size="max-w-2xl">
            <div className="p-1">
                <h2 className="font-anton text-xl uppercase text-black">
                    {creator ? `What ${creator.name} sells` : 'Loading…'}
                </h2>
                <p className="mt-1 text-[13px] text-black/55">
                    Prices include platform and payment processing fees.
                </p>

                {state === 'failed' && (
                    <p className="mt-6 text-[14px] text-black/70">
                        That didn’t load. Open the profile to see everything.
                    </p>
                )}

                {state === 'loading' && (
                    <div className="mt-5 space-y-2">
                        {Array(3).fill(0).map((_, i) => (
                            <div key={i} className="h-[72px] animate-pulse rounded-box-sm bg-black/5" />
                        ))}
                    </div>
                )}

                {state === 'done' && items.length === 0 && (
                    <p className="mt-6 text-[14px] text-black/70">Nothing listed yet.</p>
                )}

                <div className="mt-5 space-y-2">
                    {items.map((item) => (
                        <a
                            key={item.id}
                            href={item.href}
                            className="group flex items-center gap-3 rounded-box-sm border border-black/10 bg-white p-2 transition-colors hover:border-black"
                        >
                            <span className="h-14 w-14 shrink-0 overflow-hidden rounded-box-xs bg-black/[0.06]">
                                {item.image && (
                                    <img src={item.image} alt="" loading="lazy" className="h-full w-full object-cover" />
                                )}
                            </span>

                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-[14px] font-bold text-black">{item.title}</span>
                                <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-black/45">
                                    {item.label}
                                </span>
                            </span>

                            {priceOf(item) && (
                                <span className="shrink-0 rounded-box-xs bg-[#E6EA7B] px-2 py-1 text-[13px] font-bold text-black">
                                    {priceOf(item)}
                                </span>
                            )}

                            <span className="hidden shrink-0 text-[13px] font-bold text-[#FF007F] transition-opacity group-hover:opacity-70 sm:inline">
                                Unlock →
                            </span>
                        </a>
                    ))}
                </div>

                {creator && (
                    <Link
                        href={discoveryLink(creator.username, DISCOVERY_SOURCE.SEARCH_RECS)}
                        className="mt-5 inline-flex min-h-[44px] w-full items-center justify-center rounded-box-sm bg-[#FF007F] px-6 font-bold text-black transition-all hover:brightness-110 active:brightness-95"
                    >
                        See @{creator.username}’s profile
                    </Link>
                )}
            </div>
        </Popup>
    );
}
