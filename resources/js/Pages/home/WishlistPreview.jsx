/**
 * HTML "your page" previews for the three FUN stacked cards. Each variant is a
 * DIFFERENT layout that matches its heading — not one template re-skinned:
 *   wishlist → an add-items checklist + share
 *   activity → an activity feed led by a weekly total
 *   shop     → a storefront product grid
 * Shared neo-brutalist white-screen frame for brand cohesion.
 */

/**
 * ⚠️ There used to be a constant literally named `PURPLE` holding "#05EFB8" —
 * the brand MINT — with a `TEAL` constant holding the identical value beside it.
 * Two names for one colour, and one of them naming the wrong hue entirely. Both
 * are now `MINT`.
 *
 * ⚠️ `YELLOW` was "#FFE14D", an off-palette fourth yellow. The allocated yellow
 * is #E6EA7B.
 *
 * ⚠️ RADII IN THIS FILE ARE DELIBERATELY OFF THE 30/20 SCALE. This is not
 * product UI — it is a DRAWING of product UI, rendered at roughly a third of
 * life size inside `FeatureShowcase`. A 20px radius on a 32px tile is a blob, so
 * the small values here are scaled-down equivalents of the tokens, not drift.
 * The frame itself, which is at real container scale, does use `rounded-box`.
 */
const PINK = "#FF007F";
const MINT = "#05EFB8";
const YELLOW = "#E6EA7B";

function Frame({ children }) {
    return (
        <div className="relative md:w-[318px] md:-rotate-[4deg] bg-white border-[3px] border-black rounded-box p-4">
            {children}
        </div>
    );
}

function Avatar({ size = "w-9 h-9" }) {
    return <span className={`${size} shrink-0 rounded-full border-2 border-black flex items-center justify-center text-white text-[11px] font-black bg-gradient-to-br from-[#05EFB8] to-[#FF007F]`}>JJ</span>;
}

/**
 * 🚨 NOT A BUTTON. This whole file is an illustration — a drawing of the product
 * mounted inside `FeatureShowcase` — and this element used to be a real
 * `<button>` with no `onClick`, no `aria-hidden` and no `tabIndex={-1}`. A
 * keyboard user tabbed into a control that was announced as a button, looked
 * exactly like a live CTA, and did nothing. It was also ~34px tall, the only
 * interactive element on the page under the 44px floor — a floor it should never
 * have been measured against, because it is a picture.
 *
 * A `<span>` with `aria-hidden` removes it from the tab order and the
 * accessibility tree, which is what a mock-up wants. Do not turn it back into a
 * button to "fix" the styling.
 */
function CTA({ children, glyph }) {
    return (
        <span aria-hidden="true" className="relative w-full mt-3.5 bg-[#FF007F] text-black text-[12px] font-black uppercase tracking-wide py-2.5 rounded-box-sm border-[3px] border-black overflow-hidden flex items-center justify-center gap-1.5">
            <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent"></span>
            <span className="relative">{children}</span>{glyph && <span className="relative">{glyph}</span>}
        </span>
    );
}

/* 1 — Wishlist: list what you sell + share (progress + listed-total meta)
 *
 * ⚠️ The items are what the platform ACTUALLY sells. They were branded store
 * goods (AirPods Max, Stanley Tumbler, iPhone 16 Pro) — which is both the unbuilt
 * store wishlist and, separately, wording `App\Rules\NoExpenseOrBrandName` would
 * reject on a real listing. The homepage must not model a listing the platform's
 * own validation refuses. */
function WishlistMock() {
    const items = [
        { e: "📸", n: "Photo set", p: "£25", tint: MINT, done: true },
        { e: "🎬", n: "Custom video", p: "£75", tint: PINK, done: true },
        { e: "💎", n: "Gold tier", p: "£15", tint: YELLOW, done: false },
    ];
    const inCount = items.filter((it) => it.done).length;
    const pct = Math.round((inCount / items.length) * 100);
    return (
        <Frame>
            <div className="flex items-center gap-2.5 mb-3">
                <Avatar />
                <div className="leading-tight min-w-0">
                    <p className="font-gulfs uppercase text-[13px] text-black">@justjack</p>
                    <p className="text-[9.5px] font-bold uppercase text-black/60 truncate">3 items · £115 listed</p>
                </div>
                <span className="ml-auto text-[11px] font-black uppercase border-2 border-black rounded-full px-2 py-0.5" style={{ background: MINT }}>Share</span>
            </div>
            {/* progress */}
            <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 h-2.5 rounded-full border-2 border-black bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-r-full" style={{ width: `${pct}%`, background: MINT }}></div>
                </div>
                <span className="text-[11px] font-black uppercase whitespace-nowrap">{inCount}/{items.length} sold</span>
            </div>
            <div className="space-y-2">
                {items.map((it, i) => (
                    <div key={i} className={`flex items-center gap-2.5 border-2 border-black rounded-[12px] p-2 ${it.done ? "bg-gray-50" : "bg-white"}`}>
                        <span className="w-8 h-8 shrink-0 rounded-[8px] border-2 border-black flex items-center justify-center text-base" style={{ background: `${it.tint}33` }}>{it.e}</span>
                        <span className="text-[11.5px] font-black uppercase text-black flex-1 min-w-0 truncate">{it.n}</span>
                        <span className="font-black text-[11px] text-[#FF007F]">{it.p}</span>
                        <span className={`w-5 h-5 shrink-0 rounded-full border-2 border-black flex items-center justify-center text-[11px] ${it.done ? "text-black" : "text-black/30"}`} style={it.done ? { background: MINT } : undefined} title={it.done ? "Sold" : "Not sold yet"}>{it.done ? "✓" : ""}</span>
                    </div>
                ))}
                <div className="flex items-center justify-center gap-1.5 border-2 border-dashed border-black/30 rounded-[12px] py-2 text-[11px] font-black uppercase text-black/60">＋ Add item</div>
            </div>
            <CTA glyph="🔗">Share your page</CTA>
        </Frame>
    );
}

/* 2 — Activity: activity feed led by a weekly total */
function ActivityMock() {
    // ⚠️ "sent" reads as a gift, which is banned framing on every user-facing
    // surface — every line here is a purchase of creator content.
    const feed = [
        { e: "📸", who: "@jack", what: "unlocked Photo set", p: "£25" },
        { e: "💎", who: "@mia", what: "joined Gold tier", p: "£15" },
    ];
    return (
        <Frame>
            <div className="flex items-center gap-2.5 mb-3">
                <Avatar size="w-8 h-8" />
                <p className="text-[11px] font-black uppercase tracking-wide text-black/60">From your fans</p>
                <span className="ml-auto inline-flex items-center gap-1 text-[8.5px] font-black uppercase border-2 border-black rounded-full px-2 py-0.5" style={{ background: MINT }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse"></span>Live
                </span>
            </div>
            {/* weekly total */}
            <div className="rounded-[14px] border-[3px] border-black p-3 mb-3" style={{ background: `linear-gradient(135deg, ${PINK}, #c4006a)` }}>
                <p className="text-[11px] font-black uppercase tracking-wide text-white/80">This week from fans</p>
                <p className="font-gulfs text-[26px] leading-none text-white mt-0.5">£1,548</p>
                <p className="text-[11px] font-bold uppercase text-white/85 mt-1">🎉 12 unlocks this week</p>
            </div>
            <div className="space-y-1.5">
                {feed.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 bg-gray-50 border-2 border-black rounded-[10px] px-2 py-1.5" style={{ transform: `rotate(${i % 2 ? 0.8 : -0.8}deg)` }}>
                        <span className="w-7 h-7 shrink-0 rounded-full border-2 border-black bg-white flex items-center justify-center text-sm">{f.e}</span>
                        <p className="text-[10.5px] uppercase leading-tight flex-1 min-w-0 truncate"><span className="font-black text-black">{f.who}</span> <span className="text-black/60">{f.what}</span></p>
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
        { e: "🎨", n: "Custom art", p: "£49", bg: MINT },
        { e: "📦", n: "Merch box", p: "£35", bg: PINK },
        { e: "🎵", n: "Voice note", p: "£15", bg: MINT },
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
    if (variant === "activity") return <ActivityMock />;
    if (variant === "shop") return <ShopMock />;
    return <WishlistMock />;
}
