import { useMemo } from 'react';
import { Link } from '@inertiajs/react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * DiscoverHero — premium dark hero. A pink-glow headline over a live "Happening
 * now" ticker built entirely from data the page already receives (no new backend).
 * The ticker + glow are the signature: quiet, high-end, but alive.
 */
export default function DiscoverHero({
    featuredCreators = [],
    newVerifiedCreators = [],
    topEarners = [],
    featuredWishes = [],
    onExplore,
}) {
    const reduce = useReducedMotion();

    const events = useMemo(() => {
        const out = [];
        (topEarners || []).slice(0, 6).forEach((c) => {
            if (!c?.username) return;
            out.push({ k: `e-${c.id}`, emoji: '💎', to: `/${c.username}`,
                text: <><b className="text-white">@{c.username}</b> top earner this week</> });
        });
        (featuredCreators || []).slice(0, 10).forEach((c) => {
            if (!c?.username) return;
            out.push({ k: `v-${c.id}`, emoji: '🔥', to: `/${c.username}`,
                text: c.clicks_24h
                    ? <><b className="text-white">@{c.username}</b> · {c.clicks_24h} views today</>
                    : <><b className="text-white">@{c.username}</b> trending now</> });
        });
        (newVerifiedCreators || []).slice(0, 6).forEach((c) => {
            if (!c?.username) return;
            out.push({ k: `n-${c.id}`, emoji: '✦', to: `/${c.username}`,
                text: <><b className="text-white">@{c.username}</b> just joined</> });
        });
        (featuredWishes || []).slice(0, 6).forEach((w) => {
            const title = w?.title || w?.name || w?.content_description;
            const uname = w?.user?.username;
            if (!title || !uname) return;
            out.push({ k: `w-${w.id}`, emoji: '↗', to: `/${uname}`,
                text: <><b className="text-white">@{uname}</b> · {String(title).slice(0, 30)}</> });
        });
        return out.sort((a, b) => (a.k.charCodeAt(0) + a.k.length) - (b.k.charCodeAt(0) + b.k.length));
    }, [featuredCreators, newVerifiedCreators, topEarners, featuredWishes]);

    const stats = useMemo(() => {
        const creators = featuredCreators?.length || 0;
        const wishes = featuredWishes?.length || 0;
        const views = (featuredCreators || []).reduce((s, c) => s + (Number(c?.clicks_24h) || 0), 0);
        const fresh = newVerifiedCreators?.length || 0;
        return [
            { n: creators ? `${creators}+` : '—', label: 'creators trending' },
            views
                ? { n: views.toLocaleString(), label: 'views today' }
                : { n: wishes ? `${wishes}+` : '—', label: 'wishes live' },
            { n: fresh ? `${fresh}` : (creators ? `${creators}` : '—'), label: fresh ? 'new & verified' : 'to explore' },
        ];
    }, [featuredCreators, newVerifiedCreators, featuredWishes]);

    const loop = events.length ? [...events, ...events] : [];

    return (
        <section className="container max-w-7xl mx-auto px-4 pt-6 pb-2 md:pt-8">
          <div className="relative overflow-hidden rounded-[30px] bg-[#0E0E12] shadow-[0_16px_40px_-16px_rgba(0,0,0,0.55)]">
            {/* ambient pink glow */}
            <div className="pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-[#FF007F]/25 blur-[120px]" aria-hidden />
            <div className="pointer-events-none absolute -top-24 right-10 h-64 w-64 rounded-full bg-[#A2E4B8]/10 blur-[100px]" aria-hidden />

            <div className="relative px-6 pt-10 pb-8 md:px-10 md:pt-14 md:pb-12">
                {/* live eyebrow */}
                <div className="inline-flex items-center gap-2 rounded-[20px] border border-white/10 bg-white/[0.04] px-3 py-1.5 backdrop-blur">
                    <span className="relative flex h-2 w-2">
                        {!reduce && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FF007F] opacity-70" />}
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FF007F]" />
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">Happening now</span>
                </div>

                {/* headline */}
                <h1 className="mt-5 font-anton uppercase tracking-tight text-white leading-[0.95] text-[44px] sm:text-6xl md:text-[86px]">
                    Find your next
                    <span className="block bg-gradient-to-r from-[#FF007F] via-[#FF4FA8] to-[#FF007F] bg-clip-text text-transparent">
                        obsession
                    </span>
                </h1>
                <p className="mt-5 max-w-lg text-[15px] md:text-base leading-relaxed text-white/60">
                    Real creators, live right now. Browse who's trending, unlock their content, and back the people worth following.
                </p>

                {/* stats + CTA */}
                <div className="mt-8 flex flex-wrap items-center gap-3">
                    {stats.map((s) => (
                        <div key={s.label} className="rounded-[20px] border border-white/10 bg-white/[0.04] px-4 py-2.5 backdrop-blur">
                            <div className="font-anton text-[22px] leading-none text-white">{s.n}</div>
                            <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.15em] text-white/45">{s.label}</div>
                        </div>
                    ))}
                    <button
                        onClick={onExplore}
                        className="group inline-flex items-center gap-2 rounded-[20px] bg-[#FF007F] px-6 py-3 text-sm font-bold text-white shadow-[0_8px_30px_-6px_rgba(255,0,127,0.6)] transition-all hover:bg-[#ff1a8c] hover:shadow-[0_10px_40px_-6px_rgba(255,0,127,0.75)]"
                    >
                        Explore creators
                        <span className="transition-transform group-hover:translate-x-0.5">→</span>
                    </button>
                </div>
            </div>

            {/* live ticker */}
            {loop.length > 0 && (
                <div className="relative border-t border-white/[0.06] bg-white/[0.02] backdrop-blur">
                    <div className="flex items-stretch">
                        <div className="hidden shrink-0 items-center gap-1.5 px-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#FF007F] sm:flex">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#FF007F]" /> Live
                        </div>
                        {/* edge fade */}
                        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#0E0E12] to-transparent" aria-hidden />
                        <div className="relative flex-1 overflow-hidden py-3">
                            {reduce ? (
                                <div className="flex gap-10 overflow-x-auto px-4 no-scrollbar">
                                    {events.map((e) => <TickerItem key={e.k} e={e} />)}
                                </div>
                            ) : (
                                <motion.div
                                    className="flex w-max gap-10 px-4"
                                    animate={{ x: ['0%', '-50%'] }}
                                    transition={{ duration: Math.max(20, loop.length * 2.6), ease: 'linear', repeat: Infinity }}
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

function TickerItem({ e }) {
    return (
        <Link href={e.to} className="flex shrink-0 items-center gap-2 whitespace-nowrap text-sm text-white/50 transition-colors hover:text-white/90">
            <span className="text-[#FF007F]">{e.emoji}</span>
            <span>{e.text}</span>
        </Link>
    );
}
