import { CARD_FRAME, Chip, Cta, display, groundOf, accentOf } from "../promoKit";

/**
 * Free until first sale — AN ACTUAL RECEIPT.
 *
 * 🚨 THE PRICE COMES FROM `promo.facts.price`, which the service reads from
 * `SubscriptionPlan` — the class that decides what a creator is charged. An earlier
 * pass typed "£6.99" straight into this file while the real default is £8.99, so the
 * one card whose entire subject is billing was quoting a price nobody pays.
 *
 * 🚨 £0.00 IS THE ABSENCE OF A CHARGE, SO IT IS NOT THE BIGGEST THING ON THE CARD.
 * It was set at 40/50/64px as the card's display element — bigger than the headline on
 * every other card in the deck — and a nothing rendered as the loudest figure on screen
 * reads as a price. It is now the TOTAL LINE of the receipt it belongs to (24px inline,
 * 26/30px in the slip, beside its own "Due today" label), and the display slot went
 * to the sentence that actually makes the offer: "Free until your first sale".
 *
 * ⚠️ `display()`'s `leading-[0.85]` is right for a wrapped headline and wrong for a
 * single figure — gulfs' ascenders overflow a line box shorter than the glyphs. The
 * total sets its own `leading-[1]`.
 *
 * ⚠️ THE RECEIPT IS A PANEL FROM `sm:` UP, AND INLINE BELOW IT. At 320px there is no
 * room for a column beside the copy, so the rows sit in the flow between the headline
 * and the button; from `sm:` they move into a white slip on the right, which is what
 * fills a card that was otherwise all left margin. The torn foot and the stamp belong
 * to the SLIP at that width — a torn edge on the card itself reads as decoration, on a
 * paper slip it reads as a receipt.
 */
export default function ReceiptCard({ promo, onAction }) {
    const g = groundOf(promo.ground);
    const accent = accentOf(promo.accent);
    const price = promo.facts?.price ?? null;

    const Row = ({ label, value, strike }) => (
        <div className="flex items-baseline justify-between gap-2">
            <span
                className={`font-CeraGR text-[9px] md:text-[10px] uppercase tracking-[0.12em] ${strike ? "line-through" : ""}`}
                style={{ color: g.body }}
            >
                {label}
            </span>
            <span
                className={`font-CeraGR text-[11px] md:text-[12px] whitespace-nowrap ${strike ? "line-through" : ""}`}
                style={{ color: g.body }}
            >
                {value}
            </span>
        </div>
    );

    const Total = ({ size }) => (
        <div className="flex items-baseline justify-between gap-2">
            <span
                className="font-CeraGR text-[9px] md:text-[10px] uppercase tracking-[0.14em] whitespace-nowrap"
                style={{ color: g.body }}
            >
                Due today
            </span>
            <span
                className={`font-gulfs uppercase tracking-[-0.02em] leading-[1] ${size}`}
                style={{ color: g.ink }}
            >
                £0.00
            </span>
        </div>
    );

    const rows = (
        <>
            <Row label="Subscription" value={price ? `${price}/mo` : "Monthly"} strike />
            <Row label="Your first sale" value="Not yet" />
        </>
    );

    return (
        <article className={CARD_FRAME} style={{ backgroundColor: g.bg }}>
            <div className="flex h-full gap-4 px-5 pt-5 pb-6 sm:px-6 sm:pt-6 sm:pb-7 md:px-8 md:pt-7 md:pb-8">
                {/* The argument. */}
                <div className="flex min-w-0 flex-1 flex-col">
                    <Chip g={g} accent={accent}>{promo.eyebrow}</Chip>

                    <h3
                        className={`shrink-0 mt-3 ${display("text-[26px] sm:text-[28px] md:text-[34px]")}`}
                        style={{ color: g.ink }}
                    >
                        Free until
                        <br />
                        your first sale
                    </h3>

                    {/*
                      * Below sm the receipt has nowhere to go but the flow, and it is
                      * cut to ONE struck line — at 320px the second row cost more height
                      * than it earned, and the whole card is the two figures: the price
                      * it is not charging, and the nothing it is.
                      */}
                    <div className="shrink-0 mt-2.5 space-y-1 sm:hidden" aria-hidden="true">
                        <Row label="Subscription" value={price ? `${price}/mo` : "Monthly"} strike />
                        <div className="!mt-1.5" style={{ borderTop: "2px dashed #000" }} />
                        <Total size="text-[24px]" />
                    </div>

                    <p
                        className="shrink-0 mt-2.5 max-w-[34ch] text-[12px] md:text-[14px] leading-[1.45] font-semibold"
                        style={{ color: g.body }}
                    >
                        {price
                            ? `Nothing to pay until you sell. After that it is ${price} a month.`
                            : "Nothing to pay until you sell."}
                    </p>

                    <div className="mt-auto pt-2.5">
                        <Cta promo={promo} g={g} onAction={onAction} />
                    </div>
                </div>

                {/* The receipt itself — a paper slip, torn at the foot. */}
                <div
                    aria-hidden="true"
                    className="relative hidden shrink-0 self-center sm:block sm:w-[184px] md:w-[214px] lg:w-[240px]"
                >
                    <div className="rounded-box-sm border-black bg-white px-3.5 pt-3.5 pb-5 md:px-4 md:pt-4 md:pb-6">
                        <div className="space-y-1.5">{rows}</div>

                        <div className="mt-2.5 mb-2" style={{ borderTop: "2px dashed #000" }} />

                        <Total size="text-[26px] md:text-[30px]" />

                        {/* The torn foot belongs to the paper, not to the card. */}
                        <span
                            className="pointer-events-none absolute inset-x-0 bottom-0 h-2.5"
                            style={{
                                backgroundImage:
                                    "linear-gradient(45deg, #000 25%, transparent 25%), linear-gradient(-45deg, #000 25%, transparent 25%)",
                                backgroundSize: "12px 12px",
                                backgroundPosition: "0 5px",
                            }}
                        />
                    </div>

                    <span
                        className="absolute -top-3 -right-2 rotate-6 rounded-box-xs border-black px-2 py-1 font-gulfs uppercase text-[11px] md:text-[12px]"
                        style={{ color: "#000", backgroundColor: accent }}
                    >
                        Nothing due
                    </span>
                </div>
            </div>
        </article>
    );
}
