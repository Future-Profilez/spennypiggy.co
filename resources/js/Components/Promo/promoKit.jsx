import { Link } from "@inertiajs/react";

/**
 * The only things every promo card shares.
 *
 * 🚨 KEEP THIS FILE SMALL. Each promo is a SEPARATE COMPONENT in `./cards`, free to
 * lay itself out however it likes — that is the whole point, and four earlier passes
 * failed because they drew every promo from one template and recoloured it. What
 * lives here is strictly the vocabulary that makes ten different cards read as one
 * deck: the frame, the height, the palette and the button. Anything that varies per
 * promo belongs in that promo's own file, never here.
 *
 * 🚨 THE FRAME IS `border-black` ALONE, WITH NO WIDTH CLASS. `resources/css/index.css`
 * redefines `.border-black` as the full `border: 2px solid var(--black)` SHORTHAND —
 * exactly the house frame — so pairing it with a width class only discards the width.
 * And `border-[#000]`, the obvious way to dodge that, **does not compile in this
 * project**: verified against the built stylesheet, the class appears zero times while
 * every other arbitrary class on these cards is present, so an element built on it
 * renders with a TRANSPARENT border and no frame at all. Where only some sides need a
 * rule, or the style is dashed, set it INLINE — an inline border cannot be dropped.
 *
 * 🚨 THE HEIGHT IS FIXED AND IS THE SAME FOR EVERY CARD. Ten cards sized by their own
 * content makes the slider jump on every swipe and every autoplay tick, and on a phone
 * the jump is a large fraction of the card. A card may lay out its insides freely; it
 * may not choose its own height.
 */

/**
 * 🚨 MEASURED, NOT CHOSEN — AND THE FLOOR IS MOBILE, NOT DESKTOP.
 *
 * Raised from 250/268/300 when every promo gained a sentence of mechanics (before that a
 * creator could not tell from the card what the offer WAS). Then trimmed on desktop once
 * the visuals filled the right-hand side and the left column was left with a dead band
 * above its button.
 *
 * ⚠️ 268px was tried on mobile and **clipped the BUTTON off five cards** — Fast Start by
 * 20px, plus Bio, Suggest, Receipt and Referral. `overflow-hidden` hides that silently,
 * so it looks like a design choice rather than a defect. 292 is the smallest height at
 * which every card at 320px still shows its control. Re-measure before changing it:
 * render every card at 320/390/768/1200 and check no `<a>` or `<button>` crosses the
 * card's bottom edge.
 */
export const CARD_H = "h-[292px] sm:h-[300px] md:h-[316px]";

export const CARD_FRAME =
    `relative w-full ${CARD_H} overflow-hidden rounded-box border-black`;

export const PAD = "px-5 py-5 sm:px-6 sm:py-6 md:px-8 md:py-7";

/** Display type. Every headline in the deck is gulfs; only the size varies. */
export const display = (size) =>
    `font-gulfs uppercase leading-[0.85] tracking-[-0.02em] ${size}`;

/**
 * Ink per ground, measured rather than assumed.
 *
 * Black on brand pink is 5.56:1 and white is 3.78:1 (fails AA at label size), so every
 * colour ground takes black type — the house rule, and it holds for violet (4.78:1
 * black vs 4.40:1 white) too. Only the black ground takes white.
 *
 * 🚨 A MID-LUMINANCE GROUND HAS NO HEADROOM FOR AN ALPHA. Black caps out at 5.56:1 on
 * `#FF007F` and 4.78:1 on `#8C52FF`, so dropping secondary copy to the usual ~75%
 * measures 4.43:1 and 3.87:1 — both under AA at the 13–15px it renders at. Pink and
 * violet therefore keep FULL black and take hierarchy from size and weight instead.
 *
 * `wash` is the alpha a card uses for its own texture (stripes, rules, a bled drawing).
 */
export const GROUNDS = {
    pink: { bg: "#FF007F", ink: "#000", body: "#000", wash: "rgba(0,0,0,0.16)", chipBg: "#000", btnBg: "#000", btnInk: "#FFF", segment: "#FF007F" },
    yellow: { bg: "#E6EA7B", ink: "#000", body: "rgba(0,0,0,0.74)", wash: "rgba(0,0,0,0.16)", chipBg: "#000", btnBg: "#000", btnInk: "#FFF", segment: "#E6EA7B" },
    mint: { bg: "#05EFB8", ink: "#000", body: "rgba(0,0,0,0.74)", wash: "rgba(0,0,0,0.18)", chipBg: "#000", btnBg: "#000", btnInk: "#FFF", segment: "#05EFB8" },
    violet: { bg: "#8C52FF", ink: "#000", body: "#000", wash: "rgba(0,0,0,0.16)", chipBg: "#000", btnBg: "#000", btnInk: "#FFF", segment: "#8C52FF" },
    black: { bg: "#000000", ink: "#FFF", body: "rgba(255,255,255,0.80)", wash: "rgba(255,255,255,0.16)", chipBg: null, btnBg: "#FFF", btnInk: "#000", segment: "#000000" },
    "white-pink": { bg: "#FFFFFF", ink: "#000", body: "rgba(0,0,0,0.70)", wash: "rgba(0,0,0,0.12)", chipBg: "#000", btnBg: "#000", btnInk: "#FFF", segment: "#FF007F" },
    // The app's own warm cream (the bio page and Dashboard ground), added when the
    // birthday promo asked for it by name. ⚠️ `groundOf()` falls back to PINK for an
    // unknown key, so a config naming a ground that does not exist here does not fail —
    // it silently renders the wrong card.
    cream: {
        bg: "#FFF6EC",
        ink: "#000000",
        body: "rgba(0,0,0,0.70)",
        wash: "rgba(0,0,0,0.12)",
        chipBg: "#000000",
        btnBg: "#000000",
        btnInk: "#FFFFFF",
        segment: "#FFF6EC",
    },
    "white-mint": { bg: "#FFFFFF", ink: "#000", body: "rgba(0,0,0,0.70)", wash: "rgba(0,0,0,0.12)", chipBg: "#000", btnBg: "#000", btnInk: "#FFF", segment: "#05EFB8" },
};

export const ACCENTS = {
    pink: "#FF007F",
    yellow: "#E6EA7B",
    mint: "#05EFB8",
    violet: "#8C52FF",
};

export const groundOf = (name) => GROUNDS[name] ?? GROUNDS.pink;
export const accentOf = (name) => ACCENTS[name] ?? ACCENTS.pink;

/**
 * The small eyebrow label. Optional — a card whose own artwork already names it (the
 * bio card's URL pill, for instance) should leave it out rather than say it twice.
 */
export function Chip({ g, accent, children, className = "" }) {
    const bg = g.chipBg ?? accent;
    const ink = g.chipBg ? accent : "#000000";

    return (
        <span
            className={`shrink-0 self-start rounded-box-xs border-black px-2.5 py-1 font-CeraGR text-[9px] md:text-[10px] uppercase tracking-[0.18em] whitespace-nowrap ${className}`}
            style={{ backgroundColor: bg, color: ink }}
        >
            {children}
        </span>
    );
}

/**
 * A labelled figure. Two or three of these read as a spec strip rather than prose,
 * which is what a card with real numbers on it wants.
 *
 * ⚠️ The VALUE is what the reader scans, so it is the larger of the two; the label is
 * what makes the value mean something, so it can never be dropped to save space.
 */
export function Fact({ label, value, g, className = "" }) {
    return (
        <div className={`min-w-0 ${className}`}>
            <p
                className="font-CeraGR text-[8px] md:text-[9px] uppercase tracking-[0.16em] whitespace-nowrap"
                style={{ color: g.body }}
            >
                {label}
            </p>
            <p
                className="font-gulfs text-[15px] md:text-[18px] leading-none whitespace-nowrap"
                style={{ color: g.ink }}
            >
                {value}
            </p>
        </div>
    );
}

/**
 * The call to action.
 *
 * ⚠️ `hover:brightness-110` / `active:brightness-95` plus a 2px translate is the house
 * press idiom. There is no shadow left to move into and scaling is banned, so this is
 * the whole vocabulary for "this responds to you".
 */
export function Cta({ promo, g, onAction, className = "" }) {
    const cls =
        "inline-flex shrink-0 items-center gap-2 rounded-box-sm border-black " +
        "px-4 md:px-5 py-2.5 md:py-3 min-h-[44px] transition-[filter,transform] duration-200 " +
        "hover:brightness-110 active:brightness-95 active:translate-y-[2px] " +
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 " +
        className;

    const inner = (
        <>
            <span
                className="font-CeraGR text-[11px] md:text-[12px] uppercase tracking-[0.14em] whitespace-nowrap"
                style={{ color: g.btnInk }}
            >
                {promo.cta}
            </span>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" style={{ color: g.btnInk }}>
                <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </>
    );

    return promo.href ? (
        <Link href={promo.href} className={cls} style={{ backgroundColor: g.btnBg }}>
            {inner}
        </Link>
    ) : (
        <button type="button" onClick={() => onAction?.(promo)} className={cls} style={{ backgroundColor: g.btnBg }}>
            {inner}
        </button>
    );
}
