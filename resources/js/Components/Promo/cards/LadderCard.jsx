import { CARD_FRAME, Chip, Cta, Fact, display, groundOf, accentOf } from "../promoKit";

/**
 * Creator Growth Bonus — THE SHAPE OF THE OFFER IS A STAIRCASE, so the card draws one.
 *
 * 🚨 "UP TO £1,000" IS THE HALF THAT GETS A CREATOR ANNOYED. It is the last rung of
 * eleven and needs £25,000 of sales behind it; quoted alone it reads as a sign-up
 * reward. So the headline is the FIRST step — the one thing the viewer can act on this
 * week — and the ceiling is the small print beside it. Same correction the referral card
 * was given: quoting the reward without the threshold is the promise that sours.
 *
 * ⚠️ Every figure comes from `promo.facts`, derived in
 * `PromoBannerService::growthBonusFacts()` from `config/growth_bonus.php` — the same
 * ladder `GrowthBonusService` pays against. No figure is typed here.
 *
 * ⚠️ The rungs are the creator's LISTED SALE VALUE, VAT included — a £100 listing counts
 * as £100 whatever the creator's VAT status (client decision, 26 Aug 2026; terms clause
 * 2.1). 🚨 So the card may say "earn", but must never say the creator KEEPS the figure:
 * where VAT applies part of it is passed to HMRC.
 *
 * ⚠️ The staircase is `sm:` and up at a fixed width, like Fast Start's receipt — a
 * pixel-width block in a column narrower than it expects is what clipped the install
 * card at 320px. On a phone the first step ships as a single `Fact` beside the button.
 *
 * ⚠️ The steps are drawn with inline borders, not `border-black` + a width class: the
 * project's `.border-black` is a full shorthand that discards any width set beside it,
 * and `border-[#000]` does not compile here at all (see promoKit).
 */
export default function LadderCard({ promo, onAction }) {
    const g = groundOf(promo.ground);
    const accent = accentOf(promo.accent);
    const f = promo.facts ?? {};

    // Four illustrative rungs. Heights ascend so the block reads as a climb even
    // before any of the labels are read.
    const STEPS = [0.42, 0.6, 0.78, 1];

    return (
        <article className={CARD_FRAME} style={{ backgroundColor: g.bg }}>
            <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                    backgroundImage: `repeating-linear-gradient(90deg, ${g.wash} 0 2px, transparent 2px 26px)`,
                }}
            />

            {/* The climb. Bars ascend left to right; the last one carries the ceiling. */}
            {f.total && (
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute bottom-6 right-4 hidden w-[188px] sm:block md:right-7 md:w-[220px]"
                >
                    <div className="flex items-end justify-between gap-1.5">
                        {STEPS.map((h, i) => {
                            const last = i === STEPS.length - 1;

                            return (
                                <div
                                    key={i}
                                    className="flex-1 rounded-box-xs"
                                    style={{
                                        height: `${Math.round(h * 92)}px`,
                                        border: "2px solid #000",
                                        backgroundColor: last ? accent : "rgba(255,255,255,0.9)",
                                    }}
                                />
                            );
                        })}
                    </div>

                    <div
                        className="mt-2 flex items-baseline justify-between gap-2 pt-2"
                        style={{ borderTop: "2px solid #000" }}
                    >
                        <span className="font-CeraGR text-[9px] font-bold uppercase tracking-[0.12em] text-black/70">
                            {f.steps} steps
                        </span>
                        <span className="font-gulfs text-[17px] uppercase text-black md:text-[19px]">
                            {f.total}
                        </span>
                    </div>
                </div>
            )}

            <div className="relative flex h-full w-full flex-col px-5 py-5 sm:w-[56%] sm:px-6 sm:py-6 md:px-8 md:py-7">
                <Chip g={g} accent={accent}>{promo.eyebrow}</Chip>

                <div className="mt-3">
                    <span
                        className="inline-block -rotate-2 rounded-box-sm border-black px-3 py-1.5 md:px-4 md:py-2"
                        style={{ backgroundColor: accent }}
                    >
                        <span className={display("text-[24px] sm:text-[28px] md:text-[34px]")} style={{ color: "#000" }}>
                            {f.spend ? `${f.spend} → ${f.reward}` : "Climb the ladder"}
                        </span>
                    </span>
                </div>

                <p className="mt-3 max-w-[34ch] text-[13px] font-semibold leading-[1.4] md:text-[15px]" style={{ color: g.body }}>
                    {f.spend
                        ? `Earn ${f.spend} in your first ${f.window} and we add ${f.reward}. Every milestone after that pays again — up to ${f.total}.`
                        : `Hit earnings milestones and we add a bonus at every step.`}
                </p>

                <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pt-3">
                    <Cta promo={promo} g={g} onAction={onAction} />
                    {/* ⚠️ ONE figure on a phone, where the staircase does not fit —
                        the same call Fast Start and Founder both make at this width. */}
                    {f.seats && (
                        <Fact
                            g={g}
                            label="Places"
                            value={`First ${f.seats}`}
                            className="shrink-0 sm:hidden"
                        />
                    )}
                </div>
            </div>
        </article>
    );
}
