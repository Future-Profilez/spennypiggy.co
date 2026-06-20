import ScrollX from "@/Components/animations/ScrollX";

/**
 * Giant outlined text strip that scrubs sideways with the scroll —
 * the signature background decoration for homepage sections.
 *
 * Props:
 *  - text      (string) – word to repeat (e.g. "Founder")
 *  - from/to   (number) – ScrollX scrub range in px (default 0 → -500)
 *  - opacity   (number) – stroke opacity 0..1 (default 0.16)
 *  - color     (string) – stroke colour (default "255,255,255" rgb triplet)
 *  - className (string) – positioning classes for the absolute wrapper (e.g. "top-6")
 */
export default function WatermarkStrip({
    text,
    from = 0,
    to = -500,
    opacity = 0.16,
    color = "255,255,255",
    className = "",
}) {
    return (
        <div
            className={`absolute left-0 w-full overflow-hidden pointer-events-none select-none ${className}`}
            aria-hidden
        >
            <ScrollX from={from} to={to} mobile="scrub" className="whitespace-nowrap">
                <span
                    className="font-gulfs uppercase text-[34px] md:text-[88px] leading-none text-transparent tracking-[0.18em]"
                    style={{ WebkitTextStroke: `1.5px rgba(${color},${opacity})` }}
                >
                    {Array(9).fill(text).join(" ★ ")}
                </span>
            </ScrollX>
        </div>
    );
}
