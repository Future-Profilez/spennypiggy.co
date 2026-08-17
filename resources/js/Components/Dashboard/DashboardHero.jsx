import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { ACCENT, TYPE } from '@/Components/UI/tokens';

/**
 * The headline statement at the top of each creator finance dashboard.
 *
 * ONE number, stated as plainly as the house type can state it: an ink block,
 * an accent offset, and the figure at display size with everything else quiet
 * around it. The supporting figures sit in a joined strip under a rule, so they
 * read as parts of the headline rather than as three more cards.
 *
 * ⚠️ It used to be a gradient band with a 60px diffuse glow and glass tiles —
 * a second elevation language on a site whose entire frame is a hard offset,
 * and the only surface on the creator screens drawn that way. The props are
 * unchanged, so `bills/Billing_dashboard`, `membership/Membership_dashboard`
 * and `bills/MySubscriptions` needed no edit.
 *
 * Props:
 *   accent    'pink' (default) | 'ink' | 'mint' | 'violet'  — 'ink' keeps the
 *             legacy caller working and reads as the neutral, money-first state
 *   Icon      react-icon component — headline chip and faint watermark
 *   sticker   short string, top-right
 *   label     what the figure IS
 *   amount    the figure (counts up)
 *   prefix / suffix
 *   trend     { value, positive } | null
 *   stats     [{ label, value, Icon }] — up to 3
 */
export default function DashboardHero({
    accent = 'pink',
    Icon,
    sticker,
    label,
    amount = 0,
    prefix = '',
    suffix = '',
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

    /*
     * `ink` is the legacy value for "no colour on this one" — it borrows mint,
     * the accent this app already uses for money that has gone right.
     *
     * ⚠️ The accent used to be spent on an offset shadow. With shadows gone
     * sitewide it goes on the FRAME: the hero is the one block on the page that
     * carries a coloured border rather than a black one, which is what makes it
     * read as the headline without a second elevation language.
     */
    const a = ACCENT[accent] ?? ACCENT.pink;
    const accentHex = accent === 'ink' ? ACCENT.mint.hex : a.hex;

    const rounded = Math.round(display);
    const shown = Number.isFinite(rounded) ? rounded.toLocaleString() : '0';

    return (
        <section
            className="relative overflow-hidden rounded-box border-[3px] bg-[#0B0B0C] mb-8"
            style={{ borderColor: accentHex }}
        >
            {/* The watermark is the only decoration, and it is the section's own
                icon rather than an abstract shape. */}
            {Icon && (
                <Icon
                    className="pointer-events-none absolute -right-8 -bottom-10 text-white opacity-[0.06]"
                    size="13rem"
                    aria-hidden="true"
                />
            )}

            <div className="relative p-5 md:p-8">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        {Icon && (
                            <span
                                className="w-10 h-10 md:w-11 md:h-11 shrink-0 grid place-items-center rounded-box-sm border-2 border-black"
                                style={{ backgroundColor: accentHex }}
                            >
                                <Icon className="text-black" size="1.2rem" />
                            </span>
                        )}
                        <p
                            className={`${TYPE.eyebrow} truncate`}
                            style={{ color: accentHex }}
                        >
                            {label}
                        </p>
                    </div>

                    {sticker && (
                        <span className="shrink-0 inline-flex items-center gap-1.5 rounded-box-xs border-2 border-white/15 px-2.5 py-1 font-gulfs uppercase tracking-[0.1em] text-[11px] leading-none text-white/80">
                            <span
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: accentHex }}
                                aria-hidden="true"
                            />
                            {sticker}
                        </span>
                    )}
                </div>

                <div className="mt-5 flex items-end gap-4 flex-wrap">
                    <h2
                        className={`${TYPE.figure} text-white text-[44px] md:text-[68px] xl:text-[80px]`}
                    >
                        {prefix}
                        {shown}
                        {suffix}
                    </h2>

                    {trend && (
                        /*
                         * ⚠️ Down is not red. Earning less than last month is not
                         * an error, and red here is the same mistake the
                         * leaderboard's movement chip exists to avoid — it is
                         * kept for a payment that genuinely failed.
                         */
                        <span
                            className="mb-2 inline-flex items-center gap-1 rounded-box-xs border-2 border-black px-2.5 py-1 font-gulfs uppercase tracking-[0.08em] text-[12px] leading-none text-black"
                            style={{
                                backgroundColor: trend.positive
                                    ? ACCENT.mint.hex
                                    : '#FFFFFF',
                            }}
                        >
                            {trend.positive ? '↑' : '↓'}{' '}
                            {Math.abs(trend.value)}%
                        </span>
                    )}
                </div>
            </div>

            {stats.length > 0 && (
                /* The supporting figures abut, sharing hairlines — the same
                   device as `StatStrip`, in the dark. */
                <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-white/12 border-t-[3px] border-black">
                    {stats.slice(0, 3).map((s, i) => {
                        const SI = s.Icon;
                        const only = stats.length % 2 === 1 && i === stats.length - 1;
                        return (
                            <div
                                key={s.label ?? i}
                                className={`bg-[#0B0B0C] px-4 md:px-5 py-4 ${
                                    only ? 'col-span-2 md:col-span-1' : ''
                                }`}
                            >
                                <div className="flex items-center gap-2 mb-1.5">
                                    {SI && (
                                        <SI
                                            className="text-white/50"
                                            size="0.85rem"
                                            aria-hidden="true"
                                        />
                                    )}
                                    <p
                                        className={`${TYPE.eyebrow} text-white/55`}
                                    >
                                        {s.label}
                                    </p>
                                </div>
                                <p
                                    className={`${TYPE.figure} text-white text-[22px] md:text-[26px]`}
                                >
                                    {s.value}
                                </p>
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
