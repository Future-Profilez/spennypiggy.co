import { CARD_FRAME, Chip, Cta, groundOf, accentOf } from "../promoKit";

/**
 * Free until first sale — AN ACTUAL RECEIPT.
 *
 * 🚨 THE PRICE COMES FROM `promo.facts.price`, which the service reads from
 * `SubscriptionPlan` — the class that decides what a creator is charged. An earlier
 * pass typed "£6.99" straight into this file while the real default is £8.99, so the
 * one card whose entire subject is billing was quoting a price nobody pays.
 *
 * ⚠️ `display()`'s `leading-[0.85]` is wrong for a single huge figure — gulfs'
 * ascenders overflow a line box shorter than the glyphs and the total climbed into the
 * dashed rule above it. This figure sets its own `leading-[1]`.
 */
export default function ReceiptCard({ promo, onAction }) {
    const g = groundOf(promo.ground);
    const accent = accentOf(promo.accent);
    const price = promo.facts?.price ?? null;

    const Row = ({ label, value, strike }) => (
        <div className="flex items-baseline justify-between gap-3">
            <span className={`font-CeraGR text-[11px] md:text-[12px] uppercase tracking-[0.14em] ${strike ? "line-through" : ""}`} style={{ color: g.body }}>
                {label}
            </span>
            <span className={`font-CeraGR text-[12px] md:text-[13px] ${strike ? "line-through" : ""}`} style={{ color: g.body }}>
                {value}
            </span>
        </div>
    );

    return (
        <article className={CARD_FRAME} style={{ backgroundColor: g.bg }}>
            <div className="flex h-full flex-col px-5 pt-5 pb-7 sm:px-6 sm:pt-6 sm:pb-8 md:px-8 md:pt-7 md:pb-9">
                <div className="flex items-start justify-between gap-3">
                    <Chip g={g} accent={accent}>{promo.eyebrow}</Chip>
                    <span
                        aria-hidden="true"
                        className="hidden sm:inline-block -rotate-6 rounded-box-xs px-2.5 py-1 font-gulfs uppercase text-[12px] md:text-[14px]"
                        style={{ border: "2px solid #000", color: "#000", backgroundColor: accent }}
                    >
                        Nothing due
                    </span>
                </div>

                <div className="mt-3 space-y-1" aria-hidden="true">
                    <Row label="Creator subscription" value={price ? `${price}/mo` : "Monthly"} strike />
                    <Row label="Due today" value="£0.00" />
                </div>

                <div aria-hidden="true" className="mt-2 mb-1" style={{ borderTop: "2px dashed #000" }} />

                <p
                    className="font-gulfs uppercase tracking-[-0.02em] leading-[1] text-[40px] sm:text-[50px] md:text-[64px]"
                    style={{ color: g.ink }}
                >
                    £0.00
                </p>

                <p className="mt-2 max-w-[38ch] text-[13px] md:text-[15px] leading-[1.4] font-semibold" style={{ color: g.body }}>
                    You are not charged until your first completed sale.
                    {price ? ` After that it is ${price} a month.` : ""}
                </p>

                <div className="mt-auto pt-3">
                    <Cta promo={promo} g={g} onAction={onAction} />
                </div>
            </div>

            {/* The torn foot. */}
            <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-3"
                style={{
                    backgroundImage:
                        "linear-gradient(45deg, #000 25%, transparent 25%), linear-gradient(-45deg, #000 25%, transparent 25%)",
                    backgroundSize: "14px 14px",
                    backgroundPosition: "0 6px",
                    opacity: 0.9,
                }}
            />
        </article>
    );
}
