/**
 * The homepage's single background.
 *
 * 🚨 THE PAGE HAS ONE BACKGROUND, NOT ONE PER SECTION. Every section is
 * transparent and this element sits behind all of them, spanning the full
 * document height. Colour arrives as light drifting through a continuous dark
 * field rather than as a stack of coloured blocks, so scrolling reads as one
 * take instead of a deck of slides.
 *
 * This exists because there is no way to make full-bleed coloured section blocks
 * flow into one another. Every seam treatment was tried — fading to black, to a
 * deep tint of the band's own colour, to the neighbour's colour, proportionally
 * — and each one read as a smudge, because the boundary is the problem, not the
 * gradient across it. With one background there are no boundaries to soften.
 *
 * ⚠️ Do NOT give a homepage section its own background colour. It will cut this
 * field in half and the seam problem comes straight back. Solid colour belongs
 * on BLOCKS inside a section — bordered cards, chips, bands of type — never on
 * the section itself.
 *
 * Stops are placed by percentage of page height, so the composition holds
 * whatever the page grows to.
 */

/* A dark field built only from soft radial washes reads as fog: dull, and it
   BANDS visibly on 8-bit displays because a low-alpha gradient across 1500px has
   fewer than one step per 20 pixels. Grain is what separates a premium dark
   surface from a cheap one — it dithers those steps away and gives the black a
   texture to catch light on. Generated inline so it costs no request. */
const GRAIN =
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.42'/%3E%3C/svg%3E\")";

export default function PageCanvas() {
    return (
        <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
            {/* ⚠️ ONE CONTINUOUS RAMP, NOT A ROW OF POOLS.

                This used to be twelve radial washes pinned to percentages of the
                page — one over the hero, one over the bonuses, one over the
                referrals, and so on. That is a page-level element behaving like a
                per-section one: each pool bloomed where its section was and faded
                before the next, so scrolling read as a series of coloured stops
                rather than one field, which is the exact thing the single canvas
                exists to avoid.

                It is now a single vertical gradient travelling the whole document.
                Hue moves continuously — pink, violet, teal, pink, violet, warm —
                and no stop lines up with any section, so nothing blooms and
                nothing ends. Every value sits between 4% and 10% luminance: the
                colour has to be felt rather than seen, or it competes with the
                content sitting on it.

                ⚠️ A vertical ramp over a document this tall bands badly on 8-bit
                displays. The grain layer below is what dithers it and is not
                optional — remove it and the page shows horizontal steps. */}
            <div
                className="absolute inset-0"
                style={{
                    background: [
                        // The travel. Stops are deliberately irregular so the eye
                        // cannot find a rhythm and start reading them as sections.
                        'linear-gradient(180deg,'
                            + ' #0B0413 0%,'
                            + ' #16062A 9%,'
                            + ' #1A0A33 17%,'
                            + ' #10102E 26%,'
                            + ' #07202B 36%,'
                            + ' #06231F 44%,'
                            + ' #0D1226 53%,'
                            + ' #1B0730 62%,'
                            + ' #220A2B 70%,'
                            + ' #14092A 79%,'
                            + ' #1E0B24 88%,'
                            + ' #0C0514 100%)',
                    ].join(','),
                }}
            />

            {/* One wide diagonal wash across the whole document. A pure vertical
                ramp reads as a printed backdrop; a single angled pass gives the
                field a direction without introducing a second light source. */}
            <div
                className="absolute inset-0"
                style={{
                    background:
                        'linear-gradient(112deg, rgba(255,0,127,0.10) 0%, rgba(255,0,127,0) 26%,'
                        + ' rgba(5,239,184,0.07) 48%, rgba(5,239,184,0) 66%,'
                        + ' rgba(140,82,255,0.10) 88%, rgba(140,82,255,0) 100%)',
                }}
            />

            {/* The one place light is allowed to pool: the top of the page, where
                the hero is. It is a single source, not one per section. */}
            <div
                className="absolute inset-x-0 top-0 h-[92vh]"
                style={{
                    background:
                        'radial-gradient(70% 62% at 72% 0%, rgba(255,0,127,0.34) 0%, rgba(255,0,127,0.08) 46%, transparent 74%),'
                        + 'radial-gradient(52% 46% at 14% 6%, rgba(5,239,184,0.22) 0%, transparent 70%)',
                }}
            />

            {/* Vignette — holds the light in the middle of the frame. Without it the
                colour runs to the edges and the page reads flat. */}
            <div
                className="absolute inset-0"
                style={{
                    background:
                        'radial-gradient(120% 45% at 50% 30%, transparent 0%, transparent 42%, rgba(0,0,0,0.42) 100%)',
                }}
            />

            {/* Grain, over everything so it dithers the gradients above. */}
            <div
                className="absolute inset-0 opacity-[0.055] mix-blend-overlay"
                style={{ backgroundImage: GRAIN, backgroundRepeat: 'repeat' }}
            />
        </div>
    );
}
