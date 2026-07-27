import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { usePage } from "@inertiajs/react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import LazyVideo from "../../Components/LazyVideo";
import { useVideoPoster } from "../../utils/videoPoster";
import {
    Heart, ShoppingBag, CheckCircle2, PiggyBank, Crown, Repeat, Coins,
    Wallet, Unlock, FileText, Music, Image as ImageIcon, Film,
    ArrowUpRight, Play, Trophy, Download, Truck, Clock, AlertTriangle, ReceiptText,
    Users, BellRing, RotateCw, MessageCircle, Bookmark, Search, X,
    ArrowDownUp, ChevronLeft, ChevronRight, Compass, LifeBuoy, Undo2, ShieldCheck,
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

// Engagement Levels (renamed from gem names, 24 July 2026). The backend already
// sends the colour on the status payload; this is only a fallback.
const TIER_COLOR = { "Level 1": "#9CA3AF", "Level 2": "#60A5FA", "Level 3": "#34D399", "Level 4": "#FBBF24", "Level 5": "#FF007F" };

const ACCENT = "#FF007F";
const CARD = "bg-white border border-zinc-200/70 rounded-box shadow-[0_1px_2px_rgba(16,24,40,0.04)]";
const CARD_HOVER = "transition-shadow duration-200 hover:shadow-[0_10px_30px_-12px_rgba(16,24,40,0.18)]";
const MONO = "[font-variant-numeric:tabular-nums] tabular-nums";
const EYEBROW = "text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400";

/* Four top-level tabs, each grouping what used to be its own tab. Eight tabs on a
   phone meant a horizontally-scrolled rail where half the destinations were never
   seen; these group by the question the buyer is actually asking. */
const TABS = [
    { key: "library", label: "Library", icon: Film },
    { key: "orders",  label: "Orders",  icon: Truck },
    { key: "money",   label: "Money",   icon: Wallet },
    { key: "saved",   label: "Saved",   icon: Bookmark },
];

const SORTS = { recent: "Recent", oldest: "Oldest first", name: "Name A–Z", price_desc: "Price: high → low", price_asc: "Price: low → high" };

/* Views that own a search box, and the sort keys each supports. */
const VIEW_TOOLS = {
    media:         { search: true, types: true,  sorts: ["recent", "oldest", "name"], server: true },
    access:        { search: true, types: true,  sorts: ["recent", "name"] },
    incoming:      { search: true, types: false, sorts: ["recent"] },
    subscriptions: { search: true, types: false, sorts: ["recent", "price_desc", "price_asc", "name"] },
    receipts:      { search: true, types: true,  sorts: ["recent", "price_desc", "price_asc", "name"] },
    saved:         { search: true, types: true,  sorts: ["recent", "name"] },
};

const DEFAULT_VIEW = { library: "media", orders: "incoming", money: "receipts", saved: "saved" };

const SEEN_KEY = "spenny_hub_seen_at";

const norm = (s) => String(s || "").toLowerCase();
const amountOf = (x) => Number(x?.amount ?? x?.total_spent ?? x?.price ?? 0);
const nameOf = (x) => x?.title || x?.owner?.username || "";
const typeOf = (x) => x?.source_type || x?.product_type;
const dateOf = (x) => x?.purchased_at || x?.date || x?.created_at || x?.unlocked_at || x?.started_at || x?.saved_at || "";

function useDebounced(value, ms = 300) {
    const [v, setV] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setV(value), ms);
        return () => clearTimeout(t);
    }, [value, ms]);
    return v;
}

/** Read the hub's own query params (tab / view / creator / q) off the URL. */
function readUrlState() {
    if (typeof window === "undefined") return {};
    const p = new URLSearchParams(window.location.search);
    return {
        tab: p.get("tab") || null,
        view: p.get("view") || null,
        creator: p.get("creator") || "",
        q: p.get("q") || "",
    };
}

export default function PurchasesHub({
    display_currency = "GBP",
    media_library = [],
    media_pagination = {},
    media_types = {},
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

    const url = useMemo(() => (embedded ? {} : readUrlState()), [embedded]);
    const hasOverdue = incoming.some((i) => i.is_overdue);

    // An overdue delivery is the only thing on this page that needs the buyer to act,
    // so it decides the landing tab. Landing on the media grid buried it.
    const [tab, setTab] = useState(url.tab || (hasOverdue ? "orders" : "library"));
    const [view, setView] = useState(url.view || DEFAULT_VIEW[url.tab] || (hasOverdue ? "incoming" : "media"));
    const [creatorFilter, setCreatorFilter] = useState(url.creator || "");

    const [media, setMedia] = useState(media_library);
    const [page, setPage] = useState(media_pagination.current_page || 1);
    const [lastPage, setLastPage] = useState(media_pagination.last_page || 1);
    const [matched, setMatched] = useState(media_pagination.total ?? media_library.length);
    const [loading, setLoading] = useState(false);
    const [subs, setSubs] = useState(subscriptions);
    const [busySub, setBusySub] = useState(null);
    const [savedItems, setSavedItems] = useState(saved);
    const [incomingItems, setIncomingItems] = useState(incoming);
    const [busyIncoming, setBusyIncoming] = useState(null);

    const [query, setQuery] = useState(url.q || "");
    const [sort, setSort] = useState("recent");
    const [typeFilter, setTypeFilter] = useState(null);
    const [lightbox, setLightbox] = useState(null);
    const [confirm, setConfirm] = useState(null);   // { title, body, confirmLabel, tone, onConfirm }
    const [report, setReport] = useState(null);     // incoming row being reported
    const [toast, setToast] = useState(null);

    const debouncedQuery = useDebounced(query, 320);

    // "New since you last looked" — a local marker, so no migration and nothing
    // personal stored server-side. Stamped after the badges have been on screen.
    const [seenAt] = useState(() => {
        if (typeof window === "undefined") return null;
        try { return window.localStorage.getItem(SEEN_KEY); } catch { return null; }
    });
    useEffect(() => {
        const t = setTimeout(() => {
            try { window.localStorage.setItem(SEEN_KEY, new Date().toISOString()); } catch { /* private mode */ }
        }, 2500);
        return () => clearTimeout(t);
    }, []);
    const isNew = useCallback((row) => {
        if (!seenAt) return false;
        const d = dateOf(row);
        return d ? String(d).replace(" ", "T") > seenAt : false;
    }, [seenAt]);

    useEffect(() => { setSubs(subscriptions); }, [subscriptions]);
    useEffect(() => { setSavedItems(saved); }, [saved]);
    useEffect(() => { setIncomingItems(incoming); }, [incoming]);

    // Switching tab resets the per-view tools but deliberately KEEPS the creator
    // filter — "show me everything from @x" is a cross-tab question.
    useEffect(() => {
        const v = DEFAULT_VIEW[tab];
        setView((cur) => (viewsFor(tab).includes(cur) ? cur : v));
    }, [tab]);
    // Reset the per-view tools when the buyer switches view — but NOT on mount, or the
    // search seeded from a shared/bookmarked ?q= link would clear itself on arrival.
    const firstViewRun = useRef(true);
    useEffect(() => {
        if (firstViewRun.current) { firstViewRun.current = false; return; }
        setQuery("");
        setTypeFilter(null);
        setSort(VIEW_TOOLS[view]?.sorts?.[0] || "recent");
    }, [view]);

    // Keep the URL in step so refresh/back/share all land where the buyer was.
    useEffect(() => {
        if (embedded || typeof window === "undefined") return;
        const p = new URLSearchParams(window.location.search);
        const set = (k, v) => (v ? p.set(k, v) : p.delete(k));
        set("tab", tab === "library" ? "" : tab);
        set("view", view === DEFAULT_VIEW[tab] ? "" : view);
        set("creator", creatorFilter);
        set("q", debouncedQuery.trim());
        const qs = p.toString();
        window.history.replaceState({}, "", qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
    }, [tab, view, creatorFilter, debouncedQuery, embedded]);

    const symbol = symbols?.[display_currency] ?? "";
    const money = (n) => `${symbol}${Number(n || 0).toFixed(2)}`;
    const hasMore = lastPage > page;

    /* ---- Media: search/filter/sort run on the SERVER ----------------------
       The library is paginated 30 at a time, so a client-side filter can only
       ever see the rows already fetched and reports "no matches" for anything
       further in. Every tool change refetches page 1. */
    const mediaQueryString = useCallback((p = 1) => {
        const params = new URLSearchParams({ page: String(p), sort });
        if (debouncedQuery.trim()) params.set("q", debouncedQuery.trim());
        if (typeFilter) params.set("type", typeFilter);
        if (creatorFilter) params.set("creator", creatorFilter);
        return params.toString();
    }, [debouncedQuery, typeFilter, creatorFilter, sort]);

    const fetchMedia = useCallback((p, append) => {
        setLoading(true);
        fetch(`/my-purchases-feed?${mediaQueryString(p)}`, { headers: { Accept: "application/json" } })
            .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
            .then((d) => {
                setMedia((prev) => (append ? [...prev, ...(d.medias || [])] : d.medias || []));
                setPage(d.current_page || p);
                setLastPage(d.last_page || 1);
                if (typeof d.total_matched === "number") setMatched(d.total_matched);
            })
            .catch(() => { if (!append) setMedia([]); })
            .finally(() => setLoading(false));
    }, [mediaQueryString]);

    // Skip the very first run: the server already rendered page 1 with these filters.
    const firstMediaRun = useRef(true);
    useEffect(() => {
        if (firstMediaRun.current) { firstMediaRun.current = false; return; }
        if (view !== "media") return;
        fetchMedia(1, false);
        setLightbox(null);
    }, [debouncedQuery, typeFilter, creatorFilter, sort, view, fetchMedia]);

    const loadMore = () => { if (!loading && hasMore) fetchMedia(page + 1, true); };

    /* ---- Subscription actions --------------------------------------------- */
    const cancelSub = (sub) => {
        setConfirm({
            title: `Cancel ${sub.title}?`,
            body: "You keep full access until the end of the period you've already paid for. Nothing is charged after that, and you can undo this any time before it ends.",
            confirmLabel: "Cancel renewal",
            tone: "danger",
            onConfirm: () => runSubAction(sub, "cancel"),
        });
    };

    const resumeSub = (sub) => runSubAction(sub, "resume");

    const runSubAction = (sub, action) => {
        if (!sub?.raw_id || busySub || !window.axios) return;
        setBusySub(sub.id);
        window.axios.post(`/subscriptions/${sub.raw_id}/${action}`)
            .then(() => {
                // The row STAYS in the list — cancelling only stops the next charge.
                setSubs((prev) => prev.map((s) => (s.id === sub.id ? {
                    ...s,
                    is_canceling: action === "cancel",
                    cancelable: action !== "cancel",
                    resumable: action === "cancel",
                    ends_at: action === "cancel" ? s.next_charge_at || s.ends_at : null,
                    next_charge_at: action === "cancel" ? null : s.ends_at || s.next_charge_at,
                } : s)));
                setToast(action === "cancel"
                    ? "Renewal cancelled — you keep access until the period ends."
                    : "Subscription resumed. It will renew as normal.");
            })
            .catch((e) => setToast(e?.response?.data?.error || "Couldn’t update that right now. Please try again."))
            .finally(() => { setBusySub(null); setConfirm(null); });
    };

    /* ---- Incoming actions -------------------------------------------------- */
    const acceptDelivery = (item) => {
        setConfirm({
            title: "Accept this delivery?",
            body: "This confirms the creator delivered what you paid for and releases their payment. You can't undo it, so check the work first.",
            confirmLabel: "Accept and release payment",
            tone: "primary",
            onConfirm: () => {
                if (!item.task_uuid || !window.axios) return;
                setBusyIncoming(item.id);
                window.axios.post(`/task/purchase/${item.task_uuid}/review`, { action: "accept" })
                    .then(() => {
                        setIncomingItems((prev) => prev.filter((i) => i.id !== item.id));
                        setToast("Delivery accepted. Thanks — the creator has been paid.");
                    })
                    .catch((e) => setToast(e?.response?.data?.error || "Couldn’t accept that right now. Please try again."))
                    .finally(() => { setBusyIncoming(null); setConfirm(null); });
            },
        });
    };

    const submitReport = (item, message) => {
        if (!window.axios || !message.trim()) return;
        setBusyIncoming(item.id);
        window.axios.post("/support/tickets", {
            type: "contact",
            creator_username: item.creator_username,
            source: item.support_source,
            source_id: item.support_source_id,
            event_type: "order_issue",
            message: message.trim(),
        })
            .then(() => { setReport(null); setToast("Message sent. The creator has 48 hours to reply."); })
            .catch((e) => setToast(e?.response?.data?.error || "Couldn’t send that. Please try again."))
            .finally(() => setBusyIncoming(null));
    };

    const removeSaved = (it) => {
        if (!window.axios) return;
        setSavedItems((prev) => prev.filter((s) => s.id !== it.id));
        window.axios.post("/saved/toggle", { product_type: it.product_type, item_id: it.item_id })
            .catch(() => setSavedItems((prev) => [it, ...prev]));
    };

    /* ---- Derived ----------------------------------------------------------- */
    const renewingSoon = subs.filter((s) => {
        if (!s.next_charge_at) return false;
        const d = (new Date(String(s.next_charge_at).replace(" ", "T")) - new Date()) / 86400000;
        return d >= 0 && d <= 7;
    });

    const byCreator = (list) => (creatorFilter ? list.filter((x) => x?.owner?.username === creatorFilter) : list);

    const rawSource = {
        media,                                    // already creator-filtered server-side
        access: byCreator(unlocked),
        incoming: byCreator(incomingItems),
        subscriptions: byCreator(subs),
        receipts: byCreator(receipts),
        saved: byCreator(savedItems),
    }[view] || [];

    const typeOptions = useMemo(() => {
        if (!VIEW_TOOLS[view]?.types) return [];
        if (view === "media") return Object.keys(media_types || {});
        return [...new Set(rawSource.map(typeOf).filter(Boolean))];
    }, [view, rawSource, media_types]);

    // Media is filtered server-side; everything else is a complete list in memory.
    const list = useMemo(() => {
        const tools = VIEW_TOOLS[view] || {};
        if (tools.server) return rawSource;
        let out = rawSource;
        if (tools.search && debouncedQuery.trim()) {
            const q = norm(debouncedQuery);
            out = out.filter((x) => norm(nameOf(x)).includes(q) || norm(x?.owner?.username).includes(q));
        }
        if (tools.types && typeFilter) out = out.filter((x) => typeOf(x) === typeFilter);
        if (sort !== "recent") {
            out = [...out].sort((a, b) => {
                if (sort === "name") return norm(nameOf(a)).localeCompare(norm(nameOf(b)));
                if (sort === "price_desc") return amountOf(b) - amountOf(a);
                if (sort === "price_asc") return amountOf(a) - amountOf(b);
                if (sort === "oldest") return String(dateOf(a)).localeCompare(String(dateOf(b)));
                return 0;
            });
        }
        return out;
    }, [view, rawSource, debouncedQuery, typeFilter, sort]);

    const tools = VIEW_TOOLS[view] || {};
    const filtered = !!(debouncedQuery.trim() || typeFilter || creatorFilter);
    const shownTotal = view === "media" ? matched : list.length;

    // media_types counts the WHOLE library, so the tab count stays honest when the
    // page was opened on a filtered URL (media_pagination.total is the matched count).
    const libraryTotal = useMemo(
        () => Object.values(media_types || {}).reduce((a, b) => a + Number(b || 0), 0),
        [media_types]
    );

    const counts = {
        library: libraryTotal,
        orders: incomingItems.length + subs.filter((s) => s.is_active).length,
        money: receipts.length,
        saved: savedItems.length,
    };

    const inner = (
        <div className={`mx-auto px-4 sm:px-6 ${embedded ? "max-w-[1080px]" : "max-w-[1140px] pt-5 sm:pt-9"}`}>
            <Hero
                embedded={embedded}
                media={media}
                summary={spend_summary}
                money={money}
                reduce={reduce}
                status={supporter_status}
                overdue={incomingItems.filter((i) => i.is_overdue).length}
                onOverdue={() => { setTab("orders"); setView("incoming"); }}
            />

            {renewingSoon.length > 0 && (
                <RenewingBanner
                    items={renewingSoon}
                    money={money}
                    onCancel={cancelSub}
                    busy={busySub}
                    onView={() => { setTab("orders"); setView("subscriptions"); }}
                />
            )}

            {/* Tab rail — sticky, four destinations so nothing scrolls out of reach */}
            <div className={`${embedded ? "" : "sticky top-2 z-20"} mt-7 mb-4`}>
                <div className="flex gap-1 bg-white/90 backdrop-blur border border-zinc-200/70 rounded-box-sm p-1.5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
                    {TABS.map((t) => {
                        const Icon = t.icon;
                        const active = tab === t.key;
                        const alert = t.key === "orders" && hasOverdue;
                        return (
                            <button
                                key={t.key}
                                onClick={() => setTab(t.key)}
                                aria-pressed={active}
                                className={`group flex-1 flex items-center justify-center gap-2 px-2 sm:px-3.5 min-h-[44px] rounded-[14px] text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF007F]/40 ${
                                    active ? "bg-zinc-900 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
                                }`}
                            >
                                <Icon size={15} strokeWidth={2} />
                                <span className={active ? "" : "hidden xs:inline sm:inline"}>{t.label}</span>
                                {alert && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" aria-label="Needs attention" />}
                                {!alert && counts[t.key] > 0 && (
                                    <span className={`text-[11px] rounded-full px-1.5 py-0.5 hidden sm:inline ${MONO} ${
                                        active ? "bg-white/15 text-white/80" : "bg-zinc-100 text-zinc-400"
                                    }`}>{counts[t.key]}</span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            <ViewSwitch tab={tab} view={view} setView={setView} counts={{
                media: libraryTotal,
                access: unlocked.length,
                incoming: incomingItems.length,
                subscriptions: subs.length,
                receipts: receipts.length,
                creators: creators.length,
            }} />

            {tools.search && (
                <Toolbar
                    query={query} setQuery={setQuery}
                    sort={sort} setSort={setSort} sorts={tools.sorts}
                    typeOptions={tools.types ? typeOptions : []}
                    typeFilter={typeFilter} setTypeFilter={setTypeFilter}
                    creators={creators} creatorFilter={creatorFilter} setCreatorFilter={setCreatorFilter}
                    shown={shownTotal} filtered={filtered}
                    loading={loading && view === "media"}
                />
            )}

            <AnimatePresence mode="wait">
                <motion.div
                    key={view}
                    initial={reduce ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduce ? { opacity: 1 } : { opacity: 0, y: -6 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                >
                    {view === "media" && (
                        <MediaGrid items={list} hasMore={hasMore} loadMore={loadMore} loading={loading}
                            reduce={reduce} filtered={filtered} onOpen={setLightbox} isNew={isNew} />
                    )}
                    {view === "access" && <UnlockedList items={list} reduce={reduce} filtered={filtered} isNew={isNew} />}
                    {view === "incoming" && (
                        <IncomingList items={list} reduce={reduce} filtered={filtered} isNew={isNew}
                            onAccept={acceptDelivery} onReport={setReport} busy={busyIncoming} />
                    )}
                    {view === "subscriptions" && (
                        <SubscriptionList items={list} money={money} reduce={reduce} filtered={filtered}
                            onCancel={cancelSub} onResume={resumeSub} busy={busySub} />
                    )}
                    {view === "receipts" && <MoneyView summary={spend_summary} receipts={list} creators={creators}
                        money={money} reduce={reduce} filtered={filtered} embedded={embedded}
                        onCreator={(u) => setCreatorFilter(u)} />}
                    {view === "saved" && <SavedList items={list} money={money} reduce={reduce} filtered={filtered} onRemove={removeSaved} />}
                </motion.div>
            </AnimatePresence>

            <AnimatePresence>
                {lightbox !== null && list[lightbox] && (
                    <Lightbox items={list} index={lightbox} onIndex={setLightbox} onClose={() => setLightbox(null)} reduce={reduce} />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {confirm && <ConfirmDialog {...confirm} busy={!!busySub || !!busyIncoming} onClose={() => setConfirm(null)} reduce={reduce} />}
            </AnimatePresence>

            <AnimatePresence>
                {report && (
                    <ReportDialog item={report} busy={busyIncoming === report.id}
                        onSubmit={(msg) => submitReport(report, msg)} onClose={() => setReport(null)} reduce={reduce} />
                )}
            </AnimatePresence>

            <Toast message={toast} onDone={() => setToast(null)} />
        </div>
    );

    if (embedded) return inner;
    return <div className="relative min-h-dvh pb-24 bg-[#F7F7F8] text-zinc-900" style={{ paddingBottom: "calc(6rem + env(safe-area-inset-bottom))" }}>{inner}</div>;
}

function viewsFor(tab) {
    return {
        library: ["media", "access"],
        orders: ["incoming", "subscriptions"],
        money: ["receipts"],
        saved: ["saved"],
    }[tab] || [];
}

const stagger = (reduce) => ({ hidden: {}, show: { transition: { staggerChildren: reduce ? 0 : 0.04 } } });
const rise = (reduce) => ({
    hidden: reduce ? { opacity: 1 } : { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
});

/* ---------------- Sub-view segmented control ---------------- */
function ViewSwitch({ tab, view, setView, counts }) {
    const opts = {
        library: [{ k: "media", label: "Media" }, { k: "access", label: "Access passes" }],
        orders: [{ k: "incoming", label: "In progress" }, { k: "subscriptions", label: "Subscriptions" }],
    }[tab];
    if (!opts) return null;
    return (
        <div className="flex gap-1.5 mb-5">
            {opts.map((o) => {
                const active = view === o.k;
                return (
                    <button key={o.k} onClick={() => setView(o.k)} aria-pressed={active}
                        className={`inline-flex items-center gap-2 min-h-[40px] px-3.5 rounded-full text-sm font-medium border transition ${
                            active ? "bg-zinc-900 text-white border-transparent" : "bg-white text-zinc-600 border-zinc-200/70 hover:border-zinc-300"
                        }`}>
                        {o.label}
                        <span className={`text-[11px] ${MONO} ${active ? "text-white/60" : "text-zinc-400"}`}>{counts[o.k] ?? 0}</span>
                    </button>
                );
            })}
        </div>
    );
}

/* ---------------- Toolbar ---------------- */
function Toolbar({
    query, setQuery, sort, setSort, sorts = [], typeOptions = [], typeFilter, setTypeFilter,
    creators = [], creatorFilter, setCreatorFilter, shown, filtered, loading,
}) {
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

                {creators.length > 1 && (
                    <div className="relative shrink-0">
                        <Users size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                        <select value={creatorFilter} onChange={(e) => setCreatorFilter(e.target.value)} aria-label="Filter by creator"
                            className="appearance-none w-full sm:w-auto min-h-[44px] pl-9 pr-9 rounded-box-sm bg-white border border-zinc-200/70 text-sm font-medium text-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#FF007F]/30 cursor-pointer">
                            <option value="">All creators</option>
                            {creators.map((c) => (
                                <option key={c.owner?.username} value={c.owner?.username || ""}>@{c.owner?.username}</option>
                            ))}
                        </select>
                        <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-zinc-400 pointer-events-none" />
                    </div>
                )}

                {hasSort && (
                    <div className="relative shrink-0">
                        <ArrowDownUp size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                        <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort"
                            className="appearance-none w-full sm:w-auto min-h-[44px] pl-9 pr-9 rounded-box-sm bg-white border border-zinc-200/70 text-sm font-medium text-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#FF007F]/30 cursor-pointer">
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

            {(filtered || loading) && (
                <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-2">
                    {loading ? "Searching…" : `${shown} ${shown === 1 ? "result" : "results"}`}
                    {filtered && !loading && (
                        <button onClick={() => { setQuery(""); setTypeFilter(null); setCreatorFilter(""); }}
                            className="font-medium text-zinc-500 hover:text-zinc-900 underline underline-offset-2">Clear filters</button>
                    )}
                </div>
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

/* ---------------- Dialogs ---------------- */
function Backdrop({ children, onClose, reduce }) {
    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
    }, [onClose]);
    return (
        <motion.div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6"
            initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }} onClick={onClose}
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
            <motion.div onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true"
                initial={reduce ? false : { y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={reduce ? { opacity: 0 } : { y: 24, opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="w-full sm:max-w-md bg-white rounded-t-box sm:rounded-box p-6 shadow-2xl">
                {children}
            </motion.div>
        </motion.div>
    );
}

function ConfirmDialog({ title, body, confirmLabel, tone = "primary", onConfirm, onClose, busy, reduce }) {
    return (
        <Backdrop onClose={busy ? () => {} : onClose} reduce={reduce}>
            <div className="text-lg font-semibold text-zinc-900">{title}</div>
            <p className="text-sm text-zinc-500 mt-2 leading-relaxed">{body}</p>
            <div className="flex gap-2.5 mt-6">
                <button onClick={onClose} disabled={busy}
                    className="flex-1 min-h-[44px] rounded-box-sm border border-zinc-200 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition disabled:opacity-50">
                    Keep it
                </button>
                <button onClick={onConfirm} disabled={busy}
                    className="flex-1 min-h-[44px] rounded-box-sm text-sm font-semibold text-white transition disabled:opacity-60"
                    style={{ backgroundColor: tone === "danger" ? "#E11D48" : ACCENT }}>
                    {busy ? "Processing…" : confirmLabel}
                </button>
            </div>
        </Backdrop>
    );
}

function ReportDialog({ item, onSubmit, onClose, busy, reduce }) {
    const [msg, setMsg] = useState("");
    return (
        <Backdrop onClose={busy ? () => {} : onClose} reduce={reduce}>
            <div className="text-lg font-semibold text-zinc-900">Problem with this order?</div>
            <p className="text-sm text-zinc-500 mt-2 leading-relaxed">
                This opens a ticket with <span className="font-medium text-zinc-700">@{item.creator_username}</span> about
                “{item.title}”. They have 48 hours to reply before support steps in.
            </p>
            <textarea
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                rows={4}
                maxLength={2000}
                autoFocus
                placeholder="Tell them what went wrong…"
                className="w-full mt-4 p-3 rounded-box-sm border border-zinc-200 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#FF007F]/30 resize-none"
            />
            <div className="flex gap-2.5 mt-4">
                <button onClick={onClose} disabled={busy}
                    className="flex-1 min-h-[44px] rounded-box-sm border border-zinc-200 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition disabled:opacity-50">
                    Cancel
                </button>
                <button onClick={() => onSubmit(msg)} disabled={busy || !msg.trim()}
                    className="flex-1 min-h-[44px] rounded-box-sm text-sm font-semibold text-white transition disabled:opacity-50"
                    style={{ backgroundColor: ACCENT }}>
                    {busy ? "Sending…" : "Send message"}
                </button>
            </div>
        </Backdrop>
    );
}

function Toast({ message, onDone }) {
    // onDone is an inline arrow in the parent, so a new identity every render would
    // restart the dismiss timer on each re-render. Hold it in a ref.
    const done = useRef(onDone);
    done.current = onDone;
    useEffect(() => {
        if (!message) return;
        const t = setTimeout(() => done.current(), 4200);
        return () => clearTimeout(t);
    }, [message]);
    return (
        <AnimatePresence>
            {message && (
                <motion.div
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    role="status"
                    className="fixed left-1/2 -translate-x-1/2 z-[60] bg-zinc-900 text-white text-sm font-medium px-4 py-3 rounded-box-sm shadow-xl max-w-[92vw] text-center"
                    style={{ bottom: "calc(6rem + env(safe-area-inset-bottom))" }}>
                    {message}
                </motion.div>
            )}
        </AnimatePresence>
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
                        // LazyVideo resolves the real poster from the video UUID; passing the
                        // video URL as posterSrc would hand an <img> a video file.
                        <LazyVideo src={item.media_url} fallback={item.owner?.avatar} controls
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

/* ---------------- Small shared pieces ---------------- */
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

function NewDot() {
    return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide rounded-full px-1.5 py-0.5"
            style={{ backgroundColor: tint(ACCENT, "16"), color: ACCENT }}>
            New
        </span>
    );
}

/**
 * One row layout, shared by every list view. Five views used to hand-roll the same
 * avatar + title + @creator + right-hand meta arrangement, and they had already
 * drifted apart from each other.
 */
function RowCard({ lead, title, titleHref, subtitle, meta, right, actions, badge }) {
    return (
        <div className={`${CARD} ${CARD_HOVER} p-4 flex items-center gap-3.5`}>
            {lead}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                    {titleHref
                        ? <a href={titleHref} className="font-medium text-zinc-900 truncate hover:underline">{title}</a>
                        : <span className="font-medium text-zinc-900 truncate">{title}</span>}
                    {badge}
                </div>
                {subtitle && <div className="text-xs text-zinc-400 truncate mt-0.5">{subtitle}</div>}
                {meta && <div className="flex items-center gap-2 mt-1.5 flex-wrap">{meta}</div>}
                {actions && <div className="flex items-center gap-2.5 mt-2 flex-wrap">{actions}</div>}
            </div>
            {right && <div className="text-right shrink-0">{right}</div>}
        </div>
    );
}

function LinkAction({ onClick, href, children, tone = "accent", disabled }) {
    const cls = `inline-flex items-center gap-1 text-xs font-medium min-h-[32px] transition-colors disabled:opacity-50 ${
        tone === "danger" ? "text-zinc-400 hover:text-rose-600" : tone === "quiet" ? "text-zinc-500 hover:text-zinc-900" : "hover:underline"
    }`;
    const style = tone === "accent" ? { color: ACCENT } : undefined;
    if (href) return <a href={href} className={cls} style={style}>{children}</a>;
    return <button onClick={onClick} disabled={disabled} className={cls} style={style}>{children}</button>;
}

/* ---------------- Hero ---------------- */
function Hero({ embedded, media, summary, money, reduce, status, overdue, onOverdue }) {
    const Title = embedded ? "h2" : "h1";
    return (
        <div className={`${CARD} overflow-hidden`}>
            <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
                <div className="p-5 sm:p-7 md:p-9">
                    <div className={EYEBROW}>Your library</div>
                    <Title className={`${embedded ? "text-2xl md:text-3xl" : "text-2xl sm:text-3xl md:text-[2.6rem]"} font-semibold tracking-tight text-zinc-900 mt-1.5 leading-tight`}>
                        My purchases
                    </Title>

                    {/* Compact stat row — three numbers on one line even on a phone, so the
                        content below is reachable without scrolling past a full screen. */}
                    <div className="mt-5 grid grid-cols-3 gap-3 max-w-md">
                        <Stat label="Total spent" value={<CountUp value={Number(summary.total_spent || 0)} money={money} reduce={reduce} />} big />
                        <Stat label="This month" value={money(summary.this_month)} />
                        <Stat label="Creators" value={summary.creators_supported || 0} />
                    </div>

                    {overdue > 0 && (
                        <button onClick={onOverdue}
                            className="mt-5 inline-flex items-center gap-2 min-h-[44px] px-4 rounded-box-sm text-sm font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition">
                            <AlertTriangle size={15} strokeWidth={2.2} />
                            {overdue} {overdue === 1 ? "delivery is" : "deliveries are"} overdue
                        </button>
                    )}

                    {status && <SupporterStatus status={status} reduce={reduce} />}
                </div>

                {/* Decorative — desktop only. On a phone it pushed every action below the fold. */}
                <div className="relative bg-zinc-50 border-l border-zinc-200/70 min-h-[260px] hidden lg:flex items-center justify-center p-7">
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

function Stat({ label, value, big }) {
    return (
        <div className="min-w-0">
            <div className={EYEBROW}>{label}</div>
            <div className={`${big ? "text-2xl sm:text-[2rem]" : "text-lg sm:text-xl"} font-semibold text-zinc-900 leading-none mt-1.5 truncate ${MONO}`}>
                {value}
            </div>
        </div>
    );
}

function SupporterStatus({ status, reduce }) {
    const [open, setOpen] = useState(false);
    const color = status.color || TIER_COLOR[status.level] || ACCENT;
    const breakdown = status.breakdown || {};
    const rows = Object.keys(breakdown);
    return (
        <div className="mt-6 max-w-md">
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
            <div className="flex items-center justify-between gap-3 mt-1.5">
                <span className="text-[11px] text-zinc-400">
                    {status.next_level ? `${status.to_next} pts to ${status.next_level}` : "Top tier reached"} · last 90 days
                </span>
                {rows.length > 0 && (
                    <button onClick={() => setOpen((o) => !o)} className="text-[11px] font-medium text-zinc-500 hover:text-zinc-900 min-h-[32px]">
                        {open ? "Hide" : "How this works"}
                    </button>
                )}
            </div>
            <AnimatePresence>
                {open && rows.length > 0 && (
                    <motion.ul
                        initial={reduce ? false : { opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden mt-2 space-y-1">
                        {rows.map((k) => (
                            <li key={k} className="flex items-center justify-between text-[11px] text-zinc-500 capitalize">
                                <span>{String(k).replace(/_/g, " ")}</span>
                                <span className={MONO}>{Math.round(Number(breakdown[k]) || 0)} pts</span>
                            </li>
                        ))}
                    </motion.ul>
                )}
            </AnimatePresence>
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
function MediaGrid({ items, hasMore, loadMore, loading, reduce, filtered, onOpen, isNew }) {
    if (!items.length && loading) {
        return <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">{[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <SkeletonCard key={i} />)}</div>;
    }
    if (!items.length) {
        return filtered
            ? <Empty title="No matches" sub="Try a different search or clear the filters." Icon={Search} />
            : <Empty title="No media yet" sub="Content you buy from creators lands here — and stays here for good." Icon={Film} cta />;
    }
    return (
        <>
            <motion.div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4" variants={stagger(reduce)} initial="hidden" animate="show">
                {items.map((it, i) => (
                    <motion.div key={it.id} variants={rise(reduce)}><MediaCard item={it} onOpen={() => onOpen(i)} isNew={isNew(it)} /></motion.div>
                ))}
                {loading && [0, 1, 2, 3].map((i) => <SkeletonCard key={`sk${i}`} />)}
            </motion.div>
            {hasMore && (
                <div className="text-center mt-7">
                    <button onClick={loadMore} disabled={loading}
                        className="px-5 min-h-[44px] rounded-full text-sm font-medium text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 transition-colors disabled:opacity-50">
                        {loading ? "Loading…" : "Load more"}
                    </button>
                </div>
            )}
        </>
    );
}

function MediaCard({ item, onOpen, isNew }) {
    const { media_kind, media_url, owner, title } = item;
    const c = cat(item.source_type);
    const openable = media_kind === "image" || media_kind === "video" || media_kind === "audio" || media_kind === "pdf";
    // A video tile shows the video's OWN first frame (resolved lazily from the
    // video_posters table), falling back to the creator avatar — not the avatar as
    // the picture of the thing the buyer paid for.
    const poster = useVideoPoster(media_kind === "video" ? media_url : null, owner?.avatar);

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
                        {poster && <img src={poster} alt="" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />}
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
                {isNew && <span className="absolute top-2 right-2"><NewDot /></span>}
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
function RenewingBanner({ items, money, onCancel, busy, onView }) {
    return (
        <div className={`mt-5 ${CARD} p-5`} style={{ borderColor: tint("#F59E0B", "55") }}>
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
                            <button onClick={() => onCancel(s)} disabled={busy === s.id}
                                className="shrink-0 text-xs font-medium text-zinc-500 hover:text-rose-600 transition-colors disabled:opacity-50 min-h-[44px] px-2">
                                {busy === s.id ? "…" : "Cancel"}
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
function SubscriptionList({ items, money, reduce, onCancel, onResume, busy, filtered }) {
    if (!items.length) {
        return filtered
            ? <Empty title="No matches" sub="Try a different search or clear the filters." Icon={Search} />
            : <Empty title="No subscriptions yet" sub="Memberships and recurring content subscriptions appear here — active and past." Icon={Repeat} cta />;
    }
    return (
        <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-4" variants={stagger(reduce)} initial="hidden" animate="show">
            {items.map((s) => (
                <motion.div key={s.id} variants={rise(reduce)}>
                    <RowCard
                        lead={<img src={s.owner?.avatar} alt="" className="w-12 h-12 rounded-box-sm object-cover bg-zinc-100" />}
                        title={s.title}
                        subtitle={`@${s.owner?.username}`}
                        badge={s.is_canceling ? <StatusPill tone="#F59E0B" label="Cancelling" /> : s.is_active === false ? <StatusPill tone="#71717A" label="Ended" /> : null}
                        meta={
                            <span className="text-xs text-zinc-500">
                                {/* A cancelled subscription is still LIVE until its period ends —
                                    say so, or the buyer thinks the access they paid for is gone. */}
                                {s.is_canceling && s.ends_at ? `Access until ${fmtDate(s.ends_at)} · no further charges`
                                    : s.next_charge_at ? `Renews ${fmtDate(s.next_charge_at)}`
                                    : s.is_active === false && s.last_charge_at ? `Last charged ${fmtDate(s.last_charge_at)}`
                                    : null}
                            </span>
                        }
                        actions={
                            <>
                                <LinkAction href={s.open_link}>View</LinkAction>
                                {s.cancelable && <LinkAction tone="danger" onClick={() => onCancel(s)} disabled={busy === s.id}>{busy === s.id ? "…" : "Cancel renewal"}</LinkAction>}
                                {s.resumable && (
                                    <LinkAction onClick={() => onResume(s)} disabled={busy === s.id}>
                                        <Undo2 size={12} strokeWidth={2.4} /> {busy === s.id ? "…" : "Resume"}
                                    </LinkAction>
                                )}
                            </>
                        }
                        right={
                            <>
                                <div className={`font-semibold text-zinc-900 ${MONO}`}>{money(s.amount)}</div>
                                {s.recurring_type && <div className="text-[11px] text-zinc-400 mt-0.5 capitalize">{s.recurring_type}</div>}
                            </>
                        }
                    />
                </motion.div>
            ))}
        </motion.div>
    );
}

function StatusPill({ tone, label }) {
    return (
        <span className="shrink-0 text-[11px] font-medium rounded-full px-2 py-0.5 capitalize"
            style={{ backgroundColor: tint(tone, "16"), color: tone }}>{label}</span>
    );
}

/* ---------------- Incoming ---------------- */
function IncomingList({ items, reduce, onAccept, onReport, busy, filtered, isNew }) {
    if (!items.length) {
        return filtered
            ? <Empty title="No matches" sub="Try a different search or clear the filters." Icon={Search} />
            : <Empty title="Nothing in transit" sub="Orders and creator work on their way to you show here, with tracking and delivery dates." Icon={Truck} />;
    }
    return (
        <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-4" variants={stagger(reduce)} initial="hidden" animate="show">
            {items.map((it) => {
                const status = it.is_overdue ? "Overdue" : (it.status || "pending");
                const tone = it.is_overdue ? "#E11D48" : it.status === "shipped" ? "#3B82F6" : "#F59E0B";
                const StatusIcon = it.is_overdue ? AlertTriangle : it.is_physical ? Truck : Clock;
                return (
                    <motion.div key={it.id} variants={rise(reduce)}>
                        <RowCard
                            lead={
                                <span className="w-12 h-12 rounded-box-sm flex items-center justify-center shrink-0" style={{ backgroundColor: tint(tone, "16"), color: tone }}>
                                    <StatusIcon size={20} strokeWidth={2} />
                                </span>
                            }
                            title={it.title}
                            subtitle={`@${it.owner?.username}`}
                            badge={isNew(it) ? <NewDot /> : null}
                            meta={
                                <>
                                    <StatusPill tone={tone} label={status} />
                                    {it.is_physical && it.tracking_id && (
                                        <span className={`text-[11px] text-zinc-400 truncate ${MONO}`}>{it.courier ? `${it.courier} · ` : ""}{it.tracking_id}</span>
                                    )}
                                    {!it.is_physical && it.due_at && <span className="text-[11px] text-zinc-400">Due {fmtDate(it.due_at)}</span>}
                                    {it.is_physical && it.eta && <span className="text-[11px] text-zinc-400">Arrives {fmtDate(it.eta)}</span>}
                                    {!it.due_at && !it.eta && it.waiting_days > 0 && (
                                        <span className="text-[11px] text-zinc-400">Waiting {it.waiting_days}d</span>
                                    )}
                                </>
                            }
                            actions={
                                <>
                                    {/* Accepting releases escrow, so it lives where the buyer is
                                        already looking at the order — not only on the task page. */}
                                    {it.can_accept && (
                                        <button onClick={() => onAccept(it)} disabled={busy === it.id}
                                            className="inline-flex items-center gap-1.5 min-h-[36px] px-3 rounded-full text-xs font-semibold text-white transition disabled:opacity-50"
                                            style={{ backgroundColor: "#10B981" }}>
                                            <ShieldCheck size={13} strokeWidth={2.4} /> {busy === it.id ? "…" : "Accept delivery"}
                                        </button>
                                    )}
                                    <LinkAction tone="quiet" onClick={() => onReport(it)} disabled={busy === it.id}>
                                        <LifeBuoy size={12} strokeWidth={2.4} /> Problem with this?
                                    </LinkAction>
                                    <LinkAction href={it.open_link} tone="quiet">
                                        Open <ArrowUpRight size={12} strokeWidth={2.4} />
                                    </LinkAction>
                                </>
                            }
                        />
                    </motion.div>
                );
            })}
        </motion.div>
    );
}

/* ---------------- Saved ---------------- */
function SavedList({ items, money, reduce, onRemove, filtered }) {
    if (!items.length) {
        return filtered
            ? <Empty title="No matches" sub="Try a different search or clear the filters." Icon={Search} />
            : <Empty title="Nothing saved yet" sub="Tap the heart on any creator’s item to save it here and buy when you’re ready." Icon={Bookmark} cta />;
    }
    return (
        <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" variants={stagger(reduce)} initial="hidden" animate="show">
            {items.map((s) => (
                <motion.div key={s.id} variants={rise(reduce)}>
                    <RowCard
                        lead={<a href={s.open_link}><IconTile type={s.product_type} size={46} /></a>}
                        title={s.title}
                        titleHref={s.open_link}
                        subtitle={`@${s.owner?.username}`}
                        badge={s.unavailable_reason ? <StatusPill tone={s.unavailable_reason === "Sold out" ? "#E11D48" : "#F59E0B"} label={s.unavailable_reason} /> : null}
                        meta={s.price ? <span className={`text-sm font-semibold text-zinc-900 ${MONO}`}>{money(s.price)}</span> : null}
                        actions={
                            s.unavailable_reason
                                ? <span className="text-xs text-zinc-400">Not available right now</span>
                                : <LinkAction href={s.open_link}>Buy now <ArrowUpRight size={12} strokeWidth={2.4} /></LinkAction>
                        }
                        right={
                            <button onClick={() => onRemove(s)} title="Remove" aria-label="Remove from saved"
                                className="w-11 h-11 inline-flex items-center justify-center rounded-full text-rose-500 hover:bg-rose-50 transition-colors">
                                <Heart size={16} strokeWidth={2} fill="currentColor" />
                            </button>
                        }
                    />
                </motion.div>
            ))}
        </motion.div>
    );
}

/* ---------------- Access passes (one-time unlocks) ---------------- */
function UnlockedList({ items, reduce, filtered, isNew }) {
    if (!items.length) {
        return filtered
            ? <Empty title="No matches" sub="Try a different search or clear the filters." Icon={Search} />
            : <Empty title="Nothing unlocked yet" sub="One-off purchases give you lifetime access, and they're all listed here." Icon={Unlock} cta />;
    }
    return (
        <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" variants={stagger(reduce)} initial="hidden" animate="show">
            {items.map((u) => (
                <motion.div key={u.id} variants={rise(reduce)}>
                    <RowCard
                        lead={<a href={u.open_link}><IconTile type={u.source_type} size={42} /></a>}
                        title={u.title}
                        titleHref={u.open_link}
                        subtitle={`@${u.owner?.username}`}
                        badge={isNew(u) ? <NewDot /> : null}
                        actions={<LinkAction href={u.open_link}><RotateCw size={11} strokeWidth={2.4} /> Buy again</LinkAction>}
                        right={<StatusPill tone="#10B981" label="Lifetime" />}
                    />
                </motion.div>
            ))}
        </motion.div>
    );
}

/* ---------------- Money (spending + creators + receipts) ---------------- */
function MoneyView({ summary, receipts, creators, money, reduce, filtered, onCreator, embedded }) {
    const by = summary.by_type || {};
    const rows = Object.keys(by).filter((k) => by[k] > 0).sort((a, b) => by[b] - by[a]);
    const max = rows.length ? by[rows[0]] : 1;
    const months = summary.by_month || [];
    const monthMax = months.reduce((m, x) => Math.max(m, x.total), 0) || 1;
    const delta = Number(summary.this_month || 0) - Number(summary.last_month || 0);

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Spend over time — "am I spending more than last month" is the question
                    a single total can never answer. */}
                <div className={`${CARD} p-5 sm:p-6`}>
                    <div className="flex items-start justify-between gap-3 mb-5">
                        <div>
                            <div className={EYEBROW}>Last 12 months</div>
                            <div className={`text-2xl font-semibold text-zinc-900 mt-1.5 ${MONO}`}>{money(summary.total_spent)}</div>
                        </div>
                        {!embedded && (
                            <a href="/my-purchases-export"
                                className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 rounded-box-sm border border-zinc-200 text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition">
                                <Download size={14} strokeWidth={2.2} /> Export CSV
                            </a>
                        )}
                    </div>
                    {months.length > 0 && (
                        <>
                            <div className="flex items-end gap-1 h-24">
                                {months.map((m) => (
                                    <div key={m.month} className="flex-1 flex flex-col justify-end group relative" title={`${fmtMonth(m.month)}: ${money(m.total)}`}>
                                        <motion.div
                                            className="w-full rounded-t-[4px]"
                                            style={{ background: m.total > 0 ? ACCENT : "#E4E4E7", minHeight: 3 }}
                                            initial={reduce ? false : { height: 0 }}
                                            animate={{ height: `${Math.max(3, (m.total / monthMax) * 96)}px` }}
                                            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} />
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between text-[10px] text-zinc-400 mt-1.5">
                                <span>{fmtMonth(months[0]?.month)}</span>
                                <span>{fmtMonth(months[months.length - 1]?.month)}</span>
                            </div>
                        </>
                    )}
                    <div className="text-xs text-zinc-500 mt-4 pt-4 border-t border-zinc-100">
                        {money(summary.this_month)} this month
                        {delta !== 0 && (
                            <span className={delta > 0 ? "text-amber-600" : "text-emerald-600"}>
                                {" · "}{delta > 0 ? "+" : "−"}{money(Math.abs(delta))} vs last month
                            </span>
                        )}
                    </div>
                </div>

                <div className={`${CARD} p-5 sm:p-6`}>
                    <div className={`${EYEBROW} mb-4`}>Where it went</div>
                    {rows.length ? (
                        <div className="space-y-3.5">
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
            </div>

            {creators.length > 0 && (
                <div className={`${CARD} p-5 sm:p-6`}>
                    <div className={`${EYEBROW} mb-4`}>Creators you support</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {creators.slice(0, 8).map((c) => (
                            <div key={c.owner?.username} className="flex items-center gap-3 bg-zinc-50 border border-zinc-200/70 rounded-box-sm p-3">
                                <img src={c.owner?.avatar} alt="" className="w-10 h-10 rounded-full object-cover bg-zinc-100" />
                                <div className="flex-1 min-w-0">
                                    <a href={c.open_link} className="text-sm font-medium text-zinc-900 truncate block hover:underline">@{c.owner?.username}</a>
                                    <div className={`text-[11px] text-zinc-400 ${MONO}`}>
                                        {c.purchase_count} purchases{c.active_subs ? ` · ${c.active_subs} active` : ""}
                                    </div>
                                    <div className="flex items-center gap-2.5 mt-1">
                                        <button onClick={() => onCreator(c.owner?.username)} className="text-[11px] font-medium hover:underline" style={{ color: ACCENT }}>
                                            Show their items
                                        </button>
                                        {c.support_story_url && (
                                            <a href={c.support_story_url} className="text-[11px] font-medium text-zinc-500 hover:text-zinc-900 inline-flex items-center gap-1">
                                                <MessageCircle size={10} strokeWidth={2.4} /> Our story
                                            </a>
                                        )}
                                    </div>
                                </div>
                                <div className={`text-sm font-semibold text-zinc-900 shrink-0 ${MONO}`}>{money(c.total_spent)}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div>
                <div className={`${EYEBROW} mb-3`}>Receipts</div>
                {receipts.length ? (
                    <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-4" variants={stagger(reduce)} initial="hidden" animate="show">
                        {receipts.map((r) => (
                            <motion.div key={r.id} variants={rise(reduce)}>
                                <RowCard
                                    lead={<IconTile type={r.source_type} size={46} />}
                                    title={r.title}
                                    subtitle={`@${r.owner?.username} · ${fmtDate(r.date)}`}
                                    right={
                                        <>
                                            <div className={`font-semibold text-zinc-900 ${MONO}`}>{money(r.amount)}</div>
                                            <a href={r.certificate_url} target="_blank" rel="noreferrer"
                                                className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-zinc-600 hover:text-zinc-900">
                                                <Download size={12} strokeWidth={2.2} /> Receipt
                                            </a>
                                        </>
                                    }
                                />
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    filtered
                        ? <Empty title="No matches" sub="Try a different search or clear the filters." Icon={Search} />
                        : <Empty title="No receipts yet" sub="A receipt is saved for every purchase you make." Icon={ReceiptText} />
                )}
            </div>
        </div>
    );
}

/* ---------------- Shared ---------------- */
function Empty({ title, sub, Icon, cta }) {
    return (
        <div className={`${CARD} py-14 sm:py-16 text-center px-6`}>
            <span className="inline-flex w-14 h-14 rounded-full bg-zinc-100 items-center justify-center mb-4 text-zinc-400">
                <Icon size={24} strokeWidth={1.8} />
            </span>
            <div className="text-base font-medium text-zinc-900">{title}</div>
            <div className="text-sm text-zinc-500 mt-1.5 max-w-xs mx-auto">{sub}</div>
            {/* An empty state that only says "nothing here" is a dead end — every one
                of them now offers the next step. */}
            {cta && (
                <a href="/creators"
                    className="mt-5 inline-flex items-center gap-2 min-h-[44px] px-5 rounded-box-sm text-sm font-semibold text-white transition"
                    style={{ backgroundColor: ACCENT }}>
                    <Compass size={15} strokeWidth={2.2} /> Find creators
                </a>
            )}
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

function fmtMonth(s) {
    if (!s) return "";
    try {
        return new Date(`${s}-01T00:00:00`).toLocaleDateString(undefined, { month: "short" });
    } catch {
        return s;
    }
}
