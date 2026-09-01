/**
 * The bio theme presets — the promise the "no colour picker" decision rests on.
 *
 * 🚨 Every theme's on-ground ink must clear WCAG AA (4.5:1) against its ground.
 * This is WHY the set is curated: a free picker cannot make this promise, and
 * pink-on-pink failing AA is the documented house example. A theme added
 * without being measured fails here, not on a creator's page.
 */
import {
    BIO_DEFAULT_LAYOUT,
    BIO_DEFAULT_THEME,
    BIO_LAYOUTS,
    BIO_THEMES,
    bioTheme,
    bioThemeVars,
} from "@/constants/bioThemes";

const channel = (hex, i) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255;

const luminance = (hex) => {
    const lin = (c) =>
        c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    return (
        0.2126 * lin(channel(hex, 0)) +
        0.7152 * lin(channel(hex, 1)) +
        0.0722 * lin(channel(hex, 2))
    );
};

const contrast = (a, b) => {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
};

describe("bio themes", () => {
    test.each(Object.entries(BIO_THEMES))(
        "%s: full-strength ink clears AA on its own ground",
        (key, t) => {
            expect(contrast(t.ink, t.ground)).toBeGreaterThanOrEqual(4.5);
        },
    );

    test.each(Object.entries(BIO_THEMES))(
        "%s: the link accent clears AA on its own ground",
        (key, t) => {
            expect(contrast(t.link, t.ground)).toBeGreaterThanOrEqual(4.5);
        },
    );

    test.each(Object.entries(BIO_THEMES))(
        "%s: the CTA ink clears AA on the CTA fill",
        (key, t) => {
            // The buy pills are where the money is — these pairs are the whole
            // reason themes are curated presets.
            expect(contrast(t.ctaInk, t.cta)).toBeGreaterThanOrEqual(4.5);
        },
    );

    test.each(Object.entries(BIO_THEMES))(
        "%s: inkRgb matches ink",
        (key, t) => {
            const fromRgb =
                "#" +
                t.inkRgb
                    .split(",")
                    .map((n) => Number(n).toString(16).padStart(2, "0"))
                    .join("");
            expect(fromRgb.toLowerCase()).toBe(t.ink.toLowerCase());
        },
    );

    test("black type inside the white cards clears AA whatever the theme", () => {
        // Cards stay white with black type in EVERY theme — that invariant is
        // what lets a theme change only the ground.
        expect(contrast("#000000", "#FFFFFF")).toBeGreaterThanOrEqual(4.5);
    });

    test("an unknown or null key resolves to the default theme", () => {
        expect(bioTheme("no-such-theme")).toBe(BIO_THEMES[BIO_DEFAULT_THEME]);
        expect(bioTheme(null)).toBe(BIO_THEMES[BIO_DEFAULT_THEME]);
    });

    test("the default theme is the page's original cream look", () => {
        expect(BIO_THEMES[BIO_DEFAULT_THEME].ground).toBe("#FFF6EC");
    });

    test("the vars carry a value for every step the page reads", () => {
        const vars = bioThemeVars("ink");
        for (const key of [
            "--bio-ground",
            "--bio-ink",
            "--bio-ink30",
            "--bio-ink40",
            "--bio-ink45",
            "--bio-ink50",
            "--bio-ink55",
            "--bio-ink60",
            "--bio-ink70",
            "--bio-rule",
            "--bio-chip",
            "--bio-cta",
            "--bio-cta-ink",
            "--bio-accent",
            "--bio-link",
        ]) {
            expect(vars[key]).toBeTruthy();
        }
    });

    test("layouts are exactly list and grid, defaulting to list", () => {
        expect(BIO_LAYOUTS).toEqual(["list", "grid"]);
        expect(BIO_DEFAULT_LAYOUT).toBe("list");
    });
});
