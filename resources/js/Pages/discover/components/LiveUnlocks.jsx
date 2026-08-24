import { useEffect, useMemo, useState } from 'react';
import { Link } from '@inertiajs/react';
import { motion, useReducedMotion } from 'framer-motion';
import { route } from 'ziggy-js';
import discoveryLink, { DISCOVERY_SOURCE } from '@/lib/discoveryLink';

/**
 * Live unlocks — what people have actually bought here in the last 30 days.
 *
 * 🚨 THE BUYER IS NOT IN THIS COMPONENT, in any form. The server never sends
 * one (see DiscoveryService::recentUnlocks) and nothing here would render one:
 * the line is always "Someone unlocked X from @creator". No name, no initials,
 * no amount.
 *
 * ⚠️ AN EMPTY FEED RENDERS NOTHING. Padding a quiet week out with month-old
 * activity, or with invented rows, reads as a dead site to the first person who
 * checks a timestamp — which is worse than having no ticker.
 *
 * ⚠️ The poll is 45s and only while the tab is visible. This sits on a public
 * page that people leave open.
 */

const POLL_MS = 45000;

function ago(iso) {
    const then = new Date(iso).getTime();
    if (!then) return '';
    const mins = Math.max(1, Math.round((Date.now() - then) / 60000));
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.round(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.round(hours / 24)}d ago`;
}

export default function LiveUnlocks({ initial = [] }) {
    const reduce = useReducedMotion();
    const [unlocks, setUnlocks] = useState(initial || []);

    useEffect(() => {
        let cancelled = false;

        const poll = () => {
            if (document.hidden || !window.axios) return;
            window.axios
                .get(route('discover.live'))
                .then((r) => {
                    if (!cancelled && Array.isArray(r.data?.unlocks)) setUnlocks(r.data.unlocks);
                })
                .catch(() => {});
        };

        const id = setInterval(poll, POLL_MS);
        return () => {
            cancelled = true;
            clearInterval(id);
        };
    }, []);

    const loop = useMemo(() => (unlocks.length ? [...unlocks, ...unlocks] : []), [unlocks]);

    if (!unlocks.length) return null;

    const Item = ({ u }) => (
        <Link
            href={discoveryLink(u.username, DISCOVERY_SOURCE.TRENDING)}
            className="flex shrink-0 items-center gap-2 text-[13px] text-white/60 transition-opacity hover:opacity-70"
        >
            <span className="text-[#FF007F]">✦</span>
            <span>
                Someone unlocked <b className="font-semibold text-white">{u.title}</b> from{' '}
                <b className="font-semibold text-white">@{u.username}</b>
            </span>
            <span className="text-white/35">· {ago(u.at)}</span>
        </Link>
    );

    return (
        <div className="relative z-10 border-t border-white/[0.06] bg-[#0B0B0F]/80 backdrop-blur">
            <div className="flex items-stretch">
                <div className="hidden shrink-0 items-center gap-1.5 px-5 text-[12px] font-semibold uppercase tracking-[0.2em] text-[#FF007F] sm:flex">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#FF007F]" /> Just unlocked
                </div>
                <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#0B0B0F] to-transparent" aria-hidden />
                <div className="relative flex-1 overflow-hidden py-3">
                    {reduce ? (
                        <div className="flex gap-10 overflow-x-auto px-4 no-scrollbar">
                            {unlocks.map((u, i) => <Item key={`${u.username}-${i}`} u={u} />)}
                        </div>
                    ) : (
                        <motion.div
                            className="flex w-max gap-10 px-4"
                            animate={{ x: ['0%', '-50%'] }}
                            transition={{ duration: Math.max(24, loop.length * 2.8), ease: 'linear', repeat: Infinity }}
                        >
                            {loop.map((u, i) => <Item key={`${u.username}-${i}`} u={u} />)}
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}
