import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

/**
 * The headline statement at the top of each creator finance dashboard.
 *
 * Modern, soft take on the brand: a vibrant gradient band with diffuse elevation
 * (no hard offset shadow, no heavy black borders), a count-up on the headline number,
 * and glass supporting tiles that sit on the gradient. One clear focal point; the
 * rest of the page stays quiet white cards with soft shadows.
 *
 * Props:
 *   accent    "pink" | "ink"            band gradient
 *   Icon      react-icon component      headline chip + faint watermark
 *   sticker   short string             soft status pill, top-right
 *   label     string
 *   amount    number                    headline value (counts up)
 *   prefix    string                    e.g. "£"
 *   suffix    string
 *   trend     { value, positive } | null
 *   stats     [{ label, value, Icon }]  up to 3 supporting tiles
 */
export default function DashboardHero({
    accent = "pink",
    Icon,
    sticker,
    label,
    amount = 0,
    prefix = "",
    suffix = "",
    trend = null,
    stats = [],
}) {
    const reduce = useReducedMotion();
    const [display, setDisplay] = useState(reduce ? amount : 0);
    const frame = useRef();

    useEffect(() => {
        if (reduce) {
            setDisplay(amount);
            return;
        }
        const target = Number(amount) || 0;
        const start = performance.now();
        const duration = 900;

        const tick = (now) => {
            const t = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - t, 5); // ease-out-quint
            setDisplay(target * eased);
            if (t < 1) frame.current = requestAnimationFrame(tick);
        };
        frame.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame.current);
    }, [amount, reduce]);

    const isInk = accent === "ink";
    const band = isInk
        ? "bg-gradient-to-br from-[#23232e] via-[#17171d] to-[#0c0c10]"
        : "bg-gradient-to-br from-[#ff2e93] via-[#FF007F] to-[#d1006a]";
    const glow = isInk
        ? "shadow-[0_24px_60px_-24px_rgba(0,0,0,0.55)]"
        : "shadow-[0_24px_60px_-22px_rgba(255,0,127,0.55)]";

    const rounded = Math.round(display);
    const shown = Number.isFinite(rounded) ? rounded.toLocaleString() : "0";

    return (
        <div
            className={`relative ${band} ${glow} rounded-box p-6 md:p-8 mb-8 overflow-hidden ring-1 ring-white/10`}
        >
            {/* soft top-light sheen */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/15 to-transparent" />

            {/* faint brand watermark */}
            {Icon && (
                <Icon
                    className="pointer-events-none absolute -right-6 -bottom-10 opacity-[0.08] text-white"
                    size="13rem"
                    aria-hidden="true"
                />
            )}

            {/* soft status pill */}
            {sticker && (
                <span className="absolute top-5 right-5 md:top-6 md:right-6 inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm text-white/90 text-[11px] font-semibold tracking-wide px-3.5 py-1.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-white/90" />
                    {sticker}
                </span>
            )}

            <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
                {/* headline */}
                <div className="min-w-0">
                    <div className="flex items-center gap-3 mb-4">
                        {Icon && (
                            <div className="w-11 h-11 shrink-0 bg-white/15 backdrop-blur-sm flex items-center justify-center rounded-box-sm ring-1 ring-white/20">
                                <Icon className="text-white" size="1.3rem" />
                            </div>
                        )}
                        <p className="text-xs md:text-sm font-semibold uppercase tracking-[0.18em] text-white/75">
                            {label}
                        </p>
                    </div>

                    <div className="flex items-end gap-4 flex-wrap">
                        <h2 className="font-GillSans leading-[0.9] text-white text-5xl md:text-6xl xl:text-7xl tabular-nums">
                            {prefix}
                            {shown}
                            {suffix}
                        </h2>

                        {trend && (
                            <span
                                className={`mb-2 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${
                                    trend.positive
                                        ? "bg-[#A2E4B8]/90 text-[#0b3d24]"
                                        : "bg-white/90 text-red-600"
                                }`}
                            >
                                {trend.positive ? "↑" : "↓"} {Math.abs(trend.value)}%
                            </span>
                        )}
                    </div>
                </div>

                {/* supporting glass tiles */}
                {stats.length > 0 && (
                    <div className="flex flex-wrap gap-3 shrink-0">
                        {stats.slice(0, 3).map((s, i) => {
                            const SI = s.Icon;
                            return (
                                <div
                                    key={i}
                                    className="bg-white/10 backdrop-blur-sm ring-1 ring-white/15 rounded-box-sm px-4 py-3 min-w-[112px]"
                                >
                                    <div className="flex items-center gap-2 mb-1.5">
                                        {SI && (
                                            <SI className="text-white/80" size="0.9rem" />
                                        )}
                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-white/70">
                                            {s.label}
                                        </p>
                                    </div>
                                    <p className="text-2xl font-bold text-white tabular-nums leading-none">
                                        {s.value}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
