import { useState, useEffect, useRef } from 'react';
import { Link } from '@inertiajs/react';
import axios from 'axios';
import userphoto from "../../../assets/siteicon.png";
import Popup from '@/Components/Popup';
import { trackSearchClick } from "@/includes/Analytics";
import discoveryLink, { DISCOVERY_SOURCE } from "@/lib/discoveryLink";
import { RiPlayFill } from "react-icons/ri";
import VerifiedBadge from "@/Components/VerifiedBadge";

/**
 * Intro videos rail. Two perf rules:
 *  - The fetch is deferred until the section scrolls near the viewport (it sits
 *    below the fold), so it never competes with the initial Discover load.
 *  - Posters come from the server's non-blocking accessor (avatar fallback while
 *    a poster warms on the queue) — no synchronous Uploadcare call per row.
 */
export default function IntroVideos({ intros: initialIntros, onSeeMore, showAll }) {
    const [intros, setIntros] = useState(initialIntros || []);
    const [displayed, setDisplayed] = useState([]);
    const [order, setOrder] = useState('new');
    const [loading, setLoading] = useState(true);
    const [visible, setVisible] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    const sectionRef = useRef(null);
    const fetchedKey = useRef(null);

    // Reveal → only render/fetch when the rail is near the viewport.
    useEffect(() => {
        const el = sectionRef.current;
        if (!el || visible) return;
        const io = new IntersectionObserver((entries) => {
            if (entries[0]?.isIntersecting) {
                setVisible(true);
                io.disconnect();
            }
        }, { rootMargin: '300px' });
        io.observe(el);
        return () => io.disconnect();
    }, [visible]);

    // Fetch once visible (and on order change). Server-provided intros seed the default view.
    useEffect(() => {
        if (!visible) return;
        if (initialIntros?.length && order === 'new' && fetchedKey.current === null) {
            setIntros(initialIntros);
            setLoading(false);
            fetchedKey.current = order;
            return;
        }
        if (fetchedKey.current === order) return;
        setLoading(true);
        setErrorMsg(null);
        axios.get(`/discover/creators/${order}/all`)
            .then((resp) => {
                const data = resp?.data?.intro?.data;
                if (Array.isArray(data)) setIntros(data);
                else setErrorMsg('Could not load intro videos.');
                setLoading(false);
                fetchedKey.current = order;
            })
            .catch(() => {
                setErrorMsg('Could not load intro videos. Try again.');
                setLoading(false);
            });
    }, [visible, order]);

    useEffect(() => {
        if (!intros?.length) return setDisplayed([]);
        setDisplayed(showAll ? intros : intros.slice(0, 8));
    }, [intros, showAll]);

    const hasContent = displayed.length > 0;

    return (
        <section ref={sectionRef} className="!pb-[40px]">
            <div className={`mb-5 flex items-center justify-between ${!hasContent && !loading ? 'hidden' : ''}`}>
                <h2 className="font-anton text-2xl md:text-3xl uppercase tracking-wide text-black">Intro Videos</h2>
                <div className="flex gap-1.5">
                    {['new', 'old'].map((o) => (
                        <button
                            key={o}
                            onClick={() => setOrder(o)}
 className={`rounded-box-sm px-3.5 py-1.5 text-xs font-semibold transition-all ${
                                order === o
 ? 'bg-[#FF007F] text-black '
                                    : 'bg-white text-black/60 border border-black/10 hover:text-black'
                            }`}
                        >
                            {o === 'new' ? 'Newest' : 'Oldest'}
                        </button>
                    ))}
                </div>
            </div>

            {errorMsg && (
 <div className="mb-4 rounded-box-sm border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                    {errorMsg}
                </div>
            )}

            {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Array(8).fill(0).map((_, i) => <IntroSkeleton key={`intro-sk-${i}`} />)}
                </div>
            ) : hasContent ? (
                <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {displayed.map((w, i) => <IntroCard key={w.id || i} w={w} />)}
                    </div>
                    {!showAll && intros.length > 8 && (
                        <div className="mt-7 flex justify-center">
                            <button
                                onClick={onSeeMore}
 className="rounded-box-sm bg-[#FF007F] px-7 py-2.5 text-sm font-bold uppercase tracking-wider text-black transition-all hover:brightness-110 "
                            >
                                See more
                            </button>
                        </div>
                    )}
                </>
            ) : null}
        </section>
    );
}

function IntroSkeleton() {
    return (
 <div className="aspect-[3/4] animate-pulse rounded-box border border-black/[0.06] bg-black/[0.05]">
            <div className="flex h-full items-center justify-center">
                <div className="h-14 w-14 rounded-full bg-black/10" />
            </div>
        </div>
    );
}

function IntroCard({ w }) {
    const [imgLoaded, setImgLoaded] = useState(false);
    const avatar = w?.user?.avatar_url || userphoto;
    const poster = (w?.poster_url && w.poster_url !== false) ? w.poster_url : avatar;

    return (
 <div className="group relative aspect-[3/4] overflow-hidden rounded-box border border-white/10 bg-[#16161C] transition-all duration-300 hover:-translate-y-1 hover:border-[#FF007F]/50 ">
            <Popup space="0" size="md" classes="w-full h-full" text={
                <div className="relative h-full w-full">
                    {!imgLoaded && <div className="absolute inset-0 z-10 animate-pulse bg-white/5" />}
                    <img
                        alt={w?.user?.name || 'Intro video'}
                        src={poster}
                        loading="lazy"
                        decoding="async"
                        onLoad={() => setImgLoaded(true)}
                        onError={(e) => {
                            if (e.target.src !== avatar && avatar !== userphoto) e.target.src = avatar;
                            else if (e.target.src !== userphoto) e.target.src = userphoto;
                            setImgLoaded(true);
                        }}
 className={`absolute inset-0 h-full w-full object-cover transition-[filter,opacity] duration-500 group-hover:brightness-110 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0F] via-[#0B0B0F]/25 to-transparent" aria-hidden />
 <span className="absolute left-3 top-3 rounded-box-sm border border-white/15 bg-black/40 px-2.5 py-1 text-[12px] font-semibold text-white backdrop-blur">
                        Intro
                    </span>
                    <div className="absolute inset-0 flex items-center justify-center">
 <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FF007F] text-black transition-colors duration-300 group-hover:brightness-110">
                            <RiPlayFill size={26} className="ml-0.5" />
                        </div>
                    </div>
                </div>
            } />

            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 p-4">
                {w?.user?.username ? (
                    <Link
                        /* The intros rail is a Discover collection we curate, so
                           the visit is SP-generated. `search-recs` is the reserved
                           key for Discover's own surfaces — the closest of the
                           twelve; there is no "intros" key. */
                        href={discoveryLink(w.user.username, DISCOVERY_SOURCE.SEARCH_RECS)}
                        onClick={() => trackSearchClick(w.user.id, w.user.username)}
                        className="pointer-events-auto block"
                    >
                        <p className="flex items-center gap-1 truncate font-anton text-base uppercase tracking-wide text-white group-hover:text-[#FF9ecb] transition-colors">
                            <span className="truncate">{w.user.name}</span>
                            <VerifiedBadge user={w?.user} size="sm" />
                        </p>
                        <p className="truncate text-xs font-medium text-white/60">@{w.user.username}</p>
                    </Link>
                ) : null}
            </div>
        </div>
    );
}
