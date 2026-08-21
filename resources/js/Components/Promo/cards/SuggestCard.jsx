import { CARD_FRAME, Chip, Cta, display, groundOf, accentOf } from "../promoKit";

/**
 * Suggest a feature — A FORM, NOT A PAGE WITH A LINE ON IT.
 *
 * ⚠️ The previous version drew the field as a bare underline that stopped two-thirds
 * across, then left ~130px of empty ruled paper between it and the button. It read as an
 * abandoned sentence rather than an invitation, and nothing tied the line to the control
 * that opens the real form. The field and the button are now ONE unit, adjacent, sized
 * like the input the modal is about to give you.
 *
 * ⚠️ The field is DECORATIVE (`aria-hidden`) — the button is the only control, and it
 * opens the existing suggestion modal. It is drawn as an input because that is what the
 * next screen looks like; a promise the following screen keeps.
 *
 * ⚠️ It stays empty ON PURPOSE. A filled-in example would answer the card's own question,
 * and would read as a feature being promised.
 *
 * 🚨 THE COPY SAYS IDEAS ARE READ, NOT THAT THEY GET BUILT. This is the easiest card in
 * the deck on which to commit the product to something by accident.
 */
export default function SuggestCard({ promo, onAction }) {
    const g = groundOf(promo.ground);
    const accent = accentOf(promo.accent);

    const steps = ["You send it", "Every one gets read", "It joins the build list"];

    return (
        <article className={CARD_FRAME} style={{ backgroundColor: g.bg }}>
            {/* Ruled paper. ⚠️ Stops above the field so the lines never run through the
                input or the button — the collision is what made the old version look
                noisy rather than papery. */}
            <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-[66%] md:h-[76%]"
                style={{
                    backgroundImage: `repeating-linear-gradient(180deg, transparent 0 27px, ${g.wash} 27px 29px)`,
                }}
            />

            <div className="relative flex h-full flex-col px-5 py-5 sm:px-6 sm:py-6 md:px-8 md:py-7">
                <Chip g={g} accent={accent}>{promo.eyebrow}</Chip>

                <div className="mt-3 flex gap-5 md:gap-8">
                    <div className="min-w-0 flex-1">
                        <h3 className={`${display("text-[25px] sm:text-[29px] md:text-[36px]")} max-w-[12ch]`} style={{ color: g.ink }}>
                            Tell us what to build
                        </h3>
                        <p className="mt-2 max-w-[34ch] text-[13px] md:text-[15px] leading-[1.4] font-semibold" style={{ color: g.body }}>
                            Missing something, or fighting the same screen every day? It
                            takes a minute, and you do not need an account.
                        </p>
                    </div>

                    {/* ⚠️ Top-aligned to the HEADLINE's block, not centred on the card —
                        a floating list beside a large display line reads as unrelated. */}
                    <ol className="hidden w-[36%] shrink-0 space-y-2 pt-1 sm:block" aria-hidden="true">
                        <li className="font-CeraGR text-[8px] uppercase tracking-[0.16em] md:text-[9px]" style={{ color: g.body }}>
                            What happens next
                        </li>
                        {steps.map((step, i) => (
                            <li key={step} className="flex items-center gap-2">
                                <span
                                    className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full font-CeraGR text-[9px] font-bold md:h-5 md:w-5 md:text-[10px]"
                                    style={{ border: "2px solid #000", backgroundColor: accent, color: "#000" }}
                                >
                                    {i + 1}
                                </span>
                                <span className="min-w-0 font-CeraGR text-[10px] leading-tight md:text-[11px]" style={{ color: g.body }}>
                                    {step}
                                </span>
                            </li>
                        ))}
                    </ol>
                </div>

                {/* The form. Field and button are one row on anything wider than a phone,
                    stacked below it — never separated by empty ground. */}
                <div className="mt-auto flex flex-col gap-2 pt-4 sm:flex-row sm:items-stretch sm:gap-2.5">
                    <span
                        aria-hidden="true"
                        className="flex min-w-0 flex-1 items-center gap-2 rounded-box-sm px-3 py-2.5"
                        style={{ border: "2px solid #000", backgroundColor: "#FFFFFF" }}
                    >
                        <span className="block h-4 w-[3px] shrink-0 md:h-5" style={{ backgroundColor: accent }} />
                        <span className="truncate font-CeraGR text-[13px] md:text-[14px]" style={{ color: "rgba(0,0,0,0.45)" }}>
                            I wish Spenny Piggy could…
                        </span>
                    </span>

                    <Cta promo={promo} g={g} onAction={onAction} />
                </div>
            </div>
        </article>
    );
}
