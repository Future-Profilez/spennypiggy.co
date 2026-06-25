import React, { useState } from "react";
import { usePage } from "@inertiajs/react";
import LazyVideo from "../../Components/LazyVideo";
import {
    Heart, ShoppingBag, CheckCircle2, PiggyBank, Crown, Repeat, Coins,
    Wallet, Unlock, FileText, Music, Image as ImageIcon, Film,
    ArrowUpRight, PlayCircle,
} from "lucide-react";

/* Category system — one fixed colour + icon per purchase type, used everywhere
   (mosaic tile, media badge, spend bar). `ink` keeps badge text WCAG-readable on
   each fill. Colour encodes type; it is not decoration. */
const CAT = {
    wish:       { label: "Wish",         color: "#B892FF", ink: "#000", icon: Heart },
    shop:       { label: "Shop",         color: "#7EE7FC", ink: "#000", icon: ShoppingBag },
    task:       { label: "Paid Task",    color: "#FF9F6B", ink: "#000", icon: CheckCircle2 },
    piggypot:   { label: "Piggy Pot",    color: "#FF007F", ink: "#fff", icon: PiggyBank },
    membership: { label: "Membership",   color: "#FFE16A", ink: "#000", icon: Crown },
    bill:       { label: "Subscription", color: "#8AB4FF", ink: "#000", icon: Repeat },
    tip:        { label: "Piggy Bank",   color: "#B6F09C", ink: "#000", icon: Coins },
};
const cat = (t) => CAT[t] || { label: t, color: "#E5E5E5", ink: "#000", icon: FileText };

const SECTIONS = [
    { key: "media", label: "Media", icon: Film },
    { key: "subscriptions", label: "Subscriptions", icon: Repeat },
    { key: "unlocked", label: "Unlocked", icon: Unlock },
    { key: "spending", label: "Spending", icon: Wallet },
];

/* One radius system: cards 20, inner tiles/chips 12, interactive pill.
   One shadow system: card 6px, small 4px, hover +3px, active sinks to 2px. */
const CARD = "bg-white border-[3px] border-black rounded-[20px] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]";
const LIFT = "transition-transform duration-100 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[9px_9px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]";
const MONO = "[font-variant-numeric:tabular-nums] font-mono";

export default function PurchasesHub({
    display_currency = "GBP",
    media_library = [],
    media_pagination = {},
    subscriptions = [],
    unlocked = [],
    spend_summary = {},
    embedded = false,
}) {
    const { symbols } = usePage().props;

    const [tab, setTab] = useState("media");
    const [media, setMedia] = useState(media_library);
    const [page, setPage] = useState(media_pagination.current_page || 1);
    const [loading, setLoading] = useState(false);

    React.useEffect(() => {
        setMedia(media_library);
        setPage(media_pagination.current_page || 1);
    }, [media_library]);

    const symbol = symbols?.[display_currency] ?? "";
    const money = (n) => `${symbol}${Number(n || 0).toFixed(2)}`;
    const hasMore = (media_pagination.last_page || 1) > page;

    const loadMore = () => {
        if (loading) return;
        setLoading(true);
        const next = page + 1;
        fetch(`/my-purchases-feed?page=${next}`, { headers: { Accept: "application/json" } })
            .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
            .then((d) => { setMedia((p) => [...p, ...(d.medias || [])]); setPage(d.current_page || next); })
            .catch(() => {})
            .finally(() => setLoading(false));
    };

    const counts = {
        media: media.length,
        subscriptions: subscriptions.length,
        unlocked: unlocked.length,
        spending: spend_summary.purchase_count || 0,
    };

    const inner = (
        <div className={`mx-auto px-4 ${embedded ? "max-w-[1080px]" : "max-w-[1180px] pt-8"}`}>
            <Hero embedded={embedded} media={media} summary={spend_summary} money={money} />

            {/* Tab rail */}
            <div className="flex flex-wrap gap-3 mt-9 mb-8">
                {SECTIONS.map((s) => {
                    const Icon = s.icon;
                    const active = tab === s.key;
                    return (
                        <button
                            key={s.key}
                            onClick={() => setTab(s.key)}
                            aria-pressed={active}
                            className={`flex items-center gap-2 pl-4 pr-3 py-2.5 rounded-full border-[3px] border-black font-black uppercase text-xs tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform duration-100 hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#FF007F]/40 ${
                                active ? "bg-[#FF007F] text-white" : "bg-white text-black hover:bg-[#FFF0F7]"
                            }`}
                        >
                            <Icon size={15} strokeWidth={2.75} />
                            {s.label}
                            <span className={`min-w-[24px] h-5 inline-flex items-center justify-center rounded-[8px] text-[11px] border-2 border-black ${MONO} ${active ? "bg-white text-black" : "bg-[#A2E4B8] text-black"}`}>
                                {counts[s.key]}
                            </span>
                        </button>
                    );
                })}
            </div>

            {tab === "media" && <MediaGrid items={media} hasMore={hasMore} loadMore={loadMore} loading={loading} />}
            {tab === "subscriptions" && <SubscriptionList items={subscriptions} money={money} />}
            {tab === "unlocked" && <UnlockedList items={unlocked} />}
            {tab === "spending" && <SpendingDetail summary={spend_summary} money={money} />}
        </div>
    );

    if (embedded) return inner;
    return <div className="relative z-1 min-h-screen pb-24 bg-[#A2E4B8]">{inner}</div>;
}

/* ---------------- Hero: content mosaic + ledger total ---------------- */
function Hero({ embedded, media, summary, money }) {
    return (
        <div className={`${CARD} overflow-hidden`}>
            <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
                {/* Left — statement + ledger */}
                <div className="p-8 md:p-10">
                    <div className="flex items-center gap-2.5 mb-5">
                        <PiggyBank size={18} strokeWidth={2.75} className="text-[#FF007F]" />
                        <span className={`text-[11px] font-black uppercase tracking-[0.18em] text-black ${MONO}`}>
                            {summary.purchase_count || 0} purchases · {summary.creators_supported || 0} creators
                        </span>
                    </div>

                    {!embedded ? (
                        <h1 className="text-[2.6rem] md:text-[3.4rem] font-black uppercase tracking-tight text-black leading-[0.9]">
                            My<br />Purchases
                        </h1>
                    ) : (
                        <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-black leading-[0.9]">
                            My Purchases
                        </h2>
                    )}

                    <p className="text-black/70 font-bold text-sm mt-4 max-w-sm leading-relaxed">
                        Everything you’ve unlocked, kept in one place: media, subscriptions and access.
                    </p>

                    {/* Ledger total — the headline number, set like a receipt */}
                    <div className="mt-8 flex items-end gap-5 flex-wrap">
                        <div className="bg-black text-white rounded-[16px] px-5 py-3.5 border-[3px] border-black shadow-[4px_4px_0px_0px_#FF007F]">
                            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/55">Total spent</div>
                            <div className={`text-[2rem] md:text-[2.4rem] font-black leading-none mt-1.5 ${MONO}`}>{money(summary.total_spent)}</div>
                        </div>
                        <div className="pb-0.5">
                            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-black/45">This month</div>
                            <div className={`text-xl font-black text-black leading-none mt-1.5 ${MONO}`}>{money(summary.this_month)}</div>
                        </div>
                    </div>
                </div>

                {/* Right — tidy mosaic of their own content */}
                <div className="relative bg-[#A2E4B8] border-t-[3px] lg:border-t-0 lg:border-l-[3px] border-black min-h-[200px] md:min-h-[260px] flex items-center justify-center p-6">
                    {media.length ? (
                        <Mosaic tiles={media.slice(0, 4)} extra={Math.max(0, media.length - 4)} />
                    ) : (
                        <div className="flex flex-col items-center justify-center text-black/70">
                            <PiggyBank size={52} strokeWidth={2.25} />
                            <span className="mt-3 text-xs font-black uppercase tracking-widest">Your vault is empty</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* Tidy 2×2 of the buyer's real media, each tile nudged a few degrees. */
function Mosaic({ tiles, extra }) {
    const rot = ["-3deg", "2.5deg", "2deg", "-2.5deg"];
    return (
        <div className="relative w-full max-w-[300px]">
            <div className="grid grid-cols-2 gap-3">
                {tiles.map((t, i) => {
                    const c = cat(t.source_type);
                    const Icon = c.icon;
                    const isImg = t.media_kind === "image" && t.media_url;
                    return (
                        <div
                            key={t.id}
                            className="aspect-square rounded-[12px] border-[3px] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] overflow-hidden"
                            style={{ transform: `rotate(${rot[i]})`, background: c.color }}
                        >
                            {isImg ? (
                                <img src={t.media_url} alt="" loading="lazy" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center" style={{ color: c.ink }}>
                                    {t.media_kind === "video" ? <PlayCircle size={26} strokeWidth={2.5} /> : <Icon size={24} strokeWidth={2.5} />}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            {extra > 0 && (
                <span className={`absolute -bottom-2 -right-2 bg-black text-white text-[11px] font-black px-2.5 py-1 rounded-[10px] border-[3px] border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${MONO}`}>
                    +{extra}
                </span>
            )}
        </div>
    );
}

/* ---------------- Media ---------------- */
function MediaGrid({ items, hasMore, loadMore, loading }) {
    if (!items.length) return <Empty title="No media yet" sub="Content you buy from creators lands here." Icon={Film} />;
    return (
        <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                {items.map((it) => <MediaCard key={it.id} item={it} />)}
                {loading && [0, 1, 2, 3].map((i) => <SkeletonCard key={`sk${i}`} />)}
            </div>
            {hasMore && (
                <div className="text-center mt-8">
                    <button onClick={loadMore} disabled={loading}
                        className={`px-7 py-3 rounded-full bg-black text-white font-black uppercase text-xs tracking-widest border-[3px] border-black shadow-[4px_4px_0px_0px_#FF007F] transition-transform duration-100 hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-0 active:translate-y-0 disabled:opacity-50 ${MONO}`}>
                        {loading ? "Loading" : "Load more"}
                    </button>
                </div>
            )}
        </>
    );
}

function MediaCard({ item }) {
    const { media_kind, media_url, owner, title } = item;
    const c = cat(item.source_type);
    const Icon = c.icon;
    return (
        <div className={`${CARD} ${LIFT} overflow-hidden flex flex-col`}>
            <div className="aspect-square border-b-[3px] border-black flex items-center justify-center overflow-hidden relative" style={{ background: c.color }}>
                {media_kind === "video" ? (
                    <>
                        <LazyVideo src={media_url} posterSrc={media_url} fallback={owner?.avatar} controls className="w-full h-full object-cover" />
                        <span className="absolute top-2 left-2 bg-black text-white text-[10px] font-black uppercase px-2 py-1 rounded-[8px] border-2 border-white flex items-center gap-1 pointer-events-none">
                            <PlayCircle size={12} /> Video
                        </span>
                    </>
                ) : media_kind === "image" ? (
                    <img src={media_url} alt={title} loading="lazy" className="w-full h-full object-cover" />
                ) : (
                    <NonVisual kind={media_kind} url={media_url} ink={c.ink} />
                )}
            </div>
            <div className="p-3">
                <div className="text-sm font-black text-black truncate" title={title}>{title}</div>
                <div className="flex items-center justify-between mt-2 gap-2">
                    <span className="text-[11px] font-bold text-black/55 truncate">@{owner?.username}</span>
                    <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wide border-2 border-black rounded-[8px] pl-1 pr-2 py-0.5 whitespace-nowrap" style={{ background: c.color, color: c.ink }}>
                        <Icon size={11} strokeWidth={3} /> {c.label}
                    </span>
                </div>
            </div>
        </div>
    );
}

function SkeletonCard() {
    return (
        <div className={`${CARD} overflow-hidden flex flex-col animate-pulse`}>
            <div className="aspect-square border-b-[3px] border-black bg-[#A2E4B8]" />
            <div className="p-3 space-y-2">
                <div className="h-3.5 w-3/4 bg-black/15 rounded-[6px]" />
                <div className="h-3 w-1/2 bg-black/10 rounded-[6px]" />
            </div>
        </div>
    );
}

function NonVisual({ kind, url, ink }) {
    const Icon = kind === "audio" ? Music : kind === "pdf" ? FileText : ImageIcon;
    return (
        <a href={url} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-2 font-black uppercase text-xs tracking-widest hover:underline" style={{ color: ink }}>
            <Icon size={34} strokeWidth={2.5} />
            <span>Open file</span>
        </a>
    );
}

/* ---------------- Subscriptions ---------------- */
function SubscriptionList({ items, money }) {
    if (!items.length) return <Empty title="No active subscriptions" sub="Your recurring memberships and subscriptions appear here." Icon={Repeat} />;
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {items.map((s) => {
                const c = cat(s.source_type);
                return (
                    <div key={s.id} className={`${CARD} ${LIFT} p-5 flex items-center gap-4 relative overflow-hidden`}>
                        <span className="absolute left-0 top-0 bottom-0 w-2.5 border-r-[3px] border-black" style={{ background: c.color }} />
                        <img src={s.owner?.avatar} alt="" className="w-14 h-14 rounded-[12px] object-cover border-[3px] border-black ml-2.5" style={{ background: c.color }} />
                        <div className="flex-1 min-w-0">
                            <div className="font-black text-black text-base truncate">{s.title}</div>
                            <div className="text-xs font-bold text-black/55 truncate">@{s.owner?.username} · {c.label}</div>
                            {s.next_charge_at && (
                                <div className="inline-block mt-1.5 text-[10px] font-black uppercase tracking-widest bg-[#A2E4B8] border-2 border-black rounded-[8px] px-2 py-0.5 text-black">
                                    Renews {fmtDate(s.next_charge_at)}
                                </div>
                            )}
                        </div>
                        <div className="text-right shrink-0">
                            <div className={`font-black text-xl text-black leading-none ${MONO}`}>{money(s.amount)}</div>
                            <a href={s.open_link} className="mt-2 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-[#FF007F] hover:underline">
                                View <ArrowUpRight size={13} strokeWidth={3} />
                            </a>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

/* ---------------- Unlocked ---------------- */
function UnlockedList({ items }) {
    if (!items.length) return <Empty title="Nothing unlocked yet" sub="Content you’ve unlocked from creators shows here." Icon={Unlock} />;
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((u) => {
                const c = cat(u.source_type);
                const Icon = c.icon;
                return (
                    <a key={u.id} href={u.open_link} className={`${CARD} ${LIFT} p-5 flex items-center gap-3`}>
                        <span className="w-11 h-11 rounded-[12px] border-[3px] border-black flex items-center justify-center shrink-0" style={{ background: c.color, color: c.ink }}>
                            <Icon size={18} strokeWidth={2.75} />
                        </span>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-black text-black truncate">{u.title}</div>
                            <div className="text-[11px] font-bold text-black/55 truncate">@{u.owner?.username} · {c.label}</div>
                        </div>
                        <span className="shrink-0 text-[9px] font-black uppercase tracking-widest bg-[#B6F09C] border-2 border-black rounded-[8px] px-2 py-1 text-black">Active</span>
                    </a>
                );
            })}
        </div>
    );
}

/* ---------------- Spending ---------------- */
function SpendingDetail({ summary, money }) {
    const by = summary.by_type || {};
    const rows = Object.keys(by).filter((k) => by[k] > 0).sort((a, b) => by[b] - by[a]);
    const max = rows.length ? by[rows[0]] : 1;
    return (
        <div className={`${CARD} p-7 max-w-2xl`}>
            <div className="flex justify-between items-end mb-6 pb-5 border-b-[3px] border-black">
                <span className="text-xs font-black uppercase tracking-widest text-black/55">Total spent</span>
                <span className={`text-3xl font-black text-black leading-none ${MONO}`}>{money(summary.total_spent)}</span>
            </div>
            {rows.length ? (
                <div className="space-y-4">
                    {rows.map((k) => {
                        const c = cat(k);
                        const Icon = c.icon;
                        return (
                            <div key={k}>
                                <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-black mb-1.5">
                                    <span className="flex items-center gap-2">
                                        <span className="w-5 h-5 rounded-[6px] border-2 border-black flex items-center justify-center" style={{ background: c.color, color: c.ink }}>
                                            <Icon size={11} strokeWidth={3} />
                                        </span>
                                        {c.label}
                                    </span>
                                    <span className={MONO}>{money(by[k])}</span>
                                </div>
                                <div className="h-4 bg-[#A2E4B8] border-[3px] border-black rounded-full overflow-hidden">
                                    <div className="h-full" style={{ width: `${Math.max(6, (by[k] / max) * 100)}%`, background: c.color }} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <p className="text-sm font-bold text-black/55">No spending recorded yet.</p>
            )}
        </div>
    );
}

/* ---------------- Shared ---------------- */
function Empty({ title, sub, Icon }) {
    return (
        <div className={`${CARD} py-16 text-center`}>
            <span className="inline-flex w-16 h-16 rounded-full border-[3px] border-black bg-[#A2E4B8] items-center justify-center mb-4">
                <Icon size={28} strokeWidth={2.5} />
            </span>
            <div className="text-lg font-black uppercase tracking-widest text-black">{title}</div>
            <div className="text-sm font-bold text-black/55 mt-2 max-w-xs mx-auto">{sub}</div>
        </div>
    );
}

function fmtDate(s) {
    try {
        return new Date(s.replace(" ", "T")).toLocaleDateString(undefined, { day: "numeric", month: "short" });
    } catch {
        return s;
    }
}
