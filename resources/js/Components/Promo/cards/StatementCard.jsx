import PromoArt from "../PromoArt";
import { CARD_FRAME, PAD, Chip, Cta, display, groundOf, accentOf } from "../promoKit";

/**
 * The fallback — AND THE ONLY GENERIC CARD IN THE DECK.
 *
 * 🚨 EVERY TIMED ANNOUNCEMENT RENDERS THROUGH THIS, and it is the ONLY card that
 * reads `headline` / `body` out of `config/promos.php`. Every other card writes its
 * own copy, because its composition is built around specific words — a receipt says
 * "£0.00", not a sentence. That is also why editing a bespoke promo's config copy
 * changes nothing on screen.
 */
export default function StatementCard({ promo, onAction }) {
    const g = groundOf(promo.ground);
    const accent = accentOf(promo.accent);

    return (
        <article className={CARD_FRAME} style={{ backgroundColor: g.bg }}>
            <PromoArt
                name={promo.art}
                className="pointer-events-none absolute -bottom-12 -right-12 w-[250px] sm:w-[290px] md:w-[330px]"
                style={{ color: g.wash }}
            />

            <div className={`relative flex h-full flex-col ${PAD}`}>
                <Chip g={g} accent={accent}>{promo.eyebrow}</Chip>

                <div className="mt-auto">
                    <h3 className={`${display("text-[28px] sm:text-[34px] md:text-[44px]")} max-w-[14ch] line-clamp-2`} style={{ color: g.ink }}>
                        {promo.headline}
                    </h3>
                    <span aria-hidden="true" className="mt-3 block h-[7px] w-14 rounded-box-xs md:w-20" style={{ backgroundColor: accent }} />
                    <p className="mt-3 max-w-[34ch] text-[13px] md:text-[15px] leading-[1.4] font-semibold line-clamp-2" style={{ color: g.body }}>
                        {promo.body}
                    </p>
                </div>

                <div className="mt-4">
                    <Cta promo={promo} g={g} onAction={onAction} />
                </div>
            </div>
        </article>
    );
}
