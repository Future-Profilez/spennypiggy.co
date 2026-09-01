import HelpLink from "@/Components/Help/HelpLink";
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { usePage } from "@inertiajs/react";
import useHideBottomBar from "@/hooks/useHideBottomBar";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import LazyVideo from "../../Components/LazyVideo";
import { useVideoPoster } from "../../utils/videoPoster";
import DeliveryStatus from "../../Components/Transactions/DeliveryStatus";
import {
    Heart, ShoppingBag, CheckCircle2, PiggyBank, Crown, Repeat, Coins,
    Wallet, Unlock, FileText, Music, Image as ImageIcon, Film,
    ArrowUpRight, Play, Trophy, Download, Truck, Clock, AlertTriangle, ReceiptText,
    Users, BellRing, RotateCw, MessageCircle, Bookmark, Search, X,
    ArrowDownUp, ChevronLeft, ChevronRight, Compass, LifeBuoy, Undo2, ShieldCheck,
    Gift, ExternalLink,
} from "lucide-react";

/* Category system — one quiet colour + icon per type, rendered as soft tinted
   chips (10–14% fill, coloured glyph). Encodes type without shouting. */
const CAT = {
 wish: { label: "Wish", color: "#8B5CF6", icon: Heart },
 shop: { label: "Shop", color: "#0EA5E9", icon: ShoppingBag },
 task: { label: "Paid task", color: "#F59E0B", icon: CheckCircle2 },
 piggypot: { label: "Piggy Pot", color: "#EC4899", icon: PiggyBank },
 membership: { label: "Membership", color: "#10B981", icon: Crown },
 bill: { label: "Subscription", color: "#3B82F6", icon: Repeat },
 tip: { label: "Piggy Bank", color: "#65A30D", icon: Coins },
};
const cat = (t) => CAT[t] || { label: t, color: "#71717A", icon: FileText };
const tint = (hex, a = "1a") => hex + a; // 8-digit hex alpha

// Engagement Levels (renamed from gem names, 24 July 2026). The backend already
// sends the colour on the status payload; this is only a fallback.
const TIER_COLOR = { "Level 1": "#9CA3AF", "Level 2": "#60A5FA", "Level 3": "#34D399", "Level 4": "#FBBF24", "Level 5": "#FF007F" };

const ACCENT = "#FF007F";
const ACCENT2 = "#7C3AED";
const CARD = "bg-white/80 backdrop-blur-sm border border-white/60 rounded-box-sm ";
const CARD_HOVER = "transition-all duration-300 hover:-translate-y-0.5";
const MONO = "[font-variant-numeric:tabular-nums] tabular-nums";
const EYEBROW = "text-[12px] font-bold uppercase tracking-[0.18em] text-black/60";

/* Four top-level tabs, each grouping what used to be its own tab. Eight tabs on a
   phone meant a horizontally-scrolled rail where half the destinations were never
   seen; these group by the question the buyer is actually asking. */
const TABS = [
 { key: "library", label: "Library", icon: Film },
    { key: "transactions", label: "Transactions", icon: ReceiptText },
 { key: "spending", label: "Spending", icon: Wallet },
 { key: "saved", label: "Saved", icon: Bookmark },
];

const SORTS = { recent: "Recent", oldest: "Oldest first", name: "Name A–Z", price_desc: "Price: high → low", price_asc: "Price: low → high" };

/* Views that own a search box, and the sort keys each supports. */
const VIEW_TOOLS = {
 media: { search: true, types: true, sorts: ["recent", "oldest", "name"], server: true },
 transactions: { search: true, types: true, sorts: ["recent", "oldest", "price_desc", "price_asc", "name"] },
 spending: { search: false, types: false, sorts: [] },
 saved: { search: true, types: true, sorts: ["recent", "name"] },
};

const DEFAULT_VIEW = { library: "media", transactions: "transactions", spending: "spending", saved: "saved" };

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
    const [tab, setTab] = useState(url.tab || (hasOverdue ? "transactions" : "library"));
    const [view, setView] = useState(url.view || DEFAULT_VIEW[url.tab] || (hasOverdue ? "transactions" : "media"));
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
 const [confirm, setConfirm] = useState(null); // { title, body, confirmLabel, tone, onConfirm }
 const [report, setReport] = useState(null); // incoming row being reported
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

    // Unified transactions list: merge receipts + unlocked + incoming + subscriptions, sort by date desc
    const allTransactions = useMemo(() => {
        const merged = [
            ...receipts.map((r) => ({ ...r, _kind: "receipt" })),
            ...unlocked.map((u) => ({ ...u, _kind: "unlocked" })),
            ...incomingItems.map((i) => ({ ...i, _kind: "incoming" })),
            ...subs.map((s) => ({ ...s, _kind: "subscription" })),
        ];
        merged.sort((a, b) => String(dateOf(b)).localeCompare(String(dateOf(a))));
        return merged;
    }, [receipts, unlocked, incomingItems, subs]);

    const rawSource = {
 media, // already creator-filtered server-side
        transactions: byCreator(allTransactions),
        spending: [],
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
        transactions: receipts.length + unlocked.length + incomingItems.length + subs.length,
        spending: 0,
        saved: savedItems.length,
    };

    const inner = (
        <div className={`mx-auto px-4 sm:px-6 ${embedded ? "max-w-[1080px]" : "max-w-[1140px] pt-5 sm:pt-9"}`} style={{ fontFamily: "'Inter', -apple-system, system-ui, sans-serif" }}>
            <Hero
                embedded={embedded}
                media={media}
                summary={spend_summary}
                money={money}
                reduce={reduce}
                status={supporter_status}
                overdue={incomingItems.filter((i) => i.is_overdue).length}
                onOverdue={() => { setTab("transactions"); setView("transactions"); }}
            />

            {renewingSoon.length > 0 && (
                <RenewingBanner
                    items={renewingSoon}
                    money={money}
                    onCancel={cancelSub}
                    busy={busySub}
                    onView={() => { setTab("transactions"); setView("transactions"); }}
                />
            )}

            {/* Tab rail — sticky, four destinations so nothing scrolls out of reach */}
            <div className={`${embedded ? "" : "sticky top-2 z-20"} mt-7 mb-4`}>
 <div className="flex gap-1.5 bg-white/70 backdrop-blur-xl border border-white/80 rounded-box-sm p-1.5 ">
                    {TABS.map((t) => {
                        const Icon = t.icon;
                        const active = tab === t.key;
                        const alert = t.key === "transactions" && hasOverdue;
                        return (
                            <button
                                key={t.key}
                                onClick={() => setTab(t.key)}
                                aria-pressed={active}
 className={`group relative flex-1 flex items-center justify-center gap-2 px-2 sm:px-3.5 min-h-[46px] rounded-box-sm text-sm font-semibold transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF007F]/40 ${
                                    active
 ? "text-white "
                                        : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50/80"
                                }`}
                                style={active ? { background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT2} 100%)` } : {}}
                            >
                                <Icon size={15} strokeWidth={2.2} />
                                <span className={active ? "" : "hidden xs:inline sm:inline"}>{t.label}</span>
                                {alert && <span className="w-2 h-2 rounded-full bg-rose-400 ring-2 ring-white absolute top-2 right-2" aria-label="Needs attention" />}
                                {!alert && counts[t.key] > 0 && (
 <span className={`text-[12px] rounded-full px-1.5 py-0.5 hidden sm:inline ${MONO} ${
 active ? "bg-white/20 text-white" : "bg-zinc-100 text-black/60"
                                    }`}>{counts[t.key]}</span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            <ViewSwitch tab={tab} view={view} setView={setView} counts={{
                media: libraryTotal,
                transactions: counts.transactions,
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
                    {view === "transactions" && (
                        <AllTransactionsView
                            items={list} money={money} reduce={reduce} filtered={filtered} isNew={isNew}
                            onAccept={acceptDelivery} onReport={setReport} busy={busyIncoming}
                            onCancel={cancelSub} onResume={resumeSub} busySub={busySub}
                        />
                    )}
                    {view === "spending" && (
                        <MoneyView summary={spend_summary} creators={creators}
                            money={money} reduce={reduce} filtered={filtered} embedded={embedded}
                            onCreator={(u) => { setCreatorFilter(u); setTab("transactions"); setView("transactions"); }} />
                    )}
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
    return (
 <div className="relative min-h-dvh pb-28 text-zinc-900"
            style={{
                paddingBottom: "calc(6rem + env(safe-area-inset-bottom))",
                background: "linear-gradient(160deg, #fdf6ff 0%, #f0f4ff 40%, #fff5fb 100%)",
            }}>
            {/* Subtle decorative orbs */}
            {/* bottom-bar-safe: decorative, pointer-events-none — nothing to tap */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
                <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full opacity-20" style={{ background: `radial-gradient(circle, ${ACCENT}44 0%, transparent 70%)` }} />
                <div className="absolute top-1/3 -left-32 w-[400px] h-[400px] rounded-full opacity-15" style={{ background: `radial-gradient(circle, ${ACCENT2}44 0%, transparent 70%)` }} />
            </div>
            {inner}
        </div>
    );
}

function viewsFor(tab) {
    return {
 library: ["media"],
        transactions: ["transactions"],
 spending: ["spending"],
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
        library: [{ k: "media", label: "Media" }],
    }[tab];
    if (!opts) return null;
    return (
        <div className="flex gap-2 mb-5">
            {opts.map((o) => {
                const active = view === o.k;
                return (
                    <button key={o.k} onClick={() => setView(o.k)} aria-pressed={active}
 className={`inline-flex items-center gap-2 min-h-[44px] px-4 rounded-full text-sm font-semibold border transition-all duration-200 ${
                            active
 ? "text-white border-transparent "
                                : "bg-white/70 backdrop-blur-sm text-zinc-600 border-zinc-200/60 hover:border-zinc-300 hover:bg-white"
                        }`}
                        style={active ? { background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT2} 100%)` } : {}}>
                        {o.label}
 <span className={`text-[12px] ${MONO} ${active ? "text-white/70" : "text-black/60"}`}>{counts[o.k] ?? 0}</span>
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
 <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-black/60 pointer-events-none" />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search by title or creator…"
 className="w-full min-h-[44px] pl-10 pr-12 rounded-box-sm bg-white/80 backdrop-blur-sm border border-white/80 text-sm text-zinc-900 placeholder:text-black/60 focus:outline-none focus:ring-2 focus:ring-[#FF007F]/25 focus:border-[#FF007F]/30 transition-all"
                    />
                    {query && (
                        <button onClick={() => setQuery("")} aria-label="Clear search"
 className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 inline-flex items-center justify-center rounded-full text-black/60 hover:bg-zinc-100 hover:text-zinc-700 transition">
                            <X size={15} />
                        </button>
                    )}
                </div>

                {creators.length > 1 && (
                    <div className="relative shrink-0">
 <Users size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-black/60 pointer-events-none" />
                        <select value={creatorFilter} onChange={(e) => setCreatorFilter(e.target.value)} aria-label="Filter by creator"
 className="appearance-none w-full sm:w-auto min-h-[44px] pl-9 pr-9 rounded-box-sm bg-white/80 backdrop-blur-sm border border-white/80 text-sm font-medium text-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#FF007F]/25 cursor-pointer">
                            <option value="">All creators</option>
                            {creators.map((c) => (
                                <option key={c.owner?.username} value={c.owner?.username || ""}>@{c.owner?.username}</option>
                            ))}
                        </select>
 <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-black/60 pointer-events-none" />
                    </div>
                )}

                {hasSort && (
                    <div className="relative shrink-0">
 <ArrowDownUp size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-black/60 pointer-events-none" />
                        <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort"
 className="appearance-none w-full sm:w-auto min-h-[44px] pl-9 pr-9 rounded-box-sm bg-white/80 backdrop-blur-sm border border-white/80 text-sm font-medium text-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#FF007F]/25 cursor-pointer">
                            {sorts.map((k) => <option key={k} value={k}>{SORTS[k]}</option>)}
                        </select>
 <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-black/60 pointer-events-none" />
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
 <div className="flex items-center gap-2 text-[12px] text-black/60 mt-2">
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
            className={`inline-flex items-center gap-1.5 min-h-[34px] px-3 rounded-full text-xs font-semibold border transition-all duration-200 ${
 active ? "text-white border-transparent " : "text-zinc-600 bg-white/70 backdrop-blur-sm border-zinc-200/60 hover:border-zinc-300 hover:bg-white"
            }`}
            style={active ? { backgroundColor: color } : undefined}>
            {Icon && <Icon size={12} strokeWidth={2.4} />} {label}
        </button>
    );
}

/* ---------------- Dialogs ---------------- */
function Backdrop({ children, onClose, reduce }) {
    // The sheet rises from the foot of the screen (`items-end`), straight into
    // the bottom bar. Hide the bar while it is open.
    useHideBottomBar(true);
    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
    }, [onClose]);
    return (
        // bottom-bar-safe: useHideBottomBar(true) in Backdrop hides the bar while open
        <motion.div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-6"
            initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }} onClick={onClose}
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
            <motion.div onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true"
                initial={reduce ? false : { y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={reduce ? { opacity: 0 } : { y: 24, opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
 className="w-full sm:max-w-md bg-white/95 backdrop-blur-xl rounded-t-box sm:rounded-box p-6 border border-white/60">
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
 className="w-full mt-4 p-3 rounded-box-sm border border-zinc-200 text-sm text-zinc-900 placeholder:text-black/60 focus:outline-none focus:ring-2 focus:ring-[#FF007F]/30 resize-none"
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
                    initial={{ opacity: 0, y: 16, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.96 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    role="status"
 className="fixed left-1/2 -translate-x-1/2 z-[60] text-white text-sm font-semibold px-5 py-3.5 rounded-box-sm max-w-[92vw] text-center border border-white/10"
                    style={{ bottom: "calc(6rem + env(safe-area-inset-bottom))", background: `linear-gradient(135deg, #18181b 0%, #27272a 100%)`, backdropFilter: "blur(12px)" }}>
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

    useHideBottomBar(Boolean(item));

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
        // bottom-bar-safe: useHideBottomBar(Boolean(item)) hides the bar while open
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
 <div className="text-xs text-white/60 truncate">@{item.owner?.username}{multi ? ` · ${index + 1} / ${items.length}` : ""}</div>
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
 className="max-h-[80dvh] max-w-[92vw] rounded-box-sm object-contain bg-black" />
                    ) : item.media_kind === "image" ? (
 <img src={item.media_url} alt={item.title} className="max-h-[80dvh] max-w-[92vw] rounded-box-sm object-contain" />
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
 <span className="inline-flex items-center gap-1 text-[12px] font-medium rounded-full px-2 py-0.5"
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
 <span className="relative inline-flex items-center gap-1 text-[12px] font-bold uppercase tracking-widest rounded-full px-2 py-0.5 text-white"
            style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})` }}>
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-white animate-ping opacity-60" />
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
 <div className="group relative overflow-hidden bg-white/80 backdrop-blur-sm border border-white/70 rounded-box-sm transition-all duration-300 hover:-translate-y-0.5">
            {/* Subtle left accent glow on hover */}
            <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: `linear-gradient(180deg, ${ACCENT}, ${ACCENT2})` }} />
            <div className="p-4 flex items-center gap-3.5">
                {lead}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                        {titleHref
                            ? <a href={titleHref} className="font-semibold text-zinc-900 truncate hover:underline">{title}</a>
                            : <span className="font-semibold text-zinc-900 truncate">{title}</span>}
                        {badge}
                    </div>
                    {subtitle && <div className="text-xs text-zinc-500 truncate mt-0.5 font-medium">{subtitle}</div>}
                    {meta && <div className="flex items-center gap-2 mt-1.5 flex-wrap">{meta}</div>}
                    {actions && <div className="flex items-center gap-2.5 mt-2.5 flex-wrap">{actions}</div>}
                </div>
                {right && <div className="text-right shrink-0">{right}</div>}
            </div>
        </div>
    );
}

function LinkAction({ onClick, href, children, tone = "accent", disabled }) {
    const cls = `inline-flex items-center gap-1 text-xs font-medium min-h-[32px] transition-colors disabled:opacity-50 ${
 tone === "danger" ? "text-black/60 hover:text-rose-600" : tone === "quiet" ? "text-zinc-500 hover:text-zinc-900" : "hover:underline"
    }`;
    const style = tone === "accent" ? { color: ACCENT } : undefined;
    if (href) return <a href={href} className={cls} style={style}>{children}</a>;
    return <button onClick={onClick} disabled={disabled} className={cls} style={style}>{children}</button>;
}

/* ---------------- Hero ---------------- */
function Hero({ embedded, media, summary, money, reduce, status, overdue, onOverdue }) {
    const Title = embedded ? "h2" : "h1";
    return (
 <div className="overflow-hidden rounded-box relative" style={{
            background: `linear-gradient(135deg, #1a0533 0%, #280a50 30%, #3b0764 60%, #1e0a4a 100%)`,
            
        }}>
            {/* Background decorative blobs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-30" style={{ background: `radial-gradient(circle, ${ACCENT}99 0%, transparent 70%)` }} />
                <div className="absolute bottom-0 left-10 w-56 h-56 rounded-full opacity-20" style={{ background: `radial-gradient(circle, ${ACCENT2}99 0%, transparent 70%)` }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-32 opacity-10" style={{ background: `radial-gradient(ellipse, white 0%, transparent 70%)` }} />
            </div>

            <div className="grid lg:grid-cols-[1.2fr_0.8fr] relative z-10">
                <div className="p-6 sm:p-8 md:p-10">
 <div className="inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.2em] text-white/60 mb-3">
                        <span className="w-4 h-px bg-white/30" />
                        Your library
                    </div>
                    <Title className={`${embedded ? "text-2xl md:text-3xl" : "text-3xl sm:text-4xl md:text-[2.8rem]"} font-bold tracking-tight text-white mt-1 leading-tight`}>
                        My Purchases
                    </Title>

                    {/* Compact stat row */}
                    <div className="mt-6 grid grid-cols-3 gap-3 max-w-md">
                        <HeroStat label="Total spent" value={<CountUp value={Number(summary.total_spent || 0)} money={money} reduce={reduce} />} big accent />
                        <HeroStat label="This month" value={money(summary.this_month)} />
                        <HeroStat label="Creators" value={summary.creators_supported || 0} />
                    </div>

                    {overdue > 0 && (
                        <button onClick={onOverdue}
 className="mt-5 inline-flex items-center gap-2 min-h-[44px] px-4 rounded-box-sm text-sm font-semibold text-white/90 border border-rose-400/40 hover:border-rose-400/70 transition-all"
                            style={{ background: "rgba(225,29,72,0.20)", backdropFilter: "blur(8px)" }}>
                            <AlertTriangle size={15} strokeWidth={2.2} className="text-rose-400" />
                            {overdue} {overdue === 1 ? "delivery is" : "deliveries are"} overdue
                        </button>
                    )}

                    {status && <SupporterStatus status={status} reduce={reduce} />}

                    {/* The two things a supporter comes to this page confused
                        about. Dark tone — this hero is a near-black band. */}
                    <div className="mt-4 flex flex-wrap items-center gap-x-5">
                        <HelpLink
                            slug="i-cannot-find-my-purchase"
                            categorySlug="my-purchases"
                            label="Can't find a purchase?"
                            tone="dark"
                        />
                        <HelpLink
                            slug="refunds-and-cancellations"
                            categorySlug="my-purchases"
                            label="Refunds & cancelling"
                            tone="dark"
                        />
                    </div>
                </div>

                {/* Decorative — desktop only */}
                <div className="relative hidden lg:flex items-center justify-center p-8">
                    {media.length ? (
                        <Mosaic tiles={media.slice(0, 4)} extra={Math.max(0, media.length - 4)} reduce={reduce} />
                    ) : (
 <div className="flex flex-col items-center justify-center text-white/60">
                            <PiggyBank size={48} strokeWidth={1.4} />
 <span className="mt-3 text-sm font-medium text-white/60">Your library is empty</span>
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

function HeroStat({ label, value, big, accent }) {
    return (
 <div className="min-w-0 bg-white/10 backdrop-blur-sm rounded-box-sm p-3 border border-white/10">
 <div className="text-[12px] font-bold uppercase tracking-[0.15em] text-white/60 mb-1.5">{label}</div>
            <div className={`${big ? "text-xl sm:text-2xl" : "text-base sm:text-lg"} font-bold leading-none truncate ${MONO}`}
                style={{ color: accent ? ACCENT : "white" }}>
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
 <div className="p-3.5 rounded-box-sm border border-white/20" style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(8px)" }}>
                <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-white">
 <span className="w-8 h-8 rounded-full flex items-center justify-center "
                            style={{ background: `linear-gradient(135deg, ${color}cc, ${color})` }}>
                            <Trophy size={15} strokeWidth={2.2} className="text-white" />
                        </span>
                        {status.level} supporter
                    </span>
 <span className={`text-xs text-white/60 ${MONO}`}>{Math.round(status.score)} pts</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${color}, ${color}cc)` }}
                        initial={reduce ? false : { width: 0 }}
                        animate={{ width: `${Math.round((status.progress || 0) * 100)}%` }}
                        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }} />
                </div>
                <div className="flex items-center justify-between gap-3 mt-2">
 <span className="text-[12px] text-white/60">
                        {status.next_level ? `${status.to_next} pts to ${status.next_level}` : "Top tier reached"} · last 90 days
                    </span>
                    {rows.length > 0 && (
 <button onClick={() => setOpen((o) => !o)} className="text-[12px] font-semibold text-white/60 hover:text-white/90 min-h-[28px] transition-colors">
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
 <li key={k} className="flex items-center justify-between text-[12px] text-white/60 capitalize">
                                    <span>{String(k).replace(/_/g, " ")}</span>
                                    <span className={MONO}>{Math.round(Number(breakdown[k]) || 0)} pts</span>
                                </li>
                            ))}
                        </motion.ul>
                    )}
                </AnimatePresence>
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
    const rot = ["-3deg", "2deg", "2.5deg", "-2deg"];
    const shadows = [
        "0 8px 24px -4px rgba(255,0,127,0.25), 0 2px 8px rgba(0,0,0,0.12)",
        "0 8px 24px -4px rgba(124,58,237,0.2), 0 2px 8px rgba(0,0,0,0.10)",
        "0 8px 24px -4px rgba(14,165,233,0.2), 0 2px 8px rgba(0,0,0,0.10)",
        "0 8px 24px -4px rgba(16,185,129,0.2), 0 2px 8px rgba(0,0,0,0.10)",
    ];
    return (
        <motion.div className="relative w-full max-w-[280px]" variants={stagger(reduce)} initial="hidden" animate="show">
            <div className="grid grid-cols-2 gap-3">
                {tiles.map((t, i) => {
                    const c = cat(t.source_type);
                    const Icon = c.icon;
                    const isImg = t.media_kind === "image" && t.media_url;
                    return (
                        <motion.div key={t.id} variants={rise(reduce)}
 className="aspect-square rounded-box-sm bg-white overflow-hidden border border-white/80"
                            style={{ transform: `rotate(${rot[i]})`}}>
                            {isImg ? (
                                <img src={t.media_url} alt="" loading="lazy" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center gap-2"
                                    style={{ background: `linear-gradient(135deg, ${tint(c.color, "16")}, ${tint(c.color, "22")})`, color: c.color }}>
                                    {t.media_kind === "video" ? <Play size={24} strokeWidth={2} /> : <Icon size={24} strokeWidth={2} />}
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </div>
            {extra > 0 && (
 <span className={`absolute -bottom-2 -right-2 text-white text-[12px] font-bold px-2.5 py-1 rounded-full ${MONO}`}
                    style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})` }}>
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
        <div className="overflow-hidden flex flex-col group rounded-box-sm border border-white/70 bg-white/80 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1" >
            <button
                type="button"
                onClick={openable ? onOpen : undefined}
                aria-label={openable ? `Open ${title}` : title}
                className="aspect-square flex items-center justify-center overflow-hidden relative text-left w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF007F]/40"
                style={{ backgroundColor: tint(c.color, "12"), cursor: openable ? "zoom-in" : "default" }}
            >
                {media_kind === "video" ? (
                    <>
                        {poster && <img src={poster} alt="" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />}
                        <span className="absolute inset-0 flex items-center justify-center">
                            <span className="w-12 h-12 rounded-full backdrop-blur-md flex items-center justify-center text-white transition-[filter] duration-300 group-hover:brightness-125" style={{ background: "rgba(0,0,0,0.5)" }}>
                                <Play size={20} className="ml-0.5" />
                            </span>
                        </span>
 <span className="absolute top-2.5 left-2.5 text-white text-[12px] font-bold px-2 py-1 rounded-full flex items-center gap-1 pointer-events-none" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}>
                            <Play size={9} /> Video
                        </span>
                    </>
                ) : media_kind === "image" ? (
 <img src={media_url} alt={title} loading="lazy" className="w-full h-full object-cover transition-[filter,opacity] duration-500 group-hover:brightness-[1.08]" />
                ) : (
                    <NonVisual kind={media_kind} color={c.color} />
                )}
                {isNew && <span className="absolute top-2.5 right-2.5"><NewDot /></span>}
            </button>
            <div className="p-3.5">
                <div className="text-sm font-semibold text-zinc-900 truncate" title={title}>{title}</div>
                <div className="flex items-center justify-between mt-2 gap-2">
                    <a href={owner?.username ? `/${owner.username}` : undefined} className="text-xs text-zinc-500 truncate hover:text-zinc-800 hover:underline font-medium">@{owner?.username}</a>
                    <Chip type={item.source_type} />
                </div>
            </div>
        </div>
    );
}

function SkeletonCard() {
    return (
 <div className="overflow-hidden flex flex-col rounded-box-sm border border-white/70 bg-white/60 animate-pulse">
            <div className="aspect-square bg-gradient-to-br from-zinc-100 to-zinc-50" />
            <div className="p-3.5 space-y-2">
                <div className="h-3.5 w-3/4 bg-zinc-100 rounded-full" />
                <div className="h-3 w-1/2 bg-zinc-100 rounded-full" />
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
        <div className="mt-5 rounded-box-sm p-5 border" style={{ background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)", borderColor: "#fde68a" }}>
            <div className="flex items-center gap-2.5 mb-3">
 <span className="w-8 h-8 rounded-box-xs flex items-center justify-center" style={{ background: "rgba(245,158,11,0.15)" }}>
                    <BellRing size={16} strokeWidth={2} className="text-amber-500" />
                </span>
                <span className="text-sm font-bold text-amber-900">{items.length} renewing this week</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {items.slice(0, 4).map((s) => (
 <div key={s.id} className="bg-white/70 backdrop-blur-sm border border-amber-200/60 rounded-box-sm px-3.5 py-2.5 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-zinc-900 truncate">{s.title}</div>
                            <div className={`text-xs text-amber-700/70 ${MONO}`}>{money(s.amount)} · renews {fmtDate(s.next_charge_at)}</div>
                        </div>
                        {s.cancelable && (
                            <button onClick={() => onCancel(s)} disabled={busy === s.id}
                                className="shrink-0 text-xs font-semibold text-amber-700/70 hover:text-rose-600 transition-colors disabled:opacity-50 min-h-[44px] px-2">
                                {busy === s.id ? "…" : "Cancel"}
                            </button>
                        )}
                    </div>
                ))}
            </div>
            {items.length > 4 && (
 <button onClick={onView} className="mt-3 text-xs font-medium text-black/60 hover:text-zinc-900 min-h-[44px]">View all {items.length}</button>
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
 {s.recurring_type && <div className="text-[12px] text-black/60 mt-0.5 capitalize">{s.recurring_type}</div>}
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
 <span className="shrink-0 text-[12px] font-medium rounded-full px-2 py-0.5 capitalize"
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
 <span className={`text-[12px] text-black/60 truncate ${MONO}`}>{it.courier ? `${it.courier} · ` : ""}{it.tracking_id}</span>
                                    )}
 {!it.is_physical && it.due_at && <span className="text-[12px] text-black/60">Due {fmtDate(it.due_at)}</span>}
 {it.is_physical && it.eta && <span className="text-[12px] text-black/60">Arrives {fmtDate(it.eta)}</span>}
                                    {!it.due_at && !it.eta && it.waiting_days > 0 && (
 <span className="text-[12px] text-black/60">Waiting {it.waiting_days}d</span>
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
 ? <span className="text-xs text-black/60">Not available right now</span>
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

/* ---------------- Spending (charts + creators only, receipts moved to Transactions tab) ---------------- */
function MoneyView({ summary, creators, money, reduce, filtered, onCreator, embedded }) {
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
                <div className={`${CARD} p-5 sm:p-6 overflow-hidden relative`}>
                    {/* Subtle gradient tint in top-right */}
                    <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full pointer-events-none"
                        style={{ background: `radial-gradient(circle, ${ACCENT}10 0%, transparent 70%)` }} />
                    <div className="flex items-start justify-between gap-3 mb-5 relative z-10">
                        <div>
                            <div className={EYEBROW}>Last 12 months</div>
                            <div className={`text-2xl font-bold text-zinc-900 mt-1.5 ${MONO}`}>{money(summary.total_spent)}</div>
                        </div>
                        {!embedded && (
                            <a href="/my-purchases-export"
 className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 rounded-box-sm text-xs font-semibold text-white transition-all hover:opacity-90"
                                style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})` }}>
                                <Download size={13} strokeWidth={2.4} /> Export CSV
                            </a>
                        )}
                    </div>
                    {months.length > 0 && (
                        <>
                            <div className="flex items-end gap-1.5 h-28 relative z-10">
                                {months.map((m, idx) => {
                                    const h = Math.max(4, (m.total / monthMax) * 112);
                                    const isLast = idx === months.length - 1;
                                    return (
 <div
 key={m.month}
 tabIndex={0}
 title={`${m.month}: ${money(m.total)}`}
 aria-label={`${m.month}: ${money(m.total)}`}
 className="flex-1 flex flex-col justify-end group relative rounded-box-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF007F]"
 >
 {/* The figure is revealed on hover OR focus: a value only a
 mouse can uncover does not exist on a phone. */}
 <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 group-focus:opacity-100 group-focus-within:opacity-100 transition-opacity duration-150 z-10">
 <div className={`text-[12px] font-semibold text-white px-2 py-1 rounded-box-sm whitespace-nowrap ${MONO}`}
                                                    style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})` }}>
                                                    {money(m.total)}
                                                </div>
                                            </div>
                                            <motion.div
 className="w-full rounded-t-box-sm cursor-default"
                                                style={{
                                                    background: m.total > 0
                                                        ? (isLast ? `linear-gradient(180deg, ${ACCENT} 0%, ${ACCENT2} 100%)` : `linear-gradient(180deg, ${ACCENT}cc 0%, ${ACCENT}88 100%)`)
                                                        : "#E4E4E7",
                                                    minHeight: 4,
                                                }}
                                                initial={reduce ? false : { height: 0 }}
                                                animate={{ height: `${h}px` }}
                                                transition={{ duration: 0.55, delay: idx * 0.03, ease: [0.16, 1, 0.3, 1] }} />
                                        </div>
                                    );
                                })}
                            </div>
 <div className="flex justify-between text-[12px] font-semibold text-black/60 mt-2">
                                <span>{fmtMonth(months[0]?.month)}</span>
                                <span>{fmtMonth(months[months.length - 1]?.month)}</span>
                            </div>
                        </>
                    )}
                    <div className="text-xs text-zinc-500 mt-4 pt-4 border-t border-zinc-100/80 flex items-center gap-2 flex-wrap">
 <span className="font-semibold text-zinc-900 tabular-nums">{money(summary.this_month)}</span> this month
                        {delta !== 0 && (
 <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] font-bold ${delta > 0 ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"}`}>
                                {delta > 0 ? "+" : "−"}{money(Math.abs(delta))} vs last month
                            </span>
                        )}
                    </div>

                    {(Number(summary.refunded_total || 0) > 0 || Number(summary.pending_total || 0) > 0) && (
                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-zinc-500">
                            {Number(summary.refunded_total || 0) > 0 && (
                                <span>
                                    <span className={`text-zinc-900 font-semibold ${MONO}`}>{money(summary.refunded_total)}</span>
                                    {" refunded"}
                                    {summary.refunded_count ? ` · ${summary.refunded_count} purchase${summary.refunded_count === 1 ? "" : "s"}` : ""}
                                </span>
                            )}
                            {Number(summary.pending_total || 0) > 0 && (
                                <span>
                                    <span className={`text-zinc-900 font-semibold ${MONO}`}>{money(summary.pending_total)}</span>
                                    {" still confirming with your bank"}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                <div className={`${CARD} p-5 sm:p-6`}>
                    <div className={`${EYEBROW} mb-5`}>Where it went</div>
                    {rows.length ? (
                        <div className="space-y-4">
                            {rows.map((k, idx) => {
                                const c = cat(k);
                                const Icon = c.icon;
                                const pct = Math.max(4, (by[k] / max) * 100);
                                return (
                                    <div key={k}>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="flex items-center gap-2">
 <span className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                                                    style={{ backgroundColor: tint(c.color, "18"), color: c.color }}>
                                                    <Icon size={13} strokeWidth={2.4} />
                                                </span>
                                                <span className="text-sm font-semibold text-zinc-800">{c.label}</span>
                                            </span>
                                            <span className={`text-sm font-bold text-zinc-900 ${MONO}`}>{money(by[k])}</span>
                                        </div>
                                        <div className="h-2.5 bg-zinc-100 rounded-full overflow-hidden">
                                            <motion.div className="h-full rounded-full"
                                                style={{ background: `linear-gradient(90deg, ${c.color}cc, ${c.color})` }}
                                                initial={reduce ? false : { width: 0 }}
                                                animate={{ width: `${pct}%` }}
                                                transition={{ duration: 0.7, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1] }} />
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
                        {creators.slice(0, 8).map((c, idx) => (
                            <div key={c.owner?.username}
 className="group flex items-center gap-3.5 rounded-box-sm p-3.5 border border-white/60 transition-all duration-300 cursor-default"
                                style={{ background: "rgba(255,255,255,0.6)", backdropFilter: "blur(8px)" }}>
                                {/* Avatar with ring glow */}
                                <div className="relative shrink-0">
 <img src={c.owner?.avatar} alt="" className="w-11 h-11 rounded-full object-cover bg-zinc-100 ring-2 ring-white " />
                                    {c.active_subs > 0 && (
                                        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center"
                                            style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})` }}>
                                            <span className="w-1.5 h-1.5 rounded-full bg-white" />
                                        </span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <a href={c.open_link} className="text-sm font-bold text-zinc-900 truncate block hover:underline">@{c.owner?.username}</a>
 <div className={`text-[12px] text-zinc-500 font-medium ${MONO} mt-0.5`}>
                                        {c.purchase_count} purchase{c.purchase_count !== 1 ? "s" : ""}{c.active_subs ? ` · ${c.active_subs} active` : ""}
                                    </div>
                                    <div className="flex items-center gap-2.5 mt-1.5">
                                        <button onClick={() => onCreator(c.owner?.username)}
 className="text-[12px] font-bold transition-opacity hover:opacity-70" style={{ color: ACCENT }}>
                                            Show items
                                        </button>
                                        {c.support_story_url && (
 <a href={c.support_story_url} className="text-[12px] font-semibold text-black/60 hover:text-zinc-700 inline-flex items-center gap-1">
                                                <MessageCircle size={10} strokeWidth={2.4} /> Our story
                                            </a>
                                        )}
                                    </div>
                                </div>
                                <div className={`text-sm font-bold shrink-0 ${MONO}`} style={{ color: ACCENT }}>{money(c.total_spent)}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

        </div>
    );
}

/* ─────────────────────────────────────────────────────────────────────────
   AllTransactionsView — unified chronological list of every purchase,
   showing receipts, unlocked access, in-progress deliveries, and
   subscriptions in one place, each with rewards visible inline.
───────────────────────────────────────────────────────────────────────── */
function AllTransactionsView({ items, money, reduce, filtered, isNew,
    onAccept, onReport, busy, onCancel, onResume, busySub }) {

    if (!items.length) {
        return filtered
            ? <Empty title="No matches" sub="Try a different search or clear the filters." Icon={Search} />
            : <Empty title="No transactions yet" sub="Every purchase you make will appear here with its reward or delivery status." Icon={ReceiptText} cta />;
    }

    return (
        <motion.div className="space-y-3" variants={stagger(reduce)} initial="hidden" animate="show">
            {items.map((item) => (
                <motion.div key={item.id} variants={rise(reduce)}>
                    <TransactionRow item={item} money={money} isNew={isNew}
                        onAccept={onAccept} onReport={onReport} busy={busy}
                        onCancel={onCancel} onResume={onResume} busySub={busySub} />
                </motion.div>
            ))}
        </motion.div>
    );
}

function TransactionRow({ item, money, isNew, onAccept, onReport, busy, onCancel, onResume, busySub }) {
    const kind = item._kind; // 'receipt' | 'unlocked' | 'incoming' | 'subscription'
    const hasReward = item.reward_url || item.reward_text;

    const RewardIcon = item.reward_type === 'file' ? Download
        : item.reward_type === 'link' ? ExternalLink : Gift;

    const rewardLabel = item.reward_type === 'file' ? 'Download your reward'
        : item.reward_type === 'link' ? 'Access exclusive content' : 'View your reward';

    // A recurring product delivers this cycle's content, not a one-off unlock —
    // the server sends the same three reward keys for both, so only the wording
    // distinguishes them.
    const rewardHeading = kind === 'subscription' ? 'Your member content' : 'What you unlocked';

    // ---- Status badge ----
    const statusBadge = (() => {
        if (kind === 'receipt') return <StatusPill tone="#10B981" label="Completed" />;
        if (kind === 'unlocked') return <StatusPill tone="#8B5CF6" label="Lifetime" />;
        if (kind === 'subscription') {
            if (item.is_canceling) return <StatusPill tone="#F59E0B" label="Cancelling" />;
            if (item.is_active) return <StatusPill tone="#10B981" label="Active" />;
            return <StatusPill tone="#71717A" label="Ended" />;
        }
        if (kind === 'incoming') {
            if (item.is_overdue) return <StatusPill tone="#EF4444" label="Overdue" />;
            return <StatusPill tone="#F59E0B" label="In progress" />;
        }
        return null;
    })();

    // ---- Date display ----
    const dateStr = fmtDate(item.date || item.created_at || item.unlocked_at || item.started_at);

    // ---- Amount ----
    const amount = item.amount ?? item.price ?? null;

    return (
 <div className="group relative overflow-hidden bg-white/80 backdrop-blur-sm border border-white/70 rounded-box-sm transition-all duration-300 ">
            {/* Left accent glow on hover */}
            <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: `linear-gradient(180deg, ${ACCENT}, ${ACCENT2})` }} />

            {/* ── Top row: icon + info + amount ── */}
            <div className="p-4 flex items-start gap-3.5">
                <IconTile type={item.source_type} size={46} />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-zinc-900 truncate">{item.title || 'Purchase'}</span>
                        {isNew(item) && <NewDot />}
                    </div>
                    <div className="text-xs text-zinc-500 mt-0.5 font-medium flex items-center gap-1.5 flex-wrap">
                        {item.owner?.username && <span>@{item.owner.username}</span>}
                        {dateStr && <><span className="w-1 h-1 rounded-full bg-zinc-300 shrink-0" /><span>{dateStr}</span></>}
                    </div>
                    <div className="mt-1.5">{statusBadge}</div>
                    {/* What WE sent YOU about this purchase — your own messages only. */}
                    <DeliveryStatus notifications={item.notifications} className="mt-1.5" />
                </div>
                {amount !== null && (
                    <div className="text-right shrink-0">
                        <div className={`text-base font-bold text-zinc-900 ${MONO}`}>{money(amount)}</div>
                        {kind === 'receipt' && item.certificate_url && (
                            <a href={item.certificate_url} target="_blank" rel="noreferrer"
 className="mt-1 inline-flex items-center gap-1 text-[12px] font-semibold text-black/60 hover:text-zinc-700 transition-colors">
                                <Download size={11} strokeWidth={2.4} /> Receipt
                            </a>
                        )}
                        {kind === 'subscription' && item.recurring_type && (
 <div className="text-[12px] text-black/60 font-medium mt-0.5 capitalize">{item.recurring_type}</div>
                        )}
                    </div>
                )}
            </div>

            {/* ── Reward section (receipts + unlocked + active subscriptions) ── */}
            {hasReward && (
                <div className="border-t mx-4 mb-4 pt-3.5" style={{ borderColor: `${ACCENT}22` }}>
                    <div className="flex items-center gap-1.5 mb-2.5">
 <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                            style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})` }}>
                            <Gift size={11} strokeWidth={2.5} className="text-white" />
                        </span>
 <span className="text-[12px] font-bold uppercase tracking-wide" style={{ color: ACCENT }}>{rewardHeading}</span>
                    </div>
                    {item.reward_text && (
 <p className="text-xs text-zinc-700 leading-relaxed bg-white/70 rounded-box-sm px-3 py-2.5 border border-white/80 mb-2.5">{item.reward_text}</p>
                    )}
                    {item.reward_url && (
                        <a href={item.reward_url} target="_blank" rel="noreferrer"
 className="flex items-center justify-center gap-2 min-h-[40px] w-full rounded-box-sm text-xs font-bold text-white transition-all hover:opacity-90"
                            style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})` }}>
                            <RewardIcon size={13} strokeWidth={2.5} />{rewardLabel}
                        </a>
                    )}
                </div>
            )}

            {/* ── Unlocked: open link ── */}
            {kind === 'unlocked' && !hasReward && item.open_link && (
                <div className="px-4 pb-4">
                    <a href={item.open_link} target="_blank" rel="noreferrer"
 className="flex items-center justify-center gap-2 min-h-[38px] w-full rounded-box-sm border border-zinc-200/70 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-all">
                        <ArrowUpRight size={13} strokeWidth={2.4} /> View content
                    </a>
                </div>
            )}

            {/* ── Incoming: delivery info + actions ── */}
            {kind === 'incoming' && (
                <div className="px-4 pb-4 space-y-2.5">
                    {item.is_physical && item.tracking_id && (
 <div className="flex items-center gap-2 text-xs text-zinc-600 bg-zinc-50 rounded-box-sm px-3 py-2.5 border border-zinc-100">
                            <Truck size={13} strokeWidth={2.2} />
                            <span className="font-medium">{item.courier_name || 'Courier'}</span>
                            <span className={MONO}>{item.tracking_id}</span>
                        </div>
                    )}
                    <div className="flex gap-2 flex-wrap">
                        {/* ⚠️ Review BEFORE accept. Accepting releases escrow,
                            and /task/order/{uuid} is the only page that renders
                            the creator's proof — without this link the hub asked
                            the supporter to approve work they could not see. */}
                        {item.task_uuid && (
                            <a href={`/task/order/${item.task_uuid}`}
 className="flex-1 flex items-center justify-center gap-1.5 min-h-[38px] rounded-box-sm border border-zinc-200/70 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-all">
                                <ArrowUpRight size={12} strokeWidth={2.4} /> View delivery
                            </a>
                        )}
                        {item.can_accept && (
                            <button onClick={() => onAccept(item)} disabled={busy === item.id}
 className="flex-1 min-h-[38px] rounded-box-sm text-xs font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
                                style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})` }}>
                                {busy === item.id ? 'Accepting…' : 'Accept delivery'}
                            </button>
                        )}
                        {!item.task_uuid && item.open_link && (
                            <a href={item.open_link}
 className="flex-1 flex items-center justify-center gap-1.5 min-h-[38px] rounded-box-sm border border-zinc-200/70 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-all">
                                <ArrowUpRight size={12} strokeWidth={2.4} /> View creator
                            </a>
                        )}
                        <button onClick={() => onReport(item)}
 className="min-h-[38px] px-3.5 rounded-box-sm border border-zinc-200/70 text-xs font-semibold text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50 transition-all">
                            Report
                        </button>
                    </div>
                </div>
            )}

            {/* ── Subscription: renewal info + actions ── */}
            {kind === 'subscription' && (
                <div className="px-4 pb-4">
                    <div className="flex items-center gap-2 text-xs text-zinc-500 mb-2.5">
                        {item.next_charge_at && <span>Renews <strong className="text-zinc-800">{fmtDate(item.next_charge_at)}</strong></span>}
                        {item.ends_at && <span className="text-amber-600">Ends <strong>{fmtDate(item.ends_at)}</strong></span>}
                    </div>
                    <div className="flex gap-2">
                        {item.cancelable && (
                            <button onClick={() => onCancel(item)} disabled={busySub === item.id}
 className="min-h-[36px] px-4 rounded-box-sm border border-zinc-200 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 transition-all disabled:opacity-50">
                                Cancel renewal
                            </button>
                        )}
                        {item.resumable && (
                            <button onClick={() => onResume(item)} disabled={busySub === item.id}
 className="min-h-[36px] px-4 rounded-box-sm text-xs font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
                                style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})` }}>
                                Resume
                            </button>
                        )}
                        {item.open_link && (
                            <a href={item.open_link}
 className="ml-auto min-h-[36px] px-3.5 flex items-center gap-1.5 rounded-box-sm border border-zinc-200 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 transition-all">
                                <ArrowUpRight size={12} strokeWidth={2.4} /> View
                            </a>
                        )}
                    </div>
                </div>
            )}

            {/* ── No reward, no special section (e.g. physical shop item) ── */}
            {kind === 'receipt' && !hasReward && (
                <div className="px-4 pb-3.5">
 <div className="flex items-center gap-2 text-[12px] text-black/60 font-medium">
                        <Truck size={12} strokeWidth={2.2} />
                        <span>Physical or pending delivery</span>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ---------------- Receipt card with per-transaction reward ---------------- */
function ReceiptCard({ r, money }) {
    const hasReward = r.reward_url || r.reward_text;

    const RewardIcon = r.reward_type === 'file'
        ? Download
        : r.reward_type === 'link'
        ? ExternalLink
        : Gift;

    const rewardLabel = r.reward_type === 'file'
        ? 'Download your reward'
        : r.reward_type === 'link'
        ? 'Access exclusive content'
        : 'View your reward';

    return (
 <div className="group relative overflow-hidden bg-white/80 backdrop-blur-sm border border-white/70 rounded-box-sm transition-all duration-300 ">
            {/* Left accent bar on hover */}
            <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: `linear-gradient(180deg, ${ACCENT}, ${ACCENT2})` }} />

            {/* Top: transaction info */}
            <div className="p-4 flex items-center gap-3.5">
                <IconTile type={r.source_type} size={46} />
                <div className="flex-1 min-w-0">
                    <div className="font-bold text-zinc-900 truncate">{r.title}</div>
                    <div className="text-xs text-zinc-500 mt-0.5 font-medium flex items-center gap-1.5">
                        <span>@{r.owner?.username}</span>
                        <span className="w-1 h-1 rounded-full bg-zinc-300" />
                        <span>{fmtDate(r.date)}</span>
                    </div>
                </div>
                <div className="text-right shrink-0">
                    <div className={`text-base font-bold text-zinc-900 ${MONO}`}>{money(r.amount)}</div>
                    <a href={r.certificate_url} target="_blank" rel="noreferrer"
 className="mt-1 inline-flex items-center gap-1 text-[12px] font-semibold text-black/60 hover:text-zinc-700 transition-colors">
                        <Download size={11} strokeWidth={2.4} /> Receipt
                    </a>
                </div>
            </div>

            {/* Bottom: reward — always visible, no click required */}
            {hasReward ? (
                <div className="border-t mx-4 mb-4 pt-3.5" style={{ borderColor: `${ACCENT}22` }}>
                    <div className="flex items-center gap-1.5 mb-2.5">
 <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                            style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})` }}>
                            <Gift size={11} strokeWidth={2.5} className="text-white" />
                        </span>
 <span className="text-[12px] font-bold uppercase tracking-wide" style={{ color: ACCENT }}>
                            What you unlocked
                        </span>
                    </div>

                    {/* Reward message text */}
                    {r.reward_text && (
 <p className="text-xs text-zinc-700 leading-relaxed bg-white/70 rounded-box-sm px-3 py-2.5 border border-white/80 mb-2.5">
                            {r.reward_text}
                        </p>
                    )}

                    {/* Reward access button */}
                    {r.reward_url && (
                        <a href={r.reward_url} target="_blank" rel="noreferrer"
 className="flex items-center justify-center gap-2 min-h-[40px] w-full rounded-box-sm text-xs font-bold text-white transition-all hover:opacity-90 hover:-translate-y-0.5 "
                            style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})` }}>
                            <RewardIcon size={13} strokeWidth={2.5} />
                            {rewardLabel}
                        </a>
                    )}
                </div>
            ) : (
                /* No reward: show a subtle "Pending delivery" or "No digital reward" note */
                <div className="px-4 pb-3.5">
 <div className="flex items-center gap-2 text-[12px] text-black/60 font-medium">
                        <Truck size={12} strokeWidth={2.2} />
                        <span>Physical or pending delivery</span>
                    </div>
                </div>
            )}
        </div>
    );
}


/* ---------------- Shared ---------------- */
function Empty({ title, sub, Icon, cta }) {
    return (
        <div className="py-14 sm:py-18 text-center px-6 rounded-box-sm border border-white/70 bg-white/60 backdrop-blur-sm">
            <span className="inline-flex w-16 h-16 rounded-box-sm items-center justify-center mb-5 text-black/60" style={{ background: "linear-gradient(135deg, #f4f4f5 0%, #e4e4e7 100%)" }}>
                <Icon size={26} strokeWidth={1.7} />
            </span>
            <div className="text-base font-bold text-zinc-900">{title}</div>
            <div className="text-sm text-zinc-500 mt-2 max-w-xs mx-auto leading-relaxed">{sub}</div>
            {/* An empty state that only says "nothing here" is a dead end — every one
                of them now offers the next step. */}
            {cta && (
                <a href="/creators"
 className="mt-6 inline-flex items-center gap-2 min-h-[44px] px-6 rounded-box-sm text-sm font-bold text-white transition-all hover:opacity-90 hover:-translate-y-0.5 "
                    style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT2} 100%)` }}>
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
