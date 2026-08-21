import { CARD_FRAME, PAD, Chip, Cta, Fact, display, groundOf, accentOf } from "../promoKit";

/**
 * Fast Start — THE RATE, THE WINDOW, AND WHEN IT LANDS.
 *
 * ⚠️ The rate is `promo.facts.rate` and is ABSENT when tiered mode is on: there is no
 * single rate to quote then (3% / 5% / 7% by bracket) and picking one would be wrong
 * for most creators. The card drops the figure rather than guessing — the same fault
 * that had the receipt card quoting a subscription price nobody pays.
 *
 * ⚠️ The tilt is STATIC. Rotation on hover or press is banned; a composition drawn on
 * an angle is not the same thing.
 */
export default function FastStartCard({ promo, onAction }) {
    const g = groundOf(promo.ground);
    const accent = accentOf(promo.accent);
    const f = promo.facts ?? {};

    return (
        <article className={CARD_FRAME} style={{ backgroundColor: g.bg }}>
            <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{ backgroundImage: `repeating-linear-gradient(-52deg, ${g.wash} 0 14px, transparent 14px 34px)` }}
            />

            <div className={`relative flex h-full flex-col ${PAD}`}>
                <Chip g={g} accent={accent}>{promo.eyebrow}</Chip>

                <div className="mt-3">
                    <span className="inline-block -rotate-2 rounded-box-sm border-black px-3 py-1.5 md:px-4 md:py-2" style={{ backgroundColor: accent }}>
                        <span className={display("text-[26px] sm:text-[32px] md:text-[42px]")} style={{ color: "#000" }}>
                            {f.rate ? `${f.rate} on top` : "Start fast"}
                        </span>
                    </span>
                </div>

                <p className="mt-3 max-w-[42ch] text-[13px] md:text-[15px] leading-[1.4] font-semibold" style={{ color: g.body }}>
                    {f.rate
                        ? `We add ${f.rate} of everything you earn in your first ${f.window ?? "30 days"} — nothing to apply for, it lands with your payout.`
                        : `We top up everything you earn in your first ${f.window ?? "30 days"} — nothing to apply for, it lands with your payout.`}
                </p>

                {/* A payout line, not a statement: it names the rate and WHERE the money
                    shows up, and carries no amount — the top-up is per creator and any
                    figure here would be invented. */}
                <div
                    aria-hidden="true"
                    className="mt-3 flex items-center justify-between gap-3 rounded-box-sm px-3 py-2"
                    style={{ border: "2px solid #000", backgroundColor: "#FFFFFF" }}
                >
                    <span className="min-w-0">
                        <span className="block font-CeraGR text-[9px] uppercase tracking-[0.14em] text-black/60 md:text-[10px]">
                            Your payout
                        </span>
                        <span className="block truncate font-CeraGR text-[11px] font-bold text-black md:text-[12px]">
                            Sales + Fast Start bonus
                        </span>
                    </span>
                    {f.rate && (
                        <span
                            className="shrink-0 rounded-box-xs px-2 py-1 font-gulfs text-[13px] md:text-[15px]"
                            style={{ border: "2px solid #000", backgroundColor: accent, color: "#000" }}
                        >
                            +{f.rate}
                        </span>
                    )}
                </div>

                <div className="mt-auto flex items-center justify-between gap-3 pt-3">
                    <Cta promo={promo} g={g} onAction={onAction} />
                    <div className="hidden sm:flex items-center gap-5">
                        <Fact g={g} label="Window" value={f.window ?? "30 days"} />
                        <Fact g={g} label="Paid after" value={f.paid_after ?? "7 days"} />
                    </div>
                </div>
            </div>
        </article>
    );
}
