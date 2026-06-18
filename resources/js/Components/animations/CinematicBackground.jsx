/**
 * Cinematic page canvas. A single fixed, diffused background that the whole
 * homepage scrolls over — dark base + soft brand-colour glows + vignette + film
 * grain. Because it is position:fixed, content drifts over stationary light,
 * which reads as depth/parallax without per-section background blocks.
 *
 * Purely decorative (aria-hidden, pointer-events-none). No motion to respect,
 * so prefers-reduced-motion needs no special case here.
 */
export default function CinematicBackground() {
    return (
        <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#0a0a16]"
        >
            {/* Diffused brand glows — pink / purple / teal / yellow, bled across the frame */}
            <div
                className="cinematic-glow absolute inset-0"
                style={{
                    background: [
                        "radial-gradient(70% 65% at 10% 6%, rgba(255,0,127,0.50), transparent 66%)",
                        "radial-gradient(65% 60% at 90% 18%, rgba(140,82,255,0.46), transparent 68%)",
                        "radial-gradient(65% 65% at 16% 66%, rgba(5,239,184,0.30), transparent 68%)",
                        "radial-gradient(60% 55% at 84% 84%, rgba(230,234,123,0.26), transparent 68%)",
                        "radial-gradient(80% 70% at 50% 48%, rgba(140,82,255,0.16), transparent 72%)",
                    ].join(","),
                }}
            />

            {/* Vignette — focuses the eye, deepens the edges */}
            <div
                className="absolute inset-0"
                style={{
                    background:
                        "radial-gradient(135% 95% at 50% 35%, transparent 62%, rgba(0,0,0,0.5) 100%)",
                }}
            />

            {/* Film grain — breaks up the flat gradients, adds a premium texture */}
            <div
                className="absolute inset-0 opacity-[0.05] mix-blend-soft-light"
                style={{
                    backgroundImage:
                        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
                    backgroundSize: "180px 180px",
                }}
            />
        </div>
    );
}
