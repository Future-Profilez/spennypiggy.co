/**
 * The bio page's palette presets — the client's half of the contract.
 *
 * 🚨 MIRRORS `App\Support\BioAppearance` BY HAND (the rewards.js pattern): that
 * class holds the keys the server accepts, this file holds what each key draws.
 * A key added to one and not the other is either a theme nobody can save or a
 * saved value the page cannot draw — change both.
 *
 * 🚨 EVERY PRESET IS CONTRAST-CHECKED, WHICH IS WHY THERE IS NO COLOUR PICKER.
 * `tests/javascript/bioThemes.test.js` asserts ink-on-ground ≥ AA for every
 * theme. The cards themselves stay white with black type and the pink CTA in
 * every theme — a theme changes the GROUND and what sits directly on it, never
 * the inside of a card, so the money surfaces keep their measured 5.56:1.
 *
 * ⚠️ Each theme resolves to CSS custom properties applied on the page shell as
 * an inline style; the markup reads `var(--bio-*)` so one lookup themes the
 * whole tree. `ink` is the full-strength on-ground text colour; the numbered
 * variants are the opacity steps the page actually uses.
 *
 * ⚠️ `link` is the Empty-state / footer link accent PER GROUND: brand pink
 * fails AA on the mint/butter/blush grounds (pink-on-pink is the documented
 * house failure), so coloured grounds drop it to full ink. On cream and on
 * near-black, pink clears AA and stays.
 *
 * 🚨 `cta`/`ctaInk` are what make each theme read as a DIFFERENT PAGE rather
 * than the same page recoloured: the buy pills, the "Open now" badge and the
 * avatar fallback all take them. Every pair is measured (the cta test below):
 * black-on-pink 5.56:1, mint/yellow/blush-on-black all >14:1. `accent` is the
 * decorative section-rule colour — non-text, but still chosen to be VISIBLE on
 * that theme's ground (black is invisible on Ink's near-black).
 *
 * ⚠️ An unknown or NULL key must resolve to `piglet` (the page's original
 * look) — the safe failure direction, so a removed preset never blanks a page.
 */

export const BIO_DEFAULT_THEME = "piglet";

export const BIO_THEMES = {
    // The original page: cream ground, black ink, pink accents.
    // ⚠️ The link is the DARKER brand pink, not #FF007F — full-strength pink on
    // cream is 3.53:1, an AA failure the page had been shipping on its Empty
    // state link. #D1006A measures ~5.0:1 here (the root CLAUDE.md's own
    // "darker pink" carve-out). Found by this file's contrast test.
    piglet: {
        label: "Piglet",
        ground: "#FFF6EC",
        ink: "#000000",
        inkRgb: "0,0,0",
        cta: "#FF007F",
        ctaInk: "#000000",
        accent: "#FF007F",
        link: "#D1006A",
    },
    // The brand mint — the ground the A3 ad page argues on.
    // Ink-on-mint: solid BLACK pills carrying mint type — a print look, and
    // nothing like the pink page.
    mint: {
        label: "Mint",
        ground: "#A2E4B8",
        ink: "#000000",
        inkRgb: "0,0,0",
        cta: "#000000",
        ctaInk: "#A2E4B8",
        accent: "#000000",
        link: "#000000",
    },
    // The brand yellow — the leaderboard / LiveBar family.
    butter: {
        label: "Butter",
        ground: "#E6EA7B",
        ink: "#000000",
        inkRgb: "0,0,0",
        cta: "#000000",
        ctaInk: "#E6EA7B",
        accent: "#000000",
        link: "#000000",
    },
    // Pink-tint ground; accents go full black (pink CTA stays inside cards).
    blush: {
        label: "Blush",
        ground: "#FFD3E8",
        ink: "#000000",
        inkRgb: "0,0,0",
        cta: "#FF007F",
        ctaInk: "#000000",
        accent: "#FF007F",
        link: "#000000",
    },
    // Near-black ground, cream ink — the landing page's own dark pairing.
    // MINT money pills on a near-black page — the landing page's own dark
    // pairing, and the strongest departure in the set.
    ink: {
        label: "Ink",
        ground: "#151515",
        ink: "#FFF6EC",
        inkRgb: "255,246,236",
        cta: "#A2E4B8",
        ctaInk: "#000000",
        accent: "#A2E4B8",
        link: "#FF007F",
    },
};

export const BIO_LAYOUTS = ["list", "grid"];
export const BIO_DEFAULT_LAYOUT = "list";

export function bioTheme(key) {
    return BIO_THEMES[key] || BIO_THEMES[BIO_DEFAULT_THEME];
}

/**
 * The CSS custom properties one theme paints. Opacity steps are pre-mixed here
 * because Tailwind's `/45` modifier cannot decompose a var() colour.
 */
export function bioThemeVars(key) {
    const t = bioTheme(key);
    const step = (a) => `rgba(${t.inkRgb},${a})`;

    return {
        "--bio-ground": t.ground,
        "--bio-ink": t.ink,
        "--bio-ink30": step(0.3),
        "--bio-ink40": step(0.4),
        "--bio-ink45": step(0.45),
        "--bio-ink50": step(0.5),
        "--bio-ink55": step(0.55),
        "--bio-ink60": step(0.6),
        "--bio-ink70": step(0.7),
        "--bio-rule": step(0.15),
        "--bio-chip": step(0.07),
        "--bio-cta": t.cta,
        "--bio-cta-ink": t.ctaInk,
        "--bio-accent": t.accent,
        "--bio-link": t.link,
    };
}
