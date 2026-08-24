import { useMemo } from 'react';
import { Link } from '@inertiajs/react';
import { motion, useReducedMotion } from 'framer-motion';
import userphoto from '../../../../assets/siteicon.png';
import discoveryLink, { DISCOVERY_SOURCE } from '@/lib/discoveryLink';
import LiveUnlocks from './LiveUnlocks';
// ⚠️ The price floor is read, never typed. It mirrors `Helpers::priceWithinLimits()`
// and is enforced in every module's store/edit validation, so a literal here is a
// figure in an advert that can silently disagree with what checkout accepts.
import { PRICE_LIMITS, price } from '@/constants/creatorBonuses';

/**
 * DiscoverHero — the signature of the Discover page.
 *
 * The page is about people, so the hero shows people: a live wall of real
 * creator faces drifting in alternating columns beside the headline. Everything
 * is built from data the page already receives — no new backend, no new request.
 * The wall is desktop-only; a phone gets the headline, the CTA and the ticker.
 *
 * ⚠️ THE WALL IS THE BANNER'S DESIGN AND STAYS (client direction, 24 Aug 2026).
 * The auto-rotating spotlight was tried here and moved OUT, to its own band
 * directly under the banner — it still sells to a visitor who has done nothing
 * but arrive, without taking the banner's artwork away.
 */
export default function DiscoverHero({
    featuredCreators = [],
    newVerifiedCreators = [],
    topEarners = [],
    featuredWishes = [],
    liveUnlocks = [],
    onExplore,
}) {
    const reduce = useReducedMotion();

    // Deduped creator pool — its size is the "N creators" figure in the eyebrow.
    const faces = useMemo(() => {
        const seen = new Set();
        const out = [];
        [...(featuredCreators || []), ...(newVerifiedCreators || []), ...(topEarners || [])].forEach((c) => {
            if (!c?.username || seen.has(c.username)) return;
            seen.add(c.username);
            out.push({
                username: c.username,
                name: c.name,
                img: c.avatar_url || c.cover_url || userphoto,
                hot: Number(c.clicks_24h) > 0,
            });
        });
        return out;
    }, [featuredCreators, newVerifiedCreators, topEarners]);

    // Three columns, each long enough to loop seamlessly.
    const columns = useMemo(() => {
        if (faces.length < 3) return [];
        const cols = [[], [], []];
        faces.forEach((f, i) => cols[i % 3].push(f));
        return cols
            .filter((c) => c.length)
            .map((c) => {
                const filled = [...c];
 while (filled.length < 4) filled.push(...c); // never a short column
 return [...filled, ...filled]; // duplicate = seamless loop
            });
    }, [faces]);

    /*
     * 🚨 Every ticker row is Spenny Piggy putting a creator in front of a
     * supporter, so each one carries its own Discovery source. `trending` for
     * the two creator rails (there is no reserved "top earners" key and
     * `trending` is the closest of the twelve) and `new-wishes` for the wish
     * rail. An untagged row here would be invisible in the report for ever.
     */
    const ticker = useMemo(() => {
        const out = [];
        // ⚠️ No "top earner" rows. How much a creator EARNED is our fact, not
        // the visitor's — and a leaderboard of takings reads as a plea rather
        // than a shop. What a supporter can act on is what is on sale.
        (featuredCreators || []).slice(0, 10).forEach((c) => {
            if (!c?.username) return;
            const count = Number(c.items_count) || 0;
            out.push({ k: `v-${c.id}`, mark: '↗', to: discoveryLink(c.username, DISCOVERY_SOURCE.TRENDING),
                text: count
                    ? <><b className="text-white">@{c.username}</b> · {count} to unlock</>
                    : c.clicks_24h
                        ? <><b className="text-white">@{c.username}</b> · {c.clicks_24h} views today</>
                        : <><b className="text-white">@{c.username}</b> trending now</> });
        });
        (featuredWishes || []).slice(0, 5).forEach((w) => {
            const title = w?.wishname || w?.title || w?.name;
            const uname = w?.user?.username;
            if (!title || !uname) return;
            out.push({ k: `w-${w.id}`, mark: '✦', to: discoveryLink(uname, DISCOVERY_SOURCE.NEW_WISHES),
                text: <><b className="text-white">@{uname}</b> · {String(title).slice(0, 28)}</> });
        });
        return out.sort((a, b) => (a.k.charCodeAt(0) + a.k.length) - (b.k.charCodeAt(0) + b.k.length));
    }, [featuredCreators, featuredWishes]);

    const loop = ticker.length ? [...ticker, ...ticker] : [];
    const creatorCount = faces.length;
    const wishCount = featuredWishes?.length || 0;

    return (
        <section className="container max-w-7xl mx-auto px-4 pt-6 pb-2 md:pt-8">
 <div className="relative overflow-hidden rounded-box bg-[#0E0E12] ">
                {/* ambient light, kept behind everything */}
                <div className="pointer-events-none absolute -left-24 top-0 h-[380px] w-[380px] rounded-full bg-[#FF007F]/20 blur-[120px]" aria-hidden />
                <div className="pointer-events-none absolute bottom-0 left-1/3 h-56 w-56 rounded-full bg-[#A2E4B8]/10 blur-[100px]" aria-hidden />

                <div className="relative flex">
                    {/* ── Left: the pitch ───────────────────────────── */}
                    <div className="relative z-10 w-full lg:w-[58%] px-6 py-10 md:px-10 md:py-14">
 <div className="inline-flex items-center gap-2 rounded-box-sm border border-white/10 bg-white/[0.04] px-3 py-1.5 backdrop-blur">
                            <span className="relative flex h-2 w-2">
                                {!reduce && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FF007F] opacity-70" />}
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FF007F]" />
                            </span>
 <span className="text-[12px] font-semibold uppercase tracking-[0.2em] text-white/70">
                                {creatorCount > 0 ? `${creatorCount} creators live` : 'Happening now'}
                            </span>
                        </div>

                        {/* 🚨 THE HEADLINE STATES THE TRANSACTION, NOT A MOOD.
                            "Find your next obsession" tells a first-time visitor
                            nothing about what this site does, what it costs or
                            what arrives afterwards — which is the whole question
                            standing between them and a first purchase. */}
                        <h1 className="mt-6 font-anton uppercase leading-[0.92] tracking-tight text-white text-[34px] sm:text-[44px] md:text-[56px]">
                            Buy straight from
                            {/* 🚨 `text-transparent` + `bg-clip-text` means the glyphs are
                                painted by the BACKGROUND. Where that background does not
                                render — Windows High Contrast / forced-colors, and print —
                                the text is transparent on transparent, i.e. INVISIBLE, and
                                this is half of the page's only `<h1>`. The homepage `<h1>`
                                already carries these two fallbacks; this one did not. */}
                            <span className="mt-1 block bg-gradient-to-r from-[#FF007F] via-[#FF4FA8] to-[#FF007F] bg-clip-text text-transparent forced-colors:bg-none forced-colors:text-[CanvasText] print:bg-none print:text-black">
                                the creator
                            </span>
                        </h1>

                        {/* a rule, then the promise — structure instead of a second paragraph */}
                        <div className="mt-6 flex max-w-md items-start gap-4">
                            <span className="mt-2.5 h-px w-10 shrink-0 bg-[#FF007F]" aria-hidden />
                            <p className="text-[15px] leading-relaxed text-white/60">
                                Pick something they made, pay once, and it unlocks straight away. From {price(PRICE_LIMITS.min)}.
                            </p>
                        </div>

                        <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
                            <button
                                onClick={onExplore}
 className="group inline-flex min-h-[44px] items-center gap-2 rounded-box-sm bg-[#FF007F] px-6 text-sm font-bold text-black transition-all hover:brightness-110 "
                            >
                                See what's for sale
                                <span className="transition-transform group-hover:translate-x-0.5">→</span>
                            </button>
                            {(creatorCount > 0 || wishCount > 0) && (
 <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/60">
                                    {creatorCount > 0 && `${creatorCount} creators`}
                                    {creatorCount > 0 && wishCount > 0 && ' · '}
                                    {wishCount > 0 && `${wishCount} things to unlock`}
                                </p>
                            )}
                        </div>

                    </div>

                    {/* ── Right: the live creator wall (desktop only) ── */}
                    {columns.length === 3 && (
                        <div
                            className="pointer-events-none absolute inset-y-0 right-0 hidden w-[46%] lg:block [mask-image:linear-gradient(to_bottom,transparent,black_18%,black_82%,transparent)]"
                            aria-hidden
                        >
                            {/* fade the wall into the panel on its left edge */}
                            <div className="absolute inset-y-0 left-0 z-10 w-32 bg-gradient-to-r from-[#0E0E12] to-transparent" />
                            <div className="flex h-full gap-3 px-3">
                                {columns.map((col, ci) => (
                                    <FaceColumn key={ci} col={col} up={ci % 2 === 0} reduce={reduce} index={ci} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Ticker ──────────────────────────────────────
                    Real purchases when there are any; the trending lines only
                    as a fallback. ⚠️ Never both — two scrolling strips under one
                    headline is noise, and the synthetic one undercuts the real
                    one by sitting next to it. */}
                {liveUnlocks.length > 0 && <LiveUnlocks initial={liveUnlocks} />}
                {liveUnlocks.length === 0 && loop.length > 0 && (
                    <div className="relative z-10 border-t border-white/[0.06] bg-[#0B0B0F]/80 backdrop-blur">
                        <div className="flex items-stretch">
 <div className="hidden shrink-0 items-center gap-1.5 px-5 text-[12px] font-semibold uppercase tracking-[0.2em] text-[#FF007F] sm:flex">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#FF007F]" /> Live
                            </div>
                            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#0B0B0F] to-transparent" aria-hidden />
                            <div className="relative flex-1 overflow-hidden py-3">
                                {reduce ? (
                                    <div className="flex gap-10 overflow-x-auto px-4 no-scrollbar">
                                        {ticker.map((e) => <TickerItem key={e.k} e={e} />)}
                                    </div>
                                ) : (
                                    <motion.div
                                        className="flex w-max gap-10 px-4"
                                        animate={{ x: ['0%', '-50%'] }}
                                        transition={{ duration: Math.max(22, loop.length * 2.6), ease: 'linear', repeat: Infinity }}
                                    >
                                        {loop.map((e, i) => <TickerItem key={`${e.k}-${i}`} e={e} />)}
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}

/** One drifting column of creator faces. Slow, and opposite to its neighbours. */
function FaceColumn({ col, up, reduce, index }) {
    const tiles = reduce ? col.slice(0, 3) : col;

    const inner = tiles.map((f, i) => (
        <div
            key={`${f.username}-${i}`}
 className="relative mb-3 overflow-hidden rounded-box-sm border border-white/10 bg-[#16161C]"
        >
            <img
                src={f.img}
                alt=""
                loading="lazy"
                decoding="async"
                className="aspect-[4/5] w-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
            {/* the handle is the point of the tile — give it a real chip so it
                stays legible on a bright photo, not grey text on grey pixels */}
            <span
 className={`absolute bottom-2 left-2 right-2 flex items-center gap-1.5 truncate rounded-box-sm border px-2 py-1 backdrop-blur-md ${
                    f.hot
 ? 'border-[#FF007F]/60 bg-[#FF007F]/20 '
                        : 'border-white/15 bg-black/55'
                }`}
            >
 {f.hot && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF007F] " />}
 <span className="truncate text-[12px] font-bold tracking-wide text-white">@{f.username}</span>
            </span>
        </div>
    ));

    if (reduce) {
        return <div className="flex-1 pt-6">{inner}</div>;
    }

    return (
        <div className="flex-1 overflow-hidden">
            <motion.div
                animate={{ y: up ? ['0%', '-50%'] : ['-50%', '0%'] }}
                transition={{ duration: 46 + index * 6, ease: 'linear', repeat: Infinity }}
            >
                {inner}
            </motion.div>
        </div>
    );
}

function TickerItem({ e }) {
    return (
 <Link href={e.to} className="flex shrink-0 items-center gap-2 whitespace-nowrap text-sm text-white/60 transition-colors hover:text-white/90">
            <span className="text-[#FF007F]">{e.mark}</span>
            <span>{e.text}</span>
        </Link>
    );
}
