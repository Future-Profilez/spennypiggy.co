/**
 * How a percentile is shown, in one place.
 *
 * A raw "Top 3.45%" is precision nobody asked for, and the same figure was
 * being styled differently on the podium, the rail and the sticky bar. Bands
 * make the number legible at a glance — and give a creator something to climb
 * towards that isn't "first place or nothing".
 *
 * The colours are tints, not fills: at row scale a saturated block competes
 * with the creator's name, which is the thing the eye should land on first.
 */
const BANDS = [
    { max: 1, name: "Top 1%", className: "bg-[#C9A227]/12 text-[#8A6F1B] ring-1 ring-inset ring-[#C9A227]/30" },
    { max: 10, name: "Top 10%", className: "bg-brandPink/[0.08] text-brandPink ring-1 ring-inset ring-brandPink/20" },
    { max: 25, name: "Top 25%", className: "bg-black/[0.04] text-black/70 ring-1 ring-inset ring-black/10" },
    { max: 50, name: "Top 50%", className: "bg-black/[0.03] text-black/60 ring-1 ring-inset ring-black/[0.07]" },
];

const OUTSIDE = "bg-transparent text-black/60 ring-1 ring-inset ring-black/[0.07]";

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
