/**
 * The creator-app design tokens, in ONE place.
 *
 * These are the house values already used across the site — nothing new is
 * invented here. What is new is that they are read from a single module rather
 * than retyped per screen, which is what let twenty-five different shadow
 * values and five different "verified" colours exist at once.
 *
 * 🚨 NO SHADOWS ANYWHERE (client direction, 14 Aug 2026). A frame is a LINE.
 * There is deliberately no shadow token in this file, so there is nothing to
 * reach for — a block that needs to separate itself gets a border, an accent
 * border, or more space around it.
 *
 * ⚠️ Colour is an ACCENT ROLE, not decoration. One accent per section: a screen
 * where every panel carries its own colour has no accent at all.
 *
 * ⚠️ Every value here must be a LITERAL class string or a literal hex. Tailwind's
 * JIT only sees class names it can read in the source, so `bg-[${accent}]` emits
 * no CSS whatsoever — the same silent-absence trap documented for the toaster.
 * Anything driven by a runtime value goes in an inline `style`, never a class.
 */

/** The four brand accents, and what each one MEANS on a creator screen. */
export const ACCENT = {
    /** Money, and the primary action on the screen. */
    pink: {
        hex: '#FF007F',
        text: 'text-[#FF007F]',
        bg: 'bg-[#FF007F]',
        border: 'border-[#FF007F]',
    },
    /** Earned, live, settled — anything that has already gone right. */
    mint: {
        hex: '#05EFB8',
        text: 'text-[#05EFB8]',
        bg: 'bg-[#05EFB8]',
        border: 'border-[#05EFB8]',
    },
    /** Scheduled, pending, informational — in flight, nothing to do. */
    violet: {
        hex: '#8C52FF',
        text: 'text-[#8C52FF]',
        bg: 'bg-[#8C52FF]',
        border: 'border-[#8C52FF]',
    },
    /** Attention: something the creator has to act on, short of a failure. */
    yellow: {
        hex: '#E6EA7B',
        text: 'text-[#E6EA7B]',
        bg: 'bg-[#E6EA7B]',
        border: 'border-[#E6EA7B]',
    },
};

/**
 * The two page grounds.
 *
 * ⚠️ `ink` is #0B0B0C, the same near-black the landing page and the leaderboard
 * header use — deliberately not pure #000, which sits flat against the black
 * borders drawn on top of it and makes every panel edge disappear.
 */
export const GROUND = {
    ink: 'bg-[#0B0B0C]',
    paper: 'bg-[#FAFAFA]',
};

/**
 * 🚨 A FILLED BRAND BLOCK TAKES BLACK TEXT, NEVER WHITE.
 *
 * Measured: white on #FF007F is ~4.2:1 and on #8C52FF ~4.6:1 — passable for a
 * large figure, under AA for the label beneath it. Black clears all four, and it
 * holds for buttons as well as blocks (client direction, 14 Aug 2026).
 */
export const ON_ACCENT = 'text-black';

/** Type roles. `gulfs` is a display face — it is never an input or body copy. */
export const TYPE = {
    /** Page and section headings. Uppercase is part of the face's character. */
    display: 'font-gulfs uppercase tracking-tight',
    /** The small tracked-out label above a heading or a figure. */
    eyebrow: 'font-gulfs uppercase tracking-[0.18em] text-[11px] md:text-[12px]',
    /**
     * Any number the creator reads as money or as a count.
     * ⚠️ `tabular-nums` is not optional: without it a counting-up figure or a
     * column of amounts jitters as the glyph widths change.
     */
    figure: 'font-gulfs tabular-nums leading-[0.9]',
    /** Body copy. */
    body: 'text-[15px] leading-[1.55]',
};

/**
 * ⚠️ `leading-<n>` IS PIXELS IN THIS PROJECT — `tailwind.config.js` overrides the
 * scale, so `leading-5` on 15px text is a 5px line box and the text renders on
 * top of itself. Always use an arbitrary ratio like `leading-[1.55]`.
 */
export const RULE = 'border-black/10';
