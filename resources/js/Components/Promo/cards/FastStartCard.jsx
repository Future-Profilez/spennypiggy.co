import { CARD_FRAME, Chip, Cta, Fact, display, groundOf, accentOf } from "../promoKit";

/**
 * Fast Start — WHAT "5% ON TOP" IS ON TOP OF.
 *
 * 🚨 THE HEADLINE ALONE ANSWERS NOTHING, so the card works one sum. "5% on top" leaves a
 * creator to ask "on top of what, and worth how much?" — the row this replaced read
 * "YOUR PAYOUT / Sales + Fast Start bonus / +5%", which is a label with no quantity in
 * it. The receipt shows earn → bonus → paid, which is the same shape the Founder card
 * uses; two bonus cards making the same kind of promise should prove it the same way.
 *
 * ⚠️ Every figure comes from `promo.facts`, derived in
 * `PromoBannerService::fastStartFacts()` from the rate `ProcessFastStartBonusPayouts`
 * actually pays. The base is illustrative and the block is LABELLED "Example" — Fast
 * Start has no minimum and no target, and a figure here must never read as a threshold.
 *
 * ⚠️ Under TIERED pricing there is no single rate (3/5/7% by bracket), so `facts.rate`
 * and the whole example are absent and the card falls back to describing the mechanic in
 * words. Never pick one bracket's number to fill the gap.
 *
 * ⚠️ The tilt is STATIC. Rotation on hover or press is banned; a composition drawn on an
 * angle is not the same thing.
 */
export default function FastStartCard({ promo, onAction }) {
    const g = groundOf(promo.ground);
    const accent = accentOf(promo.accent);
    const f = promo.facts ?? {};

    const Line = ({ label, value, strong }) => (
        <div className="flex items-baseline justify-between gap-3">
            <span
                className={`whitespace-nowrap font-CeraGR text-[9px] uppercase tracking-[0.1em] md:text-[10px] ${strong ? "font-bold" : ""}`}
                style={{ color: strong ? "#000" : "rgba(0,0,0,0.7)" }}
            >
                {label}
            </span>
            <span
                className={`whitespace-nowrap ${strong ? "font-gulfs text-[17px] md:text-[20px]" : "font-CeraGR text-[12px] font-bold md:text-[13px]"}`}
                style={{ color: "#000" }}
            >
                {value}
            </span>
        </div>
    );

    return (
        <article className={CARD_FRAME} style={{ backgroundColor: g.bg }}>
            <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{ backgroundImage: `repeating-linear-gradient(-52deg, ${g.wash} 0 14px, transparent 14px 34px)` }}
            />

            {/* The sum, on paper. ⚠️ `sm:` and up at a fixed width — a pixel-width block
                inside a column narrower than it expects is what broke the install card at
                320px. On a phone the rate ships as a single figure beside the button. */}
            {f.example_total && (
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute right-4 top-1/2 hidden w-[196px] -translate-y-1/2 rounded-box-sm px-3 py-3 sm:block md:right-7 md:w-[232px] md:px-4"
                    style={{ border: "2px solid #000", backgroundColor: "#FFFFFF" }}
                >
                    <p className="mb-2 font-CeraGR text-[8px] uppercase tracking-[0.18em] text-black/55 md:text-[9px]">
                        Example
                    </p>
                    <Line label="You earn" value={f.example_earned} />
                    <div className="mt-2">
                        <Line label={`Fast Start ${f.rate}`} value={`+ ${f.example_bonus}`} />
                    </div>
                    <div className="my-2" style={{ borderTop: "2px solid #000" }} />
                    <Line label="You are paid" value={f.example_total} strong />
                </div>
            )}

            <div className="relative flex h-full w-full flex-col px-5 py-5 sm:w-[54%] sm:px-6 sm:py-6 md:px-8 md:py-7">
                <Chip g={g} accent={accent}>{promo.eyebrow}</Chip>

                <div className="mt-3">
                    <span
                        className="inline-block -rotate-2 rounded-box-sm border-black px-3 py-1.5 md:px-4 md:py-2"
                        style={{ backgroundColor: accent }}
                    >
                        <span className={display("text-[24px] sm:text-[28px] md:text-[36px]")} style={{ color: "#000" }}>
                            {f.rate ? `${f.rate} on top` : "Start fast"}
                        </span>
                    </span>
                </div>

                <p className="mt-3 max-w-[34ch] text-[13px] md:text-[15px] leading-[1.4] font-semibold" style={{ color: g.body }}>
                    {f.rate
                        ? `We add ${f.rate} of everything you earn in your first ${f.window ?? "30 days"}. It lands with your payout — nothing to apply for.`
                        : `We top up everything you earn in your first ${f.window ?? "30 days"}. It lands with your payout — nothing to apply for.`}
                </p>

                <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pt-3">
                    <Cta promo={promo} g={g} onAction={onAction} />
                    {/* ⚠️ ONE figure on a phone, where the receipt does not fit. A clipped
                        number is worse than an absent one — the same call the Founder card
                        makes at this width. */}
                    {f.example_total && (
                        <Fact
                            g={g}
                            label={`Earn ${f.example_earned}`}
                            value={`Get ${f.example_total}`}
                            className="shrink-0 sm:hidden"
                        />
                    )}
                </div>
            </div>
        </article>
    );
}
