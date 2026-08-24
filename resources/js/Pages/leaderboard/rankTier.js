/**
 * How a percentile is shown, in one place.
 *
 * A raw "Top 3.45%" is precision nobody asked for, and the same figure was
 * being styled differently on the podium, the rail and the sticky bar. Bands
 * make the number legible at a glance — and give a creator something to climb
 * towards that isn't "first place or nothing".
 *
 * The bands are brand FILLS with black type inside a 2px black frame, not
 * tints. A tint reads as a hint; this page is a ranking, and the band a
 * creator has reached is the one thing on their row worth shouting. Black on
 * every brand fill is the house rule — never white (brandPink measures 5.56:1
 * against black and 3.78:1 against white).
 *
 * ⚠️ `border-black` is a full `border` SHORTHAND in this project
 * (`resources/css/index.css`), so it already carries its own 2px width. Never
 * pair it with a width class — the width is discarded silently.
 */
const BANDS = [
    { max: 1, name: "Top 1%", className: "border-black bg-brandYellow text-black" },
    { max: 10, name: "Top 10%", className: "border-black bg-brandPink text-black" },
    { max: 25, name: "Top 25%", className: "border-black bg-mint text-black" },
    { max: 50, name: "Top 50%", className: "border-black bg-white text-black" },
];

const OUTSIDE = "border-black bg-white text-black/70";

export function rankTier(top) {
    const value = Number(top);

    if (!Number.isFinite(value)) {
        return { label: null, band: null, className: OUTSIDE };
    }

    // Below 1% would round to "Top 0%", which reads as a bug rather than a boast.
    const label = value < 1 ? "Top 1%" : `Top ${Math.round(value)}%`;
    const band = BANDS.find((b) => value <= b.max);

    return {
        label,
        band: band?.name ?? null,
        className: band?.className ?? OUTSIDE,
    };
}

/** The percentile a creator is closest to reaching next, or null at the top. */
export function nextBand(top) {
    const value = Number(top);

    if (!Number.isFinite(value)) return null;

    const next = [...BANDS].reverse().find((b) => b.max < value);

    return next ? next.name : null;
}
