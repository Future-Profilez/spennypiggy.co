import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from '@inertiajs/react';
import { motion, useReducedMotion } from 'framer-motion';
import discoveryLink, { DISCOVERY_SOURCE } from '@/lib/discoveryLink';
import PriceFormat from '@/includes/PriceFormat';
import VerifiedBadge from '@/Components/VerifiedBadge';

/**
 * The spotlight — creators put in front of a visitor who has done nothing but
 * arrive, changing on their own every few seconds.
 *
 * 🚨 IT SITS IN ITS OWN BAND UNDER THE BANNER, NEVER INSIDE IT (client
 * direction, 24 Aug 2026). It was built into the hero's right-hand side and took
 * the drifting face wall away; the wall is the banner's design.
 *
 * 🚨 THREE CARDS, NOT ONE WIDE BAND (client direction, 24 Aug 2026). A single
 * full-width strip on a 1440px screen is one creator's name and a mile of empty
 * dark. The row shows up to three, and the whole set shifts through the pool, so
 * a wide screen carries more of the catalogue rather than more emptiness.
 *
 * ⚠️ `prefers-reduced-motion` stops the rotation entirely — it does not merely
 * slow it. A set that advances by itself is exactly what that setting is asking
 * us not to do, so those visitors get the first three, statically.
 */

const ROTATE_MS = 6000;
const VISIBLE = 3;

export default function SpotlightRotator({ creators = [], className = '' }) {
    const reduce = useReducedMotion();
    const { formatMultiPrice, calculateTotalSupporterPays } = PriceFormat();
    const [index, setIndex] = useState(0);
    const [paused, setPaused] = useState(false);
    const timer = useRef(null);

    // Only creators with something to show AND something to sell — a spotlight
    // on an empty profile is an advert for a dead end.
    const items = useMemo(
        () => (creators || []).filter((c) => c?.username && (c.price_from || (c.top_wish_images || []).length)).slice(0, 9),
        [creators],
    );

    useEffect(() => {
        if (reduce || paused || items.length <= VISIBLE) return undefined;
        timer.current = setInterval(() => setIndex((i) => (i + 1) % items.length), ROTATE_MS);
        return () => clearInterval(timer.current);
    }, [reduce, paused, items.length]);

    if (!items.length) return null;

    const visible = Array.from({ length: Math.min(VISIBLE, items.length) }, (_, i) => items[(index + i) % items.length]);
    const rotates = items.length > VISIBLE && !reduce;

    const priceFor = (c) => {
        const listed = parseFloat(c.price_from ?? 0) || 0;
        if (!listed) return null;
        const currency = c.price_from_currency || 'GBP';
        // Same fee-inclusive rule as every other price a logged-out visitor sees.
        const pays = calculateTotalSupporterPays(
            listed * (1 + (c.vat_amount_percentage || 0) / 100),
            currency,
            0,
            c.id,
        )?.total_supporter_pays ?? listed;

        return formatMultiPrice(pays, currency);
    };

    return (
        <section
            className={className}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
        >
            <div className="mb-3 flex items-center justify-between gap-4">
                {/* Same kicker treatment as every rail below it — a second,
                    quieter style for the same job is how a page starts looking
                    assembled from parts. */}
                <span className="inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.18em] text-[#FF007F]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#FF007F]" />
                    In the spotlight
                    <span className="ml-1 rounded-box-xs bg-black/[0.06] px-2 py-0.5 text-[12px] font-bold text-black/60">
                        {items.length}
                    </span>
                </span>
                {rotates && (
                    <span className="h-[3px] w-20 overflow-hidden rounded-full bg-black/15" aria-hidden>
                        {!paused && (
                            <motion.span
                                key={index}
                                className="block h-full bg-[#FF007F]"
                                initial={{ width: '0%' }}
                                animate={{ width: '100%' }}
                                transition={{ duration: ROTATE_MS / 1000, ease: 'linear' }}
                            />
                        )}
                    </span>
                )}
            </div>

            {/* ⚠️ Columns follow the COUNT. A fixed three-column grid with two
                creators in the pool leaves a third of the row empty, which
                reads as a card that failed to load. */}
            <div className={`grid gap-3 sm:grid-cols-2 ${visible.length >= 3 ? 'lg:grid-cols-3' : ''}`}>
                {visible.map((c, i) => {
                    const image = (c.top_wish_images || [])[0] || c.cover_url || c.avatar_url;
                    const price = priceFor(c);
                    const count = Number(c.items_count) || 0;

                    return (
                        <Link
                            key={`${c.username}-${i}`}
                            href={discoveryLink(c.username, DISCOVERY_SOURCE.SPOTLIGHT)}
                            /* The second and third cards are extra width, not
                               extra scrolling: a phone gets one. */
                            className={`group flex h-[96px] overflow-hidden rounded-box-sm border-black bg-[#16161C] transition-colors duration-200 hover:border-[#FF007F] sm:h-[104px] ${
                                i === 1 ? 'hidden sm:flex' : ''
                            } ${i === 2 ? 'hidden lg:flex' : ''}`}
                        >
                            <div className="relative w-[96px] shrink-0 overflow-hidden border-r border-white/10 bg-[#0E0E12] sm:w-[112px]">
                                <motion.img
                                    key={`${c.username}-img`}
                                    src={image}
                                    alt=""
                                    loading="lazy"
                                    decoding="async"
                                    initial={reduce ? false : { opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.4 }}
                                    className="h-full w-full object-cover transition-[filter] duration-500 group-hover:brightness-[1.06]"
                                />
                            </div>

                            <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 px-3.5 sm:px-4">
                                <p className="flex items-center gap-1 truncate text-[14px] font-bold leading-tight text-white sm:text-[15px]">
                                    <span className="truncate">{c.name}</span>
                                    <VerifiedBadge user={c} size="sm" />
                                </p>
                                <div className="flex min-w-0 items-center gap-2">
                                    {price && (
                                        <span className="shrink-0 rounded-box-xs bg-[#E6EA7B] px-2 py-0.5 text-[12px] font-bold text-black">
                                            From {price}
                                        </span>
                                    )}
                                    <span className="truncate text-[12px] text-white/45">
                                        {count > 0 ? `${count} ${count === 1 ? 'thing' : 'things'} to unlock` : `@${c.username}`}
                                    </span>
                                </div>
                            </div>

                            <span className="flex shrink-0 items-center pe-3.5 text-[12px] font-bold text-[#FF007F] transition-opacity group-hover:opacity-70 sm:pe-4">
                                See inside →
                            </span>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}
