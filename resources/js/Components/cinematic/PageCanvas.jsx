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
            {/* The colour field. Pools are tighter and hotter than a broad wash —
                a light source reads as depth, an even haze reads as murk. */}
            <div
                className="absolute inset-0"
                style={{
                    background: [
                        // Hero — the warmest point of the page.
                        'radial-gradient(58% 22% at 74% 3%, rgba(255,0,127,0.55) 0%, rgba(255,0,127,0.14) 45%, transparent 72%)',
                        'radial-gradient(46% 15% at 16% 9%, rgba(5,239,184,0.42) 0%, rgba(5,239,184,0.10) 48%, transparent 74%)',
                        // The proof — deliberately the quietest passage, so the eye rests.
                        'radial-gradient(50% 12% at 84% 19%, rgba(140,82,255,0.26) 0%, transparent 70%)',
                        // Bonuses — yellow high point.
                        'radial-gradient(62% 14% at 28% 29%, rgba(230,234,123,0.42) 0%, rgba(230,234,123,0.10) 50%, transparent 74%)',
                        'radial-gradient(44% 11% at 88% 36%, rgba(255,0,127,0.30) 0%, transparent 70%)',
                        // Bank / tasks — cools.
                        'radial-gradient(56% 13% at 10% 46%, rgba(5,239,184,0.40) 0%, rgba(5,239,184,0.09) 50%, transparent 74%)',
                        // Referrals — pink returns hardest.
                        'radial-gradient(64% 15% at 78% 56%, rgba(255,0,127,0.50) 0%, rgba(255,0,127,0.12) 48%, transparent 74%)',
                        // Set up / sell.
                        'radial-gradient(52% 12% at 18% 67%, rgba(5,239,184,0.34) 0%, transparent 72%)',
                        'radial-gradient(46% 11% at 86% 74%, rgba(140,82,255,0.24) 0%, transparent 72%)',
                        // Love / reviews.
                        'radial-gradient(58% 13% at 76% 81%, rgba(255,0,127,0.38) 0%, transparent 72%)',
                        // Finale lifts back to yellow.
                        'radial-gradient(64% 15% at 32% 91%, rgba(230,234,123,0.40) 0%, rgba(230,234,123,0.09) 50%, transparent 74%)',
                        'radial-gradient(46% 11% at 82% 97%, rgba(255,0,127,0.30) 0%, transparent 72%)',
                        // Base is a deep ink, not #000. Pure black has nowhere left to go,
                        // so everything above it reads as sitting ON the page rather than
                        // in it; a hair of blue-violet gives the darks somewhere to sink.
                        'linear-gradient(#05030A, #05030A)',
                    ].join(','),
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
