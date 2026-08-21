import { CARD_FRAME, Chip, Cta, Fact, display, groundOf, accentOf } from "../promoKit";

/**
 * Founder bonus — THE SUM, WORKED OUT.
 *
 * 🚨 THE PROGRESS BAR IS GONE AND MUST NOT COME BACK AS A MOCK. It was hardcoded at 38%
 * on a card about the reader's OWN account, which is a false statement about their
 * progress dressed as a chart. If this card ever shows a bar again it has to be fed the
 * creator's real qualifying total from `FounderBonus::calculateCompletedNetEarnings()` —
 * the same number the founder page and the dashboard tracker display.
 *
 * The statement block replaces it: every line is derived by the service from
 * `config/founder_bonus.php`, so the card shows the actual deal rather than a target
 * with no prize attached.
 */
export default function FounderCard({ promo, onAction }) {
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
            {/* The deal, on paper. */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute right-4 top-1/2 hidden w-[196px] -translate-y-1/2 rounded-box-sm px-3 py-3 sm:block md:right-7 md:w-[232px] md:px-4"
                style={{ border: "2px solid #000", backgroundColor: "#FFFFFF" }}
            >
                <Line label={`First ${f.window ?? "30 days"}`} value={f.amount ?? "£2,500"} />
                <div className="mt-2">
                    <Line label={`Bonus ${f.bonus_rate ?? "10%"}`} value={`+ ${f.bonus_min ?? "£250"}`} />
                </div>
                <div className="my-2" style={{ borderTop: "2px solid #000" }} />
                <Line label="You end up with" value={f.bonus_total ?? "£2,750"} strong />
            </div>

            <div className="relative flex h-full w-full flex-col px-5 py-5 sm:w-[54%] sm:px-6 sm:py-6 md:px-8 md:py-7">
                <div className="flex items-center gap-2">
                    <Chip g={g} accent={accent}>{promo.eyebrow}</Chip>
                    <span
                        className="rounded-box-xs px-2 py-1 font-CeraGR text-[9px] uppercase tracking-[0.14em] md:text-[10px]"
                        style={{ border: "2px solid #000", color: g.ink }}
                    >
                        {f.seats ?? "150"} seats
                    </span>
                </div>

                <h3 className={`${display("mt-3 text-[26px] sm:text-[30px] md:text-[38px]")} max-w-[13ch]`} style={{ color: g.ink }}>
                    Earn {f.amount ?? "£2,500"}, keep the bonus
                </h3>

                <p className="mt-2.5 max-w-[32ch] text-[13px] md:text-[15px] leading-[1.4] font-semibold" style={{ color: g.body }}>
                    Hit it in your first {f.window ?? "30 days"} and we pay{" "}
                    {f.bonus_rate ?? "10%"} of those earnings on top — {f.bonus_min ?? "£250"} at
                    the threshold.
                </p>

                {/* ⚠️ The statement block is desktop-only, which left the phone card with
                    a dead band between the copy and the button. These two figures are the
                    block's headline numbers and they fit beside the CTA at 320px, so the
                    card makes the same argument at every width — with less of it. */}
                <div className="mt-auto flex items-center justify-between gap-3 pt-3">
                    <Cta promo={promo} g={g} onAction={onAction} />
                    {/* ⚠️ ONE figure, not two. Both fitted at 390 and the second was cut
                        off the edge at 320 — and a clipped number is worse than an absent
                        one. The bonus RATE is the half that answers "what do I get". */}
                    <Fact
                        g={g}
                        label="Bonus"
                        value={f.bonus_rate ?? "10%"}
                        className="shrink-0 sm:hidden"
                    />
                </div>
            </div>
        </article>
    );
}
