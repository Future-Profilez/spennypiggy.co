import { CARD_FRAME, Cta, display, groundOf, accentOf } from "../promoKit";

/**
 * Refer & earn — THE LINK, AND WHAT IT PAYS.
 *
 * 🚨 THE REWARD AND THE THRESHOLD ARE SHOWN TOGETHER, ALWAYS. `ReferAndEarnController`
 * only counts a referral once the referred creator passes £1,000 in lifetime sales, so
 * a card promising £50 with no condition sets a creator up to share their link, watch
 * somebody sign up, and wonder where the money is.
 *
 * ⚠️ The link row is a DRAWING of the control on `/refer-and-earn`, not a working one —
 * it carries no real code (there is no user in scope here) and its copy button is inert
 * and `aria-hidden`. It exists so the reader recognises the thing they are being sent to.
 *
 * ⚠️ NO EYEBROW. "Referrals" above "£50 per creator" is a category label restating the
 * card it sits on.
 */
export default function ReferralCard({ promo, onAction }) {
    const g = groundOf(promo.ground);
    const accent = accentOf(promo.accent);
    const f = promo.facts ?? {};

    return (
        <article className={CARD_FRAME} style={{ backgroundColor: g.bg }}>
            <span
                aria-hidden="true"
                className="absolute inset-y-0 right-0 w-[28%] sm:w-[37%]"
                style={{ backgroundColor: accent, borderLeft: "2px solid #000" }}
            />

            {/* The link, as it looks on the page this card links to. */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute right-4 top-1/2 hidden w-[176px] -translate-y-1/2 sm:block md:right-6 md:w-[212px]"
            >
                <div
                    className="flex items-center gap-2 rounded-box-sm px-2.5 py-2"
                    style={{ border: "2px solid #000", backgroundColor: "#FFFFFF" }}
                >
                    <span className="min-w-0 flex-1 truncate font-CeraGR text-[10px] text-black md:text-[11px]">
                        spennypiggy.co/r/yourname
                    </span>
                    <span
                        className="shrink-0 rounded-box-xs px-2 py-1 font-CeraGR text-[8px] font-bold uppercase tracking-[0.12em] md:text-[9px]"
                        style={{ border: "2px solid #000", backgroundColor: accent, color: "#000" }}
                    >
                        Copy
                    </span>
                </div>

                <div className="mt-2 flex flex-col items-center gap-1">
                    <svg width="14" height="22" viewBox="0 0 14 22" fill="none" aria-hidden="true">
                        <path d="M7 1v16M2 13l5 5 5-5" stroke="#000" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span
                        className="rounded-box-xs px-3 py-1 font-gulfs text-[19px] md:text-[22px]"
                        style={{ border: "2px solid #000", backgroundColor: "#FFFFFF", color: "#000" }}
                    >
                        {f.reward ?? "£50"}
                    </span>
                </div>
            </div>

            <span
                aria-hidden="true"
                className="absolute right-0 top-1/2 flex w-[28%] -translate-y-1/2 justify-center sm:hidden"
            >
                <span
                    className="rounded-box-xs px-2.5 py-1 font-gulfs text-[18px]"
                    style={{ border: "2px solid #000", backgroundColor: "#FFFFFF", color: "#000" }}
                >
                    {f.reward ?? "£50"}
                </span>
            </span>

            <div className="relative flex h-full w-[72%] flex-col px-5 py-5 sm:w-[61%] sm:px-6 sm:py-6 md:px-8 md:py-7">
                <div className="flex items-baseline gap-2">
                    <p
                        className="font-gulfs uppercase tracking-[-0.02em] leading-[1] text-[44px] sm:text-[50px] md:text-[62px]"
                        style={{ color: g.ink }}
                    >
                        {f.reward ?? "£50"}
                    </p>
                    <span className="font-CeraGR text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: g.body }}>
                        per creator
                    </span>
                </div>

                <h3 className={`${display("mt-2 text-[22px] sm:text-[26px] md:text-[32px]")} max-w-[14ch]`} style={{ color: g.ink }}>
                    Bring a creator with you
                </h3>

                <p className="mt-2 max-w-[34ch] text-[13px] md:text-[15px] leading-[1.4] font-semibold" style={{ color: g.body }}>
                    Share your link. Once a creator who joins through it passes{" "}
                    {f.threshold ?? "£1,000"} in sales, the {f.reward ?? "£50"} is yours.
                </p>

                <div className="mt-auto pt-3">
                    <Cta promo={promo} g={g} onAction={onAction} />
                </div>
            </div>
        </article>
    );
}
