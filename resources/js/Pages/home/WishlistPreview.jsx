/**
 * HTML "your page" previews for the three FUN stacked cards. Each variant is a
 * DIFFERENT layout that matches its heading — not one template re-skinned:
 *   wishlist → an add-items checklist + share
 *   gifts    → an activity feed led by a weekly total
 *   shop     → a storefront product grid
 * Shared neo-brutalist white-screen frame for brand cohesion.
 */

const PINK = "#FF007F";
const PURPLE = "#05EFB8";
const TEAL = "#05EFB8";
const YELLOW = "#FFE14D";

function Frame({ children }) {
    return (
        <div className="relative w-[280px] sm:w-[318px] -rotate-[4deg] bg-white border-[3px] border-black rounded-[26px] p-4">
            {children}
        </div>
    );
}

function Avatar({ size = "w-9 h-9" }) {
    return <span className={`${size} shrink-0 rounded-full border-2 border-black flex items-center justify-center text-white text-[11px] font-black bg-gradient-to-br from-[#05EFB8] to-[#FF007F]`}>JJ</span>;
}

function CTA({ children, glyph }) {
    return (
        <button className="relative w-full mt-3.5 bg-[#FF007F] text-white text-[12px] font-black uppercase tracking-wide py-2.5 rounded-[12px] border-[3px] border-black overflow-hidden flex items-center justify-center gap-1.5">
            <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent"></span>
            <span className="relative">{children}</span>{glyph && <span className="relative">{glyph}</span>}
        </button>
    );
}

/* 1 — Wishlist: add dream items + share (Option A — progress + dream-total meta) */
function WishlistMock() {
    const items = [
        { e: "🎧", n: "AirPods Max", p: "£499", tint: PURPLE, done: true },
        { e: "🥤", n: "Stanley Tumbler", p: "£49", tint: PINK, done: true },
        { e: "📱", n: "iPhone 16 Pro", p: "£1,200", tint: YELLOW, done: false },
    ];
    const inCount = items.filter((it) => it.done).length;
    const pct = Math.round((inCount / items.length) * 100);
    return (
        <Frame>
            <div className="flex items-center gap-2.5 mb-3">
                <Avatar />
                <div className="leading-tight min-w-0">
                    <p className="font-gulfs uppercase text-[13px] text-black">@justjack</p>
                    <p className="text-[9.5px] font-bold uppercase text-gray-500 truncate">3 items · £1,748 dream list</p>
                </div>
                <span className="ml-auto text-[11px] font-black uppercase border-2 border-black rounded-full px-2 py-0.5" style={{ background: TEAL }}>Share</span>
            </div>
            {/* progress */}
            <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 h-2.5 rounded-full border-2 border-black bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-r-full" style={{ width: `${pct}%`, background: TEAL }}></div>
                </div>
                <span className="text-[11px] font-black uppercase whitespace-nowrap">{inCount}/{items.length} in</span>
            </div>
            <div className="space-y-2">
                {items.map((it, i) => (
                    <div key={i} className={`flex items-center gap-2.5 border-2 border-black rounded-[12px] p-2 ${it.done ? "bg-gray-50" : "bg-white"}`}>
                        <span className="w-8 h-8 shrink-0 rounded-[8px] border-2 border-black flex items-center justify-center text-base" style={{ background: `${it.tint}33` }}>{it.e}</span>
                        <span className="text-[11.5px] font-black uppercase text-black flex-1 min-w-0 truncate">{it.n}</span>
                        <span className="font-black text-[11px] text-[#FF007F]">{it.p}</span>
                        <span className={`w-5 h-5 shrink-0 rounded-full border-2 border-black flex items-center justify-center text-[11px] ${it.done ? "text-black" : "text-gray-300"}`} style={it.done ? { background: TEAL } : undefined}>{it.done ? "✓" : ""}</span>
                    </div>
                ))}
                <div className="flex items-center justify-center gap-1.5 border-2 border-dashed border-gray-300 rounded-[12px] py-2 text-[11px] font-black uppercase text-gray-400">＋ Add item</div>
            </div>
            <CTA glyph="🔗">Share your page</CTA>
        </Frame>
    );
}

/* 2 — Gifts: activity feed led by a weekly total */
function GiftsMock() {
    const feed = [
        { e: "🎧", who: "@jack", what: "sent AirPods", p: "£499" },
        { e: "🥤", who: "@mia", what: "sent a Stanley", p: "£49" },
    ];
    return (
        <Frame>
            <div className="flex items-center gap-2.5 mb-3">
                <Avatar size="w-8 h-8" />
                <p className="text-[11px] font-black uppercase tracking-wide text-gray-500">From your fans</p>
                <span className="ml-auto inline-flex items-center gap-1 text-[8.5px] font-black uppercase border-2 border-black rounded-full px-2 py-0.5" style={{ background: TEAL }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse"></span>Live
                </span>
            </div>
            {/* weekly total */}
            <div className="rounded-[14px] border-[3px] border-black p-3 mb-3" style={{ background: `linear-gradient(135deg, ${PINK}, #c4006a)` }}>
                <p className="text-[11px] font-black uppercase tracking-wide text-white/80">This week from fans</p>
                <p className="font-gulfs text-[26px] leading-none text-white mt-0.5">£1,548</p>
                <p className="text-[11px] font-bold uppercase text-white/85 mt-1">🎉 12 items sent from any store</p>
            </div>
            <div className="space-y-1.5">
                {feed.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 bg-gray-50 border-2 border-black rounded-[10px] px-2 py-1.5" style={{ transform: `rotate(${i % 2 ? 0.8 : -0.8}deg)` }}>
                        <span className="w-7 h-7 shrink-0 rounded-full border-2 border-black bg-white flex items-center justify-center text-sm">{f.e}</span>
                        <p className="text-[10.5px] uppercase leading-tight flex-1 min-w-0 truncate"><span className="font-black text-black">{f.who}</span> <span className="text-gray-500">{f.what}</span></p>
                        <span className="font-black text-[11px] text-[#FF007F]">{f.p}</span>
                    </div>
                ))}
            </div>
        </Frame>
    );
}

/* 3 — Shop: storefront product grid */
function ShopMock() {
    const products = [
        { e: "🎨", n: "Custom art", p: "£49", bg: PURPLE },
        { e: "📦", n: "Merch box", p: "£35", bg: PINK },
        { e: "🎵", n: "Voice note", p: "£15", bg: TEAL },
        { e: "📸", n: "Photo set", p: "£25", bg: YELLOW },
    ];
    return (
        <Frame>
            <div className="flex items-center gap-2.5 mb-3">
                <Avatar size="w-8 h-8" />
                <p className="font-gulfs uppercase text-[13px] text-black">Justjack's shop</p>
                <span className="ml-auto text-[11px] font-black uppercase border-2 border-black rounded-full px-2 py-0.5" style={{ background: YELLOW }}>⭐ 4.9</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
                {products.map((pr, i) => (
                    <div key={i} className="border-2 border-black rounded-[12px] overflow-hidden">
                        <div className="h-12 flex items-center justify-center text-xl" style={{ background: `${pr.bg}33` }}>{pr.e}</div>
                        <div className="p-1.5">
                            <p className="text-[11px] font-black uppercase text-black truncate">{pr.n}</p>
                            <div className="flex items-center justify-between mt-0.5">
                                <span className="font-black text-[11px] text-[#FF007F]">{pr.p}</span>
                                <span className="text-[8px] font-black uppercase text-white bg-black rounded-[5px] px-1.5 py-0.5">Buy</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <CTA glyph="🛍️">Open my shop</CTA>
        </Frame>
    );
}

export default function WishlistPreview({ variant = "wishlist" }) {
    if (variant === "gifts") return <GiftsMock />;
    if (variant === "shop") return <ShopMock />;
    return <WishlistMock />;
}
