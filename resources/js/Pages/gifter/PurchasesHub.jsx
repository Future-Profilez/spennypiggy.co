import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { usePage } from "@inertiajs/react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import LazyVideo from "../../Components/LazyVideo";
import {
    Heart, ShoppingBag, CheckCircle2, PiggyBank, Crown, Repeat, Coins,
    Wallet, Unlock, FileText, Music, Image as ImageIcon, Film,
    ArrowUpRight, Play, Trophy, Download, Truck, Clock, AlertTriangle, ReceiptText,
    Users, BellRing, RotateCw, MessageCircle, Bookmark, Search, X,
    ArrowDownUp, ChevronLeft, ChevronRight,
} from "lucide-react";

/* Category system — one quiet colour + icon per type, rendered as soft tinted
   chips (10–14% fill, coloured glyph). Encodes type without shouting. */
const CAT = {
    wish:       { label: "Wish",         color: "#8B5CF6", icon: Heart },
    shop:       { label: "Shop",         color: "#0EA5E9", icon: ShoppingBag },
    task:       { label: "Paid task",    color: "#F59E0B", icon: CheckCircle2 },
    piggypot:   { label: "Piggy Pot",    color: "#EC4899", icon: PiggyBank },
    membership: { label: "Membership",   color: "#10B981", icon: Crown },
    bill:       { label: "Subscription", color: "#3B82F6", icon: Repeat },
    tip:        { label: "Piggy Bank",   color: "#65A30D", icon: Coins },
};
const cat = (t) => CAT[t] || { label: t, color: "#71717A", icon: FileText };
const tint = (hex, a = "1a") => hex + a; // 8-digit hex alpha

const TIER_COLOR = { Bronze: "#B45309", Silver: "#71717A", Gold: "#D97706", Platinum: "#2563EB", Diamond: "#DB2777" };

const ACCENT = "#FF007F";
const CARD = "bg-white border border-zinc-200/70 rounded-box shadow-[0_1px_2px_rgba(16,24,40,0.04)]";
const CARD_HOVER = "transition-shadow duration-200 hover:shadow-[0_10px_30px_-12px_rgba(16,24,40,0.18)]";
const MONO = "[font-variant-numeric:tabular-nums] tabular-nums";
const EYEBROW = "text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400";

/* Which tabs accept a search box, and which sort keys each supports. Type-filter
   chips only appear where a tab mixes source types. */
const SORTS = {
    recent: "Recent",
    price_desc: "Price: high → low",
    price_asc: "Price: low → high",
    name: "Name A–Z",
};
const TAB_TOOLS = {
    media:         { search: true, types: true,  sorts: ["recent", "name"] },
    incoming:      { search: true, types: false, sorts: ["recent"] },
    subscriptions: { search: true, types: false, sorts: ["recent", "price_desc", "price_asc", "name"] },
    unlocked:      { search: true, types: true,  sorts: ["recent", "name"] },
    creators:      { search: true, types: false, sorts: ["price_desc", "price_asc", "name"] },
    saved:         { search: true, types: true,  sorts: ["recent", "name"] },
    receipts:      { search: true, types: true,  sorts: ["recent", "price_desc", "price_asc", "name"] },
    spending:      { search: false, types: false, sorts: [] },
};

const norm = (s) => String(s || "").toLowerCase();
const amountOf = (x) => Number(x?.amount ?? x?.total_spent ?? 0);
const nameOf = (x) => x?.title || x?.owner?.username || "";
const typeOf = (x) => x?.source_type || x?.product_type;

export default function PurchasesHub({
    display_currency = "GBP",
    media_library = [],
    media_pagination = {},
    subscriptions = [],
    unlocked = [],
    spend_summary = {},
    supporter_status = null,
    receipts = [],
    incoming = [],
    creators = [],
    saved = [],
    embedded = false,
}) {
    const { symbols } = usePage().props;
    const reduce = useReducedMotion();

    const [tab, setTab] = useState("media");
    const [media, setMedia] = useState(media_library);
    const [page, setPage] = useState(media_pagination.current_page || 1);
    const [lastPage, setLastPage] = useState(media_pagination.last_page || 1);
    const [loading, setLoading] = useState(false);
    const [subs, setSubs] = useState(subscriptions);
    const [canceling, setCanceling] = useState(null);
    const [savedItems, setSavedItems] = useState(saved);

    // Toolbar state (reset when switching tabs)
    const [query, setQuery] = useState("");
    const [sort, setSort] = useState("recent");
    const [typeFilter, setTypeFilter] = useState(null); // null = all
    const [lightbox, setLightbox] = useState(null); // index into filtered media

    useEffect(() => {
        setMedia(media_library);
        setPage(media_pagination.current_page || 1);
        setLastPage(media_pagination.last_page || 1);
    }, [media_library]);
    useEffect(() => { setSubs(subscriptions); }, [subscriptions]);
    useEffect(() => { setSavedItems(saved); }, [saved]);
    useEffect(() => { setQuery(""); setTypeFilter(null); setSort(TAB_TOOLS[tab]?.sorts?.[0] || "recent"); }, [tab]);

    const symbol = symbols?.[display_currency] ?? "";
    const money = (n) => `${symbol}${Number(n || 0).toFixed(2)}`;
    const hasMore = lastPage > page;

    const loadMore = () => {
        if (loading) return;
        setLoading(true);
        const next = page + 1;
        fetch(`/my-purchases-feed?page=${next}`, { headers: { Accept: "application/json" } })
            .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
            .then((d) => {
                setMedia((p) => [...p, ...(d.medias || [])]);
                setPage(d.current_page || next);
                if (d.last_page) setLastPage(d.last_page);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    };

    const cancelSub = (sub) => {
        if (!sub?.raw_id || canceling || !window.axios) return;
        if (!window.confirm(`Cancel "${sub.title}"? It stays active until the end of the current period.`)) return;
        setCanceling(sub.id);
        window.axios.post(`/subscriptions/${sub.raw_id}/cancel`)
            .then(() => setSubs((prev) => prev.filter((s) => s.id !== sub.id)))
            .catch(() => window.alert("Couldn’t cancel right now. Please try again."))
            .finally(() => setCanceling(null));
    };

    const removeSaved = (it) => {
        if (!window.axios) return;
        setSavedItems((prev) => prev.filter((s) => s.id !== it.id));
        window.axios.post("/saved/toggle", { product_type: it.product_type, item_id: it.item_id })
            .catch(() => setSavedItems((prev) => [it, ...prev]));
    };

    const renewingSoon = subs.filter((s) => {
        if (!s.next_charge_at) return false;
        const d = (new Date(String(s.next_charge_at).replace(" ", "T")) - new Date()) / 86400000;
        return d >= 0 && d <= 7;
    });

    // Source list per tab (pre-filter)
    const source = {
        media, incoming, subscriptions: subs, unlocked,
        creators, saved: savedItems, receipts,
    }[tab] || [];

    // Type-filter options present in the current tab's data
    const typeOptions = useMemo(() => {
        if (!TAB_TOOLS[tab]?.types) return [];
        const set = new Set(source.map(typeOf).filter(Boolean));
        return [...set];
    }, [tab, source]);

    // Apply search + type filter + sort
    const view = useMemo(() => {
        const tools = TAB_TOOLS[tab] || {};
        let out = source;
        if (tools.search && query.trim()) {
            const q = norm(query);
            out = out.filter((x) => norm(nameOf(x)).includes(q) || norm(x?.owner?.username).includes(q));
        }
        if (tools.types && typeFilter) out = out.filter((x) => typeOf(x) === typeFilter);
        if (sort && sort !== "recent") {
            out = [...out].sort((a, b) => {
                if (sort === "name") return norm(nameOf(a)).localeCompare(norm(nameOf(b)));
                if (sort === "price_desc") return amountOf(b) - amountOf(a);
                if (sort === "price_asc") return amountOf(a) - amountOf(b);
                return 0;
            });
        }
        return out;
    }, [tab, source, query, typeFilter, sort]);

    const toolsFor = TAB_TOOLS[tab] || {};
    const showToolbar = toolsFor.search && source.length > 0;

    const sections = [
        { key: "media", label: "Media", icon: Film, count: media.length },
        ...(incoming.length ? [{ key: "incoming", label: "Incoming", icon: Truck, count: incoming.length }] : []),
        { key: "subscriptions", label: "Subscriptions", icon: Repeat, count: subs.length },
        { key: "unlocked", label: "Unlocked", icon: Unlock, count: unlocked.length },
        ...(creators.length ? [{ key: "creators", label: "Creators", icon: Users, count: creators.length }] : []),
        { key: "saved", label: "Saved", icon: Bookmark, count: savedItems.length },
        { key: "receipts", label: "Receipts", icon: ReceiptText, count: receipts.length },
        { key: "spending", label: "Spending", icon: Wallet, count: spend_summary.purchase_count || 0 },
    ];

    const inner = (
        <div className={`mx-auto px-4 sm:px-6 ${embedded ? "max-w-[1080px]" : "max-w-[1140px] pt-6 sm:pt-10"}`}>
            <Hero embedded={embedded} media={media} summary={spend_summary} money={money} reduce={reduce} status={supporter_status} />

            {renewingSoon.length > 0 && (
                <RenewingBanner items={renewingSoon} money={money} onCancel={cancelSub} canceling={canceling} onView={() => setTab("subscriptions")} />
            )}

            {/* Tab rail — sticky, horizontally scrollable on mobile */}
            <div className={`${embedded ? "" : "sticky top-2 z-20"} mt-8 mb-4`}>
                <div
                    className="flex gap-1 flex-nowrap sm:flex-wrap overflow-x-auto no-scrollbar bg-white/90 backdrop-blur border border-zinc-200/70 rounded-box-sm p-1.5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
                    style={{ WebkitOverflowScrolling: "touch" }}
                >
                    {sections.map((s) => {
                        const Icon = s.icon;
                        const active = tab === s.key;
                        const alert = s.key === "incoming" && incoming.some((i) => i.is_overdue);
                        return (
                            <button
                                key={s.key}
                                onClick={() => setTab(s.key)}
                                aria-pressed={active}
                                className={`group flex items-center gap-2 px-3.5 min-h-[44px] rounded-[14px] text-sm font-medium whitespace-nowrap shrink-0 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF007F]/40 ${
                                    active ? "bg-zinc-900 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
                                }`}
                            >
                                <Icon size={15} strokeWidth={2} />
                                {s.label}
                                <span className={`text-[11px] rounded-full px-1.5 py-0.5 ${MONO} ${
                                    alert ? "bg-rose-100 text-rose-600 font-semibold"
                                    : active ? "bg-white/15 text-white/80"
                                    : "bg-zinc-100 text-zinc-400"
                                }`}>
                                    {s.count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {showToolbar && (
                <Toolbar
                    query={query} setQuery={setQuery}
                    sort={sort} setSort={setSort} sorts={toolsFor.sorts}
                    typeOptions={toolsFor.types ? typeOptions : []}
                    typeFilter={typeFilter} setTypeFilter={setTypeFilter}
                    shown={view.length} total={source.length}
                />
            )}

            <AnimatePresence mode="wait">
                <motion.div
                    key={tab}
                    initial={reduce ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduce ? { opacity: 1 } : { opacity: 0, y: -6 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                >
                    {tab === "media" && <MediaGrid items={view} hasMore={hasMore} loadMore={loadMore} loading={loading} reduce={reduce} filtered={!!(query.trim() || typeFilter)} onOpen={setLightbox} />}
                    {tab === "incoming" && <IncomingList items={view} reduce={reduce} />}
                    {tab === "subscriptions" && <SubscriptionList items={view} money={money} reduce={reduce} onCancel={cancelSub} canceling={canceling} />}
                    {tab === "unlocked" && <UnlockedList items={view} reduce={reduce} />}
                    {tab === "creators" && <CreatorsList items={view} money={money} reduce={reduce} />}
                    {tab === "saved" && <SavedList items={view} reduce={reduce} onRemove={removeSaved} />}
                    {tab === "receipts" && <ReceiptsList items={view} money={money} reduce={reduce} />}
                    {tab === "spending" && <SpendingDetail summary={spend_summary} money={money} reduce={reduce} />}
                </motion.div>
            </AnimatePresence>

            <AnimatePresence>
                {lightbox !== null && view[lightbox] && (
                    <Lightbox
                        items={view}
                        index={lightbox}
                        onIndex={setLightbox}
                        onClose={() => setLightbox(null)}
                        reduce={reduce}
                    />
                )}
            </AnimatePresence>
        </div>
    );

    if (embedded) return inner;
    return <div className="relative min-h-dvh pb-24 bg-[#F7F7F8] text-zinc-900" style={{ paddingBottom: "calc(6rem + env(safe-area-inset-bottom))" }}>{inner}</div>;
}

const stagger = (reduce) => ({ hidden: {}, show: { transition: { staggerChildren: reduce ? 0 : 0.04 } } });
const rise = (reduce) => ({
    hidden: reduce ? { opacity: 1 } : { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
});

/* ---------------- Toolbar ---------------- */
function Toolbar({ query, setQuery, sort, setSort, sorts = [], typeOptions = [], typeFilter, setTypeFilter, shown, total }) {
    const hasSort = sorts.length > 1;
    return (
        <div className="mb-6">
            <div className="flex flex-col sm:flex-row gap-2.5 sm:items-center">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search by title or creator…"
                        className="w-full min-h-[44px] pl-10 pr-9 rounded-box-sm bg-white border border-zinc-200/70 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#FF007F]/30 focus:border-[#FF007F]/40 transition"
                    />
                    {query && (
                        <button onClick={() => setQuery("")} aria-label="Clear search"
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 inline-flex items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition">
                            <X size={15} />
                        </button>
                    )}
                </div>
                {hasSort && (
                    <div className="relative shrink-0">
                        <ArrowDownUp size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                        <select
                            value={sort}
                            onChange={(e) => setSort(e.target.value)}
                            aria-label="Sort"
                            className="appearance-none min-h-[44px] pl-9 pr-9 rounded-box-sm bg-white border border-zinc-200/70 text-sm font-medium text-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#FF007F]/30 cursor-pointer"
                        >
                            {sorts.map((k) => <option key={k} value={k}>{SORTS[k]}</option>)}
                        </select>
                        <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-zinc-400 pointer-events-none" />
                    </div>
                )}
            </div>

            {typeOptions.length > 1 && (
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                    <FilterChip active={!typeFilter} onClick={() => setTypeFilter(null)} label="All" />
                    {typeOptions.map((t) => {
                        const c = cat(t);
                        return (
                            <FilterChip key={t} active={typeFilter === t} onClick={() => setTypeFilter(typeFilter === t ? null : t)}
                                label={c.label} color={c.color} Icon={c.icon} />
                        );
                    })}
                </div>
            )}

            {(query.trim() || typeFilter) && (
                <div className="text-[11px] text-zinc-400 mt-2">{shown} of {total} shown</div>
            )}
        </div>
    );
}

function FilterChip({ active, onClick, label, color = "#71717A", Icon }) {
    return (
        <button onClick={onClick} aria-pressed={active}
            className={`inline-flex items-center gap-1.5 min-h-[36px] px-3 rounded-full text-xs font-medium border transition ${
                active ? "text-white border-transparent" : "text-zinc-600 bg-white border-zinc-200/70 hover:border-zinc-300"
            }`}
            style={active ? { backgroundColor: color } : undefined}>
            {Icon && <Icon size={12} strokeWidth={2.4} />} {label}
        </button>
    );
}

/* ---------------- Lightbox ---------------- */
function Lightbox({ items, index, onIndex, onClose, reduce }) {
    const item = items[index];
    const touch = useRef(null);

    const go = useCallback((dir) => {
        onIndex((i) => {
            const n = i + dir;
            if (n < 0) return items.length - 1;
            if (n >= items.length) return 0;
            return n;
        });
    }, [items.length, onIndex]);

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === "Escape") onClose();
            else if (e.key === "ArrowRight") go(1);
            else if (e.key === "ArrowLeft") go(-1);
        };
        window.addEventListener("keydown", onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
    }, [go, onClose]);

    if (!item) return null;
    const c = cat(item.source_type);
    const multi = items.length > 1;

    const onTouchStart = (e) => { touch.current = e.touches[0].clientX; };
    const onTouchEnd = (e) => {
        if (touch.current == null) return;
        const dx = e.changedTouches[0].clientX - touch.current;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
        touch.current = null;
    };

    return (
        <motion.div
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex flex-col"
            initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
        >
            {/* Top bar */}
            <div className="flex items-center justify-between px-4 py-3 text-white/90" onClick={(e) => e.stopPropagation()}>
                <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{item.title}</div>
                    <div className="text-xs text-white/50 truncate">@{item.owner?.username}{multi ? ` · ${index + 1} / ${items.length}` : ""}</div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                    {item.media_url && (
                        <a href={item.media_url} target="_blank" rel="noreferrer" download aria-label="Download"
                            className="w-11 h-11 inline-flex items-center justify-center rounded-full text-white/90 hover:bg-white/10 transition">
                            <Download size={19} />
                        </a>
                    )}
                    <button onClick={onClose} aria-label="Close"
                        className="w-11 h-11 inline-flex items-center justify-center rounded-full text-white/90 hover:bg-white/10 transition">
                        <X size={22} />
                    </button>
                </div>
            </div>

            {/* Stage */}
            <div className="flex-1 flex items-center justify-center px-3 pb-3 min-h-0 relative"
                onClick={(e) => e.stopPropagation()} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
                {multi && (
                    <button onClick={() => go(-1)} aria-label="Previous"
                        className="hidden sm:flex absolute left-4 w-12 h-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition z-10">
                        <ChevronLeft size={26} />
                    </button>
                )}
                <div className="max-w-[92vw] max-h-full flex items-center justify-center">
                    {item.media_kind === "video" ? (
                        <LazyVideo src={item.media_url} posterSrc={item.media_url} fallback={item.owner?.avatar} controls
                            className="max-h-[80vh] max-w-[92vw] rounded-box-sm object-contain bg-black" />
                    ) : item.media_kind === "image" ? (
                        <img src={item.media_url} alt={item.title} className="max-h-[80vh] max-w-[92vw] rounded-box-sm object-contain" />
                    ) : item.media_kind === "audio" ? (
                        <div className="w-[min(92vw,520px)] rounded-box bg-white p-6 text-center">
                            <span className="inline-flex w-14 h-14 rounded-full items-center justify-center mb-4" style={{ backgroundColor: tint(c.color, "16"), color: c.color }}>
                                <Music size={26} />
                            </span>
                            <div className="text-sm font-medium text-zinc-900 mb-4 truncate">{item.title}</div>
                            <audio src={item.media_url} controls className="w-full" />
                        </div>
                    ) : (
                        <a href={item.media_url} target="_blank" rel="noreferrer"
                            className="flex flex-col items-center gap-3 text-white bg-white/10 rounded-box px-10 py-12 hover:bg-white/15 transition">
                            <FileText size={40} strokeWidth={1.6} />
                            <span className="text-sm font-medium">Open file</span>
                        </a>
                    )}
                </div>
                {multi && (
                    <button onClick={() => go(1)} aria-label="Next"
                        className="hidden sm:flex absolute right-4 w-12 h-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition z-10">
                        <ChevronRight size={26} />
                    </button>
                )}
            </div>

            {/* Mobile nav */}
            {multi && (
                <div className="sm:hidden flex items-center justify-center gap-6 pb-4 text-white" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => go(-1)} aria-label="Previous" className="w-12 h-12 inline-flex items-center justify-center rounded-full bg-white/10"><ChevronLeft size={24} /></button>
                    <span className="text-xs text-white/60 tabular-nums">{index + 1} / {items.length}</span>
                    <button onClick={() => go(1)} aria-label="Next" className="w-12 h-12 inline-flex items-center justify-center rounded-full bg-white/10"><ChevronRight size={24} /></button>
                </div>
            )}
        </motion.div>
    );
}

function Chip({ type }) {
    const c = cat(type);
    const Icon = c.icon;
    return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium rounded-full px-2 py-0.5"
            style={{ backgroundColor: tint(c.color, "14"), color: c.color }}>
            <Icon size={11} strokeWidth={2.4} /> {c.label}
        </span>
    );
}

function IconTile({ type, size = 44, rounded = "rounded-box-sm" }) {
    const c = cat(type);
    const Icon = c.icon;
    return (
        <span className={`${rounded} flex items-center justify-center shrink-0`}
            style={{ width: size, height: size, backgroundColor: tint(c.color, "14"), color: c.color }}>
            <Icon size={size * 0.42} strokeWidth={2.2} />
        </span>
    );
}

/* ---------------- Hero ---------------- */
function Hero({ embedded, media, summary, money, reduce, status }) {
    return (
        <div className={`${CARD} overflow-hidden`}>
            <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
                <div className="p-7 md:p-9">
                    <div className={EYEBROW}>Your library</div>
                    {!embedded ? (
                        <h1 className="text-3xl md:text-[2.6rem] font-semibold tracking-tight text-zinc-900 mt-2 leading-tight">My purchases</h1>
                    ) : (
                        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-zinc-900 mt-2 leading-tight">My purchases</h2>
                    )}
                    <p className="text-zinc-500 text-sm mt-2 max-w-sm leading-relaxed">
                        Everything you’ve unlocked, kept in one place: media, subscriptions and access.
                    </p>

                    <div className="mt-7 flex items-end gap-8 flex-wrap">
                        <div>
                            <div className={EYEBROW}>Total spent</div>
                            <div className={`text-[2.4rem] font-semibold tracking-tight text-zinc-900 leading-none mt-1.5 ${MONO}`}>
                                <CountUp value={Number(summary.total_spent || 0)} money={money} reduce={reduce} />
                            </div>
                        </div>
                        <div className="pb-1">
                            <div className={EYEBROW}>This month</div>
                            <div className={`text-xl font-semibold text-zinc-700 leading-none mt-1.5 ${MONO}`}>{money(summary.this_month)}</div>
                        </div>
                        <div className="pb-1">
                            <div className={EYEBROW}>Creators</div>
                            <div className={`text-xl font-semibold text-zinc-700 leading-none mt-1.5 ${MONO}`}>{summary.creators_supported || 0}</div>
                        </div>
                    </div>

                    {status && <SupporterStatus status={status} reduce={reduce} />}
                </div>

                <div className="relative bg-zinc-50 border-t lg:border-t-0 lg:border-l border-zinc-200/70 min-h-[200px] md:min-h-[260px] flex items-center justify-center p-7">
                    {media.length ? (
                        <Mosaic tiles={media.slice(0, 4)} extra={Math.max(0, media.length - 4)} reduce={reduce} />
                    ) : (
                        <div className="flex flex-col items-center justify-center text-zinc-400">
                            <PiggyBank size={44} strokeWidth={1.6} />
                            <span className="mt-3 text-sm font-medium">Your library is empty</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function SupporterStatus({ status, reduce }) {
    const color = TIER_COLOR[status.level] || ACCENT;
    return (
        <div className="mt-7 max-w-md">
            <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-2 text-sm font-medium text-zinc-900">
                    <span className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: tint(color, "1f"), color }}>
                        <Trophy size={14} strokeWidth={2.2} />
                    </span>
                    {status.level} supporter
                </span>
                <span className={`text-xs text-zinc-400 ${MONO}`}>{Math.round(status.score)} pts</span>
            </div>
            <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                <motion.div className="h-full rounded-full" style={{ background: color }}
                    initial={reduce ? false : { width: 0 }}
                    animate={{ width: `${Math.round((status.progress || 0) * 100)}%` }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} />
            </div>
            <div className="text-[11px] text-zinc-400 mt-1.5">
                {status.next_level ? `${status.to_next} pts to ${status.next_level}` : "Top tier reached"} · last 90 days
            </div>
        </div>
    );
}

function CountUp({ value, money, reduce }) {
    const [n, setN] = useState(reduce ? value : 0);
    const raf = useRef(0);
    useEffect(() => {
        if (reduce) { setN(value); return; }
        let start;
        const dur = 700;
        const tick = (t) => {
            if (start === undefined) start = t;
            const p = Math.min(1, (t - start) / dur);
            setN(value * (1 - Math.pow(1 - p, 3)));
            if (p < 1) raf.current = requestAnimationFrame(tick);
        };
        raf.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf.current);
    }, [value, reduce]);
    return <>{money(n)}</>;
}

function Mosaic({ tiles, extra, reduce }) {
    const rot = ["-2deg", "1.5deg", "1.5deg", "-1.5deg"];
    return (
        <motion.div className="relative w-full max-w-[280px]" variants={stagger(reduce)} initial="hidden" animate="show">
            <div className="grid grid-cols-2 gap-2.5">
                {tiles.map((t, i) => {
                    const c = cat(t.source_type);
                    const Icon = c.icon;
                    const isImg = t.media_kind === "image" && t.media_url;
                    return (
                        <motion.div key={t.id} variants={rise(reduce)}
                            className="aspect-square rounded-box-sm border border-zinc-200 bg-white shadow-[0_4px_14px_-6px_rgba(16,24,40,0.2)] overflow-hidden"
                            style={{ transform: `rotate(${rot[i]})` }}>
                            {isImg ? (
                                <img src={t.media_url} alt="" loading="lazy" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: tint(c.color, "12"), color: c.color }}>
                                    {t.media_kind === "video" ? <Play size={22} strokeWidth={2} /> : <Icon size={22} strokeWidth={2} />}
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </div>
            {extra > 0 && (
                <span className={`absolute -bottom-2 -right-2 bg-zinc-900 text-white text-[11px] font-medium px-2 py-1 rounded-full shadow-sm ${MONO}`}>
                    +{extra}
                </span>
            )}
        </motion.div>
    );
}

/* ---------------- Media ---------------- */
function MediaGrid({ items, hasMore, loadMore, loading, reduce, filtered, onOpen }) {
    if (!items.length) {
        return filtered
            ? <Empty title="No matches" sub="Try a different search or clear the filters." Icon={Search} />
            : <Empty title="No media yet" sub="Content you buy from creators lands here." Icon={Film} />;
    }
    return (
        <>
            <motion.div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4" variants={stagger(reduce)} initial="hidden" animate="show">
                {items.map((it, i) => (
                    <motion.div key={it.id} variants={rise(reduce)}><MediaCard item={it} onOpen={() => onOpen(i)} /></motion.div>
                ))}
                {loading && [0, 1, 2, 3].map((i) => <SkeletonCard key={`sk${i}`} />)}
            </motion.div>
            {hasMore && (
                <div className="text-center mt-7">
                    <button onClick={loadMore} disabled={loading}
                        className="px-5 min-h-[44px] rounded-full text-sm font-medium text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 transition-colors disabled:opacity-50">
                        {loading ? "Loading…" : filtered ? "Load more to search further" : "Load more"}
                    </button>
                </div>
            )}
        </>
    );
}

function MediaCard({ item, onOpen }) {
    const { media_kind, media_url, owner, title } = item;
    const c = cat(item.source_type);
    const openable = media_kind === "image" || media_kind === "video" || media_kind === "audio" || media_kind === "pdf";
    return (
        <div className={`${CARD} ${CARD_HOVER} overflow-hidden flex flex-col group`}>
            <button
                type="button"
                onClick={openable ? onOpen : undefined}
                aria-label={openable ? `Open ${title}` : title}
                className="aspect-square flex items-center justify-center overflow-hidden relative text-left w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF007F]/40"
                style={{ backgroundColor: tint(c.color, "10"), cursor: openable ? "zoom-in" : "default" }}
            >
                {media_kind === "video" ? (
                    <>
                        <img src={owner?.avatar} alt="" className="w-full h-full object-cover opacity-40" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                        <span className="absolute inset-0 flex items-center justify-center">
                            <span className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white group-hover:scale-105 transition-transform">
                                <Play size={20} className="ml-0.5" />
                            </span>
                        </span>
                        <span className="absolute top-2 left-2 bg-black/70 text-white text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 pointer-events-none backdrop-blur-sm">
                            <Play size={10} /> Video
                        </span>
                    </>
                ) : media_kind === "image" ? (
                    <img src={media_url} alt={title} loading="lazy" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.04]" />
                ) : (
                    <NonVisual kind={media_kind} color={c.color} />
                )}
            </button>
            <div className="p-3.5">
                <div className="text-sm font-medium text-zinc-900 truncate" title={title}>{title}</div>
                <div className="flex items-center justify-between mt-2 gap-2">
                    <a href={owner?.username ? `/${owner.username}` : undefined} className="text-xs text-zinc-400 truncate hover:text-zinc-700 hover:underline">@{owner?.username}</a>
                    <Chip type={item.source_type} />
                </div>
            </div>
        </div>
    );
}

function SkeletonCard() {
    return (
        <div className={`${CARD} overflow-hidden flex flex-col animate-pulse`}>
            <div className="aspect-square bg-zinc-100" />
            <div className="p-3.5 space-y-2">
                <div className="h-3.5 w-3/4 bg-zinc-100 rounded" />
                <div className="h-3 w-1/2 bg-zinc-100 rounded" />
            </div>
        </div>
    );
}

function NonVisual({ kind, color }) {
    const Icon = kind === "audio" ? Music : kind === "pdf" ? FileText : ImageIcon;
    return (
        <span className="flex flex-col items-center gap-2 text-sm font-medium" style={{ color }}>
            <Icon size={30} strokeWidth={1.8} />
            <span>Open file</span>
        </span>
    );
}

/* ---------------- Renewing banner ---------------- */
function RenewingBanner({ items, money, onCancel, canceling, onView }) {
    return (
        <div className={`mt-6 ${CARD} p-5`} style={{ borderColor: tint("#F59E0B", "55") }}>
            <div className="flex items-center gap-2 mb-3 text-zinc-900">
                <BellRing size={16} strokeWidth={2} className="text-amber-500" />
                <span className="text-sm font-medium">{items.length} renewing this week</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {items.slice(0, 4).map((s) => (
                    <div key={s.id} className="bg-zinc-50 border border-zinc-200/70 rounded-box-sm px-3.5 py-2.5 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-zinc-900 truncate">{s.title}</div>
                            <div className={`text-xs text-zinc-400 ${MONO}`}>{money(s.amount)} · renews {fmtDate(s.next_charge_at)}</div>
                        </div>
                        {s.cancelable && (
                            <button onClick={() => onCancel(s)} disabled={canceling === s.id}
                                className="shrink-0 text-xs font-medium text-zinc-500 hover:text-rose-600 transition-colors disabled:opacity-50 min-h-[44px] px-2">
                                {canceling === s.id ? "…" : "Cancel"}
                            </button>
                        )}
                    </div>
                ))}
            </div>
            {items.length > 4 && (
                <button onClick={onView} className="mt-3 text-xs font-medium text-zinc-400 hover:text-zinc-900 min-h-[44px]">View all {items.length}</button>
            )}
        </div>
    );
}

/* ---------------- Subscriptions ---------------- */
function SubscriptionList({ items, money, reduce, onCancel, canceling }) {
    if (!items.length) return <Empty title="No subscriptions yet" sub="Your recurring memberships and subscriptions appear here — active and past." Icon={Repeat} />;
    return (
        <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-4" variants={stagger(reduce)} initial="hidden" animate="show">
            {items.map((s) => (
                <motion.div key={s.id} variants={rise(reduce)} className={`${CARD} ${CARD_HOVER} p-4 flex items-center gap-3.5`}>
                    <img src={s.owner?.avatar} alt="" className="w-12 h-12 rounded-box-sm object-cover bg-zinc-100" />
                    <div className="flex-1 min-w-0">
                        <div className="font-medium text-zinc-900 truncate">{s.title}</div>
                        <div className="text-xs text-zinc-400 truncate mt-0.5">@{s.owner?.username}</div>
                        {s.is_active === false ? (
                            <span className="inline-block text-[11px] font-medium rounded-full px-2 py-0.5 mt-1 bg-zinc-100 text-zinc-500">
                                Ended
                            </span>
                        ) : s.next_charge_at ? (
                            <div className="text-xs text-zinc-500 mt-1">Renews {fmtDate(s.next_charge_at)}</div>
                        ) : null}
                    </div>
                    <div className="text-right shrink-0">
                        <div className={`font-semibold text-zinc-900 ${MONO}`}>{money(s.amount)}</div>
                        <div className="flex items-center gap-2.5 justify-end mt-1.5">
                            <a href={s.open_link} className="text-xs font-medium hover:underline" style={{ color: ACCENT }}>View</a>
                            {s.cancelable && onCancel && (
                                <button onClick={() => onCancel(s)} disabled={canceling === s.id}
                                    className="text-xs font-medium text-zinc-400 hover:text-rose-600 transition-colors disabled:opacity-50">
                                    {canceling === s.id ? "…" : "Cancel"}
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>
            ))}
        </motion.div>
    );
}

/* ---------------- Incoming ---------------- */
function IncomingList({ items, reduce }) {
    if (!items.length) return <Empty title="Nothing in transit" sub="Orders and tasks on their way will show here." Icon={Truck} />;
    return (
        <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-4" variants={stagger(reduce)} initial="hidden" animate="show">
            {items.map((it) => {
                const status = it.is_overdue ? "Overdue" : (it.status || "pending");
                const tone = it.is_overdue ? "#E11D48" : it.status === "shipped" ? "#3B82F6" : "#F59E0B";
                const StatusIcon = it.is_overdue ? AlertTriangle : it.is_physical ? Truck : Clock;
                return (
                    <motion.div key={it.id} variants={rise(reduce)} className={`${CARD} ${CARD_HOVER} p-4 flex items-center gap-3.5`}>
                        <span className="w-12 h-12 rounded-box-sm flex items-center justify-center shrink-0" style={{ backgroundColor: tint(tone, "16"), color: tone }}>
                            <StatusIcon size={20} strokeWidth={2} />
                        </span>
                        <div className="flex-1 min-w-0">
                            <div className="font-medium text-zinc-900 truncate">{it.title}</div>
                            <div className="text-xs text-zinc-400 truncate mt-0.5">@{it.owner?.username}</div>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                <span className="text-[11px] font-medium rounded-full px-2 py-0.5 capitalize" style={{ backgroundColor: tint(tone, "16"), color: tone }}>{status}</span>
                                {it.is_physical && it.tracking_id && (
                                    <span className={`text-[11px] text-zinc-400 truncate ${MONO}`}>{it.courier ? `${it.courier} · ` : ""}{it.tracking_id}</span>
                                )}
                                {!it.is_physical && it.due_at && <span className="text-[11px] text-zinc-400">Due {fmtDate(it.due_at)}</span>}
                                {it.is_physical && it.eta && <span className="text-[11px] text-zinc-400">Arrives {fmtDate(it.eta)}</span>}
                            </div>
                        </div>
                        <a href={it.open_link} className="shrink-0 w-11 h-11 inline-flex items-center justify-center text-zinc-300 hover:text-zinc-900 transition-colors"><ArrowUpRight size={18} strokeWidth={2} /></a>
                    </motion.div>
                );
            })}
        </motion.div>
    );
}

/* ---------------- Saved ---------------- */
function SavedList({ items, reduce, onRemove }) {
    if (!items.length) return <Empty title="Nothing saved yet" sub="Tap the heart on any creator’s item to save it here and buy when you’re ready." Icon={Bookmark} />;
    return (
        <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" variants={stagger(reduce)} initial="hidden" animate="show">
            {items.map((s) => (
                <motion.div key={s.id} variants={rise(reduce)} className={`${CARD} ${CARD_HOVER} p-4 flex items-center gap-3`}>
                    <a href={s.open_link}><IconTile type={s.product_type} size={46} /></a>
                    <div className="flex-1 min-w-0">
                        <a href={s.open_link} className="text-sm font-medium text-zinc-900 truncate block hover:underline">{s.title}</a>
                        <div className="text-xs text-zinc-400 truncate mt-0.5">@{s.owner?.username}</div>
                        <a href={s.open_link} className="mt-1 inline-flex items-center gap-1 text-xs font-medium hover:underline" style={{ color: ACCENT }}>
                            Buy now <ArrowUpRight size={12} strokeWidth={2.4} />
                        </a>
                    </div>
                    <button onClick={() => onRemove(s)} title="Remove" aria-label="Remove from saved"
                        className="shrink-0 w-11 h-11 inline-flex items-center justify-center rounded-full text-rose-500 hover:bg-rose-50 transition-colors">
                        <Heart size={16} strokeWidth={2} fill="currentColor" />
                    </button>
                </motion.div>
            ))}
        </motion.div>
    );
}

/* ---------------- Unlocked ---------------- */
function UnlockedList({ items, reduce }) {
    if (!items.length) return <Empty title="Nothing unlocked yet" sub="Content you’ve unlocked from creators shows here." Icon={Unlock} />;
    return (
        <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" variants={stagger(reduce)} initial="hidden" animate="show">
            {items.map((u) => (
                <motion.div key={u.id} variants={rise(reduce)} className={`${CARD} ${CARD_HOVER} p-4 flex items-center gap-3`}>
                    <a href={u.open_link}><IconTile type={u.source_type} size={42} /></a>
                    <div className="flex-1 min-w-0">
                        <a href={u.open_link} className="text-sm font-medium text-zinc-900 truncate block hover:underline">{u.title}</a>
                        <div className="text-xs text-zinc-400 truncate mt-0.5">@{u.owner?.username}</div>
                        <a href={u.open_link} className="mt-1 inline-flex items-center gap-1 text-xs font-medium hover:underline" style={{ color: ACCENT }}>
                            <RotateCw size={11} strokeWidth={2.4} /> Buy again
                        </a>
                    </div>
                    <span className="shrink-0 text-[11px] font-medium rounded-full px-2 py-0.5" style={{ backgroundColor: tint("#10B981", "16"), color: "#10B981" }}>Active</span>
                </motion.div>
            ))}
        </motion.div>
    );
}

/* ---------------- Creators ---------------- */
function CreatorsList({ items, money, reduce }) {
    if (!items.length) return <Empty title="No creators yet" sub="Creators you support will be grouped here." Icon={Users} />;
    return (
        <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-4" variants={stagger(reduce)} initial="hidden" animate="show">
            {items.map((c) => (
                <motion.div key={c.owner?.username || c.open_link} variants={rise(reduce)} className={`${CARD} ${CARD_HOVER} p-4 flex items-center gap-3.5`}>
                    <img src={c.owner?.avatar} alt="" className="w-12 h-12 rounded-full object-cover bg-zinc-100" />
                    <div className="flex-1 min-w-0">
                        <a href={c.open_link} className="font-medium text-zinc-900 truncate block hover:underline">@{c.owner?.username}</a>
                        <div className={`text-xs text-zinc-400 mt-0.5 ${MONO}`}>
                            {c.purchase_count} purchases{c.active_subs ? ` · ${c.active_subs} active` : ""}
                        </div>
                        {c.support_story_url && (
                            <a href={c.support_story_url} className="mt-1 inline-flex items-center gap-1 text-xs font-medium hover:underline" style={{ color: ACCENT }}>
                                <MessageCircle size={11} strokeWidth={2.4} /> Our story
                            </a>
                        )}
                    </div>
                    <div className="text-right shrink-0">
                        <div className="text-[11px] text-zinc-400">Supported</div>
                        <div className={`font-semibold text-zinc-900 mt-0.5 ${MONO}`}>{money(c.total_spent)}</div>
                    </div>
                </motion.div>
            ))}
        </motion.div>
    );
}

/* ---------------- Receipts ---------------- */
function ReceiptsList({ items, money, reduce }) {
    if (!items.length) return <Empty title="No receipts yet" sub="A receipt is saved for every purchase you make." Icon={ReceiptText} />;
    return (
        <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-4" variants={stagger(reduce)} initial="hidden" animate="show">
            {items.map((r) => (
                <motion.div key={r.id} variants={rise(reduce)} className={`${CARD} ${CARD_HOVER} p-4 flex items-center gap-3.5`}>
                    <IconTile type={r.source_type} size={46} />
                    <div className="flex-1 min-w-0">
                        <div className="font-medium text-zinc-900 truncate">{r.title}</div>
                        <div className="text-xs text-zinc-400 truncate mt-0.5">@{r.owner?.username} · {fmtDate(r.date)}</div>
                    </div>
                    <div className="text-right shrink-0">
                        <div className={`font-semibold text-zinc-900 ${MONO}`}>{money(r.amount)}</div>
                        <a href={r.certificate_url} target="_blank" rel="noreferrer"
                            className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-zinc-600 hover:text-zinc-900">
                            <Download size={12} strokeWidth={2.2} /> Receipt
                        </a>
                    </div>
                </motion.div>
            ))}
        </motion.div>
    );
}

/* ---------------- Spending ---------------- */
function SpendingDetail({ summary, money, reduce }) {
    const by = summary.by_type || {};
    const rows = Object.keys(by).filter((k) => by[k] > 0).sort((a, b) => by[b] - by[a]);
    const max = rows.length ? by[rows[0]] : 1;
    return (
        <div className={`${CARD} p-6 max-w-2xl`}>
            <div className="flex justify-between items-end mb-6 pb-5 border-b border-zinc-100">
                <span className="text-sm text-zinc-500">Total spent</span>
                <span className={`text-2xl font-semibold text-zinc-900 ${MONO}`}>{money(summary.total_spent)}</span>
            </div>
            {rows.length ? (
                <div className="space-y-4">
                    {rows.map((k) => {
                        const c = cat(k);
                        const pct = Math.max(4, (by[k] / max) * 100);
                        return (
                            <div key={k}>
                                <div className="flex justify-between items-center text-sm mb-1.5">
                                    <span className="flex items-center gap-2 text-zinc-700">
                                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: c.color }} />
                                        {c.label}
                                    </span>
                                    <span className={`text-zinc-900 font-medium ${MONO}`}>{money(by[k])}</span>
                                </div>
                                <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                                    <motion.div className="h-full rounded-full" style={{ background: c.color }}
                                        initial={reduce ? false : { width: 0 }} animate={{ width: `${pct}%` }}
                                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <p className="text-sm text-zinc-500">No spending recorded yet.</p>
            )}
        </div>
    );
}

/* ---------------- Shared ---------------- */
function Empty({ title, sub, Icon }) {
    return (
        <div className={`${CARD} py-16 text-center`}>
            <span className="inline-flex w-14 h-14 rounded-full bg-zinc-100 items-center justify-center mb-4 text-zinc-400">
                <Icon size={24} strokeWidth={1.8} />
            </span>
            <div className="text-base font-medium text-zinc-900">{title}</div>
            <div className="text-sm text-zinc-500 mt-1.5 max-w-xs mx-auto">{sub}</div>
        </div>
    );
}

function fmtDate(s) {
    try {
        return new Date(String(s).replace(" ", "T")).toLocaleDateString(undefined, { day: "numeric", month: "short" });
    } catch {
        return s;
    }
}
